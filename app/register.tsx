import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../store';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/design';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useUserStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Full name is required';
    if (email.trim() && !/\S+@\S+\.\S+/.test(email)) errors.email = 'Invalid email format';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'At least 6 characters';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    if (!agreeTerms) errors.terms = 'You must agree to continue';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
      return;
    }
    if (!validateStep2()) return;
    try {
      await register({ name: name.trim(), email: email.trim() || undefined, password: password.trim(), phone: phone.trim() || undefined });
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
                <Image source={require('../assets/icon.png')} style={{ width: 64, height: 64 }} resizeMode="contain" />
              </View>
              <Text style={styles.appName}>Create Account</Text>
              <Text style={styles.tagline}>Step {step} of 2 — {step === 1 ? 'Personal Info' : 'Security'}</Text>
            </View>
            <View style={styles.stepsRow}>
              <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
              <View style={styles.stepLine} />
              <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{step === 1 ? 'Personal Information' : 'Account Security'}</Text>
            <Text style={styles.formSubtitle}>
              {step === 1 ? 'Tell us about yourself' : 'Create a secure password for your account'}
            </Text>

            {step === 1 ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name *</Text>
                  <View style={[styles.inputWrapper, fieldErrors.name ? styles.inputError : undefined]}>
                    <Ionicons name="person-outline" size={18} color={fieldErrors.name ? Colors.error : Colors.textSecondary} style={styles.inputIcon} />
                    <TextInput value={name} onChangeText={(v) => { setName(v); setFieldErrors((p) => { const n = { ...p }; delete n.name; return n; }); }} placeholder="Your full name" placeholderTextColor={Colors.textLight} style={styles.input} autoCapitalize="words" />
                  </View>
                  {fieldErrors.name && <Text style={styles.fieldError}>{fieldErrors.name}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={[styles.inputWrapper, fieldErrors.email ? styles.inputError : undefined]}>
                    <Ionicons name="mail-outline" size={18} color={fieldErrors.email ? Colors.error : Colors.textSecondary} style={styles.inputIcon} />
                    <TextInput value={email} onChangeText={(v) => { setEmail(v); setFieldErrors((p) => { const n = { ...p }; delete n.email; return n; }); }} placeholder="your@email.com" placeholderTextColor={Colors.textLight} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
                  </View>
                  {fieldErrors.email && <Text style={styles.fieldError}>{fieldErrors.email}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="call-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                    <TextInput value={phone} onChangeText={setPhone} placeholder="+251..." placeholderTextColor={Colors.textLight} style={styles.input} keyboardType="phone-pad" />
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password *</Text>
                  <View style={[styles.inputWrapper, fieldErrors.password ? styles.inputError : undefined]}>
                    <Ionicons name="lock-closed-outline" size={18} color={fieldErrors.password ? Colors.error : Colors.textSecondary} style={styles.inputIcon} />
                    <TextInput value={password} onChangeText={(v) => { setPassword(v); setFieldErrors((p) => { const n = { ...p }; delete n.password; return n; }); }} placeholder="At least 6 characters" placeholderTextColor={Colors.textLight} style={styles.input} secureTextEntry={!showPassword} autoCapitalize="none" />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  {fieldErrors.password && <Text style={styles.fieldError}>{fieldErrors.password}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password *</Text>
                  <View style={[styles.inputWrapper, fieldErrors.confirmPassword ? styles.inputError : undefined]}>
                    <Ionicons name="lock-closed-outline" size={18} color={fieldErrors.confirmPassword ? Colors.error : Colors.textSecondary} style={styles.inputIcon} />
                    <TextInput value={confirmPassword} onChangeText={(v) => { setConfirmPassword(v); setFieldErrors((p) => { const n = { ...p }; delete n.confirmPassword; return n; }); }} placeholder="Re-enter password" placeholderTextColor={Colors.textLight} style={styles.input} secureTextEntry={!showPassword} autoCapitalize="none" />
                  </View>
                  {fieldErrors.confirmPassword && <Text style={styles.fieldError}>{fieldErrors.confirmPassword}</Text>}
                </View>

                <TouchableOpacity style={styles.termsRow} onPress={() => setAgreeTerms(!agreeTerms)} activeOpacity={0.7}>
                  <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                    {agreeTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={styles.termsText}>
                    I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>
                {fieldErrors.terms && <Text style={styles.fieldError}>{fieldErrors.terms}</Text>}
              </>
            )}

            {step === 1 ? (
              <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.primaryButton, isLoading && styles.buttonLoading]} onPress={handleRegister} disabled={isLoading} activeOpacity={0.85}>
                {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.primaryButtonText}>Create Account</Text>}
              </TouchableOpacity>
            )}

            {step === 2 && (
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
                <Text style={styles.backButtonText}>Back to Personal Info</Text>
              </TouchableOpacity>
            )}

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Link href="/login"><Text style={styles.loginLink}>Sign In</Text></Link>
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
    backgroundColor: Colors.secondary, paddingBottom: 32,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32, ...Shadows.md,
  },
  topDecoration: { position: 'absolute', top: 0, right: 0, width: 120, height: 120, backgroundColor: 'rgba(255,255,255,0.06)', borderBottomLeftRadius: 120 },
  logoContainer: { alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.sm },
  logoWrap: { width: 72, height: 72, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  appName: { fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md, paddingHorizontal: 60 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.35)' },
  stepDotActive: { backgroundColor: '#fff', width: 12, height: 12, borderRadius: 6 },
  stepLine: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 6 },
  formCard: {
    marginHorizontal: Spacing.lg, marginTop: -16,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, ...Shadows.lg,
  },
  formTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  formSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.lg, lineHeight: 20 },
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm },
  inputError: { borderColor: Colors.error, backgroundColor: '#FEF2F2' },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 12 },
  eyeButton: { padding: 4, marginLeft: 4 },
  fieldError: { fontSize: 12, color: Colors.error, marginTop: 4, marginLeft: 4 },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.md },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  termsText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  termsLink: { color: Colors.primary, fontWeight: '600' },
  primaryButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...Shadows.md,
  },
  buttonLoading: { opacity: 0.7 },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  backButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: Spacing.md, paddingVertical: 8 },
  backButtonText: { fontSize: 14, color: Colors.textSecondary },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  loginText: { fontSize: 14, color: Colors.textSecondary },
  loginLink: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
