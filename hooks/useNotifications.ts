// Custom hook for notification management
import { useEffect, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../services/notificationService';
import { Reminder } from '../types';

export const useNotifications = () => {
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permission, setPermission] = useState<boolean>(false);

  useEffect(() => {
    NotificationService.init();

    Notifications.getPermissionsAsync().then(({ status }) => {
      setPermission(status === 'granted');
    });

    const subscription = Notifications.addNotificationReceivedListener((incoming) => {
      setNotification(incoming);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      // User tapped on notification
      console.log('Notification tapped:', response.notification.request.content.data);
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const requestPermissions = useCallback(async () => {
    const granted = await NotificationService.requestPermissions();
    setPermission(granted);
    return granted;
  }, []);

  const scheduleReminderNotification = useCallback(
    async (reminder: Reminder, medicationName?: string) => {
      return await NotificationService.scheduleReminder(reminder, medicationName);
    },
    []
  );

  const cancelReminderNotification = useCallback(async (notificationIds?: string[]) => {
    await NotificationService.cancelReminder(notificationIds);
  }, []);

  const sendTestNotification = useCallback(
    async (title?: string, body?: string) => {
      return await NotificationService.sendTestNotification(title, body);
    },
    []
  );

  const cancelAllNotifications = useCallback(async () => {
    await NotificationService.cancelAll();
  }, []);

  return {
    notification,
    permission,
    requestPermissions,
    scheduleReminderNotification,
    cancelReminderNotification,
    sendTestNotification,
    cancelAllNotifications,
  };
};
