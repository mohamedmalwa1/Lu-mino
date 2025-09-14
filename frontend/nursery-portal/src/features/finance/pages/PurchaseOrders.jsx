import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiPlus, FiSearch, FiDownload } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { listPurchaseOrders, downloadPurchaseOrderPDF } from "../../../api/finance";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: orders = [], isLoading } = useQuery({ queryKey: ["purchaseOrders"], queryFn: listPurchaseOrders });

  const handleDownloadPDF = async (id, po_number) => {
    const toastId = toast.loading("Generating PDF...");
    try {
        const blob = await downloadPurchaseOrderPDF(id);
        const url = URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `PO-${po_number}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        toast.success("PDF Downloaded!", { id: toastId });
    } catch (error) {
        toast.error("Failed to download PDF.", { id: toastId });
    }
  };

  const rows = orders
    .filter(o => (o.vendor_name || "").toLowerCase().includes(search.toLowerCase()))
    .map((o) => ({
      ...o,
      order_date: new Date(o.order_date).toLocaleDateString(),
      total: parseFloat(o.total).toFixed(2),
      received_status: o.received ? "Yes" : "No",
      _actions: (
          <div className="flex gap-2">
            <button className="text-blue-600 hover:underline" onClick={() => navigate(`/finance/purchase-orders/${o.id}`)}>Edit</button>
            <button className="text-green-600 hover:underline flex items-center gap-1" onClick={() => handleDownloadPDF(o.id, o.po_number)}>
                <FiDownload size={14}/> PDF
            </button>
          </div>
      ),
  }));

  const columns = [
    { key: "po_number", label: "PO Number" },
    { key: "vendor_name", label: "Vendor" },
    { key: "item_name", label: "Item" },
    { key: "order_date", label: "Order Date" },
    { key: "total", label: "Total Amount" },
    { key: "received_status", label: "Received?" },
    { key: "_actions", label: "Actions" },
  ];

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Procurement / Purchase Orders</h2>
            <button onClick={() => navigate("/finance/purchase-orders/new")} className="btn-primary flex items-center gap-2">
              <FiPlus /> New Purchase Order
            </button>
          </div>
          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by vendor..." className="input w-full pl-12" />
          </div>
          {isLoading ? <SkeletonTable /> : <DataTable columns={columns} rows={rows} />}
        </div>
      </div>
    </>
  );
}
