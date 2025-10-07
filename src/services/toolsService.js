// src/services/toolsService.js
const BASE = (import.meta.env.VITE_REACT_APP_API_URL || "http://localhost").replace(/\/+$/, "");

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
});

async function toJson(res) {
  let json = null;
  try {
    json = await res.json();
  } catch {
    // noop
  }
  if (!res.ok) {
    const msg = json?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  if (json && json.ok === false) {
    throw new Error(json.message || "Request failed");
  }
  return json;
}

export const toolsService = {
  /**
   * ดึงรายการเครื่องมือ (ไม่บังคับ auth ในฝั่ง backend แต่ส่ง header ไปได้)
   */
  async list({ q = "", page = 1, perPage = 12 } = {}) {
    const url = new URL(`${BASE}/api/work/tools.php`);
    if (q) url.searchParams.set("q", q);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        ...authHeader(),
      },
    });
    const json = await toJson(res);
    return json; // { ok, data, pagination }
  },

  /**
   * สร้างเครื่องมือ
   * รองรับ 2 โหมด:
   *  - ส่งไฟล์: FormData (field: tool_img)
   *  - ส่ง URL: JSON (field: tool_img เป็น string)
   */
  async create({ tool_name, cost, file, imageUrl } = {}) {
    if (!tool_name?.trim()) throw new Error("กรุณาระบุชื่อเครื่องมือ");
    if (cost == null || Number.isNaN(Number(cost)) || Number(cost) < 0) {
      throw new Error("ต้นทุนต้องเป็นจำนวนเต็ม 0 ขึ้นไป");
    }

    // 1) มีไฟล์ → ใช้ multipart/form-data
    if (file instanceof File) {
      const fd = new FormData();
      fd.append("tool_name", tool_name.trim());
      fd.append("cost", String(parseInt(cost, 10)));
      fd.append("tool_img", file);

      const res = await fetch(`${BASE}/api/work/tools.php`, {
        method: "POST",
        headers: {
          ...authHeader(), // อย่าใส่ Content-Type เอง ให้ browser จัดการ boundary
        },
        body: fd,
      });
      const json = await toJson(res);
      return json.data;
    }

    // 2) ไม่มีไฟล์ → ส่ง JSON (ถ้ามี imageUrl จะบันทึกลง tool_img)
    const payload = {
      tool_name: tool_name.trim(),
      cost: parseInt(cost, 10),
    };
    if (typeof imageUrl === "string" && imageUrl.trim() !== "") {
      payload.tool_img = imageUrl.trim();
    }

    const res = await fetch(`${BASE}/api/work/tools.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(payload),
    });
    const json = await toJson(res);
    return json.data;
  },

  /**
   * อัปเดตเครื่องมือ
   * โหมดที่รองรับ:
   *  - อัปโหลดไฟล์ใหม่: ใช้ method override (POST + _method=PUT) + FormData
   *  - เปลี่ยนเป็น URL/แก้ชื่อ/แก้ cost/ลบรูป: ใช้ PUT + JSON
   *      - ส่ง { imageUrl } เพื่อเซ็ต URL
   *      - ส่ง { removeImage: true } เพื่อลบรูป (SET NULL)
   */
  async update(id, { tool_name, cost, file, imageUrl, removeImage } = {}) {
    if (!id) throw new Error("ต้องระบุ id");

    // 1) มีไฟล์ → multipart + _method=PUT
    if (file instanceof File) {
      const fd = new FormData();
      fd.append("_method", "PUT");
      if (tool_name !== undefined) fd.append("tool_name", String(tool_name));
      if (cost !== undefined) fd.append("cost", String(parseInt(cost, 10)));
      fd.append("tool_img", file);

      const res = await fetch(`${BASE}/api/work/tools.php?id=${encodeURIComponent(id)}`, {
        method: "POST",
        headers: {
          ...authHeader(),
        },
        body: fd,
      });
      const json = await toJson(res);
      return json.data;
    }

    // 2) ไม่มีไฟล์ → ใช้ PUT + JSON
    const payload = {};
    if (tool_name !== undefined) payload.tool_name = String(tool_name);
    if (cost !== undefined) payload.cost = parseInt(cost, 10);

    if (removeImage) {
      payload.remove_image = 1; // backend จะ SET NULL
    } else if (typeof imageUrl === "string") {
      const trimmed = imageUrl.trim();
      if (trimmed) payload.tool_img = trimmed; // เซ็ต URL ใหม่
    }

    const res = await fetch(`${BASE}/api/work/tools.php?id=${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(payload),
    });
    const json = await toJson(res);
    return json.data;
  },

  /**
   * ลบเครื่องมือ
   */
  async remove(id) {
    if (!id) throw new Error("ต้องระบุ id");
    const res = await fetch(`${BASE}/api/work/tools.php?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        ...authHeader(),
      },
    });
    await toJson(res);
    return true;
  },
};
