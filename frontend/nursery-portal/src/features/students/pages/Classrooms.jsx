import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import { listClassrooms, deleteClassroom } from "../../../api/students";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Drawer from "../../../components/ui/Drawer";
import ClassroomForm from "./ClassroomForm";

export default function Classrooms() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmID, setConfirmID] = useState(null);
  const [search, setSearch] = useState("");

  const { data: classrooms = [], isLoading } = useQuery({ queryKey: ["classrooms"], queryFn: listClassrooms });

  const { mutate: removeOne } = useMutation({
    mutationFn: deleteClassroom,
    onSuccess: () => {
      toast.success("Classroom deleted");
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      setConfirmID(null);
    },
    onError: () => toast.error("Delete failed. Make sure no students are assigned."),
  });

  const onSaved = () => {
    setDrawerOpen(false);
    queryClient.invalidateQueries({ queryKey: ["classrooms"] });
  };

  // --- ADDED THIS FUNCTION ---
  const handleBulkDelete = (ids) => {
    toast.promise(
      Promise.all(ids.map(deleteClassroom)),
      {
        loading: "Deleting classrooms...",
        success: `${ids.length} classrooms deleted!`,
        error: "Failed to delete one or more classrooms.",
      }
    ).then(() => {
        queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    });
  };

  const filtered = classrooms.filter(c =>
    (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.teacher_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const rows = filtered.map((c, idx) => ({ ...c, idx: idx + 1, teacher_name: c.teacher_name || "N/A", _actions: (
    <div className="flex gap-3"><button className="text-blue-600 hover:underline" onClick={() => { setEditing(c); setDrawerOpen(true); }}>Edit</button><button className="text-red-600 hover:underline" onClick={() => setConfirmID(c.id)}>Delete</button></div>
  )}));

  const columns = [ { key: "name", label: "Name" }, { key: "capacity", label: "Capacity" }, { key: "teacher_name", label: "Teacher" }, { key: "_actions", label: "Actions" }];

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6"><div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center"><h2 className="text-2xl font-semibold">Classroom Management</h2><button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="btn-primary flex items-center gap-2"><FiPlus /> Add Classroom</button></div>
        <div className="relative w-full max-w-lg"><FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or teacher…" className="input w-full pl-12" /></div>
        
        {/* --- ADDED onBulkDelete PROP HERE --- */}
        {isLoading ? <SkeletonTable /> : <DataTable columns={columns} rows={rows} onBulkDelete={handleBulkDelete} />}
      
      </div></div>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} width="32rem">{drawerOpen && <ClassroomForm initialData={editing} onSaved={onSaved} />}</Drawer>
      {confirmID && (<ConfirmDialog title="Delete Classroom?" onCancel={() => setConfirmID(null)} onConfirm={() => removeOne(confirmID)}>Students must be reassigned.</ConfirmDialog>)}
    </>
  );
}
