// src/context/ElevatorContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { lifts, tasks } from "@/data/mock";
import {
  decodeLiftState, parseFloorLabels, getLevelsCount, getFloorIndices,
  getFloorLabel, clamp, getOrgName, getBuildingName
} from "@/utils/elevator";

const ElevatorCtx = createContext(null);
export const useElevators = () => useContext(ElevatorCtx);

function buildInitialStateFromLifts() {
  const obj = {};
  for (const l of lifts) {
    const floorLabels = parseFloorLabels(l.floor_name);
    const levels = floorLabels.length || l.max_level || 1;
    const decoded = decodeLiftState(l.lift_state);

    obj[l.id] = {
      id: l.id,
      lift_name: l.lift_name,
      org_id: l.org_id,
      building_id: l.building_id,
      org_name: getOrgName(l.org_id),
      building_name: getBuildingName(l.building_id),
      mac_address: l.mac_address,
      floorLabels,
      max_level: l.max_level,

      door: decoded.doorOpen ? "OPEN" : "CLOSED",
      mode: decoded.maintenance ? "MANUAL" : "AUTO",
      connection: decoded.outOfService ? "OFFLINE" : "ONLINE",
      currentFloor: 1,
      targetFloor: 1,
      status: "พร้อมใช้งาน",
      moving: !!decoded.moving,
      direction: null,
      doorAnimating: false,
      floorPosition: 1,
      selectedFloor: 1,
      flags: decoded,
      _levelsCached: levels,
    };
  }
  return obj;
}

export const ElevatorProvider = ({ children }) => {
  const [elevatorStates, setElevatorStates] = useState(buildInitialStateFromLifts());
  const [orgFilter, setOrgFilter] = useState("ALL");
  const [buildingFilter, setBuildingFilter] = useState("ALL");

  const filteredLiftIds = useMemo(() => {
    const ids = Object.keys(elevatorStates).map(Number);
    return ids.filter((id) => {
      const s = elevatorStates[id];
      const passOrg = orgFilter === "ALL" || s.org_id === Number(orgFilter);
      const passBld = buildingFilter === "ALL" || s.building_id === Number(buildingFilter);
      return passOrg && passBld;
    });
  }, [elevatorStates, orgFilter, buildingFilter]);

  // Simulator loop
  useEffect(() => {
    const interval = setInterval(() => {
      setElevatorStates((prev) => {
        const newStates = { ...prev };
        Object.values(newStates).forEach((st) => {
          const levels = getLevelsCount(st);
          if (st.mode === "AUTO" && st.connection === "ONLINE") {
            if (st.currentFloor !== st.targetFloor && !st.moving && st.door === "CLOSED") {
              st.moving = true;
              st.direction = st.currentFloor < st.targetFloor ? "UP" : "DOWN";
              st.status = "กำลังเลื่อน";
            }

            if (st.moving) {
              const moveSpeed = 0.05;
              const tolerance = 0.001;

              if (st.direction === "UP") {
                if (st.floorPosition >= st.targetFloor - tolerance) {
                  st.moving = false; st.direction = null; st.status = "มาถึงแล้ว";
                  st.floorPosition = st.targetFloor; st.currentFloor = st.targetFloor;
                } else {
                  const newPos = st.floorPosition + moveSpeed;
                  st.floorPosition = clamp(newPos, 1, levels);
                  st.currentFloor = clamp(Math.round(st.floorPosition), 1, levels);
                }
              } else if (st.direction === "DOWN") {
                if (st.floorPosition <= st.targetFloor + tolerance) {
                  st.moving = false; st.direction = null; st.status = "มาถึงแล้ว";
                  st.floorPosition = st.targetFloor; st.currentFloor = st.targetFloor;
                } else {
                  const newPos = st.floorPosition - moveSpeed;
                  st.floorPosition = clamp(newPos, 1, levels);
                  st.currentFloor = clamp(Math.round(st.floorPosition), 1, levels);
                }
              }

              if (!st.moving) {
                setTimeout(() => {
                  setElevatorStates((curr) => ({
                    ...curr, [st.id]: { ...curr[st.id], door: "OPEN", doorAnimating: true, status: "กำลังขึ้นลง" },
                  }));
                  setTimeout(() => {
                    setElevatorStates((curr) => ({
                      ...curr, [st.id]: { ...curr[st.id], door: "CLOSED", doorAnimating: false, status: "พร้อมใช้งาน" },
                    }));
                  }, 3000);
                }, 500);
              }
            }
          }
        });
        return newStates;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Random online/offline
  useEffect(() => {
    const ids = Object.keys(elevatorStates);
    const t = setInterval(() => {
      const pick = ids[Math.floor(Math.random() * ids.length)];
      setElevatorStates((prev) => {
        const curr = prev[pick];
        const toggle = Math.random() > 0.85
          ? (curr.connection === "ONLINE" ? "OFFLINE" : "ONLINE")
          : curr.connection;
        return { ...prev, [pick]: { ...curr, connection: toggle } };
      });
    }, 8000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line

  // Actions
  const handleFloorSelect = (id, idx) => {
    const levels = getLevelsCount(elevatorStates[id]);
    const safeIdx = clamp(idx, 1, levels);
    setElevatorStates((prev) => ({ ...prev, [id]: { ...prev[id], selectedFloor: safeIdx } }));
  };

  const handleSendElevator = (id) => {
    setElevatorStates((prev) => {
      const st = prev[id];
      const levels = getLevelsCount(st);
      const safeTarget = clamp(st.selectedFloor, 1, levels);
      if (st.connection === "ONLINE" && st.mode === "AUTO" && !st.moving) {
        return { ...prev, [id]: { ...st, targetFloor: safeTarget, status: "ถูกเรียก" } };
      }
      return prev;
    });
  };

  const handleDoorControl = (id) => {
    setElevatorStates((prev) => {
      const st = prev[id];
      if (st.connection === "ONLINE" && !st.moving) {
        const newDoor = st.door === "CLOSED" ? "OPEN" : "CLOSED";
        return { ...prev, [id]: { ...st, door: newDoor, doorAnimating: true } };
      }
      return prev;
    });
    setTimeout(() => {
      setElevatorStates((curr) => ({ ...curr, [id]: { ...curr[id], doorAnimating: false } }));
    }, 1000);
  };

  const handleModeControl = (id) => {
    setElevatorStates((prev) => {
      const st = prev[id];
      if (st.connection !== "ONLINE") return prev;
      const newMode = st.mode === "AUTO" ? "MANUAL" : "AUTO";
      return { ...prev, [id]: { ...st, mode: newMode, status: newMode === "AUTO" ? "โหมดอัตโนมัติ" : "โหมดแมนนวล" } };
    });
  };

  const value = {
    elevatorStates, setElevatorStates,
    orgFilter, setOrgFilter, buildingFilter, setBuildingFilter,
    filteredLiftIds,
    handleFloorSelect, handleSendElevator, handleDoorControl, handleModeControl,
    tasks
  };

  return <ElevatorCtx.Provider value={value}>{children}</ElevatorCtx.Provider>;
};
