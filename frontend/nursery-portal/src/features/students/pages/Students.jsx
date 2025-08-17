import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import cx from "classnames";
import { listStudents, deleteStudent } from "../../../api/students";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import Drawer from "../../../components/ui/Drawer";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import StudentForm from "./StudentForm";

export default function Students() {
  const queryClient = useQueryClient();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [search, setSearch] = useState("");

  const { data: students = [], isLoading } = useQuery({ queryKey: ["students"], queryFn: listStudents });

  const { mutate: removeStudent } = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      toast.success("Student deleted!");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setConfirmDeleteId(null);
    },
    onError: () => toast.error("Delete failed. Student may have linked financial records."),
  });

  const onSaved = () => {
    setDrawerOpen(false);
    queryClient.invalidateQueries({ queryKey: ["students"] });
  };

  const openDrawer = (student = null) => {
    setEditingStudent(student);
    setDrawerOpen(true);
  };

  // --- THIS FUNCTION ENABLES BULK DELETE ---
  const handleBulkDelete = (ids) => {
    toast.promise(
      Promise.all(ids.map(deleteStudent)),
      {
        loading: "Deleting students...",
        success: `${ids.length} students deleted!`,
        error: "Failed to delete one or more students.",
      }
    ).then(() => {
        queryClient.invalidateQueries({ queryKey: ["students"] });
    });
  };

  const filtered = students.filter(s => (s.name || "").toLowerCase().includes(search.toLowerCase()));

  const rows = filtered.map((s, idx) => ({
    ...s,
    idx: idx + 1,
    is_active_status: (
      <span className={cx("px-2 py-1 text-xs font-semibold rounded-full", { "bg-green-100 text-green-800": s.is_active, "bg-gray-100 text-gray-800": !s.is_active })}>
        {s.is_active ? "Active" : "Inactive"}
      </span>
    ),
    _actions: (
      <div className="flex gap-3">
        <button className="text-blue-600 hover:underline" onClick={() => openDrawer(s)}>Edit</button>
        <button className="text-red-600 hover:underline" onClick={() => setConfirmDeleteId(s.id)}>Delete</button>
      </div>
    ),
  }));

  const columns = [
    { key: "idx", label: "#" }, { key: "name", label: "Name" }, { key: "class_name", label: "Class" },
    { key: "enrollment_status", label: "Status" }, { key: "is_active_status", label: "Active?" },
    { key: "guardian_name", label: "Guardian" }, { key: "_actions", label: "Actions" },
  ];

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Student Management</h2>
            <button onClick={() => openDrawer(null)} className="btn-primary flex items-center gap-2">
              <FiPlus /> Add Student
            </button>
          </div>
          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name..." className="input w-full pl-12" />
          </div>
          
          {/* --- FIX IS HERE: onBulkDelete prop is now correctly passed --- */}
          {isLoading ? <SkeletonTable /> : <DataTable columns={columns} rows={rows} onBulkDelete={handleBulkDelete} />}
        </div>
      </div>
      <Drawer open={isDrawerOpen} onClose={() => setDrawerOpen(false)} width="40rem">{isDrawerOpen && <StudentForm initialData={editingStudent} onSaved={onSaved} />}</Drawer>
      {confirmDeleteId && (<ConfirmDialog title="Delete Student?" onCancel={() => setConfirmDeleteId(null)} onConfirm={() => removeStudent(confirmDeleteId)}>This action cannot be undone.</ConfirmDialog>)}
    </>
  );
}
