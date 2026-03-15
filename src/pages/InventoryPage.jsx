import React from "react";
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Snackbar, Alert, CircularProgress, Stack, Divider, IconButton,
  ToggleButton, ToggleButtonGroup, InputAdornment, FormControl,
  InputLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RemoveIcon from "@mui/icons-material/Remove";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import PersonRemoveOutlinedIcon from "@mui/icons-material/PersonRemoveOutlined";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import { useAuth } from "../context/AuthContext";
import {
  getInventory, createInventoryItem, updateInventoryItem,
  deleteInventoryItem, assignItem, unassignItem,
} from "../api/inventory";
import {
  createInventoryOrder, getInventoryOrders, getOrdersByItem,
} from "../api/inventoryOrders";
import { getUsers } from "../api/user";
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

const CONDITION_CHIP = {
  new:     { label: "New",     bgcolor: "rgba(21,128,61,0.12)",   color: "#15803d" },
  good:    { label: "Good",    bgcolor: "rgba(37,99,235,0.12)",   color: "#2563eb" },
  fair:    { label: "Fair",    bgcolor: "rgba(217,119,6,0.12)",   color: "#d97706" },
  poor:    { label: "Poor",    bgcolor: "rgba(220,38,38,0.12)",   color: "#dc2626" },
  retired: { label: "Retired", bgcolor: "rgba(100,116,139,0.12)", color: "#475569" },
};

const ORDER_TYPE_CHIP = {
  purchase: { label: "Purchase", bgcolor: "rgba(37,99,235,0.12)",  color: "#2563eb" },
  sale:     { label: "Sale",     bgcolor: "rgba(21,128,61,0.12)",  color: "#15803d" },
  usage:    { label: "Usage",    bgcolor: "rgba(217,119,6,0.12)",  color: "#d97706" },
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

function formatCurrency(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

const EMPTY_LINE = () => ({ inventoryItem: "", quantity: 1, unitPrice: 0 });

export default function InventoryPage() {
  const { user } = useAuth();
  const isManagerOrOwner = user?.role === "owner" || user?.role === "manager";

  // ── Items state ──
  const [items, setItems] = React.useState([]);
  const [allItems, setAllItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [snack, setSnack] = React.useState({ open: false, msg: "", severity: "success" });

  // Add/Edit item dialog
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState("");
  const [addingCategory, setAddingCategory] = React.useState(false);
  const [newCategory, setNewCategory] = React.useState("");

  // Assign dialog
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [assignItemId, setAssignItemId] = React.useState(null);
  const [assignUserId, setAssignUserId] = React.useState("");
  const [employees, setEmployees] = React.useState([]);
  const [assignSaving, setAssignSaving] = React.useState(false);

  // New Order dialog
  const [orderDialogOpen, setOrderDialogOpen] = React.useState(false);
  const [orderForm, setOrderForm] = React.useState({
    orderType: "purchase", orderDate: "", vendor: "", relatedUser: "", notes: "",
    lines: [EMPTY_LINE()],
  });
  const [orderSaving, setOrderSaving] = React.useState(false);
  const [orderFormError, setOrderFormError] = React.useState("");
  const [supplyItems, setSupplyItems] = React.useState([]);
  const [allUsers, setAllUsers] = React.useState([]);
  const [vendors, setVendors] = React.useState([]);
  const [addingVendor, setAddingVendor] = React.useState(false);
  const [newVendor, setNewVendor] = React.useState("");

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = React.useState({ open: false, title: "", body: "", onConfirm: null });
  const openConfirm = (title, body, onConfirm) => setConfirmDialog({ open: true, title, body, onConfirm });
  const closeConfirm = () => setConfirmDialog((d) => ({ ...d, open: false, onConfirm: null }));

  // Restock dialog
  const [restockOpen, setRestockOpen] = React.useState(false);
  const [restockItem, setRestockItem] = React.useState(null);
  const [restockForm, setRestockForm] = React.useState({ quantity: 1, unitPrice: "", vendor: "" });
  const [restockSaving, setRestockSaving] = React.useState(false);
  const [restockError, setRestockError] = React.useState("");

  // Per-item history dialog
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [historyItem, setHistoryItem] = React.useState(null);
  const [historyOrders, setHistoryOrders] = React.useState([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);

  // ── Fetch items ──
  const fetchItems = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter !== "all") params.type = typeFilter;
      if (categoryFilter) params.category = categoryFilter;
      const [data, all] = await Promise.all([
        getInventory(params),
        getInventory(),
      ]);
      setItems(data);
      setAllItems(all);
    } catch (err) {
      setSnack({ open: true, msg: err.message || "Failed to load inventory", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [typeFilter, categoryFilter]);

  React.useEffect(() => { fetchItems(); }, [fetchItems]);

  // Categories for the filter dropdown (scoped to current typeFilter)
  const categories = React.useMemo(() => {
    const cats = new Set();
    items.forEach((i) => { if (i.category) cats.add(i.category); });
    return [...cats].sort();
  }, [items]);

  // Categories for the item dialog (scoped to the type selected in the form)
  const formType = editing ? editing.type : form.type;
  const dialogCategories = React.useMemo(() => {
    const cats = new Set();
    allItems.forEach((i) => { if (i.category && i.type === formType) cats.add(i.category); });
    return [...cats].sort();
  }, [allItems, formType]);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) =>
      i.name.toLowerCase().includes(q) ||
      (i.category || "").toLowerCase().includes(q) ||
      (i.serialNumber || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  // ── Add/Edit item dialog ──
  const openAddDialog = (type = "equipment") => {
    setEditing(null);
    setForm({ type, name: "", category: "", description: "",
      serialNumber: "", condition: "good", purchaseDate: "", purchaseCost: "",
      quantity: 0, unit: "units", lowStockThreshold: 0 });
    setFormError("");
    setDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditing(item);
    setForm({
      type: item.type, name: item.name, category: item.category || "",
      description: item.description || "", serialNumber: item.serialNumber || "",
      condition: item.condition || "good",
      purchaseDate: item.purchaseDate ? item.purchaseDate.slice(0, 10) : "",
      purchaseCost: item.purchaseCost != null ? item.purchaseCost : "",
      quantity: item.quantity ?? 0, unit: item.unit || "units",
      lowStockThreshold: item.lowStockThreshold ?? 0,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setFormError(""); setAddingCategory(false); setNewCategory(""); };

  const handleSave = async () => {
    setFormError("");
    if (!form.name?.trim()) { setFormError("Name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim() || undefined,
        description: form.description.trim() || undefined,
      };
      if (!editing) payload.type = form.type;

      if ((editing ? editing.type : form.type) === "equipment") {
        payload.serialNumber = form.serialNumber.trim() || undefined;
        payload.condition = form.condition;
        payload.purchaseDate = form.purchaseDate || undefined;
        payload.purchaseCost = form.purchaseCost !== "" ? Number(form.purchaseCost) : undefined;
      } else {
        payload.quantity = Number(form.quantity) || 0;
        payload.unit = form.unit.trim() || "units";
        payload.lowStockThreshold = Number(form.lowStockThreshold) || 0;
      }

      if (editing) {
        await updateInventoryItem(editing.id, payload);
        setSnack({ open: true, msg: "Item updated", severity: "success" });
      } else {
        await createInventoryItem(payload);
        setSnack({ open: true, msg: "Item created", severity: "success" });
      }
      closeDialog();
      fetchItems();
    } catch (err) {
      setFormError(err.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    openConfirm(
      "Delete item",
      "This will permanently remove the item from inventory. This action cannot be undone.",
      async () => {
        try {
          await deleteInventoryItem(id);
          setSnack({ open: true, msg: "Item deleted", severity: "success" });
          fetchItems();
        } catch (err) {
          setSnack({ open: true, msg: err.message || "Failed to delete", severity: "error" });
        }
      }
    );
  };

  // ── Quick decrease → usage order ──
  const handleDecrease = async (item) => {
    if (item.quantity <= 0) return;
    try {
      await createInventoryOrder({
        orderType: "usage",
        items: [{ inventoryItem: item.id, quantity: 1, unitPrice: 0 }],
      });
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i));
    } catch (err) {
      setSnack({ open: true, msg: err.message || "Failed to update quantity", severity: "error" });
    }
  };

  // ── Restock ──
  const openRestock = (item) => {
    setRestockItem(item);
    setRestockForm({ quantity: 1, unitPrice: "", vendor: "" });
    setRestockError("");
    setRestockOpen(true);
  };

  const closeRestock = () => { setRestockOpen(false); setRestockItem(null); setRestockError(""); };

  const handleRestock = async () => {
    setRestockError("");
    const qty = Number(restockForm.quantity);
    if (!qty || qty < 1) { setRestockError("Quantity must be at least 1"); return; }
    setRestockSaving(true);
    try {
      await createInventoryOrder({
        orderType: "purchase",
        vendor: restockForm.vendor.trim() || "Restock",
        orderDate: new Date().toISOString().slice(0, 10),
        items: [{ inventoryItem: restockItem.id, quantity: qty, unitPrice: Number(restockForm.unitPrice) || 0 }],
      });
      setSnack({ open: true, msg: `Restocked ${qty} ${restockItem.unit} of ${restockItem.name}`, severity: "success" });
      closeRestock();
      fetchItems();
    } catch (err) {
      setRestockError(err.message || "Failed to restock");
    } finally {
      setRestockSaving(false);
    }
  };

  // ── Assign / Unassign ──
  const openAssignDialog = async (itemId) => {
    setAssignItemId(itemId);
    setAssignUserId("");
    setAssignOpen(true);
    try {
      const users = await getUsers();
      setEmployees(users);
    } catch { /* ignore */ }
  };

  const handleAssign = async () => {
    if (!assignUserId) return;
    setAssignSaving(true);
    try {
      await assignItem(assignItemId, assignUserId);
      setSnack({ open: true, msg: "Item assigned", severity: "success" });
      setAssignOpen(false);
      fetchItems();
    } catch (err) {
      setSnack({ open: true, msg: err.message || "Failed to assign", severity: "error" });
    } finally {
      setAssignSaving(false);
    }
  };

  const handleUnassign = async (id) => {
    try {
      await unassignItem(id);
      setSnack({ open: true, msg: "Item unassigned", severity: "success" });
      fetchItems();
    } catch (err) {
      setSnack({ open: true, msg: err.message || "Failed to unassign", severity: "error" });
    }
  };

  // ── New Order dialog ──
  const openOrderDialog = async () => {
    setOrderFormError("");
    setOrderForm({ orderType: "purchase", orderDate: "", vendor: "", relatedUser: "", notes: "", lines: [EMPTY_LINE()] });
    setAddingVendor(false);
    setNewVendor("");
    setOrderDialogOpen(true);
    try {
      const [supplies, users, orders] = await Promise.all([
        getInventory({ type: "supply" }),
        getUsers(),
        getInventoryOrders({ orderType: "purchase" }),
      ]);
      setSupplyItems(supplies);
      setAllUsers(users);
      const vendorSet = new Set();
      orders.forEach((o) => { if (o.vendor?.trim()) vendorSet.add(o.vendor.trim()); });
      setVendors([...vendorSet].sort());
    } catch { /* ignore */ }
  };

  const closeOrderDialog = () => { setOrderDialogOpen(false); setOrderFormError(""); setAddingVendor(false); setNewVendor(""); };

  const setOrderField = (k, v) => setOrderForm((f) => ({ ...f, [k]: v }));

  const setLineField = (idx, k, v) => setOrderForm((f) => {
    const lines = [...f.lines];
    lines[idx] = { ...lines[idx], [k]: v };
    return { ...f, lines };
  });

  const addLine = () => setOrderForm((f) => ({ ...f, lines: [...f.lines, EMPTY_LINE()] }));

  const removeLine = (idx) => setOrderForm((f) => ({
    ...f, lines: f.lines.filter((_, i) => i !== idx),
  }));

  const orderTotal = React.useMemo(() => {
    if (orderForm.orderType === "usage") return null;
    return orderForm.lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
  }, [orderForm.lines, orderForm.orderType]);

  const handleCreateOrder = async () => {
    setOrderFormError("");
    if (orderForm.orderType === "purchase" && !orderForm.orderDate) {
      setOrderFormError("Order date is required for purchase orders"); return;
    }
    if (orderForm.orderType === "purchase" && !orderForm.vendor.trim()) {
      setOrderFormError("Vendor is required for purchase orders"); return;
    }
    if (orderForm.orderType === "sale" && !orderForm.relatedUser) {
      setOrderFormError("Buyer is required for sale orders"); return;
    }
    if (orderForm.lines.some((l) => !l.inventoryItem)) {
      setOrderFormError("Select an item for each line"); return;
    }
    if (orderForm.lines.some((l) => !(Number(l.quantity) >= 1))) {
      setOrderFormError("Each line must have quantity ≥ 1"); return;
    }
    if (orderForm.orderType === "purchase" && orderForm.lines.some((l) => !(Number(l.unitPrice) > 0))) {
      setOrderFormError("Cost per unit is required for each item on a purchase order"); return;
    }

    setOrderSaving(true);
    try {
      await createInventoryOrder({
        orderType:   orderForm.orderType,
        orderDate:   orderForm.orderDate || undefined,
        vendor:      orderForm.vendor.trim() || undefined,
        relatedUser: orderForm.relatedUser || undefined,
        notes:       orderForm.notes.trim() || undefined,
        items: orderForm.lines.map((l) => ({
          inventoryItem: l.inventoryItem,
          quantity:      Number(l.quantity),
          unitPrice:     Number(l.unitPrice) || 0,
        })),
      });
      setSnack({ open: true, msg: "Order created", severity: "success" });
      closeOrderDialog();
      fetchItems();
    } catch (err) {
      setOrderFormError(err.message || "Failed to create order");
    } finally {
      setOrderSaving(false);
    }
  };

  // ── Per-item history ──
  const openHistory = async (item) => {
    setHistoryItem(item);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryOrders([]);
    try {
      const data = await getOrdersByItem(item.id);
      setHistoryOrders(data);
    } catch (err) {
      setSnack({ open: true, msg: err.message || "Failed to load history", severity: "error" });
    } finally {
      setHistoryLoading(false);
    }
  };

  const isEquipmentView = typeFilter === "equipment";
  const isSupplyView = typeFilter === "supply";
  const setField = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setFormError(""); };

  return (
    <Box sx={{ bgcolor: "#eef6f1", minHeight: "calc(100vh - 64px)", py: 4, px: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1100, mx: "auto", display: "flex", flexDirection: "column", gap: 3 }}>

        {/* Page header */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: BRAND }}>Inventory</Typography>
            <Typography sx={{ fontSize: 12.5, color: "rgba(14,46,37,.65)", mt: "2px" }}>
              Track equipment, supplies, and transactions
            </Typography>
          </Box>
          {isManagerOrOwner && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => openAddDialog(typeFilter === "supply" ? "supply" : "equipment")}
                sx={{ bgcolor: BRAND, color: "#fff", borderRadius: "8px", textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#1a4a37" } }}
              >
                Add Item
              </Button>
              <Button
                variant="outlined"
                onClick={openOrderDialog}
                sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700, borderColor: "rgba(14,46,37,.2)", color: BRAND, "&:hover": { borderColor: BRAND, bgcolor: BRAND_LIGHT } }}
              >
                New Order
              </Button>
            </Stack>
          )}
        </Stack>
            {/* Filters */}
            <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center">
              <ToggleButtonGroup
                value={typeFilter} exclusive
                onChange={(_, v) => { if (v) setTypeFilter(v); }}
                size="small"
                sx={{ "& .MuiToggleButton-root": {
                  textTransform: "none", fontWeight: 600, fontSize: 12.5,
                  borderColor: "rgba(14,46,37,.18)", color: "rgba(14,46,37,.6)",
                  "&.Mui-selected": { bgcolor: BRAND, color: "#fff", "&:hover": { bgcolor: "#1a4a37" } },
                }}}
              >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="equipment">Equipment</ToggleButton>
                <ToggleButton value="supply">Supplies</ToggleButton>
              </ToggleButtonGroup>

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel sx={{ fontSize: 13 }}>Category</InputLabel>
                <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}
                  sx={{ fontSize: 13, bgcolor: "#fff", borderRadius: "6px",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(14,46,37,.18)" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: BRAND },
                  }}>
                  <MenuItem value="" sx={{ fontSize: 13 }}>All</MenuItem>
                  {categories.map((c) => <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c}</MenuItem>)}
                </Select>
              </FormControl>

              <TextField
                size="small" placeholder="Search..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "rgba(14,46,37,.4)" }} /></InputAdornment> } }}
                sx={{ ...FIELD_SX, minWidth: 180 }}
              />
            </Stack>

            {/* Items table */}
            <Paper elevation={0} sx={{ borderRadius: "10px", border: "1px solid rgba(16,24,40,.06)", overflow: "hidden" }}>
              {loading ? (
                <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
                  <CircularProgress size={28} sx={{ color: BRAND }} />
                </Box>
              ) : filtered.length === 0 ? (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <Typography sx={{ color: "rgba(14,46,37,.45)", fontSize: 14 }}>No items found.</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: BRAND_LIGHT }}>
                        {(isEquipmentView
                          ? ["Name", "Serial #", "Category", "Condition", "Assigned To", "Actions"]
                          : isSupplyView
                            ? ["Name", "Category", "Quantity", "Unit", "Stock Status", "Actions"]
                            : ["Name", "Type", "Category", "Details", "Actions"]
                        ).map((h) => (
                          <TableCell key={h} sx={{
                            fontSize: 11, fontWeight: 700, color: "rgba(14,46,37,.6)",
                            textTransform: "uppercase", letterSpacing: ".04em", py: 1.25,
                            borderBottom: "1px solid rgba(16,24,40,.07)",
                            ...(h === "Actions" && !isManagerOrOwner ? { display: "none" } : {}),
                          }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.map((item) => (
                        <TableRow key={item.id} sx={{ "&:last-child td": { border: 0 }, "&:hover": { bgcolor: "rgba(14,46,37,.025)" } }}>
                          {/* Name */}
                          <TableCell sx={{ py: 1.5 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: BRAND }}>{item.name}</Typography>
                            {item.description && (
                              <Typography sx={{ fontSize: 11, color: "rgba(14,46,37,.5)", mt: 0.25 }}>{item.description}</Typography>
                            )}
                          </TableCell>

                          {isEquipmentView ? (
                            <>
                              <TableCell sx={{ fontSize: 13, color: "rgba(14,46,37,.7)", py: 1.5 }}>{item.serialNumber || "—"}</TableCell>
                              <TableCell sx={{ fontSize: 13, color: "rgba(14,46,37,.7)", py: 1.5 }}>{item.category || "—"}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>
                                {(() => {
                                  const c = CONDITION_CHIP[item.condition] || CONDITION_CHIP.good;
                                  return <Chip label={c.label} size="small" sx={{ bgcolor: c.bgcolor, color: c.color, fontWeight: 700, fontSize: 11, borderRadius: "6px", height: 22 }} />;
                                })()}
                              </TableCell>
                              <TableCell sx={{ py: 1.5 }}>
                                {item.assignedTo ? (
                                  <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <Typography sx={{ fontSize: 13, color: BRAND }}>{item.assignedTo.firstName} {item.assignedTo.lastName}</Typography>
                                    {isManagerOrOwner && (
                                      <IconButton size="small" onClick={() => handleUnassign(item.id)} sx={{ color: "rgba(14,46,37,.4)", "&:hover": { color: "#dc2626" } }}>
                                        <PersonRemoveOutlinedIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    )}
                                  </Stack>
                                ) : (
                                  <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <Chip label="Unassigned" size="small" sx={{ bgcolor: "rgba(100,116,139,0.12)", color: "#475569", fontWeight: 700, fontSize: 11, borderRadius: "6px", height: 22 }} />
                                    {isManagerOrOwner && (
                                      <IconButton size="small" onClick={() => openAssignDialog(item.id)} sx={{ color: "rgba(14,46,37,.4)", "&:hover": { color: BRAND } }}>
                                        <PersonAddOutlinedIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    )}
                                  </Stack>
                                )}
                              </TableCell>
                            </>
                          ) : isSupplyView ? (
                            <>
                              <TableCell sx={{ fontSize: 13, color: "rgba(14,46,37,.7)", py: 1.5 }}>{item.category || "—"}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: BRAND }}>{item.quantity}</Typography>
                                  {isManagerOrOwner && (
                                    <>
                                      <IconButton size="small" onClick={() => openRestock(item)}
                                        sx={{ color: "rgba(14,46,37,.4)", "&:hover": { color: "#15803d" }, width: 22, height: 22 }}
                                        title="Restock">
                                        <AddIcon sx={{ fontSize: 15 }} />
                                      </IconButton>
                                      <IconButton size="small" onClick={() => handleDecrease(item)}
                                        disabled={item.quantity <= 0}
                                        sx={{ color: "rgba(14,46,37,.4)", "&:hover": { color: "#dc2626" }, width: 22, height: 22 }}
                                        title="Use 1">
                                        <RemoveIcon sx={{ fontSize: 15 }} />
                                      </IconButton>
                                    </>
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell sx={{ fontSize: 13, color: "rgba(14,46,37,.7)", py: 1.5 }}>{item.unit}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>
                                {item.quantity <= item.lowStockThreshold && item.lowStockThreshold > 0 ? (
                                  <Chip label="Low Stock" size="small" sx={{ bgcolor: "rgba(220,38,38,0.12)", color: "#dc2626", fontWeight: 700, fontSize: 11, borderRadius: "6px", height: 22 }} />
                                ) : (
                                  <Chip label="In Stock" size="small" sx={{ bgcolor: "rgba(21,128,61,0.12)", color: "#15803d", fontWeight: 700, fontSize: 11, borderRadius: "6px", height: 22 }} />
                                )}
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell sx={{ py: 1.5 }}>
                                <Chip label={item.type === "equipment" ? "Equipment" : "Supply"} size="small"
                                  sx={{ bgcolor: item.type === "equipment" ? "rgba(37,99,235,0.12)" : "rgba(217,119,6,0.12)", color: item.type === "equipment" ? "#2563eb" : "#d97706", fontWeight: 700, fontSize: 11, borderRadius: "6px", height: 22 }} />
                              </TableCell>
                              <TableCell sx={{ fontSize: 13, color: "rgba(14,46,37,.7)", py: 1.5 }}>{item.category || "—"}</TableCell>
                              <TableCell sx={{ fontSize: 12, color: "rgba(14,46,37,.55)", py: 1.5 }}>
                                {item.type === "equipment"
                                  ? `${item.condition}${item.assignedTo ? ` · ${item.assignedTo.firstName} ${item.assignedTo.lastName}` : ""}`
                                  : `${item.quantity} ${item.unit}`}
                              </TableCell>
                            </>
                          )}

                          {/* Actions */}
                          {isManagerOrOwner ? (
                            <TableCell sx={{ py: 1.5 }}>
                              <Stack direction="row" spacing={0.25}>
                                {item.type === "supply" && (
                                  <IconButton size="small" onClick={() => openHistory(item)}
                                    sx={{ color: "rgba(14,46,37,.4)", "&:hover": { color: BRAND } }}
                                    title="View history">
                                    <HistoryIcon sx={{ fontSize: 17 }} />
                                  </IconButton>
                                )}
                                <IconButton size="small" onClick={() => openEditDialog(item)} sx={{ color: "rgba(14,46,37,.4)", "&:hover": { color: BRAND } }}>
                                  <EditOutlinedIcon sx={{ fontSize: 17 }} />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleDelete(item.id)} sx={{ color: "rgba(14,46,37,.4)", "&:hover": { color: "#dc2626" } }}>
                                  <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                                </IconButton>
                              </Stack>
                            </TableCell>
                          ) : item.type === "supply" ? (
                            <TableCell sx={{ py: 1.5 }}>
                              <IconButton size="small" onClick={() => openHistory(item)} sx={{ color: "rgba(14,46,37,.4)", "&:hover": { color: BRAND } }} title="View history">
                                <HistoryIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </TableCell>
                          ) : (
                            <TableCell />
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>

        <ZcorAllRightsReserved />
      </Box>

      {/* ── Add / Edit Item Dialog ── */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: "10px", border: "1px solid rgba(14,46,37,.12)" } } }}>
        <DialogTitle sx={{ pb: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 700, fontSize: 17, color: BRAND }}>{editing ? "Edit Item" : "Add Item"}</Typography>
          <IconButton size="small" onClick={closeDialog} sx={{ mt: -0.5, mr: -0.5 }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <Divider sx={{ mt: 1, borderColor: "rgba(14,46,37,.1)" }} />
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          {!editing && (
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Type</Typography>
              <ToggleButtonGroup value={form.type} exclusive onChange={(_, v) => { if (v) setField("type", v); }} size="small" fullWidth
                sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 600, fontSize: 13, "&.Mui-selected": { bgcolor: BRAND, color: "#fff", "&:hover": { bgcolor: "#1a4a37" } } } }}>
                <ToggleButton value="equipment">Equipment</ToggleButton>
                <ToggleButton value="supply">Supply</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Name</Typography>
            <TextField fullWidth size="small" placeholder="Item name" autoFocus value={form.name || ""} onChange={(e) => setField("name", e.target.value)} sx={FIELD_SX} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Category</Typography>
            {addingCategory ? (
              <Stack direction="row" spacing={1}>
                <TextField fullWidth size="small" autoFocus placeholder="New category name" value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCategory.trim()) { setField("category", newCategory.trim()); setAddingCategory(false); setNewCategory(""); }
                    if (e.key === "Escape") { setAddingCategory(false); setNewCategory(""); }
                  }}
                  sx={FIELD_SX} />
                <Button size="small" variant="contained" disabled={!newCategory.trim()}
                  onClick={() => { setField("category", newCategory.trim()); setAddingCategory(false); setNewCategory(""); }}
                  sx={{ minWidth: 0, px: 2, textTransform: "none", borderRadius: "6px", fontSize: 13, fontWeight: 700, bgcolor: BRAND, "&:hover": { bgcolor: "#1a4a37" } }}>
                  Add
                </Button>
                <Button size="small" variant="outlined"
                  onClick={() => { setAddingCategory(false); setNewCategory(""); }}
                  sx={{ minWidth: 0, px: 1.5, textTransform: "none", borderRadius: "6px", fontSize: 13, borderColor: "rgba(14,46,37,.2)", color: BRAND }}>
                  Cancel
                </Button>
              </Stack>
            ) : (
              <Select fullWidth size="small" value={form.category || ""} displayEmpty
                onChange={(e) => {
                  if (e.target.value === "__add__") { setAddingCategory(true); }
                  else setField("category", e.target.value);
                }}
                sx={{ fontSize: 13, bgcolor: "#fff", borderRadius: "6px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(14,46,37,.18)" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: BRAND } }}>
                <MenuItem value="" sx={{ fontSize: 13, color: "rgba(14,46,37,.45)" }}>No category</MenuItem>
                {dialogCategories.map((c) => <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c}</MenuItem>)}
                <Divider sx={{ my: 0.5 }} />
                <MenuItem value="__add__" sx={{ fontSize: 13, color: BRAND, fontWeight: 700 }}>+ Add new category…</MenuItem>
              </Select>
            )}
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Description</Typography>
            <TextField fullWidth size="small" placeholder="Optional details" multiline rows={2} value={form.description || ""} onChange={(e) => setField("description", e.target.value)} sx={FIELD_SX} />
          </Box>
          {(editing ? editing.type : form.type) === "equipment" && (
            <>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Serial Number</Typography>
                <TextField fullWidth size="small" placeholder="Optional" value={form.serialNumber || ""} onChange={(e) => setField("serialNumber", e.target.value)} sx={FIELD_SX} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Condition</Typography>
                <Select fullWidth size="small" value={form.condition || "good"} onChange={(e) => setField("condition", e.target.value)}
                  sx={{ fontSize: 13, bgcolor: "#fff", borderRadius: "6px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(14,46,37,.18)" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: BRAND } }}>
                  {["new", "good", "fair", "poor", "retired"].map((c) => <MenuItem key={c} value={c} sx={{ fontSize: 13, textTransform: "capitalize" }}>{c}</MenuItem>)}
                </Select>
              </Box>
              <Stack direction="row" spacing={1.5}>
                <Box flex={1}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Purchase Date</Typography>
                  <TextField fullWidth size="small" type="date" value={form.purchaseDate || ""} onChange={(e) => setField("purchaseDate", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={FIELD_SX} />
                </Box>
                <Box flex={1}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Purchase Cost</Typography>
                  <TextField fullWidth size="small" type="number" placeholder="0.00" value={form.purchaseCost ?? ""} onChange={(e) => { const v = e.target.value; if (v === "" || Number(v) >= 0) setField("purchaseCost", v); }} slotProps={{ htmlInput: { min: 0, step: "0.01" } }} sx={FIELD_SX} />
                </Box>
              </Stack>
            </>
          )}
          {(editing ? editing.type : form.type) === "supply" && (
            <>
              <Stack direction="row" spacing={1.5}>
                <Box flex={1}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Quantity</Typography>
                  <TextField fullWidth size="small" type="number" value={form.quantity ?? 0} onChange={(e) => setField("quantity", e.target.value)} slotProps={{ htmlInput: { min: 0 } }} sx={FIELD_SX} />
                </Box>
                <Box flex={1}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Unit</Typography>
                  <TextField fullWidth size="small" placeholder="units" value={form.unit || ""} onChange={(e) => setField("unit", e.target.value)} sx={FIELD_SX} />
                </Box>
              </Stack>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Low Stock Threshold</Typography>
                <TextField fullWidth size="small" type="number" value={form.lowStockThreshold ?? 0} onChange={(e) => setField("lowStockThreshold", e.target.value)} slotProps={{ htmlInput: { min: 0 } }} sx={FIELD_SX} />
              </Box>
            </>
          )}
          {formError && <Typography sx={{ color: "#dc2626", fontSize: 12.5, mt: -0.5 }}>{formError}</Typography>}
        </DialogContent>
        <Divider sx={{ borderColor: "rgba(14,46,37,.1)" }} />
        <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
          <Button variant="outlined" size="small" onClick={closeDialog}
            sx={{ textTransform: "none", borderRadius: "6px", fontSize: 13, borderColor: "rgba(14,46,37,.2)", color: BRAND, "&:hover": { borderColor: BRAND, bgcolor: BRAND_LIGHT } }}>
            Cancel
          </Button>
          <Button variant="contained" size="small" onClick={handleSave} disabled={saving}
            sx={{ textTransform: "none", borderRadius: "6px", fontSize: 13, bgcolor: BRAND, color: "#fff", "&:hover": { bgcolor: "#1a4a37" }, "&.Mui-disabled": { bgcolor: "rgba(14,46,37,.25)", color: "#fff" } }}>
            {saving ? "Saving…" : editing ? "Save Changes" : "Create Item"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Assign Dialog ── */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} fullWidth maxWidth="xs"
        PaperProps={{ sx: { borderRadius: "10px", border: "1px solid rgba(14,46,37,.12)" } }}>
        <DialogTitle sx={{ pb: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 700, fontSize: 17, color: BRAND }}>Assign to Employee</Typography>
          <IconButton size="small" onClick={() => setAssignOpen(false)} sx={{ mt: -0.5, mr: -0.5 }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <Divider sx={{ mt: 1, borderColor: "rgba(14,46,37,.1)" }} />
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Employee</Typography>
          <Select fullWidth size="small" value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} displayEmpty
            sx={{ fontSize: 13, bgcolor: "#fff", borderRadius: "6px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(14,46,37,.18)" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: BRAND } }}>
            <MenuItem value="" disabled sx={{ fontSize: 13 }}>Select employee</MenuItem>
            {employees.map((emp) => <MenuItem key={emp._id || emp.id} value={emp._id || emp.id} sx={{ fontSize: 13 }}>{emp.firstName} {emp.lastName}</MenuItem>)}
          </Select>
        </DialogContent>
        <Divider sx={{ borderColor: "rgba(14,46,37,.1)" }} />
        <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
          <Button variant="outlined" size="small" onClick={() => setAssignOpen(false)}
            sx={{ textTransform: "none", borderRadius: "6px", fontSize: 13, borderColor: "rgba(14,46,37,.2)", color: BRAND, "&:hover": { borderColor: BRAND, bgcolor: BRAND_LIGHT } }}>
            Cancel
          </Button>
          <Button variant="contained" size="small" onClick={handleAssign} disabled={!assignUserId || assignSaving}
            sx={{ textTransform: "none", borderRadius: "6px", fontSize: 13, bgcolor: BRAND, color: "#fff", "&:hover": { bgcolor: "#1a4a37" }, "&.Mui-disabled": { bgcolor: "rgba(14,46,37,.25)", color: "#fff" } }}>
            {assignSaving ? "Assigning…" : "Assign"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Restock Dialog ── */}
      <Dialog open={restockOpen} onClose={closeRestock} fullWidth maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: "10px", border: "1px solid rgba(14,46,37,.12)" } } }}>
        <DialogTitle sx={{ pb: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 17, color: BRAND }}>Restock Item</Typography>
            {restockItem && <Typography sx={{ fontSize: 12.5, color: "rgba(14,46,37,.55)", mt: 0.25 }}>{restockItem.name}</Typography>}
          </Box>
          <IconButton size="small" onClick={closeRestock} sx={{ mt: -0.5, mr: -0.5 }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <Divider sx={{ mt: 1, borderColor: "rgba(14,46,37,.1)" }} />
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          {restockItem && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={`Current: ${restockItem.quantity} ${restockItem.unit}`} size="small"
                sx={{ bgcolor: BRAND_LIGHT, color: BRAND, fontWeight: 700, fontSize: 12, borderRadius: "6px", height: 24 }} />
              {restockItem.lowStockThreshold > 0 && restockItem.quantity <= restockItem.lowStockThreshold && (
                <Chip label="Low Stock" size="small" sx={{ bgcolor: "rgba(220,38,38,0.12)", color: "#dc2626", fontWeight: 700, fontSize: 11, borderRadius: "6px", height: 22 }} />
              )}
            </Stack>
          )}
          <Stack direction="row" spacing={1.5}>
            <Box flex={1}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Quantity</Typography>
              <TextField fullWidth size="small" type="number" autoFocus value={restockForm.quantity}
                onChange={(e) => setRestockForm((f) => ({ ...f, quantity: e.target.value }))}
                slotProps={{ htmlInput: { min: 1 } }} sx={FIELD_SX} />
            </Box>
            <Box flex={1}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Cost / Unit</Typography>
              <TextField fullWidth size="small" type="number" placeholder="0.00" value={restockForm.unitPrice}
                onChange={(e) => setRestockForm((f) => ({ ...f, unitPrice: e.target.value }))}
                slotProps={{ htmlInput: { min: 0, step: "0.01" } }} sx={FIELD_SX} />
            </Box>
          </Stack>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Vendor (optional)</Typography>
            <TextField fullWidth size="small" placeholder="Supplier name" value={restockForm.vendor}
              onChange={(e) => setRestockForm((f) => ({ ...f, vendor: e.target.value }))} sx={FIELD_SX} />
          </Box>
          {Number(restockForm.unitPrice) > 0 && Number(restockForm.quantity) >= 1 && (
            <Stack direction="row" justifyContent="flex-end">
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: BRAND }}>
                Total: {formatCurrency(Number(restockForm.quantity) * Number(restockForm.unitPrice))}
              </Typography>
            </Stack>
          )}
          {restockError && <Typography sx={{ color: "#dc2626", fontSize: 12.5, mt: -0.5 }}>{restockError}</Typography>}
        </DialogContent>
        <Divider sx={{ borderColor: "rgba(14,46,37,.1)" }} />
        <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
          <Button variant="outlined" size="small" onClick={closeRestock}
            sx={{ textTransform: "none", borderRadius: "6px", fontSize: 13, borderColor: "rgba(14,46,37,.2)", color: BRAND, "&:hover": { borderColor: BRAND, bgcolor: BRAND_LIGHT } }}>
            Cancel
          </Button>
          <Button variant="contained" size="small" onClick={handleRestock} disabled={restockSaving}
            sx={{ textTransform: "none", borderRadius: "6px", fontSize: 13, bgcolor: BRAND, color: "#fff", "&:hover": { bgcolor: "#1a4a37" }, "&.Mui-disabled": { bgcolor: "rgba(14,46,37,.25)", color: "#fff" } }}>
            {restockSaving ? "Restocking…" : "Restock"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── New Order Dialog ── */}
      <Dialog open={orderDialogOpen} onClose={closeOrderDialog} fullWidth maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: "10px", border: "1px solid rgba(14,46,37,.12)" } } }}>
        <DialogTitle sx={{ pb: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 700, fontSize: 17, color: BRAND }}>New Order</Typography>
          <IconButton size="small" onClick={closeOrderDialog} sx={{ mt: -0.5, mr: -0.5 }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <Divider sx={{ mt: 1, borderColor: "rgba(14,46,37,.1)" }} />
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Order type */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Order Type</Typography>
            <ToggleButtonGroup value={orderForm.orderType} exclusive onChange={(_, v) => { if (v) setOrderField("orderType", v); }} size="small" fullWidth
              sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 600, fontSize: 13, "&.Mui-selected": { bgcolor: BRAND, color: "#fff", "&:hover": { bgcolor: "#1a4a37" } } } }}>
              <ToggleButton value="purchase">Purchase</ToggleButton>
              <ToggleButton value="sale">Sale</ToggleButton>
              <ToggleButton value="usage">Usage</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Order date */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Order Date</Typography>
            <TextField fullWidth size="small" type="date" value={orderForm.orderDate} onChange={(e) => setOrderField("orderDate", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={FIELD_SX} />
          </Box>

          {/* Purchase → vendor */}
          {orderForm.orderType === "purchase" && (
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Vendor</Typography>
              {addingVendor ? (
                <Stack direction="row" spacing={1}>
                  <TextField fullWidth size="small" autoFocus placeholder="New vendor name" value={newVendor}
                    onChange={(e) => setNewVendor(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newVendor.trim()) { setOrderField("vendor", newVendor.trim()); setAddingVendor(false); setNewVendor(""); }
                      if (e.key === "Escape") { setAddingVendor(false); setNewVendor(""); }
                    }}
                    sx={FIELD_SX} />
                  <Button size="small" variant="contained" disabled={!newVendor.trim()}
                    onClick={() => { setOrderField("vendor", newVendor.trim()); setAddingVendor(false); setNewVendor(""); }}
                    sx={{ minWidth: 0, px: 2, textTransform: "none", borderRadius: "6px", fontSize: 13, fontWeight: 700, bgcolor: BRAND, "&:hover": { bgcolor: "#1a4a37" } }}>
                    Add
                  </Button>
                  <Button size="small" variant="outlined"
                    onClick={() => { setAddingVendor(false); setNewVendor(""); }}
                    sx={{ minWidth: 0, px: 1.5, textTransform: "none", borderRadius: "6px", fontSize: 13, borderColor: "rgba(14,46,37,.2)", color: BRAND }}>
                    Cancel
                  </Button>
                </Stack>
              ) : (
                <Select fullWidth size="small" value={orderForm.vendor} displayEmpty
                  onChange={(e) => {
                    if (e.target.value === "__add__") { setAddingVendor(true); }
                    else setOrderField("vendor", e.target.value);
                  }}
                  sx={{ fontSize: 13, bgcolor: "#fff", borderRadius: "6px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(14,46,37,.18)" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: BRAND } }}>
                  <MenuItem value="" disabled sx={{ fontSize: 13, color: "rgba(14,46,37,.45)" }}>Select vendor</MenuItem>
                  {vendors.map((v) => <MenuItem key={v} value={v} sx={{ fontSize: 13 }}>{v}</MenuItem>)}
                  <Divider sx={{ my: 0.5 }} />
                  <MenuItem value="__add__" sx={{ fontSize: 13, color: BRAND, fontWeight: 700 }}>+ Add new vendor…</MenuItem>
                </Select>
              )}
            </Box>
          )}

          {/* Sale → buyer */}
          {orderForm.orderType === "sale" && (
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Buyer</Typography>
              <Select fullWidth size="small" value={orderForm.relatedUser} onChange={(e) => setOrderField("relatedUser", e.target.value)} displayEmpty
                sx={{ fontSize: 13, bgcolor: "#fff", borderRadius: "6px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(14,46,37,.18)" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: BRAND } }}>
                <MenuItem value="" disabled sx={{ fontSize: 13 }}>Select buyer</MenuItem>
                {allUsers.map((u) => <MenuItem key={u._id || u.id} value={u._id || u.id} sx={{ fontSize: 13 }}>{u.firstName} {u.lastName}</MenuItem>)}
              </Select>
            </Box>
          )}

          {/* Usage → optional user */}
          {orderForm.orderType === "usage" && (
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Used By (optional)</Typography>
              <Select fullWidth size="small" value={orderForm.relatedUser} onChange={(e) => setOrderField("relatedUser", e.target.value)} displayEmpty
                sx={{ fontSize: 13, bgcolor: "#fff", borderRadius: "6px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(14,46,37,.18)" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: BRAND } }}>
                <MenuItem value="" sx={{ fontSize: 13 }}>None</MenuItem>
                {allUsers.map((u) => <MenuItem key={u._id || u.id} value={u._id || u.id} sx={{ fontSize: 13 }}>{u.firstName} {u.lastName}</MenuItem>)}
              </Select>
            </Box>
          )}

          {/* Line items */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 1, textTransform: "uppercase", letterSpacing: .5 }}>Items</Typography>
            {/* Column headers */}
            <Stack direction="row" spacing={1} sx={{ mb: 0.5, px: 0.25 }}>
              <Typography sx={{ flex: 2, fontSize: 11, fontWeight: 600, color: "rgba(14,46,37,.45)", textTransform: "uppercase", letterSpacing: .4 }}>Item</Typography>
              <Typography sx={{ width: 80, fontSize: 11, fontWeight: 600, color: "rgba(14,46,37,.45)", textTransform: "uppercase", letterSpacing: .4 }}>Qty</Typography>
              <Typography sx={{ width: 48, fontSize: 11, fontWeight: 600, color: "rgba(14,46,37,.45)", textTransform: "uppercase", letterSpacing: .4 }}>Unit</Typography>
              {orderForm.orderType !== "usage" && (
                <Typography sx={{ width: 100, fontSize: 11, fontWeight: 600, color: "rgba(14,46,37,.45)", textTransform: "uppercase", letterSpacing: .4 }}>
                  {orderForm.orderType === "purchase" ? "Cost / unit" : "Price / unit"}
                </Typography>
              )}
              {orderForm.orderType !== "usage" && (
                <Typography sx={{ minWidth: 56, fontSize: 11, fontWeight: 600, color: "rgba(14,46,37,.45)", textTransform: "uppercase", letterSpacing: .4, textAlign: "right" }}>Total</Typography>
              )}
            </Stack>
            <Stack spacing={1}>
              {orderForm.lines.map((line, idx) => {
                const selectedItem = supplyItems.find((si) => si.id === line.inventoryItem);
                return (
                  <Stack key={idx} direction="row" spacing={1} alignItems="center">
                    {/* Item dropdown */}
                    <Select size="small" value={line.inventoryItem} onChange={(e) => setLineField(idx, "inventoryItem", e.target.value)} displayEmpty
                      sx={{ flex: 2, fontSize: 13, bgcolor: "#fff", borderRadius: "6px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(14,46,37,.18)" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: BRAND } }}>
                      <MenuItem value="" disabled sx={{ fontSize: 13 }}>Select item</MenuItem>
                      {supplyItems.map((si) => <MenuItem key={si.id} value={si.id} sx={{ fontSize: 13 }}>{si.name}</MenuItem>)}
                    </Select>

                    {/* Quantity */}
                    <TextField size="small" type="number" placeholder="Qty" value={line.quantity}
                      onChange={(e) => setLineField(idx, "quantity", e.target.value)}
                      slotProps={{ htmlInput: { min: 1, style: { width: 56 } } }}
                      sx={{ ...FIELD_SX, width: 80 }} />

                    {/* Unit label */}
                    <Typography sx={{ width: 48, fontSize: 12.5, color: "rgba(14,46,37,.55)", flexShrink: 0 }}>
                      {selectedItem?.unit || "—"}
                    </Typography>

                    {/* Unit price (hidden for usage) */}
                    {orderForm.orderType !== "usage" && (
                      <TextField size="small" type="number" placeholder="0.00"
                        value={line.unitPrice}
                        onChange={(e) => setLineField(idx, "unitPrice", e.target.value)}
                        slotProps={{ htmlInput: { min: 0, step: "0.01", style: { width: 72 } } }}
                        sx={{ ...FIELD_SX, width: 100 }} />
                    )}

                    {/* Line total */}
                    {orderForm.orderType !== "usage" && (
                      <Typography sx={{ fontSize: 12.5, color: BRAND, minWidth: 56, textAlign: "right" }}>
                        {formatCurrency((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0))}
                      </Typography>
                    )}

                    {/* Remove */}
                    {orderForm.lines.length > 1 && (
                      <IconButton size="small" onClick={() => removeLine(idx)} sx={{ color: "rgba(14,46,37,.35)", "&:hover": { color: "#dc2626" } }}>
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                  </Stack>
                );
              })}
            </Stack>
            <Button size="small" onClick={addLine} sx={{ mt: 1, textTransform: "none", fontSize: 12.5, color: BRAND, fontWeight: 600 }}>
              + Add Item
            </Button>
          </Box>

          {/* Total */}
          {orderTotal != null && (
            <Stack direction="row" justifyContent="flex-end">
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: BRAND }}>
                Total: {formatCurrency(orderTotal)}
              </Typography>
            </Stack>
          )}

          {/* Notes */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: BRAND, mb: 0.75, textTransform: "uppercase", letterSpacing: .5 }}>Notes (optional)</Typography>
            <TextField fullWidth size="small" multiline rows={2} placeholder="Any notes…" value={orderForm.notes} onChange={(e) => setOrderField("notes", e.target.value)} sx={FIELD_SX} />
          </Box>

          {orderFormError && <Typography sx={{ color: "#dc2626", fontSize: 12.5 }}>{orderFormError}</Typography>}
        </DialogContent>
        <Divider sx={{ borderColor: "rgba(14,46,37,.1)" }} />
        <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
          <Button variant="outlined" size="small" onClick={closeOrderDialog}
            sx={{ textTransform: "none", borderRadius: "6px", fontSize: 13, borderColor: "rgba(14,46,37,.2)", color: BRAND, "&:hover": { borderColor: BRAND, bgcolor: BRAND_LIGHT } }}>
            Cancel
          </Button>
          <Button variant="contained" size="small" onClick={handleCreateOrder} disabled={orderSaving}
            sx={{ textTransform: "none", borderRadius: "6px", fontSize: 13, bgcolor: BRAND, color: "#fff", "&:hover": { bgcolor: "#1a4a37" }, "&.Mui-disabled": { bgcolor: "rgba(14,46,37,.25)", color: "#fff" } }}>
            {orderSaving ? "Creating…" : "Create Order"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Per-Item History Dialog ── */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} fullWidth maxWidth="md"
        slotProps={{ paper: { sx: { borderRadius: "10px", border: "1px solid rgba(14,46,37,.12)" } } }}>
        <DialogTitle sx={{ pb: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 17, color: BRAND }}>Transaction History</Typography>
            {historyItem && <Typography sx={{ fontSize: 12.5, color: "rgba(14,46,37,.55)", mt: 0.25 }}>{historyItem.name}</Typography>}
          </Box>
          <IconButton size="small" onClick={() => setHistoryOpen(false)} sx={{ mt: -0.5, mr: -0.5 }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <Divider sx={{ mt: 1, borderColor: "rgba(14,46,37,.1)" }} />
        <DialogContent sx={{ pt: 2, px: 0 }}>
          {historyLoading ? (
            <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}><CircularProgress size={24} sx={{ color: BRAND }} /></Box>
          ) : historyOrders.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography sx={{ color: "rgba(14,46,37,.45)", fontSize: 14 }}>No transactions for this item.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: BRAND_LIGHT }}>
                    {["Date", "Type", "Vendor / User", "Qty", "Unit Price", "Line Total"].map((h) => (
                      <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: "rgba(14,46,37,.6)", textTransform: "uppercase", letterSpacing: ".04em", py: 1 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyOrders.map((order) => {
                    const li = order.items.find((l) => {
                      const itemId = l.inventoryItem?._id || l.inventoryItem?.id || l.inventoryItem;
                      return String(itemId) === String(historyItem?.id);
                    });
                    if (!li) return null;
                    const tc = ORDER_TYPE_CHIP[order.orderType] || ORDER_TYPE_CHIP.usage;
                    const vendorUser = order.orderType === "purchase"
                      ? (order.vendor || "—")
                      : order.relatedUser ? `${order.relatedUser.firstName} ${order.relatedUser.lastName}` : "—";
                    return (
                      <TableRow key={order.id} sx={{ "&:last-child td": { border: 0 }, "&:hover": { bgcolor: "rgba(14,46,37,.025)" } }}>
                        <TableCell sx={{ fontSize: 13, color: "rgba(14,46,37,.7)", py: 1.25 }}>{formatDate(order.orderDate)}</TableCell>
                        <TableCell sx={{ py: 1.25 }}>
                          <Chip label={tc.label} size="small" sx={{ bgcolor: tc.bgcolor, color: tc.color, fontWeight: 700, fontSize: 11, borderRadius: "6px", height: 20 }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: 13, color: "rgba(14,46,37,.7)", py: 1.25 }}>{vendorUser}</TableCell>
                        <TableCell sx={{ fontSize: 13, color: BRAND, fontWeight: 600, py: 1.25 }}>{li.quantity}</TableCell>
                        <TableCell sx={{ fontSize: 13, color: "rgba(14,46,37,.7)", py: 1.25 }}>
                          {order.orderType === "usage" ? "—" : formatCurrency(li.unitPrice)}
                        </TableCell>
                        <TableCell sx={{ fontSize: 13, color: BRAND, fontWeight: 600, py: 1.25 }}>
                          {order.orderType === "usage" ? "—" : formatCurrency(li.lineTotal)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <Divider sx={{ borderColor: "rgba(14,46,37,.1)" }} />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button variant="outlined" size="small" onClick={() => setHistoryOpen(false)}
            sx={{ textTransform: "none", borderRadius: "6px", fontSize: 13, borderColor: "rgba(14,46,37,.2)", color: BRAND, "&:hover": { borderColor: BRAND, bgcolor: BRAND_LIGHT } }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Confirm Dialog ── */}
      <Dialog open={confirmDialog.open} onClose={closeConfirm} fullWidth maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: "10px", border: "1px solid rgba(14,46,37,.12)" } } }}>
        <DialogTitle sx={{ pb: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16, color: BRAND }}>{confirmDialog.title}</Typography>
          <IconButton size="small" onClick={closeConfirm} sx={{ mt: -0.5, mr: -0.5 }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <Divider sx={{ borderColor: "rgba(14,46,37,.1)" }} />
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ fontSize: 13.5, color: "rgba(14,46,37,.75)", lineHeight: 1.6 }}>{confirmDialog.body}</Typography>
        </DialogContent>
        <Divider sx={{ borderColor: "rgba(14,46,37,.1)" }} />
        <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
          <Button variant="outlined" size="small" onClick={closeConfirm}
            sx={{ textTransform: "none", borderRadius: "6px", fontSize: 13, borderColor: "rgba(14,46,37,.2)", color: BRAND, "&:hover": { borderColor: BRAND, bgcolor: BRAND_LIGHT } }}>
            Cancel
          </Button>
          <Button variant="contained" size="small"
            onClick={() => { confirmDialog.onConfirm?.(); closeConfirm(); }}
            sx={{ textTransform: "none", borderRadius: "6px", fontSize: 13, bgcolor: "#dc2626", color: "#fff", "&:hover": { bgcolor: "#b91c1c" } }}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} variant="filled" sx={{ borderRadius: "8px" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
