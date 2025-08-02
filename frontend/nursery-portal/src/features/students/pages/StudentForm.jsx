// src/features/students/pages/StudentForm.jsx
//-----------------------------------------------------------------
//  CREATE / EDIT drawer  – adds <select name="enrollment_status">
//  (active • graduated • left • shifted), keeps the old design.
//-----------------------------------------------------------------
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { yupResolver }        from "@hookform/resolvers/yup";
import * as yup               from "yup";
import DatePicker             from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  createStudent,
  updateStudent,
  listClasses,
} from "../../../api/students";                     // <-- /api helper

/* ───────── Yup validation ───────── */
const schema = yup.object({
  first_name: yup.string().required(),
  last_name : yup.string().required(),
  gender    : yup.string().oneOf(["M","F"]).required(),
  date_of_birth     : yup.date().max(new Date(), "Future DOB?").required(),
  enrollment_date   : yup.date().required(),
  enrollment_status : yup.string().oneOf(["active","graduated","left","shifted"]).required(),
  classroom         : yup.number().required(),
}).required();

/* default blank */
const blank = {
  first_name:"", last_name:"", gender:"",
  date_of_birth:null, enrollment_date:null,
  enrollment_status:"active",
  enrollment_history:"",
  classroom:"",
  /* optional extras */
  parent_id_number:"", parent_id_expiry:null,
  student_id_number:"", student_id_expiry:null,
  guardian_name:"", guardian_phone:"",
};

export default function StudentForm({ initial, onSaved }) {
  const [classes,setClasses] = useState(null);

  const { register, handleSubmit, control, reset, formState:{errors} } =
        useForm({ defaultValues: blank, resolver:yupResolver(schema) });

  /* load classrooms once */
  useEffect(() => { listClasses().then(setClasses).catch(() => toast.error("Class fetch failed")); }, []);

  /* reset when editing */
  useEffect(() => {
    reset(initial ? {
      ...initial,
      date_of_birth   : initial.date_of_birth   ? new Date(initial.date_of_birth)   : null,
      enrollment_date : initial.enrollment_date ? new Date(initial.enrollment_date) : null,
      parent_id_expiry: initial.parent_id_expiry ? new Date(initial.parent_id_expiry) : null,
      student_id_expiry: initial.student_id_expiry ? new Date(initial.student_id_expiry) : null,
    } : blank);
  }, [initial, reset]);

  /* submit ------------------------------------------------------- */
  const onSubmit = async data => {
    const payload = {
      ...data,
      date_of_birth   : data.date_of_birth?.toISOString().split("T")[0],
      enrollment_date : data.enrollment_date?.toISOString().split("T")[0],
      parent_id_expiry: data.parent_id_expiry?.toISOString().split("T")[0]  || null,
      student_id_expiry: data.student_id_expiry?.toISOString().split("T")[0]|| null,
    };
    try {
      initial
        ? await updateStudent(initial.id, payload)
        : await createStudent(payload);
      toast.success("Saved");
      onSaved();
    } catch { toast.error("Save failed"); }
  };

  const clsOpts = () => {
    if (!classes) return <option>Loading…</option>;
    if (!classes.length) return <option>— no classes —</option>;
    return classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>);
  };

  /* UI ----------------------------------------------------------- */
  return (
    <div className="p-8 space-y-6 w-[40rem] overflow-y-auto">
      <h2 className="text-xl font-semibold">{initial ? "Edit Student" : "Add Student"}</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* PERSONAL ------------------------------------------------ */}
        <fieldset className="space-y-4">
          <legend className="font-medium text-gray-600">Personal</legend>
          <div className="grid grid-cols-2 gap-4">
            <input {...register("first_name")} className="input" placeholder="First name"/>
            <input {...register("last_name")}  className="input" placeholder="Last name"/>
            <select {...register("gender")} className="input">
              <option value="">Gender</option><option value="M">Male</option><option value="F">Female</option>
            </select>
            <Controller control={control} name="date_of_birth" render={({field})=>(
              <DatePicker className="input w-full" selected={field.value} onChange={field.onChange}
                          placeholderText="Date of birth" dateFormat="yyyy-MM-dd"/>
            )}/>
          </div>
        </fieldset>

        {/* ENROLLMENT --------------------------------------------- */}
        <fieldset className="space-y-4">
          <legend className="font-medium text-gray-600">Enrollment</legend>

          <select {...register("classroom")} className="input">{clsOpts()}</select>

          <Controller control={control} name="enrollment_date" render={({field})=>(
            <DatePicker className="input w-full" selected={field.value} onChange={field.onChange}
                        placeholderText="Enrollment date" dateFormat="yyyy-MM-dd"/>
          )}/>

          <select {...register("enrollment_status")} className="input">
            <option value="active">Active</option>
            <option value="graduated">Graduated</option>
            <option value="left">Left</option>
            <option value="shifted">Shifted</option>
          </select>

          <textarea {...register("enrollment_history")} rows={3}
                    className="input" placeholder="Enrollment history / notes"/>
        </fieldset>

        {/* ID DOCUMENTS ------------------------------------------- */}
        <fieldset className="space-y-4">
          <legend className="font-medium text-gray-600">ID Documents</legend>
          <div className="grid grid-cols-2 gap-4">
            <input {...register("parent_id_number")} className="input" placeholder="Parent ID #"/>
            <Controller control={control} name="parent_id_expiry" render={({field})=>(
              <DatePicker className="input w-full" selected={field.value} onChange={field.onChange}
                          placeholderText="Parent ID expiry" dateFormat="yyyy-MM-dd"/>
            )}/>
            <input {...register("student_id_number")} className="input" placeholder="Student ID #"/>
            <Controller control={control} name="student_id_expiry" render={({field})=>(
              <DatePicker className="input w-full" selected={field.value} onChange={field.onChange}
                          placeholderText="Student ID expiry" dateFormat="yyyy-MM-dd"/>
            )}/>
          </div>
        </fieldset>

        {/* GUARDIAN ----------------------------------------------- */}
        <fieldset className="space-y-4">
          <legend className="font-medium text-gray-600">Guardian</legend>
          <input {...register("guardian_name")}  className="input" placeholder="Guardian name"/>
          <input {...register("guardian_phone")} className="input" placeholder="Guardian phone"/>
        </fieldset>

        {/* ACTIONS ------------------------------------------------- */}
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-primary bg-gray-500 hover:bg-gray-600" onClick={onSaved}>Cancel</button>
          <button className="btn-primary">{initial ? "Update" : "Create"}</button>
        </div>
      </form>
    </div>
  );
}

