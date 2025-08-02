// schema.js
import * as yup from "yup";

export const classroomSchema = yup.object().shape({
  name: yup
    .string().trim().min(2, "Too short").max(50, "Too long")
    .required("Required"),

  capacity: yup
    .number().min(5).max(50).required("Required"),

  // 🔑  teacher ID comes as a number (or null)
  assigned_teacher: yup
    .number()
    .transform(v => (v === "" ? null : v))  // empty select → null
    .nullable(true),
});

