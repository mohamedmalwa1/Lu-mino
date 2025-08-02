// src/api/classrooms.js
import axios from "./axios";            // axiosInstance: { baseURL: "/api" }

/* ---------------- CRUD ---------------- */
export const listClassrooms   = () => axios
  .get("/v1/student/classrooms/").then(r => r.data.results ?? r.data);

export const getClassroom     = id  => axios
  .get(`/v1/student/classrooms/${id}/`).then(r => r.data);

export const createClassroom  = data => axios
  .post("/v1/student/classrooms/",   data).then(r => r.data);

export const updateClassroom  = (id, data) => axios
  .put(`/v1/student/classrooms/${id}/`, data).then(r => r.data);

export const deleteClassroom  = id  => axios
  .delete(`/v1/student/classrooms/${id}/`);

/* ---------- Teachers (dropdown) ---------- */
export const listTeachers = () => axios
  .get("/v1/hr/staff/", { params: { role: "TEACHER" } })
  .then(r => r.data.results ?? r.data);

