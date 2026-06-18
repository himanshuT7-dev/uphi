import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ShieldCheck, CheckCircle, ShieldAlert, Wifi, Globe, MapPin, Calendar, User, Activity, Building, Award, ArrowLeft } from "lucide-react";

/**
 * UPHI — Unified Patient Health Insight
 * Public Verification Interface
 * This page is triggered when a UPHI Health ID QR is scanned by an external device.
 */

const VerificationPage = () => {
    const { type, id } = useParams();
    const [status, setStatus] = useState("scanning"); // scanning, verified, error
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Mock a high-fidelity scanning animation delay
        const timer = setTimeout(() => {
            fetchVerification();
        }, 1800);
        return () => clearTimeout(timer);
    }, [type, id]);

    const fetchVerification = async () => {
        try {
            const res = await axios.get(`/api/verify/${type}/${id}`);
            setData(res.data);
            setStatus("verified");
        } catch (err) {
            console.error(err);
            setStatus("error");
            setError(err.response?.status === 404 ? "Identity Not Found in UPHI Registry" : "Verification Network Timeout");
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#f8fafc",
            fontFamily: "'Inter', sans-serif",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            overflow: "hidden"
        }}>
            {/* Background Glows */}
            <div style={{ position: "fixed", top: "-10%", right: "-10%", width: "40%", height: "40%", background: "radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)", filter: "blur(60px)", zIndex: 0 }} />
            <div style={{ position: "fixed", bottom: "-10%", left: "-10%", width: "40%", height: "40%", background: "radial-gradient(circle, rgba(13, 148, 136, 0.1) 0%, transparent 70%)", filter: "blur(60px)", zIndex: 0 }} />

            <div style={{ 
                position: "relative", zIndex: 10, width: "100%", maxWidth: 450, 
                textAlign: "center"
            }}>
                {/* Brand Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 40 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ShieldCheck size={20} color="#fff" />
                    </div>
                    <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>UPHI <span style={{ color: "#2563eb" }}>VERIFIED</span></span>
                </div>

                {status === "scanning" && (
                    <div style={{ padding: "40px 0", animation: "pulse 2s infinite" }}>
                        <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 30px" }}>
                            <div style={{ 
                                position: "absolute", inset: 0, borderRadius: "50%", 
                                border: "4px solid #2563eb", borderTopColor: "transparent",
                                animation: "spin 1s linear infinite"
                            }} />
                            <div style={{ position: "absolute", inset: 15, borderRadius: "50%", background: "rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Globe size={40} color="#2563eb" />
                            </div>
                        </div>
                        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Authenticating...</h2>
                        <p style={{ color: "#94a3b8", fontSize: 14 }}>Connecting to decentralized UPHI trust node</p>
                    </div>
                )}

                {status === "error" && (
                    <div style={{ 
                        background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)",
                        borderRadius: 32, padding: "40px 24px", backdropFilter: "blur(12px)"
                    }}>
                        <ShieldAlert size={64} color="#ef4444" style={{ marginBottom: 20 }} />
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#ef4444", marginBottom: 12 }}>Verification Failed</h2>
                        <p style={{ color: "#fca5a5", fontSize: 15, marginBottom: 30 }}>{error}</p>
                        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14, background: "rgba(255,255,255,0.1)", padding: "12px 24px", borderRadius: 14 }}>
                            <ArrowLeft size={18} /> Return to Portal
                        </Link>
                    </div>
                )}

                {status === "verified" && (
                    <div style={{ 
                        animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                        background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: 32, padding: 32, backdropFilter: "blur(20px)",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                    }}>
                        {/* Status Badge */}
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 800, marginBottom: 24, border: "1px solid rgba(34, 197, 94, 0.3)" }}>
                            <CheckCircle size={14} /> LIVE VERIFIED
                        </div>

                        <div style={{ 
                            width: 80, height: 80, borderRadius: 24, 
                            background: "linear-gradient(135deg, #2563eb 0%, #0d9488 100%)", 
                            margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 10px 20px rgba(37,99,235,0.2)"
                        }}>
                            {data.type === "PATIENT" ? <User size={40} color="#fff" /> : data.type === "HOSPITAL_FACILITY" ? <Building size={40} color="#fff" /> : <Award size={40} color="#fff" />}
                        </div>

                        <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4, letterSpacing: "-0.01em" }}>{data.name}</h2>
                        <p style={{ color: "#3b82f6", fontSize: 14, fontWeight: 700, marginBottom: 32 }}>{data.type} • {data.id}</p>

                        <div style={{ display: "grid", gap: 16, textAlign: "left" }}>
                            {data.type === "PATIENT" ? (
                                <>
                                    <DetailItem icon={<Calendar size={18} />} label="Date of Birth" value={data.dob} />
                                    <DetailItem icon={<Activity size={18} />} label="Blood Group" value={data.bloodGroup} />
                                </>
                            ) : data.type === "HOSPITAL_FACILITY" ? (
                                <>
                                    <DetailItem icon={<MapPin size={18} />} label="Address" value={data.address} />
                                    <DetailItem icon={<Wifi size={18} />} label="Network Status" value="Decentralized Node Active" />
                                </>
                            ) : (
                                <>
                                    <DetailItem icon={<Award size={18} />} label="Specialization" value={data.specialization} />
                                    {data.facility && <DetailItem icon={<Building size={18} />} label="Afilliated Facility" value={data.facility} />}
                                </>
                            )}
                        </div>

                        <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                            <img src="https://img.icons8.com/color/48/blockchain.png" width="24" alt="Trust" />
                            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.05em" }}>CRYPTOGRAPHICALLY SEALED IDENTITY</span>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

const DetailItem = ({ icon, label, value }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ color: "#94a3b8" }}>{icon}</div>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>{value}</div>
        </div>
    </div>
);

export default VerificationPage;
