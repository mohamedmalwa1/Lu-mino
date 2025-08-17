import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { createEnrollment, updateEnrollment, listStudents, listClassrooms } from "../../../api/students";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  student: yup.number().required("Student is required"),
  classroom: yup.number().required("Classroom is required"),
  start_date: yup.date().required("Start date is required"),
  end_date: yup.date().nullable(),
  status: yup.string().required(),
});

export default function EnrollmentForm({ initialData, onSaved }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({ queryKey: ["students"], queryFn: listStudents });
  const { data: classrooms = [], isLoading: loadingClassrooms } = useQuery({ queryKey: ["classrooms"], queryFn: listClassrooms });
  
  useEffect(() => {
    reset({
        status: "ACTIVE",
        ...initialData,
        start_date: initialData?.start_date ? new Date(initialData.start_date) : new Date(),
        end_date: initialData?.end_date ? new Date(initialData.end_date) : null,
    });
  }, [initialData, reset]);

  const { mutate: saveEnrollment, isPending } = useMutation({
    mutationFn: (data) => {
        const payload = {...data, 
            start_date: data.start_date.toISOString().split("T")[0], 
            end_date: data.end_date ? data.end_date.toISOString().split("T")[0] : null 
        };
        const promise = initialData ? updateEnrollment(initialData.id, payload) : createEnrollment(payload);
        return toast.promise(promise, {
            loading: 'Saving enrollment...',
            success: 'Enrollment saved!',
            error: 'Failed to save enrollment.',
        });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["enrollments"] });
        onSaved();
    },
  });

  return (
    <form onSubmit={handleSubmit(saveEnrollment)} className="p-6 space-y-4 w-[36rem]">
      <h2 className="text-xl font-semibold">{initialData ? "Edit" : "Add"} Enrollment</h2>
      
      <div>
        <label className="font-medium">Student *</label>
        {loadingStudents ? <Spinner/> : (
            <select {...register("student")} className="input">
                <option value="">— Select Student —</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
        )}
        {errors.student && <p className="text-red-500 text-xs mt-1">{errors.student.message}</p>}
      </div>
      
      <div>
        <label className="font-medium">Classroom *</label>
        {loadingClassrooms ? <Spinner/> : (
            <select {...register("classroom")} className="input">
                <option value="">— Select Classroom —</option>
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        )}
        {errors.classroom && <p className="text-red-500 text-xs mt-1">{errors.classroom.message}</p>}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="font-medium">Start Date *</label>
            <Controller name="start_date" control={control} render={({field}) => <DatePicker {...field} className="input w-full" dateFormat="yyyy-MM-dd" selected={field.value} onChange={(date) => field.onChange(date)}/>}/>
            {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>}
        </div>
        <div>
            <label className="font-medium">End Date</label>
            <Controller name="end_date" control={control} render={({field}) => <DatePicker {...field} className="input w-full" dateFormat="yyyy-MM-dd" selected={field.value} onChange={(date) => field.onChange(date)} isClearable />}/>
        </div>
      </div>
      
      <div>
        <label className="font-medium">Status *</label>
        <select {...register("status")} className="input">
            <option value="ACTIVE">Active</option>
            <option value="GRADUATED">Graduated</option>
            <option value="LEFT">Left</option>
            <option value="SHIFTED">Shifted</option>
        </select>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" className="btn-secondary" onClick={onSaved}>Cancel</button>
        <button type="submit" disabled={isPending} className="btn-primary">{isPending ? "Saving…" : "Save Changes"}</button>
      </div>
    </form>
  );
}
