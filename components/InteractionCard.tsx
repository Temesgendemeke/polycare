import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/design';
import { useTranslation } from '../hooks';

interface Interaction {
  medications: string;
  severity: 'contraindicated' | 'major' | 'moderate' | 'minor';
  description: string;
  recommendation: string;
}

const severityKeys = {
  contraindicated: 'medications.contraindicated',
  major: 'medications.major',
  moderate: 'medications.moderate',
  minor: 'medications.minor',
} as const;

const severityConfig = {
  contraindicated: { color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle' },
  major: { color: '#EA580C', bg: '#FFF7ED', icon: 'warning' },
  moderate: { color: '#CA8A04', bg: '#FEFCE8', icon: 'alert-circle' },
  minor: { color: '#16A34A', bg: '#F0FDF4', icon: 'information-circle' },
};

export default function InteractionCard({ interaction }: { interaction: Interaction }) {
  const { t } = useTranslation();
  const cfg = severityConfig[interaction.severity];

  return (
    <View style={[styles.card, { borderLeftColor: cfg.color }]}>
      <View style={[styles.severityBadge, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
        <Text style={[styles.severityText, { color: cfg.color }]}>{t(severityKeys[interaction.severity])}</Text>
      </View>
      <Text style={styles.interactionTitle}>{interaction.medications}</Text>
      <Text style={styles.description}>{interaction.description}</Text>
      <View style={[styles.recommendationBox, { backgroundColor: cfg.bg }]}>
        <Ionicons name="bulb-outline" size={14} color={cfg.color} />
        <Text style={[styles.recommendationText, { color: cfg.color }]}>{interaction.recommendation}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1,
    borderColor: Colors.border, borderLeftWidth: 4, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.sm,
  },
  severityBadge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full, marginBottom: Spacing.sm,
  },
  severityText: { ...Typography.fontSize.xs, ...Typography.fontWeight.semibold },
  interactionTitle: { ...Typography.fontSize.md, ...Typography.fontWeight.semibold, color: Colors.text, marginBottom: Spacing.xs },
  description: { ...Typography.fontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 },
  recommendationBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, padding: Spacing.sm, borderRadius: BorderRadius.md },
  recommendationText: { flex: 1, ...Typography.fontSize.xs, lineHeight: 18 },
});
