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
    createStockTake, 
    updateStockTake, 
    getStockTake,
    listItems,
} from "../../../api/inventory";
import { listStaff } from "../../../api/hr";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  item: yup.number().required("Item is required"),
  counted_quantity: yup.number().integer().min(0).required(),
  responsible_staff: yup.number().required("Responsible staff is required"),
  date: yup.date().required(),
});

export default function StockTakeForm() {
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
    defaultValues: { date: new Date() },
  });

  const { data: stockTake, isLoading: isLoadingStockTake } = useQuery({
      queryKey: ["stockTake", id],
      queryFn: () => getStockTake(id),
      enabled: !isNew,
  });
  
  const { data: items = [] } = useQuery({ queryKey: ["items"], queryFn: listItems });
  const { data: staff = [] } = useQuery({ queryKey: ["staff"], queryFn: () => listStaff({ is_active: true }) });

  useEffect(() => {
    if (stockTake) {
        reset({ ...stockTake, date: new Date(stockTake.date) });
    }
  }, [stockTake, reset]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, date: data.date.toISOString().split("T")[0] };
      return isNew ? createStockTake(payload) : updateStockTake(id, payload);
    },
    onSuccess: () => { 
        toast.success(`Stock take ${isNew ? 'recorded' : 'updated'}!`);
        qc.invalidateQueries({ queryKey: ["stockTakes"] });
        qc.invalidateQueries({ queryKey: ["items"] }); // Invalidate items to update stock levels
        navigate("/inventory/stock-takes");
    },
    onError: (err) => { 
        console.error("Save failed:", err.response?.data);
        toast.error("Failed to save stock take."); 
    },
  });

  if (!isNew && isLoadingStockTake) {
      return <Spinner />;
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-6">
            {isNew ? "New Stock Take" : "Edit Stock Take"}
        </h2>
        <form onSubmit={handleSubmit(save)} className="space-y-6 max-w-2xl">
            
            <select {...register("item")} className="input w-full">
                <option value="">— Select Item * —</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
            </select>
            {errors.item && <p className="text-red-600 text-sm mt-1">{errors.item.message}</p>}

            <input type="number" {...register("counted_quantity")} className="input w-full" placeholder="Counted Quantity *" />
            {errors.counted_quantity && <p className="text-red-600 text-sm mt-1">{errors.counted_quantity.message}</p>}

            <select {...register("responsible_staff")} className="input w-full">
                <option value="">— Select Responsible Staff * —</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
            {errors.responsible_staff && <p className="text-red-600 text-sm mt-1">{errors.responsible_staff.message}</p>}

            <div>
                <label className="block mb-1 font-medium">Date of Stock Take *</label>
                <Controller control={control} name="date" render={({ field }) => (
                    <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
                )}/>
                {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>}
            </div>

            <textarea {...register("notes")} rows={3} className="input w-full" placeholder="Notes (Optional)" />

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" className="btn-secondary" onClick={() => navigate("/inventory/stock-takes")}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-60">
                {isPending ? "Saving…" : "Save Record"}
                </button>
            </div>
        </form>
    </div>
  );
}

