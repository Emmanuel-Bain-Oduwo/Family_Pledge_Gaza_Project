import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import LoadingState from '../../components/LoadingState';
import { createGoal, getGoals, updateGoal } from '../../services/api';
import { EngagementGoal } from '../../types';

const PRESETS = [
  { type: 'monthly_pledge', title: 'Keep my monthly Family Pledge', target: 1, cadence: 'monthly', icon: 'heart-outline' },
  { type: 'friday_contribution', title: 'Contribute on Fridays', target: 4, cadence: 'monthly', icon: 'calendar-outline' },
  { type: 'humanitarian_action', title: 'Complete humanitarian actions', target: 4, cadence: 'monthly', icon: 'hand-left-outline' },
  { type: 'share_campaign', title: 'Share verified campaigns', target: 3, cadence: 'monthly', icon: 'share-social-outline' },
  { type: 'read_impact', title: 'Read impact updates', target: 5, cadence: 'monthly', icon: 'images-outline' },
  { type: 'invite_family', title: 'Invite family members to a Pledge Circle', target: 3, cadence: 'once', icon: 'people-outline' },
  { type: 'support_campaign', title: 'Support active campaigns', target: 2, cadence: 'monthly', icon: 'megaphone-outline' },
] as const;

export default function GoalsScreen() {
  const [goals, setGoals] = useState<EngagementGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<(typeof PRESETS)[number]>(PRESETS[0]);
  const [target, setTarget] = useState('1');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setGoals(await getGoals()); }
    catch (e: any) { Alert.alert('Could not load goals', e.message || 'Please try again.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const startGoal = async () => {
    const parsed = Math.max(1, Number(target) || selected.target);
    setSaving(true);
    try {
      await createGoal({ goal_type: selected.type, title: selected.title, target_count: parsed, cadence: selected.cadence });
      setShowCreate(false);
      await load();
    } catch (e: any) { Alert.alert('Could not create goal', e.message || 'Please try again.'); }
    finally { setSaving(false); }
  };

  const archive = async (goal: EngagementGoal) => {
    try { await updateGoal(goal.id, { status: 'archived' }); await load(); }
    catch (e: any) { Alert.alert('Could not archive goal', e.message || 'Please try again.'); }
  };

  if (loading) return <LoadingState fullScreen message="Loading your goals..." />;
  const active = goals.filter((goal) => goal.status === 'active');
  const completed = goals.filter((goal) => goal.status === 'completed');
  const archived = goals.filter((goal) => goal.status === 'archived');

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Your Pledge Goals</Text>
        <Text style={styles.heroText}>Set practical goals around consistency, verified campaigns, impact updates and community participation.</Text>
        <AppButton title="Start a New Goal" onPress={() => setShowCreate(true)} icon={<Ionicons name="add-circle-outline" size={18} color={Colors.white} />} />
      </View>

      <Section title="Active" empty="No active goals yet.">{active.map((goal) => <GoalCard key={goal.id} goal={goal} onArchive={() => archive(goal)} />)}</Section>
      <Section title="Completed" empty="Completed goals will appear here.">{completed.map((goal) => <GoalCard key={goal.id} goal={goal} />)}</Section>
      {archived.length > 0 && <Section title="Archived" empty="">{archived.map((goal) => <GoalCard key={goal.id} goal={goal} />)}</Section>}

      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Create a goal</Text><TouchableOpacity onPress={() => setShowCreate(false)}><Ionicons name="close" size={24} color={Colors.text.primary} /></TouchableOpacity></View>
          <ScrollView style={{ maxHeight: 420 }}>
            {PRESETS.map((preset) => <TouchableOpacity key={preset.type} style={[styles.preset, selected.type === preset.type && styles.presetSelected]} onPress={() => { setSelected(preset); setTarget(String(preset.target)); }}><Ionicons name={preset.icon as any} size={20} color={Colors.primary} /><View style={{ flex: 1 }}><Text style={styles.presetTitle}>{preset.title}</Text><Text style={styles.presetMeta}>{preset.cadence}</Text></View>{selected.type === preset.type && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}</TouchableOpacity>)}
          </ScrollView>
          <Text style={styles.label}>Target</Text><TextInput value={target} onChangeText={setTarget} keyboardType="number-pad" style={styles.input} />
          <AppButton title="Create Goal" onPress={startGoal} loading={saving} />
        </View></View>
      </Modal>
    </ScrollView>
  );
}

function GoalCard({ goal, onArchive }: { goal: EngagementGoal; onArchive?: () => void }) {
  const percent = Math.min(100, Math.round((goal.current_count / Math.max(goal.target_count, 1)) * 100));
  return <AppCard style={styles.goalCard}><View style={styles.goalTop}><View style={{ flex: 1 }}><Text style={styles.goalTitle}>{goal.title}</Text><Text style={styles.goalMeta}>{goal.current_count} / {goal.target_count} · {goal.cadence}</Text></View><Text style={styles.percent}>{percent}%</Text></View><View style={styles.track}><View style={[styles.fill, { width: `${percent}%` }]} /></View>{onArchive && <TouchableOpacity onPress={onArchive} style={styles.archive}><Text style={styles.archiveText}>Archive</Text></TouchableOpacity>}</AppCard>;
}
function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) { const has = React.Children.count(children) > 0; return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{has ? children : <AppCard><Text style={styles.empty}>{empty}</Text></AppCard>}</View>; }

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.cream }, content: { padding: 16, paddingBottom: 40 },
  hero: { backgroundColor: Colors.primaryDark, borderRadius: 24, padding: 20, marginBottom: 20 }, heroTitle: { color: Colors.white, fontSize: 24, fontWeight: '900' }, heroText: { color: 'rgba(255,255,255,.8)', fontSize: 13, lineHeight: 19, marginVertical: 8, marginBottom: 16 },
  section: { marginBottom: 20 }, sectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.text.primary, marginBottom: 10 }, empty: { color: Colors.text.muted, textAlign: 'center', paddingVertical: 12 },
  goalCard: { marginBottom: 10 }, goalTop: { flexDirection: 'row', alignItems: 'center', gap: 12 }, goalTitle: { fontSize: 15, fontWeight: '800', color: Colors.text.primary }, goalMeta: { marginTop: 4, fontSize: 12, color: Colors.text.secondary }, percent: { fontWeight: '900', color: Colors.primary }, track: { height: 8, borderRadius: 8, backgroundColor: Colors.gray[200], overflow: 'hidden', marginTop: 12 }, fill: { height: 8, backgroundColor: Colors.primary, borderRadius: 8 }, archive: { alignSelf: 'flex-end', marginTop: 10 }, archiveText: { fontSize: 12, color: Colors.text.muted },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.45)' }, modalCard: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, maxHeight: '88%' }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, modalTitle: { fontSize: 22, fontWeight: '900', color: Colors.text.primary }, preset: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: Colors.border.light, marginBottom: 8 }, presetSelected: { borderColor: Colors.primary, backgroundColor: '#EFF6F8' }, presetTitle: { fontSize: 14, fontWeight: '700', color: Colors.text.primary }, presetMeta: { fontSize: 11, color: Colors.text.muted, textTransform: 'capitalize' }, label: { marginTop: 12, marginBottom: 6, fontSize: 12, fontWeight: '800', color: Colors.text.secondary }, input: { borderWidth: 1, borderColor: Colors.border.medium, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, color: Colors.text.primary },
});
