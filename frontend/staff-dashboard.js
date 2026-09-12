(function () {
  'use strict';

  // 1. Session & Auth Check
  const state = window.PortalState;
  if (!state) return;
  const staffSession = state.requireAuth(['staff', 'superadmin']);
  if (!staffSession) return;

  // 2. Populate Header
  const displayUsername = document.getElementById('displayUsername');
  if (displayUsername) {
    displayUsername.textContent = staffSession.name || staffSession.username || 'Staff Member';
  }

  // 3. Logout Handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (state.logout) state.logout();
      else if (state.clearSession) {
        state.clearSession();
        window.location.replace('login.html');
      }
    });
  }

  // 4. Tab Switching
  const navItems = document.querySelectorAll('.nav-item');
  const contentSections = document.querySelectorAll('.content-section');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      contentSections.forEach(section => section.classList.remove('active'));
      const targetId = item.getAttribute('data-target');
      if (targetId) {
        const targetSection = document.getElementById(targetId);
        if (targetSection) targetSection.classList.add('active');
      }
    });
  });

  // Modal helpers
  function openModal(id) { document.getElementById(id)?.classList.add('active'); }
  function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

  // 4b. Initialize Wireframe Classes if Empty
  function ensureInitialAssignments() {
    let assignments = state.getStaffAssignments(staffSession.id);
    if (assignments.length === 0) {
      const allClasses = state.getClasses() || [];
      allClasses.forEach(cls => {
        state.assignStaffClass(staffSession.id, cls.id);
      });
    }
  }

  // 5. Render Classes (Home View Wireframe Cards)
  function renderClasses() {
    const container = document.getElementById('staffClassesGrid');
    if (!container) return;
    container.innerHTML = '';

    const assignments = state.getStaffAssignments(staffSession.id) || [];
    
    assignments.forEach(asgn => {
      const cls = state.getClassById(asgn.classId) || {};
      const className = cls.name || asgn.className || 'Class Section';
      const section = cls.section || asgn.section || 'A';
      const department = cls.department || asgn.department || 'Computer Science';
      const courses = asgn.courses || [];

      let coursesListHtml = '';
      if (courses.length > 0) {
        coursesListHtml = courses.map(c => `
          <div class="course-item-tag">
            <span><strong style="color:#fbbf24;">${c.code}</strong> - ${c.title}</span>
            <i class="fa-solid fa-book-open" style="color:var(--text-dim); font-size:0.75rem;"></i>
          </div>
        `).join('');
      } else {
        coursesListHtml = `<span style="color:var(--text-dim); font-size:0.8rem; font-style:italic;">No course assigned yet. Click "+ Add Course" below.</span>`;
      }

      const card = document.createElement('div');
      card.className = 'class-card';
      card.innerHTML = `
        <div>
          <div class="class-card-header">
            <h3 class="class-card-title">${className}</h3>
            <span class="class-card-sec-badge">Sec ${section}</span>
          </div>
          <div class="class-card-dept">
            <i class="fa-solid fa-building-columns" style="font-size:0.8rem; margin-right:0.3rem;"></i> ${department}
          </div>
          <div class="class-courses-list">
            <div class="class-courses-header">
              <span>Courses Taught</span>
              <span>${courses.length} Active</span>
            </div>
            ${coursesListHtml}
          </div>
        </div>
        <div class="class-card-actions">
          <button type="button" class="btn-card-add-course btn-open-add-course-modal" data-class-id="${asgn.classId}" data-class-name="${className}">
            <i class="fa-solid fa-plus"></i> Add Course
          </button>
          <button type="button" class="btn-card-remove-class btn-remove-class-assignment" data-class-id="${asgn.classId}" data-class-name="${className}" title="Remove class from dashboard">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;
      container.appendChild(card);
    });

    // Append the "+ Add Class" dashed action card directly matching the user's wireframe
    const addCard = document.createElement('div');
    addCard.className = 'class-card-add-new';
    addCard.id = 'cardAddNewClassTrigger';
    addCard.innerHTML = `
      <i class="fa-solid fa-circle-plus"></i>
      <div style="font-weight:600; font-size:1.15rem; color:#fff;">+ Add Class</div>
      <div style="font-size:0.82rem; color:var(--text-muted);">Enroll in another class or section</div>
    `;
    container.appendChild(addCard);

    // Event listeners for Add Course on each card
    container.querySelectorAll('.btn-open-add-course-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const classId = btn.getAttribute('data-class-id');
        const className = btn.getAttribute('data-class-name');
        openAddCourseToClassModal(classId, className);
      });
    });

    // Event listeners for Remove Class
    container.querySelectorAll('.btn-remove-class-assignment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const classId = btn.getAttribute('data-class-id');
        const className = btn.getAttribute('data-class-name');
        if (confirm(`Are you sure you want to remove ${className} from your dashboard?`)) {
          state.removeStaffClass(staffSession.id, classId);
          state.showToast(`Removed ${className} from your classes.`, 'info');
          renderClasses();
        }
      });
    });

    // Add Class trigger on the card
    document.getElementById('cardAddNewClassTrigger')?.addEventListener('click', () => {
      openAddClassModal();
    });
  }

  // 6. Render Courses
  function renderCourses() {
    const tableBody = document.getElementById('staffCourseTableBody');
    if (!tableBody) return;
    const courses = state.getCourses() || [];
    tableBody.innerHTML = '';
    
    // populate dropdown for upload material modal
    const courseSelect = document.getElementById('materialCourseSelect');
    if (courseSelect) {
      courseSelect.innerHTML = '<option value="">Select a Course</option>';
      courses.forEach(c => {
        courseSelect.innerHTML += `<option value="${c.id}">${c.code} - ${c.name || c.title}</option>`;
      });
    }

    if (courses.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" style="padding:1.5rem; text-align:center; color:var(--text-muted);">No courses registered yet. Add a course to any class above to get started.</td></tr>`;
      return;
    }

    courses.forEach(c => {
      tableBody.innerHTML += `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 1rem;"><strong>${c.code}</strong><br><span style="font-size:0.8rem; color:var(--text-muted);">${c.name || c.title}</span></td>
          <td style="padding: 1rem;">${c.department || 'Computer Science'}</td>
          <td style="padding: 1rem;">${c.credits || 3}</td>
          <td style="padding: 1rem;"><span class="badge-tag active">${(c.notes||[]).length} Materials</span></td>
        </tr>
      `;
    });
  }

  // 6. Render Tests
  function renderTests() {
    const tableBody = document.getElementById('staffTestTableBody');
    if (!tableBody) return;
    const tests = state.getTests() || [];
    const submissions = state.getSubmissions() || [];
    tableBody.innerHTML = '';

    if (tests.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="3" style="padding:1rem; text-align:center; color:var(--text-muted);">No tests created.</td></tr>`;
      return;
    }

    tests.forEach(t => {
      const subs = submissions.filter(s => s.testId === t.id);
      const graded = subs.filter(s => s.status === 'graded').length;
      
      let subHtml = `<div style="font-size:0.85rem; margin-bottom:0.5rem;">${subs.length} Total Submissions (${graded} Graded)</div>`;
      if (subs.length > 0) {
        subHtml += `<ul style="list-style:none; padding:0; margin:0; font-size:0.8rem; background:rgba(0,0,0,0.2); padding:0.5rem; border-radius:6px; max-height:150px; overflow-y:auto;">`;
        subs.forEach(s => {
           const isGraded = s.status === 'graded';
           subHtml += `
            <li style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem; padding-bottom:0.25rem; border-bottom:1px solid rgba(255,255,255,0.05);">
              <span>${s.studentName} (${s.regNo})</span>
              <div style="display:flex; gap:0.5rem; align-items:center;">
                <button class="btn-view-doc" data-fileurl="${s.fileUrl || s.fileData || '#'}" data-filename="${s.fileName}" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:white; padding:0.2rem 0.5rem; border-radius:4px; cursor:pointer; font-size:0.75rem;" title="View PDF"><i class="fa-solid fa-eye"></i> View</button>
                <button class="btn-download-doc" data-fileurl="${s.fileUrl || s.fileData || '#'}" data-filename="${s.fileName}" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:white; padding:0.2rem 0.5rem; border-radius:4px; cursor:pointer; font-size:0.75rem;" title="Download PDF"><i class="fa-solid fa-download"></i></button>
                ${isGraded 
                   ? `<span style="color:#10b981;">Score: ${s.score}/${s.maxScore}</span>`
                   : `<button class="btn-grade-sub" data-subid="${s.id}" data-testid="${t.id}" data-studentid="${s.studentId}" data-filename="${s.fileName}" style="background:#3b82f6; border:none; color:white; padding:0.2rem 0.5rem; border-radius:4px; cursor:pointer; font-size:0.75rem;">Grade</button>`
                }
              </div>
            </li>
           `;
        });
        subHtml += `</ul>`;
      } else {
        subHtml += `<span style="color:var(--text-muted); font-size:0.8rem;">No submissions yet.</span>`;
      }

      tableBody.innerHTML += `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 1rem; vertical-align:top;"><strong>${t.code}</strong><br><span style="font-size:0.8rem; color:var(--text-muted);">${t.title}</span><br><span class="badge-tag">${t.status}</span></td>
          <td style="padding: 1rem; vertical-align:top;">${t.department}</td>
          <td style="padding: 1rem; vertical-align:top;">${subHtml}</td>
        </tr>
      `;
    });

    document.querySelectorAll('.btn-grade-sub').forEach(btn => {
      btn.addEventListener('click', (e) => {
         const ds = e.currentTarget.dataset;
         openGradeModal(ds.subid, ds.testid, ds.studentid, ds.filename);
      });
    });
  }

  // 7. Render Presentations
  function renderPresentations() {
    const container = document.getElementById('staffPresentationCards');
    if (!container) return;
    const presentations = state.getPresentations() || [];
    container.innerHTML = '';

    if (presentations.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; padding:2rem; text-align:center; color:var(--text-muted);">No scheduled presentations.</div>`;
      return;
    }

    presentations.forEach(p => {
      let subsHtml = '';
      if (p.submissions && p.submissions.length > 0) {
        subsHtml = '<ul style="list-style:none; padding:0; margin-top:0.5rem; font-size:0.85rem;">';
        p.submissions.forEach(s => {
           subsHtml += `<li style="display:flex; justify-content:space-between; align-items:center; padding:0.3rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">
             <span><i class="fa-solid fa-file-powerpoint" style="color:#f59e0b; margin-right:0.3rem;"></i> ${s.studentName} uploaded <strong>${s.pptFileName}</strong></span>
             <div style="display:flex; gap:0.5rem;">
               <button class="btn-view-doc" data-fileurl="${s.fileUrl || '#'}" data-filename="${s.pptFileName}" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:white; padding:0.2rem 0.5rem; border-radius:4px; cursor:pointer; font-size:0.75rem;" title="View Slides"><i class="fa-solid fa-eye"></i> View</button>
               <button class="btn-download-doc" data-fileurl="${s.fileUrl || '#'}" data-filename="${s.pptFileName}" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:white; padding:0.2rem 0.5rem; border-radius:4px; cursor:pointer; font-size:0.75rem;" title="Download Slides"><i class="fa-solid fa-download"></i></button>
             </div>
           </li>`;
        });
        subsHtml += '</ul>';
      } else {
        subsHtml = '<div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.5rem;">No slides uploaded yet.</div>';
      }

      container.innerHTML += `
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius:8px; padding:1.25rem;">
          <h3 style="margin-bottom:0.25rem; font-size:1.1rem;">${p.title}</h3>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.75rem;">${p.scheduledDate} | ${p.timeSlot}</p>
          <hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin-bottom:0.75rem;">
          <h4 style="font-size:0.9rem; color:#f472b6;">Submissions:</h4>
          ${subsHtml}
        </div>
      `;
    });
  }

  // Modal functions for Class and Course
  function openAddClassModal() {
    const classSelect = document.getElementById('staffAvailableClassSelect');
    if (classSelect) {
      const classes = state.getClasses() || [];
      const myAssignments = state.getStaffAssignments(staffSession.id) || [];
      const myClassIds = new Set(myAssignments.map(a => a.classId));
      
      classSelect.innerHTML = '';
      if (classes.length === 0) {
        classSelect.innerHTML = '<option value="">No classes available (create one in Superadmin)</option>';
      } else {
        classes.forEach(c => {
          const isAdded = myClassIds.has(c.id);
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = `${c.name} (${c.department || 'CS'}) ${isAdded ? '— [Already in Dashboard]' : ''}`;
          if (isAdded) opt.disabled = true;
          classSelect.appendChild(opt);
        });
      }
    }
    openModal('staffAddClassModal');
  }

  function openAddCourseToClassModal(classId, className) {
    document.getElementById('modalTargetClassId').value = classId;
    document.getElementById('modalTargetClassName').textContent = className;
    
    // Populate pre-existing course select
    const existingSelect = document.getElementById('staffExistingCourseSelect');
    if (existingSelect) {
      existingSelect.innerHTML = '<option value="">-- Or enter new subject details below --</option>';
      const allCourses = state.getCourses() || [];
      allCourses.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.code} - ${c.name || c.title}`;
        opt.dataset.code = c.code;
        opt.dataset.title = c.name || c.title;
        opt.dataset.credits = c.credits || 3;
        existingSelect.appendChild(opt);
      });

      existingSelect.onchange = () => {
        const selectedOpt = existingSelect.selectedOptions[0];
        if (selectedOpt && selectedOpt.value) {
          document.getElementById('staffNewCourseTitle').value = selectedOpt.dataset.title || '';
          document.getElementById('staffNewCourseCode').value = selectedOpt.dataset.code || '';
          document.getElementById('staffNewCourseCredits').value = selectedOpt.dataset.credits || 3;
        } else {
          document.getElementById('staffNewCourseTitle').value = '';
          document.getElementById('staffNewCourseCode').value = '';
          document.getElementById('staffNewCourseCredits').value = 3;
        }
      };
    }

    document.getElementById('staffNewCourseTitle').value = '';
    document.getElementById('staffNewCourseCode').value = '';
    document.getElementById('staffNewCourseCredits').value = 3;

    openModal('staffAddCourseModal');
  }

  function initModals() {
    // Add Class Button
    document.getElementById('btnOpenAddClassModal')?.addEventListener('click', openAddClassModal);

    // Add Class Form
    document.getElementById('staffAddClassForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const classSelect = document.getElementById('staffAvailableClassSelect');
      const classId = classSelect?.value;
      if (!classId) return;

      const res = state.assignStaffClass(staffSession.id, classId);
      if (res.success) {
        state.showToast('Class added to your dashboard!', 'success');
        closeModal('staffAddClassModal');
        renderClasses();
      } else {
        state.showToast(res.message || 'Error adding class', 'error');
      }
    });

    // Add Course to Class Form
    document.getElementById('staffAddCourseForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const classId = document.getElementById('modalTargetClassId').value;
      const title = document.getElementById('staffNewCourseTitle').value.trim();
      const code = document.getElementById('staffNewCourseCode').value.trim();
      const credits = document.getElementById('staffNewCourseCredits').value;

      if (!title) {
        state.showToast('Please enter a course subject title', 'warning');
        return;
      }

      const res = state.addCourseToClass(staffSession.id, classId, {
        title: title,
        code: code,
        credits: credits
      });

      if (res.success) {
        state.showToast(`Course "${title}" assigned to class!`, 'success');
        closeModal('staffAddCourseModal');
        e.target.reset();
        renderClasses();
        renderCourses();
      } else {
        state.showToast(res.message || 'Error assigning course', 'error');
      }
    });

    // Add Course Material
    document.getElementById('btnOpenAddMaterialModal')?.addEventListener('click', () => openModal('addCourseMaterialModal'));
    document.getElementById('addCourseMaterialForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const courseId = document.getElementById('materialCourseSelect').value;
      const title = document.getElementById('materialTitleInput').value.trim();
      const fileInput = document.getElementById('materialFileInput');
      const file = fileInput.files[0];
      if (!courseId || !title || !file) return;

      const fileSizeStr = file.size > 1048576 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;

      const res = state.addCourseNote(courseId, { 
        title: title, 
        fileName: file.name,
        fileSize: fileSizeStr,
        description: 'Uploaded via Staff Portal', 
        fileObj: file, 
        topic: 'General' 
      });
      if (res.success) {
         if (state.showToast) state.showToast(`Material "${file.name}" uploaded successfully!`, 'success');
         closeModal('addCourseMaterialModal');
         e.target.reset();
         renderCourses();
      }
    });

    // Add Test
    document.getElementById('btnOpenAddTestModal')?.addEventListener('click', () => openModal('addTestModal'));
    document.getElementById('addTestForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('testCodeInput').value.trim();
      const title = document.getElementById('testTitleInput').value.trim();
      const marks = document.getElementById('testMarksInput').value;
      const keywordsStr = document.getElementById('testKeywordsInput')?.value.trim() || '';

      state.createTest({ code, title, totalMarks: marks, keywords: keywordsStr, status: 'ongoing' });
      if (state.showToast) state.showToast('Assessment created successfully!', 'success');
      closeModal('addTestModal');
      e.target.reset();
      renderTests();
    });

    // Add Presentation
    document.getElementById('btnOpenAddPresentationModal')?.addEventListener('click', () => openModal('addPresentationModal'));
    document.getElementById('addPresentationForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('presTitleInput').value.trim();
      const date = document.getElementById('presDateInput').value;

      state.createPresentation({ title, scheduledDate: date, subject: 'General Seminar' });
      if (state.showToast) state.showToast('Presentation scheduled successfully!', 'success');
      closeModal('addPresentationModal');
      e.target.reset();
      renderPresentations();
    });

    // Grade Submission Form
    document.getElementById('gradeSubmissionForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const subId = document.getElementById('gradeSubmissionId').value;
      const score = document.getElementById('gradeScoreInput').value;
      const feedback = document.getElementById('gradeFeedbackInput').value;

      const res = state.saveGrade(subId, score, feedback);
      if (res.success) {
        if (state.showToast) state.showToast('Grade saved successfully!', 'success');
        closeModal('gradeSubmissionModal');
        e.target.reset();
        document.getElementById('pdfTextOutput').innerHTML = 'PDF text will appear here...';
        document.getElementById('keywordMatchResults').innerHTML = '';
        renderTests();
      }
    });
  }

  // --- Hybrid PDF & OCR Grading Controller ---
  let currentSub = null;
  let currentTest = null;
  let extractedPDFText = "";
  let currentExtractionMode = "digital"; // "digital" or "ocr"
  let localPdfFile = null;

  function setExtractionMode(mode) {
    currentExtractionMode = mode;
    const btnDigital = document.getElementById('btnModeDigital');
    const btnOcr = document.getElementById('btnModeOcr');

    if (mode === 'ocr') {
      if (btnOcr) {
        btnOcr.style.background = '#f59e0b';
        btnOcr.style.color = '#fff';
        btnOcr.style.border = 'none';
      }
      if (btnDigital) {
        btnDigital.style.background = 'rgba(255,255,255,0.08)';
        btnDigital.style.color = 'var(--text-muted)';
        btnDigital.style.border = '1px solid rgba(255,255,255,0.1)';
      }
    } else {
      if (btnDigital) {
        btnDigital.style.background = '#3b82f6';
        btnDigital.style.color = '#fff';
        btnDigital.style.border = 'none';
      }
      if (btnOcr) {
        btnOcr.style.background = 'rgba(255,255,255,0.08)';
        btnOcr.style.color = 'var(--text-muted)';
        btnOcr.style.border = '1px solid rgba(255,255,255,0.1)';
      }
    }
  }

  function openGradeModal(subId, testId, studentId, fileName) {
    document.getElementById('gradeSubmissionId').value = subId;
    document.getElementById('gradeTestId').value = testId;
    document.getElementById('gradeStudentId').value = studentId;

    currentSub = state.getSubmissionById(subId);
    currentTest = state.getTestById(testId) || { totalMarks: 100, keywords: [] };
    localPdfFile = null;

    if (!currentSub) return;

    document.getElementById('gradeStudentInfo').textContent = `Student: ${currentSub.studentName} (${currentSub.regNo})`;
    document.getElementById('gradeFileInfo').textContent = `Document: ${fileName || currentSub.fileName}`;
    
    // Document type badge
    const badge = document.getElementById('gradeDocTypeBadge');
    if (badge) {
      if (currentSub.isHandwritten) {
        badge.textContent = '✍️ Handwritten OCR';
        badge.style.background = '#f59e0b';
      } else {
        badge.textContent = '⚡ Typed PDF';
        badge.style.background = '#10b981';
      }
    }

    // Set initial mode
    setExtractionMode(currentSub.isHandwritten ? 'ocr' : 'digital');

    // Link to Full Evaluation Interface
    const fullEvalBtn = document.getElementById('btnOpenFullEvaluation');
    if (fullEvalBtn) {
      fullEvalBtn.href = `grade.html?id=${encodeURIComponent(subId)}`;
    }

    // Max score indicator
    const maxScore = currentSub.maxScore || currentTest.totalMarks || 100;
    const maxLabel = document.getElementById('gradeScoreMaxLabel');
    if (maxLabel) maxLabel.textContent = `Max: ${maxScore}`;
    const scoreInput = document.getElementById('gradeScoreInput');
    if (scoreInput) {
      scoreInput.max = maxScore;
      scoreInput.value = currentSub.score !== null && currentSub.score !== undefined ? currentSub.score : '';
    }

    // Target keywords prefill
    const defaultKeywords = (currentSub.keywords && currentSub.keywords.length > 0)
      ? currentSub.keywords
      : (currentTest.keywords || ['Raft', 'Paxos', 'Consensus', 'Fault Tolerance', 'Leader Election']);
    const kwInput = document.getElementById('gradeKeywordsInput');
    if (kwInput) {
      kwInput.value = Array.isArray(defaultKeywords) ? defaultKeywords.join(', ') : defaultKeywords;
    }

    // Feedback
    document.getElementById('gradeFeedbackInput').value = currentSub.feedback || '';

    // Reset results & buttons
    document.getElementById('keywordMatchResults').innerHTML = '';
    const btnApply = document.getElementById('btnApplySuggestedScore');
    if (btnApply) btnApply.style.display = 'none';

    // Extracted text display
    if (currentSub.extractedText && currentSub.extractedText.trim().length > 0) {
      extractedPDFText = currentSub.extractedText;
      const wordCount = extractedPDFText.split(/\s+/).filter(Boolean).length;
      document.getElementById('gradeTextMeta').textContent = `${wordCount} words`;
      // Run initial keyword match automatically
      executeKeywordMatch();
    } else {
      extractedPDFText = "";
      document.getElementById('pdfTextOutput').innerHTML = '<span style="color:#94a3b8; font-style:italic;">Click "Extract / Re-parse Text" to analyze this student submission...</span>';
      document.getElementById('gradeTextMeta').textContent = '0 words';
    }

    openModal('gradeSubmissionModal');
  }

  // Bind Mode Buttons
  document.getElementById('btnModeDigital')?.addEventListener('click', () => setExtractionMode('digital'));
  document.getElementById('btnModeOcr')?.addEventListener('click', () => setExtractionMode('ocr'));

  // Local PDF File Selection Handler
  const btnSelectLocalPdf = document.getElementById('btnSelectLocalPdf');
  const gradePdfFileInput = document.getElementById('gradePdfFileInput');
  if (btnSelectLocalPdf && gradePdfFileInput) {
    btnSelectLocalPdf.addEventListener('click', () => gradePdfFileInput.click());
    gradePdfFileInput.addEventListener('change', () => {
      if (gradePdfFileInput.files && gradePdfFileInput.files.length > 0) {
        localPdfFile = gradePdfFileInput.files[0];
        document.getElementById('gradeFileInfo').textContent = `Local File: ${localPdfFile.name} (${(localPdfFile.size / 1024).toFixed(1)} KB)`;
        runExtractionProcess();
      }
    });
  }

  // Extraction Execution Function
  async function runExtractionProcess() {
    const output = document.getElementById('pdfTextOutput');
    const progressBox = document.getElementById('gradeOcrProgressBox');
    const progressText = document.getElementById('gradeOcrStatusText');
    const progressPercent = document.getElementById('gradeOcrStatusPercent');
    const progressBar = document.getElementById('gradeOcrProgressBar');
    const metaEl = document.getElementById('gradeTextMeta');

    if (progressBox) progressBox.style.display = 'block';
    output.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing document...';

    const onProgress = (p) => {
      if (progressText) progressText.textContent = p.message;
      if (progressPercent) progressPercent.textContent = `${p.percent}%`;
      if (progressBar) progressBar.style.width = `${p.percent}%`;
    };

    try {
      let result = null;

      // Case 1: Local PDF selected by faculty
      if (localPdfFile && window.AcademeEngine) {
        result = await window.AcademeEngine.extractTextFromPDF(localPdfFile, {
          forceOCR: currentExtractionMode === 'ocr',
          maxPages: 8
        }, onProgress);
      }
      // Case 2: Submission has embedded fileData
      else if (currentSub && currentSub.fileData && window.AcademeEngine) {
        result = await window.AcademeEngine.extractTextFromPDF(currentSub.fileData, {
          forceOCR: currentExtractionMode === 'ocr',
          maxPages: 8
        }, onProgress);
      }
      // Case 3: Already has extracted text from student upload
      else if (currentSub && currentSub.extractedText && currentExtractionMode !== 'ocr') {
        result = {
          success: true,
          text: currentSub.extractedText,
          isHandwritten: currentSub.isHandwritten,
          pageCount: currentSub.pageCount || 1
        };
      }
      // Case 4: Demo / fallback realistic academic submission
      else {
        onProgress({ percent: 100, stage: 'done', message: 'Loaded solution document.' });
        const topic = currentTest ? currentTest.title : 'Distributed Consensus Protocol';
        const sampleAcademicText = 
          `ACADEMIC ASSESSMENT SOLUTION REPORT\nTopic: ${topic}\nStudent: ${currentSub ? currentSub.studentName : 'Student'}\n\n` +
          `1. Theoretical Framework & Architecture\n` +
          `The Raft consensus algorithm structures distributed state machine replication around an elected Leader. Raft decomposes consensus into three independent sub-problems: Leader Election, Log Replication, and Safety Invariants.\n\n` +
          `Followers monitor leader heartbeats using randomized election timers to avoid split votes. If a heartbeat expires, a follower increments its term counter, transitions to Candidate state, and solicits votes. Consensus requires a strict majority quorum.\n\n` +
          `2. Byzantine Fault Tolerance & Multi-Paxos Comparison\n` +
          `Unlike classical Multi-Paxos which is symmetric, Raft elects a strong leader to streamline log consistency. Under arbitrary node failures, Practical Byzantine Fault Tolerance (PBFT) provides Byzantine fault tolerance requiring 3f + 1 nodes to tolerate f arbitrary/byzantine malicious faults across pre-prepare, prepare, and commit phases.`;

        result = {
          success: true,
          text: sampleAcademicText,
          isHandwritten: false,
          pageCount: 2
        };
      }

      if (result && result.success && result.text) {
        extractedPDFText = result.text;
        const wordCount = extractedPDFText.split(/\s+/).filter(Boolean).length;
        if (metaEl) metaEl.textContent = `${wordCount} words • ${result.isHandwritten ? '✍️ OCR' : '⚡ Digital'}`;

        // Save updated text to submission state
        if (currentSub) {
          state.updateSubmissionData(currentSub.id, {
            extractedText: extractedPDFText,
            isHandwritten: result.isHandwritten
          });
        }

        // Run keyword match on the newly extracted text
        executeKeywordMatch();
      } else {
        output.innerHTML = `<span style="color:#ef4444;">Could not extract text from document. ${result ? result.error : ''}</span>`;
      }
    } catch (err) {
      console.error('Extraction error:', err);
      output.innerHTML = `<span style="color:#ef4444;">Error processing document: ${err.message}</span>`;
    } finally {
      if (progressBox) {
        setTimeout(() => { progressBox.style.display = 'none'; }, 600);
      }
    }
  }

  // Bind Extract Button
  document.getElementById('btnExtractText')?.addEventListener('click', runExtractionProcess);

  // Keyword Match Execution Function
  function executeKeywordMatch() {
    const keywordsStr = document.getElementById('gradeKeywordsInput').value;
    const resultsDiv = document.getElementById('keywordMatchResults');
    const output = document.getElementById('pdfTextOutput');
    const chkFuzzy = document.getElementById('chkFuzzyMatch');
    const btnApply = document.getElementById('btnApplySuggestedScore');

    if (!extractedPDFText) {
      resultsDiv.innerHTML = '<span style="color:#ef4444; font-size:0.85rem;">⚠️ Please extract PDF text first!</span>';
      return;
    }

    if (!keywordsStr || keywordsStr.trim().length === 0) {
      resultsDiv.innerHTML = '<span style="color:#ef4444; font-size:0.85rem;">⚠️ Please enter evaluation keywords to match!</span>';
      output.textContent = extractedPDFText;
      return;
    }

    const maxScore = currentSub ? (currentSub.maxScore || currentTest.totalMarks || 100) : 100;

    // Use AcademeEngine for safe interval-based matching with zero tag corruption
    if (window.AcademeEngine) {
      const matchResult = window.AcademeEngine.matchAndHighlightKeywords(extractedPDFText, keywordsStr, {
        enableFuzzy: chkFuzzy ? chkFuzzy.checked : true,
        suggestedMaxScore: maxScore
      });

      // Render safe highlighted HTML
      output.innerHTML = matchResult.highlightedHtml;

      // Render chip analytics
      const chipsHtml = matchResult.chips.map(chip => {
        let chipBg = 'rgba(239, 68, 68, 0.1)';
        let chipColor = '#f87171';
        let chipBorder = 'rgba(239, 68, 68, 0.25)';
        let icon = '✗';

        if (chip.isMatched) {
          if (chip.exactCount > 0) {
            chipBg = 'rgba(16, 185, 129, 0.15)';
            chipColor = '#34d399';
            chipBorder = 'rgba(16, 185, 129, 0.35)';
            icon = '✓';
          } else {
            chipBg = 'rgba(245, 158, 11, 0.15)';
            chipColor = '#fbbf24';
            chipBorder = 'rgba(245, 158, 11, 0.35)';
            icon = '≈ (OCR)';
          }
        }

        return `
          <span style="display:inline-flex; align-items:center; gap:0.3rem; font-size:0.75rem; font-weight:600; padding:0.2rem 0.55rem; border-radius:12px; background:${chipBg}; color:${chipColor}; border:1px solid ${chipBorder};">
            <span>${icon}</span>
            <span>${window.AcademeEngine.escapeHtml(chip.keyword)}</span>
            <span style="opacity:0.8; font-size:0.7rem;">(${chip.totalCount})</span>
          </span>
        `;
      }).join('');

      let summaryColor = matchResult.coverage >= 70 ? '#34d399' : (matchResult.coverage >= 40 ? '#fbbf24' : '#f87171');
      let summaryText = `Found <strong>${matchResult.totalMatches} match(es)</strong> across ${matchResult.matchedKeywordsCount}/${matchResult.totalKeywordsCount} target terms (${matchResult.coverage}% coverage).`;

      resultsDiv.innerHTML = `
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 0.65rem 0.85rem;">
          <div style="color: ${summaryColor}; font-size: 0.84rem; margin-bottom: 0.45rem;">
            ${summaryText}
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
            ${chipsHtml}
          </div>
        </div>
      `;

      // Enable Suggested Score
      if (btnApply) {
        btnApply.style.display = 'inline-block';
        btnApply.textContent = `Apply Score: ${matchResult.suggestedScore}/${maxScore}`;
        btnApply.onclick = () => {
          const scoreInput = document.getElementById('gradeScoreInput');
          if (scoreInput) {
            scoreInput.value = matchResult.suggestedScore;
            scoreInput.focus();
          }
        };
      }
    }
  }

  // Bind Keyword Match Button
  document.getElementById('btnRunKeywordMatch')?.addEventListener('click', executeKeywordMatch);


  // Global Event Delegation for View / Download Document buttons
  document.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('.btn-view-doc');
    const dlBtn = e.target.closest('.btn-download-doc');
    
    if (viewBtn) {
      const fileurl = viewBtn.getAttribute('data-fileurl');
      const filename = viewBtn.getAttribute('data-filename');
      if (state.showToast) state.showToast(`Opening viewer for ${filename}...`, 'info');
      setTimeout(() => {
        // If it's a base64 or valid URL, open it; otherwise open dummy PDF
        const url = (fileurl && fileurl !== '#') ? fileurl : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
        window.open(url, '_blank');
      }, 500);
    }
    
    if (dlBtn) {
      const fileurl = dlBtn.getAttribute('data-fileurl');
      const filename = dlBtn.getAttribute('data-filename');
      if (fileurl && fileurl !== '#' && fileurl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = fileurl;
        link.download = filename || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (state.showToast) state.showToast(`Downloading ${filename}...`, 'success');
      } else {
        if (state.showToast) state.showToast(`Downloading original file ${filename}...`, 'success');
        // Dummy download for wireframe
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
          link.download = filename || 'dummy.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, 500);
      }
    }
  });

  // 8. Init Dashboard
  function renderAll() {
    ensureInitialAssignments();
    renderClasses();
    renderCourses();
    renderTests();
    renderPresentations();
  }

  initModals();
  renderAll();

})();
