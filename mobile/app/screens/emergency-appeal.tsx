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

export default function EmergencyAppealScreen() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const campaigns = await getCampaigns('emergency');
      setCampaign(campaigns[0] || null);
    } catch {
      const mock = MOCK_CAMPAIGNS.find((c) => c.type === 'emergency');
      setCampaign(mock || null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingState fullScreen message="Loading emergency appeal..." />;
  if (!campaign) return null;

  const pct = Math.min(Math.round((campaign.current_donors / campaign.target_donors) * 100), 100);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.emergency} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Urgent Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerIconRow}>
          <Ionicons name="alert-circle" size={24} color={Colors.white} />
          <Text style={styles.bannerTag}>EMERGENCY APPEAL</Text>
        </View>
        <Text style={styles.bannerTitle}>{campaign.title}</Text>
        <Text style={styles.bannerSub}>Urgent humanitarian support needed in Gaza</Text>
      </View>

      {/* Progress */}
      <AppCard style={styles.card}>
        <Text style={styles.cardTitle}>Appeal Progress</Text>
        <View style={styles.statsRow}>
          <StatBlock value={campaign.current_donors} label="Donors Responded" color={Colors.emergency} />
          <StatBlock value={campaign.target_donors} label="Target Donors" color={Colors.primary} />
          <StatBlock value={`${pct}%`} label="Complete" color={Colors.gold} />
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
        </View>
        {campaign.raised_amount && campaign.target_amount && (
          <Text style={styles.amountText}>
            ${campaign.raised_amount.toLocaleString()} raised of ${campaign.target_amount.toLocaleString()} goal
          </Text>
        )}
      </AppCard>

      {/* Description */}
      <AppCard style={styles.card}>
        <Text style={styles.cardTitle}>About This Appeal</Text>
        <Text style={styles.cardDesc}>{campaign.description}</Text>
      </AppCard>

      {/* Why Urgent */}
      <AppCard style={[styles.card, { backgroundColor: '#FEF2F2' }]} borderColor={Colors.emergency}>
        <View style={styles.urgentRow}>
          <Ionicons name="time" size={18} color={Colors.emergency} />
          <Text style={styles.urgentTitle}>Why Now?</Text>
        </View>
        <Text style={styles.urgentText}>
          The situation in Gaza requires immediate response. Every hour counts. Your USD 10 pledge, combined with hundreds of others, can fund urgent medical supplies, food packs, and emergency shelter.
        </Text>
      </AppCard>

      {/* Impact */}
      <AppCard style={styles.card}>
        <Text style={styles.cardTitle}>What Your USD 10 Provides</Text>
        <ImpactItem icon="restaurant" text="2 days of food for a family" />
        <ImpactItem icon="medical" text="Basic medical supplies" />
        <ImpactItem icon="water" text="Clean water for 3 days" />
        <ImpactItem icon="home" text="Emergency blankets for a family" />
      </AppCard>

      {/* Actions */}
      <View style={styles.actions}>
        <AppButton
          title="Respond Now — USD 10"
          onPress={() => router.push('/screens/contribute')}
          variant="emergency"
          icon={<Ionicons name="heart" size={18} color={Colors.white} />}
        />
        <View style={{ height: 12 }} />
        <AppButton
          title="Share Appeal"
          onPress={() => {}}
          variant="outline"
          icon={<Ionicons name="share-outline" size={18} color={Colors.primary} />}
        />
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function StatBlock({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={[styles.statValue, { color }]}>{typeof value === 'number' ? value.toLocaleString() : value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ImpactItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.impactItem}>
      <View style={styles.impactIcon}>
        <Ionicons name={icon as any} size={18} color={Colors.primary} />
      </View>
      <Text style={styles.impactText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingBottom: 32 },
  banner: {
    backgroundColor: Colors.emergency,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 32,
    marginBottom: 16,
  },
  bannerIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  bannerTag: { color: Colors.white, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  bannerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white, marginBottom: 6, lineHeight: 30 },
  bannerSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  card: { marginHorizontal: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary, marginBottom: 14 },
  cardDesc: { fontSize: 14, color: Colors.text.secondary, lineHeight: 22 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  statBlock: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 11, color: Colors.text.secondary, textAlign: 'center', fontWeight: '500' },
  progressBar: { height: 10, backgroundColor: Colors.gray[200], borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: Colors.emergency, borderRadius: 5 },
  amountText: { fontSize: 13, color: Colors.text.secondary, textAlign: 'center', marginTop: 4 },
  urgentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  urgentTitle: { fontSize: 15, fontWeight: '700', color: Colors.emergency },
  urgentText: { fontSize: 13, color: Colors.text.secondary, lineHeight: 22 },
  impactItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  impactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  impactText: { fontSize: 14, color: Colors.text.secondary, fontWeight: '500', flex: 1 },
  actions: { paddingHorizontal: 16 },
});
