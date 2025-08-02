// src/features/students/pages/Students.jsx
import { useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import {
  FiSearch,
  FiX,
  FiPrinter,
  FiPlus,
  FiFileText,
} from "react-icons/fi";

import {
  listStudents,
  deleteStudent,
} from "../../../api/students";                 // ✅ same relative path
import DataTable      from "../../../components/ui/DataTable";
import Drawer         from "../../../components/ui/Drawer";
import StudentForm    from "./StudentForm";

export default function Students() {
  /* ——— state ——— */
  const [rows,    setRows]   = useState([]);
  const [loading, setLoad]   = useState(true);
  const [drawer,  setDrawer] = useState(false);
  const [edit,    setEdit]   = useState(null);
  const [search,  setSearch] = useState("");

  /* ——— fetch list ——— */
  const load = async () => {
    setLoad(true);
    try {
      const data = await listStudents();               // GET /api/v1/student/students/
      setRows(data);
    } catch {
      toast.error("Failed to load students");
    } finally {
      setLoad(false);
    }
  };
  useEffect(() => { load(); }, []);

  /* ——— single / bulk delete ——— */
  const delOne = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      await deleteStudent(id);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };
  const delMany = async (ids) => {
    if (!window.confirm(`Delete ${ids.length} students?`)) return;
    try {
      await Promise.all(ids.map(deleteStudent));
      toast.success("Bulk deleted");
      load();
    } catch {
      toast.error("Bulk delete failed");
    }
  };

  /* ——— search filter ——— */
  const filtered = rows.filter((s) =>
    (s.name || "").toLowerCase().includes(search.toLowerCase())
  );

  /* ——— table mapping ——— */
  const tableRows = filtered.map((s, index) => ({
    ...s,
    idx: index + 1,
    enrollment_date: s.enrollment_date
      ? new Date(s.enrollment_date).toLocaleDateString()
      : "",
    date_of_birth: s.date_of_birth
      ? new Date(s.date_of_birth).toLocaleDateString()
      : "",
    _actions: (
      <div className="flex gap-3">
        <button
          className="text-blue-600 hover:underline"
          onClick={() => {
            setEdit(s);
            setDrawer(true);
          }}
        >
          Edit
        </button>
        <button
          className="text-red-600 hover:underline"
          onClick={() => delOne(s.id)}
        >
          Delete
        </button>
      </div>
    ),
  }));

  /* ——— columns ——— */
  const cols = [
    { key: "idx",            label: "#" },
    { key: "name",           label: "Name" },
    { key: "class_name",     label: "Class" },
    { key: "teacher_name",   label: "Teacher" },
    { key: "enrollment_date",label: "Enrolled" },
    { key: "gender",         label: "Gender" },
    { key: "date_of_birth",  label: "DOB" },
    { key: "guardian_name",  label: "Guardian" },
    { key: "guardian_phone", label: "Phone" },
    { key: "_actions",       label: "Actions" },
  ];

  /* ——— helpers ——— */
  const handlePrint     = () => window.print();
  const handleExportPDF = () =>
    window.open("/api/reports/students/pdf/", "_blank");

  /* ——— UI ——— */
  return (
    <>
      <Toaster position="top-right" />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
          {/* header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              Student Management
            </h2>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <FiPrinter /> Print
              </button>
              <button
                onClick={() => {
                  setEdit(null);
                  setDrawer(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                <FiPlus /> Add Student
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-fuchsia-600 text-white hover:bg-fuchsia-700"
              >
                <FiFileText /> Export PDF
              </button>
            </div>
          </div>

          {/* search */}
          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student name…"
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

          {/* table */}
          {loading ? (
            <p className="p-4 text-gray-600">Loading students…</p>
          ) : (
            <DataTable
              columns={cols}
              rows={tableRows}
              onBulkDelete={delMany}
              defaultSort="name"
            />
          )}
        </div>
      </div>

      {/* drawer */}
      <Drawer open={drawer} onClose={() => setDrawer(false)} width="40rem">
        {drawer && (
          <StudentForm
            initial={edit}
            onSaved={() => {
              setDrawer(false);
              load();
            }}
          />
        )}
      </Drawer>
    </>
  );
}

