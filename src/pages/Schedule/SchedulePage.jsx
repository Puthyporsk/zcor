import React from "react";
import {
  Typography, Box, Paper, Button, IconButton,
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

import { useAuth }       from "../../context/AuthContext";
import { getShifts }     from "../../api/shifts";
import { getTasks }      from "../../api/tasks";
import { getUsers }      from "../../api/user";
import ShiftModal        from "./ShiftModal";
import ZcorAllRightsReserved from "../../components/ZcorAllRightsReserved";
import "../../styles/schedule.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_NAMES  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const DARK       = "#1a3a2e";
const DARK_MID   = "rgba(26,58,46,.35)";

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

function DayColumn({ date, dayName, dayShifts, canCreate, canEditShift, onAddClick, onCardClick }) {
  const count = dayShifts.length;
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

        {count === 0 ? (
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
        {count > 0 && (
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: DARK, opacity: 0.75 }}>
            {count} {count === 1 ? "shift" : "shifts"}
          </Typography>
        )}
      </Box>
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

  const [weekStart,        setWeekStart]        = React.useState(() => getMonday(new Date()));
  const [shifts,           setShifts]           = React.useState([]);
  const [employees,        setEmployees]         = React.useState([]);
  const [tasks,            setTasks]            = React.useState([]);
  const [loading,          setLoading]          = React.useState(true);
  const [showWeekends,     setShowWeekends]     = React.useState(false);
  const [filterEmployeeId, setFilterEmployeeId] = React.useState("");
  const [filterTaskId,     setFilterTaskId]     = React.useState("");
  const [modal, setModal] = React.useState({ open: false, date: null, shift: null });

  const weekEnd    = React.useMemo(() => addDays(weekStart, 6), [weekStart]);
  const days       = React.useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const visibleDays = showWeekends ? days : days.slice(0, 5);

  // ── data load ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [shiftsData, usersData, tasksData] = await Promise.all([
          getShifts({ from: toDateStr(weekStart), to: toDateStr(weekEnd) }),
          getUsers(),
          getTasks(),
        ]);
        if (!cancelled) {
          setShifts(shiftsData);
          setEmployees(usersData);
          setTasks(tasksData);
        }
      } catch (_) {}
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [weekStart, weekEnd]);

  // ── week nav ───────────────────────────────────────────────────────────
  const goToday = () => setWeekStart(getMonday(new Date()));
  const goPrev  = () => setWeekStart((w) => addDays(w, -7));
  const goNext  = () => setWeekStart((w) => addDays(w, 7));

  const formatWeekRange = () => {
    const s = weekStart, e = weekEnd;
    const sm = MONTH_ABBR[s.getMonth()], em = MONTH_ABBR[e.getMonth()];
    return sm === em
      ? `${sm} ${s.getDate()}, ${s.getFullYear()} - ${sm} ${e.getDate()}, ${e.getFullYear()}`
      : `${sm} ${s.getDate()}, ${s.getFullYear()} - ${em} ${e.getDate()}, ${e.getFullYear()}`;
  };

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

  const canEditShift = (shift) => {
    if (isPrivileged) return true;
    return isSameId(shift.employee?.id || shift.employee?._id, user?._id);
  };

  // ── stats ──────────────────────────────────────────────────────────────
  const visibleDateStrs = React.useMemo(() => new Set(visibleDays.map(toDateStr)), [visibleDays]);

  const statsShifts = React.useMemo(
    () => filteredShifts.filter((sh) => visibleDateStrs.has(sh.date?.slice(0, 10))),
    [filteredShifts, visibleDateStrs]
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
          <Typography sx={{ fontSize: 12.5, color: "rgba(14,46,37,.65)" }}>Manage weekly work schedules</Typography>
        </Box>

        {/* Week nav + filters card */}
        <Paper elevation={0} sx={{ ...CARD_SX, p: "16px 20px" }}>
          {/* Navigation row */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <EventNoteOutlinedIcon sx={{ color: DARK, opacity: 0.7, fontSize: 22 }} />
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: "#0e2e25" }}>{formatWeekRange()}</Typography>
                <Typography sx={{ fontSize: 11.5, color: "rgba(14,46,37,.55)", mt: "1px" }}>Week View</Typography>
              </Box>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <IconButton size="small" onClick={goPrev} aria-label="Previous week"
                sx={{ border: "1px solid rgba(14,46,37,.2)", borderRadius: "6px", color: "#0e2e25" }}>
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <Button variant="outlined" size="small" onClick={goToday}
                sx={{ borderRadius: "6px", textTransform: "none", fontWeight: 700, borderColor: "rgba(14,46,37,.2)", color: "#0e2e25", px: 1.75 }}>
                Today
              </Button>
              <IconButton size="small" onClick={goNext} aria-label="Next week"
                sx={{ border: "1px solid rgba(14,46,37,.2)", borderRadius: "6px", color: "#0e2e25" }}>
                <ChevronRightIcon fontSize="small" />
              </IconButton>
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

            {/* Weekends toggle */}
            <FormControlLabel
              control={
                <Checkbox checked={showWeekends} onChange={(e) => setShowWeekends(e.target.checked)}
                  size="small" sx={{ color: DARK, "&.Mui-checked": { color: DARK } }} />
              }
              label={<Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0e2e25" }}>Weekends</Typography>}
              sx={{ mb: 0, mr: 0 }}
            />
          </Stack>
        </Paper>

        {/* Schedule grid */}
        <Paper elevation={0} sx={{ ...CARD_SX, overflowX: "auto" }}>
          {loading ? (
            <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={28} sx={{ color: DARK }} />
            </Box>
          ) : (
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
                  canCreate={isPrivileged}
                  canEditShift={canEditShift}
                  onAddClick={openAdd}
                  onCardClick={openEdit}
                />
              ))}
            </Box>
          )}
        </Paper>

        {/* Stats */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
          {[
            { icon: <PeopleAltOutlinedIcon />,     label: "Total Employees", value: totalEmployees },
            { icon: <CalendarMonthOutlinedIcon />, label: "Total Shifts",    value: statsShifts.length },
            { icon: <AccessTimeOutlinedIcon />,    label: "Total Hours",     value: `${totalHours.toFixed(1)}h` },
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
