// src/features/reporting/pages/ReportsPage.jsx
import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiDownload, FiFileText, FiPlayCircle, FiRefreshCcw } from "react-icons/fi";
import { toast } from "react-hot-toast";
import {
  listReports,
  requestReport,
  getReportStatus,
  downloadReport,
} from "../../../api/reporting";

// Report catalog:
// - params: which extra inputs to show ("dates", "threshold", "daysAhead")
// - formats: which output formats are supported for this report
const REPORTS = {
  // Finance
  PNL:             { label: "Profit & Loss",                params: ["dates"],   formats: ["PDF"] },
  CASH:            { label: "Cash Flow",                    params: ["dates"],   formats: ["PDF"] },
  BS:              { label: "Balance Sheet",                params: [],          formats: ["PDF"] },

  // Inventory
  LOW_STOCK:       { label: "Inventory: Low Stock",         params: ["threshold"], formats: ["PDF", "XLSX"] },
  INV_VALUATION:   { label: "Inventory Valuation",          params: [],          formats: ["PDF", "XLSX"] },

  // Documents
  DOC_EXP:         { label: "Expiring Documents",           params: ["daysAhead"], formats: ["XLSX"] },
  STUDENT_DOCS:    { label: "Student Documents",            params: [],          formats: ["PDF"] },

  // Students
  STUDENT_FEES:    { label: "Student Fees (Paid/Unpaid)",   params: ["dates"],   formats: ["PDF", "XLSX"] },
  ENROLL_SUMMARY:  { label: "Enrollment Summary",           params: [],          formats: ["PDF", "XLSX"] },

  // Finance (aging)
  AR_AGING:        { label: "Accounts Receivable Aging",    params: [],          formats: ["PDF", "XLSX"] },
  AP_AGING:        { label: "Accounts Payable Aging",       params: [],          formats: ["PDF", "XLSX"] },

  // HR
  HR_ATT_SUMMARY:  { label: "HR Attendance Summary",        params: ["dates"],   formats: ["PDF", "XLSX"] },
};

function fmtDate(d) {
  if (!d) return "";
  const iso = new Date(d).toISOString();
  return iso.split("T")[0];
}

export default function ReportsPage() {
  const qc = useQueryClient();

  const [reportType, setReportType] = useState("CASH");
  const [format, setFormat] = useState("PDF");
  const [params, setParams] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(),
    threshold: 5,
    days_ahead: 30,
  });
  const [currentJobId, setCurrentJobId] = useState(null);

  const jobsQuery = useQuery({
    queryKey: ["reports", "list"],
    queryFn: listReports,
    refetchInterval: 8000,
  });

  const jobStatusQuery = useQuery({
    queryKey: ["reports", "job", currentJobId],
    queryFn: () => getReportStatus(currentJobId),
    enabled: !!currentJobId,
    refetchInterval: 2500,
    staleTime: 0,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const cfg = REPORTS[reportType] || {};
      const payload = { format };

      if (cfg.params?.includes("dates")) {
        payload.start = fmtDate(params.start);
        payload.end = fmtDate(params.end);
      }
      if (cfg.params?.includes("threshold")) {
        payload.threshold = Number(params.threshold) || null;
      }
      if (cfg.params?.includes("daysAhead")) {
        payload.days_ahead = Number(params.days_ahead) || 30;
      }

      const job = await requestReport(reportType, payload);
      return job;
    },
    onSuccess: (job) => {
      setCurrentJobId(job.id);
      toast.success(`${REPORTS[reportType].label} requested`);
      qc.invalidateQueries({ queryKey: ["reports", "list"] });
    },
    onError: (e) => {
      console.error(e);
      toast.error("Failed to request report");
    },
  });

  const currentJob = jobStatusQuery.data;
  const cfg = REPORTS[reportType] || {};

  async function downloadById(jobId, fallbackName = "report") {
    try {
      const { blob, filename } = await downloadReport(jobId);
      const name = filename || `${fallbackName}.${(filename||"").endsWith(".xlsx") ? "xlsx" : (format === "XLSX" ? "xlsx" : "pdf")}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name; document.body.appendChild(a);
      a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error("Download failed");
    }
  }

  const controls = useMemo(() => (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
      {/* Report */}
      <div className="lg:col-span-2">
        <label className="block mb-1 font-medium">Report</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={reportType}
          onChange={(e) => {
            const next = e.target.value;
            setReportType(next);
            const avail = REPORTS[next]?.formats || ["PDF"];
            if (!avail.includes(format)) setFormat(avail[0]);
          }}
        >
          {Object.entries(REPORTS).map(([key, v]) => (
            <option key={key} value={key}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Format */}
      <div>
        <label className="block mb-1 font-medium">Format</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        >
          {(REPORTS[reportType]?.formats || ["PDF"]).map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Dates */}
      {cfg.params?.includes("dates") && (
        <>
          <div>
            <label className="block mb-1 font-medium">Start</label>
            <DatePicker
              selected={params.start}
              onChange={(date) => setParams((p) => ({ ...p, start: date }))}
              className="w-full border rounded px-3 py-2"
              dateFormat="yyyy-MM-dd"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">End</label>
            <DatePicker
              selected={params.end}
              onChange={(date) => setParams((p) => ({ ...p, end: date }))}
              className="w-full border rounded px-3 py-2"
              dateFormat="yyyy-MM-dd"
            />
          </div>
        </>
      )}

      {/* Threshold */}
      {cfg.params?.includes("threshold") && (
        <div>
          <label className="block mb-1 font-medium">Threshold</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={params.threshold}
            onChange={(e) => setParams((p) => ({ ...p, threshold: e.target.value }))}
          />
        </div>
      )}

      {/* Days ahead */}
      {cfg.params?.includes("daysAhead") && (
        <div>
          <label className="block mb-1 font-medium">Days Ahead</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={params.days_ahead}
            onChange={(e) => setParams((p) => ({ ...p, days_ahead: e.target.value }))}
          />
        </div>
      )}
    </div>
  ), [reportType, params, format]);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <FiFileText /><h1 className="text-xl font-semibold">Reports</h1>
      </div>

      <div className="space-y-4">
        {controls}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="px-4 py-2 rounded bg-blue-600 text-white flex items-center gap-2 disabled:opacity-60"
          >
            <FiPlayCircle /> {createMutation.isPending ? "Requesting..." : "Generate"}
          </button>

          {currentJob?.status === "COMPLETED" && (
            <button
              onClick={() => downloadById(currentJob.id)}
              className="px-4 py-2 rounded bg-emerald-600 text-white flex items-center gap-2"
            >
              <FiDownload /> Download
            </button>
          )}

          {currentJob?.status && (
            <span className="px-3 py-2 rounded border bg-gray-50">
              Status: <b>{currentJob.status_display || currentJob.status}</b>
            </span>
          )}

          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["reports", "list"] })}
            className="px-3 py-2 rounded border flex items-center gap-2"
            title="Refresh list"
          >
            <FiRefreshCcw /> Refresh
          </button>
        </div>

        {/* Recent jobs list */}
        <div className="border rounded">
          <div className="px-3 py-2 border-b bg-gray-50 font-medium">Recent Jobs</div>
          <div className="divide-y">
            {(jobsQuery.data || []).map((j) => (
              <div key={j.id} className="px-3 py-2 flex items-center justify-between">
                <div className="space-x-2">
                  <span className="font-mono text-sm">#{j.id}</span>
                  <span>{j.report_type_display || j.report_type}</span>
                  <span className="text-gray-500 text-sm">
                    {j.generated_at?.replace("T"," ").replace("Z","")}
                  </span>
                  {j.error && <span className="text-red-600 text-sm">Error: {j.error}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{j.status_display || j.status}</span>
                  {j.status === "COMPLETED" ? (
                    <button
                      onClick={() => downloadById(j.id, (j.file || "").split("/").pop() || "report")}
                      className="px-3 py-1 rounded bg-emerald-600 text-white flex items-center gap-2"
                    >
                      <FiDownload /> Download
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentJobId(j.id)}
                      className="px-3 py-1 rounded border"
                    >
                      Track
                    </button>
                  )}
                </div>
              </div>
            ))}
            {jobsQuery.isFetching && <div className="px-3 py-2 text-sm text-gray-500">Refreshing…</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

