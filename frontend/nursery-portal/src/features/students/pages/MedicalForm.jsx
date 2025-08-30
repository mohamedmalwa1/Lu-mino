import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// THE FIX IS HERE: Imports are now from the correct files
import { createMedicalRecord, updateMedicalRecord } from "../../../api/medical";
import { listStudents } from "../../../api/students";

import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  student: yup.number().required("Student is required"),
  record_type: yup.string().required(),
  date: yup.date().required(),
  description: yup.string().required(),
  is_urgent: yup.boolean(),
  next_checkup_date: yup.date().nullable(),
  doctor_name: yup.string().nullable(),
  program_name: yup.string().nullable(),
  conducted_by: yup.string().nullable(),
});

export default function MedicalForm({ initialData, onSaved }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({ 
    resolver: yupResolver(schema),
    defaultValues: { is_urgent: false, record_type: 'CHECKUP' }
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({ queryKey: ["students"], queryFn: listStudents });
  
  useEffect(() => {
    reset({
        ...initialData,
        date: initialData?.date ? new Date(initialData.date) : new Date(),
        next_checkup_date: initialData?.next_checkup_date ? new Date(initialData.next_checkup_date) : null,
    });
  }, [initialData, reset]);

  const { mutate: saveRecord, isPending } = useMutation({
    mutationFn: (data) => {
        const payload = {...data, 
            date: data.date.toISOString().split("T")[0],
            next_checkup_date: data.next_checkup_date ? data.next_checkup_date.toISOString().split("T")[0] : null
        };
        const promise = initialData ? updateMedicalRecord(initialData.id, payload) : createMedicalRecord(payload);
        return toast.promise(promise, {
            loading: 'Saving record...',
            success: 'Medical record saved!',
            error: 'Failed to save record.',
        });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["medicalRecords"] });
        onSaved();
    },
  });

  return (
    <form onSubmit={handleSubmit(saveRecord)} className="p-6 space-y-4 w-[36rem]">
      <h2 className="text-xl font-semibold">{initialData ? "Edit" : "Add"} Medical Record</h2>
      <div><label className="font-medium">Student *</label><select {...register("student")} className="input"><option value="">— Select Student —</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>{errors.student && <p className="text-red-500 text-xs mt-1">{errors.student.message}</p>}</div>
      
      <div className="grid grid-cols-2 gap-4">
        <div><label className="font-medium">Record Date *</label><Controller name="date" control={control} render={({field}) => <DatePicker {...field} className="input w-full" dateFormat="yyyy-MM-dd" selected={field.value} onChange={(date) => field.onChange(date)}/>}/></div>
        <div><label className="font-medium">Record Type *</label><select {...register("record_type")} className="input"><option value="ALLERGY">Allergy</option><option value="MEDICATION">Medication</option><option value="TREATMENT">Treatment</option><option value="VACCINATION">Vaccination</option><option value="CHECKUP">Checkup</option><option value="DOCTOR_NOTE">Doctor's Note</option><option value="EDUCATION">Health Education</option></select></div>
      </div>
      
      <div><label className="font-medium">Description *</label><textarea {...register("description")} rows={4} className="input" />{errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}</div>
      
      <fieldset className="grid grid-cols-2 gap-4 border p-4 rounded-md">
        <legend className="px-2 font-medium">Additional Details</legend>
        <div><label>Doctor/Clinic Name</label><input {...register("doctor_name")} className="input"/></div>
        <div><label>Conducted By</label><input {...register("conducted_by")} className="input"/></div>
        <div><label>Health Program Name</label><input {...register("program_name")} className="input"/></div>
        <div><label>Next Checkup Due</label><Controller name="next_checkup_date" control={control} render={({field}) => <DatePicker {...field} className="input w-full" dateFormat="yyyy-MM-dd" selected={field.value} onChange={(date) => field.onChange(date)} isClearable placeholderText="Optional"/>}/></div>
      </fieldset>

      <div className="flex items-center gap-2 pt-2"><input id="is_urgent" type="checkbox" {...register("is_urgent")} className="h-4 w-4 rounded border-gray-300" /><label htmlFor="is_urgent">Is Urgent?</label></div>
      <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" className="btn-secondary" onClick={onSaved}>Cancel</button><button type="submit" disabled={isPending} className="btn-primary">{isPending ? "Saving…" : "Save"}</button></div>
    </form>
  );
}
