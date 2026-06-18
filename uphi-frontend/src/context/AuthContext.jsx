import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [token, setToken] = useState(sessionStorage.getItem('uphi_token') || null);
    const [role, setRole] = useState(sessionStorage.getItem('uphi_role') || null);
    const [username, setUsername] = useState(sessionStorage.getItem('uphi_user') || null);
    const [hospitalId, setHospitalId] = useState(sessionStorage.getItem('uphi_hospital') || null);
    const [loading, setLoading] = useState(false);
    
    // Configure default Axios interceptors for ease of use across the app
    useEffect(() => {
        let isRefreshing = false;
        let failedQueue = [];

        const processQueue = (error, newToken = null) => {
            failedQueue.forEach(prom => {
                if (error) prom.reject(error);
                else prom.resolve(newToken);
            });
            failedQueue = [];
        };

        const reqInterceptor = axios.interceptors.request.use(config => {
            const token = sessionStorage.getItem('uphi_token');
            if (token && token !== "null" && token !== "undefined") {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }, error => Promise.reject(error));

        const resInterceptor = axios.interceptors.response.use(
            response => response,
            async error => {
                const originalRequest = error.config;
                const status = error.response ? error.response.status : 'NETWORK/CORS';
                
                if (error.response && error.response.status === 401 && !originalRequest._retry) {
                    // Don't retry auth endpoints
                    if (originalRequest.url?.includes('/api/auth/')) {
                        return Promise.reject(error);
                    }

                    // Don't auto-logout during seeding operations
                    if (window.__UPHI_SEEDING_IN_PROGRESS__) {
                        console.warn('[AuthContext] 401 suppressed during seeding operation');
                        return Promise.reject(error);
                    }

                    if (isRefreshing) {
                        return new Promise((resolve, reject) => {
                            failedQueue.push({ resolve, reject });
                        }).then(newToken => {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            return axios(originalRequest);
                        }).catch(err => Promise.reject(err));
                    }

                    originalRequest._retry = true;
                    isRefreshing = true;

                    try {
                        const currentToken = sessionStorage.getItem('uphi_token');
                        const res = await axios.post('/api/auth/refresh', {}, {
                            headers: { Authorization: `Bearer ${currentToken}` }
                        });
                        const newToken = res.data.token;
                        sessionStorage.setItem('uphi_token', newToken);
                        setToken(newToken);
                        processQueue(null, newToken);
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return axios(originalRequest);
                    } catch (refreshError) {
                        processQueue(refreshError, null);
                        // Only force-redirect if we're not in a seeding operation
                        if (!window.__UPHI_SEEDING_IN_PROGRESS__) {
                            logout();
                            window.location.href = "/";
                        }
                        return Promise.reject(refreshError);
                    } finally {
                        isRefreshing = false;
                    }
                } else if (error.response && error.response.status === 403) {
                    console.warn("Access Denied: You do not have permission for this resource.");
                }
                return Promise.reject(error);
            }
        );
        
        return () => {
            axios.interceptors.request.eject(reqInterceptor);
            axios.interceptors.response.eject(resInterceptor);
        };
    }, []);

    const login = (data) => {
        sessionStorage.setItem('uphi_token', data.token);
        sessionStorage.setItem('uphi_role', data.role);
        sessionStorage.setItem('uphi_user', data.username);
        sessionStorage.setItem('uphi_hospital', data.hospitalId);
        sessionStorage.setItem('uphi_fullname', data.fullName || '');
        setToken(data.token);
        setRole(data.role);
        setUsername(data.username);
        setHospitalId(data.hospitalId);
    };

    const logout = () => {
        sessionStorage.clear();
        setToken(null);
        setRole(null);
        setUsername(null);
        setHospitalId(null);
    };

    const value = {
        token,
        role,
        username,
        hospitalId,
        isAuthenticated: !!token,
        loading,
        setLoading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
