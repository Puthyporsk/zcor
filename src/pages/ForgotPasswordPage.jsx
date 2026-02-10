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

import ArrowBackIosNew from "@mui/icons-material/ArrowBackIosNew";
import { useAuth } from "../context/AuthContext";

import ZcorPill from "../components/ZcorPill";

const BG = "#CFF7E3";
const DARK = "#214318";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [serverError, setServerError] = React.useState("");
  const [serverSuccess, setServerSuccess] = React.useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: "" },
  });

  const onSubmit = async (data) => {
    setServerError("");
    setServerSuccess(""); 
    try {
      const res = await forgotPassword({
        email: data.email,
      });

      console.log(res);
          
      setServerSuccess(res?.message);
    } catch (err) {
      setServerError(err?.message);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)", // keep room for your fixed AppBar
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
            Forgot password?
          </Typography>
          <Typography sx={{ mt: 0.8, color: "rgba(15,27,16,.62)", fontSize: 13 }}>
            No worries, we&apos;ll send you reset instructions
          </Typography>
          
          {serverError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {serverError}
            </Alert>
          ) : null}

          {serverSuccess ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              {serverSuccess}
            </Alert>
          ) : null}

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ mt: 3, textAlign: "left" }}
          >
            <Stack spacing={2.2}>
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

                <Typography sx={{ mt: 0.2, fontSize: 12, color: "rgba(15,27,16,.60)" }}>
                  Enter the email address associated with your account
                </Typography>
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

          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 0.8, color: "rgba(15,27,16,.55)" }}>
            <Link component="button" type="button" underline="hover" onClick={() => console.log("Terms")} sx={{ fontSize: 11.5, color: "inherit" }}>
              Terms
            </Link>
            <Link component="button" type="button" underline="hover" onClick={() => console.log("Privacy")} sx={{ fontSize: 11.5, color: "inherit" }}>
              Privacy
            </Link>
            <Link component="button" type="button" underline="hover" onClick={() => console.log("Help")} sx={{ fontSize: 11.5, color: "inherit" }}>
              Help
            </Link>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
