/*
  Kansei Short-Form Video Survey Configuration
  --------------------------------------------------
  Edit this file to change videos, evaluation sections, and the API endpoint.

  Video notes:
  - Put local MP4 files in videos/group-a, videos/group-b, videos/group-c.
  - Replace the placeholder file names below with your actual files.
  - Example: videos/group-a/a01.mp4
*/

const CONFIG = {
  experimentTitle: "Short-Form Video Kansei Survey",
  experimentVersion: "3.0-prototype",

  // API endpoint used by the Submit button.
  // The app will POST the final JSON payload to this URL.
  // Example: "https://example.com/api/survey-submit"
  submitEndpoint: "",

  instructions: `
    You will watch a set of short-form videos and evaluate your impression of each video.
    For each video, tap the heart button to open one evaluation form. The form contains several parts about visual impression, content, audio, voice/narrator, and overall evaluation.
    You may go back to previous videos and change your answers before submitting your result.
  `,

  kanseiExplanation: `
    Kansei adjectives are pairs of contrasting words used to describe your emotional or subjective impression.
    For each pair, choose the point that best represents how the video felt to you.
    The center point means neutral or balanced between the two adjectives.
    The numbers are not shown during the survey, but responses are stored as positions for analysis.
  `,

  groups: {
    A: [
      { id: "A01", title: "Video A01", src: "videos/group-a/a01.mp4" },
      { id: "A02", title: "Video A02", src: "videos/group-a/a02.mp4" },
      { id: "A03", title: "Video A03", src: "videos/group-a/a03.mp4" },
      { id: "A04", title: "Video A04", src: "videos/group-a/a04.mp4" },
      { id: "A05", title: "Video A05", src: "videos/group-a/a05.mp4" },
      { id: "A06", title: "Video A06", src: "videos/group-a/a06.mp4" },
      { id: "A07", title: "Video A07", src: "videos/group-a/a07.mp4" },
      { id: "A08", title: "Video A08", src: "videos/group-a/a08.mp4" },
      { id: "A09", title: "Video A09", src: "videos/group-a/a09.mp4" },
      { id: "A10", title: "Video A10", src: "videos/group-a/a10.mp4" }
    ],
    B: [
      { id: "B01", title: "Video B01", src: "videos/group-b/b01.mp4" },
      { id: "B02", title: "Video B02", src: "videos/group-b/b02.mp4" },
      { id: "B03", title: "Video B03", src: "videos/group-b/b03.mp4" },
      { id: "B04", title: "Video B04", src: "videos/group-b/b04.mp4" },
      { id: "B05", title: "Video B05", src: "videos/group-b/b05.mp4" },
      { id: "B06", title: "Video B06", src: "videos/group-b/b06.mp4" },
      { id: "B07", title: "Video B07", src: "videos/group-b/b07.mp4" },
      { id: "B08", title: "Video B08", src: "videos/group-b/b08.mp4" },
      { id: "B09", title: "Video B09", src: "videos/group-b/b09.mp4" },
      { id: "B10", title: "Video B10", src: "videos/group-b/b10.mp4" }
    ],
    C: [
      { id: "C01", title: "Video C01", src: "videos/group-c/c01.mp4" },
      { id: "C02", title: "Video C02", src: "videos/group-c/c02.mp4" },
      { id: "C03", title: "Video C03", src: "videos/group-c/c03.mp4" },
      { id: "C04", title: "Video C04", src: "videos/group-c/c04.mp4" },
      { id: "C05", title: "Video C05", src: "videos/group-c/c05.mp4" },
      { id: "C06", title: "Video C06", src: "videos/group-c/c06.mp4" },
      { id: "C07", title: "Video C07", src: "videos/group-c/c07.mp4" },
      { id: "C08", title: "Video C08", src: "videos/group-c/c08.mp4" },
      { id: "C09", title: "Video C09", src: "videos/group-c/c09.mp4" },
      { id: "C10", title: "Video C10", src: "videos/group-c/c10.mp4" }
    ]
  },

  evaluationSections: [
    {
      id: "visual_impression",
      title: "Part A: Visual Impression",
      description: "This section asks about your impressions of the video's visual presentation, including the layout, graphics, colors, subtitles, animations, and overall appearance. Please evaluate how the video looks based on your personal feelings.",
      type: "kansei_pairs",
      pairs: [
        { id: "attractive_unattractive", left: "Attractive", right: "Unattractive" },
        { id: "clear_confusing", left: "Clear", right: "Confusing" },
        { id: "organized_disorganized", left: "Organized", right: "Disorganized" },
        { id: "comfortable_uncomfortable", left: "Comfortable", right: "Uncomfortable" },
        { id: "eye_catching_plain", left: "Eye-catching", right: "Plain" }
      ]
    },
    {
      id: "content_impression",
      title: "Part B: Content Impression",
      description: "This section asks about your impressions of the information and educational value presented in the video. Please evaluate the content based on your feelings.",
      type: "kansei_pairs",
      pairs: [
        { id: "professional_amateur", left: "Professional", right: "Amateur" },
        { id: "easy_to_understand_difficult_to_understand", left: "Easy to understand", right: "Difficult to understand" },
        { id: "interesting_boring", left: "Interesting", right: "Boring" },
        { id: "useful_useless", left: "Useful", right: "Useless" },
        { id: "memorable_forgettable", left: "Memorable", right: "Forgettable" }
      ]
    },
    {
      id: "audio_impression",
      title: "Part C: Audio Impression",
      description: "This section asks about your impressions of the audio elements in the video, including background music, sound effects, volume balance, and overall listening experience.",
      type: "kansei_pairs",
      pairs: [
        { id: "pleasant_unpleasant", left: "Pleasant", right: "Unpleasant" },
        { id: "clear_unclear", left: "Clear", right: "Unclear" },
        { id: "smooth_abrupt", left: "Smooth", right: "Abrupt" },
        { id: "immersive_distracting", left: "Immersive", right: "Distracting" },
        { id: "motivating_demotivating", left: "Motivating", right: "Demotivating" }
      ]
    },
    {
      id: "voice_narrator_impression",
      title: "Part D: Voice / Narrator Impression",
      description: "This section asks about your impressions of the narrator's voice, including speaking style, pronunciation, confidence, friendliness, and clarity.",
      type: "kansei_pairs",
      pairs: [
        { id: "friendly_unfriendly", left: "Friendly", right: "Unfriendly" },
        { id: "natural_artificial", left: "Natural", right: "Artificial" },
        { id: "clear_unclear", left: "Clear", right: "Unclear" },
        { id: "confident_hesitant", left: "Confident", right: "Hesitant" },
        { id: "pleasant_unpleasant", left: "Pleasant", right: "Unpleasant" }
      ]
    },
    {
      id: "overall_evaluation",
      title: "Part E: Overall Evaluation",
      description: "This section asks about your overall experience with the video, including your willingness to continue watching, the likelihood of remembering the information, and your general evaluation of the video.",
      type: "questions",
      questions: [
        {
          id: "stopping_or_skipping",
          label: "Did you ever feel like stopping or skipping this video while watching?",
          type: "single_choice",
          required: true,
          options: [
            { value: "not_at_all", label: "Not at all" },
            { value: "slightly", label: "Slightly" },
            { value: "moderately", label: "Moderately" },
            { value: "quite_a_lot", label: "Quite a lot" },
            { value: "very_much", label: "Very much" }
          ]
        },
        {
          id: "first_bored_or_skip_point",
          label: "If you felt bored or wanted to stop watching the video, at which point did this feeling first occur?",
          type: "single_choice",
          required: true,
          options: [
            { value: "beginning", label: "Beginning" },
            { value: "early_middle", label: "Early Middle" },
            { value: "late_middle", label: "Late Middle" },
            { value: "ending", label: "Ending" },
            { value: "not_bored_or_did_not_want_to_stop", label: "I did not feel bored or want to stop watching" }
          ]
        },
        {
          id: "overall_rating",
          label: "Overall, how would you rate this video?",
          type: "rating_5",
          required: true,
          minLabel: "Low",
          maxLabel: "High"
        }
      ]
    }
  ]
};
