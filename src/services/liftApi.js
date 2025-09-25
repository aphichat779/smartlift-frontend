// src/services/liftApi.js

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost';

export const fetchElevatorStatus = async (liftId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/endpoints/get_status_db.php?lift_id=${liftId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch status for lift ${liftId}:`, error);
    return null;
  }
};

// ฟังก์ชันสำหรับดึงคำสั่งเรียกจาก API
export const fetchPendingCalls = async (liftId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/endpoints/get_call.php?lift_id=${liftId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data.cmd;
  } catch (error) {
    console.error(`Error fetching pending calls for lift ${liftId}:`, error);
    return [];
  }
};

// ฟังก์ชันสำหรับส่งคำสั่งควบคุมไปยัง API
export const sendElevatorCommand = async (liftId, params) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/api/endpoints/set_status_db.php?lift_id=${liftId}&${query}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log(`Command for lift ${liftId} sent successfully:`, data);
  } catch (error) {
    console.error(`Error sending command for lift ${liftId}:`, error);
  }
};