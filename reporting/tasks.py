from celery import shared_task
from reporting.utils import (
    generate_pnl_pdf,
    generate_balance_sheet_pdf,
    generate_low_stock_excel,
    generate_expiring_docs_pdf,
)

@shared_task
def build_report(job_id, report_type, kwargs):
    """
    Dispatch to the correct generator then update ReportJob row.
    """
    from reporting.models import ReportJob  # imported here to avoid circulars
    job = ReportJob.objects.get(id=job_id)

    if report_type == "PNL":
        fn = generate_pnl_pdf
    elif report_type == "BS":
        fn = generate_balance_sheet_pdf
    elif report_type == "LOW_STOCK":
        fn = generate_low_stock_excel
    elif report_type == "DOC_EXP":
        fn = generate_expiring_docs_pdf
    else:
        job.parameters["error"] = "Unknown report type"
        job.save()
        return

    job.parameters.update(kwargs)
    job.save(update_fields=["parameters"])
    # call generator
    fn(**kwargs)  # each generator internally attaches the file to ReportJob

