// src/services/liftApi.js
import { apiService } from './api';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost';

/** ดึงครั้งเดียว (ยังมีไว้ใช้ทั่วไปได้) */
export async function fetchLatestLifts({ id, ids, debug = false } = {}) {
  const params = new URLSearchParams();
  if (id) params.set('id', String(id));
  if (ids?.length) params.set('ids', ids.join(','));
  if (debug) params.set('debug', '1');

  const url = params.toString()
    ? `/api/lifts/get_latest_status.php?${params.toString()}`
    : `/api/lifts/get_latest_status.php`;

  return apiService.request(url, { method: 'GET' });
}

/**
 * เรียลไทม์แบบ Polling + ETag
 * - ยิงซ้ำทุก intervalMs
 * - ใช้ If-None-Match/ETag → ถ้าไม่เปลี่ยนได้ 304 (ไม่โหลด payload)
 * - pause อัตโนมัติเมื่อแท็บไม่ active และ resume เมื่อกลับมา
 * - คืนฟังก์ชัน stop() สำหรับ cleanup
 */
export function startRealtimeFromLatest({
  intervalMs = 1000,
  id,
  ids,
  debug = false,
  onUpdate, // (payload) => void ; payload = { timestamp, lifts: {...} }
} = {}) {
  let timer = null;
  let etag = null;
  let running = true;
  let aborter = null;

  const buildUrl = () => {
    const p = new URLSearchParams();
    if (id) p.set('id', String(id));
    if (ids?.length) p.set('ids', ids.join(','));
    if (debug) p.set('debug', '1');
    return `${API_BASE_URL}/api/lifts/get_latest_status.php${p.toString() ? `?${p}` : ''}`;
  };

  const tick = async () => {
    try {
      aborter?.abort();
      aborter = new AbortController();

      const headers = {};
      if (etag) headers['If-None-Match'] = etag;

      const res = await fetch(buildUrl(), { headers, signal: aborter.signal });
      if (res.status === 304) return; // ไม่มีการเปลี่ยน

      etag = res.headers.get('ETag') || etag;
      const data = await res.json();
      if (data?.lifts) onUpdate?.(data);
    } catch (e) {
      if (e?.name !== 'AbortError') console.error('poll error', e);
    }
  };

  const scheduleNext = () => {
    if (!running) return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (!document.hidden) await tick();
      scheduleNext();
    }, intervalMs);
  };

  const handleVisibility = () => {
    if (document.hidden) {
      clearTimeout(timer); // pause polling
    } else {
      // resume ทันทีเมื่อกลับมา
      tick().finally(scheduleNext);
    }
  };

  document.addEventListener('visibilitychange', handleVisibility);
  // ยิงครั้งแรกทันที แล้วเริ่มรอบต่อ ๆ ไป
  tick().finally(scheduleNext);

  return () => {
    running = false;
    document.removeEventListener('visibilitychange', handleVisibility);
    clearTimeout(timer);
    aborter?.abort();
  };
}

/** ส่งคำสั่งไปยังลิฟต์ */
export async function sendLiftCommand({ liftId, targetFloor, command = 'GOTO_FLOOR' }) {
  return apiService.request('/api/lifts/send_command.php', {
    method: 'POST',
    body: JSON.stringify({ liftId, targetFloor, command }),
  });
}

export async function getLiftById(id) {
  return apiService.request(`/api/lifts/get_latest_status.php?id=${encodeURIComponent(id)}`, {
    method: 'GET',
  });
}

export async function getAllLifts() {
  return apiService.request('/api/lifts/get_latest_status.php', { method: 'GET' });
}
