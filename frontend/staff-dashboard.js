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

  // 5. Render Courses
  function renderCourses() {
    const tableBody = document.getElementById('staffCourseTableBody');
    if (!tableBody) return;
    const courses = state.getCourses() || [];
    tableBody.innerHTML = '';
    
    // populate dropdown for modal
    const courseSelect = document.getElementById('materialCourseSelect');
    if (courseSelect) {
      courseSelect.innerHTML = '<option value="">Select a Course</option>';
      courses.forEach(c => {
        courseSelect.innerHTML += `<option value="${c.id}">${c.code} - ${c.name}</option>`;
      });
    }

    if (courses.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" style="padding:1rem; text-align:center; color:var(--text-muted);">No courses assigned.</td></tr>`;
      return;
    }

    courses.forEach(c => {
      tableBody.innerHTML += `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 1rem;"><strong>${c.code}</strong><br><span style="font-size:0.8rem; color:var(--text-muted);">${c.name}</span></td>
          <td style="padding: 1rem;">${c.department}</td>
          <td style="padding: 1rem;">${c.credits}</td>
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
              ${isGraded 
                 ? `<span style="color:#10b981;">Score: ${s.score}/${s.maxScore}</span>`
                 : `<button class="btn-grade-sub" data-subid="${s.id}" data-testid="${t.id}" data-studentid="${s.studentId}" data-filename="${s.fileName}" style="background:#3b82f6; border:none; color:white; padding:0.2rem 0.5rem; border-radius:4px; cursor:pointer; font-size:0.75rem;">Grade</button>`
              }
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
         const ds = e.target.dataset;
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
           subsHtml += `<li style="padding:0.3rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">
             <i class="fa-solid fa-file-powerpoint" style="color:#f59e0b; margin-right:0.3rem;"></i> ${s.studentName} uploaded <strong>${s.pptFileName}</strong>
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

  function initModals() {
    // Add Course Material
    document.getElementById('btnOpenAddMaterialModal')?.addEventListener('click', () => openModal('addCourseMaterialModal'));
    document.getElementById('addCourseMaterialForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const courseId = document.getElementById('materialCourseSelect').value;
      const title = document.getElementById('materialTitleInput').value.trim();
      const fileInput = document.getElementById('materialFileInput');
      const file = fileInput.files[0];
      if (!courseId || !title || !file) return;

      const res = state.addCourseNote(courseId, { title: title, description: 'Uploaded via Staff Portal', fileObj: file, topic: 'General' });
      if (res.success) {
         if (state.showToast) state.showToast('Material uploaded successfully!', 'success');
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

      state.createTest({ code, title, totalMarks: marks, status: 'ongoing' });
      if (state.showToast) state.showToast('Test created successfully!', 'success');
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

    // Grade Submission form submit
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

  // --- PDF Grading Logic ---
  let extractedPDFText = "";

  function openGradeModal(subId, testId, studentId, fileName) {
    document.getElementById('gradeSubmissionId').value = subId;
    document.getElementById('gradeTestId').value = testId;
    document.getElementById('gradeStudentId').value = studentId;

    const sub = state.getSubmissionById(subId);
    if (!sub) return;

    document.getElementById('gradeStudentInfo').textContent = `Student: ${sub.studentName} (${sub.regNo})`;
    document.getElementById('gradeFileInfo').textContent = `Document: ${fileName || sub.fileName}`;
    
    // reset PDF states
    extractedPDFText = "";
    document.getElementById('pdfTextOutput').innerHTML = 'PDF text will appear here...';
    document.getElementById('keywordMatchResults').innerHTML = '';
    document.getElementById('gradeScoreInput').value = '';
    document.getElementById('gradeFeedbackInput').value = '';

    openModal('gradeSubmissionModal');
  }

  const btnExtract = document.getElementById('btnExtractText');
  if (btnExtract) {
    btnExtract.addEventListener('click', async () => {
      const output = document.getElementById('pdfTextOutput');
      output.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Extracting text via pdf.js...';
      
      try {
        if (!window.pdfjsLib) throw new Error("pdf.js is not loaded");
        
        // Use a tiny, public sample PDF to demonstrate text extraction
        const pdfUrl = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf';
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        
        let fullText = "";
        // Extract from first 2 pages to be fast
        const numPages = Math.min(2, pdf.numPages);
        for (let i = 1; i <= numPages; i++) {
           const page = await pdf.getPage(i);
           const textContent = await page.getTextContent();
           const pageText = textContent.items.map(item => item.str).join(" ");
           fullText += pageText + "\\n\\n";
        }
        
        extractedPDFText = fullText;
        output.innerHTML = fullText || "No text could be extracted.";
      } catch (err) {
        console.error(err);
        output.innerHTML = '<span style="color:#ef4444;">Error extracting PDF. Simulating extracted text instead...</span><br><br>' + 
           "The algorithm provides a consensus mechanism for fault tolerance in distributed systems. It guarantees safety under asynchronous conditions. The artificial intelligence component optimizes the route.";
        extractedPDFText = "The algorithm provides a consensus mechanism for fault tolerance in distributed systems. It guarantees safety under asynchronous conditions. The artificial intelligence component optimizes the route.";
      }
    });
  }

  const btnKeywordMatch = document.getElementById('btnRunKeywordMatch');
  if (btnKeywordMatch) {
    btnKeywordMatch.addEventListener('click', () => {
       const keywordsStr = document.getElementById('gradeKeywordsInput').value;
       const resultsDiv = document.getElementById('keywordMatchResults');
       const output = document.getElementById('pdfTextOutput');

       if (!extractedPDFText) {
          resultsDiv.innerHTML = '<span style="color:#ef4444;">Please extract PDF text first!</span>';
          return;
       }
       if (!keywordsStr) {
          resultsDiv.innerHTML = '<span style="color:#ef4444;">Please enter keywords!</span>';
          return;
       }

       const keywords = keywordsStr.split(',').map(k => k.trim()).filter(k => k.length > 0);
       let matchCount = 0;
       
       // Simple highlighter
       let highlightedText = extractedPDFText;
       keywords.forEach(kw => {
          const regex = new RegExp(`(${kw})`, "gi");
          const matches = extractedPDFText.match(regex);
          if (matches) matchCount += matches.length;
          highlightedText = highlightedText.replace(regex, `<span style="background-color: #fbbf24; color: #000; font-weight: bold; padding: 0 2px;">$1</span>`);
       });

       output.innerHTML = highlightedText;
       
       if (matchCount > 0) {
         resultsDiv.innerHTML = `✅ Found ${matchCount} keyword match(es). Suggested grade adjustment: +${matchCount * 5} points.`;
       } else {
         resultsDiv.innerHTML = `❌ No keywords found.`;
       }
    });
  }


  // 8. Init Dashboard
  function renderAll() {
    renderCourses();
    renderTests();
    renderPresentations();
  }

  initModals();
  renderAll();

})();
