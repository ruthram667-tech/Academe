// UniTest Faculty Dashboard Controller
(function () {
  const state = window.PortalState;
  if (!state) return;

  // Enforce Staff Authentication Guard
  const staff = state.requireAuth(['staff']);
  if (!staff) return;

  // Set Profile UI
  document.getElementById('staffName').textContent = staff.name;
  document.getElementById('staffDept').textContent = staff.department || 'Faculty of Computer Science';
  document.getElementById('staffAvatar').textContent = staff.avatar || 'FA';

  // Logout Handler
  document.getElementById('logoutBtn').addEventListener('click', () => {
    state.showToast('Signing out of faculty portal...', 'info');
    setTimeout(() => state.logout(), 300);
  });

  // Modal Elements
  const modal = document.getElementById('createTestModal');
  const openBtn = document.getElementById('openCreateTestModalBtn');
  const closeBtn = document.getElementById('closeCreateTestBtn');
  const cancelBtn = document.getElementById('cancelCreateTestBtn');
  const form = document.getElementById('createTestForm');

  openBtn.addEventListener('click', () => modal.classList.add('active'));
  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  cancelBtn.addEventListener('click', () => modal.classList.remove('active'));

  // Create Test Form Submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('testTitleInput').value.trim();
    const code = document.getElementById('testCodeInput').value.trim();
    const dept = document.getElementById('testDeptInput').value.trim();
    const duration = document.getElementById('testDurationInput').value;
    const marks = document.getElementById('testMarksInput').value;
    const prompt = document.getElementById('testPromptInput').value.trim();

    const created = state.createTest({
      title,
      code,
      department: dept,
      durationMinutes: duration,
      totalMarks: marks,
      questions: [
        { id: 'q1', prompt: prompt, maxMarks: Number(marks) }
      ]
    });

    modal.classList.remove('active');
    form.reset();
    state.showToast(`Assessment "${created.title}" successfully published!`, 'success');
    renderView();
  });

  // Render Submissions and Assessments
  function renderView() {
    const submissions = state.getSubmissions();
    const tests = state.getTests();

    // Metrics calculation
    let pendingCount = 0;
    let gradedCount = 0;
    let totalScore = 0;
    let totalMax = 0;

    submissions.forEach(s => {
      if (s.status === 'graded') {
        gradedCount++;
        totalScore += s.score || 0;
        totalMax += s.maxScore || 100;
      } else if (s.status === 'pending') {
        pendingCount++;
      }
    });

    const mean = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    document.getElementById('statTotalTests').textContent = tests.length;
    document.getElementById('statPendingGrading').textContent = pendingCount;
    document.getElementById('statGradedSubmissions').textContent = gradedCount;
    document.getElementById('statClassAverage').textContent = gradedCount > 0 ? `${mean}%` : 'N/A';
    document.getElementById('submissionCounterBadge').textContent = `${submissions.length} Submissions`;

    // Render Submissions Table
    const tbody = document.getElementById('staffSubmissionsBody');
    tbody.innerHTML = '';

    if (submissions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-dim);">No student submissions recorded yet.</td></tr>`;
    } else {
      submissions.forEach(s => {
        const tr = document.createElement('tr');
        const isGraded = s.status === 'graded';
        const initials = (s.studentName || 'ST').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

        tr.innerHTML = `
          <td>
            <div class="student-tag">
              <div class="student-mini-avatar">${initials}</div>
              <div>
                <strong style="color:#fff;">${s.studentName}</strong>
                <div style="font-size:0.72rem; color:var(--text-dim);">${s.id}</div>
              </div>
            </div>
          </td>
          <td><span style="font-family:var(--font-mono); color:var(--text-muted);">${s.regNo}</span></td>
          <td>
            <div style="font-weight:500;">${s.testTitle}</div>
          </td>
          <td style="color:var(--text-muted);">${s.submittedAt}</td>
          <td>
            ${isGraded 
              ? `<span class="badge badge-graded">Evaluated</span>` 
              : `<span class="badge badge-pending">Pending Grading</span>`}
          </td>
          <td>
            ${isGraded 
              ? `<span style="font-weight:700; color:#34d399;">${s.score} / ${s.maxScore}</span>` 
              : `<span style="color:var(--text-dim);">Unscored</span>`}
          </td>
          <td style="text-align:right;">
            <a href="grade.html?id=${s.id}" class="btn ${isGraded ? 'btn-secondary' : 'btn-warning'}" style="font-size:0.8rem; padding:0.42rem 0.85rem;">
              ${isGraded ? 'Edit Evaluation ✎' : 'Grade Submission →'}
            </a>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Render Course Tests Grid
    const testsContainer = document.getElementById('staffTestsList');
    testsContainer.innerHTML = '';
    tests.forEach(t => {
      const card = document.createElement('div');
      card.className = 'glass-panel';
      card.style.padding = '1.25rem';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:0.6rem;">
          <span class="badge" style="background:rgba(245,158,11,0.15); color:#fbbf24;">${t.code}</span>
          <span style="font-size:0.75rem; color:var(--text-dim);">${t.department}</span>
        </div>
        <h4 style="font-size:1.05rem; font-weight:700; margin-bottom:0.5rem; color:#fff;">${t.title}</h4>
        <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.75rem;">
          Duration: ${t.durationMinutes} Min • Marks: ${t.totalMarks} • Questions: ${t.questions.length}
        </div>
        <div style="font-size:0.75rem; color:var(--text-dim); border-top:1px solid var(--border-subtle); padding-top:0.6rem;">
          Schedule: ${t.dueDate}
        </div>
      `;
      testsContainer.appendChild(card);
    });
  }

  renderView();
})();
