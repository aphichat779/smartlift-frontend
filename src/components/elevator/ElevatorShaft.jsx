// src/components/elevator/ElevatorShaft.jsx
import React from "react";
import { ArrowUp, ArrowDown, Square } from "lucide-react";
import { getFloorIndices, getFloorLabel } from "@/utils/elevator";

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

export default function ElevatorShaft({ st }) {
  const floorHeight = 36;
  const indices = getFloorIndices(st);
  const levels = indices.length;
  const shaftHeight = floorHeight * levels;

  const cabPixelHeight = 40;
  const cabBottom =
    (st.floorPosition - 1) * floorHeight + (floorHeight - cabPixelHeight) / 2;

  return (
    <div className="w-full max-w-sm mx-auto p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-start gap-4 relative">
        {/* ส่วนแสดงหมายเลขชั้น */}
        <div className="flex flex-col-reverse justify-between" style={{ height: `${shaftHeight}px` }}>
          {indices.map((idx) => {
            const lbl = getFloorLabel(st, idx);
            const isCurrentFloor = Math.round(st.floorPosition) === idx;
            return (
              <div key={idx} className="flex items-center gap-2" style={{ height: `${floorHeight}px` }}>
                <div
                  className={`font-extrabold transition-all duration-300 ${
                    isCurrentFloor ? "text-yellow-500 text-lg" : "text-gray-700 text-sm"
                  }`}
                >
                  {lbl}
                </div>
              </div>
            );
          })}
        </div>

        {/* ส่วนปล่องลิฟต์ */}
        <div className="relative w-40 flex-grow bg-gray-200 rounded-lg border-2 border-gray-300 overflow-hidden" style={{ height: `${shaftHeight}px` }}>
          <div className="absolute inset-y-0 left-0 w-full flex flex-col-reverse">
            {indices.map((idx) => (
              <div
                key={idx}
                className={`w-full border-t border-gray-300 ${Math.round(st.floorPosition) === idx ? "border-2 border-blue-500" : ""}`}
                style={{ height: `${floorHeight}px` }}
              />
            ))}
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 w-16 h-10 transition-all duration-300 ease-in-out" style={{ bottom: `${cabBottom}px`, zIndex: 10 }}>
            <div className={`w-full h-full rounded border-2 transition-all duration-300 ${st.moving ? "bg-purple-600 border-purple-400 shadow-lg shadow-purple-500/50" : "bg-blue-600 border-blue-400"}`}>
              <div className="relative h-full flex items-center">
                <div className={`w-1/2 h-full bg-blue-900 border-r-2 border-blue-700 transition-all duration-500 transform ${st.door === "OPEN" ? "-translate-x-full" : "translate-x-0"} ${st.doorAnimating && st.door === "OPEN" ? "animate-pulse" : ""}`} />
                <div className={`w-1/2 h-full bg-blue-900 border-l-2 border-blue-700 transition-all duration-500 transform ${st.door === "OPEN" ? "translate-x-full" : "translate-x-0"} ${st.doorAnimating && st.door === "OPEN" ? "animate-pulse" : ""}`} />
              </div>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                {getDirectionIcon(st.direction)}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* status chip: แสดงด้านล่าง */}
      {/* ให้หน้าที่เรียกใช้เป็นผู้จัดการสี/ข้อความเองถ้าต้องการ */}
    </div>
  );
}