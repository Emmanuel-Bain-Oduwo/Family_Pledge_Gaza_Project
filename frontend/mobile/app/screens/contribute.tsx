import React, { useMemo, useState } from 'react';
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
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import { createPledge, submitContribution } from '../../services/api';
import { Config } from '../../constants/config';
import { PAYMENT_SETTINGS, currentContributionMonth } from '../../constants/payment';

type PledgeOptionKey = 'kes10' | 'usd10' | 'usd20' | 'usd50' | 'open' | 'free';

export default function ContributeScreen() {
  const [selectedMethod, setSelectedMethod] = useState('mpesa');
  const [selectedOption, setSelectedOption] = useState<PledgeOptionKey>('usd10');
  const [openAmount, setOpenAmount] = useState('');
  const [reference, setReference] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const selected = useMemo(
    () => PAYMENT_SETTINGS.pledgeOptions.find((o) => o.key === selectedOption) || PAYMENT_SETTINGS.pledgeOptions[1],
    [selectedOption]
  );

  const amount = selectedOption === 'open' ? Number(openAmount || 0) : selected.amount;
  const isFreePledge = selectedOption === 'free';

  const copy = (label: string, value: string) => {
    Clipboard.setString(value);
    Alert.alert('Copied', `${label} copied.`);
  };

  const handleOpenPaymentLink = () => Linking.openURL(Config.PAYMENT_LINK);

  const handleSubmit = async () => {
    if (!isFreePledge && (!amount || amount < 1)) {
      Alert.alert('Amount Required', 'Please choose an amount or enter your open amount.');
      return;
    }
    if (!isFreePledge && !reference.trim()) {
      Alert.alert('Reference Required', 'Please enter your transaction reference after payment.');
      return;
    }
    setLoading(true);
    try {
      if (isFreePledge) {
        await createPledge({
          pledge_type: 'free_participant',
          amount: 0,
          currency: selected.currency,
          start_date: new Date().toISOString().slice(0, 10),
        });
      } else {
        await submitContribution({
          amount,
          currency: selected.currency,
          transaction_reference: reference.trim(),
          proof_image_url: proofUrl.trim() || undefined,
          contribution_channel: selectedMethod,
          contribution_month: currentContributionMonth(),
          payment_link_used: selectedMethod === 'link' ? Config.PAYMENT_LINK : undefined,
        });
      }
      Alert.alert(
        isFreePledge ? 'Pledge Signed 🌙' : 'Thank You! 🌙',
        isFreePledge
          ? 'You are signed up for awareness reminders. May Allah reward your intention.'
          : 'Your contribution has been submitted for admin verification. Jazakallahu Khayran.',
        [{ text: 'Done', onPress: () => { setReference(''); setProofUrl(''); setOpenAmount(''); } }]
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
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="heart" size={30} color={Colors.white} /></View>
          <Text style={styles.heroTitle}>Your Family Pledge</Text>
          <Text style={styles.heroSub}>Sign free, give $10 monthly, increase your pledge, or choose any amount for Palestine family support.</Text>
        </View>

        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Choose pledge amount</Text>
          <View style={styles.optionGrid}>
            {PAYMENT_SETTINGS.pledgeOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                onPress={() => setSelectedOption(option.key as PledgeOptionKey)}
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

        {!isFreePledge && (
          <>
            <AppCard style={styles.card}>
              <Text style={styles.cardTitle}>Payment method</Text>
              <View style={styles.methodGrid}>
                {PAYMENT_SETTINGS.methods.map((m) => (
                  <TouchableOpacity key={m.key} onPress={() => setSelectedMethod(m.key)} activeOpacity={0.8} style={[styles.methodCard, selectedMethod === m.key && { borderColor: m.color, backgroundColor: m.color + '10' }]}>
                    <Ionicons name={m.icon as any} size={22} color={selectedMethod === m.key ? m.color : Colors.gray[400]} />
                    <Text style={[styles.methodLabel, selectedMethod === m.key && { color: m.color }]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </AppCard>

            <AppCard style={styles.card} borderColor={Colors.pink}>
              <View style={styles.instructHeader}>
                <Ionicons name="information-circle" size={20} color={Colors.pinkDark} />
                <Text style={styles.instructTitle}>Copy-friendly payment details</Text>
              </View>
              <PaymentDetails onCopy={copy} />
              {selectedMethod === 'link' && (
                <TouchableOpacity onPress={handleOpenPaymentLink} style={styles.linkBtn} activeOpacity={0.85}>
                  <Ionicons name="globe-outline" size={18} color={Colors.white} />
                  <Text style={styles.linkBtnText}>Open familypledge.org</Text>
                  <Ionicons name="open-outline" size={16} color={Colors.white} />
                </TouchableOpacity>
              )}
            </AppCard>
          </>
        )}

        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>{isFreePledge ? 'Finish free pledge' : 'Submit payment reference'}</Text>
          <Text style={styles.cardDesc}>{isFreePledge ? 'No payment is required. You will still receive reminders and awareness content.' : 'After paying, submit your transaction reference so admins can verify the exact amount.'}</Text>

          {!isFreePledge && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Transaction Reference *</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="receipt-outline" size={18} color={Colors.gray[400]} />
                  <TextInput value={reference} onChangeText={setReference} placeholder="e.g. QKR7XNPK" placeholderTextColor={Colors.gray[400]} style={styles.input} autoCapitalize="characters" />
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Screenshot / Proof URL (optional)</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="image-outline" size={18} color={Colors.gray[400]} />
                  <TextInput value={proofUrl} onChangeText={setProofUrl} placeholder="Cloudinary/receipt URL" placeholderTextColor={Colors.gray[400]} style={styles.input} autoCapitalize="none" keyboardType="url" />
                </View>
              </View>
            </>
          )}

          <AppButton title={isFreePledge ? 'Sign Free Pledge' : `Submit ${selected.label} Pledge`} onPress={handleSubmit} loading={loading} style={{ marginTop: 8 }} icon={<Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />} />
        </AppCard>

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
          <Text style={styles.footerText}>Secure · Admin verified · Payment details managed centrally</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PaymentDetails({ onCopy }: { onCopy: (label: string, value: string) => void }) {
  const b = PAYMENT_SETTINGS.bank;
  const rows = [
    ['Account Name', b.accountName],
    ['Account Number', b.accountNumber],
    ['M-PESA PayBill', b.mpesaPaybill],
    ['Bank', b.bankName],
    ['Branch', b.branchName],
    ['SWIFT', b.swiftCode],
    ['Intermediary SWIFT', b.intermediarySwiftCode],
  ];
  return <View style={styles.detailList}>{rows.map(([label, value]) => <TouchableOpacity key={label} style={styles.detailRow} onPress={() => onCopy(label, value)}><View style={{ flex: 1 }}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View><Ionicons name="copy-outline" size={18} color={Colors.primary} /></TouchableOpacity>)}<Text style={styles.instructNote}>PayBill {b.mpesaPaybill}, then use the 15-digit DIB account number as the account. Currency: {b.currency}. Bank code {b.bankCode}, branch code {b.branchCode}.</Text></View>;
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
  cardDesc: { fontSize: 13, color: Colors.text.secondary, lineHeight: 20, marginBottom: 14 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amountOption: { width: '48%', borderWidth: 1.5, borderColor: Colors.border.light, borderRadius: 16, padding: 12, backgroundColor: Colors.white },
  amountOptionActive: { borderColor: Colors.pinkDark, backgroundColor: Colors.softPinkBg },
  amountLabel: { fontSize: 14, fontWeight: '900', color: Colors.text.primary },
  amountLabelActive: { color: Colors.pinkDark },
  amountHelper: { marginTop: 4, fontSize: 11, color: Colors.text.secondary, lineHeight: 15 },
  amountHelperActive: { color: Colors.primaryDark },
  openInput: { marginTop: 12 },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  methodCard: { flex: 1, minWidth: '45%', alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: Colors.border.light, gap: 6, backgroundColor: Colors.gray[50] },
  methodLabel: { fontSize: 12, fontWeight: '700', color: Colors.text.secondary },
  instructHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  instructTitle: { fontSize: 15, fontWeight: '800', color: Colors.text.primary },
  detailList: { gap: 9 },
  detailRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: Colors.border.light, borderRadius: 14, backgroundColor: Colors.gray[50] },
  detailLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, color: Colors.text.muted, fontWeight: '800' },
  detailValue: { marginTop: 2, fontSize: 14, color: Colors.text.primary, fontWeight: '800' },
  linkBtn: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 14 },
  linkBtnText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
  instructNote: { fontSize: 12, color: Colors.pinkDark, marginTop: 4, fontWeight: '600', lineHeight: 18 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text.primary, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border.light, paddingHorizontal: 14, height: 50, gap: 10 },
  input: { flex: 1, fontSize: 15, color: Colors.text.primary },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  footerText: { fontSize: 12, color: Colors.text.secondary, fontWeight: '600' },
});
