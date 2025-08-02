import axios from "./axios";              // baseURL == "/api"

/* ─────────────  Students CRUD ───────────── */
export const listStudents = () =>
  axios.get("/v1/student/students/").then(r => r.data);

export const getStudent = (id) =>
  axios.get(`/v1/student/students/${id}/`).then(r => r.data);

export const createStudent = (data) =>
  axios.post("/v1/student/students/", data).then(r => r.data);

export const updateStudent = (id, data) =>
  axios.put(`/v1/student/students/${id}/`, data).then(r => r.data);

export const deleteStudent = (id) =>
  axios.delete(`/v1/student/students/${id}/`);

/* ─────────────  Dropdown helpers ────────── */
export const listClasses = () =>
  axios.get("/v1/student/classrooms/").then(r => r.data);

export const listTeachers = () =>
  axios.get("/v1/hr/staff/").then(r => r.data);

