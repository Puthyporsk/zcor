import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import TimeEntryPage from "./pages/TimeEntry/TimeEntryPage";
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

                <Route element={<ProtectedRoute />}>
                  <Route path="/time-entry" element={<TimeEntryPage />} />
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
