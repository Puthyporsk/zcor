import React from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

import { useAuth } from "../../context/AuthContext";
import * as payrollApi from "../../api/payroll";
import "../../styles/payroll.css";

// ─── helpers ────────────────────────────────────────────────

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso.slice(0, 10) + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatCurrency = (n) => {
  if (n == null) return "$0.00";
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const FREQ_LABEL = { biweekly: "Biweekly", monthly: "Monthly" };
const STATUS_COLOR = { approved: "warning", paid: "success" };

// ─── Page ───────────────────────────────────────────────────

export default function PayslipsPage() {
  const { user } = useAuth();

  const [payslips, setPayslips] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState(null);

  const [snack, setSnack] = React.useState({ open: false, msg: "", severity: "success" });
  const toast = (msg, severity = "success") => setSnack({ open: true, msg, severity });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await payrollApi.getMyPayslips();
      setPayslips(data);
    } catch (e) {
      toast(e.message || "Failed to load payslips", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const openDetail = async (slip) => {
    try {
      const full = await payrollApi.getPayslip(slip.id);
      setDetail(full);
    } catch (e) {
      toast(e.message || "Failed to load payslip", "error");
    }
  };

  return (
    <Box className="pr-root">
      {/* Topbar */}
      <Box className="pr-topbar">
        <Box className="pr-topbar__inner">
          <Box>
            <Typography variant="h6" className="pr-topbar__title">My Payslips</Typography>
            <Typography className="pr-topbar__sub">View your pay history</Typography>
          </Box>
        </Box>
      </Box>

      <Box className="pr-main">
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
            <CircularProgress />
          </Box>
        ) : payslips.length === 0 ? (
          <Paper elevation={0} className="pr-card">
            <Box className="pr-empty">No payslips available yet</Box>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {payslips.map((slip) => (
              <Paper
                key={slip.id}
                elevation={0}
                className="pr-empSlip"
                onClick={() => openDetail(slip)}
                sx={{ cursor: "pointer", transition: "box-shadow 0.15s", "&:hover": { boxShadow: "0 6px 20px rgba(15,27,16,0.12) !important" } }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                      <Typography className="pr-empSlip__period">
                        {formatDate(slip.payPeriod?.startDate)} - {formatDate(slip.payPeriod?.endDate)}
                      </Typography>
                      <Chip
                        size="small"
                        label={slip.payPeriod?.status === "paid" ? "Paid" : "Approved"}
                        color={STATUS_COLOR[slip.payPeriod?.status] || "default"}
                        sx={{ fontSize: 10, height: 18, fontWeight: 800 }}
                      />
                    </Stack>
                    <Typography className="pr-empSlip__dates">
                      {FREQ_LABEL[slip.payPeriod?.frequency] || slip.payPeriod?.frequency} · {slip.totalHours}h total
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography className="pr-empSlip__net">{formatCurrency(slip.netPay)}</Typography>
                    <Typography sx={{ fontSize: 12, color: "rgba(15,27,16,0.55)" }}>
                      Gross: {formatCurrency(slip.grossPay)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      {/* Detail Dialog */}
      <Dialog
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        {detail && (
          <>
            <DialogTitle sx={{ fontWeight: 900 }}>
              Payslip Details
            </DialogTitle>
            <DialogContent dividers>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>
                    {formatDate(detail.payPeriod?.startDate)} - {formatDate(detail.payPeriod?.endDate)}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: "rgba(15,27,16,0.55)" }}>
                    {FREQ_LABEL[detail.payPeriod?.frequency] || detail.payPeriod?.frequency}
                  </Typography>
                </Box>
                <Chip
                  label={detail.payPeriod?.status === "paid" ? "Paid" : "Approved"}
                  color={STATUS_COLOR[detail.payPeriod?.status] || "default"}
                  size="small"
                  sx={{ fontWeight: 800 }}
                />
              </Stack>

              {/* Hours */}
              <Typography className="pr-sectionTitle">Hours</Typography>
              <Box className="pr-deductionRow">
                <Typography className="pr-deductionRow__name">Regular Hours</Typography>
                <Typography className="pr-deductionRow__amount">{detail.regularHours}h</Typography>
              </Box>
              {detail.overtimeHours > 0 && (
                <Box className="pr-deductionRow">
                  <Typography className="pr-deductionRow__name">Overtime Hours</Typography>
                  <Typography className="pr-deductionRow__amount">{detail.overtimeHours}h</Typography>
                </Box>
              )}
              {detail.paidLeaveHours > 0 && (
                <Box className="pr-deductionRow">
                  <Typography className="pr-deductionRow__name">Paid Leave Hours</Typography>
                  <Typography className="pr-deductionRow__amount">{detail.paidLeaveHours}h</Typography>
                </Box>
              )}

              {/* Earnings */}
              <Box className="pr-section">
                <Typography className="pr-sectionTitle">Earnings</Typography>
                <Box className="pr-deductionRow">
                  <Typography className="pr-deductionRow__name">
                    {detail.payType === "hourly"
                      ? `Regular Pay (${detail.regularHours + detail.paidLeaveHours}h x ${formatCurrency(detail.payRate)})`
                      : "Salary (per period)"}
                  </Typography>
                  <Typography className="pr-deductionRow__amount">{formatCurrency(detail.regularPay)}</Typography>
                </Box>
                {detail.overtimePay > 0 && (
                  <Box className="pr-deductionRow">
                    <Typography className="pr-deductionRow__name">
                      Overtime Pay ({detail.overtimeHours}h x {formatCurrency(detail.otRate)})
                    </Typography>
                    <Typography className="pr-deductionRow__amount">{formatCurrency(detail.overtimePay)}</Typography>
                  </Box>
                )}
                <Box className="pr-totalLine">
                  <Typography className="pr-totalLine__label">Gross Pay</Typography>
                  <Typography className="pr-totalLine__value">{formatCurrency(detail.grossPay)}</Typography>
                </Box>
              </Box>

              {/* Deductions */}
              <Box className="pr-section">
                <Typography className="pr-sectionTitle">Deductions</Typography>
                {(detail.deductions || []).map((d, i) => (
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
                    -{formatCurrency(detail.totalDeductions)}
                  </Typography>
                </Box>
              </Box>

              {/* Net Pay */}
              <Box className="pr-totalLine" sx={{ borderTopWidth: 3, mt: 2, pt: 2 }}>
                <Typography className="pr-totalLine__label" sx={{ fontSize: "18px !important" }}>Net Pay</Typography>
                <Typography className="pr-totalLine__value" sx={{ fontSize: "22px !important", color: "#163A2E" }}>
                  {formatCurrency(detail.netPay)}
                </Typography>
              </Box>

              {/* Leave Accrual */}
              {detail.leaveAccrual && (
                <Box className="pr-section">
                  <Typography className="pr-sectionTitle">Leave Hours Accrual</Typography>
                  {["vacation", "sick", "personal"].map((type) => {
                    const data = detail.leaveAccrual[type];
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
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setDetail(null)} sx={{ textTransform: "none", fontWeight: 800 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
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
