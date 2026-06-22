// Frontend SPA Application State
const state = {
    activeView: 'dashboard',
    documents: [],
    activeDocumentId: null,
    tutorSessionId: null,
    currentQuiz: null,
    flashcardIndex: 0,
    plannerTopics: [],
    completedTopics: [],
    quizScores: []
};

// Base API URI (relative paths work because frontend is served by FastAPI)
const API_BASE = "";

// On App Load Initialize Library
document.addEventListener("DOMContentLoaded", () => {
    initDropzone();
    loadDocuments();
    initDatePicker();
});

// View Routing Manager
function switchView(viewName) {
    // Update active nav link
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    const navLink = document.getElementById(`nav-${viewName}`);
    if (navLink) navLink.classList.add('active');

    // Update active content section
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    const section = document.getElementById(`view-${viewName}`);
    if (section) section.classList.add('active');

    // Update Header Text
    const title = document.getElementById('view-title');
    const desc = document.getElementById('view-description');

    state.activeView = viewName;

    switch(viewName) {
        case 'dashboard':
            title.textContent = "Dashboard";
            desc.textContent = "Manage study materials and view system status.";
            loadDocuments();
            break;
        case 'tutor':
            title.textContent = "Tutor Agent";
            desc.textContent = "Ask questions and get explanations on your study notes.";
            break;
        case 'quiz':
            title.textContent = "Quiz Agent";
            desc.textContent = "Generate interactive tests and review terms.";
            break;
        case 'planner':
            title.textContent = "Planner Agent";
            desc.textContent = "Build roadmap calendars for your upcoming exams.";
            break;
        case 'progress':
            title.textContent = "Progress Agent";
            desc.textContent = "Track syllabus coverage and retrieve revision recommendations.";
            updateProgressChecklist();
            break;
    }
}

// Drag & Drop File Upload Handler
function initDropzone() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');

    if (!dropzone || !fileInput) return;

    // Trigger click on browse
    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
}

function initDatePicker() {
    const picker = document.getElementById('exam-date');
    if (picker) {
        // Set minimum date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        picker.min = tomorrow.toISOString().split('T')[0];
    }
}

async function handleFileUpload(file) {
    const progressContainer = document.getElementById('upload-progress-container');
    const progressFill = document.getElementById('upload-progress-fill');
    const filenameLabel = document.getElementById('upload-filename');

    if (!progressContainer || !progressFill || !filenameLabel) return;

    progressContainer.style.display = 'block';
    progressFill.style.width = '20%';
    filenameLabel.textContent = `Uploading ${file.name}...`;

    const formData = new FormData();
    formData.append('file', file);

    try {
        progressFill.style.width = '50%';
        const response = await fetch(`${API_BASE}/api/documents/upload`, {
            method: 'POST',
            body: formData
        });

        progressFill.style.width = '80%';
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Upload failed');
        }

        const data = await response.json();
        progressFill.style.width = '100%';
        filenameLabel.textContent = `Successfully uploaded ${data.filename}!`;
        
        // Select uploaded document as active
        selectDocument(data.file_id, data.filename);
        loadDocuments();

        setTimeout(() => {
            progressContainer.style.display = 'none';
        }, 3000);

    } catch (e) {
        progressFill.style.width = '0%';
        filenameLabel.textContent = `Error: ${e.message}`;
        console.error(e);
    }
}

// Documents Library Handler
async function loadDocuments() {
    try {
        const response = await fetch(`${API_BASE}/api/documents`);
        if (!response.ok) throw new Error('Failed to load documents');
        
        state.documents = await response.json();
        renderDocumentList();
    } catch(e) {
        console.error(e);
    }
}

function renderDocumentList() {
    const list = document.getElementById('document-list');
    if (!list) return;

    if (state.documents.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-folder-open"></i>
                <p>Your library is empty. Upload files to get started!</p>
            </div>
        `;
        return;
    }

    list.innerHTML = state.documents.map(doc => {
        const isActive = doc.file_id === state.activeDocumentId;
        return `
            <div class="document-item ${isActive ? 'active' : ''}" onclick="selectDocument('${doc.file_id}', '${escapeHtml(doc.filename)}')">
                <div class="doc-info">
                    <i class="fa-solid ${doc.filename.endsWith('.pdf') ? 'fa-file-pdf' : 'fa-file-lines'}"></i>
                    <div>
                        <p class="doc-title">${escapeHtml(doc.filename)}</p>
                        <p class="doc-meta">${doc.word_count} words • ${new Date(doc.upload_time).toLocaleDateString()}</p>
                    </div>
                </div>
                <button class="delete-doc-btn" onclick="deleteDocument(event, '${doc.file_id}')">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
    }).join('');
}

function selectDocument(fileId, filename) {
    state.activeDocumentId = fileId;
    document.getElementById('active-doc-name').textContent = filename;
    
    // Clear chat session on document change
    state.tutorSessionId = null;
    const messages = document.getElementById('tutor-chat-messages');
    if (messages) {
        messages.innerHTML = `
            <div class="message assistant">
                <div class="message-bubble">
                    Hello! I've loaded your notes on <strong>${escapeHtml(filename)}</strong>. What questions do you have? I can explain key ideas or define terms!
                </div>
            </div>
        `;
    }

    // Refresh active state styling
    renderDocumentList();
}

async function deleteDocument(event, fileId) {
    event.stopPropagation();
    if (!confirm("Are you sure you want to delete this study material?")) return;

    try {
        const response = await fetch(`${API_BASE}/api/documents/${fileId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Delete failed');
        
        if (state.activeDocumentId === fileId) {
            state.activeDocumentId = null;
            document.getElementById('active-doc-name').textContent = "No file selected";
        }

        loadDocuments();
    } catch (e) {
        console.error(e);
        alert(e.message);
    }
}

// Tutor Agent Message Exchange
async function sendTutorMessage(event) {
    event.preventDefault();
    const input = document.getElementById('tutor-input');
    const messagesContainer = document.getElementById('tutor-chat-messages');
    const sendBtn = document.getElementById('tutor-send-btn');

    if (!input || !messagesContainer || !sendBtn) return;
    
    const text = input.value.trim();
    if (!text) return;

    if (!state.activeDocumentId) {
        alert("Please select a document from the Dashboard first!");
        return;
    }

    // Append User message
    appendChatMessage('user', text);
    input.value = "";
    
    // Disable inputs & show loading state
    input.disabled = true;
    sendBtn.disabled = true;
    const loadingBubble = appendChatMessage('assistant', '<div class="loader" style="width:20px;height:20px;margin:0;"></div>');

    try {
        if (!state.tutorSessionId) {
          state.tutorSessionId = crypto.randomUUID();
        }
        const response = await fetch(`${API_BASE}/api/tutor/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                session_id: state.tutorSessionId,
                file_id: state.activeDocumentId
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Connection error');
        }

        const data = await response.json();
        state.tutorSessionId = data.session_id;

        // Replace loading indicator with response
        loadingBubble.querySelector('.message-bubble').textContent = data.reply;
    } catch(e) {
        loadingBubble.querySelector('.message-bubble').innerHTML = `<span style="color:var(--accent-warn);"><i class="fa-solid fa-circle-exclamation"></i> Error: ${e.message}</span>`;
        console.error(e);
    } finally {
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function appendChatMessage(role, content) {
    const container = document.getElementById('tutor-chat-messages');
    if (!container) return null;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.innerHTML = `<div class="message-bubble">${content}</div>`;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    return messageDiv;
}

function clearTutorChat() {
    if (!confirm("Clear your conversation history?")) return;
    state.tutorSessionId = null;
    const messages = document.getElementById('tutor-chat-messages');
    if (messages) {
        messages.innerHTML = `
            <div class="message assistant">
                <div class="message-bubble">
                    Conversation reset. Ask me a question about your active document!
                </div>
            </div>
        `;
    }
}

// Quiz Agent Logic
function toggleQuizTypeView() {
    // Clear quiz workspace to show fresh placeholder
    document.getElementById('quiz-display').style.display = 'none';
    document.getElementById('quiz-placeholder').style.display = 'block';
    state.currentQuiz = null;
}

async function generateQuiz() {
    if (!state.activeDocumentId) {
        alert("Please select a study document on the Dashboard first!");
        return;
    }

    const quizType = document.getElementById('quiz-type-select').value;
    const size = parseInt(document.getElementById('quiz-size').value) || 5;

    const loading = document.getElementById('quiz-loading');
    const placeholder = document.getElementById('quiz-placeholder');
    const display = document.getElementById('quiz-display');

    loading.style.display = 'block';
    placeholder.style.display = 'none';
    display.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE}/api/quiz/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                file_id: state.activeDocumentId,
                quiz_type: quizType,
                num_questions: size
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Generation failed');
        }

        state.currentQuiz = await response.json();
        renderQuiz(quizType);
    } catch(e) {
        alert(`Error: ${e.message}`);
        placeholder.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

function renderQuiz(type) {
    const display = document.getElementById('quiz-display');
    if (!display || !state.currentQuiz || !state.currentQuiz.items) return;

    display.style.display = 'block';
    
    if (type === 'mcq') {
        renderMCQs(display);
    } else if (type === 'flashcard') {
        state.flashcardIndex = 0;
        renderFlashcard(display);
    } else if (type === 'short_answer') {
        renderShortAnswers(display);
    }
}

// MCQ Renderer
function renderMCQs(container) {
    container.innerHTML = state.currentQuiz.items.map((item, qIdx) => {
        return `
            <div class="mcq-card" id="q-${qIdx}">
                <p class="quiz-question">${qIdx + 1}. ${escapeHtml(item.question)}</p>
                <div class="options-grid">
                    ${item.options.map(option => `
                        <button class="option-btn" onclick="checkMCQAnswer(this, '${escapeHtml(option)}', '${escapeHtml(item.answer)}', ${qIdx})">
                            ${escapeHtml(option)}
                        </button>
                    `).join('')}
                </div>
                <div class="explanation-box" id="explanation-${qIdx}" style="display:none">
                    <strong>Explanation:</strong> ${escapeHtml(item.explanation)}
                </div>
            </div>
        `;
    }).join('');
}

function checkMCQAnswer(button, selected, correct, qIdx) {
    const parentCard = document.getElementById(`q-${qIdx}`);
    if (!parentCard) return;

    // Highlight answer
    const optionButtons = parentCard.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => {
        btn.disabled = true; // Lock choices
        if (btn.innerText.trim() === correct.trim()) {
            btn.classList.add('correct');
        }
    });

    if (selected.trim() !== correct.trim()) {
        button.classList.add('wrong');
        recordQuizScore("MCQ", 0);
    } else {
        recordQuizScore("MCQ", 100);
    }

    // Reveal explanation
    const expBox = document.getElementById(`explanation-${qIdx}`);
    if (expBox) expBox.style.display = 'block';
}

// Flashcards Renderer
function renderFlashcard(container) {
    const cardItem = state.currentQuiz.items[state.flashcardIndex];
    if (!cardItem) return;

    container.innerHTML = `
        <div class="flashcards-container">
            <div class="flashcard-scene" id="flashcard-scene" onclick="this.classList.toggle('flipped')">
                <div class="flashcard">
                    <div class="card-face front">
                        <i class="fa-solid fa-graduation-cap"></i>
                        <p>${escapeHtml(cardItem.front)}</p>
                        <span class="file-limits" style="margin-top:20px;">Click to Flip</span>
                    </div>
                    <div class="card-face back">
                        <i class="fa-solid fa-circle-check"></i>
                        <p>${escapeHtml(cardItem.back)}</p>
                        <span class="file-limits" style="margin-top:20px;">Click to Flip Back</span>
                    </div>
                </div>
            </div>
            <div class="flashcard-nav">
                <button class="btn btn-secondary" onclick="prevFlashcard()" ${state.flashcardIndex === 0 ? 'disabled' : ''}>
                    <i class="fa-solid fa-chevron-left"></i> Prev
                </button>
                <span>Card ${state.flashcardIndex + 1} of ${state.currentQuiz.items.length}</span>
                <button class="btn btn-secondary" onclick="nextFlashcard()" ${state.flashcardIndex === state.currentQuiz.items.length - 1 ? 'disabled' : ''}>
                    Next <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;
}

function nextFlashcard() {
    if (state.flashcardIndex < state.currentQuiz.items.length - 1) {
        state.flashcardIndex++;
        renderQuiz('flashcard');
    }
}

function prevFlashcard() {
    if (state.flashcardIndex > 0) {
        state.flashcardIndex--;
        renderQuiz('flashcard');
    }
}

// Short Answer Renderer
function renderShortAnswers(container) {
    container.innerHTML = state.currentQuiz.items.map((item, qIdx) => {
        return `
            <div class="short-answer-card" id="sa-${qIdx}">
                <p class="quiz-question">${qIdx + 1}. ${escapeHtml(item.question)}</p>
                <div class="sa-input-group">
                    <input type="text" placeholder="Type your answer here..." id="sa-input-${qIdx}">
                    <button class="btn btn-primary" onclick="submitShortAnswer(${qIdx}, '${escapeHtml(item.answer)}', '${escapeHtml(item.explanation)}')">Grade Answer</button>
                </div>
                <div class="sa-grade-box" id="sa-grade-${qIdx}" style="display:none">
                    <p class="sa-answer-title"><i class="fa-solid fa-spell-check"></i> Model Answer</p>
                    <p class="sa-answer-text">${escapeHtml(item.answer)}</p>
                    <strong>Rubric & Explanation:</strong> ${escapeHtml(item.explanation)}
                </div>
            </div>
        `;
    }).join('');
}

function submitShortAnswer(qIdx, modelAnswer, explanation) {
    const input = document.getElementById(`sa-input-${qIdx}`);
    const gradeBox = document.getElementById(`sa-grade-${qIdx}`);
    
    if (input) input.disabled = true;
    if (gradeBox) gradeBox.style.display = 'block';

    recordQuizScore("Short Answer", 100); // Record participation
}

function recordQuizScore(type, score) {
    state.quizScores.push({
        topic: state.activeDocumentId ? state.documents.find(d=>d.file_id === state.activeDocumentId)?.filename : "Syllabus Review",
        score: score,
        type: type,
        timestamp: new Date().toISOString()
    });
}

// Planner Agent Logic
function addTopicToList() {
    const input = document.getElementById('new-topic-input');
    if (!input) return;

    const topicName = input.value.trim();
    if (!topicName) return;

    state.plannerTopics.push(topicName);
    input.value = "";
    input.focus();

    renderPlannerTopics();
}

function removeTopicFromList(index) {
    state.plannerTopics.splice(index, 1);
    renderPlannerTopics();
}

function renderPlannerTopics() {
    const list = document.getElementById('topics-list-ul');
    if (!list) return;

    list.innerHTML = state.plannerTopics.map((topic, index) => {
        return `
            <li>
                <span>${escapeHtml(topic)}</span>
                <button class="remove-topic-btn" onclick="removeTopicFromList(${index})"><i class="fa-solid fa-circle-xmark"></i></button>
            </li>
        `;
    }).join('');
}

async function generateSchedule() {
    const examDate = document.getElementById('exam-date').value;
    const hours = parseFloat(document.getElementById('available-hours').value) || 2;
    const pref = document.getElementById('planner-preferences').value;

    if (!examDate) {
        alert("Please select a target Exam Date!");
        return;
    }

    if (state.plannerTopics.length === 0) {
        alert("Please add at least one topic to cover!");
        return;
    }

    const loading = document.getElementById('planner-loading');
    const placeholder = document.getElementById('planner-placeholder');
    const display = document.getElementById('planner-display');

    loading.style.display = 'block';
    placeholder.style.display = 'none';
    display.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE}/api/planner/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                exam_date: examDate,
                available_hours_per_day: hours,
                topics: state.plannerTopics,
                preferences: pref
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Schedule generation failed');
        }

        const data = await response.json();
        renderSchedule(data.schedule);
    } catch(e) {
        alert(`Error: ${e.message}`);
        placeholder.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

function renderSchedule(schedule) {
    const display = document.getElementById('planner-display');
    const timeline = document.getElementById('calendar-timeline');
    const summary = document.getElementById('planner-stat-summary');

    if (!display || !timeline || !summary) return;

    display.style.display = 'block';
    summary.textContent = `Completed roadmap: ${schedule.length} study slots planned leading to your exam date.`;

    timeline.innerHTML = schedule.map(day => {
        return `
            <div class="timeline-day-card">
                <div class="timeline-day-badge">
                    <span class="day-badge-title">${escapeHtml(day.day)}</span>
                    <span class="day-badge-hours">${day.duration_hours} Hrs</span>
                </div>
                <div class="timeline-day-content">
                    <p class="day-topic">${escapeHtml(day.topic)}</p>
                    <ul class="day-tasks">
                        ${day.tasks.map(task => `<li>${escapeHtml(task)}</li>`).join('')}
                    </ul>
                    ${day.milestone ? `
                        <div class="day-milestone">
                            <i class="fa-solid fa-circle-check"></i> ${escapeHtml(day.milestone)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Pre-populate completed checklist topics array
    state.completedTopics = [];
}

// Progress Agent Checklist & Analytics
function updateProgressChecklist() {
    const checklistDiv = document.getElementById('progress-topics-list');
    if (!checklistDiv) return;

    if (state.plannerTopics.length === 0) {
        checklistDiv.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-route"></i>
                <p>Syllabus empty. Generate a Study Plan first to import topics automatically.</p>
            </div>
        `;
        return;
    }

    checklistDiv.innerHTML = state.plannerTopics.map((topic, index) => {
        const isChecked = state.completedTopics.includes(topic);
        return `
            <div class="progress-checklist-item ${isChecked ? 'checked' : ''}" onclick="toggleTopicChecked(${index})">
                <input type="checkbox" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation(); toggleTopicChecked(${index})">
                <span>${escapeHtml(topic)}</span>
            </div>
        `;
    }).join('');
}

function toggleTopicChecked(index) {
    const topic = state.plannerTopics[index];
    if (!topic) return;

    const idx = state.completedTopics.indexOf(topic);
    if (idx > -1) {
        state.completedTopics.splice(idx, 1);
    } else {
        state.completedTopics.push(topic);
    }
    
    updateProgressChecklist();
    calculateLocalProgress();
}

function calculateLocalProgress() {
    const total = state.plannerTopics.length;
    if (total === 0) return;
    const completed = state.completedTopics.length;
    const percentage = Math.round((completed / total) * 100);

    const ring = document.querySelector('.progress-ring-container');
    const ringText = document.getElementById('progress-percentage-text');
    if (ring && ringText) {
        const deg = (percentage / 100) * 360;
        ring.style.setProperty('--percent-deg', `${deg}deg`);
        ringText.textContent = `${percentage}%`;
    }
}

async function analyzeProgress() {
    if (state.plannerTopics.length === 0) {
        alert("Syllabus topics checklist is required. Generate a study roadmap to import topics first.");
        return;
    }

    const loading = document.getElementById('progress-loading');
    const placeholder = document.getElementById('progress-placeholder');
    const display = document.getElementById('progress-display');

    loading.style.display = 'block';
    placeholder.style.display = 'none';
    display.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE}/api/progress/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                all_topics: state.plannerTopics,
                completed_topics: state.completedTopics,
                quiz_scores: state.quizScores
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Analysis failed');
        }

        const data = await response.json();
        renderProgressReport(data);
    } catch(e) {
        alert(`Error: ${e.message}`);
        placeholder.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

function renderProgressReport(report) {
    const display = document.getElementById('progress-display');
    if (!display) return;

    display.style.display = 'block';

    // Update progress ring percent
    const percentage = Math.round(report.completion_percentage);
    const ring = document.querySelector('.progress-ring-container');
    const ringText = document.getElementById('progress-percentage-text');
    
    if (ring && ringText) {
        const deg = (percentage / 100) * 360;
        ring.style.setProperty('--percent-deg', `${deg}deg`);
        ringText.textContent = `${percentage}%`;
    }

    document.getElementById('progress-ring-subtitle').textContent = `Report generated from ${state.completedTopics.length} completed topics.`;

    // Suggestions list render
    const suggestionsList = document.getElementById('revision-suggestions-list');
    if (report.revision_suggestions && report.revision_suggestions.length > 0) {
        suggestionsList.innerHTML = report.revision_suggestions.map(sug => {
            return `
                <div class="revision-card">
                    <p class="revision-title">${escapeHtml(sug.topic)}</p>
                    <p class="revision-desc">
                        <strong>Reason:</strong> ${escapeHtml(sug.reason)}<br>
                        <strong>Action:</strong> ${escapeHtml(sug.action)}
                    </p>
                </div>
            `;
        }).join('');
    } else {
        suggestionsList.innerHTML = `<p class="card-subtitle">No critical revision items recommended right now!</p>`;
    }

    // Study Tips list render
    const tipsList = document.getElementById('study-tips-list');
    if (report.tips && report.tips.length > 0) {
        tipsList.innerHTML = report.tips.map(tip => `<li>${escapeHtml(tip)}</li>`).join('');
    } else {
        tipsList.innerHTML = `<li>No specific study guidance tips available yet. Keep practicing!</li>`;
    }
}

// Utility functions
function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
