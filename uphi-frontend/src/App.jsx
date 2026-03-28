import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import PatientView from './pages/PatientView';
import HospitalView from './pages/HospitalView';
import AdminView from './pages/AdminView';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/StoreContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/patient" element={<PatientView />} />
            <Route path="/hospital" element={<HospitalView />} />
            <Route path="/admin" element={<AdminView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
