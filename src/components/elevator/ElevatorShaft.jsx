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
// 1. Component สำหรับแสดงสถานะการเรียก (Call Status Arrows) 
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

// ----------------------------------------------------------------------
// 2. Component สำหรับแสดงชื่อชั้นอย่างเดียว (Floor Label)
// ----------------------------------------------------------------------
const FloorIndicator = React.memo(({ lbl, isCurrent, floorHeight }) => {
  const baseClasses = "font-extrabold rounded px-2 py-0.5 transition-all select-none text-gray-700 text-sm";
  const currentClasses = isCurrent 
    ? "transform scale-[1.6] text-orange-600 drop-shadow-sm" 
    : "";
    
  return (
    <div
      className="flex items-center justify-end w-12 pl-2" 
      style={{ height: `${floorHeight}px` }}
    >
      <div 
        className={`${baseClasses} ${currentClasses}`}
        title={`ชั้น ${lbl}`}
      >
        {lbl}
      </div>
    </div>
  );
});
// ----------------------------------------------------------------------


export default function ElevatorShaft({
  st,
  carPosMV,
  highlightCurrentFloor = true,
}) {
  const floorHeight = 38; // px ต่อชั้น
  const cabPixelHeight = 45; // ความสูงตัวรถ

  const indices = getFloorIndices(st);
  const levels = Math.max(1, indices.length || st?.max_level || 1);
  const shaftHeight = floorHeight * levels;

  // MotionValue หลัก
  const fallbackMV = useMotionValue(st?.floorPosition ?? 1);
  const posMV = carPosMV ?? fallbackMV;

  // เก็บค่าชั้นก่อนหน้าเพื่อเปรียบเทียบ
  const lastTargetRef = useRef(posMV.get());

  // 🔥 เคลื่อนไหวเมื่อ floorPosition เปลี่ยน
  useEffect(() => {
    const to = Number(st?.floorPosition ?? 1);
    if (!Number.isFinite(to)) return;

    const from = posMV.get();
    const delta = Math.abs(to - from);

    if (Math.abs(to - lastTargetRef.current) < 0.001) return;

    lastTargetRef.current = to;

    const duration = 0.5 + delta * 0.8;

    animate(posMV, to, {
      type: "tween",
      ease: "easeInOut",
      duration,
    });
  }, [st?.floorPosition, posMV]);

  // แปลงค่าชั้น -> พิกเซลของ bottom รถลิฟต์
  const carBottomMV = useTransform(posMV, (v) => {
    const clamped = Math.max(1, Math.min(levels, v));
    return (
      (clamped - 1) * floorHeight + (floorHeight - cabPixelHeight) / 2
    );
  });

  // ===== แสดงเลขชั้นปัจจุบัน =====
  const clampLevel = (v) => Math.max(1, Math.min(levels, v));
  const [currentLevel, setCurrentLevel] = useState(() =>
    Math.round(clampLevel(posMV.get?.() ?? (st?.floorPosition ?? 1)))
  );

  useMotionValueEvent(posMV, "change", (v) => {
    const lv = Math.round(clampLevel(v));
    setCurrentLevel((prev) => (lv !== prev ? lv : prev));
  });

  // ===== สร้างรายการเลขชั้น =====
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
    <div className="w-full max-w-sm mx-auto px-2 py-2 bg-white rounded-lg shadow-md border">  
      <div className="flex justify-between items-start gap-0 relative">
        
        <div
          className="flex flex-col-reverse justify-between w-6"
          style={{ height: `${shaftHeight}px` }}
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
        
        {/* 2. คอลัมน์หมายเลขชั้น */}
        <div
          className="flex flex-col-reverse justify-between"
          style={{ height: `${shaftHeight}px` }}
        >
          {floorsList}
        </div>

        {/* 3. ปล่องลิฟต์ */}
        <div
          className="relative w-40 flex-grow bg-gray-200 rounded-lg border-2 border-gray-300 overflow-hidden"
          style={{ height: `${shaftHeight}px` }}
        >
          {/* เส้นแบ่งชั้น */}
          <div className="absolute inset-y-0 left-0 w-full flex flex-col-reverse">
            {indices.map((idx) => (
              <div
                key={idx}
                className="w-full"
                style={{ height: `${floorHeight}px` }}
              />
            ))}
          </div>

          {/* รถลิฟต์ */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 w-16 h-10"
            style={{
              bottom: carBottomMV,
              zIndex: 10,
              willChange: "transform,bottom",
            }}
          >
            <div
              className={`w-full h-full rounded border-2 transition-colors ${st?.moving
                  ? "bg-purple-600 border-purple-400 shadow-lg shadow-purple-500/50"
                  : "bg-blue-600 border-blue-400"
                }`}
            >
              <div className="relative h-full flex items-center">
                {/* ประตูลิฟต์ซ้าย */}
                <div
                  className={`w-1/2 h-full bg-blue-900 border-r-2 border-blue-700 transition-transform duration-500 transform ${st?.door === "OPEN"
                      ? "-translate-x-full"
                      : "translate-x-0"
                    } ${st?.doorAnimating && st?.door === "OPEN"
                      ? "animate-pulse"
                      : ""
                    }`}
                />
                {/* ประตูลิฟต์ขวา */}
                <div
                  className={`w-1/2 h-full bg-blue-900 border-l-2 border-blue-700 transition-transform duration-500 transform ${st?.door === "OPEN"
                      ? "translate-x-full"
                      : "translate-x-0"
                    } ${st?.doorAnimating && st?.door === "OPEN"
                      ? "animate-pulse"
                      : ""
                    }`}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}