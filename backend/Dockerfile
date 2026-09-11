FROM python:3.12-slim

WORKDIR /app

ENV PYTHONPATH=/app:/app/api:/app/database:/app/backend

# System dependencies for postgres and libmagic
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy application code
COPY . /app

# Default command: run Celery worker
CMD ["celery", "-A", "backend.celery_app", "worker", "--loglevel=info", "--concurrency=4"]
