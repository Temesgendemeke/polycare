import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { Colors } from '../constants/design';
import { useUserStore, useMedicationStore, useReminderStore } from '../store';

import { NotificationService } from '../services';

export default function RootLayout() {
  const loadStoredAuth = useUserStore((s) => s.loadStoredAuth);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const fetchMedications = useMedicationStore((s) => s.fetchMedications);
  const fetchReminders = useReminderStore((s) => s.fetchReminders);
  const syncNotificationSchedules = useReminderStore((s) => s.syncNotificationSchedules);

  useEffect(() => {
    loadStoredAuth();
    NotificationService.init().then(() => {
      syncNotificationSchedules();
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMedications();
      fetchReminders();
    }
  }, [isAuthenticated]);

  const theme = {
    ...MD3LightTheme,
    roundness: 16,
    colors: {
      ...MD3LightTheme.colors,
      primary: Colors.primary,
      background: Colors.background,
      surface: Colors.surface,
      onSurface: Colors.text,
      onBackground: Colors.text,
    },
  };

  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="history" options={{ headerShown: false }} />
        <Stack.Screen name="drug-locator" options={{ headerShown: false }} />
        <Stack.Screen name="education" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
      </Stack>
    </PaperProvider>
  );
}
