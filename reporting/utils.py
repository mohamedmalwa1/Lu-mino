# reporting/utils.py
from datetime import date, timedelta
from collections import defaultdict
from io import BytesIO

import pandas as pd
from django.conf import settings
from django.core.files.base import ContentFile
from django.db.models import Sum, Count, F
from django.template.loader import render_to_string
from django.apps import apps
from weasyprint import HTML

def M(app_label, model):
  try:
    return apps.get_model(app_label, model)
  except Exception:
    return None

TreasuryTransaction = M("finance", "TreasuryTransaction")
Item               = M("inventory", "Item")
SalaryRecord       = M("hr", "SalaryRecord")
StaffAttendance    = M("hr", "StaffAttendance")
StaffDocument      = M("hr", "StaffDocument")
Student            = M("student", "Student")
StudentDocument    = M("student", "StudentDocument")
Enrollment         = M("student", "Enrollment") or M("student", "StudentEnrollment")
Classroom          = M("student", "Classroom") or M("student", "Class")
Invoice            = M("finance", "Invoice")
Payment            = M("finance", "Payment")

# ----- Finance PDFs -----
def generate_pnl_pdf(start, end, **kwargs):
    if not TreasuryTransaction: return None
    qs = TreasuryTransaction.objects.filter(date__range=[start, end])
    revenue = qs.filter(is_inflow=True).aggregate(total=Sum('amount'))['total'] or 0
    expense = qs.filter(is_inflow=False).aggregate(total=Sum('amount'))['total'] or 0
    profit = revenue - expense
    ctx = {"start": start, "end": end, "revenue": revenue, "expense": expense, "profit": profit, "transactions": qs.order_by('date')}
    html = render_to_string("reports/pnl.html", ctx)
    pdf = HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    return ContentFile(pdf, name=f"pnl_{start}_{end}.pdf")

def generate_balance_sheet_pdf(as_of=None, **kwargs):
    if not TreasuryTransaction: return None
    as_of = as_of or date.today()
    tx = TreasuryTransaction.objects.filter(date__lte=as_of)
    assets = tx.filter(is_inflow=True).aggregate(total=Sum("amount"))["total"] or 0
    debts = tx.filter(is_inflow=False).aggregate(total=Sum("amount"))["total"] or 0
    equity = assets - debts
    ctx = {"as_of": as_of, "assets": assets, "debts": debts, "equity": equity}
    html = render_to_string("reports/balance_sheet.html", ctx)
    pdf = HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    return ContentFile(pdf, name=f"balance_sheet_{as_of}.pdf")

def generate_cash_flow_pdf(start, end, **kwargs):
    if not TreasuryTransaction: return None
    qs = TreasuryTransaction.objects.filter(date__range=[start, end])
    monthly = defaultdict(lambda: {"in": 0, "out": 0})
    for tx in qs:
        m = tx.date.replace(day=1)
        if tx.is_inflow: monthly[m]["in"] += tx.amount
        else:            monthly[m]["out"] += tx.amount
    rows = [{"month": k, "in": v["in"], "out": v["out"], "net": v["in"]-v["out"]} for k, v in sorted(monthly.items())]
    ctx = {"rows": rows, "start": start, "end": end}
    html = render_to_string("reports/cash_flow.html", ctx)
    pdf = HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    return ContentFile(pdf, name=f"cash_flow_{start}_{end}.pdf")

# ----- Inventory -----
def generate_low_stock_excel(**kwargs):
    if not Item: return None
    qs = Item.objects.filter(quantity__lte=F('reorder_level'))
    if not qs.exists(): return None
    df = pd.DataFrame(qs.values("name", "sku", "quantity", "reorder_level", "vendor__name"))
    buf = BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as w:
        df.to_excel(w, index=False, sheet_name="Low Stock")
    return ContentFile(buf.getvalue(), name="low_stock.xlsx")

def generate_low_stock_pdf(threshold=None, **kwargs):
    if not Item: return None
    qs = Item.objects.all()
    if threshold is not None:
        try: qs = qs.filter(quantity__lte=int(threshold))
        except Exception: qs = qs.filter(quantity__lte=F('reorder_level'))
    else:
        qs = qs.filter(quantity__lte=F('reorder_level'))
    items = list(qs.values("name", "sku", "quantity", "reorder_level"))
    if not items: return None
    html = render_to_string("reports/inventory_low_stock.html", {"items": items})
    pdf = HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    return ContentFile(pdf, name="low_stock.pdf")

# ----- Payroll vs Attendance (Excel) -----
def generate_payroll_vs_att_excel(start, end, **kwargs):
    if not SalaryRecord or not StaffAttendance: return None
    sal = SalaryRecord.objects.filter(month__range=[start, end]).values("staff__id","staff__first_name","staff__last_name").annotate(cost=Sum("net"))
    att = StaffAttendance.objects.filter(date__range=[start, end]).values("staff__id").annotate(present=Count("id"))
    if not sal: return None
    df_sal = pd.DataFrame(list(sal))
    df_att = pd.DataFrame(list(att)) if att else pd.DataFrame(columns=["staff__id","present"])
    merged = df_sal.merge(df_att, on="staff__id", how="left").fillna(0)
    merged["cost_per_presence"] = merged.apply(lambda r: (r["cost"]/r["present"]) if r["present"] else None, axis=1)
    buf = BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as w:
        merged.to_excel(w, index=False, sheet_name="Payroll_vs_Att")
    return ContentFile(buf.getvalue(), name="payroll_vs_attendance.xlsx")

# ----- Expiring Documents (Excel) -----
def generate_expiring_docs_excel(days_ahead=30, **kwargs):
    d = date.today() + timedelta(days=int(days_ahead))
    stu = StudentDocument.objects.filter(expiration_date__lte=d) if StudentDocument else []
    staff = StaffDocument.objects.filter(expiration_date__lte=d) if StaffDocument else []
    if not stu and not staff: return None
    stu_rows = [{"Owner": f"{sd.student.first_name} {sd.student.last_name}" if hasattr(sd.student,'first_name') else getattr(sd.student,'name',''),
                 "Type": "Student", "Document": getattr(sd, "doc_type", ""), "Expires On": sd.expiration_date} for sd in stu]
    staff_rows = [{"Owner": f"{sd.staff.first_name} {sd.staff.last_name}" if hasattr(sd.staff,'first_name') else getattr(sd.staff,'name',''),
                   "Type": "Staff", "Document": getattr(sd, "doc_type", ""), "Expires On": sd.expiration_date} for sd in staff]
    df = pd.DataFrame(stu_rows + staff_rows)
    buf = BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as w:
        df.to_excel(w, index=False, sheet_name="Expiring Documents")
    return ContentFile(buf.getvalue(), name=f"expiring_docs_{int(days_ahead)}d.xlsx")

# ----- Student Documents (PDF) -----
def generate_student_docs_pdf(**kwargs):
    if not StudentDocument: return None
    docs = StudentDocument.objects.select_related("student").all()
    if not docs.exists(): return None
    grouped = defaultdict(lambda: {"name":"", "documents":[]})
    for d in docs:
        s = d.student
        sid = getattr(s, "id", None)
        full = f"{getattr(s,'first_name','')} {getattr(s,'last_name','')}".strip() or getattr(s,"name","Student")
        grouped[sid]["name"] = full
        grouped[sid]["documents"].append({
            "name": getattr(d,"name", getattr(d,"doc_type","")),
            "type": getattr(d,"doc_type",""),
            "expiry": getattr(d,"expiration_date",""),
        })
    html = render_to_string("reports/student_documents.html", {"students": list(grouped.values())})
    pdf = HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    return ContentFile(pdf, name="student_documents.pdf")

# ----- Student Fees (PDF/XLSX) -----
def _fees_dataframe(start=None, end=None):
    if not Invoice or not Student: return None
    inv_qs = Invoice.objects.all()
    if start and end and hasattr(Invoice, "date"):
        inv_qs = inv_qs.filter(date__range=[start, end])
    rows = []
    for inv in inv_qs.select_related("student").all():
        s = getattr(inv, "student", None)
        sname = f"{getattr(s,'first_name','')} {getattr(s,'last_name','')}".strip() or getattr(s,"name","")
        cname = getattr(getattr(s,"classroom",None), "name", "")
        total = getattr(inv, "total_amount", None) or getattr(inv, "amount", 0) or getattr(inv, "grand_total", 0)
        paid  = getattr(inv, "paid_amount", None) or 0
        bal   = float(total) - float(paid) if total is not None else None
        rows.append({"student_name": sname, "class_name": cname, "billed": total, "paid": paid, "balance": bal})
    if not rows: return None
    df = pd.DataFrame(rows)
    df = df.groupby(["student_name", "class_name"], as_index=False).sum(numeric_only=True)
    df["status"] = df["balance"].apply(lambda x: "PAID" if (x is not None and float(x) <= 0) else "UNPAID")
    return df

def generate_student_fees_excel(start=None, end=None, **kwargs):
    df = _fees_dataframe(start, end)
    if df is None or df.empty: return None
    buf = BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as w:
        df.to_excel(w, index=False, sheet_name="Fees Status")
    return ContentFile(buf.getvalue(), name=f"student_fees_{start}_{end}.xlsx")

def generate_student_fees_pdf(start=None, end=None, **kwargs):
    df = _fees_dataframe(start, end)
    if df is None or df.empty: return None
    rows = df.to_dict(orient="records")
    totals = {
        "billed": float(df["billed"].sum()),
        "paid": float(df["paid"].sum()),
        "balance": float(df["balance"].sum()),
        "paid_count": int((df["status"]=="PAID").sum()),
        "unpaid_count": int((df["status"]=="UNPAID").sum()),
    }
    ctx = {"rows": rows, "start": start, "end": end, "totals": totals}
    html = render_to_string("reports/student_fees_status.html", ctx)
    pdf = HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    return ContentFile(pdf, name=f"student_fees_{start}_{end}.pdf")

# ----- Enrollment Summary (PDF/XLSX) -----
def _enrollment_data():
    if not Student: return None
    qs = Student.objects.all()
    total = qs.count()
    by_class = []
    if Classroom and hasattr(Student, "classroom"):
        agg = qs.values("classroom__name").annotate(n=Count("id")).order_by("classroom__name")
        by_class = [{"class_name": a["classroom__name"] or "—", "count": a["n"]} for a in agg]
    return {"total": total, "by_class": by_class}

def generate_enroll_summary_excel(**kwargs):
    data = _enrollment_data()
    if not data: return None
    buf = BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as w:
        pd.DataFrame([{"Total Students": data["total"]}]).to_excel(w, index=False, sheet_name="Summary")
        if data["by_class"]:
            pd.DataFrame(data["by_class"]).to_excel(w, index=False, sheet_name="By Class")
    return ContentFile(buf.getvalue(), name="enrollment_summary.xlsx")

def generate_enroll_summary_pdf(**kwargs):
    data = _enrollment_data()
    if not data: return None
    html = render_to_string("reports/enrollment_summary.html", data)
    pdf = HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    return ContentFile(pdf, name="enrollment_summary.pdf")

