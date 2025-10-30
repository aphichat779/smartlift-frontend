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
  AlertTriangle,
  Search,
  Plus,
  Save,
  X,
  PencilLine,
  Trash2,
  Loader2,
  Building,
  CheckCircle2,
  Calendar,
  MoreHorizontal,
  Eye
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const todayStr = () => new Date().toISOString().slice(0, 10);
const BASE = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost';

/** ตัดสถานะ test ออก (map ไป progress) */
const STATUS_ORDER = ['assign', 'preparing', 'progress', 'complete'];
const statusIndex = (s) => Math.max(0, STATUS_ORDER.indexOf((s || '').toLowerCase()));
const sanitizeStatus = (s) => {
  const v = (s || '').toLowerCase();
  return v === 'test' ? 'progress' : v;
};
const statusLabel = (s) => {
  const v = sanitizeStatus(s);
  return v === 'assign'
    ? 'มอบหมายแล้ว'
    : v === 'preparing'
      ? 'กำลังเตรียม'
      : v === 'progress'
        ? 'กำลังดำเนินการ'
        : v === 'complete'
          ? 'เสร็จสิ้น'
          : v === 'pending'
            ? 'รอมอบหมาย'
            : v === 'open'
              ? 'เปิดใหม่'
              : (s || '—');
};
const statusColor = (s) => {
  const v = sanitizeStatus(s);
  return v === 'assign'
    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
    : v === 'preparing'
      ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
      : v === 'progress'
        ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-200'
        : v === 'complete'
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200';
};

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // filters
  const [q, setQ] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('all');

  // options
  const [orgs, setOrgs] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [lifts, setLifts] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingLifts, setLoadingLifts] = useState(false);

  // form dialog
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
    'ประตูิฟต์ปิดไม่สนิท',
    'มีเสียงดังผิดปกติระหว่างวิ่ง',
    'ปุ่มกดภายในไม่ทำงาน',
    'ไฟชั้นแสดงผลผิดพลาด',
    'ระบบ Overload แจ้งเตือนผิดปกติ',
  ];

  useEffect(() => {
    fetchReports();
  }, []);

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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });
      const json = await res.json();
      if (json.success) setOrgs(json.data.orgs || []);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const loadBuildings = async (org_id) => {
    if (!org_id) {
      setBuildings([]);
      return;
    }
    try {
      setLoadingBuildings(true);
      const res = await fetch(
        `${BASE}/api/work/reports.php?options=1&type=buildings&org_id=${org_id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
        }
      );
      const json = await res.json();
      if (json.success) setBuildings(json.data.buildings || []);
      else setBuildings([]);
    } finally {
      setLoadingBuildings(false);
    }
  };

  const loadLifts = async (building_id) => {
    if (!building_id) {
      setLifts([]);
      return;
    }
    try {
      setLoadingLifts(true);
      const res = await fetch(
        `${BASE}/api/work/reports.php?options=1&type=lifts&building_id=${building_id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
        }
      );
      const json = await res.json();
      if (json.success) setLifts(json.data.lifts || []);
      else setLifts([]);
    } finally {
      setLoadingLifts(false);
    }
  };

  // ---------- form openers ----------
  const resetForm = () => {
    setFormData({
      rp_id: null,
      org_id: '',
      building_id: '',
      lift_id: '',
      detail: '',
      date_rp: todayStr(),
    });
  };

  const openCreate = () => {
    resetForm();
    setOpenForm(true);
    loadOrgs();
    setBuildings([]);
    setLifts([]);
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
        setProgressTask(null);
        setProgressTimeline([]);
        setProgressError(resp.message || 'โหลดความคืบหน้าไม่สำเร็จ');
        return;
      }
      setProgressTask(resp.data?.task || null);
      // กรอง test ออกจากไทม์ไลน์
      const cleaned = (resp.data?.statuses || []).filter(
        (it) =>
          (it.status || '').toLowerCase() !== 'test' &&
          sanitizeStatus(it.status) !== 'test'
      );
      setProgressTimeline(cleaned);
    } catch (e) {
      setProgressTask(null);
      setProgressTimeline([]);
      setProgressError(e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setProgressLoading(false);
    }
  };

  // คลิกแถวเพื่อเปิดความคืบหน้า
  const handleRowClick = (report) => {
    openProgressForReport(report);
  };

  // ---------- submit ----------
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const finalDetail = formData.detail?.trim() || '';

    try {
      setSaving(true);
      const payload = { ...formData, detail: finalDetail };
      const response = formData.rp_id
        ? await apiService.updateReport(payload)
        : await apiService.createReport(payload);

      if (!response.success) {
        alert(response.message || 'บันทึกไม่สำเร็จ');
        return;
      }
      setOpenForm(false);
      resetForm();
      await fetchReports();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดระหว่างบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ยืนยันลบรายการแจ้งปัญหานี้?')) return;
    try {
      setSaving(true);
      const response = await apiService.deleteReport(id);
      if (!response.success) alert(response.message || 'ลบไม่สำเร็จ');
      await fetchReports();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดระหว่างลบรายการ');
    } finally {
      setSaving(false);
    }
  };

  // ---------- filter view ----------
  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return (reports || []).filter((r) => {
      const text = [
        r.detail,
        r.reporter_name,
        r.org_name,
        r.building_name,
        r.lift_name,
        r.date_rp,
      ]
        .join(' ')
        .toLowerCase();
      const passQ = qLower ? text.includes(qLower) : true;
      const passDate = dateFilter ? r.date_rp === dateFilter : true;
      const passOrg =
        orgFilter === 'all' ? true : r.org_id === parseInt(orgFilter);
      return passQ && passDate && passOrg;
    });
  }, [reports, q, dateFilter, orgFilter]);

  // Glass card helper
  const glassCard =
    'rounded-2xl bg-white/85 backdrop-blur ring-1 ring-slate-200 shadow-[0_12px_30px_-12px_rgba(2,6,23,0.25)]';

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200 text-slate-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-start md:items-center gap-3">
            <div className="p-2 rounded-xl bg-white/80 backdrop-blur shadow ring-1 ring-slate-200 shrink-0">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                แจ้งปัญหาลิฟต์
              </h1>
              <p className="text-xs md:text-sm text-slate-500">
                บันทึกและติดตามปัญหาลิฟต์ตามองค์กร/อาคาร/ลิฟต์
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <Button
              onClick={openCreate}
              className="w-full md:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:opacity-95 text-sm md:text-base"
            >
              <Plus className="h-4 w-4 mr-2" />
              แจ้งปัญหาใหม่
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card
          className={`${glassCard} mb-6 sticky top-0 z-20 md:static md:z-auto`}
        >
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="ค้นหา: อาการ, ผู้แจ้ง, องค์กร, อาคาร, ลิฟต์, วันที่…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="pl-10 rounded-xl text-sm md:text-base"
                  />
                </div>
              </div>

              {/* Right filter group */}
              <div className="flex flex-col sm:flex-row md:flex-row flex-wrap gap-3 md:gap-2">
                <div className="w-full sm:w-40 md:w-48">
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="rounded-xl text-sm md:text-base"
                  />
                </div>

                <Select value={orgFilter} onValueChange={setOrgFilter}>
                  <SelectTrigger className="w-full sm:w-40 md:w-48 rounded-xl text-sm md:text-base">
                    <SelectValue placeholder="กรองตามองค์กร" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-64 overflow-y-auto">
                    <SelectItem value="all">ทุกองค์กร</SelectItem>
                    {orgs.map((org) => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        {org.org_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={fetchReports}
                  className="rounded-xl text-sm md:text-base"
                >
                  รีเฟรช
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card className={glassCard}>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <CardTitle className="text-slate-900 text-base md:text-lg">
                รายการแจ้งปัญหา
              </CardTitle>
              <Badge
                variant="outline"
                className="self-start md:self-auto rounded-lg ring-1 ring-slate-200 text-xs md:text-sm"
              >
                {filtered.length} รายการ
              </Badge>
            </div>
            <p className="text-[11px] md:text-xs text-slate-500 mt-1">
              แตะรายการเพื่อดูความคืบหน้า
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2 text-slate-600" />
                <span className="text-sm md:text-base">กำลังโหลดรายการ…</span>
              </div>
            ) : error ? (
              <div className="text-rose-700 bg-rose-50 ring-1 ring-rose-200 rounded-xl p-3 text-sm md:text-base">
                {error}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">ไม่พบรายการแจ้งปัญหา</p>
              </div>
            ) : (
              <>
                {/* MOBILE CARD LIST (< md) */}
                <div className="md:hidden space-y-3">
                  {filtered.map((r) => {
                    const current = sanitizeStatus(
                      r.tech_status ?? r.task_status
                    );
                    const label = statusLabel(current);
                    const color = statusColor(current);

                    return (
                      <div
                        key={r.rp_id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleRowClick(r)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleRowClick(r);
                          }
                        }}
                        className="w-full text-left rounded-xl ring-1 ring-slate-200 bg-white/70 backdrop-blur p-4 shadow-sm active:scale-[0.99] transition cursor-pointer"
                      >
                        {/* top row date + menu */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-800">
                              {r.date_rp}
                            </span>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                className="h-9 w-9 p-0 rounded-lg"
                              >
                                <span className="sr-only">เปิดเมนู</span>
                                <MoreHorizontal className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              className="rounded-xl text-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(r);
                                }}
                                className="text-blue-700 focus:text-blue-700"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                ดูความคืบหน้า
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(r);
                                }}
                              >
                                <PencilLine className="h-4 w-4 mr-2" />
                                แก้ไข
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(r.rp_id);
                                }}
                                className="text-rose-700 focus:text-rose-700"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                ลบ
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* reporter */}
                        <div className="flex items-center gap-2 mt-3">
                          <Avatar className="h-9 w-9 ring-1 ring-slate-200">
                            <AvatarImage src={r.reporter_img} />
                            <AvatarFallback>
                              {r.reporter_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm">
                            <p className="font-medium text-slate-900">
                              {r.reporter_name || '—'}
                            </p>
                          </div>
                        </div>

                        {/* location */}
                        <div className="mt-3 text-sm text-slate-800 space-y-1">
                          <div className="flex items-start gap-2">
                            <Building className="h-4 w-4 text-slate-400 shrink-0" />
                            <span>
                              {r.org_name || '—'} / {r.building_name || '—'}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <PiElevatorLight className="h-4 w-4 text-slate-400 shrink-0" />
                            <span>
                              {r.lift_name || `Lift #${r.lift_id || '—'}`}
                            </span>
                          </div>
                        </div>

                        {/* detail */}
                        <div className="mt-3 text-sm text-slate-800">
                          <p className="line-clamp-3 whitespace-pre-line">
                            {r.detail}
                          </p>
                        </div>

                        {/* status */}
                        <div className="mt-4 flex items-center justify-between">
                          <span
                            className={`px-2 py-1 rounded-md text-[11px] font-semibold ${color}`}
                          >
                            {label}
                          </span>

                          {r.task_status && (
                            <span className="text-[11px] text-slate-500">
                              งาน: {r.task_status}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* DESKTOP TABLE (md ≥) */}
                <div className="hidden md:block rounded-xl ring-1 ring-slate-200 overflow-hidden bg-white/70 backdrop-blur">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80">
                        <TableHead className="w-[120px] text-slate-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            วันที่
                          </div>
                        </TableHead>
                        <TableHead className="text-slate-600">ผู้แจ้ง</TableHead>
                        <TableHead className="text-slate-600">สถานที่</TableHead>
                        <TableHead className="text-slate-600">รายละเอียด</TableHead>
                        <TableHead className="w-[160px] text-slate-600">
                          สถานะ (ช่าง)
                        </TableHead>
                        <TableHead className="text-right w-[100px] text-slate-600">
                          จัดการ
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((r) => {
                        const current = sanitizeStatus(
                          r.tech_status ?? r.task_status
                        );
                        const label = statusLabel(current);
                        const color = statusColor(current);
                        return (
                          <TableRow
                            key={r.rp_id}
                            onClick={() => handleRowClick(r)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleRowClick(r);
                              }
                            }}
                            tabIndex={0}
                            className="cursor-pointer hover:bg-blue-50/40 focus:bg-blue-50/60 focus:outline-none transition-colors"
                            aria-label="เปิดดูความคืบหน้า"
                          >
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-800">
                                  {r.date_rp}
                                </span>
                              </div>
                            </TableCell>

                            {/* ผู้แจ้ง */}
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 ring-1 ring-slate-200">
                                  <AvatarImage src={r.reporter_img} />
                                  <AvatarFallback>
                                    {r.reporter_name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {r.reporter_name || '—'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            {/* สถานที่ */}
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-1">
                                  <Building className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="text-slate-800">
                                    {r.org_name || '—'} / {r.building_name || '—'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <PiElevatorLight className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="text-slate-800">
                                    {r.lift_name || `Lift #${r.lift_id || '—'}`}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            {/* รายละเอียด */}
                            <TableCell className="max-w-[340px]">
                              <p className="text-sm text-slate-800 truncate">
                                {r.detail}
                              </p>
                            </TableCell>

                            {/* สถานะของช่าง */}
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-md text-xs font-semibold ${color}`}
                              >
                                {label}
                              </span>
                            </TableCell>

                            {/* เมนู */}
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0 rounded-lg"
                                  >
                                    <span className="sr-only">เปิดเมนู</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="rounded-xl"
                                >
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRowClick(r);
                                    }}
                                    className="text-blue-700 focus:text-blue-700"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    ดูความคืบหน้า
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEdit(r);
                                    }}
                                  >
                                    <PencilLine className="h-4 w-4 mr-2" />
                                    แก้ไข
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(r.rp_id);
                                    }}
                                    className="text-rose-700 focus:text-rose-700"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    ลบ
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={openForm} onOpenChange={setOpenForm}>
          <DialogContent className="sm:max-w-[720px] max-w-[95vw] rounded-2xl bg-white/90 backdrop-blur ring-1 ring-slate-200 max-h-[90vh] overflow-y-auto">
            {/* header: no sticky to avoid floating-overlap */}
            <DialogHeader className="bg-white border-b border-slate-200/60 px-6 pt-4 pb-3 rounded-t-2xl">
              <DialogTitle className="text-slate-900 text-base md:text-lg">
                {formData.rp_id ? 'แก้ไขการแจ้งปัญหา' : 'แจ้งปัญหาลิฟต์ใหม่'}
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-xs md:text-sm">
                {formData.rp_id
                  ? 'แก้ไขรายละเอียดการแจ้งปัญหาลิฟต์'
                  : 'กรอกรายละเอียดเพื่อแจ้งปัญหาลิฟต์ใหม่'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4 px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="date_rp" className="text-sm">
                    วันที่แจ้ง
                  </Label>
                  <Input
                    id="date_rp"
                    type="date"
                    name="date_rp"
                    value={formData.date_rp || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, date_rp: e.target.value })
                    }
                    required
                    className="rounded-xl text-sm md:text-base"
                  />
                </div>

                {/* ORG */}
                <div>
                  <Label className="text-sm">องค์กร</Label>
                  <Select
                    value={String(formData.org_id || '')}
                    onValueChange={async (v) => {
                      setFormData((p) => ({
                        ...p,
                        org_id: v,
                        building_id: '',
                        lift_id: '',
                      }));
                      setBuildings([]);
                      setLifts([]);
                      await loadBuildings(v);
                    }}
                    onOpenChange={(o) => {
                      if (o && orgs.length === 0) loadOrgs();
                    }}
                  >
                    <SelectTrigger className="rounded-xl text-sm md:text-base">
                      <SelectValue
                        placeholder={
                          loadingOrgs ? 'กำลังโหลด...' : 'เลือกองค์กร'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-64 overflow-y-auto text-sm md:text-base">
                      {orgs.map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.org_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {loadingOrgs && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      กำลังโหลดรายชื่อองค์กร…
                    </p>
                  )}
                </div>

                {/* BUILDING */}
                <div>
                  <Label className="text-sm">อาคาร</Label>
                  <Select
                    value={String(formData.building_id || '')}
                    onValueChange={async (v) => {
                      setFormData((p) => ({
                        ...p,
                        building_id: v,
                        lift_id: '',
                      }));
                      setLifts([]);
                      await loadLifts(v);
                    }}
                    disabled={!formData.org_id}
                  >
                    <SelectTrigger className="rounded-xl text-sm md:text-base">
                      <SelectValue
                        placeholder={
                          loadingBuildings
                            ? 'กำลังโหลด...'
                            : formData.org_id
                              ? 'เลือกอาคาร'
                              : 'เลือกองค์กรก่อน'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-64 overflow-y-auto text-sm md:text-base">
                      {buildings.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.building_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {loadingBuildings && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      กำลังโหลดรายชื่ออาคาร…
                    </p>
                  )}
                </div>
              </div>

              {/* LIFT */}
              <div>
                <Label className="text-sm">ลิฟต์</Label>
                <Select
                  value={String(formData.lift_id || '')}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, lift_id: v }))
                  }
                  disabled={!formData.building_id}
                >
                  <SelectTrigger className="rounded-xl text-sm md:text-base">
                    <SelectValue
                      placeholder={
                        loadingLifts
                          ? 'กำลังโหลด...'
                          : formData.building_id
                            ? 'เลือกลิฟต์'
                            : 'เลือกอาคารก่อน'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-64 overflow-y-auto text-sm md:text-base">
                    {lifts.map((l) => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {l.lift_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingLifts && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    กำลังโหลดรายชื่อลิฟต์…
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="detail" className="text-sm">
                  รายละเอียดปัญหา
                </Label>
                <Textarea
                  id="detail"
                  name="detail"
                  placeholder="อธิบายอาการ, ชั้นที่เกิดเหตุ, เวลาที่พบ, ภาพรวมสถานการณ์ ฯลฯ"
                  value={formData.detail}
                  onChange={(e) =>
                    setFormData({ ...formData, detail: e.target.value })
                  }
                  className="min-h-[110px] rounded-xl text-sm md:text-base"
                  required
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {quickIssues.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="cursor-pointer rounded-lg ring-1 ring-slate-200 bg-white/70 backdrop-blur text-[11px] md:text-xs"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          detail: p.detail ? `${p.detail}\n- ${t}` : `- ${t}`,
                        }))
                      }
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              <DialogFooter className="gap-2 flex flex-col-reverse sm:flex-row sm:justify-end pt-4 border-t border-slate-200/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenForm(false)}
                  className="rounded-xl w-full sm:w-auto text-sm md:text-base"
                >
                  <X className="h-4 w-4 mr-1" /> ปิด
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95 text-sm md:text-base"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {formData.rp_id ? 'บันทึกการแก้ไข' : 'บันทึกการแจ้ง'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Progress Dialog */}
        <Dialog open={openProgress} onOpenChange={setOpenProgress}>
          <DialogContent className="sm:max-w-[760px] max-w-[95vw] rounded-2xl bg-white/90 backdrop-blur ring-1 ring-slate-200 max-h-[90vh] overflow-y-auto">
            {/* header: plain, not sticky => no “ลอยออกจาก popup” */}
            <DialogHeader className="bg-white border-b border-slate-200/60 px-6 pt-4 pb-3 rounded-t-2xl">
              <DialogTitle className="text-slate-900 text-base md:text-lg">
                อัปเดตงาน •{' '}
                {progressTask
                  ? `TASK: ${progressTask.tk_id}`
                  : 'รอมอบงานให้ช่างผูรับผิดชอบ'}
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-xs md:text-sm">
                อัปเดตสถานะงาน, ดูไทม์ไลน์ความคืบหน้า
              </DialogDescription>
            </DialogHeader>

            {progressLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2 text-slate-600" />
                <span className="text-sm md:text-base">
                  กำลังโหลดความคืบหน้า…
                </span>
              </div>
            ) : progressError ? (
              <div className="text-rose-700 bg-rose-50 ring-1 ring-rose-200 rounded-xl p-3 text-sm md:text-base m-6">
                {progressError}
              </div>
            ) : !progressTask ? (
              <div className="text-center py-8 px-6">
                <AlertTriangle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  ยังไม่มีการสร้างงานสำหรับรายงานนี้
                </p>
              </div>
            ) : (
              <div className="space-y-5 pt-4 pb-6 px-6">
                {/* Stepper */}
                <div className="w-full rounded-2xl bg-slate-900 text-slate-200 p-3 ring-1 ring-slate-800 shadow">
                  {/* mobile: stack; desktop: inline row */}
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-2">
                    {STATUS_ORDER.map((label, idx) => {
                      const currentIdx = statusIndex(
                        sanitizeStatus(progressTask.tk_status)
                      );
                      const done = idx <= currentIdx;
                      return (
                        <div
                          key={label}
                          className="flex-1 flex flex-col md:flex-row md:items-center"
                        >
                          <div
                            className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs ${
                              done ? 'bg-emerald-600' : 'bg-slate-700'
                            }`}
                          >
                            <CheckCircle2
                              className={`h-4 w-4 ${
                                done ? 'opacity-100' : 'opacity-50'
                              }`}
                            />
                            <span className="capitalize">{label}</span>
                          </div>

                          {idx < STATUS_ORDER.length - 1 && (
                            <div className="hidden md:block flex-1 mx-2 h-[2px]">
                              <div
                                className={`h-[2px] w-full ${
                                  idx < currentIdx
                                    ? 'bg-emerald-500'
                                    : 'bg-slate-600'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2 columns to 1 column on mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ซ้าย: รายละเอียดงาน */}
                  <Card className={`${glassCard} ring-1 ring-slate-200`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-slate-900">
                        รายละเอียดงาน
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <div>
                        <span className="text-slate-500">ผู้รับผิดชอบ:</span>{' '}
                        {progressTask.user || '—'}
                      </div>
                      <div>
                        <span className="text-slate-500">องค์กร:</span>{' '}
                        {progressTask.org_name || '—'}
                      </div>
                      <div>
                        <span className="text-slate-500">อาคาร:</span>{' '}
                        {progressTask.building_name || '—'}
                      </div>
                      <div>
                        <span className="text-slate-500">ลิฟต์:</span>{' '}
                        {progressTask.lift_name || '—'}
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-slate-500">สถานะปัจจุบัน:</span>
                        <Badge
                          variant="outline"
                          className="capitalize rounded-md ring-1 ring-slate-200 text-[11px]"
                        >
                          {statusLabel(progressTask.tk_status)}
                        </Badge>
                      </div>
                      {progressTask.task_start_date && (
                        <div>
                          <span className="text-slate-500">เริ่มงาน:</span>{' '}
                          {progressTask.task_start_date}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* ขวา: ไทม์ไลน์ */}
                  <Card className={`${glassCard} ring-1 ring-slate-200`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-slate-900">
                        ไทม์ไลน์
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                      {progressTimeline.length === 0 ? (
                        <div className="text-sm text-slate-500">
                          ยังไม่มีบันทึกสถานะ
                        </div>
                      ) : (
                        progressTimeline.map((it) => (
                          <div
                            key={it.tk_status_id}
                            className="rounded-lg ring-1 ring-slate-200 p-3 bg-white/80"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] text-slate-500">
                              <span>{it.time}</span>
                              <span className="capitalize">
                                • {statusLabel(it.status)}
                              </span>
                            </div>
                            {it.detail && (
                              <div className="text-sm mt-1 whitespace-pre-wrap text-slate-800">
                                {it.detail}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Reports;
