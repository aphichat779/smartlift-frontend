// src/services/DashboardService.js

import { apiService } from './api'; // ต้องมี .get() ที่คืนค่าผ่าน JSON-parsed object

/**
 * ดึงแดชบอร์ดช่างเทคนิคจาก single endpoint เดียว
 * @param {boolean} orgScopeSelf - true = จำกัดตาม org ของผู้ใช้, false = system-wide (ค่าเริ่มต้นตาม Mock)
 * @returns {Promise<{success: boolean, user: object, kpis: any[], tasks: any[], reports: any[], lifts: any[], activity: any[]}>}
 */
export async function fetchTechnicianDashboard(orgScopeSelf = false) {
  let endpoint = '/api/dashboard/technician.php';
  if (orgScopeSelf) endpoint += '?org_scope=self';

  const data = await apiService.get(endpoint);
  if (data && data.success === false) {
    throw new Error(data.message || 'โหลด Technician Dashboard ไม่สำเร็จ');
  }
  return data;
}

/**
 * (คงไว้สำหรับหน้าอื่น) ดึง Dashboard ตามบทบาทของผู้ใช้
 * - หมายเหตุ: หน้า Technician ใช้ fetchTechnicianDashboard() แทน
 * @param {'super_admin'|'admin'|'user'} role
 * @param {number|null} orgId  ใช้เฉพาะ role 'user' (กรณีต้องการกรองตาม org)
 * @returns {Promise<object>}
 */
export async function fetchDashboardData(role, orgId = null) {
  let endpoint = '/api/dashboard/';

  switch (role) {
    case 'super_admin':
      endpoint += 'dashboardsuperadmin.php';
      break;
    case 'admin':
      endpoint += 'dashboardadmin.php';
      break;
    case 'user':
      endpoint += 'dashboarduser.php';
      if (orgId && orgId > 0) {
        endpoint += `?org_id=${orgId}`;
      }
      break;
    default:
      throw new Error(`บทบาทที่ไม่รู้จัก: ${role}`);
  }

  const data = await apiService.get(endpoint);
  if (data && data.success === false) {
    throw new Error(data.message || 'การดึงข้อมูล Dashboard ไม่สำเร็จ (Success=false)');
  }
  return data;
}
