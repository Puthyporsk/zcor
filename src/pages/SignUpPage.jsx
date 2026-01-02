import { useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";

const bg = "#CFF7E3";
const dark = "#214318";

function ZcorPill() {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        px: 1.3,
        py: 0.7,
        borderRadius: 999,
        bgcolor: "rgba(15,27,16,.86)",
        color: "#fff",
        boxShadow: "0 12px 28px rgba(15,27,16,.18)",
      }}
      aria-label="ZCOR"
    >
      <Box
        sx={{
          width: 18,
          height: 18,
          borderRadius: 999,
          bgcolor: "rgba(255,255,255,.18)",
          display: "grid",
          placeItems: "center",
          fontSize: 12,
          fontWeight: 800,
        }}
      >
        Z
      </Box>
      <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: ".06em" }}>
        ZCOR
      </Typography>
    </Box>
  );
}

function GoogleIcon() {
  return (
    <Box component="span" sx={{ display: "inline-flex", mr: 1 }}>
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#FFC107"
          d="M43.611 20.083H42V20H24v8h11.303C33.655 32.657 29.227 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.227 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.65-.389-3.917Z"
        />
        <path
          fill="#FF3D00"
          d="M6.306 14.691 12.87 19.51C14.644 15.108 18.951 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.227 4 24 4c-7.682 0-14.354 4.33-17.694 10.691Z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.127 0 9.86-1.965 13.409-5.175l-6.19-5.238C29.16 35.091 26.715 36 24 36c-5.205 0-9.619-3.317-11.283-7.946l-6.518 5.02C9.505 39.556 16.227 44 24 44Z"
        />
        <path
          fill="#1976D2"
          d="M43.611 20.083H42V20H24v8h11.303c-.79 2.205-2.291 4.078-4.294 5.238l.003-.002 6.19 5.238C36.77 39.042 44 34 44 24c0-1.341-.138-2.65-.389-3.917Z"
        />
      </svg>
    </Box>
  );
}

function GithubIcon() {
  return (
    <Box component="span" sx={{ display: "inline-flex", mr: 1 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 .5C5.73.5.75 5.62.75 12c0 5.11 3.29 9.44 7.86 10.97.58.11.79-.26.79-.58v-2.18c-3.2.71-3.87-1.27-3.87-1.27-.52-1.36-1.27-1.72-1.27-1.72-1.04-.73.08-.72.08-.72 1.15.08 1.75 1.22 1.75 1.22 1.02 1.8 2.68 1.28 3.33.98.1-.76.4-1.28.73-1.57-2.55-.3-5.23-1.32-5.23-5.82 0-1.28.44-2.32 1.17-3.14-.12-.3-.51-1.49.11-3.1 0 0 .95-.31 3.12 1.22.9-.26 1.87-.39 2.83-.39.96 0 1.93.13 2.83.39 2.17-1.53 3.12-1.22 3.12-1.22.62 1.61.23 2.8.11 3.1.73.82 1.17 1.86 1.17 3.14 0 4.51-2.69 5.52-5.25 5.81.41.37.78 1.08.78 2.18v3.23c0 .32.21.7.8.58A11.55 11.55 0 0 0 23.25 12C23.25 5.62 18.27.5 12 .5Z"
        />
      </svg>
    </Box>
  );
}

export default function SignUpPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const password = watch("password");

  const onSubmit = async (data) => {
    // TODO: hook this to backend
    console.log("Sign up submitted:", data);

    // Example: navigate to login after success
    navigate("/login");
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)", // accounts for your fixed AppBar + Toolbar spacer
        background: bg,
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
            border: "1px solid rgba(15,27,16,.10)",
            boxShadow: "0 18px 55px rgba(15,27,16,.16)",
            px: 3,
            py: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Create an account
          </Typography>
          <Typography sx={{ mt: 0.5, color: "rgba(15,27,16,.62)", fontSize: 13 }}>
            Enter your details to get started with ZCOR
          </Typography>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3, textAlign: "left" }}>
            <Stack spacing={2}>
                <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5 }}>
                    Full name
                    </Typography>
                    <TextField
                    fullWidth
                    size="small"
                    placeholder="John Doe"
                    {...register("fullName", { required: "Full name is required" })}
                    error={!!errors.fullName}
                    helperText={errors.fullName?.message || " "}
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

                <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5 }}>
                    Password
                    </Typography>
                    <TextField
                    fullWidth
                    size="small"
                    type="password"
                    placeholder="Create a strong password"
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
                    {...register("confirmPassword", {
                        required: "Confirm your password",
                        validate: (v) => v === password || "Passwords do not match",
                    })}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message || " "}
                    />
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center", // ✅ centers checkbox vs text block
                        gap: 1.25,
                        mt: 0.5,
                    }}
                    >
                    <Checkbox
                        {...register("terms", { required: "You must accept the terms" })}
                        sx={{
                        p: 0, // remove default padding so it doesn't push alignment
                        "& .MuiSvgIcon-root": { fontSize: 18 }, // closer to your Figma size
                        }}
                    />

                    <Typography
                        sx={{
                        fontSize: 12.5,
                        color: "rgba(15,27,16,.75)",
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
                        </Link>
                        and{" "}
                        <Link href="#" underline="hover" sx={{ fontWeight: 800, color: "inherit" }}>
                        Privacy Policy
                        </Link>
                    </Typography>
                    </Box>

                    {errors.terms ? (
                    <Typography sx={{ mt: 0.75, fontSize: 12, color: "#b00020" }}>
                        {errors.terms.message}
                    </Typography>
                    ) : (
                    <Typography sx={{ mt: 0.75, fontSize: 12, color: "transparent" }}>.</Typography>
                    )}


              {errors.terms ? (
                <Typography sx={{ mt: -1, fontSize: 12, color: "#b00020" }}>
                  {errors.terms.message}
                </Typography>
              ) : (
                <Typography sx={{ mt: -1, fontSize: 12, color: "transparent" }}>.</Typography>
              )}

              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                sx={{
                  bgcolor: dark,
                  borderRadius: 1.5,
                  py: 1.2,
                  fontWeight: 800,
                  "&:hover": { bgcolor: "#183312" },
                }}
              >
                Create account
              </Button>

              <Divider sx={{ my: 1.5 }}>
                <Typography sx={{ fontSize: 10, letterSpacing: ".18em", color: "rgba(15,27,16,.55)" }}>
                  OR CONTINUE WITH
                </Typography>
              </Divider>

              <Stack direction="row" spacing={1.5}>
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    borderRadius: 1.5,
                    py: 1.0,
                    borderColor: "rgba(15,27,16,.15)",
                    color: "rgba(15,27,16,.85)",
                    "&:hover": { borderColor: "rgba(15,27,16,.35)" },
                  }}
                  onClick={() => console.log("Google signup")}
                >
                  <GoogleIcon />
                  Google
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    borderRadius: 1.5,
                    py: 1.0,
                    borderColor: "rgba(15,27,16,.15)",
                    color: "rgba(15,27,16,.85)",
                    "&:hover": { borderColor: "rgba(15,27,16,.35)" },
                  }}
                  onClick={() => console.log("GitHub signup")}
                >
                  <GithubIcon />
                  GitHub
                </Button>
              </Stack>

              <Typography sx={{ textAlign: "center", fontSize: 12.5, color: "rgba(15,27,16,.62)" }}>
                Already have an account?{" "}
                <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 800, color: dark }}>
                  Sign in
                </Link>
              </Typography>
            </Stack>
          </Box>
        </Paper>

        {/* Bottom footer */}
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
            <Link href="#" underline="hover" sx={{ fontSize: 11.5, color: "inherit" }}>
              Terms
            </Link>
            <Link href="#" underline="hover" sx={{ fontSize: 11.5, color: "inherit" }}>
              Privacy
            </Link>
            <Link href="#" underline="hover" sx={{ fontSize: 11.5, color: "inherit" }}>
              Help
            </Link>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
