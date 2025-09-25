// src/data/mock.js
export const organizations = [
  { id: 1, org_name: "KU CSC" },
  { id: 3, org_name: "มหาวิทยาลัยเกษตรศาสตร์ สกลนคร" },
];

export const buildings = [
  { id: 1, org_id: 1, building_name: "อาคาร 7" },
  { id: 2, org_id: 3, building_name: "อาคาร 9" },
  { id: 3, org_id: 1, building_name: "อาคาร 1" },
];

export const lifts = [
  {
    id: 2,
    org_id: 3,
    building_id: 2,
    lift_name: "LF09",
    max_level: 10,
    mac_address: "00:10:20:30:40:50",
    floor_name: "B1,B2,G,1,2,3,4,5,6,7",
    description: "",
    lift_state: "000000000001",
    up_status: "00000000",
    down_status: "00000000",
    car_status: "00000000",
    created_at: "2025-08-31 23:49:25",
    updated_at: "2025-09-01 00:02:09",
  },
  {
    id: 3,
    org_id: 1,
    building_id: 3,
    lift_name: "LF01",
    max_level: 7,
    mac_address: "00:01:02:03:04:05",
    floor_name: "A1,A2,A3,A4,A5,A6,A7",
    description: "",
    lift_state: "000000000000",
    up_status: "00000000",
    down_status: "00000000",
    car_status: "00000000",
    created_at: "2025-09-01 00:04:00",
    updated_at: "2025-09-01 00:04:00",
  },
  {
    id: 4,
    org_id: 1,
    building_id: 1,
    lift_name: "JF12",
    max_level: 8,
    mac_address: "00:01:02:03:04:05:06:07:08:09",
    floor_name: "C1,C2,C3,C4,C5,C6,C7,C8",
    description: "77456",
    lift_state: "000000000000",
    up_status: "00000000",
    down_status: "00000000",
    car_status: "00000000",
    created_at: "2025-09-05 18:21:31",
    updated_at: "2025-09-05 18:21:31",
  },
    {
    id: 5,
    org_id: 3,
    building_id: 2,
    lift_name: "LF10",
    max_level: 10,
    mac_address: "00:10:20:30:40:50",
    floor_name: "B1,B2,G,1,2,3,4,5,6,7",
    description: "",
    lift_state: "000000000000",
    up_status: "00000000",
    down_status: "00000000",
    car_status: "00000000",
    created_at: "2025-08-31 23:49:25",
    updated_at: "2025-09-01 00:02:09",
  },
];

export const tasks = [
  {
    tk_id: 1,
    tk_status: "2",
    lift_id: 2,
    org_name: "KU",
    building_name: "อาคาร 9",
    task_start_date: "2025-09-01 09:00:00",
    tk_data: "ตรวจสอบเสียงผิดปกติที่ชั้น 3",
    user_id: 2,
    user: "Aphichat",
  },
];

// ✅ เพิ่ม mock calls / reports / task_status
export const app_calls = [
  {
    id: 101, lift_id: 2, floor_no: "3", direction: "U", client_id: "mobile-001",
    is_processed: "N", created_user_id: 2, created_at: "2025-09-01 08:59:00",
    updated_user_id: 2, updated_at: "2025-09-01 08:59:00"
  },
  {
    id: 102, lift_id: 2, floor_no: "1", direction: "U", client_id: "kiosk-01",
    is_processed: "Y", created_user_id: 2, created_at: "2025-09-01 12:00:00",
    updated_user_id: 2, updated_at: "2025-09-01 12:02:20"
  },
  {
    id: 103, lift_id: 3, floor_no: "2", direction: "D", client_id: "mobile-777",
    is_processed: "N", created_user_id: 1, created_at: "2025-09-05 10:10:00",
    updated_user_id: 1, updated_at: "2025-09-05 10:10:00"
  },
];

export const reports = [
  { rp_id: 201, lift_id: 2, date_rp: "2025-09-02", user_id: 1, detail: "พบประตูปิดช้าผิดปกติที่ชั้น 2" },
  { rp_id: 202, lift_id: 2, date_rp: "2025-09-03", user_id: 2, detail: "พื้นห้องโดยสารมีเสียงดัง" },
  { rp_id: 203, lift_id: 3, date_rp: "2025-09-04", user_id: 2, detail: "ปุ่มเรียกชั้น 3 ติด ๆ ดับ ๆ" },
];

export const task_status = [
  { tk_status_id: 9001, tk_id: 1, status: "prepared", time: "2025-09-01 08:50:00", detail: "เตรียมอุปกรณ์" },
  { tk_status_id: 9002, tk_id: 1, status: "working",  time: "2025-09-01 09:10:00", detail: "เข้าตรวจสอบหน้างาน" },
  { tk_status_id: 9003, tk_id: 1, status: "finish",   time: "2025-09-01 10:05:00", detail: "แก้ไขเรียบร้อย" },
];

// ===== Helper ฟังก์ชัน mock “เหมือน API” =====
let _nextTaskId = 2;

export function getLiftById(liftId) {
  const l = lifts.find(x => x.id === Number(liftId));
  if (!l) return null;
  const org = organizations.find(o => o.id === l.org_id);
  const b   = buildings.find(bb => bb.id === l.building_id);
  return {
    ...l,
    org_name: org?.org_name || `Org#${l.org_id}`,
    building_name: b?.building_name || `Building#${l.building_id}`,
  };
}

export function getCallsByLift(liftId, limit = 50) {
  return app_calls
    .filter(c => Number(c.lift_id) === Number(liftId))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
}

export function markCallProcessed(callId) {
  const idx = app_calls.findIndex(c => c.id === Number(callId));
  if (idx >= 0) app_calls[idx] = { ...app_calls[idx], is_processed: "Y" };
  return true;
}

export function getTasksByLift(liftId) {
  return tasks
    .filter(t => Number(t.lift_id) === Number(liftId))
    .sort((a, b) => new Date(b.task_start_date || 0) - new Date(a.task_start_date || 0));
}

export function getTaskTimeline(tkId) {
  return task_status
    .filter(t => Number(t.tk_id) === Number(tkId))
    .sort((a, b) => new Date(a.time) - new Date(b.time));
}

export function createTask({ lift_id, tk_data, priority = "normal", user_id = 1, user = "system" }) {
  const now = new Date();
  const tk = {
    tk_id: _nextTaskId++,
    tk_status: "2",
    lift_id: Number(lift_id),
    org_name: organizations.find(o => o.id === getLiftById(lift_id)?.org_id)?.org_name || "",
    building_name: buildings.find(b => b.id === getLiftById(lift_id)?.building_id)?.building_name || "",
    task_start_date: now.toISOString().slice(0, 19).replace("T", " "),
    tk_data,
    user_id,
    user,
    priority,
  };
  tasks.unshift(tk);
  return tk;
}

export function getReportsByLift(liftId) {
  return reports.filter(r => Number(r.lift_id) === Number(liftId))
    .sort((a, b) => new Date(b.date_rp) - new Date(a.date_rp));
}

export function escalateReportToTask(rp_id) {
  const r = reports.find(x => x.rp_id === Number(rp_id));
  if (!r) return null;
  return createTask({ lift_id: r.lift_id, tk_data: r.detail, user_id: r.user_id, user: `user#${r.user_id}` });
}

// Analytics จาก app_calls แบบง่าย ๆ
export function getAnalyticsForLift(liftId) {
  const rows = app_calls.filter(c => Number(c.lift_id) === Number(liftId));
  const byDayMap = new Map();
  const byHourMap = new Map(Array.from({ length: 24 }, (_, h) => [h, 0]));
  const byFloorMap = new Map();

  rows.forEach(r => {
    const d = new Date(r.created_at);
    const day = d.toISOString().slice(0, 10);
    byDayMap.set(day, (byDayMap.get(day) || 0) + 1);
    byHourMap.set(d.getHours(), (byHourMap.get(d.getHours()) || 0) + 1);
    byFloorMap.set(r.floor_no, (byFloorMap.get(r.floor_no) || 0) + 1);
  });

  // MTTR จาก task_status (prepared/working -> finish)
  const liftTasks = getTasksByLift(liftId);
  let totalSec = 0, count = 0;
  liftTasks.forEach(t => {
    const tl = getTaskTimeline(t.tk_id);
    const start = tl.find(x => x.status === "working" || x.status === "prepared");
    const finish = tl.slice().reverse().find(x => x.status === "finish");
    if (start && finish) {
      const sec = (new Date(finish.time) - new Date(start.time)) / 1000;
      if (sec > 0) { totalSec += sec; count += 1; }
    }
  });

  return {
    byDay: Array.from(byDayMap.entries()).sort((a,b)=>a[0]>b[0]?1:-1).map(([d, calls]) => ({ d, calls })),
    byHour: Array.from(byHourMap.entries()).map(([h, calls]) => ({ h, calls })),
    byFloor: Array.from(byFloorMap.entries()).sort((a,b)=>Number(a[0])-Number(b[0])).map(([label, count]) => ({ label, count })),
    mttrSeconds: count ? totalSec / count : 0,
    costMonth: liftTasks.length * 1000, // mock ง่าย ๆ
  };
}
