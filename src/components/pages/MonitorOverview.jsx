// src/components/pages/MonitorOverview.jsx
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
import ElevatorShaft from "../elevator/ElevatorShaft";
import ElevatorControlPanel from "../elevator/ElevatorControlPanel";
import { getStatusBg, getStatusColor } from "../../utils/liftUtils";
import { useAuth } from "../../contexts/AuthContext";

/** normalize เป็น { id, label } ให้ตรงกับ MonitorAll */
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

// สีกรอบการ์ดตามสถานะ online เหมือนหน้า MonitorAll
function cardStatusClasses(online) {
  return online
    ? "border-emerald-300/70 hover:border-emerald-400 focus:ring-emerald-400/60 hover:bg-emerald-50/30"
    : "border-rose-300/70 hover:border-rose-400 focus:ring-rose-400/60 hover:bg-rose-50/30";
}

export default function MonitorOverview() {
  const { elevatorStates, handleSelectFloor, connectionStatus } = useElevators();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const role = user?.role?.toString()?.toLowerCase?.() ?? null;
  const userOrgId = getUserOrgId(user);

  const [orgOptions, setOrgOptions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const closeTimeoutRef = useRef(null);

  /** เปิด/ปิด dropdown: mobile ใช้คลิก, desktop รองรับ hover */
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

  // สร้าง orgOptions จากสถานะลิฟต์
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

  // ตั้งค่า default org และ sync กับ URL
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

  // กรองลิฟต์ให้ตรงกับ MonitorAll
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

  // ทำให้ลื่นขึ้นเมื่อมีลิฟต์จำนวนมาก
  const deferredLiftIds = useDeferredValue(filteredLiftIds);

  const shouldShowOrgDropdown = canSeeOrgDropdown(role) && orgOptions.length > 0;

  /** ---------- UI States ---------- */
  if (connectionStatus === "disconnected" || connectionStatus === "connecting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-slate-300 border-t-blue-600 mx-auto mb-4" />
              <p className="text-base sm:text-lg text-slate-600">กำลังเตรียมข้อมูล...</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">สถานะ: {connectionStatus}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (connectionStatus === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-rose-600 mb-4">
                <WifiOff className="w-10 h-10 sm:w-12 sm:h-12 mx-auto" />
              </div>
              <p className="text-base sm:text-lg text-slate-600">ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 sm:mt-4 px-4 py-2 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:opacity-95 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                ลองใหม่
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!elevatorStates || deferredLiftIds.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-base sm:text-lg text-slate-600">ไม่พบข้อมูลลิฟต์</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              {role === "user"
                ? "ไม่พบข้อมูลลิฟต์สำหรับองค์กรของคุณ"
                : "กรุณาตรวจสอบการเชื่อมต่อกับเซิร์ฟเวอร์หรือเลือกองค์กรอื่น"}
            </p>

            {shouldShowOrgDropdown && (
              <div className="mt-4">
                <div
                  className="relative"
                  onMouseEnter={openDropdown}
                  onMouseLeave={closeDropdown}
                >
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen((v) => !v)} // mobile click
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-sm sm:text-base text-slate-800 shadow ring-1 ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                      className="absolute z-20 mt-2 min-w-[12rem] rounded-xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden"
                      role="listbox"
                    >
                      <div className="py-1">
                        {orgOptions.map((org) => (
                          <div
                            key={org.id}
                            onClick={() => {
                              handleOrgChange(org.id);
                              setIsDropdownOpen(false);
                              if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
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

  /** ---------- Main ---------- */
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200 text-slate-800 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 sm:py-0 bg-gradient-to-b from-white/80 to-white/0 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-xl bg-white/80 backdrop-blur shadow ring-1 ring-slate-200">
                <MonitorIcon className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
              </div>
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                หน้าที่ 2: Overview
                {shouldShowOrgDropdown && (
                  <div
                    className="relative"
                    onMouseEnter={openDropdown}
                    onMouseLeave={closeDropdown}
                  >
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen((v) => !v)} // mobile click
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/80 text-sm sm:text-base text-slate-800 shadow ring-1 ring-slate-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                      aria-expanded={isDropdownOpen}
                      aria-haspopup="listbox"
                      title="เลือกองค์กร"
                    >
                      <Building className="w-4 h-4 text-slate-500" />
                      <span className="max-w-[42vw] sm:max-w-none truncate">{currentOrgLabel}</span>
                      <ChevronDown className="w-4 h-4 -mr-0.5 text-slate-500" />
                    </button>
                    {isDropdownOpen && (
                      <div
                        className="absolute z-20 mt-2 min-w-[12rem] rounded-xl bg-white/95 backdrop-blur shadow-2xl ring-1 ring-slate-200 overflow-hidden"
                        role="listbox"
                      >
                        <div className="py-1">
                          {orgOptions.map((org) => (
                            <div
                              key={org.id}
                              onClick={() => {
                                handleOrgChange(org.id);
                                setIsDropdownOpen(false);
                                if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
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

            <div className="flex gap-2 sm:gap-3 items-center">
              <Link
                to={`/monitor${shouldShowOrgDropdown && orgToUse ? `?org=${orgToUse}` : ""}`}
                className="px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Monitor
              </Link>
            </div>
          </div>
        </div>

        {/* Elevators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-10">
          {deferredLiftIds.map((id) => {
            const st = elevatorStates[id];

            const online = (() => {
              const v = st?.connection;
              if (typeof v === "boolean") return v;
              if (typeof v === "string") return v.toLowerCase() === "online";
              return false;
            })();

            // นำทางเมื่อคลิกพื้นที่การ์ดที่ไม่ใช่แผงควบคุม
            const goDetail = () => navigate(`/lifts/${id}`);
            const onKeyNav = (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                goDetail();
              }
            };

            return (
              <article
                key={id}
                role="button"
                tabIndex={0}
                onClick={goDetail}
                onKeyDown={onKeyNav}
                className={[
                  "group block rounded-2xl p-4 sm:p-6 border bg-white/90 backdrop-blur",
                  "shadow-[0_8px_24px_-10px_rgba(2,6,23,0.18)] sm:shadow-[0_12px_30px_-12px_rgba(2,6,23,0.25)]",
                  "active:scale-[0.99] sm:hover:shadow-[0_16px_40px_-10px_rgba(2,6,23,0.35)] sm:hover:-translate-y-0.5 transition-all",
                  "focus:outline-none focus:ring-2",
                  cardStatusClasses(online),
                ].join(" ")}
              >
                {/* Title & Status Row */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-base sm:text-lg font-bold text-blue-700 truncate">
                    {st?.lift_name ?? id}
                  </span>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {online ? (
                      <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                    ) : (
                      <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600" />
                    )}
                    <div
                      className={`inline-block px-2 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ring-1 ${getStatusBg(
                        st?.status
                      )}`}
                    >
                      <span className={getStatusColor(st?.status)}>
                        {st?.status ?? "NORMAL"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content: มือถือแนวตั้ง/เดสก์ท็อป 2 คอลัมน์ */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 items-stretch sm:items-start overflow-hidden">
                  {/* Shaft */}
                  <div className="w-full sm:w-[200px]">
                    <div className="rounded-lg group-hover:ring-1 group-hover:ring-blue-300/60 transition">
                      <ElevatorShaft st={st} className="w-full max-w-[320px] mx-auto" />
                    </div>
                  </div>

                  {/* Control Panel */}
                  <div className="flex-1 min-w-0">
                    <div className="rounded-xl ring-1 ring-slate-200 bg-white/70">
                      {/* Mobile: collapsible */}
                      <details
                        className="sm:hidden open:pb-2"
                        onClickCapture={(e) => e.stopPropagation()}
                        onMouseDownCapture={(e) => e.stopPropagation()}
                        onKeyDownCapture={(e) => e.stopPropagation()}
                      >
                        <summary className="cursor-pointer list-none select-none px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-t-xl">
                          แผงควบคุม
                          <span className="text-slate-400"> (แตะเพื่อเปิด/ปิด)</span>
                        </summary>
                        <div
                          className="p-2"
                          onClickCapture={(e) => e.stopPropagation()}
                          onMouseDownCapture={(e) => e.stopPropagation()}
                          onKeyDownCapture={(e) => e.stopPropagation()}
                        >
                          <ElevatorControlPanel
                            st={st}
                            onSelectFloor={(floor) => {
                              handleSelectFloor?.(floor, st);
                            }}
                          />
                        </div>
                      </details>

                      {/* Desktop: แสดงตลอด */}
                      <div
                        className="hidden sm:block p-2"
                        onClickCapture={(e) => e.stopPropagation()}
                        onMouseDownCapture={(e) => e.stopPropagation()}
                        onKeyDownCapture={(e) => e.stopPropagation()}
                      >
                        <ElevatorControlPanel
                          st={st}
                          onSelectFloor={(floor) => {
                            handleSelectFloor?.(floor, st);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer link แยกชัดเจน */}
                <div className="mt-3 text-right">
                  <Link
                    to={`/lifts/${id}`}
                    className="text-sm text-blue-700 group-hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ดูรายละเอียด →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <div className="text-center text-slate-500 text-[11px] sm:text-xs mt-10">
          ระบบควบคุมลิฟต์อัจฉริยะ © 2025
        </div>
      </div>
    </div>
  );
}
