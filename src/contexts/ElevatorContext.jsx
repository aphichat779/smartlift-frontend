// src/contexts/ElevatorContext.jsx

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import { startRealtimeFromLatest, sendLiftCommand } from '../services/liftApi';



import {

  getCurrentLevel,

  checkDoorText,

  checkWorkingStatus,

  checkSpeed,

  checkError,

  checkDirection,

} from '../utils/legacyLiftParser';



const ElevatorContext = createContext(null);



export function ElevatorProvider({ children }) {

  const [elevatorStates, setElevatorStates] = useState({});

  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'error'

  const stopRef = useRef(null);



  useEffect(() => {

    setConnectionStatus('connecting');



    stopRef.current = startRealtimeFromLatest({

      intervalMs: 1500, // ปรับ 500–2000ms ตามต้องการ

      // id: '1',          // หรือ ids: ['1','2'] ถ้าจะกรอง

      onUpdate: (payload) => {

        try {

          const lifts = payload?.lifts || {};

          const next = {};

          for (const lift of Object.values(lifts)) {

            const hex = lift.lift_state_hex;

            const doorText = checkDoorText(hex);



            next[lift.id] = {

              ...lift,

              floorPosition: getCurrentLevel(hex),

              moving: checkSpeed(hex) > 0.05,

              direction: checkDirection(hex),

              door: doorText === 'Opened' ? 'OPEN' : 'CLOSED',

              doorAnimating: doorText === 'Opening' || doorText === 'Closing',

              status: checkError(hex) > 0 ? 'FAULT' : 'NORMAL',

              mode: checkWorkingStatus(hex),

              car_status_hex: lift.car_status_hex,

            };

          }

          setElevatorStates((prev) => ({ ...prev, ...next }));

          setConnectionStatus('connected');

        } catch (e) {

          console.error('parse error', e);

          setConnectionStatus('error');

        }

      },

    });



    return () => {

      stopRef.current?.();

    };

  }, []);



  const handleSelectFloor = async (liftId, floorIndex) => {

    try {

      await sendLiftCommand({ liftId, targetFloor: floorIndex });

    } catch (error) {

      console.error('Error sending command:', error);

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