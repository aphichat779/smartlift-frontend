// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const cleanedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseURL}${cleanedEndpoint}`;

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

  // Generic
  async get(endpoint) { return this.request(endpoint); }
  async post(endpoint, data) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) }); }
  async put(endpoint, data) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) }); }
  async del(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }

  // Auth & Profile
  async register(userData) { return this.post('/api/auth/register', userData); }
  async login(credentials) { return this.post('/api/auth/login', credentials); }
  async getProfile() { return this.get('/api/user/profile'); }
  async updateProfile(profileData) { return this.put('/api/user/profile', profileData); }
  async uploadProfileImage(imageFile) {
    const formData = new FormData();
    formData.append('profile_image', imageFile);
    return this.request('/api/user/profile', { method: 'POST', body: formData });
  }

  // 2FA
  async setup2FA() { return this.request('/api/2fa/setup', { method: 'POST' }); }
  async verifySetup2FA(totpCode) { return this.post('/api/2fa/verify-setup', { totp_code: totpCode }); }
  async verify2FA(tempToken, code) { return this.post('/api/2fa/verify', { temp_token: tempToken, code }); }
  async requestReset2FA(username, method) { return this.post('/api/2fa/reset-request', { username, method }); }
  async verifyReset2FA(username, otpCode) { return this.post('/api/2fa/reset-verify', { username, otp_code: otpCode }); }
  async confirmTOTP(totpCode) { return this.post('/api/2fa/TOTP-confirm', { totp: totpCode }); }

  // Organizations
  async getOrganizations() { return this.get('/api/elevator/organizations'); }
  async getOrganization(id) { return this.get(`/api/elevator/organizations?id=${id}`); }
  async createOrganization(orgData) { return this.post('/api/elevator/organizations', orgData); }
  async updateOrganization(id, orgData) { return this.put('/api/elevator/organizations', { id, ...orgData }); }
  async deleteOrganization(id) { return this.del(`/api/elevator/organizations?id=${id}`); }

  // Buildings
  async getBuildings(org_id = null) {
    const endpoint = org_id ? `/api/elevator/buildings?org_id=${org_id}` : '/api/elevator/buildings';
    return this.get(endpoint);
  }
  async getBuilding(id) { return this.get(`/api/elevator/buildings?id=${id}`); }
  async createBuilding(buildingData) { return this.post('/api/elevator/buildings', buildingData); }
  async updateBuilding(id, buildingData) { return this.put('/api/elevator/buildings', { id, ...buildingData }); }
  async deleteBuilding(id) { return this.del(`/api/elevator/buildings?id=${id}`); }

  // Elevators
  async getElevators(org_id = null, building_id = null) {
    let endpoint = '/api/elevator/lifts';
    const params = new URLSearchParams();
    if (org_id) params.append('org_id', org_id);
    if (building_id) params.append('building_id', building_id);
    if (params.toString()) endpoint += `?${params.toString()}`;
    return this.get(endpoint);
  }
  async createElevator(elevatorData) { return this.post('/api/elevator/lifts', elevatorData); }
  async updateElevator(id, elevatorData) { return this.put('/api/elevator/lifts', { id, ...elevatorData }); }
  async deleteElevator(id) { return this.del(`/api/elevator/lifts?id=${id}`); }

  // Reports
  async getReports(org_id = null) {
    let endpoint = '/api/work/reports.php';
    if (org_id) endpoint += `?org_id=${org_id}`;
    return this.get(endpoint);
  }
  async getReport(id) { return this.get(`/api/work/reports.php?id=${id}`); }
  async createReport(reportData) { return this.post('/api/work/reports.php', reportData); }
  async updateReport(reportData) { return this.put('/api/work/reports.php', reportData); }
  async deleteReport(id) { return this.del(`/api/work/reports.php?id=${id}`); }
  async getReportProgressByReport(rp_id) { return this.get(`/api/work/reports.php?progress=1&rp_id=${rp_id}`); }
  async getReportProgressByTask(tk_id) { return this.get(`/api/work/reports.php?progress=1&tk_id=${tk_id}`); }

  // Admin
  async getUsers(page = 1, limit = 20) { return this.get(`/api/admin/users.php?page=${page}&limit=${limit}`); }
  async adminUpdateUser(userId, updates = {}) {
    const uid = Number(userId);
    if (!uid || Number.isNaN(uid)) throw new Error('userId ไม่ถูกต้อง');
    const tasks = [];
    if (typeof updates.role === 'string') tasks.push(this.post('/api/admin/users.php', { user_id: uid, action: 'update_role', role: updates.role }));
    if (typeof updates.org_id === 'number') tasks.push(this.post('/api/admin/users.php', { user_id: uid, action: 'update_user_org', org_id: updates.org_id }));
    if (tasks.length === 0) return { success: true, message: 'ไม่มีสิ่งที่ต้องอัปเดต' };
    const results = await Promise.all(tasks);
    return { success: true, results };
  }
  async adminToggleUserStatus(userId, isActive) {
    const uid = Number(userId);
    return this.post('/api/admin/users.php', { user_id: uid, action: 'toggle_status', is_active: isActive ? 1 : 0 });
  }
  async adminReset2FA(userId, reason) { return this.post('/api/admin/reset-2fa.php', { user_id: Number(userId), reason }); }
}

export const apiService = new ApiService();
