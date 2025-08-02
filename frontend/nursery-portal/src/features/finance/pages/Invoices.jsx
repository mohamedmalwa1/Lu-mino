import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";

import { listInvoices, deleteInvoice } from "../../../api/finance";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

export default function Invoices() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmID, setConfirmID] = useState(null);
  const [search, setSearch] = useState("");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: listInvoices,
  });

  const filtered = invoices.filter(
    (inv) =>
      (inv.student_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.invoice_number ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.status ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const rows = filtered.map((inv, idx) => ({
    ...inv,
    idx: idx + 1,
    issue_date: new Date(inv.issue_date).toLocaleDateString(),
    due_date: new Date(inv.due_date).toLocaleDateString(),
    amount: parseFloat(inv.amount).toFixed(2),
    _actions: (
      <div className="flex gap-4">
        <button
          className="text-blue-600 hover:underline font-semibold"
          onClick={() => navigate(`/finance/invoices/${inv.id}`)}
        >
          Edit
        </button>
        <button
          className="text-red-600 hover:underline font-semibold"
          onClick={() => setConfirmID(inv.id)}
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
    { key: "amount", label: "Amount" },
    { key: "issue_date", label: "Issued" },
    { key: "due_date", label: "Due" },
    { key: "status", label: "Status" },
    { key: "_actions", label: "Actions" },
  ];

  const { mutate: removeOne } = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      toast.success("Invoice deleted");
      qc.invalidateQueries({ queryKey: ["invoices"] });
      setConfirmID(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  // --- ADD THIS FUNCTION FOR BULK DELETE ---
  const removeMany = async (ids) => {
    if (!window.confirm(`Delete ${ids.length} invoices?`)) return;
    try {
      await Promise.all(ids.map(deleteInvoice));
      toast.success("Invoices deleted");
      qc.invalidateQueries({ queryKey: ["invoices"] });
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
            <h2 className="text-2xl font-semibold">Invoices</h2>
            <button
              onClick={() => navigate("/finance/invoices/new")}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus /> Add Invoice
            </button>
          </div>

          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student, invoice #, or status…"
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
              defaultSort={{ key: "issue_date", dir: "desc" }}
            />
          )}
        </div>
      </div>

      {confirmID && (
        <ConfirmDialog
          title="Delete Invoice?"
          onCancel={() => setConfirmID(null)}
          onConfirm={() => removeOne(confirmID)}
        >
          This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}

