import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import PledgeStatusCard from '../../components/PledgeStatusCard';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import { getPledgeStatus, getMyPledges, updateAnonymousPreference, updatePledge } from '../../services/api';
import { getUser, saveUser } from '../../services/auth';
import { Pledge, PledgeStatus, PledgeStatusOut, User } from '../../types';
import { MOCK_PLEDGE_STATUS } from '../../constants/mockData';

const STATUS_LABEL: Record<string, string> = {
  paid: 'Paid',
  pending: 'Pending',
  missed: 'Missed',
  free_participant: 'Free Participant',
  none: 'No Pledge',
};

const STATUS_COLOR: Record<string, string> = {
  paid: Colors.success,
  pending: Colors.warning,
  missed: Colors.emergency,
  free_participant: Colors.primary,
  none: Colors.gray[400],
};

function derivePledgeStatusStr(statusOut: PledgeStatusOut): PledgeStatus {
  if (!statusOut.has_active_pledge) return 'none';
  if (statusOut.pledge?.pledge_type === 'free_participant') return 'free_participant';
  return statusOut.current_month_contributed ? 'paid' : 'pending';
}

export default function PledgeScreen() {
  const [pledgeStatus, setPledgeStatus] = useState<PledgeStatusOut | null>(null);
  const [displayStatus, setDisplayStatus] = useState<PledgeStatus>('none');
  const [history, setHistory] = useState<Pledge[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingAnon, setUpdatingAnon] = useState(false);
  const [updatingPledge, setUpdatingPledge] = useState(false);

  const load = useCallback(async () => {
    try {
      const [statusOut, pledgeList, u] = await Promise.all([
        getPledgeStatus(),
        getMyPledges(),
        getUser(),
      ]);
      setPledgeStatus(statusOut);
      setDisplayStatus(derivePledgeStatusStr(statusOut));
      setHistory(pledgeList);
      setUser(u);
    } catch {
      const mock = MOCK_PLEDGE_STATUS;
      setPledgeStatus(null);
      setDisplayStatus(mock.pledge?.status as PledgeStatus || 'none');
      setHistory(mock.history || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleAnonymous = async (val: boolean) => {
    if (!user) return;
    setUpdatingAnon(true);
    try {
      const updated = await updateAnonymousPreference(val);
      setUser(updated);
      await saveUser(updated);
    } catch {
      Alert.alert('Error', 'Could not update preference. Please try again.');
    } finally {
      setUpdatingAnon(false);
    }
  };

  const increasePledge = async (amount: number) => {
    const pledgeId = pledgeStatus?.pledge?.id || history.find((p) => p.status === 'active')?.id;
    if (!pledgeId) {
      router.push('/screens/contribute');
      return;
    }
    setUpdatingPledge(true);
    try {
      await updatePledge(pledgeId, { amount });
      Alert.alert('Pledge Updated', `Your monthly pledge is now USD ${amount}. May Allah reward your intention.`);
      await load();
    } catch {
      Alert.alert('Could not update pledge', 'Please try again or use the contribution screen for an open amount.');
    } finally {
      setUpdatingPledge(false);
    }
  };

  if (loading) return <LoadingState fullScreen message="Loading pledge status..." />;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Pledge Summary */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>Monthly Pledge Amount</Text>
            <Text style={styles.heroAmount}>USD {pledgeStatus?.pledge?.amount ?? 10}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[displayStatus] + '22' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLOR[displayStatus] }]}>
              {STATUS_LABEL[displayStatus]}
            </Text>
          </View>
        </View>
        {pledgeStatus?.current_month_contributed && (
          <View style={styles.paidRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.paidText}>
              Contributed this month ({pledgeStatus.confirmed_contributions_count} total confirmed)
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <AppButton
          title="Contribute Now"
          onPress={() => router.push('/screens/contribute')}
          icon={<Ionicons name="cash-outline" size={18} color={Colors.white} />}
        />
        <View style={{ height: 12 }} />
        <AppButton
          title="View All Campaigns"
          onPress={() => router.push('/tabs/campaigns')}
          variant="outline"
          icon={<Ionicons name="megaphone-outline" size={18} color={Colors.primary} />}
        />
      </View>

      <AppCard style={styles.increaseCard} borderColor={Colors.pink}>
        <View style={styles.increaseHeader}>
          <Ionicons name="trending-up-outline" size={20} color={Colors.pinkDark} />
          <Text style={styles.increaseTitle}>Increase or change your pledge</Text>
        </View>
        <Text style={styles.increaseDesc}>
          Choose a higher monthly pledge here, or use the contribution screen for a custom open amount.
        </Text>
        <View style={styles.increaseActions}>
          {[20, 50].map((amount) => (
            <AppButton
              key={amount}
              title={`USD ${amount}`}
              onPress={() => increasePledge(amount)}
              loading={updatingPledge}
              variant="outline"
              style={styles.increaseButton}
            />
          ))}
        </View>
        <AppButton
          title="Open amount"
          onPress={() => router.push('/screens/contribute')}
          variant="secondary"
          style={{ marginTop: 10 }}
        />
      </AppCard>

      {/* Anonymous Toggle */}
      <AppCard style={styles.anonCard}>
        <View style={styles.anonRow}>
          <View style={styles.anonInfo}>
            <Ionicons name="eye-off-outline" size={20} color={Colors.primary} style={styles.anonIcon} />
            <View>
              <Text style={styles.anonLabel}>Anonymous Publicly</Text>
              <Text style={styles.anonDesc}>Your name won't show in public donor lists</Text>
            </View>
          </View>
          <Switch
            value={user?.anonymous_publicly ?? false}
            onValueChange={toggleAnonymous}
            disabled={updatingAnon}
            trackColor={{ false: Colors.gray[300], true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>
      </AppCard>

      {/* Pledge History */}
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Pledge History</Text>
        {history.length === 0 ? (
          <EmptyState
            icon="time-outline"
            title="No History Yet"
            description="Your monthly pledge history will appear here."
          />
        ) : (
          <AppCard style={styles.historyCard} shadow>
            {history.map((p, i) => {
              const startDate = p.start_date ? new Date(p.start_date) : null;
              const monthLabel = startDate
                ? startDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
                : '—';
              const dotColor = p.status === 'active' ? Colors.success : p.status === 'paused' ? Colors.warning : Colors.gray[400];
              return (
                <View key={p.id}>
                  <View style={styles.historyRow}>
                    <View style={styles.historyLeft}>
                      <View style={[styles.historyDot, { backgroundColor: dotColor }]} />
                      <View>
                        <Text style={styles.historyMonth}>{monthLabel}</Text>
                      </View>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyAmount}>${p.amount} {p.currency}</Text>
                      <Text style={[styles.historyStatus, { color: dotColor }]}>
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  {i < history.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </AppCard>
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 16, paddingTop: 20 },
  heroCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.gold,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  paidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  paidText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  actions: { marginBottom: 16 },
  increaseCard: { marginBottom: 16 },
  increaseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  increaseTitle: { fontSize: 16, fontWeight: '800', color: Colors.text.primary },
  increaseDesc: { fontSize: 13, color: Colors.text.secondary, lineHeight: 19, marginBottom: 12 },
  increaseActions: { flexDirection: 'row', gap: 10 },
  increaseButton: { flex: 1 },
  anonCard: { marginBottom: 24 },
  anonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  anonInfo: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, gap: 12 },
  anonIcon: { marginTop: 2 },
  anonLabel: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, marginBottom: 2 },
  anonDesc: { fontSize: 12, color: Colors.text.secondary, lineHeight: 17 },
  historySection: {},
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  historyCard: { padding: 0 },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyDot: { width: 10, height: 10, borderRadius: 5 },
  historyMonth: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  historyRef: { fontSize: 12, color: Colors.text.secondary, marginTop: 2 },
  historyRight: { alignItems: 'flex-end' },
  historyAmount: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  historyStatus: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border.light, marginHorizontal: 16 },
});
