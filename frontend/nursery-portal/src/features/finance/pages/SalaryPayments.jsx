import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";

import { listSalaryPayments, deleteSalaryPayment } from "../../../api/finance";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

export default function SalaryPayments() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmID, setConfirmID] = useState(null);
  const [search, setSearch] = useState("");

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["salaryPayments"],
    queryFn: listSalaryPayments,
  });

  const filtered = payments.filter((p) =>
    (p.staff_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const rows = filtered.map((p, idx) => ({
    ...p,
    idx: idx + 1,
    date: new Date(p.date).toLocaleDateString(),
    month: new Date(p.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
    amount: parseFloat(p.amount).toFixed(2),
    _actions: (
      <div className="flex gap-4">
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
    { key: "staff_name", label: "Staff Member" },
    { key: "month", label: "Salary for" },
    { key: "amount", label: "Amount Paid" },
    { key: "treasury_name", label: "Paid From" },
    { key: "date", label: "Payment Date" },
    { key: "_actions", label: "Actions" },
  ];

  const { mutate: removeOne } = useMutation({
    mutationFn: deleteSalaryPayment,
    onSuccess: () => {
      toast.success("Salary Payment deleted");
      qc.invalidateQueries({ queryKey: ["salaryPayments"] });
      setConfirmID(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  // --- ADD THIS FUNCTION FOR BULK DELETE ---
  const removeMany = async (ids) => {
    if (!window.confirm(`Delete ${ids.length} salary payments?`)) return;
    try {
      await Promise.all(ids.map(deleteSalaryPayment));
      toast.success("Salary payments deleted");
      qc.invalidateQueries({ queryKey: ["salaryPayments"] });
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
            <h2 className="text-2xl font-semibold">Salary Payments</h2>
            <button
              onClick={() => navigate("/finance/salary-payments/new")}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus /> Pay Salary
            </button>
          </div>

          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by staff name…"
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
          title="Delete Salary Payment?"
          onCancel={() => setConfirmID(null)}
          onConfirm={() => removeOne(confirmID)}
        >
          This will also remove the associated treasury transaction. This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}

