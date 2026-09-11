// Academe — Faculty Dashboard Controller
(function () {
  'use strict';

  const state = window.PortalState;
  if (!state) {
    console.error('PortalState is not loaded.');
    return;
  }

  // 1. Authentication Guard: Verify Faculty Role
  const staff = state.requireAuth(['staff']);
  if (!staff) return;

  // 2. Navigation & User Profile Information
  function updateStaffProfileUI() {
    const session = state.getSession() || staff;
    const initials = session.avatar || (session.name || 'FA')
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const navAvatar = document.getElementById('navAvatar');
    const navName = document.getElementById('navStaffName');
    const dropName = document.getElementById('dropdownName');
    const dropEmail = document.getElementById('dropdownEmail');
    const dropDept = document.getElementById('dropdownDept');

    if (navAvatar) navAvatar.textContent = initials;
    if (navName) navName.textContent = session.name;
    if (dropName) dropName.textContent = session.name;
    if (dropEmail) dropEmail.textContent = session.email || 'faculty@academe.edu';
    if (dropDept) dropDept.textContent = session.department || 'Faculty of Computer Science';
  }

  updateStaffProfileUI();

  // 3. Profile Dropdown Controls
  const profileDropdown = document.getElementById('profileDropdown');
  const profileTriggerBtn = document.getElementById('profileTriggerBtn');

  if (profileTriggerBtn && profileDropdown) {
    profileTriggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!profileDropdown.contains(e.target)) {
        profileDropdown.classList.remove('open');
      }
    });
  }

  // 4. Logout Handlers
  function handleLogout() {
    state.showToast('Signing out of faculty portal...', 'info');
    setTimeout(() => {
      state.logout();
    }, 350);
  }

  const logoutBtn = document.getElementById('logoutBtn');
  const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (dropdownLogoutBtn) dropdownLogoutBtn.addEventListener('click', handleLogout);

  // 5. Generic Modal Handlers
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('active');
    if (!document.querySelector('.modal-backdrop.active')) {
      document.body.style.overflow = '';
    }
  }

  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetModalId = btn.getAttribute('data-close');
      closeModal(targetModalId);
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal(backdrop.id);
      }
    });
  });

  // 6. Action Cards Click Handlers
  const cardCourses = document.getElementById('cardCourses');
  const btnCourses = document.getElementById('btnCourses');
  const cardTests = document.getElementById('cardTests');
  const btnTests = document.getElementById('btnTests');
  const cardPresentations = document.getElementById('cardPresentations');
  const btnPresentations = document.getElementById('btnPresentations');

  if (cardCourses) cardCourses.addEventListener('click', () => openModal('modalCourses'));
  if (btnCourses) btnCourses.addEventListener('click', (e) => { e.stopPropagation(); openModal('modalCourses'); });

  if (cardTests) cardTests.addEventListener('click', () => openModal('modalTests'));
  if (btnTests) btnTests.addEventListener('click', (e) => { e.stopPropagation(); openModal('modalTests'); });

  if (cardPresentations) cardPresentations.addEventListener('click', () => openModal('modalPresentations'));
  if (btnPresentations) btnPresentations.addEventListener('click', (e) => { e.stopPropagation(); openModal('modalPresentations'); });

  // 7. Hero Banner Stat Counters
  function updateHeroStats() {
    const courses = state.getCourses();
    const tests = state.getTests();
    const presentations = state.getPresentations();

    const heroNumCourses = document.getElementById('heroNumCourses');
    const heroNumTests = document.getElementById('heroNumTests');
    const heroNumPresentations = document.getElementById('heroNumPresentations');

    if (heroNumCourses) heroNumCourses.textContent = courses.length;
    if (heroNumTests) heroNumTests.textContent = tests.length;
    if (heroNumPresentations) heroNumPresentations.textContent = presentations.length;
  }

  // 8. Document Viewer Simulation Modal
  let currentPreviewFile = null;
  function openDocPreview(fileName, fileType, title, size = '2.4 MB') {
    currentPreviewFile = { fileName, fileType, title, size };
    const modalTitle = document.getElementById('docPreviewTitle');
    const modalSubtitle = document.getElementById('docPreviewSubtitle');
    const badge = document.getElementById('docPreviewBadge');
    const nameEl = document.getElementById('docPreviewName');
    const metaEl = document.getElementById('docPreviewMeta');

    const isPPT = (fileType === 'ppt' || (fileName && (fileName.endsWith('.ppt') || fileName.endsWith('.pptx'))));
    const typeLabel = isPPT ? 'PPT' : 'PDF';

    if (modalTitle) modalTitle.textContent = isPPT ? 'Presentation Deck Preview' : 'Answer Sheet Document Preview';
    if (modalSubtitle) modalSubtitle.textContent = title || fileName;
    if (badge) {
      badge.textContent = typeLabel;
      badge.className = isPPT ? 'doc-viewer-badge' : 'doc-viewer-badge';
      badge.style.background = isPPT ? '#FEF3C7' : '#FEE2E2';
      badge.style.color = isPPT ? '#B45309' : '#B91C1C';
      badge.style.borderColor = isPPT ? '#FDE68A' : '#FECACA';
    }
    if (nameEl) nameEl.textContent = fileName;
    if (metaEl) metaEl.textContent = `Type: ${typeLabel} Document • Size: ${size} • Integrity: Verified (Academe Cloud)`;

    openModal('modalDocPreview');
  }

  const btnDownloadPreviewDoc = document.getElementById('btnDownloadPreviewDoc');
  if (btnDownloadPreviewDoc) {
    btnDownloadPreviewDoc.addEventListener('click', () => {
      const name = currentPreviewFile ? currentPreviewFile.fileName : 'Document.pdf';
      state.showToast(`Downloading file "${name}" to your local drive...`, 'success');
    });
  }

  // ═══════════════════════════════════════════════════
  // 9. MODULE 1: COURSES & NOTES (STAFF VIEW & ADD NOTES)
  // ═══════════════════════════════════════════════════
  const searchCoursesInput = document.getElementById('searchCoursesInput');
  const staffCoursesContainer = document.getElementById('staffCoursesListContainer');
  const openAddNoteModalBtn = document.getElementById('openAddNoteModalBtn');
  const formAddNote = document.getElementById('formAddNote');
  const noteCourseSelect = document.getElementById('noteCourseSelect');

  function renderStaffCourses() {
    if (!staffCoursesContainer) return;
    const courses = state.getCourses();
    const query = (searchCoursesInput ? searchCoursesInput.value.trim().toLowerCase() : '');

    // Populate course select in Add Note modal
    if (noteCourseSelect) {
      noteCourseSelect.innerHTML = courses.map(c => `
        <option value="${c.id}">${c.code}: ${c.name}</option>
      `).join('');
    }

    const filtered = courses.filter(c => {
      if (!query) return true;
      const matchesCourse = c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query);
      const matchesNotes = c.notes && c.notes.some(n => 
        n.title.toLowerCase().includes(query) || 
        (n.topic && n.topic.toLowerCase().includes(query)) ||
        (n.description && n.description.toLowerCase().includes(query))
      );
      return matchesCourse || matchesNotes;
    });

    if (filtered.length === 0) {
      staffCoursesContainer.innerHTML = `
        <div style="text-align:center; padding:3rem 1rem; color:#64748B;">
          <div style="font-size:2.5rem; margin-bottom:0.75rem;">📚</div>
          <h4 style="color:#1E293B; font-weight:700;">No matching courses or notes found</h4>
          <p style="font-size:0.85rem;">Try adjusting your search criteria or click "+ Add Notes" to publish new materials.</p>
        </div>
      `;
      return;
    }

    staffCoursesContainer.innerHTML = filtered.map(course => {
      const notes = course.notes || [];
      const notesHtml = notes.length === 0
        ? `<div style="text-align:center; padding:1.5rem; color:#94A3B8; font-size:0.84rem; background:#F8FAFC; border-radius:8px;">
             No study notes uploaded for this course yet. Click <strong>"+ Add Notes for this Subject"</strong> below to share lecture slides or unit guides.
           </div>`
        : `
          <div class="course-notes-list">
            ${notes.map(n => `
              <div class="course-note-row" data-note-id="${n.id}">
                <div class="note-row-left">
                  <span class="note-topic-tag">${n.topic || 'General Material'}</span>
                  <div class="note-row-title">${n.title}</div>
                  <div class="note-row-desc">${n.description || 'Lecture summary and key theoretical frameworks.'}</div>
                  <div class="note-row-meta">
                    <span>📄 <strong>${n.fileName}</strong> (${n.fileSize || '2.0 MB'})</span>
                    <span>•</span>
                    <span>Uploaded on ${n.uploadedAt || 'Recently'}</span>
                    <span>•</span>
                    <span>By ${n.uploadedBy || 'Faculty'}</span>
                  </div>
                </div>
                <div class="note-row-actions">
                  <button type="button" class="btn-note-download btn-download-note" data-filename="${n.fileName}" data-title="${n.title}">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    <span>Download</span>
                  </button>
                  <button type="button" class="btn-preview-sm btn-preview-note" data-filename="${n.fileName}" data-title="${n.title}">
                    Preview
                  </button>
                  <button type="button" class="btn-note-delete btn-delete-note" data-course-id="${course.id}" data-note-id="${n.id}" data-note-title="${n.title}" title="Delete this note">
                    ✕
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `;

      return `
        <div class="staff-course-card">
          <div class="staff-course-header">
            <div class="course-header-left">
              <span class="course-code-tag">${course.code}</span>
              <div>
                <div class="course-header-title">${course.name}</div>
                <div class="course-header-meta">
                  ${course.department || 'Computer Science'} • ${course.semester || 'Semester 6'} • ${course.credits || 4} Credits
                </div>
              </div>
            </div>
            <button type="button" class="btn-preview-sm btn-quick-add-note" data-course-id="${course.id}" style="color:#B45309; border-color:#FDE68A; background:#FEF3C7;">
              + Add Notes
            </button>
          </div>
          <div class="staff-course-body">
            <div class="course-notes-section-title">
              <span>Published Study Notes &amp; Syllabus Documents (${notes.length})</span>
            </div>
            ${notesHtml}
          </div>
        </div>
      `;
    }).join('');

    // Attach Note Action Event Listeners
    staffCoursesContainer.querySelectorAll('.btn-download-note').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fname = btn.getAttribute('data-filename');
        state.showToast(`Downloading "${fname}"...`, 'success');
      });
    });

    staffCoursesContainer.querySelectorAll('.btn-preview-note').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fname = btn.getAttribute('data-filename');
        const title = btn.getAttribute('data-title');
        openDocPreview(fname, 'pdf', title);
      });
    });

    staffCoursesContainer.querySelectorAll('.btn-delete-note').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const courseId = btn.getAttribute('data-course-id');
        const noteId = btn.getAttribute('data-note-id');
        const noteTitle = btn.getAttribute('data-note-title');

        if (confirm(`Are you sure you want to remove notes: "${noteTitle}"?`)) {
          const res = state.deleteCourseNote(courseId, noteId);
          if (res.success) {
            state.showToast(`Notes "${noteTitle}" removed.`, 'info');
            renderStaffCourses();
          }
        }
      });
    });

    staffCoursesContainer.querySelectorAll('.btn-quick-add-note').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const courseId = btn.getAttribute('data-course-id');
        if (noteCourseSelect) noteCourseSelect.value = courseId;
        openModal('modalAddNote');
      });
    });
  }

  if (searchCoursesInput) {
    searchCoursesInput.addEventListener('input', renderStaffCourses);
  }

  if (openAddNoteModalBtn) {
    openAddNoteModalBtn.addEventListener('click', () => {
      openModal('modalAddNote');
    });
  }

  // Add Note Form File Dropzone & Submit
  const noteFileDropzone = document.getElementById('noteFileDropzone');
  const noteFileInput = document.getElementById('noteFileInput');
  const noteFileNameInput = document.getElementById('noteFileNameInput');
  const noteFilePreview = document.getElementById('noteFilePreview');
  const notePreviewName = document.getElementById('notePreviewName');
  const notePreviewSize = document.getElementById('notePreviewSize');
  const btnRemoveNoteFile = document.getElementById('btnRemoveNoteFile');

  if (noteFileDropzone && noteFileInput) {
    noteFileDropzone.addEventListener('click', () => noteFileInput.click());

    noteFileDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      noteFileDropzone.style.borderColor = '#F59E0B';
    });

    noteFileDropzone.addEventListener('dragleave', () => {
      noteFileDropzone.style.borderColor = '';
    });

    noteFileDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      noteFileDropzone.style.borderColor = '';
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleNoteFileSelected(e.dataTransfer.files[0]);
      }
    });

    noteFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleNoteFileSelected(e.target.files[0]);
      }
    });
  }

  function handleNoteFileSelected(file) {
    if (!file) return;
    const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    if (noteFileNameInput) noteFileNameInput.value = file.name;
    if (notePreviewName) notePreviewName.textContent = file.name;
    if (notePreviewSize) notePreviewSize.textContent = sizeStr;
    if (noteFilePreview) noteFilePreview.style.display = 'flex';
    if (noteFileDropzone) noteFileDropzone.style.display = 'none';
  }

  if (btnRemoveNoteFile) {
    btnRemoveNoteFile.addEventListener('click', () => {
      if (noteFileInput) noteFileInput.value = '';
      if (noteFileNameInput) noteFileNameInput.value = 'Lecture_Study_Notes.pdf';
      if (noteFilePreview) noteFilePreview.style.display = 'none';
      if (noteFileDropzone) noteFileDropzone.style.display = 'block';
    });
  }

  if (formAddNote) {
    formAddNote.addEventListener('submit', (e) => {
      e.preventDefault();
      const courseId = noteCourseSelect ? noteCourseSelect.value : '';
      const topic = document.getElementById('noteTopicInput').value.trim();
      const title = document.getElementById('noteTitleInput').value.trim();
      const description = document.getElementById('noteDescInput').value.trim();
      const fileName = (noteFileNameInput && noteFileNameInput.value.trim()) || 'Study_Notes.pdf';

      const res = state.addCourseNote(courseId, {
        topic,
        title,
        description,
        fileName,
        fileSize: (notePreviewSize ? notePreviewSize.textContent : '2.4 MB')
      });

      if (res.success) {
        state.showToast(`Notes "${title}" published to ${res.course ? res.course.code : 'Course'}!`, 'success');
        closeModal('modalAddNote');
        formAddNote.reset();
        if (btnRemoveNoteFile) btnRemoveNoteFile.click();
        renderStaffCourses();
      } else {
        state.showToast(res.message || 'Could not publish note', 'error');
      }
    });
  }

  // ═══════════════════════════════════════════════════
  // 10. MODULE 2: TESTS & STUDENT PDF SUBMISSIONS
  // ═══════════════════════════════════════════════════
  const tabStaffSubmissionsBtn = document.getElementById('tabStaffSubmissionsBtn');
  const tabStaffTestsListBtn = document.getElementById('tabStaffTestsListBtn');
  const viewStaffSubmissions = document.getElementById('viewStaffSubmissions');
  const viewStaffTestsList = document.getElementById('viewStaffTestsList');
  const staffSubmissionsTableBody = document.getElementById('staffSubmissionsTableBody');
  const staffTestsListContainer = document.getElementById('staffTestsListContainer');
  const subCountBadge = document.getElementById('subCountBadge');
  const testCountBadge = document.getElementById('testCountBadge');
  const searchSubmissionsInput = document.getElementById('searchSubmissionsInput');
  let currentSubFilter = 'all';

  // Submissions Tab Switcher
  if (tabStaffSubmissionsBtn && tabStaffTestsListBtn) {
    tabStaffSubmissionsBtn.addEventListener('click', () => {
      tabStaffSubmissionsBtn.classList.add('active');
      tabStaffTestsListBtn.classList.remove('active');
      if (viewStaffSubmissions) viewStaffSubmissions.style.display = 'block';
      if (viewStaffTestsList) viewStaffTestsList.style.display = 'none';
    });

    tabStaffTestsListBtn.addEventListener('click', () => {
      tabStaffTestsListBtn.classList.add('active');
      tabStaffSubmissionsBtn.classList.remove('active');
      if (viewStaffSubmissions) viewStaffSubmissions.style.display = 'none';
      if (viewStaffTestsList) viewStaffTestsList.style.display = 'block';
    });
  }

  // Submissions Filter Pills
  document.querySelectorAll('[data-sub-filter]').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('[data-sub-filter]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentSubFilter = pill.getAttribute('data-sub-filter');
      renderStaffSubmissions();
    });
  });

  if (searchSubmissionsInput) {
    searchSubmissionsInput.addEventListener('input', renderStaffSubmissions);
  }

  function renderStaffSubmissions() {
    if (!staffSubmissionsTableBody) return;
    const submissions = state.getSubmissions();
    if (subCountBadge) subCountBadge.textContent = submissions.length;

    const query = (searchSubmissionsInput ? searchSubmissionsInput.value.trim().toLowerCase() : '');

    const filtered = submissions.filter(s => {
      // Filter status
      if (currentSubFilter === 'pending' && s.status !== 'pending') return false;
      if (currentSubFilter === 'graded' && s.status !== 'graded') return false;

      // Filter search
      if (!query) return true;
      const sName = (s.studentName || '').toLowerCase();
      const sReg = (s.regNo || '').toLowerCase();
      const sTest = (s.testTitle || '').toLowerCase();
      return sName.includes(query) || sReg.includes(query) || sTest.includes(query);
    });

    if (filtered.length === 0) {
      staffSubmissionsTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:2.5rem 1rem; color:#94A3B8;">
            No student answer submissions found matching this filter.
          </td>
        </tr>
      `;
      return;
    }

    staffSubmissionsTableBody.innerHTML = filtered.map(s => {
      const isGraded = (s.status === 'graded');
      const initials = (s.studentName || 'ST')
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      const docName = s.fileName || 'Solution_Document.pdf';

      return `
        <tr>
          <td>
            <div class="student-tag">
              <div class="student-avatar-circle">${initials}</div>
              <div>
                <strong style="color:#0F172A;">${s.studentName}</strong>
                <div style="font-size:0.74rem; color:#64748B;">ID: ${s.studentId || s.id}</div>
              </div>
            </div>
          </td>
          <td>
            <span style="font-family:monospace; font-weight:600; color:#475569;">${s.regNo || '2024CS101'}</span>
          </td>
          <td>
            <div style="font-weight:600; color:#1E293B; font-size:0.86rem;">${s.testTitle}</div>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <span class="badge-doc pdf">PDF</span>
              <span style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.82rem; font-weight:500;" title="${docName}">
                ${docName}
              </span>
              <button type="button" class="btn-preview-sm btn-preview-sub-doc" data-filename="${docName}" data-title="${s.testTitle} by ${s.studentName}">
                View PDF
              </button>
            </div>
          </td>
          <td style="color:#64748B; font-size:0.82rem; white-space:nowrap;">${s.submittedAt}</td>
          <td>
            ${isGraded
              ? `<span class="badge-tag graded">Evaluated</span>`
              : `<span class="badge-tag pending">Pending Evaluation</span>`}
          </td>
          <td>
            ${isGraded
              ? `<strong style="color:#059669; font-size:0.92rem;">${s.score} / ${s.maxScore || 100}</strong>`
              : `<span style="color:#94A3B8; font-style:italic;">Unscored</span>`}
          </td>
          <td style="text-align:right; white-space:nowrap;">
            <button type="button" class="btn-staff-primary btn-open-grade" data-sub-id="${s.id}" style="padding:0.35rem 0.75rem; font-size:0.78rem;">
              ${isGraded ? '✎ Edit Grade' : 'Grade PDF →'}
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach listeners for preview and grading
    staffSubmissionsTableBody.querySelectorAll('.btn-preview-sub-doc').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fname = btn.getAttribute('data-filename');
        const title = btn.getAttribute('data-title');
        openDocPreview(fname, 'pdf', title);
      });
    });

    staffSubmissionsTableBody.querySelectorAll('.btn-open-grade').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const subId = btn.getAttribute('data-sub-id');
        openQuickGradeModal(subId);
      });
    });
  }

  // Published Tests List View
  function renderStaffTestsList() {
    if (!staffTestsListContainer) return;
    const tests = state.getTests();
    if (testCountBadge) testCountBadge.textContent = tests.length;

    staffTestsListContainer.innerHTML = tests.map(t => {
      const isUpcoming = (t.status === 'upcoming' || t.isUpcoming);
      const isOngoing = (t.status === 'ongoing' || !isUpcoming);

      return `
        <div class="test-admin-card">
          <div class="test-admin-header">
            <span class="course-code-tag">${t.code}</span>
            <span class="badge-tag ${isOngoing ? 'graded' : 'pending'}">${isOngoing ? 'Ongoing' : 'Upcoming'}</span>
          </div>
          <h4 class="test-admin-title">${t.title}</h4>
          <p class="test-admin-desc">${t.instructions || 'Review the questions and upload your solution PDF.'}</p>
          <div class="test-admin-meta">
            <span>⏱ ${t.durationMinutes || 60} Mins • 🎯 ${t.totalMarks || 100} Marks</span>
            <span>📅 ${t.dueDate || 'Active'}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Quick Grade Modal Handling
  const modalQuickGrade = document.getElementById('modalQuickGrade');
  const formQuickGrade = document.getElementById('formQuickGrade');
  const gradeSubId = document.getElementById('gradeSubId');
  const gradeStudentName = document.getElementById('gradeStudentName');
  const gradeStudentReg = document.getElementById('gradeStudentReg');
  const gradeTestTitle = document.getElementById('gradeTestTitle');
  const gradeFileName = document.getElementById('gradeFileName');
  const gradeMaxMarksLabel = document.getElementById('gradeMaxMarksLabel');
  const gradeScoreInput = document.getElementById('gradeScoreInput');
  const gradeFeedbackInput = document.getElementById('gradeFeedbackInput');
  const btnPreviewGradePDF = document.getElementById('btnPreviewGradePDF');
  const linkFullGradeStudio = document.getElementById('linkFullGradeStudio');

  // AI Keyword Analysis Elements
  const btnRunKeywordScan = document.getElementById('btnRunKeywordScan');
  const gradeKeywordsInput = document.getElementById('gradeKeywordsInput');
  const keywordAnalysisResult = document.getElementById('keywordAnalysisResult');
  const simulatedExtractedText = document.getElementById('simulatedExtractedText');
  const keywordMatchCount = document.getElementById('keywordMatchCount');
  const suggestedScoreLabel = document.getElementById('suggestedScoreLabel');

  let activeGradingSub = null;

  function openQuickGradeModal(subId) {
    const sub = state.getSubmissionById(subId);
    if (!sub) {
      state.showToast('Submission not found.', 'error');
      return;
    }

    activeGradingSub = sub;
    if (gradeSubId) gradeSubId.value = sub.id;
    if (gradeStudentName) gradeStudentName.textContent = sub.studentName;
    if (gradeStudentReg) gradeStudentReg.textContent = sub.regNo || '2024CS101';
    if (gradeTestTitle) gradeTestTitle.textContent = sub.testTitle;
    if (gradeFileName) gradeFileName.textContent = sub.fileName || 'Solution_Document.pdf';
    if (gradeMaxMarksLabel) gradeMaxMarksLabel.textContent = sub.maxScore || 100;

    if (gradeScoreInput) {
      gradeScoreInput.max = sub.maxScore || 100;
      gradeScoreInput.value = (sub.score !== null && sub.score !== undefined) ? sub.score : '';
    }
    if (gradeFeedbackInput) {
      gradeFeedbackInput.value = sub.feedback || '';
    }

    if (linkFullGradeStudio) {
      linkFullGradeStudio.href = `grade.html?id=${sub.id}`;
    }

    // Reset AI Keyword Analysis UI
    if (keywordAnalysisResult) keywordAnalysisResult.style.display = 'none';
    if (gradeKeywordsInput) {
      const test = state.getTests().find(t => t.id === sub.testId || t.title === sub.testTitle);
      if (test && test.keywords && test.keywords.length > 0) {
        gradeKeywordsInput.value = test.keywords.join(', ');
      } else {
        gradeKeywordsInput.value = '';
      }
    }

    openModal('modalQuickGrade');
  }

  if (btnPreviewGradePDF) {
    btnPreviewGradePDF.addEventListener('click', () => {
      if (activeGradingSub) {
        openDocPreview(
          activeGradingSub.fileName || 'Solution.pdf',
          'pdf',
          `${activeGradingSub.testTitle} — ${activeGradingSub.studentName}`
        );
      }
    });
  }

  // AI Keyword Auto-Grader Simulation Logic
  if (btnRunKeywordScan) {
    btnRunKeywordScan.addEventListener('click', () => {
      if (!activeGradingSub) return;
      
      const keywordsRaw = gradeKeywordsInput ? gradeKeywordsInput.value.trim() : '';
      if (!keywordsRaw) {
         state.showToast('Please enter target keywords to scan for.', 'warning');
         return;
      }
      
      const keywords = keywordsRaw.split(',').map(k => k.trim()).filter(k => k.length > 0);
      
      // Simulate student answer text relevant to the assessment
      const baseText = `This document provides the solution for the assessment. In modern distributed systems, reaching a distributed decision is critical. One popular approach is using the Raft algorithm which simplifies Paxos. It uses a strong leader approach and handles fault tolerance via log replication. To ensure consistency, a quorum is required before committing entries. Heartbeat mechanisms are used to maintain leader authority. Network partitions can cause temporary divergence, but the system recovers once consensus can be established again among a majority of nodes.`;
      
      let processedText = baseText;
      let matchCount = 0;
      
      keywords.forEach(kw => {
        const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
        if (regex.test(processedText)) {
           matchCount++;
           // Replace with mark tags
           processedText = processedText.replace(regex, `<mark style="background:#FEF08A; color:#854D0E; padding:0 2px; border-radius:2px;">$1</mark>`);
        }
      });
      
      const maxScore = activeGradingSub.maxScore || 100;
      const ratio = matchCount / Math.max(keywords.length, 1);
      const suggested = Math.round((ratio * 0.6 + 0.4) * maxScore); // Base 40% + 60% based on keyword ratio
      const finalScore = matchCount === 0 ? Math.round(maxScore * 0.4) : suggested;
      
      if (simulatedExtractedText) simulatedExtractedText.innerHTML = processedText;
      if (keywordMatchCount) keywordMatchCount.textContent = matchCount;
      if (suggestedScoreLabel) suggestedScoreLabel.textContent = `${finalScore} / ${maxScore}`;
      if (keywordAnalysisResult) keywordAnalysisResult.style.display = 'block';
      
      if (gradeScoreInput) {
        gradeScoreInput.value = finalScore;
      }
      
      state.showToast('Keyword analysis complete. Suggested score applied.', 'success');
    });
  }

  if (formQuickGrade) {
    formQuickGrade.addEventListener('submit', (e) => {
      e.preventDefault();
      const subId = gradeSubId ? gradeSubId.value : '';
      const score = gradeScoreInput ? gradeScoreInput.value : 0;
      const feedback = gradeFeedbackInput ? gradeFeedbackInput.value.trim() : '';

      const res = state.saveGrade(subId, score, feedback);
      if (res.success) {
        state.showToast(`Grade successfully recorded for ${res.submission.studentName} (${score}/${res.submission.maxScore})!`, 'success');
        closeModal('modalQuickGrade');
        renderStaffSubmissions();
        updateHeroStats();
      } else {
        state.showToast(res.message || 'Could not save grade.', 'error');
      }
    });
  }

  // Create Test Form Handling
  const openCreateTestModalBtn = document.getElementById('openCreateTestModalBtn');
  const formCreateTest = document.getElementById('formCreateTest');

  if (openCreateTestModalBtn) {
    openCreateTestModalBtn.addEventListener('click', () => {
      openModal('modalCreateTest');
    });
  }

  if (formCreateTest) {
    formCreateTest.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('testTitleInput').value.trim();
      const code = document.getElementById('testCodeInput').value.trim();
      const dept = document.getElementById('testDeptInput').value.trim();
      const duration = document.getElementById('testDurationInput').value;
      const marks = document.getElementById('testMarksInput').value;
      const status = document.getElementById('testStatusSelect').value;
      const dueDate = document.getElementById('testDueDateInput').value.trim();
      const prompt = document.getElementById('testPromptInput').value.trim();
      const kwRaw = document.getElementById('testKeywordsInput') ? document.getElementById('testKeywordsInput').value : '';
      const keywords = kwRaw.split(',').map(k => k.trim()).filter(k => k.length > 0);

      const created = state.createTest({
        title,
        code,
        department: dept,
        durationMinutes: duration,
        totalMarks: marks,
        status: status,
        isUpcoming: (status === 'upcoming'),
        dueDate: dueDate,
        instructions: prompt,
        keywords: keywords.length > 0 ? keywords : ['Consensus', 'Fault Tolerance', 'Algorithm'],
        questions: [
          { id: 'q1', prompt: prompt, maxMarks: Number(marks) }
        ]
      });

      closeModal('modalCreateTest');
      formCreateTest.reset();
      state.showToast(`Assessment "${created.title}" successfully published!`, 'success');
      renderStaffTestsList();
      updateHeroStats();
    });
  }

  // ═══════════════════════════════════════════════════
  // 11. MODULE 3: PRESENTATIONS & STUDENT PPT REVIEWS
  // ═══════════════════════════════════════════════════
  const tabStaffPresSubmissionsBtn = document.getElementById('tabStaffPresSubmissionsBtn');
  const tabStaffPresSessionsBtn = document.getElementById('tabStaffPresSessionsBtn');
  const viewStaffPresSubmissions = document.getElementById('viewStaffPresSubmissions');
  const viewStaffPresSessions = document.getElementById('viewStaffPresSessions');
  const staffPresSubmissionsTableBody = document.getElementById('staffPresSubmissionsTableBody');
  const staffPresSessionsContainer = document.getElementById('staffPresSessionsContainer');
  const presSubCountBadge = document.getElementById('presSubCountBadge');
  const presCountBadge = document.getElementById('presCountBadge');
  const searchPresSubmissionsInput = document.getElementById('searchPresSubmissionsInput');
  const openSchedulePresModalBtn = document.getElementById('openSchedulePresModalBtn');
  const formSchedulePres = document.getElementById('formSchedulePres');

  // Presentation Tab Switcher
  if (tabStaffPresSubmissionsBtn && tabStaffPresSessionsBtn) {
    tabStaffPresSubmissionsBtn.addEventListener('click', () => {
      tabStaffPresSubmissionsBtn.classList.add('active');
      tabStaffPresSessionsBtn.classList.remove('active');
      if (viewStaffPresSubmissions) viewStaffPresSubmissions.style.display = 'block';
      if (viewStaffPresSessions) viewStaffPresSessions.style.display = 'none';
    });

    tabStaffPresSessionsBtn.addEventListener('click', () => {
      tabStaffPresSessionsBtn.classList.add('active');
      tabStaffPresSubmissionsBtn.classList.remove('active');
      if (viewStaffPresSubmissions) viewStaffPresSubmissions.style.display = 'none';
      if (viewStaffPresSessions) viewStaffPresSessions.style.display = 'block';
    });
  }

  if (searchPresSubmissionsInput) {
    searchPresSubmissionsInput.addEventListener('input', renderStaffPresentations);
  }

  function renderStaffPresentations() {
    const presentations = state.getPresentations();
    if (presCountBadge) presCountBadge.textContent = presentations.length;

    // Collect all student PPT submissions across presentations
    const allSubmissions = [];
    presentations.forEach(p => {
      if (p.submissions && Array.isArray(p.submissions)) {
        p.submissions.forEach(sub => {
          allSubmissions.push({
            ...sub,
            presId: p.id,
            presTitle: p.title,
            presSubject: p.subject
          });
        });
      }
    });

    if (presSubCountBadge) presSubCountBadge.textContent = allSubmissions.length;

    // Render Student Submissions Table
    if (staffPresSubmissionsTableBody) {
      const query = (searchPresSubmissionsInput ? searchPresSubmissionsInput.value.trim().toLowerCase() : '');

      const filtered = allSubmissions.filter(s => {
        if (!query) return true;
        const sName = (s.studentName || '').toLowerCase();
        const sReg = (s.regNo || '').toLowerCase();
        const sTitle = (s.presTitle || '').toLowerCase();
        return sName.includes(query) || sReg.includes(query) || sTitle.includes(query);
      });

      if (filtered.length === 0) {
        staffPresSubmissionsTableBody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align:center; padding:2.5rem 1rem; color:#94A3B8;">
              No student presentation slides uploaded yet. When students submit their PPT decks, they will appear here organized by student name.
            </td>
          </tr>
        `;
      } else {
        staffPresSubmissionsTableBody.innerHTML = filtered.map(s => {
          const initials = (s.studentName || 'ST')
            .split(' ')
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
          const pptName = s.pptFileName || 'Presentation_Slides.pptx';
          const isReviewed = (s.status === 'Reviewed');

          return `
            <tr>
              <td>
                <div class="student-tag">
                  <div class="student-avatar-circle" style="background:linear-gradient(135deg,#F59E0B,#D97706);">${initials}</div>
                  <div>
                    <strong style="color:#0F172A;">${s.studentName}</strong>
                    <div style="font-size:0.74rem; color:#64748B;">ID: ${s.studentId || s.id}</div>
                  </div>
                </div>
              </td>
              <td>
                <span style="font-family:monospace; font-weight:600; color:#475569;">${s.regNo || '2024CS101'}</span>
              </td>
              <td>
                <div style="font-weight:600; color:#1E293B; font-size:0.86rem;">${s.presTitle}</div>
              </td>
              <td style="color:#64748B; font-size:0.82rem;">${s.presSubject}</td>
              <td>
                <div style="display:flex; align-items:center; gap:0.4rem;">
                  <span class="badge-doc ppt">PPT</span>
                  <span style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.82rem; font-weight:500;" title="${pptName}">
                    ${pptName}
                  </span>
                </div>
              </td>
              <td style="color:#64748B; font-size:0.82rem; white-space:nowrap;">${s.uploadedAt || 'Recently'}</td>
              <td>
                <span class="badge-tag ${isReviewed ? 'graded' : 'pending'}">${isReviewed ? 'Reviewed' : 'Submitted'}</span>
              </td>
              <td style="text-align:right; white-space:nowrap;">
                <button type="button" class="btn-staff-primary btn-download-ppt" data-filename="${pptName}" style="padding:0.35rem 0.65rem; font-size:0.76rem;">
                  Download PPT
                </button>
                <button type="button" class="btn-preview-sm btn-preview-ppt" data-filename="${pptName}" data-title="${s.presTitle} — ${s.studentName}" style="margin-left:0.25rem;">
                  Preview
                </button>
              </td>
            </tr>
          `;
        }).join('');

        // Attach download and preview handlers
        staffPresSubmissionsTableBody.querySelectorAll('.btn-download-ppt').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const fname = btn.getAttribute('data-filename');
            state.showToast(`Downloading PowerPoint slides "${fname}"...`, 'success');
          });
        });

        staffPresSubmissionsTableBody.querySelectorAll('.btn-preview-ppt').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const fname = btn.getAttribute('data-filename');
            const title = btn.getAttribute('data-title');
            openDocPreview(fname, 'ppt', title);
          });
        });
      }
    }

    // Render Scheduled Presentation Sessions List
    if (staffPresSessionsContainer) {
      staffPresSessionsContainer.innerHTML = presentations.map(p => {
        const subCount = (p.submissions && p.submissions.length) || 0;
        return `
          <div class="pres-admin-card">
            <div class="pres-admin-header">
              <span class="course-code-tag">${p.courseCode || 'Seminar'}</span>
              <span class="badge-tag graded">${p.scheduledDate}</span>
            </div>
            <h4 class="pres-admin-title">${p.title}</h4>
            <div style="font-size:0.8rem; color:#475569; font-weight:600; margin-bottom:0.35rem;">
              Subject: ${p.subject}
            </div>
            <p class="pres-admin-desc">${p.guidelines || 'Upload PowerPoint slide deck (.pptx) prior to presentation session.'}</p>
            <div class="pres-admin-meta">
              <span>⏱ ${p.durationMinutes || 15} Mins / Presenter • 🕒 ${p.timeSlot || 'Morning'}</span>
              <span style="font-weight:600; color:#059669;">${subCount} PPT Submissions</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  if (openSchedulePresModalBtn) {
    openSchedulePresModalBtn.addEventListener('click', () => {
      openModal('modalSchedulePresentation');
    });
  }

  if (formSchedulePres) {
    formSchedulePres.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('presTitleInput').value.trim();
      const subject = document.getElementById('presSubjectInput').value.trim();
      const scheduledDate = document.getElementById('presDateInput').value.trim();
      const timeSlot = document.getElementById('presTimeInput').value.trim();
      const durationMinutes = document.getElementById('presDurationInput').value;
      const guidelines = document.getElementById('presGuidelinesInput').value.trim();

      const res = state.createPresentation({
        title,
        subject,
        scheduledDate,
        timeSlot,
        durationMinutes,
        guidelines
      });

      if (res.success) {
        state.showToast(`Presentation seminar "${title}" successfully scheduled!`, 'success');
        closeModal('modalSchedulePresentation');
        formSchedulePres.reset();
        renderStaffPresentations();
        updateHeroStats();
      } else {
        state.showToast('Could not schedule presentation.', 'error');
      }
    });
  }

  // ═══════════════════════════════════════════════════
  // 12. PROFILE & PASSWORD MODAL CONTROLLERS
  // ═══════════════════════════════════════════════════
  const updateProfileBtn = document.getElementById('updateProfileBtn');
  const formProfile = document.getElementById('formProfile');
  const profileNameInput = document.getElementById('profileNameInput');
  const profileEmailInput = document.getElementById('profileEmailInput');
  const profileDeptInput = document.getElementById('profileDeptInput');

  if (updateProfileBtn) {
    updateProfileBtn.addEventListener('click', () => {
      const session = state.getSession() || staff;
      if (profileNameInput) profileNameInput.value = session.name;
      if (profileEmailInput) profileEmailInput.value = session.email || '';
      if (profileDeptInput) profileDeptInput.value = session.department || '';
      openModal('modalProfile');
    });
  }

  if (formProfile) {
    formProfile.addEventListener('submit', (e) => {
      e.preventDefault();
      const session = state.getSession() || staff;
      const name = profileNameInput.value.trim();
      const email = profileEmailInput.value.trim();
      const dept = profileDeptInput.value.trim();

      const res = state.updateUserProfile(session.id, {
        name,
        email,
        department: dept
      });

      if (res.success) {
        state.showToast('Faculty profile updated successfully!', 'success');
        closeModal('modalProfile');
        updateStaffProfileUI();
      } else {
        state.showToast(res.message || 'Error updating profile', 'error');
      }
    });
  }

  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const formPassword = document.getElementById('formPassword');

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => openModal('modalPassword'));
  }

  if (formPassword) {
    formPassword.addEventListener('submit', (e) => {
      e.preventDefault();
      const session = state.getSession() || staff;
      const oldPass = document.getElementById('oldPasswordInput').value;
      const newPass = document.getElementById('newPasswordInput').value;
      const confPass = document.getElementById('confirmPasswordInput').value;

      if (newPass !== confPass) {
        state.showToast('New passwords do not match.', 'error');
        return;
      }

      const res = state.changeUserPassword(session.id, oldPass, newPass);
      if (res.success) {
        state.showToast('Password changed successfully!', 'success');
        closeModal('modalPassword');
        formPassword.reset();
      } else {
        state.showToast(res.message || 'Error changing password', 'error');
      }
    });
  }

  const navSupportBtn = document.getElementById('navSupportBtn');
  if (navSupportBtn) {
    navSupportBtn.addEventListener('click', () => openModal('modalSupport'));
  }

  // Initial View Rendering
  updateHeroStats();
  renderStaffCourses();
  renderStaffSubmissions();
  renderStaffTestsList();
  renderStaffPresentations();

})();
