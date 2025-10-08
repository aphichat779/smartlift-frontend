// src/services/liftApi.js

const API_BASE_URL =
  import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost/smartlift-backend';

/**
 * เริ่มการเชื่อมต่อเรียลไทม์ด้วย Server-Sent Events (SSE)
 * - รองรับ event: lift_snapshot (ครั้งแรก) และ lift_diff (เฉพาะตัวที่เปลี่ยน)
 *
 * @param {object} options
 * @param {string}   [options.id]
 * @param {string[]} [options.ids]
 * @param {(payload: object) => void} [options.onSnapshot]
 * @param {(payload: object) => void} [options.onDiff]
 * @param {(status: 'connecting'|'connected'|'error') => void} [options.onStatusChange]
 * @returns {() => void} stop function
 */
export function startRealtimeSSE({
  id,
  ids,
  onSnapshot,
  onDiff,
  onStatusChange,
} = {}) {
  let es = null;

  const buildUrl = () => {
    const p = new URLSearchParams();
    if (id) p.set('id', String(id));
    if (ids?.length) p.set('ids', ids.join(','));
    const qs = p.toString();
    return `${API_BASE_URL}/api/lifts/stream_status.php${qs ? `?${qs}` : ''}`;
  };

  const connect = () => {
    if (es && es.readyState !== 2 /* CLOSED */) return;

    onStatusChange?.('connecting');
    const url = buildUrl();
    console.log('SSE: Connecting to', url);
    es = new EventSource(url);

    es.onopen = () => {
      onStatusChange?.('connected');
    };

    // ครั้งแรก: full snapshot
    es.addEventListener('lift_snapshot', (e) => {
      try {
        const payload = JSON.parse(e.data);
        onSnapshot?.(payload);
      } catch (err) {
        console.warn('SSE snapshot parse error:', err);
      }
    });

    // ต่อ ๆ มา: diff-only
    es.addEventListener('lift_diff', (e) => {
      try {
        const payload = JSON.parse(e.data);
        onDiff?.(payload);
      } catch (err) {
        console.warn('SSE diff parse error:', err);
      }
    });

    // เฉพาะ network/transport error เท่านั้น
    es.onerror = (err) => {
      console.warn('SSE: Connection error.', err);
      onStatusChange?.('error');
      // ให้ EventSource auto-reconnect ตาม retry ที่ server ส่ง (1500ms)
    };
  };

  connect();

  return () => {
    if (es) {
      es.close();
      console.log('SSE: Connection closed by client.');
    }
  };
}

/** ส่งคำสั่งไปยังลิฟต์ (เช่น กดเรียกลิฟต์) */
export async function sendLiftCommand({ liftId, targetFloor, command = 'GOTO_FLOOR' }) {
  const url = `${API_BASE_URL}/api/lifts/send_command.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ liftId, targetFloor, command }),
  });
  if (!res.ok) throw new Error(`Failed to send command: ${res.status} ${res.statusText}`);
  return res.json();
}

/** ดึงข้อมูลลิฟต์ทั้งหมดแบบครั้งเดียว (non-realtime) */
export async function getAllLifts() {
  const url = `${API_BASE_URL}/api/lifts/get_latest_status.php`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to get all lifts: ${res.status} ${res.statusText}`);
  return res.json();
}
