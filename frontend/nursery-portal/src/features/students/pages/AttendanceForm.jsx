import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { createAttendance, updateAttendance, listStudents } from "../../../api/students";

const schema = yup.object({
  student: yup.number().required("Student is required"),
  date: yup.date().required(),
  status: yup.string().required("Status is required"),
  notes: yup.string().nullable(),
});

export default function AttendanceForm({ initialData, onSaved }) {
  const isNew = !initialData;
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });
  
  const { data: students = [], isLoading: loadingStudents } = useQuery({ queryKey: ["students"], queryFn: listStudents });

  useEffect(() => {
    if (initialData) {
      reset({ ...initialData, date: new Date(initialData.date) });
    } else {
      reset({ status: "PRESENT", date: new Date(), notes: "" });
    }
  }, [initialData, reset]);

  const { mutate: saveRecord, isPending } = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, date: data.date.toISOString().split("T")[0] };
      return isNew ? createAttendance(payload) : updateAttendance(initialData.id, payload);
    },
    onSuccess: () => {
      toast.success(`Attendance record ${isNew ? 'created' : 'updated'}`);
      onSaved();
    },
    onError: () => toast.error("Save failed."),
  });

  return (
    <form onSubmit={handleSubmit(saveRecord)} className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">{isNew ? "Add" : "Edit"} Attendance</h2>
      
      <div>
        <label className="font-medium">Student *</label>
        <select {...register("student")} className="input" disabled={loadingStudents}>
          <option value="">— Select Student —</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {errors.student && <p className="text-red-500 text-xs mt-1">{errors.student.message}</p>}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="font-medium">Date *</label>
            <Controller name="date" control={control} render={({field}) => <DatePicker {...field} className="input w-full" dateFormat="yyyy-MM-dd" selected={field.value} onChange={(date) => field.onChange(date)}/>}/>
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
        </div>
        <div>
            <label className="font-medium">Status *</label>
            <select {...register("status")} className="input">
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
                <option value="SICK">Sick</option>
            </select>
            {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
        </div>
      </div>
      
      <div>
        <label className="font-medium">Notes</label>
        <textarea {...register("notes")} rows={4} className="input" />
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" className="btn-secondary" onClick={onSaved}>Cancel</button>
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
