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
    createItem, 
    updateItem, 
    getItem,
    listVendors,
} from "../../../api/inventory";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  name: yup.string().required("Item name is required"),
  sku: yup.string().required("SKU is required"),
  category: yup.string().required("Category is required"),
  unit_price: yup.number().positive().required(),
  quantity: yup.number().integer().min(0).required(),
  vendor: yup.number().required("Vendor is required"),
});

export default function ItemForm() {
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
  });

  const { data: item, isLoading: isLoadingItem } = useQuery({
      queryKey: ["item", id],
      queryFn: () => getItem(id),
      enabled: !isNew,
  });

  const { data: vendors = [], isLoading: isLoadingVendors } = useQuery({
      queryKey: ["vendors"],
      queryFn: listVendors,
  });

  useEffect(() => {
    if (item) {
        reset({ 
            ...item, 
            last_restock: item.last_restock ? new Date(item.last_restock) : null,
        });
    }
  }, [item, reset]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => {
      const payload = { 
          ...data, 
          last_restock: data.last_restock ? data.last_restock.toISOString().split("T")[0] : null,
      };
      return isNew ? createItem(payload) : updateItem(id, payload);
    },
    onSuccess: () => { 
        toast.success(`Item ${isNew ? 'created' : 'updated'}!`);
        qc.invalidateQueries({ queryKey: ["items"] });
        navigate("/inventory/items");
    },
    onError: (err) => { 
        console.error("Save failed:", err.response?.data);
        toast.error("Failed to save item."); 
    },
  });

  if (!isNew && isLoadingItem) {
      return <Spinner />;
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-6">
            {isNew ? "Add New Item" : "Edit Item"}
        </h2>
        <form onSubmit={handleSubmit(save)} className="space-y-6 max-w-2xl">
            <input {...register("name")} className="input w-full" placeholder="Item Name *" />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}

            <input {...register("sku")} className="input w-full" placeholder="SKU (Stock Keeping Unit) *" />
            {errors.sku && <p className="text-red-600 text-sm mt-1">{errors.sku.message}</p>}

            <select {...register("category")} className="input w-full">
                <option value="">— Select Category * —</option>
                <option value="UNIFORM">Uniform</option>
                <option value="BOOK">Book</option>
                <option value="EQUIP">Equipment</option>
                <option value="TOY">Toy</option>
                <option value="ASSET">Asset</option>
            </select>
            {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>}
            
            <select {...register("vendor")} className="input w-full">
                <option value="">— Select Vendor * —</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            {errors.vendor && <p className="text-red-600 text-sm mt-1">{errors.vendor.message}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="number" {...register("quantity")} className="input w-full" placeholder="Quantity in Stock *" />
                <input type="number" step="0.01" {...register("unit_price")} className="input w-full" placeholder="Unit Price *" />
            </div>
            {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>}
            {errors.unit_price && <p className="text-red-600 text-sm mt-1">{errors.unit_price.message}</p>}

            <div>
                <label className="block mb-1 font-medium">Last Restock Date</label>
                <Controller control={control} name="last_restock" render={({ field }) => (
                    <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
                )}/>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" className="btn-secondary" onClick={() => navigate("/inventory/items")}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-60">
                {isPending ? "Saving…" : "Save Item"}
                </button>
            </div>
        </form>
    </div>
  );
}

