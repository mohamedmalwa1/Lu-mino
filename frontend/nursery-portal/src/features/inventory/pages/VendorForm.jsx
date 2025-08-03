import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import { 
    createVendor, 
    updateVendor, 
    getVendor,
} from "../../../api/inventory";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  name: yup.string().required("Vendor name is required"),
  contact_email: yup.string().email("Invalid email format").nullable(),
  phone: yup.string().nullable(),
});

export default function VendorForm() {
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
  });

  const { data: vendor, isLoading: isLoadingVendor } = useQuery({
      queryKey: ["vendor", id],
      queryFn: () => getVendor(id),
      enabled: !isNew,
  });

  useEffect(() => {
    if (vendor) {
        reset(vendor);
    }
  }, [vendor, reset]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => {
      return isNew ? createVendor(data) : updateVendor(id, data);
    },
    onSuccess: () => { 
        toast.success(`Vendor ${isNew ? 'created' : 'updated'}!`);
        qc.invalidateQueries({ queryKey: ["vendors"] });
        navigate("/inventory/vendors");
    },
    onError: (err) => { 
        console.error("Save failed:", err.response?.data);
        toast.error("Failed to save vendor."); 
    },
  });

  if (!isNew && isLoadingVendor) {
      return <Spinner />;
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-6">
            {isNew ? "Add New Vendor" : "Edit Vendor"}
        </h2>
        <form onSubmit={handleSubmit(save)} className="space-y-6 max-w-2xl">
            
            <div>
                <label className="block mb-1 font-medium">Vendor Name *</label>
                <input {...register("name")} className="input w-full" />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
                <label className="block mb-1 font-medium">Contact Email</label>
                <input {...register("contact_email")} className="input w-full" />
                {errors.contact_email && <p className="text-red-600 text-sm mt-1">{errors.contact_email.message}</p>}
            </div>

            <div>
                <label className="block mb-1 font-medium">Phone Number</label>
                <input {...register("phone")} className="input w-full" />
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" className="btn-secondary" onClick={() => navigate("/inventory/vendors")}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-60">
                {isPending ? "Saving…" : "Save Vendor"}
                </button>
            </div>
        </form>
    </div>
  );
}

