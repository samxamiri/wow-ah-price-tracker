FROM python:3.12-slim

# Don't write .pyc files; print logs immediately (important in containers).
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Copy requirements first so Docker can cache the install layer
# when only the code changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ah_worker ./ah_worker

# Run as a non-root user.
RUN useradd --create-home appuser
USER appuser

CMD ["python", "-m", "ah_worker.main"]
