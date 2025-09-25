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

const TwoFactorSetup = () => {
    const { user, updateUser } = useAuth();
    const [step, setStep] = useState('check'); // 'check', 'setup', 'verify', 'success'
    const [setupData, setSetupData] = useState(null);
    const [backupCodes, setBackupCodes] = useState([]);
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (user?.ga_enabled) {
            setStep('enabled');
        }
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
        setError('');
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyBackupCodes = () => {
        const codesText = backupCodes.join('\n');
        navigator.clipboard.writeText(codesText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ----------------- Enabled State -----------------
    if (step === 'enabled') {
        return (
            <div className="flex justify-center items-center min-h-screen p-4">
                <div className="max-w-2xl mx-auto w-full">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="flex items-center justify-center mb-4">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl">2FA เปิดใช้งานแล้ว</CardTitle>
                            <CardDescription>
                                บัญชีของคุณได้รับการปกป้องด้วยการยืนยันตัวตนสองขั้นตอน
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <Shield className="h-4 w-4" />
                                <AlertDescription>
                                    บัญชีของคุณมีความปลอดภัยสูง หากต้องการปิดใช้งาน 2FA กรุณาติดต่อผู้ดูแลระบบ
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // ----------------- Success State -----------------
    if (step === 'success') {
        return (
            <div className="flex justify-center items-center min-h-screen p-4">
                <div className="max-w-2xl mx-auto w-full">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="flex items-center justify-center mb-4">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl">ตั้งค่า 2FA สำเร็จ!</CardTitle>
                            <CardDescription>
                                บัญชีของคุณได้รับการปกป้องด้วยการยืนยันตัวตนสองขั้นตอนแล้ว
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>สำคัญ:</strong> กรุณาเก็บ Backup Codes เหล่านี้ไว้ในที่ปลอดภัย
                                    สามารถใช้แทนรหัสจาก Authenticator ได้ในกรณีฉุกเฉิน
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-medium">Backup Codes</Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={copyBackupCodes}
                                    >
                                        {copied ? (
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                        ) : (
                                            <Copy className="mr-2 h-4 w-4" />
                                        )}
                                        {copied ? 'คัดลอกแล้ว' : 'คัดลอกทั้งหมด'}
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                                    {backupCodes.map((code, index) => (
                                        <div key={index} className="font-mono text-sm p-2 bg-background rounded border">
                                            {code}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Button onClick={() => window.location.reload()} className="w-full">
                                เสร็จสิ้น
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // ----------------- Setup State -----------------
    if (step === 'setup') {
        return (
            <div className="flex justify-center items-center min-h-screen p-4">
                <div className="max-w-2xl mx-auto w-full">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="flex items-center justify-center mb-4">
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <QrCode className="h-8 w-8 text-primary" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl">สแกน QR Code</CardTitle>
                            <CardDescription>
                                ใช้แอป Google Authenticator หรือ Authy เพื่อสแกน QR Code
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* QR Code */}
                            <div className="flex justify-center">
                                <div className="p-4 bg-white rounded-lg shadow-sm border">
                                    <img
                                        src={setupData?.qr_code_url}
                                        alt="QR Code for 2FA setup"
                                        className="w-48 h-48"
                                    />
                                </div>
                            </div>

                            {/* Manual Entry */}
                            <div className="space-y-3">
                                <Label className="text-base font-medium">หรือใส่ Secret Key ด้วยตนเอง:</Label>
                                <div className="flex items-center space-x-2">
                                    <Input
                                        value={setupData?.secret_key}
                                        readOnly
                                        className="font-mono text-sm"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(setupData?.secret_key)}
                                    >
                                        {copied ? (
                                            <CheckCircle className="h-4 w-4" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Instructions */}
                            <Alert>
                                <Smartphone className="h-4 w-4" />
                                <AlertDescription>
                                    <ol className="list-decimal list-inside space-y-1 text-sm">
                                        <li>เปิดแอป Google Authenticator หรือ Authy</li>
                                        <li>แตะ "+" หรือ "Add Account"</li>
                                        <li>เลือก "Scan QR Code" หรือใส่ Secret Key</li>
                                        <li>ใส่รหัส 6 หลักที่แสดงในแอปด้านล่าง</li>
                                    </ol>
                                </AlertDescription>
                            </Alert>

                            {/* Verification Form */}
                            <form onSubmit={handleVerifySetup} className="space-y-4">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="verificationCode">รหัสยืนยันจากแอป Authenticator</Label>
                                    <Input
                                        id="verificationCode"
                                        type="text"
                                        value={verificationCode}
                                        onChange={handleCodeChange}
                                        placeholder="123456"
                                        className="text-center text-lg tracking-widest"
                                        maxLength={6}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={loading || verificationCode.length !== 6}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            กำลังยืนยัน...
                                        </>
                                    ) : (
                                        'ยืนยันและเปิดใช้งาน 2FA'
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // ----------------- Initial State -----------------
    return (
        <div className="flex justify-center items-center min-h-screen p-4">
            <div className="max-w-2xl mx-auto w-full">
                <Card>
                    <CardHeader className="text-center">
                        <div className="flex items-center justify-center mb-4">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <Shield className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">การยืนยันตัวตนสองขั้นตอน (2FA)</CardTitle>
                        <CardDescription>
                            เพิ่มความปลอดภัยให้กับบัญชีของคุณ
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                                <Key className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">สถานะ 2FA</p>
                                    <p className="text-sm text-muted-foreground">การยืนยันตัวตนสองขั้นตอน</p>
                                </div>
                            </div>
                            <Badge variant={user?.ga_enabled ? "default" : "secondary"}>
                                {user?.ga_enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                            </Badge>
                        </div>

                        <Alert>
                            <Shield className="h-4 w-4" />
                            <AlertDescription>
                                การยืนยันตัวตนสองขั้นตอนจะช่วยปกป้องบัญชีของคุณ แม้ว่ารหัสผ่านจะถูกขโมยไป
                                คุณจะต้องใช้แอป Authenticator เพื่อเข้าสู่ระบบ
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-4">
                            <h3 className="font-medium">ขั้นตอนการตั้งค่า:</h3>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                <li>ดาวน์โหลดแอป Google Authenticator หรือ Authy</li>
                                <li>สแกน QR Code หรือใส่ Secret Key</li>
                                <li>ใส่รหัส 6 หลักเพื่อยืนยัน</li>
                                <li>เก็บ Backup Codes ไว้ในที่ปลอดภัย</li>
                            </ol>
                        </div>

                        <Button
                            onClick={handleSetup2FA}
                            className="w-full"
                            disabled={loading || user?.ga_enabled}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    กำลังเตรียมการ...
                                </>
                            ) : user?.ga_enabled ? (
                                '2FA เปิดใช้งานแล้ว'
                            ) : (
                                'เริ่มตั้งค่า 2FA'
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TwoFactorSetup;