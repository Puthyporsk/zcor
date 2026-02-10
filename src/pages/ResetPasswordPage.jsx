import React from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";

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
import ZcorPill from "../components/ZcorPill";

const BG = "#CFF7E3";
const DARK = "#214318";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();

  const token = searchParams.get("token") || "";
  const [serverError, setServerError] = React.useState("");
  const [serverSuccess, setServerSuccess] = React.useState("");

  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = watch("password");

  const onSubmit = async (data) => {
    setServerError("");
    setServerSuccess("");

    if (!token) {
      setServerError("Invalid or missing reset token. Please request a new reset link.");
      return;
    }

    try {
      const res = await resetPassword({
        token,
        newPassword: data.password,
      });

      setServerSuccess(res?.message || "Password updated successfully. You can now log in.");
    } catch (err) {
      setServerError(err?.message || "Password reset failed.");
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
          <ZcorPill disabled={true} onClick={() => navigate("/")} />
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
            Reset your password
          </Typography>
          <Typography sx={{ mt: 0.8, color: "rgba(15,27,16,.62)", fontSize: 13 }}>
            Enter your new password below
          </Typography>

          {!token ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This reset link looks invalid or is missing a token. Please request a new one.
            </Alert>
          ) : null}

          {serverError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {serverError}
            </Alert>
          ) : null}

          {serverSuccess ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              {serverSuccess}{" "}
              <Link
                component={RouterLink}
                to="/login"
                underline="hover"
                sx={{ fontWeight: 900, color: "inherit" }}
              >
                Go to login
              </Link>
            </Alert>
          ) : null}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3, textAlign: "left" }}>
            <Stack spacing={2.2}>
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
                  {...register("password", {
                    required: "New password is required",
                    minLength: {
                      value: 8,
                      message: "Must be at least 8 characters",
                    },
                  })}
                  error={!!errors.password}
                  helperText={errors.password?.message || " "}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showNew ? "Hide password" : "Show password"}
                          onClick={() => setShowNew((s) => !s)}
                          edge="end"
                          size="small"
                        >
                          {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Typography sx={{ mt: 0.2, fontSize: 12, color: "rgba(15,27,16,.60)" }}>
                  Must be at least 8 characters
                </Typography>
              </Box>

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
                    validate: (v) => v === password || "Passwords do not match",
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
                disabled={isSubmitting || !token}
                sx={{
                  bgcolor: DARK,
                  borderRadius: 1.5,
                  py: 1.2,
                  fontWeight: 900,
                  "&:hover": { bgcolor: "#183312" },
                }}
              >
                Reset password
              </Button>

              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Link
                  component={RouterLink}
                  to="/login"
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
                  Back to login
                </Link>
              </Box>
            </Stack>
          </Box>
        </Paper>

        {/* Footer */}
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography sx={{ fontSize: 11.5, color: "rgba(15,27,16,.50)" }}>
            © {new Date().getFullYear()} ZCOR. All rights reserved.
          </Typography>

          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            sx={{ mt: 0.8, color: "rgba(15,27,16,.55)" }}
          >
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => console.log("Terms")}
              sx={{ fontSize: 11.5, color: "inherit" }}
            >
              Terms
            </Link>
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => console.log("Privacy")}
              sx={{ fontSize: 11.5, color: "inherit" }}
            >
              Privacy
            </Link>
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => console.log("Help")}
              sx={{ fontSize: 11.5, color: "inherit" }}
            >
              Help
            </Link>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
