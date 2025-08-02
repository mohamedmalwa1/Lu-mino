// src/features/enrollments/schema.js
import * as yup from "yup";

export const enrollmentSchema = yup.object().shape({
  student:    yup.number().required("Student is required"),
  classroom:  yup.number().required("Classroom is required"),
  start_date: yup.date().required("Start date is required"),
  end_date:   yup.date().nullable(true),
  status:     yup.string().oneOf(["ACTIVE","GRADUATED","LEFT","SHIFTED"]),
});

