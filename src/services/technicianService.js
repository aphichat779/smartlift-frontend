// src/services/technicianService.js
import { apiService } from "./api";

export const technicianService = {
  /** ดึงรายการงานของช่างที่ล็อกอิน */
  list() {
    return apiService.request("/api/technician/list.php", { method: "GET" });
  },

  detail(tk_id) {
    return apiService.request(`/api/technician/detail.php?tk_id=${tk_id}`, {
      method: "GET",
    });
  },

  /**
   * เปลี่ยนสถานะหลักของงาน + บันทึก log (รองรับแนบไฟล์)
   * @param {{ tk_id:number|string, tk_status:'assign'|'preparing'|'progress'|'test'|'complete', detail?:string, file?:File }}
   */
  updateStatus({ tk_id, tk_status, detail, file }) {
    // ถ้ามีไฟล์ -> ใช้ FormData
    if (file) {
      const fd = new FormData();
      fd.append("tk_id", String(tk_id));
      fd.append("tk_status", String(tk_status));
      if (detail) fd.append("detail", detail);
      fd.append("file", file);
      return apiService.request("/api/technician/update_status.php", {
        method: "POST",
        body: fd,
      });
    }
    // ไม่มีไฟล์ -> ส่ง JSON
    return apiService.request("/api/technician/update_status.php", {
      method: "POST",
      body: JSON.stringify({ tk_id, tk_status, detail }),
    });
  },

  /**
   * เพิ่มบันทึกความคืบหน้า (ไม่เปลี่ยนสถานะหลัก) + แนบไฟล์ได้
   * @param {{ tk_id:number|string, detail:string, section?:string, file?:File }}
   */
  addProgress({ tk_id, detail, section = "progress", file }) {
    if (file) {
      const fd = new FormData();
      fd.append("tk_id", String(tk_id));
      fd.append("detail", detail || "");
      fd.append("section", section);
      fd.append("file", file);
      return apiService.request("/api/technician/add_progress.php", {
        method: "POST",
        body: fd,
      });
    }
    return apiService.request("/api/technician/add_progress.php", {
      method: "POST",
      body: JSON.stringify({ tk_id, detail, section }),
    });
  },
};
