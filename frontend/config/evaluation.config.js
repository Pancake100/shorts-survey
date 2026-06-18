/* Per-video evaluation form. Parts A-D are Kansei scales; Part E is overall evaluation. */
const EVALUATION_CONFIG = {
  sections: [
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
