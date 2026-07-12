import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import LoadingState from '../../components/LoadingState';
import { getCampaigns } from '../../services/api';
import { Campaign } from '../../types';
import { MOCK_CAMPAIGNS } from '../../constants/mockData';
import { shareText } from '../../services/webCompat';

const GOAL = 200;

export default function FridayChallengeScreen() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const campaigns = await getCampaigns('friday_challenge');
      setCampaign(campaigns[0] || null);
    } catch {
      const mock = MOCK_CAMPAIGNS.find((c) => c.type === 'friday_challenge');
      setCampaign(mock || null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleShare = async () => {
    await shareText(`🕌 Friday Challenge for Gaza!\n\nJoin me in pledging USD 10 this month for Gaza relief.\n\nOur goal: ${GOAL} donors today.\nCurrent: ${campaign?.current_donors || 0} donors.\n\nSign up at familypledge.org and make a difference!\n\n#FamilyPledge #GazaRelief #NAMLEF`, 'Friday Challenge');
  };

  if (loading) return <LoadingState fullScreen message="Loading Friday Challenge..." />;

  const current = campaign?.current_donors || 0;
  const pct = Math.min(Math.round((current / GOAL) * 100), 100);
  const remaining = Math.max(GOAL - current, 0);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroArabic}>يَوْمُ الجُمُعَة</Text>
        <Text style={styles.heroTitle}>Friday Challenge</Text>
        <Text style={styles.heroSub}>Mobilise 200 donors every Friday for Gaza</Text>
      </View>

      {/* Progress */}
      <AppCard style={styles.progressCard}>
        <View style={styles.goalRow}>
          <View style={styles.goalStat}>
            <Text style={styles.goalNum}>{current}</Text>
            <Text style={styles.goalLabel}>Current Donors</Text>
          </View>
          <View style={styles.goalDivider} />
          <View style={styles.goalStat}>
            <Text style={styles.goalNum}>{GOAL}</Text>
            <Text style={styles.goalLabel}>Weekly Goal</Text>
          </View>
          <View style={styles.goalDivider} />
          <View style={styles.goalStat}>
            <Text style={[styles.goalNum, { color: Colors.emergency }]}>{remaining}</Text>
            <Text style={styles.goalLabel}>Still Needed</Text>
          </View>
        </View>

        <View style={styles.progressBarWrap}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
          </View>
          <Text style={styles.pct}>{pct}%</Text>
        </View>

        {pct >= 100 && (
          <View style={styles.goalReached}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.goalReachedText}>Goal Reached! Alhamdulillah 🎉</Text>
          </View>
        )}
      </AppCard>

      {/* Campaign Description */}
      {campaign?.description && (
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>{campaign.title}</Text>
          <Text style={styles.cardDesc}>{campaign.description}</Text>
        </AppCard>
      )}

      {/* Why Friday? */}
      <AppCard style={[styles.card, { backgroundColor: Colors.primaryDark }]}>
        <View style={styles.whyRow}>
          <Ionicons name="moon" size={20} color={Colors.gold} />
          <Text style={styles.whyTitle}>Why Friday?</Text>
        </View>
        <Text style={styles.whyText}>
          Friday (Jumu'ah) is the best day of the week in Islam. The Prophet ﷺ said: "The best day on which the sun rises is Friday." By mobilising donors every Friday, we create a consistent weekly flow of support for Gaza.
        </Text>
      </AppCard>

      {/* Actions */}
      <View style={styles.actions}>
        <AppButton
          title="Contribute Now — USD 10"
          onPress={() => router.push('/screens/contribute')}
          variant="gold"
          icon={<Ionicons name="heart" size={18} color={Colors.primaryDark} />}
        />
        <View style={{ height: 12 }} />
        <AppButton
          title="Share the Challenge"
          onPress={handleShare}
          variant="outline"
          icon={<Ionicons name="share-social-outline" size={18} color={Colors.primary} />}
        />
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingBottom: 32 },
  hero: {
    backgroundColor: Colors.gold,
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  heroArabic: { fontSize: 26, color: Colors.primaryDark, fontWeight: '600', marginBottom: 4 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: Colors.primaryDark, marginBottom: 4 },
  heroSub: { fontSize: 14, color: Colors.primaryDark, opacity: 0.8, textAlign: 'center' },
  progressCard: { marginHorizontal: 16, marginBottom: 16 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  goalStat: { flex: 1, alignItems: 'center' },
  goalNum: { fontSize: 28, fontWeight: '800', color: Colors.primary, marginBottom: 2 },
  goalLabel: { fontSize: 11, color: Colors.text.secondary, fontWeight: '500', textAlign: 'center' },
  goalDivider: { width: 1, backgroundColor: Colors.border.light },
  progressBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressBar: { flex: 1, height: 14, backgroundColor: Colors.gray[200], borderRadius: 7, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.gold, borderRadius: 7 },
  pct: { fontSize: 16, fontWeight: '800', color: Colors.gold },
  goalReached: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  goalReachedText: { fontSize: 14, fontWeight: '700', color: Colors.success },
  card: { marginHorizontal: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary, marginBottom: 8 },
  cardDesc: { fontSize: 14, color: Colors.text.secondary, lineHeight: 22 },
  whyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  whyTitle: { fontSize: 16, fontWeight: '700', color: Colors.gold },
  whyText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 22 },
  actions: { paddingHorizontal: 16 },
});
