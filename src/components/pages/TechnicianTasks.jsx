// src/components/pages/TechnicianTasks.jsx
import React, { useEffect, useMemo, useState } from "react";
import { technicianService } from "../../services/technicianService";
import { toolsService } from "@/services/toolsService";

import { Button } from "@/components/ui/button";
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

import { IoMdRefreshCircle } from "react-icons/io";
import { ClipboardList, Wrench, Upload, Eye, Plus, Minus, Coins, Search, X } from "lucide-react";

/* ---------- helpers: สถานะ ---------- */
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

const badgeClassOf = (st) => {
  const s = normalizeStatus(st);
  if (s === "assign") return "bg-amber-100 text-amber-700";
  if (s === "preparing") return "bg-purple-100 text-purple-700";
  if (s === "progress") return "bg-blue-100 text-blue-700";
  if (s === "complete") return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-700";
};

const THB = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });

/* ---------- preview helpers ---------- */
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

/* ---------- Stepper ---------- */
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

/* ---------- Dialog พรีวิวไฟล์ ---------- */
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

          <div className="mt-3 text-xs text-gray-500">ถ้าไฟล์ไม่แสดง อาจถูกบล็อกโดย CORS/Content-Type ให้เปิดด้วยลิงก์: {downloadable}</div>
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

/* ---------- เลือกเครื่องมือ ---------- */
function ToolsPickerDialog({ open, onOpenChange, initial = [], onConfirm }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [page] = useState(1);
  const [perPage] = useState(50);
  const [items, setItems] = useState([]);

  const [picked, setPicked] = useState(() => {
    const m = {};
    (initial || []).forEach((t) => (m[t.tool_id] = { ...t }));
    return m;
  });

  const fetchTools = async () => {
    try {
      setLoading(true);
      const res = await toolsService.list({ q, page, perPage });
      setItems(res?.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchTools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const add = (row) =>
    setPicked((p) => {
      const cur = p[row.tool_id];
      const qty = Math.min(999, (cur?.qty || 0) + 1);
      return {
        ...p,
        [row.tool_id]: {
          tool_id: row.tool_id,
          tool_name: row.tool_name,
          cost: Number(row.cost || 0),
          qty,
          tool_img: row.tool_img || "",
        },
      };
    });

  const inc = (id) => setPicked((p) => ({ ...p, [id]: { ...p[id], qty: Math.min(999, (p[id]?.qty || 1) + 1) } }));
  const dec = (id) =>
    setPicked((p) => {
      const qty = Math.max(1, (p[id]?.qty || 1) - 1);
      return { ...p, [id]: { ...p[id], qty } };
    });
  const rm = (id) =>
    setPicked((p) => {
      const { [id]: _, ...rest } = p;
      return rest;
    });

  const pickedList = useMemo(() => Object.values(picked), [picked]);
  const total = useMemo(() => pickedList.reduce((s, t) => s + Number(t.cost || 0) * Number(t.qty || 0), 0), [pickedList]);

  const baseUrl = (import.meta.env.VITE_REACT_APP_API_URL || "").replace(/\/$/, "");
  const buildImg = (raw) => {
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return `${baseUrl}${raw.startsWith("/") ? "" : "/"}${raw}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>เลือกเครื่องมือที่ใช้</DialogTitle>
          <DialogDescription>ค้นหาแล้วกดปุ่มบวกเพื่อเพิ่ม</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาเครื่องมือ…"
              className="pl-10"
              onKeyDown={(e) => e.key === "Enter" && fetchTools()}
            />
          </div>
          <Button variant="outline" onClick={fetchTools}>
            ค้นหา
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">รายการเครื่องมือ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="text-sm text-gray-500">กำลังโหลด…</div>
              ) : (items || []).length === 0 ? (
                <div className="text-sm text-gray-500">ไม่พบรายการ</div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {items.map((it) => (
                    <div key={it.tool_id} className="flex items-center gap-3 p-2 rounded-lg border hover:bg-slate-50">
                      <img src={buildImg(it.tool_img)} className="h-12 w-16 object-cover rounded border bg-white" alt={it.tool_name} />
                      <div className="flex-1">
                        <div className="font-medium">{it.tool_name}</div>
                        <div className="text-xs text-slate-500">{THB.format(Number(it.cost || 0))}</div>
                      </div>
                      <Button size="icon" onClick={() => add(it)} title="เพิ่ม">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">เครื่องมือที่เลือก</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pickedList.length === 0 ? (
                <div className="text-sm text-slate-500">ยังไม่ได้เลือก</div>
              ) : (
                <>
                  <div className="space-y-2">
                    {pickedList.map((t) => (
                      <div key={t.tool_id} className="flex items-center gap-2 p-2 rounded border bg-white">
                        <div className="flex-1">
                          <div className="font-medium">{t.tool_name}</div>
                          <div className="text-xs text-slate-500">{THB.format(Number(t.cost || 0))}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" onClick={() => dec(t.tool_id)} title="ลดจำนวน">
                            <Minus className="h-4 w-4" />
                          </Button>
                          <div className="w-10 text-center">{t.qty}</div>
                          <Button variant="outline" size="icon" onClick={() => inc(t.tool_id)} title="เพิ่มจำนวน">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => rm(t.tool_id)} title="เอาออก">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm text-slate-600">รวม</div>
                    <div className="font-semibold">{THB.format(total)}</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button
            onClick={() => {
              onConfirm(pickedList, total);
              onOpenChange(false);
            }}
          >
            ยืนยันการเลือก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- component หลัก ---------------- */
export default function TechnicianTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [open, setOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  const [info, setInfo] = useState(null);
  const [history, setHistory] = useState([]);

  const [detail, setDetail] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // โหมดปุ่ม: note (บันทึกความคืบหน้า) / update (อัปเดตสถานะ)
  const [mode, setMode] = useState("null");

  // nextStatus ใช้ตอนอัปเดตสถานะ (เลื่อนไปขั้นถัดไปอัตโนมัติ)
  const [nextStatus, setNextStatus] = useState("progress");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewName, setPreviewName] = useState("");

  const [toolsOpen, setToolsOpen] = useState(false);
  const [toolsPicked, setToolsPicked] = useState([]);
  const toolsTotal = useMemo(() => toolsPicked.reduce((s, t) => s + Number(t.cost || 0) * Number(t.qty || 0), 0), [toolsPicked]);

  const [closeAfterSave, setCloseAfterSave] = useState(false);

  // ทำให้ URL ไฟล์เต็มเสมอ
  const buildFullUrl = (raw = "") => {
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    const envBase = (import.meta.env.VITE_REACT_APP_API_URL || "").replace(/\/$/, "");
    const guessBase = window.location.origin.replace(/\/$/, "");
    const base = envBase || guessBase;
    return `${base}${raw.startsWith("/") ? "" : "/"}${raw}`;
  };

  const openPreview = (url, name) => {
    setPreviewUrl(url);
    setPreviewName(name || "");
    setPreviewOpen(true);
  };

  const fetchTasks = async () => {
    try {
      setApiError("");
      setLoading(true);
      const res = await technicianService.list();
      setTasks(res?.success ? res.data || [] : []);
      if (!res?.success) setApiError(res?.message || "Fetch failed");
    } catch (err) {
      setApiError(err?.message || "Network error");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const openModalFor = async (row) => {
    const cur = normalizeStatus(row?.tk_status || row?.tk_status_text);
    let next = "preparing";
    if (cur === "assign") next = "preparing";
    else if (cur === "preparing") next = "progress";
    else if (cur === "progress") next = "complete";
    else next = cur;

    setOpen(true);
    setActiveTask({ ...row, tk_status: cur });
    setInfo(null);
    setHistory([]);
    setDetail("");
    setFile(null);
    setNextStatus(next);
    setMode(cur === "assign" ? "update" : "note"); // assign เริ่มที่ update
    setToolsPicked([]);

    try {
      const d = await technicianService.detail(row.tk_id);
      if (d?.success) {
        const taskData = d.data || null;
        setInfo(taskData);
        setHistory(d?.data?.history || []);
        if (taskData) setToolsPicked(taskData.tools || []);
      }
    } catch (e) {
      console.error("detail error:", e);
    }
  };

  const handleAcceptAndOpen = async (row) => {
    setOpen(true);
    setActiveTask({ ...row, tk_status: "assign" });
    setInfo(null);
    setHistory([]);
    setDetail("");
    setFile(null);
    setNextStatus("preparing");
    setMode("update");
    setToolsPicked([]);
    try {
      const d = await technicianService.detail(row.tk_id);
      if (d?.success) {
        setInfo(d.data || null);
        setHistory(d?.data?.history || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenUpdate = (row) => openModalFor(row);

  // --- update status ---
  const submitUpdate = async () => {
    if (!activeTask) return;
    try {
      setSaving(true);

      const payload = {
        tk_id: activeTask.tk_id,
        tk_status: normalizeStatus(nextStatus),
        detail: detail || "",
      };
      if (file) payload.file = file;
      if (toolsPicked.length > 0) payload.tools = JSON.stringify(toolsPicked);

      const res = await technicianService.updateStatus(payload);
      if (res?.success) {
        await fetchTasks();
        try {
          const d = await technicianService.detail(activeTask.tk_id);
          if (d?.success) {
            setHistory(d?.data?.history || []);
            setInfo(d.data || null);
          }
        } catch {}
        setActiveTask((prev) => (prev ? { ...prev, tk_status: normalizeStatus(nextStatus) } : prev));
        setDetail("");
        setFile(null);
        setToolsPicked([]);
        if (closeAfterSave) setOpen(false);
      } else {
        alert(res?.message || "อัปเดตไม่สำเร็จ");
      }
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการอัปเดต");
    } finally {
      setSaving(false);
    }
  };

  // --- add progress/note ---
  const submitNoteOnly = async () => {
    if (!activeTask) return;
    if (!detail && !file && toolsPicked.length === 0) {
      alert("กรุณากรอกรายละเอียด แนบไฟล์ หรือเลือกเครื่องมืออย่างน้อย 1 อย่าง");
      return;
    }
    try {
      setSaving(true);

      const payload = {
        tk_id: activeTask.tk_id,
        detail: detail || "",
        section: "progress",
      };
      if (file) payload.file = file;
      if (toolsPicked.length > 0) payload.tools = JSON.stringify(toolsPicked);

      const res = await technicianService.addProgress(payload);
      if (res?.success) {
        try {
          const d = await technicianService.detail(activeTask.tk_id);
          if (d?.success) {
            setHistory(d?.data?.history || []);
            setInfo(d.data || null);
          }
        } catch {}
        setDetail("");
        setFile(null);
        setToolsPicked([]);
        await fetchTasks();
        if (closeAfterSave) setOpen(false);
      } else {
        alert(res?.message || "บันทึกไม่สำเร็จ");
      }
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const currentStatus = normalizeStatus(activeTask?.tk_status || activeTask?.tk_status_text);
  const showNoteButton = currentStatus !== "assign"; // ซ่อน “บันทึกความคืบหน้า” เมื่อ assign

  const incQty = (id) =>
    setToolsPicked((list) => list.map((t) => (t.tool_id === id ? { ...t, qty: Math.min(999, (t.qty || 1) + 1) } : t)));
  const decQty = (id) =>
    setToolsPicked((list) => list.map((t) => (t.tool_id === id ? { ...t, qty: Math.max(1, (t.qty || 1) - 1) } : t)));
  const removeTool = (id) => setToolsPicked((list) => list.filter((t) => t.tool_id !== id));

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-indigo-600" />
          งานที่ได้รับมอบหมาย
        </h1>
        <Button variant="outline" onClick={fetchTasks} disabled={loading} className="gap-2">
          {loading && <IoMdRefreshCircle className="h-4 w-4 animate-spin" />}
          รีเฟรช
        </Button>
      </div>

      {apiError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">⚠️ {apiError}</div>
      )}

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700">รายการงาน</CardTitle>
            <div className="text-xs text-gray-500">ทั้งหมด {tasks.length} งาน</div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500">กำลังโหลด...</p>
          ) : tasks.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-gray-500">ไม่มีงานที่ได้รับ</div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[110px]">วันที่</TableHead>
                      <TableHead>รายละเอียดแจ้งซ่อม</TableHead>
                      <TableHead>องค์กร / อาคาร</TableHead>
                      <TableHead>ลิฟต์</TableHead>
                      <TableHead className="text-center">สถานะ</TableHead>
                      <TableHead className="text-center w-[260px]">การดำเนินงาน</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((t) => {
                      const st = normalizeStatus(t.tk_status || t.tk_status_text);
                      const isAssign = st === "assign";
                      const isUpdating = ["preparing", "progress"].includes(st);
                      const isDone = st === "complete";
                      return (
                        <TableRow key={t.tk_id}>
                          <TableCell>{t.date_rp || "-"}</TableCell>
                          <TableCell className="max-w-[420px] truncate" title={t.report_detail || t.tk_data}>
                            {t.report_detail || t.tk_data || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{t.org_name || "-"}</div>
                            <div className="text-xs text-muted-foreground">{t.building_name || "-"}</div>
                          </TableCell>
                          <TableCell>{t.lift_name || t.lift_id || "-"}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={badgeClassOf(st)}>{labelOf(st)}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-2 justify-center">
                              {isAssign && (
                                <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => handleAcceptAndOpen(t)}>
                                  <Wrench className="w-4 h-4 mr-1" />
                                  รับงาน
                                </Button>
                              )}
                              {isUpdating && (
                                <Button size="sm" variant="secondary" onClick={() => handleOpenUpdate(t)}>
                                  <Eye className="w-4 h-4 mr-1" />
                                  อัปเดต
                                </Button>
                              )}
                              {isDone && <span className="text-sm text-muted-foreground">-</span>}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile */}
              <div className="block md:hidden">
                <div className="space-y-4">
                  {tasks.map((t) => {
                    const st = normalizeStatus(t.tk_status || t.tk_status_text);
                    const isAssign = st === "assign";
                    const isUpdating = ["preparing", "progress"].includes(st);
                    const isDone = st === "complete";
                    return (
                      <Card key={t.tk_id}>
                        <CardHeader className="p-4 flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-base font-semibold text-gray-700">TASK: {t.tk_id}</CardTitle>
                            <div className="text-sm text-gray-500">{t.date_rp || "-"}</div>
                          </div>
                          <Badge className={badgeClassOf(st)}>{labelOf(st)}</Badge>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="space-y-2 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">องค์กร:</span> {t.org_name || "-"}
                            </div>
                            <div>
                              <span className="font-medium">อาคาร:</span> {t.building_name || "-"}
                            </div>
                            <div>
                              <span className="font-medium">ลิฟต์:</span> {t.lift_name || t.lift_id || "-"}
                            </div>
                            <div className="whitespace-pre-wrap">
                              <span className="font-medium">รายละเอียด:</span> {t.report_detail || t.tk_data || "-"}
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            {isAssign && (
                              <Button size="sm" className="flex-1 bg-blue-600 text-white hover:bg-blue-700" onClick={() => handleAcceptAndOpen(t)}>
                                <Wrench className="w-4 h-4 mr-1" />
                                รับงาน
                              </Button>
                            )}
                            {isUpdating && (
                              <Button size="sm" variant="secondary" className="flex-1" onClick={() => handleOpenUpdate(t)}>
                                <Eye className="w-4 h-4 mr-1" />
                                อัปเดต
                              </Button>
                            )}
                            {isDone && <span className="text-sm text-muted-foreground">-</span>}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ------------ Modal (Update) ------------ */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="md:max-w-3xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>อัปเดตงาน • TASK: {activeTask?.tk_id}</DialogTitle>
            <DialogDescription>อัปเดตสถานะงาน แนบรูป/ไฟล์ เลือกเครื่องมือ และบันทึกความคืบหน้า</DialogDescription>
          </DialogHeader>

          <Stepper current={activeTask?.tk_status || activeTask?.tk_status_text || "assign"} />

          <div className="grid md:grid-cols-2 gap-4 mt-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">รายละเอียดงาน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div>
                  วันที่แจ้ง: <b>{info?.date_rp || activeTask?.date_rp || "-"}</b>
                </div>
                <div>
                  องค์กร: <b>{info?.org_name || activeTask?.org_name || "-"}</b>
                </div>
                <div>
                  อาคาร: <b>{info?.building_name || activeTask?.building_name || "-"}</b>
                </div>
                <div>
                  ลิฟต์: <b>{info?.lift_name || activeTask?.lift_name || activeTask?.lift_id || "-"}</b>
                </div>
                {info?.start_date && <div>วันเริ่มงาน: <b>{info.start_date}</b></div>}
                {info?.expected_end_date && <div>วันคาดว่าจะเสร็จ: <b>{info.expected_end_date}</b></div>}
                <div className="pt-2">รายละเอียดแจ้งซ่อม:</div>
                <div className="bg-gray-50 rounded p-2 text-gray-700 whitespace-pre-wrap">
                  {info?.report_detail || activeTask?.report_detail || activeTask?.tk_data || "-"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-sm">ไทม์ไลน์</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[240px] overflow-auto pr-1">
                  {history?.length ? (
                    <ul className="space-y-2">
                      {history.map((h, i) => {
                        // ✅ ใช้ tk_img เป็นหลัก (รองรับของเก่า file_url)
                        const fileUrlRaw = h.tk_img || h.file_url || "";
                        const hasFile = typeof fileUrlRaw === "string" && fileUrlRaw.length > 0;
                        const fullUrl = buildFullUrl(fileUrlRaw);
                        const fileName = h.file_name || (fileUrlRaw ? fileUrlRaw.split("/").pop() : "");
                        return (
                          <li key={h.tk_status_id || `${h.time}-${h.status}-${i}`} className="rounded border p-3">
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                              <span>{h.time}</span>
                              <span>•</span>
                              <span className="font-medium">{h.status}</span>
                            </div>
                            <div className="text-sm whitespace-pre-wrap">{h.detail || "-"}</div>
                            {hasFile && (
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-xs text-indigo-600 mt-2 underline"
                                onClick={() => openPreview(fullUrl, fileName)}
                              >
                                <Upload className="w-4 h-4" /> ไฟล์แนบ (พรีวิว)
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-500">ยังไม่มีข้อมูล</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-0 space-y-3">
            <div className="text-sm font-semibold">อัปเดตความคืบหน้า</div>

            {/* ปุ่มเลือกโหมด */}
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex flex-wrap gap-2">
                {currentStatus !== "assign" && (
                  <Button
                    onClick={() => setMode("note")}
                    className={`gap-2 px-5 py-2 rounded-lg font-medium border ${
                      mode === "note"
                        ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                        : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    }`}
                  >
                    📝 บันทึกความคืบหน้า
                  </Button>
                )}
                <Button
                  onClick={() => setMode("update")}
                  className={`gap-2 px-5 py-2 rounded-lg font-medium border ${
                    mode === "update"
                      ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                      : "bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  ⚙️ อัปเดตสถานะ
                </Button>
              </div>

              {/* แนบไฟล์ */}
              <Input
                type="file"
                accept="image/*,application/pdf,video/*,audio/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <Textarea placeholder="ใส่รายละเอียดที่ดำเนินการ..." value={detail} onChange={(e) => setDetail(e.target.value)} />

            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">เครื่องมือที่ใช้</div>
                <Button size="sm" onClick={() => setToolsOpen(true)} className="gap-1">
                  <Plus className="h-4 w-4" />
                  เพิ่มเครื่องมือ
                </Button>
              </div>
              {toolsPicked.length === 0 ? (
                <div className="text-sm text-slate-500">ยังไม่ได้เลือกเครื่องมือ</div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ชื่อเครื่องมือ</TableHead>
                        <TableHead className="w-[140px] text-center">จำนวน</TableHead>
                        <TableHead className="w-[140px]">ราคา</TableHead>
                        <TableHead className="w-[60px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {toolsPicked.map((t) => (
                        <TableRow key={t.tool_id}>
                          <TableCell className="font-medium">{t.tool_name}</TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center gap-1">
                              <Button variant="outline" size="icon" onClick={() => decQty(t.tool_id)}>
                                <Minus className="h-4 w-4" />
                              </Button>
                              <div className="w-10 text-center">{t.qty}</div>
                              <Button variant="outline" size="icon" onClick={() => incQty(t.tool_id)}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{THB.format(Number(t.cost || 0))}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => removeTool(t.tool_id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={2} className="text-right font-semibold">
                          รวม
                        </TableCell>
                        <TableCell colSpan={2} className="font-bold">
                          <span className="inline-flex items-center gap-1">
                            <Coins className="h-4 w-4 text-amber-600" />
                            {THB.format(toolsTotal)}
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-0 flex flex-wrap gap-2 items-center">
            <div className="flex-1" />
            <label className="flex items-center gap-2 text-sm text-slate-600 mr-3">
              <Checkbox checked={closeAfterSave} onCheckedChange={(v) => setCloseAfterSave(!!v)} />
              ปิดหน้าต่างหลังบันทึก
            </label>
            <Button
              onClick={() => {
                if (mode === "note") submitNoteOnly();
                else if (mode === "update") submitUpdate();
              }}
              disabled={saving}
              className="min-w-[180px]"
            >
              {saving ? "กำลังบันทึก..." : mode === "note" ? "บันทึกความคืบหน้า" : "อัปเดตสถานะ"}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FilePreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} url={previewUrl} name={previewName} />

      <ToolsPickerDialog open={toolsOpen} onOpenChange={setToolsOpen} initial={toolsPicked} onConfirm={(list) => setToolsPicked(list)} />
    </div>
  );
}
