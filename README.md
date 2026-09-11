# Academe Platform

Enterprise Multi-Tenant Educational Assessment & Learning Management Platform.

## Quick Start

```bash
docker compose up --build
```

Then open:
- **Frontend Portal**: [http://localhost:80](http://localhost:80)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs) (or [http://localhost/docs](http://localhost/docs))
- **MinIO Console**: [http://localhost:9001](http://localhost:9001) (`minioadmin` / `minioadmin`)
- **API Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## Project Structure

The codebase is organized into four modular, decoupled directories:

```
Academe/
├── frontend/             # Static UI, styles, scripts, Nginx reverse proxy configs
│   ├── index.html        # Student portal (Courses, Tests, Presentations)
│   ├── login.html        # 3D holographic neural login interface
│   ├── staff-dashboard.* # Faculty portal (Notes, Grading, PPT Reviews)
│   ├── superadmin-dashboard.* # Super Admin console (Faculty & Student rosters)
│   ├── portal-state.js   # Shared local & API state persistence
│   ├── nginx.conf        # Production & local reverse proxy
│   └── Dockerfile        # Nginx alpine container definition
│
├── backend/              # Asynchronous job workers & background services
│   ├── celery_app.py     # Celery worker configuration & task discovery
│   ├── tasks/            # Async tasks (file scanning, notifications, exports)
│   ├── services/         # Business logic services
│   ├── requirements.txt  # Worker dependencies
│   └── Dockerfile        # Celery worker container definition
│
├── database/             # Schemas, ORM models, connections, and migrations
│   ├── connection.py     # Async SQLAlchemy 2.0 engine & session maker
│   ├── models/           # Modular ORM entity models (Base, User, Tenant, etc.)
│   ├── migrations/       # Alembic versioned database migrations
│   ├── alembic.ini       # Migration configuration
│   └── init.sql          # PostgreSQL bootstrap & extension installer
│
├── api/                  # FastAPI REST API application
│   ├── app/
│   │   ├── main.py       # FastAPI application entrypoint & middleware
│   │   ├── routes/       # API route controllers (auth, admin, staff, student)
│   │   ├── schemas/      # Pydantic request/response models
│   │   ├── dependencies.py # Auth, tenant scoping, and session injection
│   │   ├── policies/     # Row-level & role-based authorization policies
│   │   └── config.py     # Application environment settings
│   ├── requirements.txt  # REST API dependencies
│   ├── tests/            # Test suite
│   └── Dockerfile        # API server container definition
│
├── docker-compose.yml    # Multi-service orchestration (db, redis, minio, api, worker, frontend)
└── docs/                 # Platform architecture & specifications
```

---

## Master Authentication

- **Role**: Super Admin
- **Username / Email**: `superadmin` or `admin@academe.edu`
- **Password**: `admin123`

The Super Admin can provision faculty staff and students directly within the Super Admin Console.
