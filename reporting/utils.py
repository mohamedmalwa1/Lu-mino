from datetime import date
from django.template.loader import render_to_string
from django.conf import settings
from weasyprint import HTML
import pandas as pd
from finance.models import TreasuryTransaction
from inventory.models import Item
from django.core.files.base import ContentFile
from .models import ReportJob
from collections import defaultdict
from hr.models import SalaryRecord, StaffAttendance
from student.models import StudentDocument
from hr.models import StaffDocument


# ───────── Profit & Loss PDF ─────────
def generate_pnl_pdf(start: date, end: date) -> ReportJob:
    qs = TreasuryTransaction.objects.filter(date__range=[start, end])

    revenue = qs.filter(is_inflow=True).aggregate(total=pd.models.Sum('amount'))['total'] or 0
    expense = qs.filter(is_inflow=False).aggregate(total=pd.models.Sum('amount'))['total'] or 0
    profit  = revenue - expense

    context = {
        "start": start, "end": end,
        "revenue": revenue, "expense": expense, "profit": profit,
        "transactions": qs.order_by('date'),
    }

    html = render_to_string("reports/pnl.html", context)
    pdf  = HTML(string=html, base_url=settings.BASE_DIR).write_pdf()

    job = ReportJob(report_type="PNL", parameters={"start": str(start), "end": str(end)})
    job.file.save(f"pnl_{start}_{end}.pdf", ContentFile(pdf))
    job.save()
    return job


# ───────── Low-Stock Excel ─────────
def generate_low_stock_excel() -> ReportJob:
    df = pd.DataFrame(
        Item.objects.filter(quantity__lte=models.F('reorder_level'))
        .values("name", "sku", "quantity", "reorder_level", "vendor__name")
    )
    buffer = ContentFile(b"")  # in-memory
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Low Stock")
    buffer.seek(0)

    job = ReportJob(report_type="LOW_STOCK", parameters={})
    job.file.save("low_stock.xlsx", buffer)
    job.save()
    return job
# ───────── Balance-Sheet PDF ─────────
def generate_balance_sheet_pdf(as_of=None):
    if as_of is None:
        as_of = date.today()

    # Assets / Liabilities from TreasuryTransaction to date
    tx = TreasuryTransaction.objects.filter(date__lte=as_of)
    assets  = tx.filter(is_inflow=True ).aggregate(total=Sum("amount"))["total"] or 0
    debts   = tx.filter(is_inflow=False).aggregate(total=Sum("amount"))["total"] or 0
    equity  = assets - debts

    context = {
        "as_of": as_of,
        "assets": assets,
        "debts": debts,
        "equity": equity,
    }
    html = render_to_string("reports/balance_sheet.html", context)
    pdf  = HTML(string=html, base_url=settings.BASE_DIR).write_pdf()

    job = ReportJob(report_type="BS", parameters={"as_of": str(as_of)})
    job.file.save(f"balance_sheet_{as_of}.pdf", ContentFile(pdf))
    job.save()
    return job


# ───────── Cash-Flow PDF (group by month) ─────────
def generate_cash_flow_pdf(start, end):
    qs = TreasuryTransaction.objects.filter(date__range=[start, end])

    monthly = defaultdict(lambda: {"in": 0, "out": 0})
    for tx in qs:
        key = tx.date.replace(day=1)
        if tx.is_inflow:
            monthly[key]["in"]  += tx.amount
        else:
            monthly[key]["out"] += tx.amount

    rows = []
    for m in sorted(monthly):
        rows.append({
            "month": m,
            "in":   monthly[m]["in"],
            "out":  monthly[m]["out"],
            "net":  monthly[m]["in"] - monthly[m]["out"],
        })

    context = {"rows": rows, "start": start, "end": end}
    html = render_to_string("reports/cash_flow.html", context)
    pdf  = HTML(string=html, base_url=settings.BASE_DIR).write_pdf()

    job = ReportJob(report_type="CASH", parameters={"start": str(start), "end": str(end)})
    job.file.save(f"cash_flow_{start}_{end}.pdf", ContentFile(pdf))
    job.save()
    return job


# ───────── Payroll vs Attendance Excel ─────────
def generate_payroll_vs_att_excel(start, end):
    # Salary cost in range
    salaries = SalaryRecord.objects.filter(month__range=[start, end])
    att      = StaffAttendance.objects.filter(date__range=[start, end])

    # build DataFrame keyed by staff
    import pandas as pd
    salary_df = pd.DataFrame(
        salaries.values("staff__id", "staff__first_name", "staff__last_name")
                .annotate(cost=Sum("net"))
    )
    att_df = pd.DataFrame(
        att.values("staff__id").annotate(present=Count("id"))
    )

    merged = salary_df.merge(att_df, on="staff__id", how="left").fillna(0)
    merged["cost_per_presence"] = merged.apply(
        lambda r: (r["cost"] / r["present"]) if r["present"] else None, axis=1
    )

    buffer = ContentFile(b"")
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        merged.to_excel(writer, index=False, sheet_name="Payroll_vs_Att")
    buffer.seek(0)

    job = ReportJob(report_type="PAYROLL_VS_ATT",
                    parameters={"start": str(start), "end": str(end)})
    job.file.save("payroll_vs_att.xlsx", buffer)
    job.save()
    return job
    
def generate_expiring_docs_excel(days_ahead=30):
    """
    Excel with two sheets:
      • 'Student_Docs'  (student, doc_type, exp_date, status)
      • 'Staff_Docs'    (staff, doc_type, exp_date, status)
    status = 'Expired' or 'ExpiringSoon'
    """
    cutoff = date.today() + timedelta(days=days_ahead)

    # student docs ------------------------------------------------------------
    stu_qs = StudentDocument.objects.filter(expiration_date__lte=cutoff)
    stu_rows = []
    for d in stu_qs:
        status = "Expired" if d.expiration_date < date.today() else "ExpiringSoon"
        stu_rows.append({
            "Student":  f"{d.student.first_name} {d.student.last_name}",
            "Doc Type": d.doc_type,
            "Expires":  d.expiration_date,
            "Status":   status,
        })

    # staff docs --------------------------------------------------------------
    staff_qs = StaffDocument.objects.filter(expiration_date__lte=cutoff)
    staff_rows = []
    for d in staff_qs:
        status = "Expired" if d.expiration_date < date.today() else "ExpiringSoon"
        staff_rows.append({
            "Staff":    f"{d.staff.first_name} {d.staff.last_name}",
            "Doc Type": d.doc_type,
            "Expires":  d.expiration_date,
            "Status":   status,
        })

    # pandas → Excel ----------------------------------------------------------
    import pandas as pd
    buffer = ContentFile(b"")
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        if stu_rows:
            pd.DataFrame(stu_rows).to_excel(writer, index=False, sheet_name="Student_Docs")
        if staff_rows:
            pd.DataFrame(staff_rows).to_excel(writer, index=False, sheet_name="Staff_Docs")
    buffer.seek(0)

    # record in ReportJob table
    job = ReportJob(
        report_type="DOC_EXP",
        parameters={"cutoff": str(cutoff)}
    )
    job.file.save(f"expiring_docs_{cutoff}.xlsx", buffer)
    job.save()
    return job
# ───────── Expiring-Docs PDF ─────────
from django.template.loader import render_to_string
from finance.models import TreasuryTransaction   # already imported earlier

def generate_expiring_docs_pdf(days_ahead=30):
    cutoff = date.today() + timedelta(days=days_ahead)

    student_docs = StudentDocument.objects.filter(expiration_date__lte=cutoff)
    staff_docs   = StaffDocument.objects.filter(expiration_date__lte=cutoff)

    context = {
        "today": date.today(),
        "cutoff": cutoff,
        "student_docs": student_docs,
        "staff_docs": staff_docs,
    }

    html = render_to_string("reports/expiring_docs.html", context)
    pdf  = HTML(string=html, base_url=settings.BASE_DIR).write_pdf()

    job = ReportJob(
        report_type="DOC_EXP",
        parameters={"cutoff": str(cutoff), "format": "PDF"},
    )
    job.file.save(f"expiring_docs_{cutoff}.pdf", ContentFile(pdf))
    job.save()
    return job
