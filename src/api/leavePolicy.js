import { apiFetch } from "./api.js";

export const getLeavePolicy = () =>
  apiFetch("/api/leave-policy");

export const updateLeavePolicy = (data) =>
  apiFetch("/api/leave-policy", { method: "PUT", body: data });

export const runCarryover = (fromYear) =>
  apiFetch("/api/leave-policy/carryover", { method: "POST", body: { fromYear } });

export const getAccrualSummary = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.employeeId) qs.set("employeeId", params.employeeId);
  if (params.year)       qs.set("year",       params.year);
  const q = qs.toString();
  return apiFetch(`/api/leave-policy/accrual-summary${q ? `?${q}` : ""}`);
};

export const getTerminationPayout = (employeeId) =>
  apiFetch(`/api/leave-policy/termination-payout/${employeeId}`);
