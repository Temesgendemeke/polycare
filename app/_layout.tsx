import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { Colors } from '../constants/design';
import { useUserStore, useMedicationStore, useReminderStore } from '../store';
import { useTranslation } from '../hooks';

import { NotificationService } from '../services';

function AppStatusBar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Rendered after the initial commit so it wins over expo-router's built-in
  // <StatusBar style="auto" />, which follows the system dark-mode setting and
  // otherwise turns the icons white on this app's light background.
  if (!mounted) return null;
  return <StatusBar style="dark" />;
}

export default function RootLayout() {
  const { t } = useTranslation();
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
      <AppStatusBar />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="history" options={{ headerShown: false }} />
        <Stack.Screen name="drug-locator" options={{ headerShown: false }} />
        <Stack.Screen name="education" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: t('notFound.title') }} />
      </Stack>
    </PaperProvider>
  );
}
