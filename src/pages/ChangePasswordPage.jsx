import React from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";

import ArrowBackIosNew from "@mui/icons-material/ArrowBackIosNew";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { useAuth } from "../context/AuthContext";
import { changePassword } from "../api/user.js";
import ZcorPill from "../components/ZcorPill";
import ZcorAllRightsReserved from "../components/ZcorAllRightsReserved";

const BG = "#CFF7E3";
const DARK = "#214318";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [serverError, setServerError] = React.useState("");

  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  const onSubmit = async (data) => {
    setServerError("");

    try {
      const response = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      reset(); // clear form
      navigate("/settings");
    } catch (err) {
      setServerError(err?.message || "Change password failed.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        background: BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 6,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 560, textAlign: "center" }}>
        <Box sx={{ mb: 3 }}>
          <ZcorPill disabled onClick={() => navigate("/")} />
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2.5,
            border: "1px solid rgba(15,27,16,.10)",
            boxShadow: "0 18px 55px rgba(15,27,16,.16)",
            px: { xs: 3, sm: 6 },
            py: { xs: 3, sm: 4 },
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Change your password
          </Typography>

          <Typography sx={{ mt: 0.8, color: "rgba(15,27,16,.62)", fontSize: 13 }}>
            {user?.email ? `Signed in as ${user.email}` : "Enter your current password and a new one."}
          </Typography>

          {serverError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {serverError}
            </Alert>
          ) : null}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3, textAlign: "left" }}>
            <Stack spacing={2.2}>
              {/* Current Password */}
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 0.6 }}>
                  Current Password
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Enter current password"
                  type={showCurrent ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("currentPassword", {
                    required: "Current password is required",
                  })}
                  error={!!errors.currentPassword}
                  helperText={errors.currentPassword?.message || " "}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showCurrent ? "Hide password" : "Show password"}
                          onClick={() => setShowCurrent((s) => !s)}
                          edge="end"
                          size="small"
                        >
                          {showCurrent ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* New Password */}
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 0.6 }}>
                  New Password
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Enter new password"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  {...register("newPassword", {
                    required: "New password is required",
                    minLength: { value: 8, message: "Must be at least 8 characters" },
                  })}
                  error={!!errors.newPassword}
                  helperText={errors.newPassword?.message || " "}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showNew ? "Hide password" : "Show password"}
                          onClick={() => setShowNew((s) => !s)}
                          edge="end"
                          size="small"
                        >
                          {showNew ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Typography sx={{ mt: 0.2, fontSize: 12, color: "rgba(15,27,16,.60)" }}>
                  Must be at least 8 characters
                </Typography>
              </Box>

              {/* Confirm New Password */}
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 0.6 }}>
                  Reenter New Password
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Confirm new password"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  {...register("confirmPassword", {
                    required: "Please confirm your new password",
                    validate: (v) => v === newPassword || "Passwords do not match",
                  })}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message || " "}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showConfirm ? "Hide password" : "Show password"}
                          onClick={() => setShowConfirm((s) => !s)}
                          edge="end"
                          size="small"
                        >
                          {showConfirm ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                sx={{
                  bgcolor: DARK,
                  borderRadius: 1.5,
                  py: 1.2,
                  fontWeight: 900,
                  "&:hover": { bgcolor: "#183312" },
                }}
              >
                Change password
              </Button>

              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Link
                  component={RouterLink}
                  to="/settings"
                  underline="none"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    color: "rgba(15,27,16,.85)",
                    fontWeight: 800,
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  <ArrowBackIosNew sx={{ fontSize: 14 }} />
                  Back to settings
                </Link>
              </Box>
            </Stack>
          </Box>
        </Paper>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <ZcorAllRightsReserved />
        </Box>
      </Box>
    </Box>
  );
}
