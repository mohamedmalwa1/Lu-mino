import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { createExpense, updateExpense, getExpense, listPurchaseOrders, listTreasuries } from "../../../api/finance";
import { listVendors } from "../../../api/inventory";

const schema = yup.object({
  purchase_order: yup.number().nullable().transform(v => v || null),
  vendor: yup.number().nullable().transform(v => v || null),
  description: yup.string().required(),
  amount: yup.number().positive().required(),
  treasury: yup.number().required(),
  date: yup.date().required(),
  category: yup.string().required(),
});

export default function ExpenseForm({ initialData, onSaved }) {
  const { id } = useParams();
  const isNew = !initialData;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { date: new Date(), category: 'OTHER' }
  });

  const { data: purchaseOrders = [] } = useQuery({ queryKey: ["purchaseOrders"], queryFn: listPurchaseOrders });
  const { data: treasuries = [] } = useQuery({ queryKey: ["treasuries"], queryFn: listTreasuries });
  const { data: vendors = [] } = useQuery({ queryKey: ["vendors"], queryFn: listVendors });

  useEffect(() => {
    if (initialData) {
      reset({ ...initialData, date: new Date(initialData.date) });
    }
  }, [initialData, reset]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, date: data.date.toISOString().split('T')[0] };
      return isNew ? createExpense(payload) : updateExpense(initialData.id, payload);
    },
    onSuccess: () => {
      toast.success(`Expense ${isNew ? 'created' : 'updated'}!`);
      onSaved();
    },
    onError: () => toast.error("Save failed."),
  });

  return (
    <form onSubmit={handleSubmit(save)} className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">{isNew ? "Add New Expense" : "Edit Expense"}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label>Vendor (Optional)</label>
          <select {...register("vendor")} className="input">
            <option value="">— Select Vendor —</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label>Link to Purchase Order (Optional)</label>
          <select {...register("purchase_order")} className="input">
            <option value="">— None —</option>
            {purchaseOrders.map(po => (
              <option key={po.id} value={po.id}>{po.po_number} ({po.item_name})</option>
            ))}
          </select>
        </div>
        <div>
          <label>Paid From *</label>
          <select {...register("treasury")} className="input">
            <option value="">— Select Treasury —</option>
            {treasuries.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {errors.treasury && <p className="text-red-500 text-xs">{errors.treasury.message}</p>}
        </div>
        <div>
          <label>Date *</label>
          <Controller name="date" control={control} render={({ field }) => <DatePicker {...field} className="input w-full" selected={field.value} onChange={date => field.onChange(date)} />} />
          {errors.date && <p className="text-red-500 text-xs">{errors.date.message}</p>}
        </div>
        <div>
          <label>Amount *</label>
          <input type="number" step="0.01" {...register("amount")} className="input" />
          {errors.amount && <p className="text-red-500 text-xs">{errors.amount.message}</p>}
        </div>
        <div>
          <label>Category *</label>
          <select {...register("category")} className="input">
            <option value="UTILITIES">Utilities</option>
            <option value="RENT">Rent</option>
            <option value="SALARIES">Salaries</option>
            <option value="SUPPLIES">Supplies</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="MARKETING">Marketing</option>
            <option value="OTHER">Other</option>
          </select>
          {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
        </div>
      </div>
      <div>
        <label>Description *</label>
        <textarea {...register("description")} rows={4} className="input"></textarea>
        {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" className="btn-secondary" onClick={onSaved}>Cancel</button>
        <button type="submit" disabled={isPending} className="btn-primary">{isPending ? "Saving..." : "Save Expense"}</button>
      </div>
    </form>
  );
}
