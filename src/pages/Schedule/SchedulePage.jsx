import React from "react";
import {
  Typography, Box, Paper, Button, IconButton, TextField,
  Select, MenuItem, FormControl, FormControlLabel,
  Checkbox, Stack, Divider, CircularProgress,
} from "@mui/material";
import EventNoteOutlinedIcon      from "@mui/icons-material/EventNoteOutlined";
import PeopleAltOutlinedIcon      from "@mui/icons-material/PeopleAltOutlined";
import AccessTimeOutlinedIcon     from "@mui/icons-material/AccessTimeOutlined";
import CalendarMonthOutlinedIcon  from "@mui/icons-material/CalendarMonthOutlined";
import FilterListIcon             from "@mui/icons-material/FilterList";
import AccessTimeIcon             from "@mui/icons-material/AccessTime";
import WorkOutlineIcon            from "@mui/icons-material/WorkOutline";
import ChevronLeftIcon            from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon           from "@mui/icons-material/ChevronRight";
import BeachAccessOutlinedIcon    from "@mui/icons-material/BeachAccessOutlined";
import SickOutlinedIcon           from "@mui/icons-material/SickOutlined";
import PersonOutlineOutlinedIcon  from "@mui/icons-material/PersonOutlineOutlined";

import { useSearchParams }   from "react-router-dom";
import { useAuth }           from "../../context/AuthContext";
import { getShifts }         from "../../api/shifts";
import { getTasks }          from "../../api/tasks";
import { getUsers }          from "../../api/user";
import { getLeaveRequests }  from "../../api/leave";
import ShiftModal            from "./ShiftModal";
import ZcorAllRightsReserved from "../../components/ZcorAllRightsReserved";
import "../../styles/schedule.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_ABBR  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const DARK        = "#1a3a2e";
const DARK_MID    = "rgba(26,58,46,.35)";

function fmtHM(decimal) {
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

const getMonthGrid = (year, month) => {
  const first = new Date(year, month, 1);
  const dayOfWeek = first.getDay();
  const startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // days to go back to Monday
  const gridStart = new Date(year, month, 1 - startOffset);
  const dates = [];
  const d = new Date(gridStart);
  // always produce full weeks (rows of 7) until we pass the last day of the month
  while (dates.length < 42) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
    // stop at end of a complete week if we've passed the month
    if (dates.length >= 28 && dates.length % 7 === 0 && d.getMonth() !== month) break;
  }
  return dates;
};

const formatMonthLabel = (date) => `${MONTH_FULL[date.getMonth()]} ${date.getFullYear()}`;

const isTodayDate = (date) => {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
};

const isCurrentMonth = (date, year, month) => date.getMonth() === month && date.getFullYear() === year;

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (d, n) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

const toDateStr = (d) => {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const shiftMinutes = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
};

const isSameId = (a, b) => String(a) === String(b);

// ─── Leave helpers ────────────────────────────────────────────────────────────

const LEAVE_STYLE = {
  vacation: { bg: "#fff8e1", border: "#ffb300", text: "#e65100", icon: <BeachAccessOutlinedIcon sx={{ fontSize: 11, flexShrink: 0 }} /> },
  sick:     { bg: "#f3e5f5", border: "#9c27b0", text: "#6a1b9a", icon: <SickOutlinedIcon sx={{ fontSize: 11, flexShrink: 0 }} /> },
  personal: { bg: "#e8f5e9", border: "#43a047", text: "#1b5e20", icon: <PersonOutlineOutlinedIcon sx={{ fontSize: 11, flexShrink: 0 }} /> },
};
const LEAVE_LABEL = { vacation: "Vacation", sick: "Sick Leave", personal: "Personal" };

// ─── LeaveCard ────────────────────────────────────────────────────────────────

function LeaveCard({ leave }) {
  const emp    = leave.employee || {};
  const name   = [emp.firstName, emp.lastName].filter(Boolean).join(" ") || "Unknown";
  const style  = LEAVE_STYLE[leave.type] || LEAVE_STYLE.personal;

  return (
    <Box sx={{
      bgcolor: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: "6px",
      p: "7px 9px",
    }}>
      <Typography sx={{ fontSize: 12, fontWeight: 800, color: style.text, mb: 0.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {name}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: style.text, opacity: 0.85 }}>
        {style.icon}
        <Typography sx={{ fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {LEAVE_LABEL[leave.type]}
        </Typography>
      </Stack>
    </Box>
  );
}

// ─── ShiftCard ────────────────────────────────────────────────────────────────

function ShiftCard({ shift, clickable, onCardClick }) {
  const emp  = shift.employee || {};
  const name = [emp.firstName, emp.lastName].filter(Boolean).join(" ") || "Unknown";

  return (
    <Box
      onClick={clickable ? () => onCardClick(shift) : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => e.key === "Enter" && onCardClick(shift) : undefined}
      sx={{
        bgcolor: DARK,
        color: "#fff",
        borderRadius: "6px",
        p: "9px 10px",
        ...(clickable && {
          cursor: "pointer",
          transition: "opacity .15s, transform .1s",
          "&:hover": { opacity: 0.88, transform: "translateY(-1px)" },
          "&:focus-visible": { outline: "2px solid rgba(255,255,255,.5)", outlineOffset: 2 },
        }),
      }}
    >
      <Typography sx={{ fontSize: 12.5, fontWeight: 800, mb: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {name}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0.6} sx={{ opacity: 0.85 }}>
        <AccessTimeIcon sx={{ fontSize: 11, flexShrink: 0 }} />
        <Typography sx={{ fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {shift.startTime}–{shift.endTime}
        </Typography>
      </Stack>
      {shift.task?.name && (
        <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mt: 0.25, opacity: 0.85 }}>
          <WorkOutlineIcon sx={{ fontSize: 11, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {shift.task.name}
          </Typography>
        </Stack>
      )}
    </Box>
  );
}

// ─── DayColumn ────────────────────────────────────────────────────────────────

function DayColumn({ date, dayName, dayShifts, dayLeave, canCreate, canEditShift, onAddClick, onCardClick }) {
  const shiftCount = dayShifts.length;
  const leaveCount = dayLeave.length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", borderRight: "1px solid rgba(16,24,40,.07)", "&:last-child": { borderRight: "none" }, minHeight: 340 }}>
      {/* Header */}
      <Box sx={{ bgcolor: DARK, color: "#fff", textAlign: "center", py: "14px", px: 1, borderRight: "1px solid rgba(255,255,255,.08)" }}>
        <Typography sx={{ fontSize: 13, fontWeight: 800, opacity: 0.85, letterSpacing: ".03em" }}>{dayName}</Typography>
        <Typography sx={{ fontSize: 26, fontWeight: 900, lineHeight: 1.15, my: "2px" }}>{date.getDate()}</Typography>
        <Typography sx={{ fontSize: 12, fontWeight: 600, opacity: 0.65 }}>{MONTH_ABBR[date.getMonth()]}</Typography>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, p: "10px 8px", display: "flex", flexDirection: "column", gap: 1 }}>
        {canCreate && (
          <Button
            fullWidth variant="outlined"
            onClick={() => onAddClick(date)}
            aria-label={`Add shift for ${dayName}`}
            sx={{
              borderStyle: "dashed",
              borderColor: DARK_MID,
              color: DARK,
              borderRadius: "6px",
              py: 0.75,
              fontWeight: 700,
              fontSize: 18,
              minWidth: 0,
              opacity: 0.7,
              "&:hover": { borderStyle: "dashed", borderColor: DARK, opacity: 1, bgcolor: "rgba(26,58,46,.04)" },
            }}
          >
            +
          </Button>
        )}

        {/* Leave cards */}
        {leaveCount > 0 && (
          <Stack spacing={0.75}>
            {dayLeave.map((lr) => (
              <LeaveCard key={lr.id} leave={lr} />
            ))}
          </Stack>
        )}

        {shiftCount === 0 && leaveCount === 0 ? (
          <Typography sx={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: "rgba(14,46,37,.38)", py: 2 }}>
            No shifts
          </Typography>
        ) : (
          <Stack spacing={1}>
            {dayShifts.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} clickable={canEditShift(shift)} onCardClick={onCardClick} />
            ))}
          </Stack>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 1, py: 1, textAlign: "center", borderTop: "1px solid rgba(16,24,40,.07)", minHeight: 30 }}>
        {(shiftCount > 0 || leaveCount > 0) && (
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: DARK, opacity: 0.75 }}>
            {shiftCount > 0 && `${shiftCount} ${shiftCount === 1 ? "shift" : "shifts"}`}
            {shiftCount > 0 && leaveCount > 0 && " · "}
            {leaveCount > 0 && `${leaveCount} on leave`}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ─── MonthCell ───────────────────────────────────────────────────────────

function MonthCell({ date, currentMonth, today, shiftCount, leaveByType, onClick }) {
  const dimmed = !currentMonth;
  const classes = [
    "sched-month-cell",
    dimmed && "sched-month-cell--dimmed",
  ].filter(Boolean).join(" ");

  return (
    <Box className={classes} onClick={() => onClick(date)} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(date)}>
      <Box className={today ? "sched-month-date sched-month-date--today" : "sched-month-date"}>
        {date.getDate()}
      </Box>
      {shiftCount > 0 && (
        <Box className="sched-month-badge">
          {shiftCount} {shiftCount === 1 ? "shift" : "shifts"}
        </Box>
      )}
      {(leaveByType.vacation > 0 || leaveByType.sick > 0 || leaveByType.personal > 0) && (
        <Box className="sched-month-dots">
          {leaveByType.vacation > 0 && (
            <Box className="sched-month-dot-group">
              <Box className="sched-month-dot" sx={{ bgcolor: "#ffb300" }} />
              <span>{leaveByType.vacation}</span>
            </Box>
          )}
          {leaveByType.sick > 0 && (
            <Box className="sched-month-dot-group">
              <Box className="sched-month-dot" sx={{ bgcolor: "#9c27b0" }} />
              <span>{leaveByType.sick}</span>
            </Box>
          )}
          {leaveByType.personal > 0 && (
            <Box className="sched-month-dot-group">
              <Box className="sched-month-dot" sx={{ bgcolor: "#43a047" }} />
              <span>{leaveByType.personal}</span>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

// ─── SchedulePage ─────────────────────────────────────────────────────────────

const CARD_SX = {
  borderRadius: "10px",
  border: "1px solid rgba(16,24,40,.06)",
  boxShadow: "0 4px 16px rgba(16,24,40,.07)",
};

const FILTER_LABEL_SX = {
  fontSize: 11,
  fontWeight: 700,
  color: "rgba(14,46,37,.65)",
  mb: 0.5,
  display: "flex",
  alignItems: "center",
  gap: 0.4,
};

export default function SchedulePage() {
  const { user } = useAuth();
  const isPrivileged = user?.role === "manager" || user?.role === "owner";
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode,         setViewMode]         = React.useState("week");
  const [weekStart,        setWeekStart]        = React.useState(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      const parsed = new Date(dateParam + "T00:00:00");
      if (!isNaN(parsed.getTime())) return getMonday(parsed);
    }
    return getMonday(new Date());
  });
  const [monthAnchor,      setMonthAnchor]      = React.useState(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      const parsed = new Date(dateParam + "T00:00:00");
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });
  const [shifts,           setShifts]           = React.useState([]);
  const [employees,        setEmployees]         = React.useState([]);
  const [tasks,            setTasks]            = React.useState([]);
  const [loading,          setLoading]          = React.useState(true);
  const [showWeekends,     setShowWeekends]     = React.useState(false);
  const [filterEmployeeId, setFilterEmployeeId] = React.useState("");
  const [filterTaskId,     setFilterTaskId]     = React.useState("");
  const [approvedLeave,    setApprovedLeave]    = React.useState([]);
  const [modal, setModal] = React.useState({ open: false, date: null, shift: null });

  // Sync week/month to ?date= param when it changes (e.g. from notification click)
  const lastAppliedDate = React.useRef(null);
  React.useEffect(() => {
    const dateParam = searchParams.get("date");
    if (!dateParam || dateParam === lastAppliedDate.current) return;
    const parsed = new Date(dateParam + "T00:00:00");
    if (isNaN(parsed.getTime())) return;
    lastAppliedDate.current = dateParam;
    setWeekStart(getMonday(parsed));
    setMonthAnchor(parsed);
  }, [searchParams]);

  const weekEnd    = React.useMemo(() => addDays(weekStart, 6), [weekStart]);
  const days       = React.useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const visibleDays = showWeekends ? days : days.slice(0, 5);

  // month view derived values
  const monthYear  = monthAnchor.getFullYear();
  const monthMonth = monthAnchor.getMonth();
  const monthGridDates = React.useMemo(() => getMonthGrid(monthYear, monthMonth), [monthYear, monthMonth]);
  const gridStart  = monthGridDates[0];
  const gridEnd    = monthGridDates[monthGridDates.length - 1];

  // ── data load ──────────────────────────────────────────────────────────
  const fetchFrom = viewMode === "week" ? toDateStr(weekStart) : toDateStr(gridStart);
  const fetchTo   = viewMode === "week" ? toDateStr(weekEnd)   : toDateStr(gridEnd);
  const leaveYear = viewMode === "week" ? weekStart.getFullYear() : monthYear;

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const leavePromises = [getLeaveRequests({ status: "approved", year: leaveYear })];
        // If grid spans two years (e.g. Dec-Jan), fetch leave for both years
        if (viewMode === "month" && gridStart.getFullYear() !== gridEnd.getFullYear()) {
          leavePromises.push(getLeaveRequests({ status: "approved", year: gridEnd.getFullYear() }));
        }
        const [shiftsData, usersData, tasksData, ...leaveResults] = await Promise.all([
          getShifts({ from: fetchFrom, to: fetchTo }),
          getUsers(),
          getTasks(),
          ...leavePromises,
        ]);
        if (!cancelled) {
          setShifts(shiftsData);
          setEmployees(usersData);
          setTasks(tasksData);
          // Merge and deduplicate leave from multiple years
          const allLeave = leaveResults.flat();
          const seen = new Set();
          setApprovedLeave(allLeave.filter((lr) => {
            const id = lr._id || lr.id;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          }));
        }
      } catch (_) {}
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [fetchFrom, fetchTo, leaveYear, viewMode]);

  // ── navigation ─────────────────────────────────────────────────────────
  const goToday = () => {
    if (viewMode === "week") setWeekStart(getMonday(new Date()));
    else setMonthAnchor(new Date());
  };
  const goPrev = () => {
    if (viewMode === "week") setWeekStart((w) => addDays(w, -7));
    else setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const goNext = () => {
    if (viewMode === "week") setWeekStart((w) => addDays(w, 7));
    else setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const switchToWeek = () => setViewMode("week");
  const switchToMonth = () => {
    setMonthAnchor(new Date(weekStart.getFullYear(), weekStart.getMonth(), 1));
    setViewMode("month");
  };

  const handleMonthDayClick = (date) => {
    setWeekStart(getMonday(date));
    setViewMode("week");
  };

  const formatWeekRange = () => {
    const s = weekStart, e = weekEnd;
    const sm = MONTH_ABBR[s.getMonth()], em = MONTH_ABBR[e.getMonth()];
    return sm === em
      ? `${sm} ${s.getDate()}, ${s.getFullYear()} - ${sm} ${e.getDate()}, ${e.getFullYear()}`
      : `${sm} ${s.getDate()}, ${s.getFullYear()} - ${em} ${e.getDate()}, ${e.getFullYear()}`;
  };

  const headerLabel = viewMode === "week" ? formatWeekRange() : formatMonthLabel(monthAnchor);
  const headerSub   = viewMode === "week" ? "Week View" : "Month View";

  // ── filtering ──────────────────────────────────────────────────────────
  const filteredShifts = React.useMemo(() => {
    let s = shifts;
    if (filterEmployeeId) s = s.filter((sh) => isSameId(sh.employee?.id || sh.employee?._id, filterEmployeeId));
    if (filterTaskId)     s = s.filter((sh) => isSameId(sh.task?.id    || sh.task?._id,     filterTaskId));
    return s;
  }, [shifts, filterEmployeeId, filterTaskId]);

  const shiftsForDay = (date) => {
    const ds = toDateStr(date);
    return filteredShifts.filter((sh) => sh.date?.slice(0, 10) === ds);
  };

  const leaveForDay = (date) => {
    if (filterTaskId) return [];
    const ds = toDateStr(date);
    return approvedLeave.filter((lr) => {
      const start = lr.startDate?.slice(0, 10);
      const end   = lr.endDate?.slice(0, 10);
      if (!start || !end || start > ds || ds > end) return false;
      if (filterEmployeeId) {
        const empId = lr.employee?._id || lr.employee?.id;
        if (!isSameId(empId, filterEmployeeId)) return false;
      }
      return true;
    });
  };

  const canEditShift = (shift) => {
    if (isPrivileged) return true;
    return isSameId(shift.employee?.id || shift.employee?._id, user?._id);
  };

  // ── stats ──────────────────────────────────────────────────────────────
  const statsDateStrs = React.useMemo(() => {
    if (viewMode === "week") return new Set(visibleDays.map(toDateStr));
    // Month: only days within the actual month (exclude leading/trailing)
    return new Set(monthGridDates.filter((d) => isCurrentMonth(d, monthYear, monthMonth)).map(toDateStr));
  }, [viewMode, visibleDays, monthGridDates, monthYear, monthMonth]);

  const statsShifts = React.useMemo(
    () => filteredShifts.filter((sh) => statsDateStrs.has(sh.date?.slice(0, 10))),
    [filteredShifts, statsDateStrs]
  );

  const totalEmployees = React.useMemo(
    () => new Set(statsShifts.map((sh) => sh.employee?.id || sh.employee?._id).filter(Boolean)).size,
    [statsShifts]
  );

  const totalHours = React.useMemo(
    () => statsShifts.reduce((sum, sh) => sum + shiftMinutes(sh.startTime, sh.endTime), 0) / 60,
    [statsShifts]
  );

  // ── modal handlers ─────────────────────────────────────────────────────
  const openAdd    = (date)  => setModal({ open: true, date, shift: null });
  const openEdit   = (shift) => {
    const ds = shift.date?.slice(0, 10) || "";
    const [y, m, d] = ds.split("-").map(Number);
    setModal({ open: true, date: new Date(y, m - 1, d), shift });
  };
  const closeModal = ()      => setModal({ open: false, date: null, shift: null });

  const handleSave = (saved) => {
    setShifts((prev) => {
      const exists = prev.find((s) => s.id === saved.id);
      return exists ? prev.map((s) => (s.id === saved.id ? saved : s)) : [...prev, saved];
    });
    closeModal();
  };

  const handleDelete  = (id)   => { setShifts((prev) => prev.filter((s) => s.id !== id)); closeModal(); };
  const handleNewTask = (task) => setTasks((prev) => [...prev, task]);

  // ── shared Select sx ───────────────────────────────────────────────────
  const SELECT_SX = { bgcolor: "#f8fdf9", fontSize: 13 };

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <Box className="sched-root">
      <Box className="sched-container">

        {/* Page header */}
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#0e2e25", mb: "4px" }}>Employee Schedule</Typography>
          <Typography sx={{ fontSize: 12.5, color: "rgba(14,46,37,.65)" }}>
            {viewMode === "week" ? "Manage weekly work schedules" : "Monthly schedule overview"}
          </Typography>
        </Box>

        {/* Week nav + filters card */}
        <Paper elevation={0} sx={{ ...CARD_SX, p: "16px 20px" }}>
          {/* Navigation row */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <EventNoteOutlinedIcon sx={{ color: DARK, opacity: 0.7, fontSize: 22 }} />
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: "#0e2e25" }}>{headerLabel}</Typography>
                <Typography sx={{ fontSize: 11.5, color: "rgba(14,46,37,.55)", mt: "1px" }}>{headerSub}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              {/* View toggle */}
              <Box sx={{ display: "flex", border: "1px solid rgba(14,46,37,.2)", borderRadius: "6px", overflow: "hidden", mr: 0.5 }}>
                <Button size="small" onClick={switchToWeek}
                  sx={{
                    borderRadius: 0, textTransform: "none", fontWeight: 700, fontSize: 12.5, px: 1.5, minWidth: 0,
                    bgcolor: viewMode === "week" ? DARK : "transparent",
                    color: viewMode === "week" ? "#fff" : "#0e2e25",
                    "&:hover": { bgcolor: viewMode === "week" ? DARK : "rgba(26,58,46,.06)" },
                  }}>
                  Week
                </Button>
                <Button size="small" onClick={switchToMonth}
                  sx={{
                    borderRadius: 0, textTransform: "none", fontWeight: 700, fontSize: 12.5, px: 1.5, minWidth: 0,
                    borderLeft: "1px solid rgba(14,46,37,.2)",
                    bgcolor: viewMode === "month" ? DARK : "transparent",
                    color: viewMode === "month" ? "#fff" : "#0e2e25",
                    "&:hover": { bgcolor: viewMode === "month" ? DARK : "rgba(26,58,46,.06)" },
                  }}>
                  Month
                </Button>
              </Box>
              <IconButton size="small" onClick={goPrev} aria-label={viewMode === "week" ? "Previous week" : "Previous month"}
                sx={{ border: "1px solid rgba(14,46,37,.2)", borderRadius: "6px", color: "#0e2e25" }}>
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <Button variant="outlined" size="small" onClick={goToday}
                sx={{ borderRadius: "6px", textTransform: "none", fontWeight: 700, borderColor: "rgba(14,46,37,.2)", color: "#0e2e25", px: 1.75 }}>
                Today
              </Button>
              <IconButton size="small" onClick={goNext} aria-label={viewMode === "week" ? "Next week" : "Next month"}
                sx={{ border: "1px solid rgba(14,46,37,.2)", borderRadius: "6px", color: "#0e2e25" }}>
                <ChevronRightIcon fontSize="small" />
              </IconButton>
              <TextField
                type="date"
                size="small"
                value={viewMode === "week" ? toDateStr(weekStart) : toDateStr(monthAnchor)}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const picked = new Date(e.target.value + "T00:00:00");
                  if (viewMode === "week") setWeekStart(getMonday(picked));
                  else setMonthAnchor(new Date(picked.getFullYear(), picked.getMonth(), 1));
                }}
                inputProps={{ "aria-label": viewMode === "week" ? "Jump to week containing date" : "Jump to month containing date" }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#0e2e25",
                    "& fieldset": { borderColor: "rgba(14,46,37,.2)" },
                    "&:hover fieldset": { borderColor: "rgba(14,46,37,.4)" },
                  },
                  "& .MuiOutlinedInput-input": { py: "5px", px: "10px", cursor: "pointer" },
                }}
              />
            </Stack>
          </Stack>

          <Divider sx={{ my: "14px", mx: "-20px", borderColor: "rgba(14,46,37,.08)" }} />

          {/* Filters */}
          <Stack direction="row" alignItems="flex-end" flexWrap="wrap" gap={2}>
            {/* Filter by Employee */}
            <Box sx={{ flex: 1, minWidth: 180 }}>
              <Typography sx={FILTER_LABEL_SX}>
                <FilterListIcon sx={{ fontSize: 13 }} /> Filter by Employee
              </Typography>
              <FormControl fullWidth size="small">
                <Select value={filterEmployeeId} onChange={(e) => setFilterEmployeeId(e.target.value)}
                  displayEmpty sx={SELECT_SX}
                  renderValue={(v) => {
                    if (!v) return <span style={{ color: "rgba(14,46,37,.45)" }}>All Employees</span>;
                    const emp = employees.find((e) => (e._id || e.id) === v);
                    return emp ? `${emp.firstName} ${emp.lastName}` : "All Employees";
                  }}>
                  <MenuItem value="">All Employees</MenuItem>
                  {employees.filter((e) => !e.status || e.status === "active").map((e) => (
                    <MenuItem key={e._id || e.id} value={e._id || e.id}>{e.firstName} {e.lastName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Filter by Task */}
            <Box sx={{ flex: 1, minWidth: 180 }}>
              <Typography sx={FILTER_LABEL_SX}>
                <FilterListIcon sx={{ fontSize: 13 }} /> Filter by Task
              </Typography>
              <FormControl fullWidth size="small">
                <Select value={filterTaskId} onChange={(e) => setFilterTaskId(e.target.value)}
                  displayEmpty sx={SELECT_SX}
                  renderValue={(v) => {
                    if (!v) return <span style={{ color: "rgba(14,46,37,.45)" }}>All Tasks</span>;
                    return tasks.find((t) => t.id === v)?.name || "All Tasks";
                  }}>
                  <MenuItem value="">All Tasks</MenuItem>
                  {tasks.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>

            {/* Weekends toggle — week view only */}
            {viewMode === "week" && (
              <FormControlLabel
                control={
                  <Checkbox checked={showWeekends} onChange={(e) => setShowWeekends(e.target.checked)}
                    size="small" sx={{ color: DARK, "&.Mui-checked": { color: DARK } }} />
                }
                label={<Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0e2e25" }}>Weekends</Typography>}
                sx={{ mb: 0, mr: 0 }}
              />
            )}
          </Stack>
        </Paper>

        {/* Schedule grid */}
        <Paper elevation={0} sx={{ ...CARD_SX, overflowX: "auto" }}>
          {loading ? (
            <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={28} sx={{ color: DARK }} />
            </Box>
          ) : viewMode === "week" ? (
            <Box sx={{
              display: "grid",
              gridTemplateColumns: `repeat(${visibleDays.length}, 1fr)`,
              minWidth: visibleDays.length * 120,
            }}>
              {visibleDays.map((date, i) => (
                <DayColumn
                  key={toDateStr(date)}
                  date={date}
                  dayName={DAY_NAMES[i]}
                  dayShifts={shiftsForDay(date)}
                  dayLeave={leaveForDay(date)}
                  canCreate={isPrivileged}
                  canEditShift={canEditShift}
                  onAddClick={openAdd}
                  onCardClick={openEdit}
                />
              ))}
            </Box>
          ) : (
            <Box className="sched-month-grid">
              {/* Day-of-week headers */}
              {DAY_NAMES.map((name) => (
                <Box key={name} className="sched-month-header">{name}</Box>
              ))}
              {/* Month cells */}
              {monthGridDates.map((date) => {
                const ds = toDateStr(date);
                const dayShifts = filteredShifts.filter((sh) => sh.date?.slice(0, 10) === ds);
                const dayLeave = leaveForDay(date);
                const leaveByType = { vacation: 0, sick: 0, personal: 0 };
                dayLeave.forEach((lr) => {
                  if (leaveByType[lr.type] !== undefined) leaveByType[lr.type]++;
                });
                return (
                  <MonthCell
                    key={ds}
                    date={date}
                    currentMonth={isCurrentMonth(date, monthYear, monthMonth)}
                    today={isTodayDate(date)}
                    shiftCount={dayShifts.length}
                    leaveByType={leaveByType}
                    onClick={handleMonthDayClick}
                  />
                );
              })}
            </Box>
          )}
        </Paper>

        {/* Stats */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
          {[
            { icon: <PeopleAltOutlinedIcon />,     label: "Total Employees", value: totalEmployees },
            { icon: <CalendarMonthOutlinedIcon />, label: "Total Shifts",    value: statsShifts.length },
            { icon: <AccessTimeOutlinedIcon />,    label: "Total Hours",     value: fmtHM(totalHours) },
          ].map(({ icon, label, value }) => (
            <Paper key={label} elevation={0} sx={{ ...CARD_SX, p: "18px 20px", display: "flex", alignItems: "center", gap: 1.75 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: "8px", bgcolor: "rgba(26,58,46,.08)", display: "grid", placeItems: "center", color: DARK, flexShrink: 0 }}>
                {icon}
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: "rgba(14,46,37,.60)", fontWeight: 600 }}>{label}</Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 900, color: "#0e2e25", lineHeight: 1.2 }}>{value}</Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        <ZcorAllRightsReserved />
      </Box>

      <ShiftModal
        open={modal.open}
        date={modal.date}
        shift={modal.shift}
        employees={employees}
        tasks={tasks}
        approvedLeave={approvedLeave}
        currentUser={user}
        isPrivileged={isPrivileged}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={handleDelete}
        onNewTask={handleNewTask}
      />
    </Box>
  );
}
