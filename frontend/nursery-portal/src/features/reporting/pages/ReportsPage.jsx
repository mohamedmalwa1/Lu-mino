import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast, Toaster } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiFile, FiClock, FiCheckCircle, FiXCircle, FiDownload, FiLoader } from 'react-icons/fi';

// Correctly import from the new api file
import { requestReport, getReportStatus, getReportDownloadUrl } from '../../../api/reporting';

// A component for each individual report job row
const ReportJobRow = ({ job }) => {
    const { data: report } = useQuery({
        queryKey: ['reportStatus', job.id],
        queryFn: () => getReportStatus(job.id),
        // Refetch every 2.5 seconds ONLY if the report is still processing
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            return status === 'PENDING' || status === 'IN_PROGRESS' ? 2500 : false;
        },
    });

    const getStatusInfo = (status) => {
        switch (status) {
            case 'COMPLETED': return { icon: <FiCheckCircle className="text-green-500" />, text: 'Completed' };
            case 'PENDING': return { icon: <FiClock className="text-yellow-500" />, text: 'Pending...' };
            case 'IN_PROGRESS': return { icon: <FiLoader className="animate-spin text-blue-500" />, text: 'In Progress...' };
            case 'FAILED': return { icon: <FiXCircle className="text-red-500" />, text: 'Failed' };
            default: return { icon: <FiFile className="text-gray-400" />, text: 'Loading...' };
        }
    };
    
    const { icon, text } = getStatusInfo(report?.status);

    return (
        <div className="flex items-center justify-between p-4 border-b last:border-b-0">
            <div className="flex items-center gap-4">
                {icon}
                <div>
                    <p className="font-semibold">{report?.report_type?.replace(/_/g, ' ') || 'Report'}</p>
                    <p className="text-sm text-gray-500">
                        Requested on {new Date(job.created_at).toLocaleString()}
                    </p>
                </div>
            </div>
            <div>
                {report?.status === 'COMPLETED' ? (
                    <a href={getReportDownloadUrl(job.id)} download target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center gap-2">
                        <FiDownload /> Download
                    </a>
                ) : (
                    <p className="text-sm text-gray-500">{text}</p>
                )}
            </div>
        </div>
    );
};


// The main page component
export default function ReportsPage() {
    const [reportType, setReportType] = useState('PNL');
    const [params, setParams] = useState({ start: new Date(), end: new Date() });
    const [jobs, setJobs] = useState(() => JSON.parse(localStorage.getItem('reportJobs')) || []);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        const formattedParams = {
            start: params.start.toISOString().split('T')[0],
            end: params.end.toISOString().split('T')[0],
        };

        try {
            const data = await requestReport(reportType, formattedParams);
            toast.success(`Report generation started! (Job ID: ${data.job_id})`);
            const newJob = { id: data.job_id, created_at: new Date().toISOString() };
            const updatedJobs = [...jobs, newJob];
            setJobs(updatedJobs);
            localStorage.setItem('reportJobs', JSON.stringify(updatedJobs));
        } catch (error) {
            toast.error("Failed to request report.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />
            <h1 className="text-3xl font-bold">Reports</h1>

            <div className="bg-white p-6 rounded-lg shadow-md border">
                <h2 className="text-xl font-semibold mb-4">Generate a New Report</h2>
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Report Type</label>
                        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="input">
                            <option value="PNL">Profit & Loss</option>
                            <option value="BS">Balance Sheet</option>
                            <option value="CASH">Cash Flow</option>
                            <option value="PAYROLL_VS_ATT">Payroll vs Attendance</option>
                            <option value="LOW_STOCK">Low Stock</option>
                            <option value="DOC_EXP">Expiring Documents</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                        <DatePicker selected={params.start} onChange={(date) => setParams({ ...params, start: date })} className="input"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">End Date</label>
                        <DatePicker selected={params.end} onChange={(date) => setParams({ ...params, end: date })} className="input"/>
                    </div>
                    <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary">
                        {isGenerating ? "Generating..." : "Generate Report"}
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border">
                <h2 className="text-xl font-semibold mb-4">Your Report Jobs</h2>
                <div className="space-y-2">
                    {jobs.length > 0 ? (
                        [...jobs].reverse().map(job => <ReportJobRow key={job.id} job={job} />)
                    ) : (
                        <p className="text-gray-500 p-4">You haven't generated any reports yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
