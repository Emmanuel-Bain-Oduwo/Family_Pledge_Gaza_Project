import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import LoadingState from '../../components/LoadingState';
import { getPledgeStatus } from '../../services/api';
import { PledgeStatusOut } from '../../types';

export default function MyPledgeScreen() {
  const [data, setData] = useState<PledgeStatusOut | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getPledgeStatus().then(setData).catch((e) => Alert.alert('Could not load pledge', e.message || 'Please try again.')).finally(() => setLoading(false)); }, []);
  if (loading) return <LoadingState fullScreen message="Loading your pledge..." />;
  const pledge = data?.pledge;
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
    <View style={styles.hero}><Ionicons name="heart" size={32} color={Colors.goldLight} /><Text style={styles.title}>My Family Pledge</Text><Text style={styles.subtitle}>{data?.has_active_pledge ? 'Your voluntary pledge is active.' : 'Review the pledge agreement, then choose a monthly pledge or join as a free participant.'}</Text></View>
    {pledge ? <AppCard style={styles.card}>
      <Row label="Status" value={pledge.status} />
      <Row label="Pledge" value={pledge.pledge_type === 'free_participant' ? 'Free participant' : `${pledge.currency} ${Number(pledge.amount).toLocaleString()} monthly`} />
      <Row label="Started" value={pledge.start_date ? new Date(pledge.start_date).toLocaleDateString() : '—'} />
      <Row label="Agreement" value={pledge.agreement_accepted_at ? `Signed ${new Date(pledge.agreement_accepted_at).toLocaleDateString()}` : 'Legacy pledge'} />
      <Row label="Confirmed contributions" value={data?.confirmed_contributions_count ?? 0} />
      <Row label="This month" value={data?.current_month_contributed ? 'Submitted / confirmed' : 'Not submitted yet'} last />
    </AppCard> : <AppCard style={styles.card}><Text style={styles.empty}>You have not signed a Family Pledge yet.</Text></AppCard>}
    <AppButton title={pledge ? 'Contribute / Update My Pledge' : 'Review & Sign My Pledge'} onPress={() => router.push('/screens/contribute')} />
  </ScrollView>;
}
function Row({ label, value, last }: { label: string; value: string | number; last?: boolean }) { return <View style={[styles.row, !last && styles.border]}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>; }
const styles = StyleSheet.create({ scroll:{flex:1,backgroundColor:Colors.cream},content:{padding:16,paddingBottom:40},hero:{backgroundColor:Colors.primaryDark,borderRadius:24,padding:22,alignItems:'center',marginBottom:16},title:{marginTop:8,fontSize:24,fontWeight:'900',color:Colors.white},subtitle:{marginTop:6,textAlign:'center',color:'rgba(255,255,255,.8)'},card:{marginBottom:16},row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:13,gap:14},border:{borderBottomWidth:1,borderBottomColor:Colors.border.light},label:{fontSize:13,color:Colors.text.secondary},value:{fontSize:13,fontWeight:'800',color:Colors.text.primary,textAlign:'right',textTransform:'capitalize',flexShrink:1},empty:{textAlign:'center',color:Colors.text.muted,paddingVertical:12} });
