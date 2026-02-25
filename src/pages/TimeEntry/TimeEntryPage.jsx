import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Chip,
  Stack,
  Divider,
  IconButton,
  InputAdornment,
  Snackbar,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import ViewWeekOutlinedIcon from "@mui/icons-material/ViewWeekOutlined";

import { useAuth } from "../../context/AuthContext";
import * as teApi from "../../api/timeEntries";
import "../../styles/timeEntry.css";

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  Approved: "success",
  Submitted: "info",
  Draft: "default",
  Rejected: "error",
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// "2026-01-04T00:00:00.000Z" or "2026-01-04" → "Jan 04, 2026"
const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso.slice(0, 10) + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

const localToday = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

// Map an API entry → frontend display shape
const fromApi = (e) => ({
  id:      e.id,
  project: e.project,
  task:    e.task,
  desc:    e.description || "",
  date:    e.date ? e.date.slice(0, 10) : "",
  hours:   String(e.hours),
  type:    e.type === "billable" ? "Billable" : "Non-billable",
  status:  capitalize(e.status),
  note:    e.reviewNote || "",
});

// Map form fields → API payload
const toApiPayload = ({ project, task, desc, date, hours, type }) => ({
  project,
  task,
  description: desc || undefined,
  date,
  hours:  parseFloat(hours),
  type:   type.toLowerCase(),   // "Billable" → "billable"
});

// Monday of the current week at midnight
const getWeekStart = () => {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── subcomponents ───────────────────────────────────────────────────────────

function TimesheetTopBar({ weeklyTotal }) {
  return (
    <div className="te-topbar">
      <div className="te-topbar__inner">
        <div className="te-topbar__left">
          <div className="te-topbar__badge" aria-hidden="true">Z</div>
          <div>
            <div className="te-topbar__title">ZCOR Timesheet</div>
            <div className="te-topbar__sub">Log your working hours</div>
          </div>
        </div>
        <div className="te-topbar__right">
          <div className="te-topbar__label">Weekly Total</div>
          <div className="te-topbar__total">{weeklyTotal}</div>
        </div>
      </div>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function TimeEntryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const formRef = React.useRef(null);

  // ── data state ──────────────────────────────────────────────────────────
  const [entries,  setEntries]  = React.useState([]);
  const [loading,  setLoading]  = React.useState(true);
  const [saving,   setSaving]   = React.useState(false);
  const [snack,    setSnack]    = React.useState({ open: false, severity: "success", message: "" });

  // ── form state ──────────────────────────────────────────────────────────
  const [editingId,   setEditingId]   = React.useState(null);
  const [filterDate,  setFilterDate]  = React.useState("");
  const [project,     setProject]     = React.useState("");
  const [task,        setTask]        = React.useState("");
  const [desc,        setDesc]        = React.useState("");
  const [date,        setDate]        = React.useState(localToday());
  const [hours,       setHours]       = React.useState("");
  const [type,        setType]        = React.useState("Billable");
  const [errors,      setErrors]      = React.useState({});

  // ── load entries ────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await teApi.getTimeEntries({ userId: user._id });
        if (!cancelled) setEntries(data.map(fromApi));
      } catch (err) {
        if (!cancelled) setSnack({ open: true, severity: "error", message: err.message || "Failed to load entries." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user]);

  // ── computed values ─────────────────────────────────────────────────────
  const weekStart = React.useMemo(getWeekStart, []);

  const weeklyEntries = React.useMemo(
    () => entries.filter((e) => new Date(e.date + "T00:00:00") >= weekStart),
    [entries, weekStart]
  );

  const weeklyTotal       = weeklyEntries.reduce((s, e) => s + parseFloat(e.hours || 0), 0).toFixed(1) + "h";
  const billableHours     = weeklyEntries.filter((e) => e.type === "Billable").reduce((s, e) => s + parseFloat(e.hours || 0), 0);
  const nonBillableHours  = weeklyEntries.reduce((s, e) => s + parseFloat(e.hours || 0), 0) - billableHours;
  const hoursByProject    = weeklyEntries.reduce((acc, e) => {
    acc[e.project] = (acc[e.project] || 0) + parseFloat(e.hours || 0);
    return acc;
  }, {});

  const draftCount     = entries.filter((e) => e.status === "Draft").length;
  const submittedCount = entries.filter((e) => e.status === "Submitted").length;
  const approvedCount  = entries.filter((e) => e.status === "Approved").length;

  const displayedEntries = filterDate
    ? entries.filter((e) => e.date === filterDate)
    : entries;

  // ── form helpers ────────────────────────────────────────────────────────
  const resetForm = () => {
    setProject(""); setTask(""); setDesc("");
    setDate(localToday()); setHours(""); setType("Billable");
    setErrors({}); setEditingId(null);
  };

  const validate = () => {
    const errs = {};
    if (!project) errs.project = "Required";
    if (!task)    errs.task    = "Required";
    if (!date)    errs.date    = "Required";
    if (!hours || isNaN(parseFloat(hours)) || parseFloat(hours) <= 0)
      errs.hours = "Enter a valid number";
    return errs;
  };

  // ── handlers ────────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload = toApiPayload({ project, task, desc, date, hours, type });
      if (editingId !== null) {
        const updated = await teApi.updateTimeEntry(editingId, payload);
        setEntries((prev) => prev.map((entry) => entry.id === editingId ? fromApi(updated) : entry));
        setSnack({ open: true, severity: "success", message: "Entry updated." });
      } else {
        const created = await teApi.createTimeEntry(payload);
        setEntries((prev) => [...prev, fromApi(created)]);
        setSnack({ open: true, severity: "success", message: "Entry added." });
      }
      resetForm();
    } catch (err) {
      setSnack({ open: true, severity: "error", message: err.message || "Failed to save entry." });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setProject(entry.project);
    setTask(entry.task);
    setDesc(entry.desc);
    setDate(entry.date);
    setHours(entry.hours);
    setType(entry.type);
    setErrors({});
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDelete = async (id) => {
    try {
      await teApi.deleteTimeEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      setSnack({ open: true, severity: "error", message: err.message || "Failed to delete entry." });
    }
  };

  const handleSubmitForReview = async () => {
    const draftIds = entries.filter((e) => e.status === "Draft").map((e) => e.id);
    if (draftIds.length === 0) return;
    try {
      const results = await Promise.all(draftIds.map((id) => teApi.submitTimeEntry(id)));
      const updatedMap = Object.fromEntries(results.map((r) => [r.id, fromApi(r)]));
      setEntries((prev) => prev.map((e) => updatedMap[e.id] || e));
      setSnack({ open: true, severity: "success", message: `${draftIds.length} ${draftIds.length === 1 ? "entry" : "entries"} submitted for review.` });
    } catch (err) {
      setSnack({ open: true, severity: "error", message: err.message || "Failed to submit entries." });
    }
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="te-root">
      <TimesheetTopBar weeklyTotal={weeklyTotal} />

      <main className="te-main">
        <div className="te-grid">
          {/* LEFT COLUMN */}
          <div className="te-left">
            {/* Add / Edit Time Entry */}
            <Paper elevation={0} className="te-card te-card--pad" ref={formRef}>
              <div className="te-cardTitleRow">
                <div className="te-cardTitleIcon"><AddIcon fontSize="small" /></div>
                <div>
                  <Typography className="te-cardTitle" variant="subtitle1">
                    {editingId !== null ? "Edit Time Entry" : "Add Time Entry"}
                  </Typography>
                  <Typography className="te-cardSubtitle" variant="body2">
                    {editingId !== null ? "Update your time entry details" : "Log your working hours for a task"}
                  </Typography>
                </div>
              </div>

              <Box component="form" onSubmit={handleAdd}>
                <div className="te-formGrid">
                  <div>
                    <Typography className="te-label" variant="caption">
                      Project <span className="te-required">*</span>
                    </Typography>
                    <TextField
                      select fullWidth size="small" value={project}
                      onChange={(e) => { setProject(e.target.value); setErrors((p) => ({ ...p, project: undefined })); }}
                      error={!!errors.project} helperText={errors.project}
                      slotProps={{ select: { displayEmpty: true, renderValue: (s) => s || "Select project" } }}
                    >
                      <MenuItem disabled value="">Select project</MenuItem>
                      <MenuItem value="ZCOR Platform">ZCOR Platform</MenuItem>
                      <MenuItem value="Client Portal">Client Portal</MenuItem>
                      <MenuItem value="Internal Tools">Internal Tools</MenuItem>
                    </TextField>
                  </div>

                  <div>
                    <Typography className="te-label" variant="caption">
                      Task <span className="te-required">*</span>
                    </Typography>
                    <TextField
                      select fullWidth size="small" value={task}
                      onChange={(e) => { setTask(e.target.value); setErrors((p) => ({ ...p, task: undefined })); }}
                      error={!!errors.task} helperText={errors.task}
                      slotProps={{ select: { displayEmpty: true, renderValue: (s) => s || "Select task" } }}
                    >
                      <MenuItem disabled value="">Select task</MenuItem>
                      <MenuItem value="Frontend Development">Frontend Development</MenuItem>
                      <MenuItem value="Bug Fixes">Bug Fixes</MenuItem>
                      <MenuItem value="Meetings">Meetings</MenuItem>
                    </TextField>
                  </div>

                  <div className="te-formGrid__full">
                    <Typography className="te-label" variant="caption">Description</Typography>
                    <TextField
                      fullWidth size="small" value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="What did you work on? (optional)"
                      multiline minRows={2}
                    />
                  </div>

                  <div>
                    <Typography className="te-label" variant="caption">
                      Date <span className="te-required">*</span>
                    </Typography>
                    <TextField
                      fullWidth size="small" type="date" value={date}
                      onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: undefined })); }}
                      error={!!errors.date} helperText={errors.date}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthIcon fontSize="small" sx={{ opacity: 0.65 }} /></InputAdornment> }}
                    />
                  </div>

                  <div>
                    <Typography className="te-label" variant="caption">
                      Hours <span className="te-required">*</span>
                    </Typography>
                    <TextField
                      fullWidth size="small" value={hours}
                      onChange={(e) => { setHours(e.target.value); setErrors((p) => ({ ...p, hours: undefined })); }}
                      error={!!errors.hours} placeholder="e.g. 2.5"
                      helperText={errors.hours || "In decimal format"}
                    />
                  </div>

                  <div>
                    <Typography className="te-label" variant="caption">Type</Typography>
                    <TextField select fullWidth size="small" value={type} onChange={(e) => setType(e.target.value)}>
                      <MenuItem value="Billable">Billable</MenuItem>
                      <MenuItem value="Non-billable">Non-billable</MenuItem>
                    </TextField>
                  </div>
                </div>

                <Stack direction="row" spacing={1.5} mt={2}>
                  <Button
                    type="submit" variant="contained" fullWidth
                    className="te-primaryBtn" startIcon={<AddIcon />}
                    sx={{ mt: "0 !important" }} disabled={saving}
                  >
                    {saving ? "Saving…" : editingId !== null ? "Update Entry" : "Add Time Entry"}
                  </Button>
                  {editingId !== null && (
                    <Button
                      variant="outlined" onClick={resetForm}
                      sx={{ borderRadius: "999px !important", textTransform: "none", fontWeight: 800, flexShrink: 0, padding: "12px 20px" }}
                    >
                      Cancel
                    </Button>
                  )}
                </Stack>
              </Box>
            </Paper>

            {/* Time Entries list */}
            <Paper elevation={0} className="te-card te-card--pad">
              <div className="te-entriesHeader">
                <div>
                  <Typography className="te-cardTitle" variant="subtitle1">Time Entries</Typography>
                  <Typography className="te-cardSubtitle" variant="body2">
                    {displayedEntries.length} entries •{" "}
                    {displayedEntries.reduce((s, e) => s + parseFloat(e.hours || 0), 0).toFixed(1)}h total
                  </Typography>
                </div>
                <TextField
                  size="small" type="date" value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="te-dateMini" InputLabelProps={{ shrink: true }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthIcon fontSize="small" sx={{ opacity: 0.65 }} /></InputAdornment> }}
                />
              </div>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : displayedEntries.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: "center", py: 4, opacity: 0.5 }}>
                  {filterDate ? "No entries for this date." : "No entries yet. Add your first time entry above."}
                </Typography>
              ) : (
                <Stack spacing={1.6}>
                  {displayedEntries.map((entry) => (
                    <Paper key={entry.id} elevation={0} className="te-entryRow">
                      <div className="te-entryRow__left">
                        <div className="te-entryRow__topline">
                          <Typography className="te-entryProject" variant="body1">{entry.project}</Typography>
                          <Typography className="te-entryTask" variant="caption">• {entry.task}</Typography>
                          <Chip
                            size="small" label={entry.status}
                            color={STATUS_COLOR[entry.status] ?? "default"}
                            variant={entry.status === "Draft" ? "outlined" : "filled"}
                            className="te-entryChip"
                          />
                        </div>
                        <Typography className="te-entryDesc" variant="body2">{entry.desc}</Typography>
                        <Typography className="te-entryMeta" variant="caption">
                          {formatDate(entry.date)}
                          {entry.note && entry.status !== "Rejected" && <> • <span className="te-entryNote">{entry.note}</span></>}
                        </Typography>
                        {entry.status === "Rejected" && entry.note && (
                          <Box sx={{ mt: 0.75, display: "flex", alignItems: "flex-start", gap: 0.5, bgcolor: "rgba(211,47,47,.06)", border: "1px solid rgba(211,47,47,.20)", borderRadius: 1, px: 1, py: 0.75 }}>
                            <Typography variant="caption" sx={{ color: "error.main", fontWeight: 700, flexShrink: 0 }}>
                              Reason:
                            </Typography>
                            <Typography variant="caption" sx={{ color: "error.dark" }}>
                              {entry.note}
                            </Typography>
                          </Box>
                        )}
                      </div>

                      <div className="te-entryRow__right">
                        <div className="te-entryHoursBlock">
                          <div className="te-entryHours">{entry.hours}h</div>
                          <div className="te-entryType">{entry.type}</div>
                        </div>
                        <div className="te-entryActions">
                          <IconButton
                            size="small" aria-label="Edit entry"
                            onClick={() => handleEdit(entry)}
                            disabled={entry.status === "Approved"}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small" aria-label="Delete entry"
                            onClick={() => handleDelete(entry.id)}
                            disabled={entry.status !== "Draft"}
                          >
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </div>
                      </div>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>
          </div>

          {/* RIGHT COLUMN */}
          <div className="te-right">
            {/* Submission Status */}
            <Paper elevation={0} className="te-card te-card--pad">
              <div className="te-rightTitleRow">
                <Typography className="te-cardTitle" variant="subtitle1">Submission Status</Typography>
                <Typography className="te-cardSubtitle" variant="body2">Current week overview</Typography>
              </div>
              <div className="te-statusList">
                <div className="te-statusRow">
                  <Chip size="small" label="Draft" variant="outlined" />
                  <span className="te-statusLabel">Draft</span>
                  <span className="te-statusNum">{draftCount}</span>
                </div>
                <div className="te-statusRow te-statusRow--active">
                  <Chip size="small" label="Submitted" color="primary" />
                  <span className="te-statusLabel">Submitted</span>
                  <span className="te-statusNum">{submittedCount}</span>
                </div>
                <div className="te-statusRow te-statusRow--approved">
                  <Chip size="small" label="Approved" color="success" />
                  <span className="te-statusLabel">Approved</span>
                  <span className="te-statusNum">{approvedCount}</span>
                </div>
              </div>
            </Paper>

            {/* Weekly Summary */}
            <Paper elevation={0} className="te-card te-card--pad">
              <Typography className="te-cardTitle" variant="subtitle1">Weekly Summary</Typography>
              <Typography className="te-cardSubtitle" variant="body2">Current week statistics</Typography>
              <Divider sx={{ my: 2 }} />
              <div className="te-summaryRow"><span>Total Hours</span><strong>{(billableHours + nonBillableHours).toFixed(1)}h</strong></div>
              <div className="te-summaryRow"><span>Billable Hours</span><strong className="te-green">{billableHours.toFixed(1)}h</strong></div>
              <div className="te-summaryRow"><span>Non-billable</span><strong>{nonBillableHours.toFixed(1)}h</strong></div>

              {Object.keys(hoursByProject).length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography sx={{ fontWeight: 900, fontSize: 12, opacity: 0.7, mb: 1 }}>By Project</Typography>
                  {Object.entries(hoursByProject).map(([proj, hrs]) => (
                    <div key={proj} className="te-summaryRow">
                      <span>{proj}</span><strong>{hrs.toFixed(1)}h</strong>
                    </div>
                  ))}
                </>
              )}
            </Paper>

            {/* Quick Tips */}
            <Paper elevation={0} className="te-card te-card--pad">
              <Typography className="te-cardTitle" variant="subtitle1">Quick Tips</Typography>
              <ul className="te-bullets">
                <li>Use decimal format for hours (e.g., 2.5 for 2 hours 30 minutes)</li>
                <li>You can increment by 0.25 (15 minutes) for precision</li>
                <li>Mark entries as billable or non-billable for accurate tracking</li>
              </ul>
            </Paper>

            {/* Quick Actions */}
            <Paper elevation={0} className="te-card te-card--pad">
              <Typography className="te-cardTitle" variant="subtitle1">Quick Actions</Typography>
              <div className="te-actions">
                <Button
                  variant="outlined" fullWidth startIcon={<SendOutlinedIcon />}
                  className="te-actionBtn" onClick={handleSubmitForReview}
                  disabled={draftCount === 0}
                >
                  Submit for Review
                </Button>
                <Button
                  variant="outlined" fullWidth startIcon={<ViewWeekOutlinedIcon />}
                  className="te-actionBtn" onClick={() => navigate("/calendar")}
                >
                  View Full Calendar
                </Button>

              </div>
            </Paper>
          </div>
        </div>
      </main>

      <Snackbar
        open={snack.open} autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity} variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
