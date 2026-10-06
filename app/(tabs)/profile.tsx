import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../store';
import { useTranslation } from '../../hooks';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/design';
import { languageNames } from '../../i18n/config';
import { Language } from '../../types';
import { authApi } from '../../lib/api';

const availableLanguages: Language[] = ['en', 'am', 'or', 'ti', 'gz'];

export default function ProfileScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { user, clearUser, setLanguage, syncProfile } = useUserStore();

  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearUser();
          await authApi.logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={34} color={Colors.primary} />
          </View>
          <View style={styles.userTextWrap}>
            <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'Create an account to save profile details.'}</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="pencil" size={15} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* NCD Patient Health Summary & History Form (from index.html) */}
        <View style={styles.healthSummaryCard}>
          <View style={styles.healthSummaryHeader}>
            <View>
              <Text style={styles.healthSummaryTitle}>NCD Patient Profile</Text>
              <Text style={styles.healthSummarySubtitle}>Chronic Care & Vital Records</Text>
            </View>
            <View style={styles.healthScorePill}>
              <Text style={styles.healthScorePillLabel}>Health Score</Text>
              <Text style={styles.healthScorePillValue}>82 / 100</Text>
            </View>
          </View>

          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Conditions</Text>
              <Text style={styles.summaryStatValue}>HTN & T2D</Text>
            </View>
            <View style={styles.summaryStatDivider} />
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Age</Text>
              <Text style={styles.summaryStatValue}>54 yrs</Text>
            </View>
            <View style={styles.summaryStatDivider} />
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Active Meds</Text>
              <Text style={styles.summaryStatValue}>5 Prescribed</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.openHistoryBtn}
            onPress={() => router.push('/history')}
            activeOpacity={0.8}
          >
            <Ionicons name="clipboard-outline" size={18} color={Colors.textOnPrimary} />
            <Text style={styles.openHistoryBtnText}>Open Patient History Form (13 Sections)</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textOnPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          <Text style={styles.sectionSubtitle}>Choose your preferred app language.</Text>

          <View style={styles.languageOptions}>
            {availableLanguages.map((lang) => {
              const isSelected = language === lang;
              return (
                <TouchableOpacity
                  key={lang}
                  style={[styles.languageChip, isSelected && styles.selectedLanguageChip]}
                  onPress={() => setLanguage(lang)}
                >
                  <Text style={[styles.languageChipText, isSelected && styles.selectedLanguageChipText]}>
                    {languageNames[lang]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {user ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Name</Text>
              <Text style={styles.accountValue}>{user.name}</Text>
            </View>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Email</Text>
              <Text style={styles.accountValue}>{user.email || 'Not set'}</Text>
            </View>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Phone</Text>
              <Text style={styles.accountValue}>{user.phone || 'Not set'}</Text>
            </View>
            <View style={styles.accountRowLast}>
              <Text style={styles.accountLabel}>Member Since</Text>
              <Text style={styles.accountValue}>{new Date(user.createdAt).toLocaleDateString()}</Text>
            </View>

            {user.role === 'admin' && (
              <TouchableOpacity style={styles.adminButton} onPress={() => router.push('/admin')}>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
                <Text style={styles.adminButtonText}>Admin Panel</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
              <Text style={styles.logoutText}>{t('settings.logout')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Sign In Required</Text>
            <Text style={styles.sectionSubtitle}>Create an account or sign in to sync your health data across devices.</Text>

            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={() => router.push('/login')}
            >
              <Ionicons name="log-in" size={18} color={Colors.textOnPrimary} />
              <Text style={styles.createAccountText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.createAccountButton, { backgroundColor: Colors.secondary, marginTop: Spacing.sm }]}
              onPress={() => router.push('/register')}
            >
              <Ionicons name="person-add" size={18} color={Colors.textOnPrimary} />
              <Text style={styles.createAccountText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('settings.accessibility')}</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>{t('settings.voiceEnabled')}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>{t('settings.largeText')}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItemLast}>
            <Text style={styles.settingText}>{t('settings.highContrast')}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>{t('settings.privacy')}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>{t('settings.terms')}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItemLast}>
            <Text style={styles.settingText}>{t('settings.about')}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>
        </View>
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
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.infoLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  userTextWrap: {
    flex: 1,
  },
  userName: {
    ...Typography.fontSize.lg,
    ...Typography.fontWeight.bold,
    color: Colors.text,
    marginBottom: 2,
  },
  userEmail: {
    ...Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.fontSize.md,
    ...Typography.fontWeight.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    ...Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedLanguageChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  languageChipText: {
    ...Typography.fontSize.sm,
    ...Typography.fontWeight.medium,
    color: Colors.text,
  },
  selectedLanguageChipText: {
    color: Colors.textOnPrimary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    ...Typography.fontSize.md,
    color: Colors.text,
  },
  createAccountButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  createAccountDisabled: {
    opacity: 0.55,
  },
  createAccountText: {
    ...Typography.fontSize.md,
    ...Typography.fontWeight.semibold,
    color: Colors.textOnPrimary,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  accountRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  accountLabel: {
    ...Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  accountValue: {
    ...Typography.fontSize.sm,
    ...Typography.fontWeight.medium,
    color: Colors.text,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  settingItemLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  settingText: {
    ...Typography.fontSize.md,
    color: Colors.text,
  },
  adminButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.infoLight, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, marginTop: Spacing.md,
  },
  adminButtonText: { flex: 1, ...Typography.fontSize.md, ...Typography.fontWeight.semibold, color: Colors.primary },
  logoutButton: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    gap: 8,
  },
  logoutText: {
    ...Typography.fontSize.md,
    ...Typography.fontWeight.semibold,
    color: Colors.error,
  },
  healthSummaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  healthSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  healthSummaryTitle: {
    ...Typography.fontSize.md,
    ...Typography.fontWeight.bold,
    color: Colors.text,
  },
  healthSummarySubtitle: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  healthScorePill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  healthScorePillLabel: {
    ...Typography.fontSize.xs,
    color: Colors.primary,
  },
  healthScorePillValue: {
    ...Typography.fontSize.sm,
    ...Typography.fontWeight.bold,
    color: Colors.primary,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatLabel: {
    ...Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  summaryStatValue: {
    ...Typography.fontSize.sm,
    ...Typography.fontWeight.bold,
    color: Colors.text,
  },
  summaryStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  openHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  openHistoryBtnText: {
    ...Typography.fontSize.sm,
    ...Typography.fontWeight.semibold,
    color: Colors.textOnPrimary,
  },
});
