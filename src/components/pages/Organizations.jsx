import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, AlertTriangle, Loader2 } from "lucide-react";

// ฟอร์มเพิ่ม/แก้ไของค์กร
const OrganizationForm = ({ org, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    id: org?.id || null,
    org_name: org?.org_name || '',
    description: org?.description || '',
  });
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      let response;
      if (formData.id) {
        response = await apiService.updateOrganization(formData.id, {
          org_name: formData.org_name,
          description: formData.description,
        });
      } else {
        response = await apiService.createOrganization({
          org_name: formData.org_name,
          description: formData.description,
        });
      }

      if (response.success) {
        onSuccess();
      } else {
        setFormError(response.message || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      setFormError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4 p-2" onSubmit={handleSubmit}>
      {formError && (
        <div className="p-2 bg-red-100 text-red-600 rounded">{formError}</div>
      )}
      <div>
        <label className="block mb-1 font-medium">
          ชื่อองค์กร <span className="text-red-500">*</span>
        </label>
        <Input
          name="org_name"
          value={formData.org_name}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          placeholder="กรุณาใส่ชื่อองค์กร"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">คำอธิบาย</label>
        <Textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          disabled={isSubmitting}
          placeholder="กรุณาใส่คำอธิบายองค์กร (ไม่บังคับ)"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          ยกเลิก
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            (formData.id ? "บันทึกการแก้ไข" : "เพิ่มองค์กร")
          )}
        </Button>
      </div>
    </form>
  );
};

// คอมโพเนนต์สำหรับแสดงผลบนหน้าจอมือถือ
const OrganizationCard = ({ org, index, onEdit, onDelete }) => (
  <Card key={org.id} className="mb-4 w-full">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>{org.org_name}</CardTitle>
      <div className="flex gap-2">
        <Button size="icon" variant="secondary" onClick={() => onEdit(org)}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="destructive" onClick={() => onDelete(org.id, org.org_name)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-gray-500 mb-2">No: {index + 1}</p>
      <p className="text-sm">{org.description || "ไม่มีคำอธิบาย"}</p>
    </CardContent>
  </Card>
);

const Organizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingOrg, setEditingOrg] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: "" });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    fetchOrganizations();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getOrganizations();
      if (response.success && Array.isArray(response.data)) {
        setOrganizations(response.data);
      } else {
        setOrganizations([]);
        if (!response.success) setError(response.message || "โหลดข้อมูลองค์กรไม่สำเร็จ");
      }
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteAction = async () => {
    try {
      const response = await apiService.deleteOrganization(confirmDelete.id);
      if (response.success) {
        fetchOrganizations();
      } else {
        alert(response.message || "ไม่สามารถลบองค์กรได้");
      }
    } catch (err) {
      alert(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setConfirmDelete({ open: false, id: null, name: "" });
    }
  };

  const openModal = (org = null) => {
    setEditingOrg(org);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingOrg(null);
    setIsModalOpen(false);
  };

  const handleFormSubmit = () => {
    closeModal();
    fetchOrganizations();
  };

  return (
    <div className="p-0 md:p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-xl">การจัดการองค์กร</CardTitle>
          <Button onClick={() => openModal()} className="flex-shrink-0">
            <Plus className="w-4 h-4 mr-2" /> เพิ่มองค์กร
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : error ? (
            <div className="p-4 bg-red-100 text-red-600 rounded">
              เกิดข้อผิดพลาด: {error}
              <Button className="mt-2" onClick={fetchOrganizations}>ลองใหม่</Button>
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-10 text-gray-400">ยังไม่มีข้อมูลองค์กร</div>
          ) : (
            <>
              {isMobile ? (
                <div className="space-y-4">
                  {organizations.map((org, index) => (
                    <OrganizationCard
                      key={org.id}
                      org={org}
                      index={index}
                      onEdit={openModal}
                      onDelete={(id, name) => setConfirmDelete({ open: true, id, name })}
                    />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">No</TableHead>
                      <TableHead>ชื่อองค์กร</TableHead>
                      <TableHead>คำอธิบาย</TableHead>
                      <TableHead className="text-center w-32">การจัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org, index) => (
                      <TableRow key={org.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{org.org_name}</TableCell>
                        <TableCell>{org.description || "-"}</TableCell>
                        <TableCell className="flex justify-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openModal(org)}>
                            <Edit className="w-4 h-4 mr-1" /> แก้ไข
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setConfirmDelete({ open: true, id: org.id, name: org.org_name })}
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> ลบ
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal ฟอร์มเพิ่ม/แก้ไข */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOrg ? "แก้ไของค์กร" : "เพิ่มองค์กรใหม่"}</DialogTitle>
            <DialogDescription>
              {editingOrg ? "กรุณาแก้ไขรายละเอียดขององค์กร" : "กรุณากรอกรายละเอียดขององค์กรที่ต้องการเพิ่ม"}
            </DialogDescription>
          </DialogHeader>
          <OrganizationForm
            org={editingOrg}
            onSuccess={handleFormSubmit}
            onCancel={closeModal}
          />
        </DialogContent>
      </Dialog>

      {/* Popup ยืนยันการลบ */}
      <Dialog open={confirmDelete.open} onOpenChange={(open) => !open && setConfirmDelete({ open: false, id: null, name: "" })}>
        <DialogContent>
          <DialogHeader className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <DialogTitle>ยืนยันการลบ</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </DialogDescription>
          <p className='text-center'>คุณแน่ใจหรือไม่ว่าต้องการลบองค์กร **{confirmDelete.name}**?</p>
          <div className="flex justify-center gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmDelete({ open: false, id: null, name: "" })}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAction}>
              ลบ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Organizations;