import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl, StatusBar, Animated, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { logout, user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Editable fields
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');

  const fetchData = async () => {
    try {
      setError(false);
      const res = await api.get('/api/patients/me');
      const p = res.data;
      p.name = p.fullName || 'Patient';
      setPatient(p);
      setPhone(p.phone || '');
      setEmail(p.email || '');
      setGender(p.gender || '');
      setDob(p.dob || '');
      setBloodGroup(p.bloodGroup || '');
    } catch (err) {
      console.error('Profile fetch error:', err);
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/my-profile', { phone, email, gender, dob, bloodGroup });
      await fetchData();
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !patient) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="person-circle" size={48} color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (error && !patient) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.loadingText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Tap to Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
            <Text style={styles.headerTitle}>My Profile</Text>
            <TouchableOpacity
              style={[styles.editBtn, editing && styles.editBtnActive]}
              onPress={() => editing ? handleSave() : setEditing(true)}
            >
              {saving ? (
                <Text style={styles.editBtnText}>Saving...</Text>
              ) : (
                <>
                  <Ionicons name={editing ? "checkmark" : "create-outline"} size={18} color={editing ? "#10b981" : "#3b82f6"} />
                  <Text style={[styles.editBtnText, editing && { color: '#10b981' }]}>
                    {editing ? 'Save' : 'Edit'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ========== DIGITAL HEALTH ID CARD ========== */}
          <View style={styles.idCard}>
            <View style={styles.idCardHeader}>
              <View style={styles.idCardLogoRow}>
                <View style={styles.idCardLogoBadge}>
                  <Ionicons name="pulse" size={16} color="#fff" />
                </View>
                <Text style={styles.idCardBrand}>UPHI HEALTH ID</Text>
              </View>
              <View style={styles.idCardVerifiedBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#10b981" />
                <Text style={styles.idCardVerifiedText}>Verified</Text>
              </View>
            </View>

            <View style={styles.idCardBody}>
              <View style={styles.idCardInfo}>
                <Text style={styles.idCardName}>{patient.name}</Text>
                <Text style={styles.idCardId}>ID: {patient.abhaAddress}</Text>

                <View style={styles.idCardMeta}>
                  <View style={styles.idCardMetaItem}>
                    <Ionicons name="water" size={12} color="#94a3b8" />
                    <Text style={styles.idCardMetaLabel}>Blood</Text>
                    <Text style={styles.idCardMetaValue}>{patient.bloodGroup || 'N/A'}</Text>
                  </View>
                  <View style={styles.idCardMetaItem}>
                    <Ionicons name="person" size={12} color="#94a3b8" />
                    <Text style={styles.idCardMetaLabel}>Gender</Text>
                    <Text style={styles.idCardMetaValue}>{patient.gender || 'N/A'}</Text>
                  </View>
                  <View style={styles.idCardMetaItem}>
                    <Ionicons name="calendar" size={12} color="#94a3b8" />
                    <Text style={styles.idCardMetaLabel}>DOB</Text>
                    <Text style={styles.idCardMetaValue}>{patient.dob || 'N/A'}</Text>
                  </View>
                </View>
              </View>

              {/* QR Code */}
              <View style={styles.qrWrapper}>
                <QRCode
                  value={`UPHI:${patient.abhaAddress}`}
                  size={100}
                  backgroundColor="transparent"
                  color="#f8fafc"
                />
              </View>
            </View>

            <View style={styles.idCardFooter}>
              <Ionicons name="lock-closed" size={10} color="#475569" />
              <Text style={styles.idCardFooterText}>Verified Digital Health Record • UPHI Network</Text>
            </View>
          </View>

          <Text style={styles.qrHint}>
            <Ionicons name="scan" size={13} color="#64748b" /> Show this QR to hospital staff for instant identification
          </Text>

          {/* ========== PROFILE DETAILS ========== */}
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.formCard}>
            <ProfileField
              icon="person"
              label="Full Name"
              value={patient.name}
              editable={false}
            />
            <ProfileField
              icon="card"
              label="ABHA Address"
              value={patient.abhaAddress}
              editable={false}
            />
            <ProfileField
              icon="call"
              label="Phone Number"
              value={phone}
              onChange={setPhone}
              editable={editing}
              keyboardType="phone-pad"
            />
            <ProfileField
              icon="mail"
              label="Email Address"
              value={email}
              onChange={setEmail}
              editable={editing}
              keyboardType="email-address"
            />
            <ProfileField
              icon="person-outline"
              label="Gender"
              value={gender}
              onChange={setGender}
              editable={editing}
            />
            <ProfileField
              icon="calendar-outline"
              label="Date of Birth"
              value={dob}
              onChange={setDob}
              editable={editing}
            />
            <ProfileField
              icon="water-outline"
              label="Blood Group"
              value={bloodGroup}
              onChange={setBloodGroup}
              editable={editing}
              isLast
            />
          </View>

          {editing && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditing(false); fetchData(); }}>
              <Text style={styles.cancelBtnText}>Cancel Changes</Text>
            </TouchableOpacity>
          )}

          {/* ========== MEDICATIONS ========== */}
          {patient.medications && patient.medications.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Current Medications</Text>
              <View style={styles.formCard}>
                {patient.medications.map((med, i) => (
                  <View key={i} style={[styles.medRow, i < patient.medications.length - 1 && styles.medRowBorder]}>
                    <View style={styles.medIcon}>
                      <Ionicons name="medkit" size={16} color="#8b5cf6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.medName}>{med.name || med}</Text>
                      {med.dosage && <Text style={styles.medDosage}>{med.dosage} • {med.frequency || 'Daily'}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ========== AFFILIATED HOSPITALS ========== */}
          <Text style={styles.sectionTitle}>Affiliated Hospitals</Text>
          <View style={styles.formCard}>
            {(patient.affiliatedHospitals && patient.affiliatedHospitals.length > 0) ? (
              patient.affiliatedHospitals.map((h, i) => {
                const hospitalName = patient.affiliatedHospitalNames?.[h] || h;
                return (
                  <View key={i} style={[styles.hospitalRow, i < patient.affiliatedHospitals.length - 1 && styles.medRowBorder]}>
                    <View style={styles.hospitalIcon}>
                      <Ionicons name="business" size={16} color="#3b82f6" />
                    </View>
                    <Text style={styles.hospitalName}>{hospitalName}</Text>
                    <View style={styles.linkedBadge}>
                      <Text style={styles.linkedBadgeText}>Linked</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="business-outline" size={24} color="#334155" />
                <Text style={styles.emptyStateText}>No hospitals linked yet</Text>
              </View>
            )}
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutCard} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function ProfileField({ icon, label, value, onChange, editable, isLast, keyboardType }) {
  return (
    <View style={[styles.fieldRow, !isLast && styles.fieldRowBorder]}>
      <View style={styles.fieldIconWrap}>
        <Ionicons name={icon} size={16} color="#64748b" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {editable ? (
          <TextInput
            style={styles.fieldInput}
            value={value}
            onChangeText={onChange}
            keyboardType={keyboardType || 'default'}
            placeholderTextColor="#334155"
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        ) : (
          <Text style={styles.fieldValue}>{value || 'N/A'}</Text>
        )}
      </View>
      {editable && <Ionicons name="chevron-forward" size={16} color="#334155" />}
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

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#f8fafc' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
  },
  editBtnActive: { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' },
  editBtnText: { fontSize: 14, fontWeight: '700', color: '#3b82f6' },

  // ===== ID CARD =====
  idCard: {
    backgroundColor: '#111827',
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: '#1e293b',
    overflow: 'hidden',
  },
  idCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  idCardLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  idCardLogoBadge: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#3b82f6',
    alignItems: 'center', justifyContent: 'center',
  },
  idCardBrand: { fontSize: 13, fontWeight: '900', color: '#3b82f6', letterSpacing: 1.5, textTransform: 'uppercase' },
  idCardVerifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  idCardVerifiedText: { fontSize: 11, fontWeight: '700', color: '#10b981' },

  idCardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  idCardInfo: { flex: 1, marginRight: 16 },
  idCardName: { fontSize: 22, fontWeight: '900', color: '#f8fafc', marginBottom: 4 },
  idCardId: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 14 },

  idCardMeta: { gap: 8 },
  idCardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  idCardMetaLabel: { fontSize: 11, color: '#64748b', fontWeight: '500', width: 48 },
  idCardMetaValue: { fontSize: 13, fontWeight: '700', color: '#cbd5e1' },

  qrWrapper: {
    backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 16, padding: 10,
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.15)',
  },

  idCardFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1e293b',
  },
  idCardFooterText: { fontSize: 10, color: '#475569', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  qrHint: {
    fontSize: 12, color: '#64748b', fontWeight: '500', textAlign: 'center',
    marginTop: 12, marginBottom: 24,
  },

  // ===== FORM =====
  sectionTitle: {
    fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 12, marginTop: 8,
  },
  formCard: {
    backgroundColor: '#111827', borderRadius: 20, borderWidth: 1, borderColor: '#1e293b',
    overflow: 'hidden', marginBottom: 20,
  },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12,
  },
  fieldRowBorder: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  fieldIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(100,116,139,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  fieldLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  fieldValue: { fontSize: 15, fontWeight: '700', color: '#f8fafc', marginTop: 2 },
  fieldInput: {
    fontSize: 15, fontWeight: '700', color: '#3b82f6', marginTop: 2,
    borderBottomWidth: 1, borderBottomColor: 'rgba(59,130,246,0.3)',
    paddingBottom: 4,
  },

  cancelBtn: {
    alignItems: 'center', paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', marginBottom: 20,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#ef4444' },

  // ===== MEDS =====
  medRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  medRowBorder: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  medIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  medName: { fontSize: 15, fontWeight: '700', color: '#f8fafc' },
  medDosage: { fontSize: 12, color: '#64748b', fontWeight: '500', marginTop: 2 },

  // ===== HOSPITALS =====
  hospitalRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  hospitalIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  hospitalName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#f8fafc' },
  linkedBadge: {
    backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8,
  },
  linkedBadgeText: { fontSize: 11, fontWeight: '700', color: '#10b981' },

  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyStateText: { fontSize: 13, color: '#475569', fontWeight: '500' },

  // ===== LOGOUT =====
  logoutCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.06)', borderRadius: 16, paddingVertical: 16,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)', marginTop: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
});
