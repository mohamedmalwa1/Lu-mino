"""
Django settings for myapp project - Optimized for Report Generation
"""

import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# -------------------------
# Core
# -------------------------
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-fallback-key-for-dev-only')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = [h for h in os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',') if h]

TIME_ZONE = os.getenv('TIME_ZONE', 'UTC')
USE_TZ = True
LANGUAGE_CODE = 'en-us'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# -------------------------
# Installed apps
# -------------------------
INSTALLED_APPS = [
    # Django
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.postgres',   # Postgres-specific goodies

    # Project apps
    'core',
    'hr',
    'finance',
    'student',
    'reporting',
    'inventory',

    # 3rd party
    'rest_framework',
    'rest_framework_simplejwt',
    'django_celery_beat',
    'notifications',
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'myapp.urls'

# -------------------------
# Templates (WeasyPrint-friendly)
# -------------------------
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'templates'),
            os.path.join(BASE_DIR, 'reporting/templates'),
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
            'builtins': [
                'django.templatetags.static',
            ],
        },
    },
]

# -------------------------
# Database (PostgreSQL via env)
# -------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("PGDATABASE", "nursery_db"),
        "USER": os.getenv("PGUSER", "lumino"),
        "PASSWORD": os.getenv("PGPASSWORD", "$Alwa1234@"),
        "HOST": os.getenv("PGHOST", "127.0.0.1"),
        "PORT": os.getenv("PGPORT", "5432"),
        "CONN_MAX_AGE": 300,
        "ATOMIC_REQUESTS": False,
        # "OPTIONS": {"sslmode": os.getenv("PGSSLMODE", "prefer")},
    }
}

# -------------------------
# Static & media
# -------------------------
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]  # ok if folder exists; otherwise remove this line
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# reports go to media/reports (used by tasks)
REPORT_MEDIA_ROOT = os.path.join(MEDIA_ROOT, 'reports')
os.makedirs(REPORT_MEDIA_ROOT, exist_ok=True)

# -------------------------
# Celery / RabbitMQ
# -------------------------
CELERY_BROKER_URL = os.getenv('RABBITMQ_URL', 'amqp://guest:guest@127.0.0.1:5672//')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'rpc://')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 mins

# -------------------------
# WeasyPrint
# -------------------------
WEASYPRINT_BASEURL = 'file://' + str(BASE_DIR)
WEASYPRINT_DPI = 96
WEASYPRINT_PRESENTATIONAL_HINTS = True

# -------------------------
# DRF & JWT
# -------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("JWT_ACCESS_MIN", "60"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("JWT_REFRESH_DAYS", "7"))),
    "ROTATE_REFRESH_TOKENS": True,
}

# -------------------------
# CORS / CSRF (env based)
# -------------------------
CORS_ALLOWED_ORIGINS = [o for o in os.getenv('CORS_ALLOWED_ORIGINS', '').split(',') if o]
CSRF_TRUSTED_ORIGINS = [o for o in os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',') if o]

# -------------------------
# Email (for report emailing)
# -------------------------
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.office365.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "info@lu-mino.com"
EMAIL_HOST_PASSWORD = "LU-mino852"
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
SERVER_EMAIL = EMAIL_HOST_USER

# Email timeout settings
EMAIL_TIMEOUT = 30  # seconds
# -------------------------
# Security (prod toggles)
# -------------------------
if not DEBUG:
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# -------------------------
# Logging (debug report issues)
# -------------------------
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'report_file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'report_errors.log'),
            'formatter': 'verbose',
        },
    },
    'formatters': {
        'verbose': { 'format': '{levelname} {asctime} {module} {message}', 'style': '{' },
    },
    'loggers': {
        'reporting': { 'handlers': ['report_file'], 'level': 'DEBUG', 'propagate': True },
    },
}

SILENCED_SYSTEM_CHECKS = ['security.W008']

