import { apiFetch } from "./api.js";

export const getUsers = () => apiFetch("/api/user");

export const updateMe = ({ phone } = {}) =>
  apiFetch("/api/user/me", { method: "PATCH", body: { phone } });

export const uploadAvatar = ({ base64, contentType } = {}) =>
  apiFetch("/api/user/me/avatar", { method: "PATCH", body: { base64, contentType } });

export const changePassword = ({ currentPassword, newPassword } = {}) =>
  apiFetch("/api/user/me/change-password", { method: "POST", body: { currentPassword, newPassword } });

export const inviteUser = ({ firstName, lastName, email } = {}) =>
  apiFetch("/api/user", { method: "POST", body: { firstName, lastName, email } });

export const updateUserRole = (id, role) =>
  apiFetch(`/api/user/${id}/role`, { method: "PATCH", body: { role } });
