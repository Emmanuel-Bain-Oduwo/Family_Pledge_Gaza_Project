import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppCard from '../../components/AppCard';
import LoadingState from '../../components/LoadingState';
import { getAchievements } from '../../services/api';
import { Achievement } from '../../types';

export default function BadgesScreen() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAchievements()
      .then(setAchievements)
      .catch((error) => Alert.alert('Could not load achievements', error?.message || 'Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState fullScreen message="Loading achievements..." />;

  const earned = achievements.filter((item) => item.earned);
  const remaining = achievements.filter((item) => !item.earned);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Ionicons name="trophy-outline" size={32} color={Colors.goldLight} />
        <Text style={styles.heroTitle}>Achievements</Text>
        <Text style={styles.heroText}>Milestones that recognize your Family Pledge journey and consistency.</Text>
        <View style={styles.heroStats}>
          <Stat value={earned.length} label="Earned" />
          <View style={styles.divider} />
          <Stat value={remaining.length} label="Still to unlock" />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Earned Badges ({earned.length})</Text>
      {earned.length ? (
        <View style={styles.grid}>{earned.map((item) => <AchievementCard key={item.key} item={item} />)}</View>
      ) : (
        <AppCard style={styles.emptyCard}><Text style={styles.emptyText}>Your first achievement will appear here as you begin your Family Pledge journey.</Text></AppCard>
      )}

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Remaining Badges ({remaining.length})</Text>
      <Text style={styles.helper}>Each badge shows the requirement and your current progress.</Text>
      <View style={styles.grid}>{remaining.map((item) => <AchievementCard key={item.key} item={item} locked />)}</View>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function AchievementCard({ item, locked = false }: { item: Achievement; locked?: boolean }) {
  const percent = Math.min(100, Math.round((item.progress / Math.max(item.target, 1)) * 100));
  return (
    <View style={[styles.badgeCard, locked && styles.lockedCard]}>
      <View style={[styles.iconCircle, locked && styles.lockedIcon]}>
        <Ionicons name={(locked ? 'lock-closed' : item.icon) as any} size={28} color={locked ? Colors.gray[500] : Colors.primary} />
      </View>
      <Text style={[styles.badgeName, locked && styles.lockedText]}>{item.name}</Text>
      <Text style={styles.badgeDescription}>{item.description}</Text>
      <View style={styles.track}><View style={[styles.fill, { width: `${percent}%` }]} /></View>
      <Text style={styles.progress}>{item.progress} / {item.target}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 16, paddingBottom: 40 },
  hero: { backgroundColor: Colors.primaryDark, borderRadius: 24, padding: 22, alignItems: 'center', marginBottom: 22 },
  heroTitle: { marginTop: 8, fontSize: 25, fontWeight: '900', color: Colors.white },
  heroText: { marginTop: 6, fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,.8)', textAlign: 'center' },
  heroStats: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  stat: { alignItems: 'center' }, statValue: { fontSize: 26, fontWeight: '900', color: Colors.goldLight }, statLabel: { fontSize: 11, color: 'rgba(255,255,255,.78)' }, divider: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,.22)' },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: Colors.text.primary, marginBottom: 6 },
  helper: { fontSize: 12, color: Colors.text.muted, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: { width: '48%', backgroundColor: Colors.white, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: Colors.border.light, minHeight: 220 },
  lockedCard: { backgroundColor: Colors.gray[50] },
  iconCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#E8F1F5', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  lockedIcon: { backgroundColor: Colors.gray[200] }, badgeName: { fontSize: 15, fontWeight: '900', color: Colors.text.primary }, lockedText: { color: Colors.gray[700] }, badgeDescription: { marginTop: 5, flex: 1, fontSize: 11, lineHeight: 16, color: Colors.text.secondary },
  track: { height: 6, backgroundColor: Colors.gray[200], borderRadius: 6, overflow: 'hidden', marginTop: 12 }, fill: { height: 6, backgroundColor: Colors.primary, borderRadius: 6 }, progress: { marginTop: 5, fontSize: 10, color: Colors.text.muted },
  emptyCard: { marginBottom: 8 }, emptyText: { textAlign: 'center', color: Colors.text.muted, lineHeight: 19 },
});
