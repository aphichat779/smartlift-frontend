// src/components/pages/MonitorAll.jsx
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useDeferredValue,
} from "react";
import {
  Monitor as MonitorIcon,
  Wifi,
  WifiOff,
  Building,
  ChevronDown,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useElevators } from "../../contexts/ElevatorContext";
import { useAuth } from "../../contexts/AuthContext";
import ElevatorShaft from "../elevator/ElevatorShaft";

/** normalize เป็น { id, label } */
function getOrgFromLift(st) {
  const orgId =
    st?.org_id ?? st?.orgId ?? st?.organization_id ?? st?.organizationId ?? null;
  const orgLabelRaw =
    st?.org_name ?? st?.organization_name ?? st?.organization ?? st?.org ?? null;
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
  const direct = st?.current_floor ?? st?.current_level ?? st?.level ?? null;
  if (direct != null && !Number.isNaN(Number(direct))) {
    const n = Number(direct);
    return n >= 1 ? n : 1;
  }
  if (typeof st?.lift_state === "string" && st.lift_state.length >= 2) {
    const maybe = parseInt(st.lift_state.slice(0, 2), 16);
    if (!Number.isNaN(maybe) && maybe >= 1) return maybe;
  }
  return 1;
}

// ✅ สีกรอบตามสถานะ
function cardStatusClasses(online) {
  return online
    ? "border-emerald-300/70 hover:border-emerald-400 focus:ring-emerald-400/60 hover:bg-emerald-50/30"
    : "border-rose-300/70 hover:border-rose-400 focus:ring-rose-400/60 hover:bg-rose-50/30";
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
  const closeTimeoutRef = useRef(null);

  const openDropdown = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setIsDropdownOpen(true);
  };
  const closeDropdown = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 180);
  };
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const selectedOrgFromURL = query.get("org");
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

  useEffect(() => {
    if (canSeeOrgDropdown(role) && orgOptions.length > 0) {
      const currentSelection = selectedOrgFromURL || internalSelectedOrg;
      if (!currentSelection || !orgOptions.find((o) => o.id === currentSelection)) {
        const defaultOrgId = orgOptions[0].id;
        handleOrgChange(defaultOrgId);
      } else if (selectedOrgFromURL && selectedOrgFromURL !== internalSelectedOrg) {
        setInternalSelectedOrg(selectedOrgFromURL);
      }
    }
  }, [orgOptions, role, selectedOrgFromURL, internalSelectedOrg]);

  const selectedOrg = selectedOrgFromURL || internalSelectedOrg;
  const orgToUse = selectedOrg ?? (orgOptions[0]?.id ?? null);
  const currentOrgLabel =
    orgOptions.find((o) => o.id === orgToUse)?.label ?? "เลือกองค์กร";

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

  // ทำให้ UI ลื่นขึ้นเมื่อจำนวนลิฟต์มาก ๆ
  const deferredLiftIds = useDeferredValue(filteredLiftIds);

  const shouldShowOrgDropdown = canSeeOrgDropdown(role) && orgOptions.length > 0;

  if (connectionStatus === "disconnected" || connectionStatus === "connecting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              {/* border-4 (Tailwind ไม่มี border-3) */}
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-blue-600 mx-auto mb-4" />
              <p className="text-lg text-slate-600">กำลังเชื่อมต่อและรอข้อมูล...</p>
              <p className="text-sm text-slate-500 mt-2">สถานะ: {connectionStatus}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (connectionStatus === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-rose-600 mb-4">
                <WifiOff className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-lg text-slate-600">ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:opacity-95 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-lg text-slate-600">ไม่พบข้อมูลลิฟต์</p>
              <p className="text-sm text-slate-500 mt-2">
                {role === "user"
                  ? "ไม่พบข้อมูลลิฟต์สำหรับองค์กรของคุณ"
                  : "กรุณาตรวจสอบการเชื่อมต่อกับเซิร์ฟเวอร์หรือเลือกองค์กรอื่น"}
              </p>
            </div>
            {shouldShowOrgDropdown && ( // แสดง Dropdown แม้ไม่พบลิฟต์ในองค์กรปัจจุบัน
              <div className="mt-8">
                <div
                  className="relative ml-2"
                  onMouseEnter={openDropdown}
                  onMouseLeave={closeDropdown}
                >
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 text-base text-slate-800 shadow ring-1 ring-slate-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="listbox"
                    title="เลือกองค์กร"
                  >
                    <Building className="w-4 h-4 text-slate-500" />
                    {currentOrgLabel}
                    <ChevronDown className="w-4 h-4 -mr-0.5 text-slate-500" />
                  </button>
                  {isDropdownOpen && (
                    <div
                      className="absolute z-20 mt-2 min-w-[12rem] rounded-xl bg-white/90 backdrop-blur shadow-2xl ring-1 ring-slate-200 overflow-hidden"
                      role="listbox"
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
                              "px-4 py-2 text-sm cursor-pointer transition-colors",
                              org.id === orgToUse
                                ? "bg-blue-50 text-blue-700 font-semibold"
                                : "text-slate-700 hover:bg-slate-100",
                            ].join(" ")}
                            role="option"
                            aria-selected={org.id === orgToUse}
                          >
                            {org.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200 text-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/80 backdrop-blur shadow ring-1 ring-slate-200">
              <MonitorIcon className="w-7 h-7 text-blue-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              หน้าที่ 1: Monitor
              {shouldShowOrgDropdown && (
                <div
                  className="relative ml-2"
                  onMouseEnter={openDropdown}
                  onMouseLeave={closeDropdown}
                >
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 text-base text-slate-800 shadow ring-1 ring-slate-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="listbox"
                    title="เลือกองค์กร"
                  >
                    <Building className="w-4 h-4 text-slate-500" />
                    {currentOrgLabel}
                    <ChevronDown className="w-4 h-4 -mr-0.5 text-slate-500" />
                  </button>
                  {isDropdownOpen && (
                    <div
                      className="absolute z-20 mt-2 min-w-[12rem] rounded-xl bg-white/90 backdrop-blur shadow-2xl ring-1 ring-slate-200 overflow-hidden"
                      role="listbox"
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
                              "px-4 py-2 text-sm cursor-pointer transition-colors",
                              org.id === orgToUse
                                ? "bg-blue-50 text-blue-700 font-semibold"
                                : "text-slate-700 hover:bg-slate-100",
                            ].join(" ")}
                            role="option"
                            aria-selected={org.id === orgToUse}
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
            <Link
              to={`/monitor/overview${
                shouldShowOrgDropdown && orgToUse ? `?org=${orgToUse}` : ""
              }`}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Overview
            </Link>
          </div>
        </div>

        {/* Cards */}
        <div className="flex justify-center"> {/* ✅ เพิ่ม div นี้เพื่อจัด Grid ให้อยู่ตรงกลาง */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {deferredLiftIds.map((id) => {
              const st = elevatorStates[id];
              const currentFloor = guessCurrentFloor(st);
              // ทำให้ทนต่อรูปแบบค่า connection หลากหลาย
              const online = (() => {
                const v = st?.connection;
                if (typeof v === "boolean") return v;
                if (typeof v === "string") return v.toLowerCase() === "online";
                return false;
              })();

              return (
                <Link
                  key={id}
                  to={`/lifts/${id}`}
                  className={[
                    "group block rounded-2xl p-5 border bg-white/85 backdrop-blur",
                    "shadow-[0_12px_30px_-12px_rgba(2,6,23,0.25)]",
                    "hover:shadow-[0_16px_40px_-10px_rgba(2,6,23,0.35)] hover:-translate-y-0.5 transition-all",
                    "focus:outline-none focus:ring-2",
                    cardStatusClasses(online),
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-900 truncate">
                      {st?.lift_name ?? id}
                    </h3>
                    <div
                      className={[
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1",
                        online
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-rose-50 text-rose-700 ring-rose-200",
                      ].join(" ")}
                      title={online ? "ONLINE" : "OFFLINE"}
                    >
                      {online ? (
                        <>
                          <Wifi className="w-3.5 h-3.5" /> Online
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3.5 h-3.5" /> Offline
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <ElevatorShaft
                      st={st}
                      currentFloor={currentFloor}
                      highlightCurrentFloor
                      compact
                      className="w-64 group-hover:ring-1 group-hover:ring-blue-300/60 transition"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="text-center text-slate-500 text-xs mt-10">
          ระบบควบคุมลิฟต์อัจฉริยะ © 2025
        </div>
      </div>
    </div>
  );
}