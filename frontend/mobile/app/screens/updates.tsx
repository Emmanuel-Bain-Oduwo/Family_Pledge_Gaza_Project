import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Colors } from '../../constants/colors';
import ImpactCard from '../../components/ImpactCard';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import { getImpactCards } from '../../services/api';
import { ImpactCard as ImpactCardType } from '../../types';
import { MOCK_IMPACT_CARDS } from '../../constants/mockData';

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'food', label: 'Food' },
  { key: 'medical', label: 'Medical' },
  { key: 'shelter', label: 'Shelter' },
  { key: 'water', label: 'Water' },
  { key: 'education', label: 'Education' },
];

export default function UpdatesScreen() {
  const [impacts, setImpacts] = useState<ImpactCardType[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getImpactCards();
      setImpacts(data);
    } catch {
      setImpacts(MOCK_IMPACT_CARDS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? impacts : impacts.filter((i) => i.category === filter);

  if (loading) return <LoadingState fullScreen message="Loading updates..." />;

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ImpactCard
            impact={item}
            onPress={item.video_url ? () => Linking.openURL(item.video_url!) : undefined}
          />
        )}
        ListHeaderComponent={
          <View>
            {/* Stats Header */}
            <View style={styles.statsHeader}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{impacts.length}</Text>
                <Text style={styles.statLabel}>Updates</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>
                  {impacts.reduce((a, b) => a + (b.beneficiaries || 0), 0).toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Beneficiaries</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>Gaza</Text>
                <Text style={styles.statLabel}>Focus Area</Text>
              </View>
            </View>

            {/* Filters */}
            <FlatList
              horizontal
              data={CATEGORY_FILTERS}
              keyExtractor={(item) => item.key}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
              renderItem={({ item: f }) => (
                <TouchableOpacity
                  onPress={() => setFilter(f.key)}
                  activeOpacity={0.8}
                  style={[styles.chip, filter === f.key && styles.chipActive]}
                >
                  <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="images-outline"
            title="No Updates Yet"
            description="Impact reports and project updates will appear here."
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  statsHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryDark,
    paddingVertical: 20,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    marginBottom: 0,
  },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: Colors.gold, marginBottom: 2 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  filters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  list: { paddingBottom: 32 },
});
