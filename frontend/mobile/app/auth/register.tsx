import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Switch, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/AppButton';
import FamilyPledgeLogo from '../../components/FamilyPledgeLogo';
import { joinPledgeCircle } from '../../services/api';
import { registerWithPreferences } from '../../services/communicationPreferences';
import { saveToken } from '../../services/auth';
import { clearPendingCircleCode, getPendingCircleCode } from '../../services/pendingCircle';

export default function RegisterScreen() {
  const [form, setForm] = useState({
    full_name: '', nickname: '', phone: '', email: '', country: '', city: '',
    password: '', confirm_password: '', anonymous_publicly: false, collector_code: '',
    email_reminders_opt_in: false, whatsapp_reminders_opt_in: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const update = (key: string, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    if (!form.full_name.trim() || !form.phone.trim() || !form.country.trim() || !form.password.trim()) { Alert.alert('Missing Fields', 'Please fill in name, phone, country and password.'); return; }
    if (form.password !== form.confirm_password) { Alert.alert('Password Mismatch', 'Passwords do not match.'); return; }
    if (form.password.length < 8) { Alert.alert('Weak Password', 'Password must be at least 8 characters.'); return; }
    if (form.email_reminders_opt_in && !form.email.trim()) { Alert.alert('Email Needed', 'Add your email address to receive Family Pledge email reminders.'); return; }
    setLoading(true);
    try {
      const tokens = await registerWithPreferences({
        full_name: form.full_name.trim(), nickname: form.nickname.trim() || undefined,
        phone: form.phone.trim(), email: form.email.trim() || undefined,
        country: form.country.trim(), city: form.city.trim() || undefined,
        password: form.password, referral_code: form.collector_code.trim() || undefined,
        email_reminders_opt_in: form.email_reminders_opt_in,
        whatsapp_reminders_opt_in: form.whatsapp_reminders_opt_in,
      });
      await saveToken(tokens);
      const pendingCircle = await getPendingCircleCode();
      if (pendingCircle) {
        try { const circle = await joinPledgeCircle(pendingCircle); await clearPendingCircleCode(); router.replace({ pathname: '/screens/circle-details', params: { id: circle.id } }); return; }
        catch { /* Account creation succeeded; keep pending circle invite for retry. */ }
      }
      router.replace('/tabs/home');
    } catch (err: any) { Alert.alert('Registration Failed', err.message || 'Please check your details and try again.'); }
    finally { setLoading(false); }
  };

  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.headerBlock}><FamilyPledgeLogo /><Text style={styles.heading}>Sign Your Family Pledge</Text><Text style={styles.subheading}>Choose your pledge, receive the reminders you want, and stay connected to Family Pledge.</Text></View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Personal Details</Text><Field label="Full Name *" value={form.full_name} onChangeText={(v) => update('full_name', v)} placeholder="e.g. Ahmed Hassan" /><Field label="Nickname / Display Name" value={form.nickname} onChangeText={(v) => update('nickname', v)} placeholder="e.g. Abu Yusuf" /><Field label="Phone Number *" value={form.phone} onChangeText={(v) => update('phone', v)} placeholder="+254700000000" keyboardType="phone-pad" /><Field label="Email (optional)" value={form.email} onChangeText={(v) => { update('email', v); if (!v.trim()) update('email_reminders_opt_in', false); }} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" /></View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Location</Text><Field label="Country *" value={form.country} onChangeText={(v) => update('country', v)} placeholder="e.g. Kenya" /><Field label="City (optional)" value={form.city} onChangeText={(v) => update('city', v)} placeholder="e.g. Nairobi" /></View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Security</Text><View style={styles.passwordWrap}><Field label="Password *" value={form.password} onChangeText={(v) => update('password', v)} placeholder="Min 8 characters" secureTextEntry={!showPassword} autoCapitalize="none" /><TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.gray[400]} /></TouchableOpacity></View><Field label="Confirm Password *" value={form.confirm_password} onChangeText={(v) => update('confirm_password', v)} placeholder="Repeat password" secureTextEntry={!showPassword} autoCapitalize="none" /></View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Reminder Channels</Text><Text style={styles.helper}>App notifications are managed separately after sign-in. These extra channels are optional and can be changed anytime.</Text><Toggle label="Email reminders" description={form.email.trim() ? 'Receive selected Family Pledge reminders by email.' : 'Add an email above to enable this channel.'} value={form.email_reminders_opt_in} disabled={!form.email.trim()} onValueChange={(v)=>update('email_reminders_opt_in',v)} icon="mail-outline"/><Toggle label="WhatsApp reminders" description="Receive admin-approved Family Pledge reminders through WhatsApp Business." value={form.whatsapp_reminders_opt_in} onValueChange={(v)=>update('whatsapp_reminders_opt_in',v)} icon="logo-whatsapp"/></View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Privacy & Community</Text><View style={styles.toggleRow}><View style={styles.toggleInfo}><Text style={styles.toggleLabel}>Anonymous Publicly</Text><Text style={styles.toggleDesc}>Your name won't appear in public donor lists</Text></View><Switch value={form.anonymous_publicly} onValueChange={(v) => update('anonymous_publicly', v)} trackColor={{ false: Colors.gray[300], true: Colors.primary }} thumbColor={Colors.white} /></View><Field label="Referral / Collector Code (optional)" value={form.collector_code} onChangeText={(v) => update('collector_code', v)} placeholder="Enter the code your coordinator gave you" autoCapitalize="characters" /></View>
      <AppButton title="Sign My Pledge" onPress={handleRegister} loading={loading} style={styles.registerBtn} />
      <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.loginLink}><Text style={styles.loginText}>Already pledged? <Text style={styles.loginBold}>Sign In</Text></Text></TouchableOpacity>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function Toggle({label,description,value,onValueChange,disabled,icon}:{label:string;description:string;value:boolean;onValueChange:(v:boolean)=>void;disabled?:boolean;icon:any}){return <View style={[styles.toggleRow,disabled&&{opacity:.55}]}><View style={styles.channelIcon}><Ionicons name={icon} size={19} color={Colors.primary}/></View><View style={styles.toggleInfo}><Text style={styles.toggleLabel}>{label}</Text><Text style={styles.toggleDesc}>{description}</Text></View><Switch disabled={disabled} value={value} onValueChange={onValueChange} trackColor={{false:Colors.gray[300],true:Colors.primary}} thumbColor={Colors.white}/></View>}
function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize }: { label: string; value: string; onChangeText: (t: string) => void; placeholder?: string; secureTextEntry?: boolean; keyboardType?: any; autoCapitalize?: any; }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={Colors.gray[400]} secureTextEntry={secureTextEntry} keyboardType={keyboardType} autoCapitalize={autoCapitalize || 'words'} style={styles.input} /></View>; }

const styles = StyleSheet.create({flex:{flex:1},scroll:{flex:1,backgroundColor:Colors.cream},content:{padding:20,paddingBottom:48},headerBlock:{alignItems:'center',marginBottom:24,marginTop:8},heading:{fontSize:24,fontWeight:'800',color:Colors.text.primary,marginBottom:4},subheading:{fontSize:14,color:Colors.text.secondary,textAlign:'center'},section:{backgroundColor:Colors.white,borderRadius:16,padding:16,marginBottom:16,gap:14,shadowColor:'#000',shadowOffset:{width:0,height:1},shadowOpacity:.05,shadowRadius:4,elevation:2},sectionTitle:{fontSize:13,fontWeight:'700',color:Colors.primary,textTransform:'uppercase',letterSpacing:.8,marginBottom:2},helper:{fontSize:12,lineHeight:18,color:Colors.text.secondary},field:{gap:5},label:{fontSize:13,fontWeight:'600',color:Colors.text.primary},input:{backgroundColor:Colors.gray[50],borderRadius:10,borderWidth:1.5,borderColor:Colors.border.light,paddingHorizontal:14,paddingVertical:12,fontSize:15,color:Colors.text.primary},passwordWrap:{position:'relative'},eyeBtn:{position:'absolute',right:14,bottom:14},toggleRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},channelIcon:{width:36,height:36,borderRadius:10,backgroundColor:Colors.primary+'12',alignItems:'center',justifyContent:'center'},toggleInfo:{flex:1},toggleLabel:{fontSize:14,fontWeight:'600',color:Colors.text.primary,marginBottom:2},toggleDesc:{fontSize:12,color:Colors.text.secondary,lineHeight:17},registerBtn:{marginBottom:16},loginLink:{alignItems:'center',padding:8},loginText:{fontSize:14,color:Colors.text.secondary},loginBold:{color:Colors.primary,fontWeight:'700'}});
