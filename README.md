# Urban Empire Tycoon — Full Project

This repository now contains a production-oriented prototype architecture:

- `server/` — authoritative economy API with persistent save files
- `webxr-tycoon/` — browser/WebXR client and dashboard
- `unity-vr-tycoon/` — Unity/OpenXR integration scripts
- `docs/` — architecture and simulation documentation

## Run the full project

Requirements: Node.js 20+

```bash
npm install
npm run dev
```

Open `http://localhost:8080`. The server hosts the WebXR client and exposes the API at `/api`.

## API

- `GET /api/health`
- `GET /api/games/:gameId`
- `POST /api/games`
- `POST /api/games/:gameId/actions`
- `POST /api/games/:gameId/save`
- `POST /api/games/:gameId/load`

The server is authoritative: clients request actions, the economy engine validates them, and the resulting state is persisted to `server/data/`.

## Product scope

The project is a serious simulation foundation, not financial advice or a replacement for accounting software. Production deployment should add authentication, a real database, audit logging, rate limits, telemetry, and automated tests.

## Unity setup

Open the Unity folder in a Unity project, install XR Interaction Toolkit and OpenXR, then use the scripts under `Assets/Scripts/`. The `XRBusinessInteraction` component turns world-space controls into validated actions against a transport adapter.

## License

MIT
