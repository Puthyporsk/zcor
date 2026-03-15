import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
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
  const [showAll, setShowAll] = useState(false);

  // dialog state
  const [reviewEntry, setReviewEntry] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // "approve" | "reject"
  const [reviewNote, setReviewNote] = useState("");
  const [saving, setSaving] = useState(false);

  // selection state for mass actions
  const [selected, setSelected] = useState(new Set());

  // mass review dialog
  const [massAction, setMassAction] = useState(null); // "approve" | "reject"
  const [massNote, setMassNote] = useState("");

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
  }, [activeStatus, showAll]);

  async function loadEntries() {
    setLoading(true);
    try {
      const data = await teApi.getTimeEntries({ status: activeStatus });
      // For approved/rejected tabs, only show entries reviewed in the last 14 days unless showAll
      if (activeStatus !== "submitted" && !showAll) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 14);
        const recent = data.filter((e) => e.reviewedAt && new Date(e.reviewedAt) >= cutoff);
        setEntries(recent);
      } else {
        setEntries(data);
      }
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

  // ─── selection helpers ──────────────────────────────────────────────────

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((e) => e.id)));
    }
  }

  function closeMassDialog() {
    setMassAction(null);
    setMassNote("");
  }

  async function handleMassReview() {
    if (!massAction || selected.size === 0) return;
    setSaving(true);
    try {
      const ids = [...selected];
      await Promise.all(
        ids.map((id) =>
          teApi.reviewTimeEntry(id, {
            action: massAction,
            reviewNote: massNote.trim() || undefined,
          })
        )
      );
      const count = ids.length;
      showSnack(
        `${count} ${count === 1 ? "entry" : "entries"} ${massAction === "approve" ? "approved" : "denied"}.`,
        massAction === "approve" ? "success" : "info"
      );
      setSelected(new Set());
      closeMassDialog();
      loadEntries();
    } catch (err) {
      showSnack(err.message || "Mass review failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  // ─── render ──────────────────────────────────────────────────────────────

  const showActions = activeStatus === "submitted";

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>
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
        onChange={(_, v) => { setTabIndex(v); setSearch(""); setSelected(new Set()); setShowAll(false); }}
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

      {/* Mass action buttons */}
      {showActions && selected.size > 0 && (
        <Stack direction="row" spacing={1.5} mb={2} alignItems="center">
          <Typography variant="body2" fontWeight={700}>
            {selected.size} selected
          </Typography>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircleOutlineIcon />}
            onClick={() => { setMassAction("approve"); setMassNote(""); }}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "6px" }}
          >
            Approve All
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<CancelOutlinedIcon />}
            onClick={() => { setMassAction("reject"); setMassNote(""); }}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "6px" }}
          >
            Deny All
          </Button>
          <Button
            size="small"
            onClick={() => setSelected(new Set())}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Clear
          </Button>
        </Stack>
      )}

      {/* Table */}
      <Paper variant="outlined" sx={{ borderRadius: "10px", overflow: "hidden" }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Box py={8} textAlign="center">
            <Typography color="text.secondary">
              {activeStatus === "submitted"
                ? "No pending entries found."
                : `No ${activeStatus} entries in the last 14 days.`}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(15,27,16,.04)" }}>
                  {showActions && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={filtered.length > 0 && selected.size === filtered.length}
                        indeterminate={selected.size > 0 && selected.size < filtered.length}
                        onChange={toggleSelectAll}
                      />
                    </TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Project</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Task</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Hours</TableCell>
                  {showActions && <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>}
                  {showActions && <TableCell sx={{ fontWeight: 700 }}>Submitted</TableCell>}
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  {!showActions && (
                    <TableCell sx={{ fontWeight: 700 }}>Reviewed By</TableCell>
                  )}
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
                  <TableRow key={entry.id} hover selected={selected.has(entry.id)}>
                    {showActions && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={selected.has(entry.id)}
                          onChange={() => toggleSelect(entry.id)}
                        />
                      </TableCell>
                    )}
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

                    {/* Type (pending tab only) */}
                    {showActions && (
                      <TableCell>
                        <Chip
                          label={capitalize(entry.type)}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: 11 }}
                        />
                      </TableCell>
                    )}

                    {/* Submitted at (pending tab only) */}
                    {showActions && (
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(entry.submittedAt)}
                        </Typography>
                      </TableCell>
                    )}

                    {/* Status chip */}
                    <TableCell>
                      <Chip
                        label={capitalize(entry.status)}
                        size="small"
                        color={STATUS_COLOR[entry.status] || "default"}
                      />
                    </TableCell>

                    {/* Reviewed by (approved / rejected tab) */}
                    {!showActions && (
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Typography variant="body2" fontWeight={600}>
                          {entry.reviewedBy ? `${entry.reviewedBy.firstName} ${entry.reviewedBy.lastName}` : "—"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(entry.reviewedAt)}
                        </Typography>
                      </TableCell>
                    )}

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
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => openApprove(entry)}
                            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "6px", minWidth: 0, px: 1.5, fontSize: 12 }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => openReject(entry)}
                            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "6px", minWidth: 0, px: 1.5, fontSize: 12 }}
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
        <Stack direction="row" alignItems="center" spacing={1} mt={1}>
          <Typography variant="caption" color="text.secondary">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
            {!showAll && activeStatus !== "submitted" && " from the last 14 days"}
          </Typography>
          {!showAll && activeStatus !== "submitted" && (
            <Button
              size="small"
              onClick={() => setShowAll(true)}
              sx={{ textTransform: "none", fontSize: 12, fontWeight: 600, minWidth: 0, p: 0 }}
            >
              View all
            </Button>
          )}
          {showAll && activeStatus !== "submitted" && (
            <Button
              size="small"
              onClick={() => setShowAll(false)}
              sx={{ textTransform: "none", fontSize: 12, fontWeight: 600, minWidth: 0, p: 0 }}
            >
              Show recent only
            </Button>
          )}
        </Stack>
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

      {/* ── Mass Review Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={Boolean(massAction)}
        onClose={closeMassDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {massAction === "approve" ? "Approve" : "Deny"} {selected.size} {selected.size === 1 ? "Entry" : "Entries"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to {massAction === "approve" ? "approve" : "deny"}{" "}
            <strong>{selected.size}</strong> selected {selected.size === 1 ? "entry" : "entries"}?
          </Typography>
          <TextField
            label={massAction === "approve" ? "Note (optional)" : "Reason for denial (optional)"}
            multiline
            rows={3}
            fullWidth
            size="small"
            value={massNote}
            onChange={(e) => setMassNote(e.target.value)}
            sx={{ mt: 2 }}
            inputProps={{ maxLength: 500 }}
            helperText={massAction === "reject" ? "This note will be visible to the employees." : undefined}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeMassDialog} disabled={saving} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={massAction === "approve" ? "success" : "error"}
            onClick={handleMassReview}
            disabled={saving}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {saving
              ? (massAction === "approve" ? "Approving…" : "Denying…")
              : (massAction === "approve" ? `Approve ${selected.size}` : `Deny ${selected.size}`)}
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
