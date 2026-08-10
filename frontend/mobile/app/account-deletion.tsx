import React from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import LegalPage from '../components/LegalPage';
import { Colors } from '../constants/colors';

export default function AccountDeletionPage() {
  return (
    <View style={styles.root}>
      <LegalPage
        title="Account Deletion"
        subtitle="How to permanently delete your Family Pledge account and personal profile information."
        sections={[
          {
            title: 'Delete from the app',
            paragraphs: [
              'If you can sign in, open Profile → Account & Privacy → Delete Account. You will be asked to re-enter your current password and confirm the deletion.',
              'After deletion, your login access and personal profile information are removed. Contribution and pledge accounting records may remain linked only to an anonymized internal identifier.',
            ],
          },
          {
            title: 'What is removed',
            paragraphs: [
              'We remove name, nickname, email, phone number, country/city, push-notification token, public display identity, email preferences, badges/rankings and collector/referral profile data associated with the app account.',
              'Payment screenshots and raw transaction message/reference information associated with the account are removed. Under normal operation, sensitive proof data is retained for no more than 30 days even if the account remains active.',
            ],
          },
          {
            title: 'If you cannot access the app',
            paragraphs: [
              'Send an account-deletion request to admin@familypledgekenya.org from the email address associated with your account, or include the phone number used for the account. We may ask for reasonable verification before processing the request so another person cannot delete your account without authorization.',
              'Use the subject “Family Pledge Account Deletion Request”. Do not send passwords, payment screenshots or banking credentials by email.',
            ],
          },
          {
            title: 'Records that may remain',
            paragraphs: [
              'Family Pledge retains only contribution and pledge accounting records after account anonymization where needed for legitimate financial or audit records. These retained records no longer contain the deleted profile name, email, phone or location fields.',
            ],
          },
        ]}
      />
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primary} onPress={() => router.push('/screens/delete-account')}>
          <Ionicons name="trash-outline" size={18} color={Colors.white} />
          <Text style={styles.primaryText}>Delete in App</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} onPress={() => Linking.openURL('mailto:admin@familypledgekenya.org?subject=Family%20Pledge%20Account%20Deletion%20Request')}>
          <Ionicons name="mail-outline" size={18} color={Colors.primary} />
          <Text style={styles.secondaryText}>Email Deletion Request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  actions: { position: Platform.OS === 'web' ? 'fixed' as any : 'absolute', left: 16, right: 16, bottom: 16, flexDirection: 'row', gap: 8 },
  primary: { flex: 1, backgroundColor: Colors.emergency, borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  primaryText: { color: Colors.white, fontWeight: '800' },
  secondary: { flex: 1, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.primary, borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  secondaryText: { color: Colors.primary, fontWeight: '800' },
});
