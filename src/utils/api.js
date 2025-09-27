// src/utils/api.js
export const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export async function getAllLifts() {
  const res = await fetch(`${API_BASE}/lifts`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch lifts");
  return res.json(); // { lifts: { [id]: state } }
}

export function openLiftSSE() {
  const url = `${API_BASE}/stream`;
  return new EventSource(url, { withCredentials: true });
}

export async function sendFloorCommand(liftId, floor) {
  const res = await fetch(`${API_BASE}/lifts/${liftId}/command/floor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ floor }),
  });
  if (!res.ok) throw new Error("Failed to send floor command");
  return res.json();
}

export async function toggleDoor(liftId, action /* 'open' | 'close' */) {
  const res = await fetch(`${API_BASE}/lifts/${liftId}/command/door`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error("Failed to toggle door");
  return res.json();
}
