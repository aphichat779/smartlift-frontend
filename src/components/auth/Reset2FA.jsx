// src/components/auth/Reset2FA.jsx

import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { Loader2, RotateCcw, ArrowLeft, Mail, Phone, CheckCircle } from 'lucide-react';
// --- เพิ่มการ import motion และ AnimatePresence ---
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper Component for Layout ---
// เพิ่ม motion.div เพื่อให้ทั้งการ์ดมีแอนิเมชันตอนเริ่มต้น
const AuthLayout = ({ icon, title, description, children }) => (
  <div className="flex items-center justify-center min-h-screen p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full max-w-md mx-auto p-8 bg-white/85 backdrop-blur shadow-[0_12px_30px_-12px_rgba(2,6,23,0.25)] ring-1 ring-slate-200 rounded-2xl"
    >
      <div className="text-center">
        {icon}
        <h1 className="text-2xl font-bold text-slate-900 mt-4">{title}</h1>
        <p className="text-slate-500 mt-1">{description}</p>
      </div>
      <div className="mt-8">{children}</div>
    </motion.div>
  </div>
);

// --- Helper Component for Custom Radio Button ---
// เพิ่ม motion.label เพื่อสร้างแอนิเมชันตอน hover และ tap
const RadioCard = ({ id, value, name, checked, onChange, icon, label }) => (
  <div>
    <input
      type="radio"
      id={id}
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    <motion.label
      htmlFor={id}
      className={`flex items-center gap-3 p-4 rounded-xl ring-1 cursor-pointer transition-colors duration-200 ${
        checked
          ? 'bg-blue-50 ring-blue-500 shadow-sm'
          : 'bg-white ring-slate-200 hover:bg-slate-50'
      }`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      {icon}
      <span className={`font-medium ${checked ? 'text-blue-800' : 'text-slate-700'}`}>
        {label}
      </span>
    </motion.label>
  </div>
);

// --- ตัวแปรสำหรับแอนิเมชันการเปลี่ยนหน้า ---
const stepVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: 'easeIn' } },
};

export default function Reset2FA({ onBack }) {
  const [step, setStep] = useState('request'); // 'request', 'verify', 'success'
  const [formData, setFormData] = useState({
    username: '',
    method: 'email',
    otpCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetData, setResetData] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiService.requestReset2FA(formData.username, formData.method);
      setStep('verify');
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการส่ง OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyReset = async (e) => {
    e.preventDefault();
    if (formData.otpCode.length !== 6) {
      setError('กรุณาใส่รหัส OTP 6 หลัก');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await apiService.verifyReset2FA(formData.username, formData.otpCode);
      setResetData(response.data);
      setStep('success');
    } catch (err) {
      setError(err.message || 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'success':
        return (
          <motion.div key="success" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <div className="space-y-6">
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg text-sm text-amber-800 text-center">
                <b>สำคัญ:</b> โปรดเข้าสู่ระบบและเปิดใช้งาน 2FA อีกครั้งโดยเร็วที่สุด
              </div>
              {resetData?.secret_key && (
                <div>
                  <label className="text-sm font-medium text-slate-700">New Secret Key:</label>
                  <div className="mt-1 p-3 bg-slate-100 rounded-lg text-sm font-mono break-all text-slate-600">
                    {resetData.secret_key}
                  </div>
                </div>
              )}
              <button
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md hover:opacity-95 transition-colors"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          </motion.div>
        );

      case 'verify':
        return (
          <motion.div key="verify" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <form onSubmit={handleVerifyReset} className="space-y-6">
              <AnimatePresence>
                {error && (
                   <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-center text-red-600 bg-red-50 p-3 rounded-lg"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              <div>
                <label htmlFor="otpCode" className="sr-only">รหัส OTP</label>
                <input
                  id="otpCode" name="otpCode" type="text" inputMode="numeric"
                  value={formData.otpCode}
                  onChange={handleChange}
                  placeholder="------"
                  className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                  required
                />
              </div>
              <div className="space-y-3">
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md hover:opacity-95 transition-colors disabled:opacity-50" disabled={loading || formData.otpCode.length !== 6}>
                  {loading ? <><Loader2 className="h-5 w-5 animate-spin" /><span>กำลังตรวจสอบ...</span></> : 'ยืนยันและรีเซ็ต'}
                </button>
                <button type="button" onClick={() => setStep('request')} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/80 ring-1 ring-slate-200 hover:bg-white text-slate-700 font-medium transition-colors disabled:opacity-50" disabled={loading}>
                  <ArrowLeft className="h-4 w-4" /> กลับ
                </button>
              </div>
            </form>
          </motion.div>
        );

      default: // 'request' step
        return (
          <motion.div key="request" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <form onSubmit={handleRequestReset} className="space-y-6">
               <AnimatePresence>
                {error && (
                   <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-center text-red-600 bg-red-50 p-3 rounded-lg"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">ชื่อผู้ใช้</label>
                <input
                  id="username" name="username" type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              <fieldset>
                <legend className="text-sm font-medium text-slate-700 mb-3">เลือกช่องทางรับ OTP</legend>
                <div className="grid grid-cols-2 gap-3">
                  <RadioCard
                    id="email" value="email" name="method"
                    checked={formData.method === 'email'}
                    onChange={handleChange}
                    icon={<Mail className="w-4 h-4 text-slate-400" />}
                    label="ส่งทางอีเมล"
                  />
                  <RadioCard
                    id="sms" value="sms" name="method"
                    checked={formData.method === 'sms'}
                    onChange={handleChange}
                    icon={<Phone className="w-4 h-4 text-slate-400" />}
                    label="ส่งทาง SMS"
                  />
                </div>
              </fieldset>
              <div className="space-y-3 pt-2">
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md hover:opacity-95 transition-colors disabled:opacity-50" disabled={loading || !formData.username}>
                  {loading ? <><Loader2 className="h-5 w-5 animate-spin" /><span>กำลังส่ง...</span></> : 'ส่งรหัส OTP'}
                </button>
                <button type="button" onClick={onBack} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/80 ring-1 ring-slate-200 hover:bg-white text-slate-700 font-medium transition-colors disabled:opacity-50" disabled={loading}>
                  <ArrowLeft className="h-4 w-4" /> กลับ
                </button>
              </div>
            </form>
          </motion.div>
        );
    }
  };
  
  // สร้างฟังก์ชันสำหรับจัดการข้อมูลที่แสดงในแต่ละ step
  const getStepData = () => {
    switch(step) {
      case 'success':
        return {
          icon: <div className="inline-block p-4 bg-green-100 rounded-full"><CheckCircle className="h-10 w-10 text-green-600" strokeWidth={1.5} /></div>,
          title: "รีเซ็ต 2FA สำเร็จ",
          description: "2FA ของคุณถูกปิดใช้งานแล้ว กรุณาตั้งค่าใหม่เพื่อความปลอดภัย"
        };
      case 'verify':
        return {
          icon: <div className="inline-block p-4 bg-blue-100 rounded-full"><RotateCcw className="h-10 w-10 text-blue-600" strokeWidth={1.5} /></div>,
          title: "ยืนยันรหัส OTP",
          description: `เราได้ส่งรหัส OTP 6 หลักไปยัง ${formData.method === 'email' ? 'อีเมล' : 'เบอร์โทรศัพท์'} ของคุณแล้ว`
        };
      default: // 'request'
        return {
          icon: <div className="inline-block p-4 bg-blue-100 rounded-full"><RotateCcw className="h-10 w-10 text-blue-600" strokeWidth={1.5} /></div>,
          title: "รีเซ็ต 2FA",
          description: "หากคุณไม่สามารถเข้าถึง Authenticator ได้ กรุณากรอกข้อมูลเพื่อรีเซ็ต"
        };
    }
  }

  const { icon, title, description } = getStepData();

  return (
    <AuthLayout icon={icon} title={title} description={description}>
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </AuthLayout>
  );
}