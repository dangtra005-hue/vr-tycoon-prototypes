REVOKE ALL ON users, games, game_events, refresh_tokens FROM PUBLIC;
-- Run deployment with a dedicated application role. The migration owner must substitute
-- the role name for APP_ROLE before applying this file in each environment.
-- REVOKE CREATE ON SCHEMA public FROM APP_ROLE;
-- GRANT USAGE ON SCHEMA public TO APP_ROLE;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON users, games, game_events, refresh_tokens TO APP_ROLE;
-- GRANT USAGE, SELECT ON SEQUENCE game_events_id_seq TO APP_ROLE;
-- Keep migration ownership separate from APP_ROLE; do not grant DDL in production.
