// src/components/pages/Buildings.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// UI Components & Icons
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogOverlay } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster, toast } from "sonner";
import { Plus, Edit, Trash2, AlertTriangle, Loader2, Building, ServerCrash } from "lucide-react";

/* ------------------------------------------------------
   คอมโพเนนต์ย่อยสำหรับสร้างสไตล์ที่สอดคล้องกัน
------------------------------------------------------ */

// Section: การ์ดหลักสไตล์กระจกฝ้า (Glassmorphism)
function Section({ title, description, right, children, className = "" }) {
  return (
    <section className={`rounded-2xl bg-white/80 backdrop-blur-md shadow-[0_12px_30px_-12px_rgba(2,6,23,0.25)] ring-1 ring-slate-200/80 ${className}`}>
      <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80">
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">{title}</h2>
          {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
        </div>
        <div>{right}</div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

// Popup (Modal) Wrapper: เพิ่ม Animation
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


// --- Form Component ---
const BuildingForm = ({ building, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({ id: building?.id || null, org_id: building?.org_id || '', building_name: building?.building_name || '', description: building?.description || '', address: building?.address || '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  useEffect(() => {
    const fetchOrgs = async () => {
        try {
            const response = await apiService.getOrganizations();
            if (response.success) setOrganizations(response.data || []);
        } catch (error) {
            toast.error("ไม่สามารถโหลดรายการองค์กรได้");
        } finally {
            setLoadingOrgs(false);
        }
    };
    fetchOrgs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.org_id || !formData.building_name.trim()) {
        toast.error("กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน");
        return;
    }
    setIsSubmitting(true);
    try {
      const submitData = { org_id: formData.org_id, building_name: formData.building_name.trim(), description: formData.description.trim(), address: formData.address.trim() };
      const response = formData.id ? await apiService.updateBuilding(formData.id, submitData) : await apiService.createBuilding(submitData);
      if (response.success) {
        toast.success(formData.id ? "แก้ไขข้อมูลอาคารสำเร็จ" : "เพิ่มอาคารใหม่สำเร็จ");
        onSuccess();
      } else {
        toast.error(response.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      toast.error(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="org_id">องค์กร <span className="text-red-500">*</span></Label>
        {loadingOrgs ? <div className="text-sm text-slate-500 py-2">กำลังโหลด...</div> : (
          <Select name="org_id" value={formData.org_id?.toString()} onValueChange={(val) => setFormData(p => ({...p, org_id: parseInt(val)}))} disabled={isSubmitting}>
            <SelectTrigger><SelectValue placeholder="-- เลือกองค์กร --" /></SelectTrigger>
            <SelectContent>{organizations.map(org => <SelectItem key={org.id} value={org.id.toString()}>{org.org_name}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>
      <div>
        <Label htmlFor="building_name">ชื่ออาคาร <span className="text-red-500">*</span></Label>
        <Input id="building_name" name="building_name" value={formData.building_name} onChange={(e) => setFormData(p => ({...p, building_name: e.target.value}))} disabled={isSubmitting} />
      </div>
      <div>
        <Label htmlFor="address">ที่อยู่</Label>
        <Textarea id="address" name="address" value={formData.address} onChange={(e) => setFormData(p => ({...p, address: e.target.value}))} disabled={isSubmitting} />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>ยกเลิก</Button>
        <Button type="submit" disabled={isSubmitting || loadingOrgs} className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md hover:opacity-95 transition-opacity">
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังบันทึก...</> : (formData.id ? 'บันทึกการแก้ไข' : 'เพิ่มอาคาร')}
        </Button>
      </div>
    </form>
  );
};


// --- Mobile Card (สไตล์ Glassmorphism) ---
const BuildingCard = ({ building, onEdit, onDelete }) => (
    <div className="rounded-xl p-4 bg-white/70 backdrop-blur shadow-lg ring-1 ring-slate-200/80 transition-shadow hover:shadow-xl">
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
                <h3 className="font-bold text-slate-800">{building.building_name}</h3>
                <p className="text-sm text-slate-600 mt-1">{building.org_name || '-'}</p>
                <p className="text-xs text-slate-500 mt-2 break-words">{building.address || "ไม่มีที่อยู่"}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <Button size="icon" variant="ghost" onClick={() => onEdit(building)} className="text-slate-500 hover:bg-blue-100 hover:text-blue-600"><Edit className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete(building.id, building.building_name)} className="text-slate-500 hover:bg-rose-100 hover:text-rose-600"><Trash2 className="w-4 h-4" /></Button>
            </div>
        </div>
    </div>
);

// --- Skeleton Loader ---
const PageSkeleton = () => (
    <Section title="การจัดการอาคาร" description="จัดการข้อมูลอาคารทั้งหมดในระบบของคุณ" right={<Skeleton className="h-10 w-36 rounded-lg" />}>
        <div className="space-y-4">
            <Skeleton className="h-10 w-64 rounded-lg" />
            <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
            </div>
        </div>
    </Section>
);

// --- Main Component ---
const Buildings = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: "" });
  const [filterOrgId, setFilterOrgId] = useState('all');
  const [organizations, setOrganizations] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { isAuthenticated } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const [orgResponse, buildingResponse] = await Promise.all([
            apiService.getOrganizations(),
            apiService.getBuildings()
        ]);

        if (orgResponse.success) {
            setOrganizations(orgResponse.data || []);
        } else {
            throw new Error('ไม่สามารถโหลดรายการองค์กรได้');
        }

        if (buildingResponse.success) {
            setBuildings(buildingResponse.data || []);
        } else {
            throw new Error('ไม่สามารถโหลดข้อมูลอาคารได้');
        }
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
        fetchData();
    } else {
        setError('โปรดเข้าสู่ระบบเพื่อดูข้อมูล');
        setLoading(false);
    }
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isAuthenticated, fetchData]);

  const handleDelete = async () => {
    try {
      const response = await apiService.deleteBuilding(confirmDelete.id);
      if (response.success) {
        toast.success(`ลบอาคาร "${confirmDelete.name}" สำเร็จ`);
        fetchData(); // Refetch all data for simplicity
      } else {
        toast.error(response.message || 'ไม่สามารถลบอาคารได้');
      }
    } catch (err) {
      toast.error(err.message || 'เกิดข้อผิดพลาดในการลบ');
    } finally {
      setConfirmDelete({ open: false, id: null, name: "" });
    }
  };

  const openModal = (building = null) => { setEditingBuilding(building); setIsModalOpen(true); };
  const closeModal = () => setIsModalOpen(false);
  const handleFormSubmit = () => { closeModal(); fetchData(); };

  const filteredBuildings = buildings.filter(b => filterOrgId === 'all' || b.org_id === parseInt(filterOrgId));

  if (loading) return <div className="min-h-screen p-6"><PageSkeleton /></div>;

  if (error && !isAuthenticated) {
    return <div className="flex items-center justify-center h-screen text-slate-600">{error}</div>;
  }

  return (
    <>
      <Toaster richColors position="top-right" />
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200 text-slate-800 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Section
            title="การจัดการอาคาร"
            description="จัดการข้อมูลอาคารทั้งหมดในระบบของคุณ"
            right={
              <Button onClick={() => openModal()} className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md hover:opacity-95 transition-opacity">
                <Plus className="w-4 h-4 mr-2" /> เพิ่มอาคาร
              </Button>
            }
          >
            {error && <div className="p-3 mb-4 bg-rose-50 text-rose-700 rounded-lg">{error}</div>}
            
            <div className="flex items-center gap-2 mb-4">
                <Label htmlFor="org-filter" className="flex-shrink-0">กรองตามองค์กร:</Label>
                <Select id="org-filter" value={filterOrgId} onValueChange={setFilterOrgId}>
                    <SelectTrigger className="w-full sm:w-[250px] bg-white/70"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">-- แสดงทั้งหมด --</SelectItem>
                        {organizations.map(org => <SelectItem key={org.id} value={org.id.toString()}>{org.org_name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {filteredBuildings.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <Building className="w-12 h-12 mx-auto mb-2" />
                    <p>ไม่พบข้อมูลอาคารที่ตรงกับเงื่อนไข</p>
                </div>
            ) : isMobile ? (
                <div className="space-y-4">
                    {filteredBuildings.map(b => <BuildingCard key={b.id} building={b} onEdit={openModal} onDelete={(id, name) => setConfirmDelete({ open: true, id, name })} />)}
                </div>
            ) : (
                <Table>
                    <TableHeader><TableRow>
                        <TableHead className="w-[50px]">No</TableHead>
                        <TableHead>ชื่ออาคาร</TableHead>
                        <TableHead>องค์กร</TableHead>
                        <TableHead>ที่อยู่</TableHead>
                        <TableHead className="text-center w-32">จัดการ</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                        {filteredBuildings.map((b, i) => (
                            <TableRow key={b.id} className="hover:bg-slate-50/80">
                                <TableCell>{i + 1}</TableCell>
                                <TableCell className="font-medium text-slate-800">{b.building_name}</TableCell>
                                <TableCell>{b.org_name || '-'}</TableCell>
                                <TableCell className="text-slate-600 max-w-xs truncate">{b.address || '-'}</TableCell>
                                <TableCell className="flex justify-center gap-2">
                                    <Button size="sm" variant="outline" onClick={() => openModal(b)} className="bg-white/50"><Edit className="w-4 h-4 mr-1" /> แก้ไข</Button>
                                    <Button size="sm" variant="destructive" onClick={() => setConfirmDelete({ open: true, id: b.id, name: b.building_name })}><Trash2 className="w-4 h-4 mr-1" /> ลบ</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
          </Section>

          <div className="text-center text-slate-500 text-xs">ระบบจัดการข้อมูลอาคาร © {new Date().getFullYear()}</div>
        </div>

        {/* --- Modals --- */}
        <AnimatedModal open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full ring-1 ring-slate-200">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900">{editingBuilding?.id ? "แก้ไขข้อมูลอาคาร" : "เพิ่มอาคารใหม่"}</DialogTitle>
                    <DialogDescription>กรอกข้อมูลอาคารให้ครบถ้วน</DialogDescription>
                </DialogHeader>
                <BuildingForm building={editingBuilding} onSuccess={handleFormSubmit} onCancel={closeModal} />
            </DialogContent>
        </AnimatedModal>

        <AnimatedModal open={confirmDelete.open} onOpenChange={(open) => !open && setConfirmDelete({ open: false, id: null, name: "" })}>
            <DialogContent className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full ring-1 ring-slate-200">
                <DialogHeader className="flex flex-row items-center gap-2 text-rose-600">
                    <AlertTriangle className="w-5 h-5" /><DialogTitle>ยืนยันการลบ</DialogTitle>
                </DialogHeader>
                <p className='py-4 text-center text-slate-600'>ต้องการลบอาคาร <strong className="text-rose-700">{confirmDelete.name}</strong> ใช่หรือไม่?</p>
                <div className="flex justify-end gap-2 mt-2">
                    <Button variant="ghost" onClick={() => setConfirmDelete({ open: false, id: null, name: "" })}>ยกเลิก</Button>
                    <Button variant="destructive" onClick={handleDelete}>ยืนยันการลบ</Button>
                </div>
            </DialogContent>
        </AnimatedModal>
      </div>
    </>
  );
};

export default Buildings;