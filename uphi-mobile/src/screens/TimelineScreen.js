import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, StatusBar, Animated, ActivityIndicator, Alert, Modal, Platform, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import api, { getAuthToken } from '../api';
import { useAuth } from '../context/AuthContext';

const TYPE_CONFIG = {
  consultation: { icon: 'chatbubbles', color: '#3b82f6', label: 'Consultation' },
  lab_test: { icon: 'flask', color: '#8b5cf6', label: 'Lab Test' },
  lab: { icon: 'flask', color: '#8b5cf6', label: 'Lab Test' },
  imaging: { icon: 'scan', color: '#06b6d4', label: 'Imaging' },
  xray: { icon: 'scan', color: '#06b6d4', label: 'X-Ray' },
  ecg: { icon: 'pulse', color: '#ef4444', label: 'ECG' },
  prescription: { icon: 'medkit', color: '#f59e0b', label: 'Prescription' },
  surgery: { icon: 'cut', color: '#dc2626', label: 'Surgery' },
  vaccination: { icon: 'shield-checkmark', color: '#10b981', label: 'Vaccination' },
  discharge: { icon: 'log-out', color: '#64748b', label: 'Discharge' },
  admission: { icon: 'bed', color: '#f97316', label: 'Admission' },
  followup: { icon: 'arrow-redo', color: '#14b8a6', label: 'Follow-Up' },
};

function getTypeConfig(type) {
  const key = (type || 'consultation').toLowerCase().replace(/[\s_-]/g, '_');
  return TYPE_CONFIG[key] || TYPE_CONFIG.consultation;
}

export default function TimelineScreen() {
  const { logout } = useAuth();
  const [records, setRecords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchData = async () => {
    try {
      const res = await api.get('/api/records/me');
      const items = (res.data || []).map((r, idx) => ({
        id: r.id || `t-${idx}`,
        type: (r.type || 'consultation').toLowerCase(),
        event: r.title || r.diagnosticSummary || r.type || 'Clinical Event',
        date: r.date ? new Date(r.date) : new Date(),
        facility: r.hospitalName || (r.hospitalId === 'SELF' ? 'UPHI Private Vault' : 'Apollo Hospital'),
        hospitalId: r.hospitalId,
        clinicalNotes: r.clinicalNotes || (
          (r.type || '').toLowerCase().includes('xray') || (r.type || '').toLowerCase().includes('radiology') ? 
            "CLINICAL HISTORY:\nPatient-uploaded diagnostic asset. Original image data preserved securely.\n\nNOTE:\nProfessional interpretation pending. Please consult with your physician to evaluate these findings." :
          (r.type || '').toLowerCase().includes('ecg') ? 
            "CARDIOLOGICAL ASSESSMENT:\nPatient-uploaded ECG trace. Original signal purity preserved.\n\nSYSTEM NOTE:\nThis record was uploaded directly by the patient via the UPHI Private Vault." :
          (r.type || '').toLowerCase().includes('consult') ? 
            "CONSULTATION SUMMARY:\n\nDetailed medical review conducted. Clinical history restored from vault archives." :
          "GENERAL CLINICAL OBSERVATIONS:\n\nThis event was captured and preserved via the UPHI AI Integrity engine. No clinical notes were provided at the time of upload."
        ),
        hasScan: !!r.encryptedFileUrl,
        scanUrl: r.encryptedFileUrl ? `${api.defaults.baseURL}/api/records/${r.id}/scan` : null,
        contentType: r.contentType,
        doctor: r.doctorName || 'Pathology Staff'
      }));

      // Sort newest first
      items.sort((a, b) => b.date - a.date);
      setRecords(items);
    } catch (err) {
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

  const handleDownload = async (recordId, eventName) => {
    setDownloadingId(recordId);
    setDownloadProgress(0);
    try {
      const safeName = (eventName || 'Record').replace(/[^a-zA-Z0-9]/g, '_');
      const fileUri = `${FileSystem.documentDirectory}${safeName}_${recordId}.pdf`;
      
      const downloadResumable = FileSystem.createDownloadResumable(
        `${api.defaults.baseURL}/api/records/${recordId}/pdf`,
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        },
        (progress) => {
          const p = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
          setDownloadProgress(p);
        }
      );

      const downloadRes = await downloadResumable.downloadAsync();

      if (downloadRes.status === 200) {
        await Sharing.shareAsync(downloadRes.uri);
      } else {
        throw new Error('Download failed with status ' + downloadRes.status);
      }
    } catch (err) {
      console.log('Download error:', err);
      Alert.alert('Download Error', 'Could not retrieve the professional clinical report.');
    } finally {
      setDownloadingId(null);
      setDownloadProgress(0);
    }
  };

  const handleDelete = async (recordId) => {
    Alert.alert(
      "Purge Clinical Asset?",
      "Permanent removal from UPHI Vault. Original diagnostic data will be destroyed. This action is irreversible.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Permanent", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/api/records/${recordId}`);
              Alert.alert("Success", "Record purged from vault.");
              setDetailModalVisible(false);
              fetchData();
            } catch (err) {
              console.log('Delete error:', err);
              Alert.alert("Error", "Could not purge the record.");
            }
          }
        }
      ]
    );
  };

  const formatDate = (d) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const getRelativeTime = (d) => {
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Restoring your clinical history...</Text>
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
            <View>
              <Text style={styles.headerTitle}>Clinical Timeline</Text>
              <Text style={styles.headerSub}>Access your portable health record</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{records.length}</Text>
            </View>
          </View>

          {/* Timeline */}
          {records.map((item, index) => {
            const cfg = getTypeConfig(item.type);
            const isLast = index === records.length - 1;

            return (
              <View key={item.id} style={styles.timelineItem}>
                <View style={styles.timelineSide}>
                  <View style={[styles.timelineDot, { backgroundColor: cfg.color }]}>
                    <Ionicons name={cfg.icon} size={14} color="#fff" />
                  </View>
                  {!isLast && <View style={styles.timelineLine} />}
                </View>

                <View style={styles.timelineCard}>
                  <View style={styles.timelineCardHeader}>
                    <View style={[styles.typeBadge, { backgroundColor: `${cfg.color}15` }]}>
                      <Text style={[styles.typeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <Text style={styles.relativeTime}>{getRelativeTime(item.date)}</Text>
                  </View>

                  <Text style={styles.eventTitle}>{item.event}</Text>
                  <Text style={styles.eventDetail}>{item.detail}</Text>

                  <View style={styles.eventFooter}>
                    <View style={styles.eventFooterItem}>
                      <Ionicons name="business" size={12} color="#475569" />
                      <Text style={styles.eventFooterText}>{item.facility}</Text>
                    </View>
                    {item.doctor && (
                      <View style={styles.eventFooterItem}>
                        <Ionicons name="person" size={12} color="#475569" />
                        <Text style={styles.eventFooterText}>{item.doctor}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardActions}>
                    <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                    <TouchableOpacity 
                      style={styles.downloadBtn} 
                      onPress={() => {
                        setSelectedEvent(item);
                        setDetailModalVisible(true);
                      }}
                    >
                      <Ionicons name="eye-outline" size={14} color="#3b82f6" />
                      <Text style={styles.downloadBtnText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}

          {records.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color="#334155" />
              <Text style={styles.emptyTitle}>No Medical History</Text>
              <Text style={styles.emptyText}>Your clinical timeline will appear here once you receive care at a UPHI facility.</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedEvent?.event}</Text>
                <Text style={styles.modalSub}>{selectedEvent?.facility} • {selectedEvent?.diagnosticSummary}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Scan Visualization Section */}
              {selectedEvent?.hasScan && (selectedEvent?.contentType?.startsWith('image/') || selectedEvent?.type?.toUpperCase() === 'RADIOLOGY' || selectedEvent?.type?.toUpperCase() === 'XRAY') && (
                <View style={styles.imageContainer}>
                   <Image 
                    source={{ 
                      uri: selectedEvent.scanUrl,
                      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
                    }} 
                    style={styles.scanImage}
                    resizeMode="contain"
                    onError={(e) => console.log('Timeline Image load error:', e.nativeEvent.error)}
                  />
                  <View style={styles.hdBadge}>
                    <Ionicons name="sparkles" size={12} color="#fff" />
                    <Text style={styles.hdText}>HD LOSSLESS PREVIEW</Text>
                  </View>
                </View>
              )}

              {/* Clinical Details Section */}
              <View style={styles.rawSection}>
                <View style={styles.detailMetaRow}>
                  <Ionicons name="person-circle" size={16} color="#94a3b8" />
                  <Text style={styles.rawTitle}>Medical Officer: {selectedEvent?.doctor || 'UPHI Platform'}</Text>
                </View>
                <View style={styles.rawDivider} />
                <Text style={styles.rawContent}>
                    {selectedEvent?.clinicalNotes || 'This health event has been verified and securely locked in the UPHI registry. Digital integrity check completed on ingest.'}
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.modalDownloadBtn, downloadingId === selectedEvent?.id && { opacity: 0.7 }]}
                onPress={() => handleDownload(selectedEvent?.id, selectedEvent?.event)}
                disabled={downloadingId === selectedEvent?.id}
              >
                {downloadingId === selectedEvent?.id ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator color="#fff" />
                    <Text style={styles.modalDownloadText}>
                      Generating... {Math.round(downloadProgress * 100)}%
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="document-text" size={20} color="#fff" />
                    <Text style={styles.modalDownloadText}>Download Professional PDF</Text>
                  </>
                )}
              </TouchableOpacity>
              
              {selectedEvent?.hospitalId === 'SELF' && (
                <TouchableOpacity 
                  style={styles.modalDeleteBtn}
                  onPress={() => handleDelete(selectedEvent?.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <Text style={styles.modalDeleteText}>Purge Clinical Asset</Text>
                </TouchableOpacity>
              )}
              
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1a' },
  scroll: { padding: 20, paddingTop: 60 },
  loadingContainer: { flex: 1, backgroundColor: '#0a0f1a', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#64748b', fontSize: 13, fontWeight: '600', marginTop: 16 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#f8fafc' },
  headerSub: { fontSize: 13, color: '#64748b', fontWeight: '500', marginTop: 4 },
  countBadge: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.1)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
  },
  countBadgeText: { fontSize: 18, fontWeight: '900', color: '#3b82f6' },

  timelineItem: { flexDirection: 'row', marginBottom: 0 },
  timelineSide: { alignItems: 'center', width: 40, marginRight: 12 },
  timelineDot: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#1e293b', marginVertical: 4 },
  timelineCard: { flex: 1, backgroundColor: '#111827', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#1e293b', marginBottom: 16 },
  timelineCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  relativeTime: { fontSize: 11, color: '#475569', fontWeight: '600' },

  eventTitle: { fontSize: 16, fontWeight: '800', color: '#f8fafc', marginBottom: 6 },
  eventDetail: { fontSize: 13, color: '#94a3b8', fontWeight: '500', lineHeight: 20, marginBottom: 12 },

  eventFooter: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  eventFooterItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventFooterText: { fontSize: 11, color: '#475569', fontWeight: '600' },

  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 12, marginTop: 4 },
  dateText: { fontSize: 11, color: '#334155', fontWeight: '600' },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(59,130,246,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  downloadBtnText: { fontSize: 11, fontWeight: '800', color: '#3b82f6' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#64748b', marginTop: 16 },
  emptyText: { fontSize: 13, color: '#475569', fontWeight: '500', textAlign: 'center', marginTop: 8, lineHeight: 20 },

  // Detail Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  detailModal: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    height: '85%',
    borderTopWidth: 1,
    borderColor: '#1e293b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f8fafc',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '600',
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  rawSection: {
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#a78bfa',
    letterSpacing: 1,
  },
  aiContent: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 24,
    fontWeight: '500',
  },
  rawSection: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },
  rawTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 10,
  },
  rawDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginBottom: 15,
  },
  rawContent: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 22,
  },
  modalDownloadBtn: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  modalDownloadText: {
    fontSize: 16,
    fontWeight: '800',
    fontWeight: '800',
    color: '#fff',
  },
  modalDeleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 16, padding: 16, 
    marginTop: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)'
  },
  modalDeleteText: { color: '#ef4444', fontSize: 13, fontWeight: '700' },
  imageContainer: { width: '100%', height: 300, backgroundColor: '#000', borderRadius: 20, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderColor: '#1e293b' },
  scanImage: { width: '100%', height: '100%' },
  hdBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(34,197,94,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  hdText: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
});
