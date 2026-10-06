import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/design';

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  distance: string;
  open: boolean;
  hours: string;
  phone: string;
  drugs: string[];
}

const PHARMACIES: Pharmacy[] = [
  {
    id: '1',
    name: 'Tikur Anbessa Pharmacy',
    address: 'Tikur Anbessa Hospital, Lideta, Addis Ababa',
    distance: '1.2 km',
    open: true,
    hours: '8:00 AM - 10:00 PM',
    phone: '+251 11 551 1211',
    drugs: ['Metformin', 'Lisinopril', 'Amlodipine', 'Insulin Regular'],
  },
  {
    id: '2',
    name: 'Hayat Pharmacy',
    address: 'Bole Medhanealem, Addis Ababa',
    distance: '2.8 km',
    open: true,
    hours: 'Open 24/7',
    phone: '+251 11 662 4488',
    drugs: ['Metformin', 'Atorvastatin', 'Insulin Glargine', 'Losartan'],
  },
  {
    id: '3',
    name: "St. Paul's Pharmacy",
    address: "St. Paul's Hospital, Gulele, Addis Ababa",
    distance: '4.1 km',
    open: false,
    hours: '8:30 AM - 5:30 PM',
    phone: '+251 11 275 0125',
    drugs: ['Lisinopril', 'Losartan', 'Hydrochlorothiazide'],
  },
  {
    id: '4',
    name: 'Kadisco Pharmacy',
    address: 'Gerji, Bole Subcity, Addis Ababa',
    distance: '3.5 km',
    open: true,
    hours: '8:00 AM - 9:00 PM',
    phone: '+251 11 629 1100',
    drugs: ['Metformin', 'Glibenclamide', 'Baby Aspirin', 'Atorvastatin'],
  },
];

export default function DrugLocatorScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  const allTags = ['All', 'Metformin', 'Lisinopril', 'Insulin', 'Atorvastatin', 'Amlodipine'];

  const filteredPharmacies = useMemo(() => {
    return PHARMACIES.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.drugs.some((d) => d.toLowerCase().includes(q));

      const matchesTag =
        selectedTag === 'All' ||
        p.drugs.some((d) => d.toLowerCase().includes(selectedTag.toLowerCase()));

      return matchesQuery && matchesTag;
    });
  }, [searchQuery, selectedTag]);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => {
      Alert.alert('Phone', `Contact number: ${phone}`);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Drug Locator</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Map Visualization Card */}
        <View style={styles.mapCard}>
          <Ionicons name="map" size={32} color={Colors.primary} />
          <Text style={styles.mapTitle}>Addis Ababa Pharmacy Network</Text>
          <Text style={styles.mapSub}>
            Real-time stock verification for NCD chronic medications
          </Text>
          <View style={styles.mapBadge}>
            <Ionicons name="navigate" size={14} color={Colors.secondary} />
            <Text style={styles.mapBadgeText}>GPS Radius: 5 km</Text>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by medicine or pharmacy name..."
            placeholderTextColor={Colors.textLight}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Filter Tags */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
          {allTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagChip, selectedTag === tag && styles.tagChipActive]}
              onPress={() => setSelectedTag(tag)}
            >
              <Text style={[styles.tagChipText, selectedTag === tag && styles.tagChipTextActive]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pharmacy Results Count */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            Showing {filteredPharmacies.length} verified pharmacies
          </Text>
        </View>

        {/* Pharmacies List */}
        {filteredPharmacies.map((pharmacy) => (
          <View key={pharmacy.id} style={styles.pharmacyCard}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
                <Text style={styles.pharmacyAddress}>
                  <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />{' '}
                  {pharmacy.address} • {pharmacy.distance}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  pharmacy.open ? styles.statusOpen : styles.statusClosed,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    pharmacy.open ? styles.statusOpenText : styles.statusClosedText,
                  ]}
                >
                  {pharmacy.open ? 'OPEN' : 'CLOSED'}
                </Text>
              </View>
            </View>

            <Text style={styles.hoursText}>
              <Ionicons name="time-outline" size={12} color={Colors.textSecondary} /> {pharmacy.hours}
            </Text>

            {/* Drugs available in stock */}
            <View style={styles.drugsWrap}>
              {pharmacy.drugs.map((drug) => (
                <View key={drug} style={styles.drugPill}>
                  <Text style={styles.drugPillText}>💊 {drug}</Text>
                </View>
              ))}
            </View>

            {/* Action buttons */}
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleCall(pharmacy.phone)}
              >
                <Ionicons name="call-outline" size={16} color={Colors.primary} />
                <Text style={styles.actionBtnText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.directionsBtn]}
                onPress={() =>
                  Alert.alert(
                    'Directions',
                    `Navigating to ${pharmacy.name} (${pharmacy.distance} away).`
                  )
                }
              >
                <Ionicons name="navigate-outline" size={16} color={Colors.textOnPrimary} />
                <Text style={styles.directionsBtnText}>Directions</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
  headerTitle: { ...Typography.fontSize.md, ...Typography.fontWeight.bold, color: Colors.text },
  scrollBody: { padding: Spacing.md, paddingBottom: 110, gap: 12 },
  mapCard: {
    backgroundColor: Colors.infoLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  mapTitle: { ...Typography.fontSize.md, ...Typography.fontWeight.bold, color: Colors.text },
  mapSub: { ...Typography.fontSize.xs, color: Colors.textSecondary, textAlign: 'center' },
  mapBadge: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  mapBadgeText: { ...Typography.fontSize.xs, ...Typography.fontWeight.semibold, color: Colors.secondaryDark },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  searchInput: { flex: 1, ...Typography.fontSize.md, color: Colors.text },
  tagsScroll: { flexDirection: 'row', marginVertical: 2 },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  tagChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tagChipText: { ...Typography.fontSize.xs, color: Colors.textSecondary, ...Typography.fontWeight.medium },
  tagChipTextActive: { color: Colors.textOnPrimary, ...Typography.fontWeight.semibold },
  countRow: { paddingHorizontal: 4 },
  countText: { ...Typography.fontSize.xs, color: Colors.textSecondary, ...Typography.fontWeight.medium },
  pharmacyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  pharmacyName: { ...Typography.fontSize.md, ...Typography.fontWeight.bold, color: Colors.text },
  pharmacyAddress: { ...Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.sm },
  statusOpen: { backgroundColor: Colors.successLight },
  statusOpenText: { color: Colors.success, ...Typography.fontSize.xs, ...Typography.fontWeight.bold },
  statusClosed: { backgroundColor: Colors.errorLight },
  statusClosedText: { color: Colors.error, ...Typography.fontSize.xs, ...Typography.fontWeight.bold },
  statusBadgeText: { ...Typography.fontSize.xs },
  hoursText: { ...Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 4 },
  drugsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  drugPill: {
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  drugPillText: { ...Typography.fontSize.xs, color: Colors.text, ...Typography.fontWeight.medium },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  actionBtnText: { ...Typography.fontSize.xs, ...Typography.fontWeight.semibold, color: Colors.primary },
  directionsBtn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  directionsBtnText: { ...Typography.fontSize.xs, ...Typography.fontWeight.semibold, color: Colors.textOnPrimary },
});
