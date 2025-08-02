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
  createPayment,
  updatePayment,
  getPayment,
  listInvoices,
  listTreasuries,
} from "../../../api/finance";
import Spinner from "../../../components/ui/Spinner";

// Validation schema using Yup
const schema = yup.object({
  invoice: yup.number().required("Invoice is required"),
  treasury: yup.number().required("Treasury account is required"),
  amount: yup.number().positive("Amount must be positive").required("Amount is required"),
  date: yup.date().required("Payment date is required"),
});

// Blank form values
const blank = {
  invoice: "",
  treasury: "",
  amount: "",
  date: new Date(),
};

export default function PaymentForm() {
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

  // Fetch payment data if we are editing
  const { data: payment, isLoading: isLoadingPayment } = useQuery({
    queryKey: ["payment", id],
    queryFn: () => getPayment(id),
    enabled: !isNew,
  });

  // Fetch invoices for the dropdown (only unpaid ones)
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => listInvoices({ status: "SENT" }),
  });

  // Fetch treasuries for the dropdown
  const { data: treasuries = [], isLoading: isLoadingTreasuries } = useQuery({
    queryKey: ["treasuries"],
    queryFn: listTreasuries,
  });

  // Reset form with fetched data when editing
  useEffect(() => {
    if (payment) {
      reset({
        ...payment,
        date: new Date(payment.date),
      });
    } else {
      reset(blank);
    }
  }, [payment, reset]);

  // Mutation for saving the payment (create or update)
  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        date: data.date.toISOString().split("T")[0],
      };
      return isNew ? createPayment(payload) : updatePayment(id, payload);
    },
    onSuccess: () => {
      toast.success(`Payment ${isNew ? 'created' : 'updated'} successfully!`);
      qc.invalidateQueries({ queryKey: ["payments"] });
      navigate("/finance/payments");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to save payment.");
    },
  });

  if (!isNew && isLoadingPayment) {
    return <Spinner />;
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
      <h2 className="text-2xl font-semibold mb-6">
        {isNew ? "Record New Payment" : "Edit Payment"}
      </h2>
      <form onSubmit={handleSubmit(save)} className="space-y-6 max-w-2xl">
        {/* Invoice Dropdown */}
        <div>
          <label className="block mb-1 font-medium">Invoice *</label>
          {isLoadingInvoices ? <Spinner /> : (
            <select {...register("invoice")} className="input w-full">
              <option value="">— Select Invoice —</option>
              {invoices?.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.invoice_number} - {i.student_name} (${i.amount})
                </option>
              ))}
            </select>
          )}
          {errors.invoice && <p className="text-red-600 text-sm mt-1">{errors.invoice.message}</p>}
        </div>

        {/* Treasury Dropdown */}
        <div>
          <label className="block mb-1 font-medium">Treasury Account *</label>
          {isLoadingTreasuries ? <Spinner /> : (
            <select {...register("treasury")} className="input w-full">
              <option value="">— Select Treasury —</option>
              {treasuries?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Balance: ${t.balance})
                </option>
              ))}
            </select>
          )}
          {errors.treasury && <p className="text-red-600 text-sm mt-1">{errors.treasury.message}</p>}
        </div>

        {/* Amount */}
        <div>
          <label className="block mb-1 font-medium">Amount *</label>
          <input type="number" step="0.01" {...register("amount")} className="input w-full" placeholder="e.g., 500.00" />
          {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>}
        </div>

        {/* Date */}
        <div>
          <label className="block mb-1 font-medium">Payment Date *</label>
          <Controller control={control} name="date" render={({ field }) => (
            <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
          )}/>
          {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          <button type="button" className="btn-secondary" onClick={() => navigate("/finance/payments")}>
            Cancel
          </button>
          <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-60">
            {isPending ? "Saving…" : "Save Payment"}
          </button>
        </div>
      </form>
    </div>
  );
}

