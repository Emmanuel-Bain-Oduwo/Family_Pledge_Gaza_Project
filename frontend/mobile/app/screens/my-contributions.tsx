import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppCard from '../../components/AppCard';
import LoadingState from '../../components/LoadingState';
import { getMyPayments, PaymentRecord } from '../../services/payments';

export default function MyContributionsScreen() {
  const [items, setItems] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPayments()
      .then((payments) => setItems(payments.filter((item) => item.status === 'succeeded')))
      .catch((e) => Alert.alert('Could not load contributions', e.message || 'Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState fullScreen message="Loading contributions..." />;

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
    <View style={styles.hero}>
      <Ionicons name="receipt-outline" size={32} color={Colors.goldLight}/>
      <Text style={styles.title}>My Contributions</Text>
      <Text style={styles.subtitle}>Your successfully received Family Pledge contributions and M-PESA receipts.</Text>
    </View>
    {items.length === 0
      ? <AppCard><Text style={styles.empty}>No confirmed contribution records yet.</Text></AppCard>
      : items.map((item) => <AppCard key={item.id} style={styles.card}>
          <View style={styles.top}>
            <View>
              <Text style={styles.amount}>{item.requested_currency} {Number(item.requested_amount || 0).toLocaleString()}</Text>
              <Text style={styles.month}>{item.contribution_month}</Text>
            </View>
            <View style={[styles.status, styles.confirmed]}><Text style={styles.statusText}>Paid ✓</Text></View>
          </View>
          <View style={styles.details}>
            <Row label="Method" value="M-PESA" />
            {item.settlement_amount != null && <Row label="M-PESA paid" value={`${item.settlement_currency} ${Number(item.settlement_amount).toLocaleString()}`} />}
            <Row label="Receipt" value={item.mpesa_receipt_number || 'Recorded'} />
            <Row label="Paid" value={item.paid_at ? new Date(item.paid_at).toLocaleString() : new Date(item.created_at).toLocaleString()} last />
          </View>
        </AppCard>)}
  </ScrollView>;
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return <View style={[styles.row, !last && styles.rowBorder]}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>;
}

const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:Colors.cream},content:{padding:16,paddingBottom:40},hero:{backgroundColor:Colors.primaryDark,borderRadius:24,padding:22,alignItems:'center',marginBottom:16},title:{marginTop:8,fontSize:24,fontWeight:'900',color:Colors.white},subtitle:{marginTop:6,textAlign:'center',color:'rgba(255,255,255,.8)'},card:{marginBottom:10},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12},amount:{fontSize:18,fontWeight:'900',color:Colors.text.primary},month:{marginTop:3,fontSize:11,color:Colors.text.muted},status:{borderRadius:12,paddingHorizontal:9,paddingVertical:5},confirmed:{backgroundColor:'#E8F7EF'},statusText:{fontSize:10,fontWeight:'800',color:Colors.success,textTransform:'capitalize'},details:{marginTop:12,borderTopWidth:1,borderTopColor:Colors.border.light},row:{flexDirection:'row',justifyContent:'space-between',gap:12,paddingVertical:9},rowBorder:{borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:Colors.border.light},rowLabel:{fontSize:11,color:Colors.text.muted},rowValue:{fontSize:11,color:Colors.text.primary,fontWeight:'800',textAlign:'right',flexShrink:1},empty:{textAlign:'center',color:Colors.text.muted,paddingVertical:12}});
