// src/services/tasksService.js
import { apiService } from './api';

export const tasksService = {
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
};
