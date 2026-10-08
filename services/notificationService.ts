import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Reminder } from '../types';
import { formatTime } from '../lib/utils/formatDate';

// Configure global notification handler for when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NOTIFICATION_CHANNEL_ID = 'medication-reminders';

export class NotificationService {
  private static isInitialized = false;
  private static webTimers = new Map<string, any>();

  /**
   * Initialize notification channels and configure handlers
   */
  static async init(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
          name: 'Medication Reminders',
          description: 'Timely reminders to take your prescribed medications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1D4FA3',
          sound: 'default',
          enableVibrate: true,
        });
      }
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.warn('Failed to initialize NotificationChannel:', error);
      return false;
    }
  }

  /**
   * Request notification permissions from user
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      // Browser Web Environment
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            return true;
          }
          const perm = await Notification.requestPermission();
          return perm === 'granted';
        }
        return true;
      }

      // Mobile Environment (Android & iOS)
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        await this.init();
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedule recurring and immediate next-occurrence notifications for a reminder
   */
  static async scheduleReminder(
    reminder: Reminder,
    medicationName?: string
  ): Promise<string[]> {
    if (!reminder.enabled) {
      return [];
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.warn('Notification permissions not granted; reminder saved locally.');
    }

    // Cancel any previous notifications for this reminder
    if (reminder.notificationIds && reminder.notificationIds.length > 0) {
      await this.cancelReminder(reminder.notificationIds, reminder.id);
    }

    const [hourStr, minStr] = reminder.time.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);

    if (isNaN(hour) || isNaN(minute)) {
      console.warn('Invalid time format for reminder:', reminder.time);
      return [];
    }

    const medTitle = medicationName || reminder.title || 'Medication';
    const isActivity = reminder.id.startsWith('activity-');
    const contentTitle = isActivity ? `🏃 Time for ${medTitle}` : `💊 Time for ${medTitle}`;
    const contentBody = isActivity
      ? `It's ${formatTime(reminder.time)}. Time for your health exercise — ${medTitle}!`
      : `It's ${formatTime(reminder.time)}. Take your dose${reminder.dosage ? ` (${reminder.dosage})` : ''} on schedule.`;

    const content: Notifications.NotificationContentInput = {
      title: contentTitle,
      body: contentBody,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: {
        reminderId: reminder.id,
        medicationId: reminder.medicationId,
      },
    };

    if (Platform.OS === 'android') {
      (content as any).channelId = NOTIFICATION_CHANNEL_ID;
    }

    // Calculate exact delay in seconds for upcoming occurrence (especially for testing 1 minute from now)
    const now = new Date();
    const nextDate = new Date();
    nextDate.setHours(hour, minute, 0, 0);

    let delaySeconds = Math.round((nextDate.getTime() - now.getTime()) / 1000);
    if (delaySeconds <= 0) {
      // Time already passed today, so the next occurrence is tomorrow
      nextDate.setDate(nextDate.getDate() + 1);
      delaySeconds = Math.round((nextDate.getTime() - now.getTime()) / 1000);
    }

    const scheduledIds: string[] = [];

    // 1. Web Browser fallback: use client-side timer + Web Notification API
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (delaySeconds > 0 && delaySeconds <= 86400) {
        const timerId = setTimeout(() => {
          try {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(contentTitle, {
                body: contentBody,
                icon: '/favicon.ico',
              });
            } else {
              alert(`${contentTitle}\n\n${contentBody}`);
            }
          } catch {
            alert(`${contentTitle}\n\n${contentBody}`);
          }
        }, delaySeconds * 1000);

        this.webTimers.set(reminder.id, timerId);
        scheduledIds.push(`web-${reminder.id}-${Date.now()}`);
      }
    }

    // 2. Mobile (Android/iOS) scheduling via expo-notifications
    if (Platform.OS !== 'web') {
      try {
        // Schedule exact upcoming occurrence (guarantees immediate 1-minute reminders fire without being delayed by battery batching)
        if (delaySeconds > 0 && delaySeconds <= 86400) {
          const exactId = await Notifications.scheduleNotificationAsync({
            content,
            trigger: {
              seconds: Math.max(1, delaySeconds),
            },
          });
          scheduledIds.push(exactId);
        }

        // Also schedule daily or weekly recurring schedule for subsequent days
        if (!reminder.days || reminder.days.length === 0 || reminder.days.length === 7) {
          const id = await Notifications.scheduleNotificationAsync({
            content,
            trigger: {
              hour,
              minute,
              repeats: true,
            },
          });
          scheduledIds.push(id);
        } else {
          for (const day of reminder.days) {
            const weekday = day + 1;
            const id = await Notifications.scheduleNotificationAsync({
              content,
              trigger: {
                weekday,
                hour,
                minute,
                repeats: true,
              },
            });
            scheduledIds.push(id);
          }
        }
      } catch (error) {
        console.error('Error scheduling reminder notification:', error);
      }
    }

    return scheduledIds;
  }

  /**
   * Cancel notifications by array of IDs
   */
  static async cancelReminder(notificationIds?: string[], reminderId?: string): Promise<void> {
    if (reminderId && this.webTimers.has(reminderId)) {
      clearTimeout(this.webTimers.get(reminderId));
      this.webTimers.delete(reminderId);
    }

    if (!notificationIds || notificationIds.length === 0) return;

    for (const id of notificationIds) {
      if (id.startsWith('web-')) {
        continue;
      }
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch (e) {
        // Notification might already have fired or been deleted
      }
    }
  }

  /**
   * Send a test notification immediately (fires in 2 seconds)
   */
  static async sendTestNotification(
    title = '💊 Test Medication Reminder',
    body = 'PolyCare notifications are working perfectly!'
  ): Promise<string | null> {
    const hasPermission = await this.requestPermissions();

    // Web test notification
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      setTimeout(() => {
        try {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
          } else {
            alert(`${title}\n\n${body}`);
          }
        } catch {
          alert(`${title}\n\n${body}`);
        }
      }, 2000);
      return 'web-test-id';
    }

    if (!hasPermission) return null;

    try {
      const content: Notifications.NotificationContentInput = {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      };
      if (Platform.OS === 'android') {
        (content as any).channelId = NOTIFICATION_CHANNEL_ID;
      }

      return await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          seconds: 2,
        },
      });
    } catch (e) {
      console.error('Error scheduling test notification:', e);
      return null;
    }
  }

  /**
   * Cancel all scheduled notifications across the entire app
   */
  static async cancelAll(): Promise<void> {
    this.webTimers.forEach((timer) => clearTimeout(timer));
    this.webTimers.clear();

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.error('Error canceling all notifications:', e);
    }
  }
}
