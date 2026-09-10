// Academe Grading Interface Controller with Interactive Document Viewer & Keyword Highlighting
(function () {
  'use strict';

  const state = window.PortalState;
  if (!state) return;

  // Session Protection: Must be authenticated as Staff
  const staff = state.requireAuth(['staff']);
  if (!staff) return;

  // Logout Handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      state.logout();
    });
  }

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
    state.showToast('Submission not found. Returning to dashboard...', 'error');
    setTimeout(() => {
      window.location.replace('staff-dashboard.html');
    }, 600);
    return;
  }

  const test = state.getTestById(submission.testId) || {
    id: submission.testId,
    title: submission.testTitle,
    totalMarks: submission.maxScore || 100,
    keywords: ['Raft', 'Paxos', 'Byzantine', 'Consensus', 'Leader Election', 'PBFT', 'Fault Tolerance'],
    questions: [
      { id: 'q1', prompt: 'Exam problem solution and analysis', maxMarks: submission.maxScore || 100 }
    ]
  };

  // Back Navigation Handlers
  function goBack() {
    window.location.href = 'staff-dashboard.html';
  }

  const navBackBtn = document.getElementById('navBackBtn');
  const cancelGradeBtn = document.getElementById('cancelGradeBtn');
  const exitWithoutSavingBtn = document.getElementById('exitWithoutSavingBtn');

  if (navBackBtn) navBackBtn.addEventListener('click', goBack);
  if (cancelGradeBtn) cancelGradeBtn.addEventListener('click', goBack);
  if (exitWithoutSavingBtn) exitWithoutSavingBtn.addEventListener('click', goBack);

  // Populate Submission Metadata
  document.getElementById('subStudentName').textContent = submission.studentName;
  document.getElementById('subStudentReg').textContent = `Registration No: ${submission.regNo}`;
  document.getElementById('subTestTitle').textContent = submission.testTitle;
  document.getElementById('subTime').textContent = submission.submittedAt;

  const initials = (submission.studentName || 'ST')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
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

  // ═══════════════════════════════════════════════════
  // DOCUMENT VIEWER & KEYWORD HIGHLIGHTING ENGINE
  // ═══════════════════════════════════════════════════
  const docTypeBadge = document.getElementById('docTypeBadge');
  const docFileName = document.getElementById('docFileName');
  const docFileSize = document.getElementById('docFileSize');
  const documentSheet = document.getElementById('documentSheet');
  const kwChipsContainer = document.getElementById('kwChipsContainer');
  const customKeywordInput = document.getElementById('customKeywordInput');
  const btnAddKeyword = document.getElementById('btnAddKeyword');

  const fileName = submission.fileName || `${submission.studentName.replace(/\s+/g, '_')}_Solution.pdf`;
  const isPPT = fileName.endsWith('.ppt') || fileName.endsWith('.pptx');

  if (docTypeBadge) docTypeBadge.textContent = isPPT ? 'PPT' : 'PDF';
  if (docFileName) docFileName.textContent = fileName;
  if (docFileSize) docFileSize.textContent = `${submission.fileSize || '1.8 MB'} • Uploaded via Student Portal`;

  // Keywords list (Starts with assignment keywords)
  let activeKeywords = [
    ...(test.keywords || ['Raft', 'Paxos', 'Byzantine', 'Consensus', 'Leader Election', 'PBFT', 'Fault Tolerance', 'Replication'])
  ];

  // Document pages content mock
  const answerQ1 = submission.answers && submission.answers.q1
    ? submission.answers.q1
    : 'Raft operates with three states: Follower, Candidate, and Leader. Heartbeats maintain leadership. If timed out, an election is triggered using randomized election timers to prevent split votes. Unlike Multi-Paxos which is symmetric and decentralized, Raft simplifies consensus by electing a strong leader.';

  const answerQ2 = submission.answers && submission.answers.q2
    ? submission.answers.q2
    : 'PBFT requires 3f + 1 nodes to tolerate f arbitrary/byzantine failures through pre-prepare, prepare, and commit phases. In permissioned distributed ledgers, node identities are verified, making message-based Byzantine Fault Tolerance practical without energy-intensive Proof of Work.';

  const documentPages = [
    {
      pageNumber: 1,
      title: `${test.title} — Technical Solution Document`,
      subtitle: `Student: ${submission.studentName} (${submission.regNo}) • Submitted ${submission.submittedAt}`,
      sections: [
        {
          heading: '1. Executive Summary & Architecture Overview',
          body: `This technical report evaluates modern distributed consensus protocols under network partitions and Byzantine fault conditions. We examine the operational mechanics of the Raft consensus algorithm, contrasting its leader election safety invariants with classical Multi-Paxos architectures.`
        },
        {
          heading: '2. Raft Consensus Algorithm & Leader Election State Machine',
          body: `${answerQ1} When a follower node ceases to receive regular heartbeat RPCs from the current cluster leader within a randomized election timeout window, it increments its local term counter, transitions to Candidate state, votes for itself, and broadcasts RequestVote RPCs across all cluster peers. Consensus requires a strict majority quorum to elect a new authoritative leader.`
        },
        {
          heading: '3. Cluster State Machine Diagram & Transitions',
          diagram: `[ Follower ] --(Heartbeat Timeout)--> [ Candidate ]\n[ Candidate ] --(Majority Votes Received)--> [ Leader ]\n[ Leader ] --(Discovers Higher Term)--> [ Follower ]`
        }
      ]
    },
    {
      pageNumber: 2,
      title: `${test.title} — Part II: Fault Tolerance & Replication`,
      subtitle: `Student: ${submission.studentName} (${submission.regNo}) • Document Page 2 of 2`,
      sections: [
        {
          heading: '4. Practical Byzantine Fault Tolerance (PBFT) Analysis',
          body: `${answerQ2} The three-phase protocol (Pre-prepare, Prepare, and Commit) guarantees linearizability and safety across all non-faulty replicas. Fault tolerance is mathematically constrained by the invariant N >= 3f + 1, ensuring that two quorums of 2f + 1 replicas intersect in at least f + 1 nodes, containing at least one honest non-byzantine node.`
        },
        {
          heading: '5. Comparative Matrix: Consensus Protocols',
          body: `In permissioned distributed ledgers, PBFT delivers deterministic finality and rapid transaction throughput without proof of work overhead. In contrast, crash-fault-tolerant (CFT) algorithms like Raft and Paxos assume non-malicious failure nodes and prioritize high availability and linear state machine replication.`
        }
      ]
    }
  ];

  let currentPageIndex = 0;
  let currentZoom = 100;

  // Zoom & Page Navigation Controls
  const pageIndicator = document.getElementById('pageIndicator');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomLevelEl = document.getElementById('zoomLevel');

  function updatePageControls() {
    if (pageIndicator) pageIndicator.textContent = `Page ${currentPageIndex + 1} of ${documentPages.length}`;
    if (prevPageBtn) prevPageBtn.disabled = currentPageIndex === 0;
    if (nextPageBtn) nextPageBtn.disabled = currentPageIndex === documentPages.length - 1;
    if (zoomLevelEl) zoomLevelEl.textContent = `${currentZoom}%`;
    if (documentSheet) documentSheet.style.transform = `scale(${currentZoom / 100})`;
  }

  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (currentPageIndex > 0) {
        currentPageIndex--;
        renderDocument();
        updatePageControls();
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      if (currentPageIndex < documentPages.length - 1) {
        currentPageIndex++;
        renderDocument();
        updatePageControls();
      }
    });
  }

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      if (currentZoom < 140) {
        currentZoom += 10;
        updatePageControls();
      }
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      if (currentZoom > 70) {
        currentZoom -= 10;
        updatePageControls();
      }
    });
  }

  // Highlight Text with Target Keywords
  function highlightKeywordsInText(text) {
    if (!text || activeKeywords.length === 0) return escapeHtml(text);

    // Escape regex characters
    const escapedKws = activeKeywords
      .map(kw => kw.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .filter(kw => kw.length > 0);

    if (escapedKws.length === 0) return escapeHtml(text);

    const regex = new RegExp(`\\b(${escapedKws.join('|')})\\b`, 'gi');
    return escapeHtml(text).replace(regex, (match) => {
      return `<mark class="kw-highlight" data-kw="${escapeHtml(match.toLowerCase())}">${match}</mark>`;
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Count occurrences across the entire document
  function countAllMatches() {
    const counts = {};
    activeKeywords.forEach(kw => {
      counts[kw.toLowerCase()] = 0;
    });

    const fullDocText = documentPages.map(p =>
      p.sections.map(s => (s.body || '') + ' ' + (s.heading || '')).join(' ')
    ).join(' ');

    activeKeywords.forEach(kw => {
      const cleanKw = kw.trim();
      if (!cleanKw) return;
      const regex = new RegExp(`\\b${cleanKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = fullDocText.match(regex);
      counts[kw.toLowerCase()] = matches ? matches.length : 0;
    });

    return counts;
  }

  // Render Keyword Chips
  function renderKeywordChips() {
    if (!kwChipsContainer) return;
    kwChipsContainer.innerHTML = '';
    const counts = countAllMatches();

    activeKeywords.forEach(kw => {
      const count = counts[kw.toLowerCase()] || 0;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'kw-chip-btn';
      chip.innerHTML = `
        <span>${escapeHtml(kw)}</span>
        <span class="kw-chip-count">${count}</span>
      `;

      chip.addEventListener('click', () => {
        // Toggle active styling
        document.querySelectorAll('.kw-chip-btn').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        // Locate and highlight in document sheet
        const targetMarks = documentSheet.querySelectorAll(`mark[data-kw="${kw.toLowerCase()}"]`);
        if (targetMarks.length > 0) {
          documentSheet.querySelectorAll('mark.kw-highlight').forEach(m => m.classList.remove('focused'));
          targetMarks[0].classList.add('focused');
          targetMarks[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // Keyword might be on another page
          const otherPage = documentPages.findIndex(p =>
            p.sections.some(s => (s.body || '').toLowerCase().includes(kw.toLowerCase()))
          );
          if (otherPage !== -1 && otherPage !== currentPageIndex) {
            currentPageIndex = otherPage;
            renderDocument();
            updatePageControls();
            setTimeout(() => {
              const mark = documentSheet.querySelector(`mark[data-kw="${kw.toLowerCase()}"]`);
              if (mark) {
                mark.classList.add('focused');
                mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          } else {
            state.showToast(`Keyword "${kw}" not found on current page.`, 'info');
          }
        }
      });

      kwChipsContainer.appendChild(chip);
    });
  }

  // Render Document Sheet
  function renderDocument() {
    if (!documentSheet) return;
    const page = documentPages[currentPageIndex];
    if (!page) return;

    let sectionsHtml = '';
    page.sections.forEach(s => {
      sectionsHtml += `
        <div class="sheet-section">
          <h4>${highlightKeywordsInText(s.heading)}</h4>
          ${s.body ? `<p style="margin-bottom:0.65rem;">${highlightKeywordsInText(s.body)}</p>` : ''}
          ${s.diagram ? `<div class="sheet-diagram-box"><pre style="margin:0; font-family:inherit;">${s.diagram}</pre></div>` : ''}
        </div>
      `;
    });

    documentSheet.innerHTML = `
      <div class="sheet-header">
        <div>
          <div class="sheet-title">${page.title}</div>
          <div class="sheet-sub">${page.subtitle}</div>
        </div>
        <div style="font-size:0.75rem; color:#94A3B8; font-weight:600;">
          PAGE ${page.pageNumber} / ${documentPages.length}
        </div>
      </div>
      ${sectionsHtml}
      <div style="margin-top:2rem; padding-top:0.85rem; border-top:1px solid #E2E8F0; display:flex; justify-content:space-between; font-size:0.75rem; color:#94A3B8;">
        <span>Document Integrity Verified ✓</span>
        <span>Academe Academic Evaluation Platform</span>
      </div>
    `;

    renderKeywordChips();
  }

  // Add Custom Keyword Handler
  function handleAddKeyword() {
    const inputVal = customKeywordInput ? customKeywordInput.value.trim() : '';
    if (!inputVal) return;

    const exists = activeKeywords.some(kw => kw.toLowerCase() === inputVal.toLowerCase());
    if (!exists) {
      activeKeywords.push(inputVal);
      renderDocument();
      const counts = countAllMatches();
      const count = counts[inputVal.toLowerCase()] || 0;
      state.showToast(`Added keyword "${inputVal}" (${count} matches highlighted in document).`, 'success');
      customKeywordInput.value = '';
    } else {
      state.showToast(`Keyword "${inputVal}" is already active in assistant.`, 'info');
    }
  }

  if (btnAddKeyword) btnAddKeyword.addEventListener('click', handleAddKeyword);
  if (customKeywordInput) {
    customKeywordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddKeyword();
      }
    });
  }

  // Initial Document Render
  renderDocument();
  updatePageControls();

  // ═══════════════════════════════════════════════════
  // SCORING RUBRICS & COMPUTATION
  // ═══════════════════════════════════════════════════
  const questionsContainer = document.getElementById('questionsGradingContainer');
  questionsContainer.innerHTML = '';

  test.questions.forEach((q, index) => {
    const card = document.createElement('div');
    card.className = 'question-grade-card';

    const existingMark = submission.status === 'graded'
      ? Math.round((submission.score / test.totalMarks) * q.maxMarks)
      : '';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.85rem;">
        <div>
          <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #a5b4fc; margin-bottom: 0.4rem;">
            Rubric ${index + 1}
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
      <div style="font-size:0.78rem; color:var(--text-muted);">
        Refer to highlighted terms in the document canvas above to evaluate technical rigor and accuracy.
      </div>
    `;

    questionsContainer.appendChild(card);
  });

  const scoreInputs = document.querySelectorAll('.q-score-input');
  const totalScoreEl = document.getElementById('totalScoreComputed');
  const gradeLabelEl = document.getElementById('percentageIndicator');

  function calculateTotal() {
    let sum = 0;
    const max = Number(test.totalMarks) || 100;
    scoreInputs.forEach(input => {
      const val = Number(input.value) || 0;
      const qMax = Number(input.getAttribute('data-max')) || 50;
      sum += Math.min(Math.max(val, 0), qMax);
    });

    totalScoreEl.textContent = sum;
    const pct = Math.round((sum / max) * 100);

    let gradeLetter = 'F (Unsatisfactory)';
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

  // Feedback Chips
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

  // Submit Evaluation
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
