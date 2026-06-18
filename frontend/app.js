(() => {
  const STORAGE_KEY = "kansei_video_survey_v9_session";
  const SETUP_ID_KEY = "kansei_video_survey_v9_participant_id";
  const SCALE_VALUES = [-3, -2, -1, 0, 1, 2, 3];

  const CONFIG = {
    app: APP_CONFIG,
    videos: VIDEOS_CONFIG,
    preliminary: PRELIMINARY_CONFIG,
    evaluation: EVALUATION_CONFIG
  };

  const $ = (id) => document.getElementById(id);

  const state = {
    participant: null,
    preliminary_questionnaire: null,
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
    renderPreliminaryQuestionnaire();
    showGeneratedParticipantId();
    bindEvents();
    checkSavedSession();
  }

  function hydrateStaticText() {
    $("experimentTitle").textContent = CONFIG.app.experimentTitle;
    $("welcomeTitle").textContent = CONFIG.preliminary.welcomeTitle;
    $("welcomeText").textContent = CONFIG.preliminary.welcomeText.trim();
    $("kanseiExplanation").textContent = CONFIG.app.kanseiExplanation.trim();
    $("videoButtonGuide").textContent = CONFIG.app.videoButtonGuide.trim();
  }

  function populateGroups() {
    const groupSelect = $("groupSelect");
    groupSelect.innerHTML = "";
    Object.keys(CONFIG.videos.groups).forEach((group) => {
      const option = document.createElement("option");
      option.value = group;
      option.textContent = `Group ${group}`;
      groupSelect.appendChild(option);
    });
  }

  function showGeneratedParticipantId() {
    $("generatedParticipantId").textContent = getOrCreateParticipantId();
  }

  function bindEvents() {
    $("setupForm").addEventListener("submit", onStartSurvey);
    $("resumeBtn").addEventListener("click", resumeSavedSession);
    $("prevVideoBtn").addEventListener("click", prevVideo);
    $("nextVideoBtn").addEventListener("click", nextVideo);
    $("backToSurveyBtn").addEventListener("click", () => showScreen("survey"));
    $("submitBtn").addEventListener("click", submitResults);
    $("exportJsonBtn").addEventListener("click", exportJson);
    $("resetBtn").addEventListener("click", resetSession);
    $("settingsBtn").addEventListener("click", openSettings);
    $("settingsFinishBtn").addEventListener("click", () => { closeAllModals(); showReview(); });
    $("settingsRestartBtn").addEventListener("click", resetSession);
    $("settingsBackToSetupBtn").addEventListener("click", () => { closeAllModals(); showScreen("setup"); });

    $("openEvaluationBtn").addEventListener("click", () => openModal("evaluationModal"));
    $("saveEvaluationBtn").addEventListener("click", saveEvaluation);

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

    document.addEventListener("change", (event) => {
      if (event.target.matches(".topic-rank-select")) updateTopicRankingOptions(event.target.closest(".topic-ranking"));
    });
  }

  function checkSavedSession() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) $("resumeBtn").classList.remove("hidden");
  }

  function renderPreliminaryQuestionnaire() {
    const container = $("preliminaryFormContainer");
    container.innerHTML = "";

    CONFIG.preliminary.sections.forEach((section) => {
      const sectionEl = document.createElement("section");
      sectionEl.className = "prelim-section";
      sectionEl.innerHTML = `
        <div class="section-heading">
          <h2>${escapeHtml(section.title)}</h2>
          <p>${escapeHtml(section.description || "")}</p>
        </div>
      `;

      const items = document.createElement("div");
      items.className = "section-items";
      section.questions.forEach((question) => items.appendChild(renderQuestion(section.id, question, "prelim")));
      sectionEl.appendChild(items);
      container.appendChild(sectionEl);
    });

    document.querySelectorAll(".topic-ranking").forEach(updateTopicRankingOptions);
  }

  function renderQuestion(sectionId, question, prefix, storedValue) {
    const item = document.createElement("section");
    item.className = "question-item";
    item.dataset.questionId = question.id;
    item.dataset.sectionId = sectionId;
    const requiredMark = question.required ? " <span class='required'>*</span>" : "";
    const baseName = `${prefix}_${sectionId}_${question.id}`;
    const help = question.help ? `<p class="small-muted question-help">${escapeHtml(question.help)}</p>` : "";

    if (question.type === "email" || question.type === "text") {
      item.innerHTML = `
        <label>
          <strong>${escapeHtml(question.label)}</strong>${requiredMark}
          ${help}
          <input type="${question.type === "email" ? "email" : "text"}" name="${escapeHtml(baseName)}" placeholder="${escapeHtml(question.placeholder || "")}" value="${escapeHtml(storedValue || "")}" ${question.required ? "required" : ""}>
        </label>
      `;
      return item;
    }

    if (question.type === "single_choice") {
      item.innerHTML = `
        <div><strong>${escapeHtml(question.label)}</strong>${requiredMark}</div>
        ${help}
        <div class="choice-list" role="radiogroup">
          ${question.options.map((option) => `
            <label class="choice-with-other">
              <input type="radio" name="${escapeHtml(baseName)}" value="${escapeHtml(option.value)}" ${storedValue === option.value ? "checked" : ""}>
              <span>${escapeHtml(option.label)}</span>
              ${option.allowText ? `<input class="other-text" type="text" name="${escapeHtml(baseName)}__other" placeholder="Please specify">` : ""}
            </label>
          `).join("")}
        </div>
      `;
      return item;
    }

    if (question.type === "multi_choice") {
      const selected = Array.isArray(storedValue) ? storedValue : [];
      item.innerHTML = `
        <div><strong>${escapeHtml(question.label)}</strong>${requiredMark}</div>
        ${help}
        <div class="choice-list" role="group">
          ${question.options.map((option) => `
            <label class="choice-with-other">
              <input type="checkbox" name="${escapeHtml(baseName)}" value="${escapeHtml(option.value)}" ${selected.includes(option.value) ? "checked" : ""}>
              <span>${escapeHtml(option.label)}</span>
              ${option.allowText ? `<input class="other-text" type="text" name="${escapeHtml(baseName)}__other" placeholder="Please specify">` : ""}
            </label>
          `).join("")}
        </div>
      `;
      return item;
    }

    if (question.type === "rating_5") {
      item.innerHTML = `
        <div><strong>${escapeHtml(question.label)}</strong>${requiredMark}</div>
        ${help}
        <div class="rating-five-row radio-row" role="radiogroup">
          ${[1,2,3,4,5].map((score) => `
            <label>
              <input type="radio" name="${escapeHtml(baseName)}" value="${score}" ${Number(storedValue) === score ? "checked" : ""}>
              <span>${score}</span>
            </label>
          `).join("")}
        </div>
        <div class="likert-labels"><span>${escapeHtml(question.minLabel || "Low")}</span><span>${escapeHtml(question.maxLabel || "High")}</span></div>
      `;
      return item;
    }

    if (question.type === "topic_ranking") {
      item.classList.add("topic-ranking");
      item.innerHTML = `
        <div><strong>${escapeHtml(question.label)}</strong>${requiredMark}</div>
        ${help}
        <div class="ranking-grid">
          ${["1st", "2nd", "3rd"].map((rank, index) => `
            <label>
              ${rank} favorite topic
              <select class="topic-rank-select" name="${escapeHtml(baseName)}_${index + 1}" data-rank-index="${index}">
                <option value="">Please select</option>
                ${question.options.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join("")}
              </select>
            </label>
          `).join("")}
        </div>
      `;
      return item;
    }

    item.innerHTML = `<p>Unsupported question type: ${escapeHtml(question.type)}</p>`;
    return item;
  }

  function updateTopicRankingOptions(container) {
    if (!container) return;
    const selects = [...container.querySelectorAll(".topic-rank-select")];
    const selectedValues = selects.map((s) => s.value).filter(Boolean);
    selects.forEach((select) => {
      [...select.options].forEach((option) => {
        if (!option.value) return;
        option.disabled = selectedValues.includes(option.value) && option.value !== select.value;
      });
    });
  }

  function collectPreliminaryAnswers() {
    const answers = {};
    const missing = [];
    const form = $("setupForm");

    CONFIG.preliminary.sections.forEach((section) => {
      section.questions.forEach((question) => {
        const name = `prelim_${section.id}_${question.id}`;
        const key = question.id;

        if (question.type === "email" || question.type === "text") {
          const input = form.querySelector(`[name="${cssEscape(name)}"]`);
          const value = input ? input.value.trim() : "";
          if (question.required && !value) missing.push(question.label);
          answers[key] = value;
        }

        if (question.type === "single_choice") {
          const selected = form.querySelector(`input[name="${cssEscape(name)}"]:checked`);
          if (!selected && question.required) missing.push(question.label);
          if (selected) {
            answers[key] = selected.value;
            const option = question.options.find((opt) => opt.value === selected.value);
            if (option?.allowText) {
              const other = form.querySelector(`[name="${cssEscape(name + "__other")}"]`);
              const otherValue = other ? other.value.trim() : "";
              if (!otherValue) missing.push(`${question.label}: please specify Other`);
              answers[`${key}_other`] = otherValue;
            }
          } else {
            answers[key] = null;
          }
        }

        if (question.type === "multi_choice") {
          const selected = [...form.querySelectorAll(`input[name="${cssEscape(name)}"]:checked`)].map((input) => input.value);
          if (question.required && selected.length === 0) missing.push(question.label);
          answers[key] = selected;
          const hasOther = selected.includes("other");
          const other = form.querySelector(`[name="${cssEscape(name + "__other")}"]`);
          const otherValue = other ? other.value.trim() : "";
          if (hasOther && !otherValue) missing.push(`${question.label}: please specify Other`);
          if (hasOther || otherValue) answers[`${key}_other`] = otherValue;
        }

        if (question.type === "rating_5") {
          const selected = form.querySelector(`input[name="${cssEscape(name)}"]:checked`);
          if (!selected && question.required) missing.push(question.label);
          answers[key] = selected ? Number(selected.value) : null;
        }

        if (question.type === "topic_ranking") {
          const values = [1,2,3].map((rank) => {
            const select = form.querySelector(`[name="${cssEscape(name + "_" + rank)}"]`);
            return select ? select.value : "";
          });
          const unique = new Set(values.filter(Boolean));
          if (question.required && values.some((v) => !v)) missing.push(question.label);
          if (unique.size !== values.filter(Boolean).length) missing.push("Please select each topic only once.");
          answers[key] = values;
        }
      });
    });

    return { answers, missing };
  }

  function onStartSurvey(event) {
    event.preventDefault();
    removeValidationErrors($("setupForm"));

    const participantId = getOrCreateParticipantId();
    const group = $("groupSelect").value;
    const { answers, missing } = collectPreliminaryAnswers();

    if (answers.consent_agreement !== "agree") {
      showValidationError($("setupForm"), "You must agree to participate voluntarily before starting the survey.");
      return;
    }
    if (missing.length > 0) {
      showValidationError($("setupForm"), `Please complete the preliminary questionnaire. Missing: ${missing.join(", ")}`);
      return;
    }
    if (!group) {
      showValidationError($("setupForm"), "Please select a group.");
      return;
    }

    const groupVideos = CONFIG.videos.groups[group] || [];
    if (groupVideos.length === 0) {
      alert("This group has no videos. Add videos in config/videos.config.js first.");
      return;
    }

    const now = new Date().toISOString();
    state.participant = { participant_id: participantId, group, email: answers.email || "" };
    state.preliminary_questionnaire = answers;
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
      video_topic: video.topic || "",
      video_src: video.src,
      video_order_index: index + 1,
      evaluation_completed: false,
      evaluation: {},
      interaction: {
        opened_evaluation_modal: false,
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
    $("nextVideoBtn").setAttribute("aria-label", state.currentIndex === state.videos.length - 1 ? "Review and submit" : "Go to next video");

    renderEvaluationForm();
    updateCompletionUi();
    saveState();
  }

  function renderEvaluationForm() {
    const video = state.videos[state.currentIndex];
    const response = state.responses[video.id];
    const form = $("evaluationForm");
    form.innerHTML = "";

    CONFIG.evaluation.sections.forEach((section) => {
      const sectionEl = document.createElement("section");
      sectionEl.className = "evaluation-section";
      sectionEl.innerHTML = `
        <div class="section-heading">
          <h3>${escapeHtml(section.title)}</h3>
          <p>${escapeHtml(section.description || "")}</p>
        </div>
      `;

      if (section.type === "kansei_pairs") {
        const pairsWrap = document.createElement("div");
        pairsWrap.className = "section-items";
        section.pairs.forEach((pair) => {
          const stored = response.evaluation?.[section.id]?.[pair.id];
          const item = document.createElement("section");
          item.className = "scale-item";
          item.innerHTML = `
            <div class="scale-pair-title" aria-hidden="true">
              <span class="pair-left">← ${escapeHtml(pair.left)}</span>
              <span class="pair-right">${escapeHtml(pair.right)} →</span>
            </div>
            <div class="radio-row kansei-radio-row" role="radiogroup" aria-label="${escapeHtml(pair.left)} to ${escapeHtml(pair.right)}">
              ${SCALE_VALUES.map((value, index) => `
                <label title="Position ${index + 1} of 7, from ${escapeHtml(pair.left)} to ${escapeHtml(pair.right)}">
                  <input type="radio" name="eval_${escapeHtml(section.id)}_${escapeHtml(pair.id)}" value="${value}" ${stored === value ? "checked" : ""}>
                  <span class="visually-hidden">Position ${index + 1} of 7, from ${escapeHtml(pair.left)} to ${escapeHtml(pair.right)}</span>
                </label>
              `).join("")}
            </div>
          `;
          pairsWrap.appendChild(item);
        });
        sectionEl.appendChild(pairsWrap);
      }

      if (section.type === "questions") {
        const questionsWrap = document.createElement("div");
        questionsWrap.className = "section-items";
        section.questions.forEach((question) => {
          const value = response.evaluation?.[section.id]?.[question.id];
          questionsWrap.appendChild(renderQuestion(section.id, question, "eval", value));
        });
        sectionEl.appendChild(questionsWrap);
      }

      form.appendChild(sectionEl);
    });
  }

  function saveEvaluation() {
    const video = state.videos[state.currentIndex];
    const response = state.responses[video.id];
    const evaluation = {};
    const missing = [];

    CONFIG.evaluation.sections.forEach((section) => {
      evaluation[section.id] = {};

      if (section.type === "kansei_pairs") {
        section.pairs.forEach((pair) => {
          const name = `eval_${section.id}_${pair.id}`;
          const selected = document.querySelector(`input[name="${cssEscape(name)}"]:checked`);
          if (!selected) missing.push(`${section.title}: ${pair.left} / ${pair.right}`);
          else evaluation[section.id][pair.id] = Number(selected.value);
        });
      }

      if (section.type === "questions") {
        section.questions.forEach((question) => {
          const name = `eval_${section.id}_${question.id}`;
          const selected = document.querySelector(`input[name="${cssEscape(name)}"]:checked`);
          if (!selected && question.required) missing.push(`${section.title}: ${question.label}`);
          if (selected) evaluation[section.id][question.id] = question.type === "rating_5" ? Number(selected.value) : selected.value;
        });
      }
    });

    removeValidationErrors($("evaluationForm"));
    if (missing.length > 0) {
      showValidationError($("evaluationForm"), `Please complete the full evaluation form. Missing: ${missing.join(", ")}`);
      return;
    }

    response.evaluation = evaluation;
    response.evaluation_completed = true;
    response.interaction.opened_evaluation_modal = true;
    response.interaction.last_seen_at = new Date().toISOString();
    saveState();
    updateCompletionUi();
    closeModal("evaluationModal");
  }

  function updateCompletionUi() {
    const video = state.videos[state.currentIndex];
    const response = state.responses[video.id];
    const done = response.evaluation_completed;

    $("evaluationIcon").textContent = done ? "♥" : "♡";
    $("openEvaluationBtn").classList.toggle("is-complete", done);

    if (done) {
      $("completionHint").textContent = state.currentIndex === state.videos.length - 1 ? "Evaluation completed. Use ↓ or Settings to finish." : "Evaluation completed. Use ↓ for next video.";
      $("nextVideoBtn").disabled = false;
    } else {
      $("completionHint").textContent = "Complete the evaluation form before moving forward.";
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
    if (!response.evaluation_completed) {
      alert("Please complete the evaluation form before moving forward.");
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
    const completed = Object.values(state.responses).filter((r) => r.evaluation_completed).length;
    $("reviewSummary").textContent = `${completed} / ${state.videos.length} videos completed. Submit is available when all required evaluations are complete. Export JSON is available as a backup.`;

    const list = $("reviewList");
    list.innerHTML = "";
    state.videos.forEach((video, index) => {
      const response = state.responses[video.id];
      const complete = response.evaluation_completed;
      const row = document.createElement("div");
      row.className = "review-row";
      row.innerHTML = `
        <div><strong>${index + 1}. Video ${escapeHtml(video.id)}</strong><div class="small-muted">${escapeHtml(video.title || video.id)}${video.topic ? ` · ${escapeHtml(video.topic)}` : ""}</div></div>
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
    const suggestedFilename = `${safeFileName(state.participant.participant_id)}.json`;
    return {
      suggested_filename: suggestedFilename,
      experiment: {
        title: CONFIG.app.experimentTitle,
        version: CONFIG.app.experimentVersion,
        scale: "7-point bipolar Kansei sections stored as integers from -3 to +3; participant-facing form hides numeric labels"
      },
      participant: state.participant,
      preliminary_questionnaire: state.preliminary_questionnaire,
      session: {
        ...state.session,
        completed_at: state.completedAt,
        video_count: state.videos.length,
        interface: "mobile-first short-form video screen with one multi-part evaluation form"
      },
      config_snapshot: {
        preliminary_sections: CONFIG.preliminary.sections,
        evaluation_sections: CONFIG.evaluation.sections
      },
      responses: state.videos.map((video) => state.responses[video.id])
    };
  }

  function exportJson() {
    const data = buildExportObject();
    downloadFile(data.suggested_filename, JSON.stringify(data, null, 2), "application/json");
  }

  async function submitResults() {
    const status = $("submitStatus");
    const submitButton = $("submitBtn");
    status.textContent = "";
    status.className = "submit-status";

    if (!allResponsesComplete()) {
      status.textContent = "Please complete all video evaluation forms before submitting.";
      status.classList.add("error");
      return;
    }

    const endpoint = (CONFIG.app.submitEndpoint || "").trim();
    if (!endpoint) {
      status.textContent = "No submit endpoint is configured. Please set submitEndpoint in config/app.config.js, or use Export JSON as a backup.";
      status.classList.add("error");
      return;
    }

    state.completedAt = new Date().toISOString();
    saveState();
    const data = buildExportObject();

    try {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
      status.textContent = "Submitting results...";

      const submitResponse = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!submitResponse.ok) {
        const message = await submitResponse.text().catch(() => "");
        throw new Error(`Server returned ${submitResponse.status}${message ? `: ${message}` : ""}`);
      }

      status.textContent = "Submission successful. Thank you.";
      status.classList.add("success");
    } catch (error) {
      console.error(error);
      status.textContent = `Submission failed: ${error.message}. You can use Export JSON as a backup.`;
      status.classList.add("error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Submit";
    }
  }

  function resetSession() {
    const ok = confirm("Reset the current session? Submit or export your data first if you need it. A new participant ID will be generated.");
    if (!ok) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SETUP_ID_KEY);
    location.reload();
  }

  function openSettings() {
    const completed = Object.values(state.responses).filter((r) => r.evaluation_completed).length;
    $("settingsParticipantId").textContent = state.participant?.participant_id || "-";
    $("settingsGroup").textContent = state.participant?.group ? `Group ${state.participant.group}` : "-";
    $("settingsEmail").textContent = state.participant?.email || "Not provided";
    $("settingsProgress").textContent = `${completed}/${state.videos.length} completed`;
    openModal("settingsModal");
  }

  function openModal(id) {
    if (id === "evaluationModal") {
      const video = state.videos[state.currentIndex];
      const response = state.responses[video.id];
      response.interaction.opened_evaluation_modal = true;
      response.interaction.last_seen_at = new Date().toISOString();
      saveState();
    }

    $("modalBackdrop").classList.remove("hidden");
    $(id).classList.remove("hidden");
  }

  function closeModal(id) {
    $(id).classList.add("hidden");
    if ($("evaluationModal").classList.contains("hidden") && $("settingsModal").classList.contains("hidden")) {
      $("modalBackdrop").classList.add("hidden");
    }
  }

  function closeAllModals() {
    $("evaluationModal").classList.add("hidden");
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
    return Object.values(state.responses).every((r) => r.evaluation_completed);
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getOrCreateParticipantId() {
    const saved = localStorage.getItem(SETUP_ID_KEY);
    if (saved) return saved;
    const id = makeParticipantId();
    localStorage.setItem(SETUP_ID_KEY, id);
    return id;
  }

  function makeParticipantId() {
    const prefix = CONFIG.app.participantIdPrefix || "P";
    const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${stamp}-${random}`;
  }

  function showValidationError(container, message) {
    const error = document.createElement("div");
    error.className = "validation-error";
    error.textContent = message;
    container.prepend(error);
    error.scrollIntoView({ behavior: "smooth", block: "center" });
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
    const prefix = CONFIG.app.sessionIdPrefix || "S";
    return `${prefix}-${safeFileName(participantId)}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
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

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }
})();
