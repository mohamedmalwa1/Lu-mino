// mohamedmalwa1/lu-mino/Lu-mino-eef071840a5399afd97f3e5772965c80cf5a7740/frontend/nursery-portal/src/api/inventory.js
import axios from "./axios";

// Base URL for Inventory endpoints - CORRECTED
const INVENTORY_URL = "/inventory";

/* ------------- Vendors ------------- */
export const listVendors = () =>
  axios.get(`${INVENTORY_URL}/vendors/`).then((r) => r.data);

export const getVendor = (id) =>
    axios.get(`${INVENTORY_URL}/vendors/${id}/`).then((r) => r.data);

export const createVendor = (data) =>
  axios.post(`${INVENTORY_URL}/vendors/`, data).then((r) => r.data);

export const updateVendor = (id, data) =>
  axios.put(`${INVENTORY_URL}/vendors/${id}/`, data).then((r) => r.data);

export const deleteVendor = (id) =>
  axios.delete(`${INVENTORY_URL}/vendors/${id}/`);

/* ------------- Items ------------- */
export const listItems = () =>
  axios.get(`${INVENTORY_URL}/items/`).then((r) => r.data);

export const getItem = (id) =>
    axios.get(`${INVENTORY_URL}/items/${id}/`).then((r) => r.data);

export const createItem = (data) =>
  axios.post(`${INVENTORY_URL}/items/`, data).then((r) => r.data);

export const updateItem = (id, data) =>
  axios.put(`${INVENTORY_URL}/items/${id}/`, data).then((r) => r.data);

export const deleteItem = (id) =>
  axios.delete(`${INVENTORY_URL}/items/${id}/`);

/* ------------- Custody Assignments ------------- */
export const listCustodyAssignments = () =>
  axios.get(`${INVENTORY_URL}/custody-assignments/`).then((r) => r.data);

export const getCustodyAssignment = (id) =>
    axios.get(`${INVENTORY_URL}/custody-assignments/${id}/`).then((r) => r.data);

export const createCustodyAssignment = (data) =>
  axios.post(`${INVENTORY_URL}/custody-assignments/`, data).then((r) => r.data);

export const updateCustodyAssignment = (id, data) =>
  axios.put(`${INVENTORY_URL}/custody-assignments/${id}/`, data).then((r) => r.data);

export const deleteCustodyAssignment = (id) =>
  axios.delete(`${INVENTORY_URL}/custody-assignments/${id}/`);

/* ------------- Stock Takes ------------- */
export const listStockTakes = () =>
  axios.get(`${INVENTORY_URL}/stocktakes/`).then((r) => r.data);

export const getStockTake = (id) =>
    axios.get(`${INVENTORY_URL}/stocktakes/${id}/`).then((r) => r.data);

export const createStockTake = (data) =>
  axios.post(`${INVENTORY_URL}/stocktakes/`, data).then((r) => r.data);

export const updateStockTake = (id, data) =>
  axios.put(`${INVENTORY_URL}/stocktakes/${id}/`, data).then((r) => r.data);

export const deleteStockTake = (id) =>
  axios.delete(`${INVENTORY_URL}/stocktakes/${id}/`);
