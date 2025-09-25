import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    Loader2,
    Save,
    Mail,
    Phone,
    Shield,
    CheckCircle,
    AlertCircle,
    Upload,
    Image as ImageIcon,
    Edit,
    MapPin,
    Calendar,
} from 'lucide-react';

const UserProfile = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        birthdate: '',
        address: '',
        recovery_email: '',
        recovery_phone: '',
    });
    const [imageFile, setImageFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');
    const [success, setSuccess] = useState('');
    const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false);
    const [isUploadImageDialogOpen, setIsUploadImageDialogOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState('');

    useEffect(() => {
        const fetchAndSetProfile = async () => {
            setLoading(true);
            setApiError('');
            try {
                const response = await apiService.getProfile();
                const userData = response.data;
                updateUser(userData);

                setFormData({
                    first_name: userData.first_name || '',
                    last_name: userData.last_name || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    birthdate: userData.birthdate || '',
                    address: userData.address || '',
                    recovery_email: userData.recovery_email || '',
                    recovery_phone: userData.recovery_phone || '',
                });

                setPreviewImage(userData.user_img ? `${import.meta.env.VITE_REACT_APP_API_URL}${userData.user_img}` : null);
            } catch (error) {
                setApiError('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้: ' + error.message);
            } finally {
                setLoading(false);
            }
        };

        if (user && user.id) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.phone || '',
                birthdate: user.birthdate || '',
                address: user.address || '',
                recovery_email: user.recovery_email || '',
                recovery_phone: user.recovery_phone || '',
            });
            setPreviewImage(user.user_img ? `${import.meta.env.VITE_REACT_APP_API_URL}${user.user_img}` : null);
            setLoading(false);
        } else {
            fetchAndSetProfile();
        }
    }, [user, updateUser]);

    useEffect(() => {
        if (apiError || success) {
            const timer = setTimeout(() => {
                setApiError('');
                setSuccess('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [apiError, success]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setValidationErrors('');
        setSuccess('');
        setApiError('');
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewImage(reader.result);
            reader.readAsDataURL(file);
            setValidationErrors('');
        }
    };

    const validateForm = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{10}$/;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const nameRegex = /^[a-zA-Z\sก-์]+$/;
        let errors = [];

        if (formData.first_name && !nameRegex.test(formData.first_name)) {
            errors.push('ชื่อต้องเป็นตัวอักษรเท่านั้น');
        }
        if (formData.last_name && !nameRegex.test(formData.last_name)) {
            errors.push('นามสกุลต้องเป็นตัวอักษรเท่านั้น');
        }
        if (formData.email && !emailRegex.test(formData.email)) {
            errors.push('รูปแบบอีเมลไม่ถูกต้อง');
        }
        if (formData.phone && !phoneRegex.test(formData.phone.replace(/[^0-9]/g, ''))) {
            errors.push('เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก');
        }
        if (formData.birthdate && !dateRegex.test(formData.birthdate)) {
            errors.push('รูปแบบวันเกิดไม่ถูกต้อง (YYYY-MM-DD)');
        }
        if (formData.recovery_email && !emailRegex.test(formData.recovery_email)) {
            errors.push('รูปแบบอีเมลสำรองไม่ถูกต้อง');
        }
        if (formData.recovery_phone && !phoneRegex.test(formData.recovery_phone.replace(/[^0-9]/g, ''))) {
            errors.push('รูปแบบเบอร์โทรสำรองไม่ถูกต้อง');
        }

        if (errors.length > 0) {
            setValidationErrors(errors.join(', '));
            return false;
        }
        setValidationErrors('');
        return true;
    };

    const handleUpdateTextData = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        setApiError('');
        setSuccess('');
        try {
            const response = await apiService.updateProfile(formData);
            updateUser(response.data); // แก้ไขตรงนี้
            setSuccess('อัปเดตข้อมูลสำเร็จ');
            setIsEditProfileDialogOpen(false);
        } catch (error) {
            setApiError(error.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async () => {
        if (!user) {
            setApiError('User is not authenticated. Please log in.');
            setIsUploadImageDialogOpen(false);
            return;
        }
        if (!imageFile) {
            setValidationErrors('กรุณาเลือกรูปภาพที่ต้องการอัปโหลด');
            return;
        }
        setLoading(true);
        setApiError('');
        setSuccess('');
        try {
            const response = await apiService.uploadProfileImage(imageFile);
            updateUser(response.data); // แก้ไขตรงนี้
            setSuccess('อัปโหลดรูปโปรไฟล์สำเร็จ');
            setIsUploadImageDialogOpen(false);
        } catch (error) {
            setApiError(error.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
        } finally {
            setLoading(false);
            setImageFile(null);
        }
    };

    const ProfileItem = ({ icon, label, value }) => (
        <div className="flex flex-col items-start space-y-1">
            <div className="flex items-center text-sm text-gray-500">
                {icon}
                <span className="ml-2">{label}</span>
            </div>
            <span className="text-sm font-medium break-all">{value || 'ยังไม่ได้เพิ่ม'}</span>
        </div>
    );

    return (
        <div className="w-full h-full flex justify-center items-center">
            <Card className="w-full">
                {loading ? (
                    <div className="flex justify-center items-center p-8">
                        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                        <span className="text-lg text-gray-500">กำลังโหลดข้อมูลโปรไฟล์...</span>
                    </div>
                ) : (
                    <>
                        {apiError && (
                            <Alert variant="destructive" className="m-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{apiError}</AlertDescription>
                            </Alert>
                        )}
                        {success && (
                            <Alert className="m-4 border-green-200 bg-green-50">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-700">{success}</AlertDescription>
                            </Alert>
                        )}
                        <CardHeader className="flex flex-col items-center">
                            <div className="relative">
                                <img
                                    src={previewImage || '/path/to/default/user-icon.png'}
                                    alt="Profile"
                                    className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md"
                                />
                                <Dialog open={isUploadImageDialogOpen} onOpenChange={setIsUploadImageDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-white border shadow-md">
                                            <ImageIcon className="h-5 w-5 text-gray-600" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>อัปโหลดรูปโปรไฟล์</DialogTitle>
                                            <DialogDescription>เลือกรูปภาพใหม่และกดอัปโหลดเพื่อบันทึก</DialogDescription>
                                        </DialogHeader>
                                        <div className="flex flex-col items-center py-4">
                                            <img src={previewImage || '/path/to/default/user-icon.png'} alt="Preview" className="h-32 w-32 rounded-full object-cover mb-4" />
                                            <Input type="file" onChange={handleImageChange} accept="image/*" />
                                            {validationErrors && <p className="text-sm text-red-500 mt-2">{validationErrors}</p>}
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleImageUpload} disabled={!imageFile || loading}>
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังอัปโหลด...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="mr-2 h-4 w-4" /> อัปโหลด
                                                    </>
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="text-center mt-4">
                                <CardTitle className="text-2xl font-bold">{user?.first_name} {user?.last_name}</CardTitle>
                                <CardDescription className="text-gray-500">@{user?.username}</CardDescription>
                                <Badge className="mt-2" variant="secondary">{user?.role}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <ProfileItem icon={<Mail className="h-4 w-4 text-gray-400" />} label="อีเมล" value={user?.email} />
                                <ProfileItem icon={<Phone className="h-4 w-4 text-gray-400" />} label="เบอร์โทรศัพท์" value={user?.phone} />
                                <ProfileItem icon={<Calendar className="h-4 w-4 text-gray-400" />} label="วันเกิด" value={user?.birthdate} />
                                <ProfileItem icon={<MapPin className="h-4 w-4 text-gray-400" />} label="ที่อยู่" value={user?.address} />
                                <ProfileItem icon={<Mail className="h-4 w-4 text-gray-400" />} label="อีเมลสำรอง" value={user?.recovery_email} />
                                <ProfileItem icon={<Phone className="h-4 w-4 text-gray-400" />} label="เบอร์โทรศัพท์สำรอง" value={user?.recovery_phone} />
                                <div className="flex flex-col items-start space-y-1">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Shield className="h-4 w-4 text-gray-400" />
                                        <span className="ml-2">2FA</span>
                                    </div>
                                    <Badge variant={user?.ga_enabled ? 'default' : 'destructive'}>
                                        {user?.ga_enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                    </Badge>
                                </div>
                            </div>
                            <Separator className="my-6" />
                            <div className="mt-6 text-center">
                                <Dialog open={isEditProfileDialogOpen} onOpenChange={setIsEditProfileDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full">
                                            <Edit className="mr-2 h-4 w-4" /> แก้ไขโปรไฟล์
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>แก้ไขข้อมูลส่วนตัว</DialogTitle>
                                            <DialogDescription>แก้ไขข้อมูลในช่องนี้แล้วกดบันทึกเพื่ออัปเดต</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleUpdateTextData} className="space-y-4">
                                            {validationErrors && (
                                                <Alert variant="destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertDescription>{validationErrors}</AlertDescription>
                                                </Alert>
                                            )}
                                            <div className="space-y-2">
                                                <Label htmlFor="first_name">ชื่อ</Label>
                                                <Input id="first_name" name="first_name" type="text" value={formData.first_name} onChange={handleChange} disabled={loading} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="last_name">นามสกุล</Label>
                                                <Input id="last_name" name="last_name" type="text" value={formData.last_name} onChange={handleChange} disabled={loading} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">อีเมล</Label>
                                                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={loading} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                                                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={loading} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="birthdate">วันเกิด</Label>
                                                <Input id="birthdate" name="birthdate" type="date" value={formData.birthdate} onChange={handleChange} disabled={loading} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="address">ที่อยู่</Label>
                                                <Input id="address" name="address" type="text" value={formData.address} onChange={handleChange} disabled={loading} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="recovery_email">อีเมลสำรอง</Label>
                                                <Input id="recovery_email" name="recovery_email" type="email" value={formData.recovery_email} onChange={handleChange} disabled={loading} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="recovery_phone">เบอร์โทรศัพท์สำรอง</Label>
                                                <Input id="recovery_phone" name="recovery_phone" type="tel" value={formData.recovery_phone} onChange={handleChange} disabled={loading} />
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" disabled={loading}>
                                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                                    บันทึกการเปลี่ยนแปลง
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
};

export default UserProfile;