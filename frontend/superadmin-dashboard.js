// Academe Super Admin Dashboard Controller
(function () {
  'use strict';

  const state = window.PortalState;
  if (!state) return;

  // 1. Enforce Super Admin Route Guard
  const admin = state.requireAuth(['superadmin']);
  if (!admin) return;

  // Set Profile UI
  document.getElementById('adminName').textContent = admin.name || 'Master Superadmin';
  document.getElementById('adminAvatar').textContent = admin.avatar || 'SA';

  // Logout Handler
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (state.showToast) state.showToast('Ending administrator session...', 'info');
    setTimeout(() => {
      if (state.logout) {
        state.logout();
      } else if (state.clearSession) {
        state.clearSession();
        window.location.replace('login.html');
      }
    }, 300);
  });

  // 2. Client-side Routing / Tab Switching for Sidebar
  const navItems = document.querySelectorAll('.nav-item');
  const contentSections = document.querySelectorAll('.content-section');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Remove active class from all nav items
      navItems.forEach(nav => nav.classList.remove('active'));
      // Add active class to clicked item
      item.classList.add('active');

      // Hide all content sections
      contentSections.forEach(section => section.classList.remove('active'));
      
      // Show the target section
      const targetId = item.getAttribute('data-target');
      if (targetId) {
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
          targetSection.classList.add('active');
        }
      }
    });
  });

  // 3. Register Faculty Staff Modal & Form
  const addStaffModal = document.getElementById('addStaffModal');
  const openAddStaffModalBtn = document.getElementById('openAddStaffModalBtn');
  const closeAddStaffBtn = document.getElementById('closeAddStaffBtn');
  const cancelAddStaffBtn = document.getElementById('cancelAddStaffBtn');
  const addStaffForm = document.getElementById('addStaffForm');

  if (openAddStaffModalBtn) openAddStaffModalBtn.addEventListener('click', () => addStaffModal.classList.add('active'));
  if (closeAddStaffBtn) closeAddStaffBtn.addEventListener('click', () => addStaffModal.classList.remove('active'));
  if (cancelAddStaffBtn) cancelAddStaffBtn.addEventListener('click', () => addStaffModal.classList.remove('active'));

  if (addStaffForm) {
    addStaffForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('staffNameInput').value.trim();
      const email = document.getElementById('staffEmailInput').value.trim();
      const dept = document.getElementById('staffDeptInput').value.trim();
      const pass = document.getElementById('staffPasswordInput').value;

      const newStaff = state.addUser({
        name,
        email,
        username: email.split('@')[0],
        department: dept,
        password: pass,
        role: 'staff',
        mustChangePassword: false
      });

      addStaffModal.classList.remove('active');
      addStaffForm.reset();
      state.showToast(`Faculty account for ${newStaff.name} created successfully!`, 'success');
      renderDashboard();
    });
  }

  // 4. Register Student Modal & Form
  const addStudentModal = document.getElementById('addStudentModal');
  const openAddStudentModalBtn = document.getElementById('openAddStudentModalBtn');
  const closeAddStudentBtn = document.getElementById('closeAddStudentBtn');
  const cancelAddStudentBtn = document.getElementById('cancelAddStudentBtn');
  const addStudentForm = document.getElementById('addStudentForm');

  if (openAddStudentModalBtn) openAddStudentModalBtn.addEventListener('click', () => addStudentModal.classList.add('active'));
  if (closeAddStudentBtn) closeAddStudentBtn.addEventListener('click', () => addStudentModal.classList.remove('active'));
  if (cancelAddStudentBtn) cancelAddStudentBtn.addEventListener('click', () => addStudentModal.classList.remove('active'));

  if (addStudentForm) {
    addStudentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('studentNameInput').value.trim();
      const regNo = document.getElementById('studentRegInput').value.trim();
      const email = document.getElementById('studentEmailInput').value.trim();
      const dept = document.getElementById('studentDeptInput').value.trim();
      const semester = document.getElementById('studentSemSelect').value;
      const pass = document.getElementById('studentPasswordInput').value;

      const newStudent = state.addUser({
        name,
        regNo,
        email,
        department: dept,
        semester,
        password: pass,
        role: 'student',
        mustChangePassword: false
      });

      addStudentModal.classList.remove('active');
      addStudentForm.reset();
      state.showToast(`Student account for ${newStudent.name} (${regNo}) registered!`, 'success');
      renderDashboard();
    });
  }

  // Close modals on overlay backdrop click
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // 5. Render Dashboard
  function renderDashboard() {
    const users = state.getUsers();
    const tests = state.getTests();
    const submissions = state.getSubmissions();
    const auditLogs = state.getAuditLogs();

    const students = users.filter(u => u.role === 'student');
    const staffMembers = users.filter(u => u.role === 'staff');

    // Update KPI counters
    document.getElementById('statStudentCount').textContent = students.length;
    document.getElementById('statStaffCount').textContent = staffMembers.length;
    document.getElementById('statAssessmentCount').textContent = tests.length;
    document.getElementById('statSubmissionsCount').textContent = submissions.length;
    document.getElementById('staffRosterCountBadge').textContent = staffMembers.length;
    document.getElementById('studentRosterCountBadge').textContent = students.length;

    // Render Staff Table
    const staffTbody = document.getElementById('staffTableBody');
    staffTbody.innerHTML = '';
    if (staffMembers.length === 0) {
      staffTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-dim);">No faculty accounts registered yet. Click <strong>"+ Register Faculty Staff"</strong> above to create one.</td></tr>`;
    } else {
      staffMembers.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <div class="user-avatar staff" style="width:28px; height:28px; font-size:0.75rem;">${s.avatar || 'FA'}</div>
              <strong style="color:#fff;">${s.name}</strong>
            </div>
          </td>
          <td><span style="font-family:var(--font-mono); color:var(--text-muted); font-size:0.82rem;">${s.email}</span></td>
          <td>${s.department || 'Academic Faculty'}</td>
          <td><span class="badge badge-staff">Faculty</span></td>
          <td><span class="badge badge-graded">Active</span></td>
          <td style="text-align:right;">
            <button type="button" class="btn-remove-user btn-delete-staff" data-user-id="${s.id}" data-name="${s.name}">
              Delete
            </button>
          </td>
        `;
        staffTbody.appendChild(tr);
      });
    }

    // Render Student Table
    const studentTbody = document.getElementById('studentTableBody');
    studentTbody.innerHTML = '';
    if (students.length === 0) {
      studentTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-dim);">No student accounts enrolled yet. Click <strong>"+ Register Student"</strong> above to enroll students.</td></tr>`;
    } else {
      students.forEach(st => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <div class="user-avatar student" style="width:28px; height:28px; font-size:0.75rem;">${st.avatar || 'ST'}</div>
              <strong style="color:#fff;">${st.name}</strong>
            </div>
          </td>
          <td><span style="font-family:var(--font-mono); color:#34d399; font-weight:600; font-size:0.82rem;">${st.regNo || 'N/A'}</span></td>
          <td><span style="font-family:var(--font-mono); color:var(--text-muted); font-size:0.82rem;">${st.email}</span></td>
          <td>${st.department || 'Computer Science'}</td>
          <td>${st.semester || 'Semester 1'}</td>
          <td><span class="badge badge-graded">Enrolled</span></td>
          <td style="text-align:right;">
            <button type="button" class="btn-remove-user btn-delete-student" data-user-id="${st.id}" data-name="${st.name}">
              Delete
            </button>
          </td>
        `;
        studentTbody.appendChild(tr);
      });
    }

    // Attach User Deletion Listeners
    document.querySelectorAll('.btn-delete-staff, .btn-delete-student').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const userId = btn.getAttribute('data-user-id');
        const name = btn.getAttribute('data-name');
        if (confirm(`Are you sure you want to remove account for ${name}?`)) {
          const res = state.deleteUser(userId);
          if (res.success) {
            state.showToast(`Account for ${name} removed.`, 'info');
            renderDashboard();
          } else {
            state.showToast(res.message || 'Error deleting user', 'error');
          }
        }
      });
    });

    // Render Tests Overview
    const testsTbody = document.getElementById('adminTestsBody');
    testsTbody.innerHTML = '';
    tests.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="badge" style="background:rgba(255,255,255,0.06);">${t.code}</span></td>
        <td><strong style="color:#fff;">${t.title}</strong></td>
        <td style="color:var(--text-muted);">${t.department}</td>
        <td>${t.totalMarks} Marks</td>
        <td>${t.durationMinutes} Mins</td>
      `;
      testsTbody.appendChild(tr);
    });

    // Render Audit Trail
    const auditContainer = document.getElementById('auditLogList');
    auditContainer.innerHTML = '';
    auditLogs.slice(0, 15).forEach(l => {
      const item = document.createElement('div');
      item.className = 'audit-log-item';
      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-size:0.75rem;">
          <strong style="color:#a5b4fc;">${l.action}</strong>
          <span style="color:var(--text-dim);">${l.time}</span>
        </div>
        <div style="font-size:0.78rem; color:var(--text-muted);">${l.detail}</div>
      `;
      auditContainer.appendChild(item);
    });
  }

  renderDashboard();
})();
