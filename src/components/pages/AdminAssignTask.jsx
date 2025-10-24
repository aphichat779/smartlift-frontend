// src/pages/AdminAssignTask.jsx
import React, { useEffect, useMemo, useState } from "react";
import { tasksService } from "../../services/tasksService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

/* ---------------- Utils ---------------- */
const allowed = ["assign", "preparing", "progress", "complete"];
const normalizeStatus = (v) => (allowed.includes(String(v)) ? String(v) : "assign");
const labelOf = (st) => {
  const s = normalizeStatus(st);
  if (s === "assign") return "รอรับงาน";
  if (s === "preparing") return "เตรียมการ";
  if (s === "progress") return "กำลังดำเนินการ";
  if (s === "complete") return "เสร็จสิ้น";
  return s;
};
const THB = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });

const extOf = (name = "") => {
  try {
    const u = new URL(name, "http://x");
    const p = u.pathname || name;
    const dot = p.lastIndexOf(".");
    return dot >= 0 ? p.slice(dot + 1).toLowerCase() : "";
  } catch {
    const dot = name.lastIndexOf(".");
    return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
  }
};
const isImageExt = (e) => ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(e);
const isPdfExt = (e) => e === "pdf";
const isVideoExt = (e) => ["mp4", "webm", "ogg", "mov", "m4v"].includes(e);
const isAudioExt = (e) => ["mp3", "wav", "ogg", "m4a", "aac"].includes(e);

const steps = [
  { key: "assign", label: "assign" },
  { key: "preparing", label: "preparing" },
  { key: "progress", label: "progress" },
  { key: "complete", label: "complete" },
];
const stepIndex = (st) => {
  const idx = steps.findIndex((s) => s.key === normalizeStatus(st));
  return idx < 0 ? 0 : idx;
};
const Stepper = ({ current }) => {
  const idx = stepIndex(current);
  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-md bg-slate-800 text-white">
      {steps.map((step, i) => {
        const done = i <= idx;
        return (
          <div key={step.key} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${done ? "bg-emerald-500" : "bg-slate-500"}`} title={step.label}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white">
                <path fill="currentColor" d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z" />
              </svg>
            </div>
            <span className="text-xs -ml-1">{step.label}</span>
            {i < steps.length - 1 && <div className={`w-10 h-[2px] ${done ? "bg-emerald-400" : "bg-slate-500"}`} />}
          </div>
        );
      })}
    </div>
  );
};

function FilePreviewDialog({ open, onOpenChange, url, name }) {
  const ext = extOf(name || url);
  const downloadable = (
    <a href={url} target="_blank" rel="noreferrer" className="underline text-indigo-600">
      เปิด/ดาวน์โหลดไฟล์นี้
    </a>
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-2xl w-[92vw] max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="truncate">ไฟล์แนบ</DialogTitle>
          <DialogDescription>พรีวิวไฟล์ในหน้า หากแสดงไม่ได้ให้ใช้ลิงก์สำรองด้านล่าง</DialogDescription>
        </DialogHeader>

        <div className="px-2 pb-0">
          {isImageExt(ext) && (
            <div className="rounded-lg border overflow-auto">
              <img src={url} className="max-h-[70vh] object-contain w-full" alt="Preview" />
            </div>
          )}
          {isPdfExt(ext) && (
            <div className="rounded-lg border overflow-hidden">
              <iframe title={name || "PDF"} src={url} className="w-full h-[70vh]" />
            </div>
          )}
          {isVideoExt(ext) && (
            <div className="rounded-lg border overflow-hidden">
              <video src={url} controls className="w-full max-h-[70vh]" />
            </div>
          )}
          {isAudioExt(ext) && (
            <div className="rounded-lg border p-6 flex items-center justify-center">
              <audio src={url} controls className="w-full" />
            </div>
          )}
          {!isImageExt(ext) && !isPdfExt(ext) && !isVideoExt(ext) && !isAudioExt(ext) && (
            <div className="rounded-lg border p-6 text-sm text-gray-700">
              ไม่รองรับพรีวิวไฟล์ชนิดนี้ในหน้าได้โดยตรง — {downloadable}
            </div>
          )}
          <div className="mt-3 text-xs text-gray-500">
            ถ้าไฟล์ไม่แสดง อาจถูกบล็อกโดย CORS/Content-Type ให้เปิดด้วยลิงก์: {downloadable}
          </div>
        </div>

        <DialogFooter className="px-6 pb-6">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            ปิด
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Popup ความคืบหน้า (อ่านอย่างเดียว) ---------------- */
function ProgressDialog({ open, onOpenChange, report, buildFullUrl }) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [info, setInfo] = useState(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewName, setPreviewName] = useState("");

  const openPreview = (url, name) => {
    setPreviewUrl(url);
    setPreviewName(name || "");
    setPreviewOpen(true);
  };

  // ใช้รายการแรก (ล่าสุด) เพราะ backend ส่ง DESC
  const currentStatus = useMemo(() => {
    if (history?.length) {
      const mostRecent = history[0];
      return normalizeStatus(mostRecent?.status || mostRecent?.tk_status || report?.status);
    }
    if (report?.status) return normalizeStatus(report.status);
    return report?.assigned_count > 0 ? "preparing" : "assign";
  }, [history, report]);

  useEffect(() => {
    if (!open || !report) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        // ✅ ใช้ API ที่มีอยู่จริง
        const res = await tasksService.reportProgressByRpId(report.rp_id);
        const detail = res?.success ? (res.data || {}) : {};

        // ✅ normalise ประวัติให้มี file_url และ tools[]
        const rawHistory = Array.isArray(detail.history)
          ? detail.history
          : (Array.isArray(detail.timeline) ? detail.timeline : []);

        const norm = (rawHistory || []).map((h) => {
          let tools = [];
          const tkTool = h.tk_status_tool;
          if (tkTool) {
            try {
              const parsed = typeof tkTool === "string" ? JSON.parse(tkTool) : tkTool;
              if (Array.isArray(parsed)) tools = parsed;
              else if (parsed && Array.isArray(parsed.items)) tools = parsed.items;
            } catch {}
          }
          return {
            ...h,
            file_url: h.file_url || h.tk_img || h.file || null,
            tools,
          };
        });

        if (!cancelled) {
          setHistory(norm);
          setInfo(Object.keys(detail).length ? detail : (report || null));
        }
      } catch {
        if (!cancelled) {
          setHistory([]);
          setInfo(report || null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, report]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ความคืบหน้า • RP: {report?.rp_id}</DialogTitle>
          <DialogDescription>ดูสถานะล่าสุด ไทม์ไลน์ และไฟล์แนบ (โหมดอ่านอย่างเดียว)</DialogDescription>
        </DialogHeader>

        <Stepper current={currentStatus} />

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">รายละเอียดงาน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div>วันที่แจ้ง: <b>{info?.date_rp || report?.date_rp || "-"}</b></div>
              <div>องค์กร: <b>{info?.org_name || report?.org_name || "-"}</b></div>
              <div>อาคาร: <b>{info?.building_name || report?.building_name || "-"}</b></div>
              <div>ลิฟต์: <b>{info?.lift_name || report?.lift_name || "-"}</b></div>
              {info?.start_date && <div>วันเริ่มงาน: <b>{info.start_date}</b></div>}
              {info?.expected_end_date && <div>วันคาดว่าจะเสร็จ: <b>{info.expected_end_date}</b></div>}
              <div className="pt-2">รายละเอียดแจ้งซ่อม:</div>
              <div className="bg-gray-50 rounded p-2 text-gray-700 whitespace-pre-wrap">
                {info?.detail || info?.report_detail || report?.detail || "-"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">ไทม์ไลน์</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-gray-500">กำลังโหลด…</div>
              ) : history?.length ? (
                <div className="max-h-[260px] overflow-auto pr-1 space-y-2">
                  {history.map((h, i) => {
                    const fileUrlRaw = h.file_url || h.tk_img || h.file || "";
                    const hasFile = typeof fileUrlRaw === "string" && fileUrlRaw.length > 0;
                    const fullUrl = buildFullUrl(fileUrlRaw);
                    const statusText = labelOf(h.status || h.tk_status || "");
                    return (
                      <div key={h.tk_status_id || `${h.time}-${h.status}-${i}`} className="rounded border p-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <span>{h.time || h.created_at || ""}</span>
                          {statusText && (<><span>•</span><span className="font-medium">{statusText}</span></>)}
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{h.detail || h.note || "-"}</div>
                        {Array.isArray(h.tools) && h.tools.length > 0 && (
                          <div className="mt-2 text-xs text-slate-600">
                            เครื่องมือ: {h.tools.map((t) => `${t.tool_name}×${t.qty}`).join(", ")}
                          </div>
                        )}
                        {hasFile && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 mt-2 underline"
                            onClick={() => openPreview(fullUrl, h.file_name || (fileUrlRaw.split("/").pop() || ""))}
                          >
                            ไฟล์แนบ (พรีวิว)
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500">ยังไม่มีข้อมูล</div>
              )}
            </CardContent>
          </Card>
        </div>

        <ToolsSummary history={history} />

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>ปิด</Button>
        </DialogFooter>

        <FilePreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} url={previewUrl} name={previewName} />
      </DialogContent>
    </Dialog>
  );
}

function ToolsSummary({ history }) {
  const items = useMemo(() => {
    const map = new Map();
    (history || []).forEach((h) => {
      (h.tools || []).forEach((t) => {
        const key = t.tool_id || t.id || t.tool_name;
        const prev = map.get(key) || { tool_name: t.tool_name, qty: 0, cost: Number(t.cost || 0) };
        map.set(key, { ...prev, qty: prev.qty + Number(t.qty || 0) });
      });
    });
    return Array.from(map.values());
  }, [history]);

  const total = useMemo(
    () => items.reduce((s, x) => s + Number(x.cost || 0) * Number(x.qty || 0), 0),
    [items]
  );

  if (!items.length) return null;
  return (
    <div className="rounded-lg border p-3 mt-3">
      <div className="text-sm font-semibold mb-2">สรุปเครื่องมือที่ใช้ (รวมทุกขั้นตอน)</div>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อเครื่องมือ</TableHead>
              <TableHead className="w-[140px] text-center">จำนวน</TableHead>
              <TableHead className="w-[140px]">ราคา</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((t, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{t.tool_name}</TableCell>
                <TableCell className="text-center">{t.qty}</TableCell>
                <TableCell>{THB.format(Number(t.cost || 0))}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={2} className="text-right font-semibold">รวม</TableCell>
              <TableCell className="font-bold">{THB.format(total)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ---------------- Main: คลิกแถวเพื่อเปิด Assign/Progress ---------------- */
function AdminAssignTask() {
  const [reports, setReports] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showAssign, setShowAssign] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedTech, setSelectedTech] = useState("");
  const [taskDetail, setTaskDetail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [assignedBy, setAssignedBy] = useState("");

  const [techProfile, setTechProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [showDetail, setShowDetail] = useState(false); // kept for future use
  const [detailReport, setDetailReport] = useState(null);

  const [showCreateReport, setShowCreateReport] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [lifts, setLifts] = useState([]);
  const [newRp, setNewRp] = useState({ date_rp: "", org_id: "", building_id: "", lift_id: "", detail: "" });

  const [progressOpen, setProgressOpen] = useState(false);
  const [progressReport, setProgressReport] = useState(null);

  const baseUrl = import.meta.env.VITE_REACT_APP_API_URL || "";
  const buildFullUrl = (raw = "") => {
    if (!raw) return "";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    return baseUrl + (raw.startsWith("/") ? "" : "/") + raw;
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("profile") || localStorage.getItem("user");
      if (raw) {
        const p = JSON.parse(raw);
        const display = p?.first_name || p?.last_name ? `${p.first_name || ""} ${p.last_name || ""}`.trim() : p?.username || "";
        if (display) setAssignedBy(display);
      }
    } catch {}
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await tasksService.reports();
      if (res?.success) setReports(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchTechnicians = async () => {
    try {
      const res = await tasksService.technicians();
      if (res?.success) setTechnicians(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchReports();
    fetchTechnicians();
  }, []);

  const handleAssign = async () => {
    if (!selectedReport || !selectedTech) {
      alert("กรุณาเลือกเคสและช่าง");
      return;
    }
    try {
      const payload = {
        rp_id: selectedReport.rp_id,
        user_id: Number(selectedTech),
        tk_data: taskDetail,
        start_date: startDate || null,
        assigned_by: assignedBy || "Unknown",
      };
      const res = await tasksService.assign(payload);
      if (res?.success) {
        alert("✅ มอบหมายงานสำเร็จ!");
        setShowAssign(false);
        setSelectedTech("");
        setTaskDetail("");
        setStartDate("");
        setTechProfile(null);
        fetchReports();
      } else {
        alert("❌ " + (res?.message || "Assign failed"));
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error assigning task");
    }
  };

  const loadTechProfile = async (techIdStr) => {
    setLoadingProfile(true);
    try {
      const techId = Number(techIdStr);
      const basic = technicians.find((t) => t.id?.toString() === techIdStr) || {};
      let merged = {
        id: basic.id ?? techId,
        first_name: basic.first_name,
        last_name: basic.last_name,
        username: basic.username,
        role: basic.role,
        phone: basic.phone,
        email: basic.email,
        avatar_url: basic.avatar_url,
        skills: basic.skills,
        current_tasks: basic.current_tasks,
        completed_month: basic.completed_month,
        rating: basic.rating,
        service_area: basic.service_area,
      };
      try {
        const res = await tasksService.technicianProfile(techId);
        if (res?.success && res.data) merged = { ...merged, ...res.data };
      } catch (e) {
        console.warn("technicianProfile() failed", e);
      }
      setTechProfile(merged);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleRowClick = (report) => {
    if (report.assigned_count > 0) {
      setProgressReport(report);
      setProgressOpen(true);
    } else {
      setSelectedReport(report);
      setShowAssign(true);
    }
  };

  const loadOrgs = async () => {
    try {
      const res = await tasksService.workOrgs();
      if (res?.success) setOrgs(res.data?.orgs || []);
    } catch (e) { console.error("load orgs failed", e); }
  };
  const loadBuildings = async (org_id) => {
    try {
      if (!org_id) { setBuildings([]); return; }
      const res = await tasksService.workBuildings(org_id);
      if (res?.success) setBuildings(res.data?.buildings || []);
    } catch (e) { console.error("load buildings failed", e); }
  };
  const loadLifts = async (building_id) => {
    try {
      if (!building_id) { setLifts([]); return; }
      const res = await tasksService.workLifts(building_id);
      if (res?.success) setLifts(res.data?.lifts || []);
    } catch (e) { console.error("load lifts failed", e); }
  };

  useEffect(() => {
    if (!showCreateReport) return;
    loadOrgs();
    setNewRp((s) => ({ ...s, date_rp: s.date_rp || new Date().toISOString().slice(0, 10) }));
  }, [showCreateReport]);

  useEffect(() => {
    setNewRp((s) => ({ ...s, building_id: "", lift_id: "" }));
    setBuildings([]);
    setLifts([]);
    if (newRp.org_id) loadBuildings(newRp.org_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newRp.org_id]);

  useEffect(() => {
    setNewRp((s) => ({ ...s, lift_id: "" }));
    setLifts([]);
    if (newRp.building_id) loadLifts(newRp.building_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newRp.building_id]);

  const handleCreateReport = async () => {
    try {
      const { date_rp, org_id, building_id, lift_id, detail } = newRp;
      if (!date_rp || !org_id || !building_id || !lift_id || !detail?.trim()) {
        alert("กรอกข้อมูลให้ครบ: วันที่, องค์กร, อาคาร, ลิฟต์, รายละเอียด");
        return;
      }
      const res = await tasksService.workCreateReport({
        date_rp,
        org_id: Number(org_id),
        building_id: Number(building_id),
        lift_id: Number(lift_id),
        detail: detail.trim(),
      });
      if (res?.success && res?.data?.rp_id) {
        const r = {
          rp_id: res.data.rp_id,
          date_rp: res.data.date_rp || date_rp,
          org_name: res?.data?.org_name,
          building_name: res?.data?.building_name,
          lift_name: res?.data?.lift_name,
          detail: res?.data?.detail || detail,
          assigned_count: 0,
          start_date: null,
          assigned_by: null,
        };
        setShowCreateReport(false);
        setNewRp({ date_rp: "", org_id: "", building_id: "", lift_id: "", detail: "" });
        setSelectedReport(r);
        setShowAssign(true);
      } else {
        alert("❌ สร้าง Report ไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error creating report");
    }
  };

  useEffect(() => {
    if (!showAssign) {
      setSelectedTech("");
      setTechProfile(null);
      setLoadingProfile(false);
    }
  }, [showAssign]);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">📋 มอบหมายงานให้ช่าง</h1>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowCreateReport(true)}>
          <Plus className="mr-2 h-4 w-4" /> สร้างงานใหม่
        </Button>
      </div>

      <Card className="shadow-lg border">
        <CardHeader>
          <CardTitle>รายการแจ้งซ่อมที่รอดำเนินการ</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">คลิกที่แถวเพื่อ “มอบหมาย” หรือ “ดูความคืบหน้า” ตามสถานะ</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">กำลังโหลด...</p>
          ) : reports.length === 0 ? (
            <p className="text-muted-foreground">ไม่มีรายการแจ้งซ่อม</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">วันที่</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead>สถานที่/ลิฟต์</TableHead>
                  <TableHead>วันเริ่มงาน</TableHead>
                  <TableHead>มอบหมายโดย</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => {
                  const clickable = "hover:bg-muted/40 cursor-pointer";
                  return (
                    <TableRow
                      key={r.rp_id}
                      className={clickable}
                      onClick={() => handleRowClick(r)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleRowClick(r);
                        }
                      }}
                    >
                      <TableCell>{r.date_rp}</TableCell>
                      <TableCell className="max-w-[360px] truncate">{r.detail}</TableCell>
                      <TableCell>
                        <div className="font-medium">{r.org_name} / {r.building_name}</div>
                        <div className="text-sm text-muted-foreground">{r.lift_name}</div>
                      </TableCell>
                      <TableCell>{r.start_date || (<span className="text-muted-foreground">—</span>)}</TableCell>
                      <TableCell>{r.assigned_by || (<span className="text-muted-foreground">—</span>)}</TableCell>
                      <TableCell className="text-center">
                        {r.assigned_count > 0 ? (
                          <div className="flex flex-col items-center gap-1">
                            <Badge className="bg-emerald-100 text-emerald-700">มอบหมายแล้ว</Badge>
                            <div className="text-xs text-muted-foreground">{r.assigned_tech_name || r.technician_name || r.assigned_to || "—"}</div>
                          </div>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700">รอมอบหมาย</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog มอบหมาย */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden">
          <div className="p-5">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl">มอบหมายงานให้ช่าง</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">ตรวจสอบรายละเอียดงาน แล้วเลือกช่าง วันเริ่มงาน และคำสั่งเพิ่มเติมก่อนยืนยัน</DialogDescription>
            </DialogHeader>
            <Separator className="my-4" />

            {/* สรุป + เลือกช่าง */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-muted/50 rounded-md p-5 space-y-4">
                <div className="text-sm text-muted-foreground">รายละเอียดเคส</div>
                <div className="gap-3 text-sm">
                  <div>
                    <div className="text-[12px] text-muted-foreground">หัวข้อ/อาการ</div>
                    <div className="font-medium text-foreground">{selectedReport?.detail || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[12px] text-muted-foreground">วันที่แจ้ง</div>
                    <div className="font-medium">{selectedReport?.date_rp || "—"}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-[12px] text-muted-foreground">สถานที่</div>
                    <div className="font-medium">{selectedReport?.org_name} / {selectedReport?.building_name} • {selectedReport?.lift_name}</div>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-sm font-medium mb-1">เลือกช่าง</label>
                <Select value={selectedTech} onValueChange={(v) => { setSelectedTech(v); loadTechProfile(v); }}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="เลือกช่างที่เหมาะสม" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.first_name} {t.last_name} ({t.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedTech ? (
                  <Card className="border rounded-xl mt-4">
                    <CardContent className="p-4">
                      {loadingProfile ? (
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-14 w-14 rounded-full" />
                          <div className="space-y-2 w-full">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-3 w-full" />
                          </div>
                        </div>
                      ) : techProfile ? (
                        <div className="flex flex-col items-center gap-2 text-center">
                          <Avatar className="h-20 w-20">
                            <AvatarImage src={techProfile.avatar_url || ""} alt="avatar" />
                            <AvatarFallback>
                              {(techProfile.first_name?.[0] || "?") + (techProfile.last_name?.[0] || "")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-lg font-semibold">{techProfile.first_name} {techProfile.last_name}</div>
                            <div className="text-sm text-muted-foreground">
                              @{techProfile.username || "—"}
                              {techProfile.role ? (<span className="ml-2 text-xs font-medium text-muted-foreground">• {techProfile.role}</span>) : null}
                            </div>
                          </div>
                          <div className="mt-1">
                            <div className="text-xs text-muted-foreground">ภาระงานปัจจุบัน</div>
                            <div className="text-xl font-bold">{techProfile.current_tasks ?? 0}</div>
                            <div className="flex justify-center gap-x-3 text-xs text-muted-foreground">
                              {typeof techProfile.completed_month !== "undefined" && (<span>เสร็จเดือนนี้: {techProfile.completed_month}</span>)}
                              {typeof techProfile.rating !== "undefined" && (<span>เรตติ้ง: {techProfile.rating}★</span>)}
                            </div>
                          </div>
                          <div className="w-full pt-3 border-t">
                            <div className="mt-1 flex flex-wrap justify-center items-center gap-2 text-xs">
                              {techProfile.phone && (<Badge variant="secondary" className="rounded-full">📞 {techProfile.phone}</Badge>)}
                              {techProfile.email && (<Badge variant="secondary" className="rounded-full">✉️ {techProfile.email}</Badge>)}
                              {techProfile.service_area && (<Badge variant="secondary" className="rounded-full">📍 {techProfile.service_area}</Badge>)}
                            </div>
                            {Array.isArray(techProfile.skills) && techProfile.skills.length > 0 && (
                              <div className="mt-4">
                                <div className="text-xs text-muted-foreground mb-2">ความถนัด/ทักษะ</div>
                                <div className="flex flex-wrap justify-center gap-2">
                                  {techProfile.skills.map((s, i) => (<Badge key={i} variant="outline" className="rounded-full">{s}</Badge>))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">ไม่พบข้อมูลช่าง</div>
                      )}
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>

            {/* ฟอร์มอื่น ๆ */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">รายละเอียดงาน (Optional)</label>
                <Textarea value={taskDetail} onChange={(e) => setTaskDetail(e.target.value)} placeholder="สรุปสิ่งที่ต้องทำ/ข้อควรระวัง/ติดต่อประสาน" className="min-h-[88px]" />
                <p className="text-xs text-muted-foreground mt-1">ระบุให้ชัด เช่น “ตรวจเช็คบานประตู, เตรียมอะไหล่ X, พบ รปภ. ชั้น 1”</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">วันเริ่มงาน (กำหนด)</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">สถานะ</label>
                  <div className="flex items-center gap-2 text-sm">
                    {selectedReport?.assigned_count > 0 ? (
                      <>
                        <Badge className="bg-emerald-100 text-emerald-700">มอบหมายแล้ว</Badge>
                        <span className="text-muted-foreground">
                          {selectedReport?.assigned_tech_name || selectedReport?.technician_name || selectedReport?.assigned_to || "—"}
                        </span>
                      </>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700">รอมอบหมาย</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button onClick={handleAssign} className="w-full h-11 text-base">✅ ยืนยันการมอบหมาย</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* (คง Dialog รายละเอียดเดิมไว้) */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-[860px] p-0 overflow-hidden">
          <div className="p-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="text-lg font-semibold mb-3">รายละเอียดงาน</div>
                {detailReport ? (
                  <div className="space-y-4 text-sm">
                    <div>วันที่แจ้ง: <span className="font-bold">{detailReport.date_rp || "—"}</span></div>
                    <div>วันเริ่มงาน: <span className="font-bold">{detailReport.start_date || "—"}</span></div>
                    <div>สถานที่: <span className="font-bold">{detailReport.org_name || "—"} / {detailReport.building_name || "—"}</span></div>
                    <div className="rounded-md bg-muted p-3">ลิฟต์: {detailReport.lift_name || "—"}</div>
                    <div>
                      <div className="mb-1">รายละเอียดแจ้งซ่อม:</div>
                      <div className="rounded-md bg-muted p-3">{detailReport.detail || "—"}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">ไม่มีข้อมูล</div>
                )}
              </div>
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="text-lg font-semibold mb-3">การทำงาน</div>
                <div className="space-y-3 text-sm">
                  <Button variant="secondary" onClick={() => { setProgressReport(detailReport); setProgressOpen(true); }}>
                    ดูความคืบหน้า (Popup)
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-5"><Button onClick={() => setShowDetail(false)} className="w-full h-11">ปิด</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup ความคืบหน้า */}
      <ProgressDialog
        open={progressOpen}
        onOpenChange={setProgressOpen}
        report={progressReport}
        buildFullUrl={buildFullUrl}
      />

      {/* Dialog สร้างงานใหม่ */}
      <Dialog open={showCreateReport} onOpenChange={setShowCreateReport}>
        <DialogContent className="sm:max-w-[680px] p-0 overflow-hidden">
          <div className="p-5">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl">➕ สร้างงานใหม่ (Report)</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">กรอกข้อมูลให้ครบถ้วน ระบบจะเปิดหน้ามอบหมายงานให้อัตโนมัติหลังสร้างสำเร็จ</DialogDescription>
            </DialogHeader>
            <Separator className="my-4" />
            <CreateReportForm
              orgs={orgs}
              buildings={buildings}
              lifts={lifts}
              newRp={newRp}
              setNewRp={setNewRp}
              loadOrgs={loadOrgs}
            />
            <div className="mt-6">
              <Button className="w-full h-11 text-base" onClick={handleCreateReport}>📌 สร้าง Report</Button>
              <p className="text-xs text-muted-foreground mt-2">สร้างรายงานเสร็จ ระบบจะเปิดหน้ามอบหมายงานให้ทันที</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateReportForm({ orgs, buildings, lifts, newRp, setNewRp, loadOrgs }) {
  useEffect(() => { loadOrgs(); setNewRp((s) => ({ ...s, date_rp: s.date_rp || new Date().toISOString().slice(0,10) })); }, []);
  useEffect(() => { setNewRp((s) => ({ ...s, building_id: "", lift_id: "" })); /* eslint-disable-next-line */ }, [newRp.org_id]);
  useEffect(() => { setNewRp((s) => ({ ...s, lift_id: "" })); }, [newRp.building_id]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">วันที่แจ้ง</label>
        <Input type="date" value={newRp.date_rp} onChange={(e) => setNewRp({ ...newRp, date_rp: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">องค์กร</label>
        <Select value={newRp.org_id?.toString() || ""} onValueChange={(v) => setNewRp({ ...newRp, org_id: v })}>
          <SelectTrigger className="h-10"><SelectValue placeholder="เลือกองค์กร" /></SelectTrigger>
          <SelectContent>
            {orgs.map((o) => (<SelectItem key={o.id} value={o.id.toString()}>{o.org_name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">อาคาร</label>
        <Select value={newRp.building_id?.toString() || ""} onValueChange={(v) => setNewRp({ ...newRp, building_id: v })} disabled={!newRp.org_id}>
          <SelectTrigger className="h-10"><SelectValue placeholder="เลือกอาคาร" /></SelectTrigger>
          <SelectContent>
            {buildings.map((b) => (<SelectItem key={b.id} value={b.id.toString()}>{b.building_name}</SelectItem>))}
          </SelectContent>
        </Select>
        {!newRp.org_id && (<p className="text-xs text-muted-foreground mt-1">กรุณาเลือกองค์กรก่อน</p>)}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">ลิฟต์</label>
        <Select value={newRp.lift_id?.toString() || ""} onValueChange={(v) => setNewRp({ ...newRp, lift_id: v })} disabled={!newRp.building_id}>
          <SelectTrigger className="h-10"><SelectValue placeholder="เลือกลิฟต์" /></SelectTrigger>
          <SelectContent>
            {lifts.map((l) => (<SelectItem key={l.id} value={l.id.toString()}>{l.lift_name}</SelectItem>))}
          </SelectContent>
        </Select>
        {!newRp.building_id && (<p className="text-xs text-muted-foreground mt-1">กรุณาเลือกอาคารก่อน</p>)}
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium mb-1">รายละเอียด</label>
        <Textarea value={newRp.detail} onChange={(e) => setNewRp({ ...newRp, detail: e.target.value })} placeholder="เช่น ประตูไม่สนิท ชำรุดที่ชั้น 7 / มีเสียงดังตอนเปิด-ปิด" className="min-h-[96px]" />
      </div>
    </div>
  );
}

export default AdminAssignTask;
