import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, StatusBar, Animated, Alert, Modal, ActivityIndicator, Platform, Image, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import api, { getAuthToken } from '../api';
import { useAuth } from '../context/AuthContext';

const typeColors = {
  'LAB': '#3b82f6',
  'LAB REPORT': '#3b82f6',
  'RADIOLOGY': '#8b5cf6',
  'XRAY': '#8b5cf6',
  'X-RAY': '#8b5cf6',
  'ECG': '#ef4444',
  'CARDIOLOGY': '#ef4444',
  'DIAGNOSTICS': '#06b6d4',
  'CONSULTATION': '#10b981',
  'PRESCRIPTION': '#10b981',
};

const typeIcons = {
  'LAB': 'flask',
  'RADIOLOGY': 'scan',
  'XRAY': 'scan',
  'ECG': 'pulse',
  'CARDIOLOGY': 'heart',
  'DIAGNOSTICS': 'analytics',
  'CONSULTATION': 'document-text',
  'PRESCRIPTION': 'medkit',
};

export default function ReportsScreen() {
  const { logout } = useAuth();
  const [reports, setReports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [metadataModalVisible, setMetadataModalVisible] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingType, setPendingType] = useState(null);
  const [manualTitle, setManualTitle] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const categories = ['All', 'Consultation', 'Lab Report', 'Radiology', 'ECG', 'Prescription'];
  const uploadTypes = [
    { label: 'Prescription Doc', value: 'PRESCRIPTION', icon: 'medkit', color: '#10b981' },
    { label: 'X-Ray Scan', value: 'RADIOLOGY', icon: 'scan', color: '#8b5cf6' },
    { label: 'ECG Report', value: 'ECG', icon: 'pulse', color: '#ef4444' },
    { label: 'General Report', value: 'LAB', icon: 'document-text', color: '#3b82f6' },
  ];

  const fetchReports = async () => {
    try {
      const res = await api.get('/api/records/me');
      const records = res.data || [];
      const mapped = records.map((r, i) => ({
        id: r.id || `rec-${i}`,
        name: r.title || r.diagnosticSummary || r.type || 'Clinical Record',
        type: (r.type || 'LAB').toUpperCase(),
        date: r.date ? new Date(r.date).toLocaleDateString('en-GB') : 'N/A',
        facility: r.hospitalName || (r.hospitalId === 'SELF' ? 'Self Uploaded' : 'Apollo Hospital'),
        hospitalId: r.hospitalId,
        hasScan: !!r.encryptedFileUrl,
        scanUrl: r.encryptedFileUrl ? `${api.defaults.baseURL}/api/records/${r.id}/scan` : null,
        contentType: r.contentType,
        rawNotes: r.clinicalNotes || (
          r.type === 'XRAY' || r.type === 'RADIOLOGY' ? 
            "CLINICAL HISTORY:\nPatient-uploaded diagnostic asset. No metadata provided during acquisition.\n\nNOTE:\nProfessional interpretation pending. Please consult with your physician to evaluate these findings." :
          r.type === 'ECG' ? 
            "CARDIOLOGICAL ASSESSMENT:\nPatient-uploaded ECG trace. Original signal purity preserved.\n\nSYSTEM NOTE:\nThis record was uploaded directly by the patient via the UPHI Private Vault." :
          r.type === 'LAB' ? 
            "LABORATORY ANALYSIS:\nSelf-uploaded clinical report. Assets are preserved in their original lossless format." :
            "GENERAL CLINICAL EVALUATION:\n\nThis record was captured and preserved via the UPHI AI Integrity engine. No clinical notes were provided at the time of upload."
        ),
        doctor: r.doctorName || 'Patient Uploaded'
      }));
      setReports(mapped);
    } catch (err) {
      if (err.response?.status === 401) logout();
    }
  };

  useEffect(() => {
    fetchReports();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  const handleUpload = async (type) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      setUploadModalVisible(false);
      setPendingFile(result.assets[0]);
      setPendingType(type);
      setManualTitle(result.assets[0].name.split('.')[0]);
      setManualNotes('');
      setMetadataModalVisible(true);
    } catch (err) {
      console.log('Picker error:', err);
    }
  };

  const finalizeUpload = async () => {
    if (!pendingFile) return;
    
    setIsUploading(true);
    setMetadataModalVisible(false);

    try {
      const formData = new FormData();
      
      const fileUri = pendingFile.uri;
      const fileType = pendingFile.mimeType || (fileUri.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      
      formData.append('file', {
        uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
        name: pendingFile.name || `upload_${Date.now()}.${fileUri.split('.').pop()}`,
        type: fileType,
      });
      formData.append('type', pendingType);
      formData.append('title', manualTitle);
      formData.append('clinicalNotes', manualNotes);

      await api.post('/api/records/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Alert.alert('Success', `Document preserved in your UPHI vault.`);
      setPendingFile(null);
      fetchReports();
    } catch (err) {
      console.log('Upload error:', err);
      Alert.alert('Upload Failed', 'There was an error uploading your document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (recordId, fileName) => {
    setDownloadingId(recordId);
    setDownloadProgress(0);
    try {
      const safeName = (fileName || 'UPHI_Report').replace(/[^a-zA-Z0-9]/g, '_');
      const fileUri = `${FileSystem.documentDirectory}${safeName}.pdf`;
      
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
      Alert.alert('Download Error', 'Could not retrieve the digital report.');
    } finally {
      setDownloadingId(null);
      setDownloadProgress(0);
    }
  };

  const handleDelete = async (recordId) => {
    Alert.alert(
      "Purge Clinical Record?",
      "Deletions from the UPHI Vault are permanent and lossless files will be destroyed. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Permanent", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/api/records/${recordId}`);
              Alert.alert("Success", "Record purged and assets destroyed successfully.");
              setDetailModalVisible(false);
              fetchReports();
            } catch (err) {
              console.log('Delete error:', err);
              Alert.alert("Error", "Could not purge the record. Ensure network connectivity.");
            }
          }
        }
      ]
    );
  };

  const shown = filter === 'All' 
    ? reports 
    : reports.filter(r => {
        const typeStr = r.type.toUpperCase();
        const filterStr = filter.toUpperCase();
        
        if (filterStr === 'LAB REPORT') return typeStr.includes('LAB');
        if (filterStr === 'RADIOLOGY') return typeStr.includes('RADIOLOGY') || typeStr.includes('XRAY') || typeStr.includes('SCAN');
        if (filterStr === 'ECG') return typeStr.includes('ECG') || typeStr.includes('CARDIO');
        if (filterStr === 'CONSULTATION') return typeStr.includes('CONSULT');
        if (filterStr === 'PRESCRIPTION') return typeStr.includes('PRES');
        
        return typeStr.includes(filterStr.split(' ')[0]);
      });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Medical Reports</Text>
          <Text style={styles.pageSub}>Your clinical document archive</Text>
        </View>
        <TouchableOpacity style={styles.uploadTrigger} onPress={() => setUploadModalVisible(true)}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
            {categories.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setFilter(c)}
                style={[styles.filterChip, filter === c && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, filter === c && styles.filterTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {isUploading && (
            <View style={styles.loaderArea}>
              <ActivityIndicator color="#3b82f6" />
              <Text style={styles.loaderText}>Uploading document to secure vault...</Text>
            </View>
          )}

          {shown.length > 0 ? shown.map((r, i) => (
            <TouchableOpacity 
              key={r.id} 
              style={styles.reportCard} 
              onPress={() => {
                setSelectedReport(r);
                setDetailModalVisible(true);
              }}
            >
              <View style={[styles.reportIcon, { backgroundColor: `${typeColors[r.type] || '#3b82f6'}15` }]}>
                <Ionicons name={typeIcons[r.type] || 'document'} size={22} color={typeColors[r.type] || '#3b82f6'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportName} numberOfLines={1}>{r.name}</Text>
                <View style={styles.reportMeta}>
                  <Text style={[styles.reportType, { color: typeColors[r.type] || '#64748b' }]}>{r.type}</Text>
                  <View style={styles.dot} />
                  <Text style={styles.reportDate}>{r.date}</Text>
                </View>
                <Text style={styles.reportFacility}>{r.facility}</Text>
              </View>
              {r.hospitalId === 'SELF' ? (
                <TouchableOpacity onPress={() => handleDelete(r.id)} style={{ padding: 8 }}>
                  <Ionicons name="trash" size={20} color="#ef4444" />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#475569" />
              )}
            </TouchableOpacity>
          )) : (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open" size={56} color="#1e293b" />
              <Text style={styles.emptyTitle}>No Reports Found</Text>
              <Text style={styles.emptySub}>{filter !== 'All' ? `No ${filter} records available` : 'Pull to refresh'}</Text>
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
                <Text style={styles.modalTitle}>{selectedReport?.name}</Text>
                <Text style={styles.modalSub}>{selectedReport?.facility} • {selectedReport?.date || selectedReport?.uploadDate}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Asset Badge */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                <View style={[styles.typeBadge, { backgroundColor: '#eff6ff' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#3b82f6' }}>{selectedReport?.type || 'DOCUMENT'}</Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: '#f0fdf4' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#22c55e' }}>VERIFIED</Text>
                </View>
              </View>
              {/* Scan Visualization Section */}
              {selectedReport?.hasScan && (selectedReport?.contentType?.startsWith('image/') || selectedReport?.type === 'RADIOLOGY' || selectedReport?.type === 'ECG') && (
                <View style={styles.imageContainer}>
                   <Image 
                    source={{ 
                      uri: selectedReport.scanUrl,
                      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
                    }} 
                    style={styles.scanImage}
                    resizeMode="contain"
                    onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
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
                  <Text style={styles.rawTitle}>Medical Officer: {selectedReport?.doctor || selectedReport?.uploadedBy || 'UPHI Platform'}</Text>
                </View>
                <View style={styles.rawDivider} />
                <Text style={styles.rawContent}>
                    {selectedReport?.rawNotes || selectedReport?.diagnosticSummary || selectedReport?.analysis || 'Protected digital health record encrypted with UPHI Vault technology. View source scan for manual interpretation.'}
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.modalDownloadBtn, downloadingId === selectedReport?.id && { opacity: 0.7 }]}
                onPress={() => handleDownload(selectedReport?.id, selectedReport?.name)}
                disabled={downloadingId === selectedReport?.id}
              >
                {downloadingId === selectedReport?.id ? (
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

              {selectedReport?.hospitalId === 'SELF' && (
                <TouchableOpacity 
                  style={styles.modalDeleteBtn}
                  onPress={() => handleDelete(selectedReport?.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <Text style={styles.modalDeleteText}>Purge from Vault</Text>
                </TouchableOpacity>
              )}
              
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Upload Type Modal */}
      <Modal
        visible={uploadModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBlur} onPress={() => setUploadModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Document</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Select the type of medical document you want to add to your UPHI vault.</Text>
            
            <View style={styles.typeGrid}>
              {uploadTypes.map((t) => (
                <TouchableOpacity key={t.value} style={styles.typeItem} onPress={() => handleUpload(t.value)}>
                  <View style={[styles.typeIcon, { backgroundColor: `${t.color}15` }]}>
                    <Ionicons name={t.icon} size={28} color={t.color} />
                  </View>
                  <Text style={styles.typeLabel}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Metadata Input Modal */}
      <Modal
        visible={metadataModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.metadataModal}>
            <Text style={styles.modalTitle}>Finalize Upload</Text>
            <Text style={styles.modalSub}>Add details to help doctors interpret this record.</Text>
            
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput 
              style={styles.input} 
              value={manualTitle} 
              onChangeText={setManualTitle}
              placeholder="e.g. Chest X-Ray Nov 2024"
              placeholderTextColor="#475569"
            />

            <Text style={styles.inputLabel}>Clinical Notes / Symptoms</Text>
            <TextInput 
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
              multiline 
              value={manualNotes} 
              onChangeText={setManualNotes}
              placeholder="Describe your symptoms or why this was taken..."
              placeholderTextColor="#475569"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setMetadataModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={finalizeUpload}>
                <Text style={styles.saveText}>Save to Vault</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1a' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scroll: { padding: 20, paddingTop: 10 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#f8fafc', marginBottom: 4 },
  pageSub: { fontSize: 14, color: '#64748b', marginBottom: 10 },
  uploadTrigger: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  
  filterScroll: { marginBottom: 20 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#111827' },
  filterChipActive: { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6' },
  filterText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  filterTextActive: { color: '#3b82f6' },
  
  reportCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#111827', borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#1e293b' },
  reportIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  reportName: { fontSize: 15, fontWeight: '700', color: '#f8fafc', marginBottom: 4 },
  reportMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reportType: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#334155' },
  reportDate: { fontSize: 12, color: '#475569' },
  reportFacility: { fontSize: 11, color: '#334155', fontWeight: '600', marginTop: 4 },
  
  loaderArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(59,130,246,0.05)', padding: 12, borderRadius: 12, marginBottom: 15 },
  loaderText: { fontSize: 13, color: '#3b82f6', fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#334155', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#475569', marginTop: 4 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBlur: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { backgroundColor: '#111827', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderTopColor: '#1e293b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#f8fafc' },
  modalSub: { fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 20 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  typeItem: { width: '47%', backgroundColor: '#0a0f1a', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  typeIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  typeLabel: { fontSize: 13, fontWeight: '700', color: '#cbd5e1' },

  // Detail Modal specific styles
  detailModal: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    height: '85%',
    borderTopWidth: 1,
    borderColor: '#1e293b',
  },
  aiSection: {
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rawSection: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
  },
  rawTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#cbd5e1',
    marginBottom: 10,
  },
  rawDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginBottom: 15,
  },
  rawContent: {
    fontSize: 15,
    color: '#94a3b8',
    lineHeight: 24,
    fontWeight: '500',
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
    color: '#fff',
  },
  
  // Metadata Modal
  metadataModal: {
    backgroundColor: '#111827',
    margin: 20,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#0a0f1a', borderRadius: 12, padding: 16, color: '#f8fafc', fontSize: 14, borderWidth: 1, borderColor: '#1e293b' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' },
  cancelText: { color: '#94a3b8', fontWeight: '700' },
  saveBtn: { flex: 2, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3b82f6' },
  saveText: { color: '#fff', fontWeight: '800' },

  imageContainer: { width: '100%', height: 300, backgroundColor: '#000', borderRadius: 20, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderColor: '#1e293b' },
  scanImage: { width: '100%', height: '100%' },
  hdBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(34,197,94,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  hdText: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
});
