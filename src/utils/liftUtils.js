// src/utils/liftUtils
export const LIFT_STATE_BITS = [
  { key: "automatic", label: "อัตโนมัติ", bit: 0 },
  { key: "maintenance", label: "ซ่อมบำรุง", bit: 1 },
  { key: "fire fighting", label: "ดับเพลิง", bit: 2 },
  { key: "driving", label: "กำลังเคลื่อนที่", bit: 3 },
  { key: "special", label: "โหมดพิเศษ", bit: 4 },
  { key: "hoistway learning", label: "กำลังเรียนรู้ปล่องลิฟต์", bit: 5 },
  { key: "elevator lock", label: "ลิฟต์ล็อค", bit: 6 },
  { key: "reset", label: "กำลังรีเซ็ต", bit: 7 },
  { key: "UPS status", label: "ใช้ไฟสำรอง", bit: 8 },
  { key: "idle status", label: "รอคำสั่ง", bit: 9 },
  { key: "holding brake detection", label: "เบรกค้าง", bit: 10 },
  { key: "bypass operation", label: "บายพาส", bit: 11 },
  { key: "fullLoad", label: "บรรทุกเต็ม", bit: 6, byte: 2 },
  { key: "overload", label: "บรรทุกเกิน", bit: 7, byte: 2 },
];

/**
 * จำกัดค่าให้อยู่ในช่วงที่กำหนด
 * @param {number} value - ค่าที่ต้องการตรวจสอบ
 * @param {number} min - ค่าต่ำสุด
 * @param {number} max - ค่าสูงสุด
 * @returns {number} - ค่าที่อยู่ในช่วง [min, max]
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

/**
 * แปลงค่า Hex String เป็น Array ของชั้นที่ถูกเรียก
 * @param {string} statusHex - ค่าสถานะ Hex (เช่น '00000010')
 * @returns {number[]} - Array ของชั้นที่ถูกเรียก
 */
export function getRequestedFloors(statusHex) {
  if (!statusHex || statusHex.length < 8) return [];

  const requestedFloors = [];
  // วนลูปเพื่อแปลงค่าทีละ 2 หลัก (1 byte)
  for (let i = 0; i < statusHex.length; i += 2) {
    const hex = statusHex.substring(i, i + 2);
    const statusByte = parseInt(hex, 16);

    // i/2 คือ index ของ byte (0, 1, 2, 3)
    const baseFloor = (i / 2) * 8;

    // วนลูปตรวจสอบแต่ละบิตภายใน byte
    for (let bit = 0; bit < 8; bit++) {
      if ((statusByte >> bit) & 1) {
        // +1 เพราะชั้นเริ่มจาก 1, + (baseFloor) เพื่อให้ได้ชั้นที่ถูกต้อง
        requestedFloors.push(baseFloor + bit + 1);
      }
    }
  }
  return requestedFloors.sort((a, b) => a - b);
}

/**
 * แปลงค่า lift_state Hex String เป็น object ที่เข้าใจง่ายตามโครงสร้างใหม่
 * @param {string} stateHex - ค่า lift_state (เช่น '030900000000')
 * @returns {object} - สถานะลิฟต์ที่ถูกแปลงแล้ว
 */
export function decodeLiftState(stateHex) {
  if (!stateHex || stateHex.length < 12) {
    return {
      floorPosition: 0,
      door: "UNKNOWN",
      moving: false,
      direction: "IDLE",
      workingStatus: "IDLE",
      fullLoad: false,
      overload: false,
    };
  }

  // แปลงค่า Hex เป็น Integer ทีละ 2 หลัก
  const bytes = [];
  for (let i = 0; i < stateHex.length; i += 2) {
    bytes.push(parseInt(stateHex.substring(i, i + 2), 16));
  }

  // --- STATE1: actual floor ---
  const floorPosition = bytes[0];

  // --- STATE2: Door status & Arrows ---
  const state2 = bytes[1];
  const aDoorStatus = state2 & 0b00000111;
  const upArrow = (state2 >> 7) & 1;
  const downArrow = (state2 >> 6) & 1;

  let doorStatus = "UNKNOWN";
  if (aDoorStatus === 4) doorStatus = "OPEN";
  if (aDoorStatus === 1) doorStatus = "CLOSED";
  if (aDoorStatus === 3 || aDoorStatus === 2) doorStatus = "ANIMATING";

  let direction = "IDLE";
  if (upArrow) direction = "UP";
  if (downArrow) direction = "DOWN";

  // --- STATE3: Elevator working status & load ---
  const state3 = bytes[2];
  const workingStatus = state3 & 0b00001111;
  const fullLoad = (state3 >> 6) & 1;
  const overload = (state3 >> 7) & 1;

  const workingStatusMap = [
    "automatic", "maintenance", "fire fighting", "driving", "special",
    "hoistway learning", "elevator lock", "reset", "UPS status", "idle status",
    "holding brake detection", "bypass operation"
  ];
  const currentWorkingStatus = workingStatusMap[workingStatus] || "UNKNOWN";
  const isMoving = currentWorkingStatus === "driving";

  return {
    floorPosition: floorPosition,
    door: doorStatus,
    direction: direction,
    moving: isMoving,
    fullLoad: Boolean(fullLoad),
    overload: Boolean(overload),
    workingStatus: currentWorkingStatus,
    state2: state2,
    state3: state3,
  };
}

/**
 * Helper: แปลง '1,2,3' เป็น [1,2,3]
 * @param {string} floorLabelsString
 * @returns {string[]}
 */
export function parseFloorLabels(floorLabelsString) {
  if (!floorLabelsString) return [];
  return floorLabelsString.split(',').map(s => s.trim());
}

/**
 * Helper: หาค่าตัวเลขของชั้นสำหรับลูปการแสดงผล
 * @param {object} st
 * @returns {number[]}
 */
export function getFloorIndices(st) {
  const levels = st.floorLabels?.length || st.max_level || 1;
  return Array.from({ length: levels }, (_, i) => i + 1);
}

/**
 * Helper: แสดงชื่อชั้นตาม index
 * @param {object} st
 * @param {number} idx
 * @returns {string}
 */
export function getFloorLabel(st, idx) {
  const levels = st.floorLabels?.length || st.max_level || 1;
  const label = st.floorLabels?.[idx - 1] || idx.toString();
  return label;
}

/**
 * Helper: แปลงสถานะเป็นข้อความภาษาไทย
 */
export function translateStatus(status) {
  const translations = {
    'ONLINE': 'ออนไลน์',
    'OFFLINE': 'ออฟไลน์',
    'manual': 'แมนนวล',
    'automatic': 'อัตโนมัติ',
    'maintenance': 'ซ่อมบำรุง',
    'fire fighting': 'ดับเพลิง',
    'driving': 'กำลังเคลื่อนที่',
    'special': 'โหมดพิเศษ',
    'hoistway learning': 'กำลังเรียนรู้ปล่องลิฟต์',
    'elevator lock': 'ลิฟต์ล็อค',
    'reset': 'กำลังรีเซ็ต',
    'UPS status': 'ใช้ไฟสำรอง',
    'idle status': 'รอคำสั่ง',
    'holding brake detection': 'เบรกค้าง',
    'bypass operation': 'บายพาส',
  };
  return translations[status] || status;
}

/**
 * Helper: กำหนดสีพื้นหลังตามสถานะ
 */
export function getStatusBg(status) {
  const colors = {
    'ONLINE': 'bg-green-100',
    'OFFLINE': 'bg-red-100',
    'manual': 'bg-gray-100',
    'automatic': 'bg-blue-100',
    'maintenance': 'bg-yellow-100',
    'driving': 'bg-purple-100',
  };
  return colors[status] || 'bg-gray-100';
}

/**
 * Helper: กำหนดสีข้อความตามสถานะ
 */
export function getStatusColor(status) {
  const colors = {
    'ONLINE': 'text-green-600',
    'OFFLINE': 'text-red-600',
    'manual': 'text-gray-600',
    'automatic': 'text-blue-600',
    'maintenance': 'text-yellow-600',
    'driving': 'text-purple-600',
  };
  return colors[status] || 'text-gray-600';
}