// src/components/auth/AuthLayout.jsx

import React from 'react';
import { motion } from 'framer-motion';

const AuthLayout = ({ children }) => {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200">
      {/* Container นี้จะทำให้ Card ที่อยู่ข้างใน
        มีแอนิเมชันปรากฏขึ้นมาตอนโหลดครั้งแรก
      */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default AuthLayout;