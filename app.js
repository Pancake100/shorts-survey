(() => {
  const STORAGE_KEY = "kansei_video_survey_v3_session";
  const SCALE_VALUES = [-3, -2, -1, 0, 1, 2, 3];

  const $ = (id) => document.getElementById(id);

  const state = {
    participant: null,
    session: null,
    videos: [],
    currentIndex: 0,
    responses: {},
    completedAt: null
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    hydrateStaticText();
    populateGroups();
    bindEvents();
    checkSavedSession();
  }

  function hydrateStaticText() {
    $("experimentTitle").textContent = CONFIG.experimentTitle;
    $("instructions").textContent = CONFIG.instructions.trim();
    $("kanseiExplanation").textContent = CONFIG.kanseiExplanation.trim();
  }

  function populateGroups() {
    const groupSelect = $("groupSelect");
    groupSelect.innerHTML = "";
    Object.keys(CONFIG.groups).forEach((group) => {
      const option = document.createElement("option");
      option.value = group;
      option.textContent = `Group ${group}`;
      groupSelect.appendChild(option);
    });
  }

  function bindEvents() {
    $("setupForm").addEventListener("submit", onStartSurvey);
    $("resumeBtn").addEventListener("click", resumeSavedSession);
    $("prevVideoBtn").addEventListener("click", prevVideo);
    $("nextVideoBtn").addEventListener("click", nextVideo);
    $("backToSurveyBtn").addEventListener("click", () => showScreen("survey"));
    $("exportJsonBtn").addEventListener("click", exportJson);
    $("exportCsvBtn").addEventListener("click", exportCsv);
    $("resetBtn").addEventListener("click", resetSession);
    $("settingsBtn").addEventListener("click", openSettings);
    $("settingsFinishBtn").addEventListener("click", () => { closeAllModals(); showReview(); });
    $("settingsRestartBtn").addEventListener("click", resetSession);
    $("settingsBackToSetupBtn").addEventListener("click", () => { closeAllModals(); showScreen("setup"); });

    $("openKanseiBtn").addEventListener("click", () => openModal("kanseiModal"));
    $("openQuestionsBtn").addEventListener("click", () => openModal("questionsModal"));
    $("saveKanseiBtn").addEventListener("click", saveKanseiRatings);
    $("saveQuestionsBtn").addEventListener("click", savePostVideoQuestions);

    document.querySelectorAll(".close-modal").forEach((button) => {
      button.addEventListener("click", () => closeModal(button.dataset.close));
    });
    $("modalBackdrop").addEventListener("click", closeAllModals);

    $("videoPlayer").addEventListener("error", () => {
      $("videoFallback").classList.remove("hidden");
    });
    $("videoPlayer").addEventListener("loadedmetadata", () => {
      $("videoFallback").classList.add("hidden");
    });
  }

  function checkSavedSession() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) $("resumeBtn").classList.remove("hidden");
  }

  function onStartSurvey(event) {
    event.preventDefault();
    const participantId = $("participantId").value.trim();
    const email = $("participantEmail").value.trim();
    const group = $("groupSelect").value;

    if (!participantId || !group) return;

    const groupVideos = CONFIG.groups[group] || [];
    if (groupVideos.length === 0) {
      alert("This group has no videos. Add videos in config.js first.");
      return;
    }

    const now = new Date().toISOString();
    state.participant = { participant_id: participantId, group, email };
    state.session = {
      session_id: makeSessionId(participantId),
      started_at: now,
      video_order: []
    };
    state.videos = shuffle([...groupVideos]);
    state.session.video_order = state.videos.map((video) => video.id);
    state.currentIndex = 0;
    state.responses = {};
    state.completedAt = null;

    state.videos.forEach((video, index) => {
      state.responses[video.id] = createEmptyResponse(video, index);
    });

    saveState();
    renderCurrentVideo();
    showScreen("survey");
  }

  function resumeSavedSession() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      Object.assign(state, parsed);
      renderCurrentVideo();
      showScreen("survey");
    } catch (error) {
      console.error(error);
      alert("Could not resume saved session. The saved data may be corrupted.");
    }
  }

  function createEmptyResponse(video, index) {
    return {
      video_id: video.id,
      video_title: video.title || video.id,
      video_src: video.src,
      video_order_index: index + 1,
      kansei_completed: false,
      questions_completed: false,
      kansei_ratings: {},
      post_video_questions: {},
      interaction: {
        opened_kansei_modal: false,
        opened_questions_modal: false,
        first_seen_at: null,
        last_seen_at: null
      }
    };
  }

  function renderCurrentVideo() {
    const video = state.videos[state.currentIndex];
    if (!video) return;

    const response = state.responses[video.id];
    const now = new Date().toISOString();
    if (!response.interaction.first_seen_at) response.interaction.first_seen_at = now;
    response.interaction.last_seen_at = now;

    $("progressText").textContent = `Video ${state.currentIndex + 1}/${state.videos.length}`;

    const player = $("videoPlayer");
    player.pause();
    player.removeAttribute("src");
    player.load();
    $("videoFallback").classList.add("hidden");
    player.src = video.src;
    player.load();

    $("prevVideoBtn").disabled = state.currentIndex === 0;
    $("nextVideoBtn").setAttribute("aria-label", state.currentIndex === state.videos.length - 1 ? "Review and export" : "Go to next video");

    renderKanseiForm();
    renderQuestionsForm();
    updateCompletionUi();
    saveState();
  }

  function renderKanseiForm() {
    const video = state.videos[state.currentIndex];
    const response = state.responses[video.id];
    const form = $("kanseiForm");
    form.innerHTML = "";

    CONFIG.kanseiPairs.forEach((pair) => {
      const item = document.createElement("section");
      item.className = "scale-item";
      item.innerHTML = `
        <div class="scale-header">
          <span>${escapeHtml(pair.negative)}</span>
          <span>-3 to +3</span>
          <span>${escapeHtml(pair.positive)}</span>
        </div>
        <p class="scale-definition">${escapeHtml(pair.definition || "")}</p>
        <div class="radio-row" role="radiogroup" aria-label="${escapeHtml(pair.negative)} to ${escapeHtml(pair.positive)}">
          ${SCALE_VALUES.map((value) => `
            <label>
              <input type="radio" name="kansei_${escapeHtml(pair.id)}" value="${value}" ${response.kansei_ratings[pair.id] === value ? "checked" : ""}>
              <span>${value > 0 ? "+" + value : value}</span>
            </label>
          `).join("")}
        </div>
      `;
      form.appendChild(item);
    });
  }

  function renderQuestionsForm() {
    const video = state.videos[state.currentIndex];
    const response = state.responses[video.id];
    const form = $("questionsForm");
    form.innerHTML = "";

    CONFIG.postVideoQuestions.forEach((question) => {
      const value = response.post_video_questions[question.id];
      const item = document.createElement("section");
      item.className = "question-item";
      const requiredMark = question.required ? " <span class='required'>*</span>" : "";

      if (question.type === "yes_no") {
        item.innerHTML = `
          <div><strong>${escapeHtml(question.label)}</strong>${requiredMark}</div>
          <div class="yes-no-row" role="radiogroup">
            <label><input type="radio" name="q_${escapeHtml(question.id)}" value="yes" ${value === "yes" ? "checked" : ""}> Yes</label>
            <label><input type="radio" name="q_${escapeHtml(question.id)}" value="no" ${value === "no" ? "checked" : ""}> No</label>
          </div>
        `;
      } else if (question.type === "likert_7") {
        item.innerHTML = `
          <div><strong>${escapeHtml(question.label)}</strong>${requiredMark}</div>
          <div class="radio-row" role="radiogroup">
            ${[1,2,3,4,5,6,7].map((score) => `
              <label>
                <input type="radio" name="q_${escapeHtml(question.id)}" value="${score}" ${Number(value) === score ? "checked" : ""}>
                <span>${score}</span>
              </label>
            `).join("")}
          </div>
          <div class="likert-labels"><span>${escapeHtml(question.minLabel || "Low")}</span><span>${escapeHtml(question.maxLabel || "High")}</span></div>
        `;
      } else if (question.type === "text") {
        item.innerHTML = `
          <label>
            ${escapeHtml(question.label)}${requiredMark}
            <textarea name="q_${escapeHtml(question.id)}" placeholder="${escapeHtml(question.placeholder || "")}">${escapeHtml(value || "")}</textarea>
          </label>
        `;
      }

      form.appendChild(item);
    });
  }

  function saveKanseiRatings() {
    const video = state.videos[state.currentIndex];
    const response = state.responses[video.id];
    const ratings = {};
    const missing = [];

    CONFIG.kanseiPairs.forEach((pair) => {
      const selected = document.querySelector(`input[name="kansei_${cssEscape(pair.id)}"]:checked`);
      if (!selected) missing.push(pair.negative + " / " + pair.positive);
      else ratings[pair.id] = Number(selected.value);
    });

    removeValidationErrors($("kanseiForm"));
    if (missing.length > 0) {
      showValidationError($("kanseiForm"), `Please answer all Kansei pairs. Missing: ${missing.join(", ")}`);
      return;
    }

    response.kansei_ratings = ratings;
    response.kansei_completed = true;
    response.interaction.opened_kansei_modal = true;
    response.interaction.last_seen_at = new Date().toISOString();
    saveState();
    updateCompletionUi();
    closeModal("kanseiModal");
  }

  function savePostVideoQuestions() {
    const video = state.videos[state.currentIndex];
    const response = state.responses[video.id];
    const answers = {};
    const missing = [];

    CONFIG.postVideoQuestions.forEach((question) => {
      const name = `q_${question.id}`;
      if (question.type === "text") {
        const field = document.querySelector(`[name="${cssEscape(name)}"]`);
        const value = field ? field.value.trim() : "";
        if (question.required && !value) missing.push(question.label);
        answers[question.id] = value;
      } else {
        const selected = document.querySelector(`input[name="${cssEscape(name)}"]:checked`);
        if (!selected && question.required) missing.push(question.label);
        if (selected) answers[question.id] = question.type === "likert_7" ? Number(selected.value) : selected.value;
      }
    });

    removeValidationErrors($("questionsForm"));
    if (missing.length > 0) {
      showValidationError($("questionsForm"), `Please answer required questions. Missing: ${missing.join(", ")}`);
      return;
    }

    response.post_video_questions = answers;
    response.questions_completed = true;
    response.interaction.opened_questions_modal = true;
    response.interaction.last_seen_at = new Date().toISOString();
    saveState();
    updateCompletionUi();
    closeModal("questionsModal");
  }

  function updateCompletionUi() {
    const video = state.videos[state.currentIndex];
    const response = state.responses[video.id];
    const kanseiDone = response.kansei_completed;
    const questionsDone = response.questions_completed;

    $("kanseiStatus").textContent = kanseiDone ? "●" : "○";
    $("questionsStatus").textContent = questionsDone ? "●" : "○";
    $("kanseiStatus").classList.toggle("done", kanseiDone);
    $("questionsStatus").classList.toggle("done", questionsDone);

    if (kanseiDone && questionsDone) {
      $("completionHint").textContent = state.currentIndex === state.videos.length - 1 ? "Completed. Use ↓ or Settings to finish." : "Completed. Use ↓ for next video.";
      $("nextVideoBtn").disabled = false;
    } else {
      const missing = [];
      if (!kanseiDone) missing.push("Kansei");
      if (!questionsDone) missing.push("Questions");
      $("completionHint").textContent = `Complete: ${missing.join(" + ")} before moving forward.`;
      $("nextVideoBtn").disabled = true;
    }
  }

  function prevVideo() {
    if (state.currentIndex <= 0) return;
    state.currentIndex -= 1;
    renderCurrentVideo();
  }

  function nextVideo() {
    const video = state.videos[state.currentIndex];
    const response = state.responses[video.id];
    if (!response.kansei_completed || !response.questions_completed) {
      alert("Please complete both Kansei ratings and additional questions before moving forward.");
      return;
    }

    if (state.currentIndex >= state.videos.length - 1) {
      showReview();
      return;
    }
    state.currentIndex += 1;
    renderCurrentVideo();
  }

  function showReview() {
    state.completedAt = allResponsesComplete() ? new Date().toISOString() : null;
    saveState();
    renderReview();
    showScreen("review");
  }

  function renderReview() {
    const completed = Object.values(state.responses).filter((r) => r.kansei_completed && r.questions_completed).length;
    $("reviewSummary").textContent = `${completed} / ${state.videos.length} videos completed. Export is available, but ideally all videos should be complete before submission.`;

    const list = $("reviewList");
    list.innerHTML = "";
    state.videos.forEach((video, index) => {
      const response = state.responses[video.id];
      const complete = response.kansei_completed && response.questions_completed;
      const row = document.createElement("div");
      row.className = "review-row";
      row.innerHTML = `
        <div><strong>${index + 1}. Video ${escapeHtml(video.id)}</strong><div class="small-muted">${escapeHtml(video.title || video.id)}</div></div>
        <span class="badge ${complete ? "complete" : "incomplete"}">${complete ? "Complete" : "Incomplete"}</span>
      `;
      row.addEventListener("click", () => {
        state.currentIndex = index;
        renderCurrentVideo();
        showScreen("survey");
      });
      list.appendChild(row);
    });
  }

  function buildExportObject() {
    return {
      experiment: {
        title: CONFIG.experimentTitle,
        version: CONFIG.experimentVersion,
        scale: "7-point bipolar Kansei scale, stored as integers from -3 to +3"
      },
      participant: state.participant,
      session: {
        ...state.session,
        completed_at: state.completedAt,
        video_count: state.videos.length,
        interface: "mobile-first short-form video feed with rating modals"
      },
      kansei_pairs: CONFIG.kanseiPairs,
      post_video_questions: CONFIG.postVideoQuestions,
      responses: state.videos.map((video) => state.responses[video.id])
    };
  }

  function exportJson() {
    const data = buildExportObject();
    const filename = `${safeFileName(state.participant.participant_id)}_${state.participant.group}_${state.session.session_id}.json`;
    downloadFile(filename, JSON.stringify(data, null, 2), "application/json");
  }

  function exportCsv() {
    const data = buildExportObject();
    const rows = [];
    const kanseiIds = CONFIG.kanseiPairs.map((p) => p.id);
    const questionIds = CONFIG.postVideoQuestions.map((q) => q.id);
    const header = [
      "participant_id", "group", "email", "session_id", "started_at", "completed_at",
      "video_order_index", "video_id", "video_title", "video_src",
      ...kanseiIds,
      ...questionIds,
      "kansei_completed", "questions_completed", "first_seen_at", "last_seen_at"
    ];
    rows.push(header);

    data.responses.forEach((response) => {
      rows.push([
        data.participant.participant_id,
        data.participant.group,
        data.participant.email,
        data.session.session_id,
        data.session.started_at,
        data.session.completed_at || "",
        response.video_order_index,
        response.video_id,
        response.video_title,
        response.video_src,
        ...kanseiIds.map((id) => valueOrEmpty(response.kansei_ratings[id])),
        ...questionIds.map((id) => valueOrEmpty(response.post_video_questions[id])),
        response.kansei_completed,
        response.questions_completed,
        response.interaction.first_seen_at || "",
        response.interaction.last_seen_at || ""
      ]);
    });

    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const filename = `${safeFileName(state.participant.participant_id)}_${state.participant.group}_${state.session.session_id}.csv`;
    downloadFile(filename, csv, "text/csv;charset=utf-8");
  }

  function resetSession() {
    const ok = confirm("Reset the current session? Export your data first if you need it.");
    if (!ok) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }

  function openSettings() {
    const completed = Object.values(state.responses).filter((r) => r.kansei_completed && r.questions_completed).length;
    $("settingsParticipantId").textContent = state.participant?.participant_id || "-";
    $("settingsGroup").textContent = state.participant?.group ? `Group ${state.participant.group}` : "-";
    $("settingsEmail").textContent = state.participant?.email || "Not provided";
    $("settingsProgress").textContent = `${completed}/${state.videos.length} completed`;
    openModal("settingsModal");
  }

  function openModal(id) {
    const video = state.videos[state.currentIndex];
    const response = state.responses[video.id];
    if (id === "kanseiModal") response.interaction.opened_kansei_modal = true;
    if (id === "questionsModal") response.interaction.opened_questions_modal = true;
    response.interaction.last_seen_at = new Date().toISOString();
    saveState();

    $("modalBackdrop").classList.remove("hidden");
    $(id).classList.remove("hidden");
  }

  function closeModal(id) {
    $(id).classList.add("hidden");
    if ($("kanseiModal").classList.contains("hidden") && $("questionsModal").classList.contains("hidden") && $("settingsModal").classList.contains("hidden")) {
      $("modalBackdrop").classList.add("hidden");
    }
  }

  function closeAllModals() {
    $("kanseiModal").classList.add("hidden");
    $("questionsModal").classList.add("hidden");
    $("settingsModal").classList.add("hidden");
    $("modalBackdrop").classList.add("hidden");
  }

  function showScreen(name) {
    $("setupScreen").classList.toggle("hidden", name !== "setup");
    $("surveyScreen").classList.toggle("hidden", name !== "survey");
    $("reviewScreen").classList.toggle("hidden", name !== "review");
    closeAllModals();
  }

  function allResponsesComplete() {
    return Object.values(state.responses).every((r) => r.kansei_completed && r.questions_completed);
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function showValidationError(container, message) {
    const error = document.createElement("div");
    error.className = "validation-error";
    error.textContent = message;
    container.prepend(error);
  }

  function removeValidationErrors(container) {
    container.querySelectorAll(".validation-error").forEach((el) => el.remove());
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function makeSessionId(participantId) {
    return `${safeFileName(participantId)}_${new Date().toISOString().replace(/[:.]/g, "-")}`;
  }

  function safeFileName(value) {
    return String(value || "participant").replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "");
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function valueOrEmpty(value) {
    return value === undefined || value === null ? "" : value;
  }

  function csvEscape(value) {
    const text = String(valueOrEmpty(value));
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }
})();
