/* Per-video evaluation form. Parts A-D are Kansei scales; Part E is overall evaluation. */
const EVALUATION_CONFIG = {
  sections: [
    {
      id: "visual_impression",
      title: "Part A: Visual Impression",
      description: "This section asks about your impressions of the video's visual presentation, including the layout, graphics, colors, subtitles, animations, and overall appearance. Please evaluate how the video looks based on your personal feelings.",
      type: "kansei_pairs",
      pairs: [
        { id: "attractive_plain", left: "Attractive", right: "Plain" },
        { id: "clear_confusing", left: "Clear", right: "Confusing" },
        { id: "organized_disorganized", left: "Organized", right: "Disorganized" },
        { id: "comfortable_uncomfortable", left: "Comfortable", right: "Uncomfortable" },
        { id: "coherent_scattered", left: "Coherent", right: "Scattered" }
      ]
    },
    {
      id: "content_impression",
      title: "Part B: Content Impression",
      description: "This section asks about your impressions of the information and educational value presented in the video. Please evaluate the content based on your feelings.",
      type: "kansei_pairs",
      pairs: [
        { id: "professional_amateur", left: "Professional", right: "Amateur" },
        { id: "understandable_confusing", left: "Understandable", right: "Confusing" },
        { id: "interesting_boring", left: "Interesting", right: "Boring" },
        { id: "factual_misleading", left: "Factual", right: "Misleading" },
        { id: "convincing_doubtful", left: "Convincing", right: "Doubtful" }
      ]
    },
    {
      id: "audio_impression",
      title: "Part C: Audio and Narrator Impression",
      description: "This section asks about your impressions of the video's audio and narrator, including the narrator's voice, background music, sound effects, clarity, and the overall listening experience. Please evaluate the audio/narrator based on your feelings.",
      type: "kansei_pairs",
      pairs: [
        { id: "pleasant_unpleasant", left: "Pleasant", right: "Annoying" },
        { id: "clear_unclear", left: "Clear", right: "Unclear" },
        { id: "smooth_abrupt", left: "Smooth", right: "Abrupt" },
        { id: "friendly_unfriendly", left: "Friendly", right: "Unfriendly" },
        { id: "motivating_demotivating", left: "Motivating", right: "Demotivating" }
      ]
    },
    {
      id: "overall_evaluation",
      title: "Part D: Overall Evaluation",
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
