import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";
import { FiSearch, FiPlus } from "react-icons/fi";
import cx from "classnames";
import { listMedicalRecords, deleteMedicalRecord } from "../../../api/students";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import Drawer from "../../../components/ui/Drawer";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import MedicalForm from "./MedicalForm";

export default function MedicalRecords() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmID, setConfirmID] = useState(null);
  const [search, setSearch] = useState("");

  const { data: records = [], isLoading } = useQuery({ queryKey: ["medicalRecords"], queryFn: listMedicalRecords });

  const { mutate: removeOne } = useMutation({
    mutationFn: deleteMedicalRecord,
    onSuccess: () => { toast.success("Record deleted"); queryClient.invalidateQueries({ queryKey: ["medicalRecords"] }); setConfirmID(null); },
    onError: () => toast.error("Delete failed"),
  });
  
  const onSaved = () => { setDrawerOpen(false); queryClient.invalidateQueries({ queryKey: ["medicalRecords"] }); };
  
  const handleBulkDelete = (ids) => {
    toast.promise(Promise.all(ids.map(deleteMedicalRecord)), {
      loading: "Deleting records...",
      success: "Records deleted!",
      error: "Failed to delete.",
    }).then(() => { queryClient.invalidateQueries({ queryKey: ["medicalRecords"] }); });
  };

  const filtered = records.filter(r => (r.student_name || "").toLowerCase().includes(search.toLowerCase()));

  const rows = filtered.map((r) => ({
    ...r,
    date: new Date(r.date).toLocaleDateString(),
    is_urgent_status: (
      <span className={cx("px-2 py-1 text-xs font-semibold rounded-full", {
          "bg-red-100 text-red-800": r.is_urgent,
          "bg-gray-100 text-gray-800": !r.is_urgent,
        })}>
        {r.is_urgent ? "Yes" : "No"}
      </span>
    ),
    _actions: (
      <div className="flex gap-3"><button className="text-blue-600 hover:underline" onClick={() => { setEditing(r); setDrawerOpen(true); }}>Edit</button><button className="text-red-600 hover:underline" onClick={() => setConfirmID(r.id)}>Delete</button></div>
    )
  }));

  const columns = [
    { key: "student_name", label: "Student" }, { key: "date", label: "Date" },
    { key: "record_type_display", label: "Type" }, { key: "is_urgent_status", label: "Urgent" },
    { key: "_actions", label: "Actions" },
  ];

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6"><div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center"><h2 className="text-2xl font-semibold">Medical Records</h2><button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="btn-primary flex items-center gap-2"><FiPlus /> Add Record</button></div>
        <div className="relative w-full max-w-lg"><FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student name..." className="input w-full pl-12" /></div>
        {isLoading ? <SkeletonTable /> : <DataTable columns={columns} rows={rows} onBulkDelete={handleBulkDelete} />}
      </div></div>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} width="36rem">{drawerOpen && <MedicalForm initialData={editing} onSaved={onSaved} />}</Drawer>
      {confirmID && (<ConfirmDialog title="Delete Record?" onCancel={() => setConfirmID(null)} onConfirm={() => removeOne(confirmID)}>This action cannot be undone.</ConfirmDialog>)}
    </>
  );
}
