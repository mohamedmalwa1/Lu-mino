// src/features/students/pages/ClassroomForm.jsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createClassroom, updateClassroom, listTeachers } from "../../../api/students";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  name: yup.string().required("Name is required").max(100),
  capacity: yup.number().min(1).required("Capacity is required"),
  assigned_teacher: yup.number().nullable(true).transform(v => v || null),
});

export default function ClassroomForm({ initialData, onSaved }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: yupResolver(schema) });
  useEffect(() => { reset(initialData || { name: "", capacity: 25 }); }, [initialData, reset]);

  const { data: teachers = [] } = useQuery({ queryKey: ["teachers"], queryFn: listTeachers });

  const { mutate: saveClassroom, isPending } = useMutation({
    mutationFn: (data) => initialData ? updateClassroom(initialData.id, data) : createClassroom(data),
    onSuccess: () => { toast.success("Classroom saved!"); onSaved(); },
    onError: () => toast.error("Failed to save classroom."),
  });

  return (
    <form onSubmit={handleSubmit(saveClassroom)} className="p-6 space-y-4 w-[32rem]">
      <h2 className="text-xl font-semibold">{initialData ? "Edit" : "Add"} Classroom</h2>
      <div><label>Name *</label><input {...register("name")} className="input" />{errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}</div>
      <div><label>Capacity *</label><input type="number" {...register("capacity")} className="input" />{errors.capacity && <p className="text-red-500 text-xs">{errors.capacity.message}</p>}</div>
      <div>
        <label>Assigned Teacher</label>
        <select {...register("assigned_teacher")} className="input">
          <option value="">— None —</option>
          {teachers.map((t) => ( <option key={t.id} value={t.id}>{t.full_name}</option> ))}
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" className="btn-secondary" onClick={onSaved}>Cancel</button><button type="submit" disabled={isPending} className="btn-primary">{isPending ? "Saving…" : "Save"}</button></div>
    </form>
  );
}
