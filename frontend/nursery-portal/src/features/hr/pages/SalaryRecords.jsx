import { useState } from "react";
import { FiSearch, FiX, FiDollarSign } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Toaster, toast } from "react-hot-toast";
import cx from "classnames";

import { listSalaryRecords, updateSalaryRecord } from "../../../api/hr";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

export default function SalaryRecords() {
  const [search, setSearch] = useState("");
  const [markPaidId, setMarkPaidId] = useState(null);
  const qc = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["salaryRecords"],
    queryFn: listSalaryRecords,
  });

  const { mutate: markAsPaid } = useMutation({
    mutationFn: (id) => updateSalaryRecord(id, { paid: true }),
    onSuccess: () => {
      toast.success("Salary marked as paid");
      qc.invalidateQueries({ queryKey: ["salaryRecords"] });
      setMarkPaidId(null);
    },
    onError: () => toast.error("Failed to mark as paid"),
  });

  // Debug: Check what the API actually returns
  console.log("Salary records API response:", records);

  const getStaffName = (record) => {
    // Try different possible field structures
    if (record.staff_full_name) return record.staff_full_name;
    if (record.staff_name) return record.staff_name;
    if (record.staff?.full_name) return record.staff.full_name;
    if (record.staff?.first_name && record.staff?.last_name) {
      return `${record.staff.first_name} ${record.staff.last_name}`;
    }
    return "Unknown Staff";
  };

  const filtered = records.filter((r) =>
    getStaffName(r).toLowerCase().includes(search.toLowerCase())
  );

  const rows = filtered.map((r, idx) => ({
    ...r,
    idx: idx + 1,
    staff_name: getStaffName(r),
    month: new Date(r.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
    gross: parseFloat(r.gross || r.gross_salary || 0).toFixed(2),
    deduct: parseFloat(r.deduct || r.deductions || 0).toFixed(2),
    net: parseFloat(r.net || r.net_salary || 0).toFixed(2),
    paid: r.paid || r.is_paid || false,
    _paidDisplay: (
      <div className="flex items-center gap-2">
        <span
          className={cx("px-2 py-1 text-xs font-semibold rounded-full", {
            "bg-green-100 text-green-800": r.paid || r.is_paid,
            "bg-red-100 text-red-800": !(r.paid || r.is_paid),
          })}
        >
          {(r.paid || r.is_paid) ? "Paid" : "Unpaid"}
        </span>
        {!(r.paid || r.is_paid) && (
          <button
            onClick={() => setMarkPaidId(r.id)}
            className="text-green-600 hover:text-green-800"
            title="Mark as paid"
          >
            <FiDollarSign />
          </button>
        )}
      </div>
    ),
  }));

  const columns = [
    { key: "idx", label: "#" },
    { key: "staff_name", label: "Staff Member" },
    { key: "month", label: "Month" },
    { key: "gross", label: "Gross Salary", align: "right" },
    { key: "deduct", label: "Deductions", align: "right" },
    { key: "net", label: "Net Salary", align: "right" },
    { key: "_paidDisplay", label: "Status" },
  ];

  return (
    <>
      <Toaster position="top-right" />
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Salary Records</h2>
            <div className="text-sm text-gray-600">
              Total: {filtered.length} records
              {filtered.length > 0 && (
                <span className="ml-4">
                  Unpaid: {filtered.filter(r => !(r.paid || r.is_paid)).length}
                </span>
              )}
            </div>
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

          {isLoading ? <SkeletonTable /> : <DataTable columns={columns} rows={rows} />}
        </div>
      </div>

      {markPaidId && (
        <ConfirmDialog
          title="Mark Salary as Paid?"
          onCancel={() => setMarkPaidId(null)}
          onConfirm={() => markAsPaid(markPaidId)}
        >
          This will mark the salary record as paid. This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}
