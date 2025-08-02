from django.conf import settings
from django.core.mail import EmailMessage
from django.template.loader import render_to_string

def send_html_mail(subject, template_name, context, to=None):
    if to is None:
        to = settings.ALERT_RECIPIENTS

    html_body = render_to_string(template_name, context)
    msg = EmailMessage(subject, html_body, settings.DEFAULT_FROM_EMAIL, to)
    msg.content_subtype = "html"
    msg.send()

