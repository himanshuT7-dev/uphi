import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, StatusBar, Animated, TextInput, Modal, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function OTPModal({ visible, title, subtitle, onConfirm, onClose }) {
  const [otp, setOtp] = useState('');
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalIconCircle}>
            <Ionicons name="shield-checkmark" size={36} color="#3b82f6" />
          </View>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalSubtitle}>{subtitle}</Text>
          <TextInput
            style={styles.modalOtpInput}
            placeholder="123456"
            placeholderTextColor="#475569"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => { onConfirm(otp); setOtp(''); }}>
            <Text style={styles.modalConfirmText}>Confirm Authorization</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function SendConsentModal({ visible, onSend, onClose }) {
  const [hospitalId, setHospitalId] = useState('');
  const [purpose, setPurpose] = useState('Consultation');
  const [duration, setDuration] = useState('24 Hours');

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalIconCircle}>
            <Ionicons name="share-outline" size={32} color="#3b82f6" />
          </View>
          <Text style={styles.modalTitle}>Share Records</Text>
          <Text style={styles.modalSubtitle}>Grant proactive access to a provider</Text>

          <TextInput
            style={[styles.modalOtpInput, { fontSize: 16, letterSpacing: 1, padding: 14 }]}
            placeholder="Enter Hospital ID (e.g. Apollo)"
            placeholderTextColor="#475569"
            value={hospitalId}
            onChangeText={setHospitalId}
          />
          
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, width: '100%' }}>
             <TouchableOpacity 
               style={[styles.optionBtn, purpose === 'Consultation' && styles.optionBtnActive]}
               onPress={() => setPurpose('Consultation')}
             ><Text style={purpose === 'Consultation' ? styles.optionTextActive : styles.optionText}>Consult</Text></TouchableOpacity>
             <TouchableOpacity 
               style={[styles.optionBtn, purpose === 'Emergency' && styles.optionBtnActive]}
               onPress={() => setPurpose('Emergency')}
             ><Text style={purpose === 'Emergency' ? styles.optionTextActive : styles.optionText}>Emergency</Text></TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => { 
            if(hospitalId) {
              onSend({ hospitalId, purpose, duration, status: 'APPROVED' }); 
              setHospitalId('');
            }
          }}>
            <Text style={styles.modalConfirmText}>Grant Access</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ padding: 10 }}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Map document type labels to upload type values and icons
const docTypeMap = {
  'Lab Report': { value: 'LAB', icon: 'flask', color: '#3b82f6' },
  'ECG': { value: 'ECG', icon: 'pulse', color: '#ef4444' },
  'X-ray': { value: 'RADIOLOGY', icon: 'scan', color: '#8b5cf6' },
  'X-Ray': { value: 'RADIOLOGY', icon: 'scan', color: '#8b5cf6' },
  'Prescription': { value: 'PRESCRIPTION', icon: 'medkit', color: '#10b981' },
  'ID Proof': { value: 'GENERAL', icon: 'card', color: '#f59e0b' },
  'Vaccine Card': { value: 'GENERAL', icon: 'shield', color: '#06b6d4' },
};

export default function ConsentScreen() {
  const { logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [otpModal, setOtpModal] = useState(null);
  const [sendModal, setSendModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [uploadingDocType, setUploadingDocType] = useState(null); // tracks which doc type is being uploaded
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchConsents = async () => {
    try {
      const res = await api.get('/api/consents/patient');
      setRequests(res.data || []);
    } catch (err) {
      if (err.response?.status === 401) logout();
    }
  };

  useEffect(() => {
    fetchConsents();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConsents();
    setRefreshing(false);
  };

  const handleAction = (req, action) => setOtpModal({ req, action });

  const handleConfirm = async (otpValue) => {
    try {
      const status = otpModal.action === 'approved' ? 'APPROVED' : 
                     otpModal.action === 'revoked' ? 'REVOKED' : 'DENIED';
      await api.put(`/api/consents/${otpModal.req.id}/status?status=${status}`);
      const updated = requests.map(r => r.id === otpModal.req.id ? { ...r, status } : r);
      setRequests(updated);
      setToast({ type: 'success', text: status === 'APPROVED' ? 'Access Authorized ✓' : status === 'REVOKED' ? 'Access Revoked ✓' : 'Access Denied ✗' });
    } catch (err) {
      setToast({ type: 'error', text: 'Authorization failed' });
    }
    setOtpModal(null);
    setTimeout(() => setToast(null), 4000);
  };

  const handleSendConsent = async (data) => {
    try {
      await api.post('/api/consents', {
        hospitalId: data.hospitalId,
        hospitalName: data.hospitalId,
        purpose: data.purpose,
        duration: data.duration,
        status: data.status,
        date: new Date().toISOString().split('T')[0]
      });
      setToast({ type: 'success', text: 'Records shared successfully ✓' });
      fetchConsents();
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to share records' });
    }
    setSendModal(false);
    setTimeout(() => setToast(null), 4000);
  };

  // Upload a document for a specific document request
  const handleDocUpload = async (docTypeLabel, consentReq) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setUploadingDocType(docTypeLabel);
      const file = result.assets[0];
      const typeInfo = docTypeMap[docTypeLabel] || { value: 'LAB' };

      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
        name: file.name || `upload_${Date.now()}.${file.uri.split('.').pop()}`,
        type: file.mimeType || 'application/pdf',
      });
      formData.append('type', typeInfo.value);
      formData.append('title', `${docTypeLabel} — Requested by ${consentReq.hospitalName || 'Hospital'}`);
      formData.append('clinicalNotes', `Uploaded in response to document request from ${consentReq.doctorName || 'Clinical Staff'}`);

      await api.post('/api/records/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setToast({ type: 'success', text: `${docTypeLabel} uploaded successfully ✓` });

      // Auto-approve the consent after uploading
      try {
        await api.put(`/api/consents/${consentReq.id}/status?status=APPROVED`);
        const updated = requests.map(r => r.id === consentReq.id ? { ...r, status: 'APPROVED' } : r);
        setRequests(updated);
      } catch (_) { /* consent approval is best-effort */ }

    } catch (err) {
      console.log('Upload error:', err);
      setToast({ type: 'error', text: 'Upload failed. Please try again.' });
    } finally {
      setUploadingDocType(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  // Parse metadata string into document type chips
  const getRequestedDocs = (req) => {
    if (!req.metadata) return [];
    return req.metadata.split(',').map(s => s.trim()).filter(Boolean);
  };

  // Standalone upload to vault (not tied to a consent request)
  const handleStandaloneUpload = async (type, label) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setUploadingDocType(label);
      const file = result.assets[0];

      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
        name: file.name || `upload_${Date.now()}.${file.uri.split('.').pop()}`,
        type: file.mimeType || 'application/pdf',
      });
      formData.append('type', type);
      formData.append('title', `${label} — Uploaded via UPHI Vault`);
      formData.append('clinicalNotes', `Patient self-uploaded ${label} via mobile consent screen`);

      await api.post('/api/records/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setToast({ type: 'success', text: `${label} uploaded to vault ✓` });
    } catch (err) {
      console.log('Standalone upload error:', err);
      setToast({ type: 'error', text: 'Upload failed. Please try again.' });
    } finally {
      setUploadingDocType(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const pending = requests.filter(r => r.status === 'PENDING');
  const resolved = requests.filter(r => r.status !== 'PENDING');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <OTPModal
        visible={!!otpModal}
        title={otpModal?.action === 'approved' ? 'Authorize Access' : 
               otpModal?.action === 'revoked' ? 'Revoke Access' : 'Deny Access'}
        subtitle={`${otpModal?.req?.doctorName || 'Staff'} • ${otpModal?.req?.hospitalName || 'Facility'}`}
        onConfirm={handleConfirm}
        onClose={() => setOtpModal(null)}
      />
      <SendConsentModal 
        visible={sendModal} 
        onSend={handleSendConsent} 
        onClose={() => setSendModal(false)} 
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.pageTitle}>Consent Control</Text>
          <Text style={styles.pageSub}>Manage who accesses your health records</Text>

          {toast && (
            <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
              <Ionicons name={toast.type === 'error' ? 'close-circle' : 'checkmark-circle'} size={20} color={toast.type === 'error' ? '#ef4444' : '#10b981'} />
              <Text style={[styles.toastText, { color: toast.type === 'error' ? '#ef4444' : '#10b981' }]}>{toast.text}</Text>
            </View>
          )}

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="lock-closed" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              All authorizations are DPDP Act compliant and expire automatically.
            </Text>
          </View>

          {/* Proactive Share Button */}
          <TouchableOpacity style={styles.shareBtn} onPress={() => setSendModal(true)}>
            <Ionicons name="share-social" size={20} color="#fff" />
            <Text style={styles.shareBtnText}>Share Records with Provider</Text>
          </TouchableOpacity>

          {/* Pending */}
          {pending.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Awaiting Your Decision ({pending.length})</Text>
              {pending.map((req) => {
                const isDocRequest = req.purpose === 'DOCUMENT_REQUEST';
                const requestedDocs = getRequestedDocs(req);

                return (
                  <View key={req.id} style={styles.consentCard}>
                    <View style={styles.consentHeader}>
                      <View style={[styles.avatar, isDocRequest && { backgroundColor: 'rgba(139,92,246,0.15)' }]}>
                        <Text style={[styles.avatarText, isDocRequest && { color: '#8b5cf6' }]}>
                          {(req.doctorName || 'D')[0]}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.doctorName}>{req.doctorName || 'Clinical Staff'}</Text>
                        <Text style={styles.hospitalName}>{req.hospitalName || 'Partner Facility'}</Text>
                      </View>
                      {isDocRequest && (
                        <View style={styles.docRequestBadge}>
                          <Ionicons name="cloud-upload" size={12} color="#8b5cf6" />
                          <Text style={styles.docRequestBadgeText}>UPLOAD</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>PURPOSE</Text>
                        <Text style={styles.metaValue}>
                          {isDocRequest ? 'Document Upload Request' : (req.purpose || 'Record Access')}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>DURATION</Text>
                        <Text style={styles.metaValue}>{req.duration || '24 Hours'}</Text>
                      </View>
                    </View>

                    {/* Requested Documents — for DOCUMENT_REQUEST with metadata */}
                    {isDocRequest && requestedDocs.length > 0 && (
                      <View style={styles.requestedDocsSection}>
                        <Text style={styles.requestedDocsTitle}>
                          <Ionicons name="documents" size={14} color="#64748b" /> Requested Documents
                        </Text>
                        <View style={styles.docChipsRow}>
                          {requestedDocs.map((docType, idx) => {
                            const info = docTypeMap[docType] || { icon: 'document', color: '#3b82f6' };
                            return (
                              <View key={idx} style={[styles.docChip, { borderColor: info.color + '40' }]}>
                                <Ionicons name={info.icon} size={14} color={info.color} />
                                <Text style={[styles.docChipText, { color: info.color }]}>{docType}</Text>
                              </View>
                            );
                          })}
                        </View>

                        {/* Individual upload buttons for each requested doc */}
                        <View style={styles.uploadButtonsCol}>
                          {requestedDocs.map((docType, idx) => {
                            const info = docTypeMap[docType] || { icon: 'document', color: '#3b82f6' };
                            const isCurrentlyUploading = uploadingDocType === docType;
                            return (
                              <TouchableOpacity 
                                key={idx} 
                                style={[styles.uploadDocBtn, { borderColor: info.color + '30', backgroundColor: info.color + '08' }]}
                                onPress={() => handleDocUpload(docType, req)}
                                disabled={isCurrentlyUploading}
                              >
                                {isCurrentlyUploading ? (
                                  <ActivityIndicator size="small" color={info.color} />
                                ) : (
                                  <Ionicons name="cloud-upload" size={18} color={info.color} />
                                )}
                                <Text style={[styles.uploadDocBtnText, { color: info.color }]}>
                                  {isCurrentlyUploading ? `Uploading ${docType}...` : `Upload ${docType}`}
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color={info.color + '80'} />
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {/* Fallback: if DOCUMENT_REQUEST but no metadata, show generic upload */}
                    {isDocRequest && requestedDocs.length === 0 && (
                      <View style={styles.requestedDocsSection}>
                        <Text style={styles.requestedDocsTitle}>
                          <Ionicons name="documents" size={14} color="#64748b" /> Documents Requested
                        </Text>
                        <TouchableOpacity 
                          style={[styles.uploadDocBtn, { borderColor: '#3b82f630', backgroundColor: '#3b82f608' }]}
                          onPress={() => handleDocUpload('General Document', req)}
                          disabled={!!uploadingDocType}
                        >
                          {uploadingDocType ? (
                            <ActivityIndicator size="small" color="#3b82f6" />
                          ) : (
                            <Ionicons name="cloud-upload" size={18} color="#3b82f6" />
                          )}
                          <Text style={[styles.uploadDocBtnText, { color: '#3b82f6' }]}>
                            {uploadingDocType ? 'Uploading...' : 'Upload Document'}
                          </Text>
                          <Ionicons name="chevron-forward" size={16} color="#3b82f680" />
                        </TouchableOpacity>
                      </View>
                    )}

                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.denyBtn} onPress={() => handleAction(req, 'denied')}>
                        <Ionicons name="close" size={18} color="#ef4444" />
                        <Text style={styles.denyText}>{isDocRequest ? 'Decline' : 'Deny'}</Text>
                      </TouchableOpacity>
                      {!isDocRequest && (
                        <TouchableOpacity style={styles.approveBtn} onPress={() => handleAction(req, 'approved')}>
                          <Ionicons name="checkmark-circle" size={18} color="#fff" />
                          <Text style={styles.approveText}>Authorize</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {pending.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle" size={56} color="#1e293b" />
              <Text style={styles.emptyTitle}>All Clear</Text>
              <Text style={styles.emptySub}>No pending consent requests. Pull to refresh.</Text>
            </View>
          )}

          {/* Resolved */}
          {resolved.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 32 }]}>History ({resolved.length})</Text>
              {resolved.map((req) => (
                <View key={req.id} style={styles.resolvedRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resolvedName}>{req.doctorName || 'Staff'}</Text>
                    <Text style={styles.resolvedPurpose}>
                      {req.purpose === 'DOCUMENT_REQUEST' ? 'Document Upload' : req.purpose}
                      {req.metadata ? ` — ${req.metadata}` : ''}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.statusBadge, req.status === 'APPROVED' ? styles.badgeApproved : req.status === 'REVOKED' ? styles.badgeRevoked : styles.badgeDenied]}>
                      <Text style={[styles.statusText, { color: req.status === 'APPROVED' ? '#10b981' : req.status === 'REVOKED' ? '#f59e0b' : '#ef4444' }]}>{req.status}</Text>
                    </View>
                    {req.status === 'APPROVED' && (
                      <TouchableOpacity 
                        onPress={() => handleAction(req, 'revoked')}
                        style={styles.revokeBtn}
                      >
                        <Text style={styles.revokeText}>Revoke</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
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
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#f8fafc', marginBottom: 4 },
  pageSub: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1 },
  toastSuccess: { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' },
  toastError: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' },
  toastText: { fontSize: 14, fontWeight: '700' },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(59,130,246,0.15)' },
  infoText: { flex: 1, fontSize: 13, color: '#60a5fa', fontWeight: '600', lineHeight: 18 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 },
  consentCard: { backgroundColor: '#111827', borderRadius: 24, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: '#1e293b' },
  consentHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(59,130,246,0.15)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '900', color: '#3b82f6' },
  doctorName: { fontSize: 17, fontWeight: '800', color: '#f8fafc' },
  hospitalName: { fontSize: 13, color: '#64748b', fontWeight: '500', marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  metaItem: { flex: 1, backgroundColor: '#0f172a', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1e293b' },
  metaLabel: { fontSize: 10, fontWeight: '800', color: '#475569', letterSpacing: 1, marginBottom: 4 },
  metaValue: { fontSize: 14, fontWeight: '700', color: '#e2e8f0' },
  actionRow: { flexDirection: 'row', gap: 12 },
  denyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  denyText: { fontSize: 14, fontWeight: '800', color: '#ef4444' },
  approveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: '#3b82f6' },
  approveText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#334155', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#475569', marginTop: 4 },
  resolvedRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 16, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#1e293b' },
  resolvedName: { fontSize: 14, fontWeight: '700', color: '#e2e8f0' },
  resolvedPurpose: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeApproved: { backgroundColor: 'rgba(16,185,129,0.1)' },
  badgeDenied: { backgroundColor: 'rgba(239,68,68,0.1)' },
  badgeRevoked: { backgroundColor: 'rgba(245,158,11,0.1)' },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#111827', borderRadius: 28, padding: 32, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  modalIconCircle: { width: 72, height: 72, borderRadius: 24, backgroundColor: 'rgba(59,130,246,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#f8fafc', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  modalOtpInput: { width: '100%', backgroundColor: '#0f172a', borderRadius: 16, padding: 18, fontSize: 28, fontWeight: '900', textAlign: 'center', color: '#3b82f6', letterSpacing: 10, borderWidth: 2, borderColor: '#3b82f6', marginBottom: 20 },
  modalConfirmBtn: { width: '100%', backgroundColor: '#3b82f6', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
  modalConfirmText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  modalCancelText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3b82f6', borderRadius: 16, padding: 18, marginBottom: 24, shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  shareBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  optionBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', alignItems: 'center' },
  optionBtnActive: { backgroundColor: 'rgba(59,130,246,0.1)', borderColor: '#3b82f6' },
  optionText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  optionTextActive: { color: '#3b82f6', fontSize: 14, fontWeight: '700' },

  // Document Request specific styles
  docRequestBadge: { 
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(139,92,246,0.1)', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
  },
  docRequestBadgeText: { fontSize: 9, fontWeight: '900', color: '#8b5cf6', letterSpacing: 0.5 },
  requestedDocsSection: { 
    backgroundColor: '#0f172a', borderRadius: 16, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#1e293b',
  },
  requestedDocsTitle: { fontSize: 11, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  docChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  docChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#111827', borderWidth: 1,
  },
  docChipText: { fontSize: 12, fontWeight: '700' },
  uploadButtonsCol: { gap: 8 },
  uploadDocBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  uploadDocBtnText: { flex: 1, fontSize: 14, fontWeight: '700' },

  // Revoke button in history
  revokeBtn: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  revokeText: { fontSize: 10, fontWeight: '800', color: '#ef4444', textTransform: 'uppercase' },

  // Always-visible vault upload section
  vaultUploadSection: {
    backgroundColor: '#111827', borderRadius: 24, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: '#1e293b',
  },
  vaultUploadBtn: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0f172a', padding: 14, borderRadius: 14,
    borderWidth: 1,
  },
  vaultUploadBtnText: { fontSize: 13, fontWeight: '700' },
});
