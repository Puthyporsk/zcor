import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  Stack,
  Chip,
  Avatar,
  Divider,
  Button,
} from "@mui/material";

import Grid from "@mui/material/Grid";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import BrushRoundedIcon from "@mui/icons-material/BrushRounded";

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

const weeklyBars = [
  { day: "Mon", total: 8, billable: 6.5 },
  { day: "Tue", total: 7.5, billable: 5.0 },
  { day: "Wed", total: 9, billable: 7.2 },
  { day: "Thu", total: 6, billable: 4.5 },
  { day: "Fri", total: 2.5, billable: 2.0 },
  { day: "Sat", total: 0, billable: 0 },
  { day: "Sun", total: 0, billable: 0 },
];

const projectPie = [
  { name: "ZCOR Platform", value: 48 },
  { name: "Client Portal", value: 25 },
  { name: "Marketing Website", value: 18 },
  { name: "Internal Tools", value: 9 },
];

const PIE_COLORS = ["#163a2f", "#2a5b49", "#3f7a62", "#7bd4b4"];

const recent = [
  {
    title: "ZCOR Platform",
    subtitle: "Frontend Development",
    desc: "Built authentication pages and login flow",
    meta: "4.5 hours • Today",
    status: { label: "Approved", color: "success" },
    icon: <CheckCircleRoundedIcon fontSize="small" />,
    iconBg: "rgba(64, 191, 128, 0.18)",
    iconFg: "#1b7a53",
  },
  {
    title: "Client Portal",
    subtitle: "Bug Fixes",
    desc: "Fixed login redirect issue and updated dependencies",
    meta: "2.0 hours • Today",
    status: { label: "Submitted", color: "info" },
    icon: <ScheduleRoundedIcon fontSize="small" />,
    iconBg: "rgba(33, 150, 243, 0.14)",
    iconFg: "#1976d2",
  },
  {
    title: "Internal Tools",
    subtitle: "Meetings",
    desc: "Team standup and sprint planning",
    meta: "1.5 hours • Today",
    status: { label: "Draft", color: "default" },
    icon: <DescriptionRoundedIcon fontSize="small" />,
    iconBg: "rgba(120, 120, 120, 0.12)",
    iconFg: "#4b4b4b",
  },
  {
    title: "Marketing Website",
    subtitle: "Design",
    desc: "Updated homepage layout and components",
    meta: "3.5 hours • Yesterday",
    status: { label: "Approved", color: "success" },
    icon: <BrushRoundedIcon fontSize="small" />,
    iconBg: "rgba(64, 191, 128, 0.18)",
    iconFg: "#1b7a53",
  },
];

function StatCard({ title, value, sub, icon, iconBg, iconFg }) {
  return (
    <Paper className="dash-card dash-stat" elevation={0}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography className="dash-stat__title">{title}</Typography>
          <Typography className="dash-stat__value">{value}</Typography>
          <Typography className="dash-stat__sub">{sub}</Typography>
        </Box>

        <Box className="dash-stat__icon" sx={{ backgroundColor: iconBg, color: iconFg }}>
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
}

export default function DashboardPage() {
    const { user } = useAuth();
    const userName = user?.firstName || user?.name?.split?.(" ")?.[0] || "there";
    const navigate = useNavigate();

    return (
        <Box className="dash-page">
            <Container maxWidth="lg" className="dash-container">
                <Box className="dash-head">
                <Typography className="dash-h1">
                    Welcome back, {userName}! <span aria-hidden="true">👋</span>
                </Typography>
                <Typography className="dash-sub">
                    Here’s an overview of your time tracking activity
                </Typography>
                </Box>

                <Grid container spacing={2} className="dash-grid">
                {/* Row 1: 4 stats */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                    title="This Week"
                    value="32.5h"
                    sub="+5.5h from last week"
                    icon={<AccessTimeOutlinedIcon />}
                    iconBg="rgba(59, 191, 159, 0.18)"
                    iconFg="#0f6a55"
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                    title="This Month"
                    value="142h"
                    sub="~35.5h per week avg"
                    icon={<CalendarMonthOutlinedIcon />}
                    iconBg="rgba(66, 133, 244, 0.16)"
                    iconFg="#2b66d6"
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                    title="Approved"
                    value="12"
                    sub="12 entries this month"
                    icon={<CheckCircleOutlineIcon />}
                    iconBg="rgba(64, 191, 128, 0.18)"
                    iconFg="#1b7a53"
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                    title="Pending"
                    value="3"
                    sub="1 rejected"
                    icon={<HourglassEmptyOutlinedIcon />}
                    iconBg="rgba(255, 152, 0, 0.16)"
                    iconFg="#b25e00"
                    />
                </Grid>

                {/* Row 2: Weekly Hours full width */}
                <Grid size={12}>
                    <Paper className="dash-card dash-big" elevation={0}>
                    <Typography className="dash-card__title">Weekly Hours</Typography>
                    <Typography className="dash-card__subtitle">Hours worked each day</Typography>

                    <Box className="dash-chartBox">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyBars} barGap={8}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar
                            dataKey="total"
                            name="Total Hours"
                            fill="#163a2f"
                            radius={[6, 6, 0, 0]}
                            />
                            <Bar
                            dataKey="billable"
                            name="Billable Hours"
                            fill="#2a5b49"
                            radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                        </ResponsiveContainer>
                    </Box>
                    </Paper>
                </Grid>

                {/* Row 3: Project Breakdown full width */}
                <Grid size={12}>
                    <Paper className="dash-card dash-big" elevation={0}>
                    <Typography className="dash-card__title">Project Breakdown</Typography>
                    <Typography className="dash-card__subtitle">Hours spent on each project</Typography>

                    <Box className="dash-chartBox dash-chartBox--pie">
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
                    </Box>
                    </Paper>
                </Grid>

                {/* Row 4: Recent + Quick Actions */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper className="dash-card" elevation={0}>
                    <Stack direction="row" spacing={1} alignItems="center" className="dash-card__header">
                        <DescriptionRoundedIcon fontSize="small" />
                        <Box>
                        <Typography className="dash-card__title">Recent Activity</Typography>
                        <Typography className="dash-card__subtitle">Your latest time entries</Typography>
                        </Box>
                    </Stack>

                    <Box className="dash-list">
                        {recent.map((r, idx) => (
                        <React.Fragment key={idx}>
                            <Box className="dash-row">
                            <Box className="dash-row__left">
                                <Avatar
                                className="dash-row__avatar"
                                sx={{
                                    bgcolor: r.iconBg,
                                    color: r.iconFg,
                                    width: 34,
                                    height: 34,
                                }}
                                >
                                {r.icon}
                                </Avatar>

                                <Box className="dash-row__text">
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                    <Typography className="dash-row__title">{r.title}</Typography>
                                    <Typography className="dash-dot" aria-hidden="true">
                                    •
                                    </Typography>
                                    <Typography className="dash-row__subtitle">{r.subtitle}</Typography>
                                </Stack>
                                <Typography className="dash-row__desc">{r.desc}</Typography>
                                <Typography className="dash-row__meta">{r.meta}</Typography>
                                </Box>
                            </Box>

                            <Chip
                                label={r.status.label}
                                size="small"
                                color={r.status.color}
                                variant={r.status.color === "default" ? "outlined" : "filled"}
                                className="dash-status"
                            />
                            </Box>
                            {idx !== recent.length - 1 && <Divider />}
                        </React.Fragment>
                        ))}
                    </Box>
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

                        <Button
                        variant="outlined"
                        startIcon={<ListAltOutlinedIcon />}
                        className="dash-action"
                        fullWidth
                        onClick={() => console.log("View All Entries")}
                        >
                        View All Entries
                        </Button>

                        <Button
                        variant="outlined"
                        startIcon={<BarChartOutlinedIcon />}
                        className="dash-action"
                        fullWidth
                        onClick={() => console.log("Generate Report")}
                        >
                        Generate Report
                        </Button>

                        <Button
                        variant="outlined"
                        startIcon={<EventOutlinedIcon />}
                        className="dash-action"
                        fullWidth
                        onClick={() => console.log("View Calendar")}
                        >
                        View Calendar
                        </Button>
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Typography className="dash-card__title" sx={{ fontSize: 13, mb: 1 }}>
                        Status Summary
                    </Typography>

                    <Box className="dash-summary">
                        <Box className="dash-summary__row">
                        <span className="dot dot--green" />
                        <Typography className="dash-summary__label">Approved</Typography>
                        <Typography className="dash-summary__value">12</Typography>
                        </Box>
                        <Box className="dash-summary__row">
                        <span className="dot dot--blue" />
                        <Typography className="dash-summary__label">Submitted</Typography>
                        <Typography className="dash-summary__value">2</Typography>
                        </Box>
                        <Box className="dash-summary__row">
                        <span className="dot dot--gray" />
                        <Typography className="dash-summary__label">Draft</Typography>
                        <Typography className="dash-summary__value">3</Typography>
                        </Box>
                        <Box className="dash-summary__row">
                        <span className="dot dot--red" />
                        <Typography className="dash-summary__label">Rejected</Typography>
                        <Typography className="dash-summary__value">1</Typography>
                        </Box>
                    </Box>
                    </Paper>
                </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
