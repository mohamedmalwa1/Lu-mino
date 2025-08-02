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
    createVacation, 
    updateVacation, 
    getVacation,
    listStaff,
} from "../../../api/hr";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  staff: yup.number().required("Staff member is required"),
  start_date: yup.date().required("Start date is required"),
  end_date: yup.date().required("End date is required"),
  approved: yup.boolean(),
  note: yup.string(),
});

export default function VacationForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const qc = useQueryClient();
    const isNew = !id;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { approved: false },
  });

  const { data: vacation, isLoading: isLoadingVacation } = useQuery({
      queryKey: ["vacation", id],
      queryFn: () => getVacation(id),
      enabled: !isNew,
  });
  
  const { data: staff = [], isLoading: isLoadingStaff } = useQuery({
      queryKey: ["staff"],
      queryFn: () => listStaff({ is_active: true }),
  });

  useEffect(() => {
    if (vacation) {
        reset({ 
            ...vacation, 
            start_date: new Date(vacation.start_date),
            end_date: new Date(vacation.end_date),
        });
    }
  }, [vacation, reset]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => {
      const payload = { 
          ...data, 
          start_date: data.start_date.toISOString().split("T")[0],
          end_date: data.end_date.toISOString().split("T")[0],
      };
      return isNew ? createVacation(payload) : updateVacation(id, payload);
    },
    onSuccess: () => { 
        toast.success(`Vacation ${isNew ? 'request created' : 'updated'}!`);
        qc.invalidateQueries({ queryKey: ["vacations"] });
        navigate("/hr/vacations");
    },
    onError: (err) => { 
        console.error("Save failed:", err.response?.data);
        toast.error("Failed to save vacation."); 
    },
  });

  if (!isNew && isLoadingVacation) {
      return <Spinner />;
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-6">
            {isNew ? "New Vacation Request" : "Edit Vacation Request"}
        </h2>
        <form onSubmit={handleSubmit(save)} className="space-y-6 max-w-2xl">
            
            <div>
                <label className="block mb-1 font-medium">Staff Member *</label>
                {isLoadingStaff ? <Spinner /> : (
                    <select {...register("staff")} className="input w-full">
                        <option value="">— Select Staff —</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                )}
                {errors.staff && <p className="text-red-600 text-sm mt-1">{errors.staff.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block mb-1 font-medium">Start Date *</label>
                    <Controller control={control} name="start_date" render={({ field }) => (
                        <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
                    )}/>
                    {errors.start_date && <p className="text-red-600 text-sm mt-1">{errors.start_date.message}</p>}
                </div>
                <div>
                    <label className="block mb-1 font-medium">End Date *</label>
                    <Controller control={control} name="end_date" render={({ field }) => (
                        <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
                    )}/>
                    {errors.end_date && <p className="text-red-600 text-sm mt-1">{errors.end_date.message}</p>}
                </div>
            </div>

            <div>
                <label className="block mb-1 font-medium">Note (Optional)</label>
                <textarea {...register("note")} rows={3} className="input w-full" placeholder="Reason for leave..." />
            </div>

            <div className="flex items-center gap-2">
                <input type="checkbox" {...register("approved")} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label className="font-medium">Mark as Approved</label>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" className="btn-secondary" onClick={() => navigate("/hr/vacations")}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-60">
                {isPending ? "Saving…" : "Save Request"}
                </button>
            </div>
        </form>
    </div>
  );
}

