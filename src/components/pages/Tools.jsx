// src/components/pages/Tools.jsx
import React, { useEffect, useRef, useState } from "react";
import { toolsService } from "@/services/toolsService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Loader2, PencilLine, Trash2, Upload, RefreshCcw, Image as ImageIcon, Coins } from "lucide-react";

// === NEW: base สำหรับประกอบ URL รูป ===
// ใส่ค่า VITE_FILES_BASE = http://<host>/smartlift-backend หากโฟลเดอร์ uploads อยู่ใต้ smartlift-backend
const API_BASE = (import.meta.env.VITE_REACT_APP_API_URL || "http://localhost").replace(/\/$/, "");
const FILES_BASE = (import.meta.env.VITE_FILES_BASE || API_BASE).replace(/\/$/, "");
const toImgUrl = (v) => {
  if (!v) return "";
  // ถ้าเป็น absolute / data / blob อยู่แล้วก็ใช้เลย
  if (/^(https?:)?\/\//.test(v) || v.startsWith("data:") || v.startsWith("blob:")) return v;
  // ต่อกับ FILES_BASE ให้เป็น URL เต็ม
  return `${FILES_BASE}${v.startsWith("/") ? "" : "/"}${v}`;
};

const THB = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });

const placeholderImg =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='100'>
      <rect width='100%' height='100%' fill='#f1f5f9'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#94a3b8' font-size='12'>No Image</text>
    </svg>`
  );

export default function Tools() {
  // list state
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [totalPage, setTotalPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState(null);

  // form state
  const [openForm, setOpenForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    tool_id: null,
    tool_name: "",
    cost: "",
    file: null,
    preview: "",
    currentImg: "",
  });

  const fetchData = async (opts = {}) => {
    try {
      setLoading(opts.silent ? false : true);
      setReloading(opts.silent ? true : false);
      setError(null);
      const res = await toolsService.list({ q, page, perPage });
      setItems(res.data || []);
      setTotalPage(res.pagination?.total_page || 1);
    } catch (e) {
      setError(e.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
      setReloading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [page, perPage]);

  const onSearch = (e) => {
    e.preventDefault?.();
    setPage(1);
    fetchData();
  };

  const resetForm = () => {
    setForm({
      tool_id: null,
      tool_name: "",
      cost: "",
      file: null,
      preview: "",
      currentImg: "",
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const openCreate = () => {
    resetForm();
    setOpenForm(true);
  };

  const openEdit = (row) => {
    setForm({
      tool_id: row.tool_id,
      tool_name: row.tool_name || "",
      cost: String(row.cost ?? ""),
      file: null,
      preview: "",
      // ใช้ URL เต็มสำหรับแสดงผล
      currentImg: toImgUrl(row.tool_img || ""),
    });
    if (fileRef.current) fileRef.current.value = "";
    setOpenForm(true);
  };

  const handleFile = (file) => {
    if (!file) {
      setForm((p) => ({ ...p, file: null, preview: "" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 5MB");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const ok = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type);
    if (!ok) {
      alert("รองรับเฉพาะไฟล์ภาพ jpg/png/gif/webp");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const url = URL.createObjectURL(file);
    setForm((p) => ({ ...p, file, preview: url }));
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    const name = form.tool_name.trim();
    const costNum = Number(form.cost);

    if (!name) return alert("กรุณากรอกชื่อเครื่องมือ");
    if (!Number.isFinite(costNum) || costNum < 0) return alert("กรุณากรอกราคาเป็นตัวเลข 0 ขึ้นไป");

    try {
      setSaving(true);
      if (form.tool_id) {
        await toolsService.update(form.tool_id, {
          tool_name: name,
          cost: costNum,
          file: form.file || undefined,
        });
      } else {
        await toolsService.create({
          tool_name: name,
          cost: costNum,
          file: form.file || undefined,
        });
      }
      setOpenForm(false);
      resetForm();
      await fetchData({ silent: true });
    } catch (e2) {
      alert(e2.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`ยืนยันลบ "${row.tool_name}" ?`)) return;
    try {
      await toolsService.remove(row.tool_id);
      await fetchData({ silent: true });
    } catch (e) {
      alert(e.message || "ลบไม่สำเร็จ");
    }
  };

  const headerRight = (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => fetchData({ silent: true })}>
        {reloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
        รีเฟรช
      </Button>
      <Button onClick={openCreate}>
        <Plus className="h-4 w-4 mr-2" /> เพิ่มเครื่องมือ
      </Button>
    </div>
  );

  return (
    <div className="w-full px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">เครื่องมือ (Tools)</h1>
        {headerRight}
      </div>

      {/* Search / Filters */}
      <Card className="mb-5">
        <CardContent className="pt-6">
          <form onSubmit={onSearch} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาชื่อเครื่องมือ…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="border rounded-md h-9 px-2 text-sm bg-white"
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                title="รายการต่อหน้า"
              >
                {[6, 12, 24, 48, 96].map((n) => (
                  <option key={n} value={n}>{n}/หน้า</option>
                ))}
              </select>
              <Button type="submit">ค้นหา</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>รายการเครื่องมือ</CardTitle>
            <Badge variant="outline">{items.length} รายการ</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-600">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              กำลังโหลด…
            </div>
          ) : error ? (
            <div className="text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-3">{error}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-slate-500">ไม่พบข้อมูล</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">รูป</TableHead>
                    <TableHead>ชื่อเครื่องมือ</TableHead>
                    <TableHead className="w-[160px]">ราคา</TableHead>
                    <TableHead className="text-right w-[120px]">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row) => (
                    <TableRow key={row.tool_id}>
                      <TableCell>
                        <img
                          // === ใช้ URL เต็ม ===
                          src={toImgUrl(row.tool_img) || placeholderImg}
                          alt={row.tool_name}
                          className="h-20 w-24 object-cover rounded-md border"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.src = placeholderImg; }}
                        />
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="font-semibold text-slate-900">{row.tool_name}</div>
                        <div className="text-xs text-slate-500">ID: {row.tool_id}</div>
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="inline-flex items-center gap-1">
                          <Coins className="h-4 w-4 text-amber-600" />
                          <span className="font-medium">{THB.format(row.cost || 0)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                            <PencilLine className="h-4 w-4 mr-1" />
                            แก้ไข
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => remove(row)}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            ลบ
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPage > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-500">หน้า <b>{page}</b> / {totalPage}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  ก่อนหน้า
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPage, p + 1))} disabled={page >= totalPage}>
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{form.tool_id ? "แก้ไขเครื่องมือ" : "เพิ่มเครื่องมือ"}</DialogTitle>
            <DialogDescription>ระบุรายละเอียดและอัปโหลดรูปภาพ</DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">

            {/* ➡️ Main Content Grid (Image & Fields) ⬅️ */}
            {/* ⚡️ เพิ่ม items-start เพื่อให้คอลัมน์ทั้งสองเริ่มต้นจากด้านบน ⚡️ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

              {/* 1. Upload / Preview (คอลัมน์ซ้าย) */}
              <div className="md:col-span-1">
                <Label className="mb-3 inline-block font-medium text-base">รูปภาพ</Label>

                {/* ปรับขนาดของ div รูปภาพให้ดูใกล้เคียงกับรูปตัวอย่าง */}
                <div className="border rounded-xl p-2 bg-slate-50/60 flex flex-col items-center">

                  {/* ส่วนแสดงรูปภาพ: ปรับความสูงให้สัมพันธ์กับ Field ด้านขวา */}
                  <img
                    // === ใช้ preview > รูปเดิม(แปลงแล้ว) > placeholder ===
                    src={form.preview || form.currentImg || placeholderImg}
                    alt="preview"
                    className="w-full h-[140px] object-cover rounded-md border bg-white"
                    onError={(e) => { e.currentTarget.src = placeholderImg; }}
                  />

                  {/* ปุ่มเลือกไฟล์ */}
                  <div className="mt-4 flex items-center gap-2 w-full">
                    <label className="flex-1">
                      <div className="h-9 border border-gray-300 rounded-md px-3 flex items-center gap-2 cursor-pointer bg-white hover:bg-slate-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                        <span className="text-sm">เลือกไฟล์</span>
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFile(e.target.files?.[0])}
                      />
                    </label>
                    {/* ปุ่มล้าง */}
                    {!!(form.preview || form.file) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (fileRef.current) fileRef.current.value = "";
                          setForm((p) => ({ ...p, file: null, preview: "" }));
                        }}
                      >
                        ล้าง
                      </Button>
                    )}
                  </div>

                  {/* ข้อความรองรับไฟล์ */}
                  <p className="text-[11px] text-slate-500 mt-2 w-full text-left">รองรับ: jpg/png/gif/webp ขนาดไม่เกิน 5MB</p>
                </div>
              </div>

              {/* 2. Fields (คอลัมน์ขวา) */}
              {/* ⚡️ ใช้ mt-6 เพื่อขยับช่องกรอกลงมาให้พอดีกับส่วนรูปภาพ ⚡️ */}
              <div className="md:col-span-2 flex flex-col gap-0 mt-15">

                {/* ช่องกรอก "ชื่อเครื่องมือ" */}
                <div className="mb-4">
                  <Label htmlFor="tool_name">ชื่อเครื่องมือ</Label>
                  <Input
                    id="tool_name"
                    value={form.tool_name}
                    onChange={(e) => setForm((p) => ({ ...p, tool_name: e.target.value }))}
                    placeholder="เช่น ประแจแหวน 14mm"
                    required
                  />
                </div>

                {/* ช่องกรอก "ราคา (บาท)" */}
                <div className="mb-15">
                  <Label htmlFor="cost">ราคา (บาท)</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={form.cost}
                    onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))}
                    placeholder="0"
                    required
                  />
                </div>

                {/* ข้อความสถานะ (ใช้รูปเดิม) */}
                {form.currentImg && !form.preview && (
                  <div className="text-xs text-slate-500 inline-flex items-center gap-1 mt-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19.14 6H4.86A.86.86 0 0 0 4 6.86v10.28A.86.86 0 0 0 4.86 18h14.28a.86.86 0 0 0 .86-.86V6.86A.86.86 0 0 0 19.14 6Z" /><circle cx="12" cy="12" r="3" /><path d="M15 15l2 2" /></svg>
                    ใช้รูปเดิมอยู่ — หากต้องการเปลี่ยน ให้เลือกรูปใหม่
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenForm(false)}>ยกเลิก</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {form.tool_id ? "บันทึกการแก้ไข" : "บันทึก"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
