import { useEffect }         from "react";
import { useForm }           from "react-hook-form";
import { yupResolver }       from "@hookform/resolvers/yup";
import * as yup              from "yup";
import toast                 from "react-hot-toast";
import {
  createClassroom,
  updateClassroom,
} from "../../../api/classrooms";
import { listTeachers }      from "../../../api/students";
import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import Spinner               from "../../../components/ui/Spinner";

const schema = yup.object({
  name          : yup.string().required().max(50),
  capacity      : yup.number().min(5).max(60).required(),
  assigned_teacher : yup.number().nullable(true),
});

export default function ClassroomForm({ initial=null, onSaved }) {
  /* ---------------- form ---------------- */
  const {
    register, handleSubmit, reset,
    formState:{ errors },
  } = useForm({
    resolver     : yupResolver(schema),
    defaultValues: { name:"", capacity:25, assigned_teacher:null },
  });

  useEffect(()=>{ reset(initial ?? { name:"", capacity:25, assigned_teacher:null }); },
             [initial, reset]);

  /* ------------- teachers --------------- */
  const { data:teachers, isLoading:ldTeach } = useQuery({
    queryKey: ["teachers"],
    queryFn : listTeachers,
  });

  /* ------------- save ------------------- */
  const isEdit = !!initial;
  const { mutate:save, isPending } = useMutation({
    mutationFn : (payload) =>
      isEdit ? updateClassroom(initial.id, payload)
             : createClassroom(payload),
    onSuccess  : () => {
      toast.success(isEdit ? "Updated" : "Created");
      onSaved();
    },
    onError    : () => toast.error("Save failed"),
  });

  /* ------------- UI --------------------- */
  return (
    <form onSubmit={handleSubmit(save)} className="p-6 space-y-4 w-[28rem]">
      <h2 className="text-xl font-semibold mb-2">
        {isEdit ? "Edit Classroom" : "Add Classroom"}
      </h2>

      {/* name -------------------- */}
      <div>
        <label className="block mb-1">Name *</label>
        <input
          className="input"
          placeholder="e.g. KG-A"
          {...register("name")}
        />
        {errors.name && <p className="text-red-600 text-xs">{errors.name.message}</p>}
      </div>

      {/* capacity --------------- */}
      <div>
        <label className="block mb-1">Capacity *</label>
        <input type="number" min={5} max={60} className="input" {...register("capacity")} />
        {errors.capacity && <p className="text-red-600 text-xs">{errors.capacity.message}</p>}
      </div>

      {/* teacher ---------------- */}
      <div>
        <label className="block mb-1">Assigned Teacher</label>
        {ldTeach ? (
          <Spinner />
        ) : (
          <select className="input" {...register("assigned_teacher")}>
            <option value="">— None —</option>
            {teachers?.map((t)=>(
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
        )}
      </div>

      {/* buttons --------------- */}
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
          onClick={onSaved}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

