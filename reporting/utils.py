# reporting/utils.py
from collections import defaultdict
from datetime import date, timedelta
from io import BytesIO

import pandas as pd
from django.apps import apps
from django.conf import settings
from django.core.files.base import ContentFile
from django.db.models import Sum, Count, F
from django.template.loader import render_to_string
from weasyprint import HTML

# ---------------- helpers ----------------
def M(app_label, model):
    try:
        return apps.get_model(app_label, model)
    except Exception:
        return None

def find_first_model(candidates):
    for app_label, model_name in candidates:
        m = M(app_label, model_name)
        if m:
            return m
    return None

def first_value(obj, names, default=None):
    for n in names:
        if hasattr(obj, n):
            v = getattr(obj, n)
            if v is not None:
                return v
    return default

def first_related(obj, names):
    for n in names:
        if hasattr(obj, n):
            return getattr(obj, n)
    return None

def person_name(p):
    if not p:
        return ""
    if getattr(p, "name", None):
        return p.name
    first = getattr(p, "first_name", "") or ""
    last = getattr(p, "last_name", "") or ""
    if first or last:
        return f"{first} {last}".strip()
    return getattr(p, "username", str(p))

# ---------------- model lookups (safe) ----------------
TreasuryTransaction = M("finance", "TreasuryTransaction")
Item                = M("inventory", "Item")

# AP/AR
Invoice             = find_first_model([
    ("finance", "Invoice"), ("sales", "Invoice"), ("billing", "Invoice")
])
# If you later add a real AP bill model, it will be picked first; otherwise we use PurchaseOrder as AP.
VendorBill          = find_first_model([
    ("finance", "VendorBill"),
    ("purchases", "VendorBill"),
    ("purchase", "VendorBill"),
    ("ap", "SupplierBill"),
    ("ap", "VendorInvoice"),
    ("finance", "PurchaseOrder"),      # <— your shell showed this model exists
])

# HR & Students
StaffAttendance     = find_first_model([
    ("hr", "StaffAttendance"),
    ("hr", "EmployeeAttendance"),
    ("attendance", "Attendance"),
])
SalaryRecord        = M("hr", "SalaryRecord")
StaffDocument       = M("hr", "StaffDocument")
Student             = M("student", "Student")
StudentDocument     = M("student", "StudentDocument")
Enrollment          = M("student", "Enrollment") or M("student", "StudentEnrollment")
Classroom           = M("student", "Classroom") or M("student", "Class")

# ---------------- Finance: P&L / BS / Cash ----------------
def generate_pnl_pdf(start, end, **kwargs):
    if not TreasuryTransaction: return None
    qs = TreasuryTransaction.objects.filter(date__range=[start, end])
    revenue = qs.filter(is_inflow=True).aggregate(total=Sum('amount'))['total'] or 0
    expense = qs.filter(is_inflow=False).aggregate(total=Sum('amount'))['total'] or 0
    profit  = revenue - expense
    ctx = {"start": start, "end": end, "revenue": revenue, "expense": expense, "profit": profit,
           "transactions": qs.order_by('date')}
    html = render_to_string("reports/pnl.html", ctx)
    pdf = HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    return ContentFile(pdf, name=f"pnl_{start}_{end}.pdf")

def generate_balance_sheet_pdf(as_of=None, **kwargs):
    if not TreasuryTransaction: return None
    as_of = as_of or date.today()
    tx = TreasuryTransaction.objects.filter(date__lte=as_of)
    assets = tx.filter(is_inflow=True).aggregate(total=Sum("amount"))["total"] or 0
    debts  = tx.filter(is_inflow=False).aggregate(total=Sum("amount"))["total"] or 0
    equity = assets - debts
    html = render_to_string("reports/balance_sheet.html", {"as_of": as_of, "assets": assets, "debts": debts, "equity": equity})
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
    rows = [{"month": k, "in": v["in"], "out": v["out"], "net": v["in"] - v["out"]} for k, v in sorted(monthly.items())]
    html = render_to_string("reports/cash_flow.html", {"rows": rows, "start": start, "end": end})
    pdf = HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    return ContentFile(pdf, name=f"cash_{start}_{end}.pdf")

# ---------------- Inventory: Low stock & valuation ----------------
def _unit_cost(item):
    for f in ("average_cost", "avg_cost", "cost_price", "purchase_price", "unit_cost"):
        if hasattr(item, f) and getattr(item, f) is not None:
            return float(getattr(item, f))
    return 0.0

def generate_low_stock_excel(**kwargs):
    if not Item: return None
    qs = Item.objects.filter(quantity__lte=F('reorder_level'))
    if not qs.exists(): return None
    df = pd.DataFrame(qs.values("name","sku","quantity","reorder_level","vendor__name"))
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
    items = list(qs.values("name","sku","quantity","reorder_level"))
    if not items: return None
    html = render_to_string("reports/inventory_low_stock.html", {"items": items})
    pdf = HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    return ContentFile(pdf, name="low_stock.pdf")

def generate_inventory_valuation_excel(**kwargs):
    if not Item: return None
    rows = []
    for i in Item.objects.all():
        qty  = float(getattr(i, "quantity", 0) or 0)
        cost = _unit_cost(i)
        rows.append({"sku": getattr(i,"sku",""), "name": getattr(i,"name",""),
                     "qty": qty, "cost": cost, "value": qty*cost})
    if not rows: return None
    df = pd.DataFrame(rows)
    buf = BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as w:
        df.to_excel(w, index=False, sheet_name="Valuation")
    return ContentFile(buf.getvalue(), name="inventory_valuation.xlsx")

def generate_inventory_valuation_pdf(**kwargs):
    if not Item: return None
    rows, total = [], 0.0
    for i in Item.objects.all():
        qty  = float(getattr(i,"quantity",0) or 0)
        cost = _unit_cost(i)
        val  = qty*cost
        rows.append({"sku": getattr(i,"sku",""), "name": getattr(i,"name",""),
                     "qty": qty, "cost": cost, "value": val})
        total += val
    if not rows: return None
    html = render_to_string("reports/inventory_valuation.html", {"rows": rows, "total": total})
    pdf = HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    return ContentFile(pdf, name="inventory_valuation.pdf")

# ---------------- Documents ----------------
def generate_expiring_docs_excel(days_ahead=30, **kwargs):
    cutoff = date.today() + timedelta(days=int(days_ahead))
    stu = StudentDocument.objects.filter(expiration_date__lte=cutoff) if StudentDocument else []
    staff = StaffDocument.objects.filter(expiration_date__lte=cutoff)   if StaffDocument   else []
    if not stu and not staff: return None
    stu_rows = [{
        "Owner": f"{getattr(sd.student,'first_name','')} {getattr(sd.student,'last_name','')}".strip() or getattr(sd.student,'name',''),
        "Type": "Student", "Document": getattr(sd,"doc_type",""), "Expires On": sd.expiration_date
    } for sd in stu]
    staff_rows = [{
        "Owner": f"{getattr(sd.staff,'first_name','')} {getattr(sd.staff,'last_name','')}".strip() or getattr(sd.staff,'name',''),
        "Type": "Staff", "Document": getattr(sd,"doc_type",""), "Expires On": sd.expiration_date
    } for sd in staff]
    df = pd.DataFrame(stu_rows + staff_rows)
    buf = BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as w:
        df.to_excel(w, index=False, sheet_name="Expiring Documents")
    return ContentFile(buf.getvalue(), name=f"expiring_docs_{int(days_ahead)}d.xlsx")

def generate_student_docs_pdf(**kwargs):
    if not StudentDocument: return None
    docs = StudentDocument.objects.select_related("student").all()
    if not docs.exists(): return None
    grouped = defaultdict(lambda: {"name": "", "documents": []})
    for d in docs:
        s = d.student
        sid = getattr(s, "id", None)
        nm  = f"{getattr(s,'first_name','')} {getattr(s,'last_name','')}".strip() or getattr(s,"name","Student")
        grouped[sid]["name"] = nm
        grouped[sid]["documents"].append({
            "name": getattr(d,"name", getattr(d,"doc_type","")),
            "type": getattr(d,"doc_type",""),
            "expiry": getattr(d,"expiration_date",""),
        })
    html = render_to_string("reports/student_documents.html", {"students": list(grouped.values())})
    pdf = HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    return ContentFile(pdf, name="student_documents.pdf")

# ---------------- Students: Fees & Enrollment ----------------
def _fees_dataframe(start=None, end=None):
    if not Invoice or not Student: return None
    inv = Invoice.objects.all()
    # find an invoice date field if present
    for n in ("date","invoice_date","created","created_at"):
        if hasattr(Invoice, n):
            if start and end:
                inv = inv.filter(**{f"{n}__range":[start,end]})
            break
    rows = []
    for doc in inv.select_related("student"):
        s = getattr(doc,"student",None)
        sname = person_name(s)
        cname = person_name(getattr(s,"classroom",None)) or getattr(getattr(s,"classroom",None),"name","")
        total = first_value(doc, ["total_amount","total","amount","grand_total"], 0)
        paid  = first_value(doc, ["paid_amount","amount_paid","paid","total_paid"], 0)
        bal   = float(total) - float(paid)
        rows.append({"student_name": sname, "class_name": cname, "billed": total, "paid": paid, "balance": bal})
    if not rows: return None
    df = pd.DataFrame(rows).groupby(["student_name","class_name"], as_index=False).sum(numeric_only=True)
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
        "paid_count": int((df["status"] == "PAID").sum()),
        "unpaid_count": int((df["status"] == "UNPAID").sum()),
    }
    html = render_to_string("reports/student_fees_status.html",
                            {"rows": rows, "start": start, "end": end, "totals": totals})
    pdf = HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    return ContentFile(pdf, name=f"student_fees_{start}_{end}.pdf")

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

# ---------------- AR/AP Aging (schema-aware) ----------------
def _aging_rows(qs, who_rel_candidates):
    today = date.today()
    rows = []
    for obj in qs:
        due   = first_value(obj, ["due_date","invoice_due","payment_due","expected_delivery","date","bill_date"])
        total = first_value(obj, ["total_amount","total","amount","grand_total","net_total"], 0) or 0
        paid  = first_value(obj, ["paid_amount","amount_paid","paid","total_paid"], 0) or 0
        bal   = float(total) - float(paid)
        age   = (today - (due or today)).days
        who   = first_related(obj, who_rel_candidates)
        rows.append({
            "name": person_name(who),
            "due_date": due,
            "total": total,
            "paid": paid,
            "balance": bal,
            "age": age,
            "b0_30":  bal if age <= 30 else 0,
            "b31_60": bal if 31 <= age <= 60 else 0,
            "b61_90": bal if 61 <= age <= 90 else 0,
            "b90p":   bal if age > 90 else 0,
        })
    return rows

def generate_ar_aging_excel(**kwargs):
    if not Invoice: return None
    qs = Invoice.objects.all()
    if not qs.exists(): return None
    rows = _aging_rows(qs, ["student","customer","parent","client"])
    df = pd.DataFrame(rows)
    buf = BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as w:
        df.to_excel(w, index=False, sheet_name="AR Aging")
    return ContentFile(buf.getvalue(), name="ar_aging.xlsx")

def generate_ap_aging_excel(**kwargs):
    if not VendorBill: return None
    qs = VendorBill.objects.all()
    if not qs.exists(): return None
    # when using PurchaseOrder as AP, there’s usually no “paid” amount → treat as unpaid
    rows = _aging_rows(qs, ["vendor","supplier","provider"])
    if rows and all(r["paid"] == 0 for r in rows):
        for r in rows:
            r["balance"] = r["total"]
    df = pd.DataFrame(rows)
    buf = BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as w:
        df.to_excel(w, index=False, sheet_name="AP Aging")
    return ContentFile(buf.getvalue(), name="ap_aging.xlsx")

def generate_ap_aging_pdf(**kwargs):
    if not VendorBill: return None
    qs = VendorBill.objects.all()
    if not qs.exists(): return None
    rows = _aging_rows(qs, ["vendor","supplier","provider"])
    if rows and all(r["paid"] == 0 for r in rows):
        for r in rows:
            r["balance"] = r["total"]
    totals = {k: sum(r[k] for r in rows) for k in ["total","paid","balance","b0_30","b31_60","b61_90","b90p"]}
    html = render_to_string("reports/ap_aging.html", {"rows": rows, "totals": totals})
    pdf = HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    return ContentFile(pdf, name="ap_aging.pdf")

# ---------------- HR Attendance Summary (robust dates) ----------------
def _attendance_qs(start=None, end=None):
    if not StaffAttendance: return None
    qs = StaffAttendance.objects.all()
    date_field = None
    for n in ("date","attendance_date","day","entry_date"):
        if hasattr(StaffAttendance, n):
            date_field = n; break
    if date_field and start and end:
        qs = qs.filter(**{f"{date_field}__range":[start, end]})
        if not qs.exists():                        # <-- fallback if range was empty
            qs = StaffAttendance.objects.all()
    return qs

def generate_hr_attendance_summary_excel(start=None, end=None, **kwargs):
    qs = _attendance_qs(start, end)
    if not qs or not qs.exists(): return None
    # find staff relation
    staff_rel = next((r for r in ("staff","employee","user","teacher") if hasattr(StaffAttendance, r)), None)
    agg = qs.values(f"{staff_rel}__first_name", f"{staff_rel}__last_name", f"{staff_rel}__name").annotate(present=Count("id"))
    rows = []
    for a in agg:
        nm = a.get(f"{staff_rel}__name") or f"{a.get(f'{staff_rel}__first_name','') or ''} {a.get(f'{staff_rel}__last_name','') or ''}".strip()
        rows.append({"staff": nm, "present": a["present"]})
    df = pd.DataFrame(rows).sort_values("staff")
    buf = BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as w:
        df.to_excel(w, index=False, sheet_name="Attendance")
    return ContentFile(buf.getvalue(), name=f"hr_attendance_{start}_{end}.xlsx")

def generate_hr_attendance_summary_pdf(start=None, end=None, **kwargs):
    qs = _attendance_qs(start, end)
    if not qs or not qs.exists(): return None
    staff_rel = next((r for r in ("staff","employee","user","teacher") if hasattr(StaffAttendance, r)), None)
    agg = qs.values(f"{staff_rel}__first_name", f"{staff_rel}__last_name", f"{staff_rel}__name").annotate(present=Count("id"))
    rows = []
    for a in agg:
        nm = a.get(f"{staff_rel}__name") or f"{a.get(f'{staff_rel}__first_name','') or ''} {a.get(f'{staff_rel}__last_name','') or ''}".strip()
        rows.append({"staff": nm, "present": a["present"]})
    total_days = sum(r["present"] for r in rows)
    html = render_to_string("reports/hr_attendance_summary.html",
                            {"rows": rows, "start": start, "end": end, "total_days": total_days})
    pdf = HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    return ContentFile(pdf, name=f"hr_attendance_{start}_{end}.pdf")

