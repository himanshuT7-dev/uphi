import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem('uphi_token') || null);
    const [role, setRole] = useState(localStorage.getItem('uphi_role') || null);
    const [username, setUsername] = useState(localStorage.getItem('uphi_user') || null);
    const [hospitalId, setHospitalId] = useState(localStorage.getItem('uphi_hospital') || null);
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
            const token = localStorage.getItem('uphi_token');
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
                        const currentToken = localStorage.getItem('uphi_token');
                        const res = await axios.post('/api/auth/refresh', {}, {
                            headers: { Authorization: `Bearer ${currentToken}` }
                        });
                        const newToken = res.data.token;
                        localStorage.setItem('uphi_token', newToken);
                        setToken(newToken);
                        processQueue(null, newToken);
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return axios(originalRequest);
                    } catch (refreshError) {
                        processQueue(refreshError, null);
                        logout();
                        window.location.href = "/";
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
        localStorage.setItem('uphi_token', data.token);
        localStorage.setItem('uphi_role', data.role);
        localStorage.setItem('uphi_user', data.username);
        localStorage.setItem('uphi_hospital', data.hospitalId);
        setToken(data.token);
        setRole(data.role);
        setUsername(data.username);
        setHospitalId(data.hospitalId);
    };

    const logout = () => {
        localStorage.clear();
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
