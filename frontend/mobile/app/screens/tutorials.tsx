import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppCard from '../../components/AppCard';

const GUIDES = [
  ['heart-outline', 'What is Family Pledge?', 'Family Pledge is a charitable initiative operated under NAMLEF that organizes consistent humanitarian support and awareness for Gaza.'],
  ['calendar-outline', 'How monthly pledges work', 'Choose a pledge that suits you. Your pledge is a commitment goal; contribution verification is recorded separately when you submit a payment reference or screenshot.'],
  ['receipt-outline', 'Submitting a contribution', 'Open Contribute, choose your amount and payment method, then submit either the transaction message/reference or a payment screenshot for admin verification.'],
  ['shield-checkmark-outline', 'How payment proof is protected', 'New payment screenshots are stored privately. Admins receive only short-lived review access, and screenshots plus raw transaction messages/references are removed after 30 days.'],
  ['people-outline', 'Pledge Circles', 'Create a circle for family or friends, or join one with its code/share link. Circle progress uses participation and consistency rather than contribution amounts.'],
  ['notifications-outline', 'Notification preferences', 'Choose Quran, hadith, dua, motivation, pledge, Friday, campaign, impact, humanitarian and emergency notifications individually.'],
  ['trophy-outline', 'Goals and achievements', 'Set practical goals and track milestones such as consistency, impact engagement and community participation.'],
];

export default function TutorialsScreen() {
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}><View style={styles.hero}><Ionicons name="school-outline" size={32} color={Colors.goldLight}/><Text style={styles.title}>How Family Pledge Works</Text><Text style={styles.subtitle}>Quick guides for pledges, contributions, privacy, community and notifications.</Text></View>{GUIDES.map(([icon,title,body],index)=><AppCard key={title} style={styles.card}><View style={styles.row}><View style={styles.icon}><Ionicons name={icon as any} size={21} color={Colors.primary}/></View><View style={{flex:1}}><Text style={styles.guideTitle}>{index+1}. {title}</Text><Text style={styles.body}>{body}</Text></View></View></AppCard>)}</ScrollView>;
}
const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:Colors.cream},content:{padding:16,paddingBottom:40},hero:{backgroundColor:Colors.primaryDark,borderRadius:24,padding:22,alignItems:'center',marginBottom:16},title:{marginTop:8,fontSize:24,fontWeight:'900',color:Colors.white,textAlign:'center'},subtitle:{marginTop:6,color:'rgba(255,255,255,.8)',textAlign:'center',lineHeight:19},card:{marginBottom:10},row:{flexDirection:'row',gap:12},icon:{width:42,height:42,borderRadius:14,backgroundColor:'#E8F1F5',alignItems:'center',justifyContent:'center'},guideTitle:{fontSize:15,fontWeight:'900',color:Colors.text.primary},body:{marginTop:5,fontSize:12,lineHeight:18,color:Colors.text.secondary}});
