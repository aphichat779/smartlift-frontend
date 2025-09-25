// components/TotpConfirmButton.jsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

const TotpConfirmButton = ({ onConfirmSuccess, children, buttonText, buttonVariant = 'default' }) => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTotpSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const result = await apiService.confirmTOTP(totpCode);
      setIsSuccess(result.success);
      setMessage(result.message);

      if (result.success) {
        onConfirmSuccess();
        setTimeout(() => setIsModalOpen(false), 1500);
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage(error.message || '❌ เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => {
    setTotpCode('');
    setMessage('');
    setIsSuccess(false);
    setIsModalOpen(true);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        {children ? (
          <div onClick={handleOpenModal}>{children}</div>
        ) : (
          <Button variant={buttonVariant} onClick={handleOpenModal}>
            {buttonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ยืนยันรหัส TOTP</DialogTitle>
          <DialogDescription>
            โปรดกรอกรหัส TOTP จากแอปพลิเคชันของคุณเพื่อดำเนินการต่อ
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleTotpSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="totp" className="text-right">
              รหัส TOTP
            </Label>
            <Input
              id="totp"
              type="text"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              className="col-span-3"
              disabled={isLoading}
              autocomplete="off"
            />
          </div>
          {message && (
            <p className={`text-center font-bold ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
          <Button type="submit" className="mt-4 w-full" disabled={isLoading}>
            {isLoading ? 'กำลังตรวจสอบ...' : 'ยืนยัน'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TotpConfirmButton;