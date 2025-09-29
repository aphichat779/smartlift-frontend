// src/components/pages/Reports.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { PiElevatorLight } from "react-icons/pi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle, Wrench, Search, Plus, Save, X, PencilLine, Trash2, Loader2, Building,
  CheckCircle2
} from 'lucide-react';

const todayStr = () => new Date().toISOString().slice(0, 10);
const BASE = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost';

const STATUS_ORDER = ['assign','preparing','progress','test','complete'];
const statusIndex = (s) => Math.max(0, STATUS_ORDER.indexOf((s||'').toLowerCase()));

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // filters
  const [q, setQ] = useState('');
  const [urgency, setUrgency] = useState('all'); // all|low|medium|high
  const [status, setStatus] = useState('all');   // all|open|inprogress|closed

  // options
  const [orgs, setOrgs] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [lifts, setLifts] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingLifts, setLoadingLifts] = useState(false);

  // form
  const [openForm, setOpenForm] = useState(false);
  const [formData, setFormData] = useState({
    rp_id: null,
    org_id: '',
    building_id: '',
    lift_id: '',
    detail: '',
    date_rp: todayStr(),
  });

  // progress dialog
  const [openProgress, setOpenProgress] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState(null);
  const [progressTask, setProgressTask] = useState(null);       // task row
  const [progressTimeline, setProgressTimeline] = useState([]); // task_status[]

  const quickIssues = [
    'ลิฟต์ค้างระหว่างชั้น',
    'ประตูลิฟต์ปิดไม่สนิท',
    'มีเสียงดังผิดปกติระหว่างวิ่ง',
    'ปุ่มกดภายในไม่ทำงาน',
    'ไฟชั้นแสดงผลผิดพลาด',
    'ระบบ Overload แจ้งเตือนผิดปกติ',
  ];

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getReports();
      if (response.success) setReports(response.data || []);
      else setError(response.message || 'Failed to fetch reports.');
    } catch (err) {
      setError(err.message || 'Failed to fetch reports.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- options loaders ----------
  const loadOrgs = async () => {
    try {
      setLoadingOrgs(true);
      const res = await fetch(`${BASE}/api/work/reports.php?options=1&type=orgs`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` }
      });
      const json = await res.json();
      if (json.success) setOrgs(json.data.orgs || []);
    } finally { setLoadingOrgs(false); }
  };

  const loadBuildings = async (org_id) => {
    if (!org_id) { setBuildings([]); return; }
    try {
      setLoadingBuildings(true);
      const res = await fetch(`${BASE}/api/work/reports.php?options=1&type=buildings&org_id=${org_id}`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` }
      });
      const json = await res.json();
      if (json.success) setBuildings(json.data.buildings || []); else setBuildings([]);
    } finally { setLoadingBuildings(false); }
  };

  const loadLifts = async (building_id) => {
    if (!building_id) { setLifts([]); return; }
    try {
      setLoadingLifts(true);
      const res = await fetch(`${BASE}/api/work/reports.php?options=1&type=lifts&building_id=${building_id}`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` }
      });
      const json = await res.json();
      if (json.success) setLifts(json.data.lifts || []); else setLifts([]);
    } finally { setLoadingLifts(false); }
  };

  // ---------- form openers ----------
  const resetForm = () => {
    setFormData({ rp_id: null, org_id: '', building_id: '', lift_id: '', detail: '', date_rp: todayStr() });
  };

  const openCreate = () => {
    resetForm();
    setOpenForm(true);
    loadOrgs();
    setBuildings([]); setLifts([]);
    setUrgency('medium'); setStatus('open');
  };

  const openEdit = async (report) => {
    setFormData({
      rp_id: report.rp_id,
      org_id: report.org_id ?? '',
      building_id: report.building_id ?? '',
      lift_id: report.lift_id ?? '',
      detail: report.detail ?? '',
      date_rp: report.date_rp ?? todayStr(),
    });
    setUrgency(parseUrgency(report.detail));
    setStatus(parseStatus(report.detail));
    setOpenForm(true);
    await loadOrgs();
    await loadBuildings(report.org_id);
    await loadLifts(report.building_id);
  };

  // ---------- progress open ----------
  const openProgressForReport = async (report) => {
    try {
      setProgressError(null);
      setProgressLoading(true);
      setOpenProgress(true);
      // ใช้ rp_id เพื่อดึง task ล่าสุด + ไทม์ไลน์
      const resp = await apiService.getReportProgressByReport(report.rp_id);
      if (!resp.success) {
        setProgressTask(null); setProgressTimeline([]);
        setProgressError(resp.message || 'โหลดความคืบหน้าไม่สำเร็จ');
        return;
      }
      setProgressTask(resp.data?.task || null);
      setProgressTimeline(resp.data?.statuses || []);
    } catch (e) {
      setProgressTask(null); setProgressTimeline([]);
      setProgressError(e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setProgressLoading(false);
    }
  };

  // คลิกแถวเพื่อเปิดความคืบหน้า
  const handleRowClick = (report) => {
    openProgressForReport(report);
  };

  // ---------- tag helpers ----------
  const parseUrgency = (detail = '') => {
    const m = detail.match(/\[URG:(.*?)\]/i);
    const level = (m?.[1] || '').toLowerCase();
    if (['low', 'medium', 'high'].includes(level)) return level;
    if (/ค้าง|ไหม้|ฉุกเฉิน|ติดอยู่|ช็อต/i.test(detail)) return 'high';
    if (/ช้า|ผิดพลาด|เสียงดัง/i.test(detail)) return 'medium';
    return 'low';
  };
  const parseStatus = (detail = '') => {
    const m = detail.match(/\[STA:(.*?)\]/i);
    const s = (m?.[1] || '').toLowerCase();
    if (['open', 'inprogress', 'closed'].includes(s)) return s;
    return 'open';
  };
  const urgencyTagForForm = () => (urgency === 'all' ? '[URG:MEDIUM]' : `[URG:${urgency.toUpperCase()}]`);
  const statusTagForForm  = () => (status === 'all'  ? '[STA:OPEN]'   : `[STA:${status.toUpperCase()}]`);

  // ---------- submit ----------
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    let finalDetail = formData.detail?.trim() || '';
    finalDetail = finalDetail.replace(/\[URG:.*?\]/gi, '').replace(/\[STA:.*?\]/gi, '').trim();
    finalDetail = `${finalDetail} ${urgencyTagForForm()} ${statusTagForForm()}`.trim();

    try {
      setSaving(true);
      const payload = { ...formData, detail: finalDetail };
      const response = formData.rp_id
        ? await apiService.updateReport(payload)
        : await apiService.createReport(payload);

      if (!response.success) { alert(response.message || 'บันทึกไม่สำเร็จ'); return; }
      setOpenForm(false); resetForm(); await fetchReports();
    } catch (err) {
      console.error(err); alert('เกิดข้อผิดพลาดระหว่างบันทึก');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ยืนยันลบรายการแจ้งปัญหานี้?')) return;
    try {
      setSaving(true);
      const response = await apiService.deleteReport(id);
      if (!response.success) alert(response.message || 'ลบไม่สำเร็จ');
      await fetchReports();
    } catch (err) {
      console.error(err); alert('เกิดข้อผิดพลาดระหว่างลบรายการ');
    } finally { setSaving(false); }
  };

  // ---------- filter view ----------
  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return (reports || []).filter((r) => {
      const text = [r.detail, r.reporter_name, r.org_name, r.building_name, r.lift_name, r.date_rp].join(' ').toLowerCase();
      const passQ = qLower ? text.includes(qLower) : true;
      const u = parseUrgency(r.detail);
      const s = parseStatus(r.detail);
      const passUrg = urgency === 'all' ? true : u === urgency;
      const passSta = status === 'all' ? true : s === status;
      return passQ && passUrg && passSta;
    });
  }, [reports, q, urgency, status]);

  // ---------- badges ----------
  const UrgencyBadge = ({ level }) => {
    const map = {
      low: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      medium: 'bg-amber-50 text-amber-700 border border-amber-200',
      high: 'bg-rose-50 text-rose-700 border border-rose-200',
    };
    const label = level === 'high' ? 'เร่งด่วน' : level === 'medium' ? 'ปานกลาง' : 'ต่ำ';
    return <span className={`px-2 py-1 rounded-md text-xs ${map[level] || map.medium}`}>{label}</span>;
  };
  const StatusBadge = ({ s }) => {
    const map = {
      open: 'bg-sky-50 text-sky-700 border border-sky-200',
      inprogress: 'bg-violet-50 text-violet-700 border border-violet-200',
      closed: 'bg-slate-100 text-slate-700 border border-slate-200',
    };
    const label = s === 'inprogress' ? 'กำลังดำเนินการ' : s === 'closed' ? 'ปิดงาน' : 'เปิดใหม่';
    return <span className={`px-2 py-1 rounded-md text-xs ${map[s] || map.open}`}>{label}</span>;
  };

  return (
    <div className="w-full pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-8 lg:pr-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
          <h1 className="text-xl font-bold">แจ้งปัญหาลิฟต์ | Elevator Issue Reports</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">บันทึกและติดตามปัญหาลิฟต์ตามองค์กร/อาคาร/ลิฟต์</p>
      </div>

      {/* Actions / Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-80">
                <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                <Input className="pl-8" placeholder="ค้นหา: อาการ, ผู้แจ้ง, องค์กร, อาคาร, ลิฟต์, วันที่…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <Button variant="outline" onClick={fetchReports}>
                <Wrench className="h-4 w-4 mr-2" />
                รีเฟรช
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger className="w-36"><SelectValue placeholder="ความเร่งด่วน" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกความเร่งด่วน</SelectItem>
                  <SelectItem value="low">ต่ำ</SelectItem>
                  <SelectItem value="medium">ปานกลาง</SelectItem>
                  <SelectItem value="high">เร่งด่วน</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-40"><SelectValue placeholder="สถานะงาน" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="open">เปิดใหม่</SelectItem>
                  <SelectItem value="inprogress">กำลังดำเนินการ</SelectItem>
                  <SelectItem value="closed">ปิดงาน</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                แจ้งปัญหาใหม่
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>รายการแจ้งปัญหา</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">คลิกที่แถวเพื่อดูความคืบหน้า</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลดรายการ…
            </div>
          ) : error ? (
            <div className="text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-3">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">ยังไม่มีข้อมูลการรายงาน</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">วันที่</TableHead>
                  <TableHead>ผู้แจ้ง</TableHead>
                  <TableHead className="min-w-[180px]">สถานที่/ลิฟต์</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead className="w-[160px] text-right">สถานะ</TableHead>
                  <TableHead className="w-[160px] text-right">การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const u = parseUrgency(r.detail);
                  const s = parseStatus(r.detail);
                  return (
                    <TableRow
                      key={r.rp_id}
                      onClick={() => handleRowClick(r)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRowClick(r); } }}
                      tabIndex={0}
                      className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                      aria-label="เปิดดูความคืบหน้า"
                    >
                      <TableCell className="whitespace-nowrap">{r.date_rp}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.reporter_name || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5 text-muted-foreground" />{r.org_name || '—'}-{r.building_name || '—'}</span>
                          <span className="flex items-center gap-1"><PiElevatorLight className="h-3.5 w-3.5 text-muted-foreground" />{r.lift_name || `Lift #${r.lift_id || '—'}`}</span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="text-sm leading-relaxed">
                          {r.detail.replace(/\[URG:.*?\]/i, '').replace(/\[STA:.*?\]/i, '').trim()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <UrgencyBadge level={u} />
                          <StatusBadge s={s} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); openEdit(r); }}
                          >
                            <PencilLine className="h-4 w-4 mr-1" /> แก้ไข
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={saving}
                            onClick={(e) => { e.stopPropagation(); handleDelete(r.rp_id); }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> ลบ
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>{formData.rp_id ? 'แก้ไขการแจ้งปัญหา' : 'แจ้งปัญหาลิฟต์ใหม่'}</DialogTitle>
            <DialogDescription>
              {formData.rp_id ? 'แก้ไขรายละเอียดการแจ้งปัญหาลิฟต์' : 'กรอกรายละเอียดเพื่อแจ้งปัญหาลิฟต์ใหม่'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="date_rp">วันที่แจ้ง</Label>
                <Input id="date_rp" type="date" name="date_rp" value={formData.date_rp || ''} onChange={(e) => setFormData({ ...formData, date_rp: e.target.value })} required />
              </div>

              {/* ORG */}
              <div>
                <Label>องค์กร</Label>
                <Select
                  value={String(formData.org_id || '')}
                  onValueChange={async (v) => { setFormData((p) => ({ ...p, org_id: v, building_id: '', lift_id: '' })); setBuildings([]); setLifts([]); await loadBuildings(v); }}
                  onOpenChange={(o) => { if (o && orgs.length === 0) loadOrgs(); }}
                >
                  <SelectTrigger><SelectValue placeholder={loadingOrgs ? 'กำลังโหลด...' : 'เลือกองค์กร'} /></SelectTrigger>
                  <SelectContent>
                    {orgs.map((o) => (<SelectItem key={o.id} value={String(o.id)}>{o.org_name}</SelectItem>))}
                  </SelectContent>
                </Select>
                {loadingOrgs && <p className="text-xs text-muted-foreground mt-1">กำลังโหลดรายชื่อองค์กร…</p>}
              </div>

              {/* BUILDING */}
              <div>
                <Label>อาคาร</Label>
                <Select
                  value={String(formData.building_id || '')}
                  onValueChange={async (v) => { setFormData((p) => ({ ...p, building_id: v, lift_id: '' })); setLifts([]); await loadLifts(v); }}
                  disabled={!formData.org_id}
                >
                  <SelectTrigger><SelectValue placeholder={loadingBuildings ? 'กำลังโหลด...' : (formData.org_id ? 'เลือกอาคาร' : 'เลือกองค์กรก่อน')} /></SelectTrigger>
                  <SelectContent>
                    {buildings.map((b) => (<SelectItem key={b.id} value={String(b.id)}>{b.building_name}</SelectItem>))}
                  </SelectContent>
                </Select>
                {loadingBuildings && <p className="text-xs text-muted-foreground mt-1">กำลังโหลดรายชื่ออาคาร…</p>}
              </div>
            </div>

            {/* LIFT */}
            <div>
              <Label>ลิฟต์</Label>
              <Select value={String(formData.lift_id || '')} onValueChange={(v) => setFormData((p) => ({ ...p, lift_id: v }))} disabled={!formData.building_id}>
                <SelectTrigger><SelectValue placeholder={loadingLifts ? 'กำลังโหลด...' : (formData.building_id ? 'เลือกลิฟต์' : 'เลือกอาคารก่อน')} /></SelectTrigger>
                <SelectContent>
                  {lifts.map((l) => (<SelectItem key={l.id} value={String(l.id)}>{l.lift_name}</SelectItem>))}
                </SelectContent>
              </Select>
              {loadingLifts && <p className="text-xs text-muted-foreground mt-1">กำลังโหลดรายชื่อลิฟต์…</p>}
            </div>

            <div>
              <Label htmlFor="detail">รายละเอียดปัญหา</Label>
              <Textarea id="detail" name="detail" placeholder="อธิบายอาการ, ชั้นที่เกิดเหตุ, เวลาที่พบ, ภาพรวมสถานการณ์ ฯลฯ" value={formData.detail} onChange={(e) => setFormData({ ...formData, detail: e.target.value })} className="min-h-[110px]" required />
              <div className="flex flex-wrap gap-2 mt-2">
                {quickIssues.map((t) => (
                  <Badge key={t} variant="outline" className="cursor-pointer" onClick={() => setFormData((p) => ({ ...p, detail: p.detail ? `${p.detail}\n- ${t}` : `- ${t}` }))}>
                    {t}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>ความเร่งด่วน</Label>
                <Select value={urgency === 'all' ? 'medium' : urgency} onValueChange={(v) => setUrgency(v)}>
                  <SelectTrigger><SelectValue placeholder="เลือกความเร่งด่วน" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">ต่ำ</SelectItem>
                    <SelectItem value="medium">ปานกลาง</SelectItem>
                    <SelectItem value="high">เร่งด่วน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>สถานะงาน</Label>
                <Select value={status === 'all' ? 'open' : status} onValueChange={(v) => setStatus(v)}>
                  <SelectTrigger><SelectValue placeholder="เลือกสถานะ" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">เปิดใหม่</SelectItem>
                    <SelectItem value="inprogress">กำลังดำเนินการ</SelectItem>
                    <SelectItem value="closed">ปิดงาน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenForm(false)}>
                <X className="h-4 w-4 mr-1" /> ปิด
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {formData.rp_id ? 'บันทึกการแก้ไข' : 'บันทึกการแจ้ง'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={openProgress} onOpenChange={setOpenProgress}>
        <DialogContent className="sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle>
              อัปเดตงาน • {progressTask ? `TASK: ${progressTask.tk_id}` : 'ยังไม่มีงาน (task) ที่ผูกกับรายงานนี้'}
            </DialogTitle>
            <DialogDescription>อัปเดตสถานะงาน, ดูไทม์ไลน์ความคืบหน้า</DialogDescription>
          </DialogHeader>

          {progressLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลดความคืบหน้า…
            </div>
          ) : progressError ? (
            <div className="text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-3">{progressError}</div>
          ) : !progressTask ? (
            <div className="text-sm text-muted-foreground">ยังไม่มีการสร้างงานสำหรับรายงานนี้</div>
          ) : (
            <div className="space-y-5">
              {/* Stepper */}
              <div className="w-full rounded-xl bg-slate-900 text-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  {STATUS_ORDER.map((label, idx) => {
                    const currentIdx = statusIndex(progressTask.tk_status);
                    const done = idx <= currentIdx;
                    return (
                      <div key={label} className="flex-1 flex items-center">
                        <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${done ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                          <CheckCircle2 className={`h-4 w-4 ${done ? 'opacity-100' : 'opacity-50'}`} />
                          <span className="capitalize text-xs">{label}</span>
                        </div>
                        {idx < STATUS_ORDER.length - 1 && (
                          <div className={`h-[2px] flex-1 mx-2 ${idx < currentIdx ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ซ้าย: รายละเอียดงาน */}
                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">รายละเอียดงาน</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <div><span className="text-muted-foreground">ผู้รับผิดชอบ:</span> {progressTask.user || '—'}</div>
                    <div><span className="text-muted-foreground">องค์กร:</span> {progressTask.org_name || '—'}</div>
                    <div><span className="text-muted-foreground">อาคาร:</span> {progressTask.building_name || '—'}</div>
                    <div><span className="text-muted-foreground">ลิฟต์:</span> {progressTask.lift_id || '—'}</div>
                    <div><span className="text-muted-foreground">สถานะปัจจุบัน:</span> <Badge variant="outline" className="capitalize">{progressTask.tk_status}</Badge></div>
                    {progressTask.task_start_date && (
                      <div><span className="text-muted-foreground">เริ่มงาน:</span> {progressTask.task_start_date}</div>
                    )}
                  </CardContent>
                </Card>

                {/* ขวา: ไทม์ไลน์ */}
                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">ไทม์ไลน์</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {progressTimeline.length === 0 ? (
                      <div className="text-sm text-muted-foreground">ยังไม่มีบันทึกสถานะ</div>
                    ) : progressTimeline.map((it) => (
                      <div key={it.tk_status_id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span>{it.time}</span>
                          <span className="capitalize">• {it.status}</span>
                        </div>
                        {it.detail && <div className="text-sm mt-1 whitespace-pre-wrap">{it.detail}</div>}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
