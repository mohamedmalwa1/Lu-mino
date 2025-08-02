import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { createMedicalRecord, updateMedicalRecord } from "../../../api/medical";
import { listStudents } from "../../../api/students";

const schema = yup.object({
  student: yup.number().required(),
  record_type: yup.string().required(),
  date: yup.date().required(),
  description: yup.string().required()
}).required();

const blank = { record_type:"CHECKUP", date:new Date(), description:"", is_urgent:false };

export default function MedicalForm({ initial, onSaved }){
  const [students,setStudents]=useState([]);
  const {register, handleSubmit, control, reset} = useForm({defaultValues:blank,resolver:yupResolver(schema)});

  useEffect(()=>{ listStudents().then(setStudents);},[]);
  useEffect(()=>{
    reset(initial ? {...initial, date:new Date(initial.date)} : blank);
  },[initial,reset]);

  const onSubmit = async data=>{
    const payload = {...data, date:data.date.toISOString().split("T")[0]};
    try{
      initial ? await updateMedicalRecord(initial.id,payload)
              : await createMedicalRecord(payload);
      toast.success("Saved"); onSaved();
    }catch{ toast.error("Save failed"); }
  };

  return(
    <div className="p-6 w-[40rem] space-y-6">
      <h2 className="text-lg font-semibold">{initial?"Edit":"Add"} Medical Record</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <select {...register("student")} className="input w-full">
          <option value="">Student…</option>
          {students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select {...register("record_type")} className="input w-full">
          <option value="ALLERGY">Allergy</option>
          <option value="MEDICATION">Medication</option>
          <option value="TREATMENT">Treatment</option>
          <option value="VACCINATION">Vaccination</option>
          <option value="CHECKUP">Periodic Checkup</option>
          <option value="DOCTOR_NOTE">Doctor Note</option>
          <option value="EDUCATION">Health Education</option>
        </select>

        <Controller control={control} name="date" render={({field})=>(
          <DatePicker className="input w-full" selected={field.value} onChange={field.onChange}
                      dateFormat="yyyy-MM-dd" placeholderText="Record date"/>
        )}/>

        <textarea {...register("description")} rows={3} className="input w-full" placeholder="Description / notes"/>

        <label className="flex items-center gap-2">
          <input type="checkbox" {...register("is_urgent")}/> Urgent
        </label>

        <button className="btn-primary">{initial?"Update":"Create"}</button>
      </form>
    </div>
  )
}
