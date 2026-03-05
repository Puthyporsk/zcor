import { apiFetch } from "./api.js";

export const getInventory = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.type)     qs.set("type",     params.type);
  if (params.category) qs.set("category", params.category);
  const q = qs.toString();
  return apiFetch(`/api/inventory${q ? `?${q}` : ""}`);
};

export const createInventoryItem = (data) =>
  apiFetch("/api/inventory", { method: "POST", body: data });

export const updateInventoryItem = (id, data) =>
  apiFetch(`/api/inventory/${id}`, { method: "PATCH", body: data });

export const deleteInventoryItem = (id) =>
  apiFetch(`/api/inventory/${id}`, { method: "DELETE" });

export const assignItem = (id, userId) =>
  apiFetch(`/api/inventory/${id}/assign`, { method: "PATCH", body: { userId } });

export const unassignItem = (id) =>
  apiFetch(`/api/inventory/${id}/unassign`, { method: "PATCH" });
