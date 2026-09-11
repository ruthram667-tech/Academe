# Academe v2

Multi-tenant assessment platform — React + FastAPI + PostgreSQL.

## Quick Start

```bash
docker compose up --build
```

Then open:
- **App (Frontend)**: http://localhost:80
- **API Docs (Swagger)**: http://localhost:8000/docs (or http://localhost/docs)
- **MinIO Console**: http://localhost:9001 (minioadmin / minioadmin)
- **API Health**: http://localhost:8000/health

## Project Layout

```
api/          FastAPI backend (Python 3.12)
web/          React + Vite + TypeScript frontend
infra/        Docker Compose & deployment configs
docs/         Architecture Decision Records
```

## Demo Accounts (after seeding)

| Role         | Email                | Password   |
|--------------|----------------------|------------|
| Tenant Admin | admin@academe.edu    | admin123   |
| Staff        | staffa@academe.edu   | staff123   |
| Student      | studentx@academe.edu | student123 |
