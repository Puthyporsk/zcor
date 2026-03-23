import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import moment from "moment";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PasswordOutlinedIcon from '@mui/icons-material/PasswordOutlined';

import ZcorAllRightsReserved from "../components/ZcorAllRightsReserved";

import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../api/api.js";
import { updateMe, uploadAvatar } from "../api/user.js";

// Simple deep compare for dirty state
const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const initialsFromName = (first = "", last = "") =>
  `${(first[0] || "").toUpperCase()}${(last[0] || "").toUpperCase()}`.trim() || "U";

const PHONE_REGEX = /^\(\d{3}\)-\d{3} \d{4}$/;

function normalizePhoneInput(raw) {
  // Keep only digits, then format as (XXX)-XXX XXXX as you type
  const digits = (raw || "").replace(/\D/g, "").slice(0, 10);
  const a = digits.slice(0, 3);
  const b = digits.slice(3, 6);
  const c = digits.slice(6, 10);

  if (digits.length <= 3) return a ? `(${a}${digits.length === 3 ? ")" : ""}` : "";
  if (digits.length <= 6) return `(${a})-${b}`;
  return `(${a})-${b} ${c}`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // data:image/...;base64,...
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AccountSettings() {
    const navigate = useNavigate();
    const theme = useTheme();
    const fileInputRef = useRef(null);
    const savedAvatarSrcRef = useRef("");
    const { user, refreshMe } = useAuth();
    
    const [loading, setLoading] = useState(true);

    const [savedSnapshot, setSavedSnapshot] = useState(null);
    const [form, setForm] = useState(null);

    const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });
    const [phoneError, setPhoneError] = useState("");
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarSrc, setAvatarSrc] = useState("");
    
    const isDirty = React.useMemo(() => {
    if (!form || !savedSnapshot) return false;
        return !deepEqual(form, savedSnapshot) || Boolean(avatarFile);
    }, [form, savedSnapshot, avatarFile]);

    const pageBg =
        theme.palette.mode === "dark" ? theme.palette.background.default : "#CFF7E9";

    const cardSx = {
        borderRadius: 3,
        boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
    };

    const sectionTitleSx = { fontWeight: 700, fontSize: 14 };
    const sectionSubtitleSx = { color: "text.secondary", fontSize: 12, mt: 0.25 };

    // Normalize backend -> form model
    function mapMeToForm(me) {
        const meta = me?.employeeMeta || {};
        const roleOptions = [{ value: "employee", label: "Employee" }, { value: "manager", label: "Manager" }, { value: "owner", label: "Owner" }];
        const statusOptions = [{ value: "active", label: "Active" }, { value: "invited", label: "Invited" }, { value: "disabled", label: "Disabled" }];
        return {
            avatar: me?.avatar || "",
            avatarUrl: me?.avatarUrl || "",
            firstName: me?.firstName || "",
            lastName: me?.lastName || "",
            userId: me?.userId || "",
            email: me?.email || "",
            phone: me?.phone || "",

            role: roleOptions.find(r => r.value === me?.role)?.label || "",
            status: statusOptions.find(s => s.value === me?.status)?.label || "",

            employeeCode: meta.employeeCode || meta.code || "",
            jobTitle: meta.jobTitle || meta.title || "",
            payType: meta.payType || "hourly",
            hourlyRate: meta.hourlyRate || "",
            salaryRate: meta.salaryRate || "",
            startDate: meta.startDate || "",
            notes: meta.notes || "",
        };
    }

    const labelRow = (Icon, label) => (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
        <Icon fontSize="small" style={{ opacity: 0.7 }} />
        <Typography sx={{ fontWeight: 700, fontSize: 12, opacity: 0.9 }}>{label}</Typography>
        </Stack>
    );

    const handleChange = (key) => (e) => {
        const value = e.target.value;
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleCancel = () => {
        setForm(savedSnapshot);
        setAvatarFile(null);
        setAvatarSrc(savedAvatarSrcRef.current);
        setPhoneError("");
    };

    const handlePickPhoto = () => fileInputRef.current?.click();

    const handlePhotoSelected = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("Image too large (max 2 MB). Please choose a smaller file.");
            e.target.value = "";
            return;
        }

        setAvatarFile(file);

        // immediate preview
        const previewUrl = URL.createObjectURL(file);
        setAvatarSrc(previewUrl);
    };

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            setLoading(true);

            const mapped = mapMeToForm(user);
            setSavedSnapshot(mapped);
            setForm(mapped);

            try {
            const res = await fetch(`${API_BASE}/api/user/me/avatar`, {
                method: "GET",
                credentials: "include",
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);

                if (!cancelled) {
                    savedAvatarSrcRef.current = url;
                    setAvatarSrc(url);
                }
            } else {
                if (!cancelled) setAvatarSrc(""); // fallback to initials
            }
            } catch {
            if (!cancelled) setAvatarSrc("");
            }

            if (!cancelled) setLoading(false);
        };

        run();

        return () => {
            cancelled = true;
        };
        }, [user]);

    const handleSave = async () => {
        // Block if phone invalid
        if (form.phone && !PHONE_REGEX.test(form.phone)) {
            setPhoneError("Use format (XXX)-XXX XXXX");
            setSnack({ open: true, severity: "error", message: "Fix phone number format before saving." });
            return;
        }

        try {
            const phoneChanged = form.phone !== savedSnapshot.phone;
            const avatarChanged = Boolean(avatarFile);

            // No changes? do nothing
            if (!phoneChanged && !avatarChanged) return;

            // 1) Upload avatar ONLY if changed
            if (avatarChanged) {
                const dataUrl = await fileToBase64(avatarFile);

                // PATCH /api/users/me/avatar
                await uploadAvatar({
                    base64: dataUrl,
                    contentType: avatarFile.type, // "image/png"
                });
            }

            // 2) Update phone ONLY if changed
            if (phoneChanged) {
                // PATCH /api/users/me with
                await updateMe({ phone: form.phone });
            }

            // 3) Reload user from /api/auth/me so avatarUrl/phone reflect latest
            const updatedUser = await refreshMe();

            // 4) Remap into your form model and reset snapshot so buttons disappear
            const mapped = mapMeToForm(updatedUser);

            // If avatar was changed, force the Avatar <img> to refresh (cache-bust)
            if (avatarChanged && mapped.profilePhotoUrl) {
                mapped.profilePhotoUrl = `${mapped.profilePhotoUrl}?t=${Date.now()}`;
            }

            setSavedSnapshot(mapped);
            setForm(mapped);
            setAvatarFile(null);
            setPhoneError("");

            setSnack({ open: true, severity: "success", message: "Account updated." });
        } catch (err) {
            setSnack({ open: true, severity: "error", message: err?.message || "Update failed." });
        }
    };


    if (loading) {
        return (
        <Box sx={{ minHeight: "100vh", background: pageBg, display: "grid", placeItems: "center" }}>
            <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography sx={{ color: "text.secondary" }}>Loading account settings…</Typography>
            </Stack>
        </Box>
        );
    }

    // form is guaranteed after successful load
    return (
        <Box sx={{ minHeight: "100vh", background: pageBg, py: 4 }}>
            <Box sx={{ maxWidth: 980, mx: "auto", px: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
                    Account Settings
                </Typography>
                <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
                    Manage your profile and preferences
                </Typography>

                <Stack spacing={3} sx={{ mt: 3 }}>
                {/* Profile Picture */}
                <Card sx={cardSx}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography sx={sectionTitleSx}>Profile Picture</Typography>
                        <Typography sx={sectionSubtitleSx}>Update your profile photo</Typography>

                        <Divider sx={{ my: 2 }} />

                        <Stack direction="row" spacing={2.5} alignItems="center">
                            <Box sx={{ position: "relative", width: 72, height: 72 }}>
                            <Avatar
                                src={avatarSrc || undefined}
                                sx={{
                                    width: 72,
                                    height: 72,
                                    bgcolor: theme.palette.primary.dark,
                                    fontWeight: 800,
                                    fontSize: 20,
                                }}
                            >
                                {initialsFromName(form.firstName, form.lastName)}
                            </Avatar>

                            <IconButton
                                onClick={handlePickPhoto}
                                size="small"
                                sx={{
                                position: "absolute",
                                right: -6,
                                bottom: -6,
                                bgcolor: "background.paper",
                                border: "1px solid",
                                borderColor: "divider",
                                boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
                                "&:hover": { bgcolor: "background.paper" },
                                }}
                                aria-label="Upload profile photo"
                            >
                                <PhotoCameraOutlinedIcon fontSize="small" />
                            </IconButton>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handlePhotoSelected}
                            />
                            </Box>

                            <Box>
                            <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                                Click the camera icon to upload a new photo
                            </Typography>
                            <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 0.25 }}>
                                Recommended: Square image, at least 400x400px
                            </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Personal Information */}
                <Card sx={cardSx}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography sx={sectionTitleSx}>Personal Information</Typography>
                        <Typography sx={sectionSubtitleSx}>Your basic account details</Typography>

                        <Divider sx={{ my: 2 }} />

                        <Grid container spacing={2.5}>
                            <Grid size={{ xs: 12, md: 6 }}>
                            {labelRow(PersonOutlineIcon, "First Name")}
                            <TextField
                                fullWidth
                                value={form.firstName}
                                onChange={handleChange("firstName")}
                                placeholder="First name"
                                disabled
                            />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                            {labelRow(PersonOutlineIcon, "Last Name")}
                            <TextField
                                fullWidth
                                value={form.lastName}
                                onChange={handleChange("lastName")}
                                placeholder="Last name"
                                disabled
                            />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                            {labelRow(BadgeOutlinedIcon, "User ID")}
                            <TextField fullWidth value={form.userId} disabled />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                            {labelRow(EmailOutlinedIcon, "Email")}
                            <TextField fullWidth value={form.email} disabled />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                            {labelRow(PhoneOutlinedIcon, "Phone Number")}
                            <TextField
                                fullWidth
                                value={form.phone}
                                onChange={(e) => {
                                    const formatted = normalizePhoneInput(e.target.value);
                                    setForm((prev) => ({ ...prev, phone: formatted }));

                                    // live validation (only show error once they started typing)
                                    if (!formatted) setPhoneError("");
                                    else setPhoneError(PHONE_REGEX.test(formatted) ? "" : "Use format (XXX)-XXX XXXX");
                                }}
                                onBlur={() => {
                                    const v = form.phone || "";
                                    if (!v) return setPhoneError("");
                                    setPhoneError(PHONE_REGEX.test(v) ? "" : "Use format (XXX)-XXX XXXX");
                                }}
                                error={Boolean(phoneError)}
                                helperText={phoneError || "This field can be updated"}
                                placeholder="(123)-456 7890"
                                slotProps={{
                                    htmlInput: { inputMode: "numeric" },
                                }}
                            />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                {labelRow(PasswordOutlinedIcon, "Change Password")}
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate("change-password")}
                                    sx={{ borderRadius: 2, fontWeight: 700 }}
                                >
                                    Change Password
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Account Status */}
                <Card sx={cardSx}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography sx={sectionTitleSx}>Account Status</Typography>
                        <Typography sx={sectionSubtitleSx}>Your role and account status</Typography>

                        <Divider sx={{ my: 2 }} />

                        <Grid container spacing={2.5}>
                            <Grid size={{ xs: 12, md: 6 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 12, mb: 1 }}>Role</Typography>
                            <Chip
                                label={form.role}
                                color="success"
                                variant="outlined"
                                sx={{ fontWeight: 700, borderRadius: 2 }}
                            />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 12, mb: 1 }}>Status</Typography>
                            <Chip
                                label={form.status}
                                color={form.status !== 'Disabled' ? "success" : "error"}
                                variant="outlined"
                                sx={{ fontWeight: 700, borderRadius: 2 }}
                            />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Employee Information */}
                <Card sx={cardSx}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography sx={sectionTitleSx}>Employee Information</Typography>
                        <Typography sx={sectionSubtitleSx}>Work-related details</Typography>

                        <Divider sx={{ my: 2 }} />

                        <Grid container spacing={2.5}>
                            <Grid size={{ xs: 12, md: 6 }}>
                            {labelRow(BadgeOutlinedIcon, "Employee Code")}
                            <TextField fullWidth value={form.employeeCode || "-"} disabled />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                            {labelRow(WorkOutlineIcon, "Job Title")}
                            <TextField fullWidth value={form.jobTitle || "-"} disabled />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                            {labelRow(PaidOutlinedIcon, "Pay Type")}
                            <TextField
                                disabled
                                select
                                fullWidth
                                value={form.payType}
                            >
                                <MenuItem value="hourly">Hourly</MenuItem>
                                <MenuItem value="salary">Salary</MenuItem>
                            </TextField>
                            </Grid>

                            {form.payType === "hourly" ? (
                                <Grid size={{ xs: 12, md: 6 }}>
                                    {labelRow(PaidOutlinedIcon, "Hourly Rate")}
                                    <TextField fullWidth value={`$ ${form.hourlyRate || "-"} /hr`} disabled />
                                </Grid>
                            ) : (
                                <Grid size={{ xs: 12, md: 6 }}>
                                    {labelRow(PaidOutlinedIcon, "Salary Rate")}
                                    <TextField fullWidth value={`$ ${form.salaryRate || "-"} /year`} disabled />
                                </Grid>
                            )}

                            <Grid size={{ xs: 12, md: 6 }}>
                            {labelRow(CalendarMonthOutlinedIcon, "Start Date")}
                            <TextField fullWidth value={moment.utc(new Date(form.startDate)).format('ddd, DD MMM YYYY') || "-"} disabled />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 12, mb: 0.75 }}>Notes</Typography>
                            <TextField
                                fullWidth
                                value={form.notes}
                                onChange={handleChange("notes")}
                                placeholder="Add notes"
                            />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Buttons (only when dirty) */}
                {isDirty && (
                    <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ pb: 2 }}>
                        <Button variant="outlined" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={handleSave}>
                            Save Changes
                        </Button>
                    </Stack>
                )}

                <ZcorAllRightsReserved />
                </Stack>

                <Snackbar
                    open={snack.open}
                    autoHideDuration={3000}
                    onClose={() => setSnack((s) => ({ ...s, open: false }))}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                    <Alert
                        onClose={() => setSnack((s) => ({ ...s, open: false }))}
                        severity={snack.severity}
                        variant="filled"
                    >
                        {snack.message}
                    </Alert>
                </Snackbar>
            </Box>
        </Box>
    );
}
