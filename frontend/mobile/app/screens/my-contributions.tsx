import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppCard from '../../components/AppCard';
import LoadingState from '../../components/LoadingState';
import { getMyContributions } from '../../services/api';

export default function MyContributionsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getMyContributions(1).then((result) => setItems(result.items || [])).catch((e) => Alert.alert('Could not load contributions', e.message || 'Please try again.')).finally(() => setLoading(false)); }, []);
  if (loading) return <LoadingState fullScreen message="Loading contributions..." />;
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}><View style={styles.hero}><Ionicons name="receipt-outline" size={32} color={Colors.goldLight}/><Text style={styles.title}>My Contributions</Text><Text style={styles.subtitle}>Your submitted and confirmed Family Pledge contribution history.</Text></View>{items.length===0?<AppCard><Text style={styles.empty}>No contribution records yet.</Text></AppCard>:items.map((item)=><AppCard key={item.id} style={styles.card}><View style={styles.top}><View><Text style={styles.amount}>{item.currency || 'USD'} {Number(item.amount || 0).toLocaleString()}</Text><Text style={styles.month}>{item.contribution_month || 'Contribution'}</Text></View><View style={[styles.status,item.status==='confirmed'?styles.confirmed:styles.pending]}><Text style={styles.statusText}>{String(item.status || 'submitted').replace(/_/g,' ')}</Text></View></View><Text style={styles.date}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text></AppCard>)}</ScrollView>;
}
const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:Colors.cream},content:{padding:16,paddingBottom:40},hero:{backgroundColor:Colors.primaryDark,borderRadius:24,padding:22,alignItems:'center',marginBottom:16},title:{marginTop:8,fontSize:24,fontWeight:'900',color:Colors.white},subtitle:{marginTop:6,textAlign:'center',color:'rgba(255,255,255,.8)'},card:{marginBottom:10},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12},amount:{fontSize:18,fontWeight:'900',color:Colors.text.primary},month:{marginTop:3,fontSize:11,color:Colors.text.muted},status:{borderRadius:12,paddingHorizontal:9,paddingVertical:5},confirmed:{backgroundColor:'#E8F7EF'},pending:{backgroundColor:'#FFF4DD'},statusText:{fontSize:10,fontWeight:'800',color:Colors.text.secondary,textTransform:'capitalize'},date:{marginTop:10,fontSize:10,color:Colors.text.muted},empty:{textAlign:'center',color:Colors.text.muted,paddingVertical:12}});
