import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import { createTreasury, updateTreasury, getTreasury } from "../../../api/finance";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  name: yup.string().required("Account name is required"),
  balance: yup.number().typeError("Balance must be a number").required("Initial balance is required"),
});

const blank = { name: "", balance: "0.00" };

export default function TreasuryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const qc = useQueryClient();
  const isNew = !id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: blank,
  });

  const { data: treasury, isLoading: isLoadingTreasury } = useQuery({
      queryKey: ["treasury", id],
      queryFn: () => getTreasury(id),
      enabled: !isNew,
  });

  useEffect(() => {
    if (treasury) {
        reset(treasury);
    } else {
        reset(blank);
    }
  }, [treasury, reset]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) =>
      isNew ? createTreasury(data) : updateTreasury(id, data),
    onSuccess: () => { 
        toast.success(`Treasury account ${isNew ? 'created' : 'updated'}!`);
        qc.invalidateQueries({ queryKey: ["treasuries"] });
        navigate("/finance/treasuries");
    },
    onError: () => { toast.error("Failed to save account."); },
  });

  if (!isNew && isLoadingTreasury) {
      return <Spinner />;
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-6">
            {isNew ? "Add Treasury Account" : "Edit Treasury Account"}
        </h2>
        <form onSubmit={handleSubmit(save)} className="space-y-6 max-w-2xl">
            <div>
                <label className="block mb-1 font-medium">Account Name *</label>
                <input {...register("name")} className="input w-full" placeholder="e.g., Main Bank Account" />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
                <label className="block mb-1 font-medium">Current Balance *</label>
                <input type="number" step="0.01" {...register("balance")} className="input w-full" />
                {errors.balance && <p className="text-red-600 text-sm mt-1">{errors.balance.message}</p>}
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" className="btn-secondary" onClick={() => navigate("/finance/treasuries")}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-60">
                {isPending ? "Saving…" : "Save"}
                </button>
            </div>
        </form>
    </div>
  );
}

