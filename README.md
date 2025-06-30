# RealMate Webchat Challenge

Este repositório contém o backend Django + Celery e o frontend Next.js para o desafio RealMate Webchat.

## Pré-requisitos

- Docker >= 20.10
- Docker Compose v2

## Configuração

1. Copie o arquivo de variáveis de ambiente:
   ```bash
   cp env.example .env
   ```
2. Ajuste `.env` apenas se necessário (os valores padrão já funcionam com Docker Compose).

## Deploy Rápido

Execute em um único comando:
```bash
# Build e sobe todos os serviços (backend, frontend, DB, Redis, Celery)
docker compose up -d --build
```

Acesse:

- Backend: http://localhost:8000
- Frontend: http://localhost:3000

Para parar e remover containers:
```bash
docker compose down
```

## Desenvolvimento Manual

Caso queira executar sem Docker:

### Backend

```bash
cp env.example .env
set -o allexport && source .env && set +o allexport
poetry install
poetry run python manage.py migrate
poetry run python manage.py runserver
```

Em outra aba:

```bash
poetry run celery -A realmate_challenge worker --loglevel=info
```

### Frontend

```bash
cd realmate_challenge/frontend
npm install
npm run dev
```

## Estrutura do Projeto

```
.
├── docker-compose.yml
├── dockerfile
├── env.example
├── realmate_challenge/
│   ├── frontend/        # Next.js
│   ├── asgi.py
│   ├── celery.py
│   └── ...
└── webhook_api/
```

## Licença

MIT  