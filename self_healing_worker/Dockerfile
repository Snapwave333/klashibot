FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (e.g. for psutil)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose API port
EXPOSE 8002

# Run the worker
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
