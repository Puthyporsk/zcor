import React from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import Toolbar from "@mui/material/Toolbar";
import { ThemeProvider } from "@mui/material/styles";
import { AuthProvider } from "./context/AuthContext";
import { zcorTheme } from "./theme/zcorTheme";
import ZcorHeader from "./components/ZcorHeader";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TimeEntryPage from "./pages/TimeEntry/TimeEntryPage";
import TimeReviewPage from "./pages/TimeEntry/TimeReviewPage";
import DashboardPage from "./pages/DashboardPage";
import AccountSettings from "./pages/AccountSettings";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import CalendarPage from "./pages/CalendarPage";

import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider theme={zcorTheme}>
            <CssBaseline />
              <ZcorHeader />

              {/* Spacer so content doesn't sit under the fixed AppBar */}
              <Toolbar />

              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/time-entry" element={<TimeEntryPage />} />
                  <Route path="/time-review" element={<TimeReviewPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/settings" element={<Outlet />}>
                    <Route index element={<AccountSettings />} />
                    <Route path="change-password" element={<ChangePasswordPage />} />
                  </Route>
                </Route>

                {/* Fallback route */}
                <Route path="*" element={<LandingPage />} />
              </Routes>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}