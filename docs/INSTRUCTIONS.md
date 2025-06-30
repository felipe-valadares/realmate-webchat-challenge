# 📚 Guia de Execução

Bem-vindo ao projeto **RealMate Webchat**! Este guia apresenta instruções detalhadas para configurar e executar o sistema, seja via Docker Compose ou de forma manual.

## 📑 Sumário

- [Pré-requisitos](#pré-requisitos)
- [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
- [🚀 Execução com Docker Compose](#execução-com-docker-compose)
- [🧑‍💻 Execução Manual (sem Docker)](#execução-manual-sem-docker)
- [🔗 Endpoints Principais](#endpoints-principais)
- [❓ Dúvidas e Suporte](#dúvidas-e-suporte)

---

## 🛠️ Pré-requisitos

Antes de começar, verifique se você possui instalado em sua máquina:

- **Docker** >= 20.10
- **Docker Compose** v2
- (Opcional) **Python** >= 3.13 e **Poetry**
- (Opcional) **Node.js** >= 16

---

## 🔧 Configuração de Variáveis de Ambiente

1. Copie o arquivo de exemplo:
   ```bash
   cp docs/env.example .env
   ```
2. Abra o arquivo `.env` e ajuste conforme necessário. Exemplo de configuração:
   ```dotenv
   POSTGRES_DB=postgres
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_HOST=db
   POSTGRES_PORT=5432
   REDIS_URL=redis://redis:6379/0
   CELERY_BROKER_URL=redis://redis:6379/0
   CELERY_RESULT_BACKEND=redis://redis:6379/0
   ```

---

## 🚀 Execução com Docker Compose

1. Certifique-se de ter o `.env` configurado.
2. Execute o comando abaixo para construir e iniciar todos os serviços em segundo plano:
   ```bash
   docker compose up -d --build
   ```
3. Acesse no navegador:
   - Backend: `http://localhost:8000`
   - Frontend: `http://localhost:3000`

> Para parar e remover containers, utilize:
> ```bash
> docker compose down
> ```

---

## 🧑‍💻 Execução Manual (sem Docker)

### Backend

1. Copie e carregue as variáveis de ambiente:
   ```bash
   cp docs/env.example .env
   set -o allexport && source .env && set +o allexport
   ```
2. Instale dependências e aplique migrações:
   ```bash
   poetry install
   poetry run python manage.py migrate
   ```
3. Inicie o servidor Django:
   ```bash
   poetry run python manage.py runserver
   ```
4. Em outra aba/terminal, inicie o worker Celery:
   ```bash
   poetry run celery -A realmate_challenge worker --loglevel=info
   ```

### Frontend

1. Navegue até o diretório do frontend:
   ```bash
   cd realmate_challenge/frontend
   ```
2. Instale dependências e inicie o servidor de desenvolvimento:
   ```bash
   npm install
   npm run dev
   ```

---

## 🔗 Endpoints Principais

- **API REST**: `http://localhost:8000/api/`
- **WebSocket**: `ws://localhost:8000/ws/`
- **Frontend**: `http://localhost:3000`

---

## ❓ Dúvidas e Suporte

Em caso de problemas:

- Verifique os logs dos containers com `docker compose logs` ou dos serviços em execução.
- Consulte a [documentação principal](../README.md) para detalhes adicionais.