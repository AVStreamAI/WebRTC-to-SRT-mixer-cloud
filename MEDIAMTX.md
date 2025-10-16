# MediaMTX Integration

This project uses [MediaMTX](https://github.com/bluenviron/mediamtx) as the ingress and preview
front-end for all transport protocols. The `mediamtx.yml` configuration in the repository captures
all of the conventions referenced by the API, worker fleet, and web panel.

## Overview

MediaMTX terminates user contribution feeds and exposes low-latency WebRTC preview fan-out. Mixer
workers publish their composited programs back into MediaMTX so operators can monitor them over
WHEP. The service is expected to run inside the docker-compose stack and is addressed by other
containers as `mediamtx:8889` (WebRTC), `mediamtx:1935` (RTMP), and `mediamtx:8000` (SRT).

Key features enabled by the configuration:

- RTMP and SRT listener endpoints for `/ingest/<project>/<input>`.
- WHIP ingest and WHEP playback over the WebRTC server for browser-based contribution and preview.
- Dedicated `/out/<project>/<pipeline>` fan-outs for Program and AUX buses.
- HTTP authentication callbacks into the API for token validation.
- Webhook-style callbacks back into the API whenever inputs or mixer outputs go on/off-line.
- Prometheus metrics and the MediaMTX control API for observability and orchestration.

## Authentication Flow

MediaMTX delegates all authentication decisions to the API service via `authMethod: http`. Every
publish/read attempt issues a `POST` to `http://api:3000/internal/mediamtx/auth` with the payload
outlined in the MediaMTX documentation. The API must accept or reject the request based on the
provided `token`, which can be delivered either as:

- `?token=<project-token>` query parameter (recommended for RTMP/SRT contributions).
- `X-Auth-Token: <project-token>` HTTP header (used by WHIP/WHEP clients).

The `/api/ingest/token` endpoint issues credentials that embed these tokens alongside the RTMP and
SRT connection details.

## Path Layout

Two explicit path matchers are defined:

| Path Pattern | Purpose | Publish Protocols | Read Protocols |
|--------------|---------|-------------------|----------------|
| `/ingest/<project>/<input>` | External contribution feeds. | RTMP, SRT, WHIP | WHEP |
| `/out/<project>/<pipeline>` | Mixer return feeds (Program, AUX1..7). | SRT, RTMP | WHEP |

Any path that does not match these expressions falls back to the `all_others` block, which simply
accepts a publisher without additional hooks.

The SRT listener runs on UDP port `8000`. All SRT contributions must set the configured
`INGEST_SRT_PASSPHRASE` and include the path in the `streamid` field
(e.g. `streamid="ingest/my-project/cam-a?token=..."`). Return feeds published by mixer workers must
use the `OUTPUT_SRT_PASSPHRASE`.

## WebRTC / WHIP / WHEP

- The WebRTC HTTP endpoint listens on `:8889` with plain HTTP (TLS is terminated by the outer
  reverse proxy defined in the deployment docs).
- WHIP (WebRTC ingest) and WHEP (WebRTC playback) are both enabled by default; this allows browsers
  to either contribute sources or preview Program/AUX pipelines directly.
- Configure CORS for the web control panel by setting `MEDIAMTX_WEBRTC_ALLOW_ORIGIN` if the default
  wildcard is not acceptable in production. When deployed behind a reverse proxy, populate
  `MEDIAMTX_WEBRTC_ADDITIONAL_HOSTS` with the publicly reachable hostname or IP so ICE candidates
  include routable addresses.

## Event Hooks

The `runOnReady`/`runOnNotReady` hooks emit lifecycle notifications to
`http://api:3000/internal/mediamtx/events`. The API service is responsible for acknowledging these
webhooks and broadcasting the state changes to interested clients (for example through Redis Pub/Sub
or WebSockets). Hooks carry the following JSON payloads:

```json
{
  "event": "INGEST_ONLINE" | "INGEST_OFFLINE" | "OUTPUT_ONLINE" | "OUTPUT_OFFLINE",
  "project": "<project>",
  "name": "<input-or-pipeline>",
  "protocol": "<connection type>" // present only for ingest-online
}
```

These callbacks allow the control panel to surface real-time status changes without polling. The
official MediaMTX image already ships with `curl`; if you build a custom image, make sure the
utility remains available or replace the commands with an equivalent notifier script.

## Running in Docker Compose

Add the MediaMTX service to the orchestrator stack using the following snippet as a starting point:

```yaml
services:
  mediamtx:
    image: bluenviron/mediamtx:latest
    restart: unless-stopped
    env_file:
      - ./config/mediamtx.env
    volumes:
      - ./mediamtx.yml:/mediamtx.yml:ro
      - mediamtx-recordings:/recordings
      - mediamtx-certs:/certs
    command: ["/mediamtx", "/mediamtx.yml"]
    ports:
      - "1935:1935/tcp"   # RTMP ingest
      - "8000:8000/udp"   # SRT ingest / return
      - "8889:8889/tcp"   # WHIP/WHEP HTTP endpoint
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:9997/v3/paths"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

Populate `config/mediamtx.env` with deployment-specific secrets, for example:

```
INGEST_SRT_PASSPHRASE=super-secure-ingest
OUTPUT_SRT_PASSPHRASE=super-secure-egress
MEDIAMTX_WEBRTC_ALLOW_ORIGIN=https://mixer.example.com
MEDIAMTX_WEBRTC_ADDITIONAL_HOSTS=mixer.example.com
```

If additional TLS assets are required (for example when terminating WHIP/WHEP directly inside
MediaMTX), mount certificates inside the container and set the corresponding `webrtcServerKey` and
`webrtcServerCert` parameters.

## Next Steps

- Implement the `/internal/mediamtx/auth` and `/internal/mediamtx/events` handlers in the API.
- Hook the emitted events into Redis so that workers and the control panel receive timely updates.
- Extend the docker-compose file so the MediaMTX service is orchestrated alongside the API, Redis,
  PostgreSQL, and mixer workers.
- Provide an automated smoke test that validates the ingest path mapping and authentication callbacks
  once the API endpoints are available.

