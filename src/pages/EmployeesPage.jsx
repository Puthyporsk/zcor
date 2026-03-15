import React from "react";
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Snackbar, Alert, CircularProgress, Avatar, Stack, Divider,
  IconButton,
} from "@mui/material";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../context/AuthContext";
import { getUsers, inviteUser, updateUserRole } from "../api/user";
import ZcorAllRightsReserved from "../components/ZcorAllRightsReserved";

const BRAND = "#0E2E25";
const BRAND_LIGHT = "rgba(14,46,37,0.08)";

const FIELD_SX = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "#fff", borderRadius: "6px",
    "& fieldset": { borderColor: "rgba(14,46,37,.18)" },
    "&:hover fieldset": { borderColor: BRAND },
    "&.Mui-focused fieldset": { borderColor: BRAND },
  },
};

const STATUS_CHIP = {
  active:   { label: "Active",   bgcolor: "rgba(21,128,61,0.12)",  color: "#15803d" },
  invited:  { label: "Invited",  bgcolor: "rgba(202,138,4,0.12)",  color: "#b45309" },
  disabled: { label: "Disabled", bgcolor: "rgba(100,116,139,0.12)", color: "#475569" },
};

function getInitials(firstName, lastName) {
  return `${(firstName || "?")[0]}${(lastName || "")[0] || ""}`.toUpperCase();
}

export default function EmployeesPage() {
  const { user } = useAuth();
  const isManagerOrOwner = user?.role === "owner" || user?.role === "manager";

  const [employees,    setEmployees]    = React.useState([]);
  const [loading,      setLoading]      = React.useState(true);
  const [inviteOpen,      setInviteOpen]      = React.useState(false);
  const [inviteFirstName, setInviteFirstName] = React.useState("");
  const [inviteLastName,  setInviteLastName]  = React.useState("");
  const [inviteEmail,     setInviteEmail]     = React.useState("");
  const [invitePayType,   setInvitePayType]   = React.useState("hourly");
  const [inviteRate,      setInviteRate]      = React.useState("");
  const [inviteSaving,    setInviteSaving]    = React.useState(false);
  const [inviteError,     setInviteError]     = React.useState("");
  const [snack,        setSnack]        = React.useState({ open: false, msg: "", severity: "success" });

  const fetchEmployees = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setEmployees(data);
    } catch (err) {
      setSnack({ open: true, msg: err.message || "Failed to load employees", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleInvite = async () => {
    setInviteError("");
    if (!inviteFirstName.trim()) { setInviteError("First name is required"); return; }
    if (!inviteLastName.trim())  { setInviteError("Last name is required"); return; }
    if (!inviteEmail.trim())     { setInviteError("Email is required"); return; }
    if (!inviteRate || Number(inviteRate) <= 0) { setInviteError(invitePayType === "hourly" ? "Hourly rate is required" : "Annual salary is required"); return; }
    setInviteSaving(true);
    try {
      await inviteUser({
        firstName: inviteFirstName.trim(),
        lastName:  inviteLastName.trim(),
        email:     inviteEmail.trim(),
        payType:   invitePayType,
        hourlyRate: invitePayType === "hourly" ? Number(inviteRate) : 0,
        salaryRate: invitePayType === "salary" ? Number(inviteRate) : 0,
      });
      closeInviteDialog();
      setSnack({ open: true, msg: "Invitation sent successfully!", severity: "success" });
      fetchEmployees();
    } catch (err) {
      setInviteError(err.message || "Failed to send invitation");
    } finally {
      setInviteSaving(false);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      const updated = await updateUserRole(id, role);
      setEmployees((prev) => prev.map((e) => ((e._id || e.id) === id ? { ...e, role: updated.role } : e)));
      setSnack({ open: true, msg: "Role updated", severity: "success" });
    } catch (err) {
      setSnack({ open: true, msg: err.message || "Failed to update role", severity: "error" });
    }
  };

  const closeInviteDialog = () => {
    setInviteOpen(false);
    setInviteFirstName("");
    setInviteLastName("");
    setInviteEmail("");
    setInvitePayType("hourly");
    setInviteRate("");
    setInviteError("");
  };

  return (
    <Box sx={{ bgcolor: "#eef6f1", minHeight: "calc(100vh - 64px)", py: 4, px: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 960, mx: "auto", display: "flex", flexDirection: "column", gap: 3 }}>

        {/* Page header */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: BRAND }}>Employees</Typography>
            <Typography sx={{ fontSize: 12.5, color: "rgba(14,46,37,.65)", mt: "2px" }}>
              Manage your team members and their roles
            </Typography>
          </Box>
          {isManagerOrOwner && (
            <Button
              variant="contained"
              startIcon={<PersonAddOutlinedIcon />}
              onClick={() => setInviteOpen(true)}
              sx={{
                bgcolor: BRAND, color: "#fff", borderRadius: "8px",
                textTransform: "none", fontWeight: 700,
                "&:hover": { bgcolor: "#1a4a37" },
              }}
            >
              Invite Employee
            </Button>
          )}
        </Stack>

        {/* Table */}
        <Paper
          elevation={0}
          sx={{ borderRadius: "10px", border: "1px solid rgba(16,24,40,.06)", overflow: "hidden" }}
        >
          {loading ? (
            <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={28} sx={{ color: BRAND }} />
            </Box>
          ) : employees.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography sx={{ color: "rgba(14,46,37,.45)", fontSize: 14 }}>
                No employees yet. Invite your first team member.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: BRAND_LIGHT }}>
                    {["Employee", "User ID", "Email", "Role", "Status"].map((h) => (
                      <TableCell
                        key={h}
                        sx={{ fontSize: 11, fontWeight: 700, color: "rgba(14,46,37,.6)",
                              textTransform: "uppercase", letterSpacing: ".04em", py: 1.25, borderBottom: "1px solid rgba(16,24,40,.07)" }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((emp) => {
                    const empId = emp._id || emp.id;
                    const isSelf = String(empId) === String(user?._id);
                    const chipStyle = STATUS_CHIP[emp.status] || STATUS_CHIP.disabled;

                    return (
                      <TableRow
                        key={empId}
                        sx={{ "&:last-child td": { border: 0 }, "&:hover": { bgcolor: "rgba(14,46,37,.025)" } }}
                      >
                        {/* Name + avatar */}
                        <TableCell sx={{ py: 1.5 }}>
                          <Stack direction="row" alignItems="center" spacing={1.25}>
                            <Avatar
                              src={emp.avatarUrl && emp.avatarUrl !== "/api/user/me/avatar" ? undefined : undefined}
                              sx={{ width: 34, height: 34, fontSize: 12, bgcolor: BRAND, color: "#fff", fontWeight: 700 }}
                            >
                              {getInitials(emp.firstName, emp.lastName)}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontSize: 13, fontWeight: 700, color: BRAND }}>
                                {emp.firstName} {emp.lastName}
                              </Typography>
                              {emp.employeeMeta?.jobTitle && (
                                <Typography sx={{ fontSize: 11, color: "rgba(14,46,37,.5)" }}>
                                  {emp.employeeMeta.jobTitle}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* User ID */}
                        <TableCell sx={{ fontSize: 13, color: "rgba(14,46,37,.7)", py: 1.5 }}>
                          {emp.userId}
                        </TableCell>

                        {/* Email */}
                        <TableCell sx={{ fontSize: 13, color: "rgba(14,46,37,.7)", py: 1.5 }}>
                          {emp.email}
                        </TableCell>

                        {/* Role — editable for owners only (can't change your own role) */}
                        <TableCell sx={{ py: 1.5 }}>
                          {user?.role === "owner" && !isSelf ? (
                            <Select
                              size="small"
                              value={emp.role}
                              onChange={(e) => handleRoleChange(empId, e.target.value)}
                              sx={{
                                fontSize: 12, fontWeight: 600,
                                bgcolor: "#fff", borderRadius: "6px", minWidth: 110,
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(14,46,37,.18)" },
                                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: BRAND },
                              }}
                            >
                              <MenuItem value="employee" sx={{ fontSize: 12 }}>Employee</MenuItem>
                              <MenuItem value="manager" sx={{ fontSize: 12 }}>Manager</MenuItem>
                              {user?.role === "owner" && (
                                <MenuItem value="owner" sx={{ fontSize: 12 }}>Owner</MenuItem>
                              )}
                            </Select>
                          ) : (
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "rgba(14,46,37,.7)", textTransform: "capitalize" }}>
                              {emp.role}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell sx={{ py: 1.5 }}>
                          <Chip
                            label={chipStyle.label}
                            size="small"
                            sx={{
                              bgcolor: chipStyle.bgcolor,
                              color: chipStyle.color,
                              fontWeight: 700,
                              fontSize: 11,
                              borderRadius: "6px",
                              height: 22,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <ZcorAllRightsReserved />
      </Box>

      {/* Invite Dialog */}
      <Dialog
        open={inviteOpen}
        onClose={closeInviteDialog}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: "10px", border: "1px solid rgba(14,46,37,.12)" } }}
      >
        <DialogTitle sx={{ pb: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 17, color: BRAND }}>Invite Employee</Typography>
            <Typography sx={{ fontSize: 12.5, color: "rgba(14,46,37,.5)", mt: 0.25 }}>
              They'll receive an email with a link to create their account.
            </Typography>
          </Box>
          <IconButton size="small" onClick={closeInviteDialog} sx={{ mt: -0.5, mr: -0.5 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <Divider sx={{ mt: 1, borderColor: "rgba(14,46,37,.1)" }} />

        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Stack direction="row" spacing={1.5}>
            <Box flex={1}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>
                First Name
              </Typography>
              <TextField
                fullWidth size="small" placeholder="Jane" autoFocus
                value={inviteFirstName}
                onChange={(e) => { setInviteFirstName(e.target.value); setInviteError(""); }}
                sx={FIELD_SX}
              />
            </Box>
            <Box flex={1}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>
                Last Name
              </Typography>
              <TextField
                fullWidth size="small" placeholder="Doe"
                value={inviteLastName}
                onChange={(e) => { setInviteLastName(e.target.value); setInviteError(""); }}
                sx={FIELD_SX}
              />
            </Box>
          </Stack>

          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>
              Email Address
            </Typography>
            <TextField
              fullWidth size="small" placeholder="jane.doe@example.com" type="email"
              value={inviteEmail}
              onChange={(e) => { setInviteEmail(e.target.value); setInviteError(""); }}
              sx={FIELD_SX}
            />
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Box flex={1}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>
                Pay Type
              </Typography>
              <Select
                fullWidth size="small"
                value={invitePayType}
                onChange={(e) => { setInvitePayType(e.target.value); setInviteRate(""); setInviteError(""); }}
                sx={{ bgcolor: "#fff", borderRadius: "6px", "& fieldset": { borderColor: "rgba(14,46,37,.18)" }, "&:hover fieldset": { borderColor: BRAND }, "&.Mui-focused fieldset": { borderColor: BRAND } }}
              >
                <MenuItem value="hourly">Hourly</MenuItem>
                <MenuItem value="salary">Salary</MenuItem>
              </Select>
            </Box>
            <Box flex={1}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>
                {invitePayType === "hourly" ? "Hourly Rate ($)" : "Annual Salary ($)"}
              </Typography>
              <TextField
                fullWidth size="small" type="number"
                placeholder={invitePayType === "hourly" ? "25.00" : "55000"}
                value={inviteRate}
                onChange={(e) => { setInviteRate(e.target.value); setInviteError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                error={!!inviteError}
                helperText={inviteError || " "}
                inputProps={{ min: 0, step: invitePayType === "hourly" ? "0.01" : "1000" }}
                sx={FIELD_SX}
              />
            </Box>
          </Stack>
        </DialogContent>

        <Divider sx={{ borderColor: "rgba(14,46,37,.1)" }} />

        <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={closeInviteDialog}
            sx={{
              textTransform: "none", borderRadius: "6px", fontSize: 13,
              borderColor: "rgba(14,46,37,.2)", color: BRAND,
              "&:hover": { borderColor: BRAND, bgcolor: BRAND_LIGHT },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleInvite}
            disabled={!!inviteSaving || !inviteEmail.trim()}
            startIcon={<PersonAddOutlinedIcon />}
            sx={{
              textTransform: "none", borderRadius: "6px", fontSize: 13,
              bgcolor: BRAND, color: "#fff",
              "&:hover": { bgcolor: "#1a4a37" },
              "&.Mui-disabled": { bgcolor: "rgba(14,46,37,.25)", color: "#fff" },
            }}
          >
            {inviteSaving ? "Sending…" : "Send Invitation"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ borderRadius: "8px" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
