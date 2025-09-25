// src/pages/MonitorOverview.jsx
import React from "react";
import { Monitor as MonitorIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useElevators } from "../../contexts/ElevatorContext";
import ElevatorShaft from "../elevator/ElevatorShaft";
import ElevatorControlPanel from "../elevator/ElevatorControlPanel";
import { getStatusBg, getStatusColor } from "../../utils/elevator";

export default function MonitorOverview() {
  const { elevatorStates, filteredLiftIds } = useElevators();

  // no-op handlers เผื่อยังไม่ได้ต่อ backend/action
  const onSelectFloor = (_id, _idx) => { };
  const onSend = (_id) => { };
  const onDoor = (_id) => { };
  const onMode = (_id) => { };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-">
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
                  <div className="flex items-center ">
                    <span className="text-gray-600"></span>
                    <span className="font-medium">{st.org_name} {st.building_name}</span>
                  </div>
                  <div className="flex items-center ">
                    <span className="text-gray-600">โหมด:</span>
                    <span className="font-medium">
                      {st.mode === "AUTO" ? "อัตโนมัติ" : "แมนนวล"}
                    </span>
                  </div>
                  <div className="flex items-center ">
                    <span className="text-gray-600">ประตู:</span>
                    <span className="font-medium">
                      {st.door === "OPEN" ? "เปิด" : "ปิด"}
                    </span>
                  </div>
                </div>

                {/* Main layout: shaft (fixed) | control (fluid) */}
                <div className="flex flex-row gap-4 items-start overflow-hidden">
                  {/* ปล่องลิฟต์: ไม่ยืด, จำกัดความกว้างตาม breakpoint */}
                  <div className="
                          flex-none min-w-0
                          w-[160px]            /* mobile */
                          sm:w-[240px]
                          md:w-[260px]
                          lg:w-[180px]         /* เดสก์ท็อป แคบลง */
                          xl:w-[180px]         /* จอกว้างค่อยขยายได้หน่อย */
                        ">
                    <div className="rounded-xl border border-gray-300 bg-white p-3">
                      <ElevatorShaft st={st} />
                    </div>
                  </div>

                  {/* แผงควบคุม: กินพื้นที่ที่เหลือทั้งหมด */}
                  <div className="flex-1 min-w-0">
                    <div className="w-full max-w-full overflow-hidden **border rounded-lg p-2**">
                      <ElevatorControlPanel
                        st={st}
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
