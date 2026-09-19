# Deployment hardening

## HTTPS

Run behind a TLS terminator such as a cloud load balancer, managed reverse proxy, or Nginx. Set `NODE_ENV=production`, `TRUST_PROXY=1`, and `CORS_ORIGIN` to the exact HTTPS client origin. The API redirects accidental HTTP requests in production. Do not use the development JWT fallback.

## Refresh-token rotation

Access tokens expire after 15 minutes. Refresh tokens are stored as SHA-256 hashes, issued in an HttpOnly/Secure/SameSite cookie, rotated on every refresh, and revoked as a token family when reuse is detected. Do not expose refresh tokens to Unity or browser JavaScript.

## Database permissions

Apply `server/migrations/002_security.sql` with a dedicated application role. Keep migrations owned by a separate deployment role, revoke public access, and grant only runtime DML permissions to the API role. Use separate databases/roles for tests and production.

## Rate limiting

Authentication and all API routes have bounded rate limits. For multiple server instances, replace the in-memory limiter store with a shared Redis store.

## Audit retention

`node server/jobs/retention.js` deletes audit events older than `AUDIT_RETENTION_DAYS` (minimum 30, default 730). Schedule it with a managed job runner or cron after confirming legal and operational retention requirements.

## Integration tests

Set `TEST_DATABASE_URL` to a disposable PostgreSQL database and run:

```bash
npm run test:integration
```

## Unity session

`TycoonSession.cs` provides register/login/logout for a real Unity login screen. Pass its `AccessToken` to `TycoonApiClient.Configure`. Deploy Unity with an HTTPS API URL and never ship database credentials or refresh tokens in the client.
