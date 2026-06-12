/*
  Kansei Short-Form Video Survey Configuration
  --------------------------------------------------
  Edit this file to change videos, adjective pairs, and post-video questions.

  Video notes:
  - Put local MP4 files in videos/group-a, videos/group-b, videos/group-c.
  - Replace the placeholder file names below with your actual files.
  - Example: videos/group-a/a01.mp4
*/

const CONFIG = {
  experimentTitle: "Short-Form Video Kansei Survey",
  experimentVersion: "2.3-prototype",

  instructions: `
    You will watch a set of short-form videos and rate your impression of each video.
    For each video, please complete both the Kansei rating and the additional questions.
    You may go back to previous videos and change your answers before exporting your result.
  `,

  kanseiExplanation: `
    Kansei adjectives are pairs of contrasting words used to describe your emotional or subjective impression.
    For each pair, choose the point that best represents how the video felt to you.
    The center point means neutral or balanced between the two adjectives.
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

  kanseiPairs: [
    {
      id: "boring_interesting",
      negative: "Boring",
      positive: "Interesting",
      definition: "How boring or interesting the video felt."
    },
    {
      id: "unpleasant_pleasant",
      negative: "Unpleasant",
      positive: "Pleasant",
      definition: "How unpleasant or pleasant the video felt."
    },
    {
      id: "ordinary_impressive",
      negative: "Ordinary",
      positive: "Impressive",
      definition: "How ordinary or impressive the video felt."
    },
    {
      id: "confusing_clear",
      negative: "Confusing",
      positive: "Clear",
      definition: "How confusing or clear the video felt."
    },
    {
      id: "calm_energetic",
      negative: "Calm",
      positive: "Energetic",
      definition: "How calm or energetic the video felt."
    }
  ],

  postVideoQuestions: [
    {
      id: "wanted_to_skip",
      label: "Did you want to skip the video at some point?",
      type: "yes_no",
      required: true
    },
    {
      id: "found_boring",
      label: "Did you find the video boring?",
      type: "likert_7",
      minLabel: "Not at all",
      maxLabel: "Very much",
      required: true
    },
    {
      id: "wanted_to_continue",
      label: "Did you want to continue watching?",
      type: "likert_7",
      minLabel: "Not at all",
      maxLabel: "Very much",
      required: true
    },
    {
      id: "caught_attention",
      label: "Did the video catch your attention?",
      type: "likert_7",
      minLabel: "Not at all",
      maxLabel: "Very much",
      required: true
    },
    {
      id: "emotionally_engaging",
      label: "Did you feel the video was emotionally engaging?",
      type: "likert_7",
      minLabel: "Not at all",
      maxLabel: "Very much",
      required: true
    },
    {
      id: "comment",
      label: "Optional short comment",
      type: "text",
      required: false,
      placeholder: "Write a short comment if needed."
    }
  ]
};
