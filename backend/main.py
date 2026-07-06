from __future__ import annotations

import json
import os
import random
import re
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Literal

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

VALID_GROUPS: list[str] = ["A", "B"]

DATA_DIR = Path(os.getenv("DATA_DIR", "data")).resolve()
ASSIGNMENTS_DIR = DATA_DIR / "assignments"
RESULTS_DIR = DATA_DIR / "results"
UNKNOWN_DIR = DATA_DIR / "unknown"

ACTIVE_ASSIGNMENT_WEIGHT = float(os.getenv("ACTIVE_ASSIGNMENT_WEIGHT", "0.5"))
ASSIGNMENT_EXPIRATION_HOURS = float(os.getenv("ASSIGNMENT_EXPIRATION_HOURS", "24"))

allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]

app = FastAPI(
    title="Kansei Video Survey API",
    version="2.0.0",
    description="Generates participant IDs, assigns balanced groups, and saves survey submissions.",
)

if ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=False,
        allow_methods=["POST", "GET", "OPTIONS"],
        allow_headers=["Content-Type"],
    )

class GroupStats(BaseModel):
    completed: int
    active_incomplete: int
    expired_incomplete: int
    assigned_total: int
    score: float

class StartSessionResponse(BaseModel):
    ok: bool = True
    participant_id: str
    group: str
    group_label: str
    assignment_method: Literal["least_weighted_count", "url_override"]
    assigned_at: str
    assignment_expires_at: str
    stats: dict[str, GroupStats]

class SubmitResponse(BaseModel):
    ok: bool = True
    participant_id: str
    group: str
    filename: str
    saved_at: str
    size_bytes: int
    warning: str | None = None

SAFE_FILENAME_RE = re.compile(r"[^A-Za-z0-9_-]+")

def setup_directories() -> None:
    for folder in [DATA_DIR, ASSIGNMENTS_DIR, RESULTS_DIR, UNKNOWN_DIR]:
        folder.mkdir(parents=True, exist_ok=True)
    for group in VALID_GROUPS:
        (ASSIGNMENTS_DIR / group_to_folder(group)).mkdir(parents=True, exist_ok=True)
        (RESULTS_DIR / group_to_folder(group)).mkdir(parents=True, exist_ok=True)

@app.on_event("startup")
def on_startup() -> None:
    setup_directories()

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def now_utc_iso() -> str:
    return now_utc().replace(microsecond=0).isoformat()

def timestamp_for_filename() -> str:
    return now_utc().strftime("%Y%m%dT%H%M%SZ")

def group_to_folder(group: str) -> str:
    return f"group-{group.lower()}"

def group_label(group: str) -> str:
    return f"Group {group}"

def validate_group(group: str | None) -> str:
    if not group:
        raise HTTPException(status_code=400, detail="Missing group.")
    normalized = group.strip().upper()
    if normalized not in VALID_GROUPS:
        raise HTTPException(status_code=400, detail=f"Invalid group '{group}'. Valid groups are: {', '.join(VALID_GROUPS)}.")
    return normalized

def sanitize_filename_part(value: str) -> str:
    value = SAFE_FILENAME_RE.sub("_", value.strip()).strip("_-")
    if not value:
        raise HTTPException(status_code=400, detail="Invalid participant_id.")
    return value[:120]

def generate_participant_id() -> str:
    return f"P-{timestamp_for_filename()}-{secrets.token_hex(3).upper()}"

def parse_iso_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None

def is_assignment_completed(record: dict[str, Any]) -> bool:
    return record.get("status") == "completed"

def is_assignment_expired(record: dict[str, Any]) -> bool:
    if is_assignment_completed(record):
        return False
    assigned_at = parse_iso_datetime(record.get("assigned_at"))
    if assigned_at is None:
        return True
    return now_utc() - assigned_at > timedelta(hours=ASSIGNMENT_EXPIRATION_HOURS)

def atomic_write_json(path: Path, data: dict[str, Any]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    tmp_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp_path.replace(path)
    return path.stat().st_size

def read_json_file(path: Path) -> dict[str, Any] | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else None
    except Exception:
        return None

def assignment_file_for(group: str, participant_id: str) -> Path:
    return ASSIGNMENTS_DIR / group_to_folder(group) / f"{sanitize_filename_part(participant_id)}.json"

def result_file_for(group: str, participant_id: str) -> Path:
    return RESULTS_DIR / group_to_folder(group) / f"{sanitize_filename_part(participant_id)}_{timestamp_for_filename()}.json"

def unknown_file_for(payload: dict[str, Any] | None = None) -> Path:
    participant_id = None
    if isinstance(payload, dict):
        participant = payload.get("participant")
        if isinstance(participant, dict):
            raw_pid = participant.get("participant_id")
            if isinstance(raw_pid, str) and raw_pid.strip():
                participant_id = SAFE_FILENAME_RE.sub("_", raw_pid.strip())[:100].strip("_-")
    random_part = secrets.token_hex(3)
    if participant_id:
        filename = f"{participant_id}_{timestamp_for_filename()}_unknown_{random_part}.json"
    else:
        filename = f"unknown_{timestamp_for_filename()}_{random_part}.json"
    return UNKNOWN_DIR / filename

def list_assignment_records(group: str) -> list[dict[str, Any]]:
    folder = ASSIGNMENTS_DIR / group_to_folder(group)
    records = []
    for path in folder.glob("*.json"):
        data = read_json_file(path)
        if data is not None:
            records.append(data)
    return records

def count_result_files(group: str) -> int:
    return len(list((RESULTS_DIR / group_to_folder(group)).glob("*.json")))

def compute_group_stats() -> dict[str, GroupStats]:
    stats: dict[str, GroupStats] = {}
    for group in VALID_GROUPS:
        records = list_assignment_records(group)
        completed_from_assignments = 0
        active_incomplete = 0
        expired_incomplete = 0
        for record in records:
            if is_assignment_completed(record):
                completed_from_assignments += 1
            elif is_assignment_expired(record):
                expired_incomplete += 1
            else:
                active_incomplete += 1
        completed_results = count_result_files(group)
        completed = max(completed_from_assignments, completed_results)
        score = completed + ACTIVE_ASSIGNMENT_WEIGHT * active_incomplete
        stats[group] = GroupStats(
            completed=completed,
            active_incomplete=active_incomplete,
            expired_incomplete=expired_incomplete,
            assigned_total=len(records),
            score=score,
        )
    return stats

def choose_group_by_weighted_score(stats: dict[str, GroupStats]) -> str:
    min_score = min(stats[group].score for group in VALID_GROUPS)
    candidates = [group for group in VALID_GROUPS if stats[group].score == min_score]
    return random.choice(candidates)

def create_assignment_record(participant_id: str, group: str, method: Literal["least_weighted_count", "url_override"]) -> dict[str, Any]:
    assigned_at_dt = now_utc()
    expires_at_dt = assigned_at_dt + timedelta(hours=ASSIGNMENT_EXPIRATION_HOURS)
    record = {
        "participant_id": participant_id,
        "group": group,
        "group_label": group_label(group),
        "assigned_at": assigned_at_dt.replace(microsecond=0).isoformat(),
        "assignment_expires_at": expires_at_dt.replace(microsecond=0).isoformat(),
        "assignment_method": method,
        "status": "assigned",
        "completed_at": None,
        "submitted_filename": None,
    }
    atomic_write_json(assignment_file_for(group, participant_id), record)
    return record

def extract_participant(payload: dict[str, Any]) -> tuple[str, str]:
    participant = payload.get("participant")
    if not isinstance(participant, dict):
        raise ValueError("Missing participant object.")
    participant_id = participant.get("participant_id")
    group = participant.get("group")
    if not isinstance(participant_id, str) or not participant_id.strip():
        raise ValueError("Missing participant.participant_id.")
    if not isinstance(group, str) or not group.strip():
        raise ValueError("Missing participant.group.")
    return sanitize_filename_part(participant_id), validate_group(group)

async def parse_request_json(request: Request) -> dict[str, Any]:
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Request body must be valid JSON.")
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Submitted JSON must be an object.")
    return payload

def save_unknown_and_raise(payload: dict[str, Any], detail: str) -> None:
    saved_at = now_utc_iso()
    path = unknown_file_for(payload)
    atomic_write_json(path, {"server_received_at": saved_at, "reason": detail, "payload": payload})
    raise HTTPException(status_code=400, detail=f"{detail} Submission was saved under unknown for researcher inspection.")

@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "time": now_utc_iso()}

@app.get("/api/group-stats")
def group_stats() -> dict[str, Any]:
    setup_directories()
    stats = compute_group_stats()
    return {
        "ok": True,
        "valid_groups": VALID_GROUPS,
        "active_assignment_weight": ACTIVE_ASSIGNMENT_WEIGHT,
        "assignment_expiration_hours": ASSIGNMENT_EXPIRATION_HOURS,
        "groups": {group: stats[group].model_dump() for group in VALID_GROUPS},
    }

@app.post("/api/start-session", response_model=StartSessionResponse)
def start_session(group: str | None = Query(default=None, description="Optional group override, e.g. A or B.")) -> StartSessionResponse:
    setup_directories()
    stats = compute_group_stats()
    if group is not None and group.strip():
        selected_group = validate_group(group)
        method: Literal["least_weighted_count", "url_override"] = "url_override"
    else:
        selected_group = choose_group_by_weighted_score(stats)
        method = "least_weighted_count"
    participant_id = generate_participant_id()
    while assignment_file_for(selected_group, participant_id).exists():
        participant_id = generate_participant_id()
    record = create_assignment_record(participant_id, selected_group, method)
    updated_stats = compute_group_stats()
    return StartSessionResponse(
        participant_id=participant_id,
        group=selected_group,
        group_label=group_label(selected_group),
        assignment_method=method,
        assigned_at=record["assigned_at"],
        assignment_expires_at=record["assignment_expires_at"],
        stats=updated_stats,
    )

@app.post("/api/submit", response_model=SubmitResponse)
async def submit_survey(request: Request) -> SubmitResponse:
    setup_directories()
    payload = await parse_request_json(request)
    try:
        participant_id, group = extract_participant(payload)
    except (ValueError, HTTPException) as exc:
        detail = exc.detail if isinstance(exc, HTTPException) else str(exc)
        save_unknown_and_raise(payload, str(detail))
    saved_at = now_utc_iso()
    output_path = result_file_for(group, participant_id)
    warning: str | None = None
    assignment_path = assignment_file_for(group, participant_id)
    assignment_record = read_json_file(assignment_path)
    if assignment_record is None:
        warning = "No matching assignment file was found. The result was saved because the submitted group is valid."
        assignment_record = {
            "participant_id": participant_id,
            "group": group,
            "group_label": group_label(group),
            "assigned_at": None,
            "assignment_expires_at": None,
            "assignment_method": "unknown_or_legacy",
            "status": "completed",
            "completed_at": saved_at,
            "submitted_filename": output_path.name,
            "warning": warning,
        }
    else:
        assignment_record["status"] = "completed"
        assignment_record["completed_at"] = saved_at
        assignment_record["submitted_filename"] = output_path.name
    saved_document = {
        "server_received_at": saved_at,
        "client_ip": request.client.host if request.client else None,
        "participant_id": participant_id,
        "group": group,
        "payload": payload,
    }
    size_bytes = atomic_write_json(output_path, saved_document)
    atomic_write_json(assignment_path, assignment_record)
    return SubmitResponse(
        participant_id=participant_id,
        group=group,
        filename=str(output_path.relative_to(DATA_DIR)),
        saved_at=saved_at,
        size_bytes=size_bytes,
        warning=warning,
    )
