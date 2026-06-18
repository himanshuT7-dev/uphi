import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setAuthToken } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const savedToken = await AsyncStorage.getItem('uphi_mobile_token');
      const savedUser = await AsyncStorage.getItem('uphi_mobile_user');
      if (savedToken) {
        setToken(savedToken);
        setAuthToken(savedToken);
      }
      if (savedUser) setUser(JSON.parse(savedUser));
      setLoading(false);
    })();
  }, []);

  const login = async (data) => {
    await AsyncStorage.setItem('uphi_mobile_token', data.token);
    await AsyncStorage.setItem('uphi_mobile_user', JSON.stringify(data));
    setToken(data.token);
    setUser(data);
    setAuthToken(data.token);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['uphi_mobile_token', 'uphi_mobile_user']);
    setToken(null);
    setUser(null);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
