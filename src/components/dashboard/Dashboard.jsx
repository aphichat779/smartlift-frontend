// src/components/dashboard/Dashboard.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Shield,
  Bell,
  KeyRound,
  Server,
  Building2,
  Users,
  Wrench,
  RefreshCw,
  Factory,
  Home,
  UserCircle2,
  AlertTriangle,
} from 'lucide-react';
import TotpConfirmButton from '@/components/dashboard/TotpConfirmButton';
import { apiService } from '@/services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const DASHBOARD_API = '/api/dashboard.php';

// ---------- Small UI helpers ----------
const numberFmt = (v) => {
  if (v == null) return '—';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return new Intl.NumberFormat().format(n);
};

function IconBox({ icon: Icon, tone = 'emerald' }) {
  const map = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    sky: 'bg-sky-50 text-sky-600 border-sky-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    violet: 'bg-violet-50 text-violet-600 border-violet-200',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
  };
  return (
    <div className={`h-10 w-10 grid place-items-center rounded-xl border ${map[tone] || map.slate}`}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, tone }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {Icon ? <IconBox icon={Icon} tone={tone} /> : null}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ icon: Icon = AlertTriangle, title = 'ไม่มีข้อมูล', desc = 'ยังไม่พบข้อมูลในส่วนนี้' }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="font-medium text-gray-800">{title}</p>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function StatusPill({ text }) {
  const t = String(text || '').toLowerCase();
  let variant = 'secondary';
  if (['done', 'success', 'completed', 'เสร็จสิ้น'].some(k => t.includes(k))) variant = 'success';
  else if (['in progress', 'processing', 'กำลังดำเนินการ', '2', '3'].some(k => t.includes(k))) variant = 'warning';
  else if (['new', 'queued', 'รอ', '1'].some(k => t.includes(k))) variant = 'info';
  else if (['cancel', 'error', 'failed', 'ยกเลิก'].some(k => t.includes(k))) variant = 'destructive';

  const map = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    info: 'bg-sky-50 text-sky-700 border border-sky-200',
    destructive: 'bg-rose-50 text-rose-700 border border-rose-200',
    secondary: 'bg-slate-50 text-slate-700 border border-slate-200',
  };
  return <span className={`px-2 py-1 rounded-md text-xs ${map[variant]}`}>{text || '—'}</span>;
}

function SkeletonLine({ w = 'w-full' }) {
  return <div className={`h-3 rounded bg-slate-200/70 ${w} animate-pulse`} />;
}

function Section({ title, children, right }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

// ---------- Main Component ----------
const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const role = useMemo(() => user?.role ?? 'user', [user]);

  const handleTotpConfirmed = async () => {
    console.log('TOTP Confirmed! call reset-2FA API here.');
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getDashboard();
      setData(res);
    } catch (e) {
      setError(e?.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const res = await apiService.getDashboard();
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'โหลดข้อมูลไม่สำเร็จ');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="w-full pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-8 lg:pr-8">

      {/* Hero / Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-emerald-50 via-sky-50 to-violet-50">
          <div className="p-5 md:p-6 lg:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">
                  ยินดีต้อนรับ, {user?.first_name}!
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  {user?.org_name && (
                    <Badge variant="outline" className="gap-1">
                      <Factory className="h-3.5 w-3.5" />
                      {user.org_name}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="gap-1">
                    <UserCircle2 className="h-3.5 w-3.5" />
                    {role}
                  </Badge>
                  <Badge className={user?.ga_enabled ? 'bg-emerald-600' : 'bg-amber-600'}>
                    2FA: {user?.ga_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={load}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  รีเฟรช
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Loading / Error */}
      {isLoading && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-muted-foreground">กำลังโหลดข้อมูลแดชบอร์ด…</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6">
              <SkeletonLine w="w-1/2" />
              <SkeletonLine w="w-2/3" />
              <SkeletonLine w="w-1/3" />
              <SkeletonLine w="w-1/2" />
            </div>
            <SkeletonLine />
            <SkeletonLine w="w-5/6" />
          </CardContent>
        </Card>
      )}
      {error && !isLoading && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">เกิดข้อผิดพลาด</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-red-700">{error}</p>
            <Button variant="destructive" onClick={load}>
              <RefreshCw className="h-4 w-4 mr-2" />
              ลองใหม่
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Top quick status (local) */}
      {!isLoading && !error && (
        <Section title="สถานะบัญชี | Account">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6 mb-2">
            <StatCard title="สถานะบัญชี" value={<span className="text-emerald-700">ใช้งานได้</span>} icon={Activity} tone="emerald" />
            <StatCard
              title="การรักษาความปลอดภัย (2FA)"
              value={user?.ga_enabled ? <span className="text-emerald-700">เปิดใช้งาน</span> : <span className="text-amber-700">ปิดใช้งาน</span>}
              icon={Shield}
              tone={user?.ga_enabled ? 'emerald' : 'amber'}
            />
            {/* TOTP quick action */}
            {user?.ga_enabled ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="flex flex-col justify-center items-center p-6 border-dashed">
                  <KeyRound className="h-8 w-8 text-gray-600 mb-2" />
                  <h3 className="text-md font-semibold text-gray-800 mb-4 text-center">ตรวจสอบ TOTP</h3>
                  <TotpConfirmButton
                    onConfirmSuccess={handleTotpConfirmed}
                    buttonText="ตรวจสอบ"
                    buttonVariant="destructive"
                  />
                </Card>
              </motion.div>
            ) : (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-amber-700" />
                    <CardTitle className="text-amber-800">คำแนะนำด้านความปลอดภัย</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-amber-700">แนะนำให้เปิดใช้งานการยืนยันตัวตนสองขั้นตอน (2FA)</p>
                </CardContent>
              </Card>
            )}
          </div>
        </Section>
      )}

      {/* Overview from API.cards */}
      {!isLoading && !error && data?.cards?.length > 0 && (
        <Section title="สรุปภาพรวม | Overview">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6 mb-2">
            {data.cards.map((c, idx) => {
              const label = c.label || '';
              const value = numberFmt(c.value);
              const iconMap =
                label.includes('Orgs') ? Server :
                label.includes('Buildings') ? Building2 :
                label.toLowerCase().includes('users') || label.includes('ผู้ใช้') ? Users :
                label.toLowerCase().includes('lifts') || label.includes('ลิฟต์') ? Home :
                Activity;
              const tone =
                label.includes('Orgs') ? 'violet' :
                label.includes('Buildings') ? 'sky' :
                (label.toLowerCase().includes('users') || label.includes('ผู้ใช้')) ? 'amber' :
                'emerald';
              return <StatCard key={idx} title={label} value={value} icon={iconMap} tone={tone} />;
            })}
          </div>
        </Section>
      )}

      {/* Role-specific sections */}
      {!isLoading && !error && data?.role === 'admin' && data?.charts?.liftsByOrg && (
        <Section title="ลิฟต์ตามองค์กร | Lifts by Org">
          {data.charts.liftsByOrg.length ? (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>องค์กร</TableHead>
                      <TableHead className="text-right">จำนวนลิฟต์</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.charts.liftsByOrg.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.org_name}</TableCell>
                        <TableCell className="text-right">{numberFmt(r.lifts)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <EmptyState title="ยังไม่มีข้อมูลองค์กร" />
          )}
          
        </Section>
      )}

      {!isLoading && !error && data?.role === 'org_admin' && data?.charts?.liftsByBuilding && (
        <Section title="ลิฟต์ตามอาคาร | Lifts by Building">
          {data.charts.liftsByBuilding.length ? (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>อาคาร</TableHead>
                      <TableHead className="text-right">จำนวนลิฟต์</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.charts.liftsByBuilding.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.building_name}</TableCell>
                        <TableCell className="text-right">{numberFmt(r.lifts)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <EmptyState title="ยังไม่มีข้อมูลอาคาร" />
          )}
          
        </Section>
        
      )}

      {!isLoading && !error && data?.role === 'technician' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                คิวงานของฉัน | My Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.tables?.myQueue?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>อาคาร</TableHead>
                      <TableHead>ลิฟต์</TableHead>
                      <TableHead>เริ่ม</TableHead>
                      <TableHead>สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.tables.myQueue.map((r) => (
                      <TableRow key={r.tk_id}>
                        <TableCell>#{r.tk_id}</TableCell>
                        <TableCell>{r.building_name || '—'}</TableCell>
                        <TableCell>{r.lift_id}</TableCell>
                        <TableCell>{r.task_start_date || '—'}</TableCell>
                        <TableCell><StatusPill text={r.tk_status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState title="ยังไม่มีคิวงาน" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>สถานะลิฟต์ล่าสุด | Recent Lift Logs</CardTitle></CardHeader>
            <CardContent>
              {data?.tables?.recentLiftLogs?.length ? (
                <ul className="relative space-y-3 before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-200/70 pl-10">
                  {data.tables.recentLiftLogs.map((r) => (
                    <li key={r.id} className="relative">
                      <span className="absolute left-3 top-1.5 h-3 w-3 rounded-full bg-emerald-500 shadow ring-4 ring-emerald-100" />
                      <div className="text-sm">
                        <span className="font-medium">Lift {r.lift_id}</span>{' '}
                        <span className="text-muted-foreground">· state={r.lift_state}</span>{' '}
                        <span className="text-muted-foreground">· {r.created_at}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        up={r.up_status} · down={r.down_status} · car={r.car_status}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="ไม่มีข้อมูลล่าสุด" />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && !error && data?.role === 'org_admin' && data?.tables?.recentTasks && (
        <Section title="งานล่าสุด | Recent Tasks">
          {data.tables.recentTasks.length ? (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>องค์กร</TableHead>
                      <TableHead>อาคาร</TableHead>
                      <TableHead>ลิฟต์</TableHead>
                      <TableHead>เริ่ม</TableHead>
                      <TableHead>สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.tables.recentTasks.map((r) => (
                      <TableRow key={r.tk_id}>
                        <TableCell>#{r.tk_id}</TableCell>
                        <TableCell>{r.org_name}</TableCell>
                        <TableCell>{r.building_name}</TableCell>
                        <TableCell>{r.lift_id}</TableCell>
                        <TableCell>{r.task_start_date || '—'}</TableCell>
                        <TableCell><StatusPill text={r.tk_status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-8"><CardContent><EmptyState title="ยังไม่มีงานล่าสุด" /></CardContent></Card>
          )}
        </Section>
      )}

      {!isLoading && !error && data?.role === 'user' && data?.tables?.myLifts && (
        <Section title="ลิฟต์ที่ฉันเข้าถึง | My Lifts">
          {data.tables.myLifts.length ? (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  {data.tables.myLifts.map((r) => (
                    <li key={r.id} className="rounded-xl border p-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-semibold">{r.lift_name}</div>
                        <div className="text-muted-foreground text-xs">
                          {r.building_name ?? '—'}
                        </div>
                      </div>
                      <Badge variant="outline" className="whitespace-nowrap">
                        max {numberFmt(r.max_level)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-8"><CardContent><EmptyState title="ไม่มีลิฟต์ที่เข้าถึงได้" /></CardContent></Card>
          )}
        </Section>
      )}
    </div>
  );
};

export default Dashboard;
