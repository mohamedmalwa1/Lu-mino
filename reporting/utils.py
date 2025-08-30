from __future__ import annotations

from collections import defaultdict
from io import BytesIO
from typing import Any, Iterable, Optional
from datetime import date, datetime, timedelta

import pandas as pd
from django.conf import settings
from django.core.files.base import ContentFile
from django.apps import apps

# Optional PDF engine
try:
    from weasyprint import HTML
    WEASY = True
except Exception:
    WEASY = False


# ---------- helpers ----------
def get_model(app_label: str, model_name: str):
    try:
        return apps.get_model(app_label, model_name)
    except Exception:
        return None

def first_attr(obj: Any, names: Iterable[str], default=None):
    for n in names:
        if hasattr(obj, n):
            v = getattr(obj, n)
            if v is not None:
                return v
    return default

def first_related(obj: Any, names: Iterable[str]):
    for n in names:
        if hasattr(obj, n):
            return getattr(obj, n)
    return None

def person_name(p):
    if not p:
        return ""
    return (
        first_attr(p, ["name"])
        or " ".join([first_attr(p, ["first_name", "given_name"], ""), first_attr(p, ["last_name", "family_name"], "")]).strip()
        or first_attr(p, ["username"])
        or str(p)
    )

def _coerce_date(obj) -> Optional[date]:
    for f in ["date", "created", "created_at", "paid_at", "issued_at", "due_date"]:
        if hasattr(obj, f) and getattr(obj, f):
            v = getattr(obj, f)
            return v.date() if isinstance(v, datetime) else v
    return None


# ---------- A) Expiring Documents (Excel) ----------
def _date_attr(model, candidates):
    for n in candidates:
        if hasattr(model, n):
            return n
    return None

def generate_expiring_docs_excel(days_ahead: int = 30, **kwargs):
    StudentDocument = get_model("student", "StudentDocument")
    StaffDocument   = get_model("hr", "StaffDocument")

    cutoff = date.today() + timedelta(days=int(days_ahead or 30))
    rows = []

    if StudentDocument:
        date_field = _date_attr(StudentDocument, ["expiration_date", "expiry_date", "expire_on", "valid_to", "end_date"])
        name_field = _date_attr(StudentDocument, ["name", "title", "doc_name"])
        type_field = _date_attr(StudentDocument, ["doc_type", "type", "category"])
        qs = StudentDocument.objects.all()
        if date_field:
            qs = qs.filter(**{f"{date_field}__lte": cutoff})
        for d in qs.select_related("student"):
            rows.append({
                "Owner": person_name(getattr(d, "student", None)),
                "Type": "Student",
                "Document": getattr(d, name_field, None) or getattr(d, type_field, ""),
                "Expires On": getattr(d, date_field, None),
            })

    if StaffDocument:
        date_field = _date_attr(StaffDocument, ["expiration_date", "expiry_date", "expire_on", "valid_to", "end_date"])
        name_field = _date_attr(StaffDocument, ["name", "title", "doc_name"])
        type_field = _date_attr(StaffDocument, ["doc_type", "type", "category"])
        qs = StaffDocument.objects.all()
        if date_field:
            qs = qs.filter(**{f"{date_field}__lte": cutoff})
        for d in qs.select_related("staff"):
            rows.append({
                "Owner": person_name(getattr(d, "staff", None)),
                "Type": "Staff",
                "Document": getattr(d, name_field, None) or getattr(d, type_field, ""),
                "Expires On": getattr(d, date_field, None),
            })

    if not rows:
        return None

    df = pd.DataFrame(rows).sort_values(["Type", "Owner", "Expires On"], na_position="last")
    buf = BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as w:
        df.to_excel(w, index=False, sheet_name="Expiring Documents")
    return ContentFile(buf.getvalue(), name=f"expiring_docs_{int(days_ahead)}d.xlsx")


# ---------- B) Enrollment Summary (PDF) ----------
def generate_enroll_summary_pdf(**kwargs):
    Student = get_model("student", "Student")
    if not Student:
        return None

    groups = defaultdict(int)
    for s in Student.objects.all():
        key = first_attr(s, ["classroom", "room", "level", "grade", "group"])
        label = getattr(key, "name", None) or str(key) if key else "All Students"
        groups[label] += 1

    if not groups:
        return None

    rows = "\n".join(
        f'<tr><td style="padding:6px 10px;">{grp}</td><td style="padding:6px 10px;text-align:right;">{cnt}</td></tr>'
        for grp, cnt in sorted(groups.items())
    )
    html = f"""
    <html><body>
      <h2 style="margin:0 0 8px 0;">Enrollment Summary</h2>
      <table style="border-collapse:collapse;font-family:system-ui,Segoe UI,Roboto,sans-serif;">
        <thead><tr><th style="text-align:left;border-bottom:1px solid #ddd;padding:6px 10px;">Group</th>
        <th style="text-align:right;border-bottom:1px solid #ddd;padding:6px 10px;">Count</th></tr></thead>
        <tbody>{rows}</tbody>
      </table>
    </body></html>
    """
    if not WEASY:
        return ContentFile(html.encode(), name="enrollment_summary.html")
    pdf = HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    return ContentFile(pdf, name="enrollment_summary.pdf")


# ---------- C) Cash Flow (PDF) ----------
def generate_cash_flow_pdf(start: Optional[str|date]=None, end: Optional[str|date]=None, **kwargs):
    Payment = get_model("finance", "Payment")
    Expense = get_model("finance", "Expense")

    if isinstance(start, str): start = date.fromisoformat(start)
    if isinstance(end, str):   end   = date.fromisoformat(end)
    start = start or date.today().replace(day=1)
    end   = end or date.today()

    rows = []
    if Payment:
        for p in Payment.objects.all():
            d = _coerce_date(p)
            if d and start <= d <= end:
                amt = float(first_attr(p, ["amount", "paid", "total_paid"], 0) or 0)
                rows.append({"date": d, "ref": f"PAY-{p.id}", "amount": amt, "type": "IN"})
    if Expense:
        for e in Expense.objects.all():
            d = _coerce_date(e)
            if d and start <= d <= end:
                amt = float(first_attr(e, ["amount", "total", "grand_total"], 0) or 0)
                ref = first_attr(e, ["reference", "ref", "code"], f"EXP-{e.id}")
                rows.append({"date": d, "ref": ref, "amount": -abs(amt), "type": "OUT"})

    if not rows:
        return None

    rows.sort(key=lambda r: r["date"])
    total_in  = sum(r["amount"] for r in rows if r["type"] == "IN")
    total_out = -sum(r["amount"] for r in rows if r["type"] == "OUT")
    net = total_in - total_out

    body = "\n".join(
        f'<tr><td style="padding:6px 10px;">{r["date"].strftime("%b %d, %Y")}</td>'
        f'<td style="padding:6px 10px;">{r["ref"]}</td>'
        f'<td style="padding:6px 10px;text-align:right;">{r["amount"]:.2f}</td></tr>'
        for r in rows
    )
    html = f"""
    <html><body>
      <h2 style="margin:0 0 8px 0;">Cash Flow ({start} to {end})</h2>
      <table style="border-collapse:collapse;font-family:system-ui,Segoe UI,Roboto,sans-serif;">
        <thead><tr><th style="text-align:left;border-bottom:1px solid #ddd;padding:6px 10px;">Date</th>
        <th style="text-align:left;border-bottom:1px solid #ddd;padding:6px 10px;">Reference</th>
        <th style="text-align:right;border-bottom:1px solid #ddd;padding:6px 10px;">Amount</th></tr></thead>
        <tbody>{body}</tbody>
      </table>
      <hr/>
      <p style="font-family:system-ui,Segoe UI,Roboto,sans-serif;">
        <strong>Total In:</strong> {total_in:.2f} &nbsp;&nbsp;
        <strong>Total Out:</strong> {total_out:.2f} &nbsp;&nbsp;
        <strong>Net:</strong> {net:.2f}
      </p>
    </body></html>
    """
    if not WEASY:
        return ContentFile(html.encode(), name="cash_flow.html")
    pdf = HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    return ContentFile(pdf, name=f"cash_flow_{start}_{end}.pdf")


# ---------- D) AP Aging (PDF) ----------
def generate_ap_aging_pdf(**kwargs):
    VendorBill = (
        get_model("finance", "VendorBill")
        or get_model("inventory", "VendorBill")
        or get_model("purchase", "VendorBill")
        or get_model("finance", "SupplierBill")
        or get_model("finance", "Bill")
    )
    if not VendorBill:
        return None

    today = date.today()
    buckets = [(0, 30), (31, 60), (61, 90), (91, 99999)]
    lines = []

    for b in VendorBill.objects.all():
        total = float(first_attr(b, ["total", "amount", "grand_total"], 0) or 0)
        paid  = float(first_attr(b, ["paid", "amount_paid", "total_paid"], 0) or 0)
        bal   = max(0.0, total - paid)
        if bal <= 0: continue

        due = first_attr(b, ["due_date", "due", "deadline", "date"]) or today
        if isinstance(due, datetime): due = due.date()
        age = (today - due).days

        bucket_lbl = "Unknown"
        for lo, hi in buckets:
            if lo <= age <= hi:
                bucket_lbl = f"{lo}-{hi if hi < 99999 else '+'}"
                break

        vendor = first_related(b, ["vendor", "supplier"])
        lines.append({
            "vendor": getattr(vendor, "name", None) or str(vendor or "Unknown"),
            "ref": first_attr(b, ["number", "code", "ref", "reference"], f"BILL-{b.pk}"),
            "due": due, "age": age, "balance": bal, "bucket": bucket_lbl,
        })

    if not lines: return None
    lines.sort(key=lambda x: (x["vendor"], x["due"]))
    rows = []
    for x in lines:
        due_str = x["due"].strftime("%Y-%m-%d") if isinstance(x["due"], (date, datetime)) else str(x["due"])
        rows.append(
            f'<tr><td style="padding:6px 10px;">{x["vendor"]}</td>'
            f'<td style="padding:6px 10px;">{x["ref"]}</td>'
            f'<td style="padding:6px 10px;">{due_str}</td>'
            f'<td style="padding:6px 10px;text-align:right;">{x["age"]}</td>'
            f'<td style="padding:6px 10px;text-align:right;">{x["balance"]:.2f}</td>'
            f'<td style="padding:6px 10px;">{x["bucket"]}</td></tr>'
        )
    html = f"""
    <html><body>
      <h2 style="margin:0 0 8px 0;">Accounts Payable Aging</h2>
      <table style="border-collapse:collapse;font-family:system-ui,Segoe UI,Roboto,sans-serif;">
        <thead><tr><th style="text-align:left;border-bottom:1px solid #ddd;padding:6px 10px;">Vendor</th>
        <th style="text-align:left;border-bottom:1px solid #ddd;padding:6px 10px;">Bill #</th>
        <th style="text-align:left;border-bottom:1px solid #ddd;padding:6px 10px;">Due</th>
        <th style="text-align:right;border-bottom:1px solid #ddd;padding:6px 10px;">Age</th>
        <th style="text-align:right;border-bottom:1px solid #ddd;padding:6px 10px;">Balance</th>
        <th style="text-align:left;border-bottom:1px solid #ddd;padding:6px 10px;">Bucket</th></tr></thead>
        <tbody>{''.join(rows)}</tbody>
      </table>
    </body></html>
    """
    if not WEASY:
        return ContentFile(html.encode(), name="ap_aging.html")
    pdf = HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    return ContentFile(pdf, name="ap_aging.pdf")


# ---------- E) Student Documents (PDF) ----------
def generate_student_docs_pdf(**kwargs):
    StudentDocument = get_model("student", "StudentDocument")
    if not StudentDocument:
        return None

    rows = []
    for d in StudentDocument.objects.select_related("student").all():
        owner = person_name(getattr(d, "student", None))
        title = first_attr(d, ["name", "title", "doc_name"], "") or first_attr(d, ["doc_type", "type"], "")
        exp   = first_attr(d, ["expiration_date", "expiry_date", "expire_on", "valid_to", "end_date"])
        exp   = exp.strftime("%Y-%m-%d") if isinstance(exp, (date, datetime)) else (exp or "")
        rows.append((owner, title, exp))

    if not rows:
        return None

    body = "\n".join(
        f'<tr><td style="padding:6px 10px;">{o}</td><td style="padding:6px 10px;">{t}</td>'
        f'<td style="padding:6px 10px;">{e}</td></tr>'
        for o, t, e in rows
    )
    html = f"""
    <html><body>
      <h2 style="margin:0 0 8px 0;">Student Documents</h2>
      <table style="border-collapse:collapse;font-family:system-ui,Segoe UI,Roboto,sans-serif;">
        <thead><tr><th style="text-align:left;border-bottom:1px solid #ddd;padding:6px 10px;">Student</th>
        <th style="text-align:left;border-bottom:1px solid #ddd;padding:6px 10px;">Document</th>
        <th style="text-align:left;border-bottom:1px solid #ddd;padding:6px 10px;">Expires</th></tr></thead>
        <tbody>{body}</tbody>
      </table>
    </body></html>
    """
    if not WEASY:
        return ContentFile(html.encode(), name="student_docs.html")
    pdf = HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    return ContentFile(pdf, name="student_documents.pdf")


# ---------- F) Accounts Receivable Aging (PDF) — stub for now ----------
def generate_ar_aging_pdf(**kwargs):
    """
    Placeholder: returns None so UI shows 'no data found' instead of failing.
    If you share your AR model (e.g., StudentFee/Invoice), I'll wire it up.
    """
    return None


# ---------- G) Inventory Valuation (Excel) — best-effort ----------
def generate_inventory_valuation(**kwargs):
    """
    Attempts to value inventory as qty * cost using common model names/fields.
    Returns None if no recognizable model/fields are found.
    """
    Product = get_model("inventory", "Product") or get_model("inventory", "Item") or get_model("inventory", "StockItem")
    if not Product:
        return None

    rows = []
    for p in Product.objects.all():
        name = first_attr(p, ["name", "title", "label"], f"Item-{p.pk}")
        qty  = float(first_attr(p, ["quantity", "qty", "stock", "on_hand"], 0) or 0)
        cost = float(first_attr(p, ["cost", "unit_cost", "purchase_price"], 0) or 0)
        rows.append({"Item": name, "Qty": qty, "Cost": cost, "Value": qty * cost})

    if not rows:
        return None

    df = pd.DataFrame(rows).sort_values(["Item"])
    buf = BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as w:
        df.to_excel(w, index=False, sheet_name="Inventory Valuation")
    return ContentFile(buf.getvalue(), name="inventory_valuation.xlsx")


# ---------- H) Profit & Loss (PDF) — needs implementation ----------
def generate_pnl_pdf(start: date, end: date, **kwargs):
    """
    Profit & Loss report - needs implementation based on your financial models
    """
    # TODO: Implement P&L logic using your financial models
    # Example: Query Revenue, Expenses, COGS models and calculate profit
    return None


# ---------- I) Balance Sheet (PDF) — needs implementation ----------
def generate_balance_sheet_pdf(**kwargs):
    """
    Balance Sheet report - needs implementation based on your financial models
    """
    # TODO: Implement balance sheet logic using Assets, Liabilities, Equity models
    return None


# ---------- J) Payroll vs Attendance (Excel) — needs implementation ----------
def generate_payroll_vs_att_excel(start: date, end: date, **kwargs):
    """
    Payroll vs Attendance report - needs implementation
    """
    # TODO: Implement payroll vs attendance comparison logic
    return None


# ---------- K) Low Stock (Excel) — needs implementation ----------
def generate_low_stock_excel(**kwargs):
    """
    Low Stock report - needs implementation
    """
    # TODO: Implement low stock alert logic
    return None
