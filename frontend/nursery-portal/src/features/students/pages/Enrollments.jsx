import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";
import { FiSearch, FiPlus } from "react-icons/fi";
import { listEnrollments, deleteEnrollment } from "../../../api/students";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import Drawer from "../../../components/ui/Drawer";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import EnrollmentForm from "./EnrollmentForm";

export default function Enrollments() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmID, setConfirmID] = useState(null);
  const [search, setSearch] = useState("");

  const { data: enrollments = [], isLoading } = useQuery({ queryKey: ["enrollments"], queryFn: listEnrollments });
  
  const { mutate: removeOne } = useMutation({
    mutationFn: deleteEnrollment,
    onSuccess: () => {
      toast.success("Enrollment deleted");
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      setConfirmID(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  const onSaved = () => {
    setDrawerOpen(false);
    queryClient.invalidateQueries({ queryKey: ["enrollments"] });
  };
  
  const handleBulkDelete = (ids) => {
    toast.promise(
      Promise.all(ids.map(deleteEnrollment)),
      {
        loading: "Deleting enrollments...",
        success: "Enrollments deleted!",
        error: "Failed to delete.",
      }
    ).then(() => {
        queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    });
  };

  const filtered = enrollments.filter(e =>
    (e.student_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.class_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const rows = filtered.map((e) => ({
    ...e,
    start_date: new Date(e.start_date).toLocaleDateString(),
    end_date: e.end_date ? new Date(e.end_date).toLocaleDateString() : 'N/A',
    _actions: (
      <div className="flex gap-3">
        <button className="text-blue-600 hover:underline" onClick={() => { setEditing(e); setDrawerOpen(true); }}>Edit</button>
        <button className="text-red-600 hover:underline" onClick={() => setConfirmID(e.id)}>Delete</button>
      </div>
    ),
  }));

  const columns = [
    { key: "student_name", label: "Student" }, { key: "class_name", label: "Classroom" },
    { key: "start_date", label: "Start Date" }, { key: "end_date", label: "End Date" },
    { key: "status", label: "Status" }, { key: "_actions", label: "Actions" },
  ];

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Enrollment Records</h2>
            <button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="btn-primary flex items-center gap-2">
              <FiPlus /> Add Enrollment
            </button>
          </div>
          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student or class..." className="input w-full pl-12" />
          </div>
          {isLoading ? <SkeletonTable /> : <DataTable columns={columns} rows={rows} onBulkDelete={handleBulkDelete} />}
        </div>
      </div>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} width="36rem">
        {drawerOpen && <EnrollmentForm initialData={editing} onSaved={onSaved} />}
      </Drawer>
      {confirmID && (
        <ConfirmDialog title="Delete Enrollment?" onCancel={() => setConfirmID(null)} onConfirm={() => removeOne(confirmID)}>
          This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}
