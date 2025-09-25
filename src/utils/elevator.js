// src/utils/elevator.js
import { organizations, buildings } from "@/data/mock";

export const bit = (str, i) => (str?.[i] === "1" ? 1 : 0);

export const LIFT_STATE_BITS = [
  { key: "powerOn", label: "ระบบทำงาน", idx: 11 },
  { key: "doorOpen", label: "ประตูเปิด", idx: 10 },
  { key: "overload", label: "น้ำหนักเกิน", idx: 9 },
  { key: "moving", label: "กำลังเคลื่อนที่", idx: 8 },
  { key: "emergency", label: "โหมดฉุกเฉิน", idx: 7 },
  { key: "maintenance", label: "โหมดบำรุงรักษา", idx: 6 },
  { key: "fault", label: "ขัดข้อง", idx: 5 },
  { key: "fire", label: "โหมดไฟไหม้", idx: 4 },
  { key: "outOfService", label: "งดให้บริการ", idx: 3 },
  { key: "atFloor", label: "จอดที่ชั้น", idx: 2 },
  { key: "alarm", label: "สัญญาณเตือน", idx: 1 },
  { key: "unknown", label: "ไม่ทราบสถานะ", idx: 0 },
];

export const decodeLiftState = (lift_state) => {
  const flags = {};
  LIFT_STATE_BITS.forEach((b) => (flags[b.key] = !!bit(lift_state, b.idx)));
  return flags;
};

export const getOrgName = (org_id) =>
  organizations.find((o) => o.id === org_id)?.org_name || `Org#${org_id}`;

export const getBuildingName = (building_id) =>
  buildings.find((b) => b.id === building_id)?.building_name ||
  `Building#${building_id}`;

export const parseFloorLabels = (floor_name) =>
  floor_name?.split(",").map((s) => s.trim()).filter(Boolean) || [];

export const getLevelsCount = (st) => {
  const labels = Array.isArray(st?.floorLabels) ? st.floorLabels.length : 0;
  const byMax = Number(st?.max_level || 0);
  return Math.max(labels, byMax, 1);
};

export const getFloorIndices = (st) =>
  Array.from({ length: getLevelsCount(st) }, (_, i) => i + 1);

export const getFloorLabel = (st, idx) =>
  st?.floorLabels?.[idx - 1] ?? String(idx);

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));

export const statusMap = {
  IDLE: "พร้อมใช้งาน",
  MOVING: "กำลังเลื่อน",
  ARRIVED: "มาถึงแล้ว",
  LOADING: "กำลังขึ้นลง",
  CALLED: "ถูกเรียก",
  MANUAL_MODE: "โหมดแมนนวล",
  AUTO_MODE: "โหมดอัตโนมัติ",
  ONLINE: "ออนไลน์",
  OFFLINE: "ออฟไลน์",
  CLOSED: "ปิด",
  OPEN: "เปิด",
  AUTO: "อัตโนมัติ",
  MANUAL: "แมนนวล",
};
export const translateStatus = (s) => statusMap[s] || s;

export const getStatusColor = (status) => {
  if (status.includes("เลื่อน")) return "text-purple-600";
  if (status.includes("มาถึง")) return "text-green-600";
  if (status.includes("ขึ้นลง")) return "text-blue-600";
  if (status.includes("ถูกเรียก")) return "text-cyan-600";
  const colorMap = {
    ONLINE: "text-green-600",
    OFFLINE: "text-red-600",
    CLOSED: "text-blue-600",
    OPEN: "text-orange-600",
    AUTO: "text-green-600",
    MANUAL: "text-yellow-600",
  };
  return colorMap[status] || "text-gray-600";
};

export const getStatusBg = (status) => {
  if (status.includes("เลื่อน")) return "bg-purple-100 border-purple-300";
  if (status.includes("มาถึง")) return "bg-green-100 border-green-300";
  if (status.includes("ขึ้นลง")) return "bg-blue-100 border-blue-300";
  if (status.includes("ถูกเรียก")) return "bg-cyan-100 border-cyan-300";
  const bgMap = {
    ONLINE: "bg-green-100 border-green-300",
    OFFLINE: "bg-red-100 border-red-300",
    CLOSED: "bg-blue-100 border-blue-300",
    OPEN: "bg-orange-100 border-orange-300",
    AUTO: "bg-green-100 border-green-300",
    MANUAL: "bg-yellow-100 border-yellow-300",
  };
  return bgMap[status] || "bg-gray-100 border-gray-300";
};
