# realmate-challenge

## Sumário

- [Introdução](#introdução)  
- [Recursos](#recursos)  
- [Tecnologias](#tecnologias)  
- [Pré-requisitos](#pré-requisitos)  
- [Instalação](#instalação)  
  - [Clonar o repositório](#clonar-o-repositório)  
  - [Configurar o ambiente Python](#configurar-o-ambiente-python)  
  - [Executar migrações](#executar-migrações)  
  - [Iniciar o servidor Django](#iniciar-o-servidor-django)  
- [Endpoints da API](#endpoints-da-api)  
  - [Registro de usuário](#registro-de-usuário)  
  - [Login / Autenticação](#login--autenticação)  
  - [Webhook](#webhook)  
- [Integração com Frontend](#integração-com-frontend)  
- [Estrutura do Projeto](#estrutura-do-projeto)  
- [Contribuição](#contribuição)  
- [Licença](#licença)  

---

## Introdução

`realmate-challenge` é uma API RESTful construída com Django e Django REST Framework para suportar um sistema de atendimento via chat. A aplicação fornece autenticação por JWT, endpoints para registrar usuários, realizar login e receber eventos de webhook de conversas e mensagens.

## Recursos

- Registro de usuários com distinção entre **agentes** e **clientes**  
- Autenticação via JWT  
- Recebimento de eventos de **novo bate-papo**, **mensagens enviadas/recebidas** e **fechamento de conversa**  
- CORS configurado para integração com frontend Next.js  

## Tecnologias

- Python >= 3.13  
- Django 5.1.6  
- Django REST Framework 3.16.0  
- django-cors-headers 4.7.0  
- PyJWT 2.10.1  
- SQLite (banco de dados embarcado)  
- Next.js (frontend, não incluso neste repositório)  

## Pré-requisitos

- Git  
- Python >= 3.13  
- Poetry  
- Node.js >= 16 (para o frontend)  

## Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/felipe-valadares/realmate-webchat-challenge.git
cd realmate_challenge
```

### 2. Configurar o ambiente Python

```bash
# Instalar o Poetry (se ainda não tiver)
pip install poetry

# Instalar dependências
poetry install
```

### 3. Executar migrações

```bash
poetry run python manage.py migrate
```

### 4. Iniciar o servidor Django

```bash
poetry run python manage.py runserver
```

O backend estará disponível em `http://localhost:8000`.

---

## Endpoints da API

> **Obs.:** A app Django foi configurada com `APPEND_SLASH = False`. URLs devem ser chamadas exatamente com ou sem barra final, conforme descrito.

### 1. Registro de usuário

POST `/register/`  
Registra usuário (cliente ou agente).

```bash
curl -X POST http://localhost:8000/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "teste",
    "password": "teste",
    "email": "teste@teste.com",
    "is_agent": false
  }'
```

### 2. Login / Autenticação

POST `/login/`  
Retorna token JWT.

```bash
curl -X POST http://localhost:8000/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "teste",
    "password": "teste"
  }'
```

### 3. Webhook

POST `/webhook/`  
Recebe eventos de chat. Requer header `Authorization: Bearer <token>`.

#### 3.1 Novo evento de conversa

```bash
curl -X POST http://localhost:8000/webhook/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "type": "NEW_CONVERSATION",
    "timestamp": "2025-02-21T10:20:41.349308",
    "data": {
      "id": "6a41b347-8d80-4ce9-84ba-7af66f369f6a"
    }
  }'
```

#### 3.2 Nova mensagem (enviada ou recebida)

```bash
curl -X POST http://localhost:8000/webhook/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "type": "NEW_MESSAGE",
    "timestamp": "2025-02-21T10:20:44.349308",
    "data": {
      "id": "16b63b04-60de-4257-b1a1-20a5154abc6d",
      "direction": "SENT",         # ou "RECEIVED"
      "content": "Tudo ótimo e você?",
      "conversation_id": "6a41b347-8d80-4ce9-84ba-7af66f369f6a"
    }
  }'
```

#### 3.3 Fechamento de conversa

```bash
curl -X POST http://localhost:8000/webhook/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "type": "CLOSE_CONVERSATION",
    "timestamp": "2025-02-21T10:25:00.000000",
    "data": {
      "conversation_id": "6a41b347-8d80-4ce9-84ba-7af66f369f6a"
    }
  }'
```

---

## Integração com Frontend

O frontend em Next.js (não incluído neste repositório) pode ser iniciado assim:

```bash
cd realmate_challenge/frontend
npm install
npm run dev
```

Acesse `http://localhost:3000`.

---

## Estrutura do Projeto

```
realmate_challenge/
├── webhook_api/           # App principal (views, models, serializers, middleware)
├── realmate_challenge/    # Configurações do Django (settings, urls, wsgi)
├── frontend/              # (Opcional) cliente Next.js
├── db.sqlite3             # Banco de dados SQLite
├── README.md              # Documentação do projeto
├── pyproject.toml         # Dependências e configuração Poetry
└── poetry.lock            # Lockfile gerado pelo Poetry
```

---

## Contribuição

1. Fork este repositório  
2. Crie uma branch feature: `git checkout -b feature/nova-funcionalidade`  
3. Commit suas alterações: `git commit -m "Descrição da mudança"`  
4. Push para a branch: `git push origin feature/nova-funcionalidade`  
5. Abra um Pull Request  

---

## Licença

Este projeto está sob a licença MIT. Consulte o arquivo `LICENSE` para detalhes.  