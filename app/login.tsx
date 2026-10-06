import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../store';
import { useTranslation } from '../hooks';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/design';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { login, setUser, isLoading, error } = useUserStore();

  const handleDemo = async () => {
    await setUser({
      id: 'demo-user-1',
      name: 'Tesfaye Abebe',
      email: 'demo@polycare.com',
      role: 'user',
      preferredLanguage: 'en',
      conditions: ['hypertension', 'diabetes'],
      createdAt: new Date().toISOString(),
      settings: {
        notifications: true,
        voiceEnabled: true,
        largeText: false,
        highContrast: false,
        reminderSound: 'default',
        reminderAdvanceMinutes: 15,
      },
    });
    router.replace('/(tabs)');
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errors: typeof fieldErrors = {};
    if (!email.trim()) errors.email = t('auth.emailRequired');
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = t('auth.invalidEmail');
    if (!password) errors.password = t('auth.passwordRequired');
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await login(email.trim(), password.trim());
      router.replace('/(tabs)');
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.headerCurve}>
            <View style={styles.topDecoration} />
            <View style={styles.logoContainer}>
              <View style={styles.logoWrap}>
                <Image source={require('../assets/icon.png')} style={{ width: 72, height: 72 }} resizeMode="contain" />
              </View>
              <Text style={styles.appName}>PolyCare</Text>
              <Text style={styles.tagline}>{t('auth.yourHealth')}</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.welcomeBack}>{t('auth.welcomeBack')}</Text>
            <Text style={styles.formSubtitle}>{t('auth.signInSubtitle')}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('auth.email')}</Text>
              <View style={[styles.inputWrapper, fieldErrors.email ? styles.inputError : undefined]}>
                <Ionicons name="mail-outline" size={18} color={fieldErrors.email ? Colors.error : Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={(v) => { setEmail(v); setFieldErrors((p) => { const n = { ...p }; delete n.email; return n; }); }}
                  placeholder={t('auth.emailPlaceholder')}
                  placeholderTextColor={Colors.textLight}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {fieldErrors.email && <Text style={styles.fieldError}>{fieldErrors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('auth.password')}</Text>
              <View style={[styles.inputWrapper, fieldErrors.password ? styles.inputError : undefined]}>
                <Ionicons name="lock-closed-outline" size={18} color={fieldErrors.password ? Colors.error : Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={(v) => { setPassword(v); setFieldErrors((p) => { const n = { ...p }; delete n.password; return n; }); }}
                  placeholder={t('auth.passwordPlaceholder')}
                  placeholderTextColor={Colors.textLight}
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {fieldErrors.password && <Text style={styles.fieldError}>{fieldErrors.password}</Text>}
            </View>

            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonLoading]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>{t('auth.signIn')}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>{t('auth.or')}</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.demoButton} onPress={handleDemo} activeOpacity={0.8}>
              <Ionicons name="play-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.demoButtonText}>{t('auth.tryDemo')}</Text>
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>{t('auth.noAccount')}</Text>
              <Link href="/register">
                <Text style={styles.signupLink}>{t('auth.createAccount')}</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1 },
  headerCurve: {
    backgroundColor: Colors.primary, paddingBottom: 40,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    ...Shadows.md,
  },
  topDecoration: {
    position: 'absolute', top: 0, right: 0, width: 120, height: 120,
    backgroundColor: 'rgba(255,255,255,0.06)', borderBottomLeftRadius: 120,
  },
  logoContainer: { alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.sm },
  logoWrap: {
    width: 80, height: 80,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  appName: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  formCard: {
    marginHorizontal: Spacing.lg, marginTop: -20,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg,
    ...Shadows.lg,
  },
  welcomeBack: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  formSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.lg, lineHeight: 20 },
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
  },
  inputError: { borderColor: Colors.error, backgroundColor: '#FEF2F2' },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 12 },
  eyeButton: { padding: 4, marginLeft: 4 },
  fieldError: { fontSize: 12, color: Colors.error, marginTop: 4, marginLeft: 4 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.errorLight, borderRadius: BorderRadius.md,
    padding: Spacing.sm, marginBottom: Spacing.md,
  },
  errorBannerText: { flex: 1, fontSize: 13, color: Colors.error },
  primaryButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingVertical: 14, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, ...Shadows.md,
  },
  buttonLoading: { opacity: 0.7 },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
  divider: { flex: 1, height: 1, backgroundColor: Colors.divider },
  dividerText: { marginHorizontal: Spacing.md, fontSize: 13, color: Colors.textLight },
  demoButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: BorderRadius.lg, borderWidth: 1.5,
    borderColor: Colors.primary, borderStyle: 'dashed',
  },
  demoButtonText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg, marginBottom: Spacing.xs },
  signupText: { fontSize: 14, color: Colors.textSecondary },
  signupLink: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
