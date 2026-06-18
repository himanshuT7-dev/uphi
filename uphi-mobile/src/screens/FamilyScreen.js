import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, StatusBar, Animated, ActivityIndicator, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function FamilyScreen({ navigation }) {
  const { logout } = useAuth();
  const [members, setMembers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchData = async () => {
    try {
      const res = await api.get('/api/patients/me');
      setMembers(res.data.relatedPersons || []);
    } catch (err) {
      console.error('Family fetch error:', err);
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Unlocking Family Vault...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family & Dependents</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color="#2563eb" />
            <Text style={styles.infoText}>
              These individuals have shared clinical access or are registered as your dependents under ABDM guidelines.
            </Text>
          </View>

          {members.length > 0 ? (
            members.map((member, index) => (
              <View key={index} style={styles.memberCard}>
                <View style={styles.avatarContainer}>
                  <Ionicons 
                    name={member.relationship?.toLowerCase().includes('child') ? 'person-circle' : 'person'} 
                    size={32} 
                    color="#2563eb" 
                  />
                </View>
                <View style={styles.memberInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.memberName}>{member.fullName}</Text>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>VERIFIED</Text>
                    </View>
                  </View>
                  <Text style={styles.relationship}>{member.relationship}</Text>
                  
                  <View style={styles.contactRow}>
                    <Ionicons name="call-outline" size={14} color="#64748b" />
                    <Text style={styles.contactText}>{member.phone || 'No Phone'}</Text>
                  </View>
                  {member.email && (
                    <View style={styles.contactRow}>
                      <Ionicons name="mail-outline" size={14} color="#64748b" />
                      <Text style={styles.contactText}>{member.email}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Family Linked</Text>
              <Text style={styles.emptySub}>
                Linked family members will appear here for unified healthcare management.
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.addBtn}>
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addBtnText}>Link New Relative</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0f1a' },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 14, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#0a0f1a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  scrollContent: { padding: 20 },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59,130,246,0.1)',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  infoText: { flex: 1, fontSize: 12, color: '#93c5fd', lineHeight: 18, fontWeight: '500' },
  memberCard: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(59,130,246,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInfo: { flex: 1, marginLeft: 16 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  memberName: { fontSize: 17, fontWeight: '800', color: '#f8fafc' },
  verifiedBadge: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: { fontSize: 9, fontWeight: '900', color: '#10b981' },
  relationship: { fontSize: 13, fontWeight: '700', color: '#3b82f6', marginBottom: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  contactText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, paddingHorizontal: 40, lineHeight: 20 },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
