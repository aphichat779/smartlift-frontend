import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    Loader2,
    Shield,
    QrCode,
    Copy,
    CheckCircle,
    Key,
    Smartphone,
    AlertTriangle
} from 'lucide-react';

// ===== Shared Style (นำมาจาก Dashboard)
const glassCard =
  "rounded-2xl bg-white/85 backdrop-blur ring-1 shadow-[0_12px_30px_-12px_rgba(2,6,23,0.25)]";

// ===== Layout Wrapper เพื่อลดความซ้ำซ้อน
const PageLayout = ({ children }) => (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200 flex justify-center items-center p-4">
        <div className="max-w-2xl mx-auto w-full">
            {children}
        </div>
    </div>
);


const TwoFactorSetup = () => {
    const { user, updateUser } = useAuth();
    const [step, setStep] = useState('check'); // 'check', 'setup', 'success', 'enabled'
    const [setupData, setSetupData] = useState(null);
    const [backupCodes, setBackupCodes] = useState([]);
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(true); // เริ่มต้นเป็น true เพื่อเช็คสถานะ
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setLoading(true);
        if (user?.ga_enabled) {
            setStep('enabled');
        } else {
            setStep('initial');
        }
        setLoading(false);
    }, [user]);

    const handleSetup2FA = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiService.setup2FA();
            setSetupData(response.data);
            setStep('setup');
        } catch (error) {
            setError(error.message || 'เกิดข้อผิดพลาดในการตั้งค่า 2FA');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySetup = async (e) => {
        e.preventDefault();
        if (verificationCode.length !== 6) {
            setError('กรุณาใส่รหัส 6 หลัก');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await apiService.verifySetup2FA(verificationCode);
            setBackupCodes(response.data.backup_codes);
            updateUser({ ...user, ga_enabled: true });
            setStep('success');
        } catch (error) {
            setError(error.message || 'รหัสยืนยันไม่ถูกต้อง');
        } finally {
            setLoading(false);
        }
    };

    const handleCodeChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
        setVerificationCode(value);
        if (error) setError('');
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    // จัดการการแสดงผลในแต่ละ Step
    const renderStepContent = () => {
        switch (step) {
            case 'enabled':
                return (
                    <Card className={`${glassCard} ring-green-200`}>
                        <CardHeader className="text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-slate-900">2FA เปิดใช้งานแล้ว</CardTitle>
                            <CardDescription className="text-slate-600">บัญชีของคุณได้รับการปกป้องด้วยการยืนยันตัวตนสองขั้นตอน</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border border-blue-200/70 bg-blue-50/60 p-3 text-sm text-blue-800">
                                หากต้องการปิดใช้งาน 2FA หรือสร้าง Backup codes ใหม่ กรุณาติดต่อผู้ดูแลระบบ
                            </div>
                        </CardContent>
                    </Card>
                );

            case 'success':
                return (
                    <Card className={`${glassCard} ring-green-200`}>
                        <CardHeader className="text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-slate-900">ตั้งค่า 2FA สำเร็จ!</CardTitle>
                            <CardDescription className="text-slate-600">โปรดเก็บรหัสสำรองเหล่านี้ไว้ในที่ปลอดภัย</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 text-amber-800 text-sm">
                                <strong>สำคัญ:</strong> Backup Codes ใช้สำหรับกู้คืนบัญชีกรณีที่ไม่สามารถใช้แอป Authenticator ได้
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-medium text-slate-800">Backup Codes</Label>
                                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(backupCodes.join('\n'))}>
                                        {copied ? <CheckCircle className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                        {copied ? 'คัดลอกแล้ว' : 'คัดลอกทั้งหมด'}
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-100/70 rounded-lg border border-slate-200">
                                    {backupCodes.map((code, index) => (
                                        <div key={index} className="font-mono text-center text-slate-700 p-2 bg-white rounded-md border">
                                            {code}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Button onClick={() => window.location.href = '/dashboard'} className="w-full rounded-lg">
                                ไปที่หน้า Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                );

            case 'setup':
                return (
                    <Card className={`${glassCard} ring-blue-200`}>
                        <CardHeader className="text-center">
                             <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
                                <QrCode className="h-8 w-8 text-blue-600" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-slate-900">ตั้งค่าผ่าน Authenticator App</CardTitle>
                            <CardDescription className="text-slate-600">ใช้แอป Google Authenticator หรือ Authy เพื่อสแกน QR Code</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex justify-center">
                                <div className="p-2 bg-white rounded-lg shadow-sm border">
                                    <img src={setupData?.qr_code_url} alt="QR Code" className="w-48 h-48" />
                                </div>
                            </div>
                            <div className="text-center text-sm text-slate-500">หรือ</div>
                             <div className="space-y-2">
                                <Label htmlFor="secretKey" className="text-slate-700">ใส่ Secret Key ด้วยตนเอง:</Label>
                                <div className="flex items-center space-x-2">
                                    <Input id="secretKey" value={setupData?.secret_key} readOnly className="font-mono text-sm bg-slate-50"/>
                                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(setupData?.secret_key)}>
                                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <form onSubmit={handleVerifySetup} className="space-y-4 pt-4 border-t">
                                {error && (
                                    <div className="rounded-md border border-rose-200/70 bg-rose-50/60 p-3 text-sm text-rose-700 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" /> {error}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="verificationCode" className="text-slate-800">รหัสยืนยัน 6 หลักจากแอป</Label>
                                    <Input
                                        id="verificationCode"
                                        type="text"
                                        value={verificationCode}
                                        onChange={handleCodeChange}
                                        placeholder="******"
                                        className="text-center text-2xl tracking-[0.5em] font-mono"
                                        maxLength={6} required disabled={loading}
                                    />
                                </div>
                                <Button type="submit" className="w-full rounded-lg" disabled={loading || verificationCode.length !== 6}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                                    {loading ? 'กำลังยืนยัน...' : 'ยืนยันและเปิดใช้งาน'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                );

            case 'initial':
            default:
                return (
                    <Card className={`${glassCard} ring-blue-200`}>
                        <CardHeader className="text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
                                <Shield className="h-8 w-8 text-blue-600" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-slate-900">ปกป้องบัญชีของคุณ</CardTitle>
                            <CardDescription className="text-slate-600">เพิ่มความปลอดภัยอีกชั้นด้วยการยืนยันตัวตนสองขั้นตอน (2FA)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="rounded-xl border border-blue-200/70 bg-blue-50/60 p-4 text-sm text-blue-800 space-y-2">
                                <p>2FA ช่วยป้องกันการเข้าถึงบัญชีโดยไม่ได้รับอนุญาต แม้ว่ารหัสผ่านของคุณจะรั่วไหล</p>
                                <p>เมื่อเปิดใช้งาน คุณจะต้องใช้รหัสจากแอป Authenticator บนมือถือของคุณเพื่อเข้าสู่ระบบ</p>
                            </div>
                             <div className="space-y-3">
                                <h3 className="font-semibold text-slate-800">ขั้นตอนการตั้งค่า:</h3>
                                <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-600">
                                    <li>ติดตั้งแอป <strong className="text-slate-700">Google Authenticator</strong> หรือ <strong className="text-slate-700">Authy</strong> บนมือถือ</li>
                                    <li>กดปุ่ม "เริ่มตั้งค่า" ด้านล่างเพื่อรับ QR Code</li>
                                    <li>ใช้แอปสแกน QR Code และยืนยันรหัส 6 หลัก</li>
                                    <li>จัดเก็บรหัสสำรอง (Backup Codes) ไว้ในที่ปลอดภัย</li>
                                </ol>
                            </div>
                             <Button onClick={handleSetup2FA} className="w-full rounded-lg" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                                {loading ? 'โปรดรอ...' : 'เริ่มตั้งค่า 2FA'}
                            </Button>
                        </CardContent>
                    </Card>
                );
        }
    };
    
    return (
        <PageLayout>
            {loading && step === 'check' ? (
                <div className="flex justify-center items-center p-10">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                </div>
            ) : renderStepContent()}
        </PageLayout>
    );
};

export default TwoFactorSetup;