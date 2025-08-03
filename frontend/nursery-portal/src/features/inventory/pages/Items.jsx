import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";

import { listItems, deleteItem } from "../../../api/inventory";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

export default function Items() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmID, setConfirmID] = useState(null);
  const [search, setSearch] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items"],
    queryFn: listItems,
  });

  const filtered = items.filter((i) =>
    (i.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (i.sku?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const rows = filtered.map((item, idx) => ({
    ...item,
    idx: idx + 1,
    unit_price: parseFloat(item.unit_price).toFixed(2),
    _actions: (
      <div className="flex gap-4">
        <button
          className="text-blue-600 hover:underline font-semibold"
          onClick={() => navigate(`/inventory/items/${item.id}`)}
        >
          Edit
        </button>
        <button
          className="text-red-600 hover:underline font-semibold"
          onClick={() => setConfirmID(item.id)}
        >
          Delete
        </button>
      </div>
    ),
  }));

  const columns = [
    { key: "idx", label: "#" },
    { key: "name", label: "Item Name" },
    { key: "sku", label: "SKU" },
    { key: "category", label: "Category" },
    { key: "quantity", label: "In Stock" },
    { key: "unit_price", label: "Unit Price" },
    { key: "vendor_name", label: "Vendor" },
    { key: "_actions", label: "Actions" },
  ];

  const { mutate: removeOne } = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      toast.success("Item deleted");
      qc.invalidateQueries({ queryKey: ["items"] });
      setConfirmID(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  const removeMany = async (ids) => {
    if (!window.confirm(`Delete ${ids.length} items?`)) return;
    try {
      await Promise.all(ids.map(deleteItem));
      toast.success("Items deleted");
      qc.invalidateQueries({ queryKey: ["items"] });
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
            <h2 className="text-2xl font-semibold">Inventory Items</h2>
            <button
              onClick={() => navigate("/inventory/items/new")}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus /> Add Item
            </button>
          </div>

          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU…"
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
          title="Delete Item?"
          onCancel={() => setConfirmID(null)}
          onConfirm={() => removeOne(confirmID)}
        >
          This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}

