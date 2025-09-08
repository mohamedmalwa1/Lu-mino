import axios from "./axios";

// Base URL for HR endpoints
const HR_URL = "/v1/hr";

/* ------------- Staff ------------- */
export const listStaff = (params) =>
  axios.get(`${HR_URL}/staff/`, { params }).then((r) => r.data);

export const getStaff = (id) =>
    axios.get(`${HR_URL}/staff/${id}/`).then((r) => r.data);

export const createStaff = (data) =>
  axios.post(`${HR_URL}/staff/`, data).then((r) => r.data);

export const updateStaff = (id, data) =>
  axios.put(`${HR_URL}/staff/${id}/`, data).then((r) => r.data);

export const deleteStaff = (id) =>
  axios.delete(`${HR_URL}/staff/${id}/`);

/* ------------- Salary Records ------------- */
export const listSalaryRecords = (params) =>
  axios.get(`${HR_URL}/salary-records/`, { params }).then((r) => r.data);

export const getSalaryRecord = (id) =>
  axios.get(`${HR_URL}/salary-records/${id}/`).then((r) => r.data);

export const updateSalaryRecord = (id, data) =>
  axios.patch(`${HR_URL}/salary-records/${id}/`, data).then((r) => r.data);

export const deleteSalaryRecord = (id) =>
  axios.delete(`${HR_URL}/salary-records/${id}/`);
/* ------------- Staff Attendance ------------- */
export const listStaffAttendance = () =>
  axios.get(`${HR_URL}/staff-attendances/`).then((r) => r.data);

export const getStaffAttendance = (id) =>
    axios.get(`${HR_URL}/staff-attendances/${id}/`).then((r) => r.data);

export const createStaffAttendance = (data) =>
  axios.post(`${HR_URL}/staff-attendances/`, data).then((r) => r.data);

export const updateStaffAttendance = (id, data) =>
  axios.put(`${HR_URL}/staff-attendances/${id}/`, data).then((r) => r.data);

export const deleteStaffAttendance = (id) =>
  axios.delete(`${HR_URL}/staff-attendances/${id}/`);

/* ------------- Staff Documents ------------- */
export const listStaffDocuments = () =>
  axios.get(`${HR_URL}/documents/`).then((r) => r.data);

export const getStaffDocument = (id) =>
    axios.get(`${HR_URL}/documents/${id}/`).then((r) => r.data);

// Note: Creating/updating documents requires multipart/form-data
export const createStaffDocument = (formData) =>
  axios.post(`${HR_URL}/documents/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);

export const updateStaffDocument = (id, formData) =>
  axios.patch(`${HR_URL}/documents/${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);

export const deleteStaffDocument = (id) =>
  axios.delete(`${HR_URL}/documents/${id}/`);

/* ------------- Vacations ------------- */
export const listVacations = () =>
  axios.get(`${HR_URL}/vacations/`).then((r) => r.data);

export const getVacation = (id) =>
    axios.get(`${HR_URL}/vacations/${id}/`).then((r) => r.data);

export const createVacation = (data) =>
  axios.post(`${HR_URL}/vacations/`, data).then((r) => r.data);

export const updateVacation = (id, data) =>
  axios.put(`${HR_URL}/vacations/${id}/`, data).then((r) => r.data);

export const deleteVacation = (id) =>
  axios.delete(`${HR_URL}/vacations/${id}/`);

/* ------------- Staff Evaluations ------------- */
export const listStaffEvaluations = () =>
  axios.get(`${HR_URL}/evaluations/`).then((r) => r.data);

export const getStaffEvaluation = (id) =>
    axios.get(`${HR_URL}/evaluations/${id}/`).then((r) => r.data);

export const createStaffEvaluation = (data) =>
  axios.post(`${HR_URL}/evaluations/`, data).then((r) => r.data);

export const updateStaffEvaluation = (id, data) =>
  axios.put(`${HR_URL}/evaluations/${id}/`, data).then((r) => r.data);

export const deleteStaffEvaluation = (id) =>
  axios.delete(`${HR_URL}/evaluations/${id}/`);

/* ------------- Payroll Contracts ------------- */
export const listPayrollContracts = () =>
  axios.get(`${HR_URL}/contracts/`).then((r) => r.data);

export const getPayrollContract = (id) =>
    axios.get(`${HR_URL}/contracts/${id}/`).then((r) => r.data);

export const createPayrollContract = (data) =>
  axios.post(`${HR_URL}/contracts/`, data).then((r) => r.data);

export const updatePayrollContract = (id, data) =>
  axios.put(`${HR_URL}/contracts/${id}/`, data).then((r) => r.data);

export const deletePayrollContract = (id) =>
  axios.delete(`${HR_URL}/contracts/${id}/`);
