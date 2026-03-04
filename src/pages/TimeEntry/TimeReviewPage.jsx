import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import SearchIcon from "@mui/icons-material/Search";

import { useAuth } from "../../context/AuthContext";
import * as teApi from "../../api/timeEntries";

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  submitted: "info",
  approved: "success",
  rejected: "error",
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso.slice(0, 10) + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

const formatDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_TABS = ["submitted", "approved", "rejected"];

// ─── component ───────────────────────────────────────────────────────────────

export default function TimeReviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tabIndex, setTabIndex] = useState(0);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // dialog state
  const [reviewEntry, setReviewEntry] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // "approve" | "reject"
  const [reviewNote, setReviewNote] = useState("");
  const [saving, setSaving] = useState(false);

  // snackbar
  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });
  const showSnack = (message, severity = "success") =>
    setSnack({ open: true, severity, message });

  // role guard — employees shouldn't reach this page
  useEffect(() => {
    if (user && user.role === "employee") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const activeStatus = STATUS_TABS[tabIndex];

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus]);

  async function loadEntries() {
    setLoading(true);
    try {
      const data = await teApi.getTimeEntries({ status: activeStatus });
      setEntries(data);
    } catch (err) {
      showSnack(err.message || "Failed to load entries.", "error");
    } finally {
      setLoading(false);
    }
  }

  // client-side search filter
  const filtered = entries.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (e.user?.firstName || "").toLowerCase().includes(q) ||
      (e.user?.lastName || "").toLowerCase().includes(q) ||
      (e.project?.name || "").toLowerCase().includes(q) ||
      (e.task?.name || "").toLowerCase().includes(q)
    );
  });

  // ─── dialog helpers ──────────────────────────────────────────────────────

  function openApprove(entry) {
    setReviewEntry(entry);
    setReviewAction("approve");
    setReviewNote("");
  }

  function openReject(entry) {
    setReviewEntry(entry);
    setReviewAction("reject");
    setReviewNote("");
  }

  function closeDialog() {
    setReviewEntry(null);
    setReviewAction(null);
    setReviewNote("");
  }

  async function handleConfirmReview() {
    if (!reviewEntry || !reviewAction) return;
    setSaving(true);
    try {
      await teApi.reviewTimeEntry(reviewEntry.id, {
        action: reviewAction,
        reviewNote: reviewNote.trim() || undefined,
      });
      showSnack(
        reviewAction === "approve" ? "Entry approved." : "Entry denied.",
        reviewAction === "approve" ? "success" : "info",
      );
      closeDialog();
      loadEntries();
    } catch (err) {
      showSnack(err.message || "Review failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  // ─── render ──────────────────────────────────────────────────────────────

  const showActions = activeStatus === "submitted";

  return (
    <Box sx={{ maxWidth: 1140, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>
      {/* Page header */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={800}>
          Time Entry Review
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Review and action time entries submitted by your team.
        </Typography>
      </Box>

      {/* Status tabs */}
      <Tabs
        value={tabIndex}
        onChange={(_, v) => { setTabIndex(v); setSearch(""); }}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Pending" />
        <Tab label="Approved" />
        <Tab label="Rejected" />
      </Tabs>

      {/* Search */}
      <Box mb={2}>
        <TextField
          size="small"
          placeholder="Search by employee, project, or task…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: "100%", sm: 360 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Box py={8} textAlign="center">
            <Typography color="text.secondary">
              No {activeStatus} entries found.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(15,27,16,.04)" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Project</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Task</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Hours</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Submitted</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  {!showActions && (
                    <TableCell sx={{ fontWeight: 700 }}>Review Note</TableCell>
                  )}
                  {showActions && (
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Actions
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id} hover>
                    {/* Employee */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {`${entry.user?.firstName} ${entry.user?.lastName}` || "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {entry.user?.email || ""}
                      </Typography>
                    </TableCell>

                    {/* Project / Task */}
                    <TableCell>
                      <Typography variant="body2">{entry.project?.name || "—"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{entry.task?.name || "—"}</Typography>
                    </TableCell>

                    {/* Date */}
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Typography variant="body2">{formatDate(entry.date)}</Typography>
                    </TableCell>

                    {/* Hours */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {entry.hours}h
                      </Typography>
                    </TableCell>

                    {/* Type */}
                    <TableCell>
                      <Chip
                        label={capitalize(entry.type)}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>

                    {/* Submitted at */}
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(entry.submittedAt)}
                      </Typography>
                    </TableCell>

                    {/* Status chip */}
                    <TableCell>
                      <Chip
                        label={capitalize(entry.status)}
                        size="small"
                        color={STATUS_COLOR[entry.status] || "default"}
                      />
                    </TableCell>

                    {/* Review note (approved / rejected tab) */}
                    {!showActions && (
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography variant="caption" color="text.secondary">
                          {entry.reviewNote || "—"}
                        </Typography>
                      </TableCell>
                    )}

                    {/* Action buttons (submitted tab) */}
                    {showActions && (
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleOutlineIcon />}
                            onClick={() => openApprove(entry)}
                            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 999 }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CancelOutlinedIcon />}
                            onClick={() => openReject(entry)}
                            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 999 }}
                          >
                            Deny
                          </Button>
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Row count */}
      {!loading && (
        <Typography variant="caption" color="text.secondary" mt={1} display="block">
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
        </Typography>
      )}

      {/* ── Approve Dialog ──────────────────────────────────────────────────── */}
      <Dialog
        open={Boolean(reviewEntry && reviewAction === "approve")}
        onClose={closeDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Approve Entry</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Approve the time entry for{" "}
            <strong>{reviewEntry?.user?.name}</strong>?
          </Typography>

          {reviewEntry && (
            <Box
              mt={1.5}
              p={1.5}
              bgcolor="rgba(15,27,16,.04)"
              borderRadius={1}
            >
              <Typography variant="body2" fontWeight={600}>
                {reviewEntry.project?.name || "—"} — {reviewEntry.task?.name || "—"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(reviewEntry.date)} · {reviewEntry.hours}h
              </Typography>
            </Box>
          )}

          <TextField
            label="Note (optional)"
            multiline
            rows={2}
            fullWidth
            size="small"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            sx={{ mt: 2 }}
            inputProps={{ maxLength: 500 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={closeDialog}
            disabled={saving}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmReview}
            disabled={saving}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {saving ? "Approving…" : "Approve"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Deny Dialog ─────────────────────────────────────────────────────── */}
      <Dialog
        open={Boolean(reviewEntry && reviewAction === "reject")}
        onClose={closeDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Deny Entry</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Deny the time entry for{" "}
            <strong>{reviewEntry?.user?.name}</strong>?
          </Typography>

          {reviewEntry && (
            <Box
              mt={1.5}
              p={1.5}
              bgcolor="rgba(15,27,16,.04)"
              borderRadius={1}
            >
              <Typography variant="body2" fontWeight={600}>
                {reviewEntry.project?.name || "—"} — {reviewEntry.task?.name || "—"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(reviewEntry.date)} · {reviewEntry.hours}h
              </Typography>
            </Box>
          )}

          <TextField
            label="Reason for denial (optional)"
            multiline
            rows={3}
            fullWidth
            size="small"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            sx={{ mt: 2 }}
            inputProps={{ maxLength: 500 }}
            helperText="This note will be visible to the employee."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={closeDialog}
            disabled={saving}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmReview}
            disabled={saving}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {saving ? "Denying…" : "Deny"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
