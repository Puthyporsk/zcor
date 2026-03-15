import React, { useState, useEffect, useCallback, useRef } from "react";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../api/notifications";

const POLL_INTERVAL = 60_000;

const TYPE_TO_PATH = {
  invite_accepted: "/employees",
  time_entry_submitted: "/time-review",
  time_entry_approved: "/time-entry",
  time_entry_rejected: "/time-entry",
  shift_assigned: "/schedule",
  shift_updated: "/schedule",
  leave_request_submitted: "/leave",
  leave_request_approved: "/leave",
  leave_request_denied: "/leave",
  payslip_available: "/payslips",
  pay_period_status_change: "/payroll",
};

function getNotificationPath(notification) {
  const base = TYPE_TO_PATH[notification.type];
  if (!base) return null;

  if (
    notification.metadata?.date &&
    (notification.type === "shift_assigned" || notification.type === "shift_updated")
  ) {
    return { pathname: base, search: `?date=${notification.metadata.date}` };
  }

  return { pathname: base };
}

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);
  const navigate = useNavigate();

  const fetchCount = useCallback(() => {
    getUnreadCount()
      .then((data) => setUnreadCount(data?.count ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCount();
    intervalRef.current = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchCount]);

  const handleOpen = async (e) => {
    setAnchorEl(e.currentTarget);
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => setAnchorEl(null);

  const handleClick = (notification) => {
    const dest = getNotificationPath(notification);

    // Close menu and navigate
    setAnchorEl(null);
    if (dest) {
      navigate(dest);
    }

    // Mark as read in the background
    if (!notification.read) {
      markAsRead(notification._id)
        .then(() => {
          setNotifications((prev) =>
            prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
          );
          setUnreadCount((c) => Math.max(0, c - 1));
        })
        .catch(() => {});
    }
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    markAllAsRead()
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      })
      .catch(() => {});
  };

  const handleDismiss = (e, notification) => {
    e.stopPropagation();
    deleteNotification(notification._id)
      .then(() => {
        setNotifications((prev) => prev.filter((n) => n._id !== notification._id));
        if (!notification.read) setUnreadCount((c) => Math.max(0, c - 1));
      })
      .catch(() => {});
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    deleteAllNotifications()
      .then(() => {
        setNotifications([]);
        setUnreadCount(0);
      })
      .catch(() => {});
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        onClick={handleOpen}
        aria-label="Notifications"
        sx={{
          border: "1px solid rgba(15,27,16,.18)",
          bgcolor: "rgba(255,255,255,.35)",
          borderRadius: 999,
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          max={99}
          invisible={unreadCount === 0}
        >
          <NotificationsOutlinedIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: "10px",
            width: 340,
            maxHeight: 420,
            border: "1px solid rgba(15,27,16,.10)",
            boxShadow: "0 18px 50px rgba(15,27,16,.15)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
            borderBottom: "1px solid rgba(15,27,16,.08)",
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
            Notifications
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllRead}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: 12 }}
              >
                Mark all as read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                size="small"
                onClick={handleClearAll}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, color: "error.main" }}
              >
                Clear all
              </Button>
            )}
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Typography
            sx={{
              textAlign: "center",
              py: 3,
              color: "rgba(15,27,16,.50)",
              fontSize: 13,
            }}
          >
            No notifications
          </Typography>
        ) : (
          notifications.map((n) => (
            <MenuItem
              key={n._id}
              onClick={() => handleClick(n)}
              sx={{
                px: 2,
                py: 1.3,
                whiteSpace: "normal",
                bgcolor: n.read ? "transparent" : "rgba(201,243,231,.35)",
                borderBottom: "1px solid rgba(15,27,16,.05)",
                "&:hover": {
                  bgcolor: n.read
                    ? "rgba(15,27,16,.03)"
                    : "rgba(201,243,231,.55)",
                },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: n.read ? 500 : 700, fontSize: 13 }}>
                  {n.title}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "rgba(15,27,16,.60)", mt: 0.3 }}>
                  {n.message}
                </Typography>
                <Typography sx={{ fontSize: 11, color: "rgba(15,27,16,.40)", mt: 0.5 }}>
                  {new Date(n.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={(e) => handleDismiss(e, n)}
                sx={{
                  ml: 1,
                  flexShrink: 0,
                  color: "rgba(15,27,16,.35)",
                  "&:hover": { color: "rgba(15,27,16,.70)" },
                }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}
