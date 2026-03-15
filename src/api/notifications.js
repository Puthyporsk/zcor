import { apiFetch } from "./api";

export function getNotifications({ unreadOnly = false, limit = 20, skip = 0 } = {}) {
  const params = new URLSearchParams();
  if (unreadOnly) params.set("unreadOnly", "true");
  if (limit) params.set("limit", String(limit));
  if (skip) params.set("skip", String(skip));
  return apiFetch(`/api/notifications?${params}`);
}

export function getUnreadCount() {
  return apiFetch("/api/notifications/unread-count");
}

export function markAsRead(id) {
  return apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllAsRead() {
  return apiFetch("/api/notifications/read-all", { method: "PATCH" });
}

export function deleteNotification(id) {
  return apiFetch(`/api/notifications/${id}`, { method: "DELETE" });
}

export function deleteAllNotifications() {
  return apiFetch("/api/notifications", { method: "DELETE" });
}
