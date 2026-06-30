import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/AppButton';
import { login } from '../../services/api';
import { saveToken } from '../../services/auth';

export default function LoginScreen() {
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phoneOrEmail.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your phone/email and password.');
      return;
    }
    setLoading(true);
    try {
      const tokens = await login({ phone_or_email: phoneOrEmail.trim(), password });
      await saveToken(tokens);
      router.replace('/tabs/home');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials. Please try again.');
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
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.heading}>Welcome Back</Text>
          <Text style={styles.subheading}>Sign in to your Family Pledge account</Text>
        </View>

        <View style={styles.form}>
          <InputField
            label="Phone or Email"
            value={phoneOrEmail}
            onChangeText={setPhoneOrEmail}
            placeholder="+254700000000 or email"
            icon="call-outline"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.passwordWrap}>
            <InputField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              icon="lock-closed-outline"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.gray[400]}
              />
            </TouchableOpacity>
          </View>
        </View>

        <AppButton
          title="Sign In"
          onPress={handleLogin}
          loading={loading}
          style={styles.loginBtn}
        />

        <TouchableOpacity onPress={() => router.push('/auth/register')} style={styles.registerLink}>
          <Text style={styles.registerText}>
            Don't have an account?{' '}
            <Text style={styles.registerBold}>Sign Your Pledge</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/tabs/home')} style={styles.visitorLink}>
          <Text style={styles.visitorText}>Continue as Visitor</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  icon?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        {icon && <Ionicons name={icon as any} size={18} color={Colors.gray[400]} style={styles.inputIcon} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray[400]}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || 'none'}
          style={styles.input}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 24, paddingBottom: 40 },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
  },
  passwordWrap: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    bottom: 16,
  },
  loginBtn: {
    marginBottom: 20,
  },
  registerLink: {
    alignItems: 'center',
    marginBottom: 12,
  },
  registerText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  registerBold: {
    color: Colors.primary,
    fontWeight: '700',
  },
  visitorLink: {
    alignItems: 'center',
    padding: 8,
  },
  visitorText: {
    fontSize: 14,
    color: Colors.text.muted,
  },
});
