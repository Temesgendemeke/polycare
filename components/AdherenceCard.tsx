import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/design';
import { useTranslation } from '../hooks';

interface Props {
  adherenceRate: number;
  streak: number;
  longestStreak: number;
  missedDoses: number;
  totalDoses: number;
}

export default function AdherenceCard({ adherenceRate, streak, longestStreak, missedDoses, totalDoses }: Props) {
  const { t } = useTranslation();
  const color = adherenceRate >= 80 ? Colors.success : adherenceRate >= 50 ? Colors.accent : Colors.error;
  const strokeDasharray = `${(adherenceRate / 100) * 220} ${220 - (adherenceRate / 100) * 220}`;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('adherence.title')}</Text>
      <View style={styles.ringContainer}>
        <View style={[styles.ring, { borderColor: color }]}>
          <Text style={[styles.percentage, { color }]}>{Math.round(adherenceRate)}%</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: Colors.success }]}>{streak}</Text>
          <Text style={styles.statLabel}>{t('adherence.streak')}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: Colors.primary }]}>{longestStreak}</Text>
          <Text style={styles.statLabel}>{t('adherence.best')}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: Colors.error }]}>{missedDoses}</Text>
          <Text style={styles.statLabel}>{t('adherence.missed')}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: Colors.text }]}>{totalDoses}</Text>
          <Text style={styles.statLabel}>{t('adherence.total')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, borderWidth: 1,
    borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.md,
  },
  title: { ...Typography.fontSize.lg, ...Typography.fontWeight.bold, color: Colors.text, marginBottom: Spacing.md },
  ringContainer: { alignItems: 'center', marginBottom: Spacing.lg },
  ring: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 6, alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: { ...Typography.fontSize.xxl, ...Typography.fontWeight.bold },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { ...Typography.fontSize.lg, ...Typography.fontWeight.bold },
  statLabel: { ...Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  divider: { width: 1, backgroundColor: Colors.divider },
});
