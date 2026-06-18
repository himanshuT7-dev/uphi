import { useState, useEffect, useRef } from "react";
import axios from "axios";
import saveAs from 'file-saver';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ============================================================
// UPHI — Patient Web Portal
// ============================================================

// --- Utilities ---
const typeColor = (t) => ({ emergency: "#ef4444", consultation: "#2563eb", lab: "#7c3aed", vaccination: "#10b981", radiology: "#f59e0b" }[t] || "#64748b");
const typeLabel = (t) => ({ emergency: "Emergency", consultation: "Consultation", lab: "Lab Work", vaccination: "Vaccination", radiology: "Radiology" }[t] || t);
const riskColor = (l) => ({ Critical: "#ef4444", High: "#f97316", Moderate: "#eab308", Low: "#10b981" }[l] || "#94a3b8");

const triggerBinaryDownload = (blob, fileName) => {
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

// --- Icons ---
const Icons = {
    Dashboard: (props) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
    Timeline: (props) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
    Shield: (props) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    File: (props) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /></svg>,
    Activity: (props) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
    Eye: (props) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>,
    Bell: (props) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>,
    Check: (props) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12" /></svg>,
    X: (props) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
    Download: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
    Share: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>,
    Alert: (props) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
    Pill: (props) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /><path d="m8.5 8.5 7 7" /></svg>,
    QrCode: (props) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" /><rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="4" height="4" rx="0.5" /><path d="M18 14h2v4" /><path d="M14 18h4v2" /></svg>,
    TrendUp: (props) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
    TrendDown: (props) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>,
    Settings: (props) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
    ChevronRight: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="9 18 15 12 9 6" /></svg>,
    Lock: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
    HeartPulse: (props) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" /></svg>,
    LogOut: (props) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
    Sparkles: (props) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="m5 3 1 1" /><path d="m19 19 1 1" /><path d="m19 3-1 1" /><path d="m5 19-1 1" /></svg>,
};// --- Mock Hospital Report Generator ---
const openMockHospitalReport = (recordName, date, patient, hospital = null) => {
    const doctorName = "Dr. Arvind Mehta";
    const hospitalName = hospital?.name || "UPHI CLINICAL NETWORK";
    const hospitalAddress = hospital?.address || "Universal Health Point, UPHI Node-1";
    
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Clinical Report - ${recordName}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@700;800&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; background: #f1f5f9; }
            .report-container { max-width: 850px; margin: 0 auto; padding: 60px; background: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.1); border-radius: 12px; position: relative; }
            .uphi-seal { position: absolute; bottom: 60px; right: 60px; width: 100px; height: 100px; opacity: 0.9; }
            .header { display: flex; justify-content: space-between; border-bottom: 4px solid #2563eb; padding-bottom: 25px; margin-bottom: 40px; }
            .logo-section { display: flex; align-items: center; gap: 15px; }
            .hospital-logo-placeholder { width: 50px; height: 50px; background: #2563eb; border-radius: 10px; display: flex; align-items: center; justifyContent: center; color: white; font-weight: 800; font-size: 24px; font-family: 'Outfit'; }
            .logo-text { font-family: 'Outfit'; font-size: 24px; font-weight: 800; color: #0f172a; }
            .hospital-details { text-align: right; font-size: 13px; color: #64748b; line-height: 1.6; }
            .report-tag { background: #2563eb; color: white; display: inline-block; padding: 6px 16px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 30px; }
            .title { font-family: 'Outfit'; font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 15px; }
            .patient-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 40px; border: 1px solid #e2e8f0; }
            .detail-row { display: flex; gap: 10px; }
            .detail-row span:first-child { font-weight: 700; color: #94a3b8; text-transform: uppercase; font-size: 10px; width: 100px; display: block; }
            .detail-row span:last-child { font-weight: 600; color: #1e293b; font-size: 14px; }
            .content { line-height: 1.8; font-size: 15px; margin-bottom: 60px; color: #334155; }
            .section-header { font-weight: 800; color: #0f172a; font-size: 16px; margin: 30px 0 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
            .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px; padding-top: 40px; border-top: 2px solid #f1f5f9; }
            .signature-line { border-top: 2px solid #0f172a; width: 220px; margin-top: 40px; padding-top: 12px; font-weight: 700; font-size: 15px; }
            .verified-badge { display: flex; align-items: center; gap: 8px; color: #10b981; font-weight: 700; font-size: 12px; margin-top: 15px; }
            .print-btn { position: fixed; bottom: 40px; right: 40px; background: #0f172a; color: #fff; border: none; padding: 18px 36px; border-radius: 16px; font-weight: 700; font-size: 16px; cursor: pointer; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); transition: all 0.2s; }
            .print-btn:hover { transform: translateY(-2px); box-shadow: 0 25px 30px -5px rgba(0,0,0,0.3); }
            @media print { .print-btn { display: none; } body { padding: 0; background: #fff; } .report-container { box-shadow: none; border: none; padding: 0; } }
        </style>
    </head>
    <body onload="window.print()">
        <div class="report-container">
            <div class="header">
                <div class="logo-section">
                    <div class="hospital-logo-placeholder">H</div>
                    <div class="logo-text">${hospitalName}</div>
                </div>
                <div class="hospital-details">
                    ${hospitalAddress}<br>
                    Verified Healthcare Facility<br>
                    Report Date: <strong>${date}</strong>
                </div>
            </div>
            
            <div class="report-tag">Official Clinical Asset</div>
            <div class="title">${recordName}</div>
            
            <div class="patient-details">
                <div class="detail-row"><span>Patient</span> <span>${patient.name}</span></div>
                <div class="detail-row"><span>ABHA ID</span> <span>${patient.uhid}</span></div>
                <div class="detail-row"><span>Demographics</span> <span>${patient.age}Y • ${patient.gender} • ${patient.bloodGroup}</span></div>
                <div class="detail-row"><span>System ID</span> <span>UPHI-RE-992${Math.floor(Math.random() * 9)}</span></div>
            </div>
            
            <div class="content">
                <div class="section-header">Diagnostic Findings</div>
                This report documents the clinical findings for the patient concerning ${recordName}. 
                Longitudinal analysis indicates stable parameters within the UPHI network standards. 
                Diagnostic integrity has been preserved via zero-loss imaging protocols.
                <br><br>
                All measured vitals and biological markers align with the established therapeutic baseline. 
                No immediate intervention is required based on current diagnostic streams.
                
                <div class="section-header">Clinical Recommendations</div>
                - Adhere to existing medication protocol.<br>
                - Routine monitoring via UPHI Wearable Link is advised.<br>
                - Digital follow-up scheduled in 14 days.
            </div>

            <img class="uphi-seal" src="/api/public/images/uphi_seal.png" onerror="this.src='https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=UPHI-VERIFIED-${patient.uhid}'" alt="UPHI Verified"/>
            
            <div class="footer">
                <div>
                    <div class="verified-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        UPHI ASSET INTEGRITY VERIFIED
                    </div>
                    <p style="font-size: 11px; color: #94a3b8; margin-top: 8px; max-width: 300px;">
                        This document is a certified digital record of the UPHI Clinical Network. Technical integrity is verified via cryptographic proof of diagnostic data.
                    </p>
                </div>
                <div class="signature">
                    <div style="font-family: 'Outfit'; font-size: 20px; color: #0f172a;">${doctorName}</div>
                    <div class="signature-line">${doctorName}<br><span style="font-size: 11px; font-weight: 600; color: #64748b;">Chief Clinical Investigator</span></div>
                </div>
            </div>
        </div>
        <button class="print-btn" onclick="window.print()">Print Official Report</button>
    </body>
    </html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
};

function DiagnosticViewer({ record, onClose }) {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [showHD, setShowHD] = useState(true);
    const [blobUrl, setBlobUrl] = useState(null);
    const [imgLoading, setImgLoading] = useState(true);

    const rawUrl = record.imageUrl || record.original?.imageUrl || record.original?.url || (record.id ? `/api/records/${record.id}/scan` : null);

    useEffect(() => {
        let cancelled = false;
        if (rawUrl) {
            setImgLoading(true);
            axios.get(rawUrl, { responseType: 'blob' })
                .then(res => {
                    if (!cancelled) {
                        setBlobUrl(URL.createObjectURL(res.data));
                        setImgLoading(false);
                    }
                })
                .catch(() => {
                    if (!cancelled) setImgLoading(false);
                });
        }
        return () => { cancelled = true; };
    }, [rawUrl]);

    useEffect(() => {
        return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
    }, [blobUrl]);

    const imgUrl = showHD ? blobUrl : "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&q=80";

    const handleWheel = (e) => {
        const delta = e.deltaY * -0.002;
        setZoom(prev => Math.min(Math.max(1, prev + delta), 6));
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging || zoom <= 1) return;
        setPan({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
    };

    return (
        <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 15, 0.98)', backdropFilter: 'blur(20px)', zIndex: 10000, display: 'flex', flexDirection: 'column' }}
            onWheel={handleWheel}
        >
            <div style={{ height: 80, padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 800 }}>{record.name || "Diagnostic Scan"}</h3>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{record.date} &bull; {showHD ? "Lossless HD Source" : "Preview Mode"}</p>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    <button onClick={() => setShowHD(!showHD)} style={{ background: showHD ? '#2563eb' : 'transparent', border: '1px solid #2563eb', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        {showHD ? "HD Active" : "SD Fallback"}
                    </button>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Icons.X />
                    </button>
                </div>
            </div>

            <div 
                style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: zoom > 1 ? 'grab' : 'default' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
            >
                {imgLoading ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 48, height: 48, border: '3px solid rgba(59,130,246,0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600 }}>Loading diagnostic asset...</p>
                    </div>
                ) : (
                    <img 
                        src={imgUrl} 
                        alt="Clinical Scan"
                        draggable="false"
                        style={{ 
                            maxHeight: '85vh', maxWidth: '85vw', objectFit: 'contain',
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)',
                            boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                            borderRadius: 4
                        }}
                    />
                )}
                
                {/* Visual Zoom Indicator */}
                <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '12px 24px', borderRadius: 40, border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 800, pointerEvents: 'none' }}>
                    Magnification: {(zoom * 100).toFixed(0)}%
                </div>
            </div>
            
            <div style={{ padding: "32px 40px", background: "rgba(10, 15, 25, 0.8)", borderTop: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                    <div style={{ color: "#2563eb" }}><Icons.Shield size={24} /></div>
                    <span style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#3b82f6" }}>Diagnostic Authenticity Verified</span>
                </div>
                <p style={{ fontSize: 16, lineHeight: 1.6, color: "rgba(255,255,255,0.8)", margin: 0, maxWidth: 900 }}>
                    {record.diagnosticSummary || record.original?.analysisResult || "This is a high-definition recording of your clinical scan. It is preserved in its original diagnostic quality to ensure zero data loss during longitudinal record keeping."}
                </p>
            </div>
        </div>
    );
}


// --- OTP Modal ---
function OTPModal({ title, subtitle, onConfirm, onClose }) {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState(false);
    const refs = useRef([]);

    const handleChange = (i, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp];
        next[i] = val;
        setOtp(next);
        setError(false);
        if (val && i < 5) refs.current[i + 1]?.focus();
        if (next.every(d => d !== "") && i === 5) {
            setTimeout(() => {
                if (next.join("") === "123456") {
                    setVerified(true);
                    setTimeout(onConfirm, 1000);
                } else {
                    setError(true);
                    setOtp(["", "", "", "", "", ""]);
                    refs.current[0]?.focus();
                }
            }, 300);
        }
    };

    const handleKeyDown = (i, e) => {
        if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.25s ease" }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 40, width: 440, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)", animation: "scaleIn 0.3s ease" }}>
                {verified ? (
                    <div style={{ textAlign: "center", padding: "10px 0" }}>
                        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#22c55e", animation: "scaleIn 0.3s ease" }}><Icons.Check /></div>
                        <h3 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", fontFamily: "'Outfit', sans-serif", margin: "0 0 8px" }}>Verification Complete</h3>
                        <p style={{ fontSize: 14, color: "#64748b" }}>Processing your request securely...</p>
                    </div>
                ) : (
                    <>
                        <div style={{ mb: 32 }}>
                            <h3 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", fontFamily: "'Outfit', sans-serif", margin: "0 0 8px" }}>{title}</h3>
                            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.5 }}>{subtitle}</p>
                        </div>
                        <div style={{ marginTop: 24, marginBottom: 24 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Authorization Required</p>
                            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                                {otp.map((d, i) => (
                                    <input key={i} ref={el => refs.current[i] = el} value={d} onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)} maxLength={1} inputMode="numeric"
                                        style={{ width: 54, height: 64, textAlign: "center", fontSize: 28, fontWeight: 700, background: "#f8fafc", border: `2px solid ${error ? "#ef4444" : d ? "#2563eb" : "#e2e8f0"}`, borderRadius: 12, color: "#0f172a", outline: "none", transition: "all 0.2s", fontFamily: "monospace" }}
                                    />
                                ))}
                            </div>
                        </div>
                        {error && <p style={{ color: "#ef4444", fontSize: 13, textAlign: "center", marginBottom: 16, fontWeight: 500 }}>Incorrect code. For testing, use "123456".</p>}
                        <button style={{ width: "100%", padding: "14px", borderRadius: 12, background: "#f1f5f9", border: "none", color: "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer" }} onClick={onClose}>Back to Portal</button>
                    </>
                )}
            </div>
        </div>
    );
}

// --- Risk Gauge ---
function RiskGauge({ score, level, label, size = 80 }) {
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const color = riskColor(level);
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ position: "relative", width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={circumference - progress} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.5s ease-out" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: size > 70 ? 20 : 15, fontWeight: 800, color, fontFamily: "'Playfair Display', serif" }}>{score}</span>
                </div>
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 11, color, fontWeight: 700 }}>{level}</span>
        </div>
    );
}

// ============================================================
// PAGES
// ============================================================

// --- Overview Page ---
function OverviewPage({ onNavigate, pendingCount, PATIENT, CONSENT_REQUESTS }) {
    return (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: 36, fontWeight: 700, color: "#0f172a", margin: "0 0 6px", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
                    {(() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; })()}, {(PATIENT.name || "User").split(" ")[0]}
                </h1>
                <p style={{ fontSize: 16, color: "#64748b", margin: 0, fontWeight: 500 }}>
                    {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
            </div>

            {/* Consent Alert Banner */}
            {pendingCount > 0 && (
                <div onClick={() => onNavigate("consent")} style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 16, padding: "16px 22px", marginBottom: 28, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", animation: "fadeSlideUp 0.4s ease both", transition: "background 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(249,115,22,0.12)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(249,115,22,0.08)"}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(249,115,22,0.15)", color: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icons.Alert /></div>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: "#fdba74", margin: "0 0 2px" }}>{pendingCount} Consent Request{pendingCount > 1 ? "s" : ""} Awaiting Your Approval</p>
                        <p style={{ fontSize: 13, color: "rgba(249,115,22,0.7)", margin: 0 }}>Doctors are requesting access to your health records. Click to review.</p>
                    </div>
                    <Icons.ChevronRight />
                </div>
            )}

            {/* UHID Card + Vitals */}
            <div className="uphi-grid-header" style={{ marginBottom: 32 }}>
                {/* Health Card */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: "32px", position: "relative", overflow: "hidden", boxShadow: "0 4px 20px -5px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 32 }}>
                        <button 
                            onClick={async () => {
                                try {
                                    const token = sessionStorage.getItem('uphi_token');
                                    const response = await axios.get(`/api/patients/${PATIENT.id}/id-card`, {
                                        headers: { 'Authorization': `Bearer ${token}` },
                                        responseType: 'blob'
                                    });
                                    const blob = new Blob([response.data], { type: 'application/pdf' });
                                    triggerBinaryDownload(blob, `UPHI_HealthID_${PATIENT.uhid}_${PATIENT.name.replace(/\s+/g, '_')}.pdf`);
                                } catch (error) {
                                    console.error("ID download failed", error);
                                    alert("Unable to download ID card. Please log in again.");
                                }
                            }} 
                            title="Download UPHI Health ID (PDF)" 
                            style={{ width: 48, height: 48, borderRadius: 16, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", cursor: "pointer", transition: "all 0.2s" }} 
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} 
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Icons.QrCode />
                        </button>
                        <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px", fontWeight: 700 }}>ABHA Address</p>
                            <p style={{ fontSize: 14, color: "#0f172a", fontWeight: 700, fontFamily: "monospace" }}>{PATIENT.uhid}</p>
                        </div>
                    </div>
                    <h2 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", margin: "0 0 4px", fontFamily: "'Outfit', sans-serif" }}>{PATIENT.name}</h2>
                    <p style={{ fontSize: 15, color: "#64748b", margin: "0 0 24px" }}>{PATIENT.age} years • {PATIENT.gender} • {PATIENT.bloodGroup}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {PATIENT.conditions.map((c, i) => (
                            <span key={i} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", fontWeight: 600 }}>{c.name}</span>
                        ))}
                    </div>
                </div>

                {/* Vitals Grid */}
                <div className="uphi-grid-3col">
                    {Object.entries({ 
                        "Heart Rate": { val: PATIENT.vitals.hr, unit: "BPM", icon: <Icons.Activity /> },
                        "Blood Pressure": { val: PATIENT.vitals.bp, unit: "mmHg", icon: <Icons.HeartPulse /> },
                        "SpO2": { val: PATIENT.vitals.spo2, unit: "%", icon: <Icons.Shield /> }
                    }).map(([k, meta]) => (
                        <div key={k} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "24px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 16, boxShadow: "0 1px 3px 0 rgba(0,0,0,0.02)" }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#f8fafc", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>{meta.icon}</div>
                            <div>
                                <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginBottom: 4 }}>{k}</div>
                                <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>{meta.val}<span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, marginLeft: 4 }}>{meta.unit}</span></div>
                            </div>
                        </div>
                    ))}
                    {Object.entries({ 
                        "Temp": { val: PATIENT.vitals.temp, unit: "°C" },
                        "Weight": { val: PATIENT.vitals.weight, unit: "kg" },
                        "BMI": { val: PATIENT.vitals.bmi, unit: "" }
                    }).map(([k, meta]) => (
                        <div key={k} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 20, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginBottom: 4 }}>{k}</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: "#475569" }}>{meta.val} <span style={{ fontSize: 10, color: "#94a3b8" }}>{meta.unit}</span></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Allergy Banner */}
            {PATIENT.allergies.length > 0 && (
                <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 16, padding: "16px 24px", marginBottom: 32, display: "flex", alignItems: "center", gap: 16, animation: "fadeSlideUp 0.4s ease both" }}>
                    <div style={{ color: "#ef4444" }}><Icons.Alert /></div>
                    <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#991b1b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Critical Allergies: </span>
                        {PATIENT.allergies.map((a, i) => (
                            <span key={i} style={{ fontSize: 14, color: "#b91c1c", fontWeight: 500 }}>{a.name} ({a.severity}){i < PATIENT.allergies.length - 1 ? " • " : ""}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Two column grid */}
            <div className="uphi-grid-2col" style={{ marginTop: 32 }}>
                {/* Medications */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 32, boxShadow: "0 1px 3px 0 rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0, fontFamily: "'Outfit', sans-serif" }}>Today's Registry</h3>
                        <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Active Protocols</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {PATIENT.medications.map((m, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", borderRadius: 16, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: m.taken ? "#94a3b8" : "#2563eb" }} />
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{m.name}</span>
                                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{m.dose} • {m.time}</div>
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: m.taken ? "#10b981" : "#64748b", textTransform: "uppercase" }}>{m.taken ? "Logged" : "Pending"}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions / Consents */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 32, boxShadow: "0 1px 3px 0 rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0, fontFamily: "'Outfit', sans-serif" }}>Pending Clearances</h3>
                        <button onClick={() => onNavigate("consent")} style={{ fontSize: 13, color: "#2563eb", fontWeight: 700 }}>Review All</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {CONSENT_REQUESTS.filter(r => r.status === "PENDING").map((c, i) => (
                            <div key={i} style={{ padding: "16px", borderRadius: 16, background: "#fffaf5", border: "1px solid #fff2e5" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: "#92400e" }}>{c.doctorName || "Doctor"}</div>
                                        <div style={{ fontSize: 12, color: "#b45309", marginTop: 1 }}>{c.hospitalName || "Hospital"}</div>
                                    </div>
                                    <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 8, background: "#fbbf24", color: "#fff", fontWeight: 800 }}>URGENT</span>
                                </div>
                            </div>
                        ))}
                        {CONSENT_REQUESTS.filter(r => r.status === "PENDING").length === 0 && (
                            <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                                <Icons.Check />
                                <p style={{ fontSize: 14, marginTop: 8 }}>All clearances up to date</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Timeline Page ---
function TimelinePage({ TIMELINE, PATIENT }) {
    const [filter, setFilter] = useState("all");
    const filters = ["all", "consultation", "lab", "emergency", "vaccination"];
    const shown = filter === "all" ? TIMELINE : TIMELINE.filter(t => t.type === filter);

    return (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0f172a", margin: "0 0 8px", fontFamily: "'Outfit', sans-serif" }}>Clinical Registry</h1>
                <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>Longitudinal timeline of your health journey</p>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap", overflowX: "auto", paddingBottom: 8 }}>
                {filters.map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{ padding: "10px 20px", borderRadius: 14, border: "1px solid", borderColor: filter === f ? "#2563eb" : "#e2e8f0", background: filter === f ? "#eff6ff" : "#ffffff", color: filter === f ? "#2563eb" : "#64748b", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                        {f === "all" ? "Whole History" : typeLabel(f)}
                    </button>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                {shown.map((t, i) => (
                    <div key={i} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "28px", display: "flex", gap: 24, animation: `fadeSlideUp 0.4s ease ${i * 50}ms both`, boxShadow: "0 1px 3px 0 rgba(0,0,0,0.02)" }}>
                        <div style={{ textAlign: "center", minWidth: 100 }}>
                            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>{t.date.split("-")[0]}</div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>{t.date.split("-")[1]}</div>
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, fontWeight: 600 }}>{t.date.split("-")[2]}</div>
                        </div>
                        <div style={{ h: "auto", w: 1, background: "#f1f5f9" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                                <span style={{ fontSize: 10, padding: "5px 12px", borderRadius: 8, fontWeight: 800, background: "#f8fafc", color: typeColor(t.type), border: "1px solid #f1f5f9", textTransform: "uppercase", letterSpacing: "0.05em" }}>{typeLabel(t.type)}</span>
                                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>ID: REC-{i + 1024}</span>
                            </div>
                            <h4 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 8px", fontFamily: "'Outfit', sans-serif" }}>{t.event}</h4>
                            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 16px", lineHeight: 1.6 }}>{t.detail}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>🏥 {t.facility}</span>
                                {t.hasScan ? (
                                    <span onClick={() => onViewImaging(t)} style={{ fontSize: 13, color: "#16a34a", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                                        <Icons.Sparkles size={14} /> View HD Scan
                                    </span>
                                ) : (
                                    <span onClick={() => openMockHospitalReport(t.event || t.type, t.date, PATIENT)} style={{ fontSize: 13, color: "#2563eb", fontWeight: 700, cursor: "pointer" }}>View Documents</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Consent Page ---
function ConsentPage({ CONSENT_REQUESTS, setConsents, setPage }) {
    const [requests, setRequests] = useState(CONSENT_REQUESTS);
    useEffect(() => { setRequests(CONSENT_REQUESTS); }, [CONSENT_REQUESTS]);
    const [otpModal, setOtpModal] = useState(null);
    const [processing, setProcessing] = useState(false);
    const pending = requests.filter(r => r.status === "PENDING");
    const resolved = requests.filter(r => r.status !== "PENDING");

    const handleAction = (req, action) => setOtpModal({ req, action });
    const handleConfirm = async () => {
        setProcessing(true);
        try {
            const token = sessionStorage.getItem("token");
            const status = otpModal.action === "approved" ? "APPROVED" : 
                           otpModal.action === "revoked" ? "REVOKED" : "DENIED";
            await axios.put(`/api/consents/${otpModal.req.id}/status?status=${status}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const updated = requests.map(r => r.id === otpModal.req.id ? { ...r, status } : r);
            setRequests(updated);
            if (setConsents) setConsents(updated);
        } catch (err) {
            console.error("Consent update failed", err);
        }
        setProcessing(false);
        setOtpModal(null);
    };

    return (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
            {otpModal && (
                <OTPModal
                    title={otpModal.action === "approved" ? "Approve Clearance" : 
                           otpModal.action === "revoked" ? "Revoke Access" : "Deny Access"}
                    subtitle={`${otpModal.req.doctorName || "Staff"} • ${otpModal.req.hospitalName || "Facility"}`}
                    onConfirm={handleConfirm}
                    onClose={() => setOtpModal(null)}
                />
            )}

            <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0f172a", margin: "0 0 8px", fontFamily: "'Outfit', sans-serif" }}>Universal Consent Control</h1>
                <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>Manage access to your electronic medical records securely</p>
            </div>

            <div style={{ background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: 20, padding: "20px 24px", marginBottom: 40, display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ color: "#2563eb" }}><Icons.Lock /></div>
                <p style={{ fontSize: 14, color: "#1e40af", margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
                    Clearances are DPDP Act compliant. Every access requires explicit authorization and expires automatically.
                </p>
            </div>

            {pending.length > 0 && (
                <div style={{ marginBottom: 48 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Requests Awaiting Signature ({pending.length})</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                        {pending.map((req, i) => (
                            <div key={req.id} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: "32px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                                <div style={{ display: "flex", gap: 20, marginBottom: 28 }}>
                                    <div style={{ width: 56, height: 56, borderRadius: 16, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", fontSize: 24, fontWeight: 800 }}>
                                        {req.doctorName ? req.doctorName[0] : "D"}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 4px", fontFamily: "'Outfit', sans-serif" }}>{req.doctorName || "Clinical Staff"}</p>
                                        <p style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{req.purpose === "DOCUMENT_REQUEST" ? "Document Request" : "Record View Access"}</p>
                                        <p style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>{req.hospitalName || "Partner Facility"}</p>
                                    </div>
                                </div>
                                <div style={{ gridTemplateColumns: "1fr 1fr", display: "grid", gap: 12, marginBottom: 28 }}>
                                    {[["Purpose", req.purpose], ["Duration", req.duration]].map(([l, v]) => (
                                        <div key={l} style={{ padding: "12px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                                            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>{l}</div>
                                            <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 700 }}>{v}</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <button onClick={() => handleAction(req, "denied")} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1px solid #fee2e2", background: "#fef2f2", color: "#ef4444", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Deny</button>
                                    <button 
                                        onClick={async () => {
                                            if (req.purpose === "DOCUMENT_REQUEST") {
                                                // Automatic internal approval for document requests when clicking upload
                                                await axios.put(`/api/consents/${req.id}/status?status=APPROVED`, {});
                                                setPage('reports');
                                            } else {
                                                handleAction(req, "approved");
                                            }
                                        }} 
                                        style={{ flex: 2, padding: "14px", borderRadius: 14, border: "none", background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.2)" }}
                                    >
                                        {req.purpose === "DOCUMENT_REQUEST" ? "Upload & Share" : "Authorize Access"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {resolved.length > 0 && (
                <div style={{ marginTop: 40 }}>
                    <h2 style={{ fontSize: 13, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Resolved History ({resolved.length})</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {resolved.map((req, i) => (
                            <div key={req.id} style={{ height: 60, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: "#475569" }}>{req.doctorName || "Staff"}</span>
                                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{req.purpose}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "Historical"}</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 8, fontWeight: 800, textTransform: "uppercase", background: req.status === "APPROVED" ? "#ecfdf5" : "#fef2f2", color: req.status === "APPROVED" ? "#10b981" : "#ef4444" }}>{req.status}</span>
                                        {req.status === "APPROVED" && (
                                            <button 
                                                onClick={() => handleAction(req, "revoked")} 
                                                style={{ 
                                                    padding: "4px 8px", borderRadius: 6, border: "1px solid #fee2e2", 
                                                    background: "#fef2f2", color: "#ef4444", fontSize: 9, 
                                                    fontWeight: 700, cursor: "pointer", textTransform: "uppercase" 
                                                }}
                                            >
                                                Revoke
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Reports Page ---
function ReportsPage({ REPORTS, PATIENT, onViewImaging }) {
    const [filter, setFilter] = useState("All");
    const [docs, setDocs] = useState(REPORTS);
    useEffect(() => { setDocs(REPORTS); }, [REPORTS]);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);
    const categories = ["All", "Lab Report", "Radiology", "Cardiology", "X-Ray", "Diagnostics"];
    const shown = filter === "All" ? docs : docs.filter(r => r.type === filter);

    const [statusMsg, setStatusMsg] = useState(null);

    const handleUpload = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setUploading(true);
            try {
                const file = e.target.files[0];
                const typeCaps = file.name.toUpperCase();
                const isXray = typeCaps.includes("X-RAY") || typeCaps.includes("XRAY");
                const isImaging = isXray || typeCaps.includes("ECG");
                
                const token = sessionStorage.getItem("token");
                const formData = new FormData();
                formData.append("file", file);

                if (isImaging) {
                    // Send to Imaging Controller for AI scan 
                    formData.append("type", isXray ? "X-RAY" : "ECG");
                    formData.append("doctorName", "Self Uploaded");
                    
                    const res = await axios.post(`/api/imaging/scan/${PATIENT.id}`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
                    });
                    
                    const f = {
                        id: 'img-' + Date.now(),
                        name: file.name,
                        type: isXray ? "X-Ray" : "Cardiology",
                        date: new Date().toLocaleDateString('en-GB'),
                        facility: "Self Uploaded",
                        original: res.data
                    };
                    setDocs([f, ...docs]);
                    setStatusMsg({ type: "success", text: `AI Analyzed: ${res.data.analysisResult || "Image processed successfully."}` });
                } else {
                    // Standard document
                    const recRes = await axios.post('/api/records', {
                        patientId: PATIENT ? PATIENT.id : "UNKNOWN",
                        hospitalId: "SELF",
                        type: "Lab Report",
                        diagnosticSummary: file.name
                    }, { headers: { Authorization: `Bearer ${token}` } });
                    
                    await axios.post(`/api/records/${recRes.data.id}/scan`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
                    });
                    
                    const f = {
                        id: recRes.data.id,
                        name: file.name,
                        type: "Lab Report",
                        date: new Date().toLocaleDateString('en-GB'),
                        facility: "Self Uploaded",
                        contentType: file.type
                    };
                    setDocs([f, ...docs]);
                    setStatusMsg({ type: "success", text: "Standard document imported securely." });
                }
            } catch (err) {
                console.error("Upload failed", err);
                setStatusMsg({ type: "error", text: "Encryption transit failed or server unavailable." });
            }
            setUploading(false);
            setTimeout(() => setStatusMsg(null), 6000);
        }
    };

    return (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0f172a", margin: "0 0 8px", fontFamily: "'Outfit', sans-serif" }}>Diagnostic Archives</h1>
                <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>Secure repository for all clinical documentations</p>
            </div>
            
            {statusMsg && (
                <div style={{ marginBottom: 24, padding: "16px 20px", borderRadius: 12, background: statusMsg.type === "error" ? "#fef2f2" : "#eff6ff", border: `1px solid ${statusMsg.type === "error" ? "#fee2e2" : "#bfdbfe"}`, color: statusMsg.type === "error" ? "#ef4444" : "#1d4ed8", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 12, animation: "fadeIn 0.3s" }}>
                    {statusMsg.type === "error" ? <Icons.X /> : <Icons.Check />}
                    {statusMsg.text}
                </div>
            )}

            {/* Custom Upload Section for X-Rays, ECGs, etc. */}
            <div style={{ marginBottom: 40, background: "#ffffff", border: "2px dashed #cbd5e1", borderRadius: 24, padding: "40px", textAlign: "center", cursor: "pointer", transition: "all 0.3s" }} 
                 onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.background = "#f8fafc"; }}
                 onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#ffffff"; }}
                 onClick={() => fileRef.current?.click()}
            >
                <input type="file" ref={fileRef} onChange={handleUpload} style={{ display: 'none' }} accept="image/*,.pdf,.dcm" />
                <div style={{ width: 64, height: 64, borderRadius: 20, background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', sans-serif", fontSize: 24, margin: "0 auto 16px" }}>
                    <Icons.Download />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>Upload Documents to Hospital</h3>
                <p style={{ fontSize: 14, color: "#64748b", maxWidth: 400, margin: "0 auto 24px" }}>
                    Drag and drop your files here or click to browse. Supports standard records, high-resolution X-Rays, and ECG scans (.pdf, .jpg, .dcm).
                </p>
                <button disabled={uploading} style={{ height: 44, padding: "0 24px", borderRadius: 14, background: "#0f172a", color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: uploading ? "wait" : "pointer" }}>
                    {uploading ? "Processing Encryption..." : "Browse Files"}
                </button>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
                {categories.map(c => (
                    <button key={c} onClick={() => setFilter(c)} style={{ padding: "10px 20px", borderRadius: 14, border: "1px solid", borderColor: filter === c ? "#2563eb" : "#e2e8f0", background: filter === c ? "#eff6ff" : "#ffffff", color: filter === c ? "#2563eb" : "#64748b", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{c}</button>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
                {shown.map((r, i) => (
                    <div key={r.id} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: "24px", display: "flex", alignItems: "center", gap: 20, animation: `fadeSlideUp 0.4s ease ${i * 40}ms both` }}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: "#f8fafc", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid #f1f5f9" }}><Icons.File /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</p>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{r.type}</span>
                                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1" }} />
                                <span style={{ fontSize: 12, color: "#94a3b8" }}>{r.date}</span>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            {(r.contentType?.startsWith('image/') || r.original?.imageUrl || r.original?.url) && (
                                <button onClick={() => onViewImaging(r)} style={{ width: 40, height: 40, borderRadius: 12, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="View HD Imaging"><Icons.Activity size={18} /></button>
                            )}
                            <button onClick={() => openMockHospitalReport(r.name, r.date, PATIENT)} style={{ width: 40, height: 40, borderRadius: 12, border: "1px solid #e2e8f0", background: "#ffffff", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Eye /></button>
                            <button onClick={() => openMockHospitalReport(r.name, r.date, PATIENT)} style={{ width: 40, height: 40, borderRadius: 12, border: "1px solid #e2e8f0", background: "#ffffff", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Download /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Risk Page ---
function RiskPage({ RISK, PATIENT }) {
    return (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0f172a", margin: "0 0 8px", fontFamily: "'Outfit', sans-serif" }}>Predictive Modeling</h1>
                <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>AI-generated health trajectories based on clinical history</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
                {Object.entries(RISK || {}).map(([key, data], i) => {
                    const labels = { cardiac: "Cardiovascular Health", diabetes: "Metabolic Trajectory", ckd: "Renal Function Index", readmission: "Clinical Stability" };
                    return (
                        <div key={key} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 32, animation: `fadeSlideUp 0.4s ease ${i * 100}ms both`, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                            {data ? (
                                <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
                                    <RiskGauge score={data.score} level={data.level} label={key.toUpperCase()} size={110} />
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 8px", fontFamily: "'Outfit', sans-serif" }}>{labels[key]}</h3>
                                        <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 20px", lineHeight: 1.6 }}>{data.tip}</p>
                                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, padding: "6px 14px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f1f5f9", color: data.trend === "increasing" ? "#ef4444" : "#10b981" }}>
                                            {data.trend === "increasing" ? <Icons.TrendUp /> : <Icons.TrendDown />}
                                            <span style={{ textTransform: "capitalize" }}>{data.trend} Trend</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: "center", color: "#94a3b8", py: 20 }}>No analysis data for {key}</div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px" }}>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, textAlign: "center", lineHeight: 1.6, fontWeight: 500 }}>
                    Experimental AI modeling. These scores are for analytical purposes and do not constitute a medical diagnosis. 
                    Last updated: {PATIENT.lastUpdated}
                </p>
            </div>
        </div>
    );
}

// --- Access Log Page ---
function AccessLogPage({ ACCESS_HISTORY }) {
    return (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0f172a", margin: "0 0 8px", fontFamily: "'Outfit', sans-serif" }}>Audit Trail</h1>
                <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>Full transparency of clinical record interactions</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {ACCESS_HISTORY.map((a, i) => (
                    <div key={a.id} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: "28px", animation: `fadeSlideUp 0.4s ease ${i * 80}ms both` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 24 }}>
                            <div style={{ display: "flex", gap: 20 }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: "#f8fafc", h: "56", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", border: "1px solid #f1f5f9" }}><Icons.Eye /></div>
                                <div>
                                    <p style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 4px", fontFamily: "'Outfit', sans-serif" }}>{a.doctor}</p>
                                    <p style={{ fontSize: 14, color: "#64748b", margin: 0, fontWeight: 500 }}>{a.hospital}</p>
                                </div>
                            </div>
                            <span style={{ fontSize: 10, padding: "5px 12px", borderRadius: 8, fontWeight: 800, textTransform: "uppercase", background: "#f8fafc", border: "1px solid #f1f5f9", color: "#94a3b8" }}>Session Expired</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
                            {[["Access Intent", a.purpose], ["Clearance", a.duration], ["Timestamp", a.date]].map(([l, v]) => (
                                <div key={l} style={{ padding: "12px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>{l}</div>
                                    <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 700 }}>{v}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: 16, border: "1px dotted #e2e8f0" }}>
                            <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>Data Objects Decrypted</p>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {a.dataAccessed.map((d, j) => (
                                    <span key={j} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 10, background: "#ffffff", border: "1px solid #f1f5f9", color: "#2563eb", fontWeight: 700 }}>{d}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Settings Page ---
function SettingsPage({ PATIENT, onUpdate }) {
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        gender: PATIENT.gender || "",
        dob: PATIENT.dob || "",
        bloodGroup: PATIENT.bloodGroup || "",
        phone: PATIENT.phone || "",
        email: PATIENT.email || ""
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put('/api/my-profile', formData);
            if (onUpdate) onUpdate(formData);
            setEditMode(false);
            alert("Profile updated successfully!");
        } catch (err) {
            alert("Save failed: " + (err.response?.data || err.message));
        }
        setSaving(false);
    };

    const fieldStyle = { width: "100%", padding: "14px 18px", borderRadius: 14, border: "1px solid #e2e8f0", fontSize: 15, fontWeight: 600, outline: "none", background: editMode ? "#fff" : "#f8fafc" };
    const labelStyle = { display: "block", fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 };

    return (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: 30, fontWeight: 700, color: "#0f172a", margin: "0 0 4px", fontFamily: "'Outfit', sans-serif" }}>My Profile</h1>
                    <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>Manage your personal information and health identity</p>
                </div>
                <button onClick={() => editMode ? handleSave() : setEditMode(true)} disabled={saving} style={{
                    padding: "12px 28px", borderRadius: 14, border: "none",
                    background: editMode ? "#2563eb" : "#f1f5f9", color: editMode ? "#fff" : "#475569",
                    fontWeight: 800, fontSize: 14, cursor: "pointer"
                }}>{saving ? "Saving..." : editMode ? "Save Changes" : "Edit Profile"}</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Personal Info */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 32 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 24px" }}>Personal Information</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        <div>
                            <label style={labelStyle}>Full Name</label>
                            <input disabled value={PATIENT.name} style={{ ...fieldStyle, background: "#f8fafc" }} />
                        </div>
                        <div>
                            <label style={labelStyle}>ABHA Address</label>
                            <input disabled value={PATIENT.uhid} style={{ ...fieldStyle, background: "#f8fafc", fontFamily: "monospace" }} />
                        </div>
                        <div>
                            <label style={labelStyle}>Date of Birth</label>
                            <input type="date" disabled={!editMode} value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} style={fieldStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Gender</label>
                            <select disabled={!editMode} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} style={{ ...fieldStyle, background: editMode ? "#fff" : "#f8fafc" }}>
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Blood Group</label>
                            <select disabled={!editMode} value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} style={{ ...fieldStyle, background: editMode ? "#fff" : "#f8fafc" }}>
                                <option value="">Select</option>
                                <option>A+</option><option>A-</option>
                                <option>B+</option><option>B-</option>
                                <option>O+</option><option>O-</option>
                                <option>AB+</option><option>AB-</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Phone</label>
                            <input disabled={!editMode} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={fieldStyle} placeholder="+91..." />
                        </div>
                        <div>
                            <label style={labelStyle}>Email</label>
                            <input disabled={!editMode} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={fieldStyle} placeholder="name@email.com" />
                        </div>
                    </div>
                </div>

                {/* ABHA Integration */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 32 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>ABHA Integration</h3>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12 }}>
                        <div>
                            <span style={{ fontSize: 15, fontWeight: 700, color: "#22c55e", display: "flex", alignItems: "center", gap: 8 }}>
                                <Icons.Check /> Connected
                            </span>
                            <span style={{ fontSize: 13, color: "#64748b", marginTop: 4, display: "block" }}>{PATIENT.uhid}</span>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 32 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Notifications</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {["Consent Requests via SMS", "Consent Requests via Email", "New Report Available", "Weekly Health Summary"].map(n => (
                            <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #e2e8f0" }}>
                                <span style={{ fontSize: 14, color: "#0f172a" }}>{n}</span>
                                <div style={{ width: 44, height: 24, borderRadius: 12, background: "#2563eb", cursor: "pointer", position: "relative" }}>
                                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", right: 2, top: 2 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {editMode && (
                    <button onClick={() => setEditMode(false)} style={{ padding: "14px", borderRadius: 14, border: "1px solid #e2e8f0", background: "transparent", color: "#64748b", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Cancel</button>
                )}
            </div>
        </div>
    )
}

// ============================================================
// MAIN APP
// ============================================================
export default function UPHIPatientPortal() {
    const [page, setPage] = useState("overview");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [time, setTime] = useState(new Date());
    const [showNotifications, setShowNotifications] = useState(false);
    const [selectedImaging, setSelectedImaging] = useState(null);

    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };
    const [PATIENT, setPatient] = useState(null);
    const [CONSENT_REQUESTS, setConsents] = useState([]);
    const [REPORTS, setReports] = useState([]);
    const [TIMELINE, setTimeline] = useState([]);
    const [ACCESS_HISTORY, setAccessHistory] = useState([]);
    const [RISK, setRisk] = useState({});
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const patRes = await axios.get('/api/patients/me');
                const conRes = await axios.get('/api/consents/patient').catch(() => ({ data: [] }));
                const repRes = await axios.get('/api/records/me').catch(() => ({ data: [] }));

                // Normalization
                const p = patRes.data;
                p.name = p.fullName || "User";
                p.uhid = p.abhaAddress || "ABHA-XXXX";
                p.allergies = p.allergies || [];
                p.conditions = p.conditions || [];
                p.medications = p.medications || [];
                
                // Ensure vitals sub-obj is flat and clean
                const rawVitals = p.vitals || {};
                p.vitals = {
                    hr: rawVitals.heartRate || rawVitals.hr || "78",
                    bp: rawVitals.bloodPressure || rawVitals.bp || "120/80",
                    spo2: rawVitals.spO2 || rawVitals.spo2 || "98",
                    temp: rawVitals.temperature || rawVitals.temp || "36.5",
                    weight: rawVitals.weight || "72",
                    bmi: rawVitals.bmi || "24.2"
                };

                // Fetch Notifications
                const notifRes = await axios.get('/api/notifications/my').catch(() => ({ data: [] }));
                setNotifications(notifRes.data || []);

                setPatient(p);
                setConsents((conRes.data || []).map(c => ({...c, status: (c.status || "PENDING").toUpperCase()})));
                
                // Map Backend Medical Records to Reports & Timeline UI format
                const records = repRes.data || [];
                const reps = records.map(r => ({
                    id: r.id,
                    name: r.diagnosticSummary || ((r.type || "Medical") + " Document"),
                    type: (r.type || "Lab Report").toUpperCase() === "X-RAY" ? "X-Ray" : (r.type || "Lab Report"),
                    date: new Date(r.date || new Date()).toLocaleDateString('en-GB'),
                    facility: r.hospitalName || "Apollo Hospital",
                    color: "#2563eb",
                    original: r
                }));
                setReports(reps);
                
                const tl = records.map((r, idx) => ({
                    id: r.id,
                    type: (r.type || "consultation").toLowerCase(),
                    // Hardcoded historical spread for demo purposes to avoid duplicate timestamps from single seeder execution
                    date: new Date(Date.now() - idx * 2592000000).toISOString().split('T')[0],
                    event: r.type || "Clinical Visit",
                    detail: r.diagnosticSummary || "Routine checkup and evaluation completed.",
                    facility: r.hospitalName || "Apollo Hospital"
                }));
                // ensure at least some dummy timeline if backend provides 0 records
                if (tl.length === 0 && p.uhid === "ABHA-1234-5678") {
                     tl.push({ id:"t1", type:"consultation", date:"2026-03-15", event:"Initial Consultation", detail:"Patient presented with mild symptoms.", facility:"Apollo Hospital" });
                }
                setTimeline(tl);

                // Build rich Mock Risk model
                const richRisk = {
                    cardiac: { score: 12, level: "Low", tip: "Cardiovascular health is optimal. Maintain current diet.", trend: "stable" },
                    diabetes: { score: 78, level: "High", tip: "Metabolic indicators show elevated HbA1c. Immediate protocol adherence required.", trend: "increasing" },
                    ckd: { score: 34, level: "Moderate", tip: "Renal markers are within acceptable upper limits. Monitor hydration.", trend: "decreasing" },
                    readmission: { score: 5, level: "Low", tip: "Clinical stability is excellent. Risk of acute events is minimal.", trend: "stable" }
                };
                setRisk(richRisk);

                // Build Mock Access History
                const dummyAccess = [
                    { id: "A1", doctor: "Dr. Arvind Mehta", hospital: "Apollo Hospital", purpose: "Treatment Plan Review", duration: "1 Hour", date: "2 Hours ago", dataAccessed: ["Vitals", "Medications", "Lab Reports"] },
                    { id: "A2", doctor: "Dr. Sarah Khan", hospital: "Apollo Hospital", purpose: "Emergency Consult", duration: "24 Hours", date: "Yesterday, 14:30", dataAccessed: ["Allergies", "Conditions", "Recent Scans"] },
                    { id: "A3", doctor: "Nursing Staff", hospital: "City General", purpose: "Routine Admission", duration: "8 Hours", date: "Last Week", dataAccessed: ["Vitals", "Contact Info"] }
                ];
                setAccessHistory(dummyAccess);
            } catch (err) {
                console.error("Failed to load data", err);
                if (err.response && err.response.status === 401) {
                    logout();
                    navigate('/');
                    return;
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>Loading dashboard...</div>;
    }
    if (!PATIENT) {
        navigate('/');
        return null;
    }

    const pendingCount = CONSENT_REQUESTS.filter(r => r.status === "PENDING").length;

    const navItems = [
        { id: "overview", label: "Overview", icon: <Icons.Dashboard /> },
        { id: "timeline", label: "My Timeline", icon: <Icons.Timeline /> },
        { id: "consent", label: "Consent", icon: <Icons.Shield />, badge: pendingCount },
        { id: "reports", label: "My Reports", icon: <Icons.File /> },
        { id: "risk", label: "Risk Scores", icon: <Icons.Activity /> },
        { id: "access", label: "Access Log", icon: <Icons.Eye /> },
        { id: "settings", label: "My Profile", icon: <Icons.Settings /> },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans flex overflow-hidden">
            {/* Sidebar */}
            <aside className={`uphi-sidebar fixed left-0 top-0 h-full flex flex-col z-50 bg-[#ffffff] border-r border-[#e2e8f0] transition-all ease-in-out duration-300 ${sidebarCollapsed ? 'w-20' : 'w-72'}`}>
                {/* Logo */}
                <div className="h-20 flex items-center px-6 border-b border-[#f1f5f9]">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <Icons.Activity className="text-white w-6 h-6" />
                    </div>
                    {!sidebarCollapsed && (
                        <div className="ml-4 overflow-hidden">
                            <span className="text-lg font-bold tracking-tight block">UPHI Gateway</span>
                            <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Clinical Network</span>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    {navItems.map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => setPage(item.id)} 
                            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-semibold transition-all w-full relative ${
                                page === item.id 
                                ? 'bg-blue-50 text-blue-600 shadow-sm' 
                                : 'text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]'
                            }`}
                        >
                            <span className={`transition-colors ${page === item.id ? 'text-blue-600' : 'text-[#94a3b8]'}`}>{item.icon}</span>
                            {!sidebarCollapsed && <span className="text-[13px] tracking-tight">{item.label}</span>}
                            {item.badge > 0 && (
                                <span className={`ml-auto min-w-[20px] h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1.5 ${sidebarCollapsed ? 'absolute -top-1 -right-1' : ''} bg-blue-600 shadow-sm`}>{item.badge}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Patient Profile mini */}
                {!sidebarCollapsed && (
                    <div className="m-4 p-4 rounded-2xl bg-[#f8fafc] border border-[#f1f5f9]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                {PATIENT.name[0]}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold truncate">{PATIENT.name}</p>
                                <p className="text-[10px] text-[#94a3b8] font-mono truncate">{PATIENT.uhid}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-4 mt-auto border-t border-[#f1f5f9]">
                    <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full py-3.5 text-[#64748b] font-bold text-[11px] uppercase tracking-widest hover:bg-[#f8fafc] rounded-xl transition-colors">
                        {sidebarCollapsed ? ">>" : "Collapse Pane"}
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className={`uphi-main flex-1 min-h-screen relative transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'}`}>
                {/* Topbar */}
                <header className="h-20 border-b border-[#e2e8f0] bg-white flex items-center justify-between px-10 sticky top-0 z-40">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f0f9ff] border border-[#e0f2fe] rounded-full">
                            <div className="w-2 h-2 rounded-full bg-[#0ea5e9] animate-pulse"></div>
                            <span className="text-[10px] text-[#0369a1] font-bold uppercase tracking-wide">Live Monitoring</span>
                        </div>
                        <span className="text-[13px] text-[#64748b] font-medium hidden md:inline">{time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div style={{ position: 'relative' }}>
                            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2.5 rounded-xl hover:bg-[#f8fafc] text-[#64748b] transition-colors relative">
                                <Icons.Bell />
                                {CONSENT_REQUESTS.filter(r => r.status === 'pending').length > 0 && (
                                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
                                )}
                            </button>
                            {showNotifications && (
                                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 340, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden', animation: 'fadeIn 0.2s ease' }}>
                                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Notifications</span>
                                        <button onClick={() => setShowNotifications(false)} style={{ color: '#94a3b8', cursor: 'pointer', background: 'none', border: 'none' }}><Icons.X /></button>
                                    </div>
                                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                        {/* Clinical Action Notifications (UPLOAD_REQUEST) */}
                                        {notifications.filter(n => !n.read).map((n, i) => (
                                            <div key={n.id} onClick={() => { 
                                                setShowNotifications(false); 
                                                if(n.type === 'UPLOAD_REQUEST') {
                                                    setPage('reports');
                                                    // Optional: trigger file picker or highlight section
                                                }
                                            }} style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', transition: 'background 0.15s', background: n.type === 'UPLOAD_REQUEST' ? 'rgba(37,99,235,0.03)' : 'transparent' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={e => e.currentTarget.style.background = n.type === 'UPLOAD_REQUEST' ? 'rgba(37,99,235,0.03)' : 'transparent'}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: n.type === 'UPLOAD_REQUEST' ? 'rgba(37,99,235,0.1)' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                                                        {n.type === 'UPLOAD_REQUEST' ? <Icons.File style={{width: 18, height: 18}}/> : <Icons.Bell style={{width: 18, height: 18}}/>}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>{n.title}</p>
                                                        <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.4 }}>{n.message}</p>
                                                        {n.type === 'UPLOAD_REQUEST' && (
                                                            <div style={{ marginTop: 8, fontSize: 11, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action: Upload {n.metadata || 'Document'} →</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Legacy Consent Requests (Compatibility) */}
                                        {CONSENT_REQUESTS.filter(r => r.status === 'pending').map((c, i) => (
                                            <div key={`con-${i}`} onClick={() => { setShowNotifications(false); setPage('consent'); }} style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', transition: 'background 0.15s' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                                                        <Icons.Shield style={{width: 18, height: 18}}/>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>{c.doctor}</p>
                                                        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Requested access to your records</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {notifications.length === 0 && CONSENT_REQUESTS.filter(r => r.status === 'pending').length === 0 && (
                                            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94a3b8' }}>
                                                <Icons.Check />
                                                <p style={{ fontSize: 13, marginTop: 8 }}>You're all caught up!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="h-8 w-px bg-[#e2e8f0] mx-1"></div>
                        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#ef4444] font-bold text-xs hover:bg-red-50 transition-all active:scale-95">
                            <Icons.LogOut /> Sign Out
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="p-10">
                    {page === "overview" && <OverviewPage onNavigate={setPage} pendingCount={pendingCount} PATIENT={PATIENT} CONSENT_REQUESTS={CONSENT_REQUESTS} />}
                    {page === "timeline" && <TimelinePage TIMELINE={TIMELINE} onViewImaging={setSelectedImaging} />}
                    {page === "consent" && <ConsentPage CONSENT_REQUESTS={CONSENT_REQUESTS} setConsents={setConsents} setPage={setPage} />}
                    {page === "reports" && <ReportsPage REPORTS={REPORTS} PATIENT={PATIENT} onViewImaging={setSelectedImaging} />}
                    {page === "risk" && <RiskPage RISK={RISK} PATIENT={PATIENT} />}
                    {page === "access" && <AccessLogPage ACCESS_HISTORY={ACCESS_HISTORY} />}
                    {page === "settings" && <SettingsPage PATIENT={PATIENT} setPatient={setPatient} />}
                </div>

                {selectedImaging && <DiagnosticViewer record={selectedImaging} onClose={() => setSelectedImaging(null)} />}
            </main>
        </div>
    );
}