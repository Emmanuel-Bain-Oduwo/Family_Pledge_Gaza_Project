import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import { getCampaignById, recordEngagementEvent } from '../../services/api';
import { Campaign } from '../../types';
import { FamilyPledgeLinks } from '../../constants/links';

export default function CampaignDetailsScreen() {
  const params=useLocalSearchParams<{id?:string}>();const id=Array.isArray(params.id)?params.id[0]:params.id;
  const[campaign,setCampaign]=useState<Campaign|null>(null);const[loading,setLoading]=useState(Boolean(id));const[error,setError]=useState<string|null>(null);const[failedImage,setFailedImage]=useState(false);
  const load=async()=>{if(!id)return;setLoading(true);setError(null);try{setCampaign(await getCampaignById(id));}catch(e){setCampaign(null);setError(e instanceof Error?e.message:'Please try again.');}finally{setLoading(false);}};
  useEffect(()=>{void load();},[id]);
  const share=async()=>{if(!campaign)return;await Share.share({message:`${campaign.title}\n${campaign.description}\n\nLearn more through Family Pledge: ${FamilyPledgeLinks.website}`});await recordEngagementEvent('campaign_shared','campaign',campaign.id);};
  const supporters=campaign?.donor_count??campaign?.current_donors??0;const donorTarget=campaign?.donor_target??campaign?.target_donors??0;
  const percent=useMemo(()=>{if(!campaign)return 0;if(campaign.target_amount&&campaign.target_amount>0)return Math.min(100,Math.round(((campaign.raised_amount||0)/campaign.target_amount)*100));if(donorTarget>0)return Math.min(100,Math.round((supporters/donorTarget)*100));return 0;},[campaign,donorTarget,supporters]);
  const cover=campaign?.cover_image_url||campaign?.image_url;
  if(loading)return <LoadingState fullScreen message="Loading campaign..."/>;
  if(error)return <View style={styles.errorWrap}><EmptyState icon="cloud-offline-outline" title="Could not load campaign" description={error}/><AppButton title="Try Again" onPress={()=>void load()} style={styles.btn}/><AppButton title="View All Campaigns" onPress={()=>router.push('/tabs/campaigns')} variant="outline" style={styles.btn}/></View>;
  if(!campaign)return <View style={styles.errorWrap}><EmptyState icon="megaphone-outline" title="Campaign not found" description="Choose a verified Family Pledge campaign from the Campaigns tab."/><AppButton title="View All Campaigns" onPress={()=>router.push('/tabs/campaigns')} style={styles.btn}/></View>;

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <AppCard style={styles.card}>
      {cover&&!failedImage?<Image source={{uri:cover}} style={styles.cover} resizeMode="cover" onError={()=>setFailedImage(true)}/>:<View style={styles.iconBlock}><Ionicons name={campaign.is_urgent?'alert-circle':'megaphone'} size={38} color={campaign.is_urgent?'#DC2626':Colors.primary}/></View>}
      <View style={styles.body}>{campaign.is_urgent&&<View style={styles.urgent}><Ionicons name="flash" size={13} color="#B91C1C"/><Text style={styles.urgentText}>Urgent campaign</Text></View>}<Text style={styles.title}>{campaign.title}</Text><Text style={styles.desc}>{campaign.description}</Text>
        <View style={styles.progressBlock}><View style={styles.progressHead}><Text style={styles.progressLabel}>Campaign progress</Text><Text style={styles.progressPct}>{percent}%</Text></View><View style={styles.track}><View style={[styles.fill,{width:`${percent}%`}]} /></View></View>
        <View style={styles.stats}><Metric label="Supporters" value={supporters.toLocaleString()}/>{campaign.target_amount?<Metric label="Raised" value={`${campaign.raised_amount||0}/${campaign.target_amount}`}/>:donorTarget?<Metric label="Target" value={donorTarget.toLocaleString()}/>:null}</View>
      </View>
    </AppCard>
    {campaign.video_url&&<AppButton title="Watch Verified Campaign Video" onPress={()=>Linking.openURL(campaign.video_url!)} style={styles.btn} icon={<Ionicons name="play-circle-outline" size={18} color={Colors.white}/>}/>}<AppButton title="Share Verified Campaign" onPress={share} style={styles.btn} icon={<Ionicons name="share-social-outline" size={18} color={Colors.white}/>}/><AppButton title="Contribute Now" onPress={()=>router.push('/screens/contribute')} variant="outline" style={styles.btn}/><AppButton title="View All Campaigns" onPress={()=>router.push('/tabs/campaigns')} variant="outline" style={styles.btn}/>
  </ScrollView>;
}
function Metric({label,value}:{label:string;value:string|number}){return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>}
const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:Colors.cream},content:{padding:16,paddingBottom:32},errorWrap:{flex:1,backgroundColor:Colors.cream,padding:16,justifyContent:'center'},card:{marginBottom:16,padding:0,overflow:'hidden'},cover:{width:'100%',height:220},body:{padding:20,alignItems:'center'},iconBlock:{height:190,width:'100%',backgroundColor:Colors.primary+'10',alignItems:'center',justifyContent:'center'},urgent:{flexDirection:'row',alignItems:'center',gap:5,backgroundColor:'#FEE2E2',borderRadius:20,paddingHorizontal:10,paddingVertical:5,marginBottom:10},urgentText:{fontSize:11,fontWeight:'800',color:'#B91C1C',textTransform:'uppercase'},title:{fontSize:22,fontWeight:'900',color:Colors.text.primary,marginBottom:8,textAlign:'center'},desc:{fontSize:14,color:Colors.text.secondary,textAlign:'center',lineHeight:22},progressBlock:{width:'100%',marginTop:20},progressHead:{flexDirection:'row',justifyContent:'space-between',marginBottom:7},progressLabel:{fontSize:12,fontWeight:'700',color:Colors.text.secondary},progressPct:{fontSize:12,fontWeight:'900',color:Colors.primary},track:{height:9,backgroundColor:Colors.gray[100],borderRadius:99,overflow:'hidden'},fill:{height:'100%',backgroundColor:Colors.primary,borderRadius:99},stats:{flexDirection:'row',gap:8,marginTop:16,width:'100%'},metric:{flex:1,backgroundColor:Colors.gray[50],borderRadius:13,padding:10,alignItems:'center'},metricValue:{fontSize:16,fontWeight:'900',color:Colors.primary},metricLabel:{fontSize:10,color:Colors.text.muted,marginTop:2},btn:{marginBottom:12}});
