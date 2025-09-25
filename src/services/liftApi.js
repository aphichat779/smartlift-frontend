import { apiService } from './api';

// ฟังก์ชันสำหรับดึงสถานะลิฟต์จาก API
export const fetchElevatorStatus = async (liftId) => {
  try {
    // ใช้ request() ของ apiService โดยระบุ endpoint ที่ถูกต้อง
    const data = await apiService.request(`/endpoints/get_status_db.php?lift_id=${liftId}`);
    return data;
  } catch (error) {
    console.error(`Failed to fetch status for lift ${liftId}:`, error);
    return null;
  }
};

// ฟังก์ชันสำหรับดึงคำสั่งเรียกจาก API
export const fetchPendingCalls = async (liftId) => {
  try {
    const data = await apiService.request(`/endpoints/get_call.php?lift_id=${liftId}`);
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
    const data = await apiService.request(`/endpoints/set_status_db.php?lift_id=${liftId}&${query}`);
    console.log(`Command for lift ${liftId} sent successfully:`, data);
  } catch (error) {
    console.error(`Error sending command for lift ${liftId}:`, error);
  }
};