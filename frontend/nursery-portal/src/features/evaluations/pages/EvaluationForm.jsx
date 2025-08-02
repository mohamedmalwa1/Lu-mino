import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { createEvaluation, updateEvaluation } from "../../../api/evaluations";
import { listStudents } from "../../../api/students";

const schema = yup.object({
  student:yup.number().required(),
  status:yup.string().required(),
  date:yup.date().required()
}).required();

const blank = { status:"ON_TRACK", date:new Date(), general_notes:"" };

export default function EvaluationForm({initial,onSaved}){
  const [students,setStudents]= useState([]);
  const {register,handleSubmit,control,reset} = useForm({defaultValues:blank,resolver:yupResolver(schema)});

  useEffect(()=>{ listStudents().then(setStudents);},[]);
  useEffect(()=>{ reset(initial? {...initial,date:new Date(initial.date)} : blank);},[initial,reset]);

  const onSubmit = async data=>{
    const payload = {...data,date:data.date.toISOString().split("T")[0]};
    try{
      initial ? await updateEvaluation(initial.id,payload)
              : await createEvaluation(payload);
      toast.success("Saved"); onSaved();
    }catch{ toast.error("Save failed"); }
  };

  return(
    <div className="p-6 w-[32rem] space-y-6">
      <h2 className="text-lg font-semibold">{initial?"Edit":"Add"} Evaluation</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <select {...register("student")} className="input w-full">
          <option value="">Student…</option>
          {students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select {...register("status")} className="input w-full">
          <option value="EXCELLENT">Excellent</option>
          <option value="GOOD">Good</option>
          <option value="ON_TRACK">On Track</option>
          <option value="NEEDS_WORK">Needs Work</option>
        </select>

        <Controller control={control} name="date" render={({field})=>(
          <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd"/>
        )}/>

        <textarea {...register("general_notes")} rows={3} className="input w-full" placeholder="Notes / summary"/>

        <textarea {...register("improvement_plan")} rows={3} className="input w-full" placeholder="Improvement plan (if needed)"/>

        <Controller control={control} name="follow_up_date" render={({field})=>(
          <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" placeholderText="Follow‑up date (optional)"/>
        )}/>

        <button className="btn-primary">{initial?"Update":"Create"}</button>
      </form>
    </div>
  )
}
