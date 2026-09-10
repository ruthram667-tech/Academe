// UniTest Super Admin Dashboard Controller
(function () {
  const state = window.PortalState;
  if (!state) return;

  // Enforce Super Admin Route Guard
  const admin = state.requireAuth(['superadmin']);
  if (!admin) return;

  // Set Profile UI
  document.getElementById('adminName').textContent = admin.name;
  document.getElementById('adminAvatar').textContent = admin.avatar || 'EV';

  // Logout Handler: Explicitly routes to superadmin-login.html per architecture
  document.getElementById('logoutBtn').addEventListener('click', () => {
    state.showToast('Ending administrator session...', 'info');
    setTimeout(() => {
      state.logout();
    }, 300);
  });

  // Modal Handlers
  const modal = document.getElementById('addStaffModal');
  const openModalBtn = document.getElementById('openAddStaffModalBtn');
  const closeModalBtn = document.getElementById('closeAddStaffBtn');
  const cancelModalBtn = document.getElementById('cancelAddStaffBtn');
  const form = document.getElementById('addStaffForm');

  openModalBtn.addEventListener('click', () => modal.classList.add('active'));
  closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));
  cancelModalBtn.addEventListener('click', () => modal.classList.remove('active'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('staffNameInput').value.trim();
    const email = document.getElementById('staffEmailInput').value.trim();
    const dept = document.getElementById('staffDeptInput').value.trim();
    const pass = document.getElementById('staffPasswordInput').value;

    const newStaff = state.addUser({
      name,
      email,
      department: dept,
      password: pass,
      role: 'staff',
      mustChangePassword: false
    });

    modal.classList.remove('active');
    form.reset();
    state.showToast(`Faculty account for ${newStaff.name} created!`, 'success');
    renderDashboard();
  });

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
    document.getElementById('staffRosterCountBadge').textContent = `${staffMembers.length} Accounts`;

    // Render Staff Table
    const staffTbody = document.getElementById('staffTableBody');
    staffTbody.innerHTML = '';
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
        <td><span class="badge badge-staff">Faculty / Teacher</span></td>
        <td><span class="badge badge-graded">Active</span></td>
      `;
      staffTbody.appendChild(tr);
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
        <td style="color:var(--text-muted);">${t.durationMinutes} Min</td>
      `;
      testsTbody.appendChild(tr);
    });

    // Render Audit Trail
    const auditContainer = document.getElementById('auditLogList');
    auditContainer.innerHTML = '';
    auditLogs.forEach(log => {
      const item = document.createElement('div');
      item.className = 'audit-log-item';
      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:0.82rem; color:#f1f5f9;">${log.action}</strong>
          <span style="font-size:0.72rem; color:var(--text-dim); font-family:var(--font-mono);">${log.time}</span>
        </div>
        <p style="font-size:0.78rem; color:var(--text-muted); margin:0;">${log.detail}</p>
      `;
      auditContainer.appendChild(item);
    });
  }

  renderDashboard();
})();
