# UniTest v2

Multi-tenant assessment platform — React + FastAPI + PostgreSQL.

## Quick Start

```bash
cd infra
docker compose up --build
```

Then open:
- **App**: http://localhost:5173
- **API docs**: http://localhost:8000/docs
- **MinIO console**: http://localhost:9001 (minioadmin / minioadmin)

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
| Tenant Admin | admin@unitest.edu    | admin123   |
| Staff        | staffa@unitest.edu   | staff123   |
| Student      | studentx@unitest.edu | student123 |
