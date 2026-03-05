import { apiFetch } from "./api.js";

export const getLeaveRequests = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.userId) qs.set("userId", params.userId);
  if (params.status) qs.set("status", params.status);
  if (params.year)   qs.set("year",   params.year);
  const q = qs.toString();
  return apiFetch(`/api/leave${q ? `?${q}` : ""}`);
};

export const createLeaveRequest = (data) =>
  apiFetch("/api/leave", { method: "POST", body: data });

export const updateLeaveRequest = (id, data) =>
  apiFetch(`/api/leave/${id}`, { method: "PATCH", body: data });

export const cancelLeaveRequest = (id) =>
  apiFetch(`/api/leave/${id}`, { method: "DELETE" });

export const reviewLeaveRequest = (id, { action, reviewNote } = {}) =>
  apiFetch(`/api/leave/${id}/review`, { method: "PATCH", body: { action, reviewNote } });

export const getLeaveBalances = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.userId) qs.set("userId", params.userId);
  if (params.year)   qs.set("year",   params.year);
  const q = qs.toString();
  return apiFetch(`/api/leave/balances${q ? `?${q}` : ""}`);
};

export const updateLeaveBalance = (data) =>
  apiFetch("/api/leave/balances", { method: "PATCH", body: data });
