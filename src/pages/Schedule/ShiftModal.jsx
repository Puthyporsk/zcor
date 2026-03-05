import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  FormControl,
  Select,
  MenuItem,
  Button,
  IconButton,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { createShift, updateShift, deleteShift } from "../../api/shifts";
import { createTask } from "../../api/tasks";

const MONTH_FULL = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_FULL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function getInitials(firstName, lastName) {
  return `${(firstName || "?")[0]}${(lastName || "")[0] || ""}`.toUpperCase();
}

const BRAND = "#0E2E25";
const BRAND_MED = "rgba(14,46,37,0.08)";
const BRAND_BORDER = "rgba(14,46,37,0.18)";

export default function ShiftModal({
  open,
  date,
  shift,
  employees,
  tasks,
  approvedLeave = [],
  currentUser,
  isPrivileged,
  onClose,
  onSave,
  onDelete,
  onNewTask,
}) {
  const isEdit   = Boolean(shift);
  const dayLabel = date
    ? `${DAY_FULL[date.getDay()]}, ${MONTH_FULL[date.getMonth()]} ${date.getDate()}`
    : "";

  // ── form state ────────────────────────────────────────────────────────────
  const [selectedEmpId, setSelectedEmpId] = React.useState("");
  const [empSearch,     setEmpSearch]     = React.useState("");
  const [startTime,     setStartTime]     = React.useState("09:00");
  const [endTime,       setEndTime]       = React.useState("17:00");
  const [taskId,        setTaskId]        = React.useState("");
  const [notes,         setNotes]         = React.useState("");

  const [addingTask,  setAddingTask]  = React.useState(false);
  const [newTaskName, setNewTaskName] = React.useState("");
  const [taskSaving,  setTaskSaving]  = React.useState(false);

  const [saving,        setSaving]        = React.useState(false);
  const [error,         setError]         = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  // ── leave conflict detection ──────────────────────────────────────────────
  const leaveConflict = React.useMemo(() => {
    if (!date || !selectedEmpId) return null;
    const ds = date.toISOString().slice(0, 10);
    return approvedLeave.find((lr) => {
      const empId = lr.employee?._id || lr.employee?.id || lr.employee;
      if (String(empId) !== String(selectedEmpId)) return false;
      const start = lr.startDate?.slice(0, 10);
      const end   = lr.endDate?.slice(0, 10);
      return start && end && start <= ds && ds <= end;
    }) || null;
  }, [date, selectedEmpId, approvedLeave]);

  // Seed form when modal opens
  React.useEffect(() => {
    if (!open) return;
    setSaving(false);
    if (isEdit) {
      setSelectedEmpId(shift.employee?.id || shift.employee?._id || "");
      setStartTime(shift.startTime || "09:00");
      setEndTime(shift.endTime || "17:00");
      setTaskId(shift.task?.id || shift.task?._id || "");
      setNotes(shift.notes || "");
    } else {
      setSelectedEmpId("");
      setStartTime("09:00");
      setEndTime("17:00");
      setTaskId("");
      setNotes("");
    }
    setEmpSearch("");
    setError("");
    setAddingTask(false);
    setNewTaskName("");
    setConfirmDelete(false);
  }, [open, shift, isEdit]);

  const filteredEmps = React.useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    return employees.filter((e) => {
      if (e.status && e.status !== "active") return false;
      if (!q) return true;
      const full  = `${e.firstName} ${e.lastName}`.toLowerCase();
      const title = (e.employeeMeta?.jobTitle || "").toLowerCase();
      return full.includes(q) || title.includes(q);
    });
  }, [employees, empSearch]);

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setError("");
    if (!isEdit && !selectedEmpId) { setError("Please select an employee."); return; }
    if (!startTime || !endTime)    { setError("Start and end times are required."); return; }
    if (startTime >= endTime)      { setError("End time must be after start time."); return; }
    if (!taskId)                   { setError("Please select a task."); return; }

    setSaving(true);
    try {
      let result;
      if (isEdit) {
        result = await updateShift(shift.id, {
          startTime, endTime,
          taskId: taskId || undefined,
          notes:  notes  || undefined,
        });
      } else {
        result = await createShift({
          employeeId: selectedEmpId,
          date: date.toISOString().slice(0, 10),
          startTime, endTime,
          taskId: taskId || undefined,
          notes:  notes  || undefined,
        });
      }
      onSave(result);
    } catch (err) {
      setError(err.message || "Failed to save shift.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteShift(shift.id);
      onDelete(shift.id);
    } catch (err) {
      setError(err.message || "Failed to delete shift.");
      setConfirmDelete(false);
      setSaving(false);
    }
  };

  const handleConfirmNewTask = async () => {
    const name = newTaskName.trim();
    if (!name) return;
    setTaskSaving(true);
    try {
      const created = await createTask({ name });
      onNewTask(created);
      setTaskId(created.id);
      setAddingTask(false);
      setNewTaskName("");
    } catch (err) {
      setError(err.message || "Failed to create task.");
    } finally {
      setTaskSaving(false);
    }
  };

  const handleTaskSelectChange = (e) => {
    const val = e.target.value;
    if (val === "__add__") {
      setAddingTask(true);
      setTaskId("");
    } else {
      setTaskId(val);
    }
  };

  const handleClose = () => { setSaving(false); onClose(); };

  const canDelete = isPrivileged && isEdit;
  const saveBtnDisabled =
    saving ||
    (!isEdit && !selectedEmpId) ||
    !startTime || !endTime || !taskId;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: "10px",
          bgcolor: "#F9FAF8",
          border: `1px solid ${BRAND_BORDER}`,
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          pb: 0.5,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography
            sx={{ fontWeight: 700, fontSize: 18, color: BRAND, lineHeight: 1.3 }}
          >
            {isEdit ? "Edit Shift" : "Schedule Employee"}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "rgba(14,46,37,0.5)", mt: 0.25 }}>
            {isEdit ? `Editing shift for ${dayLabel}` : `Add a shift for ${dayLabel}`}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleClose} sx={{ mt: -0.5, mr: -0.5 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ mt: 1, borderColor: BRAND_BORDER }} />

      <DialogContent sx={{ pt: 2, pb: 1, display: "flex", flexDirection: "column", gap: 2 }}>

        {/* Employee section */}
        {!isEdit ? (
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Employee
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="Search by name or job title..."
              value={empSearch}
              onChange={(e) => setEmpSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: "rgba(14,46,37,0.4)" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 1,
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#fff",
                  borderRadius: "6px",
                  "& fieldset": { borderColor: BRAND_BORDER },
                  "&:hover fieldset": { borderColor: BRAND },
                  "&.Mui-focused fieldset": { borderColor: BRAND },
                },
              }}
            />
            <List
              dense
              disablePadding
              sx={{
                maxHeight: 180,
                overflowY: "auto",
                border: `1px solid ${BRAND_BORDER}`,
                borderRadius: "6px",
                bgcolor: "#fff",
              }}
            >
              {filteredEmps.length === 0 ? (
                <Box sx={{ p: 1.5, textAlign: "center", fontSize: 13, color: "rgba(14,46,37,0.45)" }}>
                  No employees found
                </Box>
              ) : (
                filteredEmps.map((emp) => {
                  const empId = emp._id || emp.id;
                  const selected = selectedEmpId === empId;
                  return (
                    <ListItemButton
                      key={empId}
                      selected={selected}
                      onClick={() => setSelectedEmpId(empId)}
                      sx={{
                        borderRadius: "4px",
                        mx: 0.5,
                        my: 0.25,
                        "&.Mui-selected": {
                          bgcolor: BRAND_MED,
                          "&:hover": { bgcolor: BRAND_MED },
                        },
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar
                          sx={{
                            width: 30, height: 30, fontSize: 11,
                            bgcolor: selected ? BRAND : "rgba(14,46,37,0.15)",
                            color: selected ? "#fff" : BRAND,
                            fontWeight: 700,
                          }}
                        >
                          {getInitials(emp.firstName, emp.lastName)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${emp.firstName} ${emp.lastName}`}
                        secondary={emp.employeeMeta?.jobTitle || emp.role}
                        primaryTypographyProps={{ fontSize: 13, fontWeight: 600, color: BRAND }}
                        secondaryTypographyProps={{ fontSize: 11, color: "rgba(14,46,37,0.5)" }}
                      />
                    </ListItemButton>
                  );
                })
              )}
            </List>
          </Box>
        ) : (
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Employee
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Avatar sx={{ width: 34, height: 34, fontSize: 12, bgcolor: BRAND, color: "#fff", fontWeight: 700 }}>
                {getInitials(shift?.employee?.firstName, shift?.employee?.lastName)}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: BRAND }}>
                  {shift?.employee?.firstName} {shift?.employee?.lastName}
                </Typography>
                <Typography sx={{ fontSize: 11, color: "rgba(14,46,37,0.5)" }}>
                  {shift?.employee?.employeeMeta?.jobTitle || shift?.employee?.role}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {/* Start / End time */}
        <Stack direction="row" spacing={1.5}>
          <Box flex={1}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Start Time
            </Typography>
            <TextField
              type="time"
              size="small"
              fullWidth
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#fff",
                  borderRadius: "6px",
                  "& fieldset": { borderColor: BRAND_BORDER },
                  "&:hover fieldset": { borderColor: BRAND },
                  "&.Mui-focused fieldset": { borderColor: BRAND },
                },
              }}
            />
          </Box>
          <Box flex={1}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: 0.5 }}>
              End Time
            </Typography>
            <TextField
              type="time"
              size="small"
              fullWidth
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#fff",
                  borderRadius: "6px",
                  "& fieldset": { borderColor: BRAND_BORDER },
                  "&:hover fieldset": { borderColor: BRAND },
                  "&.Mui-focused fieldset": { borderColor: BRAND },
                },
              }}
            />
          </Box>
        </Stack>

        {/* Task / Activity */}
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Task / Activity
          </Typography>
          {addingTask ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                fullWidth
                placeholder="New task name..."
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirmNewTask()}
                autoFocus
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#fff",
                    borderRadius: "6px",
                    "& fieldset": { borderColor: BRAND_BORDER },
                    "&:hover fieldset": { borderColor: BRAND },
                    "&.Mui-focused fieldset": { borderColor: BRAND },
                  },
                }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleConfirmNewTask}
                disabled={taskSaving || !newTaskName.trim()}
                sx={{
                  bgcolor: BRAND, color: "#fff", borderRadius: "6px", whiteSpace: "nowrap",
                  textTransform: "none", fontWeight: 600, minWidth: 52,
                  "&:hover": { bgcolor: "#1a4a37" },
                  "&.Mui-disabled": { bgcolor: "rgba(14,46,37,0.25)", color: "#fff" },
                }}
              >
                {taskSaving ? "…" : "Add"}
              </Button>
              <IconButton
                size="small"
                onClick={() => { setAddingTask(false); setNewTaskName(""); }}
                sx={{ color: "rgba(14,46,37,0.5)" }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          ) : (
            <FormControl fullWidth size="small">
              <Select
                value={taskId}
                onChange={handleTaskSelectChange}
                displayEmpty
                renderValue={(val) => {
                  if (!val) return <span style={{ color: "rgba(14,46,37,0.4)" }}>Select a task...</span>;
                  return tasks.find((t) => t.id === val)?.name || val;
                }}
                sx={{
                  bgcolor: "#fff",
                  borderRadius: "6px",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: BRAND_BORDER },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: BRAND },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND },
                }}
              >
                <MenuItem value="" disabled>
                  <em style={{ color: "rgba(14,46,37,0.4)", fontStyle: "normal" }}>Select a task...</em>
                </MenuItem>
                {tasks.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                ))}
                {isPrivileged && (
                  <MenuItem value="__add__" sx={{ color: BRAND, fontWeight: 600 }}>
                    + Add new task...
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Leave conflict warning */}
        {leaveConflict && (
          <Box sx={{ bgcolor: "#fff8e1", border: "1px solid #ffb300", borderRadius: "6px", p: 1.25 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#e65100" }}>
              Leave conflict
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: "#bf360c", mt: 0.25 }}>
              This employee has approved{" "}
              {leaveConflict.type === "sick" ? "sick leave" : leaveConflict.type}{" "}
              on this day ({leaveConflict.totalHours}h). You can still schedule the shift.
            </Typography>
          </Box>
        )}

        {/* Error */}
        {error && (
          <Typography sx={{ fontSize: 12, color: "#c0392b", bgcolor: "rgba(192,57,43,0.08)", p: 1, borderRadius: 1.5 }}>
            {error}
          </Typography>
        )}

        {/* Delete confirmation */}
        {confirmDelete && (
          <Box
            sx={{
              border: "1px solid rgba(192,57,43,0.25)",
              bgcolor: "rgba(192,57,43,0.05)",
              borderRadius: "6px",
              p: 1.5,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <DeleteOutlineIcon sx={{ color: "#c0392b", fontSize: 22 }} />
              <Box flex={1}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#c0392b" }}>
                  Delete this shift?
                </Typography>
                <Typography sx={{ fontSize: 11, color: "rgba(14,46,37,0.55)" }}>
                  {shift?.employee?.firstName} {shift?.employee?.lastName} · {shift?.startTime}–{shift?.endTime}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.75}>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={saving}
                  onClick={() => setConfirmDelete(false)}
                  sx={{
                    textTransform: "none", borderRadius: "6px", fontSize: 12,
                    borderColor: BRAND_BORDER, color: BRAND,
                    "&:hover": { borderColor: BRAND, bgcolor: BRAND_MED },
                  }}
                >
                  Keep
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={saving}
                  onClick={handleDelete}
                  sx={{
                    textTransform: "none", borderRadius: "6px", fontSize: 12,
                    bgcolor: "#c0392b", color: "#fff",
                    "&:hover": { bgcolor: "#a93226" },
                    "&.Mui-disabled": { bgcolor: "rgba(192,57,43,0.4)", color: "#fff" },
                  }}
                >
                  {saving ? "Deleting…" : "Yes, Delete"}
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}
      </DialogContent>

      <Divider sx={{ borderColor: BRAND_BORDER }} />

      {/* Action buttons */}
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
        {canDelete && !confirmDelete && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<DeleteOutlineIcon />}
            disabled={saving}
            onClick={() => setConfirmDelete(true)}
            sx={{
              textTransform: "none", borderRadius: "6px", fontSize: 13,
              borderColor: "rgba(192,57,43,0.4)", color: "#c0392b", mr: "auto",
              "&:hover": { borderColor: "#c0392b", bgcolor: "rgba(192,57,43,0.06)" },
            }}
          >
            Delete
          </Button>
        )}
        <Button
          variant="outlined"
          size="small"
          onClick={handleClose}
          sx={{
            textTransform: "none", borderRadius: "6px", fontSize: 13,
            borderColor: BRAND_BORDER, color: BRAND,
            "&:hover": { borderColor: BRAND, bgcolor: BRAND_MED },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          disabled={saveBtnDisabled}
          onClick={handleSave}
          sx={{
            textTransform: "none", borderRadius: "6px", fontSize: 13,
            bgcolor: BRAND, color: "#fff",
            "&:hover": { bgcolor: "#1a4a37" },
            "&.Mui-disabled": { bgcolor: "rgba(14,46,37,0.25)", color: "#fff" },
          }}
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Shift"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
