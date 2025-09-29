// src/App.jsx
import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import TwoFactorVerification from "./components/auth/TwoFactorVerification";
import Reset2FA from "./components/auth/Reset2FA";

import TwoFactorSetup from "./components/security/TwoFactorSetup";
import UserProfile from "./components/profile/UserProfile";
import AdminUserManagement from "./components/admin/AdminUserManagement";
import AdminAssignTask from "./components/pages/AdminAssignTask";

import MainLayout from "./components/layouts/MainLayout";
import DashboardContent from "./components/dashboard/Dashboard";
import Organizations from "./components/pages/Organizations";
import Buildings from "./components/pages/Buildings";
import Elevators from "./components/pages/Elevators";
import NotificationsPage from "./components/pages/NotificationsPage";
import SettingsPage from "./components/pages/SettingsPage";
import Reports from "./components/pages/Reports";

import MonitorAll from "./components/pages/MonitorAll";
import MonitorOverview from "./components/pages/MonitorOverview";
import ElevatorDetail from "./components/pages/ElevatorDetail";
import TechnicianTasks from "./components/pages/TechnicianTasks";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import "./App.css";

import { ElevatorProvider } from "./contexts/ElevatorContext";

/* -------------------- ProtectedRoute -------------------- */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return children;
};

/* -------- Shell ครอบทุกหน้า: Protected → ElevatorProvider → MainLayout -------- */
const Shell = ({ children }) => (
  <ProtectedRoute>
    <ElevatorProvider>
      <MainLayout>{children}</MainLayout>
    </ElevatorProvider>
  </ProtectedRoute>
);

/* ------------------------- App ------------------------- */
export default function App() {
  const {
    user,
    loading,
    tempToken,
    showSessionExpired,
    setShowSessionExpired,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const handleSwitchToLogin = () => navigate("/login");
  const handleSwitchToRegister = () => navigate("/register");
  const handleSwitchToReset = () => navigate("/reset-2fa");
  const handleRequire2FA = () => navigate("/2fa-verify");

  const handleCloseSessionExpired = () => {
    setShowSessionExpired(false);
    logout();
    navigate("/login");
  };

  useEffect(() => {
    if (loading) return;

    const currentPath = window.location.pathname;
    const authPages = ["/login", "/register", "/2fa-verify", "/reset-2fa"];

    if (user) {
      if (authPages.includes(currentPath)) {
        navigate("/", { replace: true });
      }
      return;
    }

    if (tempToken) {
      if (currentPath !== "/2fa-verify") {
        navigate("/2fa-verify", { replace: true });
      }
      return;
    }

    if (!authPages.includes(currentPath)) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, tempToken, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public / Auth routes */}
        <Route
          path="/login"
          element={
            <LoginForm
              onRequire2FA={handleRequire2FA}
              onSwitchToRegister={handleSwitchToRegister}
              onSwitchToReset={handleSwitchToReset}
            />
          }
        />
        <Route
          path="/register"
          element={<RegisterForm onSwitchToLogin={handleSwitchToLogin} />}
        />
        <Route
          path="/2fa-verify"
          element={<TwoFactorVerification onBack={handleSwitchToLogin} />}
        />
        <Route
          path="/reset-2fa"
          element={<Reset2FA onBack={handleSwitchToLogin} />}
        />

        {/* Protected routes (ห่อด้วย Shell ที่มี ElevatorProvider) */}
        <Route path="/" element={<Shell><DashboardContent /></Shell>} />
        <Route path="/profile" element={<Shell><UserProfile /></Shell>} />
        <Route path="/2fa-setup" element={<Shell><TwoFactorSetup /></Shell>} />
        <Route path="/admin-users" element={<Shell><AdminUserManagement /></Shell>} />
        <Route path="/admin-assign" element={<Shell><AdminAssignTask /></Shell>} />
        <Route path="/organizations" element={<Shell><Organizations /></Shell>} />
        <Route path="/buildings" element={<Shell><Buildings /></Shell>} />
        <Route path="/elevators" element={<Shell><Elevators /></Shell>} />
        <Route path="/notifications" element={<Shell><NotificationsPage /></Shell>} />
        <Route path="/settings" element={<Shell><SettingsPage /></Shell>} />
        <Route path="/reports" element={<Shell><Reports /></Shell>} />
        <Route path="/my-tasks" element={<Shell><TechnicianTasks /></Shell>} />

        {/* ✅ Monitor pages */}
        <Route path="/monitor" element={<Shell><MonitorAll /></Shell>} />
        <Route path="/monitor/overview" element={<Shell><MonitorOverview /></Shell>} />
        <Route path="/lifts/:id" element={<Shell><ElevatorDetail /></Shell>} />
      </Routes>

      {/* Session expired dialog */}
      <Dialog open={showSessionExpired}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เซสชันหมดอายุ</DialogTitle>
            <DialogDescription>
              เพื่อความปลอดภัยในการใช้งานของคุณ กรุณาเข้าสู่ระบบอีกครั้ง
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleCloseSessionExpired}>เข้าสู่ระบบ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
