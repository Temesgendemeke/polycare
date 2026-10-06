import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks';
import { dietApi } from '../../lib/api/diet';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/design';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

interface Meal {
  _id: string;
  type: string;
  name: string;
  foods: { name: string; quantity: number; unit: string }[];
  instructions: string;
  date: string;
  calories: number;
  consumed: boolean;
}

export default function DietScreen() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMeal, setEditMeal] = useState<Meal | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dietApi.getAll({ date: selectedDate, type: filterType || undefined });
      setMeals(data);
    } catch {}
    setLoading(false);
  }, [selectedDate, filterType]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const dateStr = (d: string) => {
    const date = new Date(d + 'T12:00:00');
    const todayD = new Date();
    if (d === today) return 'Today';
    const yesterday = new Date(todayD); yesterday.setDate(yesterday.getDate() - 1);
    if (d === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    const tomorrow = new Date(todayD); tomorrow.setDate(tomorrow.getDate() + 1);
    if (d === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';
    return date.toLocaleDateString();
  };

  const typeIcon = (type: string) => {
    const icons: Record<string, string> = { breakfast: 'sunny', lunch: 'sunny-outline', dinner: 'moon', snack: 'cafe' };
    return icons[type] || 'restaurant';
  };

  const typeColor = (type: string) => {
    const colors: Record<string, string> = { breakfast: '#E9A133', lunch: Colors.primary, dinner: '#5B4DB7', snack: Colors.accent };
    return colors[type] || Colors.textSecondary;
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Meal', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await dietApi.delete(id);
        setMeals((prev) => prev.filter((m) => m._id !== id));
      }},
    ]);
  };

  const toggleConsumed = async (meal: Meal) => {
    const updated = await dietApi.update(meal._id, { consumed: !meal.consumed });
    setMeals((prev) => prev.map((m) => (m._id === meal._id ? { ...m, consumed: updated.consumed } : m)));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Diet Tracker</Text>
        <Text style={styles.subtitle}>Log your meals every day</Text>
      </View>

      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow}>
          <Ionicons name="chevron-back" size={18} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedDate(today)} style={styles.dateLabel}>
          <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
          <Text style={styles.dateText}>{dateStr(selectedDate)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateArrow}>
          <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.typeRow}>
        <TouchableOpacity style={[styles.typeChip, filterType === '' && styles.typeChipActive]} onPress={() => setFilterType('')}>
          <Text style={[styles.typeChipText, filterType === '' && styles.typeChipTextActive]}>All</Text>
        </TouchableOpacity>
        {MEAL_TYPES.map((t) => (
          <TouchableOpacity key={t} style={[styles.typeChip, filterType === t && styles.typeChipActive]} onPress={() => setFilterType(t)}>
            <Ionicons name={typeIcon(t) as any} size={14} color={filterType === t ? '#fff' : typeColor(t)} />
            <Text style={[styles.typeChipText, filterType === t && styles.typeChipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={meals}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchMeals}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={36} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No meals logged</Text>
            <Text style={styles.emptySub}>Tap + to add a meal for {dateStr(selectedDate).toLowerCase()}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.mealCard, item.consumed && styles.mealCardDone]}>
            <View style={styles.mealHeader}>
              <View style={[styles.mealTypeBadge, { backgroundColor: typeColor(item.type) + '20' }]}>
                <Ionicons name={typeIcon(item.type) as any} size={16} color={typeColor(item.type)} />
                <Text style={[styles.mealTypeText, { color: typeColor(item.type) }]}>{item.type}</Text>
              </View>
              <View style={styles.mealActions}>
                <TouchableOpacity onPress={() => toggleConsumed(item)}>
                  <Ionicons name={item.consumed ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={item.consumed ? Colors.success : Colors.textLight} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditMeal(item); setModalVisible(true); }}>
                  <Ionicons name="create-outline" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item._id, item.name)}>
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.mealName}>{item.name}</Text>
            {item.foods?.length > 0 && (
              <Text style={styles.mealFoods}>{item.foods.map((f) => `${f.name} (${f.quantity}${f.unit})`).join(', ')}</Text>
            )}
            {item.calories > 0 && (
              <View style={styles.calorieBadge}>
                <Ionicons name="flame-outline" size={12} color={Colors.accent} />
                <Text style={styles.calorieText}>{item.calories} cal</Text>
              </View>
            )}
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => { setEditMeal(null); setModalVisible(true); }}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      <MealModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditMeal(null); }}
        editMeal={editMeal}
        date={selectedDate}
        onSaved={fetchMeals}
      />
    </SafeAreaView>
  );
}

function MealModal({ visible, onClose, editMeal, date, onSaved }: {
  visible: boolean; onClose: () => void; editMeal: Meal | null; date: string; onSaved: () => void;
}) {
  const [type, setType] = useState<string>('breakfast');
  const [name, setName] = useState('');
  const [foods, setFoods] = useState('');
  const [instructions, setInstructions] = useState('');
  const [calories, setCalories] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editMeal) {
      setType(editMeal.type);
      setName(editMeal.name);
      setFoods(editMeal.foods?.map((f) => `${f.name} (${f.quantity}${f.unit})`).join(', ') || '');
      setInstructions(editMeal.instructions || '');
      setCalories(editMeal.calories?.toString() || '');
    } else {
      setType('breakfast'); setName(''); setFoods(''); setInstructions(''); setCalories('');
    }
  }, [editMeal]);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Meal name is required');
    setSaving(true);
    try {
      const foodItems = foods.split(',').map((f) => {
        const match = f.trim().match(/^(.+?)\s*\((\d+)\s*(\w+)\)$/);
        return match ? { name: match[1], quantity: parseFloat(match[2]), unit: match[3] } : { name: f.trim(), quantity: 1, unit: 'serving' };
      }).filter((f) => f.name);
      const data = { type, name: name.trim(), foods: foodItems, instructions: instructions.trim(), date, calories: calories ? parseInt(calories) : 0 };
      if (editMeal) {
        await dietApi.update(editMeal._id, data);
      } else {
        await dietApi.create(data);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setSaving(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editMeal ? 'Edit Meal' : 'Add Meal'}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={Colors.text} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Meal Type</Text>
            <View style={styles.typeSelectRow}>
              {MEAL_TYPES.map((t) => (
                <TouchableOpacity key={t} style={[styles.typeOption, type === t && styles.typeOptionActive]} onPress={() => setType(t)}>
                  <Text style={[styles.typeOptionText, type === t && styles.typeOptionTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Meal Name *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Oatmeal with Berries" placeholderTextColor={Colors.textLight} />
            <Text style={styles.label}>Foods</Text>
            <TextInput style={styles.input} value={foods} onChangeText={setFoods} placeholder="Oats (1 cup), Berries (0.5 cup)" placeholderTextColor={Colors.textLight} />
            <Text style={styles.label}>Instructions</Text>
            <TextInput style={[styles.input, styles.textArea]} value={instructions} onChangeText={setInstructions} placeholder="How to prepare..." placeholderTextColor={Colors.textLight} multiline />
            <Text style={styles.label}>Calories</Text>
            <TextInput style={styles.input} value={calories} onChangeText={setCalories} placeholder="350" placeholderTextColor={Colors.textLight} keyboardType="numeric" />
            <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveButtonText}>{saving ? 'Saving...' : editMeal ? 'Update Meal' : 'Add Meal'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  dateArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  dateLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  dateText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  typeRow: { flexDirection: 'row', gap: 6, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary, textTransform: 'capitalize' },
  typeChipTextActive: { color: '#fff' },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  emptySub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  mealCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.sm },
  mealCardDone: { opacity: 0.6 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  mealTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
  mealTypeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  mealActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  mealName: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  mealFoods: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  calorieBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  calorieText: { fontSize: 12, color: Colors.accent, fontWeight: '500' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', ...Shadows.lg },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6, marginTop: Spacing.sm },
  typeSelectRow: { flexDirection: 'row', gap: 6 },
  typeOption: { flex: 1, paddingVertical: 8, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceVariant, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  typeOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeOptionText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary, textTransform: 'capitalize' },
  typeOptionTextActive: { color: '#fff' },
  input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: 14, color: Colors.text },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  saveButton: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.lg },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
