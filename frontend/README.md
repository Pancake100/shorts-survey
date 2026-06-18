# Kansei Short-Form Video Survey App v8

This is a static, frontend-only prototype for a short-form video Kansei evaluation experiment.

## Main changes in v8

- Reorganized the per-video survey into **one evaluation form** instead of separate Kansei and Questions forms.
- The video screen now has one heart button:
  - `♡` = evaluation incomplete
  - green `♥` = evaluation complete
- The evaluation form contains five parts:
  - Part A: Visual Impression
  - Part B: Content Impression
  - Part C: Audio Impression
  - Part D: Voice / Narrator Impression
  - Part E: Overall Evaluation
- Parts A-D use 7-position Kansei adjective-pair scales with no visible numbers.
- Part E includes overall survey questions.
- CSV export is not included.
- Primary completion method is **Submit**, which posts JSON to a configurable API endpoint.
- **Export JSON** remains as a backup.

## Files

```text
kansei_video_survey_v8/
  index.html
  style.css
  config.js
  app.js
  README.md
  videos/
    group-a/
    group-b/
    group-c/
```

## Running locally

Unzip the folder and run a local web server from inside the app folder:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Using a local server is more reliable for local video playback than opening `index.html` directly.

## Adding videos

Place MP4 files in the relevant group folder:

```text
videos/group-a/a01.mp4
videos/group-a/a02.mp4
...
```

Then update `config.js`:

```js
{ id: "A01", title: "Video A01", src: "videos/group-a/a01.mp4" }
```

The title is kept internally and exported, but the participant video screen only shows progress such as `Video 1/10`.

## Configuring the submit endpoint

In `config.js`, set:

```js
submitEndpoint: "https://example.com/api/survey-submit"
```

When the participant presses **Submit**, the app sends the complete JSON payload with:

```http
POST
Content-Type: application/json
```

The API can use `participant.participant_id` to name the stored result file.

## Evaluation form structure

The form is configured in `CONFIG.evaluationSections`.

Kansei sections use this structure:

```js
{
  id: "visual_impression",
  title: "Part A: Visual Impression",
  type: "kansei_pairs",
  pairs: [
    { id: "attractive_unattractive", left: "Attractive", right: "Unattractive" }
  ]
}
```

Participants see:

```text
← Attractive                         Unattractive →
○   ○   ○   ○   ○   ○   ○
```

Internally, values are stored as:

```text
-3 -2 -1 0 +1 +2 +3
```

This means:

```text
-3 = strongly toward the left adjective
 0 = neutral / balanced
+3 = strongly toward the right adjective
```

Part E uses ordinary questions, such as single-choice and 1–5 rating items.

## JSON output structure

The exported/submitted JSON includes:

```json
{
  "participant": {
    "participant_id": "P001",
    "group": "A",
    "email": "optional@example.com"
  },
  "session": {
    "session_id": "P001_2026-...",
    "started_at": "...",
    "completed_at": "...",
    "video_order": ["A03", "A01", "A08"],
    "video_count": 10
  },
  "evaluation_sections": [...],
  "responses": [
    {
      "video_id": "A03",
      "video_title": "Video A03",
      "video_src": "videos/group-a/a03.mp4",
      "video_order_index": 1,
      "evaluation_completed": true,
      "evaluation": {
        "visual_impression": {
          "attractive_unattractive": -2,
          "clear_confusing": 1
        },
        "overall_evaluation": {
          "stopping_or_skipping": "slightly",
          "first_bored_or_skip_point": "early_middle",
          "overall_rating": 4
        }
      }
    }
  ]
}
```

## Notes

- The app uses local browser storage to preserve progress during a session.
- The participant can go back to previous videos and edit answers.
- Moving forward is blocked until the current video evaluation form is complete.
- The app does not include videos. Add your own MP4 files.
- Copyright and permission for video use should be handled by the research team.
