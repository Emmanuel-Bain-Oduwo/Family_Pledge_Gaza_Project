import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { getMe, updateAnonymousPreference } from '../../services/api';
import { getUser, saveUser, logout } from '../../services/auth';
import { User } from '../../types';
import { MOCK_USER } from '../../constants/mockData';
import { FamilyPledgeLinks } from '../../constants/links';

const STATUS_COLOR: Record<string, string> = { paid: Colors.success, pending: Colors.warning, missed: Colors.emergency, free_participant: Colors.primary, none: Colors.gray[400] };
const STATUS_LABEL: Record<string, string> = { paid: 'Paid ✓', pending: 'Pending', missed: 'Missed', free_participant: 'Free Participant', none: 'No Pledge' };

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingAnon, setUpdatingAnon] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try { const me = await getMe(); setUser(me); await saveUser(me); }
    catch { const stored = await getUser(); if (stored) setUser(stored); else if (__DEV__) setUser(MOCK_USER); else { setUser(null); setError('We could not load your profile. Check your connection and try again.'); } }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const toggleAnonymous = async (val: boolean) => {
    if (!user) return;
    setUpdatingAnon(true);
    try { const updated = await updateAnonymousPreference(val); setUser(updated); await saveUser(updated); }
    catch { Alert.alert('Error', 'Could not update preference.'); }
    finally { setUpdatingAnon(false); }
  };

  const shareApp = () => Share.share({ message: `Join Family Pledge and support consistent humanitarian action for Gaza: ${FamilyPledgeLinks.website}` });
  const rateApp = async () => {
    const storeUrl = Platform.OS === 'ios' ? FamilyPledgeLinks.iosStore : FamilyPledgeLinks.androidStore;
    if (!storeUrl) { Alert.alert('Store listing coming soon', 'The Family Pledge store listing will be linked here as soon as the first release is published.'); return; }
    await Linking.openURL(storeUrl);
  };
  const handleLogout = () => Alert.alert('Sign Out', 'Are you sure you want to sign out?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/'); } }]);

  if (loading) return <LoadingState fullScreen message="Loading profile..." />;
  if (!user) return <ErrorState title="Could not load your profile" message={error} onRetry={() => { setLoading(true); void load(); }} />;

  const initial = (user.nickname || user.full_name || 'D').charAt(0).toUpperCase();
  const pledgeStatus = user.pledge_status || 'none';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}><Text style={styles.avatarText}>{initial}</Text></View>
        <Text style={styles.displayName}>{user.nickname || user.full_name}</Text>
        <Text style={styles.fullName}>{user.full_name}</Text>
        <View style={styles.locationRow}><Ionicons name="location-outline" size={14} color={Colors.gold} /><Text style={styles.locationText}>{user.city ? `${user.city}, ` : ''}{user.country}</Text></View>
      </View>

      <AppCard style={styles.card}>
        <View style={styles.cardRow}><View style={styles.cardLabel}><Ionicons name="heart" size={18} color={Colors.primary} /><Text style={styles.cardLabelText}>Pledge Status</Text></View><View style={[styles.statusBadge,{backgroundColor:STATUS_COLOR[pledgeStatus]+'20'}]}><Text style={[styles.statusText,{color:STATUS_COLOR[pledgeStatus]}]}>{STATUS_LABEL[pledgeStatus]}</Text></View></View>
        <View style={styles.quickActions}><QuickAction icon="leaf-outline" label="Journey" onPress={()=>router.push('/screens/impact-journey')}/><QuickAction icon="flag-outline" label="Goals" onPress={()=>router.push('/screens/goals')}/><QuickAction icon="people-outline" label="Community" onPress={()=>router.push('/screens/community')}/></View>
        <AppButton title="Contribute Now" onPress={()=>router.push('/screens/contribute')} style={{marginTop:14}} icon={<Ionicons name="cash-outline" size={16} color={Colors.white}/>}/>
      </AppCard>

      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.toggleRow}><View style={styles.toggleInfo}><Text style={styles.toggleLabel}>Anonymous Publicly</Text><Text style={styles.toggleDesc}>Hide your name from public donor lists</Text></View><Switch value={user.anonymous_publicly} onValueChange={toggleAnonymous} disabled={updatingAnon} trackColor={{false:Colors.gray[300],true:Colors.primary}} thumbColor={Colors.white}/></View>
      </AppCard>

      <SettingsSection title="My Journey">
        <MenuItem icon="leaf-outline" label="Impact Journey" onPress={()=>router.push('/screens/impact-journey')} />
        <MenuItem icon="flag-outline" label="Goals" onPress={()=>router.push('/screens/goals')} />
        <MenuItem icon="heart-outline" label="My Pledge" onPress={()=>router.push('/screens/my-pledge')} />
        <MenuItem icon="receipt-outline" label="My Contributions" onPress={()=>router.push('/screens/my-contributions')} />
        <MenuItem icon="trophy-outline" label="Achievements" onPress={()=>router.push('/screens/badges')} />
        <MenuItem icon="people-outline" label="Community & Pledge Circles" onPress={()=>router.push('/screens/community')} last />
      </SettingsSection>

      <SettingsSection title="Notifications">
        <MenuItem icon="notifications-outline" label="Notification Feed" onPress={()=>router.push('/screens/notifications')} />
        <MenuItem icon="options-outline" label="Notification Preferences" detail="Quran, Hadith, Dua, Impact & more" onPress={()=>router.push('/screens/notification-preferences')} last />
      </SettingsSection>

      <SettingsSection title="Family Pledge & Support">
        <MenuItem icon="information-circle-outline" label="About Family Pledge" onPress={()=>router.push('/screens/about-family-pledge')} />
        <MenuItem icon="school-outline" label="How Family Pledge Works" detail="Help Centre & tutorials" onPress={()=>router.push('/screens/tutorials')} />
        <MenuItem icon="chatbox-ellipses-outline" label="Request a Feature" onPress={()=>router.push('/screens/request-feature')} />
        <MenuItem icon="mail-outline" label="Contact Support" detail={FamilyPledgeLinks.supportEmail} onPress={()=>Linking.openURL(`mailto:${FamilyPledgeLinks.supportEmail}`)} />
        <MenuItem icon="share-social-outline" label="Share Family Pledge" onPress={shareApp} />
        <MenuItem icon="star-outline" label="Rate Family Pledge" onPress={rateApp} />
        {user.is_collector && <MenuItem icon="people-circle-outline" label="Collector Dashboard" onPress={()=>router.push('/screens/collector-dashboard')} />}
        <MenuItem icon="business-outline" label="NAMLEF & Messages" onPress={()=>router.push('/screens/namlef')} last />
      </SettingsSection>

      <View style={styles.socialRow}>
        <Social icon="logo-instagram" onPress={()=>Linking.openURL(FamilyPledgeLinks.instagram)} />
        <Social icon="logo-tiktok" onPress={()=>Linking.openURL(FamilyPledgeLinks.tiktok)} />
        <Social icon="logo-youtube" onPress={()=>Linking.openURL(FamilyPledgeLinks.youtube)} />
      </View>

      <SettingsSection title="Privacy & Legal">
        <MenuItem icon="lock-closed-outline" label="Privacy & Data Usage" onPress={()=>router.push('/privacy')} />
        <MenuItem icon="document-text-outline" label="Terms of Service" onPress={()=>router.push('/terms')} />
        <MenuItem icon="shield-checkmark-outline" label="Contribution Proof Privacy" detail="Private storage · 30 days" onPress={()=>router.push('/screens/contribution-proof-privacy')} />
        <MenuItem icon="trash-outline" label="Delete Account" color={Colors.emergency} onPress={()=>router.push('/screens/delete-account')} last />
      </SettingsSection>

      <SettingsSection title="App">
        <MenuItem icon="contrast-outline" label="Appearance" detail="System · Light · Dark" onPress={()=>router.push('/screens/appearance')} />
        <MenuItem icon="language-outline" label="Language" detail="English" onPress={()=>Alert.alert('Language','Family Pledge currently uses English.')} last />
      </SettingsSection>

      <View style={styles.appInfo}><Text style={styles.appInfoText}>Family Pledge v1.0 · A NAMLEF Initiative</Text><Text style={styles.appInfoText}>Nairobi, Kenya</Text></View>
      <AppButton title="Sign Out" onPress={handleLogout} variant="outline" style={styles.logoutBtn} textStyle={{color:Colors.emergency}} icon={<Ionicons name="log-out-outline" size={18} color={Colors.emergency}/>}/>
      <View style={{height:32}} />
    </ScrollView>
  );
}

function SettingsSection({title,children}:{title:string;children:React.ReactNode}){return <AppCard style={styles.card}><Text style={styles.sectionTitle}>{title}</Text>{children}</AppCard>}
function MenuItem({icon,label,detail,onPress,color=Colors.primary,last=false}:{icon:string;label:string;detail?:string;onPress:()=>void;color?:string;last?:boolean}){return <TouchableOpacity onPress={onPress} activeOpacity={.7} style={[styles.menuItem,!last&&styles.menuBorder]}><View style={[styles.menuIcon,{backgroundColor:color+'15'}]}><Ionicons name={icon as any} size={18} color={color}/></View><View style={{flex:1}}><Text style={[styles.menuLabel,{color:color===Colors.emergency?Colors.emergency:Colors.text.primary}]}>{label}</Text>{detail&&<Text style={styles.menuDetail}>{detail}</Text>}</View><Ionicons name="chevron-forward" size={16} color={Colors.gray[400]}/></TouchableOpacity>}
function QuickAction({icon,label,onPress}:{icon:string;label:string;onPress:()=>void}){return <TouchableOpacity style={styles.quick} onPress={onPress}><Ionicons name={icon as any} size={20} color={Colors.primary}/><Text style={styles.quickText}>{label}</Text></TouchableOpacity>}
function Social({icon,onPress}:{icon:string;onPress:()=>void}){return <TouchableOpacity onPress={onPress} style={styles.social}><Ionicons name={icon as any} size={24} color={Colors.primaryDark}/></TouchableOpacity>}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:Colors.cream},content:{paddingBottom:32},profileHeader:{backgroundColor:Colors.primary,alignItems:'center',paddingTop:28,paddingBottom:30,paddingHorizontal:24,borderBottomLeftRadius:28,borderBottomRightRadius:28,marginBottom:16},avatarCircle:{width:76,height:76,borderRadius:38,backgroundColor:Colors.gold,alignItems:'center',justifyContent:'center',marginBottom:10,borderWidth:3,borderColor:'rgba(255,255,255,.4)'},avatarText:{fontSize:30,fontWeight:'800',color:Colors.primaryDark},displayName:{fontSize:22,fontWeight:'800',color:Colors.white},fullName:{fontSize:13,color:'rgba(255,255,255,.75)',marginTop:2},locationRow:{flexDirection:'row',alignItems:'center',gap:4,marginTop:7},locationText:{color:Colors.gold,fontSize:12,fontWeight:'500'},card:{marginHorizontal:16,marginBottom:12},cardRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},cardLabel:{flexDirection:'row',alignItems:'center',gap:8},cardLabelText:{fontSize:14,fontWeight:'700',color:Colors.text.primary},statusBadge:{paddingHorizontal:10,paddingVertical:4,borderRadius:18},statusText:{fontSize:11,fontWeight:'800'},quickActions:{flexDirection:'row',gap:8,marginTop:14},quick:{flex:1,alignItems:'center',justifyContent:'center',gap:5,backgroundColor:Colors.gray[50],borderRadius:13,paddingVertical:10},quickText:{fontSize:10,fontWeight:'800',color:Colors.text.primary},sectionTitle:{fontSize:15,fontWeight:'900',color:Colors.text.primary,marginBottom:6},toggleRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},toggleInfo:{flex:1},toggleLabel:{fontSize:14,fontWeight:'600',color:Colors.text.primary},toggleDesc:{fontSize:12,color:Colors.text.secondary,marginTop:2},menuItem:{flexDirection:'row',alignItems:'center',paddingVertical:12,gap:11},menuBorder:{borderBottomWidth:1,borderBottomColor:Colors.border.light},menuIcon:{width:36,height:36,borderRadius:10,alignItems:'center',justifyContent:'center'},menuLabel:{fontSize:14,fontWeight:'600'},menuDetail:{fontSize:10,color:Colors.text.muted,marginTop:2},socialRow:{flexDirection:'row',justifyContent:'center',gap:12,marginBottom:14},social:{width:44,height:44,borderRadius:22,backgroundColor:Colors.white,borderWidth:1,borderColor:Colors.border.light,alignItems:'center',justifyContent:'center'},appInfo:{alignItems:'center',marginVertical:14,gap:3},appInfoText:{fontSize:11,color:Colors.text.muted},logoutBtn:{marginHorizontal:16,borderColor:Colors.emergency},
});
