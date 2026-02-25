import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Paper,
  Typography,
  Stack,
  Chip,
  Button,
  IconButton,
  Divider,
} from "@mui/material";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";

import { useAuth } from "../context/AuthContext";
import { getTimeEntries } from "../api/timeEntries";
import "../styles/calendar.css";

// ─── constants ───────────────────────────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_COLOR = {
  approved:  "success",
  submitted: "info",
  draft:     "default",
  rejected:  "error",
};

// ─── helpers ─────────────────────────────────────────────────────────────────

// Date → "YYYY-MM-DD" using local time
const toISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Returns 42 day-objects covering a full 6-week grid for the given month
const getCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const days = [];

  for (let i = 0; i < firstDay.getDay(); i++)
    days.push({ date: new Date(year, month, i - firstDay.getDay() + 1), isCurrentMonth: false });

  for (let d = 1; d <= lastDay.getDate(); d++)
    days.push({ date: new Date(year, month, d), isCurrentMonth: true });

  for (let i = 1; days.length < 42; i++)
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });

  return days;
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// ─── page ────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Owner or Manager can toggle to see all entries
  const canViewAll = user?.role === "owner" || user?.role === "manager";

  const today = new Date();
  const [viewMonth,    setViewMonth]    = React.useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = React.useState(today);
  const [showAll,      setShowAll]      = React.useState(canViewAll);
  const [entries,      setEntries]      = React.useState([]);
  const [loading,      setLoading]      = React.useState(true);
  const [error,        setError]        = React.useState("");

  const year  = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const calendarDays = getCalendarDays(year, month);
  const todayStr = toISODate(today);

  // ── fetch entries for the visible month ──────────────────────────────────
  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch the full visible 6-week range so padding days also show dots
        const firstVisible = calendarDays[0].date;
        const lastVisible  = calendarDays[calendarDays.length - 1].date;

        const params = {
          from: toISODate(firstVisible),
          to:   toISODate(lastVisible),
        };

        // For "My Entries" mode when the user is privileged, scope by their _id
        if (canViewAll && !showAll && user._id) {
          params.userId = user._id;
        }

        const data = await getTimeEntries(params);
        if (!cancelled) setEntries(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load entries.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, viewMonth, showAll]);

  // ── derived data ─────────────────────────────────────────────────────────

  // For "My Entries" employees always see own (API already filtered).
  // For privileged users in "My Entries" mode we filtered by userId above.
  // "isOwn" drives the employee name display in the side panel.
  const visibleEntries = entries; // API already applies the right scope

  const entriesByDate = React.useMemo(() => {
    const map = {};
    visibleEntries.forEach((e) => {
      const key = e.date ? e.date.slice(0, 10) : null;
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [visibleEntries]);

  const selectedDateStr  = selectedDate ? toISODate(selectedDate) : null;
  const selectedEntries  = selectedDateStr ? (entriesByDate[selectedDateStr] || []) : [];
  const selectedTotal    = selectedEntries.reduce((s, e) => s + parseFloat(e.hours || 0), 0);

  // ── navigation ───────────────────────────────────────────────────────────
  const prevMonth = () => setViewMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setViewMonth(new Date(year, month + 1, 1));
  const goToday   = () => { setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(today); };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <Box className="cal-page">
      <Box className="cal-container">

        {/* Page header */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton
              size="small" onClick={() => navigate(-1)}
              sx={{ bgcolor: "rgba(22,58,46,0.08)", "&:hover": { bgcolor: "rgba(22,58,46,0.15)" } }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Box>
              <Typography className="cal-h1">Work Schedule</Typography>
              <Typography className="cal-sub">
                {canViewAll ? "View and manage team working hours" : "View your working hours"}
              </Typography>
            </Box>
          </Stack>

          {canViewAll && (
            <Box className="cal-toggle">
              <button
                className={`cal-toggle__btn${!showAll ? " cal-toggle__btn--active" : ""}`}
                onClick={() => setShowAll(false)}
              >
                My Entries
              </button>
              <button
                className={`cal-toggle__btn${showAll ? " cal-toggle__btn--active" : ""}`}
                onClick={() => setShowAll(true)}
              >
                All Entries
              </button>
            </Box>
          )}
        </Stack>

        <Box className="cal-layout">

          {/* ── Calendar grid ── */}
          <Paper elevation={0} className="cal-card">
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography className="cal-month-label">{MONTHS[month]} {year}</Typography>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Button size="small" variant="outlined" startIcon={<TodayOutlinedIcon fontSize="small" />} onClick={goToday} className="cal-today-btn">
                  Today
                </Button>
                <IconButton size="small" onClick={prevMonth} className="cal-nav-btn"><ChevronLeftIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={nextMonth} className="cal-nav-btn"><ChevronRightIcon fontSize="small" /></IconButton>
              </Stack>
            </Stack>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress size={28} />
              </Box>
            ) : error ? (
              <Typography sx={{ color: "error.main", textAlign: "center", py: 4, fontSize: 13 }}>{error}</Typography>
            ) : (
              <>
                <div className="cal-grid">
                  {DAYS.map((d) => <div key={d} className="cal-day-header">{d}</div>)}

                  {calendarDays.map(({ date, isCurrentMonth }, i) => {
                    const dateStr   = toISODate(date);
                    const dayEntries = entriesByDate[dateStr] || [];
                    const isToday    = dateStr === todayStr;
                    const isSelected = selectedDate && toISODate(selectedDate) === dateStr;

                    return (
                      <div
                        key={i}
                        className={[
                          "cal-cell",
                          !isCurrentMonth && "cal-cell--faded",
                          isToday    && "cal-cell--today",
                          isSelected && "cal-cell--selected",
                        ].filter(Boolean).join(" ")}
                        onClick={() => isCurrentMonth && setSelectedDate(date)}
                      >
                        <span className="cal-cell__num">{date.getDate()}</span>
                        {dayEntries.length > 0 && (
                          <div className="cal-cell__dots">
                            {dayEntries.slice(0, 3).map((e, j) => (
                              <span
                                key={j}
                                className={`cal-dot cal-dot--${e.status}`}
                                title={`${e.project} — ${e.hours}h`}
                              />
                            ))}
                            {dayEntries.length > 3 && (
                              <span className="cal-cell__more">+{dayEntries.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="cal-legend">
                  {[["approved", "Approved"], ["submitted", "Submitted"], ["draft", "Draft"], ["rejected", "Rejected"]].map(
                    ([cls, label]) => (
                      <div key={cls} className="cal-legend__item">
                        <span className={`cal-dot cal-dot--${cls}`} />
                        {label}
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </Paper>

          {/* ── Day detail panel ── */}
          <Paper elevation={0} className="cal-card cal-side">
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <AccessTimeOutlinedIcon fontSize="small" sx={{ opacity: 0.6, mt: 0.25 }} />
              <Box>
                <Typography className="cal-side__date">
                  {selectedDate
                    ? selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
                    : "Select a day"}
                </Typography>
                {selectedEntries.length > 0 && (
                  <Typography className="cal-side__meta">
                    {selectedEntries.length} {selectedEntries.length === 1 ? "entry" : "entries"} • {selectedTotal.toFixed(1)}h total
                  </Typography>
                )}
              </Box>
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            {selectedEntries.length === 0 ? (
              <div className="cal-empty">
                <Typography className="cal-empty__text">No entries for this day</Typography>
                <Button
                  size="small" variant="outlined"
                  startIcon={<AddOutlinedIcon fontSize="small" />}
                  onClick={() => navigate("/time-entry")}
                  className="cal-log-btn"
                >
                  Log Time Entry
                </Button>
              </div>
            ) : (
              <Stack spacing={1.25}>
                {selectedEntries.map((entry) => {
                  const isOwn = entry.user?.userId === user?.userId;
                  return (
                    <Paper key={entry.id} elevation={0} className="cal-entry">
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography className="cal-entry__project">{entry.project}</Typography>
                          <Typography className="cal-entry__task">• {entry.task}</Typography>
                          {entry.description && (
                            <Typography className="cal-entry__desc">{entry.description}</Typography>
                          )}
                          {showAll && !isOwn && entry.user && (
                            <Typography className="cal-entry__employee">
                              {entry.user.firstName} {entry.user.lastName}
                            </Typography>
                          )}
                        </Box>
                        <Stack alignItems="flex-end" spacing={0.5} sx={{ flexShrink: 0 }}>
                          <Typography className="cal-entry__hours">{entry.hours}h</Typography>
                          <Chip
                            size="small"
                            label={capitalize(entry.status)}
                            color={STATUS_COLOR[entry.status] ?? "default"}
                            variant={entry.status === "draft" ? "outlined" : "filled"}
                            sx={{ fontSize: 10, height: 18 }}
                          />
                        </Stack>
                      </Stack>
                      <Typography className="cal-entry__type">{capitalize(entry.type)}</Typography>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
