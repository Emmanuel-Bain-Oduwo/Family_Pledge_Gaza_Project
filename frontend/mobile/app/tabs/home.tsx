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
import FamilyPledgeLogo from '../../components/FamilyPledgeLogo';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { getDashboard } from '../../services/api';
import { getUser, saveUser } from '../../services/auth';
import { updateNotificationPreferences } from '../../services/notificationPreferences';
import { Dashboard, User } from '../../types';
import { MOCK_DASHBOARD } from '../../constants/mockData';

export default function HomeScreen() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [dash, storedUser] = await Promise.all([getDashboard(), getUser()]);
      setDashboard(dash);
      const currentUser = dash.user || storedUser;
      setUser(currentUser);
      if (dash.user) await saveUser(dash.user);
    } catch {
      if (__DEV__) {
        setDashboard(MOCK_DASHBOARD);
        setUser(MOCK_DASHBOARD.user);
      } else {
        setDashboard(null);
        setError('We could not reach the Family Pledge service. No demo or fabricated campaign data is shown in the release app.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const retry = () => {
    setLoading(true);
    load();
  };

  const dismissNotificationIntro = async () => {
    try {
      const updated = await updateNotificationPreferences({
        daily: false,
        friday: false,
        campaigns: false,
        emergency: false,
        quran: false,
        hadith: false,
        dua: false,
        motivation: false,
        impact: false,
        humanitarian: false,
        onboarding_seen: true,
      });
      setUser(updated);
      await saveUser(updated);
    } catch {
      // Keep the intro visible so the user can retry later.
    }
  };

  const greeting = () => 'Assalamu alaykum';

  if (loading) return <LoadingState fullScreen message="Loading your dashboard..." />;
  if (error && !dashboard) return <ErrorState message={error} onRetry={retry} />;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.brandHero}>
        <FamilyPledgeLogo compact />
        <Text style={styles.brandTitle}>Family Pledge</Text>
        <Text style={styles.brandMessage}>A family covenant for Palestine — pledge, remember, share, and support with mercy.</Text>
      </View>

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

      {user && !user.notification_onboarding_seen && (
        <View style={styles.notificationIntro}>
          <View style={styles.notificationIntroIcon}>
            <Ionicons name="notifications-outline" size={22} color={Colors.primary} />
          </View>
          <View style={styles.notificationIntroBody}>
            <Text style={styles.notificationIntroTitle}>Stay connected with Family Pledge</Text>
            <Text style={styles.notificationIntroText}>Choose Daily, Friday, Campaign and Emergency notifications before the phone asks for permission.</Text>
            <View style={styles.notificationIntroActions}>
              <TouchableOpacity style={styles.enableButton} onPress={() => router.push('/screens/notification-preferences')}>
                <Text style={styles.enableButtonText}>Choose Notifications</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={dismissNotificationIntro}>
                <Text style={styles.notNowText}>Not now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {dashboard && (
        <PledgeStatusCard
          status={dashboard.pledge_status}
          donorNumber={dashboard.donor_number}
          totalDonors={dashboard.total_donors_today}
        />
      )}

      {dashboard?.emergency_appeal && (
        <EmergencyBanner
          campaign={dashboard.emergency_appeal}
          onPress={() => router.push('/screens/emergency-appeal')}
        />
      )}

      {(dashboard?.active_campaign?.type === 'friday_challenge' || dashboard?.active_campaign?.campaign_type === 'friday') && (
        <Section title="Friday Challenge" icon="flash" onPress={() => router.push('/screens/friday-challenge')}>
          <CampaignProgressCard
            campaign={dashboard.active_campaign}
            onContribute={() => router.push('/screens/contribute')}
          />
        </Section>
      )}

      {dashboard?.monthly_progress && (
        <Section title="This Month's Pledge Progress" icon="bar-chart-outline">
          <View style={styles.monthlyCard}>
            <View style={styles.monthlyRow}>
              <Text style={styles.monthlyCount}>Community progress</Text>
              <Text style={styles.monthlyTarget}>
                {Math.round(Math.min((dashboard.monthly_progress.current / dashboard.monthly_progress.target) * 100, 100))}%
              </Text>
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

      {dashboard?.latest_impact && (
        <Section title="Latest Impact" icon="heart-circle-outline" onPress={() => router.push('/screens/updates')}>
          <ImpactCard impact={dashboard.latest_impact} />
        </Section>
      )}

      {dashboard?.latest_reminder && (
        <Section title="Today's Reminder" icon="moon-outline" onPress={() => router.push('/tabs/reminders')}>
          <ReminderCard reminder={dashboard.latest_reminder} />
        </Section>
      )}

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

function Section({ title, icon, onPress, children }: { title: string; icon: string; onPress?: () => void; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.sectionHeader} activeOpacity={onPress ? 0.7 : 1}>
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

function QuickAction({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
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
  content: { paddingBottom: 24, paddingTop: 14 },
  brandHero: { marginHorizontal: 16, marginBottom: 14, borderRadius: 28, padding: 18, backgroundColor: Colors.white, alignItems: 'center', shadowColor: Colors.primaryDark, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 },
  brandTitle: { marginTop: 8, fontSize: 24, fontWeight: '900', color: Colors.primary },
  brandMessage: { marginTop: 6, fontSize: 13, lineHeight: 19, textAlign: 'center', color: Colors.text.secondary, fontWeight: '600' },
  greetingSection: { backgroundColor: Colors.primaryDark, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  greeting: { fontSize: 20, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  greetingSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '400' },
  notifBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  notificationIntro: { marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 16, backgroundColor: Colors.white, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: Colors.border.light },
  notificationIntroIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gray[50] },
  notificationIntroBody: { flex: 1 },
  notificationIntroTitle: { fontSize: 14, fontWeight: '800', color: Colors.text.primary },
  notificationIntroText: { marginTop: 4, fontSize: 12, lineHeight: 17, color: Colors.text.secondary },
  notificationIntroActions: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 14 },
  enableButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.primary, borderRadius: 10 },
  enableButtonText: { color: Colors.white, fontSize: 12, fontWeight: '800' },
  notNowText: { color: Colors.text.secondary, fontSize: 12, fontWeight: '700' },
  section: { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  monthlyCard: { marginHorizontal: 16, backgroundColor: Colors.white, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  monthlyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  monthlyCount: { fontSize: 14, color: Colors.text.secondary, fontWeight: '500' },
  monthlyTarget: { fontSize: 26, fontWeight: '900', color: Colors.pinkDark },
  progressBar: { height: 10, backgroundColor: Colors.gray[200], borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primaryDark, borderRadius: 5 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12 },
  qaItem: { alignItems: 'center', gap: 8, width: '21%', flexGrow: 1 },
  qaIcon: { width: 58, height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontSize: 12, fontWeight: '600', color: Colors.text.secondary, textAlign: 'center' },
});
