import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import CampaignProgressCard from '../../components/CampaignProgressCard';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import { getCampaigns } from '../../services/api';
import { Campaign } from '../../types';
import { MOCK_CAMPAIGNS } from '../../constants/mockData';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'friday_challenge', label: 'Friday' },
  { key: 'emergency', label: 'Emergency' },
  { key: 'monthly', label: 'Monthly' },
];

export default function CampaignsScreen() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getCampaigns();
      setCampaigns(data);
    } catch {
      setCampaigns(MOCK_CAMPAIGNS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? campaigns : campaigns.filter((c) => c.type === filter);

  if (loading) return <LoadingState fullScreen message="Loading campaigns..." />;

  return (
    <View style={styles.container}>
      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filterScroll}
      >
        {FILTERS.map((f) => (
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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CampaignProgressCard
            campaign={item}
            onPress={() =>
              router.push(
                item.type === 'friday_challenge'
                  ? '/screens/friday-challenge'
                  : item.type === 'emergency'
                  ? '/screens/emergency-appeal'
                  : '/screens/campaign-details'
              )
            }
            onContribute={() => router.push('/screens/contribute')}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="megaphone-outline"
            title="No Campaigns Found"
            description="Check back later for active campaigns."
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
  filterScroll: { maxHeight: 56 },
  filters: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
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
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  list: {
    paddingTop: 4,
    paddingBottom: 32,
  },
});
