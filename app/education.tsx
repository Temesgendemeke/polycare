import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/design';
import { useTranslation } from '../hooks';

interface Article {
  id: string;
  category: string;
  title: string;
  readTime: string;
  language: string;
  voice: boolean;
  content: string;
}

const ARTICLES: Article[] = [
  {
    id: '1',
    category: 'Diabetes',
    title: 'Understanding Type 2 Diabetes',
    readTime: '5 min read',
    language: 'English',
    voice: true,
    content:
      'Type 2 diabetes is a chronic condition that affects the way your body metabolizes glucose. With type 2 diabetes, your body either resists the effects of insulin or doesn\'t produce enough insulin to maintain normal glucose levels. Regular physical activity, balanced meals with complex carbohydrates, and consistent medication adherence are critical components in keeping your HbA1c below target thresholds.',
  },
  {
    id: '2',
    category: 'Hypertension',
    title: 'Salt and Your Blood Pressure',
    readTime: '3 min read',
    language: 'English',
    voice: true,
    content:
      'High sodium intake pulls water into your blood vessels, increasing the total volume of blood inside them. With more blood flowing through your blood vessels, blood pressure increases. Reducing dietary sodium to less than 2,000 mg per day can significantly decrease both systolic and diastolic blood pressure, protecting kidney function and lowering cardiovascular disease risk.',
  },
  {
    id: '3',
    category: 'Lifestyle',
    title: 'Stress Management Techniques for NCDs',
    readTime: '7 min read',
    language: 'English',
    voice: true,
    content:
      'Chronic psychological stress elevates cortisol and adrenaline hormones, causing persistent elevations in heart rate, arterial constriction, and glucose release into the bloodstream. Incorporating daily 15-minute mindfulness breathing, light aerobic walking, and consistent sleep hygiene helps regulate the autonomic nervous system and improves clinical outcomes in hypertension and diabetes.',
  },
  {
    id: '4',
    category: 'Diabetes',
    title: 'ስለ ስኳር በሽታ ማወቅ የሚገቡ ነገሮች',
    readTime: '6 min read',
    language: 'Amharic',
    voice: true,
    content:
      'የስኳር በሽታ ሰውነታችን ግሉኮስን ወይም ስኳርን በአግባቡ የመጠቀም አቅሙ ሲዳከም የሚከሰት ሥር የሰደደ የጤና ሁኔታ ነው። በቂ የአካል ብቃት እንቅስቃሴ ማድረግ፣ የጣፋጭና የካርቦሃይድሬት መጠንን መቀነስ እንዲሁም የታዘዙ መድሃኒቶችን በሰዓቱ መውሰድ የደም ስኳር መጠንን ለመቆጣጠር ከፍተኛ አስተዋጽኦ ያበረክታል።',
  },
  {
    id: '5',
    category: 'Hypertension',
    title: 'Dhiibbaa Dhiigaa fi Nyaata Soogiddaa',
    readTime: '4 min read',
    language: 'Afaan Oromoo',
    voice: true,
    content:
      'Dhiibbaan dhiigaa olka\'aan yeroo dheeraaf yoo hin to\'atamin onnee fi kalee miidhuu danda\'a. Soogidda nyaataa hir\'isuu, dhiibbaa dhiigaa yeroo yeroon safaruu fi qoricha ogeessi fayyaa ajaje sirnaan fudhachuun lubbuu baraara.',
  },
];

const LANGUAGES = ['All', 'English', 'Amharic', 'Afaan Oromoo'];

export default function EducationScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedLang, setSelectedLang] = useState('All');
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const filteredArticles = ARTICLES.filter((a) => {
    if (selectedLang === 'All') return true;
    return a.language === selectedLang;
  });

  const handleToggleVoice = async (article: Article) => {
    if (speakingId === article.id) {
      await Speech.stop();
      setSpeakingId(null);
    } else {
      await Speech.stop();
      setSpeakingId(article.id);
      const speechLang = article.language === 'Amharic' ? 'am' : 'en-US';
      Speech.speak(article.title + '. ' + article.content, {
        language: speechLang,
        rate: 0.9,
        onDone: () => setSpeakingId(null),
        onError: () => setSpeakingId(null),
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { Speech.stop(); router.back(); }}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
          <Text style={styles.backBtnText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('educationHub.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerCard}>
          <Ionicons name="school" size={28} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>{t('educationHub.subtitle')}</Text>
            <Text style={styles.bannerSub}>
              {t('educationHub.desc')}
            </Text>
          </View>
        </View>

        {/* Language Selection Pills */}
        <Text style={styles.sectionLabel}>{t('educationHub.selectLanguage')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[styles.pill, selectedLang === lang && styles.pillActive]}
              onPress={() => setSelectedLang(lang)}
            >
              <Text style={[styles.pillText, selectedLang === lang && styles.pillTextActive]}>
                {lang === 'All' ? t('educationHub.all') : lang}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Articles List */}
        <View style={styles.list}>
          {filteredArticles.map((article) => {
            const isSpeaking = speakingId === article.id;
            return (
              <View key={article.id} style={styles.articleCard}>
                <View style={{ flex: 1 }}>
                  <View style={styles.catRow}>
                    <Text style={styles.categoryBadge}>{article.category}</Text>
                    <Text style={styles.langBadge}>{article.language}</Text>
                  </View>
                  <Text style={styles.articleTitle}>{article.title}</Text>
                  <Text style={styles.readTime}>
                    <Ionicons name="book-outline" size={12} color={Colors.textSecondary} />{' '}
                    {article.readTime.split(' ')[0]} {t('educationHub.minRead')}
                  </Text>
                </View>

                {article.voice && (
                  <TouchableOpacity
                    style={[styles.voiceBtn, isSpeaking && styles.voiceBtnActive]}
                    onPress={() => handleToggleVoice(article)}
                  >
                    <Ionicons
                      name={isSpeaking ? 'pause' : 'volume-high'}
                      size={18}
                      color={isSpeaking ? Colors.textOnPrimary : Colors.primary}
                    />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.readBtn}
                  onPress={() => setReadingArticle(article)}
                >
                  <Text style={styles.readBtnText}>{t('education.read')}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Article Detail Modal */}
      <Modal
        visible={!!readingArticle}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setReadingArticle(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setReadingArticle(null)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {readingArticle?.category} {t('educationHub.guide')}
            </Text>
            {readingArticle?.voice && (
              <TouchableOpacity
                onPress={() => readingArticle && handleToggleVoice(readingArticle)}
              >
                <Ionicons
                  name={speakingId === readingArticle.id ? 'pause-circle' : 'volume-high'}
                  size={26}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.modalArticleTitle}>{readingArticle?.title}</Text>
            <Text style={styles.modalMeta}>
              {readingArticle?.readTime?.split(' ')[0]} {t('educationHub.minRead')} • {t('educationHub.languageLabel')}{readingArticle?.language}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.modalContent}>{readingArticle?.content}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  scrollBody: { padding: Spacing.md, paddingBottom: 110, gap: 14 },
  bannerCard: {
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
  sectionLabel: { ...Typography.fontSize.sm, ...Typography.fontWeight.semibold, color: Colors.text },
  pillsScroll: { flexDirection: 'row', marginVertical: 2 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { ...Typography.fontSize.xs, color: Colors.textSecondary, ...Typography.fontWeight.medium },
  pillTextActive: { color: Colors.textOnPrimary, ...Typography.fontWeight.semibold },
  list: { gap: 10 },
  articleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  catRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  categoryBadge: {
    backgroundColor: Colors.surfaceVariant,
    color: Colors.primary,
    ...Typography.fontSize.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    ...Typography.fontWeight.semibold,
  },
  langBadge: { ...Typography.fontSize.xs, color: Colors.textSecondary },
  articleTitle: { ...Typography.fontSize.sm, ...Typography.fontWeight.bold, color: Colors.text, marginBottom: 4 },
  readTime: { ...Typography.fontSize.xs, color: Colors.textSecondary },
  voiceBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceBtnActive: { backgroundColor: Colors.primary },
  readBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceVariant,
  },
  readBtnText: { ...Typography.fontSize.xs, ...Typography.fontWeight.semibold, color: Colors.text },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { ...Typography.fontSize.md, ...Typography.fontWeight.bold, color: Colors.text },
  modalBody: { padding: Spacing.lg },
  modalArticleTitle: { ...Typography.fontSize.xl, ...Typography.fontWeight.bold, color: Colors.text, marginBottom: 6 },
  modalMeta: { ...Typography.fontSize.xs, color: Colors.textSecondary, marginBottom: 12 },
  divider: { height: 1, backgroundColor: Colors.divider, marginBottom: 16 },
  modalContent: { ...Typography.fontSize.md, color: Colors.text, lineHeight: 26 },
});
