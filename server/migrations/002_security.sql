REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
-- Execute the following as a deployment administrator after replacing APP_ROLE.
-- CREATE ROLE APP_ROLE LOGIN PASSWORD 'inject-from-secret-manager';
-- GRANT USAGE ON SCHEMA public TO APP_ROLE;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON users, games, game_events, refresh_tokens TO APP_ROLE;
-- GRANT USAGE, SELECT ON SEQUENCE game_events_id_seq TO APP_ROLE;
-- Do not grant CREATE, ALTER, DROP, ownership, or migration privileges to APP_ROLE.
