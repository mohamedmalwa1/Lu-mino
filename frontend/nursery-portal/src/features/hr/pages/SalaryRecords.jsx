import { useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import cx from "classnames";

import { listSalaryRecords } from "../../../api/hr";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";

export default function SalaryRecords() {
  const [search, setSearch] = useState("");

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["salaryRecords"],
    queryFn: listSalaryRecords,
  });

  const filtered = records.filter((r) =>
    (r.staff_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const rows = filtered.map((r, idx) => ({
    ...r,
    idx: idx + 1,
    month: new Date(r.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
    gross: parseFloat(r.gross).toFixed(2),
    deduct: parseFloat(r.deduct).toFixed(2),
    net: parseFloat(r.net).toFixed(2),
    paid: (
      <span
        className={cx("px-2 py-1 text-xs font-semibold rounded-full", {
          "bg-green-100 text-green-800": r.paid,
          "bg-red-100 text-red-800": !r.paid,
        })}
      >
        {r.paid ? "Paid" : "Unpaid"}
      </span>
    ),
  }));

  const columns = [
    { key: "idx", label: "#" },
    { key: "staff_name", label: "Staff Member" },
    { key: "month", label: "Month" },
    { key: "gross", label: "Gross Salary" },
    { key: "deduct", label: "Deductions" },
    { key: "net", label: "Net Salary" },
    { key: "paid", label: "Status" },
  ];

  return (
    <>
      <Toaster position="top-right" />
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Salary Records</h2>
            {/* Note: No "Add" button as records are generated on the backend */}
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
    </>
  );
}

