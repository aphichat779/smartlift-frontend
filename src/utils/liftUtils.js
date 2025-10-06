// src/utils/liftUtils.js



/**

 * สร้าง array ของ index ชั้น (เริ่มจาก 1)

 * @param {object} st - ข้อมูลลิฟต์

 * @returns {number[]} - array ของเลขชั้น [1, 2, 3, ...]

 */

export function getFloorIndices(st) {

  if (!st?.floor_name) return [];

  // แบ่งชื่อชั้นแล้วสร้าง index โดยเริ่มจาก 1

  return st.floor_name.split(',').map((_, i) => i + 1);

}



/**

 * ดึงชื่อของชั้นที่ต้องการ

 * @param {object} st - ข้อมูลลิฟต์

 * @param {number} idx - index ของชั้น (เริ่มจาก 1)

 * @returns {string} - ชื่อชั้น

 */

export function getFloorLabel(st, idx) {

  if (!st?.floor_name) return `ชั้น ${idx}`;

  const labels = st.floor_name.split(',').map(f => f.trim());

  // ใช้ idx-1 เพราะ array เริ่มจาก 0

  return labels[idx - 1] ?? `ชั้น ${idx}`;

}



export const getStatusBg = (status) => {

  switch (status) {

    case 'NORMAL': return 'bg-green-100';

    case 'FAULT': return 'bg-red-100';

    default: return 'bg-gray-100';

  }

};



export const getStatusColor = (status) => {

  switch (status) {

    case 'NORMAL': return 'text-green-800';

    case 'FAULT': return 'text-red-800';

    default: return 'text-gray-800';

  }

};