import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import LoadingState from '../../components/LoadingState';
import { getPledgeCircle, leavePledgeCircle } from '../../services/api';
import { PledgeCircle } from '../../types';

export default function CircleDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [circle, setCircle] = useState<PledgeCircle | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getPledgeCircle(id)
      .then(setCircle)
      .catch((e) => Alert.alert('Could not load circle', e.message || 'Please try again.'))
      .finally(() => setLoading(false));
  }, [id]);

  const shareInvite = async () => {
    if (!circle) return;
    await Share.share({ message: `Join my Family Pledge Circle “${circle.name}”: ${circle.share_url}\nInvite code: ${circle.invite_code}` });
  };

  const leave = () => {
    if (!circle || circle.is_owner) return;
    Alert.alert('Leave Pledge Circle?', `Leave ${circle.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: async () => {
        setLeaving(true);
        try { await leavePledgeCircle(circle.id); router.replace('/screens/community'); }
        catch (e: any) { Alert.alert('Could not leave circle', e.message || 'Please try again.'); }
        finally { setLeaving(false); }
      } },
    ]);
  };

  if (loading) return <LoadingState fullScreen message="Loading circle..." />;
  if (!circle) return <View style={styles.center}><Text style={styles.empty}>Pledge Circle not found.</Text></View>;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.icon}><Ionicons name="people" size={30} color={Colors.primary} /></View>
        <Text style={styles.title}>{circle.name}</Text>
        {circle.description ? <Text style={styles.description}>{circle.description}</Text> : null}
        <View style={styles.codeRow}><Text style={styles.code}>Invite code: {circle.invite_code}</Text><TouchableOpacity onPress={shareInvite}><Ionicons name="share-social-outline" size={21} color={Colors.goldLight} /></TouchableOpacity></View>
      </View>

      <Text style={styles.sectionTitle}>Circle activity</Text>
      <View style={styles.statGrid}>
        <Stat label="Members" value={circle.stats.member_count} />
        <Stat label="Active this month" value={circle.stats.active_members} />
        <Stat label="Participation" value={`${Math.round(circle.stats.participation_rate)}%`} />
        <Stat label="Consistency" value={`${Math.round(circle.stats.consistency_score)}%`} />
        <Stat label="Campaign actions" value={circle.stats.confirmed_actions_this_month} wide />
      </View>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Members</Text><Text style={styles.memberCount}>{circle.members?.length || 0}</Text></View>
      <AppCard style={styles.membersCard}>
        {(circle.members || []).map((member, index) => (
          <View key={member.user_id} style={[styles.member, index !== (circle.members?.length || 0) - 1 && styles.memberBorder]}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{member.display_name.charAt(0).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.memberName}>{member.display_name}</Text><Text style={styles.memberMeta}>{member.role === 'owner' ? 'Circle owner' : `Joined ${new Date(member.joined_at).toLocaleDateString()}`}</Text></View>
            {member.role === 'owner' && <Ionicons name="star" size={16} color={Colors.gold} />}
          </View>
        ))}
      </AppCard>

      <AppButton title="Share Circle Invite" onPress={shareInvite} icon={<Ionicons name="share-social-outline" size={18} color={Colors.white} />} />
      {!circle.is_owner && <AppButton title="Leave Circle" onPress={leave} loading={leaving} variant="outline" style={styles.leave} textStyle={{ color: Colors.emergency }} />}
    </ScrollView>
  );
}

function Stat({ label, value, wide = false }: { label: string; value: string | number; wide?: boolean }) { return <View style={[styles.stat, wide && styles.statWide]}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.cream }, content: { padding: 16, paddingBottom: 40 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cream }, empty: { color: Colors.text.muted },
  hero: { backgroundColor: Colors.primaryDark, borderRadius: 24, padding: 22, alignItems: 'center', marginBottom: 20 }, icon: { width: 62, height: 62, borderRadius: 31, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' }, title: { marginTop: 10, fontSize: 24, fontWeight: '900', color: Colors.white, textAlign: 'center' }, description: { marginTop: 6, color: 'rgba(255,255,255,.8)', textAlign: 'center', lineHeight: 19 }, codeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 13 }, code: { color: Colors.goldLight, fontSize: 12, fontWeight: '800' },
  sectionTitle: { fontSize: 19, fontWeight: '900', color: Colors.text.primary, marginBottom: 10 }, statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }, stat: { width: '48%', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border.light, borderRadius: 16, padding: 14 }, statWide: { width: '100%' }, statValue: { fontSize: 24, fontWeight: '900', color: Colors.primary }, statLabel: { marginTop: 3, fontSize: 11, color: Colors.text.secondary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 }, memberCount: { marginBottom: 10, color: Colors.text.muted, fontWeight: '800' }, membersCard: { marginBottom: 14 }, member: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11 }, memberBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border.light }, avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8F1F5', alignItems: 'center', justifyContent: 'center' }, avatarText: { fontWeight: '900', color: Colors.primary }, memberName: { fontSize: 13, fontWeight: '800', color: Colors.text.primary }, memberMeta: { marginTop: 2, fontSize: 10, color: Colors.text.muted }, leave: { marginTop: 10, borderColor: Colors.emergency },
});
