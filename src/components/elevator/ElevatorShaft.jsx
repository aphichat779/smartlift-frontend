// src/components/elevator/ElevatorShaft.jsx
import React, { useMemo } from "react";
import { motion, useTransform, useMotionValue } from "framer-motion";
import { ArrowUp, ArrowDown, Square } from "lucide-react";
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

/**
 * Props:
 * - st: { floorLabels, max_level, floorPosition, moving, door, doorAnimating, direction }
 * - carPosMV?: MotionValue<number>  (ไม่บังคับ; ถ้าไม่ส่งมา จะ fallback เป็น motion value ภายใน)
 */
export default function ElevatorShaft({ st, carPosMV }) {
  const floorHeight = 36; // px ต่อชั้น
  const cabPixelHeight = 40;

  const indices = getFloorIndices(st);
  const levels = indices.length || st?.max_level || 1;
  const shaftHeight = floorHeight * levels;

  // ✅ Fallback: ถ้าไม่ได้ส่ง carPosMV มา (เช่นจุดเรียกอื่นในแอป)
  // ให้สร้าง motion value จาก floorPosition ปัจจุบัน
  const fallbackMV = useMotionValue(st?.floorPosition ?? 1);
  const posMV = carPosMV ?? fallbackMV;

  // map "เลขชั้น" (1..levels, ทศนิยมได้) -> bottom px
  const carBottomMV = useTransform(
    posMV,
    (v) => (Math.max(1, Math.min(levels, v)) - 1) * floorHeight + (floorHeight - cabPixelHeight) / 2
  );

  const floorsList = useMemo(
    () =>
      indices.map((idx) => {
        const lbl = getFloorLabel(st, idx);
        return (
          <div key={idx} className="flex items-center gap-2" style={{ height: `${floorHeight}px` }}>
            <div className="font-extrabold text-gray-700 text-sm">{lbl}</div>
          </div>
        );
      }),
    [indices, st]
  );

  return (
    <div className="w-full max-w-sm mx-auto p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-start gap-4 relative">
        {/* หมายเลขชั้น */}
        <div className="flex flex-col-reverse justify-between" style={{ height: `${shaftHeight}px` }}>
          {floorsList}
        </div>

        {/* ปล่องลิฟต์ */}
        <div
          className="relative w-40 flex-grow bg-gray-200 rounded-lg border-2 border-gray-300 overflow-hidden"
          style={{ height: `${shaftHeight}px` }}
        >
          {/* เส้นแบ่งชั้น */}
          <div className="absolute inset-y-0 left-0 w-full flex flex-col-reverse">
            {indices.map((idx) => (
              <div key={idx} className="w-full border-t border-gray-300" style={{ height: `${floorHeight}px` }} />
            ))}
          </div>

          {/* รถลิฟต์ (ขยับด้วย motion value; ไม่ re-render ทุกเฟรม) */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 w-16 h-10"
            style={{ bottom: carBottomMV, zIndex: 10, willChange: "transform,bottom" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div
              className={`w-full h-full rounded border-2 transition-colors ${
                st?.moving ? "bg-purple-600 border-purple-400 shadow-lg shadow-purple-500/50" : "bg-blue-600 border-blue-400"
              }`}
            >
              <div className="relative h-full flex items-center">
                <div
                  className={`w-1/2 h-full bg-blue-900 border-r-2 border-blue-700 transition-transform duration-500 transform ${
                    st?.door === "OPEN" ? "-translate-x-full" : "translate-x-0"
                  } ${st?.doorAnimating && st?.door === "OPEN" ? "animate-pulse" : ""}`}
                />
                <div
                  className={`w-1/2 h-full bg-blue-900 border-l-2 border-blue-700 transition-transform duration-500 transform ${
                    st?.door === "OPEN" ? "translate-x-full" : "translate-x-0"
                  } ${st?.doorAnimating && st?.door === "OPEN" ? "animate-pulse" : ""}`}
                />
              </div>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                {getDirectionIcon(st?.direction)}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
