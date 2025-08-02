/* -----------------------------------------------------------------------
   Classrooms.jsx  –  full file
   -------------------------------------------------------------------- */

import { useState }                       from "react";
import {
  FiSearch, FiX, FiPrinter, FiPlus, FiFileText
}                                         from "react-icons/fi";
import { useQuery, useMutation, useQueryClient }
                                          from "@tanstack/react-query";
import { toast, Toaster }                 from "react-hot-toast";

import {
  listClassrooms,
  deleteClassroom
}                                         from "../../../api/classrooms";

import DataTable                          from "../../../components/ui/DataTable";
import SkeletonTable                      from "../../../components/ui/SkeletonTable";
import ConfirmDialog                      from "../../../components/ui/ConfirmDialog";
import Drawer                             from "../../../components/ui/Drawer";
import ClassroomForm                      from "./ClassroomForm";

export default function Classrooms() {
  const qc                            = useQueryClient();
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [editing,    setEditing]      = useState(null);
  const [confirmID,  setConfirmID]    = useState(null);
  const [search,     setSearch]       = useState("");

  /* ───────── fetch list (react-query) ───────── */
  const { data: classrooms = [], isLoading } = useQuery({
    queryKey : ["classrooms"],
    queryFn  : listClassrooms
  });

  /* ───────── derived search filter ───────── */
  const filtered = classrooms.filter(c =>
    (c.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.teacher_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  /* ───────── table mapping ───────── */
  const rows /* ← FIX: wrap object literal in ( ) */ =
        filtered.map((c, idx) => ({
          ...c,
          idx : idx + 1,
          _actions: (
            <div className="flex gap-3">
              <button
                className="text-blue-600 hover:underline"
                onClick={() => { setEditing(c); setDrawerOpen(true); }}
              >
                Edit
              </button>
              <button
                className="text-red-600 hover:underline"
                onClick={() => setConfirmID(c.id)}
              >
                Delete
              </button>
            </div>
          )
        }));

  const columns = [
    { key: "idx",        label: "#" },
    { key: "name",       label: "Name" },
    { key: "capacity",   label: "Capacity" },
    { key: "teacher_name", label: "Teacher" },
    { key: "_actions",   label: "Actions" }
  ];

  /* ───────── mutations ───────── */
  const { mutate: removeOne } = useMutation({
    mutationFn : deleteClassroom,
    onSuccess  : () => {
      toast.success("Classroom deleted");
      qc.invalidateQueries(["classrooms"]);
      setConfirmID(null);
    },
    onError    : () => toast.error("Delete failed")
  });

  const bulkDelete = ids => {
    toast.promise(
      Promise.all(ids.map(deleteClassroom)),
      { loading: "Deleting…", success: "Deleted", error: "Delete failed" }
    ).then(() => qc.invalidateQueries(["classrooms"]));
  };

  /* ───────── misc helpers ───────── */
  const handlePrint     = () => window.print();
  const handleExportPDF = () => window.open("/api/reports/classrooms/pdf/", "_blank");

  /* ───────── UI ───────── */
  return (
    <>
      <Toaster position="top-right" />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">

          {/* ── header bar ─────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              Classroom Management
            </h2>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <FiPrinter /> Print
              </button>
              <button
                onClick={() => { setEditing(null); setDrawerOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                <FiPlus /> Add Classroom
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-fuchsia-600 text-white hover:bg-fuchsia-700"
              >
                <FiFileText /> Export PDF
              </button>
            </div>
          </div>

          {/* ── search ─────────────────────────────────── */}
          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search classrooms…"
              className="w-full pl-12 pr-12 py-2 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX />
              </button>
            )}
          </div>

          {/* ── table ──────────────────────────────────── */}
          {isLoading ? (
            <SkeletonTable />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              defaultSort={{ key: "name", dir: "asc" }}
              onBulkDelete={bulkDelete}
            />
          )}
        </div>
      </div>

      {/* ── drawer ───────────────────────────────────── */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} width="40rem">
        {drawerOpen && (
          <ClassroomForm
            initial={editing}
            onSaved={() => {
              setDrawerOpen(false);
              qc.invalidateQueries(["classrooms"]);
            }}
          />
        )}
      </Drawer>

      {/* ── delete confirm ───────────────────────────── */}
      {confirmID && (
        <ConfirmDialog
          title="Delete Classroom?"
          onCancel={() => setConfirmID(null)}
          onConfirm={() => removeOne(confirmID)}
        >
          Students in this classroom will need to be reassigned.
        </ConfirmDialog>
      )}
    </>
  );
}

