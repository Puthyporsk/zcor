import { apiFetch } from "./api.js";

export const getShifts = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.from)   qs.set("from",   params.from);
  if (params.to)     qs.set("to",     params.to);
  if (params.userId) qs.set("userId", params.userId);
  if (params.taskId) qs.set("taskId", params.taskId);
  const q = qs.toString();
  return apiFetch(`/api/shifts${q ? `?${q}` : ""}`);
};

export const createShift = (data) =>
  apiFetch("/api/shifts", { method: "POST", body: data });

export const updateShift = (id, data) =>
  apiFetch(`/api/shifts/${id}`, { method: "PATCH", body: data });

export const deleteShift = (id) =>
  apiFetch(`/api/shifts/${id}`, { method: "DELETE" });
