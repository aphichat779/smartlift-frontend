// src/utils/legacyLiftParser.js

/**
 * แปลงสตริงสถานะ (Hex String) เป็นตัวเลขชั้นปัจจุบัน
 * (ใช้ STATE1: ตัวอักษร Hex 2 ตัวแรก)
 * @param {string} statusString - สตริงสถานะ เช่น "0100..."
 * @returns {number} - เลขชั้น (เริ่มต้นที่ 1)
 */
export function getCurrentLevel(statusString) {
  if (!statusString || statusString.length < 2) return 1;
  // STATE1 (ตัวอักษร 0-1) คือเลขชั้น (Hex)
  return parseInt(statusString.substring(0, 2), 16);
}

// ----------------------------------------------------------------------
// 💡 ตรรกะการอ่านสถานะเรียกชั้น: ใช้การแบ่งไบต์ (8 บิตต่อไบต์)
// สตริงสถานะเรียก 4 ไบต์ (8 ตัวอักษร Hex) รองรับชั้น 1-32
// ----------------------------------------------------------------------

/**
 * ตรวจสอบว่ามีการเรียกชั้นนั้นๆ หรือไม่ (จาก up/down/car status)
 * @param {string} statusString - สตริงสถานะการเรียก (Hex String 8 ตัวอักษร = 4 ไบต์)
 * @param {number} level - ชั้นที่ต้องการตรวจสอบ (เริ่มจาก 1)
 * @returns {boolean} - true ถ้ามีการเรียก
 */
export function checkLevel(statusString, level) {
  if (!statusString || level < 1) return false;

  // Byte Index 0-3 สำหรับชั้น 1-32
  const byteIndex = Math.floor((level - 1) / 8); 
  // Bit Index 0-7 ภายในไบต์
  const bitIndex = (level - 1) % 8;              

  // ตรวจสอบขอบเขต (สูงสุด 32 ชั้น / 4 ไบต์)
  if (byteIndex > 3 || statusString.length < (byteIndex * 2) + 2) {
    return false;
  }

  // ดึงค่า Hex 2 ตัวอักษร (1 ไบต์)
  const start = byteIndex * 2;
  const hexValue = statusString.substring(start, start + 2);
  
  // แปลงเป็นตัวเลขและสร้าง Bit Mask
  const value = parseInt(hexValue, 16);
  const mask = 1 << bitIndex;

  // ตรวจสอบบิตที่ตำแหน่งที่ต้องการ
  return (value & mask) !== 0;
}

// ----------------------------------------------------------------------

/**
 * แปลงสตริงสถานะเป็นข้อความสถานะประตู
 * (ใช้ Bit 0-1 ของ STATE2)
 * @param {string} statusString - สตริงสถานะหลัก
 * @returns {string} - ข้อความสถานะประตู
 */
export function checkDoorText(statusString) {
  if (!statusString || statusString.length < 4) return "Unknown";
  // STATE2 (ตัวอักษร 2-3)
  const value = parseInt(statusString.substring(2, 4), 16);
  const doorStatus = value & 3; // Bit 0-1
  switch (doorStatus) {
    case 0: return "Opened"; 
    case 1: return "Closed";
    case 2: return "Closing";
    case 3: return "Opening";
    default: return "Opened";
  }
}

/**
 * แปลงสตริงสถานะเป็นข้อความโหมดการทำงาน
 * (ใช้ Bit 0-3 ของ STATE3)
 * @param {string} statusString - สตริงสถานะหลัก
 * @returns {string} - ข้อความโหมดการทำงาน
 */
export function checkWorkingStatus(statusString) {
  if (!statusString || statusString.length < 6) return "Error";
  // STATE3 (ตัวอักษร 4-5)
  const value = parseInt(statusString.substring(4, 6), 16);
  const workingStatus = value & 15; // Bit 0-3
  switch (workingStatus) {
    case 0: return "Auto";
    case 1: return "INSP";
    case 2: return "Fire";
    case 3: return "Driving";
    case 4: return "Special";
    case 5: return "Learning";
    case 6: return "Lock";
    case 7: return "Reset";
    case 8: return "UPS";
    case 9: return "Idle";
    case 10: return "Break";
    case 11: return "Bypass";
    default: return "Error";
  }
}

/**
 * แปลงสตริงสถานะเป็นความเร็ว (m/s)
 * (ใช้ STATE5 + STATE6: ตัวอักษร 8-11)
 * @param {string} statusString - สตริงสถานะหลัก
 * @returns {number} - ความเร็ว (m/s)
 */
export function checkSpeed(statusString) {
  if (!statusString || statusString.length < 12) return 0;
  // STATE5 (High) + STATE6 (Low) รวมกัน 4 ตัวอักษร Hex
  const value = parseInt(statusString.substring(8, 12), 16); 
  // แปลง: ค่า 16 บิต (mm/s) เป็น m/s
  return (parseInt(value / 100) / 10); 
}

/**
 * แปลงสตริงสถานะเป็นรหัสข้อผิดพลาด
 * (ใช้ STATE4: ตัวอักษร 6-7)
 * @param {string} statusString - สตริงสถานะหลัก
 * @returns {number} - รหัสข้อผิดพลาด
 */
export function checkError(statusString) {
  if (!statusString || statusString.length < 8) return 0;
  // STATE4 (ตัวอักษร 6-7)
  return parseInt(statusString.substring(6, 8), 16);
}

/**
 * แปลงสตริงสถานะเป็นทิศทางการเคลื่อนที่
 * (ใช้ Bit 6, 7 ของ STATE2)
 * @param {string} statusString - สตริงสถานะหลัก
 * @returns {string|null} - 'UP', 'DOWN', หรือ null
 */
export function checkDirection(statusString) {
  if (!statusString || statusString.length < 4) return null;
  // STATE2 (ตัวอักษร 2-3)
  const value = parseInt(statusString.substring(2, 4), 16); 
  const upArrow = (value & 0x80) !== 0; // BIT 7
  const downArrow = (value & 0x40) !== 0; // BIT 6

  if (upArrow) return 'UP';
  if (downArrow) return 'DOWN';
  return null;
}