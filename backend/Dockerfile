FROM python:3.12-slim

WORKDIR /app

# Install Node.js (required by yt-dlp >= 2025 for JS runtime)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    libmecab-dev \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
