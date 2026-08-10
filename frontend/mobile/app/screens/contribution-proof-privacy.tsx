import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppCard from '../../components/AppCard';

const STEPS=[
 ['cloud-upload-outline','Private upload','New payment screenshots are uploaded to a private contribution-proof storage bucket. They are not published on the Family Pledge media domain.'],
 ['shield-checkmark-outline','Admin review','Authorized admins request a short-lived signed viewing link only when they need to review the proof.'],
 ['timer-outline','30-day retention','Payment screenshots and raw transaction messages/references are retained for up to 30 days, then removed by the retention process.'],
 ['receipt-outline','Accounting history','Contribution and pledge accounting records such as amount, currency, month and verification status may remain without the deleted proof material.'],
] as const;
export default function ContributionProofPrivacyScreen(){return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}><View style={styles.hero}><Ionicons name="shield-checkmark" size={36} color={Colors.goldLight}/><Text style={styles.title}>Contribution Proof Privacy</Text><Text style={styles.sub}>How Family Pledge handles payment screenshots and transaction messages.</Text></View>{STEPS.map(([icon,title,text])=><AppCard key={title} style={styles.card}><View style={styles.row}><View style={styles.icon}><Ionicons name={icon as any} size={22} color={Colors.primary}/></View><View style={{flex:1}}><Text style={styles.stepTitle}>{title}</Text><Text style={styles.text}>{text}</Text></View></View></AppCard>)}</ScrollView>}
const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:Colors.cream},content:{padding:16,paddingBottom:40},hero:{backgroundColor:Colors.primaryDark,borderRadius:24,padding:22,alignItems:'center',marginBottom:16},title:{marginTop:8,fontSize:23,fontWeight:'900',color:Colors.white,textAlign:'center'},sub:{marginTop:6,color:'rgba(255,255,255,.8)',textAlign:'center',lineHeight:19},card:{marginBottom:10},row:{flexDirection:'row',gap:12},icon:{width:44,height:44,borderRadius:14,backgroundColor:'#E8F1F5',alignItems:'center',justifyContent:'center'},stepTitle:{fontSize:15,fontWeight:'900',color:Colors.text.primary},text:{marginTop:5,fontSize:12,lineHeight:18,color:Colors.text.secondary}});
