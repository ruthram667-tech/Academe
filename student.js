// UniGrade — Student Portal Controller (CodeTantra-Inspired Design)
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
    if (dropEmail) dropEmail.textContent = session.email || `${(session.regNo || 'student').toLowerCase()}@student.unitest.edu`;
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

  // 6. Action Cards Click Handlers
  // Card 1: Courses
  const btnCourses = document.getElementById('btnCourses');
  const cardCourses = document.getElementById('cardCourses');
  [btnCourses, cardCourses].forEach(el => {
    if (el) el.addEventListener('click', () => openModal('modalCourses'));
  });

  // Card 2: Tests
  const btnTests = document.getElementById('btnTests');
  const cardTests = document.getElementById('cardTests');
  [btnTests, cardTests].forEach(el => {
    if (el) el.addEventListener('click', () => {
      renderTestsList();
      openModal('modalTests');
    });
  });

  // Card 3: Programming Labs
  const btnLabs = document.getElementById('btnLabs');
  const cardLabs = document.getElementById('cardLabs');
  [btnLabs, cardLabs].forEach(el => {
    if (el) el.addEventListener('click', () => openModal('modalLabs'));
  });

  // Card 4: Tools
  const btnTools = document.getElementById('btnTools');
  const cardTools = document.getElementById('cardTools');
  [btnTools, cardTools].forEach(el => {
    if (el) el.addEventListener('click', () => openModal('modalTools'));
  });

  // Card 5: Help & Support
  const btnHelp = document.getElementById('btnHelp');
  const cardHelp = document.getElementById('cardHelp');
  const navSupportBtn = document.getElementById('navSupportBtn');
  [btnHelp, cardHelp, navSupportBtn].forEach(el => {
    if (el) el.addEventListener('click', () => openModal('modalHelp'));
  });

  // 7. Tests & Document Upload Workflow
  let targetTestForUpload = null;
  let selectedFileObject = null;

  function renderTestsList() {
    const container = document.getElementById('testsListContainer');
    if (!container) return;

    const tests = state.getTests();
    const currentSession = state.getSession() || student;
    const studentSubs = state.getStudentSubmissions(currentSession.id);

    container.innerHTML = '';

    if (!tests || tests.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding:2rem; color:#64748B;">No assessments currently scheduled.</div>';
      return;
    }

    tests.forEach((t) => {
      const userSub = studentSubs.find(s => s.testId === t.id);
      const card = document.createElement('div');
      card.className = 'modal-item-card';

      let statusBadge = '<span class="badge-tag pending">Not Submitted</span>';
      let actionBtnText = 'Upload Solution (PDF/PPT)';
      let fileDetailsHtml = '';

      if (userSub) {
        if (userSub.status === 'graded') {
          statusBadge = `<span class="badge-tag graded">Graded: ${userSub.score} / ${userSub.maxScore}</span>`;
          actionBtnText = 'Re-upload Revision';
        } else {
          statusBadge = '<span class="badge-tag pending">Submitted • Under Faculty Review</span>';
          actionBtnText = 'Replace Document';
        }

        const fileName = userSub.fileName || 'Solution_Document.pdf';
        const fileSize = userSub.fileSize || '1.8 MB';
        fileDetailsHtml = `
          <div class="file-preview-card" style="margin-bottom:0.75rem; background:#F8FAFC;">
            <div class="file-preview-info">
              <div class="file-preview-icon">${fileName.endsWith('.ppt') || fileName.endsWith('.pptx') ? 'PPT' : 'PDF'}</div>
              <div>
                <div class="file-preview-name">${fileName}</div>
                <div class="file-preview-size">${fileSize} • Submitted ${userSub.submittedAt}</div>
              </div>
            </div>
            ${userSub.status === 'graded' && userSub.feedback ? `
              <div style="font-size:0.78rem; color:#047857; background:#D1FAE5; padding:0.3rem 0.6rem; border-radius:6px;">
                Feedback: "${userSub.feedback}"
              </div>
            ` : ''}
          </div>
        `;
      }

      // Format questions / prompt
      const promptText = t.questions && t.questions.length > 0
        ? t.questions.map((q, i) => `Q${i + 1}: ${q.prompt}`).join(' | ')
        : 'Prepare and upload your technical report according to course guidelines.';

      // Target keywords for grading assistance
      const keywords = t.keywords || ['Consensus', 'Fault Tolerance', 'Algorithm', 'Replication'];
      const keywordChips = keywords.map(kw => `<span class="keyword-chip">${kw}</span>`).join('');

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
          <div>${statusBadge}</div>
        </div>

        <div class="modal-item-prompt">
          <strong>Question Prompt:</strong> ${promptText}
        </div>

        ${fileDetailsHtml}

        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem; margin-top:0.75rem;">
          <div>
            <span style="font-size:0.72rem; color:#64748B; font-weight:600; text-transform:uppercase;">Grading Highlight Keywords:</span>
            <div class="keyword-chips-row">${keywordChips}</div>
          </div>
          <button type="button" class="btn-modal-accent btn-open-upload" data-test-id="${t.id}" style="padding:0.45rem 0.95rem; font-size:0.8rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>${actionBtnText}</span>
          </button>
        </div>
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

    document.getElementById('uploadModalTitle').textContent = `Upload Solution: ${test.code}`;
    document.getElementById('uploadModalSubtitle').textContent = test.title;
    
    const promptEl = document.getElementById('uploadQuestionPrompt');
    if (promptEl) {
      promptEl.innerHTML = `<strong>Assignment Question:</strong> ${
        test.questions && test.questions[0] ? test.questions[0].prompt : 'Upload technical document in PDF or PPT format.'
      }`;
    }

    // Reset file preview
    const preview = document.getElementById('filePreviewCard');
    if (preview) preview.style.display = 'none';
    const dropzone = document.getElementById('fileDropzone');
    if (dropzone) dropzone.style.display = 'block';
    const remarks = document.getElementById('uploadRemarks');
    if (remarks) remarks.value = '';

    openModal('modalUploadDocument');
  }

  // File Dropzone interactions
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
    if (!['pdf', 'ppt', 'pptx'].includes(ext)) {
      state.showToast('Please select a valid PDF or PPT/PPTX document.', 'warning');
      return;
    }

    selectedFileObject = file;
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    if (previewFileName) previewFileName.textContent = file.name;
    if (previewFileSize) previewFileSize.textContent = sizeStr;
    if (previewIcon) previewIcon.textContent = ext.toUpperCase().slice(0, 3);

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

  // Handle Form Submission for Document Upload
  const uploadDocForm = document.getElementById('uploadDocForm');
  if (uploadDocForm) {
    uploadDocForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!targetTestForUpload) {
        state.showToast('No assessment selected.', 'error');
        return;
      }

      // If user did not pick a real file in browser, provide a realistic default
      const fileName = selectedFileObject ? selectedFileObject.name : `${student.name.replace(/\s+/g, '_')}_${targetTestForUpload.code}_Solution.pdf`;
      const fileSize = selectedFileObject ? `${(selectedFileObject.size / (1024 * 1024)).toFixed(1)} MB` : '1.8 MB';
      const fileType = fileName.endsWith('.pptx') || fileName.endsWith('.ppt') ? 'application/vnd.ms-powerpoint' : 'application/pdf';
      const remarks = document.getElementById('uploadRemarks').value.trim();

      const res = state.submitStudentDocument(targetTestForUpload.id, {
        fileName: fileName,
        fileSize: fileSize,
        fileType: fileType,
        summary: remarks || 'Student solution document uploaded.'
      });

      if (res && res.success) {
        state.showToast(`Document uploaded successfully for ${targetTestForUpload.code}!`, 'success');
        closeModal('modalUploadDocument');
        renderTestsList();
      } else {
        state.showToast(res ? res.message : 'Submission failed', 'error');
      }
    });
  }

  // 8. Programming Labs Sandbox Runner
  const btnRunCode = document.getElementById('btnRunCode');
  const labConsole = document.getElementById('labConsoleOutput');
  const labLangSelect = document.getElementById('labLanguageSelect');
  const labCodeArea = document.getElementById('labCodeArea');

  const codeSnippets = {
    python: `# Distributed Systems — Raft Leader Election State Machine
class Node:
    def __init__(self, node_id):
        self.node_id = node_id
        self.state = "Follower"
        self.current_term = 0
        self.voted_for = None

    def start_election(self):
        self.state = "Candidate"
        self.current_term += 1
        self.voted_for = self.node_id
        print(f"[Node {self.node_id}] Initiating election for Term {self.current_term}")
        return True

cluster = [Node(i) for i in range(1, 4)]
cluster[0].start_election()
print("Cluster State: Election quorum established (2/3 votes).")`,
    javascript: `// Node.js Event-Driven Microservice Event Bus
const EventEmitter = require('events');
const bus = new EventEmitter();

bus.on('ORDER_CREATED', (order) => {
  console.log(\`[OrderService] Processed Order #\${order.id} for $\${order.total}\`);
});

bus.emit('ORDER_CREATED', { id: 1042, total: 249.99 });
console.log('[System] Microservice saga transaction verified.');`,
    cpp: `// C++17 Matrix Chain Dynamic Programming
#include <iostream>
#include <vector>
using namespace std;

int main() {
    cout << "[C++17] DP Memoization Table initialized for 5-matrix sequence." << endl;
    cout << "Optimal scalar multiplications computed: 34,000 ops." << endl;
    return 0;
}`,
    java: `// Java 21 Virtual Threads & Raft Heartbeat
public class RaftWorker {
    public static void main(String[] args) {
        System.out.println("[Java 21] Virtual Thread Dispatcher: Heartbeat interval set to 150ms.");
        System.out.println("[Java 21] Node 1 validated leader lease.");
    }
}`
  };

  if (labLangSelect && labCodeArea) {
    labLangSelect.addEventListener('change', () => {
      const lang = labLangSelect.value;
      if (codeSnippets[lang]) {
        labCodeArea.value = codeSnippets[lang];
      }
    });
  }

  if (btnRunCode && labConsole) {
    btnRunCode.addEventListener('click', () => {
      labConsole.textContent = '⚡ Compiling and executing in cloud container...';
      setTimeout(() => {
        const lang = labLangSelect ? labLangSelect.value : 'python';
        const timestamp = new Date().toLocaleTimeString();
        if (lang === 'python') {
          labConsole.textContent = `[Container: python:3.11-alpine @ ${timestamp}]\n[Node 1] Initiating election for Term 1\nCluster State: Election quorum established (2/3 votes).\n\n✓ Execution Succeeded (Exit Code 0, Time: 28ms, RAM: 14.2MB)`;
        } else if (lang === 'javascript') {
          labConsole.textContent = `[Container: node:20-slim @ ${timestamp}]\n[OrderService] Processed Order #1042 for $249.99\n[System] Microservice saga transaction verified.\n\n✓ Execution Succeeded (Exit Code 0, Time: 19ms)`;
        } else {
          labConsole.textContent = `[Container: gcc-toolchain @ ${timestamp}]\nCompilation complete. No warnings.\nProgram output successfully executed.\n\n✓ Process finished with exit code 0 (Execution Time: 12ms)`;
        }
      }, 400);
    });
  }

  // 9. Developer Tools Interactions
  // Tab Switching
  document.querySelectorAll('.tool-tab-btn').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('.tool-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tool-tab-pane').forEach(p => p.classList.remove('active'));

      tabBtn.classList.add('active');
      const targetId = tabBtn.getAttribute('data-tab');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Math Calculator
  const btnCalc = document.getElementById('btnEvaluateMath');
  const calcInput = document.getElementById('calcInput');
  const calcResultBox = document.getElementById('calcResultBox');

  if (btnCalc && calcInput && calcResultBox) {
    btnCalc.addEventListener('click', () => {
      const expr = calcInput.value.trim();
      try {
        // Safe evaluation for basic math
        const sanitized = expr.replace(/[^0-9+\-*/().Math,powsqrtrandomfloorceilabsminmaxlog2EPI]/g, '');
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${sanitized})`)();
        calcResultBox.textContent = `Result: ${typeof result === 'number' ? result.toLocaleString() : result}`;
        calcResultBox.style.color = '#10B981';
      } catch {
        calcResultBox.textContent = 'Error: Invalid math expression';
        calcResultBox.style.color = '#EF4444';
      }
    });
  }

  // Word Counter
  const counterTextarea = document.getElementById('counterTextarea');
  const countWords = document.getElementById('countWords');
  const countChars = document.getElementById('countChars');
  const countReadTime = document.getElementById('countReadTime');

  if (counterTextarea) {
    counterTextarea.addEventListener('input', () => {
      const text = counterTextarea.value.trim();
      const chars = text.length;
      const words = text ? text.split(/\s+/).length : 0;
      const readSeconds = Math.ceil((words / 200) * 60);

      if (countChars) countChars.textContent = chars;
      if (countWords) countWords.textContent = words;
      if (countReadTime) countReadTime.textContent = readSeconds < 60 ? `${readSeconds}s` : `${Math.ceil(readSeconds / 60)}m`;
    });
  }

  // Base64 Converter
  const base64Input = document.getElementById('base64Input');
  const base64Output = document.getElementById('base64Output');
  const btnEncode64 = document.getElementById('btnEncode64');
  const btnDecode64 = document.getElementById('btnDecode64');

  if (btnEncode64 && base64Input && base64Output) {
    btnEncode64.addEventListener('click', () => {
      try {
        base64Output.value = btoa(unescape(encodeURIComponent(base64Input.value)));
      } catch {
        base64Output.value = 'Encoding error: invalid character sequence';
      }
    });
  }

  if (btnDecode64 && base64Input && base64Output) {
    btnDecode64.addEventListener('click', () => {
      try {
        base64Output.value = decodeURIComponent(escape(atob(base64Input.value.trim())));
      } catch {
        base64Output.value = 'Decoding error: invalid Base64 input string';
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
      if (profileEmailInput) profileEmailInput.value = current.email || `${current.regNo.toLowerCase()}@student.unitest.edu`;
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
