import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/design';
import { ConsultationService } from '../../services';
import { Pharmacist } from '../../types';

export default function ConsultationScreen() {
  const { t } = useTranslation();
  const pharmacists = ConsultationService.getAvailablePharmacists();

  const handleBook = (pharmacist: Pharmacist) => {
    if (pharmacist.available) {
      Alert.alert(
        t('consultation.confirmTitle'),
        t('consultation.confirmMsg', { name: pharmacist.name }) + '\n\n' + t('consultation.nextSlot', { slot: pharmacist.nextSlot || t('consultation.availableSoon') }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirmBooking'),
            onPress: () => {
              Alert.alert(t('consultation.bookingConfirmed'), t('consultation.bookingMsg', { name: pharmacist.name, slot: pharmacist.nextSlot || t('consultation.availableSoon') }));
            },
          },
        ]
      );
    } else {
      Alert.alert(
        t('consultation.notifyTitle'),
        t('consultation.notifyMsg', { name: pharmacist.name, slot: pharmacist.nextSlot || t('consultation.availableSoon') }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.notifyMe'),
            onPress: () => {
              Alert.alert(t('consultation.reminderSet'), t('consultation.reminderMsg', { name: pharmacist.name }));
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>{t('consultation.title')}</Text>
          <Text style={styles.subtitle}>{t('consultation.subtitle')}</Text>

          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.ctaButton, styles.chatButton]}
              onPress={() => Alert.alert(t('consultation.instantTitle'), t('consultation.instantMsg'))}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles" size={18} color={Colors.textOnPrimary} />
              <Text style={styles.ctaButtonText}>{t('consultation.startChat')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctaButton, styles.videoButton]}
              onPress={() => Alert.alert(t('consultation.videoTitle'), t('consultation.videoMsg'))}
              activeOpacity={0.8}
            >
              <Ionicons name="videocam" size={18} color={Colors.textOnPrimary} />
              <Text style={styles.ctaButtonText}>{t('consultation.scheduleVideo')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{t('consultation.clinicalPharmacists')}</Text>
            <Text style={styles.sectionSubtext}>{t('consultation.expertGuidance')}</Text>
          </View>
          <View style={styles.onlineCountBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineCountText}>{pharmacists.filter((p) => p.available).length} {t('consultation.online')}</Text>
          </View>
        </View>

        {pharmacists.map((pharmacist) => (
          <View key={pharmacist.id} style={styles.pharmacistCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.avatarWrap}>
                <Ionicons name="medkit" size={22} color={Colors.primary} />
              </View>

              <View style={styles.pharmacistInfo}>
                <View style={styles.nameStatusRow}>
                  <Text style={styles.pharmacistName}>{pharmacist.name}</Text>
                  <View style={[styles.statusDot, pharmacist.available ? styles.statusOnline : styles.statusOffline]} />
                </View>

                <Text style={styles.pharmacistDetails}>
                  {pharmacist.specialization} • {pharmacist.experience || '10+ yrs'}
                </Text>

                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={Colors.warning} />
                  <Text style={styles.ratingText}>{pharmacist.rating?.toFixed(1) || '5.0'}</Text>
                  <Text style={styles.licenseText}>({pharmacist.licenseNumber})</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardBottomRow}>
              <View style={styles.slotWrap}>
                <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.slotText}>{pharmacist.nextSlot || t('consultation.availableSoon')}</Text>
              </View>

              <TouchableOpacity
                style={[styles.bookBtn, pharmacist.available ? styles.bookBtnActive : styles.bookBtnDisabled]}
                onPress={() => handleBook(pharmacist)}
                activeOpacity={0.8}
              >
                <Text style={[styles.bookBtnText, pharmacist.available ? styles.bookBtnTextActive : styles.bookBtnTextDisabled]}>
                  {pharmacist.available ? t('consultation.bookConsult') : t('common.notifyMe')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 110,
  },
  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  title: {
    ...Typography.fontSize.xl,
    ...Typography.fontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  ctaButton: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  chatButton: {
    backgroundColor: Colors.primary,
  },
  videoButton: {
    backgroundColor: Colors.secondary,
  },
  ctaButtonText: {
    ...Typography.fontSize.sm,
    ...Typography.fontWeight.semibold,
    color: Colors.textOnPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.fontSize.lg,
    ...Typography.fontWeight.bold,
    color: Colors.text,
  },
  sectionSubtext: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  onlineCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  onlineCountText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.semibold,
    color: Colors.success,
  },
  pharmacistCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  pharmacistInfo: {
    flex: 1,
  },
  nameStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  pharmacistName: {
    ...Typography.fontSize.md,
    ...Typography.fontWeight.bold,
    color: Colors.text,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOnline: {
    backgroundColor: Colors.success,
  },
  statusOffline: {
    backgroundColor: Colors.textLight,
  },
  pharmacistDetails: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.bold,
    color: Colors.text,
  },
  licenseText: {
    ...Typography.fontSize.xs,
    color: Colors.textLight,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  slotWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  slotText: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  bookBtn: {
    borderRadius: BorderRadius.md,
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
  },
  bookBtnActive: {
    backgroundColor: Colors.primary,
  },
  bookBtnDisabled: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookBtnText: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.semibold,
  },
  bookBtnTextActive: {
    color: Colors.textOnPrimary,
  },
  bookBtnTextDisabled: {
    color: Colors.textSecondary,
  },
});
