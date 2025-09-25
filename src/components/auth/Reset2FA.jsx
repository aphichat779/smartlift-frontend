import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, RotateCcw, ArrowLeft, Mail, Phone, CheckCircle } from 'lucide-react';

const Reset2FA = ({ onBack }) => {
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleMethodChange = (value) => {
    setFormData({
      ...formData,
      method: value,
    });
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiService.requestReset2FA(formData.username, formData.method);
      setStep('verify');
    } catch (error) {
      setError(error.message || 'เกิดข้อผิดพลาดในการส่ง OTP');
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
    } catch (error) {
      setError(error.message || 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setFormData({
      ...formData,
      otpCode: value,
    });
    setError('');
  };

  if (step === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">รีเซ็ต 2FA สำเร็จ!</CardTitle>
          <CardDescription className="text-center">
            2FA ของคุณถูกรีเซ็ตเรียบร้อยแล้ว
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              กรุณาตั้งค่า 2FA ใหม่หลังจากเข้าสู่ระบบ เพื่อความปลอดภัยของบัญชี
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Secret Key ใหม่:</Label>
            <div className="p-2 bg-muted rounded text-sm font-mono break-all">
              {resetData?.secret_key}
            </div>
          </div>

          <Button onClick={onBack} className="w-full">
            กลับไปหน้าเข้าสู่ระบบ
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <RotateCcw className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">ยืนยัน OTP</CardTitle>
          <CardDescription className="text-center">
            กรุณาใส่รหัส OTP ที่ส่งไปยัง{formData.method === 'email' ? 'อีเมล' : 'SMS'}ของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyReset} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="otpCode">รหัส OTP</Label>
              <Input
                id="otpCode"
                type="text"
                value={formData.otpCode}
                onChange={handleOtpChange}
                placeholder="123456"
                className="text-center text-lg tracking-widest"
                maxLength={6}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground text-center">
                รหัส OTP จะหมดอายุใน 5 นาที
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading || formData.otpCode.length !== 6}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังยืนยัน...
                </>
              ) : (
                'ยืนยันและรีเซ็ต 2FA'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('request')}
              className="w-full"
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับ
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <RotateCcw className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">รีเซ็ต 2FA</CardTitle>
          <CardDescription className="text-center">
            หากคุณทำอุปกรณ์หาย สามารถรีเซ็ต 2FA ได้ด้วย OTP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequestReset} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">ชื่อผู้ใช้</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="กรุณาใส่ชื่อผู้ใช้"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-3">
              <Label>วิธีการรับ OTP</Label>
              <RadioGroup value={formData.method} onValueChange={handleMethodChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="flex items-center cursor-pointer">
                    <Mail className="mr-2 h-4 w-4" />
                    ส่งทางอีเมล
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sms" id="sms" />
                  <Label htmlFor="sms" className="flex items-center cursor-pointer">
                    <Phone className="mr-2 h-4 w-4" />
                    ส่งทาง SMS
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังส่ง OTP...
                </>
              ) : (
                'ส่ง OTP'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="w-full"
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับไปหน้าเข้าสู่ระบบ
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reset2FA;

