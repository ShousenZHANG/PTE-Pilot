# PTE Pilot Gateway

Private loopback boundary between PTE Pilot Chrome Extension and optional Hermes memory. It exposes only four routes:

- `GET /pte/v1/health`
- `POST /pte/v1/pair`
- `POST /pte/v1/events:batchUpsert`
- `POST /pte/v1/rank`

SQLite is a rebuildable, idempotent learning projection. Hermes never controls browser state and never acknowledges event writes. If Hermes is absent, rejected, or times out, ranking remains available through deterministic local ordering.

## Run

Copy `.env.example` outside the repository, replace all placeholder secrets, then:

```powershell
pnpm --filter @pte-pilot/gateway build
node.exe --env-file="C:\path\to\gateway.env" .\apps\gateway\dist\main.js
```

Gateway refuses every public host except `127.0.0.1` and defaults to port `8642`.

To start it at Windows sign-in after the first build:

```powershell
.\apps\gateway\scripts\install-startup.ps1 -EnvFile "C:\path\to\gateway.env"
```

Remove the task with `uninstall-startup.ps1`. The scripts never copy the environment file or secrets into the repository.

## Pair

With Gateway stopped, generate a one-time, five-minute pairing code against the same environment and database:

```powershell
node.exe --env-file="C:\path\to\gateway.env" .\apps\gateway\dist\cli\create-pairing-code.js
```

Paste the 12-character code into the cockpit Settings panel. Extension sends it as `pairingCode`; Gateway returns one bearer token. Neither pairing code nor token is logged.

## Hermes boundary

Hermes is accepted only when `/v1/models` contains exactly model `pte-pilot`, `/v1/toolsets` uses envelope `{ object, platform, data }`, the only enabled toolset is configured `memory` with child tools `memory_store` and `memory_recall`, and configured `platform_toolsets.api_server` is exactly `[memory, no_mcp]`. Any drift disables Hermes use without interrupting local practice.

Use the isolated examples under `hermes/`; run this private Hermes profile on `127.0.0.1:8643` because the PTE Gateway owns `8642`. Do not configure CORS. The Gateway checks both the local YAML and Hermes' live discovery endpoints before allowing a memory or ranking request.
