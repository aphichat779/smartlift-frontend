// src/pages/AdminAssignTask.jsx
import React, { useEffect, useState } from "react";
import { tasksService } from "../../services/tasksService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

// Helper Component สำหรับแสดงรายละเอียดใน Dialog
const DetailItem = ({ label, value, fullWidth = false }) => (
  <div className={`${fullWidth ? "col-span-2" : "col-span-1"} flex flex-col`}>
    <span className="text-xs font-medium text-gray-500">{label}</span>
    <span className="text-sm font-semibold text-gray-800 break-words">
      {value || <span className="text-gray-400">—</span>}
    </span>
  </div>
);

function AdminAssignTask() {
  const [reports, setReports] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);

  // assign dialog
  const [showAssign, setShowAssign] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedTech, setSelectedTech] = useState("");
  const [taskDetail, setTaskDetail] = useState("");
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [assignedBy, setAssignedBy] = useState(""); // auto from profile

  // detail dialog (ใหม่)
  const [showDetail, setShowDetail] = useState(false);
  const [detailReport, setDetailReport] = useState(null);

  // create report dialog
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [lifts, setLifts] = useState([]);
  const [newRp, setNewRp] = useState({
    date_rp: "",
    org_id: "",
    building_id: "",
    lift_id: "",
    detail: "",
  });

  // อ่านชื่อผู้มอบจาก localStorage (ไม่ให้แก้ใน UI)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("profile") || localStorage.getItem("user");
      if (raw) {
        const p = JSON.parse(raw);
        const display =
          p?.first_name || p?.last_name
            ? `${p.first_name || ""} ${p.last_name || ""}`.trim()
            : p?.username || "";
        if (display) setAssignedBy(display);
      }
    } catch {}
  }, []);

  // โหลดรายการแจ้งและช่าง
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

  // =============== Assign Handlers ===============
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
        start_date: startDate || null, // เฉพาะวัน
        assigned_by: assignedBy || "Unknown", // BE จะตีค่าจาก token เองอยู่แล้ว
      };

      const res = await tasksService.assign(payload);

      if (res?.success) {
        alert("✅ มอบหมายงานสำเร็จ!");
        setShowAssign(false);
        setSelectedTech("");
        setTaskDetail("");
        setStartDate("");
        fetchReports(); // รีโหลด
      } else {
        alert("❌ " + (res?.message || "Assign failed"));
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error assigning task");
    }
  };

  // =============== Detail Handler (ใหม่) ===============
  const handleViewDetail = (report) => {
    setDetailReport(report);
    setShowDetail(true);
  };

  // =============== Create Report (popup) ===============
  const loadOrgs = async () => {
    try {
      const res = await tasksService.workOrgs();
      if (res?.success) setOrgs(res.data?.orgs || []);
    } catch (e) {
      console.error("load orgs failed", e);
    }
  };
  const loadBuildings = async (org_id) => {
    try {
      if (!org_id) {
        setBuildings([]);
        return;
      }
      const res = await tasksService.workBuildings(org_id);
      if (res?.success) setBuildings(res.data?.buildings || []);
    } catch (e) {
      console.error("load buildings failed", e);
    }
  };
  const loadLifts = async (building_id) => {
    try {
      if (!building_id) {
        setLifts([]);
        return;
      }
      const res = await tasksService.workLifts(building_id);
      if (res?.success) setLifts(res.data?.lifts || []);
    } catch (e) {
      console.error("load lifts failed", e);
    }
  };

  // เปิด popup → โหลด orgs + ตั้งค่า default วันเป็นวันนี้ถ้ายังว่าง
  useEffect(() => {
    if (!showCreateReport) return;
    loadOrgs();
    setNewRp((s) => ({
      ...s,
      date_rp: s.date_rp || new Date().toISOString().slice(0, 10),
    }));
  }, [showCreateReport]);

  // cascading: org -> buildings -> lifts
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
        setNewRp({
          date_rp: "",
          org_id: "",
          building_id: "",
          lift_id: "",
          detail: "",
        });
        // เปิด dialog มอบหมายต่อ
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

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">📋 มอบหมายงานให้ช่าง</h1>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => setShowCreateReport(true)}
        >
          ➕ สร้างงานใหม่
        </Button>
      </div>

      <Card className="shadow-lg border">
        <CardHeader>
          <CardTitle>รายการแจ้งซ่อมที่รอดำเนินการ</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500">กำลังโหลด...</p>
          ) : reports.length === 0 ? (
            <p className="text-gray-500">ไม่มีรายการแจ้งซ่อม</p>
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
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow
                    key={r.rp_id}
                    // 👇 เพิ่ม onClick และ cursor เพื่อให้คลิกดูรายละเอียดได้
                    onClick={() => handleViewDetail(r)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <TableCell>{r.date_rp}</TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {r.detail}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {r.org_name} / {r.building_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {r.lift_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {r.start_date || <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>
                      {r.assigned_by || <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {r.assigned_count > 0 ? (
                        <div className="flex flex-col items-center gap-1">
                          <Badge className="bg-emerald-100 text-emerald-700">
                            มอบหมายแล้ว
                          </Badge>
                          <div className="text-xs text-gray-600">
                            {r.assigned_tech_name ||
                              r.technician_name ||
                              r.assigned_to ||
                              "—"}
                          </div>
                        </div>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700">
                          รอมอบหมาย
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        className={`px-4 ${
                          r.assigned_count > 0
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow"
                        }`}
                        disabled={r.assigned_count > 0}
                        onClick={(e) => {
                          // 🛑 สำคัญ: หยุด event propagation ไม่ให้คลิกปุ่มไปเปิด Dialog รายละเอียด
                          e.stopPropagation();
                          setSelectedReport(r);
                          setShowAssign(true);
                        }}
                      >
                        มอบหมาย
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog มอบหมาย */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>มอบหมายงานให้ช่าง</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm text-gray-600">
                <strong>เคส:</strong> {selectedReport?.detail}
              </p>
              <p className="text-sm text-gray-600">
                <strong>อาคาร:</strong> {selectedReport?.org_name} /{" "}
                {selectedReport?.building_name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>ลิฟต์:</strong> {selectedReport?.lift_name}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">เลือกช่าง</label>
              <Select value={selectedTech} onValueChange={setSelectedTech}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกช่าง" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.first_name} {t.last_name} ({t.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                รายละเอียดงาน
              </label>
              <Input
                type="text"
                value={taskDetail}
                onChange={(e) => setTaskDetail(e.target.value)}
                placeholder="ระบุรายละเอียดเพิ่มเติม"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                วันเริ่มงาน (กำหนด)
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                จะถูกบันทึกเป็น <code>start_date</code> (DATE)
              </p>
            </div>

            <Button onClick={handleAssign} className="w-full">
              ✅ ยืนยันการมอบหมาย
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* --- Dialog รายละเอียด (ใหม่) --- */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>🔍 รายละเอียดแจ้งซ่อม</DialogTitle>
          </DialogHeader>
          {detailReport && (
            <div className="space-y-3 p-2">
              <div className="grid grid-cols-2 gap-3">
                <DetailItem label="Report ID" value={detailReport.rp_id} />
                <DetailItem label="วันที่แจ้ง" value={detailReport.date_rp} />
              </div>
              <DetailItem label="องค์กร" value={detailReport.org_name} />
              <DetailItem label="อาคาร" value={detailReport.building_name} />
              <DetailItem label="ลิฟต์" value={detailReport.lift_name} />
              <DetailItem
                label="รายละเอียดแจ้งซ่อม"
                value={detailReport.detail}
                fullWidth
              />
              <div className="border-t pt-3 space-y-2">
                <p className="text-md font-semibold text-blue-700">สถานะงาน</p>
                <DetailItem
                  label="วันเริ่มงานที่กำหนด"
                  value={detailReport.start_date}
                />
                <DetailItem
                  label="มอบหมายโดย"
                  value={detailReport.assigned_by}
                />
                {detailReport.assigned_count > 0 && (
                  <DetailItem
                    label="ช่างที่ได้รับมอบหมาย"
                    value={
                      detailReport.assigned_tech_name ||
                      detailReport.technician_name ||
                      detailReport.assigned_to
                    }
                  />
                )}
              </div>
            </div>
          )}
          <Button onClick={() => setShowDetail(false)} className="w-full">
            ปิด
          </Button>
        </DialogContent>
      </Dialog>
      {/* --- END Dialog รายละเอียด --- */}


      {/* Dialog สร้างงานใหม่ */}
      <Dialog open={showCreateReport} onOpenChange={setShowCreateReport}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>➕ สร้างงานใหม่ (สร้าง Report)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">วันที่แจ้ง</label>
                <Input
                  type="date"
                  value={newRp.date_rp}
                  onChange={(e) =>
                    setNewRp({ ...newRp, date_rp: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">องค์กร</label>
                <Select
                  value={newRp.org_id?.toString() || ""}
                  onValueChange={(v) => setNewRp({ ...newRp, org_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกองค์กร" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgs.map((o) => (
                      <SelectItem key={o.id} value={o.id.toString()}>
                        {o.org_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1">อาคาร</label>
                <Select
                  value={newRp.building_id?.toString() || ""}
                  onValueChange={(v) => setNewRp({ ...newRp, building_id: v })}
                  disabled={!newRp.org_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกอาคาร" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        {b.building_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1">ลิฟต์</label>
                <Select
                  value={newRp.lift_id?.toString() || ""}
                  onValueChange={(v) => setNewRp({ ...newRp, lift_id: v })}
                  disabled={!newRp.building_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกลิฟต์" />
                  </SelectTrigger>
                  <SelectContent>
                    {lifts.map((l) => (
                      <SelectItem key={l.id} value={l.id.toString()}>
                        {l.lift_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">รายละเอียด</label>
              <Input
                type="text"
                value={newRp.detail}
                onChange={(e) => setNewRp({ ...newRp, detail: e.target.value })}
                placeholder="เช่น ประตูไม่สนิท ชำรุดที่ชั้น 7"
              />
            </div>

            <Button className="w-full" onClick={handleCreateReport}>
              📌 สร้าง Report
            </Button>

            <p className="text-xs text-gray-500">
              สร้างรายงานเสร็จ ระบบจะเปิดหน้ามอบหมายงานต่อให้ทันที
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminAssignTask;