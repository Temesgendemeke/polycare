export interface Reminder {
  id: string;
  medicationId: string;
  title?: string;
  time: string; // "HH:mm" (24h)
  days: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  enabled: boolean;
  dosage?: string;
  instructions?: string;
  lastTaken?: string;
  snoozedUntil?: string;
  notificationIds?: string[];
}
