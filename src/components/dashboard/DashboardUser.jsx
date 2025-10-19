// src/components/dashboard/DashboardUser.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Bell, FileText, Building2, ArrowRight, Search, Filter, ChevronDown, Info } from "lucide-react";

/**
 * SmartLift – User Dashboard (Mock Data)
 * - Focused on "user" role: shows only the user's own reports, their statuses, and related task progress.
 * - Pure React + Tailwind (no external UI frameworks). Drop into your app/routes to preview.
 */
export default function UserDashboardMock() {
  // ===== Mock: current logged-in user =====
  const currentUser = { id: 4, username: "User1234", firstName: "User", lastName: "APHICHAT" };

  // ===== Mock: reference data =====
  const orgs = [{ id: 1, name: "KU CSC" }, { id: 2, name: "SNKTC" }, { id: 3, name: "PSU" }];
  const buildings = [
    { id: 1, org_id: 1, name: "อาคาร 19" },
    { id: 4, org_id: 1, name: "อาคาร 1" },
    { id: 2, org_id: 2, name: "อาคาร 1 เทคนิคสกล" },
    { id: 3, org_id: 3, name: "อาคารเย็นศิระ" },
  ];
  const lifts = [
    { id: 8, building_id: 4, name: "CSC01" },
    { id: 1, building_id: 1, name: "KUSE" },
  ];

  // ===== Mock: reports (only some belong to current user) =====
  const allReports = [
    { rp_id: 1, date_rp: "2025-10-06", user_id: 1, org_id: 1, building_id: 4, lift_id: 8, detail: "- ประตูลิฟต์ปิดไม่สนิท", created_at: "2025-10-06 00:40:59" },
    { rp_id: 2, date_rp: "2025-10-08", user_id: 2, org_id: 1, building_id: 4, lift_id: 8, detail: "- มีเสียงดังผิดปกติ\n- ปุ่มกดภายในไม่ทำงาน\n- ไฟชั้นแสดงผลผิดพลาด", created_at: "2025-10-08 23:30:38" },
    { rp_id: 3, date_rp: "2025-10-08", user_id: 4, org_id: 1, building_id: 4, lift_id: 8, detail: "1234", created_at: "2025-10-09 00:32:11" },
  ];

  // ===== Mock: tasks related to reports =====
  const allTasks = [
    { tk_id: 4, rp_id: 3, lift_id: 8, org_id: 1, building_id: 4, user_id: 3, assignee: "Technician123", tk_status: "assign", task_start_date: "2025-10-10 00:00:00" },
    { tk_id: 5, rp_id: 2, lift_id: 8, org_id: 1, building_id: 4, user_id: 3, assignee: "Technician123", tk_status: "assign", task_start_date: "2025-10-13 00:00:00" },
    { tk_id: 6, rp_id: 1, lift_id: 8, org_id: 1, building_id: 4, user_id: 3, assignee: "Technician123", tk_status: "progress", task_start_date: "2025-10-24 00:00:00" },
  ];

  // ===== Mock: task status timeline =====
  const allTaskStatuses = [
    { tk_status_id: 5, tk_id: 4, status: "assign", time: "2025-10-09 00:43:42", detail: "Assigned by admin Admin12345", section: "assignment" },
    { tk_status_id: 6, tk_id: 5, status: "assign", time: "2025-10-09 00:44:43", detail: "Assigned by super_admin Super1234", section: "assignment" },
    { tk_status_id: 7, tk_id: 6, status: "assign", time: "2025-10-09 00:51:37", detail: "Assigned by super_admin Super", section: "assignment" },
    // add some progress states for demo
    { tk_status_id: 8, tk_id: 6, status: "preparing", time: "2025-10-10 10:10:00", detail: "เตรียมเครื่องมือ", section: "prep" },
    { tk_status_id: 9, tk_id: 6, status: "progress", time: "2025-10-10 15:00:00", detail: "กำลังตรวจสอบประตู", section: "work" },
  ];

  // ===== Filters (UI state) =====
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("30d");
  const [busy, setBusy] = useState(true);

  // fake loading
  useEffect(() => {
    const t = setTimeout(() => setBusy(false), 600);
    return () => clearTimeout(t);
  }, []);

  const myReports = useMemo(() => allReports.filter(r => r.user_id === currentUser.id), [allReports, currentUser.id]);

  const filteredReports = useMemo(() => {
    const now = new Date("2025-10-12T12:00:00"); // fixed 'today' for mock
    const from = (() => {
      if (range === "7d") return addDays(now, -7);
      if (range === "30d") return addDays(now, -30);
      return addDays(now, -3650);
    })();
    return myReports
      .filter(r => new Date(r.date_rp) >= from)
      .filter(r =>
        !query.trim() ||
        r.detail.toLowerCase().includes(query.toLowerCase()) ||
        liftName(r.lift_id).toLowerCase().includes(query.toLowerCase()) ||
        buildingName(r.building_id).toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [myReports, range, query]);

  // KPI Derivations
  const kpis = useMemo(() => {
    const total = filteredReports.length;
    const withTask = filteredReports.filter(r => taskByReport(r.rp_id)).length;
    const inProgress = filteredReports.filter(r => {
      const t = taskByReport(r.rp_id);
      return t && ["preparing", "progress"].includes(t.tk_status);
    }).length;
    const awaiting = filteredReports.filter(r => {
      const t = taskByReport(r.rp_id);
      return !t || t.tk_status === "assign";
    }).length;
    return { totalReports: total, haveTask: withTask, inProgress, awaiting };
  }, [filteredReports]);

  // helpers
  function orgName(org_id) {
    return orgs.find(o => o.id === org_id)?.name ?? "-";
  }
  function buildingName(building_id) {
    return buildings.find(b => b.id === building_id)?.name ?? "-";
  }
  function liftName(lift_id) {
    return lifts.find(l => l.id === lift_id)?.name ?? `LIFT#${lift_id}`;
  }
  function taskByReport(rp_id) {
    return allTasks.find(t => t.rp_id === rp_id);
  }
  function timelineByTask(tk_id) {
    return allTaskStatuses.filter(s => s.tk_id === tk_id).sort((a,b) => new Date(a.time) - new Date(b.time));
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">แดชบอร์ดผู้ใช้</h1>
          <p className="text-sm text-gray-500">สวัสดี {currentUser.firstName}! ดูสถานะการแจ้งซ่อมและความคืบหน้าล่าสุดของคุณ</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-gray-50">
            <Bell className="w-4 h-4"/>
            การแจ้งเตือน
          </button>
        </div>
      </header>

      {/* Filters + Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ค้นหา: รายละเอียด/อาคาร/ลิฟต์"
            className="w-full rounded-xl border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">ช่วงเวลา</span>
          <div className="relative">
            <select
              className="appearance-none rounded-xl border py-2 pl-3 pr-8"
              value={range}
              onChange={e => setRange(e.target.value)}
            >
              <option value="7d">7 วัน</option>
              <option value="30d">30 วัน</option>
              <option value="all">ทั้งหมด</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"/>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"><Filter className="w-4 h-4"/>ฟิลเตอร์</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="เคสของฉัน" value={kpis.totalReports} hint="รวมในช่วงเวลาที่เลือก"/>
        <KpiCard label="มีการมอบหมายงาน" value={kpis.haveTask} hint="เคสที่ถูกเปิด task แล้ว"/>
        <KpiCard label="กำลังดำเนินการ" value={kpis.inProgress} hint="preparing/progress"/>
        <KpiCard label="รอดำเนินการ" value={kpis.awaiting} hint="ยังไม่เริ่ม/รอมอบหมาย"/>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: My Reports */}
        <section className="lg:col-span-2 rounded-2xl border bg-white">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold">การแจ้งซ่อมของฉัน</h3>
            <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"><FileText className="w-4 h-4"/> แจ้งซ่อมใหม่</button>
          </div>
          {busy ? (
            <div className="p-8 flex items-center justify-center text-gray-500">
              <Loader2 className="w-5 h-5 mr-2 animate-spin"/> กำลังโหลดข้อมูลตัวอย่าง…
            </div>
          ) : (
            <ReportTable rows={filteredReports} orgName={orgName} buildingName={buildingName} liftName={liftName} taskByReport={taskByReport}/>
          )}
        </section>

        {/* Right: Progress Focus */}
        <section className="rounded-2xl border bg-white">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold">ความคืบหน้าล่าสุด</h3>
            <Info className="w-4 h-4 text-gray-400"/>
          </div>
          <div className="p-4 space-y-4">
            {filteredReports.slice(0, 3).map(r => {
              const t = taskByReport(r.rp_id);
              if (!t) return (
                <div key={r.rp_id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{liftName(r.lift_id)} · {buildingName(r.building_id)}</div>
                    <ReportStatusBadge status="unassigned"/>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2 whitespace-pre-wrap">{r.detail}</p>
                  <div className="text-xs text-gray-400 mt-2">แจ้งเมื่อ {thaiDate(r.date_rp)}</div>
                </div>
              );
              return (
                <div key={r.rp_id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{liftName(r.lift_id)} · {buildingName(r.building_id)}</div>
                    <ReportStatusBadge status={t.tk_status}/>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2 whitespace-pre-wrap">{r.detail}</p>
                  <Timeline items={timelineByTask(t.tk_id)} className="mt-3"/>
                </div>
              );
            })}
            {filteredReports.length === 0 && (
              <div className="text-center text-gray-500 py-10">ไม่พบเคสในช่วงเวลาที่เลือก</div>
            )}
          </div>
        </section>
      </div>

    </div>
  );
}

function KpiCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value ?? '-'}</div>
      {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
  );
}

function ReportTable({ rows, orgName, buildingName, liftName, taskByReport }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-gray-600">
            <th className="text-left font-medium p-3">วันที่แจ้ง</th>
            <th className="text-left font-medium p-3">อาคาร / ลิฟต์</th>
            <th className="text-left font-medium p-3">รายละเอียด</th>
            <th className="text-left font-medium p-3">สถานะ</th>
            <th className="text-left font-medium p-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const t = taskByReport(r.rp_id);
            return (
              <tr key={r.rp_id} className="border-b last:border-0 hover:bg-gray-50/60">
                <td className="p-3 whitespace-nowrap">{thaiDate(r.date_rp)}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400"/>
                    <div className="flex flex-col">
                      <span className="font-medium">{buildingName(r.building_id)}</span>
                      <span className="text-xs text-gray-500">ลิฟต์ {liftName(r.lift_id)}</span>
                    </div>
                  </div>
                </td>
                <td className="p-3 align-top">
                  <div className="max-w-xl whitespace-pre-wrap text-gray-700">{r.detail}</div>
                </td>
                <td className="p-3"><ReportStatusBadge status={t?.tk_status ?? "unassigned"}/></td>
                <td className="p-3 text-right">
                  <a className="inline-flex items-center gap-1 text-blue-600 hover:underline cursor-pointer">ดูความคืบหน้า <ArrowRight className="w-4 h-4"/></a>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="p-8 text-center text-gray-500">ไม่มีรายการ</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ReportStatusBadge({ status }) {
  const m = statusMap(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${m.tw}`}>{m.label}</span>
  );
}

function statusMap(status) {
  switch (status) {
    case "assign": return { label: "รอรับงาน", tw: "bg-amber-50 border-amber-200 text-amber-700" };
    case "preparing": return { label: "เตรียมการ", tw: "bg-purple-50 border-purple-200 text-purple-700" };
    case "progress": return { label: "กำลังดำเนินการ", tw: "bg-blue-50 border-blue-200 text-blue-700" };
    case "complete": return { label: "เสร็จสิ้น", tw: "bg-emerald-50 border-emerald-200 text-emerald-700" };
    case "unassigned":
    default:
      return { label: "รอมอบหมาย", tw: "bg-gray-50 border-gray-200 text-gray-600" };
  }
}

function Timeline({ items, className = "" }) {
  if (!items || items.length === 0) return <div className={"text-xs text-gray-400 " + className}>ยังไม่มีความคืบหน้า</div>;
  return (
    <div className={"" + className}>
      <ol className="relative border-l pl-4">
        {items.map((it, idx) => (
          <li key={it.tk_status_id} className="mb-3 ml-1">
            <div className="absolute -left-[7px] mt-1 w-3 h-3 rounded-full bg-gray-300" />
            <div className="text-xs text-gray-500">{thaiDateTime(it.time)}</div>
            <div className="text-sm"><strong className="mr-1">{statusMap(it.status).label}:</strong> {it.detail}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ===== Utilities =====
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function thaiDate(isoDate) {
  if (!isoDate) return "-";
  const d = new Date(isoDate + (isoDate.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}
function thaiDateTime(isoDateTime) {
  const d = new Date(isoDateTime.replace(" ", "T"));
  return d.toLocaleString("th-TH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
