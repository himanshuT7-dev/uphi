import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, UserPlus, ShieldPlus, Activity, LogOut, Settings, Trash2, FileText, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';


const COLORS = {
    bg: "#f8fafc",
    card: "#ffffff",
    border: "#e2e8f0",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    accent: "#2563eb",
    accentMuted: "#eff6ff",
    critical: "#dc2626",
    success: "#16a34a"
};

export default function AdminView() {
    const navigate = useNavigate();
    const { token, role, logout } = useAuth();
    const [staff, setStaff] = useState([]);
    const [patients, setPatients] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [view, setView] = useState('list'); // list, add, patients, audit, roles
    const [loading, setLoading] = useState(true);

    const [newStaff, setNewStaff] = useState({
        username: '',
        email: '',
        password: '',
        role: 'DOCTOR',
        hospitalId: ''
    });
    const [otpSent, setOtpSent] = useState(false);
    const [otpValue, setOtpValue] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Audit log filters
    const [auditFilter, setAuditFilter] = useState({ user: '', action: '', dateFrom: '', dateTo: '' });

    useEffect(() => {
        if (!token || (role !== 'ADMIN' && role !== 'MAIN_ADMIN')) {
            navigate('/');
            return;
        }
        fetchStaff();
    }, [token, role, navigate]);

    const fetchStaff = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get('/api/users/staff', config); 
            setStaff(response.data);
        } catch (error) {
            console.error("Error fetching staff:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPatients = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get('/api/receptionist/patients/all', config); 
            setPatients(response.data);
        } catch (error) {
            console.error("Error fetching patients:", error);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get('/api/audit-logs', config);
            setAuditLogs(response.data || []);
        } catch (error) {
            console.error("Error fetching audit logs:", error);
        }
    };

    const fetchHospitals = async () => {
        if (role !== 'MAIN_ADMIN') return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get('/api/hospitals', config);
            setHospitals(response.data || []);
            if (response.data?.length > 0) {
                setNewStaff(prev => ({ ...prev, hospitalId: response.data[0].id }));
            }
        } catch (error) {
            console.error("Error fetching hospitals:", error);
        }
    };

    useEffect(() => {
        if (view === 'patients') fetchPatients();
        if (view === 'audit') fetchAuditLogs();
        if (view === 'add' && role === 'MAIN_ADMIN') fetchHospitals();
    }, [view]);

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        if (!otpSent) {
            setIsSubmitting(true);
            try {
                await axios.post('/api/admin/otp/generate', {
                    email: newStaff.email
                }, config);
                setOtpSent(true);
            } catch (err) {
                alert(`OTP Dispatch Failed: ${err.response?.data || err.message}`);
            }
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post('/api/admin/staff', {
                username: newStaff.username,
                password: newStaff.password,
                role: newStaff.role,
                email: newStaff.email,
                hospitalId: newStaff.hospitalId || undefined,
                otp: otpValue
            }, config);
            
            alert('Staff provisioned securely.');
            setNewStaff({ username: '', email: '', password: '', role: 'DOCTOR', hospitalId: hospitals.length > 0 ? hospitals[0].id : '' });
            setOtpSent(false);
            setOtpValue('');
            setView('list');
            fetchStaff();
        } catch (error) {
            alert(error.response?.data || 'Authorization Rejected.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteStaff = async (id) => {
        if (!window.confirm("Are you sure you want to permanently revoke this staff member's clearance?")) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`/api/admin/staff/${id}`, config);
            fetchStaff();
        } catch (error) {
            alert(error.response?.data || 'Failed to remove staff.');
        }
    };

    const handleGlobalCredentialReset = async (userId, currentUsername) => {
        if (role !== 'MAIN_ADMIN') {
            alert("Hierarchical Violation: Only MAIN_ADMIN can perform global security overrides.");
            return;
        }

        const newUsername = window.prompt("Enter new ID to override (leave blank to maintain):", currentUsername);
        if (newUsername === null) return;
        const newPassword = window.prompt("Enter temporary new passphrase or leave blank to maintain current:");
        if (newPassword === null) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`/api/admin/users/${userId}/credentials`, {
                newUsername: newUsername !== currentUsername ? newUsername : null,
                newPassword: newPassword || null
            }, config);
            alert("Global Identity Override Successful.");
            if (view === 'list') fetchStaff();
            else fetchPatients();
        } catch (error) {
            alert(error.response?.data || 'Security Override Failed.');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Filter audit logs
    const filteredLogs = auditLogs.filter(log => {
        if (auditFilter.user && !(log.username || '').toLowerCase().includes(auditFilter.user.toLowerCase())) return false;
        if (auditFilter.action && !(log.action || '').toLowerCase().includes(auditFilter.action.toLowerCase())) return false;
        return true;
    });

    // Role Permission Matrix Data
    const roleMatrix = {
        endpoints: [
            { path: "Patient Registration", method: "POST" },
            { path: "View All Patients", method: "GET" },
            { path: "Update Patient", method: "PUT" },
            { path: "Generate ID Card", method: "GET" },
            { path: "Discharge PDF", method: "POST" },
            { path: "Prescription PDF", method: "GET" },
            { path: "Medical Records", method: "CRUD" },
            { path: "Consent Management", method: "CRUD" },
            { path: "Staff Management", method: "CRUD" },
            { path: "Audit Logs", method: "GET" },
            { path: "Credential Override", method: "PUT" },
            { path: "AI Clinical Summary", method: "POST" },
        ],
        roles: ["RECEPTIONIST", "DOCTOR", "ADMIN", "MAIN_ADMIN"],
        permissions: {
            "Patient Registration":   [true, false, true, true],
            "View All Patients":      [true, true, true, true],
            "Update Patient":         [true, true, true, true],
            "Generate ID Card":       [true, true, true, true],
            "Discharge PDF":          [true, true, true, true],
            "Prescription PDF":       [true, true, true, true],
            "Medical Records":        [true, true, true, true],
            "Consent Management":     [false, true, true, true],
            "Staff Management":       [false, false, true, true],
            "Audit Logs":             [false, false, true, true],
            "Credential Override":    [false, false, false, true],
            "AI Clinical Summary":    [false, true, true, true],
        }
    };

    const viewTitles = {
        list: 'Personnel Registry',
        add: 'Initialize Staff Credentials',
        patients: 'Patient Master Directory',
        audit: 'System Audit Trail',
        roles: 'Role & Permission Matrix'
    };
    const viewDescs = {
        list: 'Manage verified medical personnel within the UPHI infrastructure.',
        add: 'Issue secure digital identities for clinical and administrative staff.',
        patients: 'Global oversight of all registered patients and unified health identifiers.',
        audit: 'Monitor system activity, access patterns, and security events.',
        roles: 'Visual overview of role-based access control across all system endpoints.'
    };

    return (
        <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", fontFamily: "'Inter', sans-serif", color: COLORS.textPrimary }}>
            {/* Sidebar */}
            <aside className="uphi-sidebar" style={{ width: 280, background: COLORS.card, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 100 }}>
                <div style={{ padding: "32px 24px", borderBottom: `1px solid ${COLORS.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px rgba(37, 99, 235, 0.2)" }}>
                            <ShieldPlus color="#fff" size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.textPrimary, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>UPHI Admin</div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Control Center</div>
                        </div>
                    </div>
                </div>

                <nav style={{ flex: 1, padding: "24px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                        { id: 'list', icon: <Users size={18} />, label: 'Staff Registry' },
                        { id: 'add', icon: <UserPlus size={18} />, label: 'Register Staff' },
                        { id: 'patients', icon: <ShieldPlus size={18} />, label: 'Patient Directory' },
                        { id: 'audit', icon: <FileText size={18} />, label: 'Audit Logs' },
                        { id: 'roles', icon: <Shield size={18} />, label: 'Roles & Permissions' },
                    ].map(item => (
                        <button key={item.id} onClick={() => setView(item.id)} style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12,
                            background: view === item.id ? COLORS.accentMuted : "transparent",
                            color: view === item.id ? COLORS.accent : COLORS.textSecondary,
                            border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                        }}>
                            {item.icon} {item.label}
                        </button>
                    ))}
                </nav>

                <div style={{ padding: 16, borderTop: `1px solid ${COLORS.border}` }}>
                    <button onClick={handleLogout} style={{
                        display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 16px",
                        borderRadius: 12, background: "transparent", color: COLORS.critical, border: "none",
                        fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                    }} onMouseEnter={e => e.currentTarget.style.background = "#fef2f2" } onMouseLeave={e => e.currentTarget.style.background = "transparent" }>
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="uphi-main" style={{ marginLeft: 280, flex: 1, padding: 64, width: "calc(100% - 280px)" }}>
                <header style={{ marginBottom: 48 }}>
                    <h1 style={{ fontSize: 48, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 8, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
                        {viewTitles[view]}
                    </h1>
                    <p style={{ fontSize: 18, color: COLORS.textSecondary, fontWeight: 500 }}>
                        {viewDescs[view]}
                    </p>
                </header>

                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 32, padding: 40, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    {/* Staff Registry */}
                    {view === 'list' && (
                        <>
                            {loading ? (
                                <div style={{ textAlign: "center", padding: 60, color: COLORS.textMuted }}>Synchronizing records...</div>
                            ) : staff.length === 0 ? (
                                <div style={{ textAlign: "center", padding: 60, color: COLORS.textMuted }}>No active staff records found.</div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr>
                                                {['Staff Member', 'Digital Role', 'System Status', 'Created At', 'Actions'].map(h => (
                                                    <th key={h} style={{ textAlign: "left", padding: "0 24px 20px", fontSize: 12, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {staff.map((member) => (
                                                <tr key={member.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                                    <td style={{ padding: "24px", fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{member.username}</td>
                                                    <td style={{ padding: "24px" }}>
                                                        <span style={{ padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 800, background: member.role === 'ADMIN' ? "#fef3c7" : COLORS.accentMuted, color: member.role === 'ADMIN' ? "#92400e" : COLORS.accent, textTransform: "uppercase" }}>{member.role}</span>
                                                    </td>
                                                    <td style={{ padding: "24px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.success }} />
                                                            <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.textSecondary }}>Active</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "24px", fontSize: 14, color: COLORS.textMuted }}>{new Date(member.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                                                    <td style={{ padding: "24px", whiteSpace: "nowrap" }}>
                                                        <button onClick={() => handleGlobalCredentialReset(member.id, member.username)} style={{ padding: "6px 12px", background: COLORS.accentMuted, color: COLORS.accent, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 }}>
                                                            <Settings size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Edit
                                                        </button>
                                                        <button onClick={() => handleDeleteStaff(member.id)} style={{ padding: "6px 12px", background: "#fee2e2", color: COLORS.critical, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                                            <Trash2 size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Revoke
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {/* Patient Directory */}
                    {view === 'patients' && (
                        <>
                            {patients.length === 0 ? (
                                <div style={{ textAlign: "center", padding: 60, color: COLORS.textMuted }}>No patient records found.</div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr>
                                                {['Patient Name', 'ABHA ID', 'Email', 'System Access', 'Actions'].map(h => (
                                                    <th key={h} style={{ textAlign: "left", padding: "0 24px 20px", fontSize: 12, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {patients.map((p) => (
                                                <tr key={p.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                                    <td style={{ padding: "24px", fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{p.fullName}</td>
                                                    <td style={{ padding: "24px", fontSize: 14, fontWeight: 600, color: COLORS.accent }}>{p.abhaAddress}</td>
                                                    <td style={{ padding: "24px", fontSize: 14, color: COLORS.textSecondary }}>{p.email}</td>
                                                    <td style={{ padding: "24px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.success }} />
                                                            <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.textSecondary }}>Authorized</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "24px" }}>
                                                        <button onClick={() => handleGlobalCredentialReset(p.userId, p.abhaAddress)} style={{ padding: "6px 12px", background: COLORS.accentMuted, color: COLORS.accent, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                                            <ShieldPlus size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Reset ID
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {/* Register Staff */}
                    {view === 'add' && (
                        <form onSubmit={handleCreateStaff} style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 32 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: COLORS.textSecondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Staff Healthcare ID</label>
                                <input required type="text" value={newStaff.username} onChange={e => setNewStaff({ ...newStaff, username: e.target.value })} placeholder="e.g. dr_verma_uphi" style={{ width: "100%", padding: "14px 18px", borderRadius: 14, border: `1px solid ${COLORS.border}`, fontSize: 16, fontWeight: 600, outline: "none" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: COLORS.textSecondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Security Passphrase</label>
                                <input required type="password" value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} placeholder="Temporary credentials" style={{ width: "100%", padding: "14px 18px", borderRadius: 14, border: `1px solid ${COLORS.border}`, fontSize: 16, fontWeight: 600, outline: "none" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: COLORS.textSecondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Administrative Scope</label>
                                <select value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })} style={{ width: "100%", padding: "14px 18px", borderRadius: 14, border: `1px solid ${COLORS.border}`, fontSize: 16, fontWeight: 700, background: "#fff", outline: "none" }}>
                                    <option value="DOCTOR">Doctor / Medical Officer</option>
                                    <option value="RECEPTIONIST">Reception / Administrative</option>
                                    {role === 'MAIN_ADMIN' && <option value="ADMIN">System Administrator</option>}
                                </select>
                            </div>
                            
                            {role === 'MAIN_ADMIN' && (
                            <div>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: COLORS.textSecondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Assigned Facility (Hospital)</label>
                                <select required value={newStaff.hospitalId} onChange={e => setNewStaff({ ...newStaff, hospitalId: e.target.value })} style={{ width: "100%", padding: "14px 18px", borderRadius: 14, border: `1px solid ${COLORS.border}`, fontSize: 16, fontWeight: 700, background: "#fff", outline: "none" }}>
                                    <option value="" disabled>Select a facility...</option>
                                    {hospitals.map(h => (
                                        <option key={h.id} value={h.id}>{h.name}</option>
                                    ))}
                                </select>
                            </div>
                            )}

                            <div>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: COLORS.textSecondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</label>
                                <input required type="email" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} placeholder="e.g. staff@uphi.health" disabled={otpSent} style={{ width: "100%", padding: "14px 18px", borderRadius: 14, border: `1px solid ${COLORS.border}`, fontSize: 16, fontWeight: 600, outline: "none", background: otpSent ? "#f1f5f9" : "#fff" }} />
                            </div>
                            {otpSent && (
                                <div style={{ padding: "20px", background: "rgba(37,99,235,0.05)", borderRadius: 14, border: `1px solid ${COLORS.accentMuted}` }}>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: COLORS.accent, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Verification Code</label>
                                    <input required value={otpValue} onChange={e => setOtpValue(e.target.value)} type="text" placeholder="Enter OTP from Inbox" style={{ width: "100%", padding: "14px 18px", borderRadius: 14, fontSize: 16, fontWeight: 800, textAlign: "center", border: `2px solid ${COLORS.accent}` }} />
                                </div>
                            )}
                            <button type="submit" style={{ marginTop: 8, padding: "16px 32px", borderRadius: 16, border: "none", background: COLORS.accent, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 24px rgba(37, 99, 235, 0.25)" }}>
                                {otpSent ? "Authorize & Finalize Clearance" : "Request Authentication OTP"}
                            </button>
                        </form>
                    )}

                    {/* Audit Logs */}
                    {view === 'audit' && (
                        <div>
                            {/* Filters */}
                            <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
                                <input placeholder="Filter by user..." value={auditFilter.user} onChange={e => setAuditFilter({...auditFilter, user: e.target.value})} style={{ padding: "12px 18px", borderRadius: 12, border: `1px solid ${COLORS.border}`, fontSize: 14, fontWeight: 600, outline: "none", minWidth: 200 }} />
                                <input placeholder="Filter by action..." value={auditFilter.action} onChange={e => setAuditFilter({...auditFilter, action: e.target.value})} style={{ padding: "12px 18px", borderRadius: 12, border: `1px solid ${COLORS.border}`, fontSize: 14, fontWeight: 600, outline: "none", minWidth: 200 }} />
                                <button onClick={() => setAuditFilter({ user: '', action: '', dateFrom: '', dateTo: '' })} style={{ padding: "12px 20px", borderRadius: 12, border: `1px solid ${COLORS.border}`, background: "#fff", color: COLORS.textSecondary, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Clear</button>
                            </div>

                            {filteredLogs.length === 0 ? (
                                <div style={{ textAlign: "center", padding: 60, color: COLORS.textMuted }}>
                                    {auditLogs.length === 0 ? "No audit logs recorded yet." : "No logs match your filters."}
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr>
                                                {['Timestamp', 'User', 'Action', 'Details', 'IP Address'].map(h => (
                                                    <th key={h} style={{ textAlign: "left", padding: "0 24px 20px", fontSize: 12, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredLogs.slice(0, 100).map((log, i) => (
                                                <tr key={log.id || i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                                    <td style={{ padding: "16px 24px", fontSize: 13, color: COLORS.textMuted, fontFamily: "monospace", whiteSpace: "nowrap" }}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</td>
                                                    <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>{log.username || log.userId || 'System'}</td>
                                                    <td style={{ padding: "16px 24px" }}>
                                                        <span style={{
                                                            padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                                                            background: (log.action || '').includes('DELETE') ? '#fee2e2' : (log.action || '').includes('CREATE') ? '#ecfdf5' : COLORS.accentMuted,
                                                            color: (log.action || '').includes('DELETE') ? '#dc2626' : (log.action || '').includes('CREATE') ? '#16a34a' : COLORS.accent,
                                                        }}>{log.action || 'UNKNOWN'}</span>
                                                    </td>
                                                    <td style={{ padding: "16px 24px", fontSize: 13, color: COLORS.textSecondary, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.details || log.description || '—'}</td>
                                                    <td style={{ padding: "16px 24px", fontSize: 12, color: COLORS.textMuted, fontFamily: "monospace" }}>{log.ipAddress || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredLogs.length > 100 && (
                                        <div style={{ textAlign: "center", padding: 20, color: COLORS.textMuted, fontSize: 13 }}>Showing 100 of {filteredLogs.length} entries</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Roles & Permissions Matrix */}
                    {view === 'roles' && (
                        <div>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: "left", padding: "16px 24px", fontSize: 12, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid ${COLORS.border}`, minWidth: 200 }}>Endpoint / Permission</th>
                                            {roleMatrix.roles.map(r => (
                                                <th key={r} style={{ textAlign: "center", padding: "16px 20px", fontSize: 12, fontWeight: 800, color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid ${COLORS.border}`, minWidth: 120 }}>{r.replace('_', ' ')}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {roleMatrix.endpoints.map((ep, idx) => (
                                            <tr key={ep.path} style={{ borderBottom: `1px solid ${COLORS.border}`, background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                                                <td style={{ padding: "16px 24px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                        <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, background: ep.method === 'POST' ? '#ecfdf5' : ep.method === 'PUT' ? '#fef3c7' : ep.method === 'CRUD' ? '#eff6ff' : '#f8fafc', color: ep.method === 'POST' ? '#16a34a' : ep.method === 'PUT' ? '#92400e' : ep.method === 'CRUD' ? '#2563eb' : '#64748b' }}>{ep.method}</span>
                                                        <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>{ep.path}</span>
                                                    </div>
                                                </td>
                                                {roleMatrix.permissions[ep.path].map((allowed, i) => (
                                                    <td key={i} style={{ textAlign: "center", padding: "16px 20px" }}>
                                                        {allowed ? (
                                                            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#ecfdf5", border: "1px solid #bbf7d0", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                            </div>
                                                        ) : (
                                                            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                            </div>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ marginTop: 32, padding: "20px 24px", background: COLORS.accentMuted, border: `1px solid #dbeafe`, borderRadius: 16 }}>
                                <p style={{ fontSize: 13, color: "#1e40af", margin: 0, fontWeight: 600, lineHeight: 1.6 }}>
                                    <strong>Note:</strong> This matrix reflects the backend @PreAuthorize annotations. Changes to permissions require backend code updates and redeployment. MAIN_ADMIN has unrestricted access to all system functions.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
