import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { createDocument, updateDocument, listStudents } from "../../../api/students";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  student: yup.number().required("Student is required"),
  doc_type: yup.string().required("Document type is required"),
  issue_date: yup.date().required("Issue date is required"),
  expiration_date: yup.date().required("Expiration date is required"), // <-- CHANGED
  file: yup.mixed().test("fileRequired", "A file is required", (value, context) => {
    const isNew = context.options.context?.isNew;
    if (isNew) { return value && value.length > 0; }
    return true;
  }),
});

export default function DocumentForm({ initialData, onSaved }) {
  const queryClient = useQueryClient();
  const isNew = !initialData;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    context: { isNew },
  });
  
  const { data: students = [], isLoading: loadingStudents } = useQuery({ queryKey: ["students"], queryFn: listStudents });
  
  useEffect(() => {
    if (initialData) {
        reset({ ...initialData, issue_date: new Date(initialData.issue_date), expiration_date: initialData.expiration_date ? new Date(initialData.expiration_date) : null, file: null });
    } else {
        reset({ doc_type: 'ID' });
    }
  }, [initialData, reset]);

  const { mutate: saveDocument, isPending } = useMutation({
    mutationFn: (data) => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (key === 'file' && value && value[0]) { formData.append(key, value[0]); } 
          else if (value instanceof Date) { formData.append(key, value.toISOString().split('T')[0]); } 
          else if (value) { formData.append(key, value); }
        });
        const promise = isNew ? createDocument(formData) : updateDocument(initialData.id, formData);
        return toast.promise(promise, { loading: 'Saving...', success: 'Document saved!', error: 'Save failed.' });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["documents"] }); onSaved(); },
  });

  return (
    <form onSubmit={handleSubmit(saveDocument)} className="p-6 space-y-4 w-[36rem]">
      <h2 className="text-xl font-semibold">{isNew ? "Add" : "Edit"} Document</h2>
      <div><label className="font-medium">Student *</label>{loadingStudents ? <Spinner/> : (<select {...register("student")} className="input"><option value="">— Select Student —</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>)}{errors.student && <p className="text-red-500 text-xs mt-1">{errors.student.message}</p>}</div>
      <div><label className="font-medium">Document Type *</label><select {...register("doc_type")} className="input"><option value="BIRTH_CERT">Birth Certificate</option><option value="ID">ID / Passport</option><option value="PARENTS_DOC">Parents Doc</option><option value="SCHOOL_CERT">School Cert</option></select></div>
      <div><label className="font-medium">File *</label><input type="file" {...register("file")} className="input" />{errors.file && <p className="text-red-500 text-xs mt-1">{errors.file.message}</p>}</div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="font-medium">Issue Date *</label><Controller name="issue_date" control={control} render={({field}) => <DatePicker {...field} className="input w-full" dateFormat="yyyy-MM-dd" selected={field.value} onChange={(date) => field.onChange(date)}/>}/>{errors.issue_date && <p className="text-red-500 text-xs mt-1">{errors.issue_date.message}</p>}</div>
        <div><label className="font-medium">Expiration Date *</label><Controller name="expiration_date" control={control} render={({field}) => <DatePicker {...field} className="input w-full" dateFormat="yyyy-MM-dd" selected={field.value} onChange={(date) => field.onChange(date)} placeholderText="Required"/>}/>{errors.expiration_date && <p className="text-red-500 text-xs mt-1">{errors.expiration_date.message}</p>}</div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" className="btn-secondary" onClick={onSaved}>Cancel</button><button type="submit" disabled={isPending} className="btn-primary">{isPending ? "Saving…" : "Save"}</button></div>
    </form>
  );
}
