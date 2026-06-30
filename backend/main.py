from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ---------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------
# Optional environment variables:
#
# RESULTS_DIR=./results
# ALLOWED_ORIGINS=http://localhost:8000,http://your-server.example.com
# OVERWRITE_EXISTING=false
#
# For university local deployment behind Nginx on the same host,
# CORS is often not needed if the frontend and API share the same origin.
# ---------------------------------------------------------------------

RESULTS_DIR = Path(os.getenv("RESULTS_DIR", "results")).resolve()
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

OVERWRITE_EXISTING = os.getenv("OVERWRITE_EXISTING", "false").lower() == "true"

allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://127.0.0.1:3000")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in allowed_origins_raw.split(",")
    if origin.strip()
]

app = FastAPI(
    title="Kansei Video Survey API",
    version="1.0.0",
    description="Receives survey JSON submissions and saves them as files.",
)

if ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=False,
        allow_methods=["POST", "GET", "OPTIONS"],
        allow_headers=["Content-Type"],
    )


class SubmitResponse(BaseModel):
    ok: bool = True
    participant_id: str
    filename: str
    saved_at: str
    size_bytes: int


SAFE_FILENAME_RE = re.compile(r"[^A-Za-z0-9_-]+")


def now_utc_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def timestamp_for_filename() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def sanitize_filename_part(value: str) -> str:
    """
    Keep only safe filename characters.

    This prevents malicious or accidental filenames such as:
      ../../secret
      participant/name
      participant id with spaces

    Allowed output characters:
      A-Z a-z 0-9 _ -
    """
    value = value.strip()
    value = SAFE_FILENAME_RE.sub("_", value)
    value = value.strip("_-")

    if not value:
        raise HTTPException(status_code=400, detail="Invalid participant_id.")

    return value[:100]


def extract_participant_id(payload: dict[str, Any]) -> str:
    try:
        participant = payload["participant"]
        participant_id = participant["participant_id"]
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail="Missing participant.participant_id in submitted JSON.",
        )

    if not isinstance(participant_id, str):
        raise HTTPException(
            status_code=400,
            detail="participant.participant_id must be a string.",
        )

    return sanitize_filename_part(participant_id)


def build_filename(participant_id: str) -> str:
    """
    Build a JSON filename.

    By default, the timestamp is included to avoid overwriting if the same
    participant submits twice.

    If OVERWRITE_EXISTING=true, the filename is simply:
      <participant_id>.json
    """
    if OVERWRITE_EXISTING:
        return f"{participant_id}.json"

    return f"{participant_id}_{timestamp_for_filename()}.json"


def atomic_write_json(path: Path, data: dict[str, Any]) -> int:
    """
    Write JSON safely using a temporary file and atomic rename.
    """
    tmp_path = path.with_suffix(path.suffix + ".tmp")

    encoded = json.dumps(data, ensure_ascii=False, indent=2)
    tmp_path.write_text(encoded, encoding="utf-8")
    tmp_path.replace(path)

    return path.stat().st_size


@app.get("/api/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "time": now_utc_iso(),
    }


@app.post("/api/submit", response_model=SubmitResponse)
async def submit_survey(request: Request) -> SubmitResponse:
    """
    Receive survey JSON and save it to the results directory.

    Expected submitted JSON includes:
      {
        "participant": {
          "participant_id": "P-YYYYMMDDHHMMSS-XXXX"
        },
        ...
      }

    The saved file contains:
      {
        "server_received_at": "...",
        "client_ip": "...",
        "payload": { original submitted JSON }
      }
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Request body must be valid JSON.")

    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Submitted JSON must be an object.")

    participant_id = extract_participant_id(payload)
    filename = build_filename(participant_id)
    output_path = RESULTS_DIR / filename

    if output_path.exists() and not OVERWRITE_EXISTING:
        filename = f"{participant_id}_{timestamp_for_filename()}_{os.urandom(3).hex()}.json"
        output_path = RESULTS_DIR / filename

    saved_at = now_utc_iso()

    saved_document = {
        "server_received_at": saved_at,
        "client_ip": request.client.host if request.client else None,
        "payload": payload,
    }

    size_bytes = atomic_write_json(output_path, saved_document)

    return SubmitResponse(
        participant_id=participant_id,
        filename=filename,
        saved_at=saved_at,
        size_bytes=size_bytes,
    )
