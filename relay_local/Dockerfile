# Dockerfile para Relay Local - Escáner de cámaras (ligero)
# Compatible con Windows Docker Desktop

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copiar requirements del relay
COPY relay_local/requirements.txt /app/relay_requirements.txt

# Instalar dependencias Python (solo FastAPI y requests)
RUN pip install --upgrade pip && \
    pip install -r /app/relay_requirements.txt

# Copiar código del relay
COPY relay_local /app/relay_local

WORKDIR /app/relay_local

# Exponer puerto
EXPOSE 7000

# Comando para iniciar el relay
CMD ["python", "main.py"]
