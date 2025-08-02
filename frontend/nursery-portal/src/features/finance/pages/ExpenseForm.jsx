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
  createExpense,
  updateExpense,
  getExpense,
  listTreasuries,
} from "../../../api/finance";
import { listVendors } from "../../../api/inventory"; // Import new API function
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  date: yup.date().required("Date is required"),
  amount: yup.number().positive("Amount must be positive").required("Amount is required"),
  category: yup.string().required("Category is required"),
  description: yup.string().required("Description is required"),
  treasury: yup.number().required("Treasury account is required"),
  vendor: yup.number().nullable(), // New field
  reference: yup.string().max(30), // New field
});

const blank = {
  date: new Date(),
  amount: "",
  category: "UTILITIES",
  description: "",
  treasury: "",
  vendor: "",
  reference: "",
};

export default function ExpenseForm() {
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
    defaultValues: blank,
  });

  const { data: expense, isLoading: isLoadingExpense } = useQuery({
      queryKey: ["expense", id],
      queryFn: () => getExpense(id),
      enabled: !isNew,
  });

  useEffect(() => {
    if (expense) {
        reset({ ...expense, date: new Date(expense.date) });
    } else {
        reset(blank);
    }
  }, [expense, reset]);

  const { data: treasuries, isLoading: isLoadingTreasuries } = useQuery({
    queryKey: ["treasuries"],
    queryFn: listTreasuries,
  });

  // Fetch vendors for the dropdown
  const { data: vendors, isLoading: isLoadingVendors } = useQuery({
      queryKey: ["vendors"],
      queryFn: listVendors,
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, date: data.date.toISOString().split("T")[0] };
      return isNew ? createExpense(payload) : updateExpense(id, payload);
    },
    onSuccess: () => { 
        toast.success(`Expense ${isNew ? 'created' : 'updated'} successfully!`);
        qc.invalidateQueries({ queryKey: ["expenses"] });
        navigate("/finance/expenses");
    },
    onError: (err) => { 
        console.error("Save failed:", err.response?.data);
        toast.error("Failed to save expense. Check console for details."); 
    },
  });

  if (!isNew && isLoadingExpense) {
      return <Spinner />;
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-6">
            {isNew ? "Add New Expense" : "Edit Expense"}
        </h2>
        <form onSubmit={handleSubmit(save)} className="space-y-6 max-w-2xl">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vendor Dropdown */}
                <div>
                    <label className="block mb-1 font-medium">Vendor (Optional)</label>
                    {isLoadingVendors ? <Spinner /> : (
                    <select {...register("vendor")} className="input w-full">
                        <option value="">— Select Vendor —</option>
                        {vendors?.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                    </select>
                    )}
                    {errors.vendor && <p className="text-red-600 text-sm mt-1">{errors.vendor.message}</p>}
                </div>

                {/* Reference Input */}
                <div>
                    <label className="block mb-1 font-medium">Reference (Optional)</label>
                    <input {...register("reference")} className="input w-full" placeholder="e.g., PO-123" />
                    {errors.reference && <p className="text-red-600 text-sm mt-1">{errors.reference.message}</p>}
                </div>
            </div>

            {/* Treasury Dropdown */}
            <div>
                <label className="block mb-1 font-medium">Paid From *</label>
                {isLoadingTreasuries ? <Spinner /> : (
                <select {...register("treasury")} className="input w-full">
                    <option value="">— Select Treasury Account —</option>
                    {treasuries?.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} (Balance: {t.balance})</option>
                    ))}
                </select>
                )}
                {errors.treasury && <p className="text-red-600 text-sm mt-1">{errors.treasury.message}</p>}
            </div>

            <div>
                <label className="block mb-1 font-medium">Date *</label>
                <Controller control={control} name="date" render={({ field }) => (
                <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
                )}/>
                {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>}
            </div>

            <div>
                <label className="block mb-1 font-medium">Amount *</label>
                <input type="number" step="0.01" {...register("amount")} className="input w-full" placeholder="e.g., 150.75" />
                {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>}
            </div>

            <div>
                <label className="block mb-1 font-medium">Category *</label>
                <select {...register("category")} className="input w-full">
                <option value="UTILITIES">Utilities</option>
                <option value="SALARIES">Salaries</option>
                <option value="RENT">Rent</option>
                <option value="SUPPLIES">Supplies</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="MARKETING">Marketing</option>
                <option value="OTHER">Other</option>
                </select>
                {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>}
            </div>

            <div>
                <label className="block mb-1 font-medium">Description *</label>
                <textarea {...register("description")} rows={3} className="input w-full" placeholder="e.g., Monthly electricity bill"/>
                {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" className="btn-secondary" onClick={() => navigate("/finance/expenses")}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-60">
                {isPending ? "Saving…" : "Save Expense"}
                </button>
            </div>
        </form>
    </div>
  );
}

