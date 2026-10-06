import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/design';
import { useUserStore } from '../store';
import { useTranslation } from '../hooks';

const STORAGE_KEY = '@polycare_patient_history_v1';

const CHRONIC_DISEASES = [
  'Hypertension',
  'Type 2 Diabetes',
  'Asthma',
  'Chronic Kidney Disease',
  'Heart Failure',
  'Stroke',
  'Epilepsy',
  'Other',
];

const FAMILY_DISEASES = ['Diabetes', 'Hypertension', 'Heart Disease', 'Stroke'];

interface Admission {
  id: string;
  date: string;
  hospital: string;
  reason: string;
}

interface MedicationRow {
  id: string;
  name: string;
  strength: string;
  dose: string;
  frequency: string;
  startDate: string;
}

interface LabRow {
  id: string;
  test: string;
  result: string;
  date: string;
}

interface AppointmentRow {
  id: string;
  date: string;
  provider: string;
  status: 'Completed' | 'Scheduled' | 'Cancelled';
}

export default function PatientHistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);

  // Section 1: Personal
  const [patientId, setPatientId] = useState('PC-000123');
  const [fullName, setFullName] = useState(user?.name || 'Tesfaye Abebe');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('Male');
  const [dob, setDob] = useState('1970-05-14');
  const [age, setAge] = useState('54');
  const [phone, setPhone] = useState(user?.phone || '+251 912 345 678');
  const [email, setEmail] = useState(user?.email || 'tesfaye@polycare.et');
  const [preferredLang, setPreferredLang] = useState('Amharic');
  const [address, setAddress] = useState('Addis Ababa, Ethiopia');
  const [emergencyContact, setEmergencyContact] = useState('Almaz Abebe');
  const [emergencyPhone, setEmergencyPhone] = useState('+251 911 222 333');

  // Section 2: Medical History
  const [chronic, setChronic] = useState<string[]>(['Hypertension', 'Type 2 Diabetes']);
  const [chronicOther, setChronicOther] = useState('');
  const [dxHypertension, setDxHypertension] = useState('2018-03');
  const [dxDiabetes, setDxDiabetes] = useState('2020-07');
  const [admissions, setAdmissions] = useState<Admission[]>([
    {
      id: '1',
      date: '2023-11-12',
      hospital: 'Tikur Anbessa Hospital',
      reason: 'Hypertensive crisis check',
    },
  ]);

  // Section 3: Medication History
  const [medRows, setMedRows] = useState<MedicationRow[]>([
    {
      id: '1',
      name: 'Metformin',
      strength: '500 mg',
      dose: '1 tablet',
      frequency: 'Twice daily',
      startDate: '2020-08-01',
    },
    {
      id: '2',
      name: 'Lisinopril',
      strength: '10 mg',
      dose: '1 tablet',
      frequency: 'Once daily',
      startDate: '2018-04-10',
    },
  ]);
  const [allergies, setAllergies] = useState<string[]>(['None']);
  const [allergyReaction, setAllergyReaction] = useState('');
  const [sideEffects, setSideEffects] = useState<string[]>(['Dry cough']);
  const [sideEffectOther, setSideEffectOther] = useState('');

  // Section 4: Adherence
  const [forgetMeds, setForgetMeds] = useState<'Yes' | 'No'>('Yes');
  const [dosesMissed, setDosesMissed] = useState('1');
  const [missReasons, setMissReasons] = useState<string[]>(['Forgot']);

  // Section 5: Lifestyle
  const [smoking, setSmoking] = useState<'Never' | 'Former smoker' | 'Current smoker'>('Never');
  const [alcohol, setAlcohol] = useState<'Never' | 'Occasionally' | 'Daily'>('Occasionally');
  const [exerciseTypes, setExerciseTypes] = useState<string[]>(['Walking']);
  const [exerciseFreq, setExerciseFreq] = useState('3 times a week');
  const [dietTypes, setDietTypes] = useState<string[]>(['Low salt', 'Low sugar']);

  // Section 6: Family History
  const [familyHistory, setFamilyHistory] = useState<Record<string, { father: boolean; mother: boolean; sibling: boolean }>>({
    Diabetes: { father: true, mother: false, sibling: true },
    Hypertension: { father: true, mother: true, sibling: false },
    'Heart Disease': { father: false, mother: false, sibling: false },
    Stroke: { father: false, mother: false, sibling: false },
  });

  // Section 7: Clinical Measurements
  const [bp, setBp] = useState('124/82');
  const [heartRate, setHeartRate] = useState('78');
  const [weight, setWeight] = useState('78.5');
  const [height, setHeight] = useState('174');
  const [bmi, setBmi] = useState('25.9');
  const [fbs, setFbs] = useState('98');
  const [hba1c, setHba1c] = useState('6.8');

  // Section 8: Laboratory Results
  const [labRows, setLabRows] = useState<LabRow[]>([
    { id: '1', test: 'Fasting Blood Sugar', result: '98 mg/dL', date: '2024-02-10' },
    { id: '2', test: 'HbA1c', result: '6.8 %', date: '2024-02-10' },
    { id: '3', test: 'Serum Creatinine', result: '0.9 mg/dL', date: '2024-02-10' },
    { id: '4', test: 'Total Cholesterol', result: '175 mg/dL', date: '2024-02-10' },
  ]);

  // Section 9: Appointments
  const [appointments, setAppointments] = useState<AppointmentRow[]>([
    { id: '1', date: '2024-03-01', provider: 'Bezawit Girma (Clinical Pharmacist)', status: 'Scheduled' },
    { id: '2', date: '2024-01-15', provider: 'Dr. Almaz Haile', status: 'Completed' },
  ]);

  // Section 10: Drug Interactions
  const [interactionDetected, setInteractionDetected] = useState<'Yes' | 'No'>('No');
  const [interactionName, setInteractionName] = useState('None');
  const [recommendation, setRecommendation] = useState('Continue current regimen with monitoring');

  // Section 11: Pharmacist Notes
  const [pharmacistNotes, setPharmacistNotes] = useState(
    '• Patient adherent to morning dosage, occasional omission of evening dose.\n• Advised phone alarm reminder and low-sodium diet compliance.'
  );

  // Section 12: Reminder Settings
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTimes, setReminderTimes] = useState<string[]>(['08:00 AM', '08:00 PM']);
  const [voiceReminderEnabled, setVoiceReminderEnabled] = useState(true);

  // Section 13: Consent
  const [consent, setConsent] = useState(true);
  const [signature, setSignature] = useState(user?.name || 'Tesfaye Abebe');
  const [consentDate, setConsentDate] = useState(new Date().toISOString().split('T')[0]);

  // Auto calculate age & BMI
  const updateBmi = (w: string, h: string) => {
    const wNum = parseFloat(w);
    const hNum = parseFloat(h);
    if (wNum > 0 && hNum > 0) {
      const calc = (wNum / Math.pow(hNum / 100, 2)).toFixed(1);
      setBmi(calc);
    }
  };

  useEffect(() => {
    loadStoredHistory();
  }, []);

  const loadStoredHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.bp) setBp(parsed.bp);
        if (parsed.weight) setWeight(parsed.weight);
        if (parsed.height) setHeight(parsed.height);
        if (parsed.bmi) setBmi(parsed.bmi);
        if (parsed.chronic) setChronic(parsed.chronic);
        if (parsed.admissions) setAdmissions(parsed.admissions);
        if (parsed.medRows) setMedRows(parsed.medRows);
      }
    } catch (e) {
      console.warn('Error loading patient history:', e);
    }
  };

  const handleSave = async () => {
    if (!consent) {
      Alert.alert(t('history.consentRequired'), t('history.consentMsg'));
      return;
    }

    const payload = {
      patientId,
      fullName,
      gender,
      dob,
      age,
      phone,
      email,
      preferredLang,
      address,
      emergencyContact,
      emergencyPhone,
      chronic,
      chronicOther,
      dxHypertension,
      dxDiabetes,
      admissions,
      medRows,
      allergies,
      allergyReaction,
      sideEffects,
      sideEffectOther,
      forgetMeds,
      dosesMissed,
      missReasons,
      smoking,
      alcohol,
      exerciseTypes,
      exerciseFreq,
      dietTypes,
      familyHistory,
      bp,
      heartRate,
      weight,
      height,
      bmi,
      fbs,
      hba1c,
      labRows,
      appointments,
      interactionDetected,
      interactionName,
      recommendation,
      pharmacistNotes,
      reminderEnabled,
      reminderTimes,
      voiceReminderEnabled,
      consent,
      signature,
      consentDate,
      savedAt: new Date().toISOString(),
    };

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      Alert.alert(t('common.success'), t('history.savedMsg'), [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert(t('common.error'), t('history.saveFailed'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
          <Text style={styles.backBtnText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('history.title')}</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave}>
          <Text style={styles.saveHeaderBtnText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>{t('history.subtitle')}</Text>
            <Text style={styles.bannerSub}>
              {t('history.desc')}
            </Text>
          </View>
        </View>

        {/* 1. Personal Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.numBadge}><Text style={styles.numBadgeText}>1</Text></View>
            <Text style={styles.cardTitle}>{t('history.personalInfo')}</Text>
          </View>

          <Text style={styles.inputLabel}>{t('history.patientId')}</Text>
          <TextInput style={styles.input} value={patientId} onChangeText={setPatientId} placeholder="PC-000123" />

          <Text style={styles.inputLabel}>{t('history.fullName')}</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="e.g. Abebe Kebede" />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>{t('history.gender')}</Text>
              <View style={styles.pillRow}>
                {(['Male', 'Female'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.pill, gender === g && styles.pillActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.pillText, gender === g && styles.pillTextActive]}>{g === 'Male' ? t('history.male') : t('history.female')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>{t('history.age')}</Text>
              <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder="54" />
            </View>
          </View>

          <Text style={styles.inputLabel}>{t('history.phone')}</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <Text style={styles.inputLabel}>{t('history.email')}</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />

          <Text style={styles.inputLabel}>{t('history.address')}</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>{t('history.emergencyContact')}</Text>
              <TextInput style={styles.input} value={emergencyContact} onChangeText={setEmergencyContact} />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>{t('history.emergencyPhone')}</Text>
              <TextInput style={styles.input} value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" />
            </View>
          </View>
        </View>

        {/* 2. Medical History */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.numBadge}><Text style={styles.numBadgeText}>2</Text></View>
            <Text style={styles.cardTitle}>{t('history.medicalHistory')}</Text>
          </View>

          <Text style={styles.inputLabel}>{t('history.chronicConditions')}</Text>
          <View style={styles.chipsWrap}>
            {CHRONIC_DISEASES.map((dis) => {
              const active = chronic.includes(dis);
              return (
                <TouchableOpacity
                  key={dis}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    if (active) setChronic(chronic.filter((c) => c !== dis));
                    else setChronic([...chronic, dis]);
                  }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{dis}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {chronic.includes('Other') && (
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={chronicOther}
              onChangeText={setChronicOther}
              placeholder="Specify other chronic illness"
            />
          )}

          <View style={[styles.row, { marginTop: 12 }]}>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>Hypertension Dx (YYYY-MM)</Text>
              <TextInput style={styles.input} value={dxHypertension} onChangeText={setDxHypertension} placeholder="2018-03" />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>Diabetes Dx (YYYY-MM)</Text>
              <TextInput style={styles.input} value={dxDiabetes} onChangeText={setDxDiabetes} placeholder="2020-07" />
            </View>
          </View>

          {/* Hospital Admissions Table */}
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>{t('history.prevAdmissions')}</Text>
          {admissions.map((adm, i) => (
            <View key={adm.id} style={styles.tableRowCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tableRowTitle}>{adm.hospital || 'Hospital Visit'}</Text>
                <Text style={styles.tableRowSub}>{adm.date} • {adm.reason}</Text>
              </View>
              <TouchableOpacity onPress={() => setAdmissions(admissions.filter((_, idx) => idx !== i))}>
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addRowBtn}
            onPress={() =>
              setAdmissions([
                ...admissions,
                { id: Date.now().toString(), date: '2024-01-01', hospital: 'General Hospital', reason: 'Routine checkup' },
              ])
            }
          >
            <Ionicons name="add" size={16} color={Colors.primary} />
            <Text style={styles.addRowBtnText}>{t('history.addAdmission')}</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Medication History */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.numBadge}><Text style={styles.numBadgeText}>3</Text></View>
            <Text style={styles.cardTitle}>{t('history.medHistory')}</Text>
          </View>

          <Text style={styles.inputLabel}>{t('history.currentRx')}</Text>
          {medRows.map((med, i) => (
            <View key={med.id} style={styles.tableRowCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tableRowTitle}>{med.name} ({med.strength})</Text>
                <Text style={styles.tableRowSub}>{med.dose} • {med.frequency} • Since {med.startDate}</Text>
              </View>
              <TouchableOpacity onPress={() => setMedRows(medRows.filter((_, idx) => idx !== i))}>
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addRowBtn}
            onPress={() =>
              setMedRows([
                ...medRows,
                { id: Date.now().toString(), name: 'Amlodipine', strength: '5 mg', dose: '1 tab', frequency: 'Once daily', startDate: '2023-05-01' },
              ])
            }
          >
            <Ionicons name="add" size={16} color={Colors.primary} />
            <Text style={styles.addRowBtnText}>{t('history.addMedication')}</Text>
          </TouchableOpacity>

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>{t('history.medAllergies')}</Text>
          <View style={styles.chipsWrap}>
            {['None', 'Penicillin', 'Sulfa drugs', 'Aspirin'].map((item) => {
              const active = allergies.includes(item);
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    if (active) setAllergies(allergies.filter((a) => a !== item));
                    else setAllergies([...allergies, item]);
                  }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Medication Adherence */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.numBadge}><Text style={styles.numBadgeText}>4</Text></View>
            <Text style={styles.cardTitle}>{t('history.adherence')}</Text>
          </View>

          <Text style={styles.inputLabel}>{t('history.forgetQ')}</Text>
          <View style={styles.pillRow}>
            {(['Yes', 'No'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.pill, forgetMeds === opt && styles.pillActive]}
                onPress={() => setForgetMeds(opt)}
              >
                <Text style={[styles.pillText, forgetMeds === opt && styles.pillTextActive]}>{opt === 'Yes' ? t('history.yes') : t('history.no')}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>{t('history.dosesMissed')}</Text>
          <TextInput style={styles.input} value={dosesMissed} onChangeText={setDosesMissed} keyboardType="numeric" />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>{t('history.missReasons')}</Text>
          <View style={styles.chipsWrap}>
            {['Forgot', 'Cost', 'Side effects', 'Medicine unavailable', 'Felt better', 'Felt worse'].map((r) => {
              const active = missReasons.includes(r);
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    if (active) setMissReasons(missReasons.filter((m) => m !== r));
                    else setMissReasons([...missReasons, r]);
                  }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{r}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. Lifestyle History */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.numBadge}><Text style={styles.numBadgeText}>5</Text></View>
            <Text style={styles.cardTitle}>{t('history.lifestyle')}</Text>
          </View>

          <Text style={styles.inputLabel}>{t('history.smoking')}</Text>
          <View style={styles.pillRow}>
            {(['Never', 'Former smoker', 'Current smoker'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.pill, smoking === s && styles.pillActive]}
                onPress={() => setSmoking(s)}
              >
                <Text style={[styles.pillText, smoking === s && styles.pillTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>{t('history.alcohol')}</Text>
          <View style={styles.pillRow}>
            {(['Never', 'Occasionally', 'Daily'] as const).map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.pill, alcohol === a && styles.pillActive]}
                onPress={() => setAlcohol(a)}
              >
                <Text style={[styles.pillText, alcohol === a && styles.pillTextActive]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>{t('history.exercise')}</Text>
          <View style={styles.chipsWrap}>
            {['Walking', 'Jogging', 'Yoga', 'None'].map((ex) => {
              const active = exerciseTypes.includes(ex);
              return (
                <TouchableOpacity
                  key={ex}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    if (active) setExerciseTypes(exerciseTypes.filter((e) => e !== ex));
                    else setExerciseTypes([...exerciseTypes, ex]);
                  }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{ex}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 6. Family History */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.numBadge}><Text style={styles.numBadgeText}>6</Text></View>
            <Text style={styles.cardTitle}>{t('history.familyHistory')}</Text>
          </View>

          {FAMILY_DISEASES.map((d) => {
            const row = familyHistory[d] || { father: false, mother: false, sibling: false };
            return (
              <View key={d} style={styles.familyRow}>
                <Text style={styles.familyDiseaseName}>{d}</Text>
                <View style={styles.familyCheckCol}>
                  {(['father', 'mother', 'sibling'] as const).map((rel) => {
                    const checked = row[rel];
                    return (
                      <TouchableOpacity
                        key={rel}
                        style={[styles.relBox, checked && styles.relBoxChecked]}
                        onPress={() =>
                          setFamilyHistory({
                            ...familyHistory,
                            [d]: { ...row, [rel]: !checked },
                          })
                        }
                      >
                        <Text style={[styles.relBoxText, checked && styles.relBoxTextChecked]}>
                          {rel.charAt(0).toUpperCase() + rel.slice(1, 3)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>

        {/* 7. Clinical Measurements */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.numBadge}><Text style={styles.numBadgeText}>7</Text></View>
            <Text style={styles.cardTitle}>{t('history.clinical')}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>{t('history.bp')}</Text>
              <TextInput style={styles.input} value={bp} onChangeText={setBp} placeholder="124/82" />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>{t('history.heartRate')}</Text>
              <TextInput style={styles.input} value={heartRate} onChangeText={setHeartRate} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>{t('history.weight')}</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={(v) => {
                  setWeight(v);
                  updateBmi(v, height);
                }}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>{t('history.height')}</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={(v) => {
                  setHeight(v);
                  updateBmi(weight, v);
                }}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>{t('history.bmi')}</Text>
              <TextInput style={[styles.input, styles.readOnlyInput]} value={`${bmi} kg/m²`} editable={false} />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>{t('history.fastingSugar')}</Text>
              <TextInput style={styles.input} value={fbs} onChangeText={setFbs} placeholder="98 mg/dL" />
            </View>
          </View>
        </View>

        {/* 8. Laboratory Results */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.numBadge}><Text style={styles.numBadgeText}>8</Text></View>
            <Text style={styles.cardTitle}>{t('history.lab')}</Text>
          </View>

          {labRows.map((lab, i) => (
            <View key={lab.id} style={styles.tableRowCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tableRowTitle}>{lab.test}</Text>
                <Text style={styles.tableRowSub}>Result: {lab.result} • {lab.date}</Text>
              </View>
              <TouchableOpacity onPress={() => setLabRows(labRows.filter((_, idx) => idx !== i))}>
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addRowBtn}
            onPress={() =>
              setLabRows([
                ...labRows,
                { id: Date.now().toString(), test: 'Lipid Panel', result: 'Normal', date: '2024-03-01' },
              ])
            }
          >
            <Ionicons name="add" size={16} color={Colors.primary} />
            <Text style={styles.addRowBtnText}>{t('history.addLab')}</Text>
          </TouchableOpacity>
        </View>

        {/* 9. Consent & Submit */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.numBadge}><Text style={styles.numBadgeText}>9</Text></View>
            <Text style={styles.cardTitle}>{t('history.consentTitle')}</Text>
          </View>

          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => setConsent(!consent)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={consent ? 'checkbox' : 'square-outline'}
              size={22}
              color={consent ? Colors.primary : Colors.textLight}
            />
            <Text style={styles.consentText}>
              {t('history.consentText')}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>{t('history.signature')}</Text>
          <TextInput style={styles.input} value={signature} onChangeText={setSignature} placeholder={t('history.signaturePh')} />

          <Text style={styles.inputLabel}>{t('history.date')}</Text>
          <TextInput style={styles.input} value={consentDate} onChangeText={setConsentDate} />

          <TouchableOpacity style={styles.saveBigBtn} onPress={handleSave}>
            <Ionicons name="save-outline" size={20} color={Colors.textOnPrimary} />
            <Text style={styles.saveBigBtnText}>{t('history.saveForm')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backBtnText: { ...Typography.fontSize.sm, color: Colors.text, ...Typography.fontWeight.medium },
  headerTitle: { flex: 1, textAlign: 'center', marginHorizontal: 8, ...Typography.fontSize.md, ...Typography.fontWeight.bold, color: Colors.text },
  saveHeaderBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.md },
  saveHeaderBtnText: { color: Colors.textOnPrimary, ...Typography.fontSize.sm, ...Typography.fontWeight.semibold },
  scrollBody: { padding: Spacing.md, paddingBottom: 110, gap: 14 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.infoLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bannerTitle: { ...Typography.fontSize.sm, ...Typography.fontWeight.bold, color: Colors.primary },
  bannerSub: { ...Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.md },
  numBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBadgeText: { color: Colors.textOnPrimary, ...Typography.fontSize.xs, ...Typography.fontWeight.bold },
  cardTitle: { ...Typography.fontSize.md, ...Typography.fontWeight.bold, color: Colors.text },
  inputLabel: {
    ...Typography.fontSize.xs,
    ...Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    ...Typography.fontSize.sm,
    color: Colors.text,
  },
  readOnlyInput: { backgroundColor: Colors.surfaceVariant, color: Colors.primary, ...Typography.fontWeight.bold },
  row: { flexDirection: 'row', gap: 10 },
  halfCol: { flex: 1 },
  pillRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  pill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { ...Typography.fontSize.xs, color: Colors.textSecondary, ...Typography.fontWeight.medium },
  pillTextActive: { color: Colors.textOnPrimary, ...Typography.fontWeight.bold },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { ...Typography.fontSize.xs, color: Colors.textSecondary },
  chipTextActive: { color: Colors.textOnPrimary, ...Typography.fontWeight.semibold },
  tableRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: 6,
  },
  tableRowTitle: { ...Typography.fontSize.xs, ...Typography.fontWeight.bold, color: Colors.text },
  tableRowSub: { ...Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  addRowBtnText: { ...Typography.fontSize.xs, ...Typography.fontWeight.semibold, color: Colors.primary },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  familyDiseaseName: { ...Typography.fontSize.sm, color: Colors.text, ...Typography.fontWeight.medium },
  familyCheckCol: { flexDirection: 'row', gap: 6 },
  relBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  relBoxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  relBoxText: { ...Typography.fontSize.xs, color: Colors.textSecondary },
  relBoxTextChecked: { color: Colors.textOnPrimary, ...Typography.fontWeight.bold },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4 },
  consentText: { flex: 1, ...Typography.fontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  saveBigBtn: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  saveBigBtnText: { color: Colors.textOnPrimary, ...Typography.fontSize.md, ...Typography.fontWeight.bold },
});
