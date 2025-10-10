// src/components/pages/Organizations.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion"; // เพิ่ม framer-motion สำหรับ animation
import { apiService } from '../../services/api';

// UI Components & Icons (เหมือนเดิม)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogOverlay } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster, toast } from "sonner";
import { Plus, Edit, Trash2, AlertTriangle, Loader2, Building, ServerCrash, Palette } from "lucide-react";

/* ------------------------------------------------------
   คอมโพเนนต์ย่อยที่นำสไตล์มาจาก ElevatorDetail.jsx
------------------------------------------------------ */

// Section: การ์ดหลักสไตล์กระจกฝ้า (Glassmorphism)
function Section({ title, right, children, className = "" }) {
  return (
    <section className={`rounded-2xl p-6 bg-white/80 backdrop-blur-md shadow-[0_12px_30px_-12px_rgba(2,6,23,0.25)] ring-1 ring-slate-200/80 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">{title}</h2>
          {/* สามารถเพิ่ม description ได้ที่นี่ */}
        </div>
        <div>{right}</div>
      </div>
      {children}
    </section>
  );
}

// Popup (Modal) Wrapper: เพิ่ม Animation ให้กับ Dialog ของ ShadCN
function AnimatedModal({ children, open, onOpenChange }) {
    return (
        <AnimatePresence>
            {open && (
                <Dialog open={open} onOpenChange={onOpenChange}>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <DialogOverlay className="bg-black/40 backdrop-blur-sm" />
                    </motion.div>
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                    >
                        {children}
                    </motion.div>
                </Dialog>
            )}
        </AnimatePresence>
    );
}

// --- Form Component (ปรับสไตล์ปุ่ม) ---
const OrganizationForm = ({ org, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({ id: org?.id || null, org_name: org?.org_name || '', description: org?.description || '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { org_name: formData.org_name, description: formData.description };
      const response = formData.id
        ? await apiService.updateOrganization(formData.id, payload)
        : await apiService.createOrganization(payload);

      if (response.success) {
        toast.success(formData.id ? "แก้ไของค์กรสำเร็จ!" : "เพิ่มองค์กรใหม่สำเร็จ!");
        onSuccess();
      } else {
        toast.error(response.message || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block mb-1 text-sm font-medium text-slate-700">ชื่อองค์กร <span className="text-red-500">*</span></label>
        <Input name="org_name" value={formData.org_name} onChange={(e) => setFormData({...formData, org_name: e.target.value})} required disabled={isSubmitting} placeholder="กรุณาใส่ชื่อองค์กร" />
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium text-slate-700">คำอธิบาย</label>
        <Textarea name="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} disabled={isSubmitting} placeholder="กรุณาใส่คำอธิบายองค์กร (ไม่บังคับ)" />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>ยกเลิก</Button>
        <Button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md hover:opacity-95 transition-opacity">
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังบันทึก...</> : (formData.id ? "บันทึกการแก้ไข" : "เพิ่มองค์กร")}
        </Button>
      </div>
    </form>
  );
};


// --- Mobile View Card Component (ปรับสไตล์เป็นกระจกฝ้า) ---
const OrganizationCard = ({ org, onEdit, onDelete }) => (
  <div className="rounded-xl p-4 bg-white/70 backdrop-blur shadow-lg ring-1 ring-slate-200/80 transition-shadow hover:shadow-xl">
    <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
            <h3 className="font-bold text-slate-800">{org.org_name}</h3>
            <p className="text-sm text-slate-500 mt-1 break-words">{org.description || "ไม่มีคำอธิบาย"}</p>
        </div>
        <div className="flex gap-2">
            <Button size="icon" variant="ghost" onClick={() => onEdit(org)} className="text-slate-500 hover:bg-blue-100 hover:text-blue-600"><Edit className="w-4 h-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => onDelete(org.id, org.org_name)} className="text-slate-500 hover:bg-rose-100 hover:text-rose-600"><Trash2 className="w-4 h-4" /></Button>
        </div>
    </div>
  </div>
);

// --- Main Component ---
const Organizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingOrg, setEditingOrg] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: "" });

  const fetchOrganizations = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await apiService.getOrganizations();
      if (response.success && Array.isArray(response.data)) {
        setOrganizations(response.data);
      } else {
        setError(response.message || "โหลดข้อมูลไม่สำเร็จ");
      }
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    fetchOrganizations();
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchOrganizations]);

  const confirmDeleteAction = async () => {
    try {
      const response = await apiService.deleteOrganization(confirmDelete.id);
      if (response.success) {
        toast.success(`ลบองค์กร "${confirmDelete.name}" สำเร็จ`);
        fetchOrganizations();
      } else {
        toast.error(response.message || "ไม่สามารถลบองค์กรได้");
      }
    } catch (err) {
      toast.error(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setConfirmDelete({ open: false, id: null, name: "" });
    }
  };

  const openModal = (org = null) => { setEditingOrg(org); setIsModalOpen(true); };
  const closeModal = () => setIsModalOpen(false);
  const handleFormSubmit = () => { closeModal(); fetchOrganizations(); };
  
  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-10 text-slate-500">กำลังโหลดข้อมูล...</div>;
    }
    if (error) {
      return (
        <Section title="เกิดข้อผิดพลาด">
          <div className="text-center py-10 px-4 text-rose-700">
            <ServerCrash className="w-12 h-12 mx-auto mb-2" />
            <p>{error}</p>
            <Button onClick={fetchOrganizations} className="mt-4">ลองใหม่</Button>
          </div>
        </Section>
      );
    }
    if (organizations.length === 0) {
      return (
        <Section title=" " right={<></>}>
            <div className="text-center py-16 px-4">
                <Building className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700">ยังไม่มีข้อมูลองค์กร</h3>
                <p className="text-slate-500 mt-1">เริ่มต้นด้วยการเพิ่มองค์กรแรกของคุณ</p>
            </div>
        </Section>
      );
    }
    
    return isMobile ? (
        <div className="space-y-4">
          {organizations.map((org) => <OrganizationCard key={org.id} org={org} onEdit={openModal} onDelete={(id, name) => setConfirmDelete({ open: true, id, name })} />)}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">No</TableHead>
              <TableHead>ชื่อองค์กร</TableHead>
              <TableHead>คำอธิบาย</TableHead>
              <TableHead className="text-center w-40">การจัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((org, index) => (
              <TableRow key={org.id} className="hover:bg-slate-50/80">
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium text-slate-800">{org.org_name}</TableCell>
                <TableCell className="whitespace-normal text-slate-600">{org.description || "-"}</TableCell>
                <TableCell className="flex justify-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => openModal(org)} className="bg-white/50">
                    <Edit className="w-4 h-4 mr-1" /> แก้ไข
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setConfirmDelete({ open: true, id: org.id, name: org.org_name })}>
                    <Trash2 className="w-4 h-4 mr-1" /> ลบ
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    );
  };

  return (
    <>
      <Toaster richColors position="top-right" />
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200 text-slate-800 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Section
            title="การจัดการองค์กร"
            right={
              <Button onClick={() => openModal()} className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md hover:opacity-95 transition-opacity">
                <Plus className="w-4 h-4 mr-2" /> เพิ่มองค์กรใหม่
              </Button>
            }
          >
            {renderContent()}
          </Section>
          <div className="text-center text-slate-500 text-xs">ระบบจัดการข้อมูลองค์กร © 2025</div>
        </div>

        {/* --- Add/Edit Modal --- */}
        <AnimatedModal open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full ring-1 ring-slate-200">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900">{editingOrg ? "แก้ไของค์กร" : "เพิ่มองค์กรใหม่"}</DialogTitle>
                    <DialogDescription>{editingOrg ? "กรุณาแก้ไขรายละเอียดขององค์กร" : "กรุณากรอกรายละเอียดขององค์กรที่ต้องการเพิ่ม"}</DialogDescription>
                </DialogHeader>
                <OrganizationForm org={editingOrg} onSuccess={handleFormSubmit} onCancel={closeModal} />
            </DialogContent>
        </AnimatedModal>

        {/* --- Delete Confirmation Modal --- */}
        <AnimatedModal open={confirmDelete.open} onOpenChange={(open) => !open && setConfirmDelete({ open: false, id: null, name: "" })}>
            <DialogContent className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full ring-1 ring-slate-200">
                <DialogHeader className="flex flex-row items-center gap-2 text-rose-600">
                    <AlertTriangle className="w-5 h-5" />
                    <DialogTitle>ยืนยันการลบ</DialogTitle>
                </DialogHeader>
                <p className='py-4 text-center text-slate-600'>คุณแน่ใจหรือไม่ว่าต้องการลบองค์กร <strong className="text-rose-700">{confirmDelete.name}</strong>?</p>
                <div className="flex justify-end gap-2 mt-2">
                    <Button variant="ghost" onClick={() => setConfirmDelete({ open: false, id: null, name: "" })}>ยกเลิก</Button>
                    <Button variant="destructive" onClick={confirmDeleteAction}>ยืนยันการลบ</Button>
                </div>
            </DialogContent>
        </AnimatedModal>
      </div>
    </>
  );
};

export default Organizations;