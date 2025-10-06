// src/services/DashboardService.js

import { apiService } from './api'; // สมมติว่ามี apiService ที่มีเมธอด .get() อยู่แล้ว

/**
 * ดึงข้อมูล Dashboard ตามบทบาทของผู้ใช้
 * @param {string} role - บทบาทของผู้ใช้ ('super_admin', 'admin', 'technician', 'user')
 * @param {number | null} orgId - org_id ของผู้ใช้ที่เข้าสู่ระบบ
 * @returns {Promise<object>} - ข้อมูล Dashboard
 */
export async function fetchDashboardData(role, orgId = null) {
    let endpoint = '/api/dashboard/';
    
    // กำหนด Endpoint ตามบทบาทที่มาจาก PHP files
    switch (role) {
        case 'super_admin':
            endpoint += 'dashboardsuperadmin.php';
            break;
        case 'admin':
            endpoint += 'dashboardadmin.php';
            break;
        case 'technician':
            endpoint += 'dashboardtechnician.php';
            break;
        case 'user':
            endpoint += 'dashboarduser.php';
            // สำหรับ Admin/SuperAdmin ที่ต้องการ Impersonate User หรือส่ง orgId ไปกรอง
            if (orgId && orgId > 0) { 
                endpoint += `?org_id=${orgId}`;
            }
            break;
        default:
            throw new Error(`บทบาทที่ไม่รู้จัก: ${role}`);
    }

    try {
        const data = await apiService.get(endpoint);

        // ตรวจสอบ success flag ที่มาจาก PHP API 
        // NOTE: ในกรณี "ไม่มีองค์กร" (orgId: 0) PHP จะส่ง success: true กลับมา 
        if (data && data.success === false) {
            throw new Error(data.message || 'การดึงข้อมูล Dashboard ไม่สำเร็จ (Success=false)');
        }
        
        // สำหรับกรณี success: true (รวมถึงกรณี orgId: 0)
        return data;
        
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูล Dashboard:', error);
        // ส่ง Error ขึ้นไปเพื่อให้ Component แสดงผลข้อผิดพลาด
        throw error;
    }
}