import { apiFetch } from "./api.js";

// ── Pay Periods ──

export const getPayPeriods = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.frequency) qs.set("frequency", params.frequency);
  const q = qs.toString();
  return apiFetch(`/api/payroll/pay-periods${q ? `?${q}` : ""}`);
};

export const createPayPeriod = (data) =>
  apiFetch("/api/payroll/pay-periods", { method: "POST", body: data });

export const getPayPeriod = (id) =>
  apiFetch(`/api/payroll/pay-periods/${id}`);

export const updatePayPeriodStatus = (id, action) =>
  apiFetch(`/api/payroll/pay-periods/${id}`, { method: "PATCH", body: { action } });

export const deletePayPeriod = (id) =>
  apiFetch(`/api/payroll/pay-periods/${id}`, { method: "DELETE" });

export const recalculatePayPeriod = (id) =>
  apiFetch(`/api/payroll/pay-periods/${id}/recalculate`, { method: "POST" });

// ── Payslips ──

export const getMyPayslips = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.payPeriodId) qs.set("payPeriodId", params.payPeriodId);
  const q = qs.toString();
  return apiFetch(`/api/payroll/payslips/me${q ? `?${q}` : ""}`);
};

export const getPayslip = (id) =>
  apiFetch(`/api/payroll/payslips/${id}`);

export const adjustPayslip = (id, data) =>
  apiFetch(`/api/payroll/payslips/${id}`, { method: "PATCH", body: data });
