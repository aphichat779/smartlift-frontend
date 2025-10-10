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
import { GiElevator } from 'react-icons/gi';

// Component สำหรับฟอร์มเพิ่ม/แก้ไขลิฟต์
const ElevatorForm = ({ elevator, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        id: elevator?.id || null,
        org_id: elevator?.org_id || '',
        building_id: elevator?.building_id || '',
        lift_name: elevator?.lift_name || '',
        max_level: elevator?.max_level || '',
        mac_address: elevator?.mac_address || '',
        floor_name: elevator?.floor_name || '',
        description: elevator?.description || '',
    });
    const [formError, setFormError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [organizations, setOrganizations] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [loadingOrgs, setLoadingOrgs] = useState(true);
    const [loadingBuildings, setLoadingBuildings] = useState(false);

    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            fetchOrganizations();
            if (formData.org_id) {
                fetchBuildings(formData.org_id);
            }
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

    const fetchBuildings = async (orgId) => {
        try {
            setLoadingBuildings(true);
            const response = await apiService.getBuildings(orgId);
            if (response.success) {
                setBuildings(response.data || []);
            } else {
                setBuildings([]);
                setFormError(response.message || 'ไม่สามารถโหลดรายการอาคารได้');
            }
        } catch (err) {
            console.error('Error fetching buildings:', err);
            setFormError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setLoadingBuildings(false);
        }
    };

    const handleOrgChange = (value) => {
        const orgId = parseInt(value, 10);
        setFormData(prevData => ({ ...prevData, org_id: orgId, building_id: '' }));
        fetchBuildings(orgId);
    };

    const handleBuildingChange = (value) => {
        setFormData(prevData => ({ ...prevData, building_id: parseInt(value, 10) }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
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

        if (!formData.org_id || !formData.building_id || !formData.lift_name.trim() || !formData.mac_address.trim() || !formData.max_level || !formData.floor_name.trim()) {
            setFormError('กรุณากรอกข้อมูลให้ครบถ้วน');
            setIsSubmitting(false);
            return;
        }

        try {
            let response;
            const submitData = {
                org_id: formData.org_id,
                building_id: formData.building_id,
                lift_name: formData.lift_name.trim(),
                max_level: parseInt(formData.max_level, 10),
                mac_address: formData.mac_address.trim(),
                floor_name: formData.floor_name.trim(),
                description: formData.description.trim(),
            };

            if (formData.id) {
                response = await apiService.updateElevator(formData.id, submitData);
            } else {
                response = await apiService.createElevator(submitData);
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
                        onValueChange={handleOrgChange}
                        disabled={isSubmitting || loadingOrgs || formData.id} // ห้ามแก้ org_id/building_id เมื่อแก้ไข
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
                <Label htmlFor="building_id">
                    อาคาร <span className="text-red-500">*</span>
                </Label>
                {loadingBuildings ? (
                    <div className="text-sm text-gray-500 py-2">กำลังโหลดรายการอาคาร...</div>
                ) : (
                    <Select
                        name="building_id"
                        value={formData.building_id.toString()}
                        onValueChange={handleBuildingChange}
                        disabled={isSubmitting || !formData.org_id || loadingBuildings || formData.id}
                        required
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="-- เลือกอาคาร --" />
                        </SelectTrigger>
                        <SelectContent>
                            {buildings.map((building) => (
                                <SelectItem key={building.id} value={building.id.toString()}>
                                    {building.building_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="lift_name">
                    ชื่อลิฟต์ <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="lift_name"
                    name="lift_name"
                    type="text"
                    value={formData.lift_name}
                    onChange={handleChange}
                    placeholder="กรุณาใส่ชื่อลิฟต์"
                    required
                    disabled={isSubmitting}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="max_level">
                    ชั้นสูงสุด <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="max_level"
                    name="max_level"
                    type="number"
                    value={formData.max_level}
                    onChange={handleChange}
                    placeholder="กรุณาใส่จำนวนชั้นสูงสุด"
                    required
                    disabled={isSubmitting}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="mac_address">
                    MAC Address <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="mac_address"
                    name="mac_address"
                    type="text"
                    value={formData.mac_address}
                    onChange={handleChange}
                    placeholder="กรุณาใส่ MAC Address"
                    required
                    disabled={isSubmitting || formData.id} // ห้ามแก้ไข MAC address เมื่อแก้ไขข้อมูล
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="floor_name">
                    ชื่อชั้น <span className="text-red-500">*</span>
                </Label>
                <Textarea
                    id="floor_name"
                    name="floor_name"
                    value={formData.floor_name}
                    onChange={handleChange}
                    placeholder="ใส่ข้อมูลชื่อชั้น เช่น 1,2,3,4,5"
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
                    placeholder="กรุณาใส่รายละเอียดลิฟต์ (ไม่บังคับ)"
                    disabled={isSubmitting}
                />
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    ยกเลิก
                </Button>
                <Button type="submit" disabled={isSubmitting || loadingOrgs || loadingBuildings}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            กำลังบันทึก...
                        </>
                    ) : (
                        formData.id ? 'บันทึกการแก้ไข' : 'เพิ่มลิฟต์'
                    )}
                </Button>
            </div>
        </form>
    );
};

// คอมโพเนนต์สำหรับแสดงผลบนหน้าจอมือถือ
const ElevatorCard = ({ elevator, onEdit, onDelete }) => (
    <Card key={elevator.id} className="mb-4 w-full">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{elevator.lift_name}</CardTitle>
            <div className="flex gap-2">
                <Button size="icon" variant="secondary" onClick={() => onEdit(elevator)}>
                    <Edit className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="destructive" onClick={() => onDelete(elevator.id, elevator.lift_name)}>
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </CardHeader>
        <CardContent className="space-y-1">
            <p className="text-sm text-gray-500">ID: {elevator.id}</p>
            <p className="text-sm">องค์กร: {elevator.org_name || "-"}</p>
            <p className="text-sm">อาคาร: {elevator.building_name || "-"}</p>
            <p className="text-sm">MAC Address: {elevator.mac_address}</p>
            <p className="text-sm">ชั้นสูงสุด: {elevator.max_level}</p>
        </CardContent>
    </Card>
);

const Elevators = () => {
    const [elevators, setElevators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingElevator, setEditingElevator] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: "" });
    const [filterOrgId, setFilterOrgId] = useState('');
    const [filterBuildingId, setFilterBuildingId] = useState('');
    const [organizations, setOrganizations] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        if (isAuthenticated) {
            fetchOrganizations();
            fetchElevators();
        } else {
            setLoading(false);
            setError('โปรดเข้าสู่ระบบเพื่อดูข้อมูลลิฟต์');
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

    const fetchBuildings = async (orgId) => {
        try {
            const response = await apiService.getBuildings(orgId);
            if (response.success) {
                setBuildings(response.data || []);
            } else {
                setBuildings([]);
                setError(response.message || 'ไม่สามารถโหลดรายการอาคารได้');
            }
        } catch (err) {
            console.error('Error fetching buildings:', err);
            setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    const fetchElevators = async (orgId = null, buildingId = null) => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiService.getElevators(orgId, buildingId);
            if (response.success) {
                setElevators(response.data || []);
            } else {
                setError(response.message || 'ไม่สามารถโหลดข้อมูลลิฟต์ได้');
            }
        } catch (err) {
            setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setLoading(false);
        }
    };

    const handleOrgFilterChange = (value) => {
        setFilterOrgId(value);
        setFilterBuildingId('');
        if (value === 'all') {
            fetchElevators(null, null);
            setBuildings([]);
        } else {
            fetchBuildings(value);
            fetchElevators(value, null);
        }
    };

    const handleBuildingFilterChange = (value) => {
        setFilterBuildingId(value);
        fetchElevators(filterOrgId, value === 'all' ? null : value);
    };

    const handleDelete = async () => {
        if (!isAuthenticated) {
            setError('โปรดเข้าสู่ระบบก่อนดำเนินการ');
            return;
        }

        try {
            const response = await apiService.deleteElevator(confirmDelete.id);
            if (response.success) {
                fetchElevators(filterOrgId, filterBuildingId === 'all' ? null : filterBuildingId);
            } else {
                setError(response.message || 'ไม่สามารถลบลิฟต์ได้');
            }
        } catch (err) {
            setError(err.message || 'เกิดข้อผิดพลาดในการลบลิฟต์');
        } finally {
            setConfirmDelete({ open: false, id: null, name: "" });
        }
    };

    const openModal = (elevator = {}) => {
        setEditingElevator(elevator);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingElevator(null);
        setIsModalOpen(false);
    };

    const handleFormSubmit = () => {
        closeModal();
        fetchElevators(filterOrgId, filterBuildingId === 'all' ? null : filterBuildingId);
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
                <Button className="mt-2" onClick={() => fetchElevators(filterOrgId, filterBuildingId === 'all' ? null : filterBuildingId)}>ลองใหม่</Button>
            </div>
        );
    }

    return (
        <div className="md:p-6 space-y-6">
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <GiElevator className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">การจัดการลิฟต์</CardTitle>
                        </div>
                    </div>
                    <Button
                        onClick={() => openModal()}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filter Section */}
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="org-filter">กรองตามองค์กร:</Label>
                            <Select
                                id="org-filter"
                                value={filterOrgId}
                                onValueChange={handleOrgFilterChange}
                            >
                                <SelectTrigger className="w-[180px]">
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
                        <div className="space-y-2">
                            <Label htmlFor="building-filter">กรองตามอาคาร:</Label>
                            <Select
                                id="building-filter"
                                value={filterBuildingId}
                                onValueChange={handleBuildingFilterChange}
                                disabled={!filterOrgId || filterOrgId === 'all'}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="-- แสดงทั้งหมด --" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">-- แสดงทั้งหมด --</SelectItem>
                                    {buildings.map((building) => (
                                        <SelectItem key={building.id} value={building.id.toString()}>
                                            {building.building_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {elevators.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-md">
                            <p>ไม่พบข้อมูลลิฟต์</p>
                        </div>
                    ) : (
                        isMobile ? (
                            <div className="space-y-4">
                                {elevators.map((elevator) => (
                                    <ElevatorCard
                                        key={elevator.id}
                                        elevator={elevator}
                                        onEdit={openModal}
                                        onDelete={(id, name) => setConfirmDelete({ open: true, id, name })}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>ชื่อลิฟต์</TableHead>
                                            <TableHead>องค์กร</TableHead>
                                            <TableHead>อาคาร</TableHead>
                                            <TableHead>MAC Address</TableHead>
                                            <TableHead>ชั้นสูงสุด</TableHead>
                                            <TableHead className="text-center w-32">การจัดการ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {elevators.map((elevator) => (
                                            <TableRow key={elevator.id}>
                                                <TableCell>{elevator.id}</TableCell>
                                                <TableCell className="font-medium">{elevator.lift_name}</TableCell>
                                                <TableCell>{elevator.org_name || '-'}</TableCell>
                                                <TableCell>{elevator.building_name || '-'}</TableCell>
                                                <TableCell>{elevator.mac_address}</TableCell>
                                                <TableCell>{elevator.max_level}</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <Button size="sm" variant="secondary" onClick={() => openModal(elevator)}>
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => setConfirmDelete({ open: true, id: elevator.id, name: elevator.lift_name })}
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
                        <DialogTitle>{editingElevator ? "แก้ไขข้อมูลลิฟต์" : "เพิ่มลิฟต์ใหม่"}</DialogTitle>
                        <DialogDescription>
                            {editingElevator ? "แก้ไขรายละเอียดของลิฟต์ที่เลือก" : "กรอกข้อมูลลิฟต์ใหม่เพื่อเพิ่มเข้าสู่ระบบ"}
                        </DialogDescription>
                    </DialogHeader>
                    <ElevatorForm
                        elevator={editingElevator}
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
                        คุณแน่ใจหรือไม่ว่าต้องการลบลิฟต์ **{confirmDelete.name}**?
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

export default Elevators;