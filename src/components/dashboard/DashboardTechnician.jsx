// src/components/dashboard/DashboardTechnician.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { th } from "date-fns/locale";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

import {
  ClipboardList,
  Clock3,
  Hammer,
  ChevronRight,
  Wrench,
  AlertTriangle,
  Search,
  Filter,
  TrendingUp,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Legend,
  CartesianGrid,
} from "recharts";

import { fetchTechnicianDashboard } from "@/services/DashboardService";

/* ----------------------------- UTILS ------------------------------ */
const statusMeta = {
  assign: { label: "รอรับงาน", badge: "bg-amber-100 text-amber-700", step: 0, pct: 10 },
  preparing: { label: "เตรียมการ", badge: "bg-purple-100 text-purple-700", step: 1, pct: 40 },
  progress: { label: "กำลังดำเนินการ", badge: "bg-blue-100 text-blue-700", step: 2, pct: 75 },
  complete: { label: "เสร็จสิ้น", badge: "bg-emerald-100 text-emerald-700", step: 3, pct: 100 },
};

const priorityBadge = (p) =>
  ({
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-slate-100 text-slate-700",
  }[p] || "bg-slate-100 text-slate-700");

function timeAgo(iso) {
  try {
    return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true, locale: th });
  } catch {
    return "-";
  }
}
function fmtDate(iso) {
  try {
    return format(parseISO(iso), "d MMM yyyy HH:mm", { locale: th });
  } catch {
    return "-";
  }
}

/* --------------------------- SUB COMPONENTS ----------------------- */

/* Top summary cards */
function HeaderStats({ tasks }) {
  const counts = useMemo(
    () => ({
      total: tasks.length,
      assign: tasks.filter((t) => t.status === "assign").length,
      progress: tasks.filter((t) => t.status === "progress").length,
    }),
    [tasks]
  );

  const StatCard = ({ icon, label, value, accent }) => (
    <Card className="shadow-sm border border-slate-100 rounded-xl">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg grid place-items-center ${accent}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-xl font-semibold text-slate-800 leading-snug">{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        icon={<ClipboardList className="w-5 h-5 text-emerald-700" />}
        label="งานทั้งหมด"
        value={counts.total}
        accent="bg-emerald-50"
      />
      <StatCard
        icon={<Clock3 className="w-5 h-5 text-amber-700" />}
        label="รอรับงาน"
        value={counts.assign}
        accent="bg-amber-50"
      />
      <StatCard
        icon={<Wrench className="w-5 h-5 text-blue-700" />}
        label="กำลังดำเนินการ"
        value={counts.progress}
        accent="bg-blue-50"
      />
    </div>
  );
}

/* slim linear stepper */
function Stepper({ status }) {
  const steps = ["assign", "preparing", "progress", "complete"];
  const current = steps.indexOf(status);
  return (
    <div className="flex items-center gap-1 whitespace-nowrap text-[10px] sm:text-xs">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div
            className={`h-1.5 w-7 rounded-full ${
              i <= current ? "bg-emerald-500" : "bg-slate-200"
            }`}
          />
          {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
        </div>
      ))}
    </div>
  );
}

/* ---------------------- UNASSIGNED REPORTS ----------------------- */
/* มือถือ: list เป็นการ์ด; เดสก์ทอป: table */
function UnassignedReports({ reports, onClaim }) {
  return (
    <Card className="shadow-sm border border-slate-100 rounded-xl overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-slate-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" /> รายงานที่ยังไม่มอบหมาย
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* --- Mobile cards (<md) --- */}
        <div className="space-y-4 md:hidden">
          {reports.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-sm">ไม่มีรายงานที่รอจัดสรร</div>
          ) : (
            reports.map((r) => (
              <div
                key={r.rp_id}
                className="rounded-xl border border-slate-200 p-4 shadow-sm bg-white space-y-3"
              >
                <div className="flex flex-col gap-1 text-[13px] leading-relaxed">
                  <div className="text-slate-800 font-semibold">
                    {r.lift_name || "ลิฟต์ไม่ระบุ"}
                  </div>
                  <div className="text-slate-500">
                    อาคาร: {r.building || "-"}
                  </div>
                  <div className="text-[12px] text-slate-500">
                    แจ้งเมื่อ: {fmtDate(r.created_at)}{" "}
                    <span className="text-slate-400">
                      ({timeAgo(r.created_at)})
                    </span>
                  </div>
                </div>

                <div className="text-[13px] text-slate-700 bg-slate-50 rounded-lg border p-3 whitespace-pre-wrap">
                  {r.detail || "-"}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge
                    className={`${priorityBadge(
                      r.priority
                    )} capitalize text-[11px] px-2 py-1`}
                  >
                    {r.priority || "n/a"}
                  </Badge>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          className="h-9 text-[13px] font-medium w-auto bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => onClaim?.(r)}
                          disabled
                        >
                          รับงาน
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>เดโม่: ปุ่มถูกปิดไว้ (mock)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))
          )}
        </div>

        {/* --- Desktop table (>=md) --- */}
        <div className="hidden md:block overflow-x-auto">
          <Table className="table-auto w-full min-w-[700px] text-sm">
            <TableHeader>
              <TableRow className="bg-slate-50 text-slate-600">
                <TableHead className="w-40">เวลา</TableHead>
                <TableHead className="w-32">ลิฟต์</TableHead>
                <TableHead className="w-40">อาคาร</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead className="w-32">ความเร่งด่วน</TableHead>
                <TableHead className="w-28 text-right">ดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-slate-400 text-sm">
                    ไม่มีรายงานที่รอจัดสรร
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((r) => (
                  <TableRow
                    key={r.rp_id}
                    className="hover:bg-slate-50 transition"
                  >
                    <TableCell>
                      <div className="text-xs sm:text-sm">{fmtDate(r.created_at)}</div>
                      <div className="text-[10px] text-slate-500 sm:text-xs">
                        {timeAgo(r.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium text-xs sm:text-sm">
                      {r.lift_name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                      {r.building}
                    </TableCell>
                    <TableCell className="max-w-[520px] text-xs sm:text-sm">
                      <div className="whitespace-normal break-words">{r.detail}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${priorityBadge(
                          r.priority
                        )} capitalize text-[10px] sm:text-xs`}
                      >
                        {r.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => onClaim?.(r)}
                              disabled
                              className="text-slate-500 text-[11px] sm:text-xs"
                            >
                              รับงาน
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>เดโม่: ปุ่มถูกปิดไว้ (mock)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ===== Chart helper ===== */
function useProblemLiftData(tasks) {
  return useMemo(() => {
    const map = new Map();
    for (const t of tasks) {
      const key = t.lift_id ?? t.lift_name ?? "unknown";
      if (!map.has(key)) {
        map.set(key, {
          lift_id: t.lift_id,
          lift_name: t.lift_name,
          building: t.building,
          total: 0,
          open: 0,
        });
      }
      const row = map.get(key);
      row.total += 1;
      if (["assign", "preparing", "progress"].includes(t.status)) row.open += 1;
    }
    const arr = [...map.values()]
      .sort((a, b) => b.open - a.open || b.total - a.total)
      .slice(0, 5);
    return arr.map((r) => ({
      label: `${r.lift_name || "Lift"} (${r.building || "N/A"})`,
      open: r.open,
      closed: Math.max(0, r.total - r.open),
      total: r.total,
    }));
  }, [tasks]);
}

/* ===== กราฟแท่งซ้อน ===== */
function ProblemLiftsChart({ tasks }) {
  const data = useProblemLiftData(tasks);
  return (
    <Card className="shadow-sm border border-slate-100 rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-slate-800">
          <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" /> กราฟ: ลิฟต์ที่ซ่อมบ่อย (Top 5)
        </CardTitle>
      </CardHeader>

      {/* wrapper: ให้สกอร์ลแนวนอนได้บนจอเล็ก */}
      <CardContent className="h-64 overflow-x-auto">
        {data.length === 0 ? (
          <div className="h-full grid place-items-center text-slate-400 text-sm">
            ไม่มีข้อมูลสถิติ
          </div>
        ) : (
          <div className="min-w-[480px] h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  interval={0}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => (v.length > 18 ? v.slice(0, 18) + "…" : v)}
                />
                <YAxis allowDecimals={false} />
                <RTooltip
                  formatter={(value, name) => [
                    value,
                    name === "open"
                      ? "ค้าง"
                      : name === "closed"
                      ? "ปิดแล้ว"
                      : name,
                  ]}
                />
                <Legend />
                <Bar dataKey="open" stackId="a" name="ค้าง" fill="#10b981" />
                <Bar dataKey="closed" stackId="a" name="ปิดแล้ว" fill="#cbd5e1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------- 1 แถวของตารางงาน (desktop) + การ์ดงาน (mobile) ------- */
function TaskRow({ t }) {
  const meta = statusMeta[t.status] || statusMeta.assign;

  return (
    <>
      {/* Desktop row */}
      <TableRow className="hover:bg-slate-50 transition hidden md:table-row">
        <TableCell className="w-12 font-medium whitespace-nowrap">#{t.tk_id}</TableCell>

        <TableCell className="min-w-[140px] w-[160px]">
          <div className="font-medium text-slate-700 truncate">{t.lift_name || "-"}</div>
          <div className="text-xs text-slate-400 truncate">{t.building || "N/A"}</div>
        </TableCell>

        <TableCell className="align-top min-w-[260px] w-[40%] max-w-[520px]">
          <div className="text-sm text-slate-700 whitespace-normal break-words">
            <Badge className={`${meta.badge} px-2 py-0.5 text-xs`}>{meta.label}</Badge>
          </div>
          <div className="mt-2">
            <Stepper status={t.status} />
          </div>
        </TableCell>

        <TableCell className="min-w-[180px] w-[220px]">
          {t.status_detail || t.detail || "-"}
        </TableCell>

        <TableCell className="min-w-[120px] w-[160px]">
          <div className="flex flex-wrap gap-1">
            {t.tools?.length ? (
              t.tools.map((tool) => (
                <Badge
                  key={tool}
                  variant="outline"
                  className="px-2 py-0.5 text-xs border-slate-300"
                >
                  {tool}
                </Badge>
              ))
            ) : (
              <span className="text-slate-400 text-sm">ไม่มี</span>
            )}
          </div>
        </TableCell>

        <TableCell className="w-[84px] text-right">
          <Button
            variant="outline"
            size="sm"
            className="text-emerald-700 border-emerald-200"
          >
            อัปเดต
          </Button>
        </TableCell>
      </TableRow>

      {/* Mobile card */}
      <TableRow className="md:hidden">
        <TableCell colSpan={6} className="p-4">
          <div className="rounded-xl border border-slate-200 shadow-sm p-4 bg-white space-y-4">
            {/* header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-semibold text-slate-800">
                  <span>#{t.tk_id}</span>
                  {t.lift_name && <span>· {t.lift_name}</span>}
                </div>

                <div className="text-[12px] text-slate-500 leading-snug">
                  อาคาร: {t.building || "N/A"}
                </div>
              </div>

              <Badge className={`${meta.badge} px-2 py-0.5 text-[11px] shrink-0`}>
                {meta.label}
              </Badge>
            </div>

            {/* progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[12px] text-slate-500">
                <span>ความคืบหน้า</span>
                <span className="font-medium text-slate-700">{meta.label}</span>
              </div>
              <Stepper status={t.status} />
            </div>

            {/* detail */}
            <div className="text-[13px] leading-relaxed text-slate-700 whitespace-pre-line">
              {t.status_detail || t.detail || "-"}
            </div>

            {/* tools */}
            <div className="text-[13px] leading-relaxed">
              <div className="text-slate-500 font-medium mb-1">เครื่องมือที่ใช้</div>
              {t.tools?.length ? (
                <div className="flex flex-wrap gap-1">
                  {t.tools.map((tool) => (
                    <Badge
                      key={tool}
                      variant="outline"
                      className="px-2 py-0.5 text-[11px] border-slate-300"
                    >
                      {tool}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400">ไม่มี</div>
              )}
            </div>

            {/* action */}
            <div className="pt-2">
              <Button className="w-full h-9 text-[13px] font-medium bg-emerald-600 hover:bg-emerald-700">
                อัปเดตงาน
              </Button>
            </div>
          </div>
        </TableCell>
      </TableRow>
    </>
  );
}

/* ---------------------- TASK TABLE (with filters) ---------------------- */
function TaskTable({ tasks, loading }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const haystack = `${t.lift_name ?? ""} ${t.building ?? ""} ${t.detail ?? ""} ${t.status_detail ?? ""}`.toLowerCase();
      const matchQ = !q || haystack.includes(q.toLowerCase());
      const matchS = status === "all" || t.status === status;
      return matchQ && matchS;
    });
  }, [q, status, tasks]);

  return (
    <Card className="shadow-sm border border-slate-100 rounded-xl overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-slate-700">
          <span className="flex items-center gap-2 text-slate-700 font-medium">
            <Wrench className="w-5 h-5 text-emerald-700 shrink-0" />
            งานของฉัน
          </span>

          {/* Filters: mobile-first layout */}
          <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-8 w-full sm:w-56 h-9 text-sm"
                placeholder="ค้นหา..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 w-full sm:w-40 text-sm">
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="assign">รอรับงาน</SelectItem>
                  <SelectItem value="preparing">เตรียมการ</SelectItem>
                  <SelectItem value="progress">กำลังดำเนินการ</SelectItem>
                  <SelectItem value="complete">เสร็จสิ้น</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="gap-2 h-9 text-sm">
                <Filter className="w-4 h-4" /> ตัวกรอง
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        {loading ? (
          <div className="py-10 text-center text-slate-500 text-sm">กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">ไม่พบรายการ</div>
        ) : (
          <Table className="table-auto w-full text-sm min-w-[700px] md:min-w-0">
            {/* desktop table head only on md+ */}
            <TableHeader className="hidden md:table-header-group">
              <TableRow className="bg-slate-50 text-slate-600">
                <TableHead className="w-12">#</TableHead>
                <TableHead className="min-w-[140px] w-[160px]">ลิฟต์/อาคาร</TableHead>
                <TableHead className="min-w-[260px] w-[40%]">สเต็ปความคืบหน้า</TableHead>
                <TableHead className="min-w-[180px] w-[220px]">รายละเอียด</TableHead>
                <TableHead className="min-w-[120px] w-[160px]">เครื่องมือ</TableHead>
                <TableHead className="w-[84px] text-right">ดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((t) => (
                <TaskRow key={t.tk_id} t={t} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------- SUMMARY LIST (Top 5 lifts) -------------------- */
function ProblemLiftsSummary({ tasks }) {
  const byLift = useMemo(() => {
    const map = new Map();
    for (const t of tasks) {
      const key = t.lift_id ?? t.lift_name ?? "unknown";
      if (!map.has(key)) {
        map.set(key, {
          lift_id: t.lift_id,
          lift_name: t.lift_name,
          building: t.building,
          total: 0,
          open: 0,
        });
      }
      const row = map.get(key);
      row.total += 1;
      if (["assign", "preparing", "progress"].includes(t.status)) row.open += 1;
    }
    return [...map.values()]
      .sort((a, b) => b.open - a.open || b.total - a.total)
      .slice(0, 5);
  }, [tasks]);

  return (
    <Card className="shadow-sm border border-slate-100 rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-slate-800">
          <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />
          ลิฟต์ที่ซ่อมบ่อย (Top 5)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {byLift.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-sm">ไม่มีข้อมูลสถิติ</div>
        ) : (
          byLift.map((r, i) => {
            const pct = r.total ? Math.round((r.open / r.total) * 100) : 0;
            return (
              <div
                key={`${r.lift_id ?? r.lift_name}-${i}`}
                className="flex flex-col gap-3 border-b last:border-0 border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="font-medium text-slate-700 truncate text-sm">
                    {r.lift_name} <span className="text-slate-400">· {r.building}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    งานทั้งหมด {r.total} | ค้าง {r.open}
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>ค้างอยู่</span>
                    <span>{pct}%</span>
                  </div>
                  <Progress value={pct} />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------- MAIN ------------------------------------ */
export default function TechnicianDashboard() {
  const [me, setMe] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      const data = await fetchTechnicianDashboard(false);
      setMe(data.user || null);
      setTasks(data.tasks || []);
      setReports(data.reports || []);
    } catch (e) {
      console.error(e);
      setErr(e?.message || "โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header: mobile-first layout */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-semibold text-slate-800 leading-tight">
            แดชบอร์ดช่างเทคนิค
          </h1>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed">
            {me ? (
              <>
                สวัสดี{" "}
                <span className="font-medium text-slate-700">
                  {me.name || "Technician"}
                </span>{" "}
                · <span className="capitalize">{me.role}</span>
                {me.org ? ` · org ${me.org}` : ""}
              </>
            ) : (
              "กำลังโหลด..."
            )}
          </p>
        </div>

        {/* action buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={load}
            disabled={loading}
            className="border-emerald-200 h-9 text-sm w-full sm:w-auto"
          >
            {loading ? "กำลังโหลด..." : "รีเฟรช"}
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 h-9 text-sm w-full sm:w-auto">
            <Hammer className="w-4 h-4" /> เริ่มงานใหม่
          </Button>
        </div>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      {/* Summary stat cards */}
      <HeaderStats tasks={tasks} />

      {/* Summary + Chart: 1 คอลบนมือถือ / 2 คอลบนจอใหญ่ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProblemLiftsSummary tasks={tasks} />
        <ProblemLiftsChart tasks={tasks} />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="tasks" className="mt-2">
        <TabsList className="flex flex-wrap gap-2 w-full sm:w-auto">
          <TabsTrigger value="tasks" className="flex-1 sm:flex-none text-sm px-4 py-2 rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            งานของฉัน
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex-1 sm:flex-none text-sm px-4 py-2 rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            รายงานที่ยังไม่มอบหมาย
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4 mt-4">
          <TaskTable tasks={tasks} loading={loading} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 mt-4">
          <UnassignedReports reports={reports} onClaim={(r) => console.log("claim", r)} />
        </TabsContent>
      </Tabs>

      <p className="text-[10px] text-slate-400 text-center">
        ใช้ API เดียว: <code>/api/dashboard/technician.php</code>{" "}
        (เพิ่ม <code>?org_scope=self</code> เพื่อจำกัดตามองค์กร)
      </p>
    </div>
  );
}
