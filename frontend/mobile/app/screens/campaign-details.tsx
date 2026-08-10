import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import LoadingState from '../../components/LoadingState';
import { getCampaignById, recordEngagementEvent } from '../../services/api';
import { Campaign } from '../../types';
import { FamilyPledgeLinks } from '../../constants/links';

export default function CampaignDetailsScreen() {
  const params=useLocalSearchParams<{id?:string}>(); const id=Array.isArray(params.id)?params.id[0]:params.id;
  const[campaign,setCampaign]=useState<Campaign|null>(null);const[loading,setLoading]=useState(Boolean(id));
  useEffect(()=>{if(!id)return;getCampaignById(id).then(setCampaign).catch((e)=>Alert.alert('Could not load campaign',e.message||'Please try again.')).finally(()=>setLoading(false));},[id]);
  const share=async()=>{if(!campaign)return;await Share.share({message:`${campaign.title}\n${campaign.description}\n\nLearn more through Family Pledge: ${FamilyPledgeLinks.website}`});await recordEngagementEvent('campaign_shared','campaign',campaign.id);};
  if(loading)return <LoadingState fullScreen message="Loading campaign..."/>;
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><AppCard style={styles.card}><View style={styles.iconBlock}><Ionicons name="megaphone" size={36} color={Colors.primary}/></View><Text style={styles.title}>{campaign?.title||'Campaign Details'}</Text><Text style={styles.desc}>{campaign?.description||'Select a verified campaign from the Campaigns tab to see details and contribution options.'}</Text>{campaign&&<View style={styles.stats}><Metric label="Supporters" value={campaign.donor_count??campaign.current_donors??0}/>{campaign.target_amount?<Metric label="Raised" value={`${campaign.raised_amount||0}/${campaign.target_amount}`}/>:null}</View>}</AppCard>{campaign&&<AppButton title="Share Verified Campaign" onPress={share} style={styles.btn} icon={<Ionicons name="share-social-outline" size={18} color={Colors.white}/>}/>}<AppButton title="Contribute Now" onPress={()=>router.push('/screens/contribute')} variant={campaign?'outline':'primary'} style={styles.btn}/><AppButton title="View All Campaigns" onPress={()=>router.push('/tabs/campaigns')} variant="outline" style={styles.btn}/></ScrollView>;
}
function Metric({label,value}:{label:string;value:string|number}){return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>}
const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:Colors.cream},content:{padding:16,paddingBottom:32},card:{marginBottom:16,alignItems:'center',paddingVertical:28},iconBlock:{width:72,height:72,borderRadius:36,backgroundColor:Colors.primary+'15',alignItems:'center',justifyContent:'center',marginBottom:16},title:{fontSize:21,fontWeight:'900',color:Colors.text.primary,marginBottom:8,textAlign:'center'},desc:{fontSize:14,color:Colors.text.secondary,textAlign:'center',lineHeight:22},stats:{flexDirection:'row',gap:8,marginTop:16,width:'100%'},metric:{flex:1,backgroundColor:Colors.gray[50],borderRadius:13,padding:10,alignItems:'center'},metricValue:{fontSize:16,fontWeight:'900',color:Colors.primary},metricLabel:{fontSize:10,color:Colors.text.muted,marginTop:2},btn:{marginBottom:12}});
