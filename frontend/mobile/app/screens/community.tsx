import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import LoadingState from '../../components/LoadingState';
import { createPledgeCircle, getPledgeCircles, joinPledgeCircle } from '../../services/api';
import { PledgeCircle } from '../../types';

export default function CommunityScreen() {
  const [circles, setCircles] = useState<PledgeCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'create' | 'join' | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setCircles(await getPledgeCircles()); }
    catch (e: any) { Alert.alert('Could not load community', e.message || 'Please try again.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const circle = await createPledgeCircle({ name: name.trim(), description: description.trim() || undefined });
      setMode(null); setName(''); setDescription('');
      await load();
      router.push({ pathname: '/screens/circle-details', params: { id: circle.id } });
    } catch (e: any) { Alert.alert('Could not create circle', e.message || 'Please try again.'); }
    finally { setSaving(false); }
  };

  const join = async () => {
    if (!code.trim()) return;
    setSaving(true);
    try {
      const circle = await joinPledgeCircle(code);
      setMode(null); setCode('');
      await load();
      router.push({ pathname: '/screens/circle-details', params: { id: circle.id } });
    } catch (e: any) { Alert.alert('Could not join circle', e.message || 'Check the code and try again.'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingState fullScreen message="Loading your community..." />;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Ionicons name="people-outline" size={32} color={Colors.goldLight} />
        <Text style={styles.heroTitle}>Pledge Circles</Text>
        <Text style={styles.heroText}>Create a private community for family, friends, a class or local group. Invite people with a code or share link.</Text>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.heroButton} onPress={() => setMode('join')}><Ionicons name="enter-outline" size={18} color={Colors.white} /><Text style={styles.heroButtonText}>Join with code</Text></TouchableOpacity>
          <TouchableOpacity style={styles.heroButton} onPress={() => setMode('create')}><Ionicons name="add-circle-outline" size={18} color={Colors.white} /><Text style={styles.heroButtonText}>Create circle</Text></TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>My Circles</Text>
      {circles.length === 0 ? <AppCard><Text style={styles.empty}>You are not in a Pledge Circle yet. Create one or join using an invite code.</Text></AppCard> : circles.map((circle) => (
        <TouchableOpacity key={circle.id} activeOpacity={0.85} onPress={() => router.push({ pathname: '/screens/circle-details', params: { id: circle.id } })}>
          <AppCard style={styles.circleCard}>
            <View style={styles.circleTop}><View style={styles.circleIcon}><Ionicons name="people" size={22} color={Colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.circleName}>{circle.name}</Text><Text style={styles.circleCode}>Code {circle.invite_code} {circle.is_owner ? '· You created this' : ''}</Text></View><Ionicons name="chevron-forward" size={18} color={Colors.gray[400]} /></View>
            {circle.description ? <Text style={styles.description}>{circle.description}</Text> : null}
            <View style={styles.stats}><MiniStat label="Members" value={circle.stats.member_count} /><MiniStat label="Active" value={circle.stats.active_members} /><MiniStat label="Participation" value={`${Math.round(circle.stats.participation_rate)}%`} /></View>
            <TouchableOpacity style={styles.shareRow} onPress={(event) => { event.stopPropagation?.(); Share.share({ message: `Join my Family Pledge Circle “${circle.name}”: ${circle.share_url}\nCode: ${circle.invite_code}` }); }}><Ionicons name="share-social-outline" size={16} color={Colors.primary} /><Text style={styles.shareText}>Share invite</Text></TouchableOpacity>
          </AppCard>
        </TouchableOpacity>
      ))}

      <AppCard style={styles.infoCard}>
        <Text style={styles.infoTitle}>Community progress</Text>
        <Text style={styles.infoText}>Circle statistics focus on participation, active members and consistency. Contribution amounts are not used to rank members.</Text>
      </AppCard>

      <Modal visible={mode !== null} transparent animationType="slide" onRequestClose={() => setMode(null)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>{mode === 'create' ? 'Create a Pledge Circle' : 'Join a Pledge Circle'}</Text><TouchableOpacity onPress={() => setMode(null)}><Ionicons name="close" size={24} color={Colors.text.primary} /></TouchableOpacity></View>
          {mode === 'create' ? <>
            <Text style={styles.label}>Circle name</Text><TextInput value={name} onChangeText={setName} style={styles.input} placeholder="e.g. Wajir Family Circle" maxLength={120} />
            <Text style={styles.label}>Description (optional)</Text><TextInput value={description} onChangeText={setDescription} style={[styles.input, styles.multiline]} placeholder="What brings this circle together?" multiline maxLength={500} />
            <AppButton title="Create Circle" onPress={create} loading={saving} />
          </> : <>
            <Text style={styles.label}>Invite code</Text><TextInput value={code} onChangeText={(value) => setCode(value.toUpperCase())} style={styles.input} placeholder="AB12CD34" autoCapitalize="characters" maxLength={20} />
            <AppButton title="Join Circle" onPress={join} loading={saving} />
          </>}
        </View></View>
      </Modal>
    </ScrollView>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) { return <View style={styles.miniStat}><Text style={styles.miniValue}>{value}</Text><Text style={styles.miniLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.cream }, content: { padding: 16, paddingBottom: 40 },
  hero: { backgroundColor: Colors.primaryDark, borderRadius: 24, padding: 22, alignItems: 'center', marginBottom: 20 }, heroTitle: { marginTop: 7, fontSize: 25, fontWeight: '900', color: Colors.white }, heroText: { marginTop: 6, textAlign: 'center', color: 'rgba(255,255,255,.8)', fontSize: 13, lineHeight: 19 }, heroActions: { flexDirection: 'row', gap: 8, marginTop: 16, width: '100%' }, heroButton: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,.35)', borderRadius: 13, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, heroButtonText: { color: Colors.white, fontSize: 12, fontWeight: '800' },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: Colors.text.primary, marginBottom: 10 }, empty: { color: Colors.text.muted, lineHeight: 19, textAlign: 'center', paddingVertical: 10 }, circleCard: { marginBottom: 10 }, circleTop: { flexDirection: 'row', alignItems: 'center', gap: 11 }, circleIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F1F5' }, circleName: { fontSize: 16, fontWeight: '900', color: Colors.text.primary }, circleCode: { marginTop: 3, fontSize: 10, color: Colors.text.muted }, description: { marginTop: 10, fontSize: 12, lineHeight: 17, color: Colors.text.secondary }, stats: { flexDirection: 'row', gap: 6, marginTop: 13 }, miniStat: { flex: 1, backgroundColor: Colors.gray[50], borderRadius: 12, paddingVertical: 9, alignItems: 'center' }, miniValue: { fontSize: 15, fontWeight: '900', color: Colors.primary }, miniLabel: { marginTop: 2, fontSize: 9, color: Colors.text.muted }, shareRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }, shareText: { fontSize: 12, fontWeight: '800', color: Colors.primary }, infoCard: { marginTop: 8 }, infoTitle: { fontSize: 14, fontWeight: '900', color: Colors.text.primary }, infoText: { marginTop: 5, fontSize: 11, lineHeight: 17, color: Colors.text.secondary },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.45)' }, modalCard: { backgroundColor: Colors.white, padding: 18, borderTopLeftRadius: 24, borderTopRightRadius: 24 }, modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }, modalTitle: { flex: 1, fontSize: 20, fontWeight: '900', color: Colors.text.primary }, label: { marginBottom: 6, marginTop: 8, fontSize: 12, fontWeight: '800', color: Colors.text.secondary }, input: { borderWidth: 1, borderColor: Colors.border.medium, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 11, color: Colors.text.primary, marginBottom: 8 }, multiline: { height: 90, textAlignVertical: 'top' },
});
