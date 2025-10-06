// src/components/dashboard/DashboardUser.jsx

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { th } from "date-fns/locale";

// UI components
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ClipboardList, Plus, ArrowUp, ArrowDown, Wrench, Send, Search, Building2, Loader2, RefreshCw } from "lucide-react";

// service
import { fetchDashboardData } from "@/services/DashboardService";

/* -------------------------------------------------------------------------- */
/* CONFIG                                                                     */
/* -------------------------------------------------------------------------- */

// ซ่อนการ์ด KPI ทั้งหมด (Buildings / Elevators / Technicians / Open Tasks)
const SHOW_KPIS = false;

/* -------------------------------------------------------------------------- */
/* UTILS                                                                       */
/* -------------------------------------------------------------------------- */

const statusMeta = {
  assign: { label: "รอจัดคิวช่าง", badge: "bg-amber-100 text-amber-700" },
  preparing: { label: "ช่างกำลังเตรียมการ", badge: "bg-purple-100 text-purple-700" },
  progress: { label: "ช่างกำลังดำเนินการ", badge: "bg-blue-100 text-blue-700" },
  complete: { label: "ปิดงานแล้ว", badge: "bg-emerald-100 text-emerald-700" },
};

function timeAgo(iso) {
  try {
    return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true, locale: th });
  } catch {
    return "-";
  }
}

function to8Bits(str) {
  return String(str || "").padStart(8, "0").slice(0, 8);
}

/* -------------------------------------------------------------------------- */
/* LIFT STATUS LOGIC                                                          */
/* -------------------------------------------------------------------------- */

function computeLiftSummary(liftBit) {
  const up = to8Bits(liftBit.up);
  const down = to8Bits(liftBit.down);
  const car = to8Bits(liftBit.car);

  if (up === "00000000" && down === "00000000" && car === "00000000") {
    return { tone: "offline", label: "ออฟไลน์" };
  }
  if (liftBit.dir === "↑" || liftBit.dir === "↓") {
    return { tone: "online", label: `กำลังวิ่ง ${liftBit.dir} (${liftBit.current})` };
  }
  if (liftBit.dir === "·") {
    return { tone: "online", label: `อยู่ที่ชั้น ${liftBit.current}` };
  }
  return { tone: "warn", label: "ออนไลน์ (ข้อมูลไม่สมบูรณ์)" };
}

function StatusPill({ tone, label }) {
  const palette = {
    offline: {
      wrap: "inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-rose-50 border-rose-200 text-rose-700",
      dot: "w-2.5 h-2.5 rounded-full bg-slate-400",
    },
    online: {
      wrap: "inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700",
      dot: "w-2.5 h-2.5 rounded-full bg-emerald-500",
    },
    warn: {
      wrap: "inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-amber-50 border-amber-200 text-amber-700",
      dot: "w-2.5 h-2.5 rounded-full bg-amber-500",
    },
    alert: {
      wrap: "inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-red-50 border-red-200 text-red-700",
      dot: "w-2.5 h-2.5 rounded-full bg-red-500",
    },
  };
  const c = palette[tone] || palette.offline;
  return (
    <span className={c.wrap}>
      <span className={c.dot} />
      <span className="leading-none">{label}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* SUB VIEWS                                                                  */
/* -------------------------------------------------------------------------- */

function LiftGlyph({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="8" y="7" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="2" />
      <path d="M12 4v2M9 4v2M15 4v2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function LiftBitsMini({ lift }) {
  const up = to8Bits(lift.up);
  const down = to8Bits(lift.down);
  const car = to8Bits(lift.car);
  const allBits = up + down + car;
  const summary = computeLiftSummary(lift);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <LiftGlyph className="w-4 h-4" />
            <Building2 className="w-4 h-4 text-slate-400" /> {lift.name}
            <span className="text-slate-400">· {lift.building}</span>
          </span>
          <StatusPill tone={summary.tone} label={summary.label} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm font-medium">สถานะบิต (Up | Down | Car)</div>
        <div className="grid grid-cols-24 gap-px text-xs font-mono">
          {allBits.split("").map((b, i) => (
            <div
              key={i}
              className={`text-center rounded-sm border px-px ${
                b === "1" ? "bg-red-100 border-red-300 text-red-700" : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
            >
              {b}
            </div>
          ))}
        </div>
        <div className="text-[10px] text-slate-500">* แสดง 24 บิต (Up: 8 บิต | Down: 8 บิต | Car: 8 บิต)</div>
      </CardContent>
    </Card>
  );
}

function QuickCall({ liftsForSelect }) {
  const [liftId, setLiftId] = useState(liftsForSelect[0]?.id || "");
  const [floor, setFloor] = useState(1);
  const [dir, setDir] = useState("U");

  const currentLift = liftsForSelect.find((l) => l.id === liftId) || liftsForSelect[0] || { max_level: 0 };

  useEffect(() => {
    if (liftsForSelect.length > 0 && (liftId === "" || !liftsForSelect.some((l) => l.id === liftId))) {
      setLiftId(liftsForSelect[0].id);
    }
  }, [liftsForSelect, liftId]);

  const floorOptions = useMemo(() => {
    return Array.from({ length: currentLift.max_level || 0 }, (_, i) => i + 1);
  }, [currentLift.max_level]);

  useEffect(() => {
    if (floor > (currentLift.max_level || 0)) {
      setFloor(1);
    }
  }, [currentLift.max_level, floor]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowUp className="w-4 h-4" /> เรียกลิฟต์ด่วน
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Lift */}
          <Select value={String(liftId)} onValueChange={(v) => setLiftId(Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกลิฟต์" />
            </SelectTrigger>
            <SelectContent>
              {liftsForSelect.map((l) => (
                <SelectItem key={l.id} value={String(l.id)}>
                  {l.name} · {l.building}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Floor */}
          <Select value={String(floor)} onValueChange={(v) => setFloor(Number(v))} disabled={floorOptions.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกชั้น" />
            </SelectTrigger>
            <SelectContent>
              {floorOptions.map((f) => (
                <SelectItem key={f} value={String(f)}>
                  ชั้น {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Direction */}
          <Select value={dir} onValueChange={setDir}>
            <SelectTrigger>
              <SelectValue placeholder="ทิศทาง" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="U">
                <div className="flex items-center gap-2">
                  <ArrowUp className="w-4 h-4" /> ขึ้น
                </div>
              </SelectItem>
              <SelectItem value="D">
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-4 h-4" /> ลง
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="gap-2"
                onClick={() => console.log("mock app_call", { lift_id: liftId, floor_no: floor, direction: dir })}
                disabled={!liftId || floorOptions.length === 0}
              >
                <Send className="w-4 h-4" /> เรียก
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>เดโม่: ปุ่มถูกปิดไว้ (mock) · เชื่อมต่อ API: /api/app_calls</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="text-xs text-slate-500">
          * API: <code>/api/app_calls</code> (POST: {"{lift_id, floor_no, direction}"})
        </div>
      </CardContent>
    </Card>
  );
}

function NewReportDialog({ liftsForSelect, onSubmit, user }) {
  const [open, setOpen] = useState(false);
  const [liftId, setLiftId] = useState(liftsForSelect[0]?.id || "");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (liftsForSelect.length > 0 && (liftId === "" || !liftsForSelect.some((l) => l.id === liftId))) {
      setLiftId(liftsForSelect[0].id);
    }
  }, [liftsForSelect, liftId]);

  const selectedLift = liftsForSelect.find((l) => l.id === liftId);

  return (
    <>
      <Button className="gap-2" onClick={() => setOpen(true)} disabled={liftsForSelect.length === 0}>
        <Plus className="w-4 h-4" /> แจ้งปัญหา
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>แจ้งปัญหาลิฟต์</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={String(liftId)} onValueChange={(v) => setLiftId(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกลิฟต์" />
              </SelectTrigger>
              <SelectContent>
                {liftsForSelect.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.name} · {l.building}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder={`รายละเอียดปัญหาที่เกิดกับลิฟต์ ${selectedLift?.name || ""}…`}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={() => {
                onSubmit?.({
                  lift_id: liftId,
                  detail,
                  user_id: user.id,
                  org_id: user.org_id,
                  building_id: selectedLift?.building_id,
                });
                setOpen(false);
              }}
              disabled={!liftId || detail.trim() === ""}
            >
              ส่ง (mock)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MyReportsTable({ reports }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return reports.filter(
      (r) =>
        !q || `${r.lift} ${r.building} ${r.detail} ${r.tk_id}`.toLowerCase().includes(q.toLowerCase())
    );
  }, [q, reports]);

  const getReportMeta = (r) => {
    const statusKey = r.tk_status || "assign";
    const meta = statusMeta[statusKey] || { label: statusKey, badge: "bg-slate-100 text-slate-700" };
    return { meta };
    // eslint-disable-next-line no-unreachable
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" /> รายงานของฉัน ({reports.length})
          </span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input className="pl-8 w-56" placeholder="ค้นหา…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-6 text-slate-500">ไม่มีรายงานปัญหาในขณะนี้</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">เวลาที่แจ้ง</TableHead>
                  <TableHead className="w-[150px]">ลิฟต์/อาคาร</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead className="w-[150px]">สถานะ</TableHead>
                  <TableHead className="w-[80px]">งานที่เชื่อม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const { meta } = getReportMeta(r);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm">{r.date}</div>
                        <div className="text-xs text-slate-500">{timeAgo(r.created_at)}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {r.lift} <span className="text-slate-400">· {r.building}</span>
                      </TableCell>
                      <TableCell>{r.detail}</TableCell>
                      <TableCell>
                        <Badge className={meta.badge}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell>#{r.tk_id || "-"}</TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      ไม่พบข้อมูลรายงานที่ตรงกับการค้นหา
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ----------------- */
/* MAIN DASHBOARD    */
/* ----------------- */
export default function UserDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // mock user
  const [user, setUser] = useState({ id: 4, org_id: 1, name: "User APHICHAT", org_name: "KU CSC" });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    const orgId = user.org_id;

    try {
      const userRole = "user";
      const apiData = await fetchDashboardData(userRole, orgId);

      if (apiData.orgId === 0 && userRole === "user") {
        setError("NO_ORG");
        setData(apiData);
        return;
      }

      setData(apiData);
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.org_id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const liftsForSelect = useMemo(() => {
    return (data?.liftBits || [])
      .filter((l) => l.id)
      .map((lBit) => ({
        id: lBit.id,
        name: lBit.name,
        building: lBit.building || "N/A",
        building_id: lBit.building_id,
        max_level: lBit.floors,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const displayedLiftBits = data?.liftBits || [];
  const myReports = data?.reports || [];
  const activity = data?.activity || [];
  const kpis = data?.kpis || [];

  // no org
  if (error === "NO_ORG") {
    return (
      <div className="p-4 md:p-6 space-y-6 text-center">
        <h1 className="text-2xl md:text-3xl font-semibold">Dashboard User</h1>
        <p className="text-slate-500">ยินดีต้อนรับ {user.name} · กรุณาติดต่อผู้ดูแลระบบ</p>
        <p className="text-xl font-semibold text-rose-600">
          <Building2 className="w-6 h-6 inline mr-2 align-text-bottom" />
          บัญชีนี้ยังไม่มีองค์กรณ์ที่สังกัด
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
        <p className="text-slate-500">กำลังโหลดข้อมูลแดชบอร์ดจากฐานข้อมูล...</p>
        <p className="text-xs text-slate-400">(org_id: {user.org_id})</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 space-y-6 text-center">
        <h1 className="text-xl font-semibold text-red-600">เกิดข้อผิดพลาดในการเชื่อมต่อ</h1>
        <p className="text-slate-500">ไม่สามารถดึงข้อมูลแดชบอร์ดได้: {error}</p>
        <Button onClick={loadDashboard} className="gap-2">
          <RefreshCw className="w-4 h-4" /> ลองอีกครั้ง
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">แดชบอร์ดผู้ใช้งาน</h1>
          <p className="text-slate-500">
            ยินดีต้อนรับ {user.name} · องค์กร {user.org_name || "N/A"}
          </p>
        </div>
        <div className="flex gap-2">
          <NewReportDialog liftsForSelect={liftsForSelect} onSubmit={(payload) => console.log("mock create report", payload)} user={user} />
        </div>
      </div>

      {/* KPIs (ใช้ data.kpis จาก Backend) –– ซ่อนด้วย SHOW_KPIS */}
      {SHOW_KPIS && kpis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi, index) => (
            <Card key={index} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Top: Quick Actions & Lift Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickCall liftsForSelect={liftsForSelect} />
        {displayedLiftBits.slice(0, 2).map((lift) => (
          <LiftBitsMini key={lift.id || lift.name} lift={lift} />
        ))}
        {displayedLiftBits.length < 3 && <div className="md:col-span-1"></div>}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="reports" className="mt-2">
        <TabsList>
          <TabsTrigger value="reports">รายงานของฉัน</TabsTrigger>
          <TabsTrigger value="activity">กิจกรรมล่าสุด</TabsTrigger>
          <TabsTrigger value="help">วิธีใช้งาน</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4 mt-4">
          <MyReportsTable reports={myReports} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4 mt-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="w-5 h-5" /> กิจกรรมลิฟต์ล่าสุด
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <div className="text-center py-6 text-slate-500">ไม่มีกิจกรรมล่าสุด</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">เวลา</TableHead>
                        <TableHead>รายละเอียด</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activity.map((a, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{a.time}</TableCell>
                          <TableCell>{a.text}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help" className="space-y-4 mt-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="w-4 h-4" /> ขั้นตอนการแจ้งปัญหา
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  กดปุ่ม <b>แจ้งปัญหา</b> เลือกลิฟต์และพิมพ์รายละเอียด
                </li>
                <li>
                  ติดตามสถานะในแท็บ <b>รายงานของฉัน</b>
                </li>
                <li>
                  เมื่อช่างรับงานแล้ว สถานะจะเปลี่ยนเป็น <b>ช่างกำลังเตรียมการ</b> หรือ <b>กำลังดำเนินการ</b>
                </li>
                <li>
                  เมื่อแก้ไขเสร็จ สถานะจะเป็น <b>ปิดงานแล้ว</b>
                </li>
              </ol>
              <div className="text-xs text-slate-500">
                * ข้อมูลในหน้านี้มาจาก API: <code>/api/dashboard/dashboarduser.php</code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-[11px] text-slate-400 text-center">SMART LIFT </p>
    </div>
  );
}
