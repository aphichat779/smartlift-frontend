// src/contexts/ElevatorContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { startRealtimeSSE, sendLiftCommand } from '../services/liftApi';

import {
  getCurrentLevel,
  checkDoorText,
  checkWorkingStatus,
  checkSpeed,
  checkError,
  checkDirection,
} from '../utils/legacyLiftParser';

const ElevatorContext = createContext(null);

// แปลงลิฟต์ 1 ตัว → รูปแบบพร้อมใช้ใน UI
function toUiLift(lift) {
  const hex = lift.lift_state_hex;
  const doorText = checkDoorText(hex);
  return {
    ...lift,
    floorPosition: getCurrentLevel(hex),
    moving: checkSpeed(hex) > 0.05,
    direction: checkDirection(hex),
    door: doorText === 'Opened' ? 'OPEN' : 'CLOSED',
    doorAnimating: doorText === 'Opening' || doorText === 'Closing',
    status: checkError(hex) > 0 ? 'FAULT' : 'NORMAL',
    mode: checkWorkingStatus(hex),
  };
}

export function ElevatorProvider({ children }) {
  const [elevatorStates, setElevatorStates] = useState({}); // { [id]: uiLift }
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // สำหรับรวม diff หลายชิ้นในกรอบเวลาเดียวกัน (batch)
  const pendingRef = useRef({});
  const batchTimerRef = useRef(null);
  const lastRenderRef = useRef(0);

  const BATCH_WINDOW_MS = 80;    // รวม diff ภายใน 80ms
  const RENDER_MIN_GAP_MS = 120; // throttle render อย่างน้อย 120ms

  const scheduleApply = () => {
    if (batchTimerRef.current) return;
    batchTimerRef.current = setTimeout(() => {
      const now = performance.now();
      const doRender = () => {
        setElevatorStates((prev) => ({ ...prev, ...pendingRef.current }));
        pendingRef.current = {};
        lastRenderRef.current = performance.now();
      };
      if (now - lastRenderRef.current >= RENDER_MIN_GAP_MS) {
        doRender();
      } else {
        setTimeout(doRender, RENDER_MIN_GAP_MS - (now - lastRenderRef.current));
      }
      batchTimerRef.current = null;
    }, BATCH_WINDOW_MS);
  };

  useEffect(() => {
    const stopSSE = startRealtimeSSE({
      // ถ้าจะกรองบางตัว: id: '1' หรือ ids: ['1','5','10']
      onStatusChange: (s) => setConnectionStatus(s),

      // รับ snapshot ครั้งแรก
      onSnapshot: (payload) => {
        try {
          const src = payload?.lifts || {};
          const next = {};
          for (const lift of Object.values(src)) {
            try { next[lift.id] = toUiLift(lift); } catch (_) {}
          }
          pendingRef.current = {};
          setElevatorStates(next);
          lastRenderRef.current = performance.now();
        } catch (e) {
          console.error('Context: snapshot handling error', e);
        }
      },

      // รับ diff-only ถัด ๆ มา
      onDiff: (payload) => {
        try {
          const src = payload?.lifts || {};
          for (const lift of Object.values(src)) {
            try { pendingRef.current[lift.id] = toUiLift(lift); } catch (_) {}
          }
          scheduleApply();
        } catch (e) {
          console.error('Context: diff handling error', e);
        }
      },
    });

    return () => {
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
      pendingRef.current = {};
      stopSSE();
    };
  }, []);

  const handleSelectFloor = async (liftId, floorIndex) => {
    try {
      await sendLiftCommand({ liftId, targetFloor: floorIndex });
    } catch (error) {
      console.error('Context: Error sending floor command.', error);
    }
  };

  const value = { elevatorStates, connectionStatus, handleSelectFloor };
  return <ElevatorContext.Provider value={value}>{children}</ElevatorContext.Provider>;
}

export const useElevators = () => {
  const ctx = useContext(ElevatorContext);
  if (!ctx) throw new Error('useElevators must be used within an ElevatorProvider');
  return ctx;
};
