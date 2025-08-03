import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";

import { listPayrollContracts, deletePayrollContract } from "../../../api/hr";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

export default function PayrollContracts() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmID, setConfirmID] = useState(null);
  const [search, setSearch] = useState("");

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["payrollContracts"],
    queryFn: listPayrollContracts,
  });

  const filtered = contracts.filter((c) =>
    (c.staff_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const rows = filtered.map((c, idx) => ({
    ...c,
    idx: idx + 1,
    contract_start: new Date(c.contract_start).toLocaleDateString(),
    contract_end: c.contract_end ? new Date(c.contract_end).toLocaleDateString() : "N/A",
    base_salary: parseFloat(c.base_salary).toFixed(2),
    allowance: parseFloat(c.allowance).toFixed(2),
    _actions: (
      <div className="flex gap-4">
        <button
          className="text-blue-600 hover:underline font-semibold"
          onClick={() => navigate(`/hr/contracts/${c.id}`)}
        >
          Edit
        </button>
        <button
          className="text-red-600 hover:underline font-semibold"
          onClick={() => setConfirmID(c.id)}
        >
          Delete
        </button>
      </div>
    ),
  }));

  const columns = [
    { key: "idx", label: "#" },
    { key: "staff_name", label: "Staff Member" },
    { key: "base_salary", label: "Base Salary" },
    { key: "allowance", label: "Allowance" },
    { key: "contract_start", label: "Start Date" },
    { key: "contract_end", label: "End Date" },
    { key: "_actions", label: "Actions" },
  ];

  const { mutate: removeOne } = useMutation({
    mutationFn: deletePayrollContract,
    onSuccess: () => {
      toast.success("Contract deleted");
      qc.invalidateQueries({ queryKey: ["payrollContracts"] });
      setConfirmID(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  return (
    <>
      <Toaster position="top-right" />
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Payroll Contracts</h2>
            <button
              onClick={() => navigate("/hr/contracts/new")}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus /> Add Contract
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

          {isLoading ? <SkeletonTable /> : <DataTable columns={columns} rows={rows} />}
        </div>
      </div>

      {confirmID && (
        <ConfirmDialog
          title="Delete Contract?"
          onCancel={() => setConfirmID(null)}
          onConfirm={() => removeOne(confirmID)}
        >
          This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}

