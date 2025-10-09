// src/components/auth/TwoFactorVerification.jsx

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // (สำคัญ) โปรดตรวจสอบ path ให้ถูกต้อง
import { Loader2, Shield, ArrowLeft } from 'lucide-react';

export default function TwoFactorVerification({ onBack }) {
  const { verify2FA } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (code.length !== 6 && code.length !== 10) {
      setError('กรุณาใส่รหัส 6 หลัก หรือ Backup Code 10 หลัก');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verify2FA(code);
      // AuthProvider จะจัดการ redirect อัตโนมัติเมื่อสำเร็จ
    } catch (err) {
      setError(err.message || 'รหัสยืนยันไม่ถูกต้องหรือหมดอายุ');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setCode(value);
    if (error) setError(''); // ลบ error ทันทีที่ผู้ใช้เริ่มพิมพ์ใหม่
  };
  
  const canSubmit = !loading && (code.length === 6 || code.length === 10);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200">
      <div className="w-full max-w-md mx-auto p-8 bg-white/85 backdrop-blur shadow-[0_12px_30px_-12px_rgba(2,6,23,0.25)] ring-1 ring-slate-200 rounded-2xl">
        
        <div className="text-center">
          <div className="inline-block p-4 bg-blue-100 rounded-full">
            <Shield className="h-10 w-10 text-blue-600" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-4">
            ยืนยันตัวตน 2 ขั้นตอน
          </h1>
          <p className="text-slate-500 mt-1">
            เพื่อความปลอดภัย กรุณากรอกรหัสจากแอป Authenticator
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="text-sm text-center text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="code" className="sr-only">รหัสยืนยัน</label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              value={code}
              onChange={handleCodeChange}
              placeholder="------"
              className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
              required
              disabled={loading}
              autoComplete="one-time-code"
            />
            <p className="text-xs text-slate-500 text-center mt-2">
              ใส่รหัส 6 หลัก หรือ Backup Code 10 หลัก
            </p>
          </div>

          <div className="space-y-3">
            <button 
              type="submit" 
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md hover:opacity-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!canSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>กำลังตรวจสอบ...</span>
                </>
              ) : (
                'ยืนยันรหัส'
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/80 ring-1 ring-slate-200 hover:bg-white text-slate-700 font-medium transition-colors disabled:opacity-50"
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4" />
              กลับ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}