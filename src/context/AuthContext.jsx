import React from "react";

const AuthContext = React.createContext(null);

// If using CRA proxy, keep API_BASE = "" and use "/api/..."
const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

async function apiFetch(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include", //send/receive HttpOnly cookies
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
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

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const isLoggedIn = Boolean(user);

  const refreshMe = React.useCallback(async () => {
    try {
      const data = await apiFetch("/api/auth/me");
      setUser(data?.user || null);
    } catch (e) {
      try { await apiFetch("/api/auth/logout", { method: "POST" }); } catch {}
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = React.useCallback(async ({ userId, password } = {}) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: { userId, password},
    });

    // backend returns { user } now
    setUser(data?.user || null);
    return data;
  }, []);

  const register = React.useCallback(
    async ({ firstName, lastName, email, password, businessName, displayName } = {}) => {
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        body: {
          businessName,
          firstName,
          lastName,
          displayName,
          email,
          password,
        },
      });

      try {
        await apiFetch("/api/auth/logout", { method: "POST" });
      } catch {
        // ignore
      }

      // Ensure app state reflects logged-out
      setUser(null);

      return data;
    },
    [],
  );

  const logout = React.useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  const forgotPassword = React.useCallback(async ({ email } = {}) => {
    const data = await apiFetch("/api/auth/forgot-password", {
      method: "POST",
      body: { email },
    });

    return data;
  }, []);

  const resetPassword = React.useCallback(async ({ token, newPassword } = {}) => {
    const data = await apiFetch("/api/auth/reset-password", {
      method: "POST",
      body: { token, newPassword },
    });

    return data;
  }, []);

  const value = React.useMemo(
    () => ({ user, isLoggedIn, loading, login, register, logout, forgotPassword, resetPassword, refreshMe }),
    [user, isLoggedIn, loading, login, register, logout, forgotPassword, resetPassword, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}
