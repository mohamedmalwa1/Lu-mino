import { useEffect }                 from "react";
import { useForm }                   from "react-hook-form";
import { yupResolver }               from "@hookform/resolvers/yup";
import { useMutation, useQuery }     from "@tanstack/react-query";
import { toast }                     from "react-hot-toast";

import {
  createEnrollment,
  updateEnrollment,
  getEnrollment,
} from "../../../api/enrollments";
import { listStudents }   from "../../../api/students";
import { listClassrooms } from "../../../api/classrooms";
import { enrollmentSchema } from "../schema";

export default function EnrollmentForm({ initial, onSaved }) {
  /* form ------------------------- */
  const { register, handleSubmit, reset, formState:{errors} } = useForm({
    resolver : yupResolver(enrollmentSchema),
    defaultValues: { status:"ACTIVE", start_date:"" },
  });

  useEffect(()=>{ reset(initial || {}); },[initial, reset]);

  /* options ---------------------- */
  const { data: students=[] }   = useQuery({ queryKey:["students"],   queryFn:listStudents });
  const { data: classrooms=[] } = useQuery({ queryKey:["classrooms"], queryFn:listClassrooms });

  /* save ------------------------- */
  const { mutate, isLoading } = useMutation({
    mutationFn : (data) =>
      initial
        ? updateEnrollment(initial.id, data)
        : createEnrollment(data),
    onSuccess : () => { toast.success("Saved"); onSaved(); },
    onError   : ()  => toast.error("Save failed"),
  });

  return (
    <form onSubmit={handleSubmit(mutate)} className="space-y-6 p-6">
      <h3 className="text-xl font-semibold">{initial ? "Edit" : "Add"} Enrollment</h3>

      {/* Student */}
      <div className="space-y-1">
        <label className="block font-medium">Student *</label>
        <select {...register("student")} className="w-full border rounded p-2">
          <option value="">— Select —</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {errors.student && <p className="text-red-600 text-sm">{errors.student.message}</p>}
      </div>

      {/* Classroom */}
      <div className="space-y-1">
        <label className="block font-medium">Classroom *</label>
        <select {...register("classroom")} className="w-full border rounded p-2">
          <option value="">— Select —</option>
          {classrooms.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.classroom && <p className="text-red-600 text-sm">{errors.classroom.message}</p>}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block font-medium">Start date *</label>
          <input type="date" {...register("start_date")} className="w-full border rounded p-2"/>
          {errors.start_date && <p className="text-red-600 text-sm">{errors.start_date.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="block font-medium">End date</label>
          <input type="date" {...register("end_date")} className="w-full border rounded p-2"/>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-1">
        <label className="block font-medium">Status</label>
        <select {...register("status")} className="w-full border rounded p-2">
          <option value="ACTIVE">Active</option>
          <option value="GRADUATED">Graduated</option>
          <option value="LEFT">Left</option>
          <option value="SHIFTED">Shifted</option>
        </select>
      </div>

      {/* buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <button type="submit"
          disabled={isLoading}
          className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
          {isLoading ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

