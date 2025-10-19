// src/App.jsx
import React, { useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// Dashboard
import DashboardUser from "./components/dashboard/DashboardUser";
import DashboardSuperAdmin from "./components/dashboard/DashboardSuperAdmin";
import DashboardAdmin from "./components/dashboard/DashboardAdmin";
import DashboardTechnician from "./components/dashboard/DashboardTechnician";

import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import TwoFactorVerification from "./components/auth/TwoFactorVerification";
import Reset2FA from "./components/auth/Reset2FA";

import TwoFactorSetup from "./components/security/TwoFactorSetup";
import UserProfile from "./components/profile/UserProfile";
import AdminUserManagement from "./components/admin/AdminUserManagement";
import AdminAssignTask from "./components/pages/AdminAssignTask";

import MainLayout from "./components/layouts/MainLayout";
import OrgAndBuildings from "./components/pages/OrgAndBuildings";
import Elevators from "./components/pages/Elevators";
import NotificationsPage from "./components/pages/NotificationsPage";
import SettingsPage from "./components/pages/SettingsPage";
import Reports from "./components/pages/Reports";

import MonitorAll from "./components/pages/MonitorAll";
import MonitorOverview from "./components/pages/MonitorOverview";
import ElevatorDetail from "./components/pages/ElevatorDetail";
import TechnicianTasks from "./components/pages/TechnicianTasks";
import Tools from "./components/pages/Tools";

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

/* -------------------- RoleBasedDashboard (ได้รับการแก้ไข) -------------------- */
const RoleBasedDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    let dashboardPath = "/";

    switch (user.role) {
      case "super_admin":
        dashboardPath = "/dashboardsuperadmin";
        break;
      case "admin":
        dashboardPath = "/dashboardadmin";
        break;
      case "technician":
        dashboardPath = "/dashboardtechnician";
        break;
      case "user":
      default:
        dashboardPath = "/"; // ผู้ใช้ทั่วไปจะถูกนำไปที่ Path หลัก
        break;
    }

    // Redirect ไปยัง Dashboard ที่ถูกต้อง
    // ตรวจสอบว่าไม่ได้อยู่ที่ Path ที่ควรอยู่ เพื่อป้องกัน loop
    if (window.location.pathname !== dashboardPath) {
      navigate(dashboardPath, { replace: true });
    }
  }, [user, navigate]);

  // *** ส่วนที่แก้ไข: หากเป็นผู้ใช้ทั่วไป (role: "user") และอยู่ที่ Path "/" แล้ว ให้แสดง DashboardUser ทันที ***
  if (user && user.role === "user" && window.location.pathname === "/") {
    return <DashboardUser />;
  }

  // แสดง Loading หรือ Fallback จนกว่าจะ Redirect สำเร็จ
  return (
    <div className="p-8 text-center text-gray-500">
      กำลังนำทางไปยัง Dashboard ของคุณ...
    </div>
  );
};

/* -------- Shell ครอบทุกหน้า: Protected → MainLayout -------- */
const Shell = ({ children }) => (
  <ProtectedRoute>
    <MainLayout>{children}</MainLayout>
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
        // หากผู้ใช้ Login แล้วและพยายามเข้าหน้า Auth ให้ redirect ไปที่หน้าหลัก
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

        {/* Protected routes (ห่อด้วย Shell) */}
        {/* 1. Root Path: ใช้ RoleBasedDashboard เพื่อ Redirect ไปยัง Dashboard ที่ถูกต้อง 
           ** และแสดง DashboardUser เมื่อเป็น role: "user" */}
        <Route path="/" element={<Shell><RoleBasedDashboard /></Shell>} />

        {/* 2. Role-specific Dashboard Routes */}
        <Route path="/dashboardsuperadmin" element={<Shell><DashboardSuperAdmin /></Shell>} />
        <Route path="/dashboardadmin" element={<Shell><DashboardAdmin /></Shell>} />
        <Route path="/dashboardtechnician" element={<Shell><DashboardTechnician /></Shell>} />

        {/* *** ส่วนที่ถูกลบออก: เพื่อไม่ให้เกิดการซ้ำซ้อนของ Route path="/" ***
        <Route path="/" element={<Shell><DashboardUser /></Shell>} /> */}

        {/* 3. General Protected Routes */}
        <Route path="/profile" element={<Shell><UserProfile /></Shell>} />
        <Route path="/2fa-setup" element={<Shell><TwoFactorSetup /></Shell>} />
        <Route path="/admin-users" element={<Shell><AdminUserManagement /></Shell>} />
        <Route path="/admin-assign" element={<Shell><AdminAssignTask /></Shell>} />
        <Route path="/orgs-buildings" element={<Shell><OrgAndBuildings /></Shell>} />
        <Route path="/organizations" element={<Navigate to="/orgs-buildings" replace />} />
        <Route path="/buildings" element={<Navigate to="/orgs-buildings?tab=buildings" replace />} />
        <Route path="/elevators" element={<Shell><Elevators /></Shell>} />
        <Route path="/notifications" element={<Shell><NotificationsPage /></Shell>} />
        <Route path="/settings" element={<Shell><SettingsPage /></Shell>} />
        <Route path="/reports" element={<Shell><Reports /></Shell>} />
        <Route path="/my-tasks" element={<Shell><TechnicianTasks /></Shell>} />
        <Route path="/tools" element={<Shell><Tools /></Shell>} />

        {/* Monitor pages */}
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