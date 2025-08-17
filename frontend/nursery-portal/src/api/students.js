import axios from "./axios";

const STUDENT_URL = "/v1/student";
const HR_URL = "/v1/hr";

/* ------------------ Students ------------------ */
export const listStudents = (params) => axios.get(`${STUDENT_URL}/students/`, { params }).then(r => r.data.results ?? r.data);
export const createStudent = (data) => axios.post(`${STUDENT_URL}/students/`, data);
export const updateStudent = (id, data) => axios.put(`${STUDENT_URL}/students/${id}/`, data);
export const deleteStudent = (id) => axios.delete(`${STUDENT_URL}/students/${id}/`);

/* ------------------ Classrooms ------------------ */
export const listClassrooms = () => axios.get(`${STUDENT_URL}/classrooms/`).then(r => r.data.results ?? r.data);
export const createClassroom = (data) => axios.post(`${STUDENT_URL}/classrooms/`, data);
export const updateClassroom = (id, data) => axios.put(`${STUDENT_URL}/classrooms/${id}/`, data);
export const deleteClassroom = (id) => axios.delete(`${STUDENT_URL}/classrooms/${id}/`);

/* ------------------ Enrollments ------------------ */
export const listEnrollments = () => axios.get(`${STUDENT_URL}/enrollments/`).then(r => r.data.results ?? r.data);
export const createEnrollment = (data) => axios.post(`${STUDENT_URL}/enrollments/`, data);
export const updateEnrollment = (id, data) => axios.put(`${STUDENT_URL}/enrollments/${id}/`, data);
export const deleteEnrollment = (id) => axios.delete(`${STUDENT_URL}/enrollments/${id}/`);

/* ------------------ Evaluations ------------------ */
export const listEvaluations = () => axios.get(`${STUDENT_URL}/evaluations/`).then(r => r.data.results ?? r.data);
export const createEvaluation = (data) => axios.post(`${STUDENT_URL}/evaluations/`, data);
export const updateEvaluation = (id, data) => axios.put(`${STUDENT_URL}/evaluations/${id}/`, data);
export const deleteEvaluation = (id) => axios.delete(`${STUDENT_URL}/evaluations/${id}/`);

/* ------------------ Medical Records ------------------ */
export const listMedicalRecords = () => axios.get(`${STUDENT_URL}/medical-records/`).then(r => r.data.results ?? r.data);
export const createMedicalRecord = (data) => axios.post(`${STUDENT_URL}/medical-records/`, data);
export const updateMedicalRecord = (id, data) => axios.put(`${STUDENT_URL}/medical-records/${id}/`, data);
export const deleteMedicalRecord = (id) => axios.delete(`${STUDENT_URL}/medical-records/${id}/`);

/* ------------------ Student Documents (ADDED HERE) ------------------ */
export const listDocuments = () => axios.get(`${STUDENT_URL}/documents/`).then(r => r.data.results ?? r.data);
export const createDocument = (formData) => axios.post(`${STUDENT_URL}/documents/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
export const updateDocument = (id, formData) => axios.patch(`${STUDENT_URL}/documents/${id}/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteDocument = (id) => axios.delete(`${STUDENT_URL}/documents/${id}/`);

/* ------------------ Teacher Helper ------------------ */
export const listTeachers = () => axios.get(`${HR_URL}/staff/`, { params: { role: "TEACHER" } }).then(r => r.data.results ?? r.data);
