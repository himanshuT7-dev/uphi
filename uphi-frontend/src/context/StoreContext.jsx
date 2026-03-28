import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const DataContext = createContext();

export function DataProvider({ children }) {
    const [patients, setPatients] = useState([]);
    const [consents, setConsents] = useState([]);
    const [records, setRecords] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // Global fetchers bound to current AuthContext token by Axios interceptors
    const fetchPatients = useCallback(async () => {
        try {
            setLoadingData(true);
            const res = await axios.get('/api/patients');
            // Safe mapping directly matching Patient Schema
            const formatted = res.data.map(p => ({
                id: p.id || p.abhaAddress || "N/A",
                name: p.fullName || "Unknown",
                age: p.age || 0,
                gender: p.gender || "Unknown",
                phone: p.phone,
                bloodGroup: p.bloodGroup,
                vitals: p.vitals || {},
                conditions: p.conditions || [],
                allergies: p.allergies || [],
                medications: p.medications || [],
                riskScores: p.risk || {},
                abhaAddress: p.abhaAddress
            }));
            setPatients(formatted);
        } catch (error) {
            if (error.response && error.response.status === 401) return; // Handled by AuthContext interceptor
            console.error("Failed to fetch patients:", error);
        } finally {
            setLoadingData(false);
        }
    }, []);

    const fetchConsents = useCallback(async (isPatientViewer = false) => {
        try {
            const ep = isPatientViewer ? '/api/consents/patient' : '/api/consents/hospital';
            const res = await axios.get(ep).catch(() => ({ data: [] }));
            
            const formatted = (res.data || []).map(c => ({
                id: c.id,
                patient: c.patientId || "Unknown Patient",
                uhid: c.patientId || "ABHA-XXXX",
                doctor: c.hospitalId || "Unknown Provider",
                hospital: c.hospitalId || "Unknown Facility",
                specialty: "General Medicine",
                purpose: c.purpose || "General Review",
                status: c.status ? c.status.toLowerCase() : "pending",
                requestedAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Just now",
                duration: "Until Revoked",
                original: c
            }));
            
            setConsents(formatted);
        } catch (error) {
            if (error.response && error.response.status === 401) return; // Handled by AuthContext interceptor
            console.error("Failed to fetch consents:", error);
        }
    }, []);

    const fetchRecords = useCallback(async () => {
        try {
            const res = await axios.get('/api/records/me').catch(() => ({ data: [] }));
            
            const formatted = (res.data || []).map(r => ({
                id: r.id,
                name: r.diagnosticSummary || "Encrypted Record",
                type: r.type || "Document",
                date: r.date ? new Date(r.date).toLocaleDateString() : "Unknown Date",
                facility: r.hospitalId || "Self Uploaded",
                size: "PDF",
                original: r
            }));
            
            setRecords(formatted);
        } catch (error) {
            if (error.response && error.response.status === 401) return; // Handled by AuthContext interceptor
            console.error("Failed to fetch records:", error);
        }
    }, []);

    return (
        <DataContext.Provider value={{
            patients, setPatients,
            consents, setConsents,
            records, setRecords,
            loadingData, setLoadingData,
            fetchPatients, fetchConsents, fetchRecords
        }}>
            {children}
        </DataContext.Provider>
    );
}

export const useStore = () => useContext(DataContext);
