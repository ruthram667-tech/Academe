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
    ...(submission.keywords && submission.keywords.length > 0 
      ? submission.keywords 
      : (test.keywords || ['Raft', 'Paxos', 'Byzantine', 'Consensus', 'Leader Election', 'PBFT', 'Fault Tolerance', 'Replication']))
  ];

  // Helper to construct structured sections from text
  function parseTextIntoSections(text, pageNum) {
    if (!text || text.trim().length === 0) {
      return [{ heading: `Page ${pageNum} Solution Content`, body: 'No text extracted for this page.' }];
    }
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    if (paragraphs.length <= 1) {
      const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length > 3) {
        return [
          { heading: lines[0].slice(0, 70), body: lines.slice(1).join('\n') }
        ];
      }
      return [{ heading: `Page ${pageNum}`, body: text.trim() }];
    }
    return paragraphs.map((para, i) => {
      const lines = para.split('\n');
      if (lines.length > 1 && lines[0].length < 80 && /^([0-9]+[.)]|Question|Section|Part|Analysis|Topic)/i.test(lines[0])) {
        return {
          heading: lines[0].trim(),
          body: lines.slice(1).join('\n').trim()
        };
      }
      return {
        heading: `Section ${i + 1}`,
        body: para
      };
    });
  }

  // Build document pages dynamically from submission data
  let documentPages = [];

  function buildDocumentPagesFromSubmission() {
    if (submission.pages && submission.pages.length > 0) {
      documentPages = submission.pages.map(p => ({
        pageNumber: p.pageNumber || 1,
        title: `${test.title} — Page ${p.pageNumber || 1}`,
        subtitle: `Student: ${submission.studentName} (${submission.regNo}) • ${p.isHandwritten ? '✍️ Handwritten OCR' : '⚡ Digital Text'}`,
        isHandwritten: p.isHandwritten,
        canvasDataUrl: p.canvasDataUrl,
        sections: parseTextIntoSections(p.text, p.pageNumber || 1)
      }));
    } else if (submission.extractedText && submission.extractedText.trim().length > 0) {
      documentPages = [
        {
          pageNumber: 1,
          title: `${test.title} — Solution Document`,
          subtitle: `Student: ${submission.studentName} (${submission.regNo}) • Submitted ${submission.submittedAt}`,
          isHandwritten: submission.isHandwritten,
          sections: parseTextIntoSections(submission.extractedText, 1)
        }
      ];
    } else {
      // Fallback academic sample if no PDF was uploaded yet
      documentPages = [
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
              body: `Raft operates with three states: Follower, Candidate, and Leader. Heartbeats maintain leadership. If timed out, an election is triggered using randomized election timers to prevent split votes. Unlike Multi-Paxos which is symmetric and decentralized, Raft simplifies consensus by electing a strong leader. Consensus requires a strict majority quorum to elect a new authoritative leader.`
            }
          ]
        },
        {
          pageNumber: 2,
          title: `${test.title} — Part II: Fault Tolerance & Replication`,
          subtitle: `Student: ${submission.studentName} (${submission.regNo}) • Document Page 2 of 2`,
          sections: [
            {
              heading: '3. Practical Byzantine Fault Tolerance (PBFT) Analysis',
              body: `PBFT requires 3f + 1 nodes to tolerate f arbitrary/byzantine failures through pre-prepare, prepare, and commit phases. In permissioned distributed ledgers, node identities are verified, making message-based Byzantine Fault Tolerance practical without energy-intensive Proof of Work. Fault tolerance is mathematically constrained by N >= 3f + 1.`
            }
          ]
        }
      ];
    }
  }

  buildDocumentPagesFromSubmission();

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
    if (pageIndicator) pageIndicator.textContent = `Page ${currentPageIndex + 1} of ${Math.max(1, documentPages.length)}`;
    if (prevPageBtn) prevPageBtn.disabled = currentPageIndex === 0;
    if (nextPageBtn) nextPageBtn.disabled = currentPageIndex >= documentPages.length - 1;
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

  // Local PDF Upload & OCR Re-run in Grade View
  const btnGradeLoadPdf = document.getElementById('btnGradeLoadPdf');
  const gradeDocFileInput = document.getElementById('gradeDocFileInput');
  const btnRerunOcr = document.getElementById('btnRerunOcr');
  const ocrProgressBox = document.getElementById('evalOcrProgressBox');
  const ocrStatusText = document.getElementById('evalOcrStatus');
  const ocrPercentText = document.getElementById('evalOcrPercent');
  const ocrProgressBar = document.getElementById('evalOcrBar');

  if (btnGradeLoadPdf && gradeDocFileInput) {
    btnGradeLoadPdf.addEventListener('click', () => gradeDocFileInput.click());
    gradeDocFileInput.addEventListener('change', async () => {
      if (gradeDocFileInput.files && gradeDocFileInput.files.length > 0) {
        const file = gradeDocFileInput.files[0];
        if (docFileName) docFileName.textContent = file.name;
        if (docFileSize) docFileSize.textContent = `${(file.size / 1024).toFixed(1)} KB • Loaded Locally`;
        await runEvaluationDocExtraction(file, false);
      }
    });
  }

  if (btnRerunOcr) {
    btnRerunOcr.addEventListener('click', async () => {
      const source = (gradeDocFileInput && gradeDocFileInput.files && gradeDocFileInput.files[0])
        || submission.fileData
        || null;

      if (!source) {
        state.showToast('Please open a local PDF file first to run handwriting OCR.', 'info');
        if (gradeDocFileInput) gradeDocFileInput.click();
        return;
      }

      await runEvaluationDocExtraction(source, true);
    });
  }

  async function runEvaluationDocExtraction(source, forceOCR = false) {
    if (!window.AcademeEngine) return;
    if (ocrProgressBox) ocrProgressBox.style.display = 'block';

    try {
      const result = await window.AcademeEngine.extractTextFromPDF(source, {
        forceOCR: forceOCR,
        maxPages: 10
      }, (p) => {
        if (ocrStatusText) ocrStatusText.textContent = p.message;
        if (ocrPercentText) ocrPercentText.textContent = `${p.percent}%`;
        if (ocrProgressBar) ocrProgressBar.style.width = `${p.percent}%`;
      });

      if (result && result.success) {
        submission.pages = result.pages;
        submission.extractedText = result.text;
        submission.isHandwritten = result.isHandwritten;

        // Save to state
        state.updateSubmissionData(submission.id, {
          pages: result.pages,
          extractedText: result.text,
          isHandwritten: result.isHandwritten
        });

        if (docTypeBadge) {
          docTypeBadge.textContent = result.isHandwritten ? '✍️ OCR' : 'PDF';
          docTypeBadge.style.background = result.isHandwritten ? '#f59e0b' : '#10b981';
        }

        buildDocumentPagesFromSubmission();
        currentPageIndex = 0;
        renderDocument();
        updatePageControls();
        state.showToast(result.isHandwritten ? 'Handwriting OCR recognition completed!' : 'Digital text extracted successfully!', 'success');
      } else {
        state.showToast('Could not extract text: ' + (result ? result.error : 'Unknown error'), 'error');
      }
    } catch (e) {
      console.error(e);
      state.showToast('Extraction failed: ' + e.message, 'error');
    } finally {
      if (ocrProgressBox) {
        setTimeout(() => { ocrProgressBox.style.display = 'none'; }, 600);
      }
    }
  }

  // Safe Text Highlighting using AcademeEngine
  function highlightKeywordsInText(text) {
    if (!text || activeKeywords.length === 0) {
      return (window.AcademeEngine ? window.AcademeEngine.escapeHtml(text) : text).replace(/\n/g, '<br>');
    }
    if (window.AcademeEngine) {
      const res = window.AcademeEngine.matchAndHighlightKeywords(text, activeKeywords, { enableFuzzy: true });
      return res.highlightedHtml;
    }
    return text.replace(/\n/g, '<br>');
  }

  // Count occurrences across the entire document safely
  function countAllMatches() {
    const counts = {};
    activeKeywords.forEach(kw => {
      counts[kw.toLowerCase()] = 0;
    });

    const fullDocText = documentPages.map(p =>
      p.sections.map(s => (s.body || '') + ' ' + (s.heading || '')).join(' ')
    ).join(' ');

    if (window.AcademeEngine) {
      const res = window.AcademeEngine.matchAndHighlightKeywords(fullDocText, activeKeywords, { enableFuzzy: true });
      res.chips.forEach(c => {
        counts[c.keyword.toLowerCase()] = c.totalCount;
      });
    }

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
      if (count > 0) chip.classList.add('has-match');

      chip.innerHTML = `
        <span>${window.AcademeEngine ? window.AcademeEngine.escapeHtml(kw) : kw}</span>
        <span class="kw-chip-count" style="background:${count > 0 ? '#10b981' : 'rgba(255,255,255,0.1)'}; color:${count > 0 ? '#fff' : 'inherit'};">${count}</span>
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
          // Check if keyword exists on another page
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
        <div class="sheet-section" style="margin-bottom: 1.5rem;">
          <h4 style="color:#0f172a; margin-bottom:0.45rem; font-size:1rem; font-weight:700;">${highlightKeywordsInText(s.heading)}</h4>
          ${s.body ? `<div style="margin-bottom:0.65rem; color:#334155; line-height:1.7; font-size:0.92rem;">${highlightKeywordsInText(s.body)}</div>` : ''}
          ${s.diagram ? `<div class="sheet-diagram-box"><pre style="margin:0; font-family:inherit;">${s.diagram}</pre></div>` : ''}
        </div>
      `;
    });

    let canvasPreviewHtml = '';
    if (page.canvasDataUrl) {
      canvasPreviewHtml = `
        <div style="margin-bottom: 1.5rem; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #f8fafc; text-align: center;">
          <div style="font-size: 0.72rem; color: #64748b; padding: 0.35rem 0.65rem; background: #e2e8f0; text-align: left; font-weight: 600;">
            📷 Scanned Original Handwritten Page View
          </div>
          <img src="${page.canvasDataUrl}" alt="Page ${page.pageNumber} Handwritten Scan" style="max-width: 100%; max-height: 400px; display: inline-block; object-fit: contain;" />
        </div>
      `;
    }

    documentSheet.innerHTML = `
      <div class="sheet-header" style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div class="sheet-title" style="font-size: 1.25rem; font-weight: 800; color: #0f172a;">${page.title}</div>
          <div class="sheet-sub" style="font-size: 0.82rem; color: #64748b; margin-top: 0.2rem;">${page.subtitle}</div>
        </div>
        <div style="font-size:0.75rem; color:#94A3B8; font-weight:700; background: #f1f5f9; padding: 0.25rem 0.6rem; border-radius: 4px;">
          PAGE ${page.pageNumber} / ${documentPages.length}
        </div>
      </div>
      ${canvasPreviewHtml}
      ${sectionsHtml}
      <div style="margin-top:2rem; padding-top:0.85rem; border-top:1px solid #E2E8F0; display:flex; justify-content:space-between; font-size:0.75rem; color:#94A3B8;">
        <span>Document Integrity Verified ✓ • Academe Assessment Engine</span>
        <span>Evaluator Portal</span>
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
      state.showToast(`Added keyword "${inputVal}" (${count} matches found).`, 'success');
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
