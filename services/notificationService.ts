import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Reminder } from '../types';

// Configure global notification handler
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
   * Schedule recurring notifications for a given reminder
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
      return [];
    }

    // Cancel any previous notifications for this reminder
    if (reminder.notificationIds && reminder.notificationIds.length > 0) {
      await this.cancelReminder(reminder.notificationIds);
    }

    const [hourStr, minStr] = reminder.time.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);

    if (isNaN(hour) || isNaN(minute)) {
      console.warn('Invalid time format for reminder:', reminder.time);
      return [];
    }

    const medTitle = medicationName || reminder.title || 'Medication';
    const content: Notifications.NotificationContentInput = {
      title: `💊 Time for ${medTitle}`,
      body: `It's ${reminder.time}. Take your dose${reminder.dosage ? ` (${reminder.dosage})` : ''} on schedule.`,
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

    const scheduledIds: string[] = [];

    try {
      // If no specific days or all 7 days selected, schedule daily
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
        // Specific days: 0 = Sun, 1 = Mon ... 6 = Sat
        // expo-notifications uses 1 for Sunday, ..., 7 for Saturday
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

    return scheduledIds;
  }

  /**
   * Cancel notifications by array of IDs
   */
  static async cancelReminder(notificationIds?: string[]): Promise<void> {
    if (!notificationIds || notificationIds.length === 0) return;
    for (const id of notificationIds) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch (e) {
        // notification might already have fired or been deleted
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
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.error('Error canceling all notifications:', e);
    }
  }
}
