import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";

import { listStaffEvaluations, deleteStaffEvaluation } from "../../../api/hr";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

export default function StaffEvaluations() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmID, setConfirmID] = useState(null);
  const [search, setSearch] = useState("");

  const { data: evaluations = [], isLoading } = useQuery({
    queryKey: ["staffEvaluations"],
    queryFn: listStaffEvaluations,
  });

  const filtered = evaluations.filter((e) =>
    (e.staff_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const rows = filtered.map((e, idx) => ({
    ...e,
    idx: idx + 1,
    eval_date: new Date(e.eval_date).toLocaleDateString(),
    summary: e.summary.substring(0, 100) + (e.summary.length > 100 ? "..." : ""),
    _actions: (
      <div className="flex gap-4">
        <button
          className="text-blue-600 hover:underline font-semibold"
          onClick={() => navigate(`/hr/evaluations/${e.id}`)}
        >
          Edit
        </button>
        <button
          className="text-red-600 hover:underline font-semibold"
          onClick={() => setConfirmID(e.id)}
        >
          Delete
        </button>
      </div>
    ),
  }));

  const columns = [
    { key: "idx", label: "#" },
    { key: "staff_name", label: "Staff Member" },
    { key: "eval_date", label: "Evaluation Date" },
    { key: "summary", label: "Summary" },
    { key: "_actions", label: "Actions" },
  ];

  const { mutate: removeOne } = useMutation({
    mutationFn: deleteStaffEvaluation,
    onSuccess: () => {
      toast.success("Evaluation deleted");
      qc.invalidateQueries({ queryKey: ["staffEvaluations"] });
      setConfirmID(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  const removeMany = async (ids) => {
    if (!window.confirm(`Delete ${ids.length} evaluations?`)) return;
    try {
      await Promise.all(ids.map(deleteStaffEvaluation));
      toast.success("Evaluations deleted");
      qc.invalidateQueries({ queryKey: ["staffEvaluations"] });
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
            <h2 className="text-2xl font-semibold">Staff Evaluations</h2>
            <button
              onClick={() => navigate("/hr/evaluations/new")}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus /> Add Evaluation
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
          title="Delete Evaluation?"
          onCancel={() => setConfirmID(null)}
          onConfirm={() => removeOne(confirmID)}
        >
          This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}

