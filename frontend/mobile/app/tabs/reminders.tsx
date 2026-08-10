import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import ReminderCard from '../../components/ReminderCard';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import AppButton from '../../components/AppButton';
import { getDailyReminders } from '../../services/api';
import { Reminder } from '../../types';
import { MOCK_REMINDERS } from '../../constants/mockData';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' }, { key: 'quran', label: 'Quran' }, { key: 'hadith', label: 'Hadith' },
  { key: 'dua', label: "Du'a" }, { key: 'dhikr', label: 'Dhikr / Adhkar' },
  { key: 'motivation', label: 'Motivation' }, { key: 'friday', label: "Jumu'ah" }, { key: 'sadaqah', label: 'Sadaqah' },
];
const DHIKR_FILTERS = [
  { key:'all', label:'All Dhikr' }, { key:'morning', label:'Morning' }, { key:'evening', label:'Evening' },
  { key:'anytime', label:'Anytime' }, { key:'protection', label:'Protection' }, { key:'after_prayer', label:'After Prayer' },
  { key:'before_sleep', label:'Before Sleep' },
];
type ReminderWithDhikr = Reminder & { dhikr_category?: string | null };

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filter, setFilter] = useState('all');
  const [dhikrFilter,setDhikrFilter]=useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,setError]=useState<string|null>(null);

  const load = useCallback(async () => {
    try { setError(null); setReminders((await getDailyReminders()).filter((item)=>(item.reminder_type||item.type)!=='shirk')); }
    catch (e) {
      if (__DEV__) setReminders(MOCK_REMINDERS.filter((item)=>(item.reminder_type||item.type)!=='shirk'));
      else { setReminders([]); setError(e instanceof Error ? e.message : 'Could not load verified reminders.'); }
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  let filtered = filter === 'all' ? reminders : reminders.filter((r) => (r.reminder_type || r.type) === filter);
  if(filter==='dhikr'&&dhikrFilter!=='all') filtered=filtered.filter((r)=>(r as ReminderWithDhikr).dhikr_category===dhikrFilter);
  if (loading) return <LoadingState fullScreen message="Loading reminders..." />;

  return <View style={styles.container}>
    <View style={styles.header}><Text style={styles.headerTitle}>Faith & Daily Reminders</Text><Text style={styles.headerSub}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</Text></View>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={Colors.white}/>} showsVerticalScrollIndicator={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filterScroll}>{TYPE_FILTERS.map((f)=><TouchableOpacity key={f.key} onPress={() => {setFilter(f.key);if(f.key!=='dhikr')setDhikrFilter('all');}} activeOpacity={0.8} style={[styles.chip, filter === f.key && styles.chipActive]}><Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text></TouchableOpacity>)}</ScrollView>
      {filter==='dhikr'&&<><View style={styles.dhikrIntro}><Text style={styles.dhikrTitle}>Dhikr & Adhkar</Text><Text style={styles.dhikrText}>Browse source-reviewed remembrance by the time or purpose selected by Family Pledge admins.</Text></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subfilters}>{DHIKR_FILTERS.map((item)=><TouchableOpacity key={item.key} onPress={()=>setDhikrFilter(item.key)} style={[styles.subchip,dhikrFilter===item.key&&styles.subchipActive]}><Text style={[styles.subchipText,dhikrFilter===item.key&&styles.subchipTextActive]}>{item.label}</Text></TouchableOpacity>)}</ScrollView></>}
      {error ? <View style={styles.errorCard}><Text style={styles.errorTitle}>Could not load reminders</Text><Text style={styles.errorText}>Verified faith, Dhikr, Sadaqah and motivation content could not be reached right now.</Text><AppButton title="Try Again" onPress={()=>void load()} style={styles.retry}/></View> : filtered.length === 0 ? <EmptyState icon="moon-outline" title="No Reminders" description="Published Family Pledge reminders in this category will appear here."/> : filtered.map((r)=><ReminderCard key={r.id} reminder={r}/>) }
      <View style={{height:32}}/>
    </ScrollView>
  </View>;
}

const styles=StyleSheet.create({container:{flex:1,backgroundColor:Colors.cream},header:{backgroundColor:Colors.primaryDark,paddingHorizontal:20,paddingTop:20,paddingBottom:24,alignItems:'center'},headerTitle:{fontSize:22,fontWeight:'800',color:Colors.white,marginBottom:4},headerSub:{fontSize:16,color:Colors.gold,fontWeight:'400'},scroll:{flex:1},content:{paddingTop:12,paddingBottom:24},filterScroll:{maxHeight:52},filters:{paddingHorizontal:16,paddingBottom:12,gap:8,flexDirection:'row'},chip:{paddingHorizontal:16,paddingVertical:7,borderRadius:20,backgroundColor:Colors.white,borderWidth:1.5,borderColor:Colors.border.light},chipActive:{backgroundColor:Colors.primary,borderColor:Colors.primary},chipText:{fontSize:13,fontWeight:'600',color:Colors.text.secondary},chipTextActive:{color:Colors.white},dhikrIntro:{marginHorizontal:16,marginBottom:8,padding:13,borderRadius:14,backgroundColor:'#F8FAFC',borderWidth:1,borderColor:Colors.border.light},dhikrTitle:{fontSize:13,fontWeight:'900',color:Colors.primaryDark},dhikrText:{marginTop:4,fontSize:11.5,lineHeight:17,color:Colors.text.secondary},subfilters:{paddingHorizontal:16,paddingBottom:12,gap:7,flexDirection:'row'},subchip:{paddingHorizontal:12,paddingVertical:6,borderRadius:16,backgroundColor:Colors.white,borderWidth:1,borderColor:Colors.border.light},subchipActive:{backgroundColor:Colors.primaryDark,borderColor:Colors.primaryDark},subchipText:{fontSize:11.5,fontWeight:'700',color:Colors.text.secondary},subchipTextActive:{color:Colors.white},errorCard:{margin:16,padding:20,borderRadius:16,backgroundColor:Colors.white,borderWidth:1,borderColor:Colors.border.light},errorTitle:{fontSize:17,fontWeight:'800',color:Colors.text.primary,marginBottom:6},errorText:{fontSize:14,lineHeight:21,color:Colors.text.secondary},retry:{marginTop:14}});
