import React from "react";
import {
  Box,
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
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import ViewWeekOutlinedIcon from "@mui/icons-material/ViewWeekOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import "../../styles/timeEntry.css";

const sampleEntries = [
  {
    id: 1,
    project: "ZCOR Platform",
    task: "Frontend Development",
    status: "Approved",
    desc: "Built authentication pages and login flow",
    date: "Jan 04, 2026",
    note: "HR Note: Great work!",
    hours: "4.5h",
    type: "Billable",
  },
  {
    id: 2,
    project: "Client Portal",
    task: "Bug Fixes",
    status: "Approved",
    desc: "Fixed login redirect issue and updated dependencies",
    date: "Jan 04, 2026",
    note: "HR Note: Good job!",
    hours: "2h",
    type: "Billable",
  },
  {
    id: 3,
    project: "Internal Tools",
    task: "Meetings",
    status: "Approved",
    desc: "Team standup and sprint planning",
    date: "Jan 04, 2026",
    note: "HR Note: Nice!",
    hours: "1.5h",
    type: "Non-billable",
  },
];

function TimesheetTopBar({ weeklyTotal }) {
  return (
    <div className="te-topbar">
      <div className="te-topbar__inner">
        <div className="te-topbar__left">
          <div className="te-topbar__badge" aria-hidden="true">
            Z
          </div>
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

export default function TimeEntryPage() {
  const [project, setProject] = React.useState("");
  const [task, setTask] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [date, setDate] = React.useState("2026-01-04");
  const [hours, setHours] = React.useState("");
  const [type, setType] = React.useState("Billable");

  const weeklyTotal = "8.0h";

  const handleAdd = (e) => {
    e.preventDefault();
    console.log({ project, task, desc, date, hours, type });
  };

  return (
    <div className="te-root">
      <TimesheetTopBar weeklyTotal={weeklyTotal} />

      <main className="te-main">
        <div className="te-grid">
          {/* LEFT COLUMN */}
          <div className="te-left">
            {/* Add Time Entry */}
            <Paper elevation={0} className="te-card te-card--pad">
              <div className="te-cardTitleRow">
                <div className="te-cardTitleIcon">
                  <AddIcon fontSize="small" />
                </div>
                <div>
                  <Typography className="te-cardTitle" variant="subtitle1">
                    Add Time Entry
                  </Typography>
                  <Typography className="te-cardSubtitle" variant="body2">
                    Log your working hours for a task
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
                      select
                      fullWidth
                      size="small"
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                      slotProps={{
                        select: {
                            displayEmpty: true,
                            renderValue: (selected) => (selected ? selected : "Select project"),
                            },
                        }}
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
                      select
                      fullWidth
                      size="small"
                      value={task}
                      onChange={(e) => setTask(e.target.value)}
                      slotProps={{
                        select: {
                            displayEmpty: true,
                            renderValue: (selected) => (selected ? selected : "Select task"),
                            },
                        }}
                    >
                      <MenuItem disabled value="">Select task</MenuItem>
                      <MenuItem value="Frontend Development">Frontend Development</MenuItem>
                      <MenuItem value="Bug Fixes">Bug Fixes</MenuItem>
                      <MenuItem value="Meetings">Meetings</MenuItem>
                    </TextField>
                  </div>

                  <div className="te-formGrid__full">
                    <Typography className="te-label" variant="caption">
                      Description
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="What did you work on? (optional)"
                      multiline
                      minRows={2}
                    />
                  </div>

                  <div>
                    <Typography className="te-label" variant="caption">
                      Date <span className="te-required">*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarMonthIcon fontSize="small" sx={{ opacity: 0.65 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </div>

                  <div>
                    <Typography className="te-label" variant="caption">
                      Hours <span className="te-required">*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      placeholder="e.g. 2.5"
                      helperText="In decimal format"
                    />
                  </div>

                  <div>
                    <Typography className="te-label" variant="caption">
                      Type
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <MenuItem value="Billable">Billable</MenuItem>
                      <MenuItem value="Non-billable">Non-billable</MenuItem>
                    </TextField>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  className="te-primaryBtn"
                  startIcon={<AddIcon />}
                >
                  Add Time Entry
                </Button>
              </Box>
            </Paper>

            {/* Time Entries */}
            <Paper elevation={0} className="te-card te-card--pad">
              <div className="te-entriesHeader">
                <div>
                  <Typography className="te-cardTitle" variant="subtitle1">
                    Time Entries
                  </Typography>
                  <Typography className="te-cardSubtitle" variant="body2">
                    {sampleEntries.length} entries • {weeklyTotal} total
                  </Typography>
                </div>

                <TextField
                  size="small"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="te-dateMini"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonthIcon fontSize="small" sx={{ opacity: 0.65 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </div>

              <Stack spacing={1.6}>
                {sampleEntries.map((entry) => (
                  <Paper key={entry.id} elevation={0} className="te-entryRow">
                    <div className="te-entryRow__left">
                      <div className="te-entryRow__topline">
                        <Typography className="te-entryProject" variant="body1">
                          {entry.project}
                        </Typography>
                        <Typography className="te-entryTask" variant="caption">
                          • {entry.task}
                        </Typography>
                        <Chip
                          size="small"
                          label={entry.status}
                          color="success"
                          className="te-entryChip"
                        />
                      </div>

                      <Typography className="te-entryDesc" variant="body2">
                        {entry.desc}
                      </Typography>

                      <Typography className="te-entryMeta" variant="caption">
                        {entry.date} •{" "}
                        <span className="te-entryNote">{entry.note}</span>
                      </Typography>
                    </div>

                    <div className="te-entryRow__right">
                      <div className="te-entryHoursBlock">
                        <div className="te-entryHours">{entry.hours}</div>
                        <div className="te-entryType">{entry.type}</div>
                      </div>

                      <div className="te-entryActions">
                        <IconButton size="small" aria-label="Edit entry">
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" aria-label="Delete entry">
                          <DeleteOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </div>
                    </div>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </div>

          {/* RIGHT COLUMN */}
          <div className="te-right">
            {/* Submission Status */}
            <Paper elevation={0} className="te-card te-card--pad">
              <div className="te-rightTitleRow">
                <Typography className="te-cardTitle" variant="subtitle1">
                  Submission Status
                </Typography>
                <Typography className="te-cardSubtitle" variant="body2">
                  Current week overview
                </Typography>
              </div>

              <div className="te-statusList">
                <div className="te-statusRow">
                  <Chip size="small" label="Draft" variant="outlined" />
                  <span className="te-statusLabel">Draft</span>
                  <span className="te-statusNum">0</span>
                </div>

                <div className="te-statusRow te-statusRow--active">
                  <Chip size="small" label="Submitted" color="primary" />
                  <span className="te-statusLabel">Submitted</span>
                  <span className="te-statusNum">0</span>
                </div>

                <div className="te-statusRow te-statusRow--approved">
                  <Chip size="small" label="Approved" color="success" />
                  <span className="te-statusLabel">Approved</span>
                  <span className="te-statusNum">3</span>
                </div>
              </div>
            </Paper>

            {/* Weekly Summary */}
            <Paper elevation={0} className="te-card te-card--pad">
              <Typography className="te-cardTitle" variant="subtitle1">
                Weekly Summary
              </Typography>
              <Typography className="te-cardSubtitle" variant="body2">
                Current week statistics
              </Typography>

              <Divider sx={{ my: 2 }} />

              <div className="te-summaryRow">
                <span>Total Hours</span>
                <strong>8.0h</strong>
              </div>
              <div className="te-summaryRow">
                <span>Billable Hours</span>
                <strong className="te-green">6.5h</strong>
              </div>
              <div className="te-summaryRow">
                <span>Non-billable</span>
                <strong>1.5h</strong>
              </div>

              <Divider sx={{ my: 2 }} />

              <Typography sx={{ fontWeight: 900, fontSize: 12, opacity: 0.7, mb: 1 }}>
                By Project
              </Typography>

              <div className="te-summaryRow">
                <span>ZCOR Platform</span>
                <strong>4.5h</strong>
              </div>
              <div className="te-summaryRow">
                <span>Client Portal</span>
                <strong>2.0h</strong>
              </div>
              <div className="te-summaryRow">
                <span>Internal Tools</span>
                <strong>1.5h</strong>
              </div>
            </Paper>

            {/* Quick Tips */}
            <Paper elevation={0} className="te-card te-card--pad">
              <Typography className="te-cardTitle" variant="subtitle1">
                Quick Tips
              </Typography>

              <ul className="te-bullets">
                <li>Use decimal format for hours (e.g., 2.5 for 2 hours 30 minutes)</li>
                <li>You can increment by 0.25 (15 minutes) for precision</li>
                <li>Mark entries as billable or non-billable for accurate tracking</li>
              </ul>
            </Paper>

            {/* Quick Actions */}
            <Paper elevation={0} className="te-card te-card--pad">
              <Typography className="te-cardTitle" variant="subtitle1">
                Quick Actions
              </Typography>

              <div className="te-actions">
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<SendOutlinedIcon />}
                  className="te-actionBtn"
                >
                  Submit for Review
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ViewWeekOutlinedIcon />}
                  className="te-actionBtn"
                >
                  View Full Calendar
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<FileDownloadOutlinedIcon />}
                  className="te-actionBtn"
                >
                  Export Timesheet
                </Button>
              </div>
            </Paper>
          </div>
        </div>
      </main>
    </div>
  );
}
