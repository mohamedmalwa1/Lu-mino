import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";

import { listExpenses, deleteExpense } from "../../../api/finance";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Drawer from "../../../components/ui/Drawer";
import ExpenseForm from "./ExpenseForm";

export default function Expenses() {
  const qc = useQueryClient();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [confirmID, setConfirmID] = useState(null);
  const [search, setSearch] = useState("");

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: listExpenses,
  });

  const onSaved = () => {
    setDrawerOpen(false);
    qc.invalidateQueries({ queryKey: ["expenses"] });
  };

  const openDrawer = (expense = null) => {
    setEditingExpense(expense);
    setDrawerOpen(true);
  };

  const filtered = expenses.filter(
    (exp) =>
      (exp.vendor_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (exp.po_number?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (exp.description?.toLowerCase() || "").includes(search.toLowerCase())
  );
  
  const totalAmount = useMemo(() => 
    filtered.reduce((sum, exp) => sum + parseFloat(exp.amount), 0),
    [filtered]
  );

  const rows = filtered.map((exp, idx) => ({
    ...exp,
    idx: idx + 1,
    date: new Date(exp.date).toLocaleDateString(),
    amount: parseFloat(exp.amount).toFixed(2),
    _actions: (
      <div className="flex gap-4">
        <button
          className="text-blue-600 hover:underline font-semibold"
          onClick={() => openDrawer(exp)}
        >
          Edit
        </button>
        <button
          className="text-red-600 hover:underline font-semibold"
          onClick={() => setConfirmID(exp.id)}
        >
          Delete
        </button>
      </div>
    ),
  }));

  const columns = [
    { key: "idx", label: "#" },
    { key: "date", label: "Date" },
    { key: "po_number", label: "Linked PO #" },
    { key: "vendor_name", label: "Vendor" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount" },
    { key: "treasury_name", label: "Paid From" },
    { key: "_actions", label: "Actions" },
  ];

  const { mutate: removeOne } = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      toast.success("Expense deleted");
      qc.invalidateQueries({ queryKey: ["expenses"] });
      setConfirmID(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Expenses</h2>
            <button
              onClick={() => openDrawer(null)}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus /> Add Expense
            </button>
          </div>

          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by vendor, PO #, or description…"
              className="input w-full pl-12"
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

          {isLoading ? <SkeletonTable /> : <DataTable columns={columns} rows={rows} />}

          {!isLoading && (
            <div className="pt-4 mt-4 border-t text-right">
              <span className="text-gray-500 font-medium">Total Expenses Displayed: </span>
              <span className="font-bold text-lg text-gray-800">AED{totalAmount.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
      
      <Drawer open={isDrawerOpen} onClose={() => setDrawerOpen(false)} width="36rem">
        {isDrawerOpen && <ExpenseForm initialData={editingExpense} onSaved={onSaved} />}
      </Drawer>

      {confirmID && (
        <ConfirmDialog
          title="Delete Expense?"
          onCancel={() => setConfirmID(null)}
          onConfirm={() => removeOne(confirmID)}
        >
          This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}
