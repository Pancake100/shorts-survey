# Kansei Video Survey API

A small FastAPI backend for receiving submitted survey JSON and saving each result as a JSON file.

## Features

- `GET /api/health`
- `POST /api/submit`
- Saves submitted JSON under `results/`
- Uses `participant.participant_id` as the filename base
- Sanitizes filenames
- Avoids overwriting by appending a server timestamp
- Optional CORS configuration through environment variables

## Expected JSON shape

The frontend should submit JSON containing:

```json
{
  "participant": {
    "participant_id": "P-20260619143022-A7F3"
  },
  "preliminary_questionnaire": {},
  "responses": []
}
```

The backend saves a wrapper document:

```json
{
  "server_received_at": "2026-06-19T14:30:22+00:00",
  "client_ip": "127.0.0.1",
  "payload": {
    "...": "original submitted survey JSON"
  }
}
```

## Installation

```bash
cd kansei_survey_api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run locally

```bash
uvicorn main:app --host 127.0.0.1 --port 8000
```

Test health endpoint:

```bash
curl http://127.0.0.1:8000/api/health
```

Test submission:

```bash
curl -X POST http://127.0.0.1:8000/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "participant": {
      "participant_id": "P-TEST-001"
    },
    "responses": []
  }'
```

A file should appear in:

```text
results/
```

## Frontend configuration

In the survey frontend, set:

```js
submitEndpoint: "/survey/api/submit"
```

if using an Nginx reverse proxy under `/survey/`.

For direct local testing, use:

```js
submitEndpoint: "http://127.0.0.1:8000/api/submit"
```

## Environment variables

### `RESULTS_DIR`

Where result JSON files are saved.

```bash
RESULTS_DIR=/opt/kansei-survey-backend/results
```

Default:

```text
./results
```

### `OVERWRITE_EXISTING`

If set to `true`, the server writes:

```text
<participant_id>.json
```

and may overwrite an existing file.

Default is `false`, which writes:

```text
<participant_id>_<server_timestamp>.json
```

Recommended for experiments:

```bash
OVERWRITE_EXISTING=false
```

### `ALLOWED_ORIGINS`

Comma-separated list of allowed frontend origins for CORS.

Example:

```bash
ALLOWED_ORIGINS=http://localhost:8000,http://your-university-server
```

If frontend and API are served from the same origin through Nginx, you may not need this.

## Example systemd service

Create:

```bash
sudo nano /etc/systemd/system/kansei-survey-api.service
```

Example content:

```ini
[Unit]
Description=Kansei Video Survey API
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/kansei-survey-backend
Environment="RESULTS_DIR=/opt/kansei-survey-backend/results"
Environment="OVERWRITE_EXISTING=false"
ExecStart=/opt/kansei-survey-backend/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable kansei-survey-api
sudo systemctl start kansei-survey-api
sudo systemctl status kansei-survey-api
```

## Example Nginx reverse proxy

If your frontend is served at `/survey/`, proxy `/survey/api/` to FastAPI:

```nginx
location /survey/api/ {
    proxy_pass http://127.0.0.1:8000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Then configure the frontend:

```js
submitEndpoint: "/survey/api/submit"
```

## Security notes

- Keep `results/` outside the public web directory.
- Do not commit result files to GitHub.
- Back up `results/` regularly.
- Restrict file permissions so only the backend user and researchers can read the results.
- The backend sanitizes participant IDs, but do not expose the results folder publicly.
