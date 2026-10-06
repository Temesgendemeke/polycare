import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { adminApi } from '../lib/api/admin';
import { useUserStore } from '../store';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/design';
import { useTranslation } from '../hooks';

interface AdminUser {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export default function AdminScreen() {
  const { user } = useUserStore();
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ totalUsers: number; totalMedications: number } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers(page, 20, search);
      setUsers(data.users);
      setTotal(data.total);
    } catch {}
    setLoading(false);
  }, [page, search]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch {}
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleDelete = (id: string, name: string) => {
    Alert.alert(t('admin.deleteTitle'), t('admin.deleteMsg', { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        try {
          await adminApi.deleteUser(id);
          setUsers((prev) => prev.filter((u) => u._id !== id));
          setTotal((prev) => prev - 1);
        } catch (e: any) { Alert.alert(t('common.error'), e.message); }
      }},
    ]);
  };

  const handleRoleToggle = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await adminApi.setRole(id, newRole);
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role: newRole } : u)));
    } catch (e: any) { Alert.alert(t('common.error'), e.message); }
  };

  if (!user || user.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="shield-checkmark-outline" size={48} color={Colors.textLight} />
          <Text style={styles.deniedTitle}>{t('admin.accessOnly')}</Text>
          <Text style={styles.deniedSub}>{t('admin.noPermission')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t('admin.panel')}</Text>
          <Text style={styles.headerSub}>{t('admin.userMgmt')}</Text>
        </View>
      </View>

      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>{t('admin.users')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{stats.totalMedications}</Text>
            <Text style={styles.statLabel}>{t('admin.medications')}</Text>
          </View>
        </View>
      )}

      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={Colors.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('admin.searchPh')}
          placeholderTextColor={Colors.textLight}
          style={styles.searchInput}
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => { setSearch(''); setPage(1); }}>
            <Ionicons name="close-circle" size={16} color={Colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.countText}>{total} {t('admin.userSuffix')}</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email || item.phone || t('admin.noContact')}</Text>
                <View style={styles.roleRow}>
                  <View style={[styles.roleBadge, item.role === 'admin' && styles.roleBadgeAdmin]}>
                    <Text style={[styles.roleText, item.role === 'admin' && styles.roleTextAdmin]}>{item.role}</Text>
                  </View>
                  <Text style={styles.joinedText}>{t('admin.joined', { date: new Date(item.createdAt).toLocaleDateString() })}</Text>
                </View>
              </View>
              <View style={styles.userActions}>
                {item._id !== user.id && (
                  <>
                    <TouchableOpacity onPress={() => handleRoleToggle(item._id, item.role)} style={styles.actionBtn}>
                      <Ionicons name="swap-horizontal-outline" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item._id, item.name)} style={styles.actionBtn}>
                      <Ionicons name="trash-outline" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, gap: 12 },
  deniedTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  deniedSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.md, marginTop: Spacing.md },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, alignItems: 'center', ...Shadows.sm,
  },
  statNum: { fontSize: 28, fontWeight: '700', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: Spacing.md, marginTop: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 10 },
  countText: { fontSize: 12, color: Colors.textSecondary, marginHorizontal: Spacing.md, marginTop: Spacing.sm, marginBottom: 4 },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 110 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.sm,
  },
  userAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  userEmail: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  roleBadge: { backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  roleBadgeAdmin: { backgroundColor: Colors.warningLight },
  roleText: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase' },
  roleTextAdmin: { color: Colors.warning },
  joinedText: { fontSize: 10, color: Colors.textLight },
  userActions: { flexDirection: 'row', gap: 4, marginLeft: Spacing.sm },
  actionBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' },
});
