const state = {
  participantEmail: "",
  group: "",
  sessionId: "",
  videoOrder: [],
  currentIndex: 0,
  responses: {}
};

const introScreen = document.getElementById("intro-screen");
const surveyScreen = document.getElementById("survey-screen");
const finishScreen = document.getElementById("finish-screen");
const experimentTitle = document.getElementById("experiment-title");
const groupSelect = document.getElementById("group-select");
const participantEmail = document.getElementById("participant-email");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const previousButton = document.getElementById("previous-button");
const nextButton = document.getElementById("next-button");
const backToSurveyButton = document.getElementById("back-to-survey-button");
const videoProgress = document.getElementById("video-progress");
const videoIdLabel = document.getElementById("video-id-label");
const videoContainer = document.getElementById("video-container");
const ratingsContainer = document.getElementById("ratings-container");
const resultPreview = document.getElementById("result-preview");
const downloadJsonButton = document.getElementById("download-json-button");
const downloadCsvButton = document.getElementById("download-csv-button");

function initialize() {
  experimentTitle.textContent = CONFIG.experimentTitle;

  Object.keys(CONFIG.groups).forEach(groupName => {
    const option = document.createElement("option");
    option.value = groupName;
    option.textContent = `Group ${groupName}`;
    groupSelect.appendChild(option);
  });

  startButton.addEventListener("click", startSurvey);
  restartButton.addEventListener("click", restartSurvey);
  previousButton.addEventListener("click", goToPreviousVideo);
  nextButton.addEventListener("click", goToNextVideo);
  backToSurveyButton.addEventListener("click", () => showScreen("survey"));
  downloadJsonButton.addEventListener("click", downloadJson);
  downloadCsvButton.addEventListener("click", downloadCsv);

  loadSavedState();
}

function startSurvey() {
  const selectedGroup = groupSelect.value;
  const videos = CONFIG.groups[selectedGroup];

  if (!videos || videos.length === 0) {
    alert("No videos are configured for this group.");
    return;
  }

  state.participantEmail = participantEmail.value.trim();
  state.group = selectedGroup;
  state.sessionId = new Date().toISOString();
  state.videoOrder = shuffleArray([...videos]);
  state.currentIndex = 0;
  state.responses = {};

  state.videoOrder.forEach(video => {
    state.responses[video.id] = createEmptyRatingObject(video);
  });

  saveState();
  renderCurrentVideo();
  showScreen("survey");
}

function createEmptyRatingObject(video) {
  const ratings = {};
  CONFIG.emotionPairs.forEach(pair => {
    ratings[pair.id] = null;
  });

  return {
    video_id: video.id,
    video_url: video.url,
    ratings
  };
}

function renderCurrentVideo() {
  const video = state.videoOrder[state.currentIndex];
  const response = state.responses[video.id];

  videoProgress.textContent = `Video ${state.currentIndex + 1} / ${state.videoOrder.length}`;
  videoIdLabel.textContent = `Video ID: ${video.id}`;

  videoContainer.innerHTML = "";
  const iframe = document.createElement("iframe");
  iframe.src = video.url;
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  videoContainer.appendChild(iframe);

  ratingsContainer.innerHTML = "";
  CONFIG.emotionPairs.forEach(pair => {
    ratingsContainer.appendChild(createRatingRow(pair, response.ratings[pair.id]));
  });

  previousButton.disabled = state.currentIndex === 0;
  nextButton.textContent = state.currentIndex === state.videoOrder.length - 1 ? "Finish" : "Next";
}

function createRatingRow(pair, selectedValue) {
  const row = document.createElement("div");
  row.className = "rating-row";

  const leftLabel = document.createElement("div");
  leftLabel.className = "rating-word-left";
  leftLabel.textContent = pair.negative;

  const radioGroup = document.createElement("div");
  radioGroup.className = "radio-group";

  [-2, -1, 0, 1, 2].forEach(value => {
    const optionLabel = document.createElement("label");
    optionLabel.className = "radio-option";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = pair.id;
    radio.value = value;
    radio.checked = selectedValue === value;
    radio.addEventListener("change", () => updateRating(pair.id, value));

    const valueLabel = document.createElement("span");
    valueLabel.textContent = value > 0 ? `+${value}` : `${value}`;

    optionLabel.appendChild(radio);
    optionLabel.appendChild(valueLabel);
    radioGroup.appendChild(optionLabel);
  });

  const rightLabel = document.createElement("div");
  rightLabel.className = "rating-word-right";
  rightLabel.textContent = pair.positive;

  row.appendChild(leftLabel);
  row.appendChild(radioGroup);
  row.appendChild(rightLabel);

  return row;
}

function updateRating(pairId, value) {
  const video = state.videoOrder[state.currentIndex];
  state.responses[video.id].ratings[pairId] = value;
  saveState();
}

function goToPreviousVideo() {
  if (state.currentIndex > 0) {
    state.currentIndex -= 1;
    saveState();
    renderCurrentVideo();
  }
}

function goToNextVideo() {
  const missing = getMissingRatingsForCurrentVideo();
  if (missing.length > 0) {
    alert(`Please answer all rating items before continuing. Missing: ${missing.join(", ")}`);
    return;
  }

  if (state.currentIndex < state.videoOrder.length - 1) {
    state.currentIndex += 1;
    saveState();
    renderCurrentVideo();
  } else {
    showFinishScreen();
  }
}

function getMissingRatingsForCurrentVideo() {
  const video = state.videoOrder[state.currentIndex];
  const ratings = state.responses[video.id].ratings;

  return CONFIG.emotionPairs
    .filter(pair => ratings[pair.id] === null)
    .map(pair => `${pair.negative}/${pair.positive}`);
}

function showFinishScreen() {
  resultPreview.textContent = JSON.stringify(buildResultObject(), null, 2);
  showScreen("finish");
}

function buildResultObject() {
  return {
    experiment: CONFIG.experimentTitle,
    participant_email: state.participantEmail || null,
    group: state.group,
    session_id: state.sessionId,
    exported_at: new Date().toISOString(),
    video_order: state.videoOrder.map(video => video.id),
    emotion_pairs: CONFIG.emotionPairs,
    responses: state.videoOrder.map(video => state.responses[video.id])
  };
}

function downloadJson() {
  const result = buildResultObject();
  const filename = createExportFilename("json");
  downloadTextFile(filename, JSON.stringify(result, null, 2), "application/json");
}

function downloadCsv() {
  const result = buildResultObject();
  const rows = [];
  const header = [
    "experiment",
    "participant_email",
    "group",
    "session_id",
    "video_position",
    "video_id",
    "video_url",
    ...CONFIG.emotionPairs.map(pair => pair.id)
  ];
  rows.push(header);

  result.responses.forEach((response, index) => {
    rows.push([
      result.experiment,
      result.participant_email || "",
      result.group,
      result.session_id,
      index + 1,
      response.video_id,
      response.video_url,
      ...CONFIG.emotionPairs.map(pair => response.ratings[pair.id])
    ]);
  });

  const csv = rows.map(row => row.map(escapeCsvValue).join(",")).join("\n");
  const filename = createExportFilename("csv");
  downloadTextFile(filename, csv, "text/csv");
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function createExportFilename(extension) {
  const safeSessionId = state.sessionId.replaceAll(":", "-").replaceAll(".", "-");
  const participantPart = state.participantEmail ? state.participantEmail.split("@")[0] : "anonymous";
  return `survey_${state.group}_${participantPart}_${safeSessionId}.${extension}`;
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function showScreen(screenName) {
  introScreen.classList.remove("active");
  surveyScreen.classList.remove("active");
  finishScreen.classList.remove("active");

  if (screenName === "intro") introScreen.classList.add("active");
  if (screenName === "survey") surveyScreen.classList.add("active");
  if (screenName === "finish") finishScreen.classList.add("active");
}

function saveState() {
  localStorage.setItem("emotionSurveyState", JSON.stringify(state));
}

function loadSavedState() {
  const saved = localStorage.getItem("emotionSurveyState");
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    if (parsed.sessionId && parsed.videoOrder && parsed.videoOrder.length > 0) {
      const continuePrevious = confirm("A previous unfinished survey session was found. Continue it?");
      if (continuePrevious) {
        Object.assign(state, parsed);
        renderCurrentVideo();
        showScreen("survey");
      }
    }
  } catch (error) {
    localStorage.removeItem("emotionSurveyState");
  }
}

function restartSurvey() {
  const confirmed = confirm("Restarting will delete the current session data on this browser. Continue?");
  if (!confirmed) return;

  localStorage.removeItem("emotionSurveyState");
  location.reload();
}

initialize();
