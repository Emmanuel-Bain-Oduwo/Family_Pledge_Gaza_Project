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
import NamlefContentCard from '../../components/NamlefContentCard';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import { getNamlefContent } from '../../services/api';
import { NamlefContent } from '../../types';
import { MOCK_NAMLEF_CONTENT } from '../../constants/mockData';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'about', label: 'About' },
  { key: 'sheikh_message', label: 'Sheikh' },
  { key: 'introduction', label: 'Intro' },
  { key: 'voice_of_support', label: 'Voices' },
];

export default function NamlefScreen() {
  const [content, setContent] = useState<NamlefContent[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getNamlefContent();
      setContent(data);
    } catch {
      setContent(MOCK_NAMLEF_CONTENT);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? content : content.filter((c) => c.type === filter);

  if (loading) return <LoadingState fullScreen message="Loading NAMLEF content..." />;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>N</Text>
        </View>
        <Text style={styles.headerTitle}>NAMLEF</Text>
        <Text style={styles.headerSub}>National Muslim Leaders Forum</Text>
        <Text style={styles.headerDesc}>
          NAMLEF is committed to mobilising Muslim communities for humanitarian causes. Family Pledge is our flagship Gaza relief programme.
        </Text>
      </View>

      {/* Filter */}
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
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState
          icon="information-circle-outline"
          title="No Content"
          description="NAMLEF messages and updates will appear here."
        />
      ) : (
        filtered.map((c) => <NamlefContentCard key={c.id} content={c} />)
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingBottom: 32 },
  header: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 24,
    marginBottom: 0,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoText: { fontSize: 28, fontWeight: '900', color: Colors.primaryDark },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.white, marginBottom: 4 },
  headerSub: { fontSize: 14, color: Colors.gold, fontWeight: '600', marginBottom: 12 },
  headerDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  filterScroll: { maxHeight: 52 },
  filters: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.text.secondary },
  chipTextActive: { color: Colors.white },
});
