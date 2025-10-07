// src/components/pages/ElevatorDetail.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Wifi, WifiOff, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";

import { useElevators } from "../../contexts/ElevatorContext";
import ElevatorShaft from "@/components/elevator/ElevatorShaft";
import ElevatorControlPanel from "@/components/elevator/ElevatorControlPanel";

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
    gray: "bg-slate-50 text-slate-700 border-slate-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200", // เพิ่ม indigo สำหรับ Special
  };
  const dot = active ? "bg-emerald-500" : "bg-slate-400";
  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border ${tones[tone]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

function Section({ title, right, children, className = "" }) {
  return (
    <section className={`rounded-2xl p-6 bg-white/85 backdrop-blur shadow-[0_12px_30px_-12px_rgba(2,6,23,0.25)] ring-1 ring-slate-200 ${className}`}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-lg md:text-xl font-bold text-slate-900">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function KV({ k, v }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-200 last:border-0">
      <div className="text-slate-500 text-sm font-medium">{k}</div>
      <div className="text-slate-900 text-sm">{v}</div>
    </div>
  );
}

function Popup({ title, children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose} role="dialog" aria-modal="true" aria-label={title}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 ring-1 ring-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="ปิดหน้าต่าง">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

// คำจำกัดสถานะ
const LIFT_STATUS_LABELS = {
  Auto: "อัตโนมัติ",
  INSP: "ตรวจสอบ",
  Fire: "ไฟไหม้",
  Driving: "ขับเคลื่อน",
  Special: "พิเศษ",
  Learning: "เรียนรู้",
  Lock: "ล็อค",
  Reset: "รีเซ็ต",
  UPS: "สำรองไฟ",
  Idle: "ว่าง",
  Break: "เบรค",
  Bypass: "Bypass",
  Error: "ข้อผิดพลาด",
};

// --- NEW: Dictionary กำหนดสีตามสถานะ ---
const LIFT_STATUS_TONES = {
  Auto: "green",       // อัตโนมัติ: เขียว (ปกติ/พร้อมใช้งาน)
  INSP: "amber",       // ตรวจสอบ: ส้ม (บำรุงรักษา/กำลังตรวจสอบ)
  Fire: "red",         // ไฟไหม้: แดง (ฉุกเฉิน)
  Driving: "blue",     // ขับเคลื่อน: น้ำเงิน (กำลังทำงานตามปกติ)
  Special: "indigo",   // พิเศษ: ม่วงน้ำเงิน (โหมดพิเศษ/กำหนดเอง)
  Learning: "amber",   // เรียนรู้: ส้ม (กำลังปรับตั้งค่า)
  Lock: "red",         // ล็อค: แดง (ไม่สามารถใช้งานได้)
  Reset: "slate",      // รีเซ็ต: เทา (กำลังเริ่มต้นใหม่)
  UPS: "amber",        // สำรองไฟ: ส้ม (สถานะที่ไม่ปกติ)
  Idle: "green",       // ว่าง: เขียว (ปกติ/พร้อมใช้งาน)
  Break: "slate",      // เบรค: เทา (หยุด)
  Bypass: "slate",     // Bypass: เทา (จัดการโดยช่าง)
  Error: "red",        // ข้อผิดพลาด: แดง (มีปัญหา)
};

/* ------------------------------------------------------
    Main page
------------------------------------------------------ */
export default function ElevatorDetail() {
  const { id } = useParams();
  const { elevatorStates, handleSelectFloor, connectionStatus } = useElevators();
  const navigate = useNavigate();

  const st = useMemo(() => elevatorStates[id], [elevatorStates, id]);

  const floors = useMemo(() => {
    const raw = st?.floor_name ?? "";
    return raw.split(",").map((f) => f.trim()).filter(Boolean);
  }, [st?.floor_name]);

  const callStats = useMemo(() => {
    if (!floors.length) return [];
    const base = [12, 18, 9, 14, 8, 6, 11, 7, 10, 5, 4, 3];
    return floors.map((f, i) => ({ name: `ชั้น ${f}`, calls: base[i % base.length] }));
  }, [floors]);

  const [simulatedTargetFloor, setSimulatedTargetFloor] = useState(st?.floorPosition ?? 1);
  const [activePopup, setActivePopup] = useState(null);

  const openPopup = (key) => setActivePopup(key);
  const closePopup = () => setActivePopup(null);

  useEffect(() => {
    setSimulatedTargetFloor(st?.floorPosition ?? 1);
  }, [id, st?.floorPosition]);

  const currentFloorLabel = useMemo(() => {
    const floorPos = st?.floorPosition ?? 1;
    if (!floors.length) return "-";
    const idx = Math.min(floors.length, Math.max(1, Math.round(floorPos)));
    return floors[idx - 1] ?? idx;
  }, [floors, st?.floorPosition]);

  const simulatedTargetFloorLabel = useMemo(() => {
    if (!floors.length) return "-";
    return floors[simulatedTargetFloor - 1] ?? simulatedTargetFloor;
  }, [floors, simulatedTargetFloor]);

  // Early returns - connection states (โทนเดียวกับหน้าอื่น)
  if (!st) {
    if (connectionStatus === "connecting" || connectionStatus === "disconnected") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-8 flex items-center justify-center text-center">
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-blue-600 mx-auto mb-4" />
            <p className="text-2xl font-bold text-slate-800">กำลังเชื่อมต่อและรอข้อมูลลิฟต์...</p>
            <p className="text-slate-500">สถานะ: {connectionStatus}</p>
            <Link className="text-blue-600 underline" to="/monitor">กลับไป Monitor</Link>
          </div>
        </div>
      );
    }
    if (connectionStatus === "error") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-8 flex items-center justify-center text-center">
          <div className="space-y-3">
            <p className="text-2xl font-bold text-rose-700">ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้</p>
            <p className="text-slate-500">กรุณาลองใหม่อีกครั้ง หรือตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              ลองใหม่
            </button>
            <Link className="text-blue-600 underline block mt-2" to="/monitor">กลับไป Monitor</Link>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-8 flex items-center justify-center text-center">
        <div className="space-y-3">
          <p className="text-2xl font-bold text-slate-800">ไม่พบข้อมูลลิฟต์</p>
          <p className="text-slate-500">อาจจะยังไม่ได้เชื่อมต่อ หรือลิฟต์นี้ไม่มีในระบบ</p>
          <Link className="text-blue-600 underline" to="/monitor">กลับไป Monitor</Link>
        </div>
      </div>
    );
  }

  // Simulated command (ยังไม่เชื่อม API)
  const handleSelectFloorFromSimulation = (liftId, floorIndex) => {
    console.log(`[SIMULATION] User selected floor ${floorIndex} for lift ${liftId}`);
    setSimulatedTargetFloor(floorIndex);
  };

  const online = (() => {
    const v = st?.connection;
    if (typeof v === "boolean") return v;
    if (typeof v === "string") return v.toLowerCase() === "online";
    return false;
  })();

  // --- Direction Chip (ใช้สีน้ำเงินปกติ, ยกเว้นสถานะ Fault ใช้สีแดง) ---
  const DirectionChip = (
    <Chip tone={st.direction && st.direction !== "NONE" ? "blue" : "slate"} active={st.direction && st.direction !== "NONE"}>
      {st.direction === "UP" ? (
        <ArrowUp className="w-4 h-4" />
      ) : st.direction === "DOWN" ? (
        <ArrowDown className="w-4 h-4" />
      ) : (
        st.direction || "-"
      )}
    </Chip>
  );

  // --- Moving Status Chip (ใช้สีเหลืองเมื่อกำลังเคลื่อนที่, เทาเมื่อหยุด) ---
  const MovingStatusChip = (
    <Chip tone={st.moving ? "amber" : "slate"} active={st.moving}>
      {st.moving ? "กำลังเคลื่อนที่" : "หยุด"}
    </Chip>
  );
  
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200 text-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-xl bg-white/85 backdrop-blur ring-1 ring-slate-200 hover:bg-white text-sm font-medium transition-colors flex items-center gap-1 shadow"
            >
              ← กลับ
            </button>
          </div>
          <div className="md:text-center flex-grow">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
              รายละเอียดลิฟต์: {st.lift_name ?? id}
            </h1>
            <p className="text-blue-700 font-semibold mt-1">
              สถานที่: {st.org_name} {st.building_name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-md hover:opacity-95 transition-colors">
              เรียกช่าง / สร้างงาน
            </button>
          </div>
        </div>

        {/* Content grid */}
        <div className="py-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* MAIN COLUMN (xl:col-span-2) */}
            <div className="xl:col-span-2 space-y-6">
              <Section
                title="สถานะปัจจุบัน"
                right={
                  <div className="flex flex-wrap items-center gap-3">
                    {/* 1. สถานะการเชื่อมต่อ (Online/Offline) */}
                    <div
                      className={[
                        "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ring-1",
                        online
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200 ring-emerald-200" // Green for good connection
                          : "text-rose-700 bg-rose-50 border-rose-200 ring-rose-200", // Red for loss of connection
                      ].join(" ")}
                    >
                      {online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                      <span>{online ? "Online" : "Offline"}</span>
                    </div>

                    {/* 2. สถานะหลัก (Mode/Fault) ใช้สีตามสถานะที่กำหนด */}
                    {st.status === "FAULT" ? (
                      <Chip tone="red" active>
                        <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                        ข้อผิดพลาด
                      </Chip>
                    ) : (
                      <Chip 
                        tone={LIFT_STATUS_TONES[st.mode] || "slate"} 
                        active={st.mode !== "Idle" && st.mode !== "Auto"}
                      >
                        โหมด: {LIFT_STATUS_LABELS[st.mode] || st.mode || "-"}
                      </Chip>
                    )}
                  </div>
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  {/* ElevatorShaft */}
                  <div className="md:col-span-1">
                    <div className="w-56 mx-auto">
                      <div className="rounded-lg group-hover:ring-1 group-hover:ring-blue-300/60 transition">
                        <ElevatorShaft st={st} highlightCurrentFloor />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600 pt-2">
                        
                        <div className="flex items-center gap-2">
                          ลิฟต์: {MovingStatusChip}
                        </div>

                        {/* ทิศทาง */}
                        <div className="flex items-center gap-2">
                          ทิศทาง: {DirectionChip}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ElevatorControlPanel + info */}
                  <div className="md:col-span-1">
                    <div className="w-80 mx-auto">
                      <div>
                        <ElevatorControlPanel
                          st={st}
                          onSelectFloor={handleSelectFloorFromSimulation}
                        />
                      </div>

                      <div className="mt-4 p-3 rounded-lg ring-1 ring-blue-200 bg-blue-50">
                        <p className="text-sm text-blue-700 text-center">
                          <b>เป้าหมาย:</b> ชั้น {simulatedTargetFloorLabel}
                        </p>
                      </div>

                      <div className="mt-4 p-3 rounded-lg ring-1 ring-slate-200 bg-white/70">
                        <KV k="จำนวนชั้น :" v={st.max_level} />
                        <KV k="ชั้นที่รองรับ :" v={st.floor_name} />
                        <KV k="อัปเดตล่าสุด :" v={st.last_update ? new Date(st.last_update).toLocaleString() : "-"} />
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
            </div>

            {/* SIDEBAR COLUMN */}
            <div className="space-y-6 xl:sticky xl:top-20">
              <Section title="การควบคุมและทดสอบ">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    className="w-full px-4 py-3 rounded-xl bg-white/85 backdrop-blur ring-1 ring-slate-200 hover:bg-white text-sm transition-colors"
                    onClick={() => openPopup("testDoor")}
                  >
                    ทดสอบเปิด/ปิดประตู
                  </button>

                  <button
                    className="w-full px-4 py-3 rounded-xl bg-white/85 backdrop-blur ring-1 ring-slate-200 hover:bg-white text-sm transition-colors"
                    onClick={() => openPopup("testAlarm")}
                  >
                    ทดสอบสัญญาณเตือน
                  </button>

                  <button
                    className="w-full px-4 py-3 rounded-xl bg-white/85 backdrop-blur ring-1 ring-slate-200 hover:bg-white text-sm transition-colors"
                    onClick={() => openPopup("maintenanceMode")}
                  >
                    โหมดบำรุงรักษา
                  </button>

                  <button
                    className="w-full px-4 py-3 rounded-xl bg-white/85 backdrop-blur ring-1 ring-slate-200 hover:bg-white text-sm transition-colors"
                    onClick={() => openPopup("callElevator")}
                  >
                    ทดสอบเรียกลิฟต์
                  </button>

                  <button
                    className="w-full px-4 py-3 rounded-xl bg-white/85 backdrop-blur ring-1 ring-slate-200 hover:bg-white text-sm transition-colors"
                    onClick={() => openPopup("doorSensor")}
                  >
                    ทดสอบเซนเซอร์ประตู
                  </button>

                  <button
                    className="w-full px-4 py-3 rounded-xl bg-white/85 backdrop-blur ring-1 ring-rose-200 text-rose-700 hover:bg-rose-50 text-sm transition-colors"
                    onClick={() => openPopup("resetFault")}
                  >
                    รีเซ็ตข้อขัดข้อง
                  </button>
                </div>

                <p className="text-xs text-slate-500 mt-2 text-center">
                  ปุ่มเหล่านี้ยังไม่ได้เชื่อมต่อกับ API
                </p>
              </Section>

              <Section title="งานที่เกี่ยวข้อง" right={<span className="text-sm text-slate-500">0 รายการ</span>}>
                <div className="text-sm text-slate-500 py-4 text-center">
                  ยังไม่มีการเชื่อมต่อกับระบบแจ้งซ่อมในหน้านี้
                </div>
              </Section>
            </div>
          </div>
        </div>

        <div className="text-center text-slate-500 text-xs mt-6">
          ระบบควบคุมลิฟต์อัจฉริยะ © 2025
        </div>
      </div>

      {/* Popups - Unchanged */}
      <AnimatePresence>
        {activePopup === "testDoor" && (
          <Popup title="ทดสอบการเปิด/ปิดประตู" onClose={closePopup}>
            <p className="text-slate-600 text-sm">
              คุณแน่ใจหรือไม่ว่าต้องการส่งคำสั่งเพื่อทดสอบการเปิดและปิดประตูลิฟต์?
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow hover:opacity-95"
                onClick={closePopup}
              >
                ยืนยัน
              </button>
              <button
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
                onClick={closePopup}
              >
                ยกเลิก
              </button>
            </div>
          </Popup>
        )}

        {activePopup === "testAlarm" && (
          <Popup title="ทดสอบสัญญาณเตือน" onClose={closePopup}>
            <p className="text-slate-600 text-sm">
              การดำเนินการนี้จะทำให้สัญญาณเตือนในลิฟต์ดังขึ้นชั่วขณะ
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow hover:opacity-95"
                onClick={closePopup}
              >
                เริ่มทดสอบ
              </button>
              <button
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
                onClick={closePopup}
              >
                ยกเลิก
              </button>
              </div>
          </Popup>
        )}

        {activePopup === "maintenanceMode" && (
          <Popup title="เปิดโหมดบำรุงรักษา" onClose={closePopup}>
            <p className="text-slate-600 text-sm">
              การเปิดโหมดนี้จะทำให้ลิฟต์ไม่สามารถใช้งานได้ตามปกติเพื่อความปลอดภัย
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-amber-600 text-white shadow hover:bg-amber-700 transition-colors"
                onClick={closePopup}
              >
                ยืนยัน
              </button>
              <button
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
                onClick={closePopup}
              >
                ยกเลิก
              </button>
            </div>
          </Popup>
        )}

        {activePopup === "resetFault" && (
          <Popup title="รีเซ็ตข้อขัดข้อง" onClose={closePopup}>
            <p className="text-rose-600 font-medium">
              คำเตือน: การดำเนินการนี้ควรทำโดยช่างเทคนิคที่ได้รับอนุญาตเท่านั้น
            </p>
            <p className="text-slate-600 text-sm mt-2">
              ยืนยันเพื่อรีเซ็ตสถานะข้อขัดข้องของลิฟต์
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-rose-600 text-white shadow hover:bg-rose-700 transition-colors"
                onClick={closePopup}
              >
                ยืนยันการรีเซ็ต
              </button>
              <button
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
                onClick={closePopup}
              >
                ยกเลิก
              </button>
            </div>
          </Popup>
        )}

        {/* ใหม่: ทดสอบเรียกลิฟต์ */}
        {activePopup === "callElevator" && (
          <Popup title="ทดสอบเรียกลิฟต์" onClose={closePopup}>
            <p className="text-slate-600 text-sm">
              การทดสอบนี้จะจำลองการเรียกลิฟต์ไปยังชั้นเป้าหมาย (ยังไม่เชื่อมต่อ API)
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow hover:opacity-95"
                onClick={closePopup}
              >
                เริ่มทดสอบ
              </button>
              <button
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
                onClick={closePopup}
              >
                ยกเลิก
              </button>
            </div>
          </Popup>
        )}

        {/* ใหม่: ทดสอบเซนเซอร์ประตู */}
        {activePopup === "doorSensor" && (
          <Popup title="ทดสอบเซนเซอร์ประตู" onClose={closePopup}>
            <p className="text-slate-600 text-sm">
              ระบบจะจำลองการมีสิ่งกีดขวางที่ประตู เพื่อดูว่าประตูกลับ/หยุดตามคาดหรือไม่ (ยังไม่เชื่อมต่อ API)
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow hover:opacity-95"
                onClick={closePopup}
              >
                เริ่มทดสอบ
              </button>
              <button
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
                onClick={closePopup}
              >
                ยกเลิก
              </button>
            </div>
          </Popup>
        )}
      </AnimatePresence>
    </div>
  );
}