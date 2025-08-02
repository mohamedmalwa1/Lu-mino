import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { 
    createStaffAttendance, 
    updateStaffAttendance, 
    getStaffAttendance,
    listStaff,
} from "../../../api/hr";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  staff: yup.number().required("Staff member is required"),
  date: yup.date().required("Date is required"),
  status: yup.string().required("Status is required"),
  note: yup.string(),
});

const blank = {
  staff: "",
  date: new Date(),
  status: "PRESENT",
  note: "",
};

export default function StaffAttendanceForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const qc = useQueryClient();
    const isNew = !id;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: blank,
  });

  const { data: attendanceRecord, isLoading: isLoadingRecord } = useQuery({
      queryKey: ["staffAttendance", id],
      queryFn: () => getStaffAttendance(id),
      enabled: !isNew,
  });
  
  const { data: staff = [], isLoading: isLoadingStaff } = useQuery({
      queryKey: ["staff"],
      queryFn: () => listStaff({ is_active: true }),
  });

  useEffect(() => {
    if (attendanceRecord) {
        reset({ ...attendanceRecord, date: new Date(attendanceRecord.date) });
    } else {
        reset(blank);
    }
  }, [attendanceRecord, reset]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, date: data.date.toISOString().split("T")[0] };
      return isNew ? createStaffAttendance(payload) : updateStaffAttendance(id, payload);
    },
    onSuccess: () => { 
        toast.success(`Record ${isNew ? 'created' : 'updated'}!`);
        qc.invalidateQueries({ queryKey: ["staffAttendance"] });
        navigate("/hr/attendance");
    },
    onError: (err) => { 
        console.error("Save failed:", err.response?.data);
        toast.error("Failed to save record."); 
    },
  });

  if (!isNew && isLoadingRecord) {
      return <Spinner />;
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-6">
            {isNew ? "Add Attendance Record" : "Edit Attendance Record"}
        </h2>
        <form onSubmit={handleSubmit(save)} className="space-y-6 max-w-2xl">
            
            <div>
                <label className="block mb-1 font-medium">Staff Member *</label>
                {isLoadingStaff ? <Spinner /> : (
                    <select {...register("staff")} className="input w-full">
                        <option value="">— Select Staff —</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                )}
                {errors.staff && <p className="text-red-600 text-sm mt-1">{errors.staff.message}</p>}
            </div>

            <div>
                <label className="block mb-1 font-medium">Date *</label>
                <Controller control={control} name="date" render={({ field }) => (
                    <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
                )}/>
                {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>}
            </div>

            <div>
                <label className="block mb-1 font-medium">Status *</label>
                <select {...register("status")} className="input w-full">
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="SICK">Sick</option>
                    <option value="LEAVE">On Leave</option>
                </select>
                {errors.status && <p className="text-red-600 text-sm mt-1">{errors.status.message}</p>}
            </div>

            <div>
                <label className="block mb-1 font-medium">Note (Optional)</label>
                <textarea {...register("note")} rows={3} className="input w-full" placeholder="e.g., Arrived late" />
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" className="btn-secondary" onClick={() => navigate("/hr/attendance")}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-60">
                {isPending ? "Saving…" : "Save Record"}
                </button>
            </div>
        </form>
    </div>
  );
}

