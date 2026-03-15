export const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

export async function apiFetch(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { message: text };
  }

  if (!res.ok) {
    const msg = payload?.message || payload?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return payload;
}
