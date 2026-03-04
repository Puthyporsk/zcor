import { apiFetch } from "./api.js";

export const getTasks = () => apiFetch("/api/tasks");

export const createTask = (data) =>
  apiFetch("/api/tasks", { method: "POST", body: data });

export const updateTask = (id, data) =>
  apiFetch(`/api/tasks/${id}`, { method: "PATCH", body: data });

export const deleteTask = (id) =>
  apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
