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
    createPayrollContract, 
    updatePayrollContract, 
    getPayrollContract,
    listStaff,
} from "../../../api/hr";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  staff: yup.number().required("Staff member is required"),
  base_salary: yup.number().positive().required("Base salary is required"),
  allowance: yup.number().min(0).required("Allowance is required"),
  contract_start: yup.date().required("Start date is required"),
  contract_end: yup.date().nullable(),
});

export default function PayrollContractForm() {
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
    defaultValues: { allowance: 0 },
  });

  const { data: contract, isLoading: isLoadingContract } = useQuery({
      queryKey: ["payrollContract", id],
      queryFn: () => getPayrollContract(id),
      enabled: !isNew,
  });
  
  const { data: staff = [], isLoading: isLoadingStaff } = useQuery({
      queryKey: ["staff"],
      queryFn: () => listStaff({ is_active: true }),
  });

  useEffect(() => {
    if (contract) {
        reset({ 
            ...contract, 
            contract_start: new Date(contract.contract_start),
            contract_end: contract.contract_end ? new Date(contract.contract_end) : null,
        });
    }
  }, [contract, reset]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => {
      const payload = { 
          ...data, 
          contract_start: data.contract_start.toISOString().split("T")[0],
          contract_end: data.contract_end ? data.contract_end.toISOString().split("T")[0] : null,
      };
      return isNew ? createPayrollContract(payload) : updatePayrollContract(id, payload);
    },
    onSuccess: () => { 
        toast.success(`Contract ${isNew ? 'created' : 'updated'}!`);
        qc.invalidateQueries({ queryKey: ["payrollContracts"] });
        navigate("/hr/contracts");
    },
    onError: (err) => { 
        console.error("Save failed:", err.response?.data);
        toast.error("Failed to save contract."); 
    },
  });

  if (!isNew && isLoadingContract) {
      return <Spinner />;
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-6">
            {isNew ? "New Payroll Contract" : "Edit Payroll Contract"}
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
                    <label className="block mb-1 font-medium">Base Salary *</label>
                    <input type="number" step="0.01" {...register("base_salary")} className="input w-full" />
                    {errors.base_salary && <p className="text-red-600 text-sm mt-1">{errors.base_salary.message}</p>}
                </div>
                <div>
                    <label className="block mb-1 font-medium">Allowance *</label>
                    <input type="number" step="0.01" {...register("allowance")} className="input w-full" />
                    {errors.allowance && <p className="text-red-600 text-sm mt-1">{errors.allowance.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block mb-1 font-medium">Contract Start Date *</label>
                    <Controller control={control} name="contract_start" render={({ field }) => (
                        <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
                    )}/>
                    {errors.contract_start && <p className="text-red-600 text-sm mt-1">{errors.contract_start.message}</p>}
                </div>
                <div>
                    <label className="block mb-1 font-medium">Contract End Date (Optional)</label>
                    <Controller control={control} name="contract_end" render={({ field }) => (
                        <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
                    )}/>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" className="btn-secondary" onClick={() => navigate("/hr/contracts")}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-60">
                {isPending ? "Saving…" : "Save Contract"}
                </button>
            </div>
        </form>
    </div>
  );
}

