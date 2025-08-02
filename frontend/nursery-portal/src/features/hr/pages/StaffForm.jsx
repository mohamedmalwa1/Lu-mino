import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { createStaff, updateStaff, getStaff } from "../../../api/hr";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  first_name: yup.string().required("First name is required"),
  last_name: yup.string().required("Last name is required"),
  role: yup.string().required("Role is required"),
  email: yup.string().email("Invalid email format").required("Email is required"),
  phone: yup.string().required("Phone number is required"),
  id_number: yup.string().required("ID number is required"),
  id_expiry: yup.date().required("ID expiry date is required"),
  hire_date: yup.date().required("Hire date is required"),
  is_active: yup.boolean(), // New field
});

const blank = {
  first_name: "",
  last_name: "",
  role: "TEACHER",
  email: "",
  phone: "",
  id_number: "",
  id_expiry: null,
  hire_date: new Date(),
  is_active: true, // Default to active
};

export default function StaffForm() {
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

  const { data: staffMember, isLoading: isLoadingStaff } = useQuery({
      queryKey: ["staff", id],
      queryFn: () => getStaff(id),
      enabled: !isNew,
  });

  useEffect(() => {
    if (staffMember) {
        reset({ 
            ...staffMember, 
            id_expiry: new Date(staffMember.id_expiry),
            hire_date: new Date(staffMember.hire_date),
        });
    } else {
        reset(blank);
    }
  }, [staffMember, reset]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => {
      const payload = { 
          ...data, 
          id_expiry: data.id_expiry.toISOString().split("T")[0],
          hire_date: data.hire_date.toISOString().split("T")[0],
      };
      return isNew ? createStaff(payload) : updateStaff(id, payload);
    },
    onSuccess: () => { 
        toast.success(`Staff member ${isNew ? 'created' : 'updated'}!`);
        qc.invalidateQueries({ queryKey: ["staff"] });
        navigate("/hr/staff");
    },
    onError: (err) => { 
        console.error("Save failed:", err.response?.data);
        toast.error("Failed to save staff member."); 
    },
  });

  if (!isNew && isLoadingStaff) {
      return <Spinner />;
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-6">
            {isNew ? "Add New Staff Member" : "Edit Staff Member"}
        </h2>
        <form onSubmit={handleSubmit(save)} className="space-y-6 max-w-2xl">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input {...register("first_name")} className="input w-full" placeholder="First Name *" />
                <input {...register("last_name")} className="input w-full" placeholder="Last Name *" />
            </div>
             {errors.first_name && <p className="text-red-600 text-sm mt-1">{errors.first_name.message}</p>}
             {errors.last_name && <p className="text-red-600 text-sm mt-1">{errors.last_name.message}</p>}

            <select {...register("role")} className="input w-full">
                <option value="TEACHER">Teacher</option>
                <option value="ASSISTANT">Assistant</option>
                <option value="ADMIN">Administrator</option>
                <option value="NURSE">Nurse</option>
            </select>
            {errors.role && <p className="text-red-600 text-sm mt-1">{errors.role.message}</p>}

            <input {...register("email")} className="input w-full" placeholder="Email Address *" />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
            
            <input {...register("phone")} className="input w-full" placeholder="Phone Number *" />
            {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}

            <input {...register("id_number")} className="input w-full" placeholder="ID Number *" />
            {errors.id_number && <p className="text-red-600 text-sm mt-1">{errors.id_number.message}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block mb-1 font-medium">ID Expiry Date *</label>
                    <Controller control={control} name="id_expiry" render={({ field }) => (
                        <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
                    )}/>
                    {errors.id_expiry && <p className="text-red-600 text-sm mt-1">{errors.id_expiry.message}</p>}
                </div>
                <div>
                    <label className="block mb-1 font-medium">Hire Date *</label>
                    <Controller control={control} name="hire_date" render={({ field }) => (
                        <DatePicker className="input w-full" selected={field.value} onChange={field.onChange} dateFormat="yyyy-MM-dd" />
                    )}/>
                    {errors.hire_date && <p className="text-red-600 text-sm mt-1">{errors.hire_date.message}</p>}
                </div>
            </div>
            
            {/* "Is Active" Checkbox */}
            <div className="flex items-center gap-2">
                <input type="checkbox" {...register("is_active")} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label className="font-medium">Is Active</label>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" className="btn-secondary" onClick={() => navigate("/hr/staff")}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-60">
                {isPending ? "Saving…" : "Save"}
                </button>
            </div>
        </form>
    </div>
  );
}

