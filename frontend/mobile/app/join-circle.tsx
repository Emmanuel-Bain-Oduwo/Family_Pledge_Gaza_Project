import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/colors';
import AppButton from '../components/AppButton';
import { getToken } from '../services/auth';
import { joinPledgeCircle } from '../services/api';
import { savePendingCircleCode } from '../services/pendingCircle';

export default function JoinCircleScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const raw = Array.isArray(params.code) ? params.code[0] : params.code;
  const code = (raw || '').trim().toUpperCase();
  const [checking, setChecking] = useState(true);
  const [joining, setJoining] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      setAuthenticated(Boolean(token));
      if (code && !token) await savePendingCircleCode(code);
      setChecking(false);
    })();
  }, [code]);

  const join = async () => {
    if (!code) return;
    setJoining(true);
    try {
      const circle = await joinPledgeCircle(code);
      router.replace({ pathname: '/screens/circle-details', params: { id: circle.id } });
    } catch (e: any) {
      Alert.alert('Could not join circle', e.message || 'This invite may be invalid or inactive.');
    } finally { setJoining(false); }
  };

  if (checking) return <View style={styles.center}><Text style={styles.muted}>Checking invite…</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.icon}><Ionicons name="people" size={36} color={Colors.primary} /></View>
      <Text style={styles.title}>Join a Pledge Circle</Text>
      <Text style={styles.text}>{code ? `Invite code ${code}` : 'This invite link does not contain a circle code.'}</Text>
      {authenticated ? (
        <AppButton title="Join Circle" onPress={join} loading={joining} disabled={!code} style={styles.button} />
      ) : (
        <>
          <Text style={styles.helper}>Sign in or create your Family Pledge account. This invite will be remembered and joined automatically after authentication.</Text>
          <AppButton title="Sign In" onPress={() => router.push('/auth/login')} style={styles.button} />
          <AppButton title="Create Account" onPress={() => router.push('/auth/register')} variant="outline" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream, padding: 24, justifyContent: 'center', alignItems: 'center' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cream }, icon: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#E8F1F5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }, title: { fontSize: 25, fontWeight: '900', color: Colors.text.primary, textAlign: 'center' }, text: { marginTop: 8, fontSize: 14, color: Colors.primary, fontWeight: '800' }, helper: { marginVertical: 16, textAlign: 'center', color: Colors.text.secondary, lineHeight: 20 }, button: { marginTop: 18, width: '100%' }, muted: { color: Colors.text.muted },
});
