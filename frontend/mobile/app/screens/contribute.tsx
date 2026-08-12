import React, { useMemo, useRef, useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import { createPledge, submitContribution, uploadContributionProof } from '../../services/api';
import { PAYMENT_SETTINGS, currentContributionMonth } from '../../constants/payment';
import { copyText } from '../../services/webCompat';

type PledgeOptionKey = 'kes10' | 'usd10' | 'usd20' | 'usd50' | 'usd100' | 'open' | 'free';
type ProofFile = { uri: string; fileName: string; mimeType: string; fileSize: number };

const MAX_PROOF_BYTES = 10 * 1024 * 1024;
const ALLOWED_PROOF_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function inferMimeType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return '';
}

function validateProof(file: ProofFile): string | null {
  if (!ALLOWED_PROOF_TYPES.has(file.mimeType)) return 'Please choose a JPG, PNG or WebP screenshot.';
  if (file.fileSize > MAX_PROOF_BYTES) return 'The payment screenshot must be 10 MB or smaller.';
  return null;
}

export default function ContributeScreen() {
  const [selectedMethod, setSelectedMethod] = useState('mpesa');
  const [selectedOption, setSelectedOption] = useState<PledgeOptionKey>('usd10');
  const [openAmount, setOpenAmount] = useState('');
  const [reference, setReference] = useState('');
  const [proof, setProof] = useState<ProofFile | null>(null);
  const [acceptedAgreement, setAcceptedAgreement] = useState(false);
  const proofInputRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  const selected = useMemo(
    () => PAYMENT_SETTINGS.pledgeOptions.find((o) => o.key === selectedOption) || PAYMENT_SETTINGS.pledgeOptions[1],
    [selectedOption]
  );

  const amount = selectedOption === 'open' ? Number(openAmount || 0) : selected.amount;
  const isFreePledge = selectedOption === 'free';

  const copy = (label: string, value: string) => copyText(label, value);

  const selectNativeProof = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: false, quality: 1, selectionLimit: 1,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const fileName = asset.fileName || `payment-proof-${Date.now()}.jpg`;
      const mimeType = asset.mimeType || inferMimeType(fileName);
      const selectedFile: ProofFile = { uri: asset.uri, fileName, mimeType, fileSize: asset.fileSize || 0 };
      const error = validateProof(selectedFile);
      if (error) { Alert.alert('Unsupported screenshot', error); return; }
      setProof(selectedFile);
    } catch {
      Alert.alert('Could not open photos', 'Please try again or submit the transaction message/reference instead.');
    }
  };

  const handleSubmit = async () => {
    if (!acceptedAgreement) {
      Alert.alert('Pledge Agreement Required', 'Please review and accept the voluntary Family Pledge before signing.');
      return;
    }
    if (!isFreePledge && (!amount || amount < 1)) {
      Alert.alert('Amount Required', 'Please choose an amount or enter your open amount.');
      return;
    }
    if (!isFreePledge && !reference.trim() && !proof) {
      Alert.alert('Proof Required', 'Upload a payment screenshot or enter the transaction message/reference.');
      return;
    }

    setLoading(true);
    try {
      // Persist the signed pledge first. A paid participant's proof is then linked
      // to that exact pledge so the donor and admin always see the same record.
      const pledge = await createPledge({
        pledge_type: isFreePledge ? 'free_participant' : 'monthly',
        amount: isFreePledge ? 0 : amount,
        currency: selected.currency,
        start_date: new Date().toISOString().slice(0, 10),
        agreement_accepted: true,
      });

      if (!isFreePledge) {
        const proofObjectKey = proof ? await uploadContributionProof(proof) : undefined;
        await submitContribution({
          pledge_id: pledge.id,
          amount,
          currency: selected.currency,
          transaction_reference: reference.trim(),
          proof_object_key: proofObjectKey,
          contribution_channel: selectedMethod,
          contribution_month: currentContributionMonth(),
        });
      }

      Alert.alert(
        isFreePledge ? 'Pledge Signed 🌙' : 'Proof Sent 🌙',
        isFreePledge
          ? 'Your voluntary Family Pledge is signed and active. May Allah SWT accept your du’a and grant our brothers and sisters in Gaza relief and Jannatul Firdaus.'
          : 'Your pledge is signed and your payment proof has been sent for admin verification. May Allah SWT bless you more and grant you Jannatul Firdaus.',
        [{ text: 'View My Pledge', onPress: () => { setReference(''); setProof(null); setOpenAmount(''); setAcceptedAgreement(false); router.replace('/screens/my-pledge'); } }]
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
          <Text style={styles.heroSub}>Join freely or choose a monthly amount to help our brothers and sisters in Gaza. Your pledge is voluntary and can be paused or changed later.</Text>
        </View>

        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Choose pledge amount</Text>
          <View style={styles.optionGrid}>
            {PAYMENT_SETTINGS.pledgeOptions.map((option) => (
              <TouchableOpacity key={option.key} onPress={() => setSelectedOption(option.key as PledgeOptionKey)} style={[styles.amountOption, selectedOption === option.key && styles.amountOptionActive]} activeOpacity={0.85}>
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
          <Text style={styles.agreementText}>I understand that Family Pledge is a charitable initiative operated under NAMLEF. My pledge is voluntary, donations are received by NAMLEF, and signing does not unlock paid or premium app features. Contribution proofs are reviewed securely and sensitive proof data is retained for up to 30 days.</Text>
          <Text style={styles.agreementText}>I can update, pause or cancel my pledge later. I agree that Family Pledge may use my pledge status for contribution tracking and consent-based reminders.</Text>
          <View style={styles.policyLinks}>
            <TouchableOpacity onPress={() => router.push('/terms')}><Text style={styles.policyLink}>Terms of Service</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/privacy')}><Text style={styles.policyLink}>Privacy & Data Usage</Text></TouchableOpacity>
          </View>
          <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: acceptedAgreement }} onPress={() => setAcceptedAgreement((value) => !value)} style={[styles.agreementCheck, acceptedAgreement && styles.agreementCheckActive]}>
            <Ionicons name={acceptedAgreement ? 'checkbox' : 'square-outline'} size={24} color={acceptedAgreement ? Colors.primary : Colors.gray[500]} />
            <Text style={styles.agreementCheckText}>{isFreePledge
              ? 'I agree to keep making du’a for my brothers and sisters in Gaza and to support this humanitarian effort. May Allah SWT grant them relief and Jannatul Firdaus.'
              : 'I agree to contribute every month to help my brothers and sisters in Gaza, and I will keep on making du’a for them. May Allah SWT grant all of them relief and Jannatul Firdaus.'}</Text>
          </TouchableOpacity>
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
              <PaymentDetails method={selectedMethod} onCopy={copy} />
            </AppCard>
          </>
        )}

        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>{isFreePledge ? 'Finish free pledge' : 'Submit payment proof'}</Text>
          <Text style={styles.cardDesc}>{isFreePledge ? 'No payment is required. You can separately choose the reminders and awareness content you want to receive.' : 'Upload a screenshot or paste the transaction message/reference. Either one is enough for admin review. Once sent, your pledge page will show that the proof is awaiting verification. Sensitive proof data is retained for 30 days.'}</Text>

          {!isFreePledge && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Transaction message / reference</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="receipt-outline" size={18} color={Colors.gray[400]} />
                  <TextInput value={reference} onChangeText={setReference} placeholder="e.g. QKR7XNPK" placeholderTextColor={Colors.gray[400]} style={styles.input} autoCapitalize="characters" />
                </View>
              </View>
              {Platform.OS === 'web' && React.createElement('input', {
                ref: proofInputRef,
                type: 'file',
                accept: 'image/jpeg,image/png,image/webp',
                style: { display: 'none' },
                onChange: (event: any) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const selectedFile: ProofFile = { uri: URL.createObjectURL(file), fileName: file.name, mimeType: file.type, fileSize: file.size };
                  const error = validateProof(selectedFile);
                  if (error) Alert.alert('Unsupported screenshot', error); else setProof(selectedFile);
                },
              })}
              <TouchableOpacity style={styles.uploadButton} onPress={() => { if (Platform.OS === 'web') proofInputRef.current?.click(); else selectNativeProof(); }}>
                <Ionicons name={proof ? 'checkmark-circle' : 'cloud-upload-outline'} size={22} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadTitle}>{proof ? 'Screenshot selected' : 'Upload payment screenshot'}</Text>
                  <Text style={styles.uploadHelp}>{proof?.fileName || 'JPG, PNG or WebP · max 10 MB'}</Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          <AppButton title={isFreePledge ? 'Sign Free Pledge' : `Sign & Submit ${selected.label}`} onPress={handleSubmit} loading={loading} style={{ marginTop: 8 }} icon={<Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />} />
        </AppCard>

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
          <Text style={styles.footerText}>Secure · Admin verified · Payment details managed centrally</Text>
        </View>
        <AppCard style={styles.contactCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.primary} />
          <View style={{ flex: 1 }}><Text style={styles.contactTitle}>Need help?</Text><TouchableOpacity onPress={() => router.push('/support')}><Text style={styles.contactEmail}>Message Family Pledge Support</Text></TouchableOpacity></View>
        </AppCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PaymentDetails({ method, onCopy }: { method: string; onCopy: (label: string, value: string) => void }) {
  const b = PAYMENT_SETTINGS.bank;
  const mpesaRows = [['M-PESA PayBill', b.mpesaPaybill], ['Account Number', b.accountNumber], ['Account Name', b.accountName]];
  const bankRows = [['Bank', b.bankName], ['Account Name', b.accountName], ['Account Number', b.accountNumber], ['Branch', b.branchName], ['SWIFT', b.swiftCode], ['Intermediary SWIFT', b.intermediarySwiftCode]];
  const isBank=method==='bank'; const rows=isBank?bankRows:mpesaRows;
  return <View style={styles.detailList}><Text style={styles.paymentHeading}>{isBank?'Bank transfer details':'M-PESA PayBill — recommended'}</Text>{rows.map(([label,value],i)=><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Copy ${label}`} key={label} style={styles.detailRow} onPress={()=>onCopy(label,value)}><View style={styles.stepCircle}><Text style={styles.stepText}>{i+1}</Text></View><View style={{flex:1}}><Text style={styles.detailLabel}>{label}</Text><Text selectable style={styles.detailValue}>{value}</Text></View><Ionicons name="copy-outline" size={18} color={Colors.primary}/></TouchableOpacity>)}<Text style={styles.instructNote}>{isBank?`Currency: ${b.currency}. Bank code ${b.bankCode}, branch code ${b.branchCode}.`:`PayBill ${b.mpesaPaybill}; use the full 15-digit account number exactly as shown.`}</Text></View>;
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
  cardDesc: { fontSize: 13, color: Colors.text.secondary, lineHeight: 20, marginBottom: 14 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amountOption: { width: '48%', borderWidth: 1.5, borderColor: Colors.border.light, borderRadius: 16, padding: 12, backgroundColor: Colors.white },
  amountOptionActive: { borderColor: Colors.pinkDark, backgroundColor: Colors.softPinkBg },
  amountLabel: { fontSize: 14, fontWeight: '900', color: Colors.text.primary },
  amountLabelActive: { color: Colors.pinkDark },
  amountHelper: { marginTop: 4, fontSize: 11, color: Colors.text.secondary, lineHeight: 15 },
  amountHelperActive: { color: Colors.primaryDark },
  openInput: { marginTop: 12 },
  agreementHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  agreementText: { fontSize: 12.5, lineHeight: 19, color: Colors.text.secondary, marginBottom: 8 },
  policyLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginVertical: 6 },
  policyLink: { fontSize: 12, fontWeight: '800', color: Colors.primary, textDecorationLine: 'underline' },
  agreementCheck: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: Colors.border.light, borderRadius: 14, padding: 12, backgroundColor: Colors.gray[50] },
  agreementCheckActive: { borderColor: Colors.primary, backgroundColor: '#F0FDF4' },
  agreementCheckText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '800', color: Colors.text.primary },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  methodCard: { flex: 1, minWidth: '45%', alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: Colors.border.light, gap: 6, backgroundColor: Colors.gray[50] },
  methodLabel: { fontSize: 12, fontWeight: '700', color: Colors.text.secondary },
  instructHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  instructTitle: { fontSize: 15, fontWeight: '800', color: Colors.text.primary },
  detailList: { gap: 9 },
  paymentHeading: { fontSize: 14, color: Colors.primaryDark, fontWeight: '900' },
  stepCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.softPinkBg, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  stepText: { color: Colors.pinkDark, fontSize: 11, fontWeight: '900' },
  detailRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: Colors.border.light, borderRadius: 14, backgroundColor: Colors.gray[50] },
  detailLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, color: Colors.text.muted, fontWeight: '800' },
  detailValue: { marginTop: 2, fontSize: 14, color: Colors.text.primary, fontWeight: '800' },
  instructNote: { fontSize: 12, color: Colors.pinkDark, marginTop: 4, fontWeight: '600', lineHeight: 18 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text.primary, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border.light, paddingHorizontal: 14, height: 50, gap: 10 },
  input: { flex: 1, fontSize: 15, color: Colors.text.primary },
  uploadButton: { marginBottom: 14, minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.primary, borderRadius: 14, backgroundColor: Colors.gray[50] },
  uploadTitle: { color: Colors.text.primary, fontWeight: '800', fontSize: 14 },
  uploadHelp: { color: Colors.text.secondary, fontSize: 12, marginTop: 3 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  footerText: { fontSize: 12, color: Colors.text.secondary, fontWeight: '600' },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  contactTitle: { fontWeight: '800', color: Colors.text.primary },
  contactEmail: { color: Colors.primary, marginTop: 2, fontWeight: '700' },
});
