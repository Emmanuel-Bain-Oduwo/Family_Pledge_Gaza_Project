import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppCard from '../../components/AppCard';
import BadgeCard from '../../components/BadgeCard';
import LoadingState from '../../components/LoadingState';
import { getMe } from '../../services/api';
import { getUser } from '../../services/auth';
import { Badge } from '../../types';
import { MOCK_USER } from '../../constants/mockData';

const ALL_BADGES: Badge[] = [
  { id: '1', name: 'First Pledge', description: 'Made your first pledge', icon: 'heart', tier: 'bronze' },
  { id: '2', name: 'Faithful Donor', description: '3 consecutive months', icon: 'ribbon', tier: 'silver' },
  { id: '3', name: 'Dedicated Supporter', description: '6 consecutive months', icon: 'star', tier: 'gold' },
  { id: '4', name: 'Champion of Gaza', description: '12 consecutive months', icon: 'trophy', tier: 'platinum' },
  { id: '5', name: 'Friday Warrior', description: 'Contributed on 4 Fridays', icon: 'flash', tier: 'bronze' },
  { id: '6', name: 'Circle Builder', description: 'Invited 5 donors', icon: 'people', tier: 'silver' },
  { id: '7', name: 'Early Bird', description: 'Among first 100 donors', icon: 'flower', tier: 'gold' },
  { id: '8', name: 'Share the Cause', description: 'Shared 10 times', icon: 'share-social', tier: 'bronze' },
];

export default function BadgesScreen() {
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setEarnedBadges(me.badges || []);
      } catch {
        const stored = await getUser();
        setEarnedBadges(stored?.badges || MOCK_USER.badges || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState fullScreen message="Loading badges..." />;

  const earnedIds = new Set(earnedBadges.map((b) => b.id));
  const badges = ALL_BADGES.map((b) => ({
    ...b,
    earned_at: earnedBadges.find((e) => e.id === b.id)?.earned_at,
  }));

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Stats */}
      <View style={styles.statsHeader}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{earnedBadges.length}</Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>{ALL_BADGES.length - earnedBadges.length}</Text>
          <Text style={styles.statLabel}>Locked</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>
            {Math.round((earnedBadges.length / ALL_BADGES.length) * 100)}%
          </Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>
      </View>

      {/* Earned */}
      {earnedBadges.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.sectionTitle}>Earned Badges</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeRow}>
            {earnedBadges.map((b) => (
              <BadgeCard key={b.id} badge={b} earned />
            ))}
          </ScrollView>
        </View>
      )}

      {/* All Badges Grid */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trophy-outline" size={18} color={Colors.gold} />
          <Text style={styles.sectionTitle}>All Badges</Text>
        </View>
        <View style={styles.grid}>
          {badges.map((b) => (
            <View key={b.id} style={styles.gridItem}>
              <BadgeCard badge={b} />
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingBottom: 32 },
  statsHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryDark,
    paddingVertical: 24,
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '800', color: Colors.gold, marginBottom: 2 },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  badgeRow: { gap: 0, paddingRight: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: {},
});
