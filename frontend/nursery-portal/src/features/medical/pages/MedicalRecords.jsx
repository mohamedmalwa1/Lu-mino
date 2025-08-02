import { useState } from "react";
import { FiSearch, FiX, FiPrinter, FiPlus } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";

import { listMedicalRecords, deleteMedicalRecord } from "../../../api/medical";
import DataTable      from "../../../components/ui/DataTable";
import SkeletonTable  from "../../../components/ui/SkeletonTable";
import Drawer         from "../../../components/ui/Drawer";
import ConfirmDialog  from "../../../components/ui/ConfirmDialog";
import MedicalForm    from "./MedicalForm";

export default function MedicalRecords() {
  const qc = useQueryClient();
  const [drawer,setDrawer] = useState(false);
  const [editing,setEditing]= useState(null);
  const [confirm,setConfirm]= useState(null);
  const [search,setSearch]  = useState("");

  const {data:records=[], isLoading} = useQuery({ queryKey:["medical"], queryFn:listMedicalRecords });

  const filtered = records.filter(r =>
    (r.student_name||"").toLowerCase().includes(search.toLowerCase())
    || (r.record_type_display||"").toLowerCase().includes(search.toLowerCase())
  );

  const rows = filtered.map((r,i)=>({
    ...r,
    idx:i+1,
    date: new Date(r.date).toLocaleDateString(),
    _actions: (
      <div className="flex gap-3">
        <button className="text-blue-600 hover:underline" onClick={()=>{setEditing(r);setDrawer(true);}}>Edit</button>
        <button className="text-red-600 hover:underline" onClick={()=>setConfirm(r.id)}>Delete</button>
      </div>
    )
  }));

  const cols = [
    {key:"idx",label:"#"},
    {key:"student_name",label:"Student"},
    {key:"record_type_display",label:"Type"},
    {key:"date",label:"Date"},
    {key:"is_urgent",label:"Urgent", render:v=> v? "Yes":"No"},
    {key:"_actions",label:"Actions"}
  ];

  const { mutate:delOne } = useMutation({
    mutationFn: deleteMedicalRecord,
    onSuccess: ()=>{ toast.success("Deleted"); qc.invalidateQueries(["medical"]); },
    onError: ()=> toast.error("Delete failed")
  });

  const bulkDelete = ids => Promise.all(ids.map(deleteMedicalRecord))
       .then(()=>{toast.success("Bulk deleted");qc.invalidateQueries(["medical"]);})
       .catch(()=>toast.error("Bulk delete failed"));

  return (
    <>
      <Toaster position="top-right"/>
      <div className="px-4 py-6 space-y-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Medical Records</h2>
            <button onClick={()=>{setEditing(null);setDrawer(true);}}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <FiPlus/> Add Record
            </button>
          </div>
          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input className="w-full pl-10 pr-10 py-2 border rounded-full"
                   placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
            {search && <FiX className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                            onClick={()=>setSearch("")}/>}
          </div>
          {isLoading ? <SkeletonTable/> :
            <DataTable columns={cols} rows={rows} onBulkDelete={bulkDelete} defaultSort="date"/>}
        </div>
      </div>

      <Drawer open={drawer} onClose={()=>setDrawer(false)} width="40rem">
        {drawer && <MedicalForm initial={editing} onSaved={()=>{setDrawer(false);qc.invalidateQueries(["medical"]);}}/>}
      </Drawer>

      {confirm && <ConfirmDialog title="Delete record?" onCancel={()=>setConfirm(null)}
                                 onConfirm={()=>{delOne(confirm);setConfirm(null);}}>
                    This action is irreversible.
                  </ConfirmDialog>}
    </>
  );
}
