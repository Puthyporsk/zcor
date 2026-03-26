import { apiFetch } from "./api.js";

export const getActiveSession = () =>
  apiFetch("/api/clock/active");

export const clockIn = (data) =>
  apiFetch("/api/clock/in", { method: "POST", body: data });

export const clockOut = (data) =>
  apiFetch("/api/clock/out", { method: "PATCH", body: data });

export const resolveSession = (data) =>
  apiFetch("/api/clock/resolve", { method: "PATCH", body: data });

export const discardSession = () =>
  apiFetch("/api/clock/discard", { method: "DELETE" });
