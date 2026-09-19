# Production upgrade

The production foundation now includes:

- PostgreSQL persistence with migrations in `server/migrations/001_initial.sql`.
- JWT authentication and bcrypt password hashing.
- User-owned games: every game read and action is scoped to the authenticated owner.
- Zod action schemas and bounded numeric input validation.
- Immutable `game_events` records containing actor, payload, result, sequence, and state version.
- Row-level transactions using `SELECT ... FOR UPDATE` to prevent concurrent action races.
- Node tests for validation and deterministic economy behaviour.
- Unity `TycoonApiClient` and `XRBusinessInteraction` components for authenticated XR actions.

## Local setup

1. Start PostgreSQL and create a database.
2. Set environment variables:

```bash
export DATABASE_URL=postgres://user:password@localhost:5432/urban_empire
export JWT_SECRET="replace-with-a-long-random-secret"
```

3. Install and test:

```bash
npm install
npm test
npm run dev
```

## Unity integration

Add `TycoonApiClient` to a scene, configure the API URL, token, and game ID after login, and add `XRBusinessInteraction` to an XR interactable object. Use action types such as `next-day`, `train`, `upgrade`, `expand`, `marketing`, or `hire` with a role.

The Unity client intentionally treats the server as authoritative: it never calculates or writes money locally.
