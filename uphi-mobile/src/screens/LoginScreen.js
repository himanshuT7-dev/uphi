import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar, Animated, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const handleSendOtp = async () => {
    if (!identifier.trim()) return setError('Enter ABHA ID or Email');
    setLoading(true);
    setError('');
    try {
      // For demo hero persona, skip OTP generation
      if (identifier.trim() === 'ABHA-1234-5678') {
        setOtpSent(true);
      } else {
        await api.post('/api/receptionist/patients/otp/generate', {
          email: identifier.includes('@') ? identifier.trim() : null,
          phone: !identifier.includes('@') ? identifier.trim() : null,
        });
        setOtpSent(true);
      }
    } catch (err) {
      setError('Failed to send OTP. Check your ID.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return setError('Enter the OTP code');
    setLoading(true);
    setError('');
    try {
      let abhaAddress = '';
      let finalPassword = '';

      if (identifier.trim() === 'ABHA-1234-5678') {
        abhaAddress = 'ABHA-1234-5678';
        finalPassword = 'Patient@123';
        // Validate demo OTP
        if (otp.trim() !== '123456') {
          setError('Invalid OTP. Demo code: 123456');
          setLoading(false);
          return;
        }
      } else {
        // Step 1: Verify OTP first
        try {
          await api.post('/api/receptionist/patients/otp/verify', {
            email: identifier.includes('@') ? identifier.trim() : null,
            phone: !identifier.includes('@') ? identifier.trim() : null,
            otp: otp.trim(),
          });
        } catch (otpErr) {
          setError('Invalid or expired OTP. Please try again.');
          setLoading(false);
          return;
        }

        // Step 2: Try logging in directly — patient may already be registered by receptionist
        const emailPrefix = identifier.includes('@') ? identifier.split('@')[0] : identifier;
        finalPassword = 'PatientSecure@' + emailPrefix;

        try {
          const loginRes = await api.post('/api/auth/login', {
            username: identifier.trim(),
            password: finalPassword,
          });
          await login(loginRes.data);
          setLoading(false);
          return; // Success — patient was already registered
        } catch (loginErr) {
          // Login failed — patient not yet registered
          // Show a helpful message instead of creating a junk record
          setError(
            'No account found for this identity. Please visit the hospital reception to register, or contact support.'
          );
          setLoading(false);
          return;
        }
      }

      // Demo persona login
      const loginRes = await api.post('/api/auth/login', {
        username: abhaAddress,
        password: finalPassword,
      });
      await login(loginRes.data);
    } catch (err) {
      setError('Verification failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="heart-circle" size={48} color="#3b82f6" />
          </View>
          <Text style={styles.logoText}>UPHI</Text>
          <Text style={styles.logoSub}>Unified Patient Health Insight</Text>
        </View>

        {/* Form */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {otpSent ? 'Verify Identity' : 'Patient Login'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {otpSent
                ? `Enter the code sent to ${identifier}`
                : 'Enter your ABHA ID or registered email'}
            </Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {!otpSent ? (
              <>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={20} color="#94a3b8" style={{ marginRight: 12 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="ABHA-1234-5678 or email@example.com"
                    placeholderTextColor="#94a3b8"
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOtp} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Request OTP</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.otpRow}>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="000000"
                    placeholderTextColor="#cbd5e1"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={20} color="#fff" />
                      <Text style={styles.primaryBtnText}>Verify & Login</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setOtpSent(false); setOtp(''); setError(''); }}>
                  <Text style={styles.linkText}>← Change identifier</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.footer}>Encrypted under DPDP Act • UPHI Network</Text>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1a', justifyContent: 'center', paddingHorizontal: 24 },
  inner: { flex: 1, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 48 },
  logoCircle: { width: 88, height: 88, borderRadius: 28, backgroundColor: 'rgba(59,130,246,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  logoSub: { fontSize: 14, color: '#64748b', fontWeight: '500', marginTop: 4 },
  card: { backgroundColor: '#111827', borderRadius: 28, padding: 28, borderWidth: 1, borderColor: '#1e293b' },
  cardTitle: { fontSize: 24, fontWeight: '800', color: '#f8fafc', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 20 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  errorText: { color: '#ef4444', fontSize: 13, fontWeight: '600', flex: 1 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#1e293b', marginBottom: 20 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#f8fafc', fontWeight: '600' },
  otpRow: { alignItems: 'center', marginBottom: 24 },
  otpInput: { width: '100%', backgroundColor: '#0f172a', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 20, fontSize: 32, fontWeight: '900', color: '#3b82f6', textAlign: 'center', letterSpacing: 12, borderWidth: 2, borderColor: '#3b82f6' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#3b82f6', borderRadius: 16, paddingVertical: 18, marginBottom: 16 },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  linkText: { textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: '600' },
  footer: { textAlign: 'center', color: '#334155', fontSize: 12, fontWeight: '600', marginTop: 32 },
});
