import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiPlus, FiDownload, FiMail, FiEdit, FiTrash2 } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";
import { 
  listInvoices, 
  deleteInvoice, 
  downloadInvoicePDF, 
  emailInvoice 
} from "../../../api/finance";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

export default function Invoices() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmID, setConfirmID] = useState(null);
  const [search, setSearch] = useState("");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: listInvoices,
  });

  // PDF Download handler
  const downloadPDF = async (id, filename = `invoice_${id}.pdf`) => {
    const toastId = toast.loading("Generating PDF...");
    try {
      const blob = await downloadInvoicePDF(id);
      const url = URL.createObjectURL(new Blob([blob]));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully", { id: toastId });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download PDF", { id: toastId });
    }
  };

  // Email handler
  const sendEmail = async (id) => {
    const toastId = toast.loading("Queuing email for sending...");
    try {
      await emailInvoice(id);
      toast.success("Invoice email has been sent to the background queue", { id: toastId });
    } catch (error) {
      console.error("Email error:", error);
      toast.error("Failed to send email", { id: toastId });
    }
  };

  const filtered = invoices.filter(
    (inv) =>
      (inv.student_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.invoice_number ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.status ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const rows = filtered.map((inv, idx) => ({
    ...inv,
    idx: idx + 1,
    issue_date: new Date(inv.issue_date).toLocaleDateString(),
    due_date: new Date(inv.due_date).toLocaleDateString(),
    amount: parseFloat(inv.amount).toFixed(2),
    _actions: (
      <div className="flex gap-2 items-center">
        <button
          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
          onClick={() => navigate(`/finance/invoices/${inv.id}`)}
          title="Edit Invoice"
        >
          <FiEdit size={16} />
        </button>
        <button
          className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
          onClick={() => downloadPDF(inv.id, `invoice_${inv.invoice_number || inv.id}.pdf`)}
          title="Download PDF"
        >
          <FiDownload size={16} />
        </button>
        <button
          className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50 transition-colors"
          onClick={() => sendEmail(inv.id)}
          title="Email Invoice"
        >
          <FiMail size={16} />
        </button>
        <button
          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
          onClick={() => setConfirmID(inv.id)}
          title="Delete Invoice"
        >
          <FiTrash2 size={16} />
        </button>
      </div>
    ),
  }));

  const columns = [
    { key: "idx", label: "#", width: "50px" },
    { key: "invoice_number", label: "Invoice #", width: "120px" },
    { key: "student_name", label: "Student", width: "200px" },
    { key: "amount", label: "Amount", width: "100px" },
    { key: "issue_date", label: "Issued", width: "100px" },
    { key: "due_date", label: "Due", width: "100px" },
    { key: "status", label: "Status", width: "100px" },
    { key: "_actions", label: "Actions", width: "160px" },
  ];

  const { mutate: removeOne } = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      toast.success("Invoice deleted successfully");
      qc.invalidateQueries({ queryKey: ["invoices"] });
      setConfirmID(null);
    },
    onError: () => toast.error("Failed to delete invoice"),
  });

  return (
    <>
      <Toaster position="top-right" />
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">Invoices</h2>
            <button
              onClick={() => navigate("/finance/invoices/new")}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus size={18} /> Add Invoice
            </button>
          </div>

          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student, invoice #, or status…"
              className="input w-full pl-12"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX size={18} />
              </button>
            )}
          </div>

          {isLoading ? (
            <SkeletonTable />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              selectable={true}
            />
          )}
        </div>
      </div>

      {confirmID && (
        <ConfirmDialog
          title="Delete Invoice?"
          onCancel={() => setConfirmID(null)}
          onConfirm={() => removeOne(confirmID)}
        >
          This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}
