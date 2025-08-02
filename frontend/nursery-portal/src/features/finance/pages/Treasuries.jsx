import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiPlus, FiEye } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import { listTreasuries } from "../../../api/finance";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";

export default function Treasuries() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: treasuries = [], isLoading } = useQuery({
    queryKey: ["treasuries"],
    queryFn: listTreasuries,
  });

  const filtered = treasuries.filter((t) =>
    (t.name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const rows = filtered.map((t, idx) => ({
    ...t,
    idx: idx + 1,
    balance: parseFloat(t.balance).toFixed(2),
    _actions: (
      <div className="flex gap-4">
        <button
          className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
          onClick={() => navigate(`/finance/treasuries/${t.id}/transactions`)}
        >
          <FiEye /> View
        </button>
        <button
          className="text-gray-600 hover:underline font-semibold"
          onClick={() => navigate(`/finance/treasuries/${t.id}`)}
        >
          Edit
        </button>
      </div>
    ),
  }));

  const columns = [
    { key: "idx", label: "#" },
    { key: "name", label: "Account Name" },
    { key: "balance", label: "Current Balance" },
    { key: "_actions", label: "Actions" },
  ];

  return (
    <>
      <Toaster position="top-right" />
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Treasury Accounts</h2>
            <button
              onClick={() => navigate("/finance/treasuries/new")}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus /> Add Account
            </button>
          </div>

          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by account name…"
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

