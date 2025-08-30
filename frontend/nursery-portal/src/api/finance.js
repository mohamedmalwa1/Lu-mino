import axios from "./axios";

// Base URL for finance endpoints
const FINANCE_URL = "/v1/finance";

/* ------------- Invoices ------------- */
export const listInvoices = (params) =>
  axios.get(`${FINANCE_URL}/invoices/`, { params }).then((r) => r.data);

export const getInvoice = (id) =>
    axios.get(`${FINANCE_URL}/invoices/${id}/`).then((r) => r.data);

export const createInvoice = (data) =>
  axios.post(`${FINANCE_URL}/invoices/`, data).then((r) => r.data);

export const updateInvoice = (id, data) =>
  axios.put(`${FINANCE_URL}/invoices/${id}/`, data).then((r) => r.data);

export const deleteInvoice = (id) =>
  axios.delete(`${FINANCE_URL}/invoices/${id}/`);

// PDF Download and Email functions - FIXED
export const downloadInvoicePDF = (id) =>
  axios.get(`${FINANCE_URL}/invoices/${id}/pdf/`, { 
    responseType: "blob",
    timeout: 60000
  }).then((r) => {
    if (r.status === 200) {
      return r.data;
    }
    throw new Error(`Failed to download PDF: ${r.status} ${r.statusText}`);
  });

export const emailInvoice = (id, to) => {
  const payload = to && to.length > 0 ? { to } : {};
  return axios.post(`${FINANCE_URL}/invoices/${id}/email/`, payload)
    .then((r) => r.data)
    .catch((error) => {
      console.error("Email API error:", error);
      throw error;
    });
};

/* ------------- Expenses ------------- */
export const listExpenses = () =>
  axios.get(`${FINANCE_URL}/expenses/`).then((r) => r.data);

export const getExpense = (id) =>
    axios.get(`${FINANCE_URL}/expenses/${id}/`).then((r) => r.data);

export const createExpense = (data) =>
  axios.post(`${FINANCE_URL}/expenses/`, data).then((r) => r.data);

export const updateExpense = (id, data) =>
  axios.put(`${FINANCE_URL}/expenses/${id}/`, data).then((r) => r.data);

export const deleteExpense = (id) =>
  axios.delete(`${FINANCE_URL}/expenses/${id}/`);

/* ------------- Treasury ------------- */
export const listTreasuries = () =>
  axios.get(`${FINANCE_URL}/treasuries/`).then((r) => r.data);

export const getTreasury = (id) =>
    axios.get(`${FINANCE_URL}/treasuries/${id}/`).then((r) => r.data);

export const createTreasury = (data) =>
  axios.post(`${FINANCE_URL}/treasuries/`, data).then((r) => r.data);

export const updateTreasury = (id, data) =>
  axios.put(`${FINANCE_URL}/treasuries/${id}/`, data).then((r) => r.data);

export const listTreasuryTransactions = (treasuryId) =>
  axios.get(`${FINANCE_URL}/transactions/`, { params: { treasury: treasuryId } }).then((r) => r.data);

/* ------------- Payments ------------- */
export const listPayments = () =>
  axios.get(`${FINANCE_URL}/payments/`).then((r) => r.data);

export const getPayment = (id) =>
    axios.get(`${FINANCE_URL}/payments/${id}/`).then((r) => r.data);

export const createPayment = (data) =>
  axios.post(`${FINANCE_URL}/payments/`, data).then((r) => r.data);

export const updatePayment = (id, data) =>
    axios.put(`${FINANCE_URL}/payments/${id}/`, data).then((r) => r.data);

export const deletePayment = (id) =>
  axios.delete(`${FINANCE_URL}/payments/${id}/`);

// Payment PDF Download and Email functions
export const downloadPaymentPDF = (id) =>
  axios.get(`${FINANCE_URL}/payments/${id}/receipt.pdf`, { 
    responseType: "blob",
    timeout: 60000
  }).then((r) => {
    if (r.status === 200) {
      return r.data;
    }
    throw new Error(`Failed to download PDF: ${r.status} ${r.statusText}`);
  });

export const emailPayment = (id, to) => {
  const payload = to && to.length > 0 ? { to } : {};
  return axios.post(`${FINANCE_URL}/payments/${id}/email/`, payload)
    .then((r) => r.data)
    .catch((error) => {
      console.error("Email API error:", error);
      throw error;
    });
};

/* ------------- Purchase Orders ------------- */
export const listPurchaseOrders = () =>
  axios.get(`${FINANCE_URL}/purchase-orders/`).then((r) => r.data);

export const getPurchaseOrder = (id) =>
    axios.get(`${FINANCE_URL}/purchase-orders/${id}/`).then((r) => r.data);

export const createPurchaseOrder = (data) =>
  axios.post(`${FINANCE_URL}/purchase-orders/`, data).then((r) => r.data);

export const updatePurchaseOrder = (id, data) =>
  axios.put(`${FINANCE_URL}/purchase-orders/${id}/`, data).then((r) => r.data);

export const deletePurchaseOrder = (id) =>
  axios.delete(`${FINANCE_URL}/purchase-orders/${id}/`);

// Purchase Order PDF Download and Email functions
export const downloadPurchaseOrderPDF = (id) =>
  axios.get(`${FINANCE_URL}/purchase-orders/${id}/pdf/`, { 
    responseType: "blob",
    timeout: 60000
  }).then((r) => {
    if (r.status === 200) {
      return r.data;
    }
    throw new Error(`Failed to download PDF: ${r.status} ${r.statusText}`);
  });

export const emailPurchaseOrder = (id, to) => {
  const payload = to && to.length > 0 ? { to } : {};
  return axios.post(`${FINANCE_URL}/purchase-orders/${id}/email/`, payload)
    .then((r) => r.data)
    .catch((error) => {
      console.error("Email API error:", error);
      throw error;
    });
};

/* ------------- Salary Payments ------------- */
export const listSalaryPayments = () =>
  axios.get(`${FINANCE_URL}/salary-payments/`).then((r) => r.data);

export const createSalaryPayment = (data) =>
  axios.post(`${FINANCE_URL}/salary-payments/`, data).then((r) => r.data);

export const deleteSalaryPayment = (id) =>
  axios.delete(`${FINANCE_URL}/salary-payments/${id}/`);

// Salary Payment PDF Download and Email functions
export const downloadSalaryPaymentPDF = (id) =>
  axios.get(`${FINANCE_URL}/salary-payments/${id}/pdf/`, { 
    responseType: "blob",
    timeout: 60000
  }).then((r) => {
    if (r.status === 200) {
      return r.data;
    }
    throw new Error(`Failed to download PDF: ${r.status} ${r.statusText}`);
  });

export const emailSalaryPayment = (id, to) => {
  const payload = to && to.length > 0 ? { to } : {};
  return axios.post(`${FINANCE_URL}/salary-payments/${id}/email/`, payload)
    .then((r) => r.data)
    .catch((error) => {
      console.error("Email API error:", error);
      throw error;
    });
};
