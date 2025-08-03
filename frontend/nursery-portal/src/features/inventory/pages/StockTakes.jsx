import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";
import cx from "classnames";

import { listStockTakes, deleteStockTake } from "../../../api/inventory";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

export default function StockTakes() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmID, setConfirmID] = useState(null);
  const [search, setSearch] = useState("");

  const { data: stockTakes = [], isLoading } = useQuery({
    queryKey: ["stockTakes"],
    queryFn: listStockTakes,
  });

  const filtered = stockTakes.filter((st) =>
    (st.item_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const rows = filtered.map((st, idx) => ({
    ...st,
    idx: idx + 1,
    date: new Date(st.date).toLocaleDateString(),
    discrepancy: (
        <span className={cx({
            "text-red-600": st.discrepancy < 0,
            "text-green-600": st.discrepancy > 0,
        })}>
            {st.discrepancy > 0 ? `+${st.discrepancy}` : st.discrepancy}
        </span>
    ),
    _actions: (
      <div className="flex gap-4">
        <button
          className="text-blue-600 hover:underline font-semibold"
          onClick={() => navigate(`/inventory/stock-takes/${st.id}`)}
        >
          Edit
        </button>
        <button
          className="text-red-600 hover:underline font-semibold"
          onClick={() => setConfirmID(st.id)}
        >
          Delete
        </button>
      </div>
    ),
  }));

  const columns = [
    { key: "idx", label: "#" },
    { key: "date", label: "Date" },
    { key: "item_name", label: "Item" },
    { key: "counted_quantity", label: "Counted" },
    { key: "discrepancy", label: "Discrepancy" },
    { key: "responsible_staff_name", label: "Responsible" },
    { key: "_actions", label: "Actions" },
  ];

  const { mutate: removeOne } = useMutation({
    mutationFn: deleteStockTake,
    onSuccess: () => {
      toast.success("Stock take deleted");
      qc.invalidateQueries({ queryKey: ["stockTakes"] });
      setConfirmID(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  const removeMany = async (ids) => {
    if (!window.confirm(`Delete ${ids.length} records?`)) return;
    try {
      await Promise.all(ids.map(deleteStockTake));
      toast.success("Records deleted");
      qc.invalidateQueries({ queryKey: ["stockTakes"] });
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
            <h2 className="text-2xl font-semibold">Stock Takes</h2>
            <button
              onClick={() => navigate("/inventory/stock-takes/new")}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus /> New Stock Take
            </button>
          </div>

          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by item name…"
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
          title="Delete Stock Take?"
          onCancel={() => setConfirmID(null)}
          onConfirm={() => removeOne(confirmID)}
        >
          This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}

