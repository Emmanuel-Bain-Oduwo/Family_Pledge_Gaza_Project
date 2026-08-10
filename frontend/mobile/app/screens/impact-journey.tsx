import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import AppCard from '../../components/AppCard';
import LoadingState from '../../components/LoadingState';
import { getImpactJourney } from '../../services/api';
import { ImpactJourney } from '../../types';

export default function ImpactJourneyScreen() {
  const [journey, setJourney] = useState<ImpactJourney | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getImpactJourney().then(setJourney).catch((e) => Alert.alert('Could not load journey', e.message || 'Please try again.')).finally(() => setLoading(false)); }, []);
  if (loading) return <LoadingState fullScreen message="Loading your impact journey..." />;
  if (!journey) return null;
  const since = journey.pledge_since ? new Date(journey.pledge_since).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Not yet';
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Ionicons name="leaf-outline" size={30} color={Colors.goldLight} />
        <Text style={styles.title}>Your Impact Journey</Text>
        <Text style={styles.subtitle}>A private view of your consistency and participation in Family Pledge.</Text>
      </View>
      <View style={styles.streakRow}>
        <AppCard style={styles.streakCard}><Text style={styles.streakNum}>{journey.current_consistency_months}</Text><Text style={styles.streakLabel}>Current consistency</Text><Text style={styles.streakUnit}>months</Text></AppCard>
        <AppCard style={styles.streakCard}><Text style={styles.streakNum}>{journey.longest_consistency_months}</Text><Text style={styles.streakLabel}>Longest consistency</Text><Text style={styles.streakUnit}>months</Text></AppCard>
      </View>
      <AppCard style={styles.card}><Text style={styles.sectionTitle}>Activity</Text><Metric icon="checkmark-circle-outline" label="Confirmed contributions" value={journey.confirmed_contributions} /><Metric icon="calendar-outline" label="Pledge since" value={since} /><Metric icon="megaphone-outline" label="Campaigns supported" value={journey.campaigns_supported} /><Metric icon="images-outline" label="Impact updates viewed" value={journey.impact_updates_viewed} /><Metric icon="share-social-outline" label="Verified campaign shares" value={journey.campaigns_shared} /><Metric icon="people-outline" label="Pledge Circles joined" value={journey.circles_joined} last /></AppCard>
      <View style={styles.actions}><Action icon="flag-outline" title="My Goals" onPress={() => router.push('/screens/goals')} /><Action icon="trophy-outline" title="Achievements" onPress={() => router.push('/screens/badges')} /><Action icon="people-outline" title="Community" onPress={() => router.push('/screens/community')} /></View>
    </ScrollView>
  );
}
function Metric({ icon, label, value, last }: { icon: string; label: string; value: string | number; last?: boolean }) { return <View style={[styles.metric, !last && styles.border]}><Ionicons name={icon as any} size={19} color={Colors.primary} /><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>; }
function Action({ icon, title, onPress }: { icon: string; title: string; onPress: () => void }) { return <TouchableOpacity style={styles.action} onPress={onPress}><Ionicons name={icon as any} size={23} color={Colors.primary} /><Text style={styles.actionText}>{title}</Text></TouchableOpacity>; }
const styles = StyleSheet.create({ scroll: { flex: 1, backgroundColor: Colors.cream }, content: { padding: 16, paddingBottom: 40 }, hero: { backgroundColor: Colors.primaryDark, borderRadius: 24, padding: 22, alignItems: 'center', marginBottom: 14 }, title: { marginTop: 8, fontSize: 24, fontWeight: '900', color: Colors.white }, subtitle: { marginTop: 6, textAlign: 'center', color: 'rgba(255,255,255,.8)', lineHeight: 19 }, streakRow: { flexDirection: 'row', gap: 10, marginBottom: 14 }, streakCard: { flex: 1, alignItems: 'center' }, streakNum: { fontSize: 34, fontWeight: '900', color: Colors.primary }, streakLabel: { marginTop: 2, textAlign: 'center', fontSize: 12, color: Colors.text.secondary }, streakUnit: { fontSize: 10, color: Colors.text.muted }, card: { marginBottom: 14 }, sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.text.primary, marginBottom: 4 }, metric: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 }, border: { borderBottomWidth: 1, borderBottomColor: Colors.border.light }, metricLabel: { flex: 1, fontSize: 13, color: Colors.text.secondary }, metricValue: { fontSize: 14, fontWeight: '800', color: Colors.text.primary }, actions: { flexDirection: 'row', gap: 8 }, action: { flex: 1, backgroundColor: Colors.white, borderRadius: 16, paddingVertical: 15, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.border.light }, actionText: { fontSize: 11, fontWeight: '800', color: Colors.text.primary } });
