import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";
import { FiSearch, FiPlus, FiDownload, FiFile } from "react-icons/fi";
import { listDocuments, deleteDocument } from "../../../api/students";
import DataTable from "../../../components/ui/DataTable";
import SkeletonTable from "../../../components/ui/SkeletonTable";
import Drawer from "../../../components/ui/Drawer";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import DocumentForm from "./DocumentForm";

const DOC_TYPE_ICONS = {
  BIRTH_CERT: <FiFile className="text-blue-500" />,
  ID: <FiFile className="text-green-500" />,
  PASSPORT: <FiFile className="text-purple-500" />,
  VISA: <FiFile className="text-yellow-500" />,
  RESIDENCE: <FiFile className="text-red-500" />,
  VACCINE: <FiFile className="text-pink-500" />,
  TRANSCRIPT: <FiFile className="text-indigo-500" />,
  OTHER: <FiFile className="text-gray-500" />,
};

export default function Documents() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmID, setConfirmID] = useState(null);
  const [search, setSearch] = useState("");

  const { data: documents = [], isLoading } = useQuery({ 
    queryKey: ["documents"], 
    queryFn: listDocuments 
  });
  
  const { mutate: removeOne } = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => { 
      toast.success("Document deleted"); 
      queryClient.invalidateQueries({ queryKey: ["documents"] }); 
      setConfirmID(null); 
    },
    onError: () => toast.error("Delete failed"),
  });

  const onSaved = () => { 
    setDrawerOpen(false); 
    queryClient.invalidateQueries({ queryKey: ["documents"] }); 
  };
  
  const handleBulkDelete = (ids) => {
    toast.promise(Promise.all(ids.map(deleteDocument)), {
      loading: "Deleting documents...",
      success: "Documents deleted!",
      error: "Failed to delete.",
    }).then(() => { queryClient.invalidateQueries({ queryKey: ["documents"] }); });
  };

  const filtered = documents.filter(d => 
    (d.student_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.doc_type_display || "").toLowerCase().includes(search.toLowerCase())
  );

  const rows = filtered.map((d) => ({
    ...d,
    doc_type: (
      <div className="flex items-center gap-2">
        {DOC_TYPE_ICONS[d.doc_type] || DOC_TYPE_ICONS.OTHER}
        {d.doc_type_display}
      </div>
    ),
    issue_date: new Date(d.issue_date).toLocaleDateString(),
    expiration_date: d.expiration_date ? new Date(d.expiration_date).toLocaleDateString() : 'No expiry',
    status: d.is_expired ? (
      <span className="text-red-500">Expired</span>
    ) : (
      <span className="text-green-500">Valid</span>
    ),
    file_link: (
      <a href={d.file} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
        <FiDownload /> View
      </a>
    ),
    _actions: (
      <div className="flex gap-3">
        <button className="text-blue-600 hover:underline" onClick={() => { setEditing(d); setDrawerOpen(true); }}>
          Edit
        </button>
        <button className="text-red-600 hover:underline" onClick={() => setConfirmID(d.id)}>
          Delete
        </button>
      </div>
    )
  }));

  const columns = [
    { key: "student_name", label: "Student" }, 
    { key: "doc_type", label: "Type" },
    { key: "issue_date", label: "Issued" },
    { key: "expiration_date", label: "Expires" },
    { key: "status", label: "Status" },
    { key: "file_link", label: "File" },
    { key: "_actions", label: "Actions" },
  ];

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Student Documents</h2>
            <button 
              onClick={() => { setEditing(null); setDrawerOpen(true); }} 
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus /> Add Document
            </button>
          </div>
          
          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search documents..." 
              className="input w-full pl-12" 
            />
          </div>
          
          {isLoading ? <SkeletonTable /> : <DataTable columns={columns} rows={rows} onBulkDelete={handleBulkDelete} />}
        </div>
      </div>
      
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} width="42rem">
        {drawerOpen && <DocumentForm initialData={editing} onSaved={onSaved} />}
      </Drawer>
      
      {confirmID && (
        <ConfirmDialog 
          title="Delete Document?" 
          onCancel={() => setConfirmID(null)} 
          onConfirm={() => removeOne(confirmID)}
        >
          This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}
