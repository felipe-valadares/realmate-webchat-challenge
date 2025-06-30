# Instruções para Executar o Projeto

Este documento descre como executar o projeto RealMate Webchat tanto usando Docker Compose quanto manualmente.

## Pré-requisitos

- Docker e Docker Compose
- Python >= 3.13 e Poetry (opcional)
- Node.js >= 16 (para o frontend)

## Variáveis de Ambiente

Antes de executar, copie o arquivo de exemplo de variáveis de ambiente:
```bash
cp env.example .env
```
Abra o arquivo `.env` e ajuste, se necessário, as seguintes variáveis (valores padrão entre parênteses):
- POSTGRES_DB (postgres)
- POSTGRES_USER (postgres)
- POSTGRES_PASSWORD (postgres)
- POSTGRES_HOST (db)
- POSTGRES_PORT (5432)
- REDIS_URL (redis://redis:6379/0)
- CELERY_BROKER_URL (redis://redis:6379/0)
- CELERY_RESULT_BACKEND (redis://redis:6379/0)

## Usando Docker Compose

1. Copie o arquivo de variáveis de ambiente:
   ```bash
   cp env.example .env
   ```
2. Edite o arquivo `.env` para ajustar os valores conforme necessário.
3. Construa e inicie os serviços:
   ```bash
   docker compose up --build
   ```
4. Acesse:
   - Backend: `http://localhost:8000`
   - Frontend: `http://localhost:3000`

## Execução Manual (sem Docker)

1. Copie o arquivo de variáveis de ambiente:
   ```bash
   cp env.example .env
   ```
2. Edite o arquivo de variáveis de ambiente `.env` para definir suas configurações.
3. Carregue as variáveis de ambiente:
   ```bash
   set -o allexport && source .env && set +o allexport
   ```
4. Instale dependências Python:
   ```bash
   poetry install
   ```
5. Aplique as migrações:
   ```bash
   poetry run python manage.py migrate
   ```
6. Inicie o servidor Django:
   ```bash
   poetry run python manage.py runserver
   ```
7. Em outra aba, inicie o worker Celery:
   ```bash
   poetry run celery -A realmate_challenge worker --loglevel=info
   ```
8. Instale e execute o frontend:
   ```bash
   cd realmate_challenge/frontend
   npm install
   npm run dev
   ```

Pronto! O backend estará disponível em `http://localhost:8000` e o frontend em `http://localhost:3000`. 