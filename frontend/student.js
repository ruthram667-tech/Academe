// Academe — Student Portal Controller (CodeTantra-Inspired Design)
(function () {
  'use strict';

  const state = window.PortalState;
  if (!state) {
    console.error('PortalState is not loaded.');
    return;
  }

  // 1. Session & Role Verification
  const student = state.requireAuth(['student']);
  if (!student) return;

  // 2. Populate Navbar and Profile Information
  function updateProfileDisplay() {
    const session = state.getSession() || student;
    const initials = session.avatar || (session.name || 'ST')
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const navAvatar = document.getElementById('navAvatar');
    const navName = document.getElementById('navStudentName');
    const dropName = document.getElementById('dropdownName');
    const dropEmail = document.getElementById('dropdownEmail');

    if (navAvatar) navAvatar.textContent = initials;
    if (navName) navName.textContent = session.name;
    if (dropName) dropName.textContent = session.name;
    if (dropEmail) dropEmail.textContent = session.email || `${(session.regNo || 'student').toLowerCase()}@student.academe.edu`;
  }

  updateProfileDisplay();

  // 3. Profile Dropdown Toggle & Outside Click
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
    state.showToast('Logging out...', 'info');
    setTimeout(() => {
      state.logout();
    }, 350);
  }

  const logoutBtn = document.getElementById('logoutBtn');
  const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (dropdownLogoutBtn) dropdownLogoutBtn.addEventListener('click', handleLogout);

  // 5. Generic Modal Controller
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
    // Restore overflow only if no other modals are open
    if (!document.querySelector('.modal-backdrop.active')) {
      document.body.style.overflow = '';
    }
  }

  // Attach data-close handlers
  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetModalId = btn.getAttribute('data-close');
      closeModal(targetModalId);
    });
  });

  // Close modals when clicking the backdrop outside modal-box
  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal(backdrop.id);
      }
    });
  });

  // Close active modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal-backdrop.active');
      if (activeModal) closeModal(activeModal.id);
    }
  });

  // 6. Action Cards Click Handlers & Tab Routing
  const navItems = document.querySelectorAll('.nav-item');
  const contentSections = document.querySelectorAll('.content-section');

  function switchToTab(targetId) {
    // Update nav active states
    navItems.forEach(nav => {
      nav.classList.toggle('active', nav.getAttribute('data-target') === targetId);
    });

    // Update section active states
    contentSections.forEach(section => {
      section.classList.toggle('active', section.id === targetId);
    });

    // Trigger rendering
    if (targetId === 'section-course') renderCoursesList();
    if (targetId === 'section-test') {
      if (typeof currentTestFilter === 'undefined') window.currentTestFilter = 'ongoing';
      renderTestsList(window.currentTestFilter || 'ongoing');
    }
    if (targetId === 'section-presentation') renderPresentationsList();
  }

  // Bind Sidebar Nav Items
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.getAttribute('data-target');
      if (targetId) switchToTab(targetId);
    });
  });

  // Bind Overview Cards
  const btnCourses = document.getElementById('btnCourses');
  const cardCourses = document.getElementById('cardCourses');
  [btnCourses, cardCourses].forEach(el => {
    if (el) el.addEventListener('click', () => switchToTab('section-course'));
  });

  const btnTests = document.getElementById('btnTests');
  const cardTests = document.getElementById('cardTests');
  window.currentTestFilter = 'ongoing'; // global scope for filtering
  [btnTests, cardTests].forEach(el => {
    if (el) el.addEventListener('click', () => switchToTab('section-test'));
  });

  const btnPresentations = document.getElementById('btnPresentations');
  const cardPresentations = document.getElementById('cardPresentations');
  [btnPresentations, cardPresentations].forEach(el => {
    if (el) el.addEventListener('click', () => switchToTab('section-presentation'));
  });

  // 7. Courses & Lecture Notes Viewer Workflow
  function renderCoursesList() {
    const container = document.getElementById('coursesListContainer');
    if (!container) return;

    const courses = state.getCourses();
    container.innerHTML = '';

    if (!courses || courses.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding:2rem; color:#64748B;">No courses currently enrolled.</div>';
      return;
    }

    courses.forEach((course) => {
      const card = document.createElement('div');
      card.className = 'modal-item-card course-accordion-item';

      const notesCount = (course.notes && course.notes.length) || 0;
      let notesHtml = '';

      if (notesCount > 0) {
        notesHtml = course.notes.map(note => `
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:0.85rem; margin-top:0.65rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem;">
              <div>
                <div style="font-weight:600; font-size:0.88rem; color:#1E293B;">${note.title}</div>
                <div style="font-size:0.76rem; color:#64748B; margin-top:0.2rem;">
                  <span class="badge-tag active" style="font-size:0.7rem; padding:0.15rem 0.45rem;">${note.topic}</span>
                  • Uploaded ${note.uploadedAt} by <strong>${note.uploadedBy || course.instructor}</strong>
                </div>
                ${note.description ? `<p style="font-size:0.8rem; color:#475569; margin-top:0.35rem; line-height:1.4;">${note.description}</p>` : ''}
              </div>
              <button type="button" class="btn-modal-primary btn-download-note" style="padding:0.35rem 0.75rem; font-size:0.76rem;" data-file="${note.fileName}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>${note.fileName}</span>
              </button>
            </div>
          </div>
        `).join('');
      } else {
        notesHtml = '<div style="font-size:0.82rem; color:#94A3B8; padding:0.5rem 0;">No study notes uploaded yet for this subject.</div>';
      }

      card.innerHTML = `
        <div class="modal-item-header" style="cursor:pointer;" onclick="this.parentElement.classList.toggle('expanded')">
          <div>
            <div class="modal-item-title" style="display:flex; align-items:center; gap:0.5rem;">
              <span>${course.code}: ${course.name}</span>
            </div>
            <div class="modal-item-meta" style="margin-top:0.25rem;">
              <span>👨‍🏫 ${course.instructor}</span>
              <span>📚 ${course.credits} Credits</span>
              <span>🏛️ ${course.department}</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span class="badge-tag active">${notesCount} Note${notesCount === 1 ? '' : 's'}</span>
            <span style="font-size:1.1rem; color:#94A3B8;">▾</span>
          </div>
        </div>

        <p style="font-size:0.82rem; color:#475569; margin:0.5rem 0 0.75rem;">
          ${course.description || 'Subject coursework and lecture study materials.'}
        </p>

        <div class="course-notes-section" style="border-top:1px dashed #CBD5E1; padding-top:0.75rem;">
          <div style="font-size:0.8rem; font-weight:700; color:#334155; text-transform:uppercase; letter-spacing:0.04em;">
            Teacher's Notes &amp; Lecture Materials:
          </div>
          ${notesHtml}
        </div>
      `;

      container.appendChild(card);
    });

    // Attach click listeners to download buttons
    container.querySelectorAll('.btn-download-note').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fileName = btn.getAttribute('data-file');
        state.showToast(`Downloading study material: ${fileName}`, 'success');
      });
    });
  }

  // 8. Tests Tabs & PDF Upload Workflow
  const tabOngoingTestsBtn = document.getElementById('tabOngoingTestsBtn');
  const tabUpcomingTestsBtn = document.getElementById('tabUpcomingTestsBtn');

  if (tabOngoingTestsBtn && tabUpcomingTestsBtn) {
    tabOngoingTestsBtn.addEventListener('click', () => {
      currentTestFilter = 'ongoing';
      tabOngoingTestsBtn.style.background = '#F1F5F9';
      tabOngoingTestsBtn.style.borderColor = '#CBD5E1';
      tabUpcomingTestsBtn.style.background = 'transparent';
      tabUpcomingTestsBtn.style.borderColor = 'transparent';
      renderTestsList('ongoing');
    });

    tabUpcomingTestsBtn.addEventListener('click', () => {
      currentTestFilter = 'upcoming';
      tabUpcomingTestsBtn.style.background = '#F1F5F9';
      tabUpcomingTestsBtn.style.borderColor = '#CBD5E1';
      tabOngoingTestsBtn.style.background = 'transparent';
      tabOngoingTestsBtn.style.borderColor = 'transparent';
      renderTestsList('upcoming');
    });
  }

  let targetTestForUpload = null;
  let selectedFileObject = null;

  function renderTestsList(filter = 'ongoing') {
    const container = document.getElementById('testsListContainer');
    if (!container) return;

    const allTests = state.getTests();
    const currentSession = state.getSession() || student;
    const studentSubs = state.getStudentSubmissions(currentSession.id);

    // Filter tests by status
    const tests = allTests.filter(t => {
      if (filter === 'upcoming') {
        return t.status === 'upcoming' || t.isUpcoming;
      } else {
        return t.status !== 'upcoming' && !t.isUpcoming;
      }
    });

    container.innerHTML = '';

    if (!tests || tests.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:2rem; color:#64748B;">No ${filter} assessments found.</div>`;
      return;
    }

    tests.forEach((t) => {
      const userSub = studentSubs.find(s => s.testId === t.id);
      const card = document.createElement('div');
      card.className = 'modal-item-card';

      let statusBadge = '<span class="badge-tag pending">Not Submitted</span>';
      let actionBtnText = 'Upload Solution PDF';
      let fileDetailsHtml = '';

      if (userSub) {
        if (userSub.status === 'graded') {
          statusBadge = `<span class="badge-tag graded">Graded: ${userSub.score} / ${userSub.maxScore}</span>`;
          actionBtnText = 'Re-upload Solution PDF';
        } else {
          statusBadge = '<span class="badge-tag pending">Submitted • Under Faculty Review</span>';
          actionBtnText = 'Replace PDF';
        }

        const fileName = userSub.fileName || 'Solution.pdf';
        const fileSize = userSub.fileSize || '1.8 MB';
        fileDetailsHtml = `
          <div class="file-preview-card" style="margin-bottom:0.75rem; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:0.6rem;">
            <div class="file-preview-info">
              <div class="file-preview-icon" style="background:#EF4444; color:#fff; font-weight:700; font-size:0.75rem; padding:0.35rem 0.5rem; border-radius:6px;">PDF</div>
              <div style="margin-left:0.65rem;">
                <div class="file-preview-name" style="font-weight:600; font-size:0.85rem; color:#1E293B;">${fileName}</div>
                <div class="file-preview-size" style="font-size:0.75rem; color:#64748B;">${fileSize} • Uploaded ${userSub.submittedAt}</div>
              </div>
            </div>
            ${userSub.status === 'graded' && userSub.feedback ? `
              <div style="font-size:0.78rem; color:#047857; background:#D1FAE5; padding:0.3rem 0.6rem; border-radius:6px; margin-top:0.4rem;">
                Faculty Feedback: "${userSub.feedback}"
              </div>
            ` : ''}
          </div>
        `;
      }

      // Format questions / prompt
      const promptText = t.instructions || (t.questions && t.questions.length > 0
        ? t.questions.map((q, i) => `Q${i + 1}: ${q.prompt}`).join(' | ')
        : 'Prepare and upload your analytical solution document in PDF format.');

      card.innerHTML = `
        <div class="modal-item-header">
          <div>
            <div class="modal-item-title">${t.title}</div>
            <div class="modal-item-meta">
              <span>Code: <strong>${t.code}</strong></span>
              <span>Total Marks: <strong>${t.totalMarks}</strong></span>
              <span>📅 Due: <strong>${t.dueDate}</strong></span>
              <span>🏛️ ${t.department}</span>
            </div>
          </div>
          <div>${filter === 'upcoming' ? '<span class="badge-tag active">Scheduled</span>' : statusBadge}</div>
        </div>

        <div class="modal-item-prompt" style="background:#F1F5F9; border-left:3px solid #10B981; padding:0.65rem 0.85rem; border-radius:4px; font-size:0.83rem; margin:0.75rem 0;">
          <strong>Instructions / Question:</strong> ${promptText}
        </div>

        ${fileDetailsHtml}

        ${filter === 'ongoing' ? `
          <div style="display:flex; justify-content:flex-end; margin-top:0.75rem;">
            <button type="button" class="btn-modal-accent btn-open-upload" data-test-id="${t.id}" style="padding:0.5rem 1.1rem; font-size:0.84rem; display:inline-flex; align-items:center; gap:0.4rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>${actionBtnText}</span>
            </button>
          </div>
        ` : `
          <div style="font-size:0.78rem; color:#64748B; font-style:italic; margin-top:0.5rem;">
            * PDF submission portal will automatically activate on examination date.
          </div>
        `}
      `;

      container.appendChild(card);
    });

    // Attach click listeners to upload buttons
    container.querySelectorAll('.btn-open-upload').forEach(btn => {
      btn.addEventListener('click', () => {
        const testId = btn.getAttribute('data-test-id');
        openUploadModal(testId);
      });
    });
  }

  function openUploadModal(testId) {
    const test = state.getTestById(testId);
    if (!test) return;

    targetTestForUpload = test;
    selectedFileObject = null;

    document.getElementById('uploadModalTitle').textContent = `Upload Solution PDF: ${test.code}`;
    document.getElementById('uploadModalSubtitle').textContent = test.title;
    
    const promptEl = document.getElementById('uploadQuestionPrompt');
    if (promptEl) {
      promptEl.innerHTML = `<strong>Exam Instructions:</strong> ${test.instructions || (test.questions && test.questions[0] ? test.questions[0].prompt : 'Upload technical solutions in PDF format.')}`;
    }

    const preview = document.getElementById('filePreviewCard');
    if (preview) preview.style.display = 'none';
    const dropzone = document.getElementById('fileDropzone');
    if (dropzone) dropzone.style.display = 'block';
    const remarks = document.getElementById('uploadRemarks');
    if (remarks) remarks.value = '';

    openModal('modalUploadDocument');
  }

  // File Dropzone interactions for Test PDF
  const dropzone = document.getElementById('fileDropzone');
  const fileInput = document.getElementById('fileInputHidden');
  const previewCard = document.getElementById('filePreviewCard');
  const previewFileName = document.getElementById('previewFileName');
  const previewFileSize = document.getElementById('previewFileSize');
  const previewIcon = document.getElementById('previewIcon');
  const btnRemoveFile = document.getElementById('btnRemoveFile');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

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
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        handleFileSelect(fileInput.files[0]);
      }
    });
  }

  function handleFileSelect(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf') {
      state.showToast('Please select a valid PDF document.', 'warning');
      return;
    }

    selectedFileObject = file;
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    if (previewFileName) previewFileName.textContent = file.name;
    if (previewFileSize) previewFileSize.textContent = sizeStr;
    if (previewIcon) previewIcon.textContent = 'PDF';

    if (dropzone) dropzone.style.display = 'none';
    if (previewCard) previewCard.style.display = 'flex';
  }

  if (btnRemoveFile) {
    btnRemoveFile.addEventListener('click', () => {
      selectedFileObject = null;
      if (fileInput) fileInput.value = '';
      if (dropzone) dropzone.style.display = 'block';
      if (previewCard) previewCard.style.display = 'none';
    });
  }

  // Handle Form Submission for PDF Upload
  const uploadDocForm = document.getElementById('uploadDocForm');
  if (uploadDocForm) {
    uploadDocForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!targetTestForUpload) {
        state.showToast('No assessment selected.', 'error');
        return;
      }

      const fileName = selectedFileObject ? selectedFileObject.name : `${student.name.replace(/\s+/g, '_')}_${targetTestForUpload.code}_Solution.pdf`;
      const fileSize = selectedFileObject ? `${(selectedFileObject.size / (1024 * 1024)).toFixed(1)} MB` : '2.1 MB';
      const remarks = document.getElementById('uploadRemarks').value.trim();

      const res = state.uploadTestPDF(targetTestForUpload.id, {
        fileName: fileName,
        fileSize: fileSize,
        fileType: 'application/pdf',
        summary: remarks || 'Student solution document uploaded.'
      });

      if (res && res.success) {
        state.showToast(`Solution PDF uploaded successfully for ${targetTestForUpload.code}!`, 'success');
        closeModal('modalUploadDocument');
        renderTestsList(currentTestFilter);
      } else {
        state.showToast(res ? res.message : 'Submission failed', 'error');
      }
    });
  }

  // 9. Presentations & PPT Upload Workflow
  let targetPresentationForUpload = null;
  let selectedPPTFileObject = null;

  function renderPresentationsList() {
    const container = document.getElementById('presentationsListContainer');
    if (!container) return;

    const presentations = state.getPresentations();
    const currentSession = state.getSession() || student;
    container.innerHTML = '';

    if (!presentations || presentations.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding:2rem; color:#64748B;">No presentations currently scheduled.</div>';
      return;
    }

    presentations.forEach((pres) => {
      const card = document.createElement('div');
      card.className = 'modal-item-card';

      const userSub = (pres.submissions || []).find(s => s.studentId === currentSession.id);
      let statusBadge = '<span class="badge-tag pending">Slides Not Uploaded</span>';
      let actionBtnText = 'Upload Presentation Slides (.pptx)';
      let fileDetailsHtml = '';

      if (userSub) {
        statusBadge = '<span class="badge-tag graded">Slides Submitted</span>';
        actionBtnText = 'Re-upload Presentation Slides';
        fileDetailsHtml = `
          <div class="file-preview-card" style="margin-bottom:0.75rem; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:0.6rem;">
            <div class="file-preview-info">
              <div class="file-preview-icon" style="background:#D97706; color:#fff; font-weight:700; font-size:0.75rem; padding:0.35rem 0.5rem; border-radius:6px;">PPT</div>
              <div style="margin-left:0.65rem;">
                <div class="file-preview-name" style="font-weight:600; font-size:0.85rem; color:#1E293B;">${userSub.pptFileName}</div>
                <div class="file-preview-size" style="font-size:0.75rem; color:#64748B;">${userSub.pptFileSize || '4.0 MB'} • Submitted ${userSub.uploadedAt}</div>
              </div>
            </div>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="modal-item-header">
          <div>
            <div class="modal-item-title">${pres.title}</div>
            <div class="modal-item-meta">
              <span>📚 <strong>${pres.subject}</strong></span>
              <span>📅 <strong>${pres.scheduledDate}</strong> (${pres.timeSlot || 'Morning Session'})</span>
              <span>⏱️ Duration: <strong>${pres.durationMinutes || 15} mins</strong></span>
              <span>👨‍🏫 ${pres.instructor}</span>
            </div>
          </div>
          <div>${statusBadge}</div>
        </div>

        <div class="modal-item-prompt" style="background:#FFFBEB; border-left:3px solid #F59E0B; padding:0.65rem 0.85rem; border-radius:4px; font-size:0.83rem; margin:0.75rem 0;">
          <strong>Seminar Guidelines:</strong> ${pres.guidelines || 'Prepare a comprehensive slide presentation in PowerPoint or PDF format.'}
        </div>

        ${fileDetailsHtml}

        <div style="display:flex; justify-content:flex-end; margin-top:0.75rem;">
          <button type="button" class="btn-modal-accent btn-open-upload-ppt" data-pres-id="${pres.id}" style="padding:0.5rem 1.1rem; font-size:0.84rem; display:inline-flex; align-items:center; gap:0.4rem; background:#D97706; border-color:#D97706;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <span>${actionBtnText}</span>
          </button>
        </div>
      `;

      container.appendChild(card);
    });

    // Attach click listeners to PPT upload buttons
    container.querySelectorAll('.btn-open-upload-ppt').forEach(btn => {
      btn.addEventListener('click', () => {
        const presId = btn.getAttribute('data-pres-id');
        openUploadPPTModal(presId);
      });
    });
  }

  function openUploadPPTModal(presId) {
    const pres = state.getPresentationById(presId);
    if (!pres) return;

    targetPresentationForUpload = pres;
    selectedPPTFileObject = null;

    document.getElementById('uploadPPTModalTitle').textContent = `Upload Slides: ${pres.title}`;
    document.getElementById('uploadPPTModalSubtitle').textContent = `${pres.subject} • Scheduled: ${pres.scheduledDate}`;
    
    const guidelinesEl = document.getElementById('uploadPPTGuidelines');
    if (guidelinesEl) {
      guidelinesEl.innerHTML = `<strong>Guidelines:</strong> ${pres.guidelines || 'Upload PowerPoint slide deck (.pptx or .pdf) for your seminar.'}`;
    }

    const preview = document.getElementById('filePreviewCardPPT');
    if (preview) preview.style.display = 'none';
    const dropzone = document.getElementById('fileDropzonePPT');
    if (dropzone) dropzone.style.display = 'block';

    openModal('modalUploadPPT');
  }

  // Dropzone interactions for Presentation PPT
  const dropzonePPT = document.getElementById('fileDropzonePPT');
  const fileInputPPT = document.getElementById('fileInputPPTHidden');
  const previewCardPPT = document.getElementById('filePreviewCardPPT');
  const previewFileNamePPT = document.getElementById('previewFileNamePPT');
  const previewFileSizePPT = document.getElementById('previewFileSizePPT');
  const previewIconPPT = document.getElementById('previewIconPPT');
  const btnRemoveFilePPT = document.getElementById('btnRemoveFilePPT');

  if (dropzonePPT && fileInputPPT) {
    dropzonePPT.addEventListener('click', () => fileInputPPT.click());

    dropzonePPT.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzonePPT.classList.add('dragover');
    });

    dropzonePPT.addEventListener('dragleave', () => {
      dropzonePPT.classList.remove('dragover');
    });

    dropzonePPT.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzonePPT.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handlePPTFileSelect(e.dataTransfer.files[0]);
      }
    });

    fileInputPPT.addEventListener('change', () => {
      if (fileInputPPT.files && fileInputPPT.files.length > 0) {
        handlePPTFileSelect(fileInputPPT.files[0]);
      }
    });
  }

  function handlePPTFileSelect(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['ppt', 'pptx', 'pdf'].includes(ext)) {
      state.showToast('Please select a valid PowerPoint (.pptx, .ppt) or PDF slide deck.', 'warning');
      return;
    }

    selectedPPTFileObject = file;
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    if (previewFileNamePPT) previewFileNamePPT.textContent = file.name;
    if (previewFileSizePPT) previewFileSizePPT.textContent = sizeStr;
    if (previewIconPPT) previewIconPPT.textContent = ext.toUpperCase().slice(0, 3);

    if (dropzonePPT) dropzonePPT.style.display = 'none';
    if (previewCardPPT) previewCardPPT.style.display = 'flex';
  }

  if (btnRemoveFilePPT) {
    btnRemoveFilePPT.addEventListener('click', () => {
      selectedPPTFileObject = null;
      if (fileInputPPT) fileInputPPT.value = '';
      if (dropzonePPT) dropzonePPT.style.display = 'block';
      if (previewCardPPT) previewCardPPT.style.display = 'none';
    });
  }

  // Handle Form Submission for PPT Upload
  const uploadPPTForm = document.getElementById('uploadPPTForm');
  if (uploadPPTForm) {
    uploadPPTForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!targetPresentationForUpload) {
        state.showToast('No presentation selected.', 'error');
        return;
      }

      const fileName = selectedPPTFileObject ? selectedPPTFileObject.name : `${student.name.replace(/\s+/g, '_')}_${targetPresentationForUpload.courseCode}_Presentation.pptx`;
      const fileSize = selectedPPTFileObject ? `${(selectedPPTFileObject.size / (1024 * 1024)).toFixed(1)} MB` : '4.5 MB';

      const res = state.uploadPresentationPPT(targetPresentationForUpload.id, {
        fileName: fileName,
        fileSize: fileSize
      });

      if (res && res.success) {
        state.showToast(`Presentation slides uploaded successfully for "${targetPresentationForUpload.title}"!`, 'success');
        closeModal('modalUploadPPT');
        renderPresentationsList();
      } else {
        state.showToast(res ? res.message : 'Upload failed', 'error');
      }
    });
  }

  // 10. Help Center FAQ Accordions & Support Form
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const parent = q.parentElement;
      parent.classList.toggle('open');
    });
  });

  const supportForm = document.getElementById('supportTicketForm');
  if (supportForm) {
    supportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const cat = document.getElementById('supportCategory').value;
      state.showToast(`Support ticket created for "${cat}". Reference: #TK-${Math.floor(1000 + Math.random() * 9000)}`, 'success');
      supportForm.reset();
      closeModal('modalHelp');
    });
  }

  // 11. Profile Update Form
  const updateProfileBtn = document.getElementById('updateProfileBtn');
  const updateProfileForm = document.getElementById('updateProfileForm');
  const profileNameInput = document.getElementById('profileInputName');
  const profileRegInput = document.getElementById('profileInputReg');
  const profileEmailInput = document.getElementById('profileInputEmail');
  const profileDeptInput = document.getElementById('profileInputDept');

  if (updateProfileBtn) {
    updateProfileBtn.addEventListener('click', () => {
      profileDropdown.classList.remove('open');
      const current = state.getSession() || student;
      if (profileNameInput) profileNameInput.value = current.name || '';
      if (profileRegInput) profileRegInput.value = current.regNo || '2024CS101';
      if (profileEmailInput) profileEmailInput.value = current.email || `${current.regNo.toLowerCase()}@student.academe.edu`;
      if (profileDeptInput) profileDeptInput.value = current.department || 'Computer Science';
      openModal('modalProfile');
    });
  }

  if (updateProfileForm) {
    updateProfileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const current = state.getSession() || student;
      const updatedData = {
        name: profileNameInput.value.trim(),
        email: profileEmailInput.value.trim(),
        department: profileDeptInput.value.trim()
      };

      const res = state.updateUserProfile(current.id, updatedData);
      if (res && res.success) {
        state.showToast('Profile updated successfully!', 'success');
        updateProfileDisplay();
        closeModal('modalProfile');
      } else {
        state.showToast(res ? res.message : 'Failed to update profile.', 'error');
      }
    });
  }

  // 12. Change Password Form
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const changePasswordForm = document.getElementById('changePasswordForm');
  const currentPassInput = document.getElementById('currentPassInput');
  const newPassInput = document.getElementById('newPassInput');
  const confirmPassInput = document.getElementById('confirmPassInput');

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
      profileDropdown.classList.remove('open');
      if (changePasswordForm) changePasswordForm.reset();
      openModal('modalPassword');
    });
  }

  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const current = state.getSession() || student;
      const oldPass = currentPassInput.value;
      const newPass = newPassInput.value;
      const confirmPass = confirmPassInput.value;

      if (newPass !== confirmPass) {
        state.showToast('New passwords do not match.', 'error');
        return;
      }

      if (newPass.length < 6) {
        state.showToast('New password must be at least 6 characters.', 'warning');
        return;
      }

      const res = state.changeUserPassword(current.id, oldPass, newPass);
      if (res && res.success) {
        state.showToast('Password changed successfully!', 'success');
        changePasswordForm.reset();
        closeModal('modalPassword');
      } else {
        state.showToast(res ? res.message : 'Password update failed.', 'error');
      }
    });
  }

  // 13. Policy Link Toasts
  const policyLinks = ['linkPrivacy', 'linkTerms', 'linkContact'];
  policyLinks.forEach(id => {
    const link = document.getElementById(id);
    if (link) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        state.showToast(`${link.textContent} documentation will open in university handbook.`, 'info');
      });
    }
  });

})();
