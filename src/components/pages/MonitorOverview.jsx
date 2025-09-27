// src/components/pages/MonitorOverview.jsx

import React from "react";
import { Monitor as MonitorIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useElevators } from "../../contexts/ElevatorContext";
import ElevatorShaft from "../elevator/ElevatorShaft";
import ElevatorControlPanel from "../elevator/ElevatorControlPanel";
import { getStatusBg, getStatusColor } from "../../utils/liftUtils";

export default function MonitorOverview() {
  // ดึงฟังก์ชันสำหรับส่งคำสั่งจาก Context
  const { elevatorStates, filteredLiftIds, handleFloorSelect } = useElevators();

  // ตรวจสอบว่ามีข้อมูลหรือไม่
  if (!elevatorStates) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">กำลังเตรียมข้อมูล...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MonitorIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold">
              หน้าที่ 2: Overview (ข้อมูลคร่าว ๆ)
            </h1>
          </div>
          <div className="flex gap-3">
            <Link to="/monitor" className="px-4 py-2 bg-gray-200 rounded">
              Monitor
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {filteredLiftIds.map((id) => {
            const st = elevatorStates[id];
            return (
              <div
                key={id}
                className="bg-white hover:bg-gray-50 rounded-lg p-6 border border-gray-200 transition-all"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <Link
                    to={`/lifts/${id}`}
                    className="text-lg font-bold text-blue-600 hover:underline"
                  >
                    {st.lift_name}
                  </Link>
                  <div
                    className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${getStatusBg(
                      st.status
                    )}`}
                  >
                    <span className={getStatusColor(st.status)}>
                      {st.status}
                    </span>
                  </div>
                </div>

                {/* Info row */}
                <div className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm mb-4">
                  <div className="flex items-center">
                    <span className="text-gray-600"></span>
                    <span className="font-medium">
                      {st.org_name} {st.building_name}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600">โหมด:</span>
                    <span className="font-medium">
                      {st.mode === "AUTO" ? "อัตโนมัติ" : "แมนนวล"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600">ประตู:</span>
                    <span className="font-medium">
                      {st.door === "OPEN" ? "เปิด" : "ปิด"}
                    </span>
                  </div>
                </div>

                {/* Main layout: shaft (fixed) | control (fluid) */}
                <div className="flex flex-row gap-4 items-start overflow-hidden">
                  <div className="flex-none min-w-0 w-[160px] sm:w-[240px] md:w-[260px] lg:w-[180px] xl:w-[180px]">
                    <div className="rounded-xl border border-gray-300 bg-white p-3">
                      <ElevatorShaft st={st} />
                    </div>
                  </div>

                  {/* แผงควบคุม: กินพื้นที่ที่เหลือทั้งหมด */}
                  <div className="flex-1 min-w-0">
                    <div className="w-full max-w-full overflow-hidden border rounded-lg p-2">
                      <ElevatorControlPanel 
                        st={st}
                        // เชื่อมต่อ onSelectFloor กับฟังก์ชันที่เรียก API
                        onSelectFloor={handleFloorSelect}
                        // ส่วนอื่น ๆ ที่อาจเพิ่มในภายหลัง เช่น onDoor, onMode
                      />
                    </div>
                  </div>
                </div>

                {/* Footer link */}
                <div className="mt-2 text-right">
                  <Link
                    to={`/lifts/${id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    ดูรายละเอียด →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}