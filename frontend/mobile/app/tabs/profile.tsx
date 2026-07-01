import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import BadgeCard from '../../components/BadgeCard';
import LoadingState from '../../components/LoadingState';
import { getMe, updateAnonymousPreference } from '../../services/api';
import { getUser, saveUser, logout } from '../../services/auth';
import { User } from '../../types';
import { MOCK_USER } from '../../constants/mockData';

const STATUS_COLOR: Record<string, string> = {
  paid: Colors.success,
  pending: Colors.warning,
  missed: Colors.emergency,
  free_participant: Colors.primary,
  none: Colors.gray[400],
};
const STATUS_LABEL: Record<string, string> = {
  paid: 'Paid ✓',
  pending: 'Pending',
  missed: 'Missed',
  free_participant: 'Free Participant',
  none: 'No Pledge',
};

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingAnon, setUpdatingAnon] = useState(false);

  const load = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
      await saveUser(me);
    } catch {
      const stored = await getUser();
      setUser(stored || MOCK_USER);
    } finally {
      setLoading(false);
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
      Alert.alert('Error', 'Could not update preference.');
    } finally {
      setUpdatingAnon(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  if (loading) return <LoadingState fullScreen message="Loading profile..." />;
  if (!user) return null;

  const initial = (user.nickname || user.full_name || 'D').charAt(0).toUpperCase();
  const pledgeStatus = user.pledge_status || 'none';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.displayName}>{user.nickname || user.full_name}</Text>
        <Text style={styles.fullName}>{user.full_name}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={Colors.gold} />
          <Text style={styles.locationText}>{user.city ? `${user.city}, ` : ''}{user.country}</Text>
        </View>
        {user.donor_number && (
          <View style={styles.donorBadge}>
            <Text style={styles.donorBadgeText}>Donor #{user.donor_number}</Text>
          </View>
        )}
      </View>

      {/* Pledge Status */}
      <AppCard style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardLabel}>
            <Ionicons name="heart" size={18} color={Colors.primary} />
            <Text style={styles.cardLabelText}>Pledge Status</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[pledgeStatus] + '20' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLOR[pledgeStatus] }]}>
              {STATUS_LABEL[pledgeStatus]}
            </Text>
          </View>
        </View>
        <Text style={styles.pledgeAmount}>USD 10 / month</Text>
        <AppButton
          title="Contribute Now"
          onPress={() => router.push('/screens/contribute')}
          style={{ marginTop: 14 }}
          icon={<Ionicons name="cash-outline" size={16} color={Colors.white} />}
        />
      </AppCard>

      {/* Privacy */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Anonymous Publicly</Text>
            <Text style={styles.toggleDesc}>Hide your name from public donor lists</Text>
          </View>
          <Switch
            value={user.anonymous_publicly}
            onValueChange={toggleAnonymous}
            disabled={updatingAnon}
            trackColor={{ false: Colors.gray[300], true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>
      </AppCard>

      {/* Badges */}
      {user.badges && user.badges.length > 0 && (
        <View style={styles.badgesSection}>
          <View style={styles.badgesHeader}>
            <Text style={styles.sectionTitle}>My Badges</Text>
            <TouchableOpacity onPress={() => router.push('/screens/badges')}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesList}>
            {user.badges.map((b) => (
              <BadgeCard key={b.id} badge={b} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Menu Items */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>More</Text>
        {user.is_collector && (
          <MenuItem
            icon="people-outline"
            label="Collector Dashboard"
            onPress={() => router.push('/screens/collector-dashboard')}
            color={Colors.primary}
          />
        )}
        <MenuItem icon="shield-outline" label="Badges & Achievements" onPress={() => router.push('/screens/badges')} color={Colors.gold} />
        <MenuItem icon="notifications-outline" label="Notifications" onPress={() => router.push('/screens/notifications')} color={Colors.primaryLight} />
        <MenuItem icon="information-circle-outline" label="About NAMLEF" onPress={() => router.push('/screens/namlef')} color={Colors.primaryDark} />
      </AppCard>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>Family Pledge v1.0 · A NAMLEF Initiative</Text>
        <Text style={styles.appInfoText}>Gaza Relief Programme</Text>
      </View>

      <AppButton
        title="Sign Out"
        onPress={handleLogout}
        variant="outline"
        style={styles.logoutBtn}
        textStyle={{ color: Colors.emergency }}
        icon={<Ionicons name="log-out-outline" size={18} color={Colors.emergency} />}
      />

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function MenuItem({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.menuItem}>
      <View style={[styles.menuIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.gray[400]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingBottom: 32 },
  profileHeader: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 36,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.primaryDark },
  displayName: { fontSize: 22, fontWeight: '800', color: Colors.white, marginBottom: 2 },
  fullName: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  locationText: { color: Colors.gold, fontSize: 13, fontWeight: '500' },
  donorBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
  },
  donorBadgeText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  card: { marginHorizontal: 16, marginBottom: 14 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardLabelText: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  pledgeAmount: { fontSize: 13, color: Colors.text.secondary, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text.primary, marginBottom: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, marginBottom: 2 },
  toggleDesc: { fontSize: 12, color: Colors.text.secondary, lineHeight: 17 },
  badgesSection: { marginBottom: 14 },
  badgesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  badgesList: { paddingHorizontal: 16, paddingBottom: 8, gap: 0 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.light },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.text.primary },
  appInfo: { alignItems: 'center', marginVertical: 16, gap: 4 },
  appInfoText: { fontSize: 12, color: Colors.text.muted },
  logoutBtn: { marginHorizontal: 16, borderColor: Colors.emergency },
});
