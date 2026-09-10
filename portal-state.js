/**
 * UniTest Portal - Unified Reactive State & Auth Engine
 * Synchronizes sessions, role-based access, and persistent mock/API data.
 */

(function () {
  const STORAGE_PREFIX = 'unitest_';
  const KEYS = {
    SESSION: `${STORAGE_PREFIX}session`,
    USERS: `${STORAGE_PREFIX}users`,
    TESTS: `${STORAGE_PREFIX}tests`,
    SUBMISSIONS: `${STORAGE_PREFIX}submissions`,
    AUDIT: `${STORAGE_PREFIX}audit_logs`,
    SPLASH_DONE: `${STORAGE_PREFIX}splash_ready`
  };

  // Default Seed Data
  const DEFAULT_USERS = [
    {
      id: 'usr_student_1',
      regNo: '2024CS101',
      name: 'Sarah Jenkins',
      email: 'sarah.j@student.unitest.edu',
      role: 'student',
      department: 'Computer Science',
      semester: 'Semester 6',
      password: 'student123',
      mustChangePassword: false,
      avatar: 'SJ'
    },
    {
      id: 'usr_student_2',
      regNo: '2024CS999',
      name: 'Alex Rivera (First-Time)',
      email: 'alex.r@student.unitest.edu',
      role: 'student',
      department: 'Computer Science',
      semester: 'Semester 1',
      password: 'temp123',
      mustChangePassword: true, // Triggers password change modal
      avatar: 'AR'
    },
    {
      id: 'usr_staff_1',
      email: 'staffa@unitest.edu',
      name: 'Dr. Alan Turing',
      role: 'staff',
      department: 'Computer Science & AI',
      password: 'staff123',
      mustChangePassword: false,
      avatar: 'AT'
    },
    {
      id: 'usr_admin_1',
      email: 'admin@unitest.edu',
      name: 'Elena Vance',
      role: 'superadmin',
      department: 'Central Administration',
      password: 'admin123',
      mustChangePassword: false,
      avatar: 'EV'
    }
  ];

  const DEFAULT_TESTS = [
    {
      id: 'test-101',
      title: 'CS301: Advanced Distributed Consensus',
      code: 'CS301',
      department: 'Computer Science',
      totalMarks: 100,
      durationMinutes: 60,
      dueDate: 'Tomorrow at 11:59 PM',
      isUpcoming: false,
      questions: [
        {
          id: 'q1',
          prompt: 'Explain the Raft Consensus Algorithm and contrast its leader election with Paxos.',
          maxMarks: 50
        },
        {
          id: 'q2',
          prompt: 'Describe Byzantine Fault Tolerance (BFT) in modern permissioned distributed ledgers.',
          maxMarks: 50
        }
      ]
    },
    {
      id: 'test-102',
      title: 'CS304: Cloud Native Systems & Microservices',
      code: 'CS304',
      department: 'Systems Engineering',
      totalMarks: 50,
      durationMinutes: 45,
      dueDate: 'Oct 15, 2026',
      isUpcoming: true,
      questions: [
        {
          id: 'q1',
          prompt: 'Design an event-driven saga pattern for distributed payments across 3 microservices.',
          maxMarks: 50
        }
      ]
    },
    {
      id: 'test-103',
      title: 'CS202: Data Structures & Dynamic Programming',
      code: 'CS202',
      department: 'Algorithms',
      totalMarks: 100,
      durationMinutes: 90,
      dueDate: 'Completed Sep 01',
      isUpcoming: false,
      questions: [
        {
          id: 'q1',
          prompt: 'Optimize matrix chain multiplication using memoization and tabular DP.',
          maxMarks: 100
        }
      ]
    }
  ];

  const DEFAULT_SUBMISSIONS = [
    {
      id: 'sub-001',
      testId: 'test-101',
      testTitle: 'CS301: Advanced Distributed Consensus',
      studentId: 'usr_student_1',
      studentName: 'Sarah Jenkins',
      regNo: '2024CS101',
      submittedAt: 'Today at 09:42 AM',
      status: 'pending', // Pending evaluation by teacher
      score: null,
      maxScore: 100,
      feedback: '',
      answers: {
        q1: 'Raft operates with three states: Follower, Candidate, and Leader. Heartbeats maintain leadership. If timed out, an election is triggered using randomized timers to prevent split votes. Unlike Multi-Paxos which is symmetric and decentralized, Raft simplifies consensus by electing a strong leader.',
        q2: 'PBFT requires 3f + 1 nodes to tolerate f arbitrary/byzantine failures through pre-prepare, prepare, and commit phases. In permissioned ledgers, node identities are known, making message-based BFT practical without Proof of Work.'
      }
    },
    {
      id: 'sub-002',
      testId: 'test-101',
      testTitle: 'CS301: Advanced Distributed Consensus',
      studentId: 'usr_student_3',
      studentName: 'David Miller',
      regNo: '2024CS102',
      submittedAt: 'Yesterday at 04:15 PM',
      status: 'graded',
      score: 88,
      maxScore: 100,
      feedback: 'Excellent breakdown of randomized election timers and log replication mechanics.',
      answers: {
        q1: 'Raft breaks consensus into leader election, log replication, and safety. Raft guarantees that leader logs are authoritative.',
        q2: 'BFT consensus prevents malicious nodes from propagating false state transitions.'
      }
    },
    {
      id: 'sub-003',
      testId: 'test-103',
      testTitle: 'CS202: Data Structures & Dynamic Programming',
      studentId: 'usr_student_1',
      studentName: 'Sarah Jenkins',
      regNo: '2024CS101',
      submittedAt: 'Sep 01, 2026',
      status: 'graded',
      score: 94,
      maxScore: 100,
      feedback: 'Outstanding algorithmic complexity analysis (O(n^3) time and O(n^2) auxiliary table space).',
      answers: {
        q1: 'Tabular DP approach computes optimal split point k for all subchain lengths L from 2 to n. Recurrence: m[i,j] = min(m[i,k] + m[k+1,j] + p[i-1]*p[k]*p[j]).'
      }
    }
  ];

  const DEFAULT_AUDIT_LOGS = [
    { time: '10:15 AM', action: 'Evaluation Saved', detail: 'Dr. Alan Turing scored David Miller on CS301 (88/100)' },
    { time: '09:42 AM', action: 'Assessment Submission', detail: 'Sarah Jenkins (2024CS101) submitted CS301' },
    { time: '08:00 AM', action: 'Platform Health Check', detail: 'All services, Redis cache, and database online' }
  ];

  // Helper functions for LocalStorage
  function load(key, defaultVal) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage quota exceeded', e);
    }
  }

  // Initialize DB if not present
  if (!localStorage.getItem(KEYS.USERS)) save(KEYS.USERS, DEFAULT_USERS);
  if (!localStorage.getItem(KEYS.TESTS)) save(KEYS.TESTS, DEFAULT_TESTS);
  if (!localStorage.getItem(KEYS.SUBMISSIONS)) save(KEYS.SUBMISSIONS, DEFAULT_SUBMISSIONS);
  if (!localStorage.getItem(KEYS.AUDIT)) save(KEYS.AUDIT, DEFAULT_AUDIT_LOGS);

  // Global Portal State Object
  const PortalState = {
    // Current Session
    getSession: function () {
      try {
        return JSON.parse(sessionStorage.getItem(KEYS.SESSION) || 'null');
      } catch {
        return null;
      }
    },

    setSession: function (user) {
      const sessionObj = {
        ...user,
        loggedInAt: new Date().toISOString()
      };
      sessionStorage.setItem(KEYS.SESSION, JSON.stringify(sessionObj));
      return sessionObj;
    },

    clearSession: function () {
      sessionStorage.removeItem(KEYS.SESSION);
    },

    // Authentication Unified Check
    login: function (identifier, password) {
      const cleanId = String(identifier || '').trim().toLowerCase();
      const cleanPass = String(password || '');
      const users = load(KEYS.USERS, DEFAULT_USERS);

      // 1. Try Student Auth first (Registration Number or Email match)
      const student = users.find(u => 
        u.role === 'student' && 
        (u.regNo.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId)
      );

      if (student) {
        if (student.password === cleanPass) {
          if (student.mustChangePassword) {
            return {
              success: true,
              mustChangePassword: true,
              user: student,
              message: 'First-time login: Password update required.'
            };
          }
          this.setSession(student);
          this.logAudit('Student Login', `${student.name} (${student.regNo}) logged in.`);
          return { success: true, redirect: 'index.html', user: student };
        } else {
          return { success: false, message: 'Invalid password for student account.' };
        }
      }

      // 2. Try Staff / Admin Auth
      const staffOrAdmin = users.find(u => 
        (u.role === 'staff' || u.role === 'superadmin') && 
        u.email.toLowerCase() === cleanId
      );

      if (staffOrAdmin) {
        if (staffOrAdmin.password === cleanPass) {
          this.setSession(staffOrAdmin);
          if (staffOrAdmin.role === 'superadmin') {
            this.logAudit('Super Admin Login', `${staffOrAdmin.name} logged into Admin Console.`);
            return { success: true, redirect: 'superadmin-dashboard.html', user: staffOrAdmin };
          } else {
            this.logAudit('Staff Login', `${staffOrAdmin.name} logged into Teacher Dashboard.`);
            return { success: true, redirect: 'staff-dashboard.html', user: staffOrAdmin };
          }
        } else {
          return { success: false, message: 'Incorrect credentials for staff account.' };
        }
      }

      return { success: false, message: 'No registered student or staff account found with this ID.' };
    },

    // Role-specific Logins (for alternative direct login pages)
    studentLogin: function (regNo, password) {
      const users = load(KEYS.USERS, DEFAULT_USERS);
      const student = users.find(u => u.role === 'student' && u.regNo.toLowerCase() === String(regNo).trim().toLowerCase());
      if (!student) return { success: false, message: 'Student registration number not found.' };
      if (student.password !== password) return { success: false, message: 'Incorrect password.' };
      if (student.mustChangePassword) return { success: true, mustChangePassword: true, user: student };
      this.setSession(student);
      return { success: true, redirect: 'index.html', user: student };
    },

    staffLogin: function (email, password) {
      const users = load(KEYS.USERS, DEFAULT_USERS);
      const staff = users.find(u => u.role === 'staff' && u.email.toLowerCase() === String(email).trim().toLowerCase());
      if (!staff) return { success: false, message: 'Staff email not found.' };
      if (staff.password !== password) return { success: false, message: 'Incorrect password.' };
      this.setSession(staff);
      return { success: true, redirect: 'staff-dashboard.html', user: staff };
    },

    superadminLogin: function (email, password) {
      const users = load(KEYS.USERS, DEFAULT_USERS);
      const admin = users.find(u => u.role === 'superadmin' && u.email.toLowerCase() === String(email).trim().toLowerCase());
      if (!admin) return { success: false, message: 'Superadmin account not found.' };
      if (admin.password !== password) return { success: false, message: 'Incorrect password.' };
      this.setSession(admin);
      return { success: true, redirect: 'superadmin-dashboard.html', user: admin };
    },

    // First time password change
    updateStudentPassword: function (userId, newPassword) {
      const users = load(KEYS.USERS, DEFAULT_USERS);
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) return { success: false, message: 'User not found' };

      users[userIndex].password = newPassword;
      users[userIndex].mustChangePassword = false;
      save(KEYS.USERS, users);

      this.setSession(users[userIndex]);
      this.logAudit('Password Updated', `${users[userIndex].name} updated their default password.`);
      return { success: true, redirect: 'index.html', user: users[userIndex] };
    },

    // Logout routing adhering to architecture
    logout: function () {
      const session = this.getSession();
      const isSuperAdmin = session && session.role === 'superadmin';
      this.clearSession();
      if (isSuperAdmin) {
        window.location.href = 'superadmin-login.html';
      } else {
        window.location.href = 'login.html';
      }
    },

    // Session Route Guard
    requireAuth: function (allowedRoles) {
      const session = this.getSession();
      if (!session) {
        window.location.replace('login.html');
        return null;
      }
      if (allowedRoles && !allowedRoles.includes(session.role)) {
        // Redirect to their respective dashboard
        if (session.role === 'student') window.location.replace('index.html');
        else if (session.role === 'staff') window.location.replace('staff-dashboard.html');
        else if (session.role === 'superadmin') window.location.replace('superadmin-dashboard.html');
        return null;
      }
      return session;
    },

    // Data Accessors
    getTests: function () {
      return load(KEYS.TESTS, DEFAULT_TESTS);
    },

    getTestById: function (id) {
      return this.getTests().find(t => t.id === id);
    },

    createTest: function (testData) {
      const tests = this.getTests();
      const newTest = {
        id: `test-${Date.now().toString().slice(-4)}`,
        title: testData.title,
        code: testData.code || 'CS' + Math.floor(100 + Math.random() * 900),
        department: testData.department || 'Computer Science',
        totalMarks: Number(testData.totalMarks) || 100,
        durationMinutes: Number(testData.durationMinutes) || 60,
        dueDate: testData.dueDate || 'In 3 days',
        isUpcoming: false,
        questions: testData.questions || [
          { id: 'q1', prompt: testData.prompt || 'Answer the assigned problem statement.', maxMarks: Number(testData.totalMarks) || 100 }
        ]
      };
      tests.unshift(newTest);
      save(KEYS.TESTS, tests);
      this.logAudit('Test Created', `New assessment "${newTest.title}" published.`);
      return newTest;
    },

    getSubmissions: function () {
      return load(KEYS.SUBMISSIONS, DEFAULT_SUBMISSIONS);
    },

    getSubmissionById: function (subId) {
      return this.getSubmissions().find(s => s.id === subId);
    },

    getStudentSubmissions: function (studentId) {
      return this.getSubmissions().filter(s => s.studentId === studentId);
    },

    submitStudentTest: function (testId, answers) {
      const session = this.getSession();
      if (!session || session.role !== 'student') return { success: false, message: 'Student authentication required.' };
      const test = this.getTestById(testId);
      if (!test) return { success: false, message: 'Test not found.' };

      const submissions = this.getSubmissions();
      const newSub = {
        id: `sub-${Date.now().toString().slice(-4)}`,
        testId: test.id,
        testTitle: test.title,
        studentId: session.id,
        studentName: session.name,
        regNo: session.regNo,
        submittedAt: 'Just now',
        status: 'pending',
        score: null,
        maxScore: test.totalMarks,
        feedback: '',
        answers: answers
      };

      submissions.unshift(newSub);
      save(KEYS.SUBMISSIONS, submissions);
      this.logAudit('Assessment Submitted', `${session.name} submitted ${test.title}`);
      return { success: true, submission: newSub };
    },

    submitStudentDocument: function (testId, docData) {
      const session = this.getSession();
      if (!session || session.role !== 'student') return { success: false, message: 'Student authentication required.' };
      const test = this.getTestById(testId);
      if (!test) return { success: false, message: 'Assessment not found.' };

      const submissions = this.getSubmissions();
      const existingIdx = submissions.findIndex(s => s.testId === testId && s.studentId === session.id);

      const subRecord = {
        id: existingIdx >= 0 ? submissions[existingIdx].id : `sub-${Date.now().toString().slice(-4)}`,
        testId: test.id,
        testTitle: test.title,
        studentId: session.id,
        studentName: session.name,
        regNo: session.regNo,
        submittedAt: 'Just now',
        status: 'pending',
        score: null,
        maxScore: test.totalMarks || 100,
        feedback: '',
        answers: docData.answers || {
          summary: docData.summary || `Solution document uploaded: ${docData.fileName || 'document'}`
        },
        fileName: docData.fileName || 'Solution_Document.pdf',
        fileType: docData.fileType || 'application/pdf',
        fileSize: docData.fileSize || '1.8 MB',
        keywords: test.keywords || ['consensus', 'fault tolerance', 'algorithm', 'system']
      };

      if (existingIdx >= 0) {
        submissions[existingIdx] = { ...submissions[existingIdx], ...subRecord };
      } else {
        submissions.unshift(subRecord);
      }

      save(KEYS.SUBMISSIONS, submissions);
      this.logAudit('Document Uploaded', `${session.name} uploaded ${docData.fileName || 'document'} for ${test.title}`);
      return { success: true, submission: subRecord };
    },

    updateUserProfile: function (userId, data) {
      const users = load(KEYS.USERS, DEFAULT_USERS);
      const idx = users.findIndex(u => u.id === userId);
      if (idx === -1) return { success: false, message: 'User not found' };

      users[idx] = { ...users[idx], ...data };
      save(KEYS.USERS, users);

      const session = this.getSession();
      if (session && session.id === userId) {
        this.setSession({ ...session, ...data });
      }
      this.logAudit('Profile Updated', `${users[idx].name} updated profile information.`);
      return { success: true, user: users[idx] };
    },

    changeUserPassword: function (userId, oldPass, newPass) {
      const users = load(KEYS.USERS, DEFAULT_USERS);
      const idx = users.findIndex(u => u.id === userId);
      if (idx === -1) return { success: false, message: 'User not found' };

      if (users[idx].password !== oldPass) {
        return { success: false, message: 'Current password is incorrect.' };
      }

      users[idx].password = newPass;
      users[idx].mustChangePassword = false;
      save(KEYS.USERS, users);

      const session = this.getSession();
      if (session && session.id === userId) {
        this.setSession({ ...session, password: newPass, mustChangePassword: false });
      }
      this.logAudit('Password Changed', `${users[idx].name} updated account password.`);
      return { success: true, user: users[idx] };
    },

    saveGrade: function (subId, score, feedback) {
      const submissions = this.getSubmissions();
      const index = submissions.findIndex(s => s.id === subId);
      if (index === -1) return { success: false, message: 'Submission not found' };

      submissions[index].score = Number(score);
      submissions[index].feedback = feedback || 'Evaluation complete.';
      submissions[index].status = 'graded';
      save(KEYS.SUBMISSIONS, submissions);

      const staff = this.getSession();
      const staffName = staff ? staff.name : 'Teacher';
      this.logAudit('Grade Assigned', `${staffName} graded ${submissions[index].studentName} (${score}/${submissions[index].maxScore})`);
      return { success: true, submission: submissions[index] };
    },

    getAuditLogs: function () {
      return load(KEYS.AUDIT, DEFAULT_AUDIT_LOGS);
    },

    logAudit: function (action, detail) {
      const logs = this.getAuditLogs();
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      logs.unshift({ time: timeStr, action, detail });
      if (logs.length > 25) logs.pop();
      save(KEYS.AUDIT, logs);
    },

    getUsers: function () {
      return load(KEYS.USERS, DEFAULT_USERS);
    },

    addUser: function (userData) {
      const users = this.getUsers();
      const newUser = {
        id: `usr_${Date.now()}`,
        ...userData,
        avatar: (userData.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      };
      users.push(newUser);
      save(KEYS.USERS, users);
      this.logAudit('User Added', `Added ${newUser.name} with role ${newUser.role}`);
      return newUser;
    },

    // Toast UI notification utility
    showToast: function (message, type = 'info') {
      let container = document.getElementById('portalToastContainer');
      if (!container) {
        container = document.createElement('div');
        container.id = 'portalToastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
      };
      toast.innerHTML = `<span style="font-weight:bold; font-size:1.1rem">${icons[type] || 'ℹ'}</span><span>${message}</span>`;
      container.appendChild(toast);

      requestAnimationFrame(() => toast.classList.add('show'));
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
      }, 3500);
    }
  };

  // Expose to window
  window.PortalState = PortalState;
})();
