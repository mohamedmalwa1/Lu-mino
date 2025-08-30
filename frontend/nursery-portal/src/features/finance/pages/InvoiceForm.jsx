import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiDownload, FiMail, FiSave, FiX } from "react-icons/fi";

import { 
  createInvoice, 
  updateInvoice, 
  getInvoice, 
  downloadInvoicePDF, 
  emailInvoice 
} from "../../../api/finance";
import { listStudents } from "../../../api/students";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  student: yup.number().required("Student is required"),
  amount: yup.number().positive("Amount must be positive").required("Amount is required"),
  issue_date: yup.date().required("Issue date is required"),
  due_date: yup.date()
    .required("Due date is required")
    .min(yup.ref('issue_date'), "Due date must be after issue date"),
  status: yup.string().oneOf(["DRAFT", "SENT", "PAID", "CANCELLED"]).required(),
  description: yup.string().nullable(),
});

const blank = {
  student: "",
  amount: "",
  issue_date: new Date(),
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  status: "DRAFT",
  description: "",
};

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const qc = useQueryClient();
  const isNew = !id;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: blank,
  });

  const selectedStudentId = watch("student");

  const { data: invoice, isLoading: isLoadingInvoice } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => getInvoice(id),
    enabled: !isNew,
  });

  useEffect(() => {
    if (invoice) {
      reset({
        ...invoice,
        issue_date: new Date(invoice.issue_date),
        due_date: new Date(invoice.due_date),
      });
    }
  }, [invoice, reset]);

  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students"],
    queryFn: listStudents,
  });

  // Get selected student details
  const selectedStudent = students?.find(s => s.id.toString() === selectedStudentId?.toString());

  // PDF Download handler
  const downloadPDF = async () => {
    try {
      toast.loading("Generating PDF...");
      const blob = await downloadInvoicePDF(id);
      const url = URL.createObjectURL(new Blob([blob]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${invoice?.invoice_number || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.dismiss();
      if (error.response?.status === 404) {
        toast.error("Invoice not found");
      } else if (error.response?.status === 500) {
        toast.error("Failed to generate PDF");
      } else {
        toast.error("Failed to download PDF");
      }
    }
  };

  // Email handler - automatically uses student email
  const sendEmail = async () => {
    try {
      toast.loading("Sending email...");
      await emailInvoice(id);
      toast.dismiss();
      toast.success("Invoice email sent successfully");
    } catch (error) {
      console.error("Email error:", error);
      toast.dismiss();
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.response?.status === 400) {
        toast.error("No email address found for this student");
      } else if (error.response?.status === 500) {
        toast.error("Failed to send email");
      } else {
        toast.error("Failed to send email");
      }
    }
  };

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        issue_date: data.issue_date.toISOString().split("T")[0],
        due_date: data.due_date.toISOString().split("T")[0],
      };
      return isNew ? createInvoice(payload) : updateInvoice(id, payload);
    },
    onSuccess: () => {
      toast.success(`Invoice ${isNew ? 'created' : 'updated'} successfully!`);
      qc.invalidateQueries({ queryKey: ["invoices"] });
      navigate("/finance/invoices");
    },
    onError: (err) => {
      console.error("Save error:", err);
      toast.error("Failed to save invoice. Please try again.");
    },
  });

  if (!isNew && isLoadingInvoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 mx-auto max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          {isNew ? "Create New Invoice" : "Edit Invoice"}
        </h2>
        {!isNew && invoice?.invoice_number && (
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Invoice #: {invoice.invoice_number}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit(save)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Selection */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">Student *</label>
            {isLoadingStudents ? (
              <div className="input w-full h-10 bg-gray-100 animate-pulse rounded"></div>
            ) : (
              <select 
                {...register("student")} 
                className="input w-full"
                disabled={isPending}
              >
                <option value="">— Select Student —</option>
                {students?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.guardian_email ? `(${s.guardian_email})` : ''}
                  </option>
                ))}
              </select>
            )}
            {errors.student && (
              <p className="text-red-600 text-sm mt-1">{errors.student.message}</p>
            )}
            {selectedStudent && !selectedStudent.guardian_email && (
              <p className="text-yellow-600 text-sm mt-1">
                Warning: This student has no email address configured
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">Amount *</label>
            <input 
              type="number" 
              step="0.01" 
              {...register("amount")} 
              className="input w-full"
              placeholder="e.g., 500.00"
              disabled={isPending}
            />
            {errors.amount && (
              <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Issue Date */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">Issue Date *</label>
            <Controller 
              control={control} 
              name="issue_date" 
              render={({ field }) => (
                <DatePicker 
                  className="input w-full"
                  selected={field.value}
                  onChange={field.onChange}
                  dateFormat="yyyy-MM-dd"
                  disabled={isPending}
                  placeholderText="Select issue date"
                />
              )}
            />
            {errors.issue_date && (
              <p className="text-red-600 text-sm mt-1">{errors.issue_date.message}</p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">Due Date *</label>
            <Controller 
              control={control} 
              name="due_date" 
              render={({ field }) => (
                <DatePicker 
                  className="input w-full"
                  selected={field.value}
                  onChange={field.onChange}
                  dateFormat="yyyy-MM-dd"
                  disabled={isPending}
                  placeholderText="Select due date"
                />
              )}
            />
            {errors.due_date && (
              <p className="text-red-600 text-sm mt-1">{errors.due_date.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">Status *</label>
            <select 
              {...register("status")} 
              className="input w-full"
              disabled={isPending}
            >
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block mb-2 font-medium text-gray-700">Description</label>
          <textarea 
            {...register("description")} 
            rows={4} 
            className="input w-full"
            placeholder="Optional notes about this invoice..."
            disabled={isPending}
          />
        </div>

        {/* Student Email Info */}
        {selectedStudent && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Student Information</h3>
            <p className="text-sm text-blue-700">
              <strong>Name:</strong> {selectedStudent.name}
            </p>
            <p className="text-sm text-blue-700">
              <strong>Guardian Email:</strong> {selectedStudent.guardian_email || "Not provided"}
            </p>
            <p className="text-sm text-blue-700">
              <strong>Phone:</strong> {selectedStudent.guardian_phone || "Not provided"}
            </p>
            {!selectedStudent.guardian_email && (
              <p className="text-sm text-yellow-700 mt-2">
                ⚠️ Email functionality will not work until an email address is added for this student.
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <button 
            type="button" 
            className="btn-secondary flex items-center gap-2 px-4 py-2"
            onClick={() => navigate("/finance/invoices")}
            disabled={isPending}
          >
            <FiX size={16} /> Cancel
          </button>
          
          {/* PDF and Email buttons for edit mode */}
          {!isNew && (
            <>
              <button 
                type="button" 
                onClick={downloadPDF} 
                className="btn-secondary flex items-center gap-2 px-4 py-2"
                disabled={isPending}
              >
                <FiDownload size={16} /> Download PDF
              </button>
              <button 
                type="button" 
                onClick={sendEmail} 
                className="btn-secondary flex items-center gap-2 px-4 py-2"
                disabled={isPending || !selectedStudent?.guardian_email}
                title={!selectedStudent?.guardian_email ? "Student has no email address" : ""}
              >
                <FiMail size={16} /> Email Invoice
              </button>
            </>
          )}
          
          <button 
            type="submit" 
            disabled={isPending || (!isNew && !isDirty)}
            className="btn-primary flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave size={16} />
            {isPending ? "Saving…" : isNew ? "Create Invoice" : "Update Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}
