import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../../constants/colors';
import ReminderCard from '../../components/ReminderCard';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import { getDailyReminders } from '../../services/api';
import { Reminder } from '../../types';
import { MOCK_REMINDERS } from '../../constants/mockData';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'quran', label: 'Quran' },
  { key: 'hadith', label: 'Hadith' },
  { key: "dua", label: "Du'a" },
  { key: 'motivation', label: 'Motivation' },
  { key: 'friday', label: "Jumu'ah" },
];

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getDailyReminders();
      setReminders(data);
    } catch {
      setReminders(MOCK_REMINDERS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? reminders : reminders.filter((r) => r.type === filter);

  if (loading) return <LoadingState fullScreen message="Loading reminders..." />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Reminders</Text>
        <Text style={styles.headerSub}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={Colors.white}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          style={styles.filterScroll}
        >
          {TYPE_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.8}
              style={[styles.chip, filter === f.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <EmptyState
            icon="moon-outline"
            title="No Reminders"
            description="Daily Quran, Hadith, and Du'a reminders will appear here."
          />
        ) : (
          filtered.map((r) => <ReminderCard key={r.id} reminder={r} />)
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 16,
    color: Colors.gold,
    fontWeight: '400',
  },
  scroll: { flex: 1 },
  content: { paddingTop: 12, paddingBottom: 24 },
  filterScroll: { maxHeight: 52 },
  filters: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  chipTextActive: { color: Colors.white },
});
