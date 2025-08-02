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
  createPurchaseOrder,
  updatePurchaseOrder,
  getPurchaseOrder,
} from "../../../api/finance";
import { listVendors, listItems } from "../../../api/inventory";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  po_number: yup.string().required("PO Number is required"),
  vendor: yup.number().required("Vendor is required"),
  item: yup.number().required("Item is required"),
  quantity: yup.number().positive("Quantity must be positive").integer().required(),
  unit_price: yup.number().positive("Unit price must be positive").required(),
  order_date: yup.date().required("Order date is required"),
  received: yup.boolean(),
});

const blank = {
  po_number: "",
  vendor: "",
  item: "",
  quantity: "",
  unit_price: "",
  order_date: new Date(),
  received: false,
};

export default function PurchaseOrderForm() {
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

  const { data: purchaseOrder, isLoading: isLoadingPO } = useQuery({
      queryKey: ["purchaseOrder", id],
      queryFn: () => getPurchaseOrder(id),
      enabled: !isNew,
  });

  useEffect(() => {
    if (purchaseOrder) {
        reset({ ...purchaseOrder, order_date: new Date(purchaseOrder.order_date) });
    } else {
        reset(blank);
    }
  }, [purchaseOrder, reset]);

  const { data: vendors, isLoading: isLoadingVendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: listVendors,
  });

  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ["items"],
    queryFn: listItems,
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, order_date: data.order_date.toISOString().split("T")[0] };
      return isNew ? createPurchaseOrder(payload) : updatePurchaseOrder(id, payload);
    },
    onSuccess: () => { 
        toast.success(`Purchase Order ${isNew ? 'created' : 'updated'}!`);
        qc.invalidateQueries({ queryKey: ["purchaseOrders"] });
        navigate("/finance/purchase-orders");
    },
    onError: (err) => { 
        console.error("Save failed:", err.response?.data);
        toast.error("Failed to save Purchase Order."); 
    },
  });

  if (!isNew && isLoadingPO) {
      return <Spinner />;
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-6">
            {isNew ? "Create Purchase Order" : "Edit Purchase Order"}
        </h2>
        <form onSubmit={handleSubmit(save)} className="space-y-6 max-w-2xl">
            
            <input {...register("po_number")} className="input w-full" placeholder="PO Number *" />
            {errors.po_number && <p className="text-red-600 text-sm mt-1">{errors.po_number.message}</p>}

            <select {...register("vendor")} className="input w-full">
                <option value="">— Select Vendor * —</option>
                {vendors?.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}
            </select>
            {errors.vendor && <p className="text-red-600 text-sm mt-1">{errors.vendor.message}</p>}

            <select {...register("item")} className="input w-full">
                <option value="">— Select Item * —</option>
                {items?.map((i) => (<option key={i.id} value={i.id}>{i.name}</option>))}
            </select>
            {errors.item && <p className="text-red-600 text-sm mt-1">{errors.item.message}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="number" {...register("quantity")} className="input w-full" placeholder="Quantity *" />
                <input type="number" step="0.01" {...register("unit_price")} className="input w-full" placeholder="Unit Price *" />
            </div>
             {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>}
             {errors.unit_price && <p className="text-red-600 text-sm mt-1">{errors.unit_price.message}</p>}

            <Controller control={control} name="order_date" render={({ field }) => (
                <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
            )}/>
            {errors.order_date && <p className="text-red-600 text-sm mt-1">{errors.order_date.message}</p>}

            <label className="flex items-center gap-2">
                <input type="checkbox" {...register("received")} />
                <span>Mark as Received</span>
            </label>

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" className="btn-secondary" onClick={() => navigate("/finance/purchase-orders")}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-60">
                {isPending ? "Saving…" : "Save PO"}
                </button>
            </div>
        </form>
    </div>
  );
}

