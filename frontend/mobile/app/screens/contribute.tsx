import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import { submitContribution } from '../../services/api';
import { Config } from '../../constants/config';

const PAYMENT_METHODS = [
  { key: 'mpesa', label: 'M-PESA', icon: 'phone-portrait-outline', color: '#00A651' },
  { key: 'bank', label: 'Bank Transfer', icon: 'business-outline', color: Colors.primary },
  { key: 'paybill', label: 'Paybill', icon: 'barcode-outline', color: Colors.gold },
  { key: 'link', label: 'Pay Online', icon: 'link-outline', color: '#3B82F6' },
];

export default function ContributeScreen() {
  const [selectedMethod, setSelectedMethod] = useState('mpesa');
  const [reference, setReference] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenPaymentLink = () => {
    Linking.openURL(Config.PAYMENT_LINK);
  };

  const handleSubmit = async () => {
    if (!reference.trim()) {
      Alert.alert('Reference Required', 'Please enter your transaction reference number.');
      return;
    }
    setLoading(true);
    try {
      await submitContribution({
        amount: 10,
        currency: 'USD',
        reference: reference.trim(),
        proof_url: proofUrl.trim() || undefined,
        payment_method: selectedMethod,
      });
      Alert.alert(
        'Thank You! 🌙',
        'Your contribution has been submitted for verification. Jazakallahu Khayran.',
        [{ text: 'Done', onPress: () => { setReference(''); setProofUrl(''); } }]
      );
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="heart" size={32} color={Colors.white} />
          </View>
          <Text style={styles.heroTitle}>Contribute to Gaza</Text>
          <Text style={styles.heroSub}>Every USD 10 makes a difference</Text>
        </View>

        {/* Online Payment */}
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Pay Online</Text>
          <Text style={styles.cardDesc}>
            Click below to open the official Family Pledge payment portal and complete your USD 10 pledge securely.
          </Text>
          <TouchableOpacity onPress={handleOpenPaymentLink} style={styles.linkBtn} activeOpacity={0.85}>
            <Ionicons name="globe-outline" size={18} color={Colors.white} />
            <Text style={styles.linkBtnText}>Open familypledge.org</Text>
            <Ionicons name="open-outline" size={16} color={Colors.white} />
          </TouchableOpacity>
        </AppCard>

        {/* Payment Method */}
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>
          <View style={styles.methodGrid}>
            {PAYMENT_METHODS.map((m) => (
              <TouchableOpacity
                key={m.key}
                onPress={() => setSelectedMethod(m.key)}
                activeOpacity={0.8}
                style={[
                  styles.methodCard,
                  selectedMethod === m.key && { borderColor: m.color, backgroundColor: m.color + '10' },
                ]}
              >
                <Ionicons name={m.icon as any} size={22} color={selectedMethod === m.key ? m.color : Colors.gray[400]} />
                <Text style={[styles.methodLabel, selectedMethod === m.key && { color: m.color }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </AppCard>

        {/* Payment Instructions */}
        <AppCard style={styles.card} borderColor={Colors.gold}>
          <View style={styles.instructHeader}>
            <Ionicons name="information-circle" size={20} color={Colors.gold} />
            <Text style={styles.instructTitle}>Payment Instructions</Text>
          </View>
          <PaymentInstructions method={selectedMethod} />
        </AppCard>

        {/* Submit Reference */}
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Submit Proof</Text>
          <Text style={styles.cardDesc}>After paying, submit your transaction reference here so we can verify and record your contribution.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Transaction Reference *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="receipt-outline" size={18} color={Colors.gray[400]} />
              <TextInput
                value={reference}
                onChangeText={setReference}
                placeholder="e.g. QKR7XNPK, INV-2024-001"
                placeholderTextColor={Colors.gray[400]}
                style={styles.input}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Screenshot / Proof URL (optional)</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="image-outline" size={18} color={Colors.gray[400]} />
              <TextInput
                value={proofUrl}
                onChangeText={setProofUrl}
                placeholder="https://..."
                placeholderTextColor={Colors.gray[400]}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>

          <AppButton
            title="Submit Contribution"
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: 8 }}
            icon={<Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />}
          />
        </AppCard>

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
          <Text style={styles.footerText}>
            Secure · Transparent · Verified by NAMLEF
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PaymentInstructions({ method }: { method: string }) {
  const instructions: Record<string, { steps: string[]; note?: string }> = {
    mpesa: {
      steps: [
        'Go to M-PESA on your phone',
        'Select "Lipa na M-PESA" → "Paybill"',
        'Enter Paybill Number: [FROM ADMIN]',
        'Account Number: PLEDGE',
        'Amount: KES [equivalent of USD 10]',
        'Enter your PIN and confirm',
      ],
      note: 'You will receive an SMS confirmation with your reference number.',
    },
    bank: {
      steps: [
        'Bank: [Bank Name - FROM ADMIN]',
        'Account Name: NAMLEF Gaza Fund',
        'Account No: [FROM ADMIN]',
        'Branch: [FROM ADMIN]',
        'Reference: PLEDGE + your phone number',
        'Amount: USD 10 equivalent',
      ],
      note: 'Bank details will be confirmed by admin once activated.',
    },
    paybill: {
      steps: [
        'Paybill Number: [FROM ADMIN]',
        'Account: PLEDGE',
        'Amount: USD 10',
        'Save the confirmation SMS as proof',
      ],
    },
    link: {
      steps: [
        'Click "Open familypledge.org" above',
        'Select your preferred payment method',
        'Enter amount: USD 10',
        'Complete payment securely',
        'Download or screenshot your receipt',
      ],
    },
  };

  const inst = instructions[method];
  return (
    <View style={styles.instructList}>
      {inst.steps.map((step, i) => (
        <View key={i} style={styles.instructStep}>
          <View style={styles.stepNum}>
            <Text style={styles.stepNumText}>{i + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
      {inst.note && (
        <Text style={styles.instructNote}>{inst.note}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 16, paddingBottom: 32 },
  hero: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: Colors.white, marginBottom: 4 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  card: { marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary, marginBottom: 8 },
  cardDesc: { fontSize: 13, color: Colors.text.secondary, lineHeight: 20, marginBottom: 14 },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  linkBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  methodCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.light,
    gap: 6,
    backgroundColor: Colors.gray[50],
  },
  methodLabel: { fontSize: 12, fontWeight: '600', color: Colors.text.secondary },
  instructHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  instructTitle: { fontSize: 15, fontWeight: '700', color: Colors.text.primary },
  instructList: { gap: 10 },
  instructStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 13, color: Colors.text.secondary, lineHeight: 20 },
  instructNote: {
    fontSize: 12,
    color: Colors.gold,
    fontStyle: 'italic',
    marginTop: 4,
    fontWeight: '500',
  },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text.primary, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: Colors.text.primary },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  footerText: { fontSize: 12, color: Colors.text.secondary, fontWeight: '500' },
});
