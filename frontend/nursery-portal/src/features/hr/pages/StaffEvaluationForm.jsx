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
    createStaffEvaluation, 
    updateStaffEvaluation, 
    getStaffEvaluation,
    listStaff,
} from "../../../api/hr";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  staff: yup.number().required("Staff member is required"),
  eval_date: yup.date().required("Evaluation date is required"),
  summary: yup.string().required("Summary is required"),
});

export default function StaffEvaluationForm() {
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
    defaultValues: { eval_date: new Date() },
  });

  const { data: evaluation, isLoading: isLoadingEvaluation } = useQuery({
      queryKey: ["staffEvaluation", id],
      queryFn: () => getStaffEvaluation(id),
      enabled: !isNew,
  });
  
  const { data: staff = [], isLoading: isLoadingStaff } = useQuery({
      queryKey: ["staff"],
      queryFn: () => listStaff({ is_active: true }),
  });

  useEffect(() => {
    if (evaluation) {
        reset({ ...evaluation, eval_date: new Date(evaluation.eval_date) });
    }
  }, [evaluation, reset]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, eval_date: data.eval_date.toISOString().split("T")[0] };
      return isNew ? createStaffEvaluation(payload) : updateStaffEvaluation(id, payload);
    },
    onSuccess: () => { 
        toast.success(`Evaluation ${isNew ? 'created' : 'updated'}!`);
        qc.invalidateQueries({ queryKey: ["staffEvaluations"] });
        navigate("/hr/evaluations");
    },
    onError: (err) => { 
        console.error("Save failed:", err.response?.data);
        toast.error("Failed to save evaluation."); 
    },
  });

  if (!isNew && isLoadingEvaluation) {
      return <Spinner />;
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-6">
            {isNew ? "New Staff Evaluation" : "Edit Staff Evaluation"}
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

            <div>
                <label className="block mb-1 font-medium">Evaluation Date *</label>
                <Controller control={control} name="eval_date" render={({ field }) => (
                    <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
                )}/>
                {errors.eval_date && <p className="text-red-600 text-sm mt-1">{errors.eval_date.message}</p>}
            </div>

            <div>
                <label className="block mb-1 font-medium">Summary *</label>
                <textarea {...register("summary")} rows={5} className="input w-full" placeholder="Evaluation summary and notes..." />
                {errors.summary && <p className="text-red-600 text-sm mt-1">{errors.summary.message}</p>}
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" className="btn-secondary" onClick={() => navigate("/hr/evaluations")}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-60">
                {isPending ? "Saving…" : "Save Evaluation"}
                </button>
            </div>
        </form>
    </div>
  );
}

