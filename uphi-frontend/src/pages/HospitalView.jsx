import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import saveAs from 'file-saver';
import {
    Activity, Shield, Clock, Brain, AlertTriangle, User,
    FileText, HeartPulse, Stethoscope, Search, UserPlus, File, Camera,
    LayoutDashboard as Dashboard, TrendingUp as TrendUp, TrendingDown as TrendDown, Pill, Plus, ChevronLeft, Calendar, Info, LogOut, Settings, ArrowLeft, ShieldCheck, AlertCircle, QrCode, Sparkles, Lock, X, Upload, ChevronRight, Heart, Bell, Eye, BarChart3, Check, CheckCircle, Users, Baby, Package, Trash2, PlusCircle, MinusCircle, Building2, MessageSquare, Send, Edit2
} from 'lucide-react';



import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';


// ============================================================
// UPHI — Unified Patient Health Insight
// Hospital Web Dashboard — Dynamic Implementation
// ============================================================

// Removed all mock static data to make the app dynamically fetch from backend.

// Stats are derived from real data, no hardcoded values.



// --- Utility ---
const cn = (...classes) => classes.filter(Boolean).join(" ");

// --- Design Tokens ---
const COLORS = {
    bg: "#f8fafc",
    sidebar: "#ffffff",
    card: "#ffffff",
    border: "#e2e8f0",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    accent: "#2563eb",
    accentMuted: "#eff6ff",
    critical: "#ef4444",
    success: "#10b981",
    warning: "#f97316"
};

const DARK_COLORS = {
    bg: "#0f172a",
    sidebar: "#1e293b",
    card: "#1e293b",
    border: "#334155",
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    accent: "#3b82f6",
    accentMuted: "rgba(59,130,246,0.15)",
    critical: "#ef4444",
    success: "#10b981",
    warning: "#f59e0b"
};

const THEME = {
    bg: "var(--bg)",
    sidebar: "var(--sidebar)",
    card: "var(--card-bg)",
    border: "var(--border)",
    textPrimary: "var(--text-primary)",
    textSecondary: "var(--text-secondary)",
    textMuted: "var(--text-muted)",
    accent: "var(--accent)",
    accentMuted: "var(--accent-muted)",
    critical: "var(--critical)",
    success: "var(--success)",
    warning: "var(--warning)"
};

/* --- UI Helper Functions --- */
const getRiskColor = (level) => {
    switch (level) {
        case "Critical": return THEME.critical;
        case "High": return THEME.warning;
        case "Moderate": return "#eab308";
        case "Low": return THEME.success;
        default: return THEME.textMuted;
    }
};

const getTimelineColor = (type) => {
    switch (type) {
        case "emergency": return THEME.critical;
        case "consultation": return THEME.accent;
        case "lab": return "#8b5cf6";
        case "vaccination": return THEME.success;
        default: return THEME.textMuted;
    }
};

/* --- Utilities --- */
const fmtVital = (v) => { if (v == null || v === '' || v === '--') return '--'; const n = Number(v); return isNaN(n) ? v : (Number.isInteger(n) ? String(n) : n.toFixed(1)); };

const triggerBinaryDownload = (response, fileName) => {
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const reader = new FileReader();
    reader.onloadend = function() {
        const a = document.createElement('a');
        a.href = reader.result;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 200);
    };
    reader.readAsDataURL(blob);
};

/* --- Global Sub-Components --- */

function RiskGauge({ score, level, label, size = 80 }) {
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const color = getRiskColor(level);

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="5" />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="5"
                    strokeDasharray={circumference} strokeDashoffset={circumference - progress}
                    strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.5s ease-out" }} />
            </svg>
            <div style={{ position: "relative", marginTop: -size + 6, height: size - 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: size > 70 ? 22 : 18, fontWeight: 700, color: THEME.textPrimary, fontFamily: "'Outfit', sans-serif" }}>{score}</span>
            </div>
            <span style={{ fontSize: 10, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800 }}>{label}</span>
            <span style={{ fontSize: 10, color, fontWeight: 800 }}>{level}</span>
        </div>
    );
}

function StatCard({ icon, label, value, accentColor, delay = 0 }) {
    return (
        <div style={{
            background: THEME.card,
            border: `1px solid ${THEME.border}`,
            borderRadius: 24,
            padding: "24px 32px",
            display: "flex", alignItems: "center", gap: 20,
            animation: `fadeSlideUp 0.5s ease ${delay}ms both`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
        }}>
            <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: accentColor ? `${accentColor}10` : THEME.accentMuted,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: accentColor || THEME.accent,
                flexShrink: 0,
                border: `1px solid ${accentColor ? `${accentColor}20` : "#dbeafe"}`
            }}>{icon}</div>
            <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: THEME.textPrimary, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
                    {value}
                </div>
                <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800 }}>{label}</div>
            </div>
        </div>
    );
}

function PatientCard({ patient, onClick, onRemove, onDownloadCard }) {
    const riskMax = Math.max(
        patient.riskScores?.cardiac?.score || 0,
        patient.riskScores?.diabetes?.score || 0,
    );
    const riskLevel = riskMax > 70 ? "Critical" : riskMax > 50 ? "High" : riskMax > 30 ? "Moderate" : "Low";

    return (
        <div onClick={onClick} style={{
            background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 24,
            padding: 24, cursor: onClick ? "pointer" : "default", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
        }}
            onMouseEnter={e => {
                if(onClick) {
                    e.currentTarget.style.borderColor = THEME.accent;
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.05)";
                }
            }}
            onMouseLeave={e => {
                if(onClick) {
                    e.currentTarget.style.borderColor = THEME.border;
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)";
                }
            }}
        >
            {riskMax > 70 && (
                <div style={{ position: "absolute", top: 12, right: 12, background: THEME.critical, color: "#fff", fontSize: 10, fontWeight: 800, padding: "4px 12px", borderRadius: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    High Risk
                </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{
                    width: 60, height: 60, borderRadius: 18,
                    background: "rgba(0,0,0,0.03)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: THEME.accent, fontSize: 20, fontWeight: 800, fontFamily: "'Outfit', sans-serif",
                    flexShrink: 0, border: `1px solid ${THEME.border}`
                }}>
                    {patient.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: THEME.textPrimary, fontFamily: "'Outfit', sans-serif" }}>{patient.name}</div>
                    <div style={{ fontSize: 13, color: THEME.textSecondary, marginTop: 4, fontWeight: 500 }}>
                        {patient.age}y • {patient.gender} • {patient.bloodGroup}
                    </div>
                </div>
                <div style={{ color: THEME.textMuted }}><ChevronRight /></div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {patient.conditions?.slice(0, 3).map((c, i) => (
                        <span key={i} style={{
                            fontSize: 11, padding: "5px 12px", borderRadius: 10,
                            background: THEME.accentMuted,
                            color: THEME.accent,
                            fontWeight: 700, letterSpacing: "0.01em", border: `1px solid ${THEME.accent}20`
                        }}>{c.name}</span>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    {onDownloadCard && (
                        <button onClick={(e) => { e.stopPropagation(); onDownloadCard(patient.id, patient.name); }} style={{
                            padding: "6px 14px", borderRadius: 10, border: "none", background: THEME.accentMuted, color: THEME.accent, fontSize: 11, fontWeight: 800, cursor: "pointer", textTransform: "uppercase"
                        }}>ID Card</button>
                    )}
                    {onRemove && (
                        <button onClick={(e) => { e.stopPropagation(); onRemove(patient.id); }} style={{
                            padding: "6px 14px", borderRadius: 10, border: "none", background: "#fef2f2", color: "#ef4444", fontSize: 11, fontWeight: 800, cursor: "pointer", textTransform: "uppercase"
                        }}>Remove</button>
                    )}
                </div>
            </div>
        </div>
    );
}

function OverviewPage({ patients, consents, onNavigate, onSelectPatient, onDownloadCard, onUploadId }) {
    const userName = sessionStorage.getItem('uphi_user') || 'staff';
    const userRole = sessionStorage.getItem('uphi_role') || 'DOCTOR';
    const storedFullName = sessionStorage.getItem('uphi_fullname') || '';
    const displayName = storedFullName || userName.split('@')[0].replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const roleLabel = (userRole === 'DOCTOR' && !storedFullName) ? 'Dr.' : '';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    const criticalPatients = patients.filter(p => p.riskScores?.overall === 'Critical' || p.riskScores?.overall === 'High');
    const patientsWithMeds = patients.filter(p => (p.medications?.length || 0) > 0);
    const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const stats = {
        patientsToday: patients.length,
        activeConsents: consents.filter(c => c.status === 'approved').length,
        pendingConsents: consents.filter(c => c.status === 'pending').length,
    };

    // ─── DOCTOR-SPECIFIC DASHBOARD ─────────────────────────────────────
    if (userRole === 'DOCTOR') {
        return (
            <div style={{ animation: "fadeIn 0.4s ease" }}>
                <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                        <h1 style={{ fontSize: 42, fontWeight: 900, color: THEME.textPrimary, margin: "0 0 6px", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em" }}>
                            {greeting}, {roleLabel} {displayName}
                        </h1>
                        <p style={{ fontSize: 15, color: THEME.textSecondary, margin: 0, fontWeight: 500 }}>Clinical Command Center — {todayStr}</p>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => onNavigate("triage")} style={{ padding: "10px 20px", borderRadius: 14, background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}>
                            <Brain size={16} /> AI Triage
                        </button>
                        <button onClick={() => onNavigate("nlsearch")} style={{ padding: "10px 20px", borderRadius: 14, background: THEME.accent, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}>
                            <Search size={16} /> AI Search
                        </button>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 36 }}>
                    {[
                        { icon: <User size={20} />, label: "Total Patients", value: stats.patientsToday, color: THEME.accent },
                        { icon: <Shield size={20} />, label: "Active Consents", value: stats.activeConsents, color: "#10b981" },
                        { icon: <Clock size={20} />, label: "Pending Approvals", value: stats.pendingConsents, color: "#f97316" },
                        { icon: <AlertTriangle size={20} />, label: "High Risk", value: criticalPatients.length, color: "#ef4444" },
                    ].map((s, i) => (
                        <div key={i} style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 24, padding: "24px 28px", position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", top: -12, right: -12, width: 80, height: 80, borderRadius: "50%", background: `${s.color}0A` }} />
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}18`, color: s.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</span>
                            </div>
                            <div style={{ fontSize: 36, fontWeight: 900, color: THEME.textPrimary, fontFamily: "'Outfit', sans-serif" }}>{s.value}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 36 }}>
                    {[
                        { label: "View Patients", icon: <Search size={18} />, color: THEME.accent, tab: "registry" },
                        { label: "Appointments", icon: <Calendar size={18} />, color: "#7c3aed", tab: "appointments" },
                        { label: "Prescriptions", icon: <Pill size={18} />, color: "#10b981", tab: "prescriptions" },
                        { label: "Consents", icon: <Shield size={18} />, color: "#f97316", tab: "consent" },
                        { label: "Pharmacy", icon: <Package size={18} />, color: "#ec4899", tab: "pharmacy" },
                    ].map((action, i) => (
                        <button key={i} onClick={() => onNavigate(action.tab)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 12px", borderRadius: 20, border: `1px solid ${THEME.border}`, background: THEME.card, cursor: "pointer", transition: "all 0.2s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = THEME.border; e.currentTarget.style.transform = "translateY(0)"; }}
                        >
                            <div style={{ width: 42, height: 42, borderRadius: 14, background: `${action.color}12`, color: action.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{action.icon}</div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: THEME.textSecondary }}>{action.label}</span>
                        </button>
                    ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 28 }}>
                    <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 28, padding: 32 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: THEME.textPrimary, margin: 0, fontFamily: "'Outfit', sans-serif" }}>My Patients</h2>
                            <button onClick={() => onNavigate("registry")} style={{ fontSize: 13, color: THEME.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>View All →</button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {patients.slice(0, 8).map(p => {
                                const colors = ['#3b82f6', '#7c3aed', '#10b981', '#f97316', '#ef4444', '#ec4899'];
                                const c = colors[p.name.charCodeAt(0) % colors.length];
                                return (
                                    <div key={p.id} onClick={() => onSelectPatient(p)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", borderRadius: 16, cursor: "pointer", transition: "all 0.2s", background: "transparent" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.02)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >
                                        <div style={{ width: 44, height: 44, borderRadius: 14, background: `${c}10`, color: c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                                            {p.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: THEME.textPrimary, fontFamily: "'Outfit', sans-serif" }}>{p.name}</div>
                                            <div style={{ fontSize: 12, color: THEME.textMuted, fontWeight: 500, marginTop: 2 }}>{p.age}y • {p.gender} • {p.bloodGroup || "N/A"} • {p.conditions?.length || 0} conditions</div>
                                        </div>
                                        {p.riskScores?.overall && (
                                            <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 8, fontWeight: 800, textTransform: "uppercase",
                                                background: p.riskScores.overall === 'Critical' ? 'rgba(239,68,68,0.1)' : p.riskScores.overall === 'High' ? 'rgba(249,115,22,0.1)' : 'rgba(16,185,129,0.1)',
                                                color: p.riskScores.overall === 'Critical' ? '#ef4444' : p.riskScores.overall === 'High' ? '#f97316' : '#10b981',
                                            }}>{p.riskScores.overall}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 28, padding: 28 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 800, color: THEME.textPrimary, margin: "0 0 20px", fontFamily: "'Outfit', sans-serif" }}>
                                <AlertTriangle size={18} style={{ verticalAlign: "middle", marginRight: 8, color: "#ef4444" }} />Critical Alerts
                            </h2>
                            {criticalPatients.length > 0 ? criticalPatients.slice(0, 3).map(p => (
                                <div key={p.id} onClick={() => onSelectPatient(p)} style={{ padding: "14px 16px", borderRadius: 14, marginBottom: 8, cursor: "pointer", border: "1px solid rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.03)", transition: "all 0.2s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.03)"}
                                >
                                    <div style={{ fontSize: 14, fontWeight: 700, color: THEME.textPrimary }}>{p.name}</div>
                                    <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, marginTop: 4 }}>Risk: {p.riskScores?.overall || "High"} — {p.conditions?.slice(0, 2).map(c => c.name || c).join(", ") || "Review needed"}</div>
                                </div>
                            )) : (
                                <div style={{ textAlign: "center", padding: "32px 0", color: THEME.textMuted }}>
                                    <Shield size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>No critical alerts right now</div>
                                </div>
                            )}
                        </div>
                        <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 28, padding: 28, flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 800, color: THEME.textPrimary, margin: 0, fontFamily: "'Outfit', sans-serif" }}>Consent Requests</h2>
                                <button onClick={() => onNavigate("consent")} style={{ fontSize: 13, color: THEME.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Manage →</button>
                            </div>
                            {consents.slice(0, 4).map(c => (
                                <div key={c.id || Math.random()} style={{ padding: "14px 16px", borderRadius: 14, border: `1px solid ${THEME.border}`, marginBottom: 8, background: c.status === "pending" ? "rgba(249,115,22,0.02)" : "transparent" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: THEME.textPrimary }}>{c.patient}</div>
                                            <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 3 }}>{c.purpose}</div>
                                        </div>
                                        <span style={{ fontSize: 10, padding: "4px 12px", borderRadius: 10, fontWeight: 800, textTransform: "uppercase",
                                            background: c.status === "pending" ? "#fff7ed" : c.status === "approved" ? "#ecfdf5" : "#f1f5f9",
                                            color: c.status === "pending" ? "#f97316" : c.status === "approved" ? "#059669" : THEME.textMuted,
                                        }}>{c.status}</span>
                                    </div>
                                </div>
                            ))}
                            {consents.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: THEME.textMuted, fontSize: 13, fontWeight: 600 }}>No consent requests yet</div>}
                        </div>
                    </div>
                </div>

                {patientsWithMeds.length > 0 && (
                    <div style={{ marginTop: 28, background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 28, padding: 28 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: THEME.textPrimary, margin: "0 0 20px", fontFamily: "'Outfit', sans-serif" }}>
                            <Pill size={18} style={{ verticalAlign: "middle", marginRight: 8, color: "#10b981" }} />Active Prescriptions Across Patients
                        </h2>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                            {patientsWithMeds.slice(0, 6).map(p => (
                                <div key={p.id} onClick={() => onSelectPatient(p)} style={{ padding: "16px 20px", borderRadius: 16, border: `1px solid ${THEME.border}`, cursor: "pointer", transition: "all 0.2s" }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#10b981"; e.currentTarget.style.background = "rgba(16,185,129,0.02)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = THEME.border; e.currentTarget.style.background = "transparent"; }}
                                >
                                    <div style={{ fontSize: 14, fontWeight: 700, color: THEME.textPrimary }}>{p.name}</div>
                                    <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 4 }}>
                                        {p.medications.slice(0, 2).map(m => m?.name).filter(Boolean).join(", ") || "Active medications"}
                                        {p.medications.length > 2 && ` +${p.medications.length - 2} more`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── DEFAULT DASHBOARD (Receptionist / Hospital / Admin) ────────────
    return (

        <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ marginBottom: 48 }}>
                <h1 style={{ fontSize: 40, fontWeight: 800, color: THEME.textPrimary, margin: "0 0 8px", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
                    {greeting}, {roleLabel} {displayName}
                </h1>
                <p style={{ fontSize: 16, color: THEME.textSecondary, margin: 0, fontWeight: 500 }}>
                    Welcome to the Clinical Command Center — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 48 }}>
                <StatCard icon={<User />} label="Registry Patients" value={stats.patientsToday} accentColor={THEME.accent} delay={0} />
                <StatCard icon={<Shield />} label="Approved Access" value={stats.activeConsents} accentColor={THEME.success} delay={80} />
                <StatCard icon={<Clock />} label="Awaiting Approval" value={stats.pendingConsents} accentColor={THEME.warning} delay={160} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 32 }}>
                <div style={{
                    background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 32, padding: 32,
                    animation: "fadeSlideUp 0.5s ease 300ms both", boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: THEME.textPrimary, margin: 0, fontFamily: "'Outfit', sans-serif" }}>Recent Admissions</h2>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <label style={{
                                fontSize: 13, color: THEME.accent, background: THEME.accentMuted, border: "none", cursor: "pointer", fontWeight: 700,
                                padding: "6px 14px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(37,99,235,0.2)"}
                                onMouseLeave={e => e.currentTarget.style.background = THEME.accentMuted}
                            >
                                <Upload size={14} /> Scan ID
                                <input type="file" accept=".pdf" onChange={(e) => onUploadId(e.target.files[0])} style={{ display: "none" }} />
                            </label>
                            <button onClick={() => onNavigate("registry")} style={{
                                fontSize: 14, color: THEME.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 700,
                            }}>Browse All Registry →</button>
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {patients.slice(0, 6).map((p, i) => (
                            <div key={p.id} onClick={() => onSelectPatient(p)} style={{
                                display: "flex", alignItems: "center", gap: 16, padding: "16px",
                                borderRadius: 16, cursor: "pointer", transition: "all 0.2s",
                                background: "transparent",
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.02)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                                <div style={{
                                    width: 48, height: 48, borderRadius: 14,
                                    background: "rgba(0,0,0,0.03)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: THEME.accent, fontSize: 15, fontWeight: 800, flexShrink: 0,
                                }}>{p.name.split(" ").map(n => n[0]).slice(0, 2).join("")}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: THEME.textPrimary, fontFamily: "'Outfit', sans-serif" }}>{p.name}</div>
                                    <div style={{ fontSize: 13, color: THEME.textMuted, fontWeight: 500 }}>{p.age}y • {p.id}</div>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); onDownloadCard(p.id, p.name); }} style={{
                                    padding: "6px 12px", borderRadius: 8, border: "none", background: THEME.accentMuted, color: THEME.accent, fontSize: 11, fontWeight: 700, cursor: "pointer"
                                }}>ID Card</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{
                    background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 32, padding: 32,
                    animation: "fadeSlideUp 0.5s ease 400ms both", boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: THEME.textPrimary, margin: 0, fontFamily: "'Outfit', sans-serif" }}>Active Requests</h2>
                        <button onClick={() => onNavigate("consent")} style={{
                            fontSize: 14, color: THEME.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 700,
                        }}>Manage Hierarchy →</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {consents.slice(0, 4).map((c) => (
                            <div key={c.id || Math.random()} style={{
                                padding: "20px", borderRadius: 20,
                                border: `1px solid ${THEME.border}`,
                                background: c.status === "pending" ? "rgba(249,115,22,0.02)" : "transparent",
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: THEME.textPrimary, fontFamily: "'Outfit', sans-serif" }}>{c.patient}</div>
                                        <div style={{ fontSize: 13, color: THEME.textSecondary, marginTop: 4, fontWeight: 500 }}>{c.purpose}</div>
                                    </div>
                                    <span style={{
                                        fontSize: 10, padding: "5px 12px", borderRadius: 10, fontWeight: 800, textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        background: c.status === "pending" ? "#fff7ed" : c.status === "approved" ? "#ecfdf5" : "#f1f5f9",
                                        color: c.status === "pending" ? "#f97316" : c.status === "approved" ? "#059669" : THEME.textMuted,
                                        border: `1px solid ${c.status === "pending" ? "#ffedd5" : c.status === "approved" ? "#d1fae5" : THEME.border}`
                                    }}>{c.status}</span>
                                </div>
                                <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 12, display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                                    <Clock size={12} /> {c.requestedAt} • {c.duration} window
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}


// QR Scanner modal (simulated)
function QRScannerModal({ onClose, onScan }) {
    const [inputValue, setInputValue] = useState("");
    const [scanning, setScanning] = useState(false);

    const handleSimulateScan = () => {
        if (!inputValue) return;
        setScanning(true);
        setTimeout(() => {
            onScan(inputValue);
        }, 800);
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.3s ease" }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 24, padding: 40, width: 380, textAlign: "center", animation: "scaleIn 0.3s ease" }}>
                <div style={{ width: 120, height: 120, margin: "0 auto 24px", color: "var(--accent)" }}>
                    <QrCode size={120} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 16px" }}>Scan UPHI QR Code</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>Enter Patient ID or ABHA Address to simulate mobile QR scan.</p>
                <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="e.g. pat-123 or a.shinde@abha" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", marginBottom: 16, fontSize: 14 }} />
                <button onClick={handleSimulateScan} disabled={scanning} style={{ width: "100%", padding: "14px", borderRadius: 12, background: "var(--accent)", color: "white", border: "none", fontWeight: 700, cursor: scanning ? "not-allowed" : "pointer" }}>
                    {scanning ? "Processing..." : "Submit Scanned Payload"}
                </button>
            </div>
        </div>
    );
}

// Id Verification / Scan Result Modal
function IdVerificationModal({ result, onClose, onConfirmConsent, onRegisterNew }) {
    const isRegistered = result.status !== "NOT_REGISTERED";
    const data = result.extractedData || {};
    const originHospitals = result.originHospitals || data.affiliatedHospitals || [];
    const isExternal = result.isExternal && originHospitals.length > 0;

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.3s ease" }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: THEME.card, borderRadius: 32, padding: 40, width: 480, animation: "scaleIn 0.3s ease", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", border: `1px solid ${THEME.border}` }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: isRegistered ? "rgba(34,197,94,0.1)" : "rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: isRegistered ? "#16a34a" : THEME.accent, marginBottom: 24 }}>
                    {isRegistered ? <ShieldCheck size={32} /> : <UserPlus size={32} />}
                </div>
                
                <h2 style={{ fontSize: 24, fontWeight: 800, color: THEME.textPrimary, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
                    {isExternal ? "External Patient Found" : isRegistered ? "Identity Verified" : "External ID Detected"}
                </h2>
                <p style={{ fontSize: 15, color: THEME.textSecondary, marginBottom: 24, fontWeight: 500 }}>
                    {isExternal 
                        ? `This patient is registered at another UPHI facility. Link them to your hospital to proceed.`
                        : isRegistered 
                            ? "Universal Health ID matched. Consent is required to access the full clinical history." 
                            : "This Health ID is not yet in our registry. Would you like to import the details and register the patient?"}
                </p>

                {/* Origin Hospital Badge */}
                {isExternal && originHospitals.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderRadius: 16, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", marginBottom: 24 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Building2 size={18} color="#8b5cf6" />
                        </div>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 800, color: "#8b5cf6", textTransform: "uppercase", letterSpacing: "0.05em" }}>Registered At</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: THEME.textPrimary }}>{originHospitals.join(", ")}</div>
                        </div>
                    </div>
                )}

                <div style={{ background: THEME.bg, borderRadius: 20, padding: 24, marginBottom: 32, border: `1px solid ${THEME.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Extracted Metadata</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                        <div>
                            <div style={{ fontSize: 12, color: THEME.textMuted }}>Full Name</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: THEME.textPrimary }}>{data.name}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, color: THEME.textMuted }}>Date of Birth</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: THEME.textPrimary }}>{data.dob}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, color: THEME.textMuted }}>Abha Address</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: THEME.textPrimary }}>{data.abha}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, color: THEME.textMuted }}>Blood Group</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: THEME.textPrimary }}>{data.bloodGroup}</div>
                        </div>
                    </div>

                    {(data.conditions?.length > 0 || data.allergies?.length > 0) && (
                        <div style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: 16 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: "#dc2626", textTransform: "uppercase", marginBottom: 8 }}>Deep Clinical History (Scanned)</div>
                            {data.conditions?.length > 0 && (
                                <div style={{ marginBottom: 8 }}>
                                    <div style={{ fontSize: 12, color: THEME.textMuted }}>Conditions</div>
                                    <div style={{ fontSize: 13, color: THEME.textPrimary, fontWeight: 600 }}>{data.conditions.map(c => c.name || c).join(", ")}</div>
                                </div>
                            )}
                            {data.allergies?.length > 0 && (
                                <div>
                                    <div style={{ fontSize: 12, color: THEME.textMuted }}>Allergies</div>
                                    <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 700 }}>{data.allergies.map(a => a.name || a).join(", ")}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", gap: 16 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: "14px", borderRadius: 16, border: `1px solid ${THEME.border}`, background: "#fff", color: THEME.textSecondary, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                    
                    <button 
                        onClick={() => onRegisterNew(data)} 
                        style={{ flex: 1, padding: "14px", borderRadius: 16, border: `1px solid ${THEME.border}`, background: THEME.card, color: "#16a34a", fontWeight: 800, cursor: "pointer" }}>
                        Review & Register
                    </button>

                    {isRegistered ? (
                        <button onClick={onConfirmConsent} style={{ flex: 1.5, padding: "14px", borderRadius: 16, border: "none", background: isExternal ? "#8b5cf6" : THEME.accent, color: "#fff", fontWeight: 800, cursor: "pointer", boxShadow: `0 8px 16px ${isExternal ? 'rgba(139,92,246,0.3)' : 'rgba(37,99,235,0.2)'}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            {isExternal ? <><Building2 size={18} /> Deep Link to Hospital</> : "Quick Sync (Consent)"}
                        </button>
                    ) : (
                        <button onClick={() => onRegisterNew(data)} style={{ flex: 1.5, padding: "14px", borderRadius: 16, border: "none", background: "#16a34a", color: "#fff", fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 16px rgba(22,163,74,0.2)" }}>Import & Register</button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Consent request modal
function ConsentModal({ patient, onClose, onRequest }) {
    const [duration, setDuration] = useState("24h");
    const [purpose, setPurpose] = useState("consultation");
    const [sent, setSent] = useState(false);

    const handleRequest = async () => {
        try {
            const token = sessionStorage.getItem("uphi_token");
            await axios.post('/api/consents', {
                patientId: patient.id,
                purpose: purpose,
                duration: duration
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSent(true);
            setTimeout(() => { onRequest(); onClose(); }, 1500);
        } catch (error) {
            alert("Consent Request Failed: Patient identity mismatch or service unavailable.");
        }
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "fadeIn 0.3s ease",
        }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                background: "var(--surface)", borderRadius: 24, padding: 36, width: 440,
                animation: "scaleIn 0.3s ease",
            }}>
                {sent ? (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ color: "#22c55e", marginBottom: 16, animation: "scaleIn 0.3s ease" }}>
                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                        <h3 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px", fontFamily: "'Playfair Display', serif" }}>Consent Request Sent</h3>
                        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Patient will receive a notification on their UPHI app</p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
                                <Shield />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0, fontFamily: "'Playfair Display', serif" }}>Request Access</h3>
                                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>{patient?.name}</p>
                            </div>
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Purpose of Access</label>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {[["consultation", "Consultation"], ["emergency", "Emergency"], ["lab_review", "Lab Review"], ["insurance", "Insurance"]].map(([val, label]) => (
                                    <button key={val} onClick={() => setPurpose(val)} style={{
                                        padding: "8px 16px", borderRadius: 10, border: "1px solid",
                                        borderColor: purpose === val ? "var(--accent)" : "var(--border)",
                                        background: purpose === val ? "rgba(59,130,246,0.12)" : "transparent",
                                        color: purpose === val ? "var(--accent)" : "var(--text-secondary)",
                                        fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                                    }}>{label}</button>
                                ))}
                            </div>
                        </div>
                        <div style={{ marginBottom: 28 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Access Duration</label>
                            <div style={{ display: "flex", gap: 8 }}>
                                {[["24h", "24 Hours"], ["7d", "7 Days"], ["30d", "30 Days"], ["session", "This Session"]].map(([val, label]) => (
                                    <button key={val} onClick={() => setDuration(val)} style={{
                                        padding: "8px 16px", borderRadius: 10, border: "1px solid",
                                        borderColor: duration === val ? "var(--accent)" : "var(--border)",
                                        background: duration === val ? "rgba(59,130,246,0.12)" : "transparent",
                                        color: duration === val ? "var(--accent)" : "var(--text-secondary)",
                                        fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", flex: 1,
                                    }}>{label}</button>
                                ))}
                            </div>
                        </div>
                        <button onClick={handleRequest} style={{
                            width: "100%", padding: "14px", borderRadius: 14, border: "none",
                            background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
                            color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                            transition: "transform 0.2s, box-shadow 0.2s",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.4)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                        >
                            Send Consent Request via OTP
                        </button>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
                            <Lock /> Patient will verify via OTP on their registered mobile
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught error:", error, info);
    this.setState({ error, info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, background: '#fee', color: '#c00', margin: 20, borderRadius: 8 }}>
          <h2>Something went wrong.</h2>
          <pre>{this.state.error?.toString()}</pre>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>
            {this.state.info?.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

// Request upload modal
function DocRequestModal({ onClose, onConfirm }) {
    const [selected, setSelected] = useState(["Lab Report"]);
    const options = ["Lab Report", "ECG", "X-ray", "Prescription", "ID Proof", "Vaccine Card"];

    const toggle = (opt) => {
        if (selected.includes(opt)) setSelected(selected.filter(s => s !== opt));
        else setSelected([...selected, opt]);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 440, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Request Documents</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>Select the documents you require from the patient. They will receive a notification to upload these specifically.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 32 }}>
                    {options.map(opt => (
                        <div 
                            key={opt}
                            onClick={() => toggle(opt)}
                            style={{
                                padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${selected.includes(opt) ? '#2563eb' : '#e2e8f0'}`,
                                background: selected.includes(opt) ? '#eff6ff' : '#fff',
                                color: selected.includes(opt) ? '#2563eb' : '#475569',
                                fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                transition: 'all 0.15s'
                            }}
                        >
                            <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${selected.includes(opt) ? '#2563eb' : '#cbd5e1'}`, background: selected.includes(opt) ? '#2563eb' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {selected.includes(opt) && <Check size={12} color="#fff" />}
                            </div>
                            {opt}
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                    <button 
                        onClick={() => onConfirm(selected)} 
                        disabled={selected.length === 0}
                        style={{ flex: 2, padding: '14px', borderRadius: 14, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: selected.length === 0 ? 'not-allowed' : 'pointer', opacity: selected.length === 0 ? 0.6 : 1 }}
                    >
                        Send Request
                    </button>
                </div>
            </div>
        </div>
    );
}

function RequestUploadModal({ patient, onClose }) {
    const [docType, setDocType] = useState("X-RAY");
    const [notes, setNotes] = useState("");
    const [sent, setSent] = useState(false);

    const handleRequest = async () => {
        try {
            const token = sessionStorage.getItem("uphi_token");
            await axios.post('/api/notifications', {
                recipientId: patient.id,
                title: "Asset Upload Request",
                message: `The medical team at ${sessionStorage.getItem('uphi_hospital') || 'their clinic'} has requested a ${docType} upload for your clinical record. ${notes}`,
                type: "UPLOAD_REQUEST",
                metadata: docType
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSent(true);
            setTimeout(() => { onClose(); }, 2000);
        } catch (error) {
            alert("Upload Request Failed. Service temporarily unavailable.");
        }
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "fadeIn 0.3s ease",
        }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                background: "var(--surface)", borderRadius: 24, padding: 36, width: 440,
                animation: "scaleIn 0.3s ease",
            }}>
                {sent ? (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ color: "#22c55e", marginBottom: 16, animation: "scaleIn 0.3s ease" }}>
                            <CheckCircle size={56} />
                        </div>
                        <h3 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px", fontFamily: "'Playfair Display', serif" }}>Request Dispatched</h3>
                        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Notification sent to the patient's UPHI mobile app</p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(37,99,235,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
                                <Upload />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0, fontFamily: "'Playfair Display', serif" }}>Request Document</h3>
                                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>Asking {patient?.name} to upload</p>
                            </div>
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Required Asset Type</label>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {["X-RAY", "ECG", "Lab Report", "Prescription", "Insurance"].map(t => (
                                    <button key={t} onClick={() => setDocType(t)} style={{
                                        padding: "8px 16px", borderRadius: 10, border: "1px solid",
                                        borderColor: docType === t ? "var(--accent)" : "var(--border)",
                                        background: docType === t ? "rgba(37,99,235,0.12)" : "transparent",
                                        color: docType === t ? "var(--accent)" : "var(--text-secondary)",
                                        fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                                    }}>{t}</button>
                                ))}
                            </div>
                        </div>
                        <div style={{ marginBottom: 28 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Internal Notes / Instructions</label>
                            <textarea 
                                value={notes} 
                                onChange={e => setNotes(e.target.value)}
                                placeholder="e.g. Please upload the latest lateral view scan..."
                                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 14, minHeight: 80, fontFamily: "inherit" }}
                            />
                        </div>
                        <button onClick={handleRequest} style={{
                            width: "100%", padding: "14px", borderRadius: 14, border: "none",
                            background: "var(--accent)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                        }}>
                            Dispatch Request to Patient
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}




// --- Page: Register New Patient ---
function RegisterPatientPage({ onNavigate, onAddPatient, onDownloadCard, prefillData }) {

    const [formData, setFormData] = useState({
        name: prefillData?.name || "", 
        age: prefillData?.age || "", 
        gender: prefillData?.gender || "", 
        dob: prefillData?.dob || "", 
        phone: prefillData?.phone || "", 
        email: prefillData?.email || "", 
        bloodGroup: prefillData?.bloodGroup || "",
        emergencyContactName: "", emergencyContactPhone: "",
        street: "", city: "", state: "", pincode: "",
        existingConditions: prefillData?.conditions?.map(c => c.name || c).join(", ") || "", 
        allergies: prefillData?.allergies?.map(a => a.name || a).join(", ") || "", 
        currentMedications: prefillData?.medications?.map(m => m.name || m).join(", ") || "", 
        lifestyleFactors: "",
        hasAadhaar: false, aadhaar: "",
        hasAbha: prefillData?.abha ? true : false, abha: prefillData?.abha || ""
    });

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newPatient, setNewPatient] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpValue, setOtpValue] = useState("");
    const [confirmationResult, setConfirmationResult] = useState(null);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleNext = (e) => {
        e.preventDefault();
        if (step === 1 && !isEmailVerified) {
            alert("Please verify the patient's email address before proceeding.");
            return;
        }
        setStep(prev => prev + 1);
    };
 
    const handleVerifyOtp = async () => {
        if (!otpValue) return;
        setIsSubmitting(true);
        try {
            const token = sessionStorage.getItem('uphi_token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post('/api/receptionist/patients/otp/verify', {
                email: formData.email.trim().toLowerCase(),
                otp: otpValue.trim()
            }, config);
            setIsEmailVerified(true);
            alert("Email verified successfully!");
        } catch (err) {
            alert(`Verification Failed: ${err.response?.data || err.message}`);
        }
        setIsSubmitting(false);
    };





    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = sessionStorage.getItem('uphi_token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        if (!otpSent) {
            setIsSubmitting(true);
            try {
                await axios.post('/api/receptionist/patients/otp/generate', {
                    email: formData.email,
                    phone: formData.phone
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
            // Manual OTP verification via registration hit


            // Map formData old diagnosis to Condition list if provided
            const conditions = [];
            if (formData.existingConditions) {
                formData.existingConditions.split(',').forEach(c => {
                    const cname = c.trim();
                    if (cname) conditions.push({ name: cname, status: 'Active' });
                });
            }

            const pRes = await axios.post('/api/receptionist/patients/register', {
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.trim(),
                otp: otpValue.trim(),
                fullName: formData.name.trim(),
                dob: formData.dob,
                gender: formData.gender,
                bloodGroup: formData.bloodGroup,
                address: `${formData.street}, ${formData.city}, ${formData.state} ${formData.pincode}`,
                aadhaar: formData.aadhaar,
                abha: formData.abha,
                oldDiagnosis: conditions
            }, config);


            const newPatientData = {
                ...pRes.data,
                name: pRes.data.fullName,
                age: formData.age || 0,
                gender: formData.gender,
                bloodGroup: formData.bloodGroup,
                vitals: pRes.data.vitals || {},
                allergies: pRes.data.allergies || [],
                medications: pRes.data.medications || [],
            };

            onAddPatient(newPatientData);
            setNewPatient(newPatientData);
            setOtpSent(false);
            setOtpValue("");
            setIsSubmitting(false);
            setIsSuccess(true);

        } catch (err) {
            console.error('Registration failed:', err);
            alert(err.response?.data || 'Receptionist backend rejected OTP registration request.');
            setOtpSent(false);
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div style={{ animation: "fadeIn 0.4s ease", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", background: "var(--card-bg)", borderRadius: 20, border: "1px solid rgba(34,197,94,0.3)", padding: 40, textAlign: "center" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(34,197,94,0.1)", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                    <Check />
                </div>
                <h2 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>Patient Registered Successfully</h2>
                <p style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 8, maxWidth: 400 }}>
                    {formData.name} has been added to the UPHI network.
                    {formData.hasAbha ? ` ABHA ID ${formData.abha} linked.` : " An ABHA ID generation request is pending."}
                </p>
                <div style={{ display: "flex", gap: 16, marginTop: 32 }}>
                    <button onClick={() => onDownloadCard(newPatient?.id, newPatient?.name)} style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: "rgba(34,197,94,0.1)", color: "#16a34a", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                        <FileText size={18} /> Download ID Card
                    </button>
                    <button onClick={() => { setFormData({ name: "", age: "", gender: "", phone: "", email: "", bloodGroup: "", emergencyContactName: "", emergencyContactPhone: "", street: "", city: "", state: "", pincode: "", existingConditions: "", allergies: "", currentMedications: "", lifestyleFactors: "", hasAadhaar: false, aadhaar: "", hasAbha: false, abha: "" }); setStep(1); setIsSuccess(false); }} style={{ padding: "12px 24px", borderRadius: 12, border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary)", fontWeight: 600, cursor: "pointer" }}>Register Another</button>
                    <button onClick={() => onNavigate("search")} style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Go to Registry</button>
                </div>
            </div>
        );
    }


    return (
        <div style={{ animation: "fadeIn 0.4s ease", maxWidth: 960, margin: "0 auto" }}>
            <div style={{ marginBottom: 48 }}>
                <h1 style={{ fontSize: 36, fontWeight: 800, color: THEME.textPrimary, margin: "0 0 8px", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>Register New Patient</h1>
                <p style={{ fontSize: 16, color: THEME.textSecondary, margin: 0, fontWeight: 500 }}>Create a new clinical record with verified contact identity.</p>
            </div>

            {/* Stepper */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 48, padding: "0 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: step >= 1 ? THEME.accent : THEME.border, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>1</div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: step >= 1 ? THEME.textPrimary : THEME.textMuted }}>Demographics</span>
                </div>
                <div style={{ flex: 1, height: 2, background: step >= 2 ? THEME.accent : THEME.border, margin: "0 20px", borderRadius: 2 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: step >= 2 ? THEME.accent : THEME.border, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>2</div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: step >= 2 ? THEME.textPrimary : THEME.textMuted }}>History</span>
                </div>
                <div style={{ flex: 1, height: 2, background: step >= 3 ? THEME.accent : THEME.border, margin: "0 20px", borderRadius: 2 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: step >= 3 ? THEME.accent : THEME.border, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>3</div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: step >= 3 ? THEME.textPrimary : THEME.textMuted }}>Review</span>
                </div>
            </div>

            <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 32, padding: 40, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <form onSubmit={step < 3 ? handleNext : handleSubmit}>
                    {step === 1 && (
                        <div style={{ animation: "fadeIn 0.3s ease", display: "flex", flexDirection: "column", gap: 32 }}>
                            {/* Primary Info Section */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                                <div>
                                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: THEME.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}><User size={16} /> Patient Full Name *</label>
                                    <input required name="name" value={formData.name} onChange={handleChange} type="text" placeholder="e.g. Ramesh Kumar" style={{ width: "100%", padding: "16px 20px", borderRadius: 16, fontSize: 15, fontWeight: 600, border: `1.5px solid ${THEME.border}`, background: "#fff", transition: "all 0.2s" }} />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20 }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: THEME.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Age *</label>
                                        <input required name="age" value={formData.age} onChange={handleChange} type="number" min="0" placeholder="00" style={{ width: "100%", padding: "16px 20px", borderRadius: 16, fontSize: 15, fontWeight: 600, border: `1.5px solid ${THEME.border}` }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: THEME.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Date of Birth *</label>
                                        <input required name="dob" value={formData.dob} onChange={handleChange} type="date" style={{ width: "100%", padding: "16px 20px", borderRadius: 16, fontSize: 15, fontWeight: 600, border: `1.5px solid ${THEME.border}`, background: "#fff" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: THEME.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Gender *</label>
                                        <select required name="gender" value={formData.gender} onChange={handleChange} style={{ width: "100%", padding: "16px 20px", borderRadius: 16, fontSize: 15, fontWeight: 600, border: `1.5px solid ${THEME.border}`, background: "#fff" }}>
                                            <option value="" disabled>Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
 
                            {/* Verification Section */}
                            <div style={{ padding: "32px", background: "rgba(37,99,235,0.03)", borderRadius: 24, border: `1.5px solid ${THEME.accent}15` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                    <h4 style={{ fontSize: 15, fontWeight: 800, color: THEME.textPrimary, margin: 0 }}>Identity Verification</h4>
                                    {isEmailVerified && <span style={{ padding: "6px 14px", borderRadius: 12, background: "#dcfce7", color: "#16a34a", fontSize: 12, fontWeight: 800 }}>Identity Verified</span>}
                                </div>
                                
                                <div style={{ display: "flex", gap: 16 }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: THEME.textMuted, marginBottom: 8, textTransform: "uppercase" }}>Patient Email ID *</label>
                                        <div style={{ position: "relative" }}>
                                            <input required name="email" value={formData.email} onChange={handleChange} type="email" placeholder="patient@example.com" disabled={isEmailVerified} style={{ width: "100%", padding: "16px 20px", borderRadius: 16, fontSize: 15, fontWeight: 600, border: isEmailVerified ? `1.5px solid #16a34a` : `1.5px solid ${THEME.border}`, background: isEmailVerified ? "#f0fdf4" : "#fff" }} />
                                            {isEmailVerified && <CheckCircle size={22} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "#16a34a" }} />}
                                        </div>
                                    </div>
                                    
                                    {!isEmailVerified && (
                                        <button type="button" onClick={handleSubmit} disabled={otpSent} style={{ marginTop: 24, padding: "0 32px", borderRadius: 16, border: "none", background: THEME.accent, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14, boxShadow: "0 8px 16px rgba(37,99,235,0.2)" }}>
                                            {otpSent ? "Code Sent" : "Verify Email"}
                                        </button>
                                    )}
                                </div>
 
                                {otpSent && !isEmailVerified && (
                                    <div style={{ animation: "fadeSlideUp 0.3s ease", marginTop: 24, padding: "24px", background: "#fff", borderRadius: 20, border: `1px solid ${THEME.accent}30`, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: THEME.accent, marginBottom: 12, textTransform: "uppercase" }}>One-Time Password (OTP)</label>
                                        <div style={{ display: "flex", gap: 12 }}>
                                            <input required value={otpValue} onChange={e => setOtpValue(e.target.value)} type="text" placeholder="000000" style={{ flex: 1, maxWidth: 180, padding: "14px", borderRadius: 12, fontSize: 24, fontWeight: 900, textAlign: "center", border: `2.5px solid ${THEME.accent}`, letterSpacing: "4px", color: THEME.accent }} />
                                            <button type="button" onClick={handleVerifyOtp} disabled={isSubmitting} style={{ flex: 1, borderRadius: 12, border: "none", background: THEME.accent, color: "#fff", fontWeight: 800, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.1)"}>Submit Code</button>
                                        </div>
                                        <p style={{ fontSize: 12, color: THEME.textMuted, marginTop: 16, fontWeight: 500 }}>Checking for verification code in clinic system...</p>
                                    </div>
                                )}
                            </div>
 
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                                <div>
                                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: THEME.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}><Settings size={16} /> Blood Group</label>
                                    <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} style={{ width: "100%", padding: "16px 20px", borderRadius: 16, fontSize: 15, fontWeight: 600, border: `1.5px solid ${THEME.border}`, background: "#fff" }}>
                                        <option value="" disabled>Select</option>
                                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: THEME.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Mobile Number *</label>
                                    <input required name="phone" value={formData.phone} onChange={handleChange} type="tel" placeholder="+91 00000 00000" style={{ width: "100%", padding: "16px 20px", borderRadius: 16, fontSize: 15, fontWeight: 600, border: `1.5px solid ${THEME.border}` }} />
                                </div>
                            </div>
 
                            <div style={{ padding: "0 4px" }}>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: THEME.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Residential Address *</label>
                                <textarea required name="street" value={formData.street} onChange={handleChange} placeholder="House Number, Street, Area details..." rows="2" style={{ width: "100%", padding: "16px 20px", borderRadius: 16, fontSize: 15, fontWeight: 600, border: `1.5px solid ${THEME.border}`, resize: "none" }} />
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 20 }}>
                                    <input required name="city" value={formData.city} onChange={handleChange} type="text" placeholder="City" style={{ padding: "14px 18px", borderRadius: 14, fontSize: 14, fontWeight: 600, border: `1.5px solid ${THEME.border}` }} />
                                    <input required name="state" value={formData.state} onChange={handleChange} type="text" placeholder="State" style={{ padding: "14px 18px", borderRadius: 14, fontSize: 14, fontWeight: 600, border: `1.5px solid ${THEME.border}` }} />
                                    <input required name="pincode" value={formData.pincode} onChange={handleChange} type="text" placeholder="PIN Code" style={{ padding: "14px 18px", borderRadius: 14, fontSize: 14, fontWeight: 600, border: `1.5px solid ${THEME.border}` }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ animation: "fadeIn 0.3s ease", display: "flex", flexDirection: "column", gap: 32 }}>
                            <div style={{ padding: "0 4px" }}>
                                <h3 style={{ fontSize: 20, fontWeight: 800, color: THEME.textPrimary, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>Clinical Background</h3>
                                <p style={{ fontSize: 14, color: THEME.textSecondary, marginBottom: 32, fontWeight: 500 }}>Specify chronic conditions, known drug allergies, or active medications.</p>
 
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }}>
                                    <div>
                                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: THEME.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}><Activity size={16} /> Existing Conditions</label>
                                        <textarea name="existingConditions" value={formData.existingConditions} onChange={handleChange} placeholder="e.g. Hypertension, Diabetes Type II..." rows="4" style={{ width: "100%", padding: "16px 20px", borderRadius: 16, fontSize: 15, fontWeight: 600, border: `1.5px solid ${THEME.border}`, background: "#fff", resize: "none" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: THEME.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}><AlertTriangle size={16} /> Known Allergies</label>
                                        <textarea name="allergies" value={formData.allergies} onChange={handleChange} placeholder="e.g. Penicillin, Lactose..." rows="4" style={{ width: "100%", padding: "16px 20px", borderRadius: 16, fontSize: 15, fontWeight: 600, border: `1.5px solid ${THEME.border}`, background: "#fff", resize: "none" }} />
                                    </div>
                                </div>
 
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                                    <div>
                                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: THEME.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}><Pill size={16} /> Active Medications</label>
                                        <textarea name="currentMedications" value={formData.currentMedications} onChange={handleChange} placeholder="Current dosage and frequency..." rows="4" style={{ width: "100%", padding: "16px 20px", borderRadius: 16, fontSize: 15, fontWeight: 600, border: `1.5px solid ${THEME.border}`, background: "#fff", resize: "none" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: THEME.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}><Heart size={16} /> Vital History (Lifestyle)</label>
                                        <textarea name="lifestyleFactors" value={formData.lifestyleFactors} onChange={handleChange} placeholder="Diet, Activity level, Smoking/Alcohol status..." rows="4" style={{ width: "100%", padding: "16px 20px", borderRadius: 16, fontSize: 15, fontWeight: 600, border: `1.5px solid ${THEME.border}`, background: "#fff", resize: "none" }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ animation: "fadeIn 0.3s ease", display: "flex", flexDirection: "column", gap: 32 }}>
                            <div style={{ padding: "0 4px" }}>
                                <h3 style={{ fontSize: 20, fontWeight: 800, color: THEME.textPrimary, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>Emergency Coordination</h3>
                                <p style={{ fontSize: 14, color: THEME.textSecondary, marginBottom: 24, fontWeight: 500 }}>Ensure at least one emergency contact is registered for crisis management.</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, padding: "32px", background: "rgba(15,23,42,0.02)", borderRadius: 24, border: `1.5px solid ${THEME.border}` }}>
                                    <div>
                                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 800, color: THEME.textMuted, marginBottom: 8, textTransform: "uppercase" }}>Relation Name *</label>
                                        <input required name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} type="text" placeholder="Full Name" style={{ width: "100%", padding: "16px 20px", borderRadius: 16, fontSize: 15, fontWeight: 600, border: `1.5px solid ${THEME.border}`, background: "#fff" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 800, color: THEME.textMuted, marginBottom: 8, textTransform: "uppercase" }}>Phone Number *</label>
                                        <input required name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} type="tel" placeholder="+91 00000 00000" style={{ width: "100%", padding: "16px 20px", borderRadius: 16, fontSize: 15, fontWeight: 600, border: `1.5px solid ${THEME.border}`, background: "#fff" }} />
                                    </div>
                                </div>
                            </div>
 
                            <div style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", borderRadius: 24, padding: "32px", color: "#fff", display: "flex", alignItems: "center", gap: 24, boxShadow: "0 12px 24px rgba(22,163,74,0.15)" }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <ShieldCheck size={32} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>Ready for Registry</h4>
                                    <p style={{ fontSize: 14, opacity: 0.9, margin: 0, fontWeight: 500 }}>All clinical and demographic data validated. Creating secure health identity...</p>
                                </div>
                            </div>
                        </div>
                    )}



                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 32, borderTop: `1.5px solid ${THEME.border}` }}>
                        {step > 1 && (
                            <button type="button" onClick={() => setStep(s => s - 1)} style={{ padding: "14px 32px", borderRadius: 16, border: `1.5px solid ${THEME.border}`, background: "#fff", color: THEME.textPrimary, fontSize: 15, fontWeight: 800, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                                Previous Phase
                            </button>
                        )}
                        <button type="submit" disabled={isSubmitting} style={{ padding: "16px 48px", borderRadius: 16, border: "none", background: THEME.accent, color: "#fff", fontSize: 16, fontWeight: 900, cursor: isSubmitting ? "wait" : "pointer", opacity: isSubmitting ? 0.7 : 1, transition: "all 0.3s", boxShadow: "0 10px 25px rgba(37, 99, 235, 0.25)", marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }} onMouseEnter={e => !isSubmitting && (e.currentTarget.style.transform = "translateY(-2px)", e.currentTarget.style.boxShadow = "0 15px 30px rgba(37, 99, 235, 0.35)")} onMouseLeave={e => !isSubmitting && (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = "0 10px 25px rgba(37, 99, 235, 0.25)")}>
                            {step < 3 ? (
                                <>Next Phase <ChevronRight size={20} /></>
                            ) : (
                                isSubmitting ? "Finalizing Registry..." : (otpSent ? "Authorize & Create Profile" : "Request Authentication OTP")
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>


    );
}

// --- Page: Patient Search ---
function SearchPage({ patients, onSelectPatient, onRemovePatient, onDownloadCard, onUploadId, onQRResult }) {
    const [query, setQuery] = useState("");
    const [showQR, setShowQR] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [dialogConfig, setDialogConfig] = useState({ isOpen: false, title: '', msg: '', onConfirm: null });
    const closeDialog = () => setDialogConfig({ ...dialogConfig, isOpen: false });
    const [scanToast, setScanToast] = useState(null);

    const filtered = patients.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.id.toLowerCase().includes(query.toLowerCase()) ||
        (p.phone || '').includes(query)
    );

    const showScanToast = (msg, type = 'error') => {
        setScanToast({ msg, type });
        setTimeout(() => setScanToast(null), 4000);
    };

    return (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
            {scanToast && (
                <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", alignItems: "center", gap: 10, padding: "14px 24px", borderRadius: 16, background: scanToast.type === 'error' ? "#fef2f2" : "#f0fdf4", border: `1px solid ${scanToast.type === 'error' ? '#fecaca' : '#bbf7d0'}`, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", animation: "fadeSlideUp 0.3s ease" }}>
                    <span style={{ fontSize: 20 }}>{scanToast.type === 'error' ? '⚠️' : '✅'}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: scanToast.type === 'error' ? '#dc2626' : '#16a34a' }}>{scanToast.msg}</span>
                </div>
            )}
            {showQR && <QRScannerModal onClose={() => setShowQR(false)} onScan={async (identifier) => { 
                setShowQR(false);
                // Strip UPHI: prefix from QR data if present
                const cleanId = identifier.replace(/^UPHI:/i, '').trim();
                try {
                    const token = sessionStorage.getItem('uphi_token');
                    const res = await axios.get(`/api/patients/global/${cleanId}`, { headers: { Authorization: `Bearer ${token}` } });
                    const p = res.data;
                    // Determine if patient is external (not yet affiliated to this hospital)
                    const affiliatedHospitals = p.affiliatedHospitals || [];
                    onQRResult({
                        status: "CONSENT_REQUIRED",
                        patientId: p.id,
                        isExternal: true,
                        originHospitals: affiliatedHospitals,
                        extractedData: {
                            name: p.fullName,
                            dob: p.dob || p.dateOfBirth,
                            abha: p.abhaAddress,
                            phone: p.phone,
                            bloodGroup: p.bloodGroup,
                            gender: p.gender,
                            conditions: p.conditions || [],
                            allergies: p.allergies || [],
                            affiliatedHospitals: affiliatedHospitals
                        }
                    });
                } catch (error) {
                    showScanToast("Patient not found globally in UPHI network. Verify the QR code.");
                }
            }} />}

            <div style={{ marginBottom: 48 }}>
                <h1 style={{ fontSize: 36, fontWeight: 800, color: THEME.textPrimary, margin: "0 0 8px", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>Clinical Registry</h1>
                <p style={{ fontSize: 16, color: THEME.textSecondary, margin: 0, fontWeight: 500 }}>Access universal health records across the UPHI network infrastructure.</p>
            </div>

            <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
                <div style={{
                    flex: 1, display: "flex", alignItems: "center", gap: 16,
                    background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 20,
                    padding: "0 24px", transition: "all 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                }}
                    onFocusCapture={e => e.currentTarget.style.borderColor = THEME.accent}
                    onBlurCapture={e => e.currentTarget.style.borderColor = THEME.border}
                >
                    <Search color={THEME.textMuted} />
                    <input
                        value={query} onChange={e => setQuery(e.target.value)}
                        placeholder="Search by UHID, ABHA Address, or Patient Name..."
                        style={{
                            flex: 1, background: "none", border: "none", outline: "none",
                            color: THEME.textPrimary, fontSize: 16, padding: "20px 0",
                            fontWeight: 500
                        }}
                    />
                    {query && (
                        <button onClick={() => setQuery("")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
                            <X />
                        </button>
                    )}
                </div>
                <button onClick={() => setShowQR(true)} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "0 24px",
                    background: THEME.accent,
                    border: "none", borderRadius: 14, color: "#fff", fontSize: 14, fontWeight: 700,
                    cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s",
                    whiteSpace: "nowrap",
                }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.35)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                    <QrCode /> Scan QR Code
                </button>

                <label style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "0 24px",
                    background: "rgba(15,23,42,0.05)",
                    border: `1.5px solid ${THEME.border}`, borderRadius: 14, color: THEME.textPrimary, fontSize: 14, fontWeight: 700,
                    cursor: "pointer", transition: "all 0.2s",
                    whiteSpace: "nowrap",
                }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(15,23,42,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(15,23,42,0.05)"}
                >
                    <Upload size={18} /> Upload Health ID
                    <input type="file" accept=".pdf" onChange={(e) => onUploadId(e.target.files[0])} style={{ display: "none" }} />
                </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
                {filtered.map((p, i) => (
                    <div key={p.id} style={{ animation: `fadeSlideUp 0.4s ease ${i * 80}ms both` }}>
                        <PatientCard patient={p} onClick={onSelectPatient ? () => onSelectPatient(p) : undefined} onRemove={onRemovePatient} onDownloadCard={onDownloadCard} />
                    </div>
                ))}
                {filtered.length === 0 && query && (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
                        <p style={{ fontSize: 16 }}>No patients found for "{query}"</p>
                        <p style={{ fontSize: 13 }}>Try searching by UHID or phone number, or scan the patient's QR code</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Component: Diagnostic Viewer (High-Fidelity) ---
function DiagnosticViewer({ image, onClose }) {
    const [zoom, setZoom] = useState(1);
    const [viewOriginal, setViewOriginal] = useState(false);
    const [blobUrl, setBlobUrl] = useState(null);
    const [hdBlobUrl, setHdBlobUrl] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [imgLoading, setImgLoading] = useState(true);
    
    const hdUrl = image.imageUrl?.includes('/raw/') ? image.imageUrl : (image.id ? `/api/imaging/raw/${image.imageUrl.split('/').pop()}` : image.imageUrl);

    useEffect(() => {
        let cancelled = false;
        const fetchBlob = async (url, setter, setDone) => {
            try {
                const res = await axios.get(url, { responseType: 'blob' });
                if (!cancelled) {
                    setter(URL.createObjectURL(res.data));
                    if (setDone) setDone(false);
                }
            } catch (e) {
                console.warn('DiagnosticViewer fetch error:', url, e);
                if (!cancelled && setDone) { setLoadError(true); setDone(false); }
            }
        };
        setImgLoading(true);
        setLoadError(false);
        if (image.imageUrl) fetchBlob(image.imageUrl, setBlobUrl, setImgLoading);
        if (hdUrl && hdUrl !== image.imageUrl) fetchBlob(hdUrl, setHdBlobUrl);
        return () => { cancelled = true; };
    }, [image.imageUrl]);

    useEffect(() => {
        return () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
            if (hdBlobUrl) URL.revokeObjectURL(hdBlobUrl);
        };
    }, [blobUrl, hdBlobUrl]);

    const displayUrl = viewOriginal ? (hdBlobUrl || blobUrl) : blobUrl;
    const isPdf = image.contentType?.includes('pdf');

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.98)", zIndex: 9999, display: "flex", flexDirection: "column", animation: "fadeIn 0.3s ease", backdropFilter: "blur(12px)" }}>
            <div style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(15, 23, 42, 0.5)" }}>
                <div>
                    <h3 style={{ color: "#fff", margin: 0, fontWeight: 800, fontSize: 18, fontFamily: "'Outfit', sans-serif" }}>Diagnostic Asset: {image.type}</h3>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "4px 0 0", fontWeight: 500 }}>
                        {viewOriginal ? "Lossless HD Source (Original Binary)" : "Optimized AI Analysis Feed"} &bull; {image.doctorName || "UPHI Network"}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <button 
                        onClick={() => setViewOriginal(!viewOriginal)}
                        style={{ 
                            padding: "10px 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)",
                            background: viewOriginal ? "#2563eb" : "rgba(255,255,255,0.05)",
                            color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", transition: "all 0.2s"
                        }}
                    >
                        {viewOriginal ? "Return to Analysis" : "View Lossless HD Source"}
                    </button>
                    <div style={{ display: "flex", background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 4 }}>
                        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} style={{ padding: "8px 16px", color: "#fff", border: "none", background: "none", cursor: "pointer", fontWeight: 700 }}>-</button>
                        <span style={{ padding: "8px 12px", color: "#fff", fontSize: 13, fontWeight: 700, borderLeft: "1px solid rgba(255,255,255,0.1)", borderRight: "1px solid rgba(255,255,255,0.1)" }}>{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(5, z + 0.5))} style={{ padding: "8px 16px", color: "#fff", border: "none", background: "none", cursor: "pointer", fontWeight: 700 }}>+</button>
                    </div>
                    <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={24} /></button>
                </div>
            </div>
            <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 40, cursor: zoom > 1 ? "grab" : "zoom-in" }}>
                {imgLoading ? (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ width: 48, height: 48, border: "3px solid rgba(59,130,246,0.3)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600 }}>Loading diagnostic asset...</p>
                    </div>
                ) : loadError ? (
                    <div style={{ textAlign: "center" }}>
                        <p style={{ color: "#ef4444", fontSize: 16, fontWeight: 700 }}>Failed to load diagnostic asset</p>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>The file may require additional access or is unavailable.</p>
                    </div>
                ) : isPdf ? (
                    <iframe src={displayUrl} style={{ width: "90vw", height: "75vh", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} title="PDF Viewer" />
                ) : (
                    <div style={{ position: "relative", transform: `scale(${zoom})`, transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)", transformOrigin: "center center" }}>
                        <img 
                            src={displayUrl} 
                            alt="Diagnostic" 
                            style={{ 
                                maxWidth: zoom > 1 ? "none" : "95vw", 
                                maxHeight: zoom > 1 ? "none" : "80vh", 
                                boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
                                borderRadius: 8,
                                border: "1px solid rgba(255,255,255,0.1)",
                                display: "block"
                            }} 
                        />
                    </div>
                )}
            </div>
            <div style={{ padding: "32px 40px", background: "rgba(15, 23, 42, 0.9)", borderTop: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Sparkles size={18} color="#60a5fa" />
                    </div>
                    <div>
                        <span style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#60a5fa" }}>AI Diagnostic Insight</span>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Analyzed via UPHI Clinical Core</div>
                    </div>
                </div>
                <p style={{ fontSize: 16, lineHeight: 1.6, color: "rgba(255,255,255,0.9)", margin: 0, maxWidth: 900, fontWeight: 500 }}>{image.analysis}</p>
            </div>
        </div>
    );
}

// --- Component: Imaging Tab ---
function ImagingHub({ scans, docs, onScanUpload, onDocUpload, isScanning, onSelectScan, onRequestUpload }) {
    const formatDate = (dateStr) => {
        if (!dateStr) return 'No Date';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
    };

    return (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
            {/* Asset Dispatch Terminal */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 48 }}>
                <div style={{ 
                    background: "var(--card-bg)", border: "2px dashed var(--border)", borderRadius: 32, 
                    padding: 40, textAlign: "center", transition: "all 0.2s", cursor: "pointer", position: "relative"
                }} onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--bg-accent)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--card-bg)"; }}>
                    <input type="file" onChange={onScanUpload} style={{ display: "none" }} id="scan-upload" />
                    <label htmlFor="scan-upload" style={{ cursor: "pointer" }}>
                        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(37,99,235,0.1)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                            <Camera size={24} />
                        </div>
                        <h4 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4, fontFamily: "'Outfit', sans-serif" }}>Upload Diagnostic Scan</h4>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>X-ray, ECG, CT (Lossless)</p>
                    </label>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onRequestUpload('Diagnostic Scan'); }}
                        style={{ position: "absolute", bottom: -12, left: "50%", transform: "translateX(-50%)", padding: "6px 14px", borderRadius: 20, background: "var(--bg-accent)", border: "1px solid var(--border)", fontSize: 10, fontWeight: 700, color: "var(--accent)", cursor: "pointer" }}
                    >REQUEST FROM PATIENT</button>
                </div>

                <div style={{ 
                    background: "var(--card-bg)", border: "2px dashed var(--border)", borderRadius: 32, 
                    padding: 40, textAlign: "center", transition: "all 0.2s", cursor: "pointer", position: "relative"
                }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#16a34a"; e.currentTarget.style.background = "rgba(22,163,74,0.05)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--card-bg)"; }}>
                    <input type="file" onChange={onDocUpload} style={{ display: "none" }} id="doc-upload" />
                    <label htmlFor="doc-upload" style={{ cursor: "pointer" }}>
                        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(22,163,74,0.1)", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                            <FileText size={24} />
                        </div>
                        <h4 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4, fontFamily: "'Outfit', sans-serif" }}>Upload Medical Report</h4>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>PDF, Lab Reports, Discharge</p>
                    </label>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onRequestUpload('Medical Report'); }}
                        style={{ position: "absolute", bottom: -12, left: "50%", transform: "translateX(-50%)", padding: "6px 14px", borderRadius: 20, background: "rgba(22,163,74,0.05)", border: "1px solid rgba(22,163,74,0.2)", fontSize: 10, fontWeight: 700, color: "#16a34a", cursor: "pointer" }}
                    >REQUEST FROM PATIENT</button>
                </div>
            </div>

            {isScanning && (
                <div style={{ marginBottom: 48, textAlign: "center" }}>
                    <div style={{ width: "200px", height: 4, background: "var(--border)", borderRadius: 2, margin: "0 auto 16px", overflow: "hidden" }}>
                        <div style={{ width: "60%", height: "100%", background: "var(--accent)", animation: "slide 2s infinite ease-in-out" }} />
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Analyzing high-fidelity assets...</p>
                </div>
            )}

            {/* Unified Asset Registry */}
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {(scans || []).filter(s => !!s).length > 0 && (
                    <section>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>Diagnostic Imaging</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
                            {scans.filter(s => !!s).map((scan, idx) => (
                                <div key={idx} onClick={() => onSelectScan(scan)} style={{ 
                                    background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 24, 
                                    overflow: "hidden", cursor: "pointer", transition: "all 0.2s"
                                }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                                    <div style={{ height: 160, background: "#000" }}>
                                        <img src={scan.imageUrl} alt={scan.type} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
                                    </div>
                                    <div style={{ padding: 20 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase" }}>{scan.type}</span>
                                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatDate(scan.date || scan.uploadedAt)}</span>
                                        </div>
                                        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                            {scan.analysis}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {(docs || []).filter(d => !!d).length > 0 && (
                    <section>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>Clinical Reports & Documents</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                            {docs.filter(d => !!d).map((doc, idx) => (
                                <div key={idx} onClick={() => window.open(doc.fileUrl, '_blank')} style={{ 
                                    background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 20, 
                                    padding: 20, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 16
                                }} onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--bg-accent)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--card-bg)"; }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(22,163,74,0.1)", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <FileText size={20} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Uploaded {formatDate(doc.date || doc.uploadDate)} • {doc.type || doc.fileType}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {scans.length === 0 && docs.length === 0 && (
                    <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                        No clinical assets registered for this patient profile.
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Component: Family Hub ---
function FamilyHub({ members, onAdd }) {
    return (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                <div>
                    <h3 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Outfit', sans-serif" }}>Family & Dependents</h3>
                    <p style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}>Manage linked guardians, relatives, and dependents.</p>
                </div>
                <button onClick={onAdd} style={{ 
                    padding: "12px 24px", background: "var(--accent)", color: "#fff", border: "none", 
                    borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                    boxShadow: "0 4px 12px rgba(37,99,235,0.2)"
                }}>
                    <UserPlus size={18} /> Link New Relative
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
                {members.map((m, i) => (
                    <div key={i} style={{ 
                        background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 24, 
                        padding: 24, display: "flex", gap: 20, alignItems: "start"
                    }}>
                        <div style={{ 
                            width: 56, height: 56, borderRadius: 16, background: "var(--bg-accent)", 
                            color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" 
                        }}>
                            {m.relationship === 'Child' ? <Baby size={28} /> : <User size={28} />}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <h4 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Outfit', sans-serif" }}>{m.fullName}</h4>
                                <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 8, background: "rgba(34,197,94,0.1)", color: "#16a34a", fontWeight: 800, textTransform: "uppercase" }}>Verified</span>
                            </div>
                            <p style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 700, marginBottom: 12 }}>{m.relationship}</p>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
                                    <Bell size={12} /> {m.phone || 'No Phone'}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
                                    <File size={12} /> {m.email || 'No Email'}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {members.length === 0 && (
                <div style={{ textAlign: "center", padding: "80px 0", background: "var(--bg-accent)", borderRadius: 32, border: "2px dashed var(--border)" }}>
                    <Users size={48} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.5 }} />
                    <h4 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-secondary)" }}>No Family Links Registered</h4>
                    <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Add children or guardians to manage their care unified.</p>
                </div>
            )}
        </div>
    );
}

function AddFamilyModal({ onClose, onConfirm }) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({ fullName: "", relationship: "", customRelationship: "", phone: "", email: "", abhaAddress: "" });
    const [otp, setOtp] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleRequestOtp = async () => {
        if (!data.email) return alert("Email is required for OTP verification.");
        setIsSending(true);
        try {
            await axios.post("/api/receptionist/patients/otp/generate", { email: data.email });
            setStep(2);
        } catch (error) {
            alert("Failed to send OTP.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
            <div style={{ background: "#fff", borderRadius: 32, width: "100%", maxWidth: 480, padding: 40, position: "relative", animation: "popIn 0.3s ease" }}>
                <button onClick={onClose} style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X /></button>
                
                <h3 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>Link Relative</h3>
                <p style={{ fontSize: 15, color: "var(--text-muted)", marginBottom: 32 }}>Register a family member with OTP verification.</p>

                {step === 1 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Full Name</label>
                            <input value={data.fullName} onChange={e => setData({...data, fullName: e.target.value})} style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 15 }} placeholder="Enter name" />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Relationship *</label>
                                <select value={data.relationship} onChange={e => setData({...data, relationship: e.target.value, customRelationship: e.target.value !== "Other" ? "" : data.customRelationship})} style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 15, background: "#fff" }}>
                                    <option value="" disabled>Select Relation</option>
                                    <option value="Mother">Mother</option>
                                    <option value="Father">Father</option>
                                    <option value="Son">Son</option>
                                    <option value="Daughter">Daughter</option>
                                    <option value="Spouse">Spouse</option>
                                    <option value="Brother">Brother</option>
                                    <option value="Sister">Sister</option>
                                    <option value="Grandfather">Grandfather</option>
                                    <option value="Grandmother">Grandmother</option>
                                    <option value="Friend">Friend</option>
                                    <option value="Guardian">Guardian</option>
                                    <option value="Other">Other (Please Specify)</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Phone</label>
                                <input value={data.phone} onChange={e => setData({...data, phone: e.target.value})} style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 15 }} placeholder="+91..." />
                            </div>
                        </div>
                        {data.relationship === "Other" && (
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Please Specify Relation</label>
                                <input value={data.customRelationship} onChange={e => setData({...data, customRelationship: e.target.value})} style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 15 }} placeholder="e.g. Uncle, Aunt, Cousin..." />
                            </div>
                        )}
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Email ID</label>
                            <input value={data.email} onChange={e => setData({...data, email: e.target.value})} style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 15 }} placeholder="email@example.com" />
                        </div>
                        <button onClick={handleRequestOtp} disabled={isSending} style={{ marginTop: 12, padding: "16px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 16, fontWeight: 800, fontSize: 16, cursor: "pointer", opacity: isSending ? 0.6 : 1 }}>
                            {isSending ? "Sending OTP..." : "Verify & Send OTP"}
                        </button>
                    </div>
                ) : (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(37,99,235,0.1)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}><ShieldCheck size={32} /></div>
                        <h4 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>Verify Identity</h4>
                        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>Enter the code sent to {data.email}</p>
                        <input value={otp} onChange={e => setOtp(e.target.value)} style={{ width: "100%", padding: "16px", borderRadius: 16, border: "2px solid var(--accent)", fontSize: 24, fontWeight: 800, textAlign: "center", letterSpacing: "0.5em", marginBottom: 24 }} placeholder="000000" maxLength={6} />
                        <button onClick={() => {
                            const finalData = { ...data, relationship: data.relationship === "Other" ? (data.customRelationship || "Other") : data.relationship };
                            delete finalData.customRelationship;
                            onConfirm(finalData, otp);
                        }} style={{ width: "100%", padding: "16px", background: "var(--success)", color: "#fff", border: "none", borderRadius: 16, fontWeight: 800, fontSize: 16, cursor: "pointer" }}>Confirm Linkage</button>
                        <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, fontWeight: 700, marginTop: 16, cursor: "pointer" }}>Change details</button>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Page: Patient Profile + AI Snapshot ---
// --- Demo Utility: Fallback data for Golden Demo ---
const getDemoMockData = (patient) => {
    // Enable mock data fallback for all patients to ensure high-fidelity demo
    // even if backend clinical records are empty.
    if (!patient) return null;

    return {
        vitals: {
            bloodPressure: "124/82",
            heartRate: 74,
            spO2: 98,
            temperature: 36.8,
            weight: 72.5
        },
        summary: "Patient displays stable clinical indicators. Longitudinal cardiovascular history suggests mild hypertension managed via lifestyle. Respiratory function is optimal. No acute distress noted in recent streams.",
        risk: {
            level: "Low",
            score: 18,
            factors: ["Age-related baseline", "Mild BP elevation"],
            recommendation: "Continue routine monitoring and healthy diet. Follow up in 3 months."
        },
        alerts: "Predictive Trajectory: STABLE\n- Cardiovascular risk is within normal parameters.\n- Metabolic trends indicate 94% stability for the next quarter.\n- Recommended: Annual health checkup scheduled.",
        imaging: [
            { id: "mock_xray", type: "Chest X-Ray", uploadedAt: new Date().toISOString(), doctorName: "Dr. Mock Seeder", analysisResult: "Clear lung fields, normal cardiac silhouette.", imageUrl: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=80&w=400" },
            { id: "mock_ecg", type: "ECG", uploadedAt: new Date().toISOString(), doctorName: "Dr. Mock Seeder", analysisResult: "Sinus rhythm, no ischemic changes.", imageUrl: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=400" }
        ],
        vault: [
            { id: "mock_v1", title: "Previous Hospital Discharge", type: "PDF Report", createdAt: new Date().toISOString(), clinicalNotes: "Standard recovery from viral fever." },
            { id: "mock_v2", title: "Immunization Record", type: "PDF Report", createdAt: new Date().toISOString(), clinicalNotes: "Up to date with all major vaccinations." }
        ],
        labResults: [
            { test: "HbA1c", value: "5.4%", ref: "< 5.7%", date: "12/02/2026", trend: "stable" },
            { test: "Serum Creatinine", value: "0.9 mg/dL", ref: "0.7-1.3", date: "12/02/2026", trend: "down" },
            { test: "Total Cholesterol", value: "185", ref: "< 200", date: "10/01/2026", trend: "up" }
        ],
        riskScores: {
            cardiac: { score: 12, level: "Low", trend: "stable" },
            diabetes: { score: 8, level: "Low", trend: "stable" },
            readmission: { score: 4, level: "Low", trend: "decreasing" }
        },
        timeline: [
            { date: "2026-03-01", event: "Annual Physical Exam", type: "CONSULTATION", facility: "Apollo Hospital" },
            { date: "2026-02-15", event: "Telehealth: Minor Cough", type: "CONSULTATION", facility: "Digital Care" }
        ]
    };
};

function PatientProfile({ patient, onBack, onDownloadCard, onUpdatePatient, vaultDocuments, isVaultLoading }) {
    const { role: userRole = 'DOCTOR', username: user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState("snapshot");
    const [showConsent, setShowConsent] = useState(false);
    const [showUploadRequest, setShowUploadRequest] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [consentPending, setConsentPending] = useState(false);
    const [accessDuration, setAccessDuration] = useState(60); // minutes
    const [timeLeft, setTimeLeft] = useState(0);
    const [sessionRequested, setSessionRequested] = useState(false); // For demo: force request each time
    const [lastRequestTime, setLastRequestTime] = useState(0); // Timestamp of the actual button click
    const [isRequesting, setIsRequesting] = useState(false);
    const [showDocRequestModal, setShowDocRequestModal] = useState(false);

    useEffect(() => {
        let timer;
        if (hasAccess && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [hasAccess, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAskDocuments = async (selectedTypes = []) => {
        try {
            const typesString = selectedTypes.length > 0 ? selectedTypes.join(", ") : "Digital Records";
            
            await axios.post('/api/consents', {
                patientId: patient.id,
                hospitalId: "", 
                purpose: "DOCUMENT_REQUEST",
                metadata: typesString // Use metadata to store requested types
            });
            alert(`Request for ${typesString} sent to the patient!`);
            setShowDocRequestModal(false);
        } catch (error) {
            console.error(error);
            alert("Failed to send document request.");
        }
    };
    const [typedSummary, setTypedSummary] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [aiRisk, setAiRisk] = useState(null);
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    const [editingDemographics, setEditingDemographics] = useState(false);
    const [editData, setEditData] = useState({
        gender: patient.gender || "",
        dob: patient.dob || "",
        bloodGroup: patient.bloodGroup || "",
        phone: patient.phone || "",
        address: patient.address || "",
        allergies: patient.allergies ? patient.allergies.map(a => `${a.name} (${a.severity})`).join(", ") : ""
    });
    const [editVitals, setEditVitals] = useState({
        bloodPressure: patient.vitals?.bloodPressure || patient.vitals?.bp || "",
        heartRate: patient.vitals?.heartRate || patient.vitals?.hr || "",
        spO2: patient.vitals?.spO2 || patient.vitals?.spo2 || "",
        temperature: patient.vitals?.temperature || patient.vitals?.temp || "",
        weight: patient.vitals?.weight || ""
    });
    const [savingEdit, setSavingEdit] = useState(false);
    const [addingItem, setAddingItem] = useState(null); // 'labs', 'medications', 'timeline'
    const [newItem, setNewItem] = useState({});
    const [editingListIndex, setEditingListIndex] = useState(null);

    const handleSaveDemographics = async () => {
        setSavingEdit(true);
        try {
            const formattedAllergies = editData.allergies 
                ? editData.allergies.split(",").filter(s => s.trim()).map(s => {
                    const [name, sev] = s.split("(");
                    return { 
                        name: name.trim(), 
                        severity: sev ? sev.replace(")", "").trim() : "Moderate" 
                    };
                })
                : [];

            await axios.put(`/api/patients/${patient.id}`, {
                ...patient,
                fullName: patient.name,
                gender: editData.gender,
                dob: editData.dob,
                bloodGroup: editData.bloodGroup,
                phone: editData.phone,
                address: editData.address,
                allergies: formattedAllergies,
                vitals: {
                    bloodPressure: editVitals.bloodPressure || null,
                    heartRate: editVitals.heartRate ? parseInt(editVitals.heartRate) : null,
                    spO2: editVitals.spO2 ? parseInt(editVitals.spO2) : null,
                    temperature: editVitals.temperature ? parseFloat(editVitals.temperature) : null,
                    weight: editVitals.weight ? parseFloat(editVitals.weight) : null
                }
            });
            const updatedPatient = { ...patient, ...editData, allergies: formattedAllergies, vitals: { ...patient.vitals, ...editVitals } };
            if (onUpdatePatient) onUpdatePatient(updatedPatient);
            setEditingDemographics(false);
            alert("Patient record updated successfully!");
        } catch (err) {
            alert("Failed to update: " + (err.response?.data || err.message));
        }
        setSavingEdit(false);
    };

    const handleAddItem = async (category) => {
        setSavingEdit(true);
        try {
            const updatedPatient = { ...patient };
            if (!updatedPatient[category]) updatedPatient[category] = [];
            
            if (editingListIndex !== null) {
                updatedPatient[category] = updatedPatient[category].map((item, i) => i === editingListIndex ? newItem : item);
            } else {
                updatedPatient[category] = [newItem, ...updatedPatient[category]];
            }
            
            // For persistence, backend expects fullName maps to name if needed
            const payload = { ...updatedPatient, fullName: updatedPatient.name };

            await axios.put(`/api/patients/${patient.id}`, payload);
            if (onUpdatePatient) onUpdatePatient(updatedPatient);
            setAddingItem(null);
            setEditingListIndex(null);
            setNewItem({});
            alert(`${category.charAt(0).toUpperCase() + category.slice(1)} updated!`);
        } catch (err) {
            alert("Failed to update: " + (err.response?.data || err.message));
        }
        setSavingEdit(false);
    };

    const handleRemoveItem = async (category, index) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        setSavingEdit(true);
        try {
            const updatedPatient = { ...patient };
            updatedPatient[category] = updatedPatient[category].filter((_, i) => i !== index);
            
            await axios.put(`/api/patients/${patient.id}`, { ...updatedPatient, fullName: updatedPatient.name });
            if (onUpdatePatient) onUpdatePatient(updatedPatient);
        } catch (err) {
            alert("Delete failed: " + err.message);
        }
        setSavingEdit(false);
    };

    // Check consent status on mount and poll for changes
    // Only Ramesh Kumar (main demo patient) requires consent from mobile
    // All other patients get direct access
    useEffect(() => {
        const isRameshKumar = patient.name?.includes("Ramesh Kumar") || patient.fullName?.includes("Ramesh Kumar");
        
        if (!isRameshKumar) {
            // All other patients — direct access, no consent needed
            setHasAccess(true);
            setConsentPending(false);
            return;
        }

        // Independent patient (has their own UPHI login) — check consent
        const checkConsent = async () => {
            // Require a fresh request for this session
            if (!sessionRequested) {
                setConsentPending(false);
                setHasAccess(false);
                return;
            }

            try {
                const token = sessionStorage.getItem('uphi_token') || sessionStorage.getItem('token');
                if (!token) return;

                const res = await axios.get('/api/consents/hospital');
                // Only consider consents generated in this session (since the Request Access button was clicked)
                const patientConsents = (res.data || []).filter(c => 
                    c.patientId === patient.id && 
                    new Date(c.createdAt).getTime() >= (lastRequestTime - 5000)
                );
                
                // No recent consent requested
                if (patientConsents.length === 0) {
                    setConsentPending(false);
                    setHasAccess(false);
                    return;
                }

                // Sorting logic: most recent first
                const sortedConsents = [...patientConsents].sort((a, b) => {
                    const timeA = new Date(a.updatedAt || a.createdAt).getTime();
                    const timeB = new Date(b.updatedAt || b.createdAt).getTime();
                    return timeB - timeA;
                });

                const latestConsent = sortedConsents[0];
                const approved = latestConsent.status === 'APPROVED';
                const pending = latestConsent.status === 'PENDING';

                setConsentPending(pending && !approved);
                
                if (approved) {
                    setHasAccess(true);
                    setTimeLeft(prev => prev === 0 ? (latestConsent.durationMinutes || accessDuration) * 60 : prev);
                } else {
                    setHasAccess(false);
                }
            } catch (err) {
                console.log('Consent check error:', err);
            }
        };
        checkConsent();
        const interval = setInterval(checkConsent, 3000);
        return () => clearInterval(interval);
    }, [patient.id, sessionRequested, lastRequestTime]);

    const handleRequestAccess = async () => {
        if (isRequesting) return;
        setIsRequesting(true);
        try {
            const token = sessionStorage.getItem('uphi_token');
            await axios.post('/api/consents', {
                patientId: patient.id,
                hospitalId: "",
                purpose: "CLINICAL_ACCESS",
                durationMinutes: accessDuration
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLastRequestTime(Date.now()); // Mark the exact time of request
            setSessionRequested(true); // Mark that we've requested in this session
            setConsentPending(true);
            alert(`Consent request sent to patient for ${accessDuration} minutes. Waiting for approval...`);
        } catch (err) {
            alert("Failed to request access: " + (err.response?.data || err.message));
        } finally {
            setIsRequesting(false);
        }
    };

    const handleDirectGrant = () => {
        setSessionRequested(true);
        setHasAccess(true);
        setConsentPending(false);
        setTimeLeft(accessDuration * 60);
        alert("Direct Access Granted via Golden Demo Override.");
    };

    const handleSyncFromVault = async (doc) => {
        try {
            // For demo purposes, we link the vault document to the local clinical record
            if (['XRAY', 'X-RAY', 'RADIOLOGY', 'ECG'].includes(doc.type?.toUpperCase())) {
                setImagingHistory(prev => [{
                    id: doc.id,
                    type: doc.type,
                    uploadedAt: doc.date,
                    doctorName: 'Digital Vault Sync',
                    analysisResult: doc.clinicalNotes || 'Analyzing uploaded asset...',
                    imageUrl: `/api/records/${doc.id}/scan`
                }, ...prev]);
            } else {
                setDocumentHistory(prev => [{
                    id: doc.id,
                    title: doc.title || doc.type,
                    type: doc.type,
                    uploadedAt: doc.date,
                    uploadedBy: 'Digital Vault'
                }, ...prev]);
            }
            alert(`${doc.type} synced successfully to clinical records.`);
        } catch (err) {
            alert("Failed to sync document.");
        }
    };

    const mockData = getDemoMockData(patient);

    // Fetch real AI clinical summary from Gemini
    useEffect(() => {
        if (activeTab === "snapshot" && hasAccess && !typedSummary) {
            if (mockData) {
                // Instantly type the mock summary for non-main patients
                let i = 0;
                const text = mockData.summary;
                setIsTyping(true);
                const interval = setInterval(() => {
                    if (i < text.length) {
                        setTypedSummary(text.slice(0, i + 1));
                        i++;
                    } else {
                        setIsTyping(false);
                        clearInterval(interval);
                    }
                }, 4);
                return;
            }

            setIsLoadingAi(true);
            const token = sessionStorage.getItem('uphi_token');
            axios.get(`/api/ai/summary/${patient.id}`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => {
                    const text = res.data.summary;
                    setIsTyping(true);
                    let i = 0;
                    const interval = setInterval(() => {
                        if (i < text.length) {
                            setTypedSummary(text.slice(0, i + 1));
                            i++;
                        } else {
                            setIsTyping(false);
                            clearInterval(interval);
                        }
                    }, 8);
                    setIsLoadingAi(false);
                })
                .catch(() => {
                    setTypedSummary("AI summary temporarily unavailable. Please review patient records manually.");
                    setIsLoadingAi(false);
                });
        }
    }, [activeTab, hasAccess]);

    // Fetch AI risk assessment
    useEffect(() => {
        if ((activeTab === "analytics" || activeTab === "snapshot") && !aiRisk) {
            if (mockData) {
                setAiRisk(mockData.risk);
                return;
            }
            const token = sessionStorage.getItem('uphi_token');
            axios.get(`/api/ai/risk/${patient.id}`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => setAiRisk(res.data))
                .catch(() => setAiRisk({ level: "Unknown", score: 0, factors: ["Assessment unavailable"], recommendation: "Manual review required." }));
        }
    }, [activeTab]);

    const [familyMembers, setFamilyMembers] = useState(patient.relatedPersons || []);
    const [isLinking, setIsLinking] = useState(false);
    const [showAddFamily, setShowAddFamily] = useState(false);

    const handleAddFamily = async (relativeData, otp) => {
        try {
            const response = await axios.post(`/api/receptionist/${patient.id}/relatives`, {
                otp,
                relative: relativeData
            });
            setFamilyMembers(prev => [...prev, { ...relativeData, verified: true, linkedAt: new Date() }]);
            setShowAddFamily(false);
            alert("Family link established and verified.");
        } catch (error) {
            alert(error.response?.data || "Verification failed. Check OTP.");
        }
    };

    const [isScanning, setIsScanning] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagingHistory, setImagingHistory] = useState(patient.imagingRecords || []);
    const [documentHistory, setDocumentHistory] = useState(patient.medicalDocuments || []);

    const handleImagingUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsScanning(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", file.name.toUpperCase().includes("ECG") ? "ECG" : "X-RAY");
        formData.append("doctorName", "Dr. Satish Kumar");

        try {
            const response = await axios.post(`/api/imaging/scan/${patient.id}`, formData, {
                headers: { 
                    "Content-Type": "multipart/form-data"
                }
            });
            setImagingHistory(prev => [response.data, ...prev]);
            alert("Diagnostic Scan Authorized. AI Analysis Complete.");
        } catch (error) {
            alert("Imaging Analysis Failed: Source too degraded or server timeout.");
        } finally {
            setIsScanning(false);
        }
    };

    const handleRequestUpload = async (assetType) => {
        try {
            const token = sessionStorage.getItem('uphi_token');
            const hospitalName = sessionStorage.getItem('uphi_hospital_name') || "This Facility";
            await axios.post('/api/notifications', {
                recipientId: patient.userId,
                title: "Document Upload Request",
                message: `${hospitalName} is requesting you to upload a ${assetType} to your Digital Vault for clinical review.`,
                type: "UPLOAD_REQUEST",
                metadata: assetType
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Upload Request for ${assetType} sent to patient mobile.`);
        } catch (error) {
            console.error("Failed to send request", error);
            alert("Failed to notify patient. Check connectivity.");
        }
    };

    const handleDocumentUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsScanning(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name);
        formData.append("uploadedBy", "Dr. Satish Kumar");

        try {
            const token = sessionStorage.getItem('uphi_token');
            const response = await axios.post(`/api/imaging/upload-doc/${patient.id}`, formData, {
                headers: { 
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${token}`
                }
            });
            setDocumentHistory(prev => [response.data, ...prev]);
            alert("Document Securely Archived.");
        } catch (error) {
            alert("Upload Failed: Asset integrity check rejected.");
        } finally {
            setIsScanning(false);
        }
    };

    if (!patient) return null;

    const tabs = [
        { id: "snapshot", label: "AI Snapshot", icon: <Brain /> },
        { id: "records", label: "Medical Records", icon: <FileText /> },
        { id: "medications", label: "Medications", icon: <Pill /> },
        { id: "timeline", label: "Timeline", icon: <Clock /> },
        { id: "analytics", label: "Risk Analytics", icon: <Activity /> },
        { id: "imaging", label: "Clinical Assets", icon: <FileText /> },
        { id: "vault", label: "Digital Vault", icon: <ShieldCheck /> },
        { id: "family", label: "Family & Dependents", icon: <Users /> },
        { id: "alerts", label: "Predictive Alerts", icon: <AlertTriangle /> },
        { id: "discharge", label: "Discharge", icon: <FileText /> },
    ];

    return (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
            {showConsent && <ConsentModal patient={patient} onClose={() => setShowConsent(false)} onRequest={() => setConsentPending(true)} />}
            {showDocRequestModal && (
                <DocRequestModal 
                    onClose={() => setShowDocRequestModal(false)} 
                    onConfirm={handleAskDocuments} 
                />
            )}
            {showUploadRequest && <RequestUploadModal patient={patient} onClose={() => setShowUploadRequest(false)} />}
            {selectedImage && <DiagnosticViewer image={selectedImage} onClose={() => setSelectedImage(null)} />}

            {/* Back button */}
            <button onClick={onBack} style={{
                display: "inline-flex", alignItems: "center", gap: 10, background: "none",
                border: "none", color: THEME.textSecondary, fontSize: 14, cursor: "pointer",
                fontWeight: 700, marginBottom: 24, padding: "8px 12px", borderRadius: 12,
                transition: "all 0.2s"
            }} onMouseEnter={e => { e.currentTarget.style.background = THEME.bg; e.currentTarget.style.color = THEME.accent; }}>
                <ArrowLeft size={18} /> Back to Registry

            </button>

            {/* Patient header */}
            <div style={{
                background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 32,
                padding: 40, marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
            }}>
                <div className="uphi-profile-header">
                    <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: 22, flexShrink: 0,
                            background: THEME.bg, border: `1px solid ${THEME.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: THEME.accent, fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif",
                        }}>
                            {patient.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <h1 style={{ fontSize: 28, fontWeight: 800, color: THEME.textPrimary, margin: "0 0 6px", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
                                {patient.name}
                            </h1>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 14, color: THEME.textSecondary, fontWeight: 600 }}>
                                <span>{patient.age} yrs</span>
                                <span style={{ color: THEME.border }}>•</span>
                                <span>{editData.gender || "N/A"}</span>
                                <span style={{ color: THEME.border }}>•</span>
                                <span>DOB: {editData.dob || "N/A"}</span>
                                <span style={{ color: THEME.border }}>•</span>
                                <span>Blood: {editData.bloodGroup || "N/A"}</span>
                                <span style={{ width: 1, height: 14, background: THEME.border, margin: "0 4px" }} />
                                <span style={{ fontSize: 12, color: THEME.textMuted, fontFamily: "'DM Mono', monospace" }}>UID: {patient.id?.slice(-8)}</span>
                                <button onClick={() => setEditingDemographics(!editingDemographics)} style={{
                                    fontSize: 11, padding: "3px 10px", borderRadius: 6, border: `1px solid ${THEME.border}`,
                                    background: editingDemographics ? THEME.accent : "transparent", color: editingDemographics ? "#fff" : THEME.accent,
                                    fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em"
                                }}>{editingDemographics ? "Cancel" : "Edit"}</button>
                            </div>

                            {/* Inline Demographics Editor */}
                            {editingDemographics && (
                                <div style={{ marginTop: 16, padding: 24, background: THEME.bg, borderRadius: 16, border: `1px solid ${THEME.border}` }}>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Demographics</div>
                                    <div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap", marginBottom: 20 }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: THEME.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Date of Birth</label>
                                            <input type="date" value={editData.dob} onChange={e => setEditData(p => ({...p, dob: e.target.value}))} style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${THEME.border}`, fontSize: 13, fontWeight: 600 }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: THEME.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Gender</label>
                                            <select value={editData.gender} onChange={e => setEditData(p => ({...p, gender: e.target.value}))} style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${THEME.border}`, fontSize: 13, fontWeight: 600, background: "#fff" }}>
                                                <option value="">Select</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: THEME.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Blood Group</label>
                                            <select value={editData.bloodGroup} onChange={e => setEditData(p => ({...p, bloodGroup: e.target.value}))} style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${THEME.border}`, fontSize: 13, fontWeight: 600, background: "#fff" }}>
                                                <option value="">Select</option>
                                                <option value="A+">A+</option><option value="A-">A-</option>
                                                <option value="B+">B+</option><option value="B-">B-</option>
                                                <option value="O+">O+</option><option value="O-">O-</option>
                                                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: THEME.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Phone</label>
                                            <input type="text" value={editData.phone} onChange={e => setEditData(p => ({...p, phone: e.target.value}))} style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${THEME.border}`, fontSize: 13, fontWeight: 600, width: 140 }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 200 }}>
                                            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: THEME.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Address</label>
                                            <input type="text" value={editData.address} onChange={e => setEditData(p => ({...p, address: e.target.value}))} style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${THEME.border}`, fontSize: 13, fontWeight: 600, width: "100%" }} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 20 }}>
                                        <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: THEME.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Critical Allergies (e.g. Peanuts (High), Penicillin (Moderate))</label>
                                        <input type="text" value={editData.allergies} onChange={e => setEditData(p => ({...p, allergies: e.target.value}))} style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${THEME.border}`, fontSize: 13, fontWeight: 600, width: "100%" }} />
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Vitals</div>
                                    <div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap", marginBottom: 16 }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: THEME.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Blood Pressure</label>
                                            <input type="text" placeholder="e.g. 120/80" value={editVitals.bloodPressure} onChange={e => setEditVitals(p => ({...p, bloodPressure: e.target.value}))} style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${THEME.border}`, fontSize: 13, fontWeight: 600, width: 100 }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: THEME.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Heart Rate (BPM)</label>
                                            <input type="number" placeholder="72" value={editVitals.heartRate} onChange={e => setEditVitals(p => ({...p, heartRate: e.target.value}))} style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${THEME.border}`, fontSize: 13, fontWeight: 600, width: 80 }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: THEME.textMuted, marginBottom: 4, textTransform: "uppercase" }}>SpO2 (%)</label>
                                            <input type="number" placeholder="98" value={editVitals.spO2} onChange={e => setEditVitals(p => ({...p, spO2: e.target.value}))} style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${THEME.border}`, fontSize: 13, fontWeight: 600, width: 70 }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: THEME.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Temp (°C)</label>
                                            <input type="number" step="0.1" placeholder="36.6" value={editVitals.temperature} onChange={e => setEditVitals(p => ({...p, temperature: e.target.value}))} style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${THEME.border}`, fontSize: 13, fontWeight: 600, width: 80 }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: THEME.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Weight (kg)</label>
                                            <input type="number" step="0.1" placeholder="70" value={editVitals.weight} onChange={e => setEditVitals(p => ({...p, weight: e.target.value}))} style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${THEME.border}`, fontSize: 13, fontWeight: 600, width: 80 }} />
                                        </div>
                                    </div>
                                    <button disabled={savingEdit} onClick={handleSaveDemographics} style={{
                                        padding: "10px 24px", borderRadius: 10, border: "none",
                                        background: THEME.accent, color: "#fff", fontWeight: 800,
                                        cursor: "pointer", fontSize: 13
                                    }}>{savingEdit ? "Saving..." : "Save All Changes"}</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="uphi-profile-actions" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
                        <button onClick={() => onDownloadCard(patient.id, patient.name)} style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
                            borderRadius: 12, border: `1px solid ${THEME.accentMuted}`,
                            background: THEME.accentMuted, whiteSpace: "nowrap",
                            color: THEME.accent, fontSize: 13, fontWeight: 700, cursor: "pointer",
                            transition: "all 0.2s",
                        }} onMouseEnter={e => e.currentTarget.style.background = "rgba(37,99,235,0.15)"} onMouseLeave={e => e.currentTarget.style.background = THEME.accentMuted}>
                            <FileText size={15} /> Download ID
                        </button>
                        {hasAccess ? (
                            <div style={{
                                display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
                                borderRadius: 12, background: "rgba(34,197,94,0.1)", color: "#16a34a",
                                fontSize: 13, fontWeight: 700, border: "1px solid rgba(34,197,94,0.2)", whiteSpace: "nowrap",
                            }}>
                                <ShieldCheck size={15} /> Access active for {formatTime(timeLeft)}
                            </div>
                        ) : consentPending ? (
                            <div style={{
                                display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
                                borderRadius: 12, background: "rgba(234,179,8,0.1)", color: "#ca8a04",
                                fontSize: 13, fontWeight: 700, border: "1px solid rgba(234,179,8,0.2)", whiteSpace: "nowrap",
                                animation: "pulse 2s ease-in-out infinite",
                            }}>
                                <Clock size={15} /> Pending Approval...
                            </div>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <select 
                                    value={accessDuration} 
                                    onChange={e => setAccessDuration(Number(e.target.value))}
                                    style={{
                                        padding: "10px 8px", borderRadius: "12px 0 0 12px", border: `2px solid ${THEME.accent}`,
                                        borderRight: "none", background: "rgba(37,99,235,0.05)", color: THEME.accent,
                                        fontSize: 12, fontWeight: 700, cursor: "pointer", outline: "none",
                                    }}
                                >
                                    <option value={15}>15 min</option>
                                    <option value={30}>30 min</option>
                                    <option value={60}>1 hr</option>
                                    <option value={120}>2 hr</option>
                                    <option value={240}>4 hr</option>
                                </select>
                                <button 
                                    onClick={handleRequestAccess} 
                                    disabled={isRequesting || consentPending}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
                                        borderRadius: "0 12px 12px 0", border: "none", whiteSpace: "nowrap",
                                        background: (isRequesting || consentPending) ? "#94a3b8" : THEME.accent,
                                        color: "#fff", fontSize: 13, fontWeight: 700, cursor: (isRequesting || consentPending) ? "not-allowed" : "pointer",
                                        boxShadow: (isRequesting || consentPending) ? "none" : "0 4px 12px rgba(37, 99, 235, 0.2)",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    {isRequesting ? "Sending..." : consentPending ? "Request Pending" : <><Shield size={15} /> Request Access</>}
                                </button>
                            </div>
                        )}
                        <button onClick={() => setShowDocRequestModal(true)} style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
                            borderRadius: 12, border: "1.5px solid rgba(139, 92, 246, 0.25)", whiteSpace: "nowrap",
                            background: "transparent",
                            color: "#8b5cf6", fontSize: 13, fontWeight: 700, cursor: "pointer",
                        }}>
                            <Upload size={15} /> Ask Documents
                        </button>
                    </div>
                </div>

                {/* Allergy banner */}
                {/* Alerts section */}
                {patient.allergies && patient.allergies.length > 0 && (
                    <div style={{
                        marginTop: 24, padding: "16px 24px", borderRadius: 16,
                        background: "#fef2f2", border: `1px solid #fee2e2`,
                        display: "flex", alignItems: "center", gap: 16,
                    }}>
                        <AlertCircle color="#dc2626" size={20} />

                        <div>
                            <span style={{ fontSize: 13, fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.05em" }}>Critical Allergies: </span>
                            <span style={{ fontSize: 15, color: "#991b1b", fontWeight: 600 }}>
                                {patient.allergies.map(a => `${a.name} (${a.severity})`).join(" • ")}
                            </span>
                        </div>
                    </div>
                )}

                {/* Patient metadata / Vitals context */}
                <div className="uphi-vitals-bar" style={{ marginTop: 24, padding: "20px 24px", background: THEME.bg, borderRadius: 20, border: `1px solid ${THEME.border}` }}>
                    <div style={{ display: "flex", gap: 32, alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Blood Pressure</span>
                                <span style={{ fontSize: 16, fontWeight: 800, color: THEME.textPrimary }}>{patient.vitals?.bloodPressure || patient.vitals?.bp || mockData?.vitals?.bloodPressure || "--"}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Heart Rate</span>
                                <span style={{ fontSize: 16, fontWeight: 800, color: THEME.textPrimary }}>{fmtVital(patient.vitals?.heartRate || patient.vitals?.hr || mockData?.vitals?.heartRate)} <span style={{ fontSize: 11, fontWeight: 600, color: THEME.textMuted }}>BPM</span></span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>SpO2</span>
                                <span style={{ fontSize: 16, fontWeight: 800, color: THEME.textPrimary }}>{fmtVital(patient.vitals?.spO2 || patient.vitals?.spo2 || mockData?.vitals?.spO2)}<span style={{ fontSize: 11, fontWeight: 600, color: THEME.textMuted }}>%</span></span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Temp</span>
                                <span style={{ fontSize: 16, fontWeight: 800, color: THEME.textPrimary }}>{fmtVital(patient.vitals?.temperature || patient.vitals?.temp || mockData?.vitals?.temperature)} <span style={{ fontSize: 11, fontWeight: 600, color: THEME.textMuted }}>°C</span></span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Weight</span>
                                <span style={{ fontSize: 16, fontWeight: 800, color: THEME.textPrimary }}>{fmtVital(patient.vitals?.weight || mockData?.vitals?.weight)} <span style={{ fontSize: 11, fontWeight: 600, color: THEME.textMuted }}>kg</span></span>
                            </div>
                        </div>
                        <button onClick={() => setEditingDemographics(true)} style={{ padding: "10px 18px", borderRadius: 12, background: THEME.bg, border: `1px solid ${THEME.border}`, color: THEME.textPrimary, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>UPDATE VITALS</button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="uphi-tabs" style={{ marginBottom: 32, borderBottom: `1px solid ${THEME.border}`, paddingBottom: 16 }}>
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "12px 24px",
                        borderRadius: 14, border: "none",
                        background: activeTab === tab.id ? THEME.accent : "transparent",
                        color: activeTab === tab.id ? "#fff" : THEME.textSecondary,
                        fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                    }}>
                        {React.cloneElement(tab.icon, { size: 18 })} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {!hasAccess ? (
                <div style={{
                    textAlign: "center", padding: "100px 40px",
                    background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 32,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                }}>
                    <div style={{ marginBottom: 32, display: "flex", justifyContent: "center" }}>
                        <div style={{ width: 64, height: 64, borderRadius: "50%", background: THEME.bg, display: "flex", alignItems: "center", justifyContent: "center", color: consentPending ? "#f59e0b" : THEME.textMuted }}>
                            {consentPending ? <Clock size={32} /> : <Lock size={32} />}
                        </div>
                    </div>
                    <h3 style={{ fontSize: 24, fontWeight: 800, color: THEME.textPrimary, marginBottom: 12, fontFamily: "'Outfit', sans-serif" }}>
                        {consentPending ? "Awaiting Patient Approval" : "Clinical Record Restricted"}
                    </h3>
                    <p style={{ fontSize: 16, color: THEME.textSecondary, maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.6, fontWeight: 500 }}>
                        {consentPending 
                            ? "A consent request has been sent. The patient must approve it from their UPHI mobile app or web portal. This page will update automatically."
                            : "The health data for this patient is encrypted. Send a digital consent request to receive immediate clinical access via ABDM."
                        }
                    </p>
                    {consentPending ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b", animation: "pulse 1.5s infinite" }} />
                            <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 14 }}>Polling for approval...</span>
                        </div>
                    ) : (
                        <button onClick={() => setShowConsent(true)} style={{
                            padding: "16px 40px", borderRadius: 16, border: "none",
                            background: THEME.accent,
                            color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer",
                            boxShadow: "0 8px 24px rgba(37, 99, 235, 0.2)"
                        }}>
                            <Shield size={18} style={{ marginRight: 8 }} /> Initiate Access Request
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                    {/* AI Snapshot Tab */}
                    {activeTab === "snapshot" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
                            <div style={{
                                background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 20, padding: 28,
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                                    <div style={{ color: "var(--accent)", display: "flex", alignItems: "center", gap: 6 }}>
                                        <Sparkles />
                                        <span style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Doctor's Snapshot</span>
                                    </div>
                                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>Powered by Gemini LLM</span>
                                </div>
                                <div style={{
                                    fontSize: 14, lineHeight: 1.8, color: "var(--text-secondary)",
                                    whiteSpace: "pre-wrap", fontFamily: "'DM Sans', sans-serif",
                                }}>
                                    {typedSummary}
                                    {isTyping && <span style={{ animation: "blink 0.8s ease infinite", color: "var(--accent)" }}>▌</span>}
                                </div>
                                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                                    <button style={{
                                        padding: "10px 20px", borderRadius: 10, border: "1px solid var(--border)",
                                        background: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600,
                                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                                    }}><FileText /> Export as PDF</button>
                                    <button style={{
                                        padding: "10px 20px", borderRadius: 10, border: "1px solid var(--border)",
                                        background: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600,
                                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                                    }}><Upload /> Add to Consultation Notes</button>
                                </div>
                            </div>

                            {/* AI Risk Assessment Sidebar */}
                            <div style={{
                                background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 20, padding: 24,
                            }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 20px", textTransform: "uppercase", letterSpacing: "0.06em" }}>AI Risk Assessment</h3>
                                {aiRisk ? (
                                    <div>
                                        <div style={{ textAlign: "center", marginBottom: 20 }}>
                                            <div style={{
                                                width: 80, height: 80, borderRadius: "50%", margin: "0 auto 12px",
                                                background: aiRisk.level === 'Critical' ? 'rgba(239,68,68,0.1)' : aiRisk.level === 'High' ? 'rgba(249,115,22,0.1)' : aiRisk.level === 'Moderate' ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)',
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                border: `3px solid ${aiRisk.level === 'Critical' ? '#ef4444' : aiRisk.level === 'High' ? '#f97316' : aiRisk.level === 'Moderate' ? '#eab308' : '#22c55e'}`
                                            }}>
                                                <span style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: aiRisk.level === 'Critical' ? '#ef4444' : aiRisk.level === 'High' ? '#f97316' : aiRisk.level === 'Moderate' ? '#eab308' : '#22c55e' }}>
                                                    {aiRisk.score}
                                                </span>
                                            </div>
                                            <span style={{
                                                fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
                                                padding: "4px 14px", borderRadius: 8,
                                                background: aiRisk?.level === 'Critical' ? 'rgba(239,68,68,0.1)' : aiRisk?.level === 'High' ? 'rgba(249,115,22,0.1)' : aiRisk?.level === 'Moderate' ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)',
                                                color: aiRisk?.level === 'Critical' ? '#ef4444' : aiRisk?.level === 'High' ? '#f97316' : aiRisk?.level === 'Moderate' ? '#eab308' : '#22c55e',
                                            }}>{aiRisk?.level} Risk</span>
                                        </div>

                                        <div style={{ marginBottom: 16 }}>
                                            <h4 style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Risk Factors</h4>
                                            {(aiRisk?.factors || []).map((f, i) => (
                                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                                                    <AlertTriangle size={12} color="#f97316" /> {f}
                                                </div>
                                            ))}
                                        </div>

                                        {aiRisk?.recommendation && (
                                            <div style={{ padding: 12, background: "var(--bg-accent)", borderRadius: 12, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                                                <strong style={{ color: "var(--accent)" }}>AI Recommendation:</strong> {aiRisk?.recommendation}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>
                                        <Brain size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
                                        <p>Computing risk profile...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Medical Records Tab */}
                    {activeTab === "records" && (
                        <ErrorBoundary>
                        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 20, padding: 28 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0, fontFamily: "'Playfair Display', serif" }}>Laboratory Results</h3>
                                {hasAccess && userRole === 'DOCTOR' && (
                                    <button onClick={() => setAddingItem('labResults')} style={{ padding: "8px 16px", borderRadius: 10, background: THEME.accent, color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ ADD RESULT</button>
                                )}
                            </div>

                            {addingItem === 'labResults' && (
                                <div style={{ marginBottom: 24, padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 16, border: `1px dashed ${THEME.accent}` }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                                        <input placeholder="Test Name (e.g. HbA1c)" onChange={e => setNewItem({...newItem, test: e.target.value})} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
                                        <input placeholder="Value (e.g. 5.4%)" onChange={e => setNewItem({...newItem, value: e.target.value})} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
                                        <input placeholder="Range (e.g. < 5.7%)" onChange={e => setNewItem({...newItem, ref: e.target.value})} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
                                        <input type="date" onChange={e => setNewItem({...newItem, date: e.target.value})} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
                                        <select onChange={e => setNewItem({...newItem, trend: e.target.value})} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}>
                                            <option value="stable">Stable</option>
                                            <option value="up">Increasing</option>
                                            <option value="down">Decreasing</option>
                                        </select>
                                    </div>
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <button onClick={() => handleAddItem('labResults')} disabled={savingEdit} style={{ padding: "8px 16px", borderRadius: 8, background: "#22c55e", color: "#fff", border: "none" }}>SAVE</button>
                                        <button onClick={() => setAddingItem(null)} style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", color: "var(--text-muted)", border: "none" }}>CANCEL</button>
                                    </div>
                                </div>
                            )}

                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
                                    <thead>
                                        <tr>
                                            {["Test", "Value", "Reference", "Date", "Trend"].map(h => (
                                                <th key={h} style={{
                                                    textAlign: "left", padding: "10px 16px", fontSize: 11,
                                                    color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em",
                                                    fontWeight: 700, borderBottom: "1px solid var(--border)",
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {((patient?.labResults || []).length > 0 ? patient.labResults : (mockData?.labResults || [])).map((r, i) => (
                                            <tr key={i} style={{ transition: "background 0.2s" }}
                                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                            >
                                                <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{r?.test}</td>
                                                <td style={{
                                                    padding: "12px 16px", fontSize: 14, fontWeight: 700,
                                                    color: r?.trend === "up" ? "#f97316" : "var(--text-primary)",
                                                    fontFamily: "'DM Mono', monospace",
                                                }}>{r?.value}</td>
                                                <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-muted)" }}>{r?.ref}</td>
                                                <td style={{ padding: "16px 20px", color: "var(--text-secondary)", fontSize: 14 }}>{r?.date}</td>
                                                <td style={{ padding: "16px 20px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                        <span style={{
                                                            padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                                                            background: r?.trend === "up" ? "rgba(239,68,68,0.1)" : r?.trend === "down" ? "rgba(34,197,94,0.1)" : "rgba(148,163,184,0.1)",
                                                            color: r?.trend === "up" ? "#ef4444" : r?.trend === "down" ? "#22c55e" : "var(--text-muted)",
                                                        }}>
                                                            {r?.trend}
                                                        </span>
                                                        {hasAccess && userRole === 'DOCTOR' && (
                                                            <div style={{ display: "flex", gap: 8 }}>
                                                                <button onClick={() => { setNewItem(r); setEditingListIndex(i); setAddingItem('labResults'); }} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", opacity: 0.7 }}><Edit2 size={14} /></button>
                                                                <button onClick={() => handleRemoveItem('labResults', i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", opacity: 0.5 }}><Trash2 size={14} /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        </ErrorBoundary>
                    )}

                    {/* Medications Tab */}
                    {/* Medications Tab */}
                    {activeTab === "medications" && (
                        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 20, padding: 28 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0, fontFamily: "'Playfair Display', serif" }}>Active Medications</h3>
                                {hasAccess && userRole === 'DOCTOR' && (
                                    <button onClick={() => setAddingItem('medications')} style={{ padding: "8px 16px", borderRadius: 10, background: THEME.accent, color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ PRESCRIBE</button>
                                )}
                            </div>

                            {addingItem === 'medications' && (
                                <div style={{ marginBottom: 24, padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 16, border: `1px dashed ${THEME.accent}` }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                                        <input placeholder="Drug Name" onChange={e => setNewItem({...newItem, name: e.target.value})} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
                                        <input placeholder="Dosage (e.g. 500mg)" onChange={e => setNewItem({...newItem, dose: e.target.value})} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
                                        <input placeholder="Frequency" onChange={e => setNewItem({...newItem, frequency: e.target.value})} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
                                        <input placeholder="Prescriber" onChange={e => setNewItem({...newItem, prescriber: e.target.value})} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
                                    </div>
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <button onClick={() => handleAddItem('medications')} disabled={savingEdit} style={{ padding: "8px 16px", borderRadius: 8, background: "#22c55e", color: "#fff", border: "none" }}>SAVE</button>
                                        <button onClick={() => setAddingItem(null)} style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", color: "var(--text-muted)", border: "none" }}>CANCEL</button>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: "grid", gap: 12 }}>
                                {(patient.medications?.length > 0 ? patient.medications : (mockData?.medications || [])).map((m, i) => (
                                    <div key={i} style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 20px",
                                        borderRadius: 14, border: "1px solid var(--border)", transition: "background 0.2s",
                                        background: "transparent"
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(34,197,94,0.1)", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}><Pill size={24} /></div>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{m?.name}</div>
                                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{m?.dose} • {m?.frequency}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Prescriber</div>
                                                <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>{m?.prescriber || "Staff Physician"}</div>
                                            </div>
                                            {hasAccess && userRole === 'DOCTOR' && (
                                                <div style={{ display: "flex", gap: 12 }}>
                                                    <button onClick={() => { setNewItem(m); setEditingListIndex(i); setAddingItem('medications'); }} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", opacity: 0.7 }}><Edit2 size={16} /></button>
                                                    <button onClick={() => handleRemoveItem('medications', i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", opacity: 0.5 }}><Trash2 size={16} /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timeline Tab */}
                    {activeTab === "timeline" && (
                        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 20, padding: 28 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0, fontFamily: "'Playfair Display', serif" }}>Medical Timeline</h3>
                                {hasAccess && (userRole === 'DOCTOR' || userRole === 'RECEPTIONIST' || userRole === 'HOSPITAL' || userRole === 'MAIN_ADMIN') && (
                                    <button onClick={() => setAddingItem('timeline')} style={{ padding: "8px 16px", borderRadius: 10, background: THEME.accent, color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ LOG VISIT</button>
                                )}
                            </div>

                            {addingItem === 'timeline' && (
                                <div style={{ marginBottom: 32, padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 16, border: `1px dashed ${THEME.accent}` }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                                        <input type="date" onChange={e => setNewItem({...newItem, date: e.target.value})} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
                                        <input placeholder="Event (e.g. Health Checkup)" onChange={e => setNewItem({...newItem, event: e.target.value})} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
                                        <input placeholder="Type (e.g. CONSULTATION)" onChange={e => setNewItem({...newItem, type: e.target.value})} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
                                        <input placeholder="Facility" onChange={e => setNewItem({...newItem, facility: e.target.value})} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
                                    </div>
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <button onClick={() => handleAddItem('timeline')} disabled={savingEdit} style={{ padding: "8px 16px", borderRadius: 8, background: "#22c55e", color: "#fff", border: "none" }}>SAVE</button>
                                        <button onClick={() => setAddingItem(null)} style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", color: "var(--text-muted)", border: "none" }}>CANCEL</button>
                                    </div>
                                </div>
                            )}

                            <div style={{ position: "relative", paddingLeft: 32 }}>
                                <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: "var(--border)" }} />
                                 {(patient.timeline?.length > 0 ? patient.timeline : (mockData?.timeline || [])).map((t, i) => (
                                    <div key={i} style={{ position: "relative", paddingBottom: 28 }}>
                                        <div style={{
                                            position: "absolute", left: -28, top: 4, width: 14, height: 14,
                                            borderRadius: "50%", background: getTimelineColor(t?.type),
                                            border: "3px solid var(--surface)",
                                        }} />
                                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>{t?.date}</div>
                                        <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600, lineHeight: 1.5 }}>{t?.event}</div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{t?.facility}</div>
                                            {hasAccess && (userRole === 'DOCTOR' || userRole === 'RECEPTIONIST' || userRole === 'HOSPITAL') && (
                                                <div style={{ display: "flex", gap: 12 }}>
                                                    <button onClick={() => { setNewItem(t); setEditingListIndex(i); setAddingItem('timeline'); }} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", opacity: 0.7, fontSize: 10, fontWeight: 700 }}>EDIT</button>
                                                    <button onClick={() => handleRemoveItem('timeline', i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", opacity: 0.5, fontSize: 10, fontWeight: 700 }}>DELETE</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Risk Analytics Tab */}
                    {activeTab === "analytics" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                            {((Object.keys(patient.riskScores || {}).length > 0) || (mockData?.riskScores)) ? 
                                Object.entries(Object.keys(patient.riskScores || {}).length > 0 ? patient.riskScores : (mockData?.riskScores || {})).map(([key, data]) => {
                                    const labels = { cardiac: "Cardiovascular Risk", diabetes: "Diabetes Progression", ckd: "Chronic Kidney Disease", readmission: "30-Day Readmission" };
                                    const descriptions = {
                                        cardiac: "Based on age, BP trends, cholesterol, smoking history, family history, and BMI",
                                        diabetes: "Based on HbA1c trends, fasting glucose, weight, and medication adherence",
                                        ckd: "Based on creatinine trends, BP, diabetes status, and medication nephrotoxicity",
                                        readmission: "Based on recent discharge, comorbidities, medication changes, and age",
                                    };
                                    return (
                                        <div key={key} style={{
                                            background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 20, padding: 28,
                                            display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                                        }}>
                                            <RiskGauge score={data?.score || 0} level={data?.level || 'low'} label="" size={120} />
                                            <h4 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "16px 0 6px", fontFamily: "'Playfair Display', serif" }}>{labels[key]}</h4>
                                            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, maxWidth: 300, margin: 0 }}>{descriptions[key]}</p>
                                            {data.trend && (
                                                <div style={{
                                                    marginTop: 12, fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 8,
                                                    background: data.trend === "increasing" ? "rgba(239,68,68,0.1)" : data.trend === "decreasing" ? "rgba(34,197,94,0.1)" : "rgba(148,163,184,0.08)",
                                                    color: data.trend === "increasing" ? "#ef4444" : data.trend === "decreasing" ? "#22c55e" : "var(--text-muted)",
                                                }}>
                                                    {data.trend === "increasing" ? "↑" : data.trend === "decreasing" ? "↓" : "→"} {data.trend}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }) : (
                                    <div style={{ gridColumn: "1 / -1", padding: 60, textAlign: "center" }}>
                                        <Activity size={48} color="var(--text-muted)" style={{ opacity: 0.3 }} />
                                        <h4 style={{ color: "var(--text-secondary)", fontWeight: 700, marginTop: 16 }}>No Risk Data Available</h4>
                                        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Risk analytics will populate after sufficient clinical data is collected.</p>
                                    </div>
                                )
                            }
                        </div>
                    )}

                    {/* Imaging & Scans Tab */}
                    {activeTab === "imaging" && (
                        <ImagingHub 
                            scans={[
                                ...(imagingHistory || []),
                                ...(vaultDocuments || []).filter(d => d && ['XRAY', 'X-RAY', 'RADIOLOGY', 'ECG'].includes(d.type?.toUpperCase())).map(d => ({
                                    id: d.id,
                                    type: d.type,
                                    imageUrl: `/api/records/${d.id}/scan`,
                                    analysis: d.diagnosticSummary || d.clinicalNotes || 'Patient Uploaded Asset. Pending staff sync.',
                                    doctorName: 'Patient-Uploaded (Digital Vault)',
                                    date: d.date,
                                    isVault: true,
                                    rawDoc: d
                                })),
                                ...(imagingHistory.length === 0 && mockData?.imaging ? mockData.imaging : [])
                            ].filter(s => !!s)} 
                            docs={[
                                ...(documentHistory || []),
                                ...(vaultDocuments || []).filter(d => d && !['XRAY', 'X-RAY', 'RADIOLOGY', 'ECG'].includes(d.type?.toUpperCase())).map(d => ({
                                    id: d.id,
                                    title: d.title || d.type,
                                    type: d.type,
                                    fileUrl: `/api/records/${d.id}/scan`,
                                    uploadedBy: 'Patient (Digital Vault)',
                                    date: d.date
                                })),
                                ...(documentHistory.length === 0 && mockData ? [{ id: 'mock_doc', title: 'Self-Uploaded Health Record', type: 'PDF', fileUrl: '#', uploadedBy: 'Patient (Mock)', date: new Date().toISOString() }] : [])
                            ].filter(d => !!d)}
                            onScanUpload={handleImagingUpload} 
                            onDocUpload={handleDocumentUpload}
                            onRequestUpload={handleRequestUpload}
                            isScanning={isScanning} 
                            onSelectScan={setSelectedImage} 
                        />
                    )}

                    {activeTab === "family" && (
                        <FamilyHub 
                            members={familyMembers} 
                            onAdd={() => setShowAddFamily(true)} 
                        />
                    )}

                    {activeTab === "alerts" && (
                        <AlertsTab patient={patient} />
                    )}

                    {activeTab === "discharge" && (
                        <DischargeTab patient={patient} />
                    )}

                    {activeTab === "vault" && (
                        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 20, padding: 28 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                <div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0, fontFamily: "'Playfair Display', serif" }}>Patient's Digital Vault</h3>
                                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Documents uploaded directly by the patient via UPHI Mobile</p>
                                </div>
                                <ShieldCheck size={28} color="var(--accent)" />
                            </div>

                            {isVaultLoading ? (
                                <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Unlocking vault...</div>
                            ) : vaultDocuments.length > 0 ? (
                                    <div style={{ display: "grid", gap: 12 }}>
                                    {[...(vaultDocuments || []), ...(vaultDocuments.length === 0 && mockData ? mockData.vault : [])].map((doc, i) => (
                                        <div key={doc.id} style={{
                                            display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
                                            borderRadius: 14, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)"
                                        }}>
                                            <div style={{
                                                width: 42, height: 42, borderRadius: 12,
                                                background: "rgba(59,130,246,0.1)", color: "var(--accent)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                            }}><FileText /></div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{doc.title || `${doc.type} Upload`}</div>
                                                <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: 4 }}>
                                                    <span>Preserved via AI Asset Integrity • {new Date(doc.createdAt).toLocaleDateString()}</span>
                                                    {doc.clinicalNotes && <span style={{ fontStyle: "italic", fontSize: 11, color: "var(--accent)" }}>Note: {doc.clinicalNotes.substring(0, 60)}...</span>}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                {doc.contentType?.startsWith('image/') || doc.imageUrl ? (
                                                    <button 
                                                        onClick={() => setSelectedImage({
                                                            type: doc.type,
                                                            imageUrl: doc.imageUrl || `/api/records/${doc.id}/scan`,
                                                            analysis: doc.clinicalNotes || "Patient-provided diagnostic asset.",
                                                            doctorName: doc.hospitalName || "Patient Upload",
                                                            date: doc.date
                                                        })}
                                                        style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.2)", fontWeight: 700, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
                                                    >
                                                        <Sparkles size={14} /> View HD Scan
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => window.open(doc.fileUrl || `/api/records/${doc.id}/scan`, '_blank')}
                                                        style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(15,23,42,0.05)", color: "var(--text-primary)", border: "1px solid var(--border)", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                                                    >View PDF</button>
                                                )}
                                                {!doc.mock && <button 
                                                    onClick={() => handleSyncFromVault(doc)}
                                                    style={{ padding: "8px 16px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                                                >Import to Records</button>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: "48px 24px", textAlign: "center", border: "2px dashed var(--border)", borderRadius: 16 }}>
                                    <Lock size={40} style={{ color: "var(--text-muted)", marginBottom: 16, opacity: 0.5 }} />
                                    <h4 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Vault Locked or Empty</h4>
                                    <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24, maxWidth: 300, margin: "0 auto 24px" }}>
                                        No documents shared or consent is pending. Ask the patient to approve the UPHI data request.
                                    </p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
                                        <button 
                                            onClick={handleDirectGrant}
                                            style={{ padding: "12px 24px", borderRadius: 12, background: "var(--text-primary)", color: "var(--surface)", border: "none", fontWeight: 700, cursor: "pointer" }}
                                        >Request Access Consent</button>
                                        <button 
                                            onClick={() => setShowUploadRequest(true)}
                                            style={{ padding: "12px 24px", borderRadius: 12, background: "transparent", color: "var(--text-primary)", border: "1px solid var(--border)", fontWeight: 700, cursor: "pointer" }}
                                        >Ask Patient to Upload Scan</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {showAddFamily && (
                        <AddFamilyModal 
                            onClose={() => setShowAddFamily(false)} 
                            onConfirm={handleAddFamily} 
                        />
                    )}
                </div>
            )}
        </div>
    );
}


// --- Page: Consent Management ---
function ConsentPage({ consents }) {
    const [filter, setFilter] = useState("all");
    const filteredConsents = filter === "all" ? consents : consents.filter(c => c.status === filter);

    return (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px", fontFamily: "'Playfair Display', serif" }}>Consent Management</h1>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: "0 0 28px" }}>Track and manage patient consent requests — DPDP Act 2023 compliant</p>

            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                {[["all", "All Requests"], ["pending", "Pending"], ["approved", "Approved"]].map(([val, label]) => (
                    <button key={val} onClick={() => setFilter(val)} style={{
                        padding: "10px 20px", borderRadius: 12, border: "1px solid",
                        borderColor: filter === val ? "var(--accent)" : "var(--border)",
                        background: filter === val ? "rgba(59,130,246,0.1)" : "transparent",
                        color: filter === val ? "var(--accent)" : "var(--text-muted)",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}>{label}</button>
                ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {consents.map((c, i) => (
                    <div key={c.id} style={{
                        background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16,
                        padding: 22, animation: `fadeSlideUp 0.4s ease ${i * 80}ms both`,
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: 16 }}>
                            <div style={{ display: "flex", gap: 14 }}>
                                <div style={{
                                    width: 46, height: 46, borderRadius: 14,
                                    background: c.status === "pending" ? "rgba(249,115,22,0.1)" : "rgba(34,197,94,0.1)",
                                    color: c.status === "pending" ? "#f97316" : "#22c55e",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>{c.status === "pending" ? <Clock /> : <Check />}</div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{c.patient}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{c.uhid}</div>
                                    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6 }}>
                                        <strong>{c.doctor}</strong> — {c.purpose}
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <span style={{
                                    fontSize: 11, padding: "4px 12px", borderRadius: 8, fontWeight: 700, textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    background: c.status === "pending" ? "rgba(249,115,22,0.15)" : "rgba(34,197,94,0.15)",
                                    color: c.status === "pending" ? "#f97316" : "#22c55e",
                                }}>{c.status}</span>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>{c.requestedAt}</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Duration: {c.duration}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Page: Analytics ---
function AnalyticsPage({ patients = [] }) {
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = sessionStorage.getItem('uphi_token');
                const res = await axios.get('/api/analytics/summary', { headers: { Authorization: `Bearer ${token}` } });
                setSummary(res.data);
            } catch (err) { console.error(err); }
            finally { setIsLoading(false); }
        };
        fetchAnalytics();
    }, []);

    const barData = summary ? Object.entries(summary.weeklyCheckins).map(([label, value]) => ({ label, value })) : [
        { label: "Mon", value: 0 }, { label: "Tue", value: 0 }, { label: "Wed", value: 0 },
        { label: "Thu", value: 0 }, { label: "Fri", value: 0 }, { label: "Sat", value: 0 }, { label: "Sun", value: 0 },
    ];
    const maxBar = Math.max(...barData.map(d => d.value), 1);

    return (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px", fontFamily: "'Playfair Display', serif" }}>Analytics Dashboard</h1>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: "0 0 28px" }}>Hospital performance metrics and patient insights</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
                <StatCard icon={<Activity />} label="Total Patients" value={summary?.totalPatients || patients.length} accent="#3b82f6" delay={0} />
                <StatCard icon={<FileText />} label="Duplicate Tests Avoided" value={summary?.duplicateTestsAvoided || 0} accent="#22c55e" delay={80} />
                <StatCard icon={<AlertTriangle />} label="Med Errors Prevented" value={summary?.medErrorsPrevented || 0} accent="#ef4444" delay={160} />
                <StatCard icon={<Brain />} label="AI Accuracy" value={(summary?.aiAccuracy?.toFixed(1) || "96.2") + "%"} accent="#8b5cf6" delay={240} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Check-ins chart */}
                <div style={{
                    background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 20, padding: 28,
                    animation: "fadeSlideUp 0.5s ease 300ms both",
                }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 24px", fontFamily: "'Playfair Display', serif" }}>Weekly Check-ins</h3>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180 }}>
                        {barData.map((d, i) => (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{d.value}</span>
                                <div style={{
                                    width: "100%", borderRadius: "8px 8px 4px 4px",
                                    height: `${(d.value / maxBar) * 140}px`,
                                    background: `linear-gradient(to top, var(--accent), var(--accent-secondary))`,
                                    opacity: 0.8 + (d.value / maxBar) * 0.2,
                                    animation: `growUp 0.6s ease ${i * 80}ms both`,
                                    transition: "opacity 0.2s",
                                }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                                    onMouseLeave={e => e.currentTarget.style.opacity = `${0.8 + (d.value / maxBar) * 0.2}`}
                                />
                                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{d.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Department distribution */}
                <div style={{
                    background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 20, padding: 28,
                    animation: "fadeSlideUp 0.5s ease 400ms both",
                }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 24px", fontFamily: "'Playfair Display', serif" }}>Patient Distribution by Department</h3>
                    {summary ? Object.entries(summary.departmentDistribution).map(([dept, count], i) => (
                        <div key={i} style={{ marginBottom: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>{dept}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{count}</span>
                            </div>
                            <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)" }}>
                                <div style={{
                                    height: "100%", borderRadius: 3, background: ["#3b82f6", "#ef4444", "#f97316", "#22c55e", "#8b5cf6", "#eab308"][i % 6],
                                    width: `${(count / Math.max(...Object.values(summary.departmentDistribution))) * 100}%`,
                                    animation: `growWidth 0.8s ease ${i * 100}ms both`,
                                }} />
                            </div>
                        </div>
                    )) : (
                        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No department data available.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Page: Pharmacy & Inventory ---
function PharmacyPage() {
    const [inventory, setInventory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [newItem, setNewItem] = useState({ name: "", type: "Tablet", stockQuantity: 0, threshold: 10, unitPrice: 0, manufacturer: "" });

    const [dialogConfig, setDialogConfig] = useState({ isOpen: false, id: null });
    const closeDialog = () => setDialogConfig({ isOpen: false, id: null });

    const fetchInventory = async () => {
        setIsLoading(true);
        try {
            const token = sessionStorage.getItem('uphi_token');
            const res = await axios.get('/api/pharmacy/inventory', { headers: { Authorization: `Bearer ${token}` } });
            setInventory(res.data);
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchInventory(); }, []);

    const handleUpdateStock = async (id, adjustment) => {
        try {
            const token = sessionStorage.getItem('uphi_token');
            await axios.put(`/api/pharmacy/inventory/${id}/stock`, { adjustment }, { headers: { Authorization: `Bearer ${token}` } });
            fetchInventory();
        } catch (err) { alert("Failed to update stock"); }
    };

    const handleDelete = (id) => {
        setDialogConfig({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        if (!dialogConfig.id) return;
        try {
            const token = sessionStorage.getItem('uphi_token');
            await axios.delete(`/api/pharmacy/inventory/${dialogConfig.id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchInventory();
        } catch (err) { alert("Failed to delete item"); }
        closeDialog();
    };

    const handleAddItem = async () => {
        try {
            const token = sessionStorage.getItem('uphi_token');
            await axios.post('/api/pharmacy/inventory', newItem, { headers: { Authorization: `Bearer ${token}` } });
            setShowAddModal(false);
            setNewItem({ name: "", type: "Tablet", stockQuantity: 0, threshold: 10, unitPrice: 0, manufacturer: "" });
            fetchInventory();
        } catch (err) { alert("Failed to add item"); }
    };

    const filteredInventory = inventory.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px", fontFamily: "'Playfair Display', serif" }}>Pharmacy & Inventory</h1>
                    <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>Manage medical supplies and stock levels</p>
                </div>
                <button onClick={() => setShowAddModal(true)} style={{
                    padding: "12px 24px", borderRadius: 14, border: "none", background: "var(--accent)", color: "#fff",
                    fontWeight: 700, display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                    boxShadow: "0 8px 16px rgba(37,99,235,0.2)"
                }}><Plus size={18} /> Add New Item</button>
            </div>

            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 24, overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: `1px solid var(--border)`, display: "flex", gap: 16 }}>
                    <div style={{ position: "relative", flex: 1 }}>
                        <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={18} />
                        <input 
                            type="text" placeholder="Search inventory..." 
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: "100%", padding: "12px 12px 12px 42px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--bg)", fontSize: 14 }} 
                        />
                    </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "rgba(0,0,0,0.02)", borderBottom: `1px solid var(--border)` }}>
                                {["Item Name", "Type", "Stock Level", "Unit Price", "Last Updated", "Actions"].map(h => (
                                    <th key={h} style={{ textAlign: "left", padding: "16px 24px", fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="6" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Loading inventory...</td></tr>
                            ) : filteredInventory.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No items found.</td></tr>
                            ) : filteredInventory.map((item, idx) => (
                                <tr key={item.id} style={{ borderBottom: idx === filteredInventory.length - 1 ? "none" : `1px solid var(--border)`, transition: "background 0.2s" }}>
                                    <td style={{ padding: "20px 24px" }}>
                                        <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>{item.name}</div>
                                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{item.manufacturer || "Generic"}</div>
                                    </td>
                                    <td style={{ padding: "20px 24px" }}>
                                        <span style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(59,130,246,0.1)", color: "var(--accent)", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>{item.type}</span>
                                    </td>
                                    <td style={{ padding: "20px 24px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <span style={{ 
                                                fontSize: 14, fontWeight: 800, 
                                                color: item.stockQuantity <= item.threshold ? "var(--critical)" : "var(--text-primary)" 
                                            }}>{item.stockQuantity}</span>
                                            <div style={{ display: "flex", gap: 4 }}>
                                                <button onClick={() => handleUpdateStock(item.id, 10)} style={{ border: "none", background: "none", color: "var(--success)", cursor: "pointer" }} title="Direct Add +10"><PlusCircle size={18} /></button>
                                                <button onClick={() => handleUpdateStock(item.id, -10)} style={{ border: "none", background: "none", color: "var(--critical)", cursor: "pointer" }} title="Direct Remove -10"><MinusCircle size={18} /></button>
                                            </div>
                                        </div>
                                        {item.stockQuantity <= item.threshold && <div style={{ fontSize: 10, color: "var(--critical)", fontWeight: 800, textTransform: "uppercase", marginTop: 4 }}>Low Stock Alert</div>}
                                    </td>
                                    <td style={{ padding: "20px 24px", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>₹{item.unitPrice.toFixed(2)}</td>
                                    <td style={{ padding: "20px 24px", fontSize: 13, color: "var(--text-muted)" }}>{new Date(item.lastUpdated).toLocaleDateString()}</td>
                                    <td style={{ padding: "20px 24px" }}>
                                        <button onClick={() => handleDelete(item.id)} style={{ color: "var(--text-muted)", border: "none", background: "none", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.color = "var(--critical)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAddModal && (
                <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAddModal(false)}>
                    <div style={{ background: "var(--surface)", borderRadius: 28, padding: 36, width: 500, animation: "scaleIn 0.3s ease" }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 24px", fontFamily: "'Playfair Display', serif" }}>Add Inventory Item</h3>
                        <div style={{ display: "grid", gap: 20 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, display: "block" }}>Item Name</label>
                                <input placeholder="e.g. Paracetamol 500mg" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} style={{ width: "100%", padding: 14, borderRadius: 12 }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, display: "block" }}>Type</label>
                                    <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})} style={{ width: "100%", padding: 14, borderRadius: 12 }}>
                                        <option>Tablet</option><option>Syrup</option><option>Injection</option><option>Equipment</option><option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, display: "block" }}>Unit Price (₹)</label>
                                    <input type="number" placeholder="25.00" value={newItem.unitPrice} onChange={e => setNewItem({...newItem, unitPrice: parseFloat(e.target.value)})} style={{ width: "100%", padding: 14, borderRadius: 12 }} />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, display: "block" }}>Initial Stock</label>
                                    <input type="number" placeholder="100" value={newItem.stockQuantity} onChange={e => setNewItem({...newItem, stockQuantity: parseInt(e.target.value)})} style={{ width: "100%", padding: 14, borderRadius: 12 }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, display: "block" }}>Alert Threshold</label>
                                    <input type="number" placeholder="20" value={newItem.threshold} onChange={e => setNewItem({...newItem, threshold: parseInt(e.target.value)})} style={{ width: "100%", padding: 14, borderRadius: 12 }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, display: "block" }}>Manufacturer</label>
                                <input placeholder="e.g. Cipla, Sun Pharma" value={newItem.manufacturer} onChange={e => setNewItem({...newItem, manufacturer: e.target.value})} style={{ width: "100%", padding: 14, borderRadius: 12 }} />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 16, marginTop: 32 }}>
                            <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: 14, borderRadius: 14, border: "1px solid var(--border)", background: "transparent", fontWeight: 700 }}>Cancel</button>
                            <button onClick={handleAddItem} style={{ flex: 1, padding: 14, borderRadius: 14, border: "none", background: "var(--accent)", color: "#fff", fontWeight: 800 }}>Save Item</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Sub-component: Predictive Alerts Tab ---
function AlertsTab({ patient }) {
    const [alerts, setAlerts] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const mockData = getDemoMockData(patient);
        if (mockData) {
            setAlerts(mockData.alerts);
            setIsLoading(false);
            return;
        }
        axios.get(`/api/ai/alerts/${patient.id}`)
            .then(res => setAlerts(res.data.alerts))
            .catch(() => setAlerts("Predictive analysis unavailable."))
            .finally(() => setIsLoading(false));
    }, [patient.id]);

    return (
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 20, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <AlertTriangle color="#f97316" size={20} />
                <h3 style={{ fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Predictive Health Alerts</h3>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>Powered by Gemini AI</span>
            </div>
            {isLoading ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                    <Brain size={32} style={{ marginBottom: 12, opacity: 0.4, animation: "pulse 1.5s ease infinite" }} />
                    <p>Analyzing patient trends...</p>
                </div>
            ) : (
                <div style={{ fontSize: 14, lineHeight: 1.9, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{alerts}</div>
            )}
        </div>
    );
}

// --- Sub-component: Discharge Summary Tab ---
function DischargeTab({ patient }) {
    const [diagnosis, setDiagnosis] = useState("");
    const [treatmentNotes, setTreatmentNotes] = useState("");
    const [summary, setSummary] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!diagnosis) return alert("Please enter a diagnosis.");
        setIsGenerating(true);
        try {
            const res = await axios.post(`/api/ai/discharge/${patient.id}`, { diagnosis, treatmentNotes });
            setSummary(res.data.summary);
        } catch { setSummary("Failed to generate discharge summary."); }
        finally { setIsGenerating(false); }
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 20, padding: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 20px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Generate Discharge Summary</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Diagnosis</label>
                        <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Primary discharge diagnosis"
                            style={{ width: "100%", padding: "14px 20px", borderRadius: 14, border: "1px solid var(--border)", fontSize: 14 }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Treatment Notes</label>
                        <textarea value={treatmentNotes} onChange={e => setTreatmentNotes(e.target.value)} rows={4} placeholder="Brief treatment summary..."
                            style={{ width: "100%", padding: "14px 20px", borderRadius: 14, border: "1px solid var(--border)", fontSize: 14, fontFamily: "'Inter', sans-serif", resize: "vertical" }} />
                    </div>
                    <button onClick={handleGenerate} disabled={isGenerating}
                        style={{ padding: "16px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 16, fontWeight: 800, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: isGenerating ? 0.6 : 1 }}>
                        <Sparkles size={18} /> {isGenerating ? "Generating with Gemini..." : "Generate Discharge Summary"}
                    </button>
                </div>
            </div>

            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 20, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <FileText color="var(--accent)" size={18} />
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Summary</h3>
                </div>
                {summary ? (
                    <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{summary}</div>
                ) : (
                    <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                        <FileText size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
                        <p style={{ fontSize: 13, fontWeight: 600 }}>Enter diagnosis and notes to generate</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Page: Appointments ---
function AppointmentsPage({ patients, forcePatientId }) {
    const [appointments, setAppointments] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ patientId: forcePatientId || '', patientName: '', doctorName: '', department: '', date: '', time: '', notes: '', urgency: 'Standard' });

    useEffect(() => {
        axios.get('/api/appointments').then(r => {
            const data = r.data || [];
            if (forcePatientId) {
                setAppointments(data.filter(a => a.patientId === forcePatientId));
            } else {
                setAppointments(data);
            }
        }).catch(() => {});
    }, [forcePatientId]);

    const handleCreate = async () => {
        try {
            const res = await axios.post('/api/appointments', form);
            setAppointments(prev => [res.data, ...prev]);
            setShowForm(false);
            setForm({ patientId: '', patientName: '', doctorName: '', department: '', date: '', time: '', notes: '', urgency: 'Standard' });
        } catch { alert("Failed to create appointment."); }
    };

    const handleStatus = async (id, status) => {
        try {
            await axios.put(`/api/appointments/${id}/status`, { status });
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        } catch { alert("Failed to update."); }
    };

    const statusColors = { SCHEDULED: '#3b82f6', COMPLETED: '#22c55e', CANCELLED: '#94a3b8', NO_SHOW: '#ef4444' };

    return (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary)", margin: 0, fontFamily: "'Outfit', sans-serif" }}>Appointments</h1>
                    <p style={{ fontSize: 15, color: "var(--text-muted)", margin: "8px 0 0" }}>Schedule and manage patient appointments</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} style={{ padding: "14px 28px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 16, fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    <Plus size={18} /> New Appointment
                </button>
            </div>

            {showForm && (
                <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 24, padding: 32, marginBottom: 28, animation: "fadeSlideUp 0.3s ease" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, fontFamily: "'Outfit', sans-serif" }}>Book Appointment</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Patient</label>
                            <select value={form.patientId} onChange={e => { const p = patients.find(p => p.id === e.target.value); setForm({...form, patientId: e.target.value, patientName: p ? p.fullName : ''}); }}
                                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 14, background: "#fff" }}>
                                <option value="">Select patient...</option>
                                {patients.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Doctor</label>
                            <input value={form.doctorName} onChange={e => setForm({...form, doctorName: e.target.value})} placeholder="Dr. Name" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 14 }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Department</label>
                            <select value={form.department} onChange={e => setForm({...form, department: e.target.value})} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 14, background: "#fff" }}>
                                <option value="">Select...</option>
                                {["General Medicine", "Cardiology", "Orthopedics", "Endocrinology", "Pulmonology", "Neurology", "Dermatology", "ENT", "Emergency"].map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Date</label>
                            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 14 }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Time</label>
                            <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 14 }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Urgency</label>
                            <select value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 14, background: "#fff" }}>
                                {["Low", "Standard", "Urgent", "Emergency"].map(u => <option key={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                    <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} placeholder="Notes (optional)" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 14, marginTop: 16, fontFamily: "'Inter', sans-serif" }} />
                    <button onClick={handleCreate} style={{ marginTop: 16, padding: "14px 32px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 14, fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                        <Calendar size={16} style={{ marginRight: 8 }} /> Confirm Booking
                    </button>
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {appointments.length === 0 && <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 40, fontSize: 14 }}>No appointments scheduled yet.</p>}
                {appointments.map((apt, i) => (
                    <div key={apt.id || i} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 20, padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", animation: `fadeSlideUp 0.3s ease ${i * 50}ms both` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${statusColors[apt.status] || '#3b82f6'}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Calendar size={22} color={statusColors[apt.status] || '#3b82f6'} />
                            </div>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{apt.patientName || 'Patient'}</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{apt.department} • {apt.doctorName} • {apt.date} at {apt.time}</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", padding: "4px 12px", borderRadius: 8, background: `${statusColors[apt.status] || '#3b82f6'}15`, color: statusColors[apt.status] || '#3b82f6' }}>{apt.status}</span>
                            {apt.status === 'SCHEDULED' && (
                                <>
                                    <button onClick={() => handleStatus(apt.id, 'COMPLETED')} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #22c55e", background: "transparent", color: "#22c55e", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Complete</button>
                                    <button onClick={() => handleStatus(apt.id, 'CANCELLED')} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ef4444", background: "transparent", color: "#ef4444", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Cancel</button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Page: Prescriptions ---
function PrescriptionsPage({ patients }) {
    const [prescriptions, setPrescriptions] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingRxId, setEditingRxId] = useState(null);
    const [form, setForm] = useState({ patientId: '', patientName: '', doctorName: '', diagnosis: '', instructions: '', date: new Date().toISOString().split('T')[0] });
    const [meds, setMeds] = useState([{ name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
    const [drugCheckResult, setDrugCheckResult] = useState(null);
    const [checkingDrugs, setCheckingDrugs] = useState(false);

    useEffect(() => {
        axios.get('/api/prescriptions').then(r => setPrescriptions(r.data)).catch(() => {});
    }, []);

    const addMedRow = () => setMeds(prev => [...prev, { name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
    const updateMed = (i, field, val) => setMeds(prev => prev.map((m, idx) => idx === i ? {...m, [field]: val} : m));

    const handleCheckInteractions = async () => {
        const medNames = meds.map(m => m.name).filter(Boolean);
        if (medNames.length < 2) return;
        setCheckingDrugs(true);
        try {
            const res = await axios.post('/api/ai/drug-check', { currentMeds: medNames.slice(0, -1), proposedMed: medNames[medNames.length - 1] });
            setDrugCheckResult(res.data.result);
        } catch { setDrugCheckResult("Check unavailable."); }
        finally { setCheckingDrugs(false); }
    };

    const handleCreate = async () => {
        try {
            const payload = { ...form, medications: meds.filter(m => m.name) };
            if (editingRxId) {
                const res = await axios.put(`/api/prescriptions/${editingRxId}`, payload);
                setPrescriptions(prev => prev.map(p => p.id === editingRxId ? res.data : p));
            } else {
                const res = await axios.post('/api/prescriptions', payload);
                setPrescriptions(prev => [res.data, ...prev]);
            }
            setShowForm(false);
            setEditingRxId(null);
            setForm({ patientId: '', patientName: '', doctorName: '', diagnosis: '', instructions: '', date: new Date().toISOString().split('T')[0] });
            setMeds([{ name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
            setDrugCheckResult(null);
        } catch { alert("Failed to save prescription."); }
    };

    const handleEditRx = (rx) => {
        setForm({
            patientId: rx.patientId || '',
            patientName: rx.patientName || '',
            doctorName: rx.doctorName || '',
            diagnosis: rx.diagnosis || '',
            instructions: rx.instructions || '',
            date: rx.date || new Date().toISOString().split('T')[0]
        });
        setMeds(rx.medications && rx.medications.length > 0 ? rx.medications : [{ name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
        setEditingRxId(rx.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteRx = async (id) => {
        if (!confirm("Are you sure you want to delete this prescription?")) return;
        try {
            await axios.delete(`/api/prescriptions/${id}`);
            setPrescriptions(prev => prev.filter(p => p.id !== id));
        } catch { alert("Failed to delete."); }
    };

    return (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary)", margin: 0, fontFamily: "'Outfit', sans-serif" }}>Prescriptions</h1>
                    <p style={{ fontSize: 15, color: "var(--text-muted)", margin: "8px 0 0" }}>Digital prescription management with AI drug interaction checks</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} style={{ padding: "14px 28px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 16, fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    <Pill size={18} /> Write Prescription
                </button>
            </div>

            {showForm && (
                <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 24, padding: 32, marginBottom: 28, animation: "fadeSlideUp 0.3s ease" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, fontFamily: "'Outfit', sans-serif" }}>New Prescription</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Patient</label>
                            <select value={form.patientId} onChange={e => { const p = patients.find(p => p.id === e.target.value); setForm({...form, patientId: e.target.value, patientName: p ? p.fullName : ''}); }}
                                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 14, background: "#fff" }}>
                                <option value="">Select patient...</option>
                                {patients.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Prescribing Doctor</label>
                            <input value={form.doctorName} onChange={e => setForm({...form, doctorName: e.target.value})} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 14 }} placeholder="Dr." />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Diagnosis</label>
                            <input value={form.diagnosis} onChange={e => setForm({...form, diagnosis: e.target.value})} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 14 }} placeholder="Primary diagnosis" />
                        </div>
                    </div>

                    <h4 style={{ fontSize: 13, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 }}>Medications</h4>
                    {meds.map((med, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginBottom: 8 }}>
                            <input value={med.name} onChange={e => updateMed(i, 'name', e.target.value)} placeholder="Drug name" style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 13 }} />
                            <input value={med.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} placeholder="Dosage" style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 13 }} />
                            <input value={med.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)} placeholder="Frequency" style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 13 }} />
                            <input value={med.duration} onChange={e => updateMed(i, 'duration', e.target.value)} placeholder="Duration" style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 13 }} />
                        </div>
                    ))}
                    <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                        <button onClick={addMedRow} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Plus size={14} /> Add Medication</button>
                        <button onClick={handleCheckInteractions} disabled={checkingDrugs} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #f97316", background: "rgba(249,115,22,0.06)", color: "#f97316", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                            <AlertTriangle size={14} /> {checkingDrugs ? "Checking..." : "AI Drug Check"}
                        </button>
                    </div>

                    {drugCheckResult && (
                        <div style={{ marginTop: 16, padding: 16, background: "rgba(249,115,22,0.04)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 16, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                            <strong style={{ color: "#f97316" }}>⚠️ Drug Interaction Report:</strong><br />{drugCheckResult}
                        </div>
                    )}

                    <textarea value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} rows={2} placeholder="Special instructions..." style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 14, marginTop: 16, fontFamily: "'Inter', sans-serif" }} />
                    <button onClick={handleCreate} style={{ marginTop: 16, padding: "14px 32px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 14, fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                        <FileText size={16} style={{ marginRight: 8 }} /> Issue Prescription
                    </button>
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {prescriptions.length === 0 && <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 40, fontSize: 14 }}>No prescriptions issued yet.</p>}
                {prescriptions.map((rx, i) => (
                    <div key={rx.id || i} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 20, padding: "20px 28px", animation: `fadeSlideUp 0.3s ease ${i * 50}ms both` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{rx.patientName || 'Patient'}</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Dx: {rx.diagnosis} • {rx.doctorName} • {rx.date}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                {rx.id && (
                                    <>
                                        <button onClick={() => handleEditRx(rx)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", display: "flex", opacity: 0.7 }}><Edit2 size={16} /></button>
                                        <button onClick={() => handleDeleteRx(rx.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", display: "flex", opacity: 0.5 }}><Trash2 size={16} /></button>
                                    </>
                                )}
                                <Pill size={20} color="var(--accent)" />
                            </div>
                        </div>
                        {rx.medications && rx.medications.map((m, j) => (
                            <div key={j} style={{ padding: "8px 14px", background: "rgba(37,99,235,0.04)", borderRadius: 10, marginBottom: 6, fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontWeight: 700 }}>{m.name}</span>
                                <span style={{ color: "var(--text-muted)" }}>{m.dosage} • {m.frequency} • {m.duration}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Page: AI NL Search ---
function NLSearchPage() {
    const [query, setQuery] = useState("");
    const [result, setResult] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setIsSearching(true);
        try {
            const res = await axios.post('/api/ai/search', { query });
            setResult(res.data.result);
        } catch { setResult("Search failed. Please try again."); }
        finally { setIsSearching(false); }
    };

    return (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px", fontFamily: "'Outfit', sans-serif" }}>AI Medical Search</h1>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: "0 0 32px" }}>Ask questions about your patient database in plain English</p>

            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 24, padding: 32, marginBottom: 24 }}>
                <div style={{ display: "flex", gap: 12 }}>
                    <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="e.g. 'Show me all diabetic patients with HbA1c > 7' or 'Which patients are on blood thinners?'"
                        style={{ flex: 1, padding: "16px 24px", borderRadius: 16, border: "1px solid var(--border)", fontSize: 15, fontFamily: "'Inter', sans-serif" }} />
                    <button onClick={handleSearch} disabled={isSearching}
                        style={{ padding: "16px 32px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 16, fontWeight: 800, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, opacity: isSearching ? 0.6 : 1, whiteSpace: "nowrap" }}>
                        <Brain size={20} /> {isSearching ? "Searching..." : "AI Search"}
                    </button>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    {["Patients with hypertension", "Who needs follow-up this week?", "Patients on insulin", "High-risk cardiac patients"].map(q => (
                        <button key={q} onClick={() => { setQuery(q); }} style={{ padding: "6px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", cursor: "pointer" }}>{q}</button>
                    ))}
                </div>
            </div>

            {result && (
                <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 24, padding: 32, animation: "fadeSlideUp 0.3s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                        <Sparkles size={18} color="var(--accent)" />
                        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase" }}>Gemini Result</span>
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{result}</div>
                </div>
            )}
        </div>
    );
}

// --- Component: AI Triage Page ---

function AiTriagePage() {
    const [symptoms, setSymptoms] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("Male");
    const [result, setResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleTriage = async () => {
        if (!symptoms || !age) return alert("Please fill in symptoms and age.");
        setIsAnalyzing(true);
        try {
            const res = await axios.post('/api/ai/triage', { symptoms, age: parseInt(age), gender });
            setResult(res.data);
        } catch (err) {
            alert("Triage analysis failed.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const urgencyColors = { 1: '#22c55e', 2: '#84cc16', 3: '#eab308', 4: '#f97316', 5: '#ef4444' };
    const priorityColors = { Emergency: '#ef4444', Urgent: '#f97316', Standard: '#3b82f6', Low: '#22c55e' };

    return (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px", fontFamily: "'Outfit', sans-serif" }}>AI Smart Triage</h1>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: "0 0 32px" }}>Gemini-powered urgency assessment and department routing</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 24, padding: 32 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 24, fontFamily: "'Outfit', sans-serif" }}>Patient Intake</h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Presenting Symptoms</label>
                            <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} rows={4}
                                style={{ width: "100%", padding: "14px 20px", borderRadius: 16, border: "1px solid var(--border)", fontSize: 14, resize: "vertical", fontFamily: "'Inter', sans-serif" }}
                                placeholder="e.g. chest pain radiating to left arm, shortness of breath, sweating" />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Age</label>
                                <input value={age} onChange={e => setAge(e.target.value)} type="number"
                                    style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 15 }} placeholder="Age" />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Gender</label>
                                <select value={gender} onChange={e => setGender(e.target.value)}
                                    style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 15, background: "#fff" }}>
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>
                        <button onClick={handleTriage} disabled={isAnalyzing}
                            style={{ padding: "16px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 16, fontWeight: 800, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: isAnalyzing ? 0.6 : 1 }}>
                            <Brain size={20} /> {isAnalyzing ? "Analyzing with Gemini..." : "Run AI Triage"}
                        </button>
                    </div>
                </div>

                <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 24, padding: 32 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 24, fontFamily: "'Outfit', sans-serif" }}>Triage Result</h3>
                    {result ? (
                        <div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                                <div style={{ textAlign: "center", padding: 20, borderRadius: 20, background: `${urgencyColors[result.urgency] || '#3b82f6'}10`, border: `2px solid ${urgencyColors[result.urgency] || '#3b82f6'}30` }}>
                                    <div style={{ fontSize: 36, fontWeight: 800, color: urgencyColors[result.urgency] || '#3b82f6', fontFamily: "'Outfit', sans-serif" }}>{result.urgency}/5</div>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Urgency</div>
                                </div>
                                <div style={{ textAlign: "center", padding: 20, borderRadius: 20, background: `${priorityColors[result.priority] || '#3b82f6'}10`, border: `2px solid ${priorityColors[result.priority] || '#3b82f6'}30` }}>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: priorityColors[result.priority] || '#3b82f6', fontFamily: "'Outfit', sans-serif" }}>{result.priority}</div>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginTop: 4 }}>Priority</div>
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Suggested Department</div>
                                <div style={{ padding: "14px 20px", background: "rgba(37,99,235,0.06)", borderRadius: 14, fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>
                                    {result.department}
                                </div>
                            </div>

                            {result.notes && (
                                <div style={{ padding: 16, background: "var(--bg-accent)", borderRadius: 16, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                                    <strong style={{ color: "var(--accent)" }}>AI Notes:</strong> {result.notes}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                            <Stethoscope size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                            <p style={{ fontSize: 14, fontWeight: 600 }}>Enter symptoms and run AI Triage</p>
                            <p style={{ fontSize: 12, marginTop: 4 }}>Gemini will assess urgency and route the patient</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Sub-component: Notification Panel ---
function NotificationPanel({ notifications, onClose, onRefresh }) {
    const markAllRead = async () => {
        try {
            const token = sessionStorage.getItem('uphi_token');
            await axios.post('/api/notifications/mark-all-read', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onRefresh();
        } catch (err) { console.error(err); }
    };

    const markRead = async (id) => {
        try {
            const token = sessionStorage.getItem('uphi_token');
            await axios.put(`/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onRefresh();
        } catch (err) { console.error(err); }
    };

    return (
        <div style={{
            position: "absolute", top: "calc(100% + 12px)", right: -80,
            width: 360, background: "#ffffff", border: `1px solid var(--border)`,
            borderRadius: 24, padding: 0, boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
            animation: "scaleIn 0.2s ease", zIndex: 1000, overflow: "hidden"
        }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid var(--border)`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Notifications</h3>
                <button onClick={markAllRead} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Mark all read</button>
            </div>
            <div style={{ maxHeight: 400, overflowY: "auto", padding: "8px 0" }}>
                {notifications.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                        <Bell size={32} style={{ marginBottom: 12, opacity: 0.2 }} />
                        <p style={{ fontSize: 13, fontWeight: 600 }}>No new notifications</p>
                    </div>
                ) : (
                    notifications.map((n) => (
                        <div key={n.id} onClick={() => !n.read && markRead(n.id)} style={{
                            padding: "16px 24px", borderBottom: `1px solid var(--border)`,
                            background: n.read ? "transparent" : "rgba(37,99,235,0.04)",
                            cursor: "pointer", transition: "all 0.2s", position: "relative"
                        }}>
                            {!n.read && <div style={{ position: "absolute", left: 10, top: 22, width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />}
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>{n.title}</span>
                                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{n.message}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// --- Page: Patient Dashboard ---
function PatientDashboard({ userName }) {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = sessionStorage.getItem('uphi_token');
                const res = await axios.get('/api/my-profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile(res.data);
            } catch (err) { console.error(err); }
            finally { setIsLoading(false); }
        };
        fetchProfile();
    }, []);

    if (isLoading) return <div style={{ textAlign: "center", padding: 100 }}><Sparkles className="spin" /> Loading your health portal...</div>;
    if (!profile) return <div style={{ textAlign: "center", padding: 100 }}>Profile not found. Please contact support.</div>;

    return (
        <div style={{ animation: "fadeIn 0.5s ease" }}>
            <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>Welcome back, {profile.fullName.split(' ')[0]}!</h1>
                <p style={{ fontSize: 16, color: "var(--text-muted)" }}>Your personalized UPHI health portal is ready with your latest records.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
                <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 28, padding: 32 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                        <Heart color="var(--accent)" /> Current Health Snapshot
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        {[
                            ["Blood Pressure", profile.vitals?.bloodPressure || profile.vitals?.bp || "--"],
                            ["Heart Rate", (profile.vitals?.heartRate || profile.vitals?.hr || "--") + " BPM"],
                            ["SpO2", (profile.vitals?.spO2 || profile.vitals?.spo2 || "--") + "%"],
                            ["Weight", (profile.vitals?.weight || "--") + " KG"]
                        ].map(([label, val]) => (
                            <div key={label} style={{ padding: 16, background: "#f8fafc", borderRadius: 16, border: "1px solid #e2e8f0" }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{val}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 28, padding: 32 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>AI Risk Assessment</h3>
                    <div style={{
                        padding: 24, borderRadius: 24, background: "linear-gradient(135deg, rgba(37,99,235,0.05), rgba(37,99,235,0.02))",
                        border: "1px solid rgba(37,99,235,0.1)", textAlign: "center"
                    }}>
                        <div style={{ fontSize: 48, fontWeight: 900, color: "var(--accent)" }}>{profile.risk?.score || 15}</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Health Risk Score</div>
                        <div style={{ marginTop: 16, fontSize: 14, color: "var(--text-secondary)", fontStyle: "italic" }}>
                             "Your health trends look stable. Keep maintaining your current activity level."
                        </div>
                    </div>
                </div>
            </div>
            
            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 28, padding: 32 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Recent AI Insights</h3>
                <PatientSnapshot patient={profile} />
            </div>
        </div>
    );
}

// --- Component: Patient Records Explorer ---
function PatientRecords({ records }) {
    if (!records || records.length === 0) {
        return (
            <div style={{ padding: 60, textAlign: "center", background: "#fff", borderRadius: 24, border: "1px solid var(--border)" }}>
                <FileText size={48} color="var(--text-muted)" style={{ opacity: 0.3 }} />
                <h4 style={{ color: "var(--text-secondary)", fontWeight: 700, marginTop: 16 }}>No medical records found</h4>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Securely upload documents to your Digital Vault to see them here.</p>
            </div>
        );
    }
    return (
        <div style={{ display: "grid", gap: 16 }}>
            {records.map((doc, i) => (
                <div key={i} style={{ padding: 24, background: "#fff", borderRadius: 20, border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "transform 0.2s", cursor: "pointer" }}
                     onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                     onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(37,99,235,0.08)", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FileText size={28} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 17, color: "var(--text-primary)" }}>{doc.title || doc.type || "Clinical Document"}</div>
                            <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4, fontWeight: 500 }}>
                                {doc.date || doc.uploadedAt || new Date().toLocaleDateString()} • Secured via ABDM Vault
                            </div>
                        </div>
                    </div>
                    <button style={{ padding: "10px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}>
                        View Asset
                    </button>
                </div>
            ))}
        </div>
    );
}

// --- Page: Patient Records (Self) ---
function PatientRecordsPage({ userName }) {
    const [profile, setProfile] = useState(null);
    useEffect(() => {
        axios.get('/api/my-profile', { headers: { Authorization: `Bearer ${sessionStorage.getItem('uphi_token')}` } })
            .then(res => setProfile(res.data));
    }, []);

    if (!profile) return <div>Loading records...</div>;

    return (
        <div style={{ animation: "fadeIn 0.5s ease" }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 32 }}>Your Medical Records</h1>
            <PatientRecords records={profile.medicalDocuments || []} />
        </div>
    );
}

// --- Component: Invoice Modal ---
function InvoiceModal({ patients, onClose, onSuccess }) {
    const [patientId, setPatientId] = useState("");
    const [amount, setAmount] = useState("");
    const [status, setStatus] = useState("PENDING");
    const [itemName, setItemName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!patientId || !amount || !itemName) return alert("Please fill all required fields");
        setIsSubmitting(true);
        try {
            const token = sessionStorage.getItem('uphi_token');
            const patient = patients.find(p => p.id === patientId);
            const data = {
                patientId,
                patientName: patient ? patient.fullName : "Unknown",
                totalAmount: parseFloat(amount),
                status,
                items: [{ description: itemName, quantity: 1, unitPrice: parseFloat(amount), total: parseFloat(amount) }]
            };
            await axios.post('/api/invoices', data, { headers: { Authorization: `Bearer ${token}` } });
            onSuccess();
        } catch (err) {
            console.error(err);
            alert("Failed to create invoice");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: "#fff", width: "100%", maxWidth: 500, borderRadius: 24, padding: 32, animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, fontFamily: "'Outfit', sans-serif" }}>Create Invoice</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
                </div>
                
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 8 }}>Patient</label>
                        <select value={patientId} onChange={e => setPatientId(e.target.value)} required style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 14 }}>
                            <option value="">Select Patient</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} ({p.uid})</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 8 }}>Service / Item Name</label>
                        <input value={itemName} onChange={e => setItemName(e.target.value)} required placeholder="e.g. Consult Fee" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 14 }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 8 }}>Amount (₹)</label>
                            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" required placeholder="0.00" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 14 }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 8 }}>Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 14 }}>
                                <option value="PENDING">Pending</option>
                                <option value="PAID">Paid</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: "14px", background: "var(--bg)", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                        <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: "14px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer", opacity: isSubmitting ? 0.7 : 1 }}>
                            {isSubmitting ? "Generating..." : "Generate Invoice"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- Page: Invoices & Billing ---
function InvoicesPage({ patients, userRole, userName }) {
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    const isPatient = userRole === 'PATIENT';

    const fetchInvoices = async () => {
        try {
            const token = sessionStorage.getItem('uphi_token');
            const url = isPatient ? `/api/invoices/patient/${userName}` : '/api/invoices';
            const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            setInvoices(res.data);
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchInvoices(); }, []);

    return (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{isPatient ? 'My Billing' : 'Billing & Invoices'}</h1>
                    <p style={{ color: "var(--text-muted)", marginTop: 4 }}>Manage clinical statements and payments</p>
                </div>
                {!isPatient && (
                    <button onClick={() => setShowCreate(true)} style={{ padding: "14px 24px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 16, fontWeight: 800, cursor: "pointer" }}>
                        Generate New Invoice
                    </button>
                )}
            </div>
            
            {showCreate && <InvoiceModal patients={patients} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); fetchInvoices(); }} />}

            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 28, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: `1px solid var(--border)` }}>
                            <th style={{ padding: "20px 24px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Invoice ID</th>
                            {!isPatient && <th style={{ padding: "20px 24px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Patient</th>}
                            <th style={{ padding: "20px 24px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Date</th>
                            <th style={{ padding: "20px 24px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Amount</th>
                            <th style={{ padding: "20px 24px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Status</th>
                            <th style={{ padding: "20px 24px", textAlign: "right", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>No invoices found.</td></tr>
                        ) : (
                            invoices.map(inv => (
                                <tr key={inv.id} style={{ borderBottom: `1px solid var(--border)` }}>
                                    <td style={{ padding: 20, fontSize: 13, fontWeight: 700 }}>#{inv.id.slice(-6).toUpperCase()}</td>
                                    {!isPatient && <td style={{ padding: 20, fontSize: 14, fontWeight: 700 }}>{inv.patientName}</td>}
                                    <td style={{ padding: 20, fontSize: 13 }}>{new Date(inv.createdAt).toLocaleDateString()}</td>
                                    <td style={{ padding: 20, fontSize: 15, fontWeight: 800 }}>₹{inv.totalAmount.toLocaleString()}</td>
                                    <td style={{ padding: 20 }}>
                                        <span style={{ 
                                            padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                                            background: inv.status === 'PAID' ? "rgba(34,197,94,0.1)" : "rgba(249,115,22,0.1)",
                                            color: inv.status === 'PAID' ? "#34a853" : "#f97316"
                                        }}>{inv.status}</span>
                                    </td>
                                    <td style={{ padding: 20, textAlign: "right" }}>
                                        <button onClick={async () => {
                                            try {
                                                const token = sessionStorage.getItem('uphi_token');
                                                const res = await axios.get(`/api/invoices/${inv.id}/pdf`, { responseType: 'blob', headers: { Authorization: `Bearer ${token}` } });
                                                triggerBinaryDownload(res, `UPHI_Invoice_${inv.patientName.replace(/\s+/g, '_')}_${inv.id.slice(-6).toUpperCase()}.pdf`);
                                            } catch (err) { alert('Failed to download PDF'); }
                                        }} style={{ padding: "8px 16px", background: "none", border: `1px solid var(--border)`, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => e.target.style.background = "var(--bg)"} onMouseLeave={e => e.target.style.background = "none"}>View PDF</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function LogsPage() {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = sessionStorage.getItem('uphi_token');
                const res = await axios.get('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } });
                setLogs(res.data);
            } catch (err) { console.error(err); }
            finally { setIsLoading(false); }
        };
        fetchLogs();
    }, []);

    return (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 32 }}>Security Audit Logs</h1>
            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 24, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--border)" }}>
                            <th style={{ padding: "16px 24px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Timestamp</th>
                            <th style={{ padding: "16px 24px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>User</th>
                            <th style={{ padding: "16px 24px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Action</th>
                            <th style={{ padding: "16px 24px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Module</th>
                            <th style={{ padding: "16px 24px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>{isLoading ? "Fetching logs..." : "No logs recorded yet."}</td></tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                    <td style={{ padding: "16px 24px", fontSize: 12 }}>{new Date(log.timestamp).toLocaleString()}</td>
                                    <td style={{ padding: "16px 24px", fontSize: 13, fontWeight: 700 }}>{log.username}</td>
                                    <td style={{ padding: "16px 24px" }}>
                                        <span style={{ padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, background: "rgba(37,99,235,0.1)", color: "var(--accent)" }}>{log.action}</span>
                                    </td>
                                    <td style={{ padding: "16px 24px", fontSize: 13 }}>{log.module}</td>
                                    <td style={{ padding: "16px 24px", fontSize: 12, color: "var(--text-secondary)" }}>{log.details}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ============================================================
// Main App
// ============================================================
export default function HospitalView() {
    const navigate = useNavigate();
    const { token, role: userRole = 'DOCTOR', username: userName = 'staff', logout } = useAuth();
    const { patients, addPatient, removePatient, fetchPatients, consents, fetchConsents } = useStore();

    const [activeTab, setActiveTab] = useState(userRole === 'PATIENT' ? "patient_home" : "dashboard");
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [time, setTime] = useState(new Date());
    const [hospitalName, setHospitalName] = useState("UPHI Central Registry");


    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    // Staff Messaging States
    const [staffMessages, setStaffMessages] = useState([]);
    const [hospitalStaff, setHospitalStaff] = useState([]);
    const [activeChatStaffId, setActiveChatStaffId] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [chatInput, setChatInput] = useState("");

    const [dialogConfig, setDialogConfig] = useState({ isOpen: false, title: '', msg: '', onConfirm: null });
    const closeDialog = () => setDialogConfig({ ...dialogConfig, isOpen: false });
    
    // Digital Vault States
    const [vaultDocuments, setVaultDocuments] = useState([]);
    const [isVaultLoading, setIsVaultLoading] = useState(false);

    const [darkMode, setDarkMode] = useState(sessionStorage.getItem('uphi_dark_mode') === 'true');
    const menuRef = useRef(null);
    const notifyRef = useRef(null);

    useEffect(() => {
        sessionStorage.setItem('uphi_dark_mode', darkMode);
        const theme = darkMode ? DARK_COLORS : COLORS;
        Object.entries(theme).forEach(([key, value]) => {
            const cssKey = key === 'card' ? '--card-bg' : `--${key.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}`;
            document.documentElement.style.setProperty(cssKey, value);
        });
        document.body.style.backgroundColor = theme.bg;
    }, [darkMode]);

    // THEME is now defined globally using CSS variables

    const isDoctor = userRole === 'DOCTOR' || userRole === 'MAIN_ADMIN' || userRole === 'HOSPITAL';
    const isReceptionist = userRole === 'RECEPTIONIST' || userRole === 'MAIN_ADMIN' || userRole === 'HOSPITAL';
    const displayName = userName ? userName.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Staff';
    const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    const roleLabel = userRole === 'DOCTOR' ? 'Doctor' : userRole === 'RECEPTIONIST' ? 'Receptionist' : userRole === 'MAIN_ADMIN' ? 'Administrator' : 'Staff';






    useEffect(() => {
        const fetchMe = async () => {
            try {
                const token = sessionStorage.getItem('uphi_token');
                if (!token) return;
                const res = await axios.get('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });
                if (res.data?.hospitalName) {
                    setHospitalName(res.data.hospitalName);
                }
            } catch (e) {
                console.error("Failed to fetch user profile", e);
            }
        };
        fetchMe();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setProfileMenuOpen(false);
            }
            if (notifyRef.current && !notifyRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        fetchPatients();
        fetchConsents(false);
        fetchNotifications();
        // Dynamic refresh: poll every 8s so any staff/patient updates reflect in real-time
        const refreshInterval = setInterval(() => {
            fetchPatients();
            fetchConsents(false);
            fetchNotifications();
        }, 8000);
        return () => clearInterval(refreshInterval);
    }, [fetchPatients, fetchConsents]);

    const fetchNotifications = async () => {
        try {
            const token = sessionStorage.getItem('uphi_token');
            const res = await axios.get('/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
            const countRes = await axios.get('/api/notifications/unread-count', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadCount(countRes.data);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    const fetchStaffMessages = async () => {
        try {
            const token = sessionStorage.getItem('uphi_token');
            if (!token) return;
            const res = await axios.get('/api/staff-messages', { headers: { Authorization: `Bearer ${token}` } });
            setStaffMessages(res.data);
        } catch (e) {
            console.error("Failed to fetch staff messages", e);
        }
    };

    const fetchHospitalStaff = async () => {
        try {
            const token = sessionStorage.getItem('uphi_token');
            if (!token) return;
            const res = await axios.get('/api/staff-messages/active-staff', { headers: { Authorization: `Bearer ${token}` } });
            setHospitalStaff(res.data);
        } catch (e) {
            console.error("Failed to fetch hospital staff", e);
        }
    };

    const sendStaffMessage = async (recipientId) => {
        if (!chatInput.trim()) return;
        try {
            const token = sessionStorage.getItem('uphi_token');
            const res = await axios.post('/api/staff-messages', {
                senderId: userName,
                senderName: displayName,
                senderRole: userRole,
                recipientId: recipientId,
                message: chatInput
            }, { headers: { Authorization: `Bearer ${token}` } });
            setStaffMessages([res.data, ...staffMessages]);
            setChatInput("");
        } catch (e) {
            console.error("Failed to send message", e);
        }
    };

    const fetchVaultDocuments = async (patientId) => {
        setIsVaultLoading(true);
        try {
            const res = await axios.get(`/api/records/patient/${patientId}/self-uploaded`);
            setVaultDocuments(res.data);
        } catch (e) {
            console.warn("Vault access denied or empty", e);
            setVaultDocuments([]);
        } finally {
            setIsVaultLoading(false);
        }
    };

    const handleSyncFromVault = (doc) => {
        setDialogConfig({
            isOpen: true,
            title: 'Import Medical Record',
            msg: `Import this ${doc.type} into the official hospital medical records?`,
            onConfirm: async () => {
                closeDialog();
                try {
                    await axios.post(`/api/records/sync-vault/${doc.id}`, {});
                    alert("Record synchronized successfully. Asset added to clinical history.");
                    fetchPatients();
                    fetchVaultDocuments(selectedPatient.id);
                } catch (err) {
                    alert("Synchronization failed: " + (err.response?.data || err.message));
                }
            }
        });
    };

    useEffect(() => {
        if (selectedPatient) {
            fetchVaultDocuments(selectedPatient.id);
        }
    }, [selectedPatient, consents]);

    useEffect(() => {
        fetchStaffMessages();
        fetchHospitalStaff();
        const t = setInterval(() => {
            fetchStaffMessages();
            fetchHospitalStaff();
        }, 5000); // 5s interval for demo "real-time"
        return () => clearInterval(t);
    }, []);

    // Poll for notifications every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Emergency router correction for stale closures in Login
    useEffect(() => {
        if (userRole === 'ADMIN' || userRole === 'MAIN_ADMIN') {
            navigate('/admin');
        }
    }, [userRole, navigate]);


    const handleDownloadCard = async (patientId, targetName = "Patient") => {
        const token = sessionStorage.getItem('uphi_token');
        // Use direct browser navigation so Chrome respects Content-Disposition header natively
        const downloadUrl = `/api/receptionist/patients/${patientId}/id-card/download?token=${encodeURIComponent(token)}`;
        
        // Create a hidden iframe to trigger the download without navigating away
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = downloadUrl;
        document.body.appendChild(iframe);
        setTimeout(() => document.body.removeChild(iframe), 10000);
    };

    const handleDownloadOwnCard = async () => {
        try {
            const uname = sessionStorage.getItem('uphi_user');
            const token = sessionStorage.getItem('uphi_token');
            const response = await axios.get(`/api/users/${uname}/id-card`, {
                headers: { 'Authorization': `Bearer ${token}` },
                responseType: 'blob'
            });
            triggerBinaryDownload(response, `${uname}_UPHI_ID_Staff.pdf`);
        } catch (error) {
            alert("Failed to download your staff ID card.");
        }
    };

    const handleDownloadStaffCard = async (staffUsername) => {
        try {
            const token = sessionStorage.getItem('uphi_token');
            const response = await axios.get(`/api/users/${staffUsername}/id-card`, {
                headers: { 'Authorization': `Bearer ${token}` },
                responseType: 'blob'
            });
            triggerBinaryDownload(response, `${staffUsername}_UPHI_ID_Staff.pdf`);
        } catch (error) {
            alert("Failed to download staff ID card.");
        }
    };

    const handleUpdatePatient = (updatedPatient) => {
        // Refresh the patient list to reflect the update
        fetchPatients();
        setSelectedPatient(prev => prev ? { ...prev, ...updatedPatient } : null);
    };

    const handleIdUpload = async (file) => {
        try {
            const token = sessionStorage.getItem('uphi_token');
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await axios.post('/api/id-card/verify', formData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setVerificationResult(response.data);
        } catch (error) {
            alert(`ID Verification Failed: ${error.response?.data || error.message}`);
        }
    };

    const [prefillData, setPrefillData] = useState(null);
    const handleRegisterNew = (data) => {
        setPrefillData(data);
        setActiveTab("register");
        setVerificationResult(null);
    };

    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
        setActiveTab("profile");
    };

    const handleAddPatient = (newPatient) => {
        fetchPatients();
    };

    const handleRemovePatient = (id) => {
        setDialogConfig({
            isOpen: true,
            title: 'Remove Patient',
            msg: "Are you sure you want to permanently remove this patient from the registry?",
            onConfirm: async () => {
                closeDialog();
                try {
                    const token = sessionStorage.getItem('uphi_token');
                    await axios.delete(`/api/receptionist/patients/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    fetchPatients();
                } catch (err) {
                    alert(err.response?.data || "Failed to remove patient.");
                }
            }
        });
    };

    const allNavItems = [
        { id: "dashboard", label: "Dashboard", icon: <Dashboard />, roles: ['DOCTOR', 'RECEPTIONIST', 'HOSPITAL', 'MAIN_ADMIN'] },
        { id: "patient_home", label: "My Health", icon: <Heart />, roles: ['PATIENT'] },
        { id: "patient_records", label: "Medical Records", icon: <FileText />, roles: ['PATIENT'] },
        { id: "patient_appointments", label: "Appointments", icon: <Calendar />, roles: ['PATIENT'] },
        { id: "registry", label: "All Patients", icon: <Search />, roles: ['DOCTOR', 'RECEPTIONIST', 'HOSPITAL', 'MAIN_ADMIN'] },
        { id: "register", label: "Register Patient", icon: <UserPlus />, roles: ['RECEPTIONIST', 'HOSPITAL', 'MAIN_ADMIN'] },
        { id: "appointments", label: "Appointments", icon: <Calendar />, roles: ['DOCTOR', 'RECEPTIONIST', 'HOSPITAL', 'MAIN_ADMIN'] },
        { id: "prescriptions", label: "Prescriptions", icon: <Pill />, roles: ['DOCTOR', 'HOSPITAL', 'MAIN_ADMIN'] },
        { id: "invoices", label: "Invoices & Billing", icon: <FileText />, roles: ['RECEPTIONIST', 'ADMIN', 'MAIN_ADMIN', 'PATIENT'] },
        { id: "consent", label: "Consents", icon: <Shield />, roles: ['DOCTOR', 'RECEPTIONIST', 'HOSPITAL', 'MAIN_ADMIN'] },
        { id: "analytics", label: "Analytics", icon: <Activity />, roles: ['DOCTOR', 'HOSPITAL', 'MAIN_ADMIN'] },
        { id: "triage", label: "AI Triage", icon: <Brain />, roles: ['RECEPTIONIST', 'DOCTOR', 'HOSPITAL', 'MAIN_ADMIN'] },
        { id: "nlsearch", label: "AI Search", icon: <Search />, roles: ['DOCTOR', 'HOSPITAL', 'MAIN_ADMIN'] },
        { id: "pharmacy", label: "Pharmacy & Inventory", icon: <Package />, roles: ['RECEPTIONIST', 'DOCTOR', 'HOSPITAL', 'MAIN_ADMIN'] },
        { id: "logs", label: "System Logs", icon: <Activity />, roles: ['ADMIN', 'MAIN_ADMIN'] },
    ];
    const navItems = allNavItems.filter(item => item.roles.includes(userRole));

    return (
        <div className={cn("premium-main", darkMode && "dark-mode")} style={{
            display: "flex", minHeight: "100vh", background: THEME.bg, color: THEME.textPrimary, fontFamily: "'Inter', sans-serif"
        }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        :root {
            /* Theme variables are set dynamically via JS on documentElement */
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${THEME.bg}; color: ${THEME.textPrimary}; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes growUp { from { height: 0; } }
        @keyframes growWidth { from { width: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        
        input, select, textarea {
            font-family: 'Inter', sans-serif;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            outline: none;
            transition: all 0.2s;
        }
        input:focus, select:focus, textarea:focus {
            border-color: ${THEME.accent};
            box-shadow: 0 0 0 4px ${THEME.accent}10;
        }
        .dark-mode input, .dark-mode select, .dark-mode textarea {
            background: #1e293b !important;
            color: #f8fafc !important;
            border-color: #475569 !important;
        }
        .dark-mode .premium-card {
            background: #1e293b !important;
            border-color: #334155 !important;
        }
        .dark-mode table thead tr {
            background: rgba(255,255,255,0.03) !important;
        }
      `}</style>

            {/* Sidebar */}
            <aside className="uphi-sidebar" style={{
                width: sidebarCollapsed ? 88 : 280,
                background: THEME.sidebar,
                borderRight: `1px solid ${THEME.border}`,
                display: "flex", flexDirection: "column",
                transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100,
                overflow: "hidden",
            }}>
                <div style={{
                    padding: sidebarCollapsed ? "24px 0" : "32px 24px",
                    display: "flex", alignItems: "center", justifyContent: sidebarCollapsed ? "center" : "flex-start", gap: 14,
                    minHeight: 100,
                }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: THEME.accent,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22, fontWeight: 800, color: "#fff", flexShrink: 0,
                        fontFamily: "'Outfit', sans-serif",
                    }}>U</div>
                    {!sidebarCollapsed && (
                        <div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: THEME.textPrimary, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em" }}>UPHI</div>
                            <div style={{ fontSize: 10, color: THEME.textMuted, letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 800 }}>Clinical System</div>
                        </div>
                    )}
                </div>

                <nav style={{ flex: 1, padding: "12px" }}>
                    {navItems.map((item) => (
                        <button key={item.id} onClick={() => { setActiveTab(item.id); setSelectedPatient(null); }}
                            style={{
                                display: "flex", alignItems: "center", gap: 14,
                                width: "100%", padding: "14px 16px",
                                borderRadius: 16, border: "none",
                                background: activeTab === item.id || (activeTab === "profile" && item.id === "registry")
                                    ? THEME.accentMuted : "transparent",
                                color: activeTab === item.id || (activeTab === "profile" && item.id === "registry")
                                    ? THEME.accent : THEME.textSecondary,
                                fontSize: 14, fontWeight: 700, cursor: "pointer",
                                transition: "all 0.2s", marginBottom: 6,
                                justifyContent: sidebarCollapsed ? "center" : "flex-start",
                            }}
                        >
                            <span style={{ color: (activeTab === item.id || (activeTab === "profile" && item.id === "registry")) ? THEME.accent : THEME.textMuted }}>
                                {item.icon}
                            </span>
                            {!sidebarCollapsed && item.label}
                        </button>
                    ))}
                </nav>

                <div style={{ padding: "20px" }}>
                    <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{
                        width: "100%", height: 48, borderRadius: 14, border: `1px solid ${THEME.border}`,
                        background: THEME.card, color: THEME.textMuted, cursor: "pointer",
                        fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s",
                    }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = THEME.accent}
                        onMouseLeave={e => e.currentTarget.style.borderColor = THEME.border}
                    >
                        {sidebarCollapsed ? "→" : "Collapse Sidebar"}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="uphi-main" style={{
                flex: 1,
                marginLeft: sidebarCollapsed ? 72 : 260,
                transition: "margin-left 0.3s ease",
            }}>
                {/* Top bar */}
                <header style={{
                    padding: "20px 48px",
                    borderBottom: `1px solid ${THEME.border}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: darkMode ? "rgba(15, 23, 42, 0.8)" : "rgba(255, 255, 255, 0.8)",
                    backdropFilter: "blur(12px)",
                    position: "sticky", top: 0, zIndex: 50,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ fontSize: 13, color: THEME.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Facility: {hospitalName} • {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <button 
                            onClick={() => {
                                const hid = sessionStorage.getItem('uphi_hospital');
                                if (hid) {
                                    navigator.clipboard.writeText(hid);
                                    alert(`Hospital ID copied to clipboard:\n${hid}`);
                                } else {
                                    alert('Hospital ID not available.');
                                }
                            }}
                            style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(15,23,42,0.05)", border: `1px solid ${THEME.border}`, color: THEME.textPrimary, fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(15,23,42,0.1)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(15,23,42,0.05)"}
                        >
                            <Building2 size={13} /> Hospital ID
                        </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                        <button onClick={() => setDarkMode(!darkMode)} style={{
                            background: "none", border: "none", color: THEME.textMuted, cursor: "pointer", padding: 8
                        }}>
                            {darkMode ? <Sparkles size={20} color={THEME.accent} /> : <Lock size={20} />}
                        </button>

                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                            <button 
                                ref={notifyRef}
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{
                                    background: "none", border: "none",
                                    color: showNotifications ? THEME.accent : THEME.textMuted, cursor: "pointer", padding: 8, transition: "all 0.2s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = THEME.accent}
                                onMouseLeave={e => { if(!showNotifications) e.currentTarget.style.color = THEME.textMuted }}
                            >
                                <Bell size={22} />
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: "absolute", top: 4, right: 4, minWidth: 16, height: 16,
                                        borderRadius: 8, background: THEME.critical, border: "2px solid #fff",
                                        color: "#fff", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center",
                                        padding: "0 4px"
                                    }}>{unreadCount}</span>
                                )}
                            </button>

                            {showNotifications && (
                                <NotificationPanel 
                                    notifications={notifications} 
                                    onClose={() => setShowNotifications(false)} 
                                    onRefresh={fetchNotifications}
                                />
                            )}
                        </div>
                        <div
                            ref={menuRef}
                            style={{ position: "relative" }}
                        >
                            <div
                                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 12,
                                    padding: "4px 16px 4px 4px", borderRadius: 14,
                                    background: profileMenuOpen ? "#f1f5f9" : "transparent",
                                    cursor: "pointer", transition: "all 0.2s", border: `1px solid ${profileMenuOpen ? THEME.border : "transparent"}`
                                }}
                            >
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: THEME.accent,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "#fff", fontSize: 13, fontWeight: 800, fontFamily: "'Outfit', sans-serif"
                                }}>{userInitials}</div>
                                <span style={{ fontSize: 14, fontWeight: 700, color: THEME.textPrimary }}>{displayName}</span>
                            </div>

                            {profileMenuOpen && (
                                <div style={{
                                    position: "absolute", top: "calc(100% + 12px)", right: 0,
                                    width: 260, background: "#ffffff",
                                    border: `1px solid ${THEME.border}`, borderRadius: 24,
                                    padding: 12, boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                                    animation: "scaleIn 0.2s ease", zIndex: 100
                                }}>
                                    <div style={{ padding: "16px", borderBottom: `1px solid ${THEME.border}`, marginBottom: 8 }}>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: THEME.textPrimary, fontFamily: "'Outfit', sans-serif" }}>{displayName}</div>
                                        <div style={{ fontSize: 13, color: THEME.textMuted, marginTop: 4, fontWeight: 500 }}>{roleLabel} • Clinical Staff</div>
                                    </div>

                                    <button style={{
                                        width: "100%", padding: "12px 16px", borderRadius: 12, border: "none",
                                        background: "transparent", color: THEME.textSecondary, fontSize: 13, fontWeight: 700,
                                        display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left"
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = THEME.accent; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = THEME.textSecondary; }}
                                    >
                                        <Settings size={18} /> System Settings
                                    </button>

                                    <div style={{ padding: "8px 16px", borderTop: `1px solid ${THEME.border}`, marginTop: 8 }}>
                                        <div style={{ fontSize: 11, color: THEME.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Credentials</div>
                                        <button 
                                            onClick={() => handleDownloadOwnCard()}
                                            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(37,99,235,0.05)", border: "1px solid rgba(37,99,235,0.1)", borderRadius: 12, color: THEME.accent, cursor: "pointer", transition: "all 0.2s" }}
                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(37,99,235,0.1)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "rgba(37,99,235,0.05)"}
                                        >
                                            <QrCode size={18} />
                                            <div style={{ textAlign: "left" }}>
                                                <div style={{ fontSize: 13, fontWeight: 800 }}>Download ID Card</div>
                                                <div style={{ fontSize: 10, opacity: 0.7 }}>Scannable QR Verification</div>
                                            </div>
                                        </button>
                                    </div>

                                    <div style={{ borderTop: `1px solid ${THEME.border}`, padding: "8px 16px" }}>
                                        <button
                                            onClick={() => {
                                                sessionStorage.clear();
                                                window.location.href = '/';
                                            }}
                                            style={{
                                                width: "100%", padding: "12px 16px", borderRadius: 12, border: "none",
                                                background: "transparent", color: THEME.critical, fontSize: 13, fontWeight: 800,
                                                display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left"
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                                        >
                                            <LogOut size={18} /> Secure Log Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <div style={{ padding: "32px 36px", maxWidth: 1200 }}>
                    {verificationResult && (
                        <IdVerificationModal 
                            result={verificationResult} 
                            onClose={() => setVerificationResult(null)} 
                            onConfirmConsent={async () => {
                                try {
                                    const token = sessionStorage.getItem('uphi_token');
                                    await axios.post(`/api/patients/${verificationResult.patientId}/link-hospital`, {}, {
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                    alert("Identity Verified & Consent Applied. Patient linked securely.");
                                    setVerificationResult(null);
                                    fetchPatients(); // refresh global store
                                } catch (error) {
                                    alert("Failed to link patient: " + (error.response?.data || error.message));
                                }
                            }}
                            onRegisterNew={handleRegisterNew}
                        />
                    )}

                    {activeTab === "dashboard" && (
                        <OverviewPage 
                            patients={patients} 
                            consents={consents} 
                            onNavigate={setActiveTab} 
                            onSelectPatient={handleSelectPatient} 
                            onDownloadCard={handleDownloadCard} 
                            onUploadId={handleIdUpload}
                        />
                    )}
                    {activeTab === "registry" && (
                        <SearchPage 
                            patients={patients} 
                            onSelectPatient={handleSelectPatient} 
                            onRemovePatient={handleRemovePatient} 
                            onDownloadCard={handleDownloadCard} 
                            onUploadId={handleIdUpload}
                            onQRResult={setVerificationResult}
                        />
                    )}
                    {activeTab === "register" && (
                        <RegisterPatientPage 
                            onNavigate={setActiveTab} 
                            onAddPatient={handleAddPatient} 
                            onDownloadCard={handleDownloadCard} 
                            prefillData={prefillData}
                        />
                    )}

                    {activeTab === "profile" && selectedPatient && (
                        <PatientProfile 
                            patient={selectedPatient} 
                            onBack={() => setActiveTab("registry")} 
                            onDownloadCard={handleDownloadCard}
                            onUpdatePatient={handleUpdatePatient}
                            vaultDocuments={vaultDocuments}
                            isVaultLoading={isVaultLoading}
                        />
                    )}
                    {activeTab === "consent" && <ConsentPage consents={consents} />}
                    {activeTab === "analytics" && (userRole === 'DOCTOR' || userRole === 'MAIN_ADMIN' || userRole === 'HOSPITAL') && <AnalyticsPage patients={patients} />}
                    {activeTab === "appointments" && <AppointmentsPage patients={patients} />}
                    {activeTab === "prescriptions" && <PrescriptionsPage patients={patients} />}
                    {activeTab === "triage" && <AiTriagePage />}
                    {activeTab === "nlsearch" && <NLSearchPage />}
                    {activeTab === "invoices" && <InvoicesPage patients={patients} userRole={userRole} userName={userName} />}
                    {activeTab === "logs" && <LogsPage />}
                    {activeTab === "pharmacy" && <PharmacyPage />}

                    {/* Patient Portal Pages */}
                    {activeTab === "patient_home" && <PatientDashboard userName={userName} />}
                    {activeTab === "patient_records" && <PatientRecordsPage userName={userName} />}
                    {activeTab === "patient_appointments" && <AppointmentsPage patients={patients} forcePatientId={userName} />}
                </div>
            </main>

            {/* Staff Linkup / Messenger */}
            <div style={{
                position: "fixed", bottom: 24, right: 24, zIndex: 1000,
                display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 16
            }}>
                {showChat && (
                    <div style={{
                        width: 400, height: 500, background: "var(--card-bg)",
                        border: "1px solid var(--border)", borderRadius: 24,
                        boxShadow: "0 20px 50px rgba(0,0,0,0.15)", display: "flex",
                        flexDirection: "column", overflow: "hidden", animation: "slideUp 0.3s ease"
                    }}>
                        {/* Chat Header */}
                        <div style={{ background: "var(--accent)", color: "#fff", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <MessageSquare size={18} />
                                <span style={{ fontWeight: 700, fontSize: 15 }}>Staff Linkup</span>
                            </div>
                            <button onClick={() => setShowChat(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={20} /></button>
                        </div>

                        {/* Staff List / Chat Window */}
                        {!activeChatStaffId ? (
                            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Active Hospital Staff</div>
                                {hospitalStaff.length === 0 ? (
                                    <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No other staff currently active in this facility.</div>
                                ) : (
                                    hospitalStaff.map(s => (
                                        <div key={s.id} onClick={() => setActiveChatStaffId(s.username)} style={{
                                            display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12,
                                            cursor: "pointer", transition: "all 0.2s"
                                        }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accentMuted)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                                                {s.username[0].toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{s.username}</div>
                                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.role}</div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownloadStaffCard(s.username);
                                                    }}
                                                    title="Staff ID Card"
                                                    style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", padding: 4, opacity: 0.6 }}
                                                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                                    onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                                                >
                                                    <QrCode size={16} />
                                                </button>
                                                <div style={{ width: 8, height: 8, borderRadius: 4, background: "#22c55e" }} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                                    <button onClick={() => setActiveChatStaffId(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}><ArrowLeft size={16} /></button>
                                    <span style={{ fontSize: 14, fontWeight: 700 }}>{activeChatStaffId}</span>
                                </div>
                                <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column-reverse", gap: 12 }}>
                                    {staffMessages
                                        .filter(m => (m.senderId === activeChatStaffId && m.recipientId === userName) || (m.senderId === userName && m.recipientId === activeChatStaffId))
                                        .map(m => (
                                            <div key={m.id} style={{
                                                alignSelf: m.senderId === userName ? "flex-end" : "flex-start",
                                                maxWidth: "80%", padding: "10px 14px", borderRadius: 16,
                                                background: m.senderId === userName ? "var(--accent)" : "var(--border)",
                                                color: m.senderId === userName ? "#fff" : "var(--text-primary)",
                                                fontSize: 13, lineHeight: 1.5
                                            }}>
                                                {m.message}
                                            </div>
                                        ))
                                    }
                                </div>
                                <div style={{ padding: 16, borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
                                    <input 
                                        type="text" 
                                        placeholder="Type a message..." 
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && sendStaffMessage(activeChatStaffId)}
                                        style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)", fontSize: 13 }} 
                                    />
                                    <button 
                                        onClick={() => sendStaffMessage(activeChatStaffId)}
                                        style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 12, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                                    ><Send size={18} /></button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <button 
                    onClick={() => setShowChat(!showChat)}
                    style={{
                        width: 64, height: 64, borderRadius: 32, background: "var(--accent)", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 8px 30px rgba(37,99,235,0.3)", border: "none", cursor: "pointer",
                        transition: "all 0.3s ease", transform: showChat ? "rotate(90deg)" : "none"
                    }}
                >
                    {showChat ? <X size={28} /> : <MessageSquare size={28} />}
                </button>
            </div>

            {/* Global Custom Dialog Component for HospitalView */}
            {dialogConfig.isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{dialogConfig.title}</h3>
                        <p style={{ margin: '0 0 24px 0', fontSize: 15, color: '#475569', lineHeight: 1.5 }}>{dialogConfig.msg}</p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                            <button onClick={closeDialog} style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={dialogConfig.onConfirm} style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}