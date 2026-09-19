# Production operations

## TLS and load balancing

Terminate TLS at a managed load balancer or reverse proxy. The application only receives traffic from the trusted proxy:

- set `NODE_ENV=production`
- set `TRUST_PROXY` to the exact proxy hop count
- set `CORS_ORIGIN` to explicit HTTPS origins
- enable HSTS at the proxy after validating every client and Unity endpoint
- redirect HTTP to HTTPS at the proxy and application

Do not terminate production TLS inside the Node process unless certificate rotation is automated.

## Secrets management

Store `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, `CORS_ORIGIN`, and backup credentials in a cloud secrets manager or Vault. Inject them at runtime; never commit `.env` files, secrets, certificates, or database dumps. Rotate JWT/database credentials using a staged deployment.

## Separate migration role

Run `npm run migrate` from a release job using a migration database role. The runtime role must not have DDL or schema ownership. Apply `server/migrations/002_security.sql` with the deployment role and substitute the actual runtime role before execution.

## Redis rate limiting

Production requires `REDIS_URL`. The API uses Redis-backed `express-rate-limit`, so limits are shared across replicas. Monitor Redis availability and configure a fail-closed policy for authentication endpoints.

## Monitoring

Prometheus metrics are available at `/metrics`. Scrape them privately through the load balancer or service network. Alert on 5xx rate, request latency, authentication failures, PostgreSQL pool exhaustion, Redis errors, and event-write failures. Send structured application logs to a centralized log service.

## Backups and recovery

Run `npm run backup` from a scheduled worker with `BACKUP_DIR` mounted to encrypted object storage. Use PostgreSQL point-in-time recovery when available, retain encrypted daily/weekly copies, and perform restore drills. A backup is not considered valid until a restore has been verified.

## Retention and privacy

Run `npm run retention` on a schedule only after legal review. Document retention periods for game state, immutable events, account records, operational logs, and backups. Apply deletion/anonymization workflows where legally required; preserve only records with a documented operational or legal purpose.
