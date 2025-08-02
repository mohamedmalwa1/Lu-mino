import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiArrowLeft } from "react-icons/fi";
import cx from "classnames";

import { getTreasury, listTreasuryTransactions } from "../../../api/finance";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import Spinner from "../../../components/ui/Spinner";

export default function TreasuryTransactions() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: treasury, isLoading: isLoadingTreasury } = useQuery({
      queryKey: ["treasury", id],
      queryFn: () => getTreasury(id),
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["treasuryTransactions", id],
    queryFn: () => listTreasuryTransactions(id),
    enabled: !!id,
  });

  const transactionColumns = [
    { key: "date", label: "Date" },
    { key: "description", label: "Description" },
    { key: "reference", label: "Reference" },
    {
      key: "amount",
      label: "Amount",
      render: (row) => (
        <span className={cx({
            "text-green-600": row.is_inflow,
            "text-red-600": !row.is_inflow,
        })}>
          {row.is_inflow ? "+" : "-"} {parseFloat(row.amount).toFixed(2)}
        </span>
      ),
    },
  ];

  const transactionRows = transactions.map((t) => ({
    ...t,
    date: new Date(t.date).toLocaleDateString(),
  }));

  if (isLoadingTreasury) {
      return <Spinner />;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
            <button 
                onClick={() => navigate("/finance/treasuries")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-semibold"
            >
                <FiArrowLeft />
                Back to Treasury Accounts
            </button>
            
            <div className="border-b pb-4">
                <h2 className="text-2xl font-semibold">{treasury?.name}</h2>
                <p className="text-gray-500">Current Balance: ${parseFloat(treasury?.balance).toFixed(2)}</p>
            </div>

            <h3 className="font-semibold text-lg">Transaction History</h3>
            {isLoadingTransactions ? (
                <SkeletonTable />
            ) : (
                <DataTable columns={transactionColumns} rows={transactionRows} />
            )}
        </div>
    </div>
  );
}

