import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Alert from "@mui/material/Alert";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { useAuth } from "../context/AuthContext";
import ZcorPill from "../components/ZcorPill";

const BG = "#CFF7E3";
const DARK = "#214318";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth(); // global auth
  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      userId: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    setServerError("");

    try {
      await login({
        userId: data.userId,
        password: data.password,
      });

      navigate("/dashboard");
    } catch (err) {
      // backend sends messages like "Invalid credentials" or "Multiple businesses..."
      setServerError(err?.message || "Login failed");
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
      <Box sx={{ width: "100%", maxWidth: 520, textAlign: "center" }}>
        <Box sx={{ mb: 3 }}>
          <ZcorPill disabled={true} onClick={() => navigate("/")} />
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2.5,
            border: "1px solid rgba(15,27,16,.10)",
            boxShadow: "0 18px 55px rgba(15,27,16,.16)",
            px: { xs: 3, sm: 5 },
            py: { xs: 3, sm: 4 },
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Welcome back
          </Typography>
          <Typography sx={{ mt: 0.6, color: "rgba(15,27,16,.62)", fontSize: 13 }}>
            Enter your credentials to access your account
          </Typography>

          {serverError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {serverError}
            </Alert>
          ) : null}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3, textAlign: "left" }}>
            <Stack spacing={2.2}>
              {/* Email */}
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 0.6 }}>
                  User ID
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Enter your User ID"
                  {...register("userId", {
                    required: "User ID is required",
                    pattern: {
                      message: "Invalid User ID",
                    },
                  })}
                  error={!!errors.email}
                  helperText={errors.email?.message || " "}
                />
              </Box>

              {/* Password row label + forgot */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: 12, fontWeight: 800 }}>Password</Typography>

                <Link
                  component="button"
                  type="button"
                  underline="hover"
                  onClick={() => navigate("/forgot-password")}
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "rgba(15,27,16,.70)",
                    "&:hover": { color: "rgba(15,27,16,.92)" },
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              {/* Password input */}
              <TextField
                fullWidth
                size="small"
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                {...register("password", { required: "Password is required" })}
                error={!!errors.password}
                helperText={errors.password?.message || " "}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Submit */}
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
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
