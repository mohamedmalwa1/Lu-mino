import axios from "../../api/axios";
export const fetchStudents = () => axios.get("/v1/student/students/").then(r=>r.data);
