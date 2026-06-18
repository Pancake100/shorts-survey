# Kansei Short-Form Video Survey App v7

This is a frontend-only prototype for a mobile-first Kansei evaluation experiment using local short-form videos.

## Main changes in v7

- The survey screen now follows a single mobile video-screen design.
- The video occupies the main screen area.
- The progress indicator appears at the top-left as `Video 1/10`.
- Video titles are not displayed to participants to avoid bias.
- The right-side vertical overlay menu now uses icon-only controls:
  - `♡` for incomplete Kansei rating
  - green `♥` for completed Kansei rating
  - `?` for incomplete additional questions
  - green bold `?` for completed additional questions
  - `↑` for previous video
  - `↓` for next video
  - `⚙` for settings
- The icon guide appears on the participant setup screen, not on the video screen.
- The settings modal contains:
  - Participant ID
  - Group
  - Optional email
  - Progress
  - Finish/submit button
  - Restart button
  - Back-to-setup button

## Features

- Participant setup screen
- Participant ID, group selection, optional email
- Kansei adjective explanation before the experiment starts
- Three configurable groups: A, B, C
- Randomized video order within the selected group
- Local MP4 video playback
- 7-point bipolar Kansei scale stored as `-3` to `+3`
- Additional post-video questions
- Required completion check before moving forward
- Back navigation to previous videos
- Review page
- Submit final JSON to a configurable API endpoint
- JSON export as backup
- Auto-save with `localStorage`

## File structure

```text
kansei_video_survey_v7/
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


## Video screen icon behavior

The main video screen intentionally hides button text to provide a more mobile short-form video experience. The visible icons are:

```text
♡ / ♥  Kansei rating: white outline before completion, green filled heart after completion
?      Additional questions: white before completion, green and bold after completion
↑      Previous video
↓      Next video / review when the current video is complete
⚙      Settings, finish/submit, or restart
```

The buttons still include accessible labels in the HTML through `aria-label` attributes.

## How to add videos

Put your MP4 files in the relevant group folder.

Example:

```text
videos/group-a/a01.mp4
videos/group-a/a02.mp4
...
videos/group-a/a10.mp4
```

Then edit `config.js`:

```js
A: [
  { id: "A01", title: "Video A01", src: "videos/group-a/a01.mp4" },
  { id: "A02", title: "Video A02", src: "videos/group-a/a02.mp4" }
]
```

The `title` field is kept internally for data management and review/submit, but it is not shown on the main participant video screen.

## How to edit Kansei adjective pairs

Edit the `kanseiPairs` list in `config.js`.

Example:

```js
{
  id: "boring_interesting",
  negative: "Boring",
  positive: "Interesting",
  definition: "How boring or interesting the video felt."
}
```

The app stores each answer as an integer:

```text
-3 -2 -1 0 +1 +2 +3
```

## How to edit additional questions

Edit the `postVideoQuestions` list in `config.js`.

Supported types in this prototype:

```text
yes_no
likert_7
text
```

Example:

```js
{
  id: "wanted_to_skip",
  label: "Did you want to skip the video at some point?",
  type: "yes_no",
  required: true
}
```

## How to configure submission

Edit `config.js` and set `submitEndpoint`:

```js
submitEndpoint: "https://example.com/api/survey-submit"
```

When the participant taps **Submit**, the app sends the same JSON payload used by **Export JSON** with:

```http
POST /your-endpoint
Content-Type: application/json
```

If `submitEndpoint` is empty, the app shows an error message and the participant can still use **Export JSON** as a backup.

The API can store the submitted file using the participant ID from:

```text
participant.participant_id
```

## How to run

For the simplest test, open `index.html` in a browser.

For more reliable local video playback, run a local server from the app folder:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Submitted / exported JSON

The submitted JSON and backup exported JSON contain:

- experiment metadata
- participant information
- session ID
- randomized video order
- Kansei adjective definitions
- post-video question definitions
- per-video responses
- completion status
- light interaction timestamps

## Copyright / ethics note

The app supports local videos for reliability, but this does not automatically solve copyright or platform-terms issues. For a controlled experiment, prefer videos that are created by the lab/student, licensed for reuse, used with permission, or otherwise cleared by the institution's research/ethics process.
