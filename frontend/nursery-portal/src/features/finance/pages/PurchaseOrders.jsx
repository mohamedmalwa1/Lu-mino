import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";

import { listPurchaseOrders, deletePurchaseOrder } from "../../../api/finance";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

export default function PurchaseOrders() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmID, setConfirmID] = useState(null);
  const [search, setSearch] = useState("");

  const { data: purchaseOrders = [], isLoading } = useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: listPurchaseOrders,
  });

  const filtered = purchaseOrders.filter((po) =>
    (po.po_number?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (po.vendor_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (po.item_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const rows = filtered.map((po, idx) => ({
    ...po,
    idx: idx + 1,
    order_date: new Date(po.order_date).toLocaleDateString(),
    total: (po.quantity * po.unit_price).toFixed(2),
    received: po.received ? "Yes" : "No",
    _actions: (
      <div className="flex gap-4">
        <button
          className="text-blue-600 hover:underline font-semibold"
          onClick={() => navigate(`/finance/purchase-orders/${po.id}`)}
        >
          Edit
        </button>
        <button
          className="text-red-600 hover:underline font-semibold"
          onClick={() => setConfirmID(po.id)}
        >
          Delete
        </button>
      </div>
    ),
  }));

  const columns = [
    { key: "idx", label: "#" },
    { key: "po_number", label: "PO #" },
    { key: "vendor_name", label: "Vendor" },
    { key: "item_name", label: "Item" },
    { key: "quantity", label: "Quantity" },
    { key: "total", label: "Total Cost" },
    { key: "order_date", label: "Order Date" },
    { key: "received", label: "Received" },
    { key: "_actions", label: "Actions" },
  ];

  const { mutate: removeOne } = useMutation({
    mutationFn: deletePurchaseOrder,
    onSuccess: () => {
      toast.success("Purchase Order deleted");
      qc.invalidateQueries({ queryKey: ["purchaseOrders"] });
      setConfirmID(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  const removeMany = async (ids) => {
    if (!window.confirm(`Delete ${ids.length} purchase orders?`)) return;
    try {
      await Promise.all(ids.map(deletePurchaseOrder));
      toast.success("Purchase Orders deleted");
      qc.invalidateQueries({ queryKey: ["purchaseOrders"] });
    } catch {
      toast.error("Bulk delete failed");
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Purchase Orders</h2>
            <button
              onClick={() => navigate("/finance/purchase-orders/new")}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus /> Add PO
            </button>
          </div>

          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by PO #, vendor, or item…"
              className="w-full pl-12 pr-12 py-2 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX />
              </button>
            )}
          </div>

          {isLoading ? <SkeletonTable /> : <DataTable columns={columns} rows={rows} onBulkDelete={removeMany} />}
        </div>
      </div>

      {confirmID && (
        <ConfirmDialog
          title="Delete Purchase Order?"
          onCancel={() => setConfirmID(null)}
          onConfirm={() => removeOne(confirmID)}
        >
          This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}

