import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppCard from '../../components/AppCard';
import { FamilyPledgeLinks } from '../../constants/links';

const SOCIALS = [
  ['logo-instagram', 'Instagram', FamilyPledgeLinks.instagram],
  ['logo-tiktok', 'TikTok', FamilyPledgeLinks.tiktok],
  ['logo-youtube', 'YouTube', FamilyPledgeLinks.youtube],
] as const;

export default function AboutFamilyPledgeScreen() {
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}><View style={styles.hero}><Ionicons name="heart" size={34} color={Colors.goldLight}/><Text style={styles.title}>Family Pledge</Text><Text style={styles.subtitle}>A charitable initiative operated under the National Muslim Leaders Forum (NAMLEF), organizing humanitarian support and community action for Gaza.</Text></View><AppCard style={styles.card}><Text style={styles.sectionTitle}>About Family Pledge</Text><Text style={styles.body}>Family Pledge brings together Muslims, families, communities, companies and other supporters who want to participate in consistent humanitarian support. Donations are received by NAMLEF while Family Pledge organizes the initiative, campaigns, community engagement and impact communication.</Text></AppCard><AppCard style={styles.card}><Text style={styles.sectionTitle}>Official links</Text><LinkRow icon="globe-outline" title="Website" value="familypledgekenya.org" onPress={()=>Linking.openURL(FamilyPledgeLinks.website)}/>{SOCIALS.map(([icon,title,url])=><LinkRow key={title} icon={icon} title={title} value={`@${title==='Instagram'?'familypledge_kenya':title==='TikTok'?'familypledge':'familypledge3139'}`} onPress={()=>Linking.openURL(url)}/>)}<LinkRow icon="mail-outline" title="Support" value={FamilyPledgeLinks.supportEmail} onPress={()=>Linking.openURL(`mailto:${FamilyPledgeLinks.supportEmail}`)} last/></AppCard><AppCard><Text style={styles.sectionTitle}>Location</Text><Text style={styles.body}>Nairobi, Kenya, 00100</Text></AppCard></ScrollView>;
}
function LinkRow({icon,title,value,onPress,last}:{icon:string;title:string;value:string;onPress:()=>void;last?:boolean}){return <TouchableOpacity onPress={onPress} style={[styles.row,!last&&styles.border]}><Ionicons name={icon as any} size={21} color={Colors.primary}/><View style={{flex:1}}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowValue}>{value}</Text></View><Ionicons name="open-outline" size={17} color={Colors.gray[400]}/></TouchableOpacity>}
const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:Colors.cream},content:{padding:16,paddingBottom:40},hero:{backgroundColor:Colors.primaryDark,borderRadius:24,padding:22,alignItems:'center',marginBottom:16},title:{marginTop:8,fontSize:25,fontWeight:'900',color:Colors.white},subtitle:{marginTop:7,color:'rgba(255,255,255,.8)',textAlign:'center',lineHeight:20},card:{marginBottom:12},sectionTitle:{fontSize:17,fontWeight:'900',color:Colors.text.primary,marginBottom:7},body:{fontSize:12,lineHeight:19,color:Colors.text.secondary},row:{flexDirection:'row',alignItems:'center',gap:11,paddingVertical:12},border:{borderBottomWidth:1,borderBottomColor:Colors.border.light},rowTitle:{fontSize:13,fontWeight:'800',color:Colors.text.primary},rowValue:{marginTop:2,fontSize:10,color:Colors.text.muted}});
