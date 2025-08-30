// src/features/students/pages/StudentForm.jsx
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { createStudent, updateStudent, listClassrooms } from "../../../api/students";
import Spinner from "../../../components/ui/Spinner";

// Schema includes all fields from the model
const schema = yup.object({
  first_name: yup.string().required(),
  last_name: yup.string().required(),
  gender: yup.string().oneOf(["M", "F"]).required(),
  date_of_birth: yup.date().max(new Date()).required(),
  classroom: yup.number().required(),
  guardian_name: yup.string().required(),
  guardian_phone: yup.string().required(),
  guardian_email: yup.string().email("Invalid email format").nullable().transform(v => v || null), // ADD THIS LINE
  parent_id_number: yup.string().required(),
  parent_id_expiry: yup.date().required(),
  student_id_number: yup.string().nullable().transform(v => v || null),
  student_id_expiry: yup.date().nullable().transform(v => v || null),
  enrollment_history: yup.string().nullable(),
  enrollment_date: yup.date().nullable(),
  end_date: yup.date().nullable(),
  enrollment_status: yup.string().required(),
  is_active: yup.boolean(),
});

export default function StudentForm({ initialData, onSaved }) {
    const isNew = !initialData;
    const { register, handleSubmit, control, reset, setError, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
    });
    
    const { data: classrooms = [], isLoading: isLoadingClasses } = useQuery({
        queryKey: ["classrooms"],
        queryFn: listClassrooms,
    });
    
    useEffect(() => {
        if (initialData) {
            reset({
                ...initialData,
                date_of_birth: new Date(initialData.date_of_birth),
                enrollment_date: initialData.enrollment_date ? new Date(initialData.enrollment_date) : null,
                end_date: initialData.end_date ? new Date(initialData.end_date) : null,
                parent_id_expiry: new Date(initialData.parent_id_expiry),
                student_id_expiry: initialData.student_id_expiry ? new Date(initialData.student_id_expiry) : null,
            });
        } else {
            reset({ is_active: true, gender: "", classroom: "", enrollment_status: 'active' });
        }
    }, [initialData, reset]);

    const { mutate: saveStudent, isPending } = useMutation({
        mutationFn: (data) => {
            const payload = { ...data };
            for (const key in payload) {
                if (payload[key] instanceof Date) {
                    payload[key] = payload[key].toISOString().split("T")[0];
                }
            }
            return isNew ? createStudent(payload) : updateStudent(initialData.id, payload);
        },
        onSuccess: () => {
            toast.success(`Student ${isNew ? 'created' : 'updated'}`);
            onSaved();
        },
        onError: (err) => {
            const serverErrors = err.response?.data;
            if (serverErrors) {
                Object.entries(serverErrors).forEach(([field, messages]) => {
                    setError(field, { type: 'server', message: messages[0] });
                    toast.error(`${field}: ${messages[0]}`);
                });
            } else {
                toast.error("Save failed. Please check the form for errors.");
            }
        },
    });

  return (
    <form onSubmit={handleSubmit(saveStudent)} className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">{isNew ? "Add New Student" : "Edit Student"}</h2>
      
      <fieldset className="grid grid-cols-2 gap-4 border p-4 rounded-md">
        <legend className="px-2 font-medium">Personal Information</legend>
        <div><input {...register("first_name")} className="input" placeholder="First Name *"/>{errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}</div>
        <div><input {...register("last_name")} className="input" placeholder="Last Name *"/>{errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}</div>
        <div><select {...register("gender")} className="input"><option value="">Gender *</option><option value="M">Male</option><option value="F">Female</option></select>{errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}</div>
        <div>
          <Controller
            name="date_of_birth"
            control={control}
            render={({ field }) => (
              <DatePicker
                {...field}
                className="input w-full"
                placeholderText="Date of Birth *"
                dateFormat="yyyy-MM-dd"
                selected={field.value}
                onChange={(date) => field.onChange(date)}
              />
            )}
          />
          {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth.message}</p>}
        </div>
      </fieldset>
      
      <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border p-4 rounded-md">
          <legend className="px-2 font-medium">Guardian Information</legend>
          <div><input {...register("guardian_name")} className="input" placeholder="Guardian Name *" />{errors.guardian_name && <p className="text-red-500 text-xs mt-1">{errors.guardian_name.message}</p>}</div>
          <div><input {...register("guardian_phone")} className="input" placeholder="Guardian Phone *" />{errors.guardian_phone && <p className="text-red-500 text-xs mt-1">{errors.guardian_phone.message}</p>}</div>
          <div><input {...register("guardian_email")} className="input" placeholder="Guardian Email" />{errors.guardian_email && <p className="text-red-500 text-xs mt-1">{errors.guardian_email.message}</p>}</div>
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-4 border p-4 rounded-md">
          <legend className="px-2 font-medium">ID Information</legend>
          <div><input {...register("parent_id_number")} className="input" placeholder="Parent ID Number *" />{errors.parent_id_number && <p className="text-red-500 text-xs mt-1">{errors.parent_id_number.message}</p>}</div>
          <div>
            <Controller name="parent_id_expiry" control={control} render={({field}) => (
                <DatePicker {...field} className="input w-full" placeholderText="Parent ID Expiry *" dateFormat="yyyy-MM-dd" selected={field.value} onChange={(date) => field.onChange(date)} />
            )} />
            {errors.parent_id_expiry && <p className="text-red-500 text-xs mt-1">{errors.parent_id_expiry.message}</p>}
          </div>
          <div><input {...register("student_id_number")} className="input" placeholder="Student ID Number" /></div>
          <div>
            <Controller name="student_id_expiry" control={control} render={({field}) => (
                <DatePicker {...field} className="input w-full" placeholderText="Student ID Expiry" dateFormat="yyyy-MM-dd" selected={field.value} onChange={(date) => field.onChange(date)} />
            )} />
          </div>
      </fieldset>

       <fieldset className="border p-4 rounded-md">
          <legend className="px-2 font-medium">Enrollment Details</legend>
          <div className="grid grid-cols-2 gap-4">
            <div><label>Classroom *</label><select {...register("classroom")} className="input"><option value="">— Select —</option>{isLoadingClasses ? <option>Loading...</option> : classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{errors.classroom && <p className="text-red-500 text-xs mt-1">{errors.classroom.message}</p>}</div>
            <div><label>Enrollment Status</label><select {...register("enrollment_status")} className="input"><option value="active">Active</option><option value="graduated">Graduated</option><option value="left">Left</option><option value="shifted">Shifted</option><option value="nonactive">Non-Active</option></select></div>
            <div>
                <label>Enrollment Date</label>
                <Controller name="enrollment_date" control={control} render={({field}) => <DatePicker {...field} className="input w-full" dateFormat="yyyy-MM-dd" selected={field.value} onChange={(date) => field.onChange(date)} />} />
            </div>
            <div>
                <label>End Date</label>
                <Controller name="end_date" control={control} render={({field}) => <DatePicker {...field} className="input w-full" dateFormat="yyyy-MM-dd" selected={field.value} onChange={(date) => field.onChange(date)} />} />
            </div>
          </div>
          <div className="mt-4"><label>Enrollment History / Notes</label><textarea {...register("enrollment_history")} rows={3} className="input"/></div>
      </fieldset>
      
      <div className="flex items-center gap-2 pt-2">
        <input type="checkbox" {...register("is_active")} className="h-4 w-4 rounded border-gray-300" id="is_active_checkbox" />
        <label htmlFor="is_active_checkbox">Student is Active</label>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" className="btn-secondary" onClick={onSaved}>Cancel</button>
        <button type="submit" disabled={isPending} className="btn-primary">{isPending ? "Saving…" : "Save Changes"}</button>
      </div>
    </form>
  );
}
