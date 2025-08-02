import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { 
    createStaffDocument, 
    updateStaffDocument, 
    getStaffDocument,
    listStaff,
} from "../../../api/hr";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  staff: yup.number().required("Staff member is required"),
  doc_type: yup.string().required("Document type is required"),
  issue_date: yup.date().required("Issue date is required"),
  expiration_date: yup.date().nullable(),
  file: yup.mixed().test("fileRequired", "File is required", (value) => {
      return value && value.length > 0;
  }),
});

export default function StaffDocumentForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const qc = useQueryClient();
    const isNew = !id;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const { data: document, isLoading: isLoadingDocument } = useQuery({
      queryKey: ["staffDocument", id],
      queryFn: () => getStaffDocument(id),
      enabled: !isNew,
  });
  
  const { data: staff = [], isLoading: isLoadingStaff } = useQuery({
      queryKey: ["staff"],
      queryFn: () => listStaff({ is_active: true }),
  });

  useEffect(() => {
    if (document) {
        reset({ 
            ...document, 
            issue_date: new Date(document.issue_date),
            expiration_date: document.expiration_date ? new Date(document.expiration_date) : null,
            file: null, // Do not pre-fill file input
        });
    }
  }, [document, reset]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => {
      const formData = new FormData();
      formData.append("staff", data.staff);
      formData.append("doc_type", data.doc_type);
      formData.append("issue_date", data.issue_date.toISOString().split("T")[0]);
      if (data.expiration_date) {
        formData.append("expiration_date", data.expiration_date.toISOString().split("T")[0]);
      }
      if (data.file[0]) {
        formData.append("file", data.file[0]);
      }
      
      return isNew ? createStaffDocument(formData) : updateStaffDocument(id, formData);
    },
    onSuccess: () => { 
        toast.success(`Document ${isNew ? 'uploaded' : 'updated'}!`);
        qc.invalidateQueries({ queryKey: ["staffDocuments"] });
        navigate("/hr/documents");
    },
    onError: (err) => { 
        console.error("Save failed:", err.response?.data);
        toast.error("Failed to save document."); 
    },
  });

  if (!isNew && isLoadingDocument) {
      return <Spinner />;
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-6">
            {isNew ? "Add Staff Document" : "Edit Staff Document"}
        </h2>
        <form onSubmit={handleSubmit(save)} className="space-y-6 max-w-2xl">
            
            <div>
                <label className="block mb-1 font-medium">Staff Member *</label>
                {isLoadingStaff ? <Spinner /> : (
                    <select {...register("staff")} className="input w-full">
                        <option value="">— Select Staff —</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                )}
                {errors.staff && <p className="text-red-600 text-sm mt-1">{errors.staff.message}</p>}
            </div>

            <div>
                <label className="block mb-1 font-medium">Document Type *</label>
                <select {...register("doc_type")} className="input w-full">
                    <option value="ID">ID Card</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="CERTIFICATE">Certificate</option>
                    <option value="OTHER">Other</option>
                </select>
                {errors.doc_type && <p className="text-red-600 text-sm mt-1">{errors.doc_type.message}</p>}
            </div>

            <div>
                <label className="block mb-1 font-medium">Upload File *</label>
                <input type="file" {...register("file")} className="input w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {errors.file && <p className="text-red-600 text-sm mt-1">{errors.file.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block mb-1 font-medium">Issue Date *</label>
                    <Controller control={control} name="issue_date" render={({ field }) => (
                        <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
                    )}/>
                    {errors.issue_date && <p className="text-red-600 text-sm mt-1">{errors.issue_date.message}</p>}
                </div>
                <div>
                    <label className="block mb-1 font-medium">Expiration Date (Optional)</label>
                    <Controller control={control} name="expiration_date" render={({ field }) => (
                        <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
                    )}/>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" className="btn-secondary" onClick={() => navigate("/hr/documents")}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-60">
                {isPending ? "Saving…" : "Save Document"}
                </button>
            </div>
        </form>
    </div>
  );
}

