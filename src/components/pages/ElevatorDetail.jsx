// src/components/pages/ElevatorDetail.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// สมมติว่าไฟล์เหล่านี้อยู่ใน src/data/mock และ src/components/elevator
import { lifts, buildings, organizations, tasks } from "@/data/mock";
import ElevatorShaft from "@/components/elevator/ElevatorShaft";

/* ------------------------------------------------------
    Bit helpers & labels
------------------------------------------------------ */
const bit = (str, i) => (str && str[i] === "1" ? 1 : 0);

const LIFT_STATE_BITS = [
  { key: "powerOn", label: "พร้อมให้บริการ", idx: 11, group: "detail" },
  { key: "doorOpen", label: "ประตูเปิด", idx: 10, group: "detail" },
  { key: "overload", label: "น้ำหนักเกิน", idx: 9, group: "detail" },
  { key: "moving", label: "กำลังเคลื่อนที่", idx: 8, group: "detail" },
  { key: "emergency", label: "โหมดฉุกเฉิน", idx: 7, group: "detail" },
  { key: "maintenance", label: "โหมดบำรุงรักษา", idx: 6, group: "detail" },
  { key: "fault", label: "ขัดข้อง", idx: 5, group: "detail" },
  { key: "fire", label: "โหมดไฟไหม้", idx: 4, group: "detail" },
  { key: "outOfService", label: "งดให้บริการ", idx: 3, group: "detail" },
  { key: "atFloor", label: "จอดที่ชั้น", idx: 2, group: "detail" },
  { key: "alarm", label: "สัญญาณเตือน", idx: 1, group: "detail" },
  { key: "unknown", label: "ไม่ทราบสถานะ", idx: 0, group: "detail" },
];


function decodeBits(str, map) {
  const out = {};
  let allBitsAreZero = true; 
  for (const m of map) {
    out[m.key] = bit(str, m.idx) === 1;
    if (out[m.key]) {
      allBitsAreZero = false;
    }
  }

  out.unknown = allBitsAreZero;

  return out;
}

/* ------------------------------------------------------
    Small presentational primitives
------------------------------------------------------ */


function Chip({ tone = "slate", active = false, children }) {
  const tones = {
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    gray: "bg-gray-50 text-gray-700 border-gray-200",
  };
  const dot = active ? "bg-emerald-500" : "bg-gray-400";
  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border ${tones[tone]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

function Section({ title, right, children, className = "" }) {
  return (
    <section className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function KV({ k, v }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
      <div className="text-gray-500 text-sm font-medium">{k}</div>
      <div className="text-gray-900 text-sm">{v}</div>
    </div>
  );
}

function Metric({ label, value, sub }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-extrabold text-gray-900 leading-tight">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

// Popup แบบไม่ซ้อน AnimatePresence + a11y + ปุ่ม Esc
function Popup({ title, children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="ปิดหน้าต่าง"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------
    Main page
------------------------------------------------------ */
export default function ElevatorDetail() {
  const { id } = useParams();

  const lift = useMemo(() => lifts.find((l) => l.id === Number(id)), [id]);
  const building = useMemo(() => buildings.find((b) => b.id === lift?.building_id), [lift]);
  const org = useMemo(() => organizations.find((o) => o.id === lift?.org_id), [lift]);

  const floors = useMemo(() => {
    const raw = lift?.floor_name ?? "";
    return raw
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
  }, [lift?.floor_name]);

  // decode ครั้งเดียว ใช้ทั้งหน้า
  const decoded = useMemo(() => decodeBits(lift?.lift_state, LIFT_STATE_BITS), [lift?.lift_state]);

  const relatedTasks = useMemo(
    () => tasks.filter((t) => Number(t.lift_id) === lift?.id),
    [lift?.id]
  );

  // mock stats
  const callStats = useMemo(() => {
    if (!floors.length) return [];
    const base = [12, 18, 9, 14, 8, 6, 11, 7, 10, 5, 4, 3];
    return floors.map((f, i) => ({ name: `ชั้น ${f}`, calls: base[i % base.length] }));
  }, [floors]);

  /* ====== Mini Simulation state ====== */
  // ใช้ index แบบ 1-based ให้สอดคล้องกับ UI
  const [floorPos, setFloorPos] = useState(1);
  const [targetIdx, setTargetIdx] = useState(1);
  const [moving, setMoving] = useState(false);
  const [door, setDoor] = useState("OPEN");
  const [doorAnimating, setDoorAnimating] = useState(false);

  // popup controller
  const [activePopup, setActivePopup] = useState(null);

  // รีเซ็ตเมื่อเปลี่ยนลิฟต์
  useEffect(() => {
    setFloorPos(1);
    setTargetIdx(1);
    setMoving(false);
    setDoor("OPEN");
    setDoorAnimating(false);
  }, [id]);

  // เดินเครื่องจำลอง
  useEffect(() => {
    if (!floors.length) return;
    if (Math.abs(floorPos - targetIdx) < 0.001) return;

    setMoving(true);
    setDoor("CLOSED");

    const speed = 0.05;
    const iv = setInterval(() => {
      setFloorPos((prev) => {
        let next = prev + (prev < targetIdx ? speed : -speed);
        const arrived =
          (prev < targetIdx && next >= targetIdx) ||
          (prev > targetIdx && next <= targetIdx);

        if (arrived) {
          next = targetIdx;
          setMoving(false);
          // เปิด/ปิดประตูสั้นๆ
          setTimeout(() => {
            setDoorAnimating(true);
            setDoor("OPEN");
            setTimeout(() => {
              setDoor("CLOSED");
              setDoorAnimating(false);
            }, 1200);
          }, 250);
          clearInterval(iv);
        }
        return next;
      });
    }, 50);

    return () => clearInterval(iv);
  }, [targetIdx, floors.length, floorPos]);

  const direction = moving ? (floorPos < targetIdx ? "UP" : "DOWN") : null;

  if (!lift) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center text-center">
        <div className="space-y-3">
          <p className="text-2xl font-bold text-gray-800">ไม่พบข้อมูลลิฟต์</p>
          <p className="text-gray-500">ตรวจสอบรหัสลิฟต์ใน URL</p>
          <Link className="text-blue-600 underline" to="/monitor">กลับไป Monitor</Link>
        </div>
      </div>
    );
  }

  /* ------------------ Quick metrics ------------------ */
  const uptime = decoded?.powerOn ? "99.7%" : "—";
  const callsToday = callStats.reduce((a, c) => a + c.calls, 0) % 87;
  const lastService = new Date(lift.updated_at).toLocaleDateString();

  // helper: ป้ายชื่อชั้นปัจจุบันแบบ “ล็อก” เมื่ออยู่กึ่งกลางชั้น
  const currentFloorLabel = useMemo(() => {
    if (!floors.length) return "-";
    const idx = Math.min(floors.length, Math.max(1, Math.round(floorPos)));
    return floors[idx - 1] ?? idx;
  }, [floors, floorPos]);

  // helper: ป้ายชื่อเป้าหมาย
  const targetFloorLabel = useMemo(() => {
    if (!floors.length) return "-";
    return floors[targetIdx - 1] ?? targetIdx;
  }, [floors, targetIdx]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-1">
        <div className="flex items-center gap-3">
          <Link to="/monitor" className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-sm font-medium transition-colors">
            <span className="sr-only">กลับ</span> ←
          </Link>
        </div>
        <div className="md:text-center flex-grow">
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">รายละเอียดลิฟต์: {lift.lift_name}</h1>
          <p className="text-gray-500 mt-1">{org?.org_name || "-"} {building?.building_name || "-"}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-md hover:bg-blue-700 transition-colors">
            เรียกช่าง / สร้างงาน
          </button>
        </div>
      </div>

      {/* Content grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Main */}
          <div className="xl:col-span-2 space-y-6">
            <Section
              title="ซิมูเลเตอร์การทำงาน"
              right={
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex flex-wrap gap-2">
                    {LIFT_STATE_BITS
                      .filter((m) => decoded?.[m.key])
                      .map((m) => {
                        let tone = "blue"; // สีเริ่มต้นสำหรับสถานะทั่วไป
                        if (m.key === "fault" || m.key === "fire" || m.key === "alarm") {
                          tone = "red";
                        } else if (m.key === "emergency" || m.key === "overload" || m.key === "maintenance") {
                          tone = "amber";
                        } else if (m.key === "powerOn") {
                          tone = "green";
                        } else if (m.key === "outOfService" || m.key === "unknown") {
                          tone = "gray";
                        }
                        return (
                          <Chip
                            key={m.key}
                            tone={tone}
                            active
                          >
                            {m.label}
                          </Chip>
                        );
                      })}
                  </div>
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 items-start">
                {/* 1. ส่วนแสดงผลลิฟต์ */}
                <div className="md:col-span-1">
                  <div className="w-44 mx-auto">
                    <ElevatorShaft
                      st={{
                        floorLabels: floors,
                        max_level: floors.length || 1,
                        floorPosition: floorPos,
                        moving,
                        door,
                        doorAnimating,
                        direction,
                      }}
                    />
                    <div className="flex items-center justify-between text-xs text-gray-600 pt-2">
                      <div>ตำแหน่ง: <b>{currentFloorLabel}</b></div>
                      <div>เป้าหมาย: <b>{targetFloorLabel}</b></div>
                    </div>
                  </div>
                </div>

                {/* 2. ส่วนปุ่มควบคุม */}
                <div className="md:col-span-1">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">ปุ่มควบคุม</h3>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {floors.map((f, i) => (
                        <motion.button
                          key={`${f}-${i}`}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setTargetIdx(i + 1)}
                          className={`h-9 rounded-xl font-semibold text-base transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${targetIdx === i + 1
                            ? "bg-blue-600 text-white shadow"
                            : "bg-white text-gray-800 border border-gray-300 hover:bg-blue-50"
                            }`}
                          title={`ไปชั้น ${f}`}
                          aria-label={`เลือกไปชั้น ${f}`}
                        >
                          {f}
                        </motion.button>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-1 gap-6">
                      <div>
                        <div className="space-y-1">
                          <KV k="จำนวนชั้น" v={lift.max_level} />
                          <KV k="ชั้นชั้นที่รองรับ" v={lift.floor_name || "-"} />
                          <KV k="สัญญาณเครือข่าย" v="ปกติ" />
                          <KV k="อัปเดตล่าสุด" v={new Date(lift.updated_at).toLocaleString()} />
                          <KV k="สร้างเมื่อ" v={new Date(lift.created_at).toLocaleString()} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="สถิติการเรียกลิฟต์ตามชั้น (ตัวอย่าง)">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={callStats} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="calls" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>

            <Section title="งาน/แจ้งซ่อมที่เกี่ยวข้อง" right={<span className="text-sm text-gray-500">{relatedTasks.length} รายการ</span>}>
              {relatedTasks.length === 0 ? (
                <div className="text-sm text-gray-500 py-4">ยังไม่มีงานสำหรับลิฟต์นี้</div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {relatedTasks.map((t) => (
                    <li key={t.tk_id} className="py-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">#{t.tk_id} • {t.tk_data}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          เริ่ม: {new Date(t.task_start_date).toLocaleString()} • อาคาร: {t.building_name}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-medium">
                        สถานะ: {t.tk_status === "2" ? "กำลังดำเนินการ" : t.tk_status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 xl:sticky xl:top-20">

            <Section title="การควบคุมและทดสอบ">
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-sm transition-colors"
                  onClick={() => setActivePopup("testDoor")}
                >
                  ทดสอบเปิด/ปิดประตู
                </button>
                <button
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-sm transition-colors"
                  onClick={() => setActivePopup("testAlarm")}
                >
                  ทดสอบสัญญาณเตือน
                </button>
                <button
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-sm transition-colors"
                  onClick={() => setActivePopup("maintenanceMode")}
                >
                  โหมดบำรุงรักษา
                </button>
                <button
                  className="w-full px-4 py-3 rounded-xl border border-red-300 bg-white text-red-600 hover:bg-red-50 text-sm transition-colors"
                  onClick={() => setActivePopup("resetFault")}
                >
                  รีเซ็ตข้อขัดข้อง
                </button>
              </div>
            </Section>

            <Section title="บันทึกล่าสุด">
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-block w-2 h-2 bg-gray-400 rounded-full" />
                  <div>
                    <span className="font-semibold">[{new Date(lift.updated_at).toLocaleString()}]</span> อัปเดตสถานะลิฟต์
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-block w-2 h-2 bg-gray-400 rounded-full" />
                  <div>
                    <span className="font-semibold">[{new Date(lift.created_at).toLocaleString()}]</span> เพิ่มลิฟต์เข้าสู่ระบบ
                  </div>
                </li>
              </ul>
            </Section>
          </div>
        </div>
      </div>

      {/* Popups */}
      <AnimatePresence>
        {activePopup === "testDoor" && (
          <Popup title="ทดสอบการเปิด/ปิดประตู" onClose={() => setActivePopup(null)}>
            <p className="text-gray-600 text-sm">คุณแน่ใจหรือไม่ว่าต้องการส่งคำสั่งเพื่อทดสอบการเปิดและปิดประตูลิฟต์?</p>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">ยืนยัน</button>
              <button className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors" onClick={() => setActivePopup(null)}>ยกเลิก</button>
            </div>
          </Popup>
        )}
        {activePopup === "testAlarm" && (
          <Popup title="ทดสอบสัญญาณเตือน" onClose={() => setActivePopup(null)}>
            <p className="text-gray-600 text-sm">การดำเนินการนี้จะทำให้สัญญาณเตือนในลิฟต์ดังขึ้นชั่วขณะ</p>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">เริ่มทดสอบ</button>
              <button className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors" onClick={() => setActivePopup(null)}>ยกเลิก</button>
            </div>
          </Popup>
        )}
        {activePopup === "maintenanceMode" && (
          <Popup title="เปิดโหมดบำรุงรักษา" onClose={() => setActivePopup(null)}>
            <p className="text-gray-600 text-sm">การเปิดโหมดนี้จะทำให้ลิฟต์ไม่สามารถใช้งานได้ตามปกติเพื่อความปลอดภัย</p>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">ยืนยัน</button>
              <button className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors" onClick={() => setActivePopup(null)}>ยกเลิก</button>
            </div>
          </Popup>
        )}
        {activePopup === "resetFault" && (
          <Popup title="รีเซ็ตข้อขัดข้อง" onClose={() => setActivePopup(null)}>
            <p className="text-red-600 font-medium">คำเตือน: การดำเนินการนี้ควรทำโดยช่างเทคนิคที่ได้รับอนุญาตเท่านั้น</p>
            <p className="text-gray-600 text-sm mt-2">ยืนยันเพื่อรีเซ็ตสถานะข้อขัดข้องของลิฟต์</p>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">ยืนยันการรีเซ็ต</button>
              <button className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors" onClick={() => setActivePopup(null)}>ยกเลิก</button>
            </div>
          </Popup>
        )}
      </AnimatePresence>
    </div>
  );
}
