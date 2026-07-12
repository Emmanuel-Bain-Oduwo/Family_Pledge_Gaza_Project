import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Share,
  TouchableOpacity,
  FlatList,
  Alert,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import CollectorStatsCard from '../../components/CollectorStatsCard';
import LoadingState from '../../components/LoadingState';
import { getCollectorDashboard } from '../../services/api';
import { CollectorDashboard, CircleMember } from '../../types';
import { MOCK_COLLECTOR } from '../../constants/mockData';

const STATUS_COLOR: Record<string, string> = {
  paid: Colors.success,
  pending: Colors.warning,
  missed: Colors.emergency,
  free_participant: Colors.primary,
  none: Colors.gray[400],
};

export default function CollectorDashboardScreen() {
  const [data, setData] = useState<CollectorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await getCollectorDashboard();
      setData(d);
    } catch {
      setData(MOCK_COLLECTOR);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleShareInvite = async () => {
    if (!data) return;
    await Share.share({
      message: `Join my Family Pledge circle for Gaza relief! 🌙\n\nUse my collector code: ${data.collector_code}\n\nSign up at familypledge.org — sign free or pledge USD 10/month for Palestine family support.\n\nOr use my invite link: ${data.invite_link}`,
    });
  };

  const handleCopyCode = () => {
    if (!data) return;
    Clipboard.setString(data.collector_code);
    Alert.alert('Copied!', `Code ${data.collector_code} copied to clipboard.`);
  };

  const handleSendReminder = () => {
    Share.share({
      message: `As-salamu alaykum! 🌙\n\nThis is a gentle reminder to renew this month's Family Pledge or keep sharing awareness for Palestine.\n\nJazakallahu Khayran for your support of Gaza relief.\n\n— Your Family Pledge Collector`,
    });
  };

  if (loading) return <LoadingState fullScreen message="Loading collector dashboard..." />;
  if (!data) return null;

  const activePercent = data.total_registered ? Math.round((data.contributed_this_month / data.total_registered) * 100) : 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="people" size={28} color={Colors.gold} />
        <Text style={styles.headerTitle}>Collector Dashboard</Text>
        <Text style={styles.headerSub}>Manage your donor circle</Text>
      </View>

      {/* Stats */}
      <CollectorStatsCard
        totalRegistered={data.total_registered}
        contributedThisMonth={data.contributed_this_month}
        pending={data.pending_this_month}
      />

      <AppCard style={styles.motivationCard}>
        <Text style={styles.motivationTitle}>May Allah reward your effort</Text>
        <Text style={styles.motivationText}>Your invitation helped {data.total_registered} people join your circle. {activePercent}% are active this month — keep inviting with mercy and sincerity.</Text>
      </AppCard>

      {/* Collector Code */}
      <AppCard style={styles.card}>
        <Text style={styles.cardTitle}>Your Collector Code</Text>
        <TouchableOpacity onPress={handleCopyCode} activeOpacity={0.8} style={styles.codeBox}>
          <Text style={styles.codeText}>{data.collector_code}</Text>
          <Ionicons name="copy-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.codeDesc}>Share this code with donors to link them to your circle.</Text>
      </AppCard>

      {/* Actions */}
      <View style={styles.actionRow}>
        <AppButton
          title="Share Invite"
          onPress={handleShareInvite}
          icon={<Ionicons name="share-social-outline" size={16} color={Colors.white} />}
          style={styles.halfBtn}
          fullWidth={false}
        />
        <AppButton
          title="Send Reminder"
          onPress={handleSendReminder}
          variant="outline"
          icon={<Ionicons name="notifications-outline" size={16} color={Colors.primary} />}
          style={styles.halfBtn}
          fullWidth={false}
        />
      </View>

      {/* Members */}
      <View style={styles.membersSection}>
        <Text style={styles.sectionTitle}>Circle Members ({data.total_registered})</Text>
        <AppCard style={styles.membersCard} padding={0}>
          {data.circle_members.slice(0, 10).map((member, i) => (
            <View key={member.id}>
              <MemberRow member={member} />
              {i < Math.min(data.circle_members.length - 1, 9) && (
                <View style={styles.divider} />
              )}
            </View>
          ))}
          {data.circle_members.length === 0 && (
            <View style={styles.emptyMembers}>
              <Ionicons name="people-outline" size={32} color={Colors.gray[300]} />
              <Text style={styles.emptyMembersText}>No members yet. Share your code!</Text>
            </View>
          )}
        </AppCard>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function MemberRow({ member }: { member: CircleMember }) {
  const initial = member.display_name.charAt(0).toUpperCase();
  const color = STATUS_COLOR[member.pledge_status] || Colors.gray[400];
  return (
    <View style={styles.memberRow}>
      <View style={[styles.memberAvatar, { backgroundColor: color + '20' }]}>
        <Text style={[styles.memberInitial, { color }]}>{initial}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.display_name}</Text>
        <Text style={styles.memberDate}>
          Joined {new Date(member.joined_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
      </View>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingBottom: 32 },
  header: {
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 28,
    gap: 6,
    marginBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  motivationCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.softPinkBg, borderColor: Colors.pinkLight },
  motivationTitle: { fontSize: 16, fontWeight: '900', color: Colors.pinkDark, marginBottom: 6 },
  motivationText: { fontSize: 13, lineHeight: 20, color: Colors.text.secondary, fontWeight: '600' },
  card: { marginHorizontal: 16, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text.primary, marginBottom: 12 },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary + '10',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  codeText: { fontSize: 20, fontWeight: '800', color: Colors.primary, letterSpacing: 4 },
  codeDesc: { fontSize: 12, color: Colors.text.secondary },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 24 },
  halfBtn: { flex: 1 },
  membersSection: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary, marginBottom: 12 },
  membersCard: {},
  memberRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  memberInitial: { fontSize: 16, fontWeight: '700' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, marginBottom: 2 },
  memberDate: { fontSize: 12, color: Colors.text.secondary },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  divider: { height: 1, backgroundColor: Colors.border.light, marginHorizontal: 14 },
  emptyMembers: { alignItems: 'center', padding: 32, gap: 10 },
  emptyMembersText: { fontSize: 14, color: Colors.text.muted },
});
