// UniTest Student Portal Controller
(function () {
  const state = window.PortalState;
  if (!state) return;

  // Enforce Student Authentication Route Guard
  const student = state.requireAuth(['student']);
  if (!student) return;

  // Initialize UI Profile
  document.getElementById('userName').textContent = student.name;
  document.getElementById('userRegNo').textContent = `${student.regNo} • ${student.semester || 'Term 1'}`;
  document.getElementById('userAvatar').textContent = student.avatar || 'ST';
  document.getElementById('bannerStudentName').textContent = student.name.split(' ')[0];
  document.getElementById('deptPill').textContent = `Department: ${student.department || 'General'}`;
  document.getElementById('semPill').textContent = `Academic Term: ${student.semester || 'Term 1'}`;

  // Logout Handler
  document.getElementById('logoutBtn').addEventListener('click', () => {
    state.showToast('Logging out...', 'info');
    setTimeout(() => state.logout(), 300);
  });

  // Modal & Exam Elements
  const modal = document.getElementById('testModal');
  const closeBtn = document.getElementById('closeTestModalBtn');
  const cancelBtn = document.getElementById('cancelTestBtn');
  const answerForm = document.getElementById('testAnswerForm');
  const questionsContainer = document.getElementById('testQuestionsContainer');
  const modalTitle = document.getElementById('testModalTitle');
  const modalSubtitle = document.getElementById('testModalSubtitle');
  const timerEl = document.getElementById('examTimer');

  let activeTest = null;
  let timerInterval = null;
  let remainingSeconds = 3600;

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function startExamTimer(durationMins) {
    clearInterval(timerInterval);
    remainingSeconds = (durationMins || 60) * 60;
    timerEl.textContent = formatTime(remainingSeconds);

    timerInterval = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        state.showToast('Time expired! Auto-submitting answers...', 'warning');
        answerForm.requestSubmit();
      } else {
        timerEl.textContent = formatTime(remainingSeconds);
      }
    }, 1000);
  }

  function openExamModal(test) {
    activeTest = test;
    modalTitle.textContent = test.title;
    modalSubtitle.textContent = `${test.code} • Total: ${test.totalMarks} Marks • Duration: ${test.durationMinutes} Min`;
    
    questionsContainer.innerHTML = '';
    test.questions.forEach((q, idx) => {
      const qBox = document.createElement('div');
      qBox.className = 'question-card-item';
      qBox.innerHTML = `
        <div class="q-header">
          <span>Question ${idx + 1} (${q.maxMarks} Marks)</span>
        </div>
        <p style="font-size: 0.92rem; margin-bottom: 0.85rem; color: #e2e8f0;">${q.prompt}</p>
        <textarea class="form-textarea" name="answer_${q.id}" placeholder="Type your comprehensive solution / response here..." required></textarea>
      `;
      questionsContainer.appendChild(qBox);
    });

    startExamTimer(test.durationMinutes);
    modal.classList.add('active');
  }

  function closeExamModal() {
    modal.classList.remove('active');
    clearInterval(timerInterval);
    activeTest = null;
  }

  closeBtn.addEventListener('click', closeExamModal);
  cancelBtn.addEventListener('click', closeExamModal);

  // Submit Exam
  answerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!activeTest) return;

    const formData = new FormData(answerForm);
    const answers = {};
    activeTest.questions.forEach(q => {
      answers[q.id] = formData.get(`answer_${q.id}`) || 'No answer provided.';
    });

    const res = state.submitStudentTest(activeTest.id, answers);
    if (res.success) {
      closeExamModal();
      state.showToast(`Assessment submitted successfully for ${activeTest.code}!`, 'success');
      renderDashboard();
    } else {
      state.showToast(res.message, 'error');
    }
  });

  // Render Dashboard
  function renderDashboard() {
    const tests = state.getTests();
    const studentSubs = state.getStudentSubmissions(student.id);

    // Calculate metrics
    let pendingCount = 0;
    let gradedCount = 0;
    let totalScore = 0;
    let totalMax = 0;

    studentSubs.forEach(s => {
      if (s.status === 'graded') {
        gradedCount++;
        totalScore += s.score || 0;
        totalMax += s.maxScore || 100;
      } else if (s.status === 'pending') {
        pendingCount++;
      }
    });

    const avg = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    document.getElementById('statAvailableTests').textContent = tests.length;
    document.getElementById('statPendingGrading').textContent = pendingCount;
    document.getElementById('statGradedCount').textContent = gradedCount;
    document.getElementById('statAvgScore').textContent = gradedCount > 0 ? `${avg}%` : 'N/A';

    // Render Assessment Cards
    const container = document.getElementById('assessmentContainer');
    container.innerHTML = '';

    tests.forEach(t => {
      const userSub = studentSubs.find(s => s.testId === t.id);
      const card = document.createElement('div');
      card.className = 'test-card';

      let statusBadge = `<span class="badge" style="background:rgba(99,102,241,0.15); color:#a5b4fc; border:1px solid rgba(99,102,241,0.3)">Available Now</span>`;
      let actionBtn = `<button class="btn btn-primary btn-start-test" data-id="${t.id}">Take Test →</button>`;

      if (userSub) {
        if (userSub.status === 'graded') {
          statusBadge = `<span class="badge badge-graded">Graded: ${userSub.score}/${userSub.maxScore}</span>`;
          actionBtn = `<button class="btn btn-secondary" disabled style="opacity:0.65">Completed ✓</button>`;
        } else {
          statusBadge = `<span class="badge badge-pending">Submitted (Pending Review)</span>`;
          actionBtn = `<button class="btn btn-secondary" disabled style="opacity:0.65">Under Evaluation ⏳</button>`;
        }
      }

      card.innerHTML = `
        <div>
          <div class="test-badge-row">
            <span class="badge" style="background:rgba(255,255,255,0.06); color:var(--text-muted); border:1px solid var(--border-subtle)">${t.code}</span>
            ${statusBadge}
          </div>
          <h3 class="test-card-title">${t.title}</h3>
          <div class="test-info-pills">
            <span>⏱️ ${t.durationMinutes} Min</span>
            <span>💯 ${t.totalMarks} Marks</span>
            <span>📅 Due: ${t.dueDate}</span>
          </div>
        </div>
        <div class="test-card-footer">
          <span style="font-size:0.75rem; color:var(--text-dim);">${t.department}</span>
          ${actionBtn}
        </div>
      `;

      container.appendChild(card);
    });

    // Attach click listeners to Take Test buttons
    document.querySelectorAll('.btn-start-test').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const testObj = state.getTestById(id);
        if (testObj) openExamModal(testObj);
      });
    });

    // Render Evaluation Records Table
    const tbody = document.getElementById('gradeTableBody');
    tbody.innerHTML = '';

    if (studentSubs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-dim); padding:2rem;">No assessment submissions on record.</td></tr>`;
      return;
    }

    studentSubs.forEach(s => {
      const tr = document.createElement('tr');
      const isGraded = s.status === 'graded';
      tr.innerHTML = `
        <td>
          <div style="font-weight: 600; color: #fff;">${s.testTitle}</div>
          <span style="font-size:0.75rem; color:var(--text-dim);">${s.id}</span>
        </td>
        <td style="color: var(--text-muted);">${s.submittedAt}</td>
        <td>
          ${isGraded 
            ? `<span class="badge badge-graded">Evaluated</span>` 
            : `<span class="badge badge-pending">Pending Review</span>`}
        </td>
        <td>
          ${isGraded 
            ? `<span class="score-badge">${s.score} / ${s.maxScore}</span>` 
            : `<span style="color:var(--text-dim)">—</span>`}
        </td>
        <td style="max-width: 320px;">
          ${isGraded && s.feedback 
            ? `<div style="font-size:0.84rem; color:#cbd5e1; background:rgba(255,255,255,0.03); padding:0.4rem 0.65rem; border-radius:var(--radius-sm); border-left:3px solid #10b981;">"${s.feedback}"</div>` 
            : `<span style="font-size:0.8rem; color:var(--text-dim)">Awaiting instructor evaluation</span>`}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Initial load
  renderDashboard();
})();
