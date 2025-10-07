// src/components/elevator/ElevatorControlPanel.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { getFloorIndices, getFloorLabel } from "@/utils/liftUtils";
// ตรวจสอบสถานะการเรียก (ปุ่มชั้นในรถ)
import { checkLevel } from "@/utils/legacyLiftParser";

export default function ElevatorControlPanel({ st, onSelectFloor, onSend, onDoor, onMode }) {
  // ปรับให้ทนรูปแบบค่า connection หลากหลาย
  const isOnline = (() => {
    const v = st?.connection;
    if (typeof v === "boolean") return v;
    if (typeof v === "string") return v.toLowerCase() === "online";
    return false;
  })();
  const isMoving = Boolean(st?.moving);

  const floorIndices = useMemo(
    () => (st ? getFloorIndices(st) : []),
    [st?.floor_name, st?.max_level, st?.id]
  );
  const hasFloors = floorIndices.length > 0;

  const selectedFloor = Number.isFinite(st?.selectedFloor) ? st.selectedFloor : null;
  const currentIdx = Number.isFinite(st?.floorPosition) ? Math.round(st.floorPosition) : 0;

  // Hex สถานะปุ่มภายในรถ (car calls)
  const carStatusHex = st?.car_status_hex || "";

  // หมายเหตุ: ปิดการสั่งการปุ่มชั้นตั้งใจไว้ (เป็น display/monitor เท่านั้น)
  const floorsLocked = true;

  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-white/85 backdrop-blur ring-1 ring-slate-200 shadow-[0_12px_30px_-12px_rgba(2,6,23,0.25)]">
      <h3 className="text-sm font-bold text-slate-900 text-center">
        แผงควบคุมลิฟต์ {st?.lift_name ?? "-"}
      </h3>

      {/* ปุ่มชั้น */}
      <div className="mt-4">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))" }}
          aria-label="ปุ่มเลือกชั้นลิฟต์ (แสดงสถานะเท่านั้น)"
        >
          {hasFloors ? (
            floorIndices.map((idx) => {
              const lbl = getFloorLabel(st, idx);
              const isPressed = checkLevel(carStatusHex, idx + 0);
              const isSelected = selectedFloor === idx;

              const btnBase =
                "h-11 rounded-lg text-sm font-semibold transition-all ring-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";
              const stateClass = isPressed
                ? "bg-gradient-to-b from-blue-600 to-indigo-600 text-white ring-blue-300 shadow"
                : isSelected
                ? "bg-blue-100 text-blue-800 ring-blue-200"
                : "bg-slate-100 text-slate-800 hover:bg-slate-200 ring-slate-200";
              const cursorClass = "cursor-default"; // ปิดการโต้ตอบตามที่ระบุ

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {}}
                  disabled
                  className={[btnBase, stateClass, cursorClass].join(" ")}
                  title={`ชั้น ${lbl}`}
                  aria-label={`สถานะเรียกชั้น ${lbl}${isPressed ? " (ถูกเรียกอยู่)" : ""}`}
                  aria-pressed={isPressed}
                >
                  {lbl}
                </button>
              );
            })
          ) : (
            <div className="text-sm text-slate-500 py-2">ไม่มีข้อมูลชั้น</div>
          )}
        </div>
      </div>

      {/* ปุ่มควบคุม Door / Mode (ยังใช้จริงได้หากส่ง handler เข้ามา) */}
      {(onDoor || onMode) && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {onDoor && (
            <button
              type="button"
              onClick={() => onDoor?.(st?.id)}
              disabled={!isOnline}
              className="w-full px-3 py-2 rounded-xl text-sm font-semibold bg-white/85 backdrop-blur ring-1 ring-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
              title="สั่งเปิด/ปิดประตู | Toggle Door"
            >
              ประตู | Door
            </button>
          )}
          {onMode && (
            <button
              type="button"
              onClick={() => onMode?.(st?.id)}
              disabled={!isOnline || isMoving}
              className="w-full px-3 py-2 rounded-xl text-sm font-semibold bg-white/85 backdrop-blur ring-1 ring-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
              title="สลับโหมด | Toggle Mode"
            >
              โหมด | Mode
            </button>
          )}
        </div>
      )}
    </div>
  );
}

ElevatorControlPanel.propTypes = {
  st: PropTypes.object,
  onSelectFloor: PropTypes.func,
  onSend: PropTypes.func,
  onDoor: PropTypes.func,
  onMode: PropTypes.func,
};
