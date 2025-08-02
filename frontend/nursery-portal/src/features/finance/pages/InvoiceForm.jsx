import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { createInvoice, updateInvoice, getInvoice } from "../../../api/finance";
import { listStudents } from "../../../api/students";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  student: yup.number().required("Student is required"),
  amount: yup.number().positive("Amount must be positive").required("Amount is required"),
  issue_date: yup.date().required("Issue date is required"),
  due_date: yup.date().required("Due date is required"),
  status: yup.string().oneOf(["DRAFT", "SENT", "PAID", "CANCELLED"]).required(),
});

const blank = {
  student: "",
  amount: "",
  issue_date: new Date(),
  due_date: null,
  status: "DRAFT",
  description: "",
};

export default function InvoiceForm() {
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

  const { data: invoice, isLoading: isLoadingInvoice } = useQuery({
      queryKey: ["invoice", id],
      queryFn: () => getInvoice(id),
      enabled: !isNew,
  });

  useEffect(() => {
    if (invoice) {
      reset({
        ...invoice,
        issue_date: new Date(invoice.issue_date),
        due_date: new Date(invoice.due_date),
      });
    } else {
      reset(blank);
    }
  }, [invoice, reset]);

  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students"],
    queryFn: listStudents,
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        issue_date: data.issue_date.toISOString().split("T")[0],
        due_date: data.due_date.toISOString().split("T")[0],
      };
      return isNew ? createInvoice(payload) : updateInvoice(id, payload);
    },
    onSuccess: () => {
      toast.success(`Invoice ${isNew ? 'created' : 'updated'} successfully!`);
      qc.invalidateQueries({ queryKey: ["invoices"] });
      navigate("/finance/invoices");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to save invoice.");
    },
  });

  if (!isNew && isLoadingInvoice) {
      return <Spinner />
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-6">
            {isNew ? "Create New Invoice" : "Edit Invoice"}
        </h2>
        <form onSubmit={handleSubmit(save)} className="space-y-6 max-w-2xl">
            <div>
                <label className="block mb-1 font-medium">Student *</label>
                {isLoadingStudents ? (
                <Spinner />
                ) : (
                <select {...register("student")} className="input w-full">
                    <option value="">— Select Student —</option>
                    {students?.map((s) => (
                    <option key={s.id} value={s.id}>
                        {s.name}
                    </option>
                    ))}
                </select>
                )}
                {errors.student && <p className="text-red-600 text-sm mt-1">{errors.student.message}</p>}
            </div>

            <div>
                <label className="block mb-1 font-medium">Amount *</label>
                <input type="number" step="0.01" {...register("amount")} className="input w-full" placeholder="e.g., 500.00" />
                {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block mb-1 font-medium">Issue Date *</label>
                <Controller control={control} name="issue_date" render={({ field }) => (
                    <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
                )}/>
                {errors.issue_date && <p className="text-red-600 text-sm mt-1">{errors.issue_date.message}</p>}
                </div>
                <div>
                <label className="block mb-1 font-medium">Due Date *</label>
                <Controller control={control} name="due_date" render={({ field }) => (
                    <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
                )}/>
                {errors.due_date && <p className="text-red-600 text-sm mt-1">{errors.due_date.message}</p>}
                </div>
            </div>
            
            <div>
                <label className="block mb-1 font-medium">Status *</label>
                <select {...register("status")} className="input w-full">
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
                </select>
            </div>

            <div>
                <label className="block mb-1 font-medium">Description</label>
                <textarea {...register("description")} rows={3} className="input w-full" placeholder="Optional notes..."/>
            </div>
            
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" className="btn-secondary" onClick={() => navigate("/finance/invoices")}>
                Cancel
                </button>
                <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-60">
                {isPending ? "Saving…" : "Save Invoice"}
                </button>
            </div>
        </form>
    </div>
  );
}

