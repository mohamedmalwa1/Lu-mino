import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";
import { FiSearch, FiPlus } from "react-icons/fi";
import { listAttendances, deleteAttendance } from "../../../api/students";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import Drawer from "../../../components/ui/Drawer";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import AttendanceForm from "./AttendanceForm";

export default function StudentAttendance() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [search, setSearch] = useState("");

  const { data: records = [], isLoading } = useQuery({ queryKey: ["attendances"], queryFn: listAttendances });

  const { mutate: removeRecord } = useMutation({
    mutationFn: deleteAttendance,
    onSuccess: () => {
      toast.success("Attendance record deleted!");
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      setConfirmDeleteId(null);
    },
    onError: () => toast.error("Delete failed."),
  });

  const onSaved = () => {
    setDrawerOpen(false);
    queryClient.invalidateQueries({ queryKey: ["attendances"] });
  };

  const openDrawer = (record = null) => {
    setEditingRecord(record);
    setDrawerOpen(true);
  };

  const filtered = records.filter(r => (r.student_name || "").toLowerCase().includes(search.toLowerCase()));

  const rows = filtered.map((r, idx) => ({
    ...r,
    idx: idx + 1,
    date: new Date(r.date).toLocaleDateString(),
    _actions: (
      <div className="flex gap-3">
        <button className="text-blue-600 hover:underline" onClick={() => openDrawer(r)}>Edit</button>
        <button className="text-red-600 hover:underline" onClick={() => setConfirmDeleteId(r.id)}>Delete</button>
      </div>
    ),
  }));

  const columns = [
    { key: "idx", label: "#" },
    { key: "student_name", label: "Student" },
    { key: "date", label: "Date" },
    { key: "status", label: "Status" },
    { key: "notes", label: "Notes" },
    { key: "_actions", label: "Actions" },
  ];

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Student Attendance</h2>
            <button onClick={() => openDrawer(null)} className="btn-primary flex items-center gap-2">
              <FiPlus /> Add Record
            </button>
          </div>
          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student name..." className="input w-full pl-12" />
          </div>
          
          {isLoading ? <SkeletonTable /> : <DataTable columns={columns} rows={rows} />}
        </div>
      </div>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} width="32rem">
        {drawerOpen && <AttendanceForm initialData={editingRecord} onSaved={onSaved} />}
      </Drawer>
      {confirmDeleteId && (
        <ConfirmDialog title="Delete Attendance Record?" onCancel={() => setConfirmDeleteId(null)} onConfirm={() => removeRecord(confirmDeleteId)}>
          This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}
