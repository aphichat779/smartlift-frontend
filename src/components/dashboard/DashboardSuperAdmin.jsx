// src/components/dashboard/DashboardSuperAdmin.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Building2,
    Building,
    Server,
    Users,
    UserCog,
    Wrench,
    Activity,
    AlertTriangle,
    ClipboardList,
    Layers3,
    Loader2, // Icon สำหรับ loading
    RefreshCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// เปลี่ยนจาก fetchDashboardData ใน mock เป็น fetchDashboardData จาก service จริง
import { fetchDashboardData } from '@/services/DashboardService'; 

// ไอคอน KPI
const kpiIcons = {
    Organizations: Layers3,
    Buildings: Building2, 
    Elevators: Server,
    Users: Users,
    Technicians: UserCog,
    "Open Tasks": Wrench,
};

// =========================================================
// 💡 ฟังก์ชันแปลง Bit Status เป็นข้อความและกำหนด Priority (ปรับปรุงใหม่)
// =========================================================
/**
 * แปลง Bit String สถานะลิฟต์ 8 บิต เป็นข้อความสถานะและระดับ Priority
 * @param {string} carBits - string 8 บิต (e.g., "00100001")
 * @returns {{text: string, priority: 'normal' | 'warning' | 'error' | 'critical', bits: string}}
 */
const getCarStatus = (carBits) => {
    // สถานะออฟไลน์ / ไม่มีข้อมูล
    if (typeof carBits !== 'string' || carBits.length !== 8) {
        return { text: 'ออฟไลน์ / ไม่มีข้อมูล', priority: 'critical', bits: '—' };
    }

    // สถานะที่อาจเกิดขึ้น: [Index, Label (Thai), Priority ('error', 'warning', 'info')]
    const statusMap = [
        [0, 'ข้อผิดพลาดหลัก (Fault)', 'error'],      // Bit 7 (MSB)
        [1, 'หยุดฉุกเฉิน/Service Mode', 'error'], // Bit 6
        [2, 'โหมดดับเพลิง (Fire)', 'error'],     // Bit 5
        [3, 'โหมดตรวจสอบ (Inspection)', 'warning'], // Bit 4
        [4, 'สวิตช์ Alarm ถูกกด', 'warning'],       // Bit 3
        [5, 'น้ำหนักเกิน (Overload)', 'warning'],   // Bit 2
        [6, 'ประตูถูกบล็อก/เปิดค้าง', 'warning'],   // Bit 1
        [7, 'สถานะทั่วไป (Bit 0)', 'info'],       // Bit 0 (LSB)
    ];

    let highestPriority = 'normal';
    const activeStatuses = [];

    statusMap.forEach(([index, label, priority]) => {
        if (carBits[index] === '1') {
            activeStatuses.push(label);
            // กำหนด Priority สูงสุด
            if (priority === 'error') highestPriority = 'error';
            else if (priority === 'warning' && highestPriority === 'normal') highestPriority = 'warning';
        }
    });

    if (activeStatuses.length === 0) {
        return { text: 'ปกติ / พร้อมใช้งาน', priority: 'normal', bits: carBits };
    }

    return {
        text: activeStatuses.join(', '),
        priority: highestPriority,
        bits: carBits
    };
};

// =========================================================
// 💡 Component Badge แสดงสถานะพร้อมสี (เพิ่มใหม่)
// =========================================================
// Map Priority ไปยัง Tailwind CSS classes
const liftStatusColorMap = {
    normal: "bg-emerald-500/15 text-emerald-700 border-emerald-200", // เขียว: ปกติ
    warning: "bg-amber-500/15 text-amber-700 border-amber-200",     // เหลือง: เตือน
    error: "bg-red-500/15 text-red-700 border-red-200",             // แดง: ข้อผิดพลาด
    critical: "bg-gray-500/15 text-gray-700 border-gray-200",       // เทา: ออฟไลน์/ไม่มีข้อมูล
};

function LiftStatusBadge({ status }) {
    const colorClass = liftStatusColorMap[status.priority] || liftStatusColorMap.normal;
    // ใช้สีพื้นหลังที่ชัดเจนขึ้นสำหรับวงกลม
    const dotColor = 
        status.priority === 'normal' ? 'bg-emerald-500' : 
        status.priority === 'warning' ? 'bg-amber-500' : 
        status.priority === 'error' ? 'bg-red-500' : 'bg-gray-500';

    return (
        <div 
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${colorClass}`}
            title={status.text} // เพิ่ม title สำหรับแสดงข้อความเต็ม
        >
            <span className={`h-2 w-2 rounded-full ${dotColor}`} />
            {/* แสดงข้อความสถานะหลัก หรือ ข้อความที่สั้นลงสำหรับหลายสถานะ */}
            {status.text.length > 30 ? 'หลายสถานะ' : status.text}
        </div>
    );
}
// ---------------------------------------------------------


function SectionHeader({ title, icon: Icon }) {
    return (
        <h2 className="flex items-center text-xl font-semibold mb-2 text-gray-700">
            <Icon className="h-5 w-5 mr-2 text-primary" />
            {title}
        </h2>
    );
}

function KPI({ label, value }) {
    const Icon = kpiIcons[label] || Building;
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Card className="shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                        <Icon className="h-4 w-4 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-semibold">{value}</div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function KPIRow({ list }) {
    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {list.map((k) => (
                <KPI key={k.label} {...k} />
            ))}
        </div>
    );
}

function UnassignedReports({ data }) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <SectionHeader title={`รายงานแจ้งปัญหาที่ยังไม่ได้มอบหมาย (${data.length})`} icon={ClipboardList} />
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">ไม่มีรายงานที่ยังไม่ได้มอบหมาย</p>
                ) : (
                    <div className="space-y-3">
                        {data.slice(0, 5).map(report => ( 
                            <div key={report.id} className="border-b pb-2">
                                <p className="text-sm font-medium text-gray-800">ลิฟต์ {report.lift} สถานที่ {report.org} / {report.building}</p>
                                <p className="text-xs text-muted-foreground truncate">{report.detail}</p>
                                <p className="text-xs text-red-500 mt-1">แจ้งเมื่อ: {report.date}</p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function OngoingTasks({ data }) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <SectionHeader title={`งานที่กำลังดำเนินการ (${data.length})`} icon={Wrench} />
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">ไม่มีงานที่กำลังดำเนินการ</p>
                ) : (
                    <div className="space-y-3">
                        {data.slice(0, 5).map(task => ( 
                            <div key={task.id} className="border-b pb-2">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-medium text-gray-800">{task.lift} - {task.site}</p>
                                    <Badge variant="secondary" className={`text-xs ${task.status === 'progress' ? 'bg-yellow-400' : 'bg-blue-400'}`}>
                                        {task.status.toUpperCase()}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">ช่าง: {task.tech || 'รอระบุ'}</p>
                                <p className="text-xs text-gray-500 mt-1">เริ่ม: {task.started}</p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// =========================================================
// 🔄 Component LiftStatusBoard (ปรับปรุงการแสดงผลเพื่อใช้ Badge)
// =========================================================
function LiftStatusBoard({ data }) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <SectionHeader title={`สถานะลิฟต์ (Bit Board)`} icon={Server} />
            </CardHeader>
            <CardContent className="h-[300px] overflow-y-auto">
                <div className="space-y-2">
                    {data.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">ไม่พบข้อมูลสถานะลิฟต์</p>
                    ) : (
                        data.slice(0, 10).map((lift) => {
                            // 1. คำนวณสถานะและ Priority
                            const carStatus = getCarStatus(lift.car); 

                            return (
                                <div key={lift.name} className="flex items-start justify-between border-b pb-2 pt-1">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm text-gray-800">{lift.name}</span>
                                        <span className="text-xs text-muted-foreground mt-1">
                                            ชั้น: <span className="font-medium text-primary">{lift.current}</span> | ทิศทาง: <span className="font-medium">{lift.dir}</span>
                                        </span>
                                    </div>

                                    {/* 2. แสดงผลด้วย Badge ที่มีสี */}
                                    <div className="flex flex-col items-end max-w-[50%] space-y-1">
                                        <LiftStatusBadge status={carStatus} />
                                        <span className="text-xs font-mono text-muted-foreground bg-gray-50 px-1 rounded" title="สถานะบิตดิบ">
                                            Bit: {carStatus.bits}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function ActivityFeed({ items }) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <SectionHeader title={`กิจกรรมล่าสุด (${items.length})`} icon={Activity} />
            </CardHeader>
            <CardContent className="h-[300px] overflow-y-auto">
                <div className="space-y-3">
                    {items.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">ไม่พบกิจกรรมล่าสุด</p>
                    ) : (
                        items.slice(0, 10).map((item, index) => ( 
                            <div key={index} className="flex text-sm">
                                <span className="font-mono text-xs text-primary mr-3">{item.time}</span>
                                <p className="text-xs text-gray-700">{item.text}</p>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function TopBar({ role, onRefresh }) {
    const roleTitle = 
        role === 'super_admin' ? 'Super Admin Dashboard' : 
        role === 'admin' ? 'Admin Dashboard' : 
        role === 'technician' ? 'Technician Dashboard' : 'User Dashboard';
        
    return (
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-800">{roleTitle}</h1>
            <div className="flex space-x-2">
                {/* ปุ่ม Refresh */}
                <Button variant="outline" size="sm" onClick={onRefresh} className="shadow-sm">
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    อัปเดตข้อมูล
                </Button>
            </div>
        </div>
    );
}


// Component สำหรับแสดงสถานะ Loading
function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">กำลังโหลดข้อมูล Dashboard...</p>
        </div>
    );
}

// Component สำหรับแสดงสถานะ Error
function ErrorState({ message, onRetry }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-lg border border-red-300 bg-red-50">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="mt-4 text-lg font-medium text-red-700">ไม่สามารถโหลดข้อมูลได้</p>
            <p className="text-sm text-red-500">{message}</p>
            <Button onClick={onRetry} className="mt-4" variant="destructive">ลองอีกครั้ง</Button>
        </div>
    );
}

// โครงสร้างเนื้อหา Dashboard
function DashboardContent({ role, data, onRefresh }) {
    // ใช้ || [] เพื่อป้องกันกรณีที่ข้อมูลเป็น null
    const kpiList = data.kpis || []; 
    
    return (
        <div className="space-y-4">
            <TopBar role={role} onRefresh={onRefresh} /> 
            <KPIRow list={kpiList} />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="xl:col-span-2 space-y-4">
                    <UnassignedReports data={data.reportsUnassigned || []} />
                    <OngoingTasks data={data.tasksOngoing || []} />
                </div>
                <div className="space-y-4">
                    <LiftStatusBoard data={data.liftBits || []} />
                    <ActivityFeed items={data.activity || []} />
                </div>
            </div>
        </div>
    );
}


/**
 * Main Dashboard Component
 */
export default function Dashboard({ role = "super_admin", orgId = null }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ฟังก์ชันโหลดข้อมูลหลัก
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // เรียกใช้ fetchDashboardData จาก service
            const result = await fetchDashboardData(role, orgId); 
            setData(result);
        } catch (err) {
            // จับ error จาก API
            setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อที่ไม่ทราบสาเหตุ');
        } finally {
            setLoading(false);
        }
    }, [role, orgId]);

    // โหลดข้อมูลเมื่อ Component ถูก Render หรือ role/orgId เปลี่ยน
    useEffect(() => {
        loadData();
    }, [loadData]); 

    // แสดงสถานะการโหลด
    if (loading) {
        return (
            <div className="mx-auto max-w-7xl p-4">
                <TopBar role={role} onRefresh={loadData} />
                <LoadingState />
            </div>
        );
    }

    // แสดงสถานะข้อผิดพลาด
    if (error || !data) {
        return (
            <div className="mx-auto max-w-7xl p-4">
                <TopBar role={role} onRefresh={loadData} />
                <ErrorState message={error} onRetry={loadData} />
            </div>
        );
    }

    // แสดง Dashboard เมื่อมีข้อมูล
    return (
        <div className="mx-auto max-w-7xl p-4">
            <DashboardContent role={role} data={data} onRefresh={loadData} />
        </div>
    );
}