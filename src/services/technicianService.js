// src/services/technicianService.js
import { apiService } from "./api";

export const technicianService = {
  list() {
    return apiService.request("/api/technician/list.php", { method: "GET" });
  },

  detail(tk_id) {
    return apiService.request(`/api/technician/detail.php?tk_id=${tk_id}`, { method: "GET" });
  },

  updateStatus({ tk_id, tk_status, detail, file, start_date, expected_end_date, tools, tools_total_cost }) {
    if (file) {
      const fd = new FormData();
      fd.append("tk_id", String(tk_id));
      fd.append("tk_status", String(tk_status));
      if (detail) fd.append("detail", detail);
      if (start_date) fd.append("start_date", start_date);
      if (expected_end_date) fd.append("expected_end_date", expected_end_date);
      if (Array.isArray(tools) && tools.length) fd.append("tools", JSON.stringify(tools));
      if (typeof tools_total_cost === "number") fd.append("tools_total_cost", String(tools_total_cost));
      fd.append("file", file);
      return apiService.request("/api/technician/update_status.php", { method: "POST", body: fd });
    }
    return apiService.request("/api/technician/update_status.php", {
      method: "POST",
      body: JSON.stringify({ tk_id, tk_status, detail, start_date, expected_end_date, tools, tools_total_cost }),
    });
  },

  addProgress({ tk_id, detail, section = "progress", file, tools, tools_total_cost }) {
    if (file) {
      const fd = new FormData();
      fd.append("tk_id", String(tk_id));
      fd.append("detail", detail || "");
      fd.append("section", section);
      if (Array.isArray(tools) && tools.length) fd.append("tools", JSON.stringify(tools));
      if (typeof tools_total_cost === "number") fd.append("tools_total_cost", String(tools_total_cost));
      fd.append("file", file);
      return apiService.request("/api/technician/add_progress.php", { method: "POST", body: fd });
    }
    return apiService.request("/api/technician/add_progress.php", {
      method: "POST",
      body: JSON.stringify({ tk_id, detail, section, tools, tools_total_cost }),
    });
  },
};
