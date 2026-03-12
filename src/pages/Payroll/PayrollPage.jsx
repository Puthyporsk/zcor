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
  Tooltip,
} from "@mui/material";

import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import { useAuth } from "../../context/AuthContext";
import * as payrollApi from "../../api/payroll";
import "../../styles/payroll.css";

// ─── helpers ────────────────────────────────────────────────

const STATUS_COLOR = {
  draft: "default",
  reviewed: "info",
  approved: "warning",
  paid: "success",
};

const STATUS_LABEL = {
  draft: "Draft",
  reviewed: "Reviewed",
  approved: "Approved",
  paid: "Paid",
};

const FREQ_LABEL = { biweekly: "Biweekly", monthly: "Monthly" };

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso.slice(0, 10) + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatCurrency = (n) => {
  if (n == null) return "$0.00";
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const nextAction = (status) => {
  if (status === "draft") return { action: "review", label: "Mark as Reviewed", color: "info" };
  if (status === "reviewed") return { action: "approve", label: "Approve", color: "warning" };
  if (status === "approved") return { action: "pay", label: "Mark as Paid", color: "success" };
  return null;
};

// ─── Page ───────────────────────────────────────────────────

export default function PayrollPage() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  // ── data ──
  const [periods, setPeriods] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // ── detail view ──
  const [selectedPeriod, setSelectedPeriod] = React.useState(null);
  const [payslips, setPayslips] = React.useState([]);
  const [detailLoading, setDetailLoading] = React.useState(false);

  // ── create dialog ──
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createForm, setCreateForm] = React.useState({ startDate: "", endDate: "", frequency: "biweekly" });
  const [createError, setCreateError] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  // ── payslip detail dialog ──
  const [slipDetail, setSlipDetail] = React.useState(null);

  // ── adjust dialog ──
  const [adjustOpen, setAdjustOpen] = React.useState(false);
  const [adjustForm, setAdjustForm] = React.useState({ regularHours: "", overtimeHours: "", paidLeaveHours: "", note: "" });
  const [adjustTarget, setAdjustTarget] = React.useState(null);
  const [adjusting, setAdjusting] = React.useState(false);
  const [adjustError, setAdjustError] = React.useState("");

  // ── snackbar ──
  const [snack, setSnack] = React.useState({ open: false, msg: "", severity: "success" });
  const toast = (msg, severity = "success") => setSnack({ open: true, msg, severity });

  // ── load periods ──
  const loadPeriods = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await payrollApi.getPayPeriods();
      setPeriods(data);
    } catch (e) {
      toast(e.message || "Failed to load pay periods", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadPeriods(); }, [loadPeriods]);

  // ── load detail ──
  const openDetail = async (period) => {
    setSelectedPeriod(period);
    setDetailLoading(true);
    try {
      const data = await payrollApi.getPayPeriod(period.id);
      setSelectedPeriod(data.payPeriod);
      setPayslips(data.payslips);
    } catch (e) {
      toast(e.message || "Failed to load pay period", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const goBack = () => {
    setSelectedPeriod(null);
    setPayslips([]);
    loadPeriods();
  };

  // ── create ──
  const handleCreate = async () => {
    setCreateError("");
    if (!createForm.startDate) return setCreateError("Start date is required");
    if (!createForm.endDate) return setCreateError("End date is required");
    if (createForm.endDate <= createForm.startDate) return setCreateError("End date must be after start date");

    setCreating(true);
    try {
      const result = await payrollApi.createPayPeriod(createForm);
      toast(`Pay period created with ${result.payslipCount} payslip(s)`);
      setCreateOpen(false);
      setCreateForm({ startDate: "", endDate: "", frequency: "biweekly" });
      await loadPeriods();
    } catch (e) {
      setCreateError(e.message || "Failed to create pay period");
    } finally {
      setCreating(false);
    }
  };

  // ── status transition ──
  const handleStatusChange = async (periodId, action) => {
    try {
      await payrollApi.updatePayPeriodStatus(periodId, action);
      toast(`Pay period ${action === "review" ? "reviewed" : action === "approve" ? "approved" : "marked as paid"}`);
      if (selectedPeriod) {
        await openDetail({ id: periodId });
      } else {
        await loadPeriods();
      }
    } catch (e) {
      toast(e.message || "Failed to update status", "error");
    }
  };

  // ── recalculate ──
  const handleRecalculate = async (periodId) => {
    try {
      const result = await payrollApi.recalculatePayPeriod(periodId);
      toast(`${result.count} payslip(s) recalculated`);
      if (selectedPeriod) await openDetail({ id: periodId });
    } catch (e) {
      toast(e.message || "Failed to recalculate", "error");
    }
  };

  // ── delete ──
  const handleDelete = async (periodId) => {
    try {
      await payrollApi.deletePayPeriod(periodId);
      toast("Pay period deleted");
      if (selectedPeriod) goBack();
      else await loadPeriods();
    } catch (e) {
      toast(e.message || "Failed to delete", "error");
    }
  };

  // ── adjust payslip ──
  const openAdjust = (slip) => {
    setAdjustTarget(slip);
    setAdjustForm({
      regularHours: String(slip.regularHours),
      overtimeHours: String(slip.overtimeHours),
      paidLeaveHours: String(slip.paidLeaveHours),
      note: "",
    });
    setAdjustError("");
    setAdjustOpen(true);
  };

  const submitAdjust = async () => {
    setAdjustError("");
    setAdjusting(true);
    try {
      await payrollApi.adjustPayslip(adjustTarget.id, {
        regularHours: parseFloat(adjustForm.regularHours) || 0,
        overtimeHours: parseFloat(adjustForm.overtimeHours) || 0,
        paidLeaveHours: parseFloat(adjustForm.paidLeaveHours) || 0,
        note: adjustForm.note || undefined,
      });
      toast("Payslip adjusted");
      setAdjustOpen(false);
      if (selectedPeriod) await openDetail({ id: selectedPeriod.id });
    } catch (e) {
      setAdjustError(e.message || "Failed to adjust");
    } finally {
      setAdjusting(false);
    }
  };

  // ── compute summary stats ──
  const totalGross = payslips.reduce((s, p) => s + (p.grossPay || 0), 0);
  const totalNet = payslips.reduce((s, p) => s + (p.netPay || 0), 0);
  const totalEmployerCosts = payslips.reduce((s, p) => s + (p.totalEmployerCosts || 0), 0);

  // ── render ──
  return (
    <Box className="pr-root">
      {/* Topbar */}
      <Box className="pr-topbar">
        <Box className="pr-topbar__inner">
          <Box>
            <Typography variant="h6" className="pr-topbar__title">Payroll</Typography>
            <Typography className="pr-topbar__sub">
              {selectedPeriod ? `${formatDate(selectedPeriod.startDate)} - ${formatDate(selectedPeriod.endDate)}` : "Manage pay periods and payslips"}
            </Typography>
          </Box>
          {!selectedPeriod && (
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => { setCreateForm({ startDate: "", endDate: "", frequency: "biweekly" }); setCreateError(""); setCreateOpen(true); }}
              sx={{
                borderRadius: 999, textTransform: "none", fontWeight: 800,
                bgcolor: "rgba(255,255,255,0.15)", color: "#fff",
                "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
              }}
            >
              New Pay Period
            </Button>
          )}
          {selectedPeriod && (
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={goBack}
              sx={{ color: "#fff", textTransform: "none", fontWeight: 800 }}
            >
              Back
            </Button>
          )}
        </Box>
      </Box>

      <Box className="pr-main">
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
            <CircularProgress />
          </Box>
        ) : selectedPeriod ? (
          /* ── Detail View ── */
          <>
            {detailLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* Summary stats */}
                <Box className="pr-summary">
                  <Paper elevation={0} className="pr-statCard">
                    <Typography className="pr-statCard__label">Employees</Typography>
                    <Typography className="pr-statCard__value">{payslips.length}</Typography>
                  </Paper>
                  <Paper elevation={0} className="pr-statCard">
                    <Typography className="pr-statCard__label">Total Gross</Typography>
                    <Typography className="pr-statCard__value">{formatCurrency(totalGross)}</Typography>
                  </Paper>
                  <Paper elevation={0} className="pr-statCard">
                    <Typography className="pr-statCard__label">Total Net</Typography>
                    <Typography className="pr-statCard__value">{formatCurrency(totalNet)}</Typography>
                  </Paper>
                  <Paper elevation={0} className="pr-statCard">
                    <Typography className="pr-statCard__label">Employer Costs</Typography>
                    <Typography className="pr-statCard__value">{formatCurrency(totalEmployerCosts)}</Typography>
                  </Paper>
                </Box>

                {/* Actions bar */}
                <Paper elevation={0} className="pr-card" sx={{ mb: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography sx={{ fontWeight: 800 }}>Status:</Typography>
                      <Chip
                        label={STATUS_LABEL[selectedPeriod.status]}
                        color={STATUS_COLOR[selectedPeriod.status]}
                        size="small"
                        sx={{ fontWeight: 800 }}
                      />
                      <Typography sx={{ fontSize: 13, color: "rgba(15,27,16,0.55)" }}>
                        {FREQ_LABEL[selectedPeriod.frequency]}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {["draft", "reviewed"].includes(selectedPeriod.status) && (
                        <Tooltip title="Recalculate all payslips from latest time entries">
                          <Button
                            size="small" variant="outlined"
                            startIcon={<RefreshOutlinedIcon />}
                            onClick={() => handleRecalculate(selectedPeriod.id)}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                          >
                            Recalculate
                          </Button>
                        </Tooltip>
                      )}
                      {(() => {
                        const na = nextAction(selectedPeriod.status);
                        if (!na) return null;
                        if ((na.action === "approve" || na.action === "pay") && !isOwner) return null;
                        return (
                          <Button
                            size="small" variant="contained" color={na.color}
                            startIcon={<CheckCircleOutlineIcon />}
                            onClick={() => handleStatusChange(selectedPeriod.id, na.action)}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                          >
                            {na.label}
                          </Button>
                        );
                      })()}
                      {selectedPeriod.status === "draft" && isOwner && (
                        <Button
                          size="small" variant="outlined" color="error"
                          startIcon={<DeleteOutlineOutlinedIcon />}
                          onClick={() => handleDelete(selectedPeriod.id)}
                          sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                        >
                          Delete
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Paper>

                {/* Payslips list */}
                <Paper elevation={0} className="pr-card">
                  <Typography variant="h6" className="pr-cardTitle">Payslips</Typography>
                  <Typography className="pr-cardSub">{payslips.length} employee(s) in this pay period</Typography>

                  {payslips.length === 0 ? (
                    <Box className="pr-empty">No payslips generated</Box>
                  ) : (
                    <Stack spacing={1.5}>
                      {payslips.map((slip) => (
                        <Paper
                          key={slip.id}
                          elevation={0}
                          className="pr-slipRow"
                          onClick={() => setSlipDetail(slip)}
                          sx={{ cursor: "pointer" }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography className="pr-slipRow__name">
                                {slip.employee?.firstName} {slip.employee?.lastName}
                              </Typography>
                              <Typography className="pr-slipRow__meta">
                                {capitalize(slip.payType)} · {slip.totalHours}h ({slip.regularHours} reg + {slip.overtimeHours} OT + {slip.paidLeaveHours} leave)
                              </Typography>
                            </Box>
                            <Stack alignItems="flex-end" spacing={0.25}>
                              <Typography className="pr-slipRow__amount">{formatCurrency(slip.netPay)}</Typography>
                              <Typography className="pr-slipRow__meta">
                                Gross: {formatCurrency(slip.grossPay)}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Paper>
              </>
            )}
          </>
        ) : (
          /* ── List View ── */
          <>
            {periods.length === 0 ? (
              <Paper elevation={0} className="pr-card">
                <Box className="pr-empty">
                  <PaymentsOutlinedIcon sx={{ fontSize: 48, color: "rgba(15,27,16,0.20)", mb: 1 }} />
                  <Typography>No pay periods yet. Create one to get started.</Typography>
                </Box>
              </Paper>
            ) : (
              <Stack spacing={1.5}>
                {periods.map((p) => (
                  <Paper
                    key={p.id}
                    elevation={0}
                    className="pr-periodRow"
                    onClick={() => openDetail(p)}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                          <Typography className="pr-periodRow__title">
                            {formatDate(p.startDate)} - {formatDate(p.endDate)}
                          </Typography>
                          <Chip
                            size="small"
                            label={STATUS_LABEL[p.status]}
                            color={STATUS_COLOR[p.status]}
                            sx={{ fontSize: 10, height: 18, fontWeight: 800 }}
                          />
                        </Stack>
                        <Typography className="pr-periodRow__meta">
                          {FREQ_LABEL[p.frequency]} · Created by {p.createdBy?.firstName} {p.createdBy?.lastName}
                        </Typography>
                      </Box>
                      {p.paidAt && (
                        <Typography className="pr-periodRow__meta">
                          Paid {formatDate(p.paidAt)}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </>
        )}
      </Box>

      {/* Create Pay Period Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        PaperProps={{ sx: { borderRadius: "16px", minWidth: 400 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>New Pay Period</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              select label="Frequency" fullWidth size="small"
              value={createForm.frequency}
              onChange={(e) => setCreateForm((f) => ({ ...f, frequency: e.target.value }))}
            >
              <MenuItem value="biweekly">Biweekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </TextField>
            <TextField
              type="date" label="Start Date" fullWidth size="small"
              value={createForm.startDate}
              onChange={(e) => setCreateForm((f) => ({ ...f, startDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date" label="End Date" fullWidth size="small"
              value={createForm.endDate}
              onChange={(e) => setCreateForm((f) => ({ ...f, endDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: createForm.startDate || undefined }}
            />
            {createError && <Alert severity="error" sx={{ borderRadius: 2 }}>{createError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ textTransform: "none", fontWeight: 800 }}>
            Cancel
          </Button>
          <Button
            variant="contained" disabled={creating} onClick={handleCreate}
            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, bgcolor: "#163A2E" }}
          >
            {creating ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payslip Detail Dialog */}
      <Dialog
        open={Boolean(slipDetail)}
        onClose={() => setSlipDetail(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        {slipDetail && (
          <>
            <DialogTitle sx={{ fontWeight: 900 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <span>{slipDetail.employee?.firstName} {slipDetail.employee?.lastName}</span>
                {["draft", "reviewed"].includes(selectedPeriod?.status) && (
                  <Tooltip title="Adjust hours">
                    <IconButton size="small" onClick={() => { setSlipDetail(null); openAdjust(slipDetail); }}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              {/* Hours */}
              <Typography className="pr-sectionTitle">Hours</Typography>
              <Box className="pr-deductionRow">
                <Typography className="pr-deductionRow__name">Regular Hours</Typography>
                <Typography className="pr-deductionRow__amount">{slipDetail.regularHours}h</Typography>
              </Box>
              <Box className="pr-deductionRow">
                <Typography className="pr-deductionRow__name">Overtime Hours</Typography>
                <Typography className="pr-deductionRow__amount">{slipDetail.overtimeHours}h</Typography>
              </Box>
              <Box className="pr-deductionRow">
                <Typography className="pr-deductionRow__name">Paid Leave Hours</Typography>
                <Typography className="pr-deductionRow__amount">{slipDetail.paidLeaveHours}h</Typography>
              </Box>
              <Box className="pr-deductionRow" sx={{ borderBottom: "none !important" }}>
                <Typography className="pr-deductionRow__name" sx={{ fontWeight: "800 !important" }}>Total Hours</Typography>
                <Typography className="pr-deductionRow__amount">{slipDetail.totalHours}h</Typography>
              </Box>

              {/* Pay */}
              <Box className="pr-section">
                <Typography className="pr-sectionTitle">Earnings</Typography>
                <Box className="pr-deductionRow">
                  <Typography className="pr-deductionRow__name">
                    {slipDetail.payType === "hourly"
                      ? `Regular Pay (${slipDetail.regularHours + slipDetail.paidLeaveHours}h x ${formatCurrency(slipDetail.payRate)})`
                      : "Salary (per period)"}
                  </Typography>
                  <Typography className="pr-deductionRow__amount">{formatCurrency(slipDetail.regularPay)}</Typography>
                </Box>
                {slipDetail.overtimePay > 0 && (
                  <Box className="pr-deductionRow">
                    <Typography className="pr-deductionRow__name">
                      Overtime Pay ({slipDetail.overtimeHours}h x {formatCurrency(slipDetail.otRate)})
                    </Typography>
                    <Typography className="pr-deductionRow__amount">{formatCurrency(slipDetail.overtimePay)}</Typography>
                  </Box>
                )}
                <Box className="pr-totalLine">
                  <Typography className="pr-totalLine__label">Gross Pay</Typography>
                  <Typography className="pr-totalLine__value">{formatCurrency(slipDetail.grossPay)}</Typography>
                </Box>
              </Box>

              {/* Deductions */}
              <Box className="pr-section">
                <Typography className="pr-sectionTitle">Deductions</Typography>
                {(slipDetail.deductions || []).map((d, i) => (
                  <Box className="pr-deductionRow" key={i}>
                    <Typography className="pr-deductionRow__name">
                      {d.name}
                      {d.preTax && <Chip label="Pre-tax" size="small" sx={{ ml: 0.5, fontSize: 9, height: 16 }} />}
                    </Typography>
                    <Typography className="pr-deductionRow__amount" sx={{ color: "#c62828 !important" }}>
                      -{formatCurrency(d.amount)}
                    </Typography>
                  </Box>
                ))}
                <Box className="pr-totalLine">
                  <Typography className="pr-totalLine__label">Total Deductions</Typography>
                  <Typography className="pr-totalLine__value" sx={{ color: "#c62828" }}>
                    -{formatCurrency(slipDetail.totalDeductions)}
                  </Typography>
                </Box>
              </Box>

              {/* Net Pay */}
              <Box className="pr-totalLine" sx={{ borderTopWidth: 3, mt: 2, pt: 2 }}>
                <Typography className="pr-totalLine__label" sx={{ fontSize: "18px !important" }}>Net Pay</Typography>
                <Typography className="pr-totalLine__value" sx={{ fontSize: "22px !important", color: "#163A2E" }}>
                  {formatCurrency(slipDetail.netPay)}
                </Typography>
              </Box>

              {/* Leave Accrual */}
              {slipDetail.leaveAccrual && (
                <Box className="pr-section">
                  <Typography className="pr-sectionTitle">Leave Hours Accrual</Typography>
                  {["vacation", "sick", "personal"].map((type) => {
                    const data = slipDetail.leaveAccrual[type];
                    if (!data) return null;
                    const label = type === "vacation" ? "Vacation" : type === "sick" ? "Sick" : "Personal";
                    return (
                      <Box className="pr-deductionRow" key={type}>
                        <Box>
                          <Typography className="pr-deductionRow__name">{label}</Typography>
                          <Typography sx={{ fontSize: 11, color: "rgba(15,27,16,0.50)" }}>
                            {data.remaining.toFixed(1)}h remaining of {data.allocated.toFixed(1)}h
                            {data.note && ` · ${data.note}`}
                          </Typography>
                        </Box>
                        <Typography className="pr-deductionRow__amount" sx={{ color: data.accrued > 0 ? "#1b7a53" : undefined }}>
                          +{data.accrued.toFixed(2)}h
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* Employer costs */}
              {(slipDetail.employerCosts || []).length > 0 && (
                <Box className="pr-section">
                  <Typography className="pr-sectionTitle">Employer Costs (not deducted from pay)</Typography>
                  {slipDetail.employerCosts.map((c, i) => (
                    <Box className="pr-deductionRow" key={i}>
                      <Typography className="pr-deductionRow__name">{c.name}</Typography>
                      <Typography className="pr-deductionRow__amount">{formatCurrency(c.amount)}</Typography>
                    </Box>
                  ))}
                  <Box className="pr-totalLine">
                    <Typography className="pr-totalLine__label">Total Employer Cost</Typography>
                    <Typography className="pr-totalLine__value">{formatCurrency(slipDetail.totalEmployerCosts)}</Typography>
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setSlipDetail(null)} sx={{ textTransform: "none", fontWeight: 800 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Adjust Payslip Dialog */}
      <Dialog
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        PaperProps={{ sx: { borderRadius: "16px", minWidth: 380 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Adjust Payslip</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: "rgba(15,27,16,0.60)", mb: 2 }}>
            {adjustTarget?.employee?.firstName} {adjustTarget?.employee?.lastName} — Adjust hours and recalculate pay
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Regular Hours" type="number" fullWidth size="small"
              value={adjustForm.regularHours}
              onChange={(e) => setAdjustForm((f) => ({ ...f, regularHours: e.target.value }))}
              inputProps={{ min: 0, step: 0.25 }}
            />
            <TextField
              label="Overtime Hours" type="number" fullWidth size="small"
              value={adjustForm.overtimeHours}
              onChange={(e) => setAdjustForm((f) => ({ ...f, overtimeHours: e.target.value }))}
              inputProps={{ min: 0, step: 0.25 }}
            />
            <TextField
              label="Paid Leave Hours" type="number" fullWidth size="small"
              value={adjustForm.paidLeaveHours}
              onChange={(e) => setAdjustForm((f) => ({ ...f, paidLeaveHours: e.target.value }))}
              inputProps={{ min: 0, step: 0.25 }}
            />
            <TextField
              label="Adjustment Note (optional)" fullWidth size="small" multiline rows={2}
              value={adjustForm.note}
              onChange={(e) => setAdjustForm((f) => ({ ...f, note: e.target.value }))}
              inputProps={{ maxLength: 500 }}
            />
            {adjustError && <Alert severity="error" sx={{ borderRadius: 2 }}>{adjustError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setAdjustOpen(false)} sx={{ textTransform: "none", fontWeight: 800 }}>
            Cancel
          </Button>
          <Button
            variant="contained" disabled={adjusting} onClick={submitAdjust}
            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, bgcolor: "#163A2E" }}
          >
            {adjusting ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Recalculate & Save"}
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
