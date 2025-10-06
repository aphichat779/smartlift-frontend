// src/components/dashboard/DashboardTechnician.jsx
import React, { useMemo, useState } from "react";
import { format, formatDistanceToNowStrict, isToday, parseISO, addMinutes } from "date-fns";
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
import { CheckCircle2, ClipboardList, Clock3, Hammer, MapPin, ChevronRight, Wrench, AlertTriangle, Search, Filter } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                 MOCK DATA                                  */
/* -------------------------------------------------------------------------- */
const MOCK_TECH = { id: 3, name: "Technician123", org: "KU CSC" };

const MOCK_LIFTS = [
  { id: 8, name: "CSC01", building: "อาคาร 1", floors: [1, 2, 3, 4], bits: "030900000000", up: "00000000", down: "00000000", car: "00000000" },
  { id: 1, name: "KUSE", building: "อาคาร 19", floors: Array.from({ length: 15 }, (_, i) => i + 1), bits: "018C00000000", up: "00000000", down: "00000000", car: "00000000" },
];

const MOCK_REPORTS_UNASSIGNED = [
  {
    rp_id: 101,
    created_at: "2025-10-06T00:40:59+07:00",
    org: "KU CSC",
    building: "อาคาร 1",
    lift_id: 8,
    lift_name: "CSC01",
    detail: "ประตูลิฟต์ปิดไม่สนิท (ชั้น 2)",
    priority: "high",
  },
  {
    rp_id: 102,
    created_at: "2025-10-05T14:10:00+07:00",
    org: "KU CSC",
    building: "อาคาร 1",
    lift_id: 8,
    lift_name: "CSC01",
    detail: "มีเสียงดังตอนเริ่มออกตัว",
    priority: "medium",
  },
];

const MOCK_TASKS = [
  {
    tk_id: 1,
    rp_id: 1,
    lift_id: 8,
    lift_name: "CSC01",
    building: "อาคาร 1",
    status: "assign",
    tools: [],
    start_date: null,
    expected_end_date: null,
    created_at: "2025-10-06T00:41:54+07:00",
    updated_at: "2025-10-06T00:41:54+07:00",
    detail: "Assigned by super_admin",
    priority: "high",
  },
  {
    tk_id: 2,
    rp_id: 103,
    lift_id: 1,
    lift_name: "KUSE",
    building: "อาคาร 19",
    status: "preparing",
    tools: ["ไขควงแฉก", "ประแจปอนด์"],
    start_date: "2025-10-06",
    expected_end_date: "2025-10-07",
    created_at: "2025-10-05T09:12:00+07:00",
    updated_at: "2025-10-06T09:30:00+07:00",
    detail: "เตรียมเครื่องมือและอะไหล่",
    priority: "medium",
  },
  {
    tk_id: 3,
    rp_id: 104,
    lift_id: 1,
    lift_name: "KUSE",
    building: "อาคาร 19",
    status: "progress",
    tools: ["มัลติมิเตอร์", "ไขควงไฟฟ้า"],
    start_date: "2025-10-06",
    expected_end_date: "2025-10-06",
    created_at: "2025-10-05T08:00:00+07:00",
    updated_at: "2025-10-06T10:45:00+07:00",
    detail: "ตรวจสอบวงจรควบคุม",
    priority: "high",
  },
  {
    tk_id: 4,
    rp_id: 105,
    lift_id: 8,
    lift_name: "CSC01",
    building: "อาคาร 1",
    status: "complete",
    tools: ["ผ้าเช็ด", "จาระบี"],
    start_date: "2025-10-04",
    expected_end_date: "2025-10-04",
    created_at: "2025-10-04T07:00:00+07:00",
    updated_at: "2025-10-04T13:30:00+07:00",
    detail: "ทำความสะอาดรางประตูและทดสอบ",
    priority: "low",
  },
];

/* -------------------------------------------------------------------------- */
/*                                   UTILS                                    */
/* -------------------------------------------------------------------------- */
const statusMeta = {
  assign: { label: "รอรับงาน", badge: "bg-amber-100 text-amber-700", step: 0, pct: 10 },
  preparing: { label: "เตรียมการ", badge: "bg-purple-100 text-purple-700", step: 1, pct: 40 },
  progress: { label: "กำลังดำเนินการ", badge: "bg-blue-100 text-blue-700", step: 2, pct: 75 },
  complete: { label: "เสร็จสิ้น", badge: "bg-emerald-100 text-emerald-700", step: 3, pct: 100 },
};

const priorityBadge = (p) => ({
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-slate-100 text-slate-700",
}[p] || "bg-slate-100 text-slate-700");

function timeAgo(iso) {
  try {
    return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true, locale: th });
  } catch (e) {
    return "-";
  }
}

function fmtDate(iso) {
  try { return format(parseISO(iso), "d MMM yyyy HH:mm", { locale: th }); } catch { return "-"; }
}

/* -------------------------------------------------------------------------- */
/*                                SUB COMPONENTS                               */
/* -------------------------------------------------------------------------- */
function HeaderStats({ tasks }) {
  const counts = useMemo(() => ({
    total: tasks.length,
    assign: tasks.filter(t => t.status === "assign").length,
    progress: tasks.filter(t => t.status === "progress").length,
    today: tasks.filter(t => t.expected_end_date && isToday(parseISO(t.expected_end_date))).length,
  }), [tasks]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <ClipboardList className="w-6 h-6" />
          <div>
            <p className="text-sm text-slate-500">งานทั้งหมด</p>
            <p className="text-2xl font-semibold">{counts.total}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <Clock3 className="w-6 h-6" />
          <div>
            <p className="text-sm text-slate-500">รอรับงาน</p>
            <p className="text-2xl font-semibold">{counts.assign}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <Wrench className="w-6 h-6" />
          <div>
            <p className="text-sm text-slate-500">กำลังดำเนินการ</p>
            <p className="text-2xl font-semibold">{counts.progress}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6" />
          <div>
            <p className="text-sm text-slate-500">ครบกำหนดวันนี้</p>
            <p className="text-2xl font-semibold">{counts.today}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LiftBitsCard({ lift }) {
  const bits = (lift.bits || "").padStart(12, "0").split("");
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">สถานะลิฟต์: {lift.name} <span className="text-slate-400">· {lift.building}</span></CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-12 gap-2">
          {bits.map((b, idx) => (
            <div key={idx} className={`text-center rounded-md border p-2 ${b === "1" ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
              <p className="text-xs text-slate-500">B{idx}</p>
              <p className="font-medium">{b}</p>
            </div>
          ))}
        </div>
        <div className="text-xs text-slate-500">* ตัวอย่าง mock: 12 บิตจาก lift_state (ซ้าย→ขวา)</div>
      </CardContent>
    </Card>
  );
}

function Stepper({ status }) {
  const steps = ["assign", "preparing", "progress", "complete"]; 
  const current = steps.indexOf(status);
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`h-2 w-10 rounded-full ${i <= current ? "bg-blue-500" : "bg-slate-200"}`}></div>
          {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
        </div>
      ))}
    </div>
  );
}

function UnassignedReports({ reports, onClaim }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> รายงานที่ยังไม่มอบหมาย
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>เวลา</TableHead>
              <TableHead>ลิฟต์</TableHead>
              <TableHead>อาคาร</TableHead>
              <TableHead>รายละเอียด</TableHead>
              <TableHead>ความเร่งด่วน</TableHead>
              <TableHead className="text-right">ดำเนินการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map(r => (
              <TableRow key={r.rp_id}>
                <TableCell>
                  <div className="text-sm">{fmtDate(r.created_at)}</div>
                  <div className="text-xs text-slate-500">{timeAgo(r.created_at)}</div>
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium">{r.lift_name}</TableCell>
                <TableCell className="whitespace-nowrap">{r.building}</TableCell>
                <TableCell>{r.detail}</TableCell>
                <TableCell>
                  <Badge className={`${priorityBadge(r.priority)} capitalize`}>{r.priority}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" onClick={() => onClaim?.(r)} disabled>
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TaskRow({ t }) {
  const meta = statusMeta[t.status];
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap font-medium">#{t.tk_id}</TableCell>
      <TableCell className="whitespace-nowrap">{t.lift_name} <span className="text-slate-400">· {t.building}</span></TableCell>
      <TableCell className="max-w-[280px]">
        <div className="text-sm">{t.detail}</div>
        <div className="mt-2">
          <Stepper status={t.status} />
        </div>
      </TableCell>
      <TableCell>
        <Badge className={`${meta.badge}`}>{meta.label}</Badge>
        <div className="mt-2">
          <Progress value={meta.pct} />
        </div>
      </TableCell>
      <TableCell>
        {t.expected_end_date ? (
          <div>
            <div className="text-sm">ครบกำหนด: {format(parseISO(t.expected_end_date), "d MMM yyyy", { locale: th })}</div>
            <div className="text-xs text-slate-500">{timeAgo(addMinutes(parseISO(t.expected_end_date+"T23:59:00"), 0).toISOString())}</div>
          </div>
        ) : <span className="text-slate-400">-</span>}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {t.tools?.length ? t.tools.map(tool => (
            <Badge key={tool} variant="outline" className="px-2 py-0.5">{tool}</Badge>
          )) : <span className="text-slate-400">ไม่มี</span>}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="outline" size="sm">อัปเดต</Button>
      </TableCell>
    </TableRow>
  );
}

function TaskTable({ tasks }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchQ = !q || `${t.lift_name} ${t.building} ${t.detail}`.toLowerCase().includes(q.toLowerCase());
      const matchS = status === "all" || t.status === status;
      return matchQ && matchS;
    });
  }, [q, status, tasks]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2"><Wrench className="w-5 h-5" /> งานของฉัน</span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input className="pl-8 w-56" placeholder="ค้นหา..." value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40">
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
            <Button variant="outline" className="gap-2"><Filter className="w-4 h-4" /> ตัวกรอง</Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>ลิฟต์/อาคาร</TableHead>
              <TableHead>รายละเอียด/สถานะ</TableHead>
              <TableHead>สเต็ป/ความคืบหน้า</TableHead>
              <TableHead>กำหนดเสร็จ</TableHead>
              <TableHead>เครื่องมือ</TableHead>
              <TableHead className="text-right">ดำเนินการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(t => <TaskRow key={t.tk_id} t={t} />)}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                               MAIN DASHBOARD                                */
/* -------------------------------------------------------------------------- */
export default function TechnicianDashboardMock() {
  const tasks = MOCK_TASKS;
  const lifts = MOCK_LIFTS;
  const reports = MOCK_REPORTS_UNASSIGNED;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">แดชบอร์ดช่างเทคนิค</h1>
          <p className="text-slate-500">สวัสดี {MOCK_TECH.name} · องค์กร {MOCK_TECH.org}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">รีเฟรช</Button>
          <Button className="gap-2"><Hammer className="w-4 h-4" /> เริ่มงานใหม่</Button>
        </div>
      </div>

      {/* Stats */}
      <HeaderStats tasks={tasks} />

      {/* Content Tabs */}
      <Tabs defaultValue="tasks" className="mt-2">
        <TabsList>
          <TabsTrigger value="tasks">งานของฉัน</TabsTrigger>
          <TabsTrigger value="reports">รายงานที่ยังไม่มอบหมาย</TabsTrigger>
          <TabsTrigger value="lifts">สถานะลิฟต์ (บิต)</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4 mt-4">
          <TaskTable tasks={tasks} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 mt-4">
          <UnassignedReports reports={reports} onClaim={(r) => console.log("claim", r)} />
        </TabsContent>

        <TabsContent value="lifts" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lifts.map(l => <LiftBitsCard key={l.id} lift={l} />)}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer hint */}
      <p className="text-xs text-slate-400 text-center">Mock UI · ต่อ API ภายหลัง: /api/technician/tasks, /api/lifts/status, /api/reports/unassigned</p>
    </div>
  );
}
