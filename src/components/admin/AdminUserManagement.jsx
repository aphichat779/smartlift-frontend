// src/components/AdminUserManagement.jsx

import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Users,
  Shield,
  ShieldOff,
  Search,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  User,
  Mail,
  Phone,
  Edit2,
  Building,
} from 'lucide-react';

const getProfileImageSrc = (imgUrl) => {
  if (imgUrl) {
    return `${import.meta.env.VITE_REACT_APP_API_URL}${imgUrl}`;
  }
  return 'https://via.placeholder.com/150';
};

const UpdateUserForm = ({ user, organizations, onUpdate }) => {
  const [role, setRole] = useState(user.role);
  const [orgId, setOrgId] = useState(user.org_id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const updates = {};
      if (role !== user.role) {
        updates.role = role;
      }
      if (orgId !== user.org_id) {
        updates.org_id = parseInt(orgId);
      }
      if (Object.keys(updates).length > 0) {
        await apiService.adminUpdateUser(user.id, updates);
        setSuccess('อัปเดตข้อมูลผู้ใช้สำเร็จ');
        onUpdate();
        setTimeout(() => setSuccess(''), 2500);
      }
    } catch (error) {
      setError(error.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>แก้ไขผู้ใช้: {user.username}</DialogTitle>
        <DialogDescription>อัปเดตบทบาทหรือองค์กรสำหรับผู้ใช้คนนี้</DialogDescription>
      </DialogHeader>
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700">สำเร็จ</AlertTitle>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>ข้อผิดพลาด</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="role">บทบาท</Label>
        <Select value={role} onValueChange={setRole} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="เลือกบทบาท" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">ผู้ใช้</SelectItem>
            <SelectItem value="technician">ช่างเทคนิค</SelectItem>
            <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="org_id">องค์กร</Label>
        <Select value={orgId?.toString()} onValueChange={setOrgId} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="เลือกองค์กร" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map(org => (
              <SelectItem key={org.id} value={org.id.toString()}>{org.org_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button onClick={handleUpdate} disabled={loading || (role === user.role && orgId === user.org_id)}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            'บันทึกการเปลี่ยนแปลง'
          )}
        </Button>
      </DialogFooter>
    </div>
  );
};

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // อ่าน currentUserId จาก localStorage
  const currentUserId = (() => {
    try {
      const raw = localStorage.getItem('user_data');
      return raw ? JSON.parse(raw).id : null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, orgsResponse] = await Promise.all([
        apiService.getUsers(),
        apiService.getOrganizations(),
      ]);
      setUsers(usersResponse.data);
      setOrganizations(orgsResponse.data);
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้และองค์กร');
    } finally {
      setLoading(false);
    }
  };

  const handleReset2FA = async () => {
    if (!selectedUser || !resetReason.trim()) {
      setError('กรุณาระบุเหตุผลในการรีเซ็ต 2FA');
      return;
    }
    setResetLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiService.adminReset2FA(selectedUser.id, resetReason);
      setSuccess(`รีเซ็ต 2FA สำหรับผู้ใช้ ${selectedUser.username} สำเร็จ`);
      setResetDialogOpen(false);
      setResetReason('');
      setSelectedUser(null);
      fetchData();
    } catch (error) {
      setError(error.message || 'เกิดข้อผิดพลาดในการรีเซ็ต 2FA');
    } finally {
      setResetLoading(false);
    }
  };

  const handleUpdateUser = () => {
    fetchData();
    setSelectedUser(null);
  };

  const handleToggleStatus = async (user) => {
    try {
      await apiService.adminToggleUserStatus(user.id, !user.is_active);
      setSuccess(`เปลี่ยนสถานะของ ${user.username} สำเร็จ`);
      fetchData();
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.message || 'ไม่สามารถเปลี่ยนสถานะผู้ใช้ได้');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openResetDialog = (user) => {
    setSelectedUser(user);
    setResetDialogOpen(true);
  };

  const getOrgName = (orgId) => {
    const org = organizations.find(o => o.id === orgId);
    return org ? org.org_name : 'ไม่ระบุ';
  };

  return (
    <div className="w-full h-full md:p-6">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">จัดการผู้ใช้</CardTitle>
                  <CardDescription>จัดการบัญชีผู้ใช้และการตั้งค่าความปลอดภัย</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-sm">
                ผู้ใช้ทั้งหมด: {users.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}
            <div className="relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="ค้นหาผู้ใช้..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 max-w-none md:max-w-sm"
              />
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">กำลังโหลดข้อมูล...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ไม่มีข้อมูลผู้ใช้'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ผู้ใช้</TableHead>
                      <TableHead>ข้อมูลติดต่อ</TableHead>
                      <TableHead>องค์กร</TableHead>
                      <TableHead>บทบาท</TableHead>
                      <TableHead>2FA</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>การจัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const isCurrentUser = user.id === currentUserId;
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              {user.user_img ? (
                                <img
                                  src={getProfileImageSrc(user.user_img)}
                                  alt="User Profile"
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 flex items-center justify-center bg-gray-100 rounded-full">
                                  <User className="h-5 w-5" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{user.first_name} {user.last_name}</p>
                                <p className="text-sm text-muted-foreground">@{user.username}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center space-x-1">
                                <Mail className="h-3 w-3" />
                                <span>{user.email}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{user.phone}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <span>{getOrgName(user.org_id)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role === 'admin' ? 'ผู้ดูแลระบบ' : user.role === 'technician' ? 'ช่างเทคนิค' : 'ผู้ใช้'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {user.ga_enabled ? (
                                <Shield className="h-4 w-4 text-green-600" />
                              ) : (
                                <ShieldOff className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.is_active ? (
                              <Badge variant="default" className="bg-green-500 hover:bg-green-500">ใช้งานได้</Badge>
                            ) : (
                              <Badge variant="destructive">ปิดใช้งาน</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" disabled={isCurrentUser}>
                                    <Edit2 className="h-3 w-3 mr-1" />
                                    แก้ไข
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <UpdateUserForm user={user} organizations={organizations} onUpdate={handleUpdateUser} />
                                </DialogContent>
                              </Dialog>
                              {user.ga_enabled && (
                                <Button variant="outline" size="sm" onClick={() => openResetDialog(user)} disabled={isCurrentUser}>
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  รีเซ็ต 2FA
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant={user.is_active ? 'destructive' : 'default'}
                                onClick={() => handleToggleStatus(user)}
                                disabled={isCurrentUser}
                              >
                                {user.is_active ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedUser && (
        <Dialog
          open={resetDialogOpen}
          onOpenChange={(open) => {
            setResetDialogOpen(open);
            if (!open) {
              setSelectedUser(null);
              setResetReason('');
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>รีเซ็ต 2FA</DialogTitle>
              <DialogDescription>
                คุณกำลังจะรีเซ็ต 2FA สำหรับผู้ใช้: {selectedUser.username}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  การรีเซ็ต 2FA จะทำให้ผู้ใช้ต้องตั้งค่า 2FA ใหม่ทั้งหมด
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="resetReason">เหตุผลในการรีเซ็ต *</Label>
                <Input
                  id="resetReason"
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="เช่น: ผู้ใช้ทำอุปกรณ์หาย"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setResetDialogOpen(false);
                    setSelectedUser(null);
                    setResetReason('');
                  }}
                  disabled={resetLoading}
                >
                  ยกเลิก
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReset2FA}
                  disabled={resetLoading || !resetReason.trim()}
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังรีเซ็ต...
                    </>
                  ) : (
                    'ยืนยันการรีเซ็ต'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminUserManagement;
