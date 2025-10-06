// src/components/pages/MonitorOverview.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Monitor as MonitorIcon, Wifi, WifiOff, Building, ChevronDown } from "lucide-react"; 
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useElevators } from "../../contexts/ElevatorContext";
import ElevatorShaft from "../elevator/ElevatorShaft";
import ElevatorControlPanel from "../elevator/ElevatorControlPanel";
import { getStatusBg, getStatusColor } from "../../utils/liftUtils";
import { useAuth } from "../../contexts/AuthContext";

function getOrgFromLift(st) {
  const idRaw = st?.org_id ?? st?.organization_id ?? st?.orgId ?? null;
  const labelRaw =
    st?.org_name ?? st?.organization_name ?? st?.organization ?? st?.org ?? null;

  if (idRaw != null) {
    const id = String(idRaw);
    const label = String(labelRaw ?? `Org #${id}`);
    return { id, label };
  }
  if (labelRaw != null) {
    const label = String(labelRaw).trim();
    if (label) return { id: `name:${label}`, label };
  }
  return null;
}

export default function MonitorOverview() {
  const { elevatorStates, handleSelectFloor, connectionStatus } = useElevators();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const role = user?.role?.toLowerCase?.() ?? "user";

  const [orgOptions, setOrgOptions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const closeTimeoutRef = useRef(null); 

  const openDropdown = () => {
      if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
      }
      setIsDropdownOpen(true);
  };

  const closeDropdown = () => {
      closeTimeoutRef.current = setTimeout(() => {
          setIsDropdownOpen(false);
      }, 200); 
  };
  
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const selectedOrgFromURL = query.get('org');
  const [internalSelectedOrg, setInternalSelectedOrg] = useState(selectedOrgFromURL); 

  const handleOrgChange = (orgId) => {
    setInternalSelectedOrg(orgId);
    if (orgId) {
      navigate(`?org=${orgId}`, { replace: true });
    } else {
      navigate(location.pathname, { replace: true });
    }
  };

  useEffect(() => {
    if (!elevatorStates) return;
    const seen = new Map();
    Object.values(elevatorStates).forEach((st) => {
      const org = getOrgFromLift(st);
      if (org) seen.set(org.id, org.label);
    });
    const list = Array.from(seen, ([id, label]) => ({ id, label })).sort((a, b) =>
      a.label.localeCompare(b.label, "th")
    );
    setOrgOptions(list);
  }, [elevatorStates]);

  useEffect(() => {
    if (orgOptions.length > 0) {
      const currentSelection = selectedOrgFromURL || internalSelectedOrg;
      
      if (!currentSelection || !orgOptions.find(o => o.id === currentSelection)) {
        const defaultOrgId = orgOptions[0].id;
        handleOrgChange(defaultOrgId);
      } else if (selectedOrgFromURL && selectedOrgFromURL !== internalSelectedOrg) {
         setInternalSelectedOrg(selectedOrgFromURL);
      }
    }
  }, [orgOptions, selectedOrgFromURL, internalSelectedOrg]);

  const selectedOrg = selectedOrgFromURL || internalSelectedOrg;
  const effectiveSelectedOrg = selectedOrg ?? (orgOptions[0]?.id ?? null);
  const currentOrgLabel = orgOptions.find(o => o.id === effectiveSelectedOrg)?.label ?? 'เลือกองค์กร';


  const filteredLiftIds = useMemo(() => {
    if (!elevatorStates) return [];

    let ids = Object.keys(elevatorStates);

    if (role === "user") {
      const userOrgId = user?.org_id != null ? String(user.org_id) : null;
      if (userOrgId) {
        ids = ids.filter((lid) => getOrgFromLift(elevatorStates[lid])?.id === userOrgId);
      } else {
        ids = [];
      }
      return ids;
    }

    if (effectiveSelectedOrg) {
      ids = ids.filter(
        (lid) => getOrgFromLift(elevatorStates[lid])?.id === effectiveSelectedOrg
      );
    }
    return ids;
  }, [elevatorStates, role, user, effectiveSelectedOrg]);
  
  const shouldShowOrgDropdown = orgOptions.length > 0 && role !== "user";

  if (connectionStatus === "disconnected" || connectionStatus === "connecting") {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">กำลังเตรียมข้อมูล...</p>
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
                กรุณาตรวจสอบการเชื่อมต่อกับเซิร์ฟเวอร์หรือลองเปลี่ยนองค์กร
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
          <div className="flex items-center gap-3">
            <MonitorIcon className="w-8 h-8 text-blue-600" />
            
            {/* H1 พร้อม Custom Dropdown ที่เปิดเมื่อ Hover */}
            <h1 className="text-2xl font-bold flex items-center gap-2">
              หน้าที่ 2: Overview
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
                                  clearTimeout(closeTimeoutRef.current); 
                              }
                            }}
                            className={[
                              'block px-4 py-2 text-sm cursor-pointer transition-colors',
                              org.id === effectiveSelectedOrg ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
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

          <div className="flex gap-3">
            <Link to={`/monitor${effectiveSelectedOrg ? `?org=${effectiveSelectedOrg}` : ''}`}
              className="px-4 py-2 bg-gray-200 rounded">
              Monitor
            </Link>
          </div>
        </div>

        {/* Elevators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {filteredLiftIds.map((id) => {
            const st = elevatorStates[id];
            return (
              <Link 
                key={id}
                to={`/lifts/${id}`} 
                className="bg-white hover:bg-gray-50 rounded-lg p-6 border border-gray-200 transition-all block group" 
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-lg font-bold text-blue-600 group-hover:underline" 
                  >
                    {st.lift_name ?? id}
                  </span>
                  <div className="flex items-center gap-2">
                    {st.connection === "ONLINE" ? (
                      <Wifi className="w-5 h-5 text-green-600" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-red-600" />
                    )}
                    <div
                      className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${getStatusBg(
                        st.status
                      )}`}
                    >
                      <span className={getStatusColor(st.status)}>
                        {st.status ?? "NORMAL"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row gap-4 items-start overflow-hidden">
                  <div className="flex-none min-w-0 w-[180px]">
                    <div>
                      <ElevatorShaft st={st} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div>
                      <ElevatorControlPanel
                        st={st}
                        onSelectFloor={handleSelectFloor}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-right">
                  <span 
                    className="text-sm text-blue-600 group-hover:underline" 
                  >
                    ดูรายละเอียด →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}