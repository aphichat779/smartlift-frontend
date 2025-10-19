// src/components/dashboard/DashboardSuperAdmin.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Building,
  Server,
  Users,
  UserCog,
  Wrench,
  AlertTriangle,
  ClipboardList,
  Layers3,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchDashboardData } from "@/services/DashboardService";
import { useAuth } from "@/contexts/AuthContext";

// ===== Shared styles
const glassCard =
  "rounded-2xl bg-white/85 backdrop-blur ring-1 ring-slate-200 shadow-[0_12px_30px_-12px_rgba(2,6,23,0.25)]";

const kpiIcons = {
  Organizations: Layers3,
  Buildings: Building2,
  Elevators: Server,
  Users: Users,
  Technicians: UserCog,
  "Open Tasks": Wrench,
};

const kpiAccents = {
  Organizations: { icon: "text-violet-600", ring: "ring-violet-200", bg: "from-violet-50 to-white" },
  Buildings: { icon: "text-amber-600", ring: "ring-amber-200", bg: "from-amber-50 to-white" },
  Elevators: { icon: "text-blue-600", ring: "ring-blue-200", bg: "from-blue-50 to-white" },
  Users: { icon: "text-slate-700", ring: "ring-slate-200", bg: "from-slate-50 to-white" },
  Technicians: { icon: "text-emerald-600", ring: "ring-emerald-200", bg: "from-emerald-50 to-white" },
  "Open Tasks": { icon: "text-rose-600", ring: "ring-rose-200", bg: "from-rose-50 to-white" },
};

// ===== Lift bit -> status
const getCarStatus = (carBits) => {
  if (typeof carBits !== "string" || carBits.length !== 8) {
    return { text: "ออฟไลน์ / ไม่มีข้อมูล", priority: "critical", bits: "—" };
  }
  const statusMap = [
    [0, "ข้อผิดพลาดหลัก (Fault)", "error"],
    [1, "หยุดฉุกเฉิน/Service Mode", "error"],
    [2, "โหมดดับเพลิง (Fire)", "error"],
    [3, "โหมดตรวจสอบ (Inspection)", "warning"],
    [4, "สวิตช์ Alarm ถูกกด", "warning"],
    [5, "น้ำหนักเกิน (Overload)", "warning"],
    [6, "ประตูถูกบล็อก/เปิดค้าง", "warning"],
    [7, "ปกติ/พร้อมใช้งาน (LSB)", "info"],
  ];
  let highest = "normal";
  const active = [];
  statusMap.forEach(([i, label, lvl]) => {
    if (carBits[i] === "1") {
      active.push(label);
      if (lvl === "error") highest = "error";
      else if (lvl === "warning" && highest === "normal") highest = "warning";
    }
  });
  if (active.length === 0) return { text: "ปกติ / พร้อมใช้งาน", priority: "normal", bits: carBits };
  return { text: active.join(", "), priority: highest, bits: carBits };
};

const liftStatusColorMap = {
  normal: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
  warning: "bg-amber-500/15 text-amber-700 border-amber-200",
  error: "bg-rose-500/15 text-rose-700 border-rose-200",
  critical: "bg-gray-500/15 text-gray-700 border-gray-200",
};

function LiftStatusBadge({ status }) {
  const color = liftStatusColorMap[status.priority] || liftStatusColorMap.normal;
  const dot =
    status.priority === "normal"
      ? "bg-emerald-500"
      : status.priority === "warning"
      ? "bg-amber-500"
      : status.priority === "error"
      ? "bg-rose-500"
      : "bg-gray-500";
  return (
    <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${color}`} title={status.text}>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {status.text.length > 30 ? "หลายสถานะ" : status.text}
    </div>
  );
}

// ===== Section header
function SectionHeader({ title, icon: Icon }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center text-lg md:text-xl font-bold text-slate-900">
        <Icon className="h-5 w-5 mr-2 text-blue-600" />
        {title}
      </h2>
    </div>
  );
}

// ===== KPI
function KPI({ label, value }) {
  const Icon = kpiIcons[label] || Building;
  const acc = kpiAccents[label] || kpiAccents.Users;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className={`${glassCard} ring-1 ${acc.ring} bg-gradient-to-br ${acc.bg}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
            <Icon className={`h-4 w-4 ${acc.icon}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-extrabold text-slate-900">{value}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ===== รายงานแจ้งปัญหา
function UnassignedReports({ data }) {
  return (
    <Card className={`${glassCard} ring-amber-200`}>
      <CardHeader>
        <SectionHeader title={`รายงานแจ้งปัญหาที่ยังไม่ได้มอบหมาย (${data.length})`} icon={ClipboardList} />
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-slate-500 py-4">ไม่มีรายงานที่ยังไม่ได้มอบหมาย</p>
        ) : (
          <div className="space-y-3">
            {data.slice(0, 5).map((report) => (
              <div key={report.id} className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-3">
                <p className="text-sm font-semibold text-slate-900">
                  ลิฟต์ {report.lift} • {report.org} / {report.building}
                </p>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{report.detail}</p>
                <p className="text-xs text-rose-600 mt-1">แจ้งเมื่อ: {report.date}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===== งานที่กำลังดำเนินการ
const taskStatusStyle = (s) => {
  const v = (s || "").toLowerCase();
  if (v === "assign") return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
  if (v === "preparing") return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  if (v === "progress") return "bg-violet-50 text-violet-700 ring-1 ring-violet-200";
  if (v === "complete") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
};

function OngoingTasks({ data }) {
  return (
    <Card className={`${glassCard} ring-violet-200`}>
      <CardHeader>
        <SectionHeader title={`งานที่กำลังดำเนินการ (${data.length})`} icon={Wrench} />
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-slate-500 py-4">ไม่มีงานที่กำลังดำเนินการ</p>
        ) : (
          <div className="space-y-3">
            {data.slice(0, 5).map((task) => (
              <div key={task.id} className="rounded-xl border border-slate-200 p-3 bg-white/70">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">
                    {task.lift} • {task.site}
                  </p>
                  <span className={`px-2 py-1 rounded-md text-xs font-semibold ${taskStatusStyle(task.status)}`}>
                    {String(task.status || "").toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">ช่าง: {task.tech || "รอระบุ"}</p>
                <p className="text-xs text-slate-500 mt-1">เริ่ม: {task.started}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===== Bit Board
function LiftStatusBoard({ data }) {
  return (
    <Card className={`${glassCard} ring-blue-200`}>
      <CardHeader>
        <SectionHeader title="สถานะลิฟต์" icon={Server} />
      </CardHeader>
      <CardContent className="h-[300px] overflow-y-auto">
        <div className="space-y-2">
          {data.length === 0 ? (
            <p className="text-center text-slate-500 py-4">ไม่พบข้อมูลสถานะลิฟต์</p>
          ) : (
            data.slice(0, 10).map((lift) => {
              const carStatus = getCarStatus(lift.car);
              return (
                <div key={lift.name} className="flex items-start justify-between border-b border-slate-200/70 pb-2 pt-1">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-slate-900">{lift.name}</span>
                    <span className="text-xs text-slate-600 mt-1">
                      ชั้น: <span className="font-medium text-blue-700">{lift.current}</span> • ทิศทาง:{" "}
                      <span className="font-medium">{lift.dir}</span>
                    </span>
                  </div>
                  <div className="flex flex-col items-end max-w-[55%] space-y-1">
                    <LiftStatusBadge status={carStatus} />
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded" title="สถานะบิตดิบ">
                      Bit: {carStatus.bits}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ===== TwoFAStatus เฉพาะบัญชีตัวเอง
function TwoFAStatusSelf({ enabled }) {
  return (
    <Card className={`${glassCard} ring-emerald-200 h-auto`}>
      <CardHeader className="pb-2">
        <SectionHeader title="ความปลอดภัยบัญชี" icon={UserCog} />
      </CardHeader>
      <CardContent>
        {enabled ? (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
            <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="text-sm font-semibold">บัญชีของคุณเปิดใช้งาน 2FA แล้ว ปลอดภัยหายห่วง!</div>
          </div>
        ) : (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-semibold">ยังไม่เปิดใช้งาน 2FA</div>
                <div className="text-rose-600/90">
                  มีความเสี่ยงต่อการถูกเข้าถึงโดยไม่ได้รับอนุญาต กรุณาเปิดใช้งานทันที
                </div>
              </div>
            </div>
            <div className="mt-2 text-right">
              <Button size="sm" className="rounded-lg" asChild>
                <a href="/2fa-setup">เปิดใช้งานตอนนี้</a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===== Top bar
function TopBar({ role, onRefresh }) {
  const roleTitle =
    role === "super_admin"
      ? "Super Admin Dashboard"
      : role === "admin"
      ? "Admin Dashboard"
      : role === "technician"
      ? "Technician Dashboard"
      : "User Dashboard";
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">{roleTitle}</h1>
        <Button variant="outline" size="sm" onClick={onRefresh} className="rounded-xl bg-white/70 backdrop-blur ring-1 ring-slate-200 hover:bg-white">
          <RefreshCcw className="h-4 w-4 mr-2" />
          อัปเดตข้อมูล
        </Button>
      </div>
      <div className="mt-3 h-2 rounded-xl bg-gradient-to-r from-blue-200 via-indigo-200 to-emerald-200" />
    </div>
  );
}

// ===== Main
export default function Dashboard({ role = "super_admin", orgId = null }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardData(role, orgId);
      setData(result);
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อที่ไม่ทราบสาเหตุ");
    } finally {
      setLoading(false);
    }
  }, [role, orgId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200">
      <div className="mx-auto max-w-7xl p-4 md:p-6">
        <TopBar role={role} onRefresh={loadData} />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-3 text-lg font-medium text-slate-600">กำลังโหลดข้อมูล Dashboard…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-rose-200 bg-rose-50/70">
            <AlertTriangle className="h-8 w-8 text-rose-600" />
            <p className="mt-2 text-lg font-bold text-rose-700">ไม่สามารถโหลดข้อมูลได้</p>
            <p className="text-sm text-rose-600">{error}</p>
            <Button onClick={loadData} className="mt-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white">
              ลองอีกครั้ง
            </Button>
          </div>
        ) : (
          <>
            {/* แถวบน: KPI ทั้ง 4 การ์ด */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(data?.kpis || []).map((k) => (
                <KPI key={k.label} {...k} />
              ))}
            </div>

            {/* แถวล่าง: รายงาน, งาน, สถานะลิฟต์, และความปลอดภัยบัญชี */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3 mt-5">
              
              {/* คอลัมน์ซ้าย */}
              <div className="xl:col-span-2 space-y-5">
                <UnassignedReports data={data?.reportsUnassigned || []} />
                <OngoingTasks data={data?.tasksOngoing || []} />
              </div>
              
              {/* คอลัมน์ขวา */}
              <div className="space-y-5">
                <TwoFAStatusSelf enabled={user?.ga_enabled ?? false} />
                <LiftStatusBoard data={data?.liftBits || []} />
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}