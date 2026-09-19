# Full project architecture

## Runtime boundaries

The browser is a presentation and input client. The Node service is authoritative for money, inventory, employees, market conditions, and progression. A client must never mutate economic state directly in a production deployment.

## Action lifecycle

1. Client submits a typed action to `POST /api/games/:id/actions`.
2. Server validates role, price bounds, affordability, and action type.
3. Simulation mutates the game state and records a period result.
4. Server persists a snapshot and returns the authoritative state.
5. Client renders the returned state.

## Production hardening checklist

- Replace JSON snapshots with PostgreSQL transactions.
- Add identity, sessions, authorization, and per-player game ownership.
- Store an immutable action/event ledger for replay and audit.
- Use integer cents or a decimal library for all currency operations.
- Add deterministic seeded simulation for reproducible tests.
- Add schema validation at the API boundary.
- Add optimistic concurrency using a state version.
- Add rate limiting and request authentication.
- Add automated unit, API, and browser tests.
- Use a job queue for scheduled days and notifications.

## Real-world training boundary

The simulation is educational. It is not accounting, investment, tax, legal, employment, or business advice. Any real-world training mode should use jurisdiction-specific rules and reviewed datasets.
