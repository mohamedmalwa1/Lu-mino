import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";

import { listPayments, deletePayment } from "../../../api/finance";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

export default function Payments() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmID, setConfirmID] = useState(null);
  const [search, setSearch] = useState("");

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: listPayments,
  });

  const filtered = payments.filter((p) =>
    [`${p.student_name}`, `${p.invoice_number}`, `${p.treasury_name}`]
      .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const rows = filtered.map((p, idx) => ({
    ...p,
    idx: idx + 1,
    date: new Date(p.date).toLocaleDateString(),
    amount: parseFloat(p.amount).toFixed(2),
    _actions: (
      <div className="flex gap-4">
        <button
          className="text-blue-600 hover:underline font-semibold"
          onClick={() => navigate(`/finance/payments/${p.id}`)}
        >
          Edit
        </button>
        <button
          className="text-red-600 hover:underline font-semibold"
          onClick={() => setConfirmID(p.id)}
        >
          Delete
        </button>
      </div>
    ),
  }));

  const columns = [
    { key: "idx", label: "#" },
    { key: "invoice_number", label: "Invoice #" },
    { key: "student_name", label: "Student" },
    { key: "treasury_name", label: "Treasury" },
    { key: "amount", label: "Amount" },
    { key: "date", label: "Date" },
    { key: "_actions", label: "Actions" },
  ];

  const { mutate: removeOne } = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => {
      toast.success("Payment deleted");
      qc.invalidateQueries({ queryKey: ["payments"] });
      setConfirmID(null);
    },
    onError: () => toast.error("Delete failed"),
  });
  
  // --- ADD THIS FUNCTION FOR BULK DELETE ---
  const removeMany = async (ids) => {
    if (!window.confirm(`Delete ${ids.length} payments?`)) return;
    try {
      await Promise.all(ids.map(deletePayment));
      toast.success("Payments deleted");
      qc.invalidateQueries({ queryKey: ["payments"] });
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
            <h2 className="text-2xl font-semibold">Payments</h2>
            <button
              onClick={() => navigate("/finance/payments/new")}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus /> Add Payment
            </button>
          </div>

          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student, invoice or treasury…"
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

          {isLoading ? (
            <SkeletonTable />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              onBulkDelete={removeMany} // --- ADD THIS PROP ---
              defaultSort={{ key: "date", dir: "desc" }}
            />
          )}
        </div>
      </div>

      {confirmID && (
        <ConfirmDialog
          title="Delete Payment?"
          onCancel={() => setConfirmID(null)}
          onConfirm={() => removeOne(confirmID)}
        >
          This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}

