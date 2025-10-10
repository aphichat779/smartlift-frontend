// src/components/auth/LoginForm.jsx

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

// รับ prop onSwitchToReset2FA เพิ่มเข้ามา
export default function LoginForm({ onRequire2FA, onSwitchToRegister, onForgotPassword, onSwitchToReset2FA }) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(formData);
      if (result.requires2FA) {
        onRequire2FA(); 
      }
    } catch (err) {
      setError(err.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md mx-auto p-8 bg-white/85 backdrop-blur shadow-[0_12px_30px_-12px_rgba(2,6,23,0.25)] ring-1 ring-slate-200 rounded-2xl"
      >
        
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3, type: "spring", stiffness: 200 }}
            className="inline-block p-4 bg-blue-100 rounded-full"
          >
            <Shield className="h-10 w-10 text-blue-600" strokeWidth={1.5} />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-900 mt-4">เข้าสู่ระบบ</h1>
          <p className="text-slate-500 mt-1">ยินดีต้อนรับ, กรุณากรอกข้อมูลเพื่อใช้งาน</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-center text-red-600 bg-red-50 p-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
                ชื่อผู้ใช้ หรือ อีเมล
              </label>
              <input
                id="username" name="username" type="text"
                value={formData.username} onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password} onChange={handleChange}
                  className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* ----- ส่วนที่แก้ไข ----- */}
              <div className="flex justify-end items-center gap-2 text-sm mt-1">
                <button type="button" onClick={onForgotPassword} className="font-medium text-blue-600 hover:text-blue-800 transition-colors">
                  ลืมรหัสผ่าน?
                </button>
                <span className="text-slate-300">|</span>
                <button type="button" onClick={onSwitchToReset2FA} className="font-medium text-blue-600 hover:text-blue-800 transition-colors">
                  รีเซ็ต 2FA
                </button>
              </div>
              {/* ----- สิ้นสุดส่วนที่แก้ไข ----- */}

            </div>
          </div>

          <motion.button 
            type="submit" 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md hover:opacity-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={loading || !formData.username || !formData.password}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              'เข้าสู่ระบบ'
            )}
          </motion.button>
        </form>
        
        <div className="text-center text-sm text-slate-600 mt-6 border-t border-slate-200 pt-4">
          ยังไม่มีบัญชี?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            สมัครสมาชิกที่นี่
          </button>
        </div>
      </motion.div>
    </div>
  );
}