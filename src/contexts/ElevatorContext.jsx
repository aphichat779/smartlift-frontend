// src/contexts/ElevatorContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  decodeLiftState, parseFloorLabels, clamp
} from "@/utils/liftUtils";

const ElevatorCtx = createContext(null);
export const useElevators = () => useContext(ElevatorCtx);

export const ElevatorProvider = ({ children }) => {
  const [elevatorStates, setElevatorStates] = useState(null);
  const [orgFilter, setOrgFilter] = useState("ALL");
  const [buildingFilter, setBuildingFilter] = useState("ALL");
  const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

  // --- 1. ดึงข้อมูลจาก API จริง ---
  useEffect(() => {
    const fetchElevatorStates = async () => {
      try {
        const response = await fetch(`${API_URL}/api/lifts/get_lift_status.php`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        const newStateMap = data.reduce((acc, l) => {
          const floorLabels = l.floor_name ? parseFloorLabels(l.floor_name) : [];
          const levels = floorLabels.length || l.max_level || 1;
          const decoded = l.lift_state ? decodeLiftState(l.lift_state) : {};

          acc[l.id] = {
            id: l.id,
            lift_name: l.lift_name,
            org_id: l.org_id,
            building_id: l.building_id,
            org_name: l.org_name, 
            building_name: l.building_name,
            mac_address: l.mac_address,
            floorLabels,
            max_level: l.max_level,
            
            // ข้อมูลที่อิงจากตาราง lifts ในฐานข้อมูลของคุณโดยตรง
            lift_state: l.lift_state,
            up_status: l.up_status,
            down_status: l.down_status,
            car_status: l.car_status,
            
            // กำหนดค่าเริ่มต้นสำหรับ props ที่ไม่มีใน DB เพื่อไม่ให้เกิด error
            door: "closed",
            mode: "manual",
            connection: "online",
            currentFloor: 1,
            targetFloor: 1,
            status: "normal",
            moving: "stopped",
            direction: "none",
            
            // props อื่นๆ ที่ไม่เกี่ยวข้องกับฐานข้อมูล
            doorAnimating: false,
            floorPosition: 1, // กำหนดค่าเริ่มต้น
            selectedFloor: null, // กำหนดค่าเริ่มต้น
            flags: decoded,
            _levelsCached: levels,
          };
          return acc;
        }, {});

        setElevatorStates(newStateMap);
      } catch (error) {
        console.error('Failed to fetch elevator states:', error);
      }
    };

    fetchElevatorStates();
    const intervalId = setInterval(fetchElevatorStates, 3000); 

    return () => clearInterval(intervalId);
  }, [API_URL]);

  const filteredLiftIds = useMemo(() => {
    if (!elevatorStates) return [];
    const ids = Object.keys(elevatorStates).map(Number);
    return ids.filter((id) => {
      const s = elevatorStates[id];
      const passOrg = orgFilter === "ALL" || s.org_id === Number(orgFilter);
      const passBld = buildingFilter === "ALL" || s.building_id === Number(buildingFilter);
      return passOrg && passBld;
    });
  }, [elevatorStates, orgFilter, buildingFilter]);

  const handleFloorSelect = async (id, idx) => {
    try {
      const response = await fetch(`${API_URL}/api/lifts/ccall_lift.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lift_id: id,
          floor_no: idx,
          client_id: 'web-user',
          created_user_id: 1,
        }),
      });
      const data = await response.json();
      if (data.success) {
        console.log(`Command to lift ${id} for floor ${idx} sent successfully.`);
        setElevatorStates((prev) => ({
          ...prev,
          [id]: { ...prev[id], selectedFloor: idx, targetFloor: idx },
        }));
      } else {
        console.error('Failed to send command:', data.error);
      }
    } catch (error) {
      console.error('Error sending command:', error);
    }
  };

  const value = {
    elevatorStates, setElevatorStates,
    orgFilter, setOrgFilter, buildingFilter, setBuildingFilter,
    filteredLiftIds,
    handleFloorSelect,
  };

  return <ElevatorCtx.Provider value={value}>{children}</ElevatorCtx.Provider>;
};