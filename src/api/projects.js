import { apiFetch } from "./api.js";

export const getProjects = () => apiFetch("/api/projects");

export const createProject = (data) =>
  apiFetch("/api/projects", { method: "POST", body: data });

export const updateProject = (id, data) =>
  apiFetch(`/api/projects/${id}`, { method: "PATCH", body: data });

export const deleteProject = (id) =>
  apiFetch(`/api/projects/${id}`, { method: "DELETE" });
