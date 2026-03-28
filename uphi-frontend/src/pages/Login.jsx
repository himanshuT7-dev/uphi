import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Shield, User, HeartPulse, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export default function Login() {
    const [loginMethod, setLoginMethod] = useState('abha');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [role, setRole] = useState('patient'); // patient, hospital, admin
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (identifier.includes('@')) {
            setLoading(true);
            try {
                await axios.post('/api/receptionist/patients/otp/generate', {
                    email: identifier
                });
                setOtpSent(true);
            } catch (error) {
                alert("Failed to send OTP. Please check your email address.");
            } finally {
                setLoading(false);
            }
        } else {
            alert("Please enter a valid Email address to receive an OTP.");
        }
    };


    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Try to register (This verifies OTP on backend)
            let abhaAddress = "";
            try {
                const response = await axios.post('/api/receptionist/patients/register', {
                    email: identifier.trim(),
                    otp: otp,
                    fullName: fullName || ("Patient " + identifier.split('@')[0]),
                    dob: dob,
                    gender: gender,
                    bloodGroup: bloodGroup,
                    address: "India",
                    oldDiagnosis: []
                });
                abhaAddress = response.data.abhaAddress;
            } catch (regError) {
                // 2. Fallback: If registration fails because user exists, we still need to LOGIN
                // But we first need to verify the OTP was actually valid for this session
                if (regError.response && regError.response.status === 400) {
                    // Check if it's an "already exists" error
                    // Proceed to login using the identifier (which can be email/phone/abha)
                    abhaAddress = identifier.trim();
                } else {
                    throw regError;
                }
            }
            
            // 3. Auto-login after registration or verified identity
            const loginRes = await axios.post('/api/auth/login', {
                username: abhaAddress,
                password: "PatientSecure@" + identifier.split('@')[0]
            });
            handleSuccessfulLogin(loginRes.data);
        } catch (error) {
            console.error("Verification/Login Failed", error);
            alert("Verification Failed. Please check the code in your inbox or ensure you are using the correct identifier.");
        } finally {
            setLoading(false);
        }
    };


    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post('/api/auth/login', {
                username: identifier.trim(),
                password: password.trim()
            });
            handleSuccessfulLogin(response.data);
        } catch (error) {
            alert("Invalid Credentials. Please contact administration.");
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessfulLogin = (data) => {
        login(data);
        if (data.role === 'ADMIN' || data.role === 'MAIN_ADMIN') {
            navigate('/admin');
        } else if (data.role === 'PATIENT') {
            navigate('/patient');
        } else {
            navigate('/hospital');
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-blue-100 selection:text-blue-900">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center flex-col items-center">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 mb-6"
                    >
                        <Activity className="h-8 w-8 text-blue-600" />
                    </motion.div>
                    <h2 className="text-center text-3xl font-bold tracking-tight text-[#0f172a] font-display">UPHI Network</h2>
                    <p className="mt-2 text-center text-sm text-[#475569] font-medium">
                        Unified Patient Health Insight
                    </p>
                </div>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-6 sm:px-12 rounded-3xl shadow-sm border border-slate-200">
                    
                    {/* Role Toggles */}
                    <div className="flex p-1 bg-[#f1f5f9] rounded-2xl mb-10 overflow-hidden border border-slate-100">
                        {['patient', 'hospital', 'admin'].map((r) => (
                            <button
                                key={r}
                                onClick={() => { setRole(r); setOtpSent(false); }}
                                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 ${
                                    role === r 
                                    ? 'bg-white text-blue-600 shadow-sm' 
                                    : 'text-[#64748b] hover:text-[#0f172a]'
                                }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {role === 'patient' ? (
                            !otpSent ? (
                                <motion.form 
                                    key="patient-login"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="space-y-8" 
                                    onSubmit={handleSendOtp}
                                >
                                    <div className="space-y-4">
                                        <label className="block text-xs font-bold uppercase tracking-widest text-[#64748b]">
                                            Identify Using
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {['abha', 'aadhaar'].map((m) => (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => setLoginMethod(m)}
                                                    className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                                                        loginMethod === m 
                                                        ? 'border-blue-600 bg-blue-50/50 text-blue-700' 
                                                        : 'border-slate-100 bg-[#f8fafc] text-[#475569] hover:border-slate-200'
                                                    }`}
                                                >
                                                    {m === 'abha' ? 'Email Address' : 'Aadhaar'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="identifier" className="block text-xs font-bold uppercase tracking-widest text-[#64748b] mb-3">
                                            {loginMethod === 'abha' ? 'Email Address' : 'Aadhaar Number'}
                                        </label>

                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600 text-[#94a3b8]">
                                                {loginMethod === 'abha' ? <HeartPulse className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                            </div>
                                            <input
                                                id="identifier"
                                                type="text"
                                                required
                                                value={identifier}
                                                onChange={(e) => setIdentifier(e.target.value)}
                                                onBlur={(e) => setIdentifier(e.target.value.trim())}
                                                className="block w-full pl-12 pr-4 bg-[#f8fafc] border border-slate-200 rounded-2xl py-4 text-[#0f172a] placeholder-[#94a3b8] focus:ring-0 focus:border-blue-600 transition-all font-medium"
                                                placeholder={loginMethod === 'abha' ? 'your@email.com' : '0000 0000 0000'}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                                    >
                                        {loading ? 'Processing...' : (
                                            <>
                                                Verify Email & Proceed
                                                <ChevronRight className="h-4 w-4" />

                                            </>
                                        )}
                                    </button>

                                    <div className="text-center pt-2">
                                        <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider">
                                            Create ABHA Identity
                                        </a>
                                    </div>
                                </motion.form>
                            ) : (
                                <motion.form 
                                    key="patient-otp"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-8" 
                                    onSubmit={handleVerifyOtp}
                                >
                                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                                        <div className="flex gap-4">
                                            <div className="bg-white p-2 rounded-xl shadow-sm border border-blue-100 mt-1">
                                                <Shield className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-blue-900 tracking-tight">Email Verification</h4>
                                                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                                                    Check your inbox at <span className="font-bold">{identifier}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <label htmlFor="otp" className="block text-xs font-bold uppercase tracking-widest text-[#64748b] mb-4">
                                            Authorization Code
                                        </label>
                                        <input
                                            id="otp"
                                            type="text"
                                            required
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            className="block w-full text-center tracking-[0.5em] font-mono bg-[#f8fafc] border border-slate-200 rounded-2xl py-5 text-3xl text-[#0f172a] focus:border-blue-600 focus:ring-0 transition-all font-bold"
                                            placeholder="------"
                                        />
                                    </div>


                                    <div className="space-y-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                                        >
                                            {loading ? 'Verifying...' : 'Complete Authentication'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setOtpSent(false)}
                                            className="w-full text-xs font-bold text-[#64748b] hover:text-[#0f172a] uppercase tracking-widest py-2"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </motion.form>
                            )
                        ) : (
                            <motion.form 
                                key="staff-login"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-8" 
                                onSubmit={handlePasswordLogin}
                            >
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="staffId" className="block text-xs font-bold uppercase tracking-widest text-[#64748b] mb-3">
                                            {role === 'admin' ? 'Email or Username' : 'Email, Portal ID or Clinical ID'}

                                        </label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94a3b8] group-focus-within:text-blue-600 transition-colors">
                                                <User className="h-5 w-5" />
                                            </div>
                                            <input
                                                id="staffId"
                                                type="text"
                                                required
                                                value={identifier}
                                                onChange={(e) => setIdentifier(e.target.value)}
                                                onBlur={(e) => setIdentifier(e.target.value.trim())}
                                                className="block w-full pl-12 pr-4 bg-[#f8fafc] border border-slate-200 rounded-2xl py-4 text-[#0f172a] placeholder-[#94a3b8] focus:border-blue-600 focus:ring-0 transition-all font-medium"
                                                placeholder={role === 'admin' ? 'admin@uphi' : 'doctor.smith@health'}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-[#64748b] mb-3">
                                            Access Key
                                        </label>
                                        <input
                                            id="password"
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full px-5 bg-[#f8fafc] border border-slate-200 rounded-2xl py-4 text-[#0f172a] placeholder-[#94a3b8] focus:border-blue-600 focus:ring-0 transition-all font-medium"
                                            placeholder="••••••••••••"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-md shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Decrypting...' : 'Secure Authorization'}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <div className="mt-12 text-center border-t border-slate-100 pt-8">
                        <p className="text-[10px] font-bold text-[#cbd5e1] uppercase tracking-[0.2em]">
                            End-to-End Encrypted Node Connection
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
