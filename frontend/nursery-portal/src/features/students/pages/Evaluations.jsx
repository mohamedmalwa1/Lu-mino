import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import { listEvaluations, deleteEvaluation } from "../../../api/students";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import Drawer from "../../../components/ui/Drawer";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import EvaluationForm from "./EvaluationForm";

export default function Evaluations() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmID, setConfirmID] = useState(null);
  const [search, setSearch] = useState("");

  const { data: evaluations = [], isLoading } = useQuery({ queryKey: ["evaluations"], queryFn: listEvaluations });
  
  const { mutate: removeOne } = useMutation({
    mutationFn: deleteEvaluation,
    onSuccess: () => { toast.success("Evaluation deleted"); queryClient.invalidateQueries({ queryKey: ["evaluations"] }); setConfirmID(null); },
    onError: () => toast.error("Delete failed"),
  });

  const onSaved = () => { setDrawerOpen(false); queryClient.invalidateQueries({ queryKey: ["evaluations"] }); };
  
  const handleBulkDelete = (ids) => {
    toast.promise(
      Promise.all(ids.map(deleteEvaluation)),
      {
        loading: "Deleting evaluations...",
        success: `${ids.length} evaluations deleted!`,
        error: "Failed to delete evaluations.",
      }
    ).then(() => {
        queryClient.invalidateQueries({ queryKey: ["evaluations"] });
    });
  };
  
  const filtered = evaluations.filter(e => (e.student_name || "").toLowerCase().includes(search.toLowerCase()));

  const rows = filtered.map((e) => ({ ...e, date: new Date(e.date).toLocaleDateString(), _actions: (
    <div className="flex gap-3"><button className="text-blue-600 hover:underline" onClick={() => { setEditing(e); setDrawerOpen(true); }}>Edit</button><button className="text-red-600 hover:underline" onClick={() => setConfirmID(e.id)}>Delete</button></div>
  )}));

  const columns = [ { key: "student_name", label: "Student" }, { key: "date", label: "Date" }, { key: "status_display", label: "Status" }, { key: "general_notes", label: "Notes" }, { key: "_actions", label: "Actions" }];

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6"><div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center"><h2 className="text-2xl font-semibold">Student Evaluations</h2><button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="btn-primary flex items-center gap-2"><FiPlus /> Add Evaluation</button></div>
        <div className="relative w-full max-w-lg"><FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student name..." className="input w-full pl-12" /></div>
        {isLoading ? <SkeletonTable /> : <DataTable columns={columns} rows={rows} onBulkDelete={handleBulkDelete} />}
      </div></div>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} width="36rem">{drawerOpen && <EvaluationForm initialData={editing} onSaved={onSaved} />}</Drawer>
      {confirmID && (<ConfirmDialog title="Delete Evaluation?" onCancel={() => setConfirmID(null)} onConfirm={() => removeOne(confirmID)}>This action cannot be undone.</ConfirmDialog>)}
    </>
  );
}
