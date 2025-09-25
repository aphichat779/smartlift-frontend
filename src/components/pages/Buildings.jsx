import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, AlertTriangle, Loader2 } from "lucide-react";

// Component สำหรับฟอร์มเพิ่ม/แก้ไขอาคาร
const BuildingForm = ({ building, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    id: building?.id || null,
    org_id: building?.org_id || '',
    building_name: building?.building_name || '',
    description: building?.description || '',
    address: building?.address || '',
  });
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrganizations();
    } else {
      setLoadingOrgs(false);
      setFormError('โปรดเข้าสู่ระบบเพื่อจัดการข้อมูล');
    }
  }, [isAuthenticated]);

  const fetchOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      const response = await apiService.getOrganizations();
      if (response.success) {
        setOrganizations(response.data || []);
      } else {
        setFormError(response.message || 'ไม่สามารถโหลดรายการองค์กรได้');
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setFormError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSelectChange = (value) => {
    setFormData((prevData) => ({
      ...prevData,
      org_id: parseInt(value, 10),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    if (!isAuthenticated) {
      setFormError('โปรดเข้าสู่ระบบก่อนดำเนินการ');
      setIsSubmitting(false);
      return;
    }

    if (!formData.org_id) {
      setFormError('กรุณาเลือกองค์กร');
      setIsSubmitting(false);
      return;
    }

    if (!formData.building_name.trim()) {
      setFormError('กรุณาใส่ชื่ออาคาร');
      setIsSubmitting(false);
      return;
    }

    try {
      let response;
      const submitData = {
        org_id: formData.org_id,
        building_name: formData.building_name.trim(),
        description: formData.description.trim(),
        address: formData.address.trim()
      };

      if (formData.id) {
        response = await apiService.updateBuilding(formData.id, submitData);
      } else {
        response = await apiService.createBuilding(submitData);
      }

      if (response.success) {
        onSuccess();
      } else {
        setFormError(response.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      setFormError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4 p-2" onSubmit={handleSubmit}>
      {formError && (
        <div className="p-2 bg-red-100 text-red-600 rounded">{formError}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="org_id">
          องค์กร <span className="text-red-500">*</span>
        </Label>
        {loadingOrgs ? (
          <div className="text-sm text-gray-500 py-2">กำลังโหลดรายการองค์กร...</div>
        ) : (
          <Select
            name="org_id"
            value={formData.org_id.toString()}
            onValueChange={handleSelectChange}
            disabled={isSubmitting || loadingOrgs}
            required
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
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="building_name">
          ชื่ออาคาร <span className="text-red-500">*</span>
        </Label>
        <Input
          id="building_name"
          name="building_name"
          type="text"
          value={formData.building_name}
          onChange={handleChange}
          placeholder="กรุณาใส่ชื่ออาคาร"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">รายละเอียด</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="กรุณาใส่รายละเอียดอาคาร (ไม่บังคับ)"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">ที่อยู่</Label>
        <Textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="กรุณาใส่ที่อยู่อาคาร (ไม่บังคับ)"
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          ยกเลิก
        </Button>
        <Button type="submit" disabled={isSubmitting || loadingOrgs}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            formData.id ? 'บันทึกการแก้ไข' : 'เพิ่มอาคาร'
          )}
        </Button>
      </div>
    </form>
  );
};

// คอมโพเนนต์สำหรับแสดงผลบนหน้าจอมือถือ
const BuildingCard = ({ building, index, onEdit, onDelete, organizations }) => {
  const orgName = organizations.find(org => org.id === building.org_id)?.org_name || '-';
  return (
    <Card key={building.id} className="mb-4 w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{building.building_name}</CardTitle>
        <div className="flex gap-2">
          <Button size="icon" variant="secondary" onClick={() => onEdit(building)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="destructive" onClick={() => onDelete(building.id, building.building_name)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-2">No: {index + 1}</p>
        <p className="text-sm">องค์กร: {orgName}</p>
        <p className="text-sm">ที่อยู่: {building.address || "ไม่มีข้อมูล"}</p>
      </CardContent>
    </Card>
  );
};

const Buildings = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: "" });
  const [filterOrgId, setFilterOrgId] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    if (isAuthenticated) {
      fetchOrganizations();
      fetchBuildings();
    } else {
      setLoading(false);
      setError('โปรดเข้าสู่ระบบเพื่อดูข้อมูลอาคาร');
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [isAuthenticated]);

  const fetchOrganizations = async () => {
    try {
      const response = await apiService.getOrganizations();
      if (response.success) {
        setOrganizations(response.data || []);
      } else {
        setError(response.message || 'ไม่สามารถโหลดรายการองค์กรได้');
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const fetchBuildings = async (orgId = null) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getBuildings(orgId);

      if (response.success) {
        setBuildings(response.data || []);
      } else {
        setError(response.message || 'ไม่สามารถโหลดข้อมูลอาคารได้');
      }
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (value) => {
    setFilterOrgId(value);
    fetchBuildings(value === 'all' ? null : value);
  };

  const handleDelete = async () => {
    if (!isAuthenticated) {
      setError('โปรดเข้าสู่ระบบก่อนดำเนินการ');
      return;
    }

    try {
      const response = await apiService.deleteBuilding(confirmDelete.id);
      if (response.success) {
        fetchBuildings(filterOrgId === 'all' ? null : filterOrgId);
      } else {
        setError(response.message || 'ไม่สามารถลบอาคารได้');
      }
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการลบอาคาร');
    } finally {
      setConfirmDelete({ open: false, id: null, name: "" });
    }
  };

  const openModal = (building = {}) => {
    setEditingBuilding(building);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingBuilding(null);
    setIsModalOpen(false);
  };

  const handleFormSubmit = () => {
    closeModal();
    fetchBuildings(filterOrgId === 'all' ? null : filterOrgId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-600 rounded-md m-4">
        <p>เกิดข้อผิดพลาด: {error}</p>
        <Button className="mt-2" onClick={() => fetchBuildings(filterOrgId === 'all' ? null : filterOrgId)}>ลองใหม่</Button>
      </div>
    );
  }

  return (
    <div className=" md:p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-xl">การจัดการอาคาร</CardTitle>
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" /> เพิ่มอาคาร
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Label htmlFor="org-filter" className="flex-shrink-0">กรองตามองค์กร:</Label>
            <Select
              id="org-filter"
              value={filterOrgId}
              onValueChange={handleFilterChange}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
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

          {buildings.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-md">
              <p>{filterOrgId === 'all' ? 'ไม่พบข้อมูลอาคาร' : 'ไม่พบข้อมูลอาคารในองค์กรที่เลือก'}</p>
            </div>
          ) : (
            isMobile ? (
              <div className="space-y-4">
                {buildings.map((building, index) => (
                  <BuildingCard
                    key={building.id}
                    building={building}
                    index={index}
                    onEdit={openModal}
                    onDelete={(id, name) => setConfirmDelete({ open: true, id, name })}
                    organizations={organizations}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto"> {/* เพิ่ม overflow-x-auto สำหรับ desktop */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>ชื่ออาคาร</TableHead>
                      <TableHead>องค์กร</TableHead>
                      <TableHead>ที่อยู่</TableHead>
                      <TableHead className="text-center w-32">การจัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buildings.map((building, index) => (
                      <TableRow key={building.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{building.building_name}</TableCell>
                        <TableCell>{building.org_name || '-'}</TableCell>
                        <TableCell className="max-w-xs">{building.address || '-'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button size="sm" variant="secondary" onClick={() => openModal(building)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setConfirmDelete({ open: true, id: building.id, name: building.building_name })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Modal ฟอร์มเพิ่ม/แก้ไข */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingBuilding ? "แก้ไขข้อมูลอาคาร" : "เพิ่มอาคารใหม่"}</DialogTitle>
            <DialogDescription>
              {editingBuilding ? "แก้ไขรายละเอียดของอาคารและที่อยู่" : "กรอกข้อมูลอาคารใหม่เพื่อเพิ่มเข้าสู่ระบบ"}
            </DialogDescription>
          </DialogHeader>
          <BuildingForm
            building={editingBuilding}
            onSuccess={handleFormSubmit}
            onCancel={closeModal}
          />
        </DialogContent>
      </Dialog>

      {/* Popup ยืนยันการลบ */}
      <Dialog open={confirmDelete.open} onOpenChange={(open) => !open && setConfirmDelete({ open: false, id: null, name: "" })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="flex flex-row items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <DialogTitle>ยืนยันการลบ</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </DialogDescription>
          <p className='text-center text-sm text-gray-700'>
            คุณแน่ใจหรือไม่ว่าต้องการลบอาคาร **{confirmDelete.name}**?
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmDelete({ open: false, id: null, name: "" })}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              ลบ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Buildings;