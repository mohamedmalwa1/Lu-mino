import axios from "./axios";

/* CRUD helpers for Evaluations */
export const listEvaluations  = ()  => axios.get("/v1/student/evaluations/").then(r => r.data);
export const getEvaluation    = id => axios.get(`/v1/student/evaluations/${id}/`).then(r => r.data);
export const createEvaluation = payload => axios.post("/v1/student/evaluations/", payload).then(r => r.data);
export const updateEvaluation = (id, payload) => axios.put(`/v1/student/evaluations/${id}/`, payload).then(r => r.data);
export const deleteEvaluation = id => axios.delete(`/v1/student/evaluations/${id}/`);
