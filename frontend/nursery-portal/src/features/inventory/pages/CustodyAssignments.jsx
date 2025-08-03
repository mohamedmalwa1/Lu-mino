import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";

import { listCustodyAssignments, deleteCustodyAssignment } from "../../../api/inventory";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

export default function CustodyAssignments() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmID, setConfirmID] = useState(null);
  const [search, setSearch] = useState("");

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["custodyAssignments"],
    queryFn: listCustodyAssignments,
  });

  const filtered = assignments.filter((a) =>
    (a.item_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (a.staff_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (a.student_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const rows = filtered.map((a, idx) => ({
    ...a,
    idx: idx + 1,
    assigned_to: a.staff_name || a.student_name,
    assigned_on: new Date(a.assigned_on).toLocaleDateString(),
    return_date: a.return_date ? new Date(a.return_date).toLocaleDateString() : "N/A",
    _actions: (
      <div className="flex gap-4">
        <button
          className="text-blue-600 hover:underline font-semibold"
          onClick={() => navigate(`/inventory/custody/${a.id}`)}
        >
          Edit
        </button>
        <button
          className="text-red-600 hover:underline font-semibold"
          onClick={() => setConfirmID(a.id)}
        >
          Delete
        </button>
      </div>
    ),
  }));

  const columns = [
    { key: "idx", label: "#" },
    { key: "item_name", label: "Item" },
    { key: "assigned_to", label: "Assigned To" },
    { key: "quantity", label: "Quantity" },
    { key: "assigned_on", label: "Assigned On" },
    { key: "return_date", label: "Return Date" },
    { key: "_actions", label: "Actions" },
  ];

  const { mutate: removeOne } = useMutation({
    mutationFn: deleteCustodyAssignment,
    onSuccess: () => {
      toast.success("Assignment deleted");
      qc.invalidateQueries({ queryKey: ["custodyAssignments"] });
      setConfirmID(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  const removeMany = async (ids) => {
    if (!window.confirm(`Delete ${ids.length} assignments?`)) return;
    try {
      await Promise.all(ids.map(deleteCustodyAssignment));
      toast.success("Assignments deleted");
      qc.invalidateQueries({ queryKey: ["custodyAssignments"] });
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
            <h2 className="text-2xl font-semibold">Custody Assignments</h2>
            <button
              onClick={() => navigate("/inventory/custody/new")}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus /> Assign Item
            </button>
          </div>

          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by item, staff, or student…"
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
          title="Delete Assignment?"
          onCancel={() => setConfirmID(null)}
          onConfirm={() => removeOne(confirmID)}
        >
          This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}

