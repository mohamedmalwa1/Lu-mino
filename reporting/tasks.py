# reporting/tasks.py
from datetime import timedelta

from celery import shared_task
from celery.utils.log import get_task_logger
from django.utils import timezone

from .models import ReportJob
from . import utils

logger = get_task_logger(__name__)


def _get_builder(report_type: str, fmt: str, params: dict):
    mapping = {
        # Finance
        "PNL":             lambda: utils.generate_pnl_pdf(**params),
        "BS":              lambda: utils.generate_balance_sheet_pdf(**params),
        "CASH":            lambda: utils.generate_cash_flow_pdf(**params),

        # Inventory
        "LOW_STOCK":       (lambda: utils.generate_low_stock_pdf(**params))
                           if fmt == "PDF" else (lambda: utils.generate_low_stock_excel(**params)),
        "INV_VALUATION":   (lambda: utils.generate_inventory_valuation_pdf(**params))
                           if fmt == "PDF" else (lambda: utils.generate_inventory_valuation_excel(**params)),

        # Documents
        "DOC_EXP":         lambda: utils.generate_expiring_docs_excel(**params),   # XLSX only
        "STUDENT_DOCS":    lambda: utils.generate_student_docs_pdf(**params),      # PDF only

        # Students
        "STUDENT_FEES":    (lambda: utils.generate_student_fees_pdf(**params))
                           if fmt == "PDF" else (lambda: utils.generate_student_fees_excel(**params)),
        "ENROLL_SUMMARY":  (lambda: utils.generate_enroll_summary_pdf(**params))
                           if fmt == "PDF" else (lambda: utils.generate_enroll_summary_excel(**params)),

        # NEW: Finance (AR/AP)
        "AR_AGING":        (lambda: utils.generate_ar_aging_pdf(**params))
                           if fmt == "PDF" else (lambda: utils.generate_ar_aging_excel(**params)),
        "AP_AGING":        (lambda: utils.generate_ap_aging_pdf(**params))
                           if fmt == "PDF" else (lambda: utils.generate_ap_aging_excel(**params)),

        # NEW: HR
        "HR_ATT_SUMMARY":  (lambda: utils.generate_hr_attendance_summary_pdf(**params))
                           if fmt == "PDF" else (lambda: utils.generate_hr_attendance_summary_excel(**params)),
    }
    return mapping.get(report_type)


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=10, retry_kwargs={"max_retries": 3})
def build_report(self, job_id: int):
    job = ReportJob.objects.get(id=job_id)
    job.status = "IN_PROGRESS"
    job.task_id = getattr(self.request, "id", None)
    job.save(update_fields=["status", "task_id"])

    params = dict(job.parameters or {})
    fmt = (params.get("format") or "PDF").upper()

    try:
        builder = _get_builder(job.report_type, fmt, params)
        if builder is None:
            raise ValueError(f"Unknown report type: {job.report_type}")

        file_obj = builder()
        if file_obj:
            job.file.save(getattr(file_obj, "name", "report.bin"), file_obj, save=False)
            job.status = "COMPLETED"
            job.error = None
        else:
            job.status = "COMPLETED"
            job.error = "Report generated, but no data was found for the given parameters."
    except Exception as exc:
        logger.exception("Report job %s failed", job_id)
        job.status = "FAILED"
        job.error = str(exc)
        raise
    finally:
        job.generated_at = timezone.now()
        job.save()


@shared_task
def rescue_stuck_jobs(minutes: int = 2) -> dict:
    cutoff = timezone.now() - timedelta(minutes=minutes)
    stuck = list(ReportJob.objects.filter(status="PENDING", created_at__lte=cutoff).values_list("id", flat=True))
    for jid in stuck:
        build_report.delay(jid)
    return {"rescued": len(stuck), "ids": stuck}

