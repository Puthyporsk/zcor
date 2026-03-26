import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useAuth } from "../../context/AuthContext";
import * as clockApi from "../../api/clockSession";
import * as projectsApi from "../../api/projects";
import * as tasksApi from "../../api/tasks";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatElapsed(ms) {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function ClockWidget({ projects, tasks, onEntryCreated, onProjectCreated, onTaskCreated }) {
  const { user } = useAuth();
  const [session, setSession] = useState(null);    // active or stale session
  const [isStale, setIsStale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form fields (for clock-in)
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [description, setDescription] = useState("");

  // Inline add project/task
  const [addingProject, setAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [projectSaving, setProjectSaving] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [taskSaving, setTaskSaving] = useState(false);

  const canAdd = user?.role === "owner" || user?.role === "manager";

  const handleAddNewProject = async () => {
    const name = newProjectName.trim();
    if (!name) return;
    setProjectSaving(true);
    try {
      const created = await projectsApi.createProject({ name });
      if (onProjectCreated) onProjectCreated(created);
      setProjectId(created.id);
      setAddingProject(false);
      setNewProjectName("");
    } catch (err) {
      setError(err.message || "Failed to create project.");
    } finally {
      setProjectSaving(false);
    }
  };

  const handleAddNewTask = async () => {
    const name = newTaskName.trim();
    if (!name) return;
    setTaskSaving(true);
    try {
      const created = await tasksApi.createTask({ name });
      if (onTaskCreated) onTaskCreated(created);
      setTaskId(created.id);
      setAddingTask(false);
      setNewTaskName("");
    } catch (err) {
      setError(err.message || "Failed to create task.");
    } finally {
      setTaskSaving(false);
    }
  };

  // Stale resolution
  const [resolveTime, setResolveTime] = useState("");

  // Live timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  // ── load active session on mount ──────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await clockApi.getActiveSession();
        if (cancelled) return;
        if (data) {
          setSession(data);
          if (data.stale) {
            setIsStale(true);
          }
          if (data.project) setProjectId(data.project.id);
          if (data.task) setTaskId(data.task.id);
          setDescription(data.description || "");
        }
      } catch {
        // silently fail — widget just shows idle state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── live timer ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (session && session.status === "active" && !isStale) {
      const clockIn = new Date(session.clockIn).getTime();
      const tick = () => setElapsed(Date.now() - clockIn);
      tick();
      timerRef.current = setInterval(tick, 1000);
      return () => clearInterval(timerRef.current);
    } else {
      setElapsed(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [session, isStale]);

  // ── actions ───────────────────────────────────────────────────────────────

  const handleClockIn = useCallback(async () => {
    if (!projectId || !taskId) {
      setError("Please select a project and task.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const data = await clockApi.clockIn({
        projectId,
        taskId,
        description: description.trim() || undefined,
      });

      // If server returns stale session that needs resolving
      if (data.staleSession) {
        setSession(data.staleSession);
        setIsStale(true);
        setError(data.message);
        return;
      }

      setSession(data);
    } catch (err) {
      setError(err.message || "Failed to clock in.");
    } finally {
      setSaving(false);
    }
  }, [projectId, taskId, description]);

  const handleClockOut = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      const data = await clockApi.clockOut({
        projectId,
        taskId,
        description: description.trim() || undefined,
      });
      setSession(null);
      setProjectId("");
      setTaskId("");
      setDescription("");
      if (onEntryCreated && data.entry) {
        onEntryCreated(data.entry);
      }
    } catch (err) {
      setError(err.message || "Failed to clock out.");
    } finally {
      setSaving(false);
    }
  }, [projectId, taskId, description, onEntryCreated]);

  const handleResolve = useCallback(async () => {
    if (!resolveTime) {
      setError("Please enter a clock-out time.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await clockApi.resolveSession({ clockOut: resolveTime });
      setSession(null);
      setIsStale(false);
      setResolveTime("");
    } catch (err) {
      setError(err.message || "Failed to resolve session.");
    } finally {
      setSaving(false);
    }
  }, [resolveTime]);

  const handleDiscard = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      await clockApi.discardSession();
      setSession(null);
      setIsStale(false);
    } catch (err) {
      setError(err.message || "Failed to discard session.");
    } finally {
      setSaving(false);
    }
  }, []);

  // ── render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <Paper variant="outlined" className="te-clock" sx={{ borderRadius: "10px", p: 2.5, mb: 2, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 180 }}>
      <Typography sx={{ opacity: 0.45, fontWeight: 700, fontSize: 14 }}>Loading…</Typography>
    </Paper>
  );

  const isRunning = session && session.status === "active" && !isStale;

  return (
    <Paper variant="outlined" className="te-clock" sx={{ borderRadius: "10px", p: 2.5, mb: 2 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <AccessTimeIcon sx={{ color: isRunning ? "#2e7d32" : "#163A2E", fontSize: 22 }} />
        <Typography sx={{ fontWeight: 800, fontSize: 16, color: "#163A2E" }}>
          {isRunning ? "Currently Working" : "Time Clock"}
        </Typography>
        {isRunning && <span className="te-clock__dot" />}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* STALE SESSION */}
      {isStale && session && (
        <Box>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: "8px" }}>
            You have an open session from{" "}
            {new Date(session.clockIn).toLocaleString()}. Please enter the
            correct clock-out time or discard this session.
          </Alert>
          <TextField
            label="Clock-out time"
            type="datetime-local"
            size="small"
            fullWidth
            value={resolveTime}
            onChange={(e) => setResolveTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              size="small"
              onClick={handleResolve}
              disabled={saving}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={handleDiscard}
              disabled={saving}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
            >
              Discard
            </Button>
          </Stack>
        </Box>
      )}

      {/* RUNNING TIMER */}
      {isRunning && (
        <Box>
          <Typography className="te-clock__timer">
            {formatElapsed(elapsed)}
          </Typography>
          <Stack direction="row" spacing={1} mt={1} mb={2}>
            <Typography variant="body2" color="text.secondary">
              {session.project?.name || "—"} / {session.task?.name || "—"}
            </Typography>
          </Stack>
          <TextField
            label="Description (optional)"
            size="small"
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="outlined"
            color="error"
            fullWidth
            onClick={handleClockOut}
            disabled={saving}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: "10px",
              py: 1.2,
              fontSize: 15,
            }}
          >
            {saving ? "Clocking out..." : "Clock Out"}
          </Button>
        </Box>
      )}

      {/* IDLE — CLOCK IN FORM */}
      {!isRunning && !isStale && (
        <Box>
          <Stack spacing={1.5} mb={1.5}>
            {addingProject ? (
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <TextField
                  size="small" fullWidth
                  placeholder="New project name…"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNewProject()}
                  autoFocus
                />
                <Button
                  variant="contained" size="small"
                  onClick={handleAddNewProject}
                  disabled={projectSaving || !newProjectName.trim()}
                  sx={{ flexShrink: 0, height: "40px", borderRadius: "8px", px: 2, bgcolor: "#1a3a2e", textTransform: "none", fontWeight: 700, fontSize: 13, "&:hover": { bgcolor: "#0e2e25" } }}
                >
                  {projectSaving ? "…" : "Add"}
                </Button>
                <Button
                  variant="outlined" size="small"
                  onClick={() => { setAddingProject(false); setNewProjectName(""); }}
                  sx={{ flexShrink: 0, height: "40px", minWidth: "40px", borderRadius: "8px", px: 0, borderColor: "rgba(14,46,37,0.2)", color: "#0e2e25", textTransform: "none", fontWeight: 700, fontSize: 15 }}
                >
                  ✕
                </Button>
              </Box>
            ) : (
              <TextField
                select label={<>Project <span style={{ color: "#c62828" }}>*</span></>} size="small" fullWidth
                value={projectId}
                onChange={(e) => {
                  if (e.target.value === "__add__") { setAddingProject(true); }
                  else { setProjectId(e.target.value); }
                }}
              >
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
                {canAdd && (
                  <MenuItem value="__add__" sx={{ color: "primary.main", fontWeight: 700 }}>
                    + Add new project…
                  </MenuItem>
                )}
              </TextField>
            )}

            {addingTask ? (
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <TextField
                  size="small" fullWidth
                  placeholder="New task name…"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNewTask()}
                  autoFocus
                />
                <Button
                  variant="contained" size="small"
                  onClick={handleAddNewTask}
                  disabled={taskSaving || !newTaskName.trim()}
                  sx={{ flexShrink: 0, height: "40px", borderRadius: "8px", px: 2, bgcolor: "#1a3a2e", textTransform: "none", fontWeight: 700, fontSize: 13, "&:hover": { bgcolor: "#0e2e25" } }}
                >
                  {taskSaving ? "…" : "Add"}
                </Button>
                <Button
                  variant="outlined" size="small"
                  onClick={() => { setAddingTask(false); setNewTaskName(""); }}
                  sx={{ flexShrink: 0, height: "40px", minWidth: "40px", borderRadius: "8px", px: 0, borderColor: "rgba(14,46,37,0.2)", color: "#0e2e25", textTransform: "none", fontWeight: 700, fontSize: 15 }}
                >
                  ✕
                </Button>
              </Box>
            ) : (
              <TextField
                select label={<>Task <span style={{ color: "#c62828" }}>*</span></>} size="small" fullWidth
                value={taskId}
                onChange={(e) => {
                  if (e.target.value === "__add__") { setAddingTask(true); }
                  else { setTaskId(e.target.value); }
                }}
              >
                {tasks.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                ))}
                {canAdd && (
                  <MenuItem value="__add__" sx={{ color: "primary.main", fontWeight: 700 }}>
                    + Add new task…
                  </MenuItem>
                )}
              </TextField>
            )}
          </Stack>
          <TextField
            label="Description (optional)"
            size="small"
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            fullWidth
            onClick={handleClockIn}
            disabled={saving}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: "10px",
              py: 1.2,
              fontSize: 15,
              bgcolor: "#163A2E",
              "&:hover": { bgcolor: "#1a4a36" },
            }}
          >
            {saving ? "Clocking in..." : "Clock In"}
          </Button>
        </Box>
      )}
    </Paper>
  );
}
