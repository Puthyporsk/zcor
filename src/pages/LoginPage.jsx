import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Alert from "@mui/material/Alert";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

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
      email: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data) => {
    setServerError("");
    try {
      await login({
        email: data.email,
        password: data.password,
        remember: Boolean(data.remember),
        // businessSlug: data.businessSlug, // add later if you want a field
      });

      // go somewhere after login
      navigate("/time-entry");
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
          <ZcorPill onClick={() => navigate("/")} />
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
                  Email
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="name@example.com"
                  autoComplete="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
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

              {/* Remember */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                <Checkbox
                  {...register("remember")}
                  sx={{
                    p: 0,
                    "& .MuiSvgIcon-root": { fontSize: 18 },
                  }}
                  inputProps={{ "aria-label": "Remember me for 30 days" }}
                />
                <Typography sx={{ fontSize: 12.5, color: "rgba(15,27,16,.75)" }}>
                  Remember me for 30 days
                </Typography>
              </Box>

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

              {/* Divider */}
              <Divider sx={{ my: 1.5 }}>
                <Typography sx={{ fontSize: 10, letterSpacing: ".18em", color: "rgba(15,27,16,.55)" }}>
                  OR CONTINUE WITH
                </Typography>
              </Divider>

              {/* Social */}
              <Stack direction="row" spacing={1.5}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => console.log("Google login")}
                  sx={{
                    borderRadius: 1.5,
                    py: 1.0,
                    borderColor: "rgba(15,27,16,.15)",
                    color: "rgba(15,27,16,.85)",
                    "&:hover": { borderColor: "rgba(15,27,16,.35)" },
                  }}
                >
                  <FcGoogle style={{ fontSize: 18, marginRight: 8 }} />
                  Google
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => console.log("GitHub login")}
                  sx={{
                    borderRadius: 1.5,
                    py: 1.0,
                    borderColor: "rgba(15,27,16,.15)",
                    color: "rgba(15,27,16,.85)",
                    "&:hover": { borderColor: "rgba(15,27,16,.35)" },
                  }}
                >
                  <FaGithub style={{ fontSize: 18, marginRight: 8 }} />
                  GitHub
                </Button>
              </Stack>

              {/* Signup */}
              <Typography sx={{ textAlign: "center", fontSize: 12.5, color: "rgba(15,27,16,.62)" }}>
                Don&apos;t have an account?{" "}
                <Link component={RouterLink} to="/signup" underline="hover" sx={{ fontWeight: 900, color: DARK }}>
                  Sign up
                </Link>
              </Typography>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
