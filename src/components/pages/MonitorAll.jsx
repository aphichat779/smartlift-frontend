// src/components/pages/MonitorAll.jsx
import React, { useState, useEffect, useMemo, useRef } from "react"; // 👈 เพิ่ม useRef
import { Monitor as MonitorIcon, Wifi, WifiOff, Building, ChevronDown } from "lucide-react"; 
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useElevators } from "../../contexts/ElevatorContext";
import { useAuth } from "../../contexts/AuthContext";
import ElevatorShaft from "../elevator/ElevatorShaft";

/** normalize เป็น { id, label } */
function getOrgFromLift(st) {
  const orgId = st?.org_id ?? st?.orgId ?? st?.organization_id ?? st?.organizationId ?? null;
  const orgLabelRaw = st?.org_name ?? st?.organization_name ?? st?.organization ?? st?.org ?? null;
  if (orgId != null) {
    const id = String(orgId);
    const label = String(orgLabelRaw ?? `Org #${id}`);
    return { id, label };
  }
  if (orgLabelRaw) {
    const label = String(orgLabelRaw).trim();
    if (label) return { id: `name:${label}`, label };
  }
  return null;
}

function getUserOrgId(user) {
  const id = user?.org_id ?? user?.organization_id ?? null;
  return id == null ? null : String(id);
}

function canSeeOrgDropdown(role) {
  const r = role?.toString()?.toLowerCase?.() ?? "";
  return r === "super_admin" || r === "admin" || r === "technician";
}

function guessCurrentFloor(st) {
  const direct =
    st?.current_floor ??
    st?.current_level ??
    st?.level ??
    null;

  if (direct != null && !Number.isNaN(Number(direct))) return Number(direct);

  if (typeof st?.lift_state === "string" && st.lift_state.length >= 2) {
    const maybe = parseInt(st.lift_state.slice(0, 2), 16);
    if (!Number.isNaN(maybe) && maybe > 0) return maybe;
  }
  return 1;
}

export default function MonitorAll() {
  const { elevatorStates, connectionStatus } = useElevators();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const role = user?.role?.toString()?.toLowerCase?.() ?? null;
  const userOrgId = getUserOrgId(user);
  
  const [orgOptions, setOrgOptions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const closeTimeoutRef = useRef(null); // 👈 ใช้สำหรับเก็บ ID ของ Timeout

  // Helper functions สำหรับการจัดการ Hover (ป้องกันการปิดเร็วเกินไป)
  const openDropdown = () => {
      if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
      }
      setIsDropdownOpen(true);
  };

  const closeDropdown = () => {
      // หน่วงเวลา 200ms ก่อนปิด
      closeTimeoutRef.current = setTimeout(() => {
          setIsDropdownOpen(false);
      }, 200); 
  };
  
  // ล้าง Timeout เมื่อ Component ถูกถอด (Unmount)
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);


  // อ่านค่า 'org' จาก URL query parameter
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const selectedOrgFromURL = query.get('org');
  const [internalSelectedOrg, setInternalSelectedOrg] = useState(selectedOrgFromURL);

  // ฟังก์ชันสำหรับเปลี่ยนองค์กรและอัพเดท URL
  const handleOrgChange = (orgId) => {
    setInternalSelectedOrg(orgId);
    if (orgId) {
      navigate(`?org=${orgId}`, { replace: true });
    } else {
      navigate(location.pathname, { replace: true });
    }
  };

  // รวม organizations จากสถานะลิฟต์
  useEffect(() => {
    if (!elevatorStates) {
      setOrgOptions([]);
      return;
    }
    const seen = new Map();
    for (const st of Object.values(elevatorStates)) {
      const org = getOrgFromLift(st);
      if (!org) continue;
      if (!seen.has(org.id)) seen.set(org.id, org.label);
    }
    const options = Array.from(seen.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "th"));
    setOrgOptions(options);
  }, [elevatorStates]);

  // ซิงค์ URL และตั้งค่า Default
  useEffect(() => {
    if (canSeeOrgDropdown(role) && orgOptions.length > 0) {
      const currentSelection = selectedOrgFromURL || internalSelectedOrg;
      
      if (!currentSelection || !orgOptions.find(o => o.id === currentSelection)) {
        const defaultOrgId = orgOptions[0].id;
        handleOrgChange(defaultOrgId);
      } else if (selectedOrgFromURL && selectedOrgFromURL !== internalSelectedOrg) {
         setInternalSelectedOrg(selectedOrgFromURL);
      }
    }
  }, [orgOptions, role, selectedOrgFromURL, internalSelectedOrg]);

  // องค์กรที่ใช้จริง
  const selectedOrg = selectedOrgFromURL || internalSelectedOrg;
  const orgToUse = selectedOrg ?? (orgOptions[0]?.id ?? null);
  const currentOrgLabel = orgOptions.find(o => o.id === orgToUse)?.label ?? 'เลือกองค์กร';


  // กรองลิฟต์
  const filteredLiftIds = useMemo(() => {
    if (!elevatorStates) return [];
    let ids = Object.keys(elevatorStates);

    if (role === "user" && userOrgId) {
      ids = ids.filter((id) => getOrgFromLift(elevatorStates[id])?.id === userOrgId);
      return ids;
    }

    if (canSeeOrgDropdown(role)) {
      if (orgToUse) { 
        ids = ids.filter((id) => getOrgFromLift(elevatorStates[id])?.id === orgToUse);
      }
    }
    return ids;
  }, [elevatorStates, role, userOrgId, orgToUse]);

  const shouldShowOrgDropdown = canSeeOrgDropdown(role) && orgOptions.length > 0;

  if (connectionStatus === "disconnected" || connectionStatus === "connecting") {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">กำลังเชื่อมต่อและรอข้อมูล...</p>
              <p className="text-sm text-gray-500 mt-2">สถานะ: {connectionStatus}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (connectionStatus === "error") {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <WifiOff className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-lg text-gray-600">ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                ลองใหม่
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!elevatorStates || filteredLiftIds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-lg text-gray-600">ไม่พบข้อมูลลิฟต์</p>
              <p className="text-sm text-gray-500 mt-2">
                {role === "user"
                  ? "ไม่พบข้อมูลลิฟต์สำหรับองค์กรของคุณ"
                  : "กรุณาตรวจสอบการเชื่อมต่อกับเซิร์ฟเวอร์หรือเลือกองค์กรอื่น"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <MonitorIcon className="w-8 h-8 text-blue-600" />
            
            {/* H1 พร้อม Custom Dropdown ที่เปิดเมื่อ Hover */}
            <h1 className="text-2xl font-bold flex items-center gap-2"> 
              หน้าที่ 1: Monitor
              {shouldShowOrgDropdown && (
                <div 
                  className="relative ml-2"
                  onMouseEnter={openDropdown} 
                  onMouseLeave={closeDropdown} 
                >
                  {/* ปุ่มแสดงชื่อองค์กรปัจจุบัน */}
                  <button
                    type="button"
                    className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md bg-white text-base font-normal text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    aria-expanded={isDropdownOpen}
                  >
                    {currentOrgLabel}
                    <ChevronDown className="w-4 h-4 ml-1 -mr-1 text-gray-500" />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div 
                      className="absolute z-10 mt-1 w-30 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                      role="menu"
                    >
                      <div className="py-1">
                        {orgOptions.map((org) => (
                          <div 
                            key={org.id} 
                            onClick={() => {
                              handleOrgChange(org.id);
                              setIsDropdownOpen(false); 
                              if (closeTimeoutRef.current) {
                                  clearTimeout(closeTimeoutRef.current); // ล้าง Timeout หากมีการคลิก
                              }
                            }}
                            className={[
                              'block px-4 py-2 text-sm cursor-pointer transition-colors',
                              org.id === orgToUse ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
                            ].join(' ')}
                            role="menuitem"
                          >
                            {org.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </h1>
          </div>
          
          <div className="flex gap-3 items-center">
            {/* Link ไปยัง Overview โดยส่ง Org parameter ไปด้วย */}
            <Link
              to={`/monitor/overview${orgToUse ? `?org=${orgToUse}` : ''}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Overview
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {filteredLiftIds.map((id) => {
            const st = elevatorStates[id];
            const currentFloor = guessCurrentFloor(st);
            return (
              <Link
                key={id}
                to={`/lifts/${id}`}
                className="bg-white hover:bg-gray-50 rounded-lg p-6 border border-gray-300 transition-all block"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-blue-600">
                    {st?.lift_name ?? id}
                  </h3>
                  <div className="flex items-center">
                    {st?.connection === "ONLINE" ? (
                      <Wifi className="w-5 h-5 text-green-600" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>
                <div className="flex justify-center">
                  <ElevatorShaft
                    st={st}
                    currentFloor={currentFloor}
                    highlightCurrentFloor
                    widthClass="w-32" 
                  />
                </div>
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