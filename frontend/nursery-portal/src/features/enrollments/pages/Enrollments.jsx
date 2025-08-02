import { useState }          from "react";
import { FiSearch, FiX, FiPlus, FiPrinter, FiFileText } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Toaster, toast }    from "react-hot-toast";

import {
  listEnrollments,
  deleteEnrollment,
} from "../../../api/enrollments";
import { listStudents }   from "../../../api/students";
import { listClassrooms } from "../../../api/classrooms";

import DataTable     from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import Drawer        from "../../../components/ui/Drawer";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

import EnrollmentForm from "./EnrollmentForm";

/* -------------------------------------------------------------------- */
const columns = [
  { key: "idx",          label: "#" },
  { key: "student_name", label: "Student" },
  { key: "class_name",   label: "Classroom" },
  { key: "status",       label: "Status" },
  { key: "start_date",   label: "Start" },
  { key: "end_date",     label: "End" },
  { key: "_actions",     label: "Actions" },
];

export default function Enrollments() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [confirm,    setConfirm]    = useState(null);
  const [search,     setSearch]     = useState("");

  /* --- fetch list ---------------------------------------------------- */
  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["enrollments"],
    queryFn : listEnrollments,
  });

  /* --- filter -------------------------------------------------------- */
  const filtered = enrollments.filter(e =>
    (e.student_name + e.class_name)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  /* --- table rows ---------------------------------------------------- */
  const rows = filtered.map((e, i) => ({
    ...e,
    idx: i + 1,
    _actions: (
      <div className="flex gap-3">
        <button
          className="text-blue-600 hover:underline"
          onClick={() => { setEditing(e); setDrawerOpen(true); }}>
          Edit
        </button>
        <button
          className="text-red-600 hover:underline"
          onClick={() => setConfirm(e.id)}>
          Delete
        </button>
      </div>
    )
  }));

  /* --- delete -------------------------------------------------------- */
  const { mutate: del } = useMutation({
    mutationFn  : deleteEnrollment,
    onSuccess   : () => {
      toast.success("Enrollment deleted");
      qc.invalidateQueries(["enrollments"]);
      setConfirm(null);
    },
    onError     : () => toast.error("Delete failed"),
  });

  /* --- helpers ------------------------------------------------------- */
  const handlePrint  = () => window.print();
  const handleExport = () => window.open("/api/reports/enrollments/pdf/", "_blank");

  /* =====================  RENDER  ==================================== */
  return (
    <>
      <Toaster position="top-right"/>

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-2xl font-semibold text-gray-800">Enrollment Management</h2>

            <div className="flex flex-wrap gap-3">
              <button onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">
                <FiPrinter/> Print
              </button>
              <button onClick={() => { setEditing(null); setDrawerOpen(true);} }
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                <FiPlus/> Add Enrollment
              </button>
              <button onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-fuchsia-600 text-white hover:bg-fuchsia-700">
                <FiFileText/> Export PDF
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Search enrollments…"
              className="w-full pl-12 pr-12 py-2 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {search && (
              <button
                onClick={()=>setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <FiX/>
              </button>
            )}
          </div>

          {/* Table */}
          {isLoading
            ? <SkeletonTable/>
            : <DataTable
                columns={columns}
                rows={rows}
                defaultSort={{ key:"start_date", dir:"desc"}}
              />
          }
        </div>
      </div>

      {/* Drawer */}
      <Drawer open={drawerOpen} onClose={()=>setDrawerOpen(false)} width="36rem">
        {drawerOpen && (
          <EnrollmentForm
            initial={editing}
            onSaved={()=>{
              setDrawerOpen(false);
              qc.invalidateQueries(["enrollments"]);
            }}
          />
        )}
      </Drawer>

      {/* Confirm */}
      {confirm && (
        <ConfirmDialog
          title="Delete enrollment?"
          onCancel={()=>setConfirm(null)}
          onConfirm={()=>del(confirm)}>
          This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}

