# ADR-001: Multi-Tenancy Strategy

## Status
Accepted — August 2026

## Context
Academe v2 must serve multiple colleges from a single deployment. Three tenancy
strategies were considered:

1. **Database-per-tenant** — strongest isolation, but unaffordable on an 8 GB
   homelab. Each tenant means another Postgres instance or at least a separate
   connection pool and migration run.
2. **Schema-per-tenant** — decent isolation, but every Alembic migration runs
   N times. On a box already near memory limits, N schemas multiply the catalog
   and planning costs.
3. **Shared schema, tenant_id column + Row-Level Security** — one database, one
   migration run, one connection pool. Isolation enforced at the Postgres policy
   layer rather than at the infrastructure layer.

## Decision
**Shared schema with `tenant_id` on every tenant-scoped table and Postgres
Row-Level Security (RLS).**

Key implementation rules:
- The application connects as a **non-superuser** role (`academe_app`).
  `FORCE ROW LEVEL SECURITY` is set so RLS binds even for table owners.
- A per-request FastAPI dependency calls `SET LOCAL app.tenant_id = '{id}'`
  inside the transaction. RLS policies reference
  `current_setting('app.tenant_id')`.
- Cross-tenant isolation is tested at the **SQL layer** — not just the API —
  with negative tests that assert tenant A's session literally cannot `SELECT`
  tenant B's rows.

## Consequences
- **Pro**: Cheapest on memory. One migration run. Simplest ops.
- **Pro**: ORM bugs cannot leak data across tenants because the DB itself
  enforces the boundary.
- **Con**: A single Postgres failure affects all tenants (acceptable for a
  pilot; mitigated by backups and a VPS migration path in Layer 7).
- **Con**: Noisy-neighbour queries are possible — mitigated by per-tenant
  connection limits and query timeouts.
