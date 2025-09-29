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

function AdminAssignTask() {
  const [reports, setReports] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showAssign, setShowAssign] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedTech, setSelectedTech] = useState("");
  const [taskDetail, setTaskDetail] = useState("");

  // โหลด reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await tasksService.reports();
      if (res.success) setReports(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // โหลด technicians
  const fetchTechnicians = async () => {
    try {
      const res = await tasksService.technicians();
      if (res.success) setTechnicians(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchTechnicians();
  }, []);

  // ส่ง assign
  const handleAssign = async () => {
    if (!selectedReport || !selectedTech) return;
    try {
      const res = await tasksService.assign({
        rp_id: selectedReport.rp_id,
        user_id: selectedTech,
        tk_data: taskDetail,
      });
      if (res.success) {
        alert("✅ มอบหมายงานสำเร็จ!");
        setShowAssign(false);
        fetchReports(); // รีโหลด report
      } else {
        alert("❌ " + res.message);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error assigning task");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📋 มอบหมายงานให้ช่าง</h1>

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
                  <TableHead>องค์กร / อาคาร</TableHead>
                  <TableHead>ลิฟต์</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.rp_id}>
                    <TableCell>{r.date_rp}</TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {r.detail}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.org_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {r.building_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="px-2">
                        {r.lift_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {r.assigned_count > 0 ? (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          มอบหมายแล้ว
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700">
                          รอมอบหมาย
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        className={`px-4 ${r.assigned_count > 0
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow"
                          }`}
                        disabled={r.assigned_count > 0}
                        onClick={() => {
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

            <Button onClick={handleAssign} className="w-full">
              ✅ ยืนยันการมอบหมาย
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminAssignTask;
