import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import { Colors } from '../../constants/colors';
import { deleteMyAccount } from '../../services/account';
import { logout } from '../../services/auth';

export default function DeleteAccountScreen() {
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const performDelete = async () => {
    if (password.length < 8) {
      Alert.alert('Password required', 'Enter your current password to confirm account deletion.');
      return;
    }
    setDeleting(true);
    try {
      await deleteMyAccount(password);
      await logout();
      Alert.alert(
        'Account deleted',
        'Your Family Pledge account and personal profile information have been removed. Contribution and pledge accounting records may remain in anonymized form.',
        [{ text: 'Done', onPress: () => router.replace('/') }],
      );
    } catch (error: any) {
      Alert.alert('Deletion failed', error?.response?.data?.detail || error?.message || 'Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete your account?',
      'This permanently removes your login access and personal profile information. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: performDelete },
      ],
    );
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.iconWrap}>
        <Ionicons name="warning-outline" size={34} color={Colors.emergency} />
      </View>
      <Text style={styles.title}>Delete Account</Text>
      <Text style={styles.intro}>
        Deleting your account removes your personal profile and access to Family Pledge. Only contribution and pledge accounting records are retained in anonymized form where needed for financial records.
      </Text>

      <AppCard style={styles.card}>
        <Text style={styles.heading}>What will be removed</Text>
        <Text style={styles.item}>• Name, nickname, email and phone number</Text>
        <Text style={styles.item}>• Country/city and public display identity</Text>
        <Text style={styles.item}>• Push notification token and email preferences</Text>
        <Text style={styles.item}>• Badges, rankings and collector/referral profile data</Text>
        <Text style={styles.item}>• Payment screenshots and raw transaction messages/references linked to your account</Text>
      </AppCard>

      <AppCard style={styles.card}>
        <Text style={styles.heading}>Confirm with your password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Current password"
          placeholderTextColor={Colors.gray[400]}
          style={styles.input}
        />
        <AppButton
          title="Delete My Account"
          onPress={confirmDelete}
          loading={deleting}
          style={styles.deleteButton}
          textStyle={{ color: Colors.white }}
          icon={<Ionicons name="trash-outline" size={18} color={Colors.white} />}
        />
      </AppCard>

      <Text style={styles.help}>
        Need help? Contact admin@familypledgekenya.org before deleting your account.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 18, paddingBottom: 40 },
  iconWrap: { alignSelf: 'center', width: 68, height: 68, borderRadius: 34, backgroundColor: '#FEECEC', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  title: { marginTop: 14, fontSize: 24, fontWeight: '900', color: Colors.text.primary, textAlign: 'center' },
  intro: { marginTop: 8, marginBottom: 18, fontSize: 14, lineHeight: 21, color: Colors.text.secondary, textAlign: 'center' },
  card: { marginBottom: 14 },
  heading: { fontSize: 16, fontWeight: '800', color: Colors.text.primary, marginBottom: 10 },
  item: { fontSize: 13, lineHeight: 21, color: Colors.text.secondary, marginBottom: 3 },
  input: { height: 50, borderWidth: 1.5, borderColor: Colors.border.light, borderRadius: 12, paddingHorizontal: 14, backgroundColor: Colors.gray[50], color: Colors.text.primary, fontSize: 15, marginBottom: 12 },
  deleteButton: { backgroundColor: Colors.emergency, borderColor: Colors.emergency },
  help: { fontSize: 12, lineHeight: 18, color: Colors.text.muted, textAlign: 'center' },
});
