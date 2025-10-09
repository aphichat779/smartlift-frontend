// src/components/pages/ElevatorDetail.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  Wifi, WifiOff, AlertTriangle, ArrowUp, ArrowDown,
  ShieldCheck, LockKeyhole
} from "lucide-react";

// --- 1. Imports ส่วนที่เพิ่มเข้ามา ---
import { useAuth } from '../../contexts/AuthContext'; // (สำคัญ) โปรดตรวจสอบ path ให้ถูกต้อง
import { useElevators } from "../../contexts/ElevatorContext";
import ElevatorShaft from "@/components/elevator/ElevatorShaft";
import ElevatorControlPanel from "@/components/elevator/ElevatorControlPanel";
import { confirmTOTP, getOpenJobStatus } from "@/services/liftApi"; // (สำคัญ) โปรดตรวจสอบ path ให้ถูกต้อง

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
  Auto: "green",
  INSP: "amber",
  Fire: "red",
  Driving: "blue",
  Special: "indigo",
  Learning: "amber",
  Lock: "red",
  Reset: "slate",
  UPS: "amber",
  Idle: "green",
  Break: "slate",
  Bypass: "slate",
  Error: "red",
};

/* ------------------------------------------------------
    Main page
------------------------------------------------------ */
export default function ElevatorDetail() {
  const { id } = useParams();
  const { elevatorStates, handleSelectFloor, connectionStatus } = useElevators();
  const navigate = useNavigate();
  // --- 2. ส่วนที่เพิ่มเข้ามา: เรียกใช้ AuthContext ---
  const { user } = useAuth();

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

  // --- 3. ส่วนที่เพิ่มเข้ามา: States สำหรับจัดการ 2FA/TOTP ---
  const [pendingAction, setPendingAction] = useState(null);
  const [is2faRequiredPopupOpen, setIs2faRequiredPopupOpen] = useState(false);
  const [isTotpPopupOpen, setIsTotpPopupOpen] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [totpError, setTotpError] = useState(null);
  const [isVerifyingTotp, setIsVerifyingTotp] = useState(false);

  // --- Open Job Gate ---
  const [openJobInfo, setOpenJobInfo] = useState({ loading: true, hasOpenJob: false, count: 0, error: null });
  const [noJobPopupOpen, setNoJobPopupOpen] = useState(false);

  const openPopup = (key) => setActivePopup(key);
  const closePopup = () => setActivePopup(null);

  // --- 4. ส่วนที่เพิ่มเข้ามา: Logic Handlers สำหรับ 2FA/TOTP ---
  const handleRequestAction = (actionKey) => {
    if (!user?.ga_enabled) {
      setIs2faRequiredPopupOpen(true);
    } else {
      setPendingAction(actionKey);
      setTotpCode("");
      setTotpError(null);
      setIsTotpPopupOpen(true);
    }
  };

  const handleTotpCancel = () => {
    setIsTotpPopupOpen(false);
    setPendingAction(null);
  };

  const handleTotpConfirm = async () => {
    if (totpCode.length !== 6 || !/^\d+$/.test(totpCode)) {
      setTotpError("กรุณากรอกรหัส 6 หลักให้ถูกต้อง");
      return;
    }

    setIsVerifyingTotp(true);
    setTotpError(null);

    try {
      await confirmTOTP(totpCode);
      setIsVerifyingTotp(false);
      setIsTotpPopupOpen(false);
      openPopup(pendingAction);
      setPendingAction(null);
    } catch (error) {
      setIsVerifyingTotp(false);
      setTotpError(error.message || "รหัส TOTP ไม่ถูกต้อง");
    }
  };

  // โหลดสถานะงานของลิฟต์ + refresh ทุก 30 วินาที
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let timer;

    async function fetchOpenJob() {
      try {
        const res = await getOpenJobStatus(id);
        if (!cancelled) {
          setOpenJobInfo({ loading: false, hasOpenJob: !!res.hasOpenJob, count: Number(res.count || 0), error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setOpenJobInfo({ loading: false, hasOpenJob: false, count: 0, error: err.message || "ไม่สามารถตรวจสอบงานที่เปิดอยู่ได้" });
        }
      }
    }

    setOpenJobInfo((p) => ({ ...p, loading: true, error: null }));
    fetchOpenJob();
    timer = setInterval(fetchOpenJob, 30000);

    return () => { cancelled = true; clearInterval(timer); };
  }, [id]);

  // คำนวณสิทธิ์ปุ่มทดสอบ
  const canTest = !openJobInfo.loading && !openJobInfo.error && openJobInfo.hasOpenJob;

  function guardAction(actionKey) {
    if (!canTest) {
      setNoJobPopupOpen(true);
      return;
    }
    handleRequestAction(actionKey);
  }

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

  // --- 5. ปรับปรุง: Early returns ให้ตรวจสอบ user ด้วย ---
  if (!st || !user) {
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
            <button
              onClick={() => {
                // หากมี route สำหรับสร้างงาน ให้ navigate ไปได้ทันที
                // navigate(`/tasks/create?lift_id=${id}`)
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-md hover:opacity-95 transition-colors"
            >
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
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200 ring-emerald-200"
                          : "text-rose-700 bg-rose-50 border-rose-200 ring-rose-200",
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
              <Section
                title="การควบคุมและทดสอบ"
                right={
                  openJobInfo.loading ? (
                    <span className="text-xs text-slate-400 animate-pulse">กำลังตรวจสอบงาน...</span>
                  ) : openJobInfo.error ? (
                    <span className="text-xs text-rose-600">ตรวจสอบงานล้มเหลว</span>
                  ) : openJobInfo.hasOpenJob ? (
                    <Chip tone="green" active>มีงานเปิด</Chip>
                  ) : (
                    <Chip tone="gray">ยังไม่มีงาน</Chip>
                  )
                }
              >
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "testDoor", label: "ทดสอบเปิด/ปิดประตู" },
                    { key: "testAlarm", label: "ทดสอบสัญญาณเตือน" },
                    { key: "maintenanceMode", label: "โหมดบำรุงรักษา" },
                    { key: "callElevator", label: "ทดสอบเรียกลิฟต์" },
                    { key: "doorSensor", label: "ทดสอบเซนเซอร์ประตู" },
                    { key: "resetFault", label: "รีเซ็ตข้อขัดข้อง", danger: true },
                  ].map((b) => (
                    <button
                      key={b.key}
                      disabled={!canTest}
                      className={[
                        "w-full px-4 py-3 rounded-xl ring-1 text-sm transition-colors",
                        b.danger
                          ? (canTest
                              ? "bg-white/85 backdrop-blur ring-rose-200 text-rose-700 hover:bg-rose-50"
                              : "bg-slate-100 ring-slate-200 text-slate-400 cursor-not-allowed")
                          : (canTest
                              ? "bg-white/85 backdrop-blur ring-slate-200 hover:bg-white"
                              : "bg-slate-100 ring-slate-200 text-slate-400 cursor-not-allowed")
                      ].join(" ")}
                      onClick={() => guardAction(b.key)}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-slate-500 mt-2 text-center">
                  {openJobInfo.loading
                    ? "กำลังตรวจสอบสิทธิ์การทดสอบจากงานที่เปิดอยู่..."
                    : openJobInfo.error
                      ? "ไม่สามารถตรวจสอบสถานะงานได้ (จะไม่อนุญาตให้ทดสอบ)"
                      : openJobInfo.hasOpenJob
                        ? "อนุญาตให้ทดสอบได้เพราะมีงานเปิดอยู่"
                        : "ต้องมีงานที่เปิดอยู่ก่อนจึงจะทดสอบลิฟต์ได้"}
                </p>
              </Section>

              {/* แสดงสรุปงานที่เกี่ยวข้อง */}
              <Section
                title="งานที่เกี่ยวข้อง"
                right={
                  openJobInfo.loading ? (
                    <span className="text-sm text-slate-400 animate-pulse">กำลังตรวจสอบ...</span>
                  ) : openJobInfo.error ? (
                    <span className="text-sm text-rose-500">ผิดพลาด</span>
                  ) : (
                    <span className="text-sm text-slate-500">{openJobInfo.count} รายการ</span>
                  )
                }
              >
                {openJobInfo.loading ? (
                  <div className="text-sm text-slate-500 py-4 text-center">กำลังโหลด...</div>
                ) : openJobInfo.error ? (
                  <div className="text-sm text-rose-600 py-4 text-center bg-rose-50 rounded-lg">{openJobInfo.error}</div>
                ) : openJobInfo.hasOpenJob ? (
                  <div className="text-sm text-emerald-700 py-4 text-center bg-emerald-50 rounded-lg">
                    ✅ มีงานเปิดอยู่จำนวน <b>{openJobInfo.count}</b> งาน
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 py-4 text-center">ไม่มีงานที่เปิดอยู่ในขณะนี้</div>
                )}
              </Section>
            </div>
          </div>
        </div>

        <div className="text-center text-slate-500 text-xs mt-6">
          ระบบควบคุมลิฟต์อัจฉริยะ © 2025
        </div>
      </div>

      {/* --- 7. ปรับปรุง: รวม Popups ทั้งหมดไว้ที่นี่ --- */}
      <AnimatePresence>
        {/* Popup: ต้องเปิด 2FA */}
        {is2faRequiredPopupOpen && (
          <Popup title="จำเป็นต้องเปิดใช้งาน 2FA" onClose={() => setIs2faRequiredPopupOpen(false)}>
            <div className="space-y-4 text-center">
              <LockKeyhole className="w-16 h-16 mx-auto text-amber-500" strokeWidth={1.5} />
              <p className="text-slate-600 text-sm">
                ฟังก์ชันนี้ต้องการความปลอดภัยเพิ่มเติม กรุณาเปิดใช้งาน 2FA ในหน้าโปรไฟล์ของคุณก่อน
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button onClick={() => navigate('/profile/security')} className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700 transition-colors">ไปที่หน้าตั้งค่า</button>
                <button onClick={() => setIs2faRequiredPopupOpen(false)} className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors">ปิด</button>
              </div>
            </div>
          </Popup>
        )}

        {/* Popup: กรอกรหัส TOTP */}
        {isTotpPopupOpen && (
          <Popup title="ยืนยันตัวตน (2FA)" onClose={handleTotpCancel}>
            <div className="space-y-4">
              <p className="text-slate-600 text-sm">กรอกรหัส 6 หลักจากแอป Authenticator</p>
              <div>
                <input
                  type="text" value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ""))}
                  maxLength="6" placeholder="------"
                  className="w-full px-4 py-2 text-center text-lg tracking-[0.5em] font-mono rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              {totpError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md text-center">{totpError}</p>}
              <div className="mt-4 flex gap-2">
                <button onClick={handleTotpConfirm} disabled={isVerifyingTotp} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
                  {isVerifyingTotp ? (<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />) : <ShieldCheck size={16} />}
                  {isVerifyingTotp ? "กำลังตรวจสอบ..." : "ยืนยัน"}
                </button>
                <button onClick={handleTotpCancel} className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors">ยกเลิก</button>
              </div>
            </div>
          </Popup>
        )}

        {/* Popup: ไม่มีงานแต่พยายามทดสอบ */}
        {noJobPopupOpen && (
          <Popup title="ต้องมีงานที่เปิดอยู่ก่อน" onClose={() => setNoJobPopupOpen(false)}>
            <div className="space-y-4 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-amber-500" strokeWidth={1.5} />
              <p className="text-slate-600 text-sm">
                ยังไม่มีงานที่เกี่ยวข้องกับลิฟต์นี้ จึงไม่สามารถทดสอบ/ควบคุมได้
              </p>
              <div className="mt-2 text-sm text-slate-500">
                {openJobInfo.loading
                  ? "กำลังตรวจสอบสถานะงาน กรุณารอสักครู่..."
                  : openJobInfo.error
                    ? `เกิดข้อผิดพลาด: ${openJobInfo.error}`
                    : "กรุณาสร้างงานใหม่หรือแนบงานที่เปิดอยู่"}
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    setNoJobPopupOpen(false);
                    // ถ้ามี route เฉพาะสร้างงาน ให้เปิดได้ เช่น:
                    // navigate(`/tasks/create?lift_id=${id}`);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700 transition-colors"
                >
                  สร้างงานใหม่
                </button>
                <button
                  onClick={() => setNoJobPopupOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  ปิด
                </button>
              </div>
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
