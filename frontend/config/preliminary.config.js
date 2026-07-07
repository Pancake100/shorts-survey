/* Preliminary questionnaire shown before the video experiment. */
const PRELIMINARY_CONFIG = {
  welcomeTitle: "Welcome, and thank you for participating in this research.",
  welcomeText: `
    This study aims to investigate how people perceive and evaluate short educational videos. In this experiment, the video topics include Science, History, and Language Learning. The research focuses on viewers' impressions, preferences, and emotional responses toward different styles of short-form educational videos.

    Before the experiment begins, participants will complete a short questionnaire about their background, short-video watching habits, and preferred topics. Participants will then watch several short videos and evaluate their viewing experience.

    Your responses will be treated confidentially. Any published results will be anonymized, and the collected data will only be used for academic research purposes.
  `,
  sections: [
    {
      id: "consent",
      title: "Consent Statement",
      description: "By continuing this survey, you confirm that you have read the explanation above and agree to participate voluntarily. You may stop participating at any time.",
      questions: [
        {
          id: "consent_agreement",
          label: "Do you agree to participate?",
          type: "single_choice",
          required: true,
          options: [
            { value: "agree", label: "Agree" },
            { value: "disagree", label: "Disagree" }
          ]
        }
      ]
    },
    {
      id: "participant_information",
      title: "Participant Information",
      description: "This section collects basic demographic information. The information will be used only for research purposes to better understand the characteristics of the study participants and to analyze whether different backgrounds may influence perceptions of short educational videos. Please answer the following questions to the best of your knowledge.",
      questions: [
        {
          id: "email",
          label: "Optional email",
          help: "You may provide your email only if follow-up communication is needed. This field is optional.",
          type: "email",
          required: false,
          placeholder: "optional@example.com"
        },
        {
          id: "age",
          label: "What is your age?",
          type: "single_choice",
          required: true,
          options: [
            { value: "under_18", label: "Under 18" },
            { value: "18_22", label: "18–22" },
            { value: "23_27", label: "23–27" },
            { value: "28_34", label: "28–34" },
            { value: "35_or_older", label: "35 or older" },
            { value: "prefer_not_to_say", label: "Prefer not to say" }
          ]
        },
        {
          id: "gender",
          label: "What is your gender?",
          type: "single_choice",
          required: true,
          options: [
            { value: "female", label: "Female" },
            { value: "male", label: "Male" },
            { value: "non_binary_or_other", label: "Non-binary / other" },
            { value: "prefer_not_to_say", label: "Prefer not to say" }
          ]
        },
        {
          id: "country_region",
          label: "What is your nationality or country/region of origin?",
          type: "single_choice",
          required: true,
          options: [
            { value: "japan", label: "Japan" },
            { value: "china", label: "China" },
            { value: "taiwan", label: "Taiwan" },
            { value: "vietnam", label: "Vietnam" },
            { value: "indonesia", label: "Indonesia" },
            { value: "thailand", label: "Thailand" },
            { value: "south_korea", label: "South Korea" },
            { value: "other", label: "Other", allowText: true },
            { value: "prefer_not_to_say", label: "Prefer not to say" }
          ]
        },
        {
          id: "native_language",
          label: "What is your native language / mother tongue?",
          type: "single_choice",
          required: true,
          options: [
            { value: "japanese", label: "Japanese" },
            { value: "english", label: "English" },
            { value: "korean", label: "Korean" },
            { value: "mandarin_chinese", label: "Mandarin Chinese" },
            { value: "vietnamese", label: "Vietnamese" },
            { value: "indonesian", label: "Indonesian" },
            { value: "thai", label: "Thai" },
            { value: "other", label: "Other", allowText: true },
            { value: "prefer_not_to_say", label: "Prefer not to say" }
          ]
        },
        {
          id: "education_level",
          label: "What is your current education level?",
          type: "single_choice",
          required: true,
          options: [
            { value: "high_school", label: "High school" },
            { value: "undergraduate_student", label: "Undergraduate student" },
            { value: "graduate_master", label: "Graduate student — Master's" },
            { value: "graduate_doctoral", label: "Graduate student — Doctoral" },
            { value: "other", label: "Other", allowText: true },
            { value: "prefer_not_to_say", label: "Prefer not to say" }
          ]
        }
      ]
    },
    {
      id: "short_video_habits",
      title: "Short-Video Watching Habits",
      description: "Short-form videos refer to videos typically lasting from a few seconds to a few minutes and are commonly found on platforms such as TikTok, YouTube Shorts, and Instagram Reels. Please answer based on your usual viewing habits.",
      questions: [
        {
          id: "short_video_frequency",
          label: "How often do you watch short-form videos?",
          type: "single_choice",
          required: true,
          options: [
            { value: "multiple_times_a_day", label: "Multiple times a day" },
            { value: "about_once_a_day", label: "About once a day" },
            { value: "several_times_a_week", label: "Several times a week" },
            { value: "several_times_a_month", label: "Several times a month" },
            { value: "rarely", label: "Rarely" },
            { value: "never", label: "Never" }
          ]
        },
        {
          id: "platforms",
          label: "Which platforms do you mainly use? Select all that apply.",
          type: "multi_choice",
          required: true,
          options: [
            { value: "tiktok", label: "TikTok" },
            { value: "youtube_shorts", label: "YouTube Shorts" },
            { value: "instagram_reels", label: "Instagram Reels" },
            { value: "facebook_reels", label: "Facebook Reels" },
            { value: "other", label: "Other", allowText: true },
            { value: "do_not_watch", label: "I do not watch short-form videos" }
          ]
        },
        {
          id: "usual_session_length",
          label: "How long do you usually spend per session watching short-form videos?",
          type: "single_choice",
          required: true,
          options: [
            { value: "less_than_10_min", label: "Less than 10 minutes" },
            { value: "10_30_min", label: "10–30 minutes" },
            { value: "30_60_min", label: "30–60 minutes" },
            { value: "1_2_hours", label: "1–2 hours" },
            { value: "more_than_2_hours", label: "More than 2 hours" },
            { value: "do_not_watch", label: "I do not watch short-form videos" }
          ]
        },
        {
          id: "usual_video_types",
          label: "What types of short videos do you usually watch? Select all that apply.",
          type: "multi_choice",
          required: true,
          options: [
            { value: "educational", label: "Educational" },
            { value: "entertainment", label: "Entertainment" },
            { value: "science", label: "Science" },
            { value: "language_learning", label: "Language learning" },
            { value: "cooking", label: "Cooking" },
            { value: "travel", label: "Travel" },
            { value: "life_hacks", label: "Life hacks" },
            { value: "gaming", label: "Gaming" },
            { value: "comedy", label: "Comedy" },
            { value: "news_current_events", label: "News/current events" },
            { value: "other", label: "Other", allowText: true }
          ]
        }
      ]
    },
    {
      id: "educational_video_experience",
      title: "Educational Short-Video Experience",
      description: "This section asks about your experience and opinion regarding short videos used for learning.",
      questions: [
        {
          id: "used_short_videos_for_learning",
          label: "Have you used short videos for learning before?",
          type: "single_choice",
          required: true,
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
            { value: "not_sure", label: "Not sure" }
          ]
        },
        {
          id: "learning_short_video_frequency",
          label: "How often do you watch short videos specifically for learning?",
          type: "single_choice",
          required: true,
          options: [
            { value: "never", label: "Never" },
            { value: "rarely", label: "Rarely" },
            { value: "sometimes", label: "Sometimes" },
            { value: "often", label: "Often" },
            { value: "very_often", label: "Very often" }
          ]
        },
        {
          id: "educational_video_usefulness",
          label: "How useful do you think short educational videos are?",
          type: "rating_5",
          required: true,
          minLabel: "Not useful at all",
          maxLabel: "Very useful"
        }
      ]
    },
    {
      id: "topic_preference",
      title: "Topic Preference",
      description: "This study includes three educational video topics: Science, History, and Language Learning. Please rank the topics by interest.",
      questions: [
        {
          id: "topic_preference_ranking",
          label: "Please rank the topics from most interesting to least interesting.",
          type: "topic_ranking",
          required: true,
          options: [
            { value: "science", label: "Science" },
            { value: "history", label: "History" },
            { value: "language_learning", label: "Language Learning" }
          ]
        }
      ]
    },
    {
      id: "english_comfort",
      title: "English Comfort",
      description: "This question helps interpret your evaluation of the educational videos, especially content clarity, audio, and narration.",
      questions: [
        {
          id: "english_comfort_level",
          label: "How comfortable are you with English?",
          type: "single_choice",
          required: true,
          options: [
            { value: "not_comfortable_at_all", label: "Not comfortable at all" },
            { value: "slightly_comfortable", label: "Slightly comfortable" },
            { value: "moderately_comfortable", label: "Moderately comfortable" },
            { value: "comfortable", label: "Comfortable" },
            { value: "very_comfortable", label: "Very comfortable" }
          ]
        }
      ]
    }
  ]
};
