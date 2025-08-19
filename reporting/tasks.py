# reporting/tasks.py
from datetime import timedelta

from celery import shared_task
from celery.utils.log import get_task_logger
from django.utils import timezone

from .models import ReportJob
from . import utils

logger = get_task_logger(__name__)


def _get_builder(report_type: str, fmt: str, params: dict):
    """
    Return a zero-arg callable that builds the report file for the given type.
    `fmt` is "PDF" or "XLSX" (uppercased). `params` is the job.parameters dict.
    """
    mapping = {
        # Finance
        "PNL":             lambda: utils.generate_pnl_pdf(**params),
        "BS":              lambda: utils.generate_balance_sheet_pdf(**params),
        "CASH":            lambda: utils.generate_cash_flow_pdf(**params),

        # Inventory
        "LOW_STOCK":       (lambda: utils.generate_low_stock_pdf(**params))
                           if fmt == "PDF"
                           else (lambda: utils.generate_low_stock_excel(**params)),

        # Documents
        "DOC_EXP":         lambda: utils.generate_expiring_docs_excel(**params),  # XLSX only
        "STUDENT_DOCS":    lambda: utils.generate_student_docs_pdf(**params),     # PDF only

        # Students
        "STUDENT_FEES":    (lambda: utils.generate_student_fees_pdf(**params))
                           if fmt == "PDF"
                           else (lambda: utils.generate_student_fees_excel(**params)),

        "ENROLL_SUMMARY":  (lambda: utils.generate_enroll_summary_pdf(**params))
                           if fmt == "PDF"
                           else (lambda: utils.generate_enroll_summary_excel(**params)),
    }
    return mapping.get(report_type)


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=10, retry_kwargs={"max_retries": 3})
def build_report(self, job_id: int):
    """
    Build a report, attach the generated file to the ReportJob, and update status.
    Robust to empty-data cases and unknown report types.
    """
    job = ReportJob.objects.get(id=job_id)

    # Mark as in progress and remember Celery task id
    job.status = "IN_PROGRESS"
    job.task_id = getattr(self.request, "id", None)
    job.save(update_fields=["status", "task_id"])

    params = dict(job.parameters or {})
    fmt = (params.get("format") or "PDF").upper()

    try:
        builder = _get_builder(job.report_type, fmt, params)
        if builder is None:
            raise ValueError(f"Unknown report type: {job.report_type}")

        file_obj = builder()  # may return None if no data

        if file_obj:
            # Ensure the file is persisted with a proper name
            name = getattr(file_obj, "name", "report.bin")
            job.file.save(name, file_obj, save=False)
            job.status = "COMPLETED"
            job.error = None
        else:
            job.status = "COMPLETED"
            job.error = "Report generated, but no data was found for the given parameters."

    except Exception as exc:
        logger.exception("Report job %s failed", job_id)
        job.status = "FAILED"
        job.error = str(exc)
        # re-raise so Celery autoretry can kick in (up to max_retries)
        raise
    finally:
        job.generated_at = timezone.now()
        job.save()


@shared_task
def rescue_stuck_jobs(minutes: int = 2) -> dict:
    """
    Re-dispatch any jobs that have been PENDING for more than `minutes`.
    Schedule this via celery-beat (e.g., every minute).
    """
    cutoff = timezone.now() - timedelta(minutes=minutes)
    stuck = list(ReportJob.objects.filter(status="PENDING", created_at__lte=cutoff).values_list("id", flat=True))
    for jid in stuck:
        build_report.delay(jid)
    return {"rescued": len(stuck), "ids": stuck}

