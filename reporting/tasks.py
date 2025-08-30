# reporting/tasks.py
from __future__ import annotations
import json
from celery import shared_task
from django.core.files.base import ContentFile
from django.utils import timezone

from .models import ReportJob
from . import utils


def _set_status(job: ReportJob, value: str) -> None:
    # works whether you use enum-like containers or plain choices
    for attr in ("Status", "Statuses", "StatusEnum", "StatusChoices"):
        enum = getattr(ReportJob, attr, None)
        if enum and hasattr(enum, value):
            job.status = getattr(enum, value)
            return
    job.status = value


def _as_kwargs(parameters):
    if isinstance(parameters, dict):
        return parameters
    if not parameters:
        return {}
    try:
        return json.loads(parameters)
    except Exception:
        return {}


# Central registry — use getattr so missing builders don’t crash the worker
REPORT_BUILDERS = {
    # PDFs
    "PNL":                    getattr(utils, "generate_pnl_pdf", None),
    "BS":                     getattr(utils, "generate_balance_sheet_pdf", None),
    "CASH":                   getattr(utils, "generate_cash_flow_pdf", None),
    "ENROLL_SUMMARY":         getattr(utils, "generate_enroll_summary_pdf", None),
    "AP_AGING":               getattr(utils, "generate_ap_aging_pdf", None),
    "AR_AGING":               getattr(utils, "generate_ar_aging_pdf", None),
    "STUDENT_DOCS":           getattr(utils, "generate_student_docs_pdf", None),
    "STUDENT_FEES":           getattr(utils, "generate_student_fees_pdf", None),
    "STUDENT_FEES_STATUS":    getattr(utils, "generate_student_fees_status_pdf", None),

    # Excel
    "LOW_STOCK":              getattr(utils, "generate_low_stock_excel", None),
    "DOC_EXP":                getattr(utils, "generate_expiring_docs_excel", None),
    "INV_VALUATION":          getattr(utils, "generate_inventory_valuation", None),
    "PAYROLL_VS_ATT":         getattr(utils, "generate_payroll_vs_att_excel", None),  # optional
}


@shared_task(bind=True, max_retries=0)
def build_report(self, job_id: int):
    job = ReportJob.objects.get(pk=job_id)
    _set_status(job, "IN_PROGRESS")
    job.save(update_fields=["status"])

    params = _as_kwargs(job.parameters or {})
    rtype = job.report_type

    builder = REPORT_BUILDERS.get(rtype)
    if not builder:
        _set_status(job, "FAILED")
        job.error = f"No builder for report type '{rtype}'"
        job.save(update_fields=["status", "error"])
        return

    try:
        content: ContentFile | None = builder(**params)
        if not content:
            _set_status(job, "COMPLETED")
            job.error = "Report generated, but no data was found for the given parameters."
            job.save(update_fields=["status", "error"])
            return

        name = getattr(content, "name", f"report_{job.id}.bin")
        job.file.save(name, content, save=False)
        _set_status(job, "COMPLETED")
        job.generated_at = timezone.now()
        job.error = None
        job.save(update_fields=["file", "status", "generated_at", "error"])
        return

    except Exception as e:
        _set_status(job, "FAILED")
        job.error = f"{type(e).__name__}: {e}"
        job.save(update_fields=["status", "error"])
        raise

