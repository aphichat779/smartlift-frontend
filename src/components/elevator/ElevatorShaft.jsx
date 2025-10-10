// src/components/elevator/ElevatorShaft.jsx

import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  motion,
  useTransform,
  useMotionValue,
  useMotionValueEvent,
  animate,
} from "framer-motion";
import { ArrowUp, ArrowDown, Square } from "lucide-react";

import { checkLevel } from "@/utils/legacyLiftParser";
import { getFloorIndices, getFloorLabel } from "@/utils/liftUtils";

const getDirectionIcon = (direction) => {
  switch (direction) {
    case "UP":
      return <ArrowUp className="w-4 h-4 text-green-600 animate-bounce" />;
    case "DOWN":
      return <ArrowDown className="w-4 h-4 text-red-600 animate-bounce" />;
    default:
      return <Square className="w-4 h-4 text-gray-600" />;
  }
};

// ----------------------------------------------------------------------
// 1) Call Status
// ----------------------------------------------------------------------
const CallStatusIndicator = React.memo(({ st, idx, floorHeight }) => {
  const isUpCalled = checkLevel(st?.up_status_hex, idx);
  const isDownCalled = checkLevel(st?.down_status_hex, idx);
  const hasCall = isUpCalled || isDownCalled;

  return (
    <div
      className="flex items-center justify-end"
      style={{ height: `${floorHeight}px` }}
    >
      {hasCall && (
        <div className="flex flex-col items-center">
          {isUpCalled && (
            <ArrowUp className="w-3 h-3 text-green-500 animate-pulse stroke-5" />
          )}
          {isDownCalled && (
            <ArrowDown className="w-3 h-3 text-red-500 animate-pulse stroke-5" />
          )}
        </div>
      )}
    </div>
  );
});

// ----------------------------------------------------------------------
// 2) Floor Label
// ----------------------------------------------------------------------
const FloorIndicator = React.memo(({ lbl, isCurrent, floorHeight }) => {
  const baseClasses =
    "font-extrabold rounded px-2 py-0.5 transition-all select-none text-gray-700 text-sm";
  const currentClasses = isCurrent
    ? "transform scale-[1.6] text-orange-600 drop-shadow-sm"
    : "";

  return (
    <div
      className="flex items-center justify-end w-10 pl-2"
      style={{ height: `${floorHeight}px` }}
    >
      <div className={`${baseClasses} ${currentClasses}`} title={`ชั้น ${lbl}`}>
        {lbl}
      </div>
    </div>
  );
});

export default function ElevatorShaft({
  st,
  carPosMV,
  highlightCurrentFloor = true,
}) {
  const floorHeight = 38; // px ต่อชั้น
  const cabPixelHeight = 55; // ความสูงตัวรถ

  const indices = getFloorIndices(st);
  const levels = Math.max(1, indices.length || st?.max_level || 1);
  const shaftHeight = floorHeight * levels;

  // MotionValue หลัก
  const fallbackMV = useMotionValue(st?.floorPosition ?? 1);
  const posMV = carPosMV ?? fallbackMV;

  const lastTargetRef = useRef(posMV.get());

  // เคลื่อนรถเมื่อ floorPosition เปลี่ยน
  useEffect(() => {
    const to = Number(st?.floorPosition ?? 1);
    if (!Number.isFinite(to)) return;

    const from = posMV.get();
    const delta = Math.abs(to - from);

    if (Math.abs(to - lastTargetRef.current) < 0.001) return;
    lastTargetRef.current = to;

    const duration = 0.5 + delta * 0.8;
    animate(posMV, to, { type: "tween", ease: "easeInOut", duration });
  }, [st?.floorPosition, posMV]);

  // แปลงชั้น -> พิกเซล bottom ของรถ
  const carBottomMV = useTransform(posMV, (v) => {
    const clamped = Math.max(1, Math.min(levels, v));
    return (clamped - 1) * floorHeight + (floorHeight - cabPixelHeight) / 2;
  });

  // ชั้นปัจจุบัน (ปัด)
  const clampLevel = (v) => Math.max(1, Math.min(levels, v));
  const [currentLevel, setCurrentLevel] = useState(() =>
    Math.round(clampLevel(posMV.get?.() ?? (st?.floorPosition ?? 1)))
  );
  useMotionValueEvent(posMV, "change", (v) => {
    const lv = Math.round(clampLevel(v));
    setCurrentLevel((prev) => (lv !== prev ? lv : prev));
  });

  // รายการเลขชั้น
  const floorsList = useMemo(
    () =>
      indices.map((idx) => {
        const lbl = getFloorLabel(st, idx);
        const isCurrent =
          highlightCurrentFloor && Number(idx) === Number(currentLevel);
        return (
          <FloorIndicator
            key={idx}
            lbl={lbl}
            isCurrent={isCurrent}
            floorHeight={floorHeight}
          />
        );
      }),
    [indices, st, highlightCurrentFloor, currentLevel]
  );

  // ===== Render =====
  return (
    <div className="w-full max-w-sm mx-auto px-3 py-1 bg-white rounded-lg shadow-md border">
      <div className="flex justify-between items-start gap-0 relative">
        {/* 1) Call column */}
        <div
          className="flex flex-col-reverse justify-between w-6"
          style={{
            height: `${shaftHeight}px`,
            paddingTop: "10px",
          }}
        >
          {indices.map((idx) => (
            <CallStatusIndicator
              key={`call-${idx}`}
              st={st}
              idx={idx}
              floorHeight={floorHeight}
            />
          ))}
        </div>

        {/* 2) Floor numbers */}
        <div
          className="flex flex-col-reverse justify-between"
          style={{
            height: `${shaftHeight}px`,
            paddingTop: "10px",
          }}
        >
          {floorsList}
        </div>

        {/* 3) Shaft */}
        <div
          className="relative w-40 flex-grow bg-gray-200 rounded-lg border-2 border-gray-300 overflow-hidden"
          style={{ height: `${shaftHeight + 10}px` }}
        >
          {/* ชั้น */}
          <div className="absolute inset-y-0 left-0 w-full flex flex-col-reverse">
            {indices.map((idx) => (
              <div key={idx} className="w-full" style={{ height: `${floorHeight}px` }} />
            ))}
          </div>

          {/* รถลิฟต์ */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 w-20"
            style={{
              height: `${cabPixelHeight}px`,
              bottom: carBottomMV,
              zIndex: 10,
              willChange: "transform,bottom",
            }}
          >
            {/* ======================================================
               Pocket + Frame Overlay (กันประตูบังขอบแบบ 100%)
            ====================================================== */}
            {(() => {
              const FRAME_W = 9;      // ความหนาขอบที่ซ้อนทับด้านหน้า (px)
              const TRACK_PAD = 0.11;    // เว้นในรางเพิ่มอีกนิด (px)
              const DURATION = 0.7;

              return (
                <div className="relative w-full h-full">
                  {/* ภายในตู้ */}
                  <div
                    className="absolute inset-0 z-[1]"
                    style={{
                      backgroundImage: "url(/lift-interior.png)",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />

                  {/* รางประตู (ใต้ขอบ) */}
                  <div
                    className="absolute inset-y-0 z-[5] overflow-hidden"
                    style={{
                      left: FRAME_W,
                      right: FRAME_W,
                    }}
                  >
                    {/* ซ้าย */}
                    <motion.div
                      className="absolute top-0 h-full"
                      style={{
                        left: TRACK_PAD,
                        width: `calc(50% - ${TRACK_PAD}px)`,
                        backgroundImage: "url(/door-left.png)",
                        backgroundSize: "cover",
                        backgroundPosition: "right center",
                        boxShadow: "inset -8px 0 12px rgba(0,0,0,0.1)",
                        willChange: "transform",
                      }}
                      animate={{ x: st?.door === "OPEN" ? "-100%" : "0%" }}
                      transition={{ duration: DURATION, ease: "easeInOut" }}
                    />
                    {/* ขวา */}
                    <motion.div
                      className="absolute top-0 h-full"
                      style={{
                        right: TRACK_PAD,
                        width: `calc(50% - ${TRACK_PAD}px)`,
                        backgroundImage: "url(/door-right.png)",
                        backgroundSize: "cover",
                        backgroundPosition: "left center",
                        boxShadow: "inset 8px 0 12px rgba(0,0,0,0.1)",
                        willChange: "transform",
                      }}
                      animate={{ x: st?.door === "OPEN" ? "100%" : "0%" }}
                      transition={{ duration: DURATION, ease: "easeInOut" }}
                    />
                  </div>

                  {/* ขอบหน้าบัง (ซ้อนหน้าสุด) */}
                  <div className="absolute inset-y-0 left-0 z-[20] pointer-events-none"
                    style={{
                      width: `${FRAME_W}px`,
                      background:
                        "linear-gradient(90deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.14) 55%, rgba(0,0,0,0.00) 100%)",
                    }} />
                  <div className="absolute inset-y-0 right-0 z-[20] pointer-events-none"
                    style={{
                      width: `${FRAME_W}px`,
                      background:
                        "linear-gradient(270deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.14) 55%, rgba(0,0,0,0.00) 100%)",
                    }} />

                  {/* เส้นเงากึ่งกลาง (เสริมมิติ) */}
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 z-[15] pointer-events-none"
                    style={{
                      width: "2px",
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.05))",
                    }} />

                  {/* เอฟเฟกต์ขณะลิฟต์เคลื่อน */}
                  {st?.moving && (
                    <div
                      className="absolute inset-0 rounded-md z-[25] pointer-events-none"
                      style={{
                        border: "3px solid #a855f7",
                        boxShadow: "0 0 20px #a855f7",
                      }}
                    />
                  )}
                </div>
              );
            })()}
            {/* ====================================================== */}
            {/* END Pocket + Frame Overlay */}
            {/* ====================================================== */}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
