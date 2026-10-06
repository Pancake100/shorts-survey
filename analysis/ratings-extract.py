from pathlib import Path
import json
import pandas as pd


def parse_datetime(value):
    """
    Convert ISO datetime string to pandas Timestamp.
    Handles both 'Z' and '+00:00' formats.
    """
    if not value:
        return pd.NaT
    return pd.to_datetime(value, utc=True, errors="coerce")


def compute_duration_seconds(first_seen_at, last_seen_at):
    """
    Compute duration in seconds between first_seen_at and last_seen_at.
    Returns None if either timestamp is missing or invalid.
    """
    start = parse_datetime(first_seen_at)
    end = parse_datetime(last_seen_at)
    if pd.isna(start) or pd.isna(end):
        return None
    duration = (end - start).total_seconds()
    # Optional safety check: avoid negative durations caused by corrupted timestamps
    if duration < 0:
        return None
    return duration


def flatten_one_result_file(json_path):
    """
    Parse one saved survey JSON file and return a list of rows.
    Each row corresponds to one video evaluation by one participant.
    """
    json_path = Path(json_path)
    with json_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    payload = data.get("payload", {})
    participant = payload.get("participant", {})
    participant_id = (
        participant.get("participant_id")
        or data.get("participant_id")
        or payload.get("participant_id")
    )
    group = participant.get("group") or data.get("group")
    responses = payload.get("responses", [])
    rows = []
    for response in responses:
        row = {
            "participant_id": participant_id,
            "group": group,
            "source_file": json_path.name,

            "video_id": response.get("video_id"),
            "video_title": response.get("video_title"),
            "video_topic": response.get("video_topic"),
            "video_order_index": response.get("video_order_index"),
        }
        evaluation = response.get("evaluation", {})

        # Flatten all Kansei sections without section prefixes.
        # Example:
        # evaluation["visual_impression"]["attractive_plain"] -> row["attractive_plain"]
        for section_name, section_values in evaluation.items():
            if not isinstance(section_values, dict):
                continue

            for key, value in section_values.items():
                # Overall questions are handled below, but this keeps extra fields if desired.
                if section_name != "overall_evaluation":
                    if key in row:
                        raise ValueError(
                            f"Column name collision for '{key}' in {json_path}. "
                            "Consider prefixing section names."
                        )
                    row[key] = value

        overall = evaluation.get("overall_evaluation", {})
        row["stopping_or_skipping"] = overall.get("stopping_or_skipping")
        row["first_bored_or_skip_point"] = overall.get("first_bored_or_skip_point")
        row["overall_rating"] = overall.get("overall_rating")

        interaction = response.get("interaction", {})
        first_seen_at = interaction.get("first_seen_at")
        last_seen_at = interaction.get("last_seen_at")

        row["first_seen_at"] = first_seen_at
        row["last_seen_at"] = last_seen_at
        row["rating_duration_seconds"] = compute_duration_seconds(
            first_seen_at,
            last_seen_at,
        )

        rows.append(row)

    return rows


def build_ratings_dataframe(results_root):
    """
    Process all JSON files from:

        results_root/group-a/*.json
        results_root/group-b/*.json

    Example:
        df = build_ratings_dataframe("data/results")
    """
    results_root = Path(results_root)

    json_files = []

    for group_dir in ["group-a", "group-b"]:
        folder = results_root / group_dir
        if folder.exists():
            json_files.extend(sorted(folder.glob("*.json")))

    all_rows = []

    for json_path in json_files:
        try:
            rows = flatten_one_result_file(json_path)
            all_rows.extend(rows)
        except Exception as e:
            print(f"Warning: could not process {json_path}: {e}")

    df = pd.DataFrame(all_rows)

    if df.empty:
        return df

    preferred_columns = [
        "participant_id",
        "group",
        "source_file",

        "video_id",
        "video_title",
        "video_topic",
        "video_order_index",

        # Visual impression
        "attractive_plain",
        "clear_confusing",
        "organized_disorganized",
        "comfortable_uncomfortable",
        "coherent_scattered",

        # Content impression
        "professional_amateur",
        "understandable_confusing",
        "interesting_boring",
        "factual_misleading",
        "convincing_doubtful",

        # Audio / narrator impression
        "pleasant_unpleasant",
        "clear_unclear",
        "smooth_abrupt",
        "friendly_unfriendly",
        "motivating_demotivating",

        # Overall evaluation
        "stopping_or_skipping",
        "first_bored_or_skip_point",
        "overall_rating",

        # Timing
        "rating_duration_seconds",
        "first_seen_at",
        "last_seen_at",
    ]

    # Keep preferred columns first, then append any unexpected/new columns.
    existing_preferred = [col for col in preferred_columns if col in df.columns]
    remaining_columns = [col for col in df.columns if col not in existing_preferred]

    df = df[existing_preferred + remaining_columns]

    # Useful numeric conversions
    numeric_columns = [
        "video_order_index",
        "overall_rating",
        "rating_duration_seconds",
        "attractive_plain",
        "clear_confusing",
        "organized_disorganized",
        "comfortable_uncomfortable",
        "coherent_scattered",
        "professional_amateur",
        "understandable_confusing",
        "interesting_boring",
        "factual_misleading",
        "convincing_doubtful",
        "pleasant_unpleasant",
        "clear_unclear",
        "smooth_abrupt",
        "friendly_unfriendly",
        "motivating_demotivating",
    ]

    for col in numeric_columns:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    return df


if __name__ == "__main__":
    # This should be the folder that contains group-a/ and group-b/.
    results_root = "./results"

    df = build_ratings_dataframe(results_root)

    print(df.head())
    print()
    print(f"Rows: {len(df)}")
    print(f"Participants: {df['participant_id'].nunique() if not df.empty else 0}")
    print(f"Videos: {df['video_id'].nunique() if not df.empty else 0}")

    output_csv = "participant_video_ratings.csv"
    output_excel = "participant_video_ratings.xlsx"

    df.to_csv(output_csv, index=False, encoding="utf-8-sig")
    df.to_excel(output_excel, index=False)

    print()
    print(f"Saved: {output_csv}")
    print(f"Saved: {output_excel}")