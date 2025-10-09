// src/services/liftApi.js

const API_BASE_URL =
  import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost/smartlift-backend';

/* ---------------- Token helpers (เหนียวแน่น) ---------------- */
function isLikelyJWT(s) {
  // รูปแบบ aaaa.bbbb.cccc แบบ base64url
  return typeof s === 'string'
    && s.length > 60
    && /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(s);
}

function readCookie(name) {
  try {
    const m = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
    );
    return m ? decodeURIComponent(m[1]) : null;
  } catch { return null; }
}

/** ลองดึง JWT จากทุกที่ที่พอเป็นไปได้ */
function resolveToken() {
  // 0) dev override เร็วที่สุด
  if (typeof window !== 'undefined' && isLikelyJWT(window.SMARTLIFT_TOKEN)) {
    return window.SMARTLIFT_TOKEN;
  }

  // 1) คีย์ชื่อยอดฮิต
  const candidateKeys = [
    'token', 'auth_token', 'AUTH_TOKEN', 'jwt', 'JWT', 'access_token',
    // เผื่อโปรเจกต์ใช้ชื่อเฉพาะ
    'smartlift_token', 'SMARTLIFT_TOKEN'
  ];
  for (const k of candidateKeys) {
    try {
      const v1 = localStorage.getItem(k);     if (isLikelyJWT(v1)) return v1;
      const v2 = sessionStorage.getItem(k);   if (isLikelyJWT(v2)) return v2;
      const v3 = readCookie(k);               if (isLikelyJWT(v3)) return v3;
    } catch {}
  }

  // 2) ถ้ายังไม่เจอ สแกนทุก key ใน storage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const v = localStorage.getItem(key);
      if (isLikelyJWT(v)) return v;
    }
  } catch {}
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const v = sessionStorage.getItem(key);
      if (isLikelyJWT(v)) return v;
    }
  } catch {}

  // 3) ลองจับจาก cookie ทั้งก้อน
  try {
    const pairs = document.cookie.split(';');
    for (const p of pairs) {
      const [, valRaw] = p.split('=');
      const val = valRaw ? decodeURIComponent(valRaw.trim()) : '';
      if (isLikelyJWT(val)) return val;
    }
  } catch {}

  return null;
}

/* ---------------- URL builder ---------------- */
function buildSSEUrl({ id, ids, token }) {
  const p = new URLSearchParams();
  if (id) p.set('id', String(id));
  if (ids?.length) p.set('ids', ids.join(','));

  const tk = token || resolveToken();
  if (!tk) {
    console.warn('[SSE] No token found. EventSource will fail with 401.');
  } else {
    p.set('access_token', tk);
  }

  const url = `${API_BASE_URL}/api/lifts/stream_status.php${p.toString() ? `?${p}` : ''}`;
  console.log('[SSE] URL =', url.replace(/(access_token=)[^&]+/i, '$1[REDACTED]'));
  return url;
}

/* ---------------- Public APIs ---------------- */

/**
 * เริ่ม SSE
 * @param {{id?:string, ids?:string[], token?:string,
 *          onSnapshot?:Function, onDiff?:Function, onStatusChange?:Function}} opts
 */
export function startRealtimeSSE({
  id,
  ids,
  token, // ใส่มาได้ตรง ๆ เช่นจาก AuthContext
  onSnapshot,
  onDiff,
  onStatusChange,
} = {}) {
  let es = null;

  onStatusChange?.('connecting');
  const url = buildSSEUrl({ id, ids, token });
  es = new EventSource(url);

  es.onopen = () => onStatusChange?.('connected');

  es.addEventListener('lift_snapshot', (e) => {
    try { onSnapshot?.(JSON.parse(e.data)); }
    catch (err) { console.warn('SSE snapshot parse error:', err); }
  });

  es.addEventListener('lift_diff', (e) => {
    try { onDiff?.(JSON.parse(e.data)); }
    catch (err) { console.warn('SSE diff parse error:', err); }
  });

  es.onerror = (err) => {
    console.warn('SSE: Connection error.', err);
    onStatusChange?.('error');
    // จะ reconnect ตาม retry: 1500 ที่ server ส่ง
  };

  return () => { es?.close(); console.log('SSE: Connection closed by client.'); };
}

/** REST: ดึงข้อมูลครั้งเดียว */
export async function getAllLifts({ token } = {}) {
  const url = `${API_BASE_URL}/api/lifts/get_latest_status.php`;
  const tk = token || resolveToken();
  const res = await fetch(url, {
    headers: tk ? { Authorization: `Bearer ${tk}` } : {},
  });
  if (!res.ok) throw new Error(`Failed to get all lifts: ${res.status} ${res.statusText}`);
  return res.json();
}

/** ส่งคำสั่งไปยังลิฟต์ */
export async function sendLiftCommand({ liftId, targetFloor, command = 'GOTO_FLOOR', token } = {}) {
  const url = `${API_BASE_URL}/api/lifts/send_command.php`;
  const tk = token || resolveToken();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(tk ? { Authorization: `Bearer ${tk}` } : {}),
    },
    body: JSON.stringify({ liftId, targetFloor, command }),
  });
  if (!res.ok) throw new Error(`Failed to send command: ${res.status} ${res.statusText}`);
  return res.json();
}

/**
 * ยืนยันรหัส TOTP (2FA) ก่อนดำเนินการที่สำคัญ
 * @param {string} totpCode รหัส 6 หลักจาก Authenticator App
 * @returns {Promise<object>} ผลลัพธ์จาก API
 */
export async function confirmTOTP(totpCode, { token } = {}) {
  const url = `${API_BASE_URL}/api/2fa/TOTP-confirm.php`;
  const tk = token || resolveToken();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(tk ? { Authorization: `Bearer ${tk}` } : {}),
    },
    body: JSON.stringify({ totp: totpCode }),
  });
  
  const responseData = await res.json();
  if (!res.ok || !responseData.success) {
    // ส่งต่อ message จาก backend ถ้ามี, หรือใช้ข้อความทั่วไป
    throw new Error(responseData.message || `Failed to confirm TOTP: ${res.status}`);
  }
  return responseData;
}

/** ตรวจสอบว่าลิฟต์มีงานที่เปิดอยู่หรือไม่ */
export async function getOpenJobStatus(liftId, { token } = {}) {
  const url = `${API_BASE_URL}/api/lifts/open_jobs.php?lift_id=${liftId}`;
  const tk = token || resolveToken();

  const res = await fetch(url, {
    headers: tk ? { Authorization: `Bearer ${tk}` } : {},
  });
  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || `Failed to get open job status: ${res.status}`);
  }
  return json; // { success, hasOpenJob, count }
}