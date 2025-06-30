ARG PYTHON_VERSION=3.13-slim
FROM python:${PYTHON_VERSION}

ENV PYTHONUNBUFFERED=1
WORKDIR /app

# Dependências do sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
  && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependências Python
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copiar o resto do código
COPY . /app

# Expor porta
EXPOSE 8000

# Entrypoint padrão: rodar gunicorn
CMD ["gunicorn", "realmate_challenge.wsgi:application", "--bind", "0.0.0.0:8000"]
