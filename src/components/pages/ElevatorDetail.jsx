// src/components/pages/ElevatorDetail.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Wifi, WifiOff, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react"; // ⬅️ เพิ่มการนำเข้า Icon

// Context & Components
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
    <div className="flex items-center justify-between gap-4 py-2 border-b border-gray-300 last:border-0">
      <div className="text-gray-500 text-sm font-medium">{k}</div>
      <div className="text-gray-900 text-sm">{v}</div>
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="ปิดหน้าต่าง">
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
  Auto: 'อัตโนมัติ', 
  INSP: 'ตรวจสอบ', 
  Fire: 'ไฟไหม้', 
  Driving: 'ขับเคลื่อน',
  Special: 'พิเศษ', 
  Learning: 'เรียนรู้', 
  Lock: 'ล็อค', 
  Reset: 'รีเซ็ต',
  UPS: 'สำรองไฟ', 
  Idle: 'ว่าง', 
  Break: 'เบรค', 
  Bypass: 'Bypass', 
  Error: 'ข้อผิดพลาด',
};

/* ------------------------------------------------------
    Main page
------------------------------------------------------ */
export default function ElevatorDetail() {
  const { id } = useParams();
  const { elevatorStates, handleSelectFloor, connectionStatus } = useElevators();
  const navigate = useNavigate();

  // Lift state
  const st = useMemo(() => elevatorStates[id], [elevatorStates, id]);

  // Floors
  const floors = useMemo(() => {
    const raw = st?.floor_name ?? "";
    return raw.split(",").map((f) => f.trim()).filter(Boolean);
  }, [st?.floor_name]);

  // Mock stats
  const callStats = useMemo(() => {
    if (!floors.length) return [];
    const base = [12, 18, 9, 14, 8, 6, 11, 7, 10, 5, 4, 3];
    return floors.map((f, i) => ({ name: `ชั้น ${f}`, calls: base[i % base.length] }));
  }, [floors]);

  /* ====== Simulation states ====== */
  const [simulatedTargetFloor, setSimulatedTargetFloor] = useState(st?.floorPosition ?? 1);
  const [activePopup, setActivePopup] = useState(null);

  // Popup helpers
  const openPopup = (key) => setActivePopup(key);
  const closePopup = () => setActivePopup(null);

  // Reset when changing lift
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

  // Early returns - connection states
  if (!st) {
    if (connectionStatus === 'connecting' || connectionStatus === 'disconnected') {
      return (
        <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center text-center">
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-2xl font-bold text-gray-800">กำลังเชื่อมต่อและรอข้อมูลลิฟต์...</p>
            <p className="text-gray-500">สถานะ: {connectionStatus}</p>
            <Link className="text-blue-600 underline" to="/monitor">กลับไป Monitor</Link>
          </div>
        </div>
      );
    }
    if (connectionStatus === 'error') {
      return (
        <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center text-center">
          <div className="space-y-3">
            <p className="text-2xl font-bold text-red-800">ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้</p>
            <p className="text-gray-500">กรุณาลองใหม่อีกครั้ง หรือตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              ลองใหม่
            </button>
            <Link className="text-blue-600 underline block mt-2" to="/monitor">กลับไป Monitor</Link>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center text-center">
        <div className="space-y-3">
          <p className="text-2xl font-bold text-gray-800">ไม่พบข้อมูลลิฟต์</p>
          <p className="text-gray-500">อาจจะยังไม่ได้เชื่อมต่อ หรือลิฟต์นี้ไม่มีในระบบ</p>
          <Link className="text-blue-600 underline" to="/monitor">กลับไป Monitor</Link>
        </div>
      </div>
    );
  }
  // st พร้อมใช้งาน

  // Simulated command (ยังไม่เชื่อม API)
  const handleSelectFloorFromSimulation = (liftId, floorIndex) => {
    console.log(`[SIMULATION] User selected floor ${floorIndex} for lift ${liftId}`);
    setSimulatedTargetFloor(floorIndex);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-2sm font-medium transition-colors flex items-center gap-1"
          >
            ← กลับ
          </button>
        </div>
        <div className="md:text-center flex-grow">
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">รายละเอียดลิฟต์: {st.lift_name}</h1>
          <p className="text-red-500 font-extrabold mt-1">สถานที่: {st.org_name} {st.building_name}</p>
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

          {/* MAIN COLUMN (xl:col-span-2) */}
          <div className="xl:col-span-2 space-y-6">
            <Section
              title="สถานะปัจจุบัน" // ⬅️ ปรับ Title
              right={
                <div className="flex flex-wrap items-center gap-3">
                    {/* 1. สถานะการเชื่อมต่อ (ออนไลน์/ออฟไลน์) ด้วย Icon */}
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${st.connection === 'ONLINE' ? 'text-green-600 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-rose-50 border-rose-200'}`}>
                        {st.connection === 'ONLINE' ? (
                            <Wifi className="w-4 h-4" />
                        ) : (
                            <WifiOff className="w-4 h-4" />
                        )}
                        {st.connection === 'ONLINE' ? '' : ''}
                    </div>

                    {/* 2. สถานะหลัก: แสดง 'ข้อผิดพลาด' หรือ 'โหมด' เท่านั้น */}
                    {st.status === 'FAULT' ? (
                        <Chip tone="red" active>
                            <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                            {'ข้อผิดพลาด'}
                        </Chip>
                    ) : (
                        <Chip tone="blue" active>
                            โหมด: {LIFT_STATUS_LABELS[st.mode] || st.mode}
                        </Chip>
                    )}

                    {/* 3. สถานะการเคลื่อนที่ */}
                    <Chip tone={st.moving ? 'amber' : 'slate'} active>
                        {st.moving ? 'กำลังเคลื่อนที่' : 'หยุด'}
                    </Chip>

                    {/* 4. ทิศทางด้วย Icon */}
                    <Chip tone="blue" active>
                        {st.direction === 'UP' ? <ArrowUp className="w-4 h-4" /> :
                         st.direction === 'DOWN' ? <ArrowDown className="w-4 h-4" /> :
                         st.direction || '-'}
                    </Chip>
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* 1. ElevatorShaft */}
                <div className="md:col-span-1">
                  <div className="w-52 mx-auto">
                    <ElevatorShaft st={st} highlightCurrentFloor />
                    <div className="flex items-center justify-between text-xs text-gray-600 pt-2">
                      <div>ตำแหน่งจริง: <b>{currentFloorLabel}</b></div>
                      <div>ทิศทาง: <b>{st.direction ?? '-'}</b></div>
                    </div>
                  </div>
                </div>

                {/* 2. ElevatorControlPanel */}
                <div className="md:col-span-1">
                  <div className="w-79 mx-auto">
                    <ElevatorControlPanel
                      st={st}
                      onSelectFloor={handleSelectFloorFromSimulation}
                    />
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-400">
                      <p className="text-sm text-blue-700 text-center">
                        <b>เป้าหมาย:</b> ชั้น {simulatedTargetFloorLabel}
                      </p>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-400">
                      <KV k="จำนวนชั้น :" v={st.max_level} />
                      <KV k="ชั้นที่รองรับ :" v={st.floor_name} />
                      <KV k="อัปเดตล่าสุด :" v={new Date(st.last_update).toLocaleString()} />
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

          {/* SIDEBAR COLUMN (xl:col-span-1) */}
          <div className="space-y-6 xl:sticky xl:top-20">
            <Section title="การควบคุมและทดสอบ">
              <div className="grid grid-cols-2 gap-3">
                {/* ปุ่มเดิม + เปิด Popup */}
                <button
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-sm transition-colors"
                  onClick={() => openPopup("testDoor")}
                >
                  ทดสอบเปิด/ปิดประตู
                </button>

                <button
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-sm transition-colors"
                  onClick={() => openPopup("testAlarm")}
                >
                  ทดสอบสัญญาณเตือน
                </button>

                <button
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-sm transition-colors"
                  onClick={() => openPopup("maintenanceMode")}
                >
                  โหมดบำรุงรักษา
                </button>

                {/* ปุ่มใหม่ตามที่คุย */}
                <button
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-sm transition-colors"
                  onClick={() => openPopup("callElevator")}
                >
                  ทดสอบเรียกลิฟต์
                </button>

                <button
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-sm transition-colors"
                  onClick={() => openPopup("doorSensor")}
                >
                  ทดสอบเซนเซอร์ประตู
                </button>
                
                <button
                  className="w-full px-4 py-3 rounded-xl border border-red-300 bg-white text-red-600 hover:bg-red-50 text-sm transition-colors"
                  onClick={() => openPopup("resetFault")}
                >
                  รีเซ็ตข้อขัดข้อง
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-2 text-center">
                ปุ่มเหล่านี้ยังไม่ได้เชื่อมต่อกับ API
              </p>
            </Section>

            <Section title="งานที่เกี่ยวข้อง" right={<span className="text-sm text-gray-500">0 รายการ</span>}>
              <div className="text-sm text-gray-500 py-4 text-center">ยังไม่มีการเชื่อมต่อกับระบบแจ้งซ่อมในหน้านี้</div>
            </Section>
          </div>
        </div>
      </div>

      {/* Popups */}
      <AnimatePresence>
        {activePopup === "testDoor" && (
          <Popup title="ทดสอบการเปิด/ปิดประตู" onClose={closePopup}>
            <p className="text-gray-600 text-sm">
              คุณแน่ใจหรือไม่ว่าต้องการส่งคำสั่งเพื่อทดสอบการเปิดและปิดประตูลิฟต์?
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={closePopup}
              >
                ยืนยัน
              </button>
              <button
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={closePopup}
              >
                ยกเลิก
              </button>
            </div>
          </Popup>
        )}

        {activePopup === "testAlarm" && (
          <Popup title="ทดสอบสัญญาณเตือน" onClose={closePopup}>
            <p className="text-gray-600 text-sm">
              การดำเนินการนี้จะทำให้สัญญาณเตือนในลิฟต์ดังขึ้นชั่วขณะ
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={closePopup}
              >
                เริ่มทดสอบ
              </button>
              <button
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={closePopup}
              >
                ยกเลิก
              </button>
            </div>
          </Popup>
        )}

        {activePopup === "maintenanceMode" && (
          <Popup title="เปิดโหมดบำรุงรักษา" onClose={closePopup}>
            <p className="text-gray-600 text-sm">
              การเปิดโหมดนี้จะทำให้ลิฟต์ไม่สามารถใช้งานได้ตามปกติเพื่อความปลอดภัย
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                onClick={closePopup}
              >
                ยืนยัน
              </button>
              <button
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={closePopup}
              >
                ยกเลิก
              </button>
            </div>
          </Popup>
        )}

        {activePopup === "resetFault" && (
          <Popup title="รีเซ็ตข้อขัดข้อง" onClose={closePopup}>
            <p className="text-red-600 font-medium">
              คำเตือน: การดำเนินการนี้ควรทำโดยช่างเทคนิคที่ได้รับอนุญาตเท่านั้น
            </p>
            <p className="text-gray-600 text-sm mt-2">
              ยืนยันเพื่อรีเซ็ตสถานะข้อขัดข้องของลิฟต์
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                onClick={closePopup}
              >
                ยืนยันการรีเซ็ต
              </button>
              <button
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
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
            <p className="text-gray-600 text-sm">
              การทดสอบนี้จะจำลองการเรียกลิฟต์ไปยังชั้นเป้าหมาย (ยังไม่เชื่อมต่อ API)
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={closePopup}
              >
                เริ่มทดสอบ
              </button>
              <button
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
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
            <p className="text-gray-600 text-sm">
              ระบบจะจำลองการมีสิ่งกีดขวางที่ประตู เพื่อดูว่าประตูกลับ/หยุดตามคาดหรือไม่ (ยังไม่เชื่อมต่อ API)
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={closePopup}
              >
                เริ่มทดสอบ
              </button>
              <button
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
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