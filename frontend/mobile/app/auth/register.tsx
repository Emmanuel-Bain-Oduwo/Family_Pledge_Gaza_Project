import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/AppButton';
import FamilyPledgeLogo from '../../components/FamilyPledgeLogo';
import { register } from '../../services/api';
import { saveToken } from '../../services/auth';

export default function RegisterScreen() {
  const [form, setForm] = useState({
    full_name: '',
    nickname: '',
    phone: '',
    email: '',
    country: '',
    city: '',
    password: '',
    confirm_password: '',
    anonymous_publicly: false,
    collector_code: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    if (!form.full_name.trim() || !form.phone.trim() || !form.country.trim() || !form.password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in name, phone, country and password.');
      return;
    }
    if (form.password !== form.confirm_password) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const tokens = await register({
        full_name: form.full_name.trim(),
        nickname: form.nickname.trim() || undefined,
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        country: form.country.trim(),
        city: form.city.trim() || undefined,
        password: form.password,
      });
      await saveToken(tokens);
      router.replace('/tabs/home');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerBlock}>
          <FamilyPledgeLogo />
          <Text style={styles.heading}>Sign Your Family Pledge</Text>
          <Text style={styles.subheading}>Choose your pledge, receive daily reminders, and support Gaza relief with NAMLEF.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <Field label="Full Name *" value={form.full_name} onChangeText={(v) => update('full_name', v)} placeholder="e.g. Ahmed Hassan" />
          <Field label="Nickname / Display Name" value={form.nickname} onChangeText={(v) => update('nickname', v)} placeholder="e.g. Abu Yusuf" />
          <Field label="Phone Number *" value={form.phone} onChangeText={(v) => update('phone', v)} placeholder="+254700000000" keyboardType="phone-pad" />
          <Field label="Email (optional)" value={form.email} onChangeText={(v) => update('email', v)} placeholder="you@email.com" keyboardType="email-address" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Field label="Country *" value={form.country} onChangeText={(v) => update('country', v)} placeholder="e.g. Kenya" />
          <Field label="City (optional)" value={form.city} onChangeText={(v) => update('city', v)} placeholder="e.g. Nairobi" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.passwordWrap}>
            <Field
              label="Password *"
              value={form.password}
              onChangeText={(v) => update('password', v)}
              placeholder="Min 6 characters"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          </View>
          <Field
            label="Confirm Password *"
            value={form.confirm_password}
            onChangeText={(v) => update('confirm_password', v)}
            placeholder="Repeat password"
            secureTextEntry={!showPassword}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Community</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Anonymous Publicly</Text>
              <Text style={styles.toggleDesc}>Your name won't appear in public donor lists</Text>
            </View>
            <Switch
              value={form.anonymous_publicly}
              onValueChange={(v) => update('anonymous_publicly', v)}
              trackColor={{ false: Colors.gray[300], true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          <Field
            label="Collector Code (optional)"
            value={form.collector_code}
            onChangeText={(v) => update('collector_code', v)}
            placeholder="If invited by a collector"
            autoCapitalize="characters"
          />
        </View>

        <AppButton
          title="Sign My Pledge"
          onPress={handleRegister}
          loading={loading}
          style={styles.registerBtn}
        />

        <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.loginLink}>
          <Text style={styles.loginText}>
            Already pledged?{' '}
            <Text style={styles.loginBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray[400]}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'words'}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 20, paddingBottom: 48 },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  field: { gap: 5 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  input: {
    backgroundColor: Colors.gray[50],
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text.primary,
  },
  passwordWrap: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 14, bottom: 14 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleInfo: { flex: 1 },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 17,
  },
  registerBtn: { marginBottom: 16 },
  loginLink: { alignItems: 'center', padding: 8 },
  loginText: { fontSize: 14, color: Colors.text.secondary },
  loginBold: { color: Colors.primary, fontWeight: '700' },
});
