import { useState } from "react";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";

import { listEvaluations, deleteEvaluation } from "../../../api/evaluations";
import DataTable      from "../../../components/ui/DataTable";
import SkeletonTable  from "../../../components/ui/SkeletonTable";
import ConfirmDialog  from "../../../components/ui/ConfirmDialog";
import Drawer         from "../../../components/ui/Drawer";
import EvaluationForm from "./EvaluationForm";

export default function Evaluations(){
  const qc = useQueryClient();
  const [drawer,setDrawer]= useState(false);
  const [edit,setEdit]= useState(null);
  const [confirm,setConfirm]= useState(null);
  const [search,setSearch]= useState("");

  const {data:evaluations=[],isLoading}= useQuery({queryKey:["evaluations"],queryFn:listEvaluations});

  const filtered = evaluations.filter(e=>
    (e.student_name||"").toLowerCase().includes(search.toLowerCase())
  );

  const rows = filtered.map((e,i)=>({
    ...e,
    idx:i+1,
    date:new Date(e.date).toLocaleDateString(),
    _actions:(
      <div className="flex gap-3">
        <button className="text-blue-600 hover:underline" onClick={()=>{setEdit(e);setDrawer(true);}}>Edit</button>
        <button className="text-red-600 hover:underline" onClick={()=>setConfirm(e.id)}>Delete</button>
      </div>
    )
  }));

  const cols=[
    {key:"idx",label:"#"},
    {key:"student_name",label:"Student"},
    {key:"status_display",label:"Status"},
    {key:"date",label:"Date"},
    {key:"_actions",label:"Actions"}
  ];

  const {mutate:delOne}= useMutation({
    mutationFn:deleteEvaluation,
    onSuccess:()=>{toast.success("Deleted");qc.invalidateQueries(["evaluations"]);},
    onError:()=>toast.error("Delete failed")
  });

  const bulkDelete = ids=>Promise.all(ids.map(deleteEvaluation))
        .then(()=>{toast.success("Bulk deleted");qc.invalidateQueries(["evaluations"]);})
        .catch(()=>toast.error("Bulk delete failed"));

  return (
    <>
      <Toaster position="top-right"/>
      <div className="px-4 py-6 space-y-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Student Evaluations</h2>
            <button onClick={()=>{setEdit(null);setDrawer(true);}}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <FiPlus/> Add Evaluation
            </button>
          </div>
          <div className="relative w-full max-w-lg">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input className="w-full pl-10 pr-10 py-2 border rounded-full" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
            {search && <FiX className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" onClick={()=>setSearch("")}/>}
          </div>
          {isLoading ? <SkeletonTable/> :
            <DataTable columns={cols} rows={rows} onBulkDelete={bulkDelete} defaultSort="date"/>}
        </div>
      </div>

      <Drawer open={drawer} onClose={()=>setDrawer(false)} width="32rem">
        {drawer && <EvaluationForm initial={edit} onSaved={()=>{setDrawer(false);qc.invalidateQueries(["evaluations"]);}}/>}
      </Drawer>

      {confirm && <ConfirmDialog title="Delete evaluation?" onCancel={()=>setConfirm(null)} onConfirm={()=>{delOne(confirm);setConfirm(null);}}>
                    This action is irreversible.
                  </ConfirmDialog>}
    </>
  )
}
