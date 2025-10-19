// src/components/pages/OrgAndBuildings.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiService } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Toaster, toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Loader2,
  Building as BuildingIcon,
} from "lucide-react";

/* ------------------------------------------
   Shared layout components
------------------------------------------ */

function Section({ title, description, right, children, className = "" }) {
  return (
    <section
      className={`rounded-2xl bg-white/80 backdrop-blur-md shadow-[0_12px_30px_-12px_rgba(2,6,23,0.25)] ring-1 ring-slate-200/80 ${className}`}
    >
      <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80">
        <div className="flex-1">
          {title && (
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          )}
        </div>
        <div>{right}</div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

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

/* ------------------------------------------
   Organization form & cards (address แทน description)
------------------------------------------ */

const OrganizationForm = ({ org, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    id: org?.id || null,
    org_name: org?.org_name || "",
    address: org?.address || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        org_name: formData.org_name,
        address: formData.address,
      };
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
        <label className="block mb-1 text-sm font-medium text-slate-700">
          ชื่อองค์กร <span className="text-red-500">*</span>
        </label>
        <Input
          name="org_name"
          value={formData.org_name}
          onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
          required
          disabled={isSubmitting}
          placeholder="กรุณาใส่ชื่อองค์กร"
        />
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium text-slate-700">
          ที่อยู่
        </label>
        <Textarea
          name="address"
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          disabled={isSubmitting}
          placeholder="กรุณาใส่ที่อยู่องค์กร (ไม่บังคับ)"
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          ยกเลิก
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md hover:opacity-95 transition-opacity"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังบันทึก...
            </>
          ) : formData.id ? (
            "บันทึกการแก้ไข"
          ) : (
            "เพิ่มองค์กร"
          )}
        </Button>
      </div>
    </form>
  );
};

const OrganizationCard = ({ org, onEdit, onDelete }) => (
  <div className="rounded-xl p-4 bg-white/70 backdrop-blur shadow-lg ring-1 ring-slate-200/80 transition-shadow hover:shadow-xl">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <h3 className="font-bold text-slate-800">{org.org_name}</h3>
        <p className="text-sm text-slate-500 mt-1 break-words">
          {org.address || "ไม่มีที่อยู่"}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onEdit(org)}
          className="text-slate-500 hover:bg-blue-100 hover:text-blue-600"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onDelete(org.id, org.org_name)}
          className="text-slate-500 hover:bg-rose-100 hover:text-rose-600"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
);

/* ------------------------------------------
   Building form & cards (ลบ description/address)
------------------------------------------ */

const BuildingForm = ({ building, onSuccess, onCancel, organizations }) => {
  const [formData, setFormData] = useState({
    id: building?.id || null,
    org_id: building?.org_id || "",
    building_name: building?.building_name || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.org_id || !formData.building_name.trim()) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน");
      return;
    }
    setIsSubmitting(true);
    try {
      const submitData = {
        org_id: formData.org_id,
        building_name: formData.building_name.trim(),
      };
      const response = formData.id
        ? await apiService.updateBuilding(formData.id, submitData)
        : await apiService.createBuilding(submitData);

      if (response.success) {
        toast.success(formData.id ? "แก้ไขข้อมูลอาคารสำเร็จ" : "เพิ่มอาคารใหม่สำเร็จ");
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
        <Label htmlFor="org_id">
          องค์กร <span className="text-red-500">*</span>
        </Label>
        <Select
          name="org_id"
          value={formData.org_id?.toString()}
          onValueChange={(val) =>
            setFormData((p) => ({ ...p, org_id: parseInt(val) }))
          }
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="-- เลือกองค์กร --" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id.toString()}>
                {org.org_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="building_name">
          ชื่ออาคาร <span className="text-red-500">*</span>
        </Label>
        <Input
          id="building_name"
          name="building_name"
          value={formData.building_name}
          onChange={(e) =>
            setFormData((p) => ({ ...p, building_name: e.target.value }))
          }
          disabled={isSubmitting}
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          ยกเลิก
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md hover:opacity-95 transition-opacity"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังบันทึก...
            </>
          ) : formData.id ? (
            "บันทึกการแก้ไข"
          ) : (
            "เพิ่มอาคาร"
          )}
        </Button>
      </div>
    </form>
  );
};

const BuildingCard = ({ building, onEdit, onDelete }) => (
  <div className="rounded-xl p-4 bg-white/70 backdrop-blur shadow-lg ring-1 ring-slate-200/80 transition-shadow hover:shadow-xl">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <h3 className="font-bold text-slate-800">{building.building_name}</h3>
        <p className="text-sm text-slate-600 mt-1">{building.org_name || "-"}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onEdit(building)}
          className="text-slate-500 hover:bg-blue-100 hover:text-blue-600"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onDelete(building.id, building.building_name)}
          className="text-slate-500 hover:bg-rose-100 hover:text-rose-600"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
);

/* ------------------------------------------
   Skeleton
------------------------------------------ */

const PageSkeleton = () => (
  <Section
    title="ข้อมูล"
    right={<Skeleton className="h-10 w-36 rounded-lg" />}
  >
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

/* ------------------------------------------
   Main combined page
------------------------------------------ */

const OrgAndBuildings = () => {
  // --- ผูกแท็บกับ URL ---
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "buildings" ? "buildings" : "organizations";
  const [tab, setTab] = useState(initialTab);

  // sync เมื่อ URL เปลี่ยนจากการกด back/forward
  useEffect(() => {
    const t = searchParams.get("tab") === "buildings" ? "buildings" : "organizations";
    setTab(t);
  }, [searchParams]);

  const handleTabChange = (value) => {
    setTab(value);
    if (value === "organizations") {
      setSearchParams({}); // ล้างให้เป็นค่าเริ่มต้น URL สวยๆ
    } else {
      setSearchParams({ tab: value });
    }
  };

  const [organizations, setOrganizations] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orgError, setOrgError] = useState(null);
  const [bldError, setBldError] = useState(null);

  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);

  const [isBldModalOpen, setIsBldModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    type: null, // 'org' | 'building'
    id: null,
    name: "",
  });

  const [filterOrgId, setFilterOrgId] = useState("all");
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const { isAuthenticated } = useAuth();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setOrgError(null);
    setBldError(null);
    try {
      const [orgRes, bldRes] = await Promise.all([
        apiService.getOrganizations(),
        apiService.getBuildings(),
      ]);

      if (orgRes.success && Array.isArray(orgRes.data)) {
        setOrganizations(orgRes.data);
      } else {
        setOrgError(orgRes.message || "โหลดข้อมูลองค์กรไม่สำเร็จ");
      }

      if (bldRes.success && Array.isArray(bldRes.data)) {
        setBuildings(bldRes.data);
      } else {
        setBldError(bldRes.message || "โหลดข้อมูลอาคารไม่สำเร็จ");
      }
    } catch (err) {
      setOrgError(err.message || "เกิดข้อผิดพลาดขณะโหลดข้อมูลองค์กร");
      setBldError(err.message || "เกิดข้อผิดพลาดขณะโหลดข้อมูลอาคาร");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setOrgError("โปรดเข้าสู่ระบบเพื่อดูข้อมูล");
      setBldError("โปรดเข้าสู่ระบบเพื่อดูข้อมูล");
      setLoading(false);
      return;
    }
    fetchAll();
  }, [isAuthenticated, fetchAll]);

  useEffect(() => {
    const onResize = () =>
      setIsMobile(typeof window !== "undefined" ? window.innerWidth < 768 : false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const doConfirmDelete = async () => {
    const { type, id, name } = confirmDelete;
    try {
      if (type === "org") {
        const res = await apiService.deleteOrganization(id);
        if (res.success) {
          toast.success(`ลบองค์กร "${name}" สำเร็จ`);
          setFilterOrgId((prev) => (prev !== "all" && parseInt(prev) === id ? "all" : prev));
        } else {
          toast.error(res.message || "ไม่สามารถลบองค์กรได้");
        }
      } else if (type === "building") {
        const res = await apiService.deleteBuilding(id);
        if (res.success) {
          toast.success(`ลบอาคาร "${name}" สำเร็จ`);
        } else {
          toast.error(res.message || "ไม่สามารถลบอาคารได้");
        }
      }
      await fetchAll();
    } catch (err) {
      toast.error(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setConfirmDelete({ open: false, type: null, id: null, name: "" });
    }
  };

  const openOrgModal = (org = null) => {
    setEditingOrg(org);
    setIsOrgModalOpen(true);
  };
  const closeOrgModal = () => setIsOrgModalOpen(false);
  const openBldModal = (b = null) => {
    setEditingBuilding(b);
    setIsBldModalOpen(true);
  };
  const closeBldModal = () => setIsBldModalOpen(false);

  const onOrgSaved = async () => {
    closeOrgModal();
    await fetchAll();
  };
  const onBldSaved = async () => {
    closeBldModal();
    await fetchAll();
  };

  const filteredBuildings = buildings.filter(
    (b) => filterOrgId === "all" || b.org_id === parseInt(filterOrgId)
  );

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <Toaster richColors position="top-right" />
        <PageSkeleton />
      </div>
    );
  }

  return (
    <>
      <Toaster richColors position="top-right" />
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200 text-slate-800 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="bg-white/70 backdrop-blur rounded-xl p-1 shadow ring-1 ring-slate-200/70">
              <TabsTrigger value="organizations" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg">
                องค์กร
              </TabsTrigger>
              <TabsTrigger value="buildings" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg">
                อาคาร
              </TabsTrigger>
            </TabsList>

            {/* -------- Organizations Tab -------- */}
            <TabsContent value="organizations">
              <Section
                title="การจัดการองค์กร"
                right={
                  <Button
                    onClick={() => openOrgModal()}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md hover:opacity-95 transition-opacity"
                  >
                    <Plus className="w-4 h-4 mr-2" /> เพิ่มองค์กรใหม่
                  </Button>
                }
              >
                {orgError && (
                  <div className="p-3 mb-4 bg-rose-50 text-rose-700 rounded-lg">
                    {orgError}
                  </div>
                )}

                {(!organizations || organizations.length === 0) && !orgError ? (
                  <div className="text-center py-16 px-4">
                    <BuildingIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700">
                      ยังไม่มีข้อมูลองค์กร
                    </h3>
                    <p className="text-slate-500 mt-1">
                      เริ่มต้นด้วยการเพิ่มองค์กรแรกของคุณ
                    </p>
                  </div>
                ) : isMobile ? (
                  <div className="space-y-4">
                    {organizations.map((org) => (
                      <OrganizationCard
                        key={org.id}
                        org={org}
                        onEdit={openOrgModal}
                        onDelete={(id, name) =>
                          setConfirmDelete({
                            open: true,
                            type: "org",
                            id,
                            name,
                          })
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">No</TableHead>
                        <TableHead>ชื่อองค์กร</TableHead>
                        <TableHead>ที่อยู่</TableHead>
                        <TableHead className="text-center w-40">การจัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organizations.map((org, index) => (
                        <TableRow key={org.id} className="hover:bg-slate-50/80">
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium text-slate-800">
                            {org.org_name}
                          </TableCell>
                          <TableCell className="whitespace-normal text-slate-600">
                            {org.address || "-"}
                          </TableCell>
                          <TableCell className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openOrgModal(org)}
                              className="bg-white/50"
                            >
                              <Edit className="w-4 h-4 mr-1" /> แก้ไข
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                setConfirmDelete({
                                  open: true,
                                  type: "org",
                                  id: org.id,
                                  name: org.org_name,
                                })
                              }
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> ลบ
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Section>
            </TabsContent>

            {/* -------- Buildings Tab -------- */}
            <TabsContent value="buildings">
              <Section
                title="การจัดการอาคาร"
                description="จัดการข้อมูลอาคารทั้งหมดในระบบของคุณ"
                right={
                  <Button
                    onClick={() => openBldModal()}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md hover:opacity-95 transition-opacity"
                  >
                    <Plus className="w-4 h-4 mr-2" /> เพิ่มอาคาร
                  </Button>
                }
              >
                {bldError && (
                  <div className="p-3 mb-4 bg-rose-50 text-rose-700 rounded-lg">
                    {bldError}
                  </div>
                )}

                {/* Filter by organization */}
                <div className="flex items-center gap-2 mb-4">
                  <Label htmlFor="org-filter" className="flex-shrink-0">
                    กรองตามองค์กร:
                  </Label>
                  <Select id="org-filter" value={filterOrgId} onValueChange={setFilterOrgId}>
                    <SelectTrigger className="w-full sm:w-[250px] bg-white/70">
                      <SelectValue placeholder="-- แสดงทั้งหมด --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">-- แสดงทั้งหมด --</SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id.toString()}>
                          {org.org_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {filteredBuildings.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <BuildingIcon className="w-12 h-12 mx-auto mb-2" />
                    <p>ไม่พบข้อมูลอาคารที่ตรงกับเงื่อนไข</p>
                  </div>
                ) : isMobile ? (
                  <div className="space-y-4">
                    {filteredBuildings.map((b) => (
                      <BuildingCard
                        key={b.id}
                        building={b}
                        onEdit={openBldModal}
                        onDelete={(id, name) =>
                          setConfirmDelete({
                            open: true,
                            type: "building",
                            id,
                            name,
                          })
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">No</TableHead>
                        <TableHead>ชื่ออาคาร</TableHead>
                        <TableHead>องค์กร</TableHead>
                        <TableHead className="text-center w-32">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBuildings.map((b, i) => (
                        <TableRow key={b.id} className="hover:bg-slate-50/80">
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="font-medium text-slate-800">
                            {b.building_name}
                          </TableCell>
                          <TableCell>{b.org_name || "-"}</TableCell>
                          <TableCell className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openBldModal(b)}
                              className="bg-white/50"
                            >
                              <Edit className="w-4 h-4 mr-1" /> แก้ไข
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                setConfirmDelete({
                                  open: true,
                                  type: "building",
                                  id: b.id,
                                  name: b.building_name,
                                })
                              }
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> ลบ
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Section>
            </TabsContent>
          </Tabs>

          <div className="text-center text-slate-500 text-xs">
            ระบบจัดการองค์กร/อาคาร © {new Date().getFullYear()}
          </div>
        </div>

        {/* --- Modals: Organization --- */}
        <AnimatedModal open={isOrgModalOpen} onOpenChange={setIsOrgModalOpen}>
          <DialogContent className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full ring-1 ring-slate-200">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {editingOrg ? "แก้ไของค์กร" : "เพิ่มองค์กรใหม่"}
              </DialogTitle>
              <DialogDescription>
                {editingOrg
                  ? "กรุณาแก้ไขรายละเอียดขององค์กร"
                  : "กรุณากรอกรายละเอียดขององค์กรที่ต้องการเพิ่ม"}
              </DialogDescription>
            </DialogHeader>
            <OrganizationForm
              org={editingOrg}
              onSuccess={onOrgSaved}
              onCancel={closeOrgModal}
            />
          </DialogContent>
        </AnimatedModal>

        {/* --- Modals: Building --- */}
        <AnimatedModal open={isBldModalOpen} onOpenChange={setIsBldModalOpen}>
          <DialogContent className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full ring-1 ring-slate-200">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {editingBuilding?.id ? "แก้ไขข้อมูลอาคาร" : "เพิ่มอาคารใหม่"}
              </DialogTitle>
              <DialogDescription>กรอกข้อมูลอาคารให้ครบถ้วน</DialogDescription>
            </DialogHeader>
            <BuildingForm
              building={editingBuilding}
              onSuccess={onBldSaved}
              onCancel={closeBldModal}
              organizations={organizations}
            />
          </DialogContent>
        </AnimatedModal>

        {/* --- Delete Confirmation (shared) --- */}
        <AnimatedModal
          open={confirmDelete.open}
          onOpenChange={(open) =>
            !open && setConfirmDelete({ open: false, type: null, id: null, name: "" })
          }
        >
          <DialogContent className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full ring-1 ring-slate-200">
            <DialogHeader className="flex flex-row items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <DialogTitle>ยืนยันการลบ</DialogTitle>
            </DialogHeader>
            <p className="py-4 text-center text-slate-600">
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <strong className="text-rose-700">
                {confirmDelete.type === "org" ? "องค์กร" : "อาคาร"} {confirmDelete.name}
              </strong>
              ?
            </p>
            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="ghost"
                onClick={() =>
                  setConfirmDelete({ open: false, type: null, id: null, name: "" })
                }
              >
                ยกเลิก
              </Button>
              <Button variant="destructive" onClick={doConfirmDelete}>
                ยืนยันการลบ
              </Button>
            </div>
          </DialogContent>
        </AnimatedModal>
      </div>
    </>
  );
};

export default OrgAndBuildings;
