// src/utils/legacyLiftParser.js

/**
 * แปลงสตริงสถานะ (Hex String) เป็นตัวเลขชั้นปัจจุบัน
 * @param {string} statusString - สตริงสถานะ เช่น "0100..."
 * @returns {number} - เลขชั้น
 */
export function getCurrentLevel(statusString) {
  if (!statusString || statusString.length < 2) return 1;
  return parseInt(statusString.substring(0, 2), 16);
}

// ----------------------------------------------------------------------
// 🔄 ปรับปรุง: checkLevel ให้ใช้ตรรกะแบบแบ่งไบต์ (8 บิตต่อไบต์) 
// เพื่อให้สอดคล้องกับโค้ดตัวอย่างเดิมและหลีกเลี่ยงปัญหา 32-bit Integer ใน JS
// ----------------------------------------------------------------------

/**
 * ตรวจสอบว่ามีการเรียกชั้นนั้นๆ หรือไม่ (จาก up/down/car status)
 * @param {string} statusString - สตริงสถานะของการเรียก (Hex String 8 ตัวอักษร = 4 ไบต์)
 * @param {number} level - ชั้นที่ต้องการตรวจสอบ (เริ่มจาก 1)
 * @returns {boolean} - true ถ้ามีการเรียก
 */
export function checkLevel(statusString, level) {
  if (!statusString || level < 1) return false;

  // 1. กำหนดไบต์ที่ต้องใช้ (Byte Index 0-3 สำหรับชั้น 1-32)
  const byteIndex = Math.floor((level - 1) / 8); 
  // 2. กำหนดบิตที่ต้องใช้ภายในไบต์ (Bit Index 0-7)
  const bitIndex = (level - 1) % 8;              

  // ตรวจสอบว่าเกินขอบเขต 32 ชั้นหรือไม่ หรือ String สั้นเกินไป
  if (byteIndex > 3 || statusString.length < (byteIndex * 2) + 2) {
    return false;
  }

  // 3. ดึงค่า Hex 2 ตัวอักษร (1 ไบต์) ตามตำแหน่ง byteIndex
  const start = byteIndex * 2;
  const hexValue = statusString.substring(start, start + 2);
  
  // 4. แปลงเป็นตัวเลขและสร้าง Bit Mask
  const value = parseInt(hexValue, 16);
  const mask = 1 << bitIndex;

  // 5. ตรวจสอบบิต
  return (value & mask) !== 0;
}

// ----------------------------------------------------------------------

/**
 * แปลงสตริงสถานะเป็นข้อความสถานะประตู (ใช้ Bit 0-1 ของ STATE2)
 * @param {string} statusString - สตริงสถานะหลัก
 * @returns {string} - ข้อความสถานะประตู
 */
export function checkDoorText(statusString) {
  if (!statusString || statusString.length < 4) return "Unknown";
  const value = parseInt(statusString.substring(2, 4), 16);
  // ใช้ Bit 0-1 ตามโค้ดเดิม (แม้ว่าตารางจะระบุ Bit 0-2)
  const doorStatus = value & 3; 
  switch (doorStatus) {
    case 0: return "Opened"; 
    case 1: return "Closed";
    case 2: return "Closing";
    case 3: return "Opening";
    default: return "Opened";
  }
}

/**
 * แปลงสตริงสถานะเป็นข้อความโหมดการทำงาน (ใช้ Bit 0-3 ของ STATE3)
 * @param {string} statusString - สตริงสถานะหลัก
 * @returns {string} - ข้อความโหมดการทำงาน
 */
export function checkWorkingStatus(statusString) {
  if (!statusString || statusString.length < 6) return "Error";
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
 * แปลงสตริงสถานะเป็นความเร็ว (m/s) (ใช้ STATE5+STATE6)
 * @param {string} statusString - สตริงสถานะหลัก
 * @returns {number} - ความเร็ว
 */
export function checkSpeed(statusString) {
  if (!statusString || statusString.length < 12) return 0;
  // ดึง STATE5 (High) และ STATE6 (Low) รวมกัน 4 ตัวอักษร Hex
  const value = parseInt(statusString.substring(8, 12), 16); 
  // การแปลง: xx.xxx m/s โดยสมมติว่าค่า 16 บิตคือ mm/s
  return (parseInt(value / 100) / 10); 
}

/**
 * แปลงสตริงสถานะเป็นรหัสข้อผิดพลาด (ใช้ STATE4)
 * @param {string} statusString - สตริงสถานะหลัก
 * @returns {number} - รหัสข้อผิดพลาด
 */
export function checkError(statusString) {
  if (!statusString || statusString.length < 8) return 0;
  return parseInt(statusString.substring(6, 8), 16);
}

/**
 * แปลงสตริงสถานะเป็นทิศทางการเคลื่อนที่ (ใช้ Bit 6, 7 ของ STATE2)
 * @param {string} statusString - สตริงสถานะหลัก
 * @returns {string|null} - 'UP', 'DOWN', หรือ null
 */
export function checkDirection(statusString) {
  if (!statusString || statusString.length < 4) return null;
  // STATE2 คือ statusString.substring(2, 4)
  const value = parseInt(statusString.substring(2, 4), 16); 
  const upArrow = (value & 0x80) !== 0; // BIT 7
  const downArrow = (value & 0x40) !== 0; // BIT 6

  if (upArrow) return 'UP';
  if (downArrow) return 'DOWN';
  return null;
}