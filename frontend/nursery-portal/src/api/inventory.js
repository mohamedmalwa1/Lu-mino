import axios from "./axios";

// Base URL for inventory endpoints
const INVENTORY_URL = "/v1/inventory";

/* ------------- Vendors ------------- */
export const listVendors = () =>
  axios.get(`${INVENTORY_URL}/vendors/`).then((r) => r.data);

/* ------------- Items ------------- */
export const listItems = () =>
  axios.get(`${INVENTORY_URL}/items/`).then((r) => r.data);

