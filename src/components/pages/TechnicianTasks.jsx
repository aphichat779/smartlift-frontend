// src/components/pages/TechnicianTasks.jsx
import React, { useEffect, useState } from "react";
import { technicianService } from "../../services/technicianService";

import { Button } from "@/components/ui/button";
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { IoMdRefreshCircle } from "react-icons/io";
import {
  ClipboardList,
  RefreshCcw,
  Wrench,
  CheckCircle2,
  Upload,
  Eye,
  Hammer,
  FlaskConical,
} from "lucide-react";

/* ---------- helpers: สถานะเป็นคำล้วน ---------- */
const allowed = ["assign", "preparing", "progress", "test", "complete"];
const normalizeStatus = (v) => (allowed.includes(String(v)) ? String(v) : "assign");

const labelOf = (st) => {
  const s = normalizeStatus(st);
  if (s === "assign") return "รอรับงาน";
  if (s === "preparing") return "เตรียมการ";
  if (s === "progress") return "กำลังดำเนินการ";
  if (s === "test") return "ทดสอบ";
  if (s === "complete") return "เสร็จสิ้น";
  return s;
};

const badgeClassOf = (st) => {
  const s = normalizeStatus(st);
  if (s === "assign") return "bg-amber-100 text-amber-700";
  if (s === "preparing") return "bg-purple-100 text-purple-700";
  if (s === "progress") return "bg-blue-100 text-blue-700";
  if (s === "test") return "bg-cyan-100 text-cyan-700";
  if (s === "complete") return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-700";
};

/* ---------- helpers: preview file ---------- */
const extOf = (name = "") => {
  try {
    const u = new URL(name, "http://x"); // safe fallback
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

/* ---------------- stepper (in-modal) ---------------- */
const steps = [
  { key: "assign", label: "assign" },
  { key: "preparing", label: "preparing" },
  { key: "progress", label: "progress" },
  { key: "test", label: "test" },
  { key: "complete", label: "complete" },
];
const stepIndex = (st) => {
  const idx = steps.findIndex((s) => s.key === normalizeStatus(st));
  return idx < 0 ? 0 : idx;
};

const Stepper = ({ current }) => {
  const idx = stepIndex(current);
  return (
    <div className="flex items-center gap-3 py-3 px-10 rounded-md bg-slate-800 text-white">
      {steps.map((step, i) => {
        const done = i <= idx;
        return (
          <div key={step.key} className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${done ? "bg-emerald-500" : "bg-slate-500"}`}
              title={step.label}
            >
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

/* --------- FilePreviewDialog --------- */
function FilePreviewDialog({ open, onOpenChange, url, name }) {
  const ext = extOf(name || url);
  const downloadable = (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="underline text-indigo-600"
    >
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
          {/* Image */}
          {isImageExt(ext) && (
            <div className="rounded-lg border overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={name || "attachment"} className="max-h-[70vh] object-contain w-full" />
            </div>
          )}

          {/* PDF */}
          {isPdfExt(ext) && (
            <div className="rounded-lg border overflow-hidden">
              <iframe
                title={name || "PDF"}
                src={url}
                className="w-full h-[70vh]"
              />
            </div>
          )}

          {/* Video */}
          {isVideoExt(ext) && (
            <div className="rounded-lg border overflow-hidden">
              <video src={url} controls className="w-full max-h-[70vh]" />
            </div>
          )}

          {/* Audio */}
          {isAudioExt(ext) && (
            <div className="rounded-lg border p-6 flex items-center justify-center">
              <audio src={url} controls className="w-full" />
            </div>
          )}

          {/* Unknown */}
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
          <Button variant="secondary" onClick={() => onOpenChange(false)}>ปิด</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- component ---------------- */
export default function TechnicianTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // modal state
  const [open, setOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  // detail/timeline
  const [info, setInfo] = useState(null);
  const [history, setHistory] = useState([]);

  // form state
  const [detail, setDetail] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // เลือกสถานะที่จะอัปเดต (ค่าเริ่มต้น)
  const [nextStatus, setNextStatus] = useState("progress");

  // preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewName, setPreviewName] = useState("");

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

  // helper: ดึง timeline จาก response รูปแบบต่าง ๆ
  const extractTimeline = (d) => {
    if (!d) return [];
    if (Array.isArray(d.data)) return d.data; // data เป็น array ตรง ๆ
    if (Array.isArray(d.timeline)) return d.timeline;
    if (Array.isArray(d.history)) return d.history;
    if (Array.isArray(d?.data?.timeline)) return d.data.timeline;
    if (Array.isArray(d?.data?.history)) return d.data.history;
    return [];
  };

  // เปิด modal + โหลด detail/history
  const openModalFor = async (row) => {
    const cur = normalizeStatus(row?.tk_status || row?.tk_status_text);
    // กำหนด next ตามลำดับขั้น
    let next = "preparing";
    if (cur === "assign") next = "preparing";
    else if (cur === "preparing") next = "progress";
    else if (cur === "progress") next = "test";
    else if (cur === "test") next = "complete";
    else next = cur;

    setOpen(true);
    setActiveTask({ ...row, tk_status: cur });
    setInfo(null);
    setHistory([]);
    setDetail("");
    setFile(null);
    setNextStatus(next);

    // โหลด detail + timeline
    try {
      const d = await technicianService.detail(row.tk_id);
      if (d?.success) {
        const task = d.data?.task ?? d.task ?? null;
        setInfo(task);
        setHistory(extractTimeline(d));
      }
    } catch (e) {
      console.error("detail error:", e);
    }
  };

  // รับงาน → อัปเดตเป็น preparing ทันที แล้วเปิดโมดัล
  const handleAcceptAndOpen = async (row) => {
    try {
      const res = await technicianService.updateStatus({
        tk_id: row.tk_id,
        tk_status: "preparing",
        detail: "Technician accepted → preparing.",
      });
      if (!res?.success) {
        alert(res?.message || "รับงานไม่สำเร็จ");
        return;
      }
      await fetchTasks();
      openModalFor({ ...row, tk_status: "preparing", tk_status_text: "preparing" });
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการรับงาน");
    }
  };

  const handleOpenUpdate = (row) => openModalFor(row);

  // อัปเดตสถานะหลัก
  const submitUpdate = async () => {
    if (!activeTask) return;
    try {
      setSaving(true);
      const res = await technicianService.updateStatus({
        tk_id: activeTask.tk_id,
        tk_status: normalizeStatus(nextStatus),
        detail: detail || "",
        file: file || undefined,
      });
      if (res?.success) {
        setOpen(false);
        await fetchTasks();
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

  // เพิ่มบันทึกความคืบหน้า (ไม่เปลี่ยนสถานะ)
  const submitNoteOnly = async () => {
    if (!activeTask) return;
    if (!detail && !file) {
      alert("กรุณากรอกรายละเอียดหรือแนบไฟล์อย่างน้อย 1 อย่าง");
      return;
    }
    try {
      setSaving(true);
      const res = await technicianService.addProgress({
        tk_id: activeTask.tk_id,
        detail: detail || "",
        section: "progress",
        file: file || undefined,
      });
      if (res?.success) {
        // โหลด timeline ใหม่
        try {
          const d = await technicianService.detail(activeTask.tk_id);
          if (d?.success) setHistory(extractTimeline(d));
        } catch {}
        setDetail("");
        setFile(null);
        await fetchTasks();
        setOpen(false);
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

  // ⭐ ปุ่ม “บันทึก” เดียว — ตัดสินใจอัตโนมัติ
  const currentStatus = normalizeStatus(activeTask?.tk_status || activeTask?.tk_status_text);
  const isStatusChange = normalizeStatus(nextStatus) !== currentStatus;
  const handleSave = async () => {
    if (!activeTask) return;
    const next = normalizeStatus(nextStatus);
    // ถ้าเลือกสถานะเดิม ⇒ บันทึกความคืบหน้า (ต้องมี detail หรือไฟล์)
    if (next === currentStatus) {
      if (!detail && !file) {
        alert("กรุณากรอกรายละเอียดหรือแนบไฟล์อย่างน้อย 1 อย่าง");
        return;
      }
      await submitNoteOnly();
    } else {
      await submitUpdate();
    }
  };

  const buildFullUrl = (raw = "") => {
    if (!raw) return "";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    const base = import.meta.env.VITE_REACT_APP_API_URL || "";
    return base + raw;
  };

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
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ⚠️ {apiError}
        </div>
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
            <div className="rounded-md border border-dashed p-6 text-center text-gray-500">
              ไม่มีงานที่ได้รับ
            </div>
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
                      const isUpdating = ["preparing", "progress", "test"].includes(st);
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
                                <Button
                                  size="sm"
                                  className="bg-blue-600 text-white hover:bg-blue-700"
                                  onClick={() => handleAcceptAndOpen(t)}
                                >
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
                    const isUpdating = ["preparing", "progress", "test"].includes(st);
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
                              <Button
                                size="sm"
                                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                                onClick={() => handleAcceptAndOpen(t)}
                              >
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
            <DialogDescription>อัปเดตสถานะงาน แนบรูป/ไฟล์ และบันทึกความคืบหน้า</DialogDescription>
          </DialogHeader>

          <Stepper current={activeTask?.tk_status || activeTask?.tk_status_text || "assign"} />

          <div className="grid md:grid-cols-2 gap-4 mt-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">รายละเอียดงาน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div>วันที่แจ้ง: <b>{info?.date_rp || activeTask?.date_rp || "-"}</b></div>
                <div>องค์กร: <b>{info?.org_name || activeTask?.org_name || "-"}</b></div>
                <div>อาคาร: <b>{info?.building_name || activeTask?.building_name || "-"}</b></div>
                <div>ลิฟต์: <b>{info?.lift_name || activeTask?.lift_name || activeTask?.lift_id || "-"}</b></div>
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
                        const fileUrlRaw = h.file_url || h.tk_status_tool || "";
                        const hasFile = typeof fileUrlRaw === "string" && fileUrlRaw.length > 0;
                        const fullUrl = buildFullUrl(fileUrlRaw);

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
                                onClick={() => openPreview(fullUrl, h.file_name || h.filename || h.name || "")}
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

          {/* ฟอร์มอัปเดต */}
          <div className="mt-0">
            <div className="text-sm font-semibold mb-2">อัปเดตความคืบหน้า</div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={nextStatus === "preparing" ? "default" : "outline"}
                  onClick={() => setNextStatus("preparing")}
                  className="gap-1"
                >
                  <Hammer className="w-4 h-4" /> preparing
                </Button>
                <Button
                  variant={nextStatus === "progress" ? "default" : "outline"}
                  onClick={() => setNextStatus("progress")}
                  className="gap-1"
                >
                  <Wrench className="w-4 h-4" /> progress
                </Button>
                <Button
                  variant={nextStatus === "test" ? "default" : "outline"}
                  onClick={() => setNextStatus("test")}
                  className="gap-1"
                >
                  <FlaskConical className="w-4 h-4" /> test
                </Button>
                <Button
                  onClick={() => setNextStatus("complete")}
                  className={`gap-1 ${nextStatus === "complete" ? "" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
                >
                  <CheckCircle2 className="w-4 h-4" /> ปิดงาน (complete)
                </Button>
              </div>

              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <Textarea
              className="mt-3"
              placeholder="ใส่รายละเอียดที่ดำเนินการ..."
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
            />
          </div>

          <DialogFooter className="mt-0 flex flex-wrap gap-2">
            <div className="flex-1" />
            <Button onClick={handleSave} disabled={saving} className="min-w-[180px]">
              {saving ? "กำลังบันทึก..." : (isStatusChange ? "บันทึกอัปเดตสถานะ" : "บันทึกความคืบหน้า")}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------ Modal (Preview) ------------ */}
      <FilePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        url={previewUrl}
        name={previewName}
      />
    </div>
  );
}
