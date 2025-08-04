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
    createCustodyAssignment, 
    updateCustodyAssignment, 
    getCustodyAssignment,
    listItems,
} from "../../../api/inventory";
import { listStaff } from "../../../api/hr";
import { listStudents } from "../../../api/students";
import Spinner from "../../../components/ui/Spinner";

const schema = yup.object({
  item: yup.number().required("Please select an item"),
  quantity: yup.number()
    .positive("Quantity must be positive")
    .integer("Quantity must be a whole number")
    .required("Please enter quantity"),
  staff: yup.number().nullable(),
  student: yup.number().nullable(),
  assigned_on: yup.date().required("Please select assignment date"),
  return_date: yup.date().nullable(),
}).test(
  "staff-or-student",
  "Please assign to either staff or student (not both)",
  (value) => (!!value.staff && !value.student) || (!value.staff && !!value.student)
);

export default function CustodyAssignmentForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const qc = useQueryClient();
    const isNew = !id;

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        setValue,
        formState: { errors, isDirty },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            quantity: 1,
            assigned_on: new Date(),
        }
    });

    const watchStaff = watch("staff");
    const watchStudent = watch("student");

    // Clear the other field when one is selected
    useEffect(() => {
        if (watchStaff) setValue("student", null);
        if (watchStudent) setValue("staff", null);
    }, [watchStaff, watchStudent, setValue]);

    const { data: assignment, isLoading: isLoadingAssignment } = useQuery({
        queryKey: ["custodyAssignment", id],
        queryFn: () => getCustodyAssignment(id),
        enabled: !isNew,
    });
    
    const { data: items = [], isLoading: isLoadingItems } = useQuery({ 
        queryKey: ["items"], 
        queryFn: listItems 
    });
    const { data: staff = [], isLoading: isLoadingStaff } = useQuery({ 
        queryKey: ["staff"], 
        queryFn: () => listStaff({ is_active: true }) 
    });
    const { data: students = [], isLoading: isLoadingStudents } = useQuery({ 
        queryKey: ["students"], 
        queryFn: listStudents 
    });

    useEffect(() => {
        if (assignment) {
            reset({ 
                ...assignment, 
                assigned_on: new Date(assignment.assigned_on),
                return_date: assignment.return_date ? new Date(assignment.return_date) : null,
            });
        }
    }, [assignment, reset]);

    const { mutate: save, isPending } = useMutation({
        mutationFn: (data) => {
            const payload = { 
                ...data, 
                assigned_on: data.assigned_on.toISOString().split("T")[0],
                return_date: data.return_date ? data.return_date.toISOString().split("T")[0] : null,
            };
            return isNew ? createCustodyAssignment(payload) : updateCustodyAssignment(id, payload);
        },
        onSuccess: () => { 
            toast.success(`Assignment ${isNew ? 'created' : 'updated'} successfully!`);
            qc.invalidateQueries({ queryKey: ["custodyAssignments"] });
            navigate("/inventory/custody");
        },
        onError: (err) => { 
            console.error("Save failed:", err.response?.data);
            toast.error(err.response?.data?.message || "Failed to save assignment"); 
        },
    });

    if (!isNew && isLoadingAssignment) {
        return <Spinner fullPage />;
    }

    return (
        <div className="bg-white shadow-lg rounded-2xl p-6">
            <h2 className="text-2xl font-semibold mb-6">
                {isNew ? "New Custody Assignment" : "Edit Custody Assignment"}
            </h2>
            
            <form onSubmit={handleSubmit(save)} className="space-y-6 max-w-2xl">
                {/* Item Selection */}
                <div>
                    <label className="block mb-1 font-medium required">Item</label>
                    <select 
                        {...register("item")} 
                        className="input w-full"
                        disabled={isLoadingItems}
                    >
                        <option value="">— Select Item —</option>
                        {items.map(i => (
                            <option key={i.id} value={i.id}>
                                {i.name} ({i.sku}) - Qty: {i.quantity}
                            </option>
                        ))}
                    </select>
                    {errors.item && (
                        <p className="text-red-600 text-sm mt-1">{errors.item.message}</p>
                    )}
                </div>

                {/* Quantity */}
                <div>
                    <label className="block mb-1 font-medium required">Quantity</label>
                    <input 
                        type="number" 
                        {...register("quantity")} 
                        className="input w-full" 
                        placeholder="Enter quantity"
                        min={1}
                    />
                    {errors.quantity && (
                        <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>
                    )}
                </div>

                {/* Assignment Target */}
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        {watchStaff 
                            ? "Currently assigned to staff" 
                            : watchStudent 
                                ? "Currently assigned to student" 
                                : "Select assignment target"}
                    </p>
                    
                    <div>
                        <label className="block mb-1 font-medium">Staff Member</label>
                        <select 
                            {...register("staff")} 
                            className={`input w-full ${watchStudent ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!!watchStudent || isLoadingStaff}
                        >
                            <option value="">— Select Staff —</option>
                            {staff.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.full_name} ({s.position})
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block mb-1 font-medium">Student</label>
                        <select 
                            {...register("student")} 
                            className={`input w-full ${watchStaff ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!!watchStaff || isLoadingStudents}
                        >
                            <option value="">— Select Student —</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} (Grade {s.grade_level})
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {errors[''] && (
                        <p className="text-red-600 text-sm mt-1">{errors[''].message}</p>
                    )}
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block mb-1 font-medium required">Assigned On</label>
                        <Controller 
                            control={control} 
                            name="assigned_on" 
                            render={({ field }) => (
                                <DatePicker 
                                    className="input w-full" 
                                    selected={field.value} 
                                    onChange={field.onChange} 
                                    dateFormat="yyyy-MM-dd"
                                    maxDate={new Date()}
                                />
                            )}
                        />
                        {errors.assigned_on && (
                            <p className="text-red-600 text-sm mt-1">{errors.assigned_on.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Expected Return Date</label>
                        <Controller 
                            control={control} 
                            name="return_date" 
                            render={({ field }) => (
                                <DatePicker 
                                    className="input w-full" 
                                    selected={field.value} 
                                    onChange={field.onChange} 
                                    dateFormat="yyyy-MM-dd" 
                                    isClearable
                                    minDate={watch("assigned_on")}
                                    placeholderText="Optional return date"
                                />
                            )}
                        />
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block mb-1 font-medium">Notes</label>
                    <textarea 
                        {...register("notes")} 
                        rows={3} 
                        className="input w-full" 
                        placeholder="Add any notes about this assignment"
                    />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-4">
                    <button 
                        type="button" 
                        className="btn-secondary" 
                        onClick={() => navigate("/inventory/custody")}
                        disabled={isPending}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={isPending || !isDirty}
                        className="btn-primary disabled:opacity-60"
                    >
                        {isPending ? "Saving…" : "Save Assignment"}
                    </button>
                </div>
            </form>
        </div>
    );
}
