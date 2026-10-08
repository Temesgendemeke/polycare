// Date formatting utilities

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (time: string): string => {
  if (!time) return '';
  const trimmed = time.trim();
  if (/\b(AM|PM)\b/i.test(trimmed)) return trimmed;

  const [hoursPart, minutesPart] = trimmed.split(':');
  const hour = parseInt(hoursPart, 10);
  if (isNaN(hour)) return trimmed;

  const minutes = (minutesPart ?? '0').padStart(2, '0').slice(0, 2);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

// Accepts "8:00 AM", "6:00 PM", "08:00", "18:00". Returns "HH:MM" (24h) or null.
export const parseTimeTo24 = (input?: string): string | null => {
  if (!input) return null;
  const match = input.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : undefined;

  if (isNaN(hours) || isNaN(minutes) || minutes > 59) return null;

  if (period) {
    if (hours < 1 || hours > 12) return null;
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  } else if (hours > 23) {
    return null;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getDaysUntil = (date: string): number => {
  const target = new Date(date);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isToday = (date: string): boolean => {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

export const getDayName = (dayIndex: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
};
