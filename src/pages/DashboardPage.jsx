import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Container,
  Paper,
  Typography,
  Stack,
  Chip,
  Avatar,
  Divider,
  Button,
  FormControlLabel,
  Switch,
} from "@mui/material";
import Grid from "@mui/material/Grid";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import "../styles/dashboard.css";
import { useAuth } from "../context/AuthContext";
import { getTimeEntries } from "../api/timeEntries";

// ── helpers ───────────────────────────────────────────────────────────────────

const localToday = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const toISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Returns the Monday of the week containing the given date
const weekMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const PIE_COLORS = ["#163a2f", "#2a5b49", "#3f7a62", "#7bd4b4", "#a8e6cf", "#5c8c7a"];
const WEEK_DAYS  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_ICON = {
  approved:  { icon: <CheckCircleRoundedIcon fontSize="small" />, bg: "rgba(64,191,128,0.18)",  fg: "#1b7a53" },
  submitted: { icon: <ScheduleRoundedIcon fontSize="small" />,    bg: "rgba(33,150,243,0.14)",  fg: "#1976d2" },
  draft:     { icon: <DescriptionRoundedIcon fontSize="small" />, bg: "rgba(120,120,120,0.12)", fg: "#4b4b4b" },
  rejected:  { icon: <CancelRoundedIcon fontSize="small" />,      bg: "rgba(211,47,47,0.12)",   fg: "#c62828" },
};

const STATUS_CHIP_COLOR = {
  approved: "success", submitted: "info", draft: "default", rejected: "error",
};

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ title, value, sub, icon, iconBg, iconFg, loading }) {
  return (
    <Paper className="dash-card dash-stat" elevation={0}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography className="dash-stat__title">{title}</Typography>
          <Typography className="dash-stat__value">{loading ? "—" : value}</Typography>
          <Typography className="dash-stat__sub">{loading ? "\u00A0" : sub}</Typography>
        </Box>
        <Box className="dash-stat__icon" sx={{ backgroundColor: iconBg, color: iconFg }}>
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [weekEntries,  setWeekEntries]  = React.useState([]);
  const [monthEntries, setMonthEntries] = React.useState([]);
  const [loading,      setLoading]      = React.useState(true);
  const [error,        setError]        = React.useState("");
  const [showWeekends, setShowWeekends] = React.useState(false);

  // Stable date references — computed once on mount
  const today    = React.useMemo(() => localToday(), []);
  const todayStr = React.useMemo(() => toISODate(today), [today]);
  const monDate  = React.useMemo(() => weekMonday(today), [today]);

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const sunDate    = new Date(monDate); sunDate.setDate(monDate.getDate() + 6);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd   = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const [week, month] = await Promise.all([
          getTimeEntries({ userId: user._id, from: toISODate(monDate), to: toISODate(sunDate) }),
          getTimeEntries({ userId: user._id, from: toISODate(monthStart), to: toISODate(monthEnd) }),
        ]);

        if (!cancelled) {
          setWeekEntries(week);
          setMonthEntries(month);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user, today, monDate]);

  // ── derived data ───────────────────────────────────────────────────────────

  const thisWeekHours  = weekEntries.reduce((s, e) => s + parseFloat(e.hours || 0), 0);
  const thisMonthHours = monthEntries.reduce((s, e) => s + parseFloat(e.hours || 0), 0);

  const statusCounts = React.useMemo(() =>
    monthEntries.reduce((acc, e) => { acc[e.status] = (acc[e.status] || 0) + 1; return acc; }, {}),
    [monthEntries]
  );

  const approvedCount  = statusCounts.approved  || 0;
  const submittedCount = statusCounts.submitted  || 0;
  const draftCount     = statusCounts.draft      || 0;
  const rejectedCount  = statusCounts.rejected   || 0;

  // Weekly bar chart: one bar per day Mon–Sun
  const weeklyBars = React.useMemo(() =>
    WEEK_DAYS.map((day, i) => {
      const d = new Date(monDate); d.setDate(monDate.getDate() + i);
      const dStr      = toISODate(d);
      const dayEntries = weekEntries.filter((e) => e.date?.slice(0, 10) === dStr);
      const total    = dayEntries.reduce((s, e) => s + parseFloat(e.hours || 0), 0);
      const billable = dayEntries.filter((e) => e.type === "billable").reduce((s, e) => s + parseFloat(e.hours || 0), 0);
      return { day, total: +total.toFixed(2), billable: +billable.toFixed(2) };
    }),
    [weekEntries, monDate]
  );

  // Project breakdown pie: hours per project this month
  const projectPie = React.useMemo(() => {
    const map = {};
    monthEntries.forEach((e) => { map[e.project?.name] = (map[e.project?.name] || 0) + parseFloat(e.hours || 0); });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: +value.toFixed(1) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [monthEntries]);

  // Most recent 5 entries (API already returns sorted by date desc)
  const recent = monthEntries.slice(0, 5);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = dateStr.slice(0, 10);
    if (d === todayStr) return "Today";
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d === toISODate(yesterday)) return "Yesterday";
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <Box className="dash-page">
      <Container maxWidth="lg" className="dash-container">
        <Box className="dash-head">
          <Typography className="dash-h1">
            Welcome back, {user?.firstName || "there"}! <span aria-hidden="true">👋</span>
          </Typography>
          <Typography className="dash-sub">
            Here's an overview of your time tracking activity
          </Typography>
        </Box>

        {error && (
          <Typography sx={{ color: "error.main", mb: 2, fontSize: 13 }}>{error}</Typography>
        )}

        <Grid container spacing={2} className="dash-grid">

          {/* ── Row 1: 4 stat cards ── */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              loading={loading}
              title="This Week"
              value={`${thisWeekHours.toFixed(1)}h`}
              sub={`${weekEntries.length} ${weekEntries.length === 1 ? "entry" : "entries"} this week`}
              icon={<AccessTimeOutlinedIcon />}
              iconBg="rgba(59,191,159,0.18)"
              iconFg="#0f6a55"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              loading={loading}
              title="This Month"
              value={`${thisMonthHours.toFixed(1)}h`}
              sub={`${monthEntries.length} ${monthEntries.length === 1 ? "entry" : "entries"} this month`}
              icon={<CalendarMonthOutlinedIcon />}
              iconBg="rgba(66,133,244,0.16)"
              iconFg="#2b66d6"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              loading={loading}
              title="Approved"
              value={approvedCount}
              sub={`${approvedCount} ${approvedCount === 1 ? "entry" : "entries"} this month`}
              icon={<CheckCircleOutlineIcon />}
              iconBg="rgba(64,191,128,0.18)"
              iconFg="#1b7a53"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              loading={loading}
              title="Pending"
              value={submittedCount}
              sub={`${rejectedCount} rejected this month`}
              icon={<HourglassEmptyOutlinedIcon />}
              iconBg="rgba(255,152,0,0.16)"
              iconFg="#b25e00"
            />
          </Grid>

          {/* ── Row 2: Weekly Hours bar chart ── */}
          <Grid size={12}>
            <Paper className="dash-card dash-big" elevation={0}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography className="dash-card__title">Weekly Hours</Typography>
                  <Typography className="dash-card__subtitle">Hours worked each day this week</Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showWeekends}
                      onChange={(e) => setShowWeekends(e.target.checked)}
                      size="small"
                      sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#163a2f" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#163a2f" } }}
                    />
                  }
                  label={<Typography sx={{ fontSize: 13, fontWeight: 600 }}>Show Weekends</Typography>}
                  sx={{ mr: 0 }}
                />
              </Stack>

              <Box className="dash-chartBox">
                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={showWeekends ? weeklyBars : weeklyBars.slice(0, 5)} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total"    name="Total Hours"    fill="#163a2f" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="billable" name="Billable Hours" fill="#2a5b49" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* ── Row 3: Project Breakdown pie chart ── */}
          <Grid size={12}>
            <Paper className="dash-card dash-big" elevation={0}>
              <Typography className="dash-card__title">Project Breakdown</Typography>
              <Typography className="dash-card__subtitle">Hours spent per project this month</Typography>

              <Box className="dash-chartBox dash-chartBox--pie">
                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : projectPie.length === 0 ? (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                    <Typography sx={{ color: "text.secondary", fontSize: 13 }}>No entries this month</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectPie}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={120}
                        innerRadius={70}
                        paddingAngle={2}
                      >
                        {projectPie.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* ── Row 4: Recent Activity + Quick Actions ── */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper className="dash-card" elevation={0}>
              <Stack direction="row" spacing={1} alignItems="center" className="dash-card__header">
                <DescriptionRoundedIcon fontSize="small" />
                <Box>
                  <Typography className="dash-card__title">Recent Activity</Typography>
                  <Typography className="dash-card__subtitle">Your latest time entries</Typography>
                </Box>
              </Stack>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : recent.length === 0 ? (
                <Typography sx={{ color: "text.secondary", fontSize: 13, py: 3, textAlign: "center" }}>
                  No entries this month
                </Typography>
              ) : (
                <Box className="dash-list">
                  {recent.map((entry, idx) => {
                    const si = STATUS_ICON[entry.status] || STATUS_ICON.draft;
                    return (
                      <React.Fragment key={entry.id}>
                        <Box className="dash-row">
                          <Box className="dash-row__left">
                            <Avatar
                              className="dash-row__avatar"
                              sx={{ bgcolor: si.bg, color: si.fg, width: 34, height: 34 }}
                            >
                              {si.icon}
                            </Avatar>

                            <Box className="dash-row__text">
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <Typography className="dash-row__title">{entry.project?.name || "—"}</Typography>
                                <Typography className="dash-dot" aria-hidden="true">•</Typography>
                                <Typography className="dash-row__subtitle">{entry.task?.name || "—"}</Typography>
                              </Stack>
                              {entry.description && (
                                <Typography className="dash-row__desc">{entry.description}</Typography>
                              )}
                              <Typography className="dash-row__meta">
                                {entry.hours}h • {formatDate(entry.date)}
                              </Typography>
                            </Box>
                          </Box>

                          <Chip
                            label={capitalize(entry.status)}
                            size="small"
                            color={STATUS_CHIP_COLOR[entry.status] ?? "default"}
                            variant={entry.status === "draft" ? "outlined" : "filled"}
                            className="dash-status"
                          />
                        </Box>
                        {idx !== recent.length - 1 && <Divider />}
                      </React.Fragment>
                    );
                  })}
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper className="dash-card" elevation={0}>
              <Typography className="dash-card__title">Quick Actions</Typography>
              <Typography className="dash-card__subtitle">Common tasks</Typography>

              <Stack spacing={1.25} mt={2}>
                <Button
                  variant="contained"
                  startIcon={<AddOutlinedIcon />}
                  className="dash-action dash-action--primary"
                  fullWidth
                  onClick={() => navigate("/time-entry")}
                >
                  Log New Time Entry
                </Button>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography className="dash-card__title" sx={{ fontSize: 13, mb: 1 }}>
                Status Summary
              </Typography>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : (
                <Box className="dash-summary">
                  <Box className="dash-summary__row">
                    <span className="dot dot--green" />
                    <Typography className="dash-summary__label">Approved</Typography>
                    <Typography className="dash-summary__value">{approvedCount}</Typography>
                  </Box>
                  <Box className="dash-summary__row">
                    <span className="dot dot--blue" />
                    <Typography className="dash-summary__label">Submitted</Typography>
                    <Typography className="dash-summary__value">{submittedCount}</Typography>
                  </Box>
                  <Box className="dash-summary__row">
                    <span className="dot dot--gray" />
                    <Typography className="dash-summary__label">Draft</Typography>
                    <Typography className="dash-summary__value">{draftCount}</Typography>
                  </Box>
                  <Box className="dash-summary__row">
                    <span className="dot dot--red" />
                    <Typography className="dash-summary__label">Rejected</Typography>
                    <Typography className="dash-summary__value">{rejectedCount}</Typography>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}
