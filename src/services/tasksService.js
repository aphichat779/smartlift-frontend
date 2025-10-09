// src/services/tasksService.js
import { apiService } from './api';

export const tasksService = {
  // ===== ADMIN TASKS =====
  assign(payload) {
    return apiService.request('/api/admin/tasks/assign.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiService.request(`/api/admin/tasks/list.php${qs ? `?${qs}` : ''}`);
  },
  addStatus(payload) {
    return apiService.request('/api/admin/tasks/status_add.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  technicians(q) {
    const qs = q ? `?q=${encodeURIComponent(q)}` : '';
    return apiService.request(`/api/admin/tasks/technicians.php${qs}`);
  },
  reports(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiService.request(`/api/admin/tasks/reports_open.php${qs ? `?${qs}` : ''}`);
  },

  // ===== WORK (รายงานแจ้งซ่อม) =====
  // สร้าง Report
  workCreateReport(payload) {
    return apiService.request('/api/work/reports.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // ดึง options (generic)
  workOptions(type, params = {}) {
    const q = new URLSearchParams({ options: '1', type, ...params }).toString();
    return apiService.request(`/api/work/reports.php?${q}`);
  },

  // สะดวกใช้ใน UI (แยกเป็นเมธอดตรง ๆ)
  workOrgs() {
    return this.workOptions('orgs');
  },
  workBuildings(org_id) {
    // ต้องส่ง org_id เป็นเลข/สตริงก็ได้
    return this.workOptions('buildings', { org_id });
  },
  workLifts(building_id) {
    return this.workOptions('lifts', { building_id });
  },

  // Progress ของงาน
  reportProgressByRpId(rp_id) {
    return apiService.request(`/api/work/reports.php?progress=1&rp_id=${encodeURIComponent(rp_id)}`);
  },
  reportProgressByTkId(tk_id) {
    return apiService.request(`/api/work/reports.php?progress=1&tk_id=${encodeURIComponent(tk_id)}`);
  },
};
