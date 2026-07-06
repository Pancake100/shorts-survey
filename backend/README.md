# Kansei Video Survey API v2

FastAPI backend for the Kansei short-form educational video survey.

This version supports:

- Server-generated participant IDs
- Automatic group/video-set assignment
- Optional URL/group override
- Weighted group balancing
- Assignment tracking
- Result storage by group
- Unknown submission storage
- Group stats endpoint

## Folder structure

```text
kansei_survey_api_v2/
  main.py
  requirements.txt
  README.md
  sample_payload.json
  data/
    assignments/
      group-a/
      group-b/
    results/
      group-a/
      group-b/
    unknown/
```

## Valid groups

The valid groups are kept in `main.py`:

```python
VALID_GROUPS = ["A", "B"]
```

To add future groups, update this list and create matching video sets in the frontend.

## Endpoints

```text
GET  /api/health
GET  /api/group-stats
POST /api/start-session
POST /api/start-session?group=A
POST /api/submit
```

## Assignment strategy

The server assigns new participants to the group with the lowest weighted score:

```text
score = completed_count + 0.5 × active_incomplete_count
```

By default:

```text
active assignment weight = 0.5
assignment expiration = 24 hours
```

Expired incomplete assignments are kept for audit but do not affect active assignment balancing. If scores are tied, the server chooses randomly among the tied groups.

## Start a new session

```bash
curl -X POST http://127.0.0.1:8000/api/start-session
```

Example response:

```json
{
  "ok": true,
  "participant_id": "P-20260701T103000Z-A7F3K",
  "group": "A",
  "group_label": "Group A",
  "assignment_method": "least_weighted_count",
  "assigned_at": "2026-07-01T10:30:00+00:00",
  "assignment_expires_at": "2026-07-02T10:30:00+00:00",
  "stats": {
    "A": {
      "completed": 10,
      "active_incomplete": 1,
      "expired_incomplete": 0,
      "assigned_total": 11,
      "score": 10.5
    }
  }
}
```

## Group override

To force a group assignment:

```bash
curl -X POST "http://127.0.0.1:8000/api/start-session?group=B"
```

If the group is invalid, the server returns an error.

This supports frontend links such as:

```text
/survey/?group=B
```

The frontend should pass the URL group parameter to `/api/start-session?group=B` only when starting a fresh session or explicitly restarting.

## Submit a survey

The submitted JSON must include:

```json
{
  "participant": {
    "participant_id": "P-20260701T103000Z-A7F3K",
    "group": "A"
  }
}
```

Request:

```bash
curl -X POST http://127.0.0.1:8000/api/submit \
  -H "Content-Type: application/json" \
  -d @sample_payload.json
```

The result is saved under:

```text
data/results/group-a/
```

The assignment record is updated under:

```text
data/assignments/group-a/
```

## Missing assignment file

If the submitted group is valid but the matching assignment file is missing, the result is still saved. The API response includes a warning.

This supports legacy submissions or recovery cases.

## Missing or invalid group

If the submitted group is missing or invalid:

1. the raw submission is saved under `data/unknown/`
2. the API returns HTTP 400

This prevents data loss while making the issue visible.

## Check group stats

```bash
curl http://127.0.0.1:8000/api/group-stats
```

This is useful during data collection to check balance between groups.

## Installation

```bash
cd kansei_survey_api_v2
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run locally

```bash
uvicorn main:app --host 127.0.0.1 --port 8000
```

Open:

```text
http://127.0.0.1:8000/api/health
```

## Environment variables

### `DATA_DIR`

Default:

```text
./data
```

Example:

```bash
DATA_DIR=/opt/kansei-survey-backend/data
```

### `ACTIVE_ASSIGNMENT_WEIGHT`

Default:

```text
0.5
```

### `ASSIGNMENT_EXPIRATION_HOURS`

Default:

```text
24
```

### `ALLOWED_ORIGINS`

Comma-separated list for CORS.

Example:

```bash
ALLOWED_ORIGINS=http://localhost:8000,http://your-university-server
```

If the frontend and API share the same origin through Nginx, CORS may not be needed.

## Example frontend config

When served through the same host under `/survey/`:

```js
submitEndpoint: "/survey/api/submit",
startSessionEndpoint: "/survey/api/start-session"
```

For direct local testing:

```js
submitEndpoint: "http://127.0.0.1:8000/api/submit",
startSessionEndpoint: "http://127.0.0.1:8000/api/start-session"
```

## Example Nginx reverse proxy

```nginx
location /survey/api/ {
    proxy_pass http://127.0.0.1:8000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Example systemd service

```ini
[Unit]
Description=Kansei Video Survey API
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/kansei-survey-backend
Environment="DATA_DIR=/opt/kansei-survey-backend/data"
Environment="ACTIVE_ASSIGNMENT_WEIGHT=0.5"
Environment="ASSIGNMENT_EXPIRATION_HOURS=24"
ExecStart=/opt/kansei-survey-backend/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## Security notes

- Keep `data/` outside the public web directory.
- Do not commit collected JSON files to GitHub.
- Back up `data/` regularly.
- Restrict file permissions so only the backend user and researchers can read the results.
- The backend sanitizes participant IDs and validates groups.
