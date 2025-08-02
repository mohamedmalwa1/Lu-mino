import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";
import cx from "classnames";

import { listVacations, deleteVacation } from "../../../api/hr";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

export default function Vacations() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmID, setConfirmID] = useState(null);
  const [search, setSearch] = useState("");

  const { data: vacations = [], isLoading } = useQuery({
    queryKey: ["vacations"],
    queryFn: listVacations,
  });

  const filtered = vacations.filter((v) =>
    (v.staff_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const rows = filtered.map((v, idx) => ({
    ...v,
    idx: idx + 1,
    start_date: new Date(v.start_date).toLocaleDateString(),
    end_date: new Date(v.end_date).toLocaleDateString(),
    approved: (
      <span
        className={cx("px-2 py-1 text-xs font-semibold rounded-full", {
          "bg-green-100 text-green-800": v.approved,
          "bg-yellow-100 text-yellow-800": !v.approved,
        })}
      >
        {v.approved ? "Approved" : "Pending"}
      </span>
    ),
    _actions: (
      <div className="flex gap-4">
        <button
          className="text-blue-600 hover:underline font-semibold"
          onClick={() => navigate(`/hr/vacations/${v.id}`)}
        >
          Edit
        </button>
        <button
          className="text-red-600 hover:underline font-semibold"
          onClick={() => setConfirmID(v.id)}
        >
          Delete
        </button>
      </div>
    ),
  }));

  const columns = [
    { key: "idx", label: "#" },
    { key: "staff_name", label: "Staff Member" },
    { key: "start_date", label: "Start Date" },
    { key: "end_date", label: "End Date" },
    { key: "approved", label: "Status" },
    { key: "note", label: "Note" },
    { key: "_actions", label: "Actions" },
  ];

  const { mutate: removeOne } = useMutation({
    mutationFn: deleteVacation,
    onSuccess: () => {
      toast.success("Vacation deleted");
      qc.invalidateQueries({ queryKey: ["vacations"] });
      setConfirmID(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  const removeMany = async (ids) => {
    if (!window.confirm(`Delete ${ids.length} records?`)) return;
    try {
      await Promise.all(ids.map(deleteVacation));
      toast.success("Records deleted");
      qc.invalidateQueries({ queryKey: ["vacations"] });
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
            <h2 className="text-2xl font-semibold">Vacation Requests</h2>
            <button
              onClick={() => navigate("/hr/vacations/new")}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus /> Add Request
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
          title="Delete Vacation Request?"
          onCancel={() => setConfirmID(null)}
          onConfirm={() => removeOne(confirmID)}
        >
          This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}

