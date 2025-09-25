// src/components/ElevatorControlPanel.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Wifi, WifiOff } from "lucide-react";
import {
  getFloorIndices, getFloorLabel, getStatusBg, getStatusColor,
  translateStatus, LIFT_STATE_BITS
} from "@/utils/elevator";

export default function ElevatorControlPanel({
  st,
  onSelectFloor,
  onSend,
  onDoor, // (optional) toggle door open/close
  onMode, // (optional) change mode
}) {
  // ---- guards & deriveds ----
  const isOnline = st?.connection === "ONLINE";
  const isMoving = Boolean(st?.moving);
  const floorIndices = useMemo(() => (st ? getFloorIndices(st) : []), [st?.floor_name, st?.max_level, st?.id]);
  const hasFloors = floorIndices.length > 0;

  const selectedFloor = Number.isFinite(st?.selectedFloor) ? st.selectedFloor : null;
  const currentIdx = Number.isFinite(st?.floorPosition)
    ? Math.round(st.floorPosition)
    : 0;
  
  // สถานะปุ่มกดภายในลิฟต์
  const carStatus = st?.car_status || "";

  const canSend =
    isOnline &&
    !isMoving &&
    hasFloors &&
    selectedFloor !== null &&
    selectedFloor !== currentIdx;

  const onlineBadgeClass = isOnline ? "text-green-600" : "text-red-600";

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 mb-4">
      <h3 className="text-sm font-bold mb-4 text-blue-600 text-center">
        แผงควบคุมลิฟต์ {st?.lift_name ?? "-"}
      </h3>

      <div className="space-y-4">
        {/* Floor selector */}
        <div>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))" }}
          >
            {hasFloors ? (
              floorIndices.map((idx) => {
                const lbl = getFloorLabel(st, idx);
                // ตรวจสอบสถานะปุ่มจาก carStatus
                const isPressed = carStatus[idx] === "1";
                const isSelected = selectedFloor === idx;
                const disabled = !isOnline || isMoving;

                return (
                  <button
                    key={idx}
                    type="button"
                    // เมื่อกดปุ่มจะอัปเดตสถานะและส่งไปยัง backend
                    onClick={() => onSelectFloor?.(st.id, idx)}
                    disabled={disabled}
                    className={[
                      "h-10 rounded text-sm font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                      // เงื่อนไขใหม่: ถ้าปุ่มถูกกด จะใช้สีนี้
                      isPressed
                        ? "bg-blue-600 text-white shadow-lg"
                        // ถ้าปุ่มถูกเลือกแต่ยังไม่ได้ถูกกด
                        : isSelected
                        ? "bg-blue-300 text-blue-900"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300",
                      disabled ? "opacity-60 cursor-not-allowed" : "",
                    ].join(" ")}
                    title={`ชั้น ${lbl}`}
                    aria-label={`เลือกชั้น ${lbl}`}
                    aria-pressed={isPressed}
                  >
                    {lbl}
                  </button>
                );
              })
            ) : (
              <div className="text-sm text-gray-500 py-2">ไม่มีข้อมูลชั้น</div>
            )}
          </div>
        </div>

        {/* Status row */}
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className={`w-4 h-4 ${onlineBadgeClass}`} />
            ) : (
              <WifiOff className={`w-4 h-4 ${onlineBadgeClass}`} />
            )}
            <span className={`text-xs ${getStatusColor(st?.connection)}`}>
              {translateStatus(st?.connection)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs ${getStatusBg(st?.mode)} ${getStatusColor(st?.mode)}`}>
              {translateStatus(st?.mode)}
            </span>
          </div>
        </div>

        {/* Quick actions (optional) */}
        {(onDoor || onMode) && (
          <div className="grid grid-cols-2 gap-3">
            {onDoor && (
              <button
                type="button"
                onClick={() => onDoor(st.id)}
                disabled={!isOnline}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded"
                title="สั่งเปิด/ปิดประตู | Toggle Door"
              >
                ประตู | Door
              </button>
            )}
            {onMode && (
              <button
                type="button"
                onClick={() => onMode(st.id)}
                disabled={!isOnline}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded"
                title="สลับโหมด | Toggle Mode"
              >
                โหมด | Mode
              </button>
            )}
          </div>
        )}

        {/* Flags */}
        <div className="flex flex-wrap gap-2 pt-2">
          {Object.entries(st?.flags || {})
            .filter(([_, v]) => v)
            .map(([k]) => {
              const def = (LIFT_STATE_BITS || []).find((b) => b.key === k);
              const label = def?.label || k;
              return (
                <span
                  key={k}
                  className="px-2 py-1 rounded-full text-xs border bg-gray-100 border-gray-300 text-gray-700"
                  title={label}
                >
                  {label}
                </span>
              );
            })}
        </div>
      </div>
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