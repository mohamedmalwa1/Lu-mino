import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { createSalaryPayment, listTreasuries } from "../../../api/finance";
import { listSalaryRecords } from "../../../api/hr";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  salary_record: yup.number().required("A salary record must be selected"),
  treasury: yup.number().required("A treasury account is required"),
  amount: yup.number().positive().required(),
  date: yup.date().required("Payment date is required"),
});

export default function SalaryPaymentForm() {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [selectedRecord, setSelectedRecord] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { date: new Date() },
  });

  const { data: records = [], isLoading: isLoadingRecords } = useQuery({
      queryKey: ["salaryRecords"],
      queryFn: () => listSalaryRecords({ paid: false }), // Only fetch unpaid salaries
  });

  const { data: treasuries = [], isLoading: isLoadingTreasuries } = useQuery({
    queryKey: ["treasuries"],
    queryFn: listTreasuries,
  });

  // When a salary record is selected, update the form's amount
  useEffect(() => {
      if (selectedRecord) {
          setValue("amount", selectedRecord.net);
      }
  }, [selectedRecord, setValue]);


  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, date: data.date.toISOString().split("T")[0] };
      return createSalaryPayment(payload);
    },
    onSuccess: () => { 
        toast.success(`Salary paid successfully!`);
        qc.invalidateQueries({ queryKey: ["salaryPayments"] });
        qc.invalidateQueries({ queryKey: ["salaryRecords"] }); // Refetch records
        navigate("/finance/salary-payments");
    },
    onError: (err) => { 
        console.error("Save failed:", err.response?.data);
        toast.error("Failed to pay salary."); 
    },
  });

  const handleRecordChange = (e) => {
      const recordId = e.target.value;
      const record = records.find(r => r.id === parseInt(recordId));
      setSelectedRecord(record);
      setValue("salary_record", recordId);
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-6">Pay Salary</h2>
        <form onSubmit={handleSubmit(save)} className="space-y-6 max-w-2xl">
            
            <div>
                <label className="block mb-1 font-medium">Unpaid Salary Record *</label>
                {isLoadingRecords ? <Spinner /> : (
                <select onChange={handleRecordChange} className="input w-full">
                    <option value="">— Select Staff & Month —</option>
                    {records?.map((r) => (
                    <option key={r.id} value={r.id}>
                        {r.staff_name} - {new Date(r.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} (${r.net})
                    </option>
                    ))}
                </select>
                )}
                {errors.salary_record && <p className="text-red-600 text-sm mt-1">{errors.salary_record.message}</p>}
            </div>

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
                <label className="block mb-1 font-medium">Amount to Pay *</label>
                <input type="number" step="0.01" {...register("amount")} className="input w-full bg-gray-100" readOnly />
                {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>}
            </div>

            <div>
                <label className="block mb-1 font-medium">Payment Date *</label>
                <Controller control={control} name="date" render={({ field }) => (
                <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
                )}/>
                {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>}
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" className="btn-secondary" onClick={() => navigate("/finance/salary-payments")}>Cancel</button>
                <button type="submit" disabled={isPending || !selectedRecord} className="btn-primary disabled:opacity-60">
                {isPending ? "Processing…" : "Confirm & Pay"}
                </button>
            </div>
        </form>
    </div>
  );
}

