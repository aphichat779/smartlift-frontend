// src/components/auth/RegisterForm.jsx

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, UserPlus, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from './AuthLayout';

// --- 1. สร้าง Variants สำหรับแอนิเมชัน (ปรับปรุงใหม่) ---
const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
};

// --- NEW: Variants สำหรับ Stagger Animation (การแสดงผลทีละส่วน) ---
const staggerContainerVariants = {
  visible: {
    transition: {
      staggerChildren: 0.07, // ให้แต่ละ item ดีเลย์ 0.07 วินาที
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// --- NEW: Variants สำหรับไอคอน Success ให้เด่นขึ้น ---
const successIconVariants = {
    hidden: { scale: 0.5, opacity: 0 },
    visible: {
        scale: [0.5, 1.1, 1], // Animation เด้งๆ
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 20,
            delay: 0.2
        }
    }
}

// --- NEW: สร้าง MotionButton เพื่อให้ Button ของ shadcn/ui ใช้แอนิเมชันได้ ---
const MotionButton = motion(Button);

const RegisterForm = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '', password: '', confirmPassword: '', first_name: '',
    last_name: '', email: '', phone: '', birthdate: '', address: '',
    recovery_email: '', recovery_phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return false;
    }
    if (formData.password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError('');
    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      setSuccess(true);
    } catch (error) {
      setError(error.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        {success ? (
          // --- หน้าจอ Success (ปรับปรุง) ---
          <motion.div key="success" variants={formVariants} initial="hidden" animate="visible" exit="exit">
            <Card className="w-full max-w-md mx-auto bg-white/85 backdrop-blur shadow-xl ring-1 ring-slate-200 rounded-2xl">
              <CardHeader className="space-y-1 text-center">
                {/* --- UPDATED: เพิ่มแอนิเมชันให้ไอคอน --- */}
                <motion.div variants={successIconVariants} initial="hidden" animate="visible" className="inline-block p-3 bg-green-100 rounded-full mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </motion.div>
                <CardTitle className="text-2xl">สมัครสมาชิกสำเร็จ!</CardTitle>
                <CardDescription>บัญชีของคุณถูกสร้างเรียบร้อยแล้ว</CardDescription>
              </CardHeader>
              <CardContent>
                {/* --- UPDATED: ใช้ MotionButton --- */}
                <MotionButton
                  onClick={onSwitchToLogin}
                  className="w-full"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  เข้าสู่ระบบ
                </MotionButton>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          // --- ฟอร์มสมัครสมาชิก (ปรับปรุง) ---
          <motion.div key="form" variants={formVariants} initial="hidden" animate="visible" exit="exit">
            <Card className="w-full max-w-2xl mx-auto bg-white/85 backdrop-blur shadow-xl ring-1 ring-slate-200 rounded-2xl">
              <CardHeader className="space-y-1 text-center">
                <div className="inline-block p-3 bg-primary/10 rounded-full mx-auto mb-4">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">สมัครสมาชิก</CardTitle>
                <CardDescription>กรุณากรอกข้อมูลเพื่อสร้างบัญชี SmartLift</CardDescription>
              </CardHeader>
              <CardContent>
                {/* --- UPDATED: ครอบ form ด้วย stagger container --- */}
                <motion.form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                  variants={staggerContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* --- UPDATED: ครอบ Input Fields ด้วย motion.div เพื่อทำ Stagger --- */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div variants={itemVariants} className="space-y-2">
                      <Label htmlFor="username">ชื่อผู้ใช้ *</Label>
                      <Input id="username" name="username" value={formData.username} onChange={handleChange} required disabled={loading} />
                    </motion.div>
                    <motion.div variants={itemVariants} className="space-y-2">
                      <Label htmlFor="email">อีเมล *</Label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required disabled={loading} />
                    </motion.div>
                    <motion.div variants={itemVariants} className="space-y-2">
                      <Label htmlFor="first_name">ชื่อ *</Label>
                      <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required disabled={loading} />
                    </motion.div>
                    <motion.div variants={itemVariants} className="space-y-2">
                      <Label htmlFor="last_name">นามสกุล *</Label>
                      <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required disabled={loading} />
                    </motion.div>
                    <motion.div variants={itemVariants} className="space-y-2">
                      <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
                      <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required disabled={loading} />
                    </motion.div>
                    <motion.div variants={itemVariants} className="space-y-2">
                      <Label htmlFor="birthdate">วันเกิด *</Label>
                      <Input id="birthdate" name="birthdate" type="date" value={formData.birthdate} onChange={handleChange} required disabled={loading} />
                    </motion.div>
                  </div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="address">ที่อยู่ *</Label>
                    <Input id="address" name="address" value={formData.address} onChange={handleChange} required disabled={loading} />
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div variants={itemVariants} className="space-y-2">
                      <Label htmlFor="password">รหัสผ่าน *</Label>
                      <div className="relative">
                        <Input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} className="pr-10" required disabled={loading} />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={loading}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </motion.div>
                    <motion.div variants={itemVariants} className="space-y-2">
                      <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน *</Label>
                      <div className="relative">
                        <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} className="pr-10" required disabled={loading} />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={loading}>
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </motion.div>
                  </div>

                  <motion.div variants={itemVariants}>
                    <MotionButton
                        type="submit"
                        className="w-full"
                        disabled={loading}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังสมัครสมาชิก...</>) : ('สมัครสมาชิก')}
                    </MotionButton>
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="text-center text-sm text-muted-foreground">
                    มีบัญชีอยู่แล้ว?{' '}
                    <Button type="button" variant="link" onClick={onSwitchToLogin} className="p-0 h-auto font-normal">
                      เข้าสู่ระบบ
                    </Button>
                  </motion.div>
                </motion.form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

export default RegisterForm;