// UniTest Grading Interface Controller
(function () {
  const state = window.PortalState;
  if (!state) return;

  // Session Protection: Must be authenticated as Staff
  const staff = state.requireAuth(['staff']);
  if (!staff) return;

  // Logout Handler
  document.getElementById('logoutBtn').addEventListener('click', () => {
    state.logout();
  });

  // Get Submission ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const subId = urlParams.get('id');

  if (!subId) {
    state.showToast('No submission ID provided. Returning to dashboard...', 'warning');
    setTimeout(() => {
      window.location.replace('staff-dashboard.html');
    }, 600);
    return;
  }

  const submission = state.getSubmissionById(subId);
  if (!submission) {
    state.showToast('Submission not found. Returning...', 'error');
    setTimeout(() => {
      window.location.replace('staff-dashboard.html');
    }, 600);
    return;
  }

  const test = state.getTestById(submission.testId) || {
    id: submission.testId,
    title: submission.testTitle,
    totalMarks: submission.maxScore || 100,
    questions: [
      { id: 'q1', prompt: 'Exam problem response', maxMarks: submission.maxScore || 100 }
    ]
  };

  // Back Navigation Handlers
  function goBack() {
    window.location.href = 'staff-dashboard.html';
  }

  document.getElementById('navBackBtn').addEventListener('click', goBack);
  document.getElementById('cancelGradeBtn').addEventListener('click', goBack);
  document.getElementById('exitWithoutSavingBtn').addEventListener('click', goBack);

  // Populate Submission Metadata
  document.getElementById('subStudentName').textContent = submission.studentName;
  document.getElementById('subStudentReg').textContent = `Registration No: ${submission.regNo}`;
  document.getElementById('subTestTitle').textContent = submission.testTitle;
  document.getElementById('subTime').textContent = submission.submittedAt;
  
  const initials = (submission.studentName || 'ST').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('subAvatar').textContent = initials;

  const statusBadge = document.getElementById('subStatusBadge');
  if (submission.status === 'graded') {
    statusBadge.className = 'badge badge-graded';
    statusBadge.textContent = `Evaluated (${submission.score}/${submission.maxScore})`;
  } else {
    statusBadge.className = 'badge badge-pending';
    statusBadge.textContent = 'Pending Grading';
  }

  document.getElementById('maxScoreTarget').textContent = test.totalMarks || submission.maxScore || 100;
  if (submission.feedback) {
    document.getElementById('feedbackText').value = submission.feedback;
  }

  // Populate Question Rubrics
  const questionsContainer = document.getElementById('questionsGradingContainer');
  questionsContainer.innerHTML = '';

  const answers = submission.answers || {};
  const questionMarksMap = {};

  test.questions.forEach((q, index) => {
    const studentAns = answers[q.id] || 'No answer submitted for this question.';
    const card = document.createElement('div');
    card.className = 'question-grade-card';

    // Default initial mark if already graded
    const existingMark = submission.status === 'graded' 
      ? Math.round((submission.score / test.totalMarks) * q.maxMarks) 
      : '';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.85rem;">
        <div>
          <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #a5b4fc; margin-bottom: 0.4rem;">
            Question ${index + 1}
          </span>
          <h3 style="font-size: 1.05rem; font-weight: 600; color: #fff;">${q.prompt}</h3>
        </div>
        <div style="text-align: right; min-width: 140px;">
          <span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; display: block; margin-bottom: 0.2rem;">
            Max Marks: ${q.maxMarks}
          </span>
          <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.35rem;">
            <input 
              type="number" 
              class="form-input q-score-input" 
              data-qid="${q.id}" 
              data-max="${q.maxMarks}" 
              value="${existingMark}"
              min="0" 
              max="${q.maxMarks}" 
              placeholder="0" 
              style="width: 70px; text-align: center; font-weight: 700;" 
              required 
            />
            <span style="font-size: 0.9rem; color: var(--text-muted);">/ ${q.maxMarks}</span>
          </div>
        </div>
      </div>

      <label class="form-label" style="font-size: 0.74rem;">Student Submitted Response:</label>
      <div class="student-response-box">${escapeHtml(studentAns)}</div>
    `;

    questionsContainer.appendChild(card);
  });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Update Computed Score Live
  const scoreInputs = document.querySelectorAll('.q-score-input');
  const totalScoreEl = document.getElementById('totalScoreComputed');
  const gradeLabelEl = document.getElementById('percentageIndicator');

  function calculateTotal() {
    let sum = 0;
    let max = Number(test.totalMarks) || 100;
    scoreInputs.forEach(input => {
      const val = Number(input.value) || 0;
      const qMax = Number(input.getAttribute('data-max')) || 50;
      sum += Math.min(Math.max(val, 0), qMax);
    });

    totalScoreEl.textContent = sum;
    const pct = Math.round((sum / max) * 100);

    let gradeLetter = 'F';
    let gradeColor = '#ef4444';
    if (pct >= 90) { gradeLetter = 'A+ (Distinction)'; gradeColor = '#10b981'; }
    else if (pct >= 80) { gradeLetter = 'A (Excellent)'; gradeColor = '#10b981'; }
    else if (pct >= 70) { gradeLetter = 'B (Good)'; gradeColor = '#3b82f6'; }
    else if (pct >= 60) { gradeLetter = 'C (Satisfactory)'; gradeColor = '#f59e0b'; }
    else if (pct >= 50) { gradeLetter = 'D (Pass)'; gradeColor = '#f59e0b'; }

    gradeLabelEl.style.color = gradeColor;
    gradeLabelEl.textContent = `${pct}% — Grade: ${gradeLetter}`;
  }

  scoreInputs.forEach(input => {
    input.addEventListener('input', calculateTotal);
  });

  calculateTotal();

  // Preset feedback chip buttons
  const feedbackText = document.getElementById('feedbackText');
  document.querySelectorAll('.feedback-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.getAttribute('data-text');
      if (feedbackText.value.trim().length > 0) {
        feedbackText.value += ` ${text}`;
      } else {
        feedbackText.value = text;
      }
      feedbackText.focus();
    });
  });

  // Save Grade Form Submission
  document.getElementById('gradingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    let totalScore = 0;
    scoreInputs.forEach(input => {
      totalScore += Number(input.value) || 0;
    });

    const feedback = feedbackText.value.trim();
    const result = state.saveGrade(submission.id, totalScore, feedback);

    if (result.success) {
      state.showToast(`Grade successfully recorded for ${submission.studentName}!`, 'success');
      setTimeout(() => {
        window.location.href = 'staff-dashboard.html';
      }, 500);
    } else {
      state.showToast(result.message, 'error');
    }
  });
})();
