// UPHI Mobile Platform - v1.0.2 - Stabilization Update
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TimelineScreen from './src/screens/TimelineScreen';
import ConsentScreen from './src/screens/ConsentScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FamilyScreen from './src/screens/FamilyScreen';
import { View, Text, ActivityIndicator } from 'react-native';

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          height: 88,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: 'grid',
            Timeline: 'time',
            Family: 'people',
            Consent: 'shield-checkmark',
            Reports: 'document-text',
            Profile: 'person-circle',
          };
          return <Ionicons name={icons[route.name] || 'grid'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Timeline" component={TimelineScreen} />
      <Tab.Screen name="Family" component={FamilyScreen} />
      <Tab.Screen name="Consent" component={ConsentScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0f1a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#64748b', marginTop: 16, fontSize: 14, fontWeight: '600' }}>Initializing Secure Session...</Text>
      </View>
    );
  }

  return isAuthenticated ? <MainTabs /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppContent />
      </NavigationContainer>
    </AuthProvider>
  );
}
