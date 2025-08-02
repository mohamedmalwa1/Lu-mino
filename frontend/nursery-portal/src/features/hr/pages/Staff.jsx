import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";
import cx from "classnames";

import { listStaff, deleteStaff } from "../../../api/hr";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

export default function Staff() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmID, setConfirmID] = useState(null);
  const [search, setSearch] = useState("");

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: listStaff,
  });

  const filtered = staff.filter((s) =>
    (s.full_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (s.role?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const rows = filtered.map((s, idx) => ({
    ...s,
    idx: idx + 1,
    hire_date: new Date(s.hire_date).toLocaleDateString(),
    id_expiry: new Date(s.id_expiry).toLocaleDateString(), // Format expiry date
    status: ( // Render a status badge
      <span
        className={cx("px-2 py-1 text-xs font-semibold rounded-full", {
          "bg-green-100 text-green-800": s.is_active,
          "bg-red-100 text-red-800": !s.is_active,
        })}
      >
        {s.is_active ? "Active" : "Inactive"}
      </span>
    ),
    _actions: (
      <div className="flex gap-4">
        <button
          className="text-blue-600 hover:underline font-semibold"
          onClick={() => navigate(`/hr/staff/${s.id}`)}
        >
          Edit
        </button>
        <button
          className="text-red-600 hover:underline font-semibold"
          onClick={() => setConfirmID(s.id)}
        >
          Delete
        </button>
      </div>
    ),
  }));

  const columns = [
    { key: "idx", label: "#" },
    { key: "full_name", label: "Name" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" }, // New Column
    { key: "id_expiry", label: "ID Expiry" }, // New Column
    { key: "hire_date", label: "Hire Date" },
    { key: "_actions", label: "Actions" },
  ];

  const { mutate: removeOne } = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      toast.success("Staff member deleted");
      qc.invalidateQueries({ queryKey: ["staff"] });
      setConfirmID(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  const removeMany = async (ids) => {
    if (!window.confirm(`Delete ${ids.length} staff members?`)) return;
    try {
      await Promise.all(ids.map(deleteStaff));
      toast.success("Staff members deleted");
      qc.invalidateQueries({ queryKey: ["staff"] });
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
            <h2 className="text-2xl font-semibold">Staff Management</h2>
            <button
              onClick={() => navigate("/hr/staff/new")}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus /> Add Staff
            </button>
          </div>

          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or role…"
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
          title="Delete Staff Member?"
          onCancel={() => setConfirmID(null)}
          onConfirm={() => removeOne(confirmID)}
        >
          This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}

