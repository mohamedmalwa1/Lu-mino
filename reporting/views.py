from django.views.generic import DetailView
from django.http import HttpResponse
from .utils import generate_pnl_pdf, generate_low_stock_excel
from datetime import date, timedelta


def pnl_report(request):
    # For demo: this month
    start = date.today().replace(day=1)
    end   = date.today()
    job   = generate_pnl_pdf(start, end)
    return HttpResponse(job.file.open(), content_type="application/pdf")


def low_stock_report(request):
    job = generate_low_stock_excel()
    response = HttpResponse(
        job.file.open(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response["Content-Disposition"] = 'attachment; filename="low_stock.xlsx"'
    return response
def balance_sheet(request):
    job = generate_balance_sheet_pdf()
    return HttpResponse(job.file.open(), content_type="application/pdf")


def cash_flow(request):
    start = date.today().replace(month=1, day=1)
    end   = date.today()
    job = generate_cash_flow_pdf(start, end)
    return HttpResponse(job.file.open(), content_type="application/pdf")


def payroll_vs_att(request):
    start = date.today().replace(month=1, day=1)
    end   = date.today()
    job = generate_payroll_vs_att_excel(start, end)
    resp = HttpResponse(
        job.file.open(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    resp["Content-Disposition"] = 'attachment; filename="payroll_vs_att.xlsx"'
    return resp
    
def expiring_docs(request):
    """Download Excel of docs expiring <= 30 days (or ?days=XX)."""
    days = int(request.GET.get("days", 30))
    job  = generate_expiring_docs_excel(days)
    resp = HttpResponse(
        job.file.open(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    resp["Content-Disposition"] = f'attachment; filename="expiring_docs_{days}d.xlsx"'
    return resp

