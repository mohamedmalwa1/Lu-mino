import axios from "./axios";

/* CRUD helpers for Medical Records */
export const listMedicalRecords   = ()  => axios.get("/v1/student/medical-records/").then(r => r.data);
export const getMedicalRecord     = id => axios.get(`/v1/student/medical-records/${id}/`).then(r => r.data);
export const createMedicalRecord  = payload => axios.post("/v1/student/medical-records/", payload).then(r => r.data);
export const updateMedicalRecord  = (id, payload) => axios.put(`/v1/student/medical-records/${id}/`, payload).then(r => r.data);
export const deleteMedicalRecord  = id => axios.delete(`/v1/student/medical-records/${id}/`);
