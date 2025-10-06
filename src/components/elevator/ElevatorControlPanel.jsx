// src/components/elevator/ElevatorControlPanel.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
// ลบการนำเข้า: import { Wifi, WifiOff } from "lucide-react"; 
import { getFloorIndices, getFloorLabel, getStatusBg, getStatusColor } from "@/utils/liftUtils";
// นำเข้าฟังก์ชันสำหรับตรวจสอบการเรียก
import { checkLevel } from "@/utils/legacyLiftParser";

export default function ElevatorControlPanel({ st, onSelectFloor, onSend, onDoor, onMode }) {
  // สถานะออนไลน์ยังคงใช้ในการควบคุมปุ่มสั่งการ 'ประตู' และ 'โหมด'
  const isOnline = st?.connection === "ONLINE";
  const isMoving = Boolean(st?.moving);
  const floorIndices = useMemo(() => (st ? getFloorIndices(st) : []), [st?.floor_name, st?.max_level, st?.id]);
  const hasFloors = floorIndices.length > 0;

  const selectedFloor = Number.isFinite(st?.selectedFloor) ? st.selectedFloor : null;
  const currentIdx = Number.isFinite(st?.floorPosition) ? Math.round(st.floorPosition) : 0;
  
  // สตริง Hex สถานะการเรียกภายในรถ (Car Call Status)
  const carStatusHex = st?.car_status_hex || "";
  
  // ตัวแปรนี้ไม่ได้ใช้แล้ว แต่ถูกเก็บไว้เผื่อมีการใช้งานปุ่ม 'Send' ในอนาคต
  const canSend = isOnline && !isMoving && hasFloors && selectedFloor !== null && selectedFloor !== currentIdx;

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-400 mb-4">
      <h3 className="text-sm font-bold mb-4 text-blue-600 text-center">
        แผงควบคุมลิฟต์ {st?.lift_name ?? "-"}
      </h3>
      <div className="space-y-4">
        <div>
          <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))" }}>
            {hasFloors ? (
              floorIndices.map((idx) => {
                const lbl = getFloorLabel(st, idx);
                // ตรวจสอบว่าปุ่มนี้ถูกกดหรือไม่ (ใช้แสดงสถานะ)
                const isPressed = checkLevel(carStatusHex, idx + 0);
                const isSelected = selectedFloor === idx;

                // ตั้งค่าให้ปุ่มถูกปิดใช้งานเสมอ เพื่อป้องกันการสั่งการ
                const disabled = true; 

                return (
                  <button key={idx} type="button" 
                    onClick={() => {}} // ตั้งเป็นฟังก์ชันว่าง
                    disabled={disabled} // ป้องกันการคลิก
                    className={[ 
                      "h-10 rounded text-sm font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400", 
                      // กำหนดสีตามสถานะการกด (ไม่ว่าออนไลน์หรือไม่ก็ตาม)
                      isPressed ? "bg-blue-600 text-white shadow-lg" : 
                      isSelected ? "bg-blue-300 text-blue-900" : 
                      "bg-gray-200 text-gray-800 hover:bg-gray-300", 
                      "cursor-default" // เปลี่ยนเคอร์เซอร์เป็นลูกศรปกติ
                    ].join(" ")}
                    title={`ชั้น ${lbl}`} aria-label={`สถานะเรียกชั้น ${lbl}`} aria-pressed={isPressed}>
                    {lbl}
                  </button>
                );
              })
            ) : (<div className="text-sm text-gray-500 py-2">ไม่มีข้อมูลชั้น</div>)}
          </div>
        </div>
        
        {/* ปุ่มควบคุมจริง (ประตู/โหมด) ยังคงขึ้นอยู่กับสถานะ isOnline */}
        {(onDoor || onMode) && (
          <div className="grid grid-cols-2 gap-3">
            {onDoor && (<button type="button" onClick={() => onDoor(st.id)} disabled={!isOnline} className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded" title="สั่งเปิด/ปิดประตู | Toggle Door">ประตู | Door</button>)}
            {onMode && (<button type="button" onClick={() => onMode(st.id)} disabled={!isOnline} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded" title="สลับโหมด | Toggle Mode">โหมด | Mode</button>)}
          </div>
        )}
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