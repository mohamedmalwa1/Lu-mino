import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { createPurchaseOrder, updatePurchaseOrder, getPurchaseOrder } from "../../../api/finance";
import { listVendors, listItems } from "../../../api/inventory"; // Assuming you have these

const schema = yup.object({
  // po_number is removed from validation
  vendor: yup.number().required(),
  item: yup.number().required(),
  quantity: yup.number().positive().integer().required(),
  unit_price: yup.number().positive().required(),
  order_date: yup.date().required(),
  received: yup.boolean(),
});

export default function PurchaseOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { received: false, order_date: new Date() }
  });

  // Fetch existing PO data if editing
  const { data: poData } = useQuery({
    queryKey: ["purchaseOrder", id],
    queryFn: () => getPurchaseOrder(id),
    enabled: !isNew,
  });

  useEffect(() => {
    if (poData) {
      reset({ ...poData, order_date: new Date(poData.order_date) });
    }
  }, [poData, reset]);
  
  // Fetch dropdown data
  const { data: vendors = [] } = useQuery({ queryKey: ["vendors"], queryFn: listVendors });
  const { data: items = [] } = useQuery({ queryKey: ["inventoryItems"], queryFn: listItems });

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => {
        const payload = { ...data, order_date: data.order_date.toISOString().split('T')[0] };
        return isNew ? createPurchaseOrder(payload) : updatePurchaseOrder(id, payload);
    },
    onSuccess: () => {
        toast.success(`Purchase Order ${isNew ? 'created' : 'updated'}!`);
        navigate("/finance/purchase-orders");
    },
    onError: () => toast.error("Save failed."),
  });

  return (
    <form onSubmit={handleSubmit(save)} className="p-6 bg-white shadow-lg rounded-2xl space-y-4">
      <h2 className="text-2xl font-semibold">
        {isNew ? "Create Purchase Order" : `Edit Purchase Order: ${poData?.po_number || ''}`}
      </h2>
      
      {/* PO Number input is REMOVED */}

      <div className="grid grid-cols-2 gap-4">
          <div><label>Vendor</label><select {...register("vendor")} className="input"><option value="">--Select--</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>{errors.vendor && <p className="text-red-500 text-xs">{errors.vendor.message}</p>}</div>
          <div><label>Item</label><select {...register("item")} className="input"><option value="">--Select--</option>{items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>{errors.item && <p className="text-red-500 text-xs">{errors.item.message}</p>}</div>
          <div><label>Quantity</label><input type="number" {...register("quantity")} className="input" />{errors.quantity && <p className="text-red-500 text-xs">{errors.quantity.message}</p>}</div>
          <div><label>Unit Price</label><input type="number" step="0.01" {...register("unit_price")} className="input" />{errors.unit_price && <p className="text-red-500 text-xs">{errors.unit_price.message}</p>}</div>
          <div><label>Order Date</label><Controller name="order_date" control={control} render={({field}) => <DatePicker {...field} className="input w-full" selected={field.value} onChange={date => field.onChange(date)} />} /></div>
      </div>
      
      <div className="flex items-center gap-2"><input type="checkbox" {...register("received")} /> Mark as Received</div>
      <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" className="btn-secondary" onClick={() => navigate("/finance/purchase-orders")}>Cancel</button><button type="submit" disabled={isPending} className="btn-primary">{isPending ? "Saving..." : "Save PO"}</button></div>
    </form>
  );
}
