import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { 
    createCustodyAssignment, 
    updateCustodyAssignment, 
    getCustodyAssignment,
    listItems,
} from "../../../api/inventory";
import { listStaff } from "../../../api/hr";
import { listStudents } from "../../../api/students";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  item: yup.number().required("Item is required"),
  quantity: yup.number().positive().integer().required(),
  staff: yup.number().nullable(),
  student: yup.number().nullable(),
  assigned_on: yup.date().required(),
  return_date: yup.date().nullable(),
}).test(
  "staff-or-student",
  "Either staff or student must be selected, but not both.",
  (value) => (!!value.staff && !value.student) || (!value.staff && !!value.student)
);

export default function CustodyAssignmentForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const qc = useQueryClient();
    const isNew = !id;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch, // --- ADD watch ---
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // --- WATCH the values of the staff and student fields ---
  const watchStaff = watch("staff");
  const watchStudent = watch("student");

  const { data: assignment, isLoading: isLoadingAssignment } = useQuery({
      queryKey: ["custodyAssignment", id],
      queryFn: () => getCustodyAssignment(id),
      enabled: !isNew,
  });
  
  const { data: items = [] } = useQuery({ queryKey: ["items"], queryFn: listItems });
  const { data: staff = [] } = useQuery({ queryKey: ["staff"], queryFn: () => listStaff({ is_active: true }) });
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: listStudents });

  useEffect(() => {
    if (assignment) {
        reset({ 
            ...assignment, 
            assigned_on: new Date(assignment.assigned_on),
            return_date: assignment.return_date ? new Date(assignment.return_date) : null,
        });
    }
  }, [assignment, reset]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => {
      const payload = { 
          ...data, 
          assigned_on: data.assigned_on.toISOString().split("T")[0],
          return_date: data.return_date ? data.return_date.toISOString().split("T")[0] : null,
      };
      return isNew ? createCustodyAssignment(payload) : updateCustodyAssignment(id, payload);
    },
    onSuccess: () => { 
        toast.success(`Assignment ${isNew ? 'created' : 'updated'}!`);
        qc.invalidateQueries({ queryKey: ["custodyAssignments"] });
        navigate("/inventory/custody");
    },
    onError: (err) => { 
        console.error("Save failed:", err.response?.data);
        toast.error("Failed to save assignment."); 
    },
  });

  if (!isNew && isLoadingAssignment) {
      return <Spinner />;
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-6">
            {isNew ? "New Custody Assignment" : "Edit Custody Assignment"}
        </h2>
        <form onSubmit={handleSubmit(save)} className="space-y-6 max-w-2xl">
            
            <select {...register("item")} className="input w-full">
                <option value="">— Select Item * —</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
            </select>
            {errors.item && <p className="text-red-600 text-sm mt-1">{errors.item.message}</p>}

            <input type="number" {...register("quantity")} className="input w-full" placeholder="Quantity *" />
            {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>}

            <p className="text-sm text-gray-500">Assign to either a staff member or a student:</p>
            
            {/* --- ADD disabled logic --- */}
            <select {...register("staff")} className="input w-full" disabled={!!watchStudent}>
                <option value="">— Select Staff —</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
            
            {/* --- ADD disabled logic --- */}
            <select {...register("student")} className="input w-full" disabled={!!watchStaff}>
                <option value="">— Select Student —</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors[''] && <p className="text-red-600 text-sm mt-1">{errors[''].message}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block mb-1 font-medium">Assigned On *</label>
                    <Controller control={control} name="assigned_on" render={({ field }) => (
                        <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
                    )}/>
                    {errors.assigned_on && <p className="text-red-600 text-sm mt-1">{errors.assigned_on.message}</p>}
                </div>
                <div>
                    <label className="block mb-1 font-medium">Expected Return Date</label>
                    <Controller control={control} name="return_date" render={({ field }) => (
                        <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
                    )}/>
                </div>
            </div>

            <textarea {...register("notes")} rows={3} className="input w-full" placeholder="Notes (Optional)" />

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" className="btn-secondary" onClick={() => navigate("/inventory/custody")}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-60">
                {isPending ? "Saving…" : "Save Assignment"}
                </button>
            </div>
        </form>
    </div>
  );
}

