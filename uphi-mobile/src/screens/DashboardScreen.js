import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, StatusBar, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const VitalCard = ({ icon, label, value, unit, color }) => (
  <View style={[styles.vitalCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
    <Ionicons name={icon} size={20} color={color} />
    <Text style={styles.vitalLabel}>{label}</Text>
    <Text style={styles.vitalValue}>{value}<Text style={styles.vitalUnit}> {unit}</Text></Text>
  </View>
);

export default function DashboardScreen() {
  const { logout, user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [consentCount, setConsentCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchData = async () => {
    try {
      setError(false);
      const patRes = await api.get('/api/patients/me');
      const p = patRes.data;
      p.name = p.fullName || 'Patient';
      setPatient(p);

      const conRes = await api.get('/api/consents/patient').catch(() => ({ data: [] }));
      const pending = (conRes.data || []).filter(c => c.status === 'PENDING');
      setConsentCount(pending.length);
    } catch (err) {
      console.log('Fetch error', err.message);
      setError(true);
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading && !patient) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="pulse" size={48} color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Health Profile...</Text>
      </View>
    );
  }

  if (error && !patient) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.loadingText}>Network Error</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const vitals = patient.vitals || {};

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},</Text>
              <Text style={styles.name}>{patient.name}</Text>
              <Text style={styles.uhid}>{patient.abhaAddress}</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {/* Consent Alert */}
          {consentCount > 0 && (
            <TouchableOpacity style={styles.consentAlert}>
              <View style={styles.consentAlertIcon}>
                <Ionicons name="shield-checkmark" size={24} color="#f59e0b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.consentAlertTitle}>{consentCount} Pending Consent Request{consentCount > 1 ? 's' : ''}</Text>
                <Text style={styles.consentAlertSub}>Tap the Consent tab to review</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#f59e0b" />
            </TouchableOpacity>
          )}

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            {[
              { icon: 'heart', label: 'Blood', value: patient.bloodGroup || 'N/A', color: '#ef4444' },
              { icon: 'calendar', label: 'DOB', value: patient.dob || 'N/A', color: '#8b5cf6' },
              { icon: 'person', label: 'Gender', value: patient.gender || 'N/A', color: '#06b6d4' },
            ].map((s, i) => (
              <View key={i} style={styles.statCard}>
                <Ionicons name={s.icon} size={18} color={s.color} />
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statValue}>{s.value}</Text>
              </View>
            ))}
          </View>

          {/* Vitals Grid */}
          <Text style={styles.sectionTitle}>Current Vitals</Text>
          <View style={styles.vitalsGrid}>
            <VitalCard icon="heart" label="Heart Rate" value={vitals.heartRate || vitals.hr || '78'} unit="bpm" color="#ef4444" />
            <VitalCard icon="water" label="Blood Pressure" value={vitals.bloodPressure || vitals.bp || '120/80'} unit="mmHg" color="#3b82f6" />
            <VitalCard icon="pulse" label="SpO2" value={vitals.spO2 || vitals.spo2 || '98'} unit="%" color="#10b981" />
            <VitalCard icon="thermometer" label="Temperature" value={vitals.temperature || vitals.temp || '36.5'} unit="°C" color="#f59e0b" />
          </View>

          {/* Conditions */}
          {patient.conditions && patient.conditions.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Active Conditions</Text>
              <View style={styles.tagRow}>
                {patient.conditions.map((c, i) => (
                  <View key={i} style={styles.conditionTag}>
                    <Ionicons name="medkit" size={14} color="#f59e0b" />
                    <Text style={styles.conditionText}>{c.name || c}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Allergies */}
          {patient.allergies && patient.allergies.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Known Allergies</Text>
              <View style={styles.tagRow}>
                {patient.allergies.map((a, i) => (
                  <View key={i} style={[styles.conditionTag, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }]}>
                    <Ionicons name="warning" size={14} color="#ef4444" />
                    <Text style={[styles.conditionText, { color: '#ef4444' }]}>{a.name || a}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1a' },
  scroll: { padding: 20, paddingTop: 60 },
  loadingContainer: { flex: 1, backgroundColor: '#0a0f1a', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#64748b', fontSize: 16, fontWeight: '600', marginTop: 16 },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  retryBtnText: { color: '#3b82f6', fontWeight: '700', fontSize: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  greeting: { fontSize: 15, color: '#64748b', fontWeight: '500' },
  name: { fontSize: 28, fontWeight: '900', color: '#f8fafc', marginTop: 2 },
  uhid: { fontSize: 13, color: '#3b82f6', fontWeight: '700', marginTop: 4, letterSpacing: 0.5 },
  logoutBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' },
  consentAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 20, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  consentAlertIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  consentAlertTitle: { fontSize: 15, fontWeight: '800', color: '#f59e0b' },
  consentAlertSub: { fontSize: 12, color: '#94a3b8', fontWeight: '500', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#111827', borderRadius: 18, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '700', marginTop: 8, textTransform: 'uppercase' },
  statValue: { fontSize: 14, color: '#f8fafc', fontWeight: '800', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, marginTop: 8 },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  vitalCard: { width: '48%', backgroundColor: '#111827', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#1e293b' },
  vitalLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 8 },
  vitalValue: { fontSize: 22, fontWeight: '900', color: '#f8fafc', marginTop: 4 },
  vitalUnit: { fontSize: 13, fontWeight: '500', color: '#64748b' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  conditionTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  conditionText: { fontSize: 13, fontWeight: '700', color: '#f59e0b' },
});
