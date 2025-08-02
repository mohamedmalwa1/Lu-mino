// src/api/enrollments.js
import axios from "./axios";          // axiosInstance – baseURL === "/api"

/* ------------- CRUD ------------- */
export const listEnrollments = () =>
  axios.get("/v1/student/enrollments/").then(r => r.data);

export const getEnrollment = (id) =>
  axios.get(`/v1/student/enrollments/${id}/`).then(r => r.data);

export const createEnrollment = (data) =>
  axios.post("/v1/student/enrollments/", data).then(r => r.data);

export const updateEnrollment = (id, data) =>
  axios.put(`/v1/student/enrollments/${id}/`, data).then(r => r.data);

export const deleteEnrollment = (id) =>
  axios.delete(`/v1/student/enrollments/${id}/`);

