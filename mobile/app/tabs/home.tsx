import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import PledgeStatusCard from '../../components/PledgeStatusCard';
import CampaignProgressCard from '../../components/CampaignProgressCard';
import EmergencyBanner from '../../components/EmergencyBanner';
import ImpactCard from '../../components/ImpactCard';
import ReminderCard from '../../components/ReminderCard';
import LoadingState from '../../components/LoadingState';
import { getDashboard } from '../../services/api';
import { getUser } from '../../services/auth';
import { registerForPushNotifications } from '../../services/notifications';
import { Dashboard, User } from '../../types';
import { MOCK_DASHBOARD } from '../../constants/mockData';

export default function HomeScreen() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [dash, storedUser] = await Promise.all([getDashboard(), getUser()]);
      setDashboard(dash);
      setUser(storedUser);
    } catch {
      setDashboard(MOCK_DASHBOARD);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    registerForPushNotifications().catch(() => {});
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) return <LoadingState fullScreen message="Loading your dashboard..." />;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <View style={styles.greetingSection}>
        <View>
          <Text style={styles.greeting}>
            {greeting()},{' '}
            {user?.nickname || user?.full_name?.split(' ')[0] || 'Donor'} 🌙
          </Text>
          <Text style={styles.greetingSub}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/screens/notifications')} style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Pledge Status */}
      {dashboard && (
        <PledgeStatusCard
          status={dashboard.pledge_status}
          donorNumber={dashboard.donor_number}
          totalDonors={dashboard.total_donors_today}
        />
      )}

      {/* Emergency Appeal */}
      {dashboard?.emergency_appeal && (
        <EmergencyBanner
          campaign={dashboard.emergency_appeal}
          onPress={() => router.push('/screens/emergency-appeal')}
        />
      )}

      {/* Friday Challenge */}
      {dashboard?.active_campaign?.type === 'friday_challenge' && (
        <Section title="Friday Challenge" icon="flash" onPress={() => router.push('/screens/friday-challenge')}>
          <CampaignProgressCard
            campaign={dashboard.active_campaign}
            onContribute={() => router.push('/screens/contribute')}
          />
        </Section>
      )}

      {/* Monthly Progress */}
      {dashboard?.monthly_progress && (
        <Section title="This Month's Progress" icon="bar-chart-outline">
          <View style={styles.monthlyCard}>
            <View style={styles.monthlyRow}>
              <Text style={styles.monthlyCount}>
                <Text style={styles.monthlyNum}>{dashboard.monthly_progress.current}</Text>
                {'  '}donors
              </Text>
              <Text style={styles.monthlyTarget}>Goal: {dashboard.monthly_progress.target}</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      (dashboard.monthly_progress.current / dashboard.monthly_progress.target) * 100,
                      100
                    )}%` as any,
                  },
                ]}
              />
            </View>
          </View>
        </Section>
      )}

      {/* Latest Impact */}
      {dashboard?.latest_impact && (
        <Section title="Latest Impact" icon="heart-circle-outline" onPress={() => router.push('/screens/updates')}>
          <ImpactCard impact={dashboard.latest_impact} />
        </Section>
      )}

      {/* Latest Reminder */}
      {dashboard?.latest_reminder && (
        <Section title="Today's Reminder" icon="moon-outline" onPress={() => router.push('/tabs/reminders')}>
          <ReminderCard reminder={dashboard.latest_reminder} />
        </Section>
      )}

      {/* Quick Actions */}
      <Section title="Quick Actions" icon="grid-outline">
        <View style={styles.quickActions}>
          <QuickAction icon="cash-outline" label="Contribute" color={Colors.primary} onPress={() => router.push('/screens/contribute')} />
          <QuickAction icon="megaphone-outline" label="Campaigns" color={Colors.gold} onPress={() => router.push('/tabs/campaigns')} />
          <QuickAction icon="bar-chart-outline" label="Updates" color={Colors.primaryLight} onPress={() => router.push('/screens/updates')} />
          <QuickAction icon="information-circle-outline" label="NAMLEF" color={Colors.primaryDark} onPress={() => router.push('/screens/namlef')} />
        </View>
      </Section>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function Section({
  title,
  icon,
  onPress,
  children,
}: {
  title: string;
  icon: string;
  onPress?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <TouchableOpacity
        onPress={onPress}
        disabled={!onPress}
        style={styles.sectionHeader}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={styles.sectionTitleRow}>
          <Ionicons name={icon as any} size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {onPress && <Ionicons name="chevron-forward" size={18} color={Colors.gray[400]} />}
      </TouchableOpacity>
      {children}
    </View>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.qaItem}>
      <View style={[styles.qaIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.qaLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingBottom: 24 },
  greetingSection: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: -12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  greetingSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '400',
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  monthlyCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  monthlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthlyCount: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  monthlyNum: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  monthlyTarget: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  progressBar: {
    height: 10,
    backgroundColor: Colors.gray[200],
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 5,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  qaItem: {
    alignItems: 'center',
    gap: 8,
    width: '21%',
    flexGrow: 1,
  },
  qaIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
