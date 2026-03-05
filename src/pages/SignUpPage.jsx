import React from "react";
import { useForm, Controller } from "react-hook-form";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";

import ZcorPill from "../components/ZcorPill";
import { useAuth } from "../context/AuthContext";

// Decode a JWT payload without a library (base64url → JSON)
function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

const BG = "#CFF7E3";
const DARK = "#214318";

const toUserId = (first = "", last = "") => {
  const slug = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const f = slug(first);
  const l = slug(last);
  return f && l ? `${f}.${l}` : f || l || "";
};

export default function SignUpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register: registerUser, registerInvited } = useAuth();

  // Decode the invite token from the URL (client-side only, for pre-filling email)
  const inviteToken = searchParams.get("invite");
  const invitePayload = React.useMemo(
    () => (inviteToken ? decodeJwtPayload(inviteToken) : null),
    [inviteToken],
  );
  const inviteEmail     = invitePayload?.email     || "";
  const inviteFirstName = invitePayload?.firstName || "";
  const inviteLastName  = invitePayload?.lastName  || "";

  const [serverError, setServerError] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      firstName: inviteFirstName,
      lastName:  inviteLastName,
      email:     inviteEmail,
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const password = watch("password");
  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const userId = toUserId(firstName, lastName);

  const onSubmit = async (data) => {
    setServerError("");
    setSuccessMsg("");

    try {
      if (inviteToken) {
        await registerInvited({
          token: inviteToken,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          userId: toUserId(data.firstName, data.lastName),
          password: data.password,
        });
      } else {
        await registerUser({
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          userId: toUserId(data.firstName, data.lastName),
          email: data.email.trim(),
          password: data.password,
        });
      }

      setSuccessMsg("Account created! Please sign in.");
      setTimeout(() => {
        navigate("/login", { state: { justSignedUp: true } });
      }, 300);
    } catch (err) {
      setServerError(err?.message || "Sign up failed. Please try again.");
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
      <Box sx={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
        <Box sx={{ mb: 3 }}>
          <ZcorPill />
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2.5,
            border: "1px solid rgba(15,27,16,0.10)",
            boxShadow: "0 18px 55px rgba(15,27,16,0.16)",
            px: 3,
            py: 3,
            textAlign: "left",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, textAlign: "center" }}>
            Create an account
          </Typography>
          <Typography
            sx={{
              mt: 0.5,
              color: "rgba(15,27,16,0.62)",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            {inviteToken
              ? "You've been invited to join ZCOR"
              : "Enter your details to get started with ZCOR"}
          </Typography>

          {serverError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {serverError}
            </Alert>
          ) : null}

          {successMsg ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              {successMsg}
            </Alert>
          ) : null}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5 }}>
                    First name
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="John"
                    {...register("firstName", { required: "First name is required" })}
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message || " "}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5 }}>
                    Last name
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Doe"
                    {...register("lastName", { required: "Last name is required" })}
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message || " "}
                  />
                </Box>
              </Stack>

              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5 }}>
                  User ID
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={userId}
                  disabled
                  placeholder="Generated from your name"
                  helperText="Auto-generated — used to sign in"
                  slotProps={{ htmlInput: { readOnly: true } }}
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5 }}>
                  Email
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="name@example.com"
                  autoComplete="email"
                  disabled={!!inviteToken}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  error={!!errors.email}
                  helperText={inviteToken ? "Pre-filled from your invitation" : (errors.email?.message || " ")}
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5 }}>
                  Password
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 8, message: "Must be at least 8 characters" },
                  })}
                  error={!!errors.password}
                  helperText={errors.password?.message || "Must be at least 8 characters"}
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5 }}>
                  Confirm password
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  {...register("confirmPassword", {
                    required: "Confirm your password",
                    validate: (v) => v === password || "Passwords do not match",
                  })}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message || " "}
                />
              </Box>

              {/* Terms */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mt: 0.25 }}>
                <Controller
                  name="terms"
                  control={control}
                  rules={{ validate: (v) => v === true || "You must accept the terms" }}
                  render={({ field }) => (
                    <Checkbox
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      sx={{ p: 0, "& .MuiSvgIcon-root": { fontSize: 18 } }}
                      inputProps={{ "aria-label": "Accept terms" }}
                    />
                  )}
                />

                <Typography
                  sx={{
                    fontSize: 12.5,
                    color: "rgba(15,27,16,0.75)",
                    lineHeight: 1.35,
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "4px",
                  }}
                >
                  I agree to the{" "}
                  <Link href="#" underline="hover" sx={{ fontWeight: 800, color: "inherit" }}>
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="#" underline="hover" sx={{ fontWeight: 800, color: "inherit" }}>
                    Privacy Policy
                  </Link>
                </Typography>
              </Box>

              {errors.terms ? (
                <Typography sx={{ mt: 0.5, fontSize: 12, color: "#b00020" }}>
                  {errors.terms.message}
                </Typography>
              ) : (
                <Typography sx={{ mt: 0.5, fontSize: 12, color: "transparent" }}>.</Typography>
              )}

              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                sx={{
                  bgcolor: DARK,
                  borderRadius: 1.5,
                  py: 1.2,
                  fontWeight: 800,
                  "&:hover": { bgcolor: "#183312" },
                }}
              >
                {isSubmitting ? "Creating..." : "Create account"}
              </Button>

              <Typography sx={{ mt: 1.5, fontSize: 13, color: "rgba(15,27,16,0.70)", textAlign: "center" }}>
                Already have an account?{" "}
                <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 900, color: "inherit" }}>
                  Sign in
                </Link>
              </Typography>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
