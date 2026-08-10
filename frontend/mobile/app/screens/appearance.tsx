import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { AppearancePreference, getAppearancePreference, setAppearancePreference } from '../../services/appearance';

const OPTIONS: { value: AppearancePreference; title: string; description: string; icon: string }[] = [
  { value: 'system', title: 'System', description: 'Follow your phone or browser appearance setting.', icon: 'phone-portrait-outline' },
  { value: 'light', title: 'Light', description: 'Prefer a light app appearance.', icon: 'sunny-outline' },
  { value: 'dark', title: 'Dark', description: 'Prefer dark native controls while Family Pledge completes its full dark-theme visual pass.', icon: 'moon-outline' },
];

export default function AppearanceScreen() {
  const [selected, setSelected] = useState<AppearancePreference>('system');
  useEffect(() => { getAppearancePreference().then(setSelected); }, []);
  const choose = async (value: AppearancePreference) => { setSelected(value); await setAppearancePreference(value); };
  return <View style={styles.container}><Text style={styles.title}>Appearance</Text><Text style={styles.subtitle}>Choose how Family Pledge should follow your device appearance.</Text>{OPTIONS.map((option)=><TouchableOpacity key={option.value} style={[styles.row,selected===option.value&&styles.selected]} onPress={()=>choose(option.value)}><View style={styles.icon}><Ionicons name={option.icon as any} size={22} color={Colors.primary}/></View><View style={{flex:1}}><Text style={styles.rowTitle}>{option.title}</Text><Text style={styles.desc}>{option.description}</Text></View><Ionicons name={selected===option.value?'checkmark-circle':'ellipse-outline'} size={22} color={selected===option.value?Colors.primary:Colors.gray[300]}/></TouchableOpacity>)}</View>;
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:Colors.cream,padding:16},title:{fontSize:26,fontWeight:'900',color:Colors.text.primary,marginBottom:5},subtitle:{fontSize:13,lineHeight:19,color:Colors.text.secondary,marginBottom:18},row:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:Colors.white,borderWidth:1,borderColor:Colors.border.light,borderRadius:16,padding:14,marginBottom:10},selected:{borderColor:Colors.primary,backgroundColor:'#EFF6F8'},icon:{width:42,height:42,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:'#E8F1F5'},rowTitle:{fontSize:15,fontWeight:'900',color:Colors.text.primary},desc:{marginTop:3,fontSize:11,lineHeight:16,color:Colors.text.secondary}});
