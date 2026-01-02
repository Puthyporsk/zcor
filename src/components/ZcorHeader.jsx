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

import MenuIcon from "@mui/icons-material/Menu";
import LoginIcon from "@mui/icons-material/Login";

import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

const HEADER_OFFSET = 88; // safe for fixed header + spacing

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;

  const y =
    el.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;

  window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
}

export default function ZcorHeader() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: "Features", id: "features" },
    { label: "Modules", id: "modules" },
    { label: "Stories", id: "testimonials" },
    { label: "Pricing", id: "pricing" },
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

    // Stay on "/" with clean URL; just scroll
    if (location.pathname === "/") {
      // wait a frame in case Drawer just closed
      requestAnimationFrame(() => scrollToId(id));
      return;
    }

    // If on another page, go home and tell LandingPage what to scroll to
    navigate("/", { state: { scrollTo: id } });
  };

  const goDemo = () => goToSection("contact");

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
              borderRadius: 2,
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="text"
                onClick={() => goToSection(item.id)}
                sx={{ color: "rgba(15,27,16,.80)", fontWeight: 700 }}
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
                boxShadow: "0 10px 24px rgba(15,27,16,.12)",
              }}
            >
              Book a demo
            </Button>

            <IconButton
              component={RouterLink}
              to="/login"
              aria-label="Login"
              sx={{
                ml: 0.5,
                border: "1px solid rgba(15,27,16,.18)",
                bgcolor: "rgba(255,255,255,.35)",
                borderRadius: 999,
              }}
            >
              <LoginIcon />
            </IconButton>
          </Box>
        )}

        {/* Mobile actions */}
        {isMobile && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={goDemo}
              sx={{
                borderRadius: 999,
                px: 2,
                boxShadow: "0 10px 24px rgba(15,27,16,.12)",
              }}
            >
              Book
            </Button>

            <IconButton
              component={RouterLink}
              to="/login"
              aria-label="Login"
              sx={{
                border: "1px solid rgba(15,27,16,.18)",
                bgcolor: "rgba(255,255,255,.35)",
                borderRadius: 999,
              }}
            >
              <LoginIcon />
            </IconButton>

            <IconButton
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              sx={{
                border: "1px solid rgba(15,27,16,.18)",
                bgcolor: "rgba(255,255,255,.35)",
                borderRadius: 2,
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        )}
      </Toolbar>

      {/* Mobile drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280, p: 1.5 }}>
          <Typography sx={{ fontWeight: 800, px: 1, py: 1 }}>
            Menu
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

            <ListItemButton
              component={RouterLink}
              to="/login"
              onClick={() => setDrawerOpen(false)}
            >
              <ListItemText primary="Login" />
            </ListItemButton>

            <ListItemButton onClick={goTop}>
              <ListItemText primary="Back to top" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
