import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Shield, Bell, KeyRound } from 'lucide-react';
import TotpConfirmButton from '@/components/dashboard/TotpConfirmButton';

const Dashboard = () => {
  const { user } = useAuth();

  const handleTotpConfirmed = () => {
    console.log("TOTP Confirmed successfully! Now you can proceed with the reset action.");
    // เพิ่ม logic สำหรับการรีเซ็ต 2FA ที่นี่
    // ตัวอย่าง: เรียก API ใหม่เพื่อทำการรีเซ็ต
  };

  return (
    <div className="w-full pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-8 lg:pr-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          ยินดีต้อนรับ, {user?.first_name}!
        </h2>
        <p className="text-gray-600">
          จัดการระบบลิฟต์และบัญชีผู้ใช้ของคุณ
        </p>
      </div>

      {/* Status Cards and Action Button in a single Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6 mb-8">
        
        {/* Card สถานะบัญชี */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สถานะบัญชี</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">ใช้งานได้</div>
            <p className="text-xs text-muted-foreground">
              บัญชีของคุณพร้อมใช้งาน
            </p>
          </CardContent>
        </Card>

        {/* Card การรักษาความปลอดภัย */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การรักษาความปลอดภัย</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.ga_enabled ? (
                <span className="text-green-600">เปิดใช้งาน</span>
              ) : (
                <span className="text-orange-600">ปิดใช้งาน</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              การยืนยันตัวตนสองขั้นตอน (2FA)
            </p>
          </CardContent>
        </Card>

        {/* Card การแจ้งเตือน */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การแจ้งเตือน</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              ข้อความใหม่
            </p>
          </CardContent>
        </Card>

        {/* Action Card: ปุ่มรีเซ็ต 2FA */}
        {user?.ga_enabled && (
          <Card className="flex flex-col justify-center items-center p-6 border-dashed border-2 border-gray-300">
            <KeyRound className="h-8 w-8 text-gray-600 mb-2" />
            <h3 className="text-md font-semibold text-gray-800 mb-4 text-center">
              ตรวจสอบ TOTP
            </h3>
            <TotpConfirmButton
              onConfirmSuccess={handleTotpConfirmed}
              buttonText="ตรวจสอบ"
              buttonVariant="destructive"
            />
          </Card>
        )}
      </div>
      
      {/* Security Notice Card */}
      {!user?.ga_enabled && (
        <Card className="mt-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-800">คำแนะนำด้านความปลอดภัย</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-4">
              เพื่อความปลอดภัยของบัญชี เราแนะนำให้คุณเปิดใช้งานการยืนยันตัวตนสองขั้นตอน (2FA)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;