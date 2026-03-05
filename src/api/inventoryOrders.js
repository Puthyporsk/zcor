import { apiFetch } from "./api.js";

export const getInventoryOrders = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.orderType)   qs.set("orderType",   params.orderType);
  if (params.startDate)   qs.set("startDate",   params.startDate);
  if (params.endDate)     qs.set("endDate",     params.endDate);
  if (params.relatedUser) qs.set("relatedUser", params.relatedUser);
  const q = qs.toString();
  return apiFetch(`/api/inventory-orders${q ? `?${q}` : ""}`);
};

export const getInventoryOrder = (id) =>
  apiFetch(`/api/inventory-orders/${id}`);

export const createInventoryOrder = (data) =>
  apiFetch("/api/inventory-orders", { method: "POST", body: data });

export const deleteInventoryOrder = (id) =>
  apiFetch(`/api/inventory-orders/${id}`, { method: "DELETE" });

export const getOrdersByItem = (itemId) =>
  apiFetch(`/api/inventory-orders/by-item/${itemId}`);
