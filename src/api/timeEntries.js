import { apiFetch } from "./api.js";

export const getTimeEntries = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.userId) qs.set("userId", params.userId);
  if (params.from)   qs.set("from",   params.from);
  if (params.to)     qs.set("to",     params.to);
  if (params.status) qs.set("status", params.status);
  const q = qs.toString();
  return apiFetch(`/api/time-entries${q ? `?${q}` : ""}`);
};

export const createTimeEntry = (data) =>
  apiFetch("/api/time-entries", { method: "POST", body: data });

export const updateTimeEntry = (id, data) =>
  apiFetch(`/api/time-entries/${id}`, { method: "PATCH", body: data });

export const deleteTimeEntry = (id) =>
  apiFetch(`/api/time-entries/${id}`, { method: "DELETE" });

export const submitTimeEntry = (id) =>
  apiFetch(`/api/time-entries/${id}/submit`, { method: "PATCH" });

export const reviewTimeEntry = (id, { action, reviewNote } = {}) =>
  apiFetch(`/api/time-entries/${id}/review`, { method: "PATCH", body: { action, reviewNote } });
