import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from "@mui/icons-material/Menu";
import LoginIcon from "@mui/icons-material/Login";
import DashboardCustomizeOutlinedIcon from "@mui/icons-material/DashboardCustomizeOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import BeachAccessOutlinedIcon from "@mui/icons-material/BeachAccessOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";

import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const HEADER_OFFSET = 88; // fixed header offset for smooth scroll

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;

  const y = el.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;
  window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
}

export default function ZcorHeader() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [appsAnchorEl, setAppsAnchorEl] = React.useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const location = useLocation();
  const navigate = useNavigate();

  const { isLoggedIn, logout, user } = useAuth();
  const isManagerOrOwner = user?.role === "manager" || user?.role === "owner";

  const navItems = [
    { label: "Features", id: "features" },
    { label: "Modules", id: "modules" },
    { label: "Stories", id: "testimonials" },
    { label: "Pricing", id: "pricing" },
  ];

  // "Apps" pages list (dropdown menu)
  const appPages = [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardOutlinedIcon fontSize="small" /> },
    { label: "Time Entry", path: "/time-entry", icon: <AccessTimeIcon fontSize="small" /> },
    ...(isManagerOrOwner
      ? [{ label: "Time Review", path: "/time-review", icon: <RateReviewOutlinedIcon fontSize="small" /> }]
      : []),
    { label: "Inventory", path: "/inventory", icon: <Inventory2OutlinedIcon fontSize="small" /> },
    { label: "Schedule", path: "/schedule", icon: <EventNoteOutlinedIcon fontSize="small" /> },
    { label: "Leave", path: "/leave", icon: <BeachAccessOutlinedIcon fontSize="small" /> },
    ...(isManagerOrOwner
      ? [{ label: "Payroll", path: "/payroll", icon: <PaymentsOutlinedIcon fontSize="small" /> }]
      : []),
    { label: "Payslips", path: "/payslips", icon: <ReceiptLongOutlinedIcon fontSize="small" /> },
    { label: "Employees", path: "/employees", icon: <PeopleAltOutlinedIcon fontSize="small" /> },
    { label: "Settings", path: "/settings", icon: <SettingsOutlinedIcon fontSize="small" /> },
  ];

  const goTop = () => {
    setDrawerOpen(false);

    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    navigate("/");
  };

  const goToSection = (id) => {
    setDrawerOpen(false);

    if (location.pathname === "/") {
      requestAnimationFrame(() => scrollToId(id));
      return;
    }

    // clean URL navigation: no hashes
    navigate("/", { state: { scrollTo: id } });
  };

  const goDemo = () => goToSection("contact");

  const openAppsMenu = (e) => setAppsAnchorEl(e.currentTarget);
  const closeAppsMenu = () => setAppsAnchorEl(null);

  const goToPage = (path) => {
    closeAppsMenu();
    setDrawerOpen(false);
    navigate(path);
  };

  const onLogout = async () => {
    closeAppsMenu();
    setDrawerOpen(false);
    await logout();
    navigate("/");
  }

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: "rgba(168,245,199,0.65)",
        borderBottom: "1px solid rgba(15,27,16,.08)",
        backdropFilter: "blur(10px)",
        color: "text.primary",
      }}
    >
      <Toolbar sx={{ maxWidth: 1120, width: "100%", mx: "auto" }}>
        {/* Brand */}
        <Box
          component="button"
          type="button"
          onClick={goTop}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1.2,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            p: 0,
            mr: 2,
          }}
          aria-label="ZCOR - Back to top"
        >
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: "6px",
              bgcolor: "primary.main",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              fontSize: 14,
            }}
          >
            Z
          </Box>
          <Typography sx={{ fontWeight: 800, letterSpacing: ".04em" }}>
            ZCOR
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Desktop nav */}
        {!isMobile && (
          <>
            {window.location.pathname === '/' && <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant="text"
                  onClick={() => goToSection(item.id)}
                  sx={{
                    color: "rgba(15,27,16,.80)",
                    fontWeight: 700,
                    textTransform: "none",
                  }}
                >
                  {item.label}
                </Button>
              ))}

              <Button
                variant="contained"
                color="primary"
                onClick={goDemo}
                sx={{
                  borderRadius: 999,
                  px: 2,
                  ml: 1,
                  textTransform: "none",
                  boxShadow: "0 10px 24px rgba(15,27,16,.12)",
                }}
              >
                Book a demo
              </Button>
            </Box>
            }
            <Tooltip title="Menu">
              <IconButton
                onClick={openAppsMenu}
                aria-label="Open app menu"
                aria-controls={appsAnchorEl ? "zcor-apps-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={appsAnchorEl ? "true" : undefined}
                sx={{
                  ml: 1,
                  border: "1px solid rgba(15,27,16,.18)",
                  bgcolor: "rgba(255,255,255,.35)",
                  borderRadius: 999,
                }}
              >
                <DashboardCustomizeOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Menu
                id="zcor-apps-menu"
                anchorEl={appsAnchorEl}
                open={Boolean(appsAnchorEl)}
                onClose={closeAppsMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    borderRadius: "10px",
                    minWidth: 220,
                    border: "1px solid rgba(15,27,16,.10)",
                    boxShadow: "0 18px 50px rgba(15,27,16,.15)",
                  },
                }}
              >
                {isLoggedIn && appPages.map((p) => (
                  <MenuItem
                    key={p.path}
                    onClick={() => goToPage(p.path)}
                    sx={{ gap: 1.3, py: 1.1 }}
                  >
                    <Box sx={{ color: "rgba(15,27,16,.70)", display: "inline-flex" }}>
                      {p.icon}
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                      {p.label}
                    </Typography>
                  </MenuItem>
                ))}
                {!isLoggedIn ? 
                (
                  <MenuItem onClick={() => goToPage("/login")} sx={{ gap: 1.3, py: 1.1 }}>
                    <Box sx={{ color: "rgba(15,27,16,.70)", display: "inline-flex" }}>
                      <LoginIcon fontSize="small" />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                      Login
                    </Typography>
                  </MenuItem>
                ) 
                : 
                (
                  <>
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem onClick={() => onLogout()} sx={{ gap: 1.3, py: 1.1 }}>
                      <Box sx={{ color: "rgba(15,27,16,.70)", display: "inline-flex" }}>
                        <LogoutIcon fontSize="small" />
                      </Box>
                      <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                        Logout
                      </Typography>
                    </MenuItem>
                  </>
                )}
              </Menu>
          </>
        )}

        {/* Mobile actions */}
        {isMobile && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Mobile drawer button */}
            <IconButton
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              sx={{
                border: "1px solid rgba(15,27,16,.18)",
                bgcolor: "rgba(255,255,255,.35)",
                borderRadius: "8px",
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        )}
      </Toolbar>

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 300, p: 1.5 }}>
          <Typography sx={{ fontWeight: 900, px: 1, py: 1 }}>
            Menu
          </Typography>

          { isLoggedIn && <>
            <Typography sx={{ fontWeight: 800, px: 1, pt: 1, pb: 0.5, color: "rgba(15,27,16,.65)" }}>
              Pages
            </Typography>
            <List>
              {appPages.map((p) => (
                <ListItemButton key={p.path} onClick={() => goToPage(p.path)}>
                  <Box sx={{ mr: 1.5, color: "rgba(15,27,16,.70)", display: "inline-flex" }}>
                    {p.icon}
                  </Box>
                  <ListItemText primary={p.label} />
                </ListItemButton>
              ))}
            </List>
          </>}

          <Divider sx={{ my: 1 }} />

          <Typography sx={{ fontWeight: 800, px: 1, pt: 1, pb: 0.5, color: "rgba(15,27,16,.65)" }}>
            Landing
          </Typography>
          <List>
            {navItems.map((item) => (
              <ListItemButton key={item.id} onClick={() => goToSection(item.id)}>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>

          <Divider sx={{ my: 1 }} />

          <List>
            <ListItemButton onClick={goDemo}>
              <ListItemText primary="Book a demo" />
            </ListItemButton>

            {!isLoggedIn ? (
              <ListItemButton onClick={() => goToPage("/login")}>
                <ListItemText primary="Login" />
              </ListItemButton>
            ) : (
              <ListItemButton
                component={RouterLink}
                to="/"
                onClick={() => onLogout()}
              >
                <ListItemText primary="Logout" />
              </ListItemButton>
            )}

            <ListItemButton onClick={goTop}>
              <ListItemText primary="Back to top" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
