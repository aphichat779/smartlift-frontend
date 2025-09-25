// src/pages/MonitorAll.jsx
import React from "react";
import { Monitor as MonitorIcon, Wifi, WifiOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useElevators } from '../../contexts/ElevatorContext';
import ElevatorShaft from "../elevator/ElevatorShaft";

export default function MonitorAll() {
  const { elevatorStates, filteredLiftIds } = useElevators();

  // กันกรณี state ยังไม่พร้อม (ปกติจะพร้อมเพราะมี initial mock)
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
            <h1 className="text-2xl font-bold">หน้าที่ 1: Monitor ทั้งหมด (ย่อ)</h1>
          </div>
          <div className="flex gap-3">
            <Link to="/monitor/overview" className="px-4 py-2 bg-blue-600 text-white rounded">
              Overview
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {filteredLiftIds.map((id) => {
            const st = elevatorStates[id];
            return (
              <Link
                key={id}
                to={`/lifts/${id}`}
                className="bg-white hover:bg-gray-50 rounded-lg p-6 border border-gray-300 transition-all block"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-blue-600">{st.lift_name}</h3>
                  <div className="flex items-center">
                    {st.connection === "ONLINE" ? (
                      <Wifi className="w-5 h-5 text-green-600" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>
                <ElevatorShaft st={st} />
              </Link>
            );
          })}
        </div>

        <div className="text-center text-gray-500 text-xs mt-10">
          ระบบควบคุมลิฟต์อัจฉริยะ © 2025
        </div>
      </div>
    </div>
  );
}
