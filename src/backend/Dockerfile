FROM python:3.12-slim

WORKDIR /app

# Instalar dependências de sistema necessárias
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependências Python
COPY src/backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --retries 5 --timeout 60 -r requirements.txt

# Copiar dados de seed para /data
COPY data /data

# Copiar código-fonte da aplicação
COPY src/backend /app

# Garantir que a pasta de uploads exista
RUN mkdir -p /app/uploads

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
