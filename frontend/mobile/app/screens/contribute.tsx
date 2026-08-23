import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import { createPledge, getMe } from '../../services/api';
import { getPaymentStatus, initiateMpesaPayment, PaymentRecord } from '../../services/payments';
import { PAYMENT_SETTINGS, currentContributionMonth } from '../../constants/payment';
import { copyText } from '../../services/webCompat';

type PledgeOptionKey = 'usd10' | 'usd20' | 'usd50' | 'usd100' | 'open' | 'free';
type PaymentMethod = 'mpesa' | 'bank';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function newIdempotencyKey() {
  return `fp-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function ContributeScreen() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mpesa');
  const [selectedOption, setSelectedOption] = useState<PledgeOptionKey>('usd10');
  const [openAmount, setOpenAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptedAgreement, setAcceptedAgreement] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);

  useEffect(() => {
    getMe()
      .then((user) => {
        if (user.phone) setPhone(user.phone);
      })
      .catch(() => undefined);
  }, []);

  const selected = useMemo(
    () => PAYMENT_SETTINGS.pledgeOptions.find((option) => option.key === selectedOption) || PAYMENT_SETTINGS.pledgeOptions[0],
    [selectedOption]
  );

  const amount = selectedOption === 'open' ? Number(openAmount || 0) : selected.amount;
  const isFreePledge = selectedOption === 'free';

  const validate = () => {
    if (!acceptedAgreement) {
      Alert.alert('Pledge Agreement Required', 'Please review and accept the voluntary Family Pledge before continuing.');
      return false;
    }
    if (!isFreePledge && (!amount || amount < 1)) {
      Alert.alert('Amount Required', 'Please choose an amount or enter your amount.');
      return false;
    }
    if (!isFreePledge && selectedMethod === 'mpesa' && !phone.trim()) {
      Alert.alert('M-PESA Number Required', 'Enter the M-PESA phone number that should receive the payment prompt.');
      return false;
    }
    return true;
  };

  const savePledge = () => createPledge({
    pledge_type: isFreePledge ? 'free_participant' : 'monthly',
    amount: isFreePledge ? 0 : amount,
    currency: selected.currency,
    start_date: new Date().toISOString().slice(0, 10),
    agreement_accepted: true,
  });

  const pollPayment = async (initial: PaymentRecord): Promise<PaymentRecord> => {
    let latest = initial;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (['succeeded', 'failed', 'cancelled', 'expired'].includes(latest.status)) return latest;
      await sleep(3000);
      latest = await getPaymentStatus(latest.id);
      setPayment(latest);
    }
    return latest;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setPayment(null);
    try {
      const pledge = await savePledge();

      if (isFreePledge) {
        Alert.alert(
          'Pledge Signed 🌙',
          'Your voluntary Family Pledge is signed and active. No payment is required.',
          [{ text: 'View My Pledge', onPress: () => router.replace('/screens/my-pledge') }]
        );
        return;
      }

      if (selectedMethod === 'bank') {
        Alert.alert(
          'Pledge Signed',
          'Your pledge is saved. Use the DIB Bank details shown on this page if you choose bank transfer. Bank transfers are not automatically reconciled yet, so they will not be marked paid until the bank integration is added.'
        );
        return;
      }

      const started = await initiateMpesaPayment({
        pledge_id: pledge.id,
        phone: phone.trim(),
        contribution_month: currentContributionMonth(),
        idempotency_key: newIdempotencyKey(),
      });
      setPayment(started.payment);
      const finalPayment = await pollPayment(started.payment);

      if (finalPayment.status === 'succeeded') {
        const settled = finalPayment.settlement_amount != null
          ? `${finalPayment.settlement_currency} ${Number(finalPayment.settlement_amount).toLocaleString()}`
          : 'M-PESA payment';
        Alert.alert(
          'Payment Received ✓',
          `${settled} received successfully.${finalPayment.mpesa_receipt_number ? `\nReceipt: ${finalPayment.mpesa_receipt_number}` : ''}`,
          [{ text: 'View My Pledge', onPress: () => router.replace('/screens/my-pledge') }]
        );
      } else if (finalPayment.status === 'cancelled') {
        Alert.alert('Payment Cancelled', 'The M-PESA payment was not completed. No contribution was recorded. You can try again.');
      } else if (finalPayment.status === 'failed' || finalPayment.status === 'expired') {
        Alert.alert('Payment Unsuccessful', 'No successful M-PESA payment was confirmed. No contribution was recorded. You can try again.');
      } else {
        Alert.alert(
          'Payment Still Processing',
          'We are still waiting for M-PESA confirmation. Do not start another payment yet. You can leave this screen and check My Pledge later.'
        );
      }
    } catch (err: any) {
      Alert.alert('Payment Could Not Start', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="heart" size={30} color={Colors.white} /></View>
          <Text style={styles.heroTitle}>Your Family Pledge</Text>
          <Text style={styles.heroSub}>Choose your monthly pledge, sign it, then pay securely with M-PESA. Payment confirmation is automatic.</Text>
        </View>

        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Choose pledge amount</Text>
          <View style={styles.optionGrid}>
            {PAYMENT_SETTINGS.pledgeOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                onPress={() => { setSelectedOption(option.key as PledgeOptionKey); setPayment(null); }}
                style={[styles.amountOption, selectedOption === option.key && styles.amountOptionActive]}
                activeOpacity={0.85}
              >
                <Text style={[styles.amountLabel, selectedOption === option.key && styles.amountLabelActive]}>{option.label}</Text>
                <Text style={[styles.amountHelper, selectedOption === option.key && styles.amountHelperActive]}>{option.helper}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedOption === 'open' && (
            <View style={[styles.inputWrap, styles.openInput]}>
              <Ionicons name="cash-outline" size={18} color={Colors.gray[400]} />
              <TextInput value={openAmount} onChangeText={setOpenAmount} placeholder="Enter amount in USD" keyboardType="numeric" placeholderTextColor={Colors.gray[400]} style={styles.input} />
            </View>
          )}
        </AppCard>

        <AppCard style={styles.card} borderColor={acceptedAgreement ? Colors.primary : Colors.border.light}>
          <View style={styles.agreementHeader}>
            <Ionicons name="document-text-outline" size={21} color={Colors.primaryDark} />
            <Text style={styles.cardTitleInline}>Review & sign your pledge</Text>
          </View>
          <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: acceptedAgreement }} onPress={() => setAcceptedAgreement((value) => !value)} style={[styles.agreementCheck, acceptedAgreement && styles.agreementCheckActive]}>
            <Ionicons name={acceptedAgreement ? 'checkbox' : 'square-outline'} size={24} color={acceptedAgreement ? Colors.primary : Colors.gray[500]} />
            <Text style={styles.agreementCheckText}>{isFreePledge
              ? 'I agree to keep making du’a for my brothers and sisters in Gaza and to support this humanitarian effort.'
              : 'I agree to contribute every month to help my brothers and sisters in Gaza. I understand this pledge is voluntary and can be changed or paused.'}</Text>
          </TouchableOpacity>
        </AppCard>

        {!isFreePledge && (
          <AppCard style={styles.card}>
            <Text style={styles.cardTitle}>Payment method</Text>
            <View style={styles.methodGrid}>
              {PAYMENT_SETTINGS.methods.map((method) => (
                <TouchableOpacity
                  key={method.key}
                  onPress={() => { setSelectedMethod(method.key as PaymentMethod); setPayment(null); }}
                  activeOpacity={0.8}
                  style={[styles.methodCard, selectedMethod === method.key && { borderColor: method.color, backgroundColor: method.color + '10' }]}
                >
                  <Ionicons name={method.icon as any} size={22} color={selectedMethod === method.key ? method.color : Colors.gray[400]} />
                  <Text style={[styles.methodLabel, selectedMethod === method.key && { color: method.color }]}>{method.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </AppCard>
        )}

        {!isFreePledge && selectedMethod === 'mpesa' && (
          <AppCard style={styles.card} borderColor={Colors.primary}>
            <View style={styles.instructHeader}>
              <Ionicons name="phone-portrait-outline" size={21} color={Colors.primaryDark} />
              <View style={{ flex: 1 }}>
                <Text style={styles.instructTitle}>Pay with M-PESA</Text>
                <Text style={styles.cardDesc}>An STK Push will be sent to this number. Enter your PIN only in the official M-PESA prompt.</Text>
              </View>
            </View>
            <Text style={styles.label}>M-PESA phone number</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={18} color={Colors.gray[400]} />
              <TextInput value={phone} onChangeText={setPhone} placeholder="e.g. 0728 123 456" keyboardType="phone-pad" placeholderTextColor={Colors.gray[400]} style={styles.input} />
            </View>
            <View style={styles.summaryBox}>
              <SummaryRow label="Family Pledge" value={`${selected.currency} ${Number(amount || 0).toLocaleString()}`} />
              {payment?.settlement_amount != null && <SummaryRow label="M-PESA amount" value={`${payment.settlement_currency} ${Number(payment.settlement_amount).toLocaleString()}`} />}
              {payment && <SummaryRow label="Status" value={payment.status.replace(/_/g, ' ')} />}
              {payment?.mpesa_receipt_number && <SummaryRow label="Receipt" value={payment.mpesa_receipt_number} />}
            </View>
            {payment && ['created', 'initiating', 'pending'].includes(payment.status) && (
              <View style={styles.processingBox}>
                <Ionicons name="time-outline" size={19} color={Colors.primaryDark} />
                <Text style={styles.processingText}>Check your phone and complete the M-PESA prompt. Do not start another payment while this one is processing.</Text>
              </View>
            )}
          </AppCard>
        )}

        {!isFreePledge && selectedMethod === 'bank' && (
          <AppCard style={styles.card} borderColor={Colors.pink}>
            <View style={styles.instructHeader}>
              <Ionicons name="business-outline" size={20} color={Colors.pinkDark} />
              <View style={{ flex: 1 }}>
                <Text style={styles.instructTitle}>DIB Bank transfer</Text>
                <Text style={styles.cardDesc}>Copy the official bank details below. Bank transfers are available as an alternative but are not yet automatically reconciled in the app.</Text>
              </View>
            </View>
            <BankDetails onCopy={(label, value) => copyText(label, value)} />
          </AppCard>
        )}

        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>{isFreePledge ? 'Finish free pledge' : selectedMethod === 'mpesa' ? 'Complete M-PESA payment' : 'Save pledge'}</Text>
          <Text style={styles.cardDesc}>{isFreePledge
            ? 'No payment is required.'
            : selectedMethod === 'mpesa'
              ? 'No screenshot or transaction reference is required. M-PESA confirms the payment directly to Family Pledge.'
              : 'No screenshot is required. Bank automation will be added separately.'}</Text>
          <AppButton
            title={isFreePledge ? 'Sign Free Pledge' : selectedMethod === 'mpesa' ? `Pay ${selected.label} with M-PESA` : 'Sign Pledge'}
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: 8 }}
            icon={<Ionicons name={selectedMethod === 'mpesa' && !isFreePledge ? 'phone-portrait-outline' : 'checkmark-circle-outline'} size={18} color={Colors.white} />}
          />
        </AppCard>

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
          <Text style={styles.footerText}>M-PESA confirmation is automatic · No screenshots · No admin payment approval</Text>
        </View>
        <AppCard style={styles.contactCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.primary} />
          <View style={{ flex: 1 }}><Text style={styles.contactTitle}>Need help?</Text><TouchableOpacity onPress={() => router.push('/support')}><Text style={styles.contactEmail}>Message Family Pledge Support</Text></TouchableOpacity></View>
        </AppCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>;
}

function BankDetails({ onCopy }: { onCopy: (label: string, value: string) => void }) {
  const bank = PAYMENT_SETTINGS.bank;
  const rows = [
    ['Bank', bank.bankName],
    ['Account Name', bank.accountName],
    ['Account Number', bank.accountNumber],
    ['Currency', bank.currency],
    ['Branch', bank.branchName],
    ['SWIFT', bank.swiftCode],
    ['Intermediary Bank (USD)', bank.intermediaryBankUsd],
    ['Intermediary SWIFT', bank.intermediarySwiftCode],
  ];
  return <View style={styles.detailList}>{rows.map(([label, value]) => (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Copy ${label}`} key={label} style={styles.detailRow} onPress={() => onCopy(label, value)}>
      <View style={{ flex: 1 }}><Text style={styles.detailLabel}>{label}</Text><Text selectable style={styles.detailValue}>{value}</Text></View>
      <Ionicons name="copy-outline" size={18} color={Colors.primary} />
    </TouchableOpacity>
  ))}</View>;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 16, paddingBottom: 32 },
  hero: { backgroundColor: Colors.primaryDark, borderRadius: 28, padding: 24, alignItems: 'center', marginBottom: 16 },
  heroIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: Colors.white, marginBottom: 6 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.84)', textAlign: 'center', lineHeight: 21 },
  card: { marginBottom: 16 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: Colors.text.primary, marginBottom: 8 },
  cardTitleInline: { fontSize: 17, fontWeight: '800', color: Colors.text.primary },
  cardDesc: { fontSize: 13, color: Colors.text.secondary, lineHeight: 20, marginBottom: 12 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  amountOption: { width: '48%', borderWidth: 1.5, borderColor: Colors.border.light, borderRadius: 14, padding: 12, backgroundColor: Colors.white },
  amountOptionActive: { borderColor: Colors.primary, backgroundColor: '#F0FDF4' },
  amountLabel: { color: Colors.text.primary, fontSize: 16, fontWeight: '900' },
  amountLabelActive: { color: Colors.primaryDark },
  amountHelper: { marginTop: 3, color: Colors.text.muted, fontSize: 10, lineHeight: 14 },
  amountHelperActive: { color: Colors.primaryDark },
  openInput: { marginTop: 12 },
  agreementHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  agreementCheck: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderColor: Colors.border.light, borderRadius: 14, padding: 12 },
  agreementCheckActive: { backgroundColor: '#F0FDF4', borderColor: Colors.primary },
  agreementCheckText: { flex: 1, color: Colors.text.secondary, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  methodGrid: { flexDirection: 'row', gap: 10 },
  methodCard: { flex: 1, minHeight: 86, borderWidth: 1.5, borderColor: Colors.border.light, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: Colors.white },
  methodLabel: { color: Colors.text.secondary, fontSize: 12, fontWeight: '800' },
  instructHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
  instructTitle: { fontSize: 16, fontWeight: '900', color: Colors.text.primary, marginBottom: 3 },
  label: { color: Colors.text.secondary, fontWeight: '800', fontSize: 12, marginBottom: 6 },
  inputWrap: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: Colors.border.light, backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  input: { flex: 1, minHeight: 46, color: Colors.text.primary, fontSize: 14 },
  summaryBox: { marginTop: 12, backgroundColor: '#F7FBF8', borderRadius: 14, paddingHorizontal: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border.light },
  summaryLabel: { color: Colors.text.secondary, fontSize: 12 },
  summaryValue: { color: Colors.text.primary, fontSize: 12, fontWeight: '900', textTransform: 'capitalize', textAlign: 'right' },
  processingBox: { marginTop: 12, borderRadius: 13, backgroundColor: '#ECFDF5', padding: 12, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  processingText: { flex: 1, color: Colors.primaryDark, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  detailList: { gap: 7 },
  detailRow: { flexDirection: 'row', gap: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border.light, borderRadius: 12, padding: 11, backgroundColor: Colors.white },
  detailLabel: { color: Colors.text.muted, fontSize: 10, fontWeight: '700' },
  detailValue: { marginTop: 2, color: Colors.text.primary, fontSize: 13, fontWeight: '900' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 14 },
  footerText: { color: Colors.text.muted, fontSize: 10, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactTitle: { fontSize: 13, fontWeight: '800', color: Colors.text.primary },
  contactEmail: { marginTop: 2, fontSize: 12, color: Colors.primary, fontWeight: '700' },
});
