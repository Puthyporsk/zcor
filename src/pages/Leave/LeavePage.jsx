import React from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Chip,
  Stack,
  Divider,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import BeachAccessOutlinedIcon from "@mui/icons-material/BeachAccessOutlined";
import SickOutlinedIcon from "@mui/icons-material/SickOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

import { useAuth } from "../../context/AuthContext";
import * as leaveApi from "../../api/leave";
import * as policyApi from "../../api/leavePolicy";
import { getUsers } from "../../api/user";
import "../../styles/leave.css";

// ─── helpers ────────────────────────────────────────────────────────────────

const LEAVE_TYPES = ["vacation", "sick", "personal"];

const TYPE_LABEL = { vacation: "Vacation", sick: "Sick Leave", personal: "Personal" };
const TYPE_COLOR = { vacation: "#1565c0", sick: "#6a1b9a", personal: "#2e7d32" };
const TYPE_BG    = { vacation: "rgba(21,101,192,0.08)", sick: "rgba(106,27,154,0.08)", personal: "rgba(46,125,50,0.08)" };

const STATUS_COLOR = {
  pending:  "warning",
  approved: "success",
  denied:   "error",
  cancelled: "default",
};

const TYPE_ICON = {
  vacation: <BeachAccessOutlinedIcon fontSize="small" />,
  sick:     <SickOutlinedIcon fontSize="small" />,
  personal: <PersonOutlineOutlinedIcon fontSize="small" />,
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso.slice(0, 10) + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const currentYear = new Date().getFullYear();

// Count Mon–Fri days between two "YYYY-MM-DD" strings (inclusive)
const countWeekdays = (startStr, endStr) => {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr + "T00:00:00");
  const end   = new Date(endStr   + "T00:00:00");
  if (end < start) return 0;
  let count = 0;
  const d = new Date(start);
  while (d <= end) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
};

const emptyForm = () => ({
  type:       "vacation",
  startDate:  "",
  endDate:    "",
  totalHours: "",
  reason:     "",
});

// ─── Balance card ────────────────────────────────────────────────────────────

function BalanceCard({ type, balances }) {
  const b = balances.find((x) => x.type === type);
  const allocated  = b?.allocated  ?? 0;
  const used       = b?.used       ?? 0;
  const pending    = b?.pending    ?? 0;
  const carriedOver = b?.carriedOver ?? 0;
  const remaining  = Math.max(0, allocated - used - pending);
  const usedPct    = allocated > 0 ? Math.min(100, ((used + pending) / allocated) * 100) : 0;

  const fillClass =
    usedPct >= 90 ? "lv-balCard__barFill--danger"
    : usedPct >= 70 ? "lv-balCard__barFill--warn"
    : "";

  return (
    <Paper elevation={0} className="lv-balCard">
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Box sx={{ color: TYPE_COLOR[type] }}>{TYPE_ICON[type]}</Box>
        <Typography className="lv-balCard__type">{TYPE_LABEL[type]}</Typography>
      </Stack>
      <Typography className="lv-balCard__remaining">
        {remaining.toFixed(1)}
        <Typography component="span" sx={{ fontSize: 14, fontWeight: 400, color: "rgba(15,27,16,0.55)", ml: 0.5 }}>
          h left
        </Typography>
      </Typography>
      <Typography className="lv-balCard__sub">
        {used.toFixed(1)}h used · {pending.toFixed(1)}h pending · {allocated.toFixed(1)}h accrued
        {carriedOver > 0 && ` · ${carriedOver.toFixed(1)}h carried over`}
      </Typography>
      <Box className="lv-balCard__bar">
        <Box
          className={`lv-balCard__barFill ${fillClass}`}
          style={{ width: `${usedPct}%` }}
        />
      </Box>
    </Paper>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LeavePage() {
  const { user } = useAuth();
  const isPrivileged = user?.role === "owner" || user?.role === "manager";

  // ── data ──
  const [myRequests,   setMyRequests]   = React.useState([]);
  const [myBalances,   setMyBalances]   = React.useState([]);
  const [teamRequests, setTeamRequests] = React.useState([]);
  const [employees,    setEmployees]    = React.useState([]);
  const [loading,      setLoading]      = React.useState(true);

  // ── form ──
  const [form,      setForm]      = React.useState(emptyForm());
  const [formError, setFormError] = React.useState("");
  const [saving,    setSaving]    = React.useState(false);
  const [editingId, setEditingId] = React.useState(null); // null = new request

  // ── review dialog (managers) ──
  const [reviewTarget, setReviewTarget] = React.useState(null); // { request, action }
  const [reviewNote,   setReviewNote]   = React.useState("");
  const [reviewing,    setReviewing]    = React.useState(false);

  // ── all-pending modal ──
  const [allPendingOpen, setAllPendingOpen] = React.useState(false);

  // ── allocation dialog (managers) ──
  const [allocOpen,   setAllocOpen]   = React.useState(false);
  const [allocForm,   setAllocForm]   = React.useState({ employeeId: "", type: "vacation", year: currentYear, allocated: "" });
  const [allocSaving, setAllocSaving] = React.useState(false);
  const [allocError,  setAllocError]  = React.useState("");

  // ── accrual policy (owner only) ──
  const isOwner = user?.role === "owner";
  const [policyOpen,   setPolicyOpen]   = React.useState(false);
  const [policy,       setPolicy]       = React.useState(null);
  const [policyForm,   setPolicyForm]   = React.useState(null);
  const [policySaving, setPolicySaving] = React.useState(false);

  // ── carryover ──
  const [carryoverOpen,   setCarryoverOpen]   = React.useState(false);
  const [carryoverYear,   setCarryoverYear]   = React.useState(currentYear - 1);
  const [carryoverSaving, setCarryoverSaving] = React.useState(false);

  // ── snackbar ──
  const [snack, setSnack] = React.useState({ open: false, msg: "", severity: "success" });
  const toast = (msg, severity = "success") => setSnack({ open: true, msg, severity });

  // ── load ──
  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const year = String(currentYear);
      const [reqs, bals] = await Promise.all([
        leaveApi.getLeaveRequests({ year, userId: user._id }),
        leaveApi.getLeaveBalances({ year, userId: user._id }),
      ]);
      setMyRequests(reqs);
      setMyBalances(bals);

      if (isPrivileged) {
        const pending = await leaveApi.getLeaveRequests({ status: "pending" });
        // exclude own requests from team view
        setTeamRequests(pending.filter((r) => r.employee?._id !== user._id && r.employee?.userId !== user.userId));
        const users = await getUsers();
        setEmployees(users.filter((u) => u.status === "active"));

        // Load accrual policy
        try {
          const pol = await policyApi.getLeavePolicy();
          setPolicy(pol);
        } catch { /* ignore if policy doesn't exist */ }
      }
    } catch (e) {
      toast(e.message || "Failed to load leave data", "error");
    } finally {
      setLoading(false);
    }
  }, [user, isPrivileged]);

  React.useEffect(() => { load(); }, [load]);

  // ── form helpers ──
  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const resetForm = () => {
    setForm(emptyForm());
    setFormError("");
    setEditingId(null);
  };

  const startEdit = (req) => {
    setForm({
      type:       req.type,
      startDate:  req.startDate?.slice(0, 10) || localToday(),
      endDate:    req.endDate?.slice(0, 10)   || localToday(),
      totalHours: String(req.totalHours),
      reason:     req.reason || "",
    });
    setFormError("");
    setEditingId(req.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.startDate) return setFormError("Start date is required");
    if (!form.endDate)   return setFormError("End date is required");
    if (form.endDate < form.startDate) return setFormError("End date must be on or after start date");

    let hours;
    if (form.type === "vacation") {
      const weekdays = countWeekdays(form.startDate, form.endDate);
      if (weekdays === 0) return setFormError("Selected date range has no working days (Mon–Fri)");
      hours = weekdays * 8;
    } else {
      hours = parseFloat(form.totalHours);
      if (!form.totalHours || isNaN(hours) || hours < 0.25) return setFormError("Enter at least 0.25 hours");
    }

    setSaving(true);
    try {
      const payload = {
        type:       form.type,
        startDate:  form.startDate,
        endDate:    form.endDate,
        totalHours: hours,
        reason:     form.reason || undefined,
      };

      if (editingId) {
        await leaveApi.updateLeaveRequest(editingId, payload);
        toast("Request updated");
      } else {
        await leaveApi.createLeaveRequest(payload);
        toast("Leave request submitted");
      }

      resetForm();
      await load();
    } catch (err) {
      setFormError(err.message || "Failed to save request");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await leaveApi.cancelLeaveRequest(id);
      toast("Request cancelled");
      await load();
    } catch (err) {
      toast(err.message || "Failed to cancel", "error");
    }
  };

  // ── review ──
  const openReview = (request, action) => {
    setReviewTarget({ request, action });
    setReviewNote("");
  };

  const submitReview = async () => {
    if (!reviewTarget) return;
    setReviewing(true);
    try {
      await leaveApi.reviewLeaveRequest(reviewTarget.request.id, {
        action: reviewTarget.action,
        reviewNote: reviewNote || undefined,
      });
      toast(`Request ${reviewTarget.action === "approve" ? "approved" : "denied"}`);
      setReviewTarget(null);
      await load();
    } catch (err) {
      toast(err.message || "Review failed", "error");
    } finally {
      setReviewing(false);
    }
  };

  // ── allocation ──
  const submitAllocation = async () => {
    setAllocError("");
    const hours = parseFloat(allocForm.allocated);
    if (!allocForm.employeeId) return setAllocError("Select an employee");
    if (isNaN(hours) || hours < 0) return setAllocError("Enter a valid number of hours");
    setAllocSaving(true);
    try {
      await leaveApi.updateLeaveBalance({
        employeeId: allocForm.employeeId,
        type:       allocForm.type,
        year:       allocForm.year,
        allocated:  hours,
      });
      toast("Allocation updated");
      setAllocOpen(false);
      await load();
    } catch (err) {
      setAllocError(err.message || "Failed to update");
    } finally {
      setAllocSaving(false);
    }
  };

  // ── accrual policy ──
  const openPolicyDialog = () => {
    setPolicyForm(policy ? {
      accrualEnabled: policy.accrualEnabled ?? false,
      tenureTiers: policy.tenureTiers?.length > 0
        ? policy.tenureTiers.map((t) => ({ ...t }))
        : [{ minYears: 0, vacationHours: 80, sickHours: 40, personalHours: 0 }],
      accrualCapMultiplier: {
        vacation: policy.accrualCapMultiplier?.vacation ?? 1.5,
        sick:     policy.accrualCapMultiplier?.sick     ?? 1.5,
        personal: policy.accrualCapMultiplier?.personal ?? 1.5,
      },
      carryoverLimits: {
        vacation: policy.carryoverLimits?.vacation ?? 40,
        sick:     policy.carryoverLimits?.sick     ?? 40,
        personal: policy.carryoverLimits?.personal ?? 0,
      },
      waitingPeriodDays: policy.waitingPeriodDays ?? 90,
    } : {
      accrualEnabled: false,
      tenureTiers: [{ minYears: 0, vacationHours: 80, sickHours: 40, personalHours: 0 }],
      accrualCapMultiplier: { vacation: 1.5, sick: 1.5, personal: 1.5 },
      carryoverLimits: { vacation: 40, sick: 40, personal: 0 },
      waitingPeriodDays: 90,
    });
    setPolicyOpen(true);
  };

  const addTier = () => {
    setPolicyForm((f) => ({
      ...f,
      tenureTiers: [...f.tenureTiers, { minYears: 0, vacationHours: 0, sickHours: 0, personalHours: 0 }],
    }));
  };

  const removeTier = (idx) => {
    setPolicyForm((f) => ({
      ...f,
      tenureTiers: f.tenureTiers.filter((_, i) => i !== idx),
    }));
  };

  const updateTier = (idx, field, value) => {
    setPolicyForm((f) => {
      const tiers = [...f.tenureTiers];
      tiers[idx] = { ...tiers[idx], [field]: Number(value) || 0 };
      return { ...f, tenureTiers: tiers };
    });
  };

  const savePolicy = async () => {
    setPolicySaving(true);
    try {
      const updated = await policyApi.updateLeavePolicy(policyForm);
      setPolicy(updated);
      setPolicyOpen(false);
      toast("Accrual policy saved");
    } catch (err) {
      toast(err.message || "Failed to save policy", "error");
    } finally {
      setPolicySaving(false);
    }
  };

  const submitCarryover = async () => {
    setCarryoverSaving(true);
    try {
      const result = await policyApi.runCarryover(carryoverYear);
      toast(`Carryover processed for ${result.processed} employees`);
      setCarryoverOpen(false);
      await load();
    } catch (err) {
      toast(err.message || "Carryover failed", "error");
    } finally {
      setCarryoverSaving(false);
    }
  };

  // ── render ──
  return (
    <Box className="lv-root">
      {/* Topbar */}
      <Box className="lv-topbar">
        <Box className="lv-topbar__inner">
          <Box>
            <Typography variant="h6" className="lv-topbar__title">Leave Management</Typography>
            <Typography className="lv-topbar__sub">
              {isPrivileged ? "Manage team leave requests and balances" : "Request time off and view your balances"}
            </Typography>
          </Box>
          <Typography sx={{ opacity: 0.7, fontSize: 13 }}>{currentYear}</Typography>
        </Box>
      </Box>

      <Box className="lv-main">
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Balance cards */}
            <Box className="lv-balances">
              {LEAVE_TYPES.map((t) => (
                <BalanceCard key={t} type={t} balances={myBalances} />
              ))}
            </Box>

            <Box className="lv-grid">
              {/* ── Left: form + my requests ── */}
              <Stack spacing={3}>

                {/* Request form */}
                <Paper elevation={0} className="lv-card">
                  <Typography variant="h6" className="lv-cardTitle">
                    {editingId ? "Edit Request" : "Request Time Off"}
                  </Typography>
                  <Typography className="lv-cardSub">
                    {editingId ? "Update your pending leave request" : "Submit a new leave request for approval"}
                  </Typography>

                  <Box component="form" onSubmit={handleSubmit}>
                    <Box className="lv-formGrid">
                      {/* Type */}
                      <Box className="lv-formGrid__full">
                        <Typography variant="caption" className="lv-label">
                          Leave Type <span className="lv-required">*</span>
                        </Typography>
                        <TextField
                          select fullWidth size="small"
                          value={form.type}
                          onChange={setField("type")}
                        >
                          {LEAVE_TYPES.map((t) => (
                            <MenuItem key={t} value={t}>{TYPE_LABEL[t]}</MenuItem>
                          ))}
                        </TextField>
                      </Box>

                      {/* Start date */}
                      <Box>
                        <Typography variant="caption" className="lv-label">
                          Start Date <span className="lv-required">*</span>
                        </Typography>
                        <TextField
                          type="date" fullWidth size="small"
                          value={form.startDate}
                          onChange={setField("startDate")}
                          inputProps={{ max: form.endDate || undefined }}
                        />
                      </Box>

                      {/* End date */}
                      <Box>
                        <Typography variant="caption" className="lv-label">
                          End Date <span className="lv-required">*</span>
                        </Typography>
                        <TextField
                          type="date" fullWidth size="small"
                          value={form.endDate}
                          onChange={setField("endDate")}
                          inputProps={{ min: form.startDate || undefined }}
                        />
                      </Box>

                      {/* Total hours — auto-calculated for vacation, manual for others */}
                      <Box className="lv-formGrid__full">
                        <Typography variant="caption" className="lv-label">
                          Total Hours {form.type !== "vacation" && <span className="lv-required">*</span>}
                        </Typography>
                        {form.type === "vacation" ? (
                          <Box sx={{
                            px: 1.5, py: 1, borderRadius: 1, border: "1px solid rgba(15,27,16,0.15)",
                            bgcolor: "rgba(15,27,16,0.03)", display: "flex", alignItems: "center", justifyContent: "space-between",
                          }}>
                            <Typography sx={{ fontSize: 13, color: "rgba(15,27,16,0.60)" }}>
                              {countWeekdays(form.startDate, form.endDate)} working day{countWeekdays(form.startDate, form.endDate) !== 1 ? "s" : ""} × 8h
                            </Typography>
                            <Typography sx={{ fontWeight: 900, fontSize: 15 }}>
                              {countWeekdays(form.startDate, form.endDate) * 8}h
                            </Typography>
                          </Box>
                        ) : (
                          <TextField
                            type="number" fullWidth size="small"
                            placeholder="e.g. 8"
                            value={form.totalHours}
                            onChange={setField("totalHours")}
                            inputProps={{ min: 0.25, step: 0.25 }}
                            onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
                          />
                        )}
                      </Box>

                      {/* Reason */}
                      <Box className="lv-formGrid__full">
                        <Typography variant="caption" className="lv-label">Reason (optional)</Typography>
                        <TextField
                          fullWidth size="small" multiline rows={2}
                          placeholder="Brief description..."
                          value={form.reason}
                          onChange={setField("reason")}
                          inputProps={{ maxLength: 500 }}
                        />
                      </Box>
                    </Box>

                    {formError && (
                      <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{formError}</Alert>
                    )}

                    <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                      <Button
                        type="submit" variant="contained" fullWidth
                        disabled={saving}
                        className="lv-submitBtn"
                      >
                        {saving ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : editingId ? "Update Request" : "Submit Request"}
                      </Button>
                      {editingId && (
                        <Button
                          variant="outlined" onClick={resetForm}
                          sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, px: 3 }}
                        >
                          Cancel
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </Paper>

                {/* My requests */}
                <Paper elevation={0} className="lv-card">
                  <Typography variant="h6" className="lv-cardTitle">My Requests</Typography>
                  <Typography className="lv-cardSub">Your leave requests for {currentYear}</Typography>

                  {myRequests.length === 0 ? (
                    <Box className="lv-empty">No leave requests yet</Box>
                  ) : (
                    <Stack spacing={1.5}>
                      {myRequests.map((req) => (
                        <Paper key={req.id} elevation={0} className="lv-requestRow">
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                            <Box sx={{ minWidth: 0 }}>
                              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                <Box sx={{ color: TYPE_COLOR[req.type] }}>{TYPE_ICON[req.type]}</Box>
                                <Typography className="lv-requestRow__type">{TYPE_LABEL[req.type]}</Typography>
                                <Chip
                                  size="small"
                                  label={capitalize(req.status)}
                                  color={STATUS_COLOR[req.status] ?? "default"}
                                  variant={req.status === "pending" ? "outlined" : "filled"}
                                  sx={{ fontSize: 10, height: 18 }}
                                />
                              </Stack>
                              <Typography className="lv-requestRow__dates">
                                {formatDate(req.startDate)} – {formatDate(req.endDate)}
                              </Typography>
                              {req.reason && (
                                <Typography className="lv-requestRow__reason">{req.reason}</Typography>
                              )}
                              {req.status === "denied" && req.reviewNote && (
                                <Paper elevation={0} className="lv-requestRow__note">
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: "error.main" }}>
                                    Reason: </Typography>
                                  <Typography variant="caption" sx={{ color: "error.dark" }}>
                                    {req.reviewNote}
                                  </Typography>
                                </Paper>
                              )}
                            </Box>
                            <Stack alignItems="flex-end" spacing={0.5} sx={{ flexShrink: 0 }}>
                              <Typography className="lv-requestRow__hours">{req.totalHours}h</Typography>
                              {req.status === "pending" && (
                                <Stack direction="row" spacing={0.5}>
                                  <IconButton size="small" onClick={() => startEdit(req)}>
                                    <EditOutlinedIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => handleCancel(req.id)} color="error">
                                    <DeleteOutlineOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              )}
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Paper>
              </Stack>

              {/* ── Right: team panel (managers) ── */}
              <Stack spacing={3}>

                {isPrivileged && (
                  <>
                    {/* Pending approvals */}
                    <Paper elevation={0} className="lv-card">
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
                        <Typography variant="h6" className="lv-cardTitle">Pending Approvals</Typography>
                        {teamRequests.length > 0 && (
                          <Chip size="small" label={teamRequests.length} color="warning" />
                        )}
                      </Stack>
                      <Typography className="lv-cardSub">Team requests awaiting your review</Typography>

                      {teamRequests.length === 0 ? (
                        <Box className="lv-empty">No pending requests</Box>
                      ) : (
                        <Stack spacing={1.5}>
                          {teamRequests.slice(0, 3).map((req) => (
                            <Paper key={req.id} elevation={0} className="lv-teamRow">
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography className="lv-teamRow__name">
                                    {req.employee?.firstName} {req.employee?.lastName}
                                  </Typography>
                                  <Typography className="lv-teamRow__meta">
                                    {TYPE_LABEL[req.type]} · {req.totalHours}h
                                  </Typography>
                                  <Typography className="lv-teamRow__meta">
                                    {formatDate(req.startDate)} – {formatDate(req.endDate)}
                                  </Typography>
                                  {req.reason && (
                                    <Typography className="lv-teamRow__meta" sx={{ mt: 0.5, fontStyle: "italic" }}>
                                      "{req.reason}"
                                    </Typography>
                                  )}
                                </Box>
                                <Stack spacing={0.75} sx={{ flexShrink: 0 }}>
                                  <Button
                                    size="small" variant="contained" color="success"
                                    startIcon={<CheckCircleOutlineIcon fontSize="small" />}
                                    onClick={() => openReview(req, "approve")}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: 12 }}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="small" variant="outlined" color="error"
                                    startIcon={<CancelOutlinedIcon fontSize="small" />}
                                    onClick={() => openReview(req, "deny")}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: 12 }}
                                  >
                                    Deny
                                  </Button>
                                </Stack>
                              </Stack>
                            </Paper>
                          ))}
                          {teamRequests.length >= 4 && (
                            <Button
                              fullWidth variant="outlined"
                              onClick={() => setAllPendingOpen(true)}
                              sx={{ mt: 1, borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                            >
                              +{teamRequests.length - 3} more
                            </Button>
                          )}
                        </Stack>
                      )}
                    </Paper>

                    {/* Manage allocations */}
                    <Paper elevation={0} className="lv-card">
                      <Typography variant="h6" className="lv-cardTitle">Manage Allocations</Typography>
                      <Typography className="lv-cardSub">Set annual leave hours for employees</Typography>
                      <Button
                        variant="outlined" fullWidth
                        onClick={() => { setAllocForm({ employeeId: "", type: "vacation", year: currentYear, allocated: "" }); setAllocError(""); setAllocOpen(true); }}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                      >
                        Set Employee Allocation
                      </Button>
                    </Paper>

                    {/* Accrual Policy (owner only) */}
                    {isOwner && (
                      <Paper elevation={0} className="lv-card">
                        <Typography variant="h6" className="lv-cardTitle">Accrual Policy</Typography>
                        <Typography className="lv-cardSub">
                          {policy?.accrualEnabled
                            ? "Per-pay-period accrual is enabled"
                            : "Accrual is currently disabled (lump-sum mode)"}
                        </Typography>
                        {policy && (
                          <Stack spacing={0.75} sx={{ my: 1.5 }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 700, opacity: 0.6 }}>TENURE TIERS</Typography>
                            {[...(policy.tenureTiers || [])].sort((a, b) => a.minYears - b.minYears).map((t, i) => (
                              <Typography key={i} sx={{ fontSize: 13 }}>
                                {t.minYears}+ yrs: {t.vacationHours}h vacation, {t.sickHours}h sick, {t.personalHours}h personal
                              </Typography>
                            ))}
                            <Divider sx={{ my: 0.5 }} />
                            <Typography sx={{ fontSize: 13 }}>
                              Cap: {policy.accrualCapMultiplier?.vacation ?? 1.5}x · Waiting: {policy.waitingPeriodDays ?? 90} days
                            </Typography>
                            <Typography sx={{ fontSize: 13 }}>
                              Carryover: {policy.carryoverLimits?.vacation ?? 0}h vac, {policy.carryoverLimits?.sick ?? 0}h sick, {policy.carryoverLimits?.personal ?? 0}h personal
                            </Typography>
                          </Stack>
                        )}
                        <Stack spacing={1}>
                          <Button
                            variant="outlined" fullWidth onClick={openPolicyDialog}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                          >
                            Configure Policy
                          </Button>
                          <Button
                            variant="outlined" fullWidth
                            onClick={() => setCarryoverOpen(true)}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                          >
                            Run Year-End Carryover
                          </Button>
                        </Stack>
                      </Paper>
                    )}
                  </>
                )}

                {/* Balance legend */}
                <Paper elevation={0} className="lv-card">
                  <Typography variant="h6" className="lv-cardTitle" sx={{ mb: 1.5 }}>How Balances Work</Typography>
                  <Stack spacing={1}>
                    {[
                      ["Allocated", "Total hours granted for the year"],
                      ["Used", "Hours from approved requests"],
                      ["Pending", "Hours awaiting approval"],
                      ["Remaining", "Allocated − Used − Pending"],
                    ].map(([label, desc]) => (
                      <Box key={label}>
                        <Typography sx={{ fontWeight: 800, fontSize: 13 }}>{label}</Typography>
                        <Typography sx={{ fontSize: 13, color: "rgba(15,27,16,0.60)" }}>{desc}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Stack>
            </Box>
          </>
        )}
      </Box>

      {/* Review dialog */}
      <Dialog
        open={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        PaperProps={{ sx: { borderRadius: "16px", minWidth: 360 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          {reviewTarget?.action === "approve" ? "Approve Request" : "Deny Request"}
        </DialogTitle>
        <DialogContent>
          {reviewTarget && (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 700 }}>
                {reviewTarget.request.employee?.firstName} {reviewTarget.request.employee?.lastName}
              </Typography>
              <Typography sx={{ fontSize: 13, color: "rgba(15,27,16,0.60)" }}>
                {TYPE_LABEL[reviewTarget.request.type]} · {reviewTarget.request.totalHours}h ·{" "}
                {formatDate(reviewTarget.request.startDate)} – {formatDate(reviewTarget.request.endDate)}
              </Typography>
            </Box>
          )}
          <TextField
            label={reviewTarget?.action === "deny" ? "Reason for denial (optional)" : "Note (optional)"}
            fullWidth multiline rows={3} size="small"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            inputProps={{ maxLength: 500 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setReviewTarget(null)} sx={{ textTransform: "none", fontWeight: 800 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={reviewTarget?.action === "approve" ? "success" : "error"}
            disabled={reviewing}
            onClick={submitReview}
            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
          >
            {reviewing
              ? <CircularProgress size={16} sx={{ color: "#fff" }} />
              : reviewTarget?.action === "approve" ? "Approve" : "Deny"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Allocation dialog */}
      <Dialog
        open={allocOpen}
        onClose={() => setAllocOpen(false)}
        PaperProps={{ sx: { borderRadius: "16px", minWidth: 380 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Set Leave Allocation</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              select label="Employee" fullWidth size="small"
              value={allocForm.employeeId}
              onChange={(e) => setAllocForm((f) => ({ ...f, employeeId: e.target.value }))}
            >
              {employees.map((emp) => (
                <MenuItem key={emp._id || emp.id} value={emp._id || emp.id}>
                  {emp.firstName} {emp.lastName}
                  {emp.employeeMeta?.jobTitle ? ` — ${emp.employeeMeta.jobTitle}` : ""}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select label="Leave Type" fullWidth size="small"
              value={allocForm.type}
              onChange={(e) => setAllocForm((f) => ({ ...f, type: e.target.value }))}
            >
              {LEAVE_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{TYPE_LABEL[t]}</MenuItem>
              ))}
            </TextField>
            <TextField
              select label="Year" fullWidth size="small"
              value={allocForm.year}
              onChange={(e) => setAllocForm((f) => ({ ...f, year: parseInt(e.target.value, 10) }))}
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Allocated Hours" type="number" fullWidth size="small"
              placeholder="e.g. 80"
              value={allocForm.allocated}
              onChange={(e) => setAllocForm((f) => ({ ...f, allocated: e.target.value }))}
              inputProps={{ min: 0, step: 8 }}
              onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
            />
            {allocError && <Alert severity="error" sx={{ borderRadius: 2 }}>{allocError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setAllocOpen(false)} sx={{ textTransform: "none", fontWeight: 800 }}>
            Cancel
          </Button>
          <Button
            variant="contained" disabled={allocSaving} onClick={submitAllocation}
            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, bgcolor: "#163A2E" }}
          >
            {allocSaving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* All Pending Requests modal */}
      <Dialog
        open={allPendingOpen}
        onClose={() => setAllPendingOpen(false)}
        PaperProps={{ sx: { borderRadius: "16px", minWidth: 480, maxWidth: 600 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          All Pending Requests ({teamRequests.length})
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: 520, overflowY: "auto" }}>
          {teamRequests.length === 0 ? (
            <Typography sx={{ color: "text.secondary", py: 2, textAlign: "center" }}>
              No pending requests
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {teamRequests.map((req) => (
                <Paper key={req.id} elevation={0} className="lv-teamRow">
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography className="lv-teamRow__name">
                        {req.employee?.firstName} {req.employee?.lastName}
                      </Typography>
                      <Typography className="lv-teamRow__meta">
                        {TYPE_LABEL[req.type]} · {req.totalHours}h
                      </Typography>
                      <Typography className="lv-teamRow__meta">
                        {formatDate(req.startDate)} – {formatDate(req.endDate)}
                      </Typography>
                      {req.reason && (
                        <Typography className="lv-teamRow__meta" sx={{ mt: 0.5, fontStyle: "italic" }}>
                          "{req.reason}"
                        </Typography>
                      )}
                    </Box>
                    <Stack spacing={0.75} sx={{ flexShrink: 0 }}>
                      <Button size="small" variant="contained" color="success"
                        startIcon={<CheckCircleOutlineIcon fontSize="small" />}
                        onClick={() => { setAllPendingOpen(false); openReview(req, "approve"); }}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: 12 }}>
                        Approve
                      </Button>
                      <Button size="small" variant="outlined" color="error"
                        startIcon={<CancelOutlinedIcon fontSize="small" />}
                        onClick={() => { setAllPendingOpen(false); openReview(req, "deny"); }}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: 12 }}>
                        Deny
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAllPendingOpen(false)} sx={{ textTransform: "none", fontWeight: 800 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Accrual Policy dialog */}
      <Dialog
        open={policyOpen}
        onClose={() => setPolicyOpen(false)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Accrual Policy Configuration</DialogTitle>
        <DialogContent dividers>
          {policyForm && (
            <Stack spacing={2.5} sx={{ pt: 0.5 }}>
              {/* Enable toggle */}
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Enable Per-Pay-Period Accrual</Typography>
                  <Typography sx={{ fontSize: 12, color: "rgba(15,27,16,0.55)" }}>
                    When disabled, allocations are set manually (lump sum)
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant={policyForm.accrualEnabled ? "contained" : "outlined"}
                  onClick={() => setPolicyForm((f) => ({ ...f, accrualEnabled: !f.accrualEnabled }))}
                  sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, minWidth: 80,
                    ...(policyForm.accrualEnabled ? { bgcolor: "#163A2E" } : {}) }}
                >
                  {policyForm.accrualEnabled ? "Enabled" : "Disabled"}
                </Button>
              </Stack>

              <Divider />

              {/* Tenure Tiers */}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 14 }}>Tenure Tiers</Typography>
                  <IconButton size="small" onClick={addTier} color="primary">
                    <AddCircleOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
                <Typography sx={{ fontSize: 12, color: "rgba(15,27,16,0.55)", mb: 1.5 }}>
                  Employees get the allocation from the highest tier they qualify for based on years of service
                </Typography>
                {policyForm.tenureTiers.map((tier, idx) => (
                  <Stack key={idx} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <TextField
                      size="small" type="number" label="Min Years" sx={{ width: 90 }}
                      value={tier.minYears} onChange={(e) => updateTier(idx, "minYears", e.target.value)}
                      inputProps={{ min: 0 }}
                    />
                    <TextField
                      size="small" type="number" label="Vacation (h)" sx={{ width: 110 }}
                      value={tier.vacationHours} onChange={(e) => updateTier(idx, "vacationHours", e.target.value)}
                      inputProps={{ min: 0 }}
                    />
                    <TextField
                      size="small" type="number" label="Sick (h)" sx={{ width: 90 }}
                      value={tier.sickHours} onChange={(e) => updateTier(idx, "sickHours", e.target.value)}
                      inputProps={{ min: 0 }}
                    />
                    <TextField
                      size="small" type="number" label="Personal (h)" sx={{ width: 110 }}
                      value={tier.personalHours} onChange={(e) => updateTier(idx, "personalHours", e.target.value)}
                      inputProps={{ min: 0 }}
                    />
                    <IconButton
                      size="small" onClick={() => removeTier(idx)}
                      disabled={policyForm.tenureTiers.length <= 1}
                      color="error"
                    >
                      <RemoveCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Box>

              <Divider />

              {/* Accrual Caps */}
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 0.5 }}>Accrual Cap Multiplier</Typography>
                <Typography sx={{ fontSize: 12, color: "rgba(15,27,16,0.55)", mb: 1.5 }}>
                  Stop accruing when balance reaches annual allocation x multiplier
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  {LEAVE_TYPES.map((t) => (
                    <TextField
                      key={t} size="small" type="number" label={capitalize(t)}
                      value={policyForm.accrualCapMultiplier[t]}
                      onChange={(e) => setPolicyForm((f) => ({
                        ...f,
                        accrualCapMultiplier: { ...f.accrualCapMultiplier, [t]: Number(e.target.value) || 0 },
                      }))}
                      inputProps={{ min: 1, step: 0.1 }}
                      sx={{ flex: 1 }}
                    />
                  ))}
                </Stack>
              </Box>

              <Divider />

              {/* Carryover Limits */}
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 0.5 }}>Carryover Limits (hours)</Typography>
                <Typography sx={{ fontSize: 12, color: "rgba(15,27,16,0.55)", mb: 1.5 }}>
                  Max unused hours that roll into the next year (0 = use-it-or-lose-it)
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  {LEAVE_TYPES.map((t) => (
                    <TextField
                      key={t} size="small" type="number" label={capitalize(t)}
                      value={policyForm.carryoverLimits[t]}
                      onChange={(e) => setPolicyForm((f) => ({
                        ...f,
                        carryoverLimits: { ...f.carryoverLimits, [t]: Number(e.target.value) || 0 },
                      }))}
                      inputProps={{ min: 0, step: 8 }}
                      sx={{ flex: 1 }}
                    />
                  ))}
                </Stack>
              </Box>

              <Divider />

              {/* Waiting Period */}
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 0.5 }}>Waiting Period</Typography>
                <Typography sx={{ fontSize: 12, color: "rgba(15,27,16,0.55)", mb: 1 }}>
                  No accrual during the first N days of employment
                </Typography>
                <TextField
                  size="small" type="number" label="Days"
                  value={policyForm.waitingPeriodDays}
                  onChange={(e) => setPolicyForm((f) => ({ ...f, waitingPeriodDays: Number(e.target.value) || 0 }))}
                  inputProps={{ min: 0 }}
                  sx={{ width: 120 }}
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setPolicyOpen(false)} sx={{ textTransform: "none", fontWeight: 800 }}>Cancel</Button>
          <Button
            variant="contained" onClick={savePolicy} disabled={policySaving}
            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, bgcolor: "#163A2E" }}
          >
            {policySaving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Save Policy"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Carryover dialog */}
      <Dialog
        open={carryoverOpen}
        onClose={() => setCarryoverOpen(false)}
        PaperProps={{ sx: { borderRadius: "16px", minWidth: 360 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Run Year-End Carryover</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: "rgba(15,27,16,0.60)", mb: 2 }}>
            This will carry unused hours from the selected year into the next year,
            up to the configured carryover limits. Hours above the limit are forfeited.
          </Typography>
          <TextField
            select label="From Year" fullWidth size="small"
            value={carryoverYear}
            onChange={(e) => setCarryoverYear(parseInt(e.target.value, 10))}
          >
            {[currentYear - 2, currentYear - 1, currentYear].map((y) => (
              <MenuItem key={y} value={y}>{y} &rarr; {y + 1}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCarryoverOpen(false)} sx={{ textTransform: "none", fontWeight: 800 }}>Cancel</Button>
          <Button
            variant="contained" onClick={submitCarryover} disabled={carryoverSaving}
            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, bgcolor: "#163A2E" }}
          >
            {carryoverSaving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Run Carryover"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
