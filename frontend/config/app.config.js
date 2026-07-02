/* General app and API settings. */
const APP_CONFIG = {
  experimentTitle: "Short-Form Educational Video Evaluation",
  experimentVersion: "4.0-preliminary-questionnaire",

  // API endpoint used by the Submit button.
  // The app will POST the final JSON payload to this URL.
  // Example: "https://example.com/api/survey-submit"
  submitEndpoint: "",

  participantIdPrefix: "P",
  sessionIdPrefix: "S",

  instructions: `
    You will watch a set of short-form educational videos and evaluate your impression of each video.
    For each video, tap the heart button to open one evaluation form.
    You may go back to previous videos and change your answers before submitting your result.
  `,

  kanseiExplanation: `
    Kansei adjectives are pairs of contrasting words used to describe your emotional or subjective impression.
    For each pair, choose the point that best represents how the video felt to you.
    The center point means neutral or balanced between the two adjectives.
    The numbers are not shown during the survey, but responses are stored as positions for analysis.
  `,

  videoButtonGuide: `
    During the video survey, tap ♡ to open the evaluation form. The heart becomes green after the form is completed.
    Use ↑ to go to the previous video, ↓ to go to the next video, and ⚙ for settings, finish, or restart.
  `
};
