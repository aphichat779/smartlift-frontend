// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ถ้าเป็น FormData ไม่ต้องตั้ง Content-Type ให้ browser จัดการ boundary เอง
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        throw new Error('AUTH_EXPIRED');
      }

      // พยายาม parse JSON ถ้าไม่ได้ให้โยนข้อความดิบ
      let data;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text || 'Unexpected response' };
      }

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ==========================
  // Dashboard
  // ==========================
  async getDashboard(section) {
    const ep = section
      ? `/api/dashboard/dashboard.php?section=${encodeURIComponent(section)}`
      : `/api/dashboard/dashboard.php`;
    return this.request(ep, { method: 'GET' });
  }

  // ==========================
  // Auth & Profile
  // ==========================
  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getProfile() {
    return this.request('/api/user/profile');
  }

  async updateProfile(profileData) {
    return this.request('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async uploadProfileImage(imageFile) {
    const formData = new FormData();
    formData.append('profile_image', imageFile);
    return this.request('/api/user/profile', {
      method: 'POST',
      body: formData,
    });
  }

  // ==========================
  // 2FA
  // ==========================
  async setup2FA() {
    return this.request('/api/2fa/setup', { method: 'POST' });
  }

  async verifySetup2FA(totpCode) {
    return this.request('/api/2fa/verify-setup', {
      method: 'POST',
      body: JSON.stringify({ totp_code: totpCode }),
    });
  }

  async verify2FA(tempToken, code) {
    return this.request('/api/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ temp_token: tempToken, code }),
    });
  }

  async requestReset2FA(username, method) {
    return this.request('/api/2fa/reset-request', {
      method: 'POST',
      body: JSON.stringify({ username, method }),
    });
  }

  async verifyReset2FA(username, otpCode) {
    return this.request('/api/2fa/reset-verify', {
      method: 'POST',
      body: JSON.stringify({ username, otp_code: otpCode }),
    });
  }

  async confirmTOTP(totpCode) {
    return this.request('/api/2fa/TOTP-confirm', {
      method: 'POST',
      body: JSON.stringify({ totp: totpCode }),
    });
  }

  // ==========================
  // Organizations
  // ==========================
  async getOrganizations() {
    return this.request('/api/elevator/organizations');
  }

  async getOrganization(id) {
    return this.request(`/api/elevator/organizations?id=${id}`);
  }

  async createOrganization(orgData) {
    return this.request('/api/elevator/organizations', {
      method: 'POST',
      body: JSON.stringify(orgData),
    });
  }

  async updateOrganization(id, orgData) {
    return this.request('/api/elevator/organizations', {
      method: 'PUT',
      body: JSON.stringify({ id, ...orgData }),
    });
  }

  async deleteOrganization(id) {
    return this.request(`/api/elevator/organizations?id=${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================
  // Buildings
  // ==========================
  async getBuildings(org_id = null) {
    const endpoint = org_id
      ? `/api/elevator/buildings?org_id=${org_id}`
      : '/api/elevator/buildings';
    return this.request(endpoint);
  }

  async getBuilding(id) {
    return this.request(`/api/elevator/buildings?id=${id}`);
  }

  async createBuilding(buildingData) {
    return this.request('/api/elevator/buildings', {
      method: 'POST',
      body: JSON.stringify(buildingData),
    });
  }

  async updateBuilding(id, buildingData) {
    return this.request('/api/elevator/buildings', {
      method: 'PUT',
      body: JSON.stringify({ id, ...buildingData }),
    });
  }

  async deleteBuilding(id) {
    return this.request(`/api/elevator/buildings?id=${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================
  // Elevators
  // ==========================
  async getElevators(org_id = null, building_id = null) {
    let endpoint = '/api/elevator/lifts';
    const params = new URLSearchParams();
    if (org_id) params.append('org_id', org_id);
    if (building_id) params.append('building_id', building_id);
    if (params.toString()) endpoint += `?${params.toString()}`;
    return this.request(endpoint);
  }

  async createElevator(elevatorData) {
    return this.request('/api/elevator/lifts', {
      method: 'POST',
      body: JSON.stringify(elevatorData),
    });
  }

  async updateElevator(id, elevatorData) {
    return this.request('/api/elevator/lifts', {
      method: 'PUT',
      body: JSON.stringify({ id, ...elevatorData }),
    });
  }

  async deleteElevator(id) {
    return this.request(`/api/elevator/lifts?id=${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================
  // Reports
  // ==========================
  async getReports(org_id = null) {
    let endpoint = '/api/work/reports.php';
    if (org_id) endpoint += `?org_id=${org_id}`;
    return this.request(endpoint);
  }

  async getReport(id) {
    return this.request(`/api/work/reports.php?id=${id}`);
  }

  async createReport(reportData) {
    return this.request('/api/work/reports.php', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async updateReport(reportData) {
    return this.request('/api/work/reports.php', {
      method: 'PUT',
      body: JSON.stringify(reportData),
    });
  }

  async deleteReport(id) {
    return this.request(`/api/work/reports.php?id=${id}`, {
      method: 'DELETE',
    });
  }

  // >>> NEW: Progress API <<<
  async getReportProgressByReport(rp_id) {
    return this.request(`/api/work/reports.php?progress=1&rp_id=${rp_id}`);
  }

  async getReportProgressByTask(tk_id) {
    return this.request(`/api/work/reports.php?progress=1&tk_id=${tk_id}`);
  }

  // ==========================
  // Admin Users
  // ==========================
  async getUsers(page = 1, limit = 20) {
    // ✅ backend ใช้ users.php
    return this.request(`/api/admin/users.php?page=${page}&limit=${limit}`);
  }

  async adminUpdateUser(userId, updates = {}) {
    const uid = Number(userId);
    if (!uid || Number.isNaN(uid)) {
      throw new Error('userId ไม่ถูกต้อง');
    }

    const tasks = [];

    // เปลี่ยนบทบาท
    if (typeof updates.role === 'string') {
      tasks.push(
        this.request('/api/admin/users.php', {
          method: 'POST',
          body: JSON.stringify({
            user_id: uid,
            action: 'update_role',
            role: updates.role,
          }),
        })
      );
    }

    // เปลี่ยนองค์กร
    if (typeof updates.org_id === 'number') {
      tasks.push(
        this.request('/api/admin/users.php', {
          method: 'POST',
          body: JSON.stringify({
            user_id: uid,
            action: 'update_user_org',
            org_id: updates.org_id,
          }),
        })
      );
    }

    if (tasks.length === 0) {
      return { success: true, message: 'ไม่มีสิ่งที่ต้องอัปเดต' };
    }

    const results = await Promise.all(tasks);
    return { success: true, results };
  }

  async adminToggleUserStatus(userId, isActive) {
    const uid = Number(userId);
    return this.request('/api/admin/users.php', {
      method: 'POST',
      body: JSON.stringify({
        user_id: uid,
        action: 'toggle_status',
        is_active: isActive ? 1 : 0,
      }),
    });
  }

  async adminReset2FA(userId, reason) {
    const uid = Number(userId);
    // ✅ ให้ใช้ไฟล์ .php ตามสไตล์ backend ปัจจุบัน
    return this.request('/api/admin/reset-2fa.php', {
      method: 'POST',
      body: JSON.stringify({ user_id: uid, reason }),
    });
  }
}

export const apiService = new ApiService();
