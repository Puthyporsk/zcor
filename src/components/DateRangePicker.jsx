import React from "react";
import { Box, Typography, Stack, Divider, IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const toDS = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

function MonthGrid({ m, startDate, endDate, today, isOverlap, disablePast, onClick, onHover, picking, showLabel }) {
  const { year, month } = m;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = toDS(today);
  const blanks = Array.from({ length: firstDay }, (_, i) => <Box key={`b${i}`} />);

  const cells = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const isPast = disablePast && ds < todayStr;
    const overlap = isOverlap ? isOverlap(ds) : false;
    const disabled = isPast || overlap;

    const isStart = ds === startDate;
    const isEnd   = ds === endDate;
    const inRange = startDate && endDate && ds > startDate && ds < endDate;
    const isToday = ds === todayStr;

    let bg = "transparent";
    let color = "#0e2e25";
    let fontWeight = 600;

    if (isStart || isEnd) {
      bg = "#1565c0"; color = "#fff"; fontWeight = 800;
    } else if (inRange) {
      bg = "rgba(21,101,192,0.12)";
    }
    if (disabled) { color = "rgba(15,27,16,0.25)"; }

    return (
      <Box
        key={ds}
        onClick={disabled ? undefined : () => onClick(ds)}
        onMouseEnter={!disabled && picking === "end" ? () => onHover(ds) : undefined}
        onMouseLeave={picking === "end" ? () => onHover(null) : undefined}
        sx={{
          width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight, color, cursor: disabled ? "default" : "pointer", position: "relative",
          borderRadius: isStart ? "50% 0 0 50%" : isEnd ? "0 50% 50% 0" : (isStart && isEnd) ? "50%" : inRange ? 0 : "50%",
          bgcolor: bg,
          transition: "background .1s",
          ...(!disabled && !isStart && !isEnd && !inRange && { "&:hover": { bgcolor: "rgba(21,101,192,0.08)" } }),
          ...(overlap && { textDecoration: "line-through" }),
        }}
      >
        {day}
        {isToday && !isStart && !isEnd && (
          <Box sx={{ position: "absolute", bottom: 2, width: 4, height: 4, borderRadius: "50%", bgcolor: "#1565c0" }} />
        )}
      </Box>
    );
  });

  return (
    <Box sx={{ flex: 1, px: 1.5, pb: 1.5 }}>
      {showLabel && (
        <Typography sx={{ fontWeight: 800, fontSize: 13, textAlign: "center", py: 0.75, display: { xs: "block", sm: "none" } }}>
          {MONTHS[month]} {year}
        </Typography>
      )}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 36px)", justifyContent: "center", gap: "2px", mb: 0.5 }}>
        {DAYS.map((d) => (
          <Box key={d} sx={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "rgba(15,27,16,0.4)", py: 0.5 }}>{d}</Box>
        ))}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 36px)", justifyContent: "center", gap: "2px" }}>
        {blanks}
        {cells}
      </Box>
    </Box>
  );
}

export default function DateRangePicker({ startDate, endDate, onRangeChange, existingRequests, editingId, disablePast = true, singlePick = false }) {
  const today = React.useMemo(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const [anchor, setAnchor] = React.useState(() => {
    if (startDate) { const d = new Date(startDate + "T00:00:00"); return new Date(d.getFullYear(), d.getMonth(), 1); }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [open, setOpen] = React.useState(false);
  const [picking, setPicking] = React.useState(startDate && !endDate ? "end" : "start");
  const [hoverDate, setHoverDate] = React.useState(null);

  const month1 = { year: anchor.getFullYear(), month: anchor.getMonth() };
  const m2 = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
  const month2 = { year: m2.getFullYear(), month: m2.getMonth() };

  const goPrev = () => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1));
  const goNext = () => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1));

  const isOverlap = React.useCallback((ds) => {
    if (!existingRequests) return false;
    return existingRequests.some((r) => {
      if (editingId && r.id === editingId) return false;
      if (r.status !== "approved" && r.status !== "pending") return false;
      const rStart = r.startDate?.slice(0, 10);
      const rEnd = r.endDate?.slice(0, 10);
      return rStart <= ds && ds <= rEnd;
    });
  }, [existingRequests, editingId]);

  const handleClick = (ds) => {
    if (singlePick) {
      onRangeChange(ds, "");
      setPicking("start");
      return;
    }
    if (picking === "start") {
      onRangeChange(ds, "");
      setPicking("end");
    } else {
      if (ds < startDate) {
        onRangeChange(ds, "");
        setPicking("end");
      } else {
        onRangeChange(startDate, ds);
        setPicking("start");
      }
    }
  };

  // Auto-navigate so the full range is visible
  React.useEffect(() => {
    if (!startDate && !endDate) return;
    const target = endDate || startDate;
    if (!target) return;
    const d = new Date(target + "T00:00:00");
    const targetMonth = d.getFullYear() * 12 + d.getMonth();
    const anchorMonth = anchor.getFullYear() * 12 + anchor.getMonth();
    // The calendar shows anchorMonth and anchorMonth+1
    if (targetMonth > anchorMonth + 1) {
      // End date is past the second visible month — shift so end date is in month2
      setAnchor(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    } else if (targetMonth < anchorMonth) {
      // Start date is before the first visible month
      setAnchor(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveEnd = picking === "end" && hoverDate && hoverDate >= startDate ? hoverDate : endDate;

  const fmtDisplay = (ds) => {
    if (!ds) return "Select date";
    const d = new Date(ds + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <Box>
      {/* Header pills */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: open ? 1.5 : 0 }}>
        {(startDate || endDate) ? (
          <Typography
            onClick={() => { onRangeChange("", ""); setPicking("start"); setOpen(false); }}
            sx={{ fontSize: 12, fontWeight: 700, color: "rgba(15,27,16,0.45)", cursor: "pointer", whiteSpace: "nowrap", "&:hover": { color: "#c62828" } }}
          >
            Reset
          </Typography>
        ) : open && (
          <Typography
            onClick={() => setOpen(false)}
            sx={{ fontSize: 12, fontWeight: 700, color: "rgba(15,27,16,0.45)", cursor: "pointer", whiteSpace: "nowrap", "&:hover": { color: "#0e2e25" } }}
          >
            Close
          </Typography>
        )}
        <Box onClick={() => { setPicking("start"); setOpen(true); }} sx={{
          flex: 1, display: "flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.75,
          borderRadius: "8px", cursor: "pointer", fontSize: 13, fontWeight: 700,
          border: (open && picking === "start") ? "2px solid #1565c0" : "1px solid rgba(15,27,16,0.2)",
          bgcolor: (open && picking === "start") ? "rgba(21,101,192,0.06)" : "transparent",
          color: startDate ? "#0e2e25" : "rgba(15,27,16,0.4)",
        }}>
          <CalendarMonthOutlinedIcon sx={{ fontSize: 16, opacity: 0.6 }} />
          {fmtDisplay(startDate)}
        </Box>
        <Typography sx={{ alignSelf: "center", fontSize: 13, color: "rgba(15,27,16,0.35)", fontWeight: 700 }}>→</Typography>
        <Box onClick={singlePick ? undefined : () => { if (startDate) { setPicking("end"); setOpen(true); } else { setOpen(true); } }} sx={{
          flex: 1, display: "flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.75,
          borderRadius: "8px", cursor: singlePick ? "default" : "pointer", fontSize: 13, fontWeight: 700,
          border: (open && picking === "end") ? "2px solid #1565c0" : "1px solid rgba(15,27,16,0.2)",
          bgcolor: singlePick ? "rgba(15,27,16,0.04)" : (open && picking === "end") ? "rgba(21,101,192,0.06)" : "transparent",
          color: endDate ? "#0e2e25" : "rgba(15,27,16,0.4)",
          opacity: singlePick ? 0.7 : 1,
        }}>
          <CalendarMonthOutlinedIcon sx={{ fontSize: 16, opacity: 0.6 }} />
          {fmtDisplay(endDate)}
        </Box>
      </Stack>

      {/* Calendar */}
      {open && <Box sx={{ border: "1px solid rgba(15,27,16,0.12)", borderRadius: "12px", overflow: "hidden" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1.5, py: 1 }}>
          <IconButton size="small" onClick={goPrev}><ChevronLeftIcon fontSize="small" /></IconButton>
          <Stack direction="row" spacing={4}>
            <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{MONTHS[month1.month]} {month1.year}</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 14, display: { xs: "none", sm: "block" } }}>{MONTHS[month2.month]} {month2.year}</Typography>
          </Stack>
          <IconButton size="small" onClick={goNext}><ChevronRightIcon fontSize="small" /></IconButton>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} divider={<Divider orientation="vertical" flexItem />}>
          <MonthGrid m={month1} startDate={startDate} endDate={effectiveEnd} today={today} isOverlap={existingRequests ? isOverlap : null} disablePast={disablePast} onClick={handleClick} onHover={setHoverDate} picking={picking} showLabel={false} />
          <MonthGrid m={month2} startDate={startDate} endDate={effectiveEnd} today={today} isOverlap={existingRequests ? isOverlap : null} disablePast={disablePast} onClick={handleClick} onHover={setHoverDate} picking={picking} showLabel />
        </Stack>
      </Box>}
    </Box>
  );
}
