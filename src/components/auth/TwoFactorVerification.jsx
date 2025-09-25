import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, ArrowLeft } from 'lucide-react';

const TwoFactorVerification = ({ onBack }) => {
  const { verify2FA } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (code.length !== 6) {
      setError('กรุณาใส่รหัส 6 หลัก');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verify2FA(code);
      // User will be automatically redirected by App component
    } catch (error) {
      setError(error.message || 'รหัสยืนยันไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(value);
    setError('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">ยืนยันตัวตน 2FA</CardTitle>
          <CardDescription className="text-center">
            กรุณาใส่รหัส 6 หลักจากแอป Authenticator หรือ Backup Code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">รหัสยืนยัน</Label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="123456"
                className="text-center text-lg tracking-widest"
                maxLength={10}
                required
                disabled={loading}
                autoComplete="one-time-code"
              />
              <p className="text-xs text-muted-foreground text-center">
                ใส่รหัส 6 หลักจาก Authenticator หรือ Backup Code 10 หลัก
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading || code.length < 6}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังยืนยัน...
                </>
              ) : (
                'ยืนยัน'
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

export default TwoFactorVerification;

