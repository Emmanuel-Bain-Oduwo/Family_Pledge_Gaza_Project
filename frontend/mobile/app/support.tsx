import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import LoadingState from '../components/LoadingState';
import { createSupportMessage, getMySupportMessages } from '../services/support';
import { SupportMessage } from '../types';

const CATEGORIES = [
  ['general', 'General'], ['account', 'Account'], ['pledge', 'Pledge'],
  ['contribution', 'Contribution'], ['technical', 'Technical'], ['privacy', 'Privacy'],
] as const;

export default function SupportPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [items, setItems] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setItems(await getMySupportMessages()); }
    catch { setItems([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const send = async () => {
    if (subject.trim().length < 2 || message.trim().length < 2) {
      Alert.alert('Add a message', 'Please add a short subject and tell us what you need help with.');
      return;
    }
    setSending(true);
    try {
      await createSupportMessage({ subject: subject.trim(), message: message.trim(), category });
      setSubject(''); setMessage(''); setCategory('general');
      await load();
      Alert.alert('Message sent', 'Family Pledge Admin can now see this in the Support Inbox. You can return here to see the response.');
    } catch (error: any) {
      Alert.alert('Could not send', error?.response?.data?.detail || error?.message || 'Please try again.');
    } finally { setSending(false); }
  };

  if (loading) return <LoadingState fullScreen message="Loading support..." />;

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={Colors.primary}/> }>
    <View style={styles.hero}><Ionicons name="chatbubbles-outline" size={32} color={Colors.white}/><Text style={styles.title}>Family Pledge Support</Text><Text style={styles.subtitle}>Send a message directly to the admin team and follow the response here.</Text></View>

    <AppCard style={styles.card}>
      <Text style={styles.cardTitle}>New support message</Text>
      <Text style={styles.helper}>For payment verification, include the month, approximate amount and payment channel. Never send passwords or full banking credentials.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        {CATEGORIES.map(([key,label]) => <TouchableOpacity key={key} onPress={()=>setCategory(key)} style={[styles.chip,category===key&&styles.chipActive]}><Text style={[styles.chipText,category===key&&styles.chipTextActive]}>{label}</Text></TouchableOpacity>)}
      </ScrollView>
      <Text style={styles.label}>Subject</Text><TextInput value={subject} onChangeText={setSubject} maxLength={255} placeholder="What do you need help with?" placeholderTextColor={Colors.gray[400]} style={styles.input}/>
      <Text style={styles.label}>Message</Text><TextInput value={message} onChangeText={setMessage} maxLength={5000} placeholder="Describe the issue..." placeholderTextColor={Colors.gray[400]} style={[styles.input,styles.messageInput]} multiline textAlignVertical="top"/>
      <AppButton title="Send to Family Pledge Admin" onPress={send} loading={sending} icon={<Ionicons name="send-outline" size={18} color={Colors.white}/>}/>
    </AppCard>

    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>My messages</Text><TouchableOpacity onPress={()=>void load()}><Ionicons name="refresh-outline" size={20} color={Colors.primary}/></TouchableOpacity></View>
    {items.length===0 ? <AppCard style={styles.card}><Text style={styles.empty}>No support messages yet.</Text></AppCard> : items.map(item => <AppCard key={item.id} style={styles.card}><View style={styles.messageHeader}><View style={{flex:1}}><Text style={styles.messageSubject}>{item.subject}</Text><Text style={styles.meta}>{item.category.replace('_',' ')} · {new Date(item.created_at).toLocaleString()}</Text></View><View style={[styles.status,{backgroundColor:item.status==='resolved'?'#ECFDF5':item.status==='in_progress'?'#EFF6FF':'#FFF7ED'}]}><Text style={styles.statusText}>{item.status.replace('_',' ')}</Text></View></View><Text style={styles.userMessage}>{item.message}</Text>{item.admin_response&&<View style={styles.response}><Text style={styles.responseLabel}>Admin response</Text><Text style={styles.responseText}>{item.admin_response}</Text>{item.responded_at&&<Text style={styles.meta}>{new Date(item.responded_at).toLocaleString()}</Text>}</View>}</AppCard>)}

    <AppCard style={styles.infoCard}><Ionicons name="mail-outline" size={20} color={Colors.primary}/><View style={{flex:1}}><Text style={styles.infoTitle}>Other contact option</Text><Text selectable style={styles.infoText}>admin@familypledgekenya.org</Text><Text style={styles.infoMuted}>Nairobi, Kenya, 00100 · www.familypledgekenya.org</Text></View></AppCard>
  </ScrollView>;
}

const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:Colors.cream},content:{padding:16,paddingBottom:40},hero:{backgroundColor:Colors.primaryDark,borderRadius:24,padding:22,alignItems:'center',marginBottom:16},title:{marginTop:8,fontSize:23,fontWeight:'900',color:Colors.white},subtitle:{marginTop:6,fontSize:13,lineHeight:19,textAlign:'center',color:'rgba(255,255,255,.82)'},card:{marginBottom:14},cardTitle:{fontSize:17,fontWeight:'900',color:Colors.text.primary,marginBottom:5},helper:{fontSize:12,lineHeight:18,color:Colors.text.secondary,marginBottom:12},categories:{gap:8,paddingBottom:12},chip:{paddingHorizontal:12,paddingVertical:7,borderRadius:18,borderWidth:1,borderColor:Colors.border.light,backgroundColor:Colors.white},chipActive:{backgroundColor:Colors.primary,borderColor:Colors.primary},chipText:{fontSize:12,fontWeight:'700',color:Colors.text.secondary},chipTextActive:{color:Colors.white},label:{fontSize:12,fontWeight:'800',color:Colors.text.primary,marginBottom:6,marginTop:5},input:{borderWidth:1.5,borderColor:Colors.border.light,backgroundColor:Colors.gray[50],borderRadius:12,paddingHorizontal:13,paddingVertical:11,fontSize:14,color:Colors.text.primary,marginBottom:12},messageInput:{minHeight:110},sectionHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:3,marginTop:4,marginBottom:8},sectionTitle:{fontSize:17,fontWeight:'900',color:Colors.text.primary},empty:{textAlign:'center',color:Colors.text.secondary,paddingVertical:14},messageHeader:{flexDirection:'row',gap:10,alignItems:'flex-start'},messageSubject:{fontSize:15,fontWeight:'900',color:Colors.text.primary},meta:{marginTop:3,fontSize:10.5,color:Colors.text.muted,textTransform:'capitalize'},status:{paddingHorizontal:9,paddingVertical:5,borderRadius:10},statusText:{fontSize:10,fontWeight:'800',textTransform:'capitalize',color:Colors.text.secondary},userMessage:{marginTop:12,fontSize:13,lineHeight:20,color:Colors.text.secondary},response:{marginTop:13,padding:12,borderRadius:12,backgroundColor:'#F0FDF4',borderWidth:1,borderColor:'#D1FAE5'},responseLabel:{fontSize:11,fontWeight:'900',color:Colors.primaryDark,textTransform:'uppercase'},responseText:{marginTop:5,fontSize:13,lineHeight:20,color:Colors.text.primary},infoCard:{marginTop:4,flexDirection:'row',alignItems:'flex-start',gap:12},infoTitle:{fontWeight:'900',color:Colors.text.primary},infoText:{marginTop:3,color:Colors.primary,fontWeight:'700'},infoMuted:{marginTop:4,fontSize:11,color:Colors.text.muted}});
