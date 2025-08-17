import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { createEvaluation, updateEvaluation, listStudents } from "../../../api/students";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  student: yup.number().required("Student is required"),
  date: yup.date().required("Date is required"),
  status: yup.string().required("Status is required"),
  general_notes: yup.string().nullable(),
  improvement_plan: yup.string().nullable(),
  follow_up_date: yup.date().nullable(),
});

export default function EvaluationForm({ initialData, onSaved }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({ 
    queryKey: ["students"], 
    queryFn: listStudents 
  });
  
  useEffect(() => {
    reset({
        status: "ON_TRACK",
        ...initialData,
        date: initialData?.date ? new Date(initialData.date) : new Date(),
        follow_up_date: initialData?.follow_up_date ? new Date(initialData.follow_up_date) : null,
    });
  }, [initialData, reset]);

  const { mutate: saveEvaluation, isPending } = useMutation({
    mutationFn: (data) => {
        const payload = {...data, 
          date: data.date.toISOString().split("T")[0],
          follow_up_date: data.follow_up_date ? data.follow_up_date.toISOString().split("T")[0] : null
        };
        const promise = initialData ? updateEvaluation(initialData.id, payload) : createEvaluation(payload);
        return toast.promise(promise, {
            loading: 'Saving evaluation...',
            success: 'Evaluation saved!',
            error: 'Failed to save evaluation.',
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      onSaved();
    },
  });

  return (
    <form onSubmit={handleSubmit(saveEvaluation)} className="p-6 space-y-4 w-[36rem]">
      <h2 className="text-xl font-semibold">{initialData ? "Edit" : "Add"} Evaluation</h2>
      
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
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-medium">Evaluation Date *</label>
          <Controller name="date" control={control} render={({field}) => 
            <DatePicker {...field} className="input w-full" dateFormat="yyyy-MM-dd" selected={field.value} onChange={(date) => field.onChange(date)} />
          }/>
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
        </div>
        <div>
          <label className="font-medium">Status *</label>
          <select {...register("status")} className="input">
            <option value="EXCELLENT">Excellent</option>
            <option value="GOOD">Good</option>
            <option value="ON_TRACK">On Track</option>
            <option value="NEEDS_WORK">Needs Work</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="font-medium">General Notes</label>
        <textarea {...register("general_notes")} rows={4} className="input" placeholder="Observations, progress, etc."/>
      </div>
      
      <div>
        <label className="font-medium">Improvement Plan</label>
        <textarea {...register("improvement_plan")} rows={4} className="input" placeholder="(Only if status is 'Needs Work')"/>
      </div>
      
      <div>
        <label className="font-medium">Follow-up Date</label>
        <Controller name="follow_up_date" control={control} render={({field}) => 
            <DatePicker {...field} className="input w-full" placeholderText="Optional" dateFormat="yyyy-MM-dd" selected={field.value} onChange={(date) => field.onChange(date)} />
        }/>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" className="btn-secondary" onClick={onSaved}>Cancel</button>
        <button type="submit" disabled={isPending} className="btn-primary">{isPending ? "Saving…" : "Save"}</button>
      </div>
    </form>
  );
}
