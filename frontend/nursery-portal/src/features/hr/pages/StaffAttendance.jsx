import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";
import cx from "classnames";

import { listStaffAttendance, deleteStaffAttendance } from "../../../api/hr";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

export default function StaffAttendance() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmID, setConfirmID] = useState(null);
  const [search, setSearch] = useState("");

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ["staffAttendance"],
    queryFn: listStaffAttendance,
  });

  const filtered = attendance.filter((a) =>
    (a.staff_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const rows = filtered.map((a, idx) => ({
    ...a,
    idx: idx + 1,
    date: new Date(a.date).toLocaleDateString(),
    status: (
      <span
        className={cx("px-2 py-1 text-xs font-semibold rounded-full", {
          "bg-green-100 text-green-800": a.status === "PRESENT",
          "bg-red-100 text-red-800": a.status === "ABSENT",
          "bg-yellow-100 text-yellow-800": a.status === "SICK",
          "bg-blue-100 text-blue-800": a.status === "LEAVE",
        })}
      >
        {a.status}
      </span>
    ),
    _actions: (
      <div className="flex gap-4">
        <button
          className="text-blue-600 hover:underline font-semibold"
          onClick={() => navigate(`/hr/attendance/${a.id}`)}
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
    { key: "date", label: "Date" },
    { key: "staff_name", label: "Staff Member" },
    { key: "status", label: "Status" },
    { key: "note", label: "Note" },
    { key: "_actions", label: "Actions" },
  ];

  const { mutate: removeOne } = useMutation({
    mutationFn: deleteStaffAttendance,
    onSuccess: () => {
      toast.success("Attendance record deleted");
      qc.invalidateQueries({ queryKey: ["staffAttendance"] });
      setConfirmID(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  const removeMany = async (ids) => {
    if (!window.confirm(`Delete ${ids.length} records?`)) return;
    try {
      await Promise.all(ids.map(deleteStaffAttendance));
      toast.success("Records deleted");
      qc.invalidateQueries({ queryKey: ["staffAttendance"] });
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
            <h2 className="text-2xl font-semibold">Staff Attendance</h2>
            <button
              onClick={() => navigate("/hr/attendance/new")}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus /> Add Record
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
          title="Delete Attendance Record?"
          onCancel={() => setConfirmID(null)}
          onConfirm={() => removeOne(confirmID)}
        >
          This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}

