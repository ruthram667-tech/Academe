/**
 * Academe Portal - Unified Reactive State & Auth Engine
 * Synchronizes sessions, role-based access, and persistent mock/API data.
 */

(function () {
  const STORAGE_PREFIX = 'academe_';
  const OLD_PREFIX = 'unitest_';
  const KEYS = {
    SESSION: `${STORAGE_PREFIX}session`,
    USERS: `${STORAGE_PREFIX}users`,
    TESTS: `${STORAGE_PREFIX}tests`,
    SUBMISSIONS: `${STORAGE_PREFIX}submissions`,
    COURSES: `${STORAGE_PREFIX}courses`,
    PRESENTATIONS: `${STORAGE_PREFIX}presentations`,
    AUDIT: `${STORAGE_PREFIX}audit_logs`,
    SPLASH_DONE: `${STORAGE_PREFIX}splash_ready`
  };

  // Migrate any previous mock storage keys
  ['users', 'tests', 'submissions', 'courses', 'presentations', 'audit_logs', 'session'].forEach(k => {
    if (!localStorage.getItem(`${STORAGE_PREFIX}${k}`) && localStorage.getItem(`${OLD_PREFIX}${k}`)) {
      localStorage.setItem(`${STORAGE_PREFIX}${k}`, localStorage.getItem(`${OLD_PREFIX}${k}`));
    }
  });

  // Default Seed Data — Only Master Superadmin (All demo student/staff IDs removed)
  const DEFAULT_USERS = [
    {
      id: 'usr_superadmin',
      username: 'superadmin',
      email: 'admin@academe.edu',
      name: 'Master Superadmin',
      role: 'superadmin',
      department: 'Central Administration',
      password: 'admin123',
      mustChangePassword: false,
      avatar: 'SA'
    }
  ];

  // Purge legacy demo student & staff accounts from localStorage
  try {
    const rawStored = localStorage.getItem(KEYS.USERS);
    if (rawStored) {
      const parsed = JSON.parse(rawStored);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(u => 
          u.id !== 'usr_student_1' && 
          u.id !== 'usr_student_2' && 
          u.id !== 'usr_staff_1' &&
          u.id !== 'usr_admin_1' &&
          u.regNo !== '2024CS101' &&
          u.regNo !== '2024CS999' &&
          u.email !== 'staffa@academe.edu'
        );
        if (!cleaned.some(u => u.role === 'superadmin')) {
          cleaned.unshift(DEFAULT_USERS[0]);
        }
        localStorage.setItem(KEYS.USERS, JSON.stringify(cleaned));
      }
    }
  } catch (e) {
    console.warn('Storage purge error:', e);
  }

  const DEFAULT_COURSES = [
    {
      id: 'crs-101',
      code: 'CS301',
      name: 'Distributed Systems & Consensus Protocols',
      department: 'Computer Science',
      instructor: 'Dr. Alan Turing',
      instructorId: 'usr_staff_1',
      semester: 'Semester 6',
      credits: 4,
      description: 'Comprehensive study of distributed consensus, Raft, Paxos, fault tolerance, and replication.',
      notes: [
        {
          id: 'note-101',
          title: 'Unit 1: Raft Consensus Algorithm & Leader Election',
          topic: 'Consensus Protocols',
          description: 'Lecture breakdown of Raft state machines, randomized election timeouts, split-vote resolution, and heartbeat heartlines.',
          fileName: 'CS301_Unit1_Raft_Consensus.pdf',
          fileSize: '3.4 MB',
          uploadedAt: 'Sep 05, 2026',
          uploadedBy: 'Dr. Alan Turing'
        },
        {
          id: 'note-102',
          title: 'Unit 2: Practical Byzantine Fault Tolerance (PBFT)',
          topic: 'BFT & Distributed Ledgers',
          description: 'In-depth notes on 3f + 1 node quorum verification, pre-prepare, prepare, and commit phases.',
          fileName: 'CS301_Unit2_PBFT_Mechanisms.pdf',
          fileSize: '2.8 MB',
          uploadedAt: 'Sep 08, 2026',
          uploadedBy: 'Dr. Alan Turing'
        }
      ]
    },
    {
      id: 'crs-102',
      code: 'CS304',
      name: 'Cloud Native Microservices Architecture',
      department: 'Computer Science',
      instructor: 'Dr. Alan Turing',
      instructorId: 'usr_staff_1',
      semester: 'Semester 6',
      credits: 3,
      description: 'Event-driven systems, Saga pattern, Docker containerization, and Kubernetes service meshes.',
      notes: [
        {
          id: 'note-103',
          title: 'Unit 1: Event-Driven Sagas & Distributed Transactions',
          topic: 'Microservices Reliability',
          description: 'Choreography vs Orchestration based Saga patterns and compensation transaction design.',
          fileName: 'CS304_Unit1_Saga_Design_Patterns.pdf',
          fileSize: '4.1 MB',
          uploadedAt: 'Sep 02, 2026',
          uploadedBy: 'Dr. Alan Turing'
        }
      ]
    },
    {
      id: 'crs-103',
      code: 'CS202',
      name: 'Data Structures & Dynamic Programming',
      department: 'Computer Science',
      instructor: 'Dr. Alan Turing',
      instructorId: 'usr_staff_1',
      semester: 'Semester 6',
      credits: 4,
      description: 'Optimization algorithms, Matrix Chain Multiplication, graph traversals, and amortized complexity.',
      notes: [
        {
          id: 'note-104',
          title: 'Unit 3: Matrix Chain Multiplication & Tabular DP',
          topic: 'Dynamic Programming',
          description: 'Recurrence formulations, subchain length iterations, and memoized tabular approaches.',
          fileName: 'CS202_Unit3_Dynamic_Programming.pdf',
          fileSize: '1.9 MB',
          uploadedAt: 'Aug 28, 2026',
          uploadedBy: 'Dr. Alan Turing'
        }
      ]
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
      status: 'ongoing',
      isUpcoming: false,
      instructions: 'Review the problem statements below. Draft your complete analytical solutions and upload your response as a single PDF document.',
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
      status: 'upcoming',
      isUpcoming: true,
      instructions: 'Upcoming examination on Microservice Sagas and Kubernetes pod topology. PDF submission portal will activate on exam date.',
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
      status: 'completed',
      isUpcoming: false,
      instructions: 'Mid-term assessment on dynamic programming matrix multiplication.',
      questions: [
        {
          id: 'q1',
          prompt: 'Optimize matrix chain multiplication using memoization and tabular DP.',
          maxMarks: 100
        }
      ]
    }
  ];

  const DEFAULT_PRESENTATIONS = [
    {
      id: 'pres-101',
      title: 'Distributed Consensus & Raft Protocol Seminar',
      subject: 'Distributed Systems & Cloud Computing (CS301)',
      courseCode: 'CS301',
      instructorId: 'usr_staff_1',
      instructor: 'Dr. Alan Turing',
      scheduledDate: 'Sep 18, 2026',
      timeSlot: '10:00 AM - 12:30 PM',
      durationMinutes: 15,
      guidelines: 'Prepare a 10-slide PowerPoint presentation (.pptx or .pdf) explaining Raft leader election, split vote mitigation, and log compaction.',
      submissions: [
        {
          id: 'psub-001',
          studentId: 'usr_student_1',
          studentName: 'Sarah Jenkins',
          regNo: '2024CS101',
          pptFileName: 'SarahJenkins_CS301_Consensus_Presentation.pptx',
          pptFileSize: '5.2 MB',
          uploadedAt: 'Sep 09, 2026, 11:30 AM',
          status: 'Submitted'
        }
      ]
    },
    {
      id: 'pres-102',
      title: 'Cloud Native Saga Orchestrator Case Study',
      subject: 'Cloud Native Microservices Architecture (CS304)',
      courseCode: 'CS304',
      instructorId: 'usr_staff_1',
      instructor: 'Dr. Alan Turing',
      scheduledDate: 'Sep 24, 2026',
      timeSlot: '02:00 PM - 04:30 PM',
      durationMinutes: 20,
      guidelines: 'Present an architectural case study comparing choreography vs orchestration in e-commerce microservices with failure recovery flows.',
      submissions: []
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
      fileName: 'SarahJenkins_CS301_Consensus_Solution.pdf',
      fileSize: '2.4 MB',
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
      fileName: 'DavidMiller_CS301_Distributed_Systems.pdf',
      fileSize: '1.8 MB',
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
      fileName: 'SarahJenkins_CS202_DP_Matrix.pdf',
      fileSize: '3.1 MB',
      answers: {
        q1: 'Tabular DP approach computes optimal split point k for all subchain lengths L from 2 to n. Recurrence: m[i,j] = min(m[i,k] + m[k+1,j] + p[i-1]*p[k]*p[j]).'
      }
    }
  ];

  const DEFAULT_AUDIT_LOGS = [
    { time: '10:15 AM', action: 'Evaluation Saved', detail: 'Dr. Alan Turing scored David Miller on CS301 (88/100)' },
    { time: '09:42 AM', action: 'Assessment Submission', detail: 'Sarah Jenkins (2024CS101) submitted CS301 PDF' },
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
  if (!localStorage.getItem(KEYS.COURSES)) save(KEYS.COURSES, DEFAULT_COURSES);
  if (!localStorage.getItem(KEYS.TESTS)) save(KEYS.TESTS, DEFAULT_TESTS);
  if (!localStorage.getItem(KEYS.PRESENTATIONS)) save(KEYS.PRESENTATIONS, DEFAULT_PRESENTATIONS);
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
      const staffOrAdmin = users.find(u => {
        if (u.role === 'superadmin') {
          return (u.email && u.email.toLowerCase() === cleanId) || 
                 (u.username && u.username.toLowerCase() === cleanId) || 
                 cleanId === 'superadmin' || 
                 cleanId === 'admin';
        }
        if (u.role === 'staff') {
          return (u.email && u.email.toLowerCase() === cleanId) || 
                 (u.username && u.username.toLowerCase() === cleanId) || 
                 (u.id && u.id.toLowerCase() === cleanId);
        }
        return false;
      });

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
          return { success: false, message: 'Incorrect credentials.' };
        }
      }

      return { success: false, message: 'No registered user account found with this ID.' };
    },

    // Role-specific Logins (for alternative direct login pages)
    studentLogin: function (regNo, password) {
      const users = load(KEYS.USERS, DEFAULT_USERS);
      const clean = String(regNo).trim().toLowerCase();
      const student = users.find(u => u.role === 'student' && (
        (u.regNo && u.regNo.toLowerCase() === clean) ||
        (u.email && u.email.toLowerCase() === clean)
      ));
      if (!student) return { success: false, message: 'Student account not found.' };
      if (student.password !== password) return { success: false, message: 'Incorrect password.' };
      if (student.mustChangePassword) return { success: true, mustChangePassword: true, user: student };
      this.setSession(student);
      return { success: true, redirect: 'index.html', user: student };
    },

    staffLogin: function (email, password) {
      const users = load(KEYS.USERS, DEFAULT_USERS);
      const clean = String(email).trim().toLowerCase();
      const staff = users.find(u => u.role === 'staff' && (
        (u.email && u.email.toLowerCase() === clean) ||
        (u.username && u.username.toLowerCase() === clean)
      ));
      if (!staff) return { success: false, message: 'Staff account not found.' };
      if (staff.password !== password) return { success: false, message: 'Incorrect password.' };
      this.setSession(staff);
      return { success: true, redirect: 'staff-dashboard.html', user: staff };
    },

    superadminLogin: function (identifier, password) {
      const users = load(KEYS.USERS, DEFAULT_USERS);
      const clean = String(identifier).trim().toLowerCase();
      const admin = users.find(u => u.role === 'superadmin' && (
        (u.email && u.email.toLowerCase() === clean) ||
        (u.username && u.username.toLowerCase() === clean) ||
        clean === 'superadmin' ||
        clean === 'admin'
      ));
      if (!admin) return { success: false, message: 'Superadmin account not found.' };
      if (admin.password !== password) return { success: false, message: 'Incorrect master password.' };
      this.setSession(admin);
      return { success: true, redirect: 'superadmin-dashboard.html', user: admin };
    },

    // First time password change & forced update
    changeUserPassword: function (identifierOrId, newPassword) {
      const users = load(KEYS.USERS, DEFAULT_USERS);
      const clean = String(identifierOrId || '').trim().toLowerCase();
      const userIndex = users.findIndex(u => 
        u.id === identifierOrId || 
        (u.regNo && u.regNo.toLowerCase() === clean) || 
        (u.email && u.email.toLowerCase() === clean)
      );
      if (userIndex === -1) return { success: false, message: 'User account not found' };

      users[userIndex].password = newPassword;
      users[userIndex].mustChangePassword = false;
      save(KEYS.USERS, users);

      const updatedUser = users[userIndex];
      this.setSession(updatedUser);
      this.logAudit('Password Updated', `${updatedUser.name} updated account password.`);

      let redirect = 'index.html';
      if (updatedUser.role === 'staff') redirect = 'staff-dashboard.html';
      else if (updatedUser.role === 'superadmin') redirect = 'superadmin-dashboard.html';

      return { success: true, redirect: redirect, user: updatedUser };
    },

    updateStudentPassword: function (userId, newPassword) {
      return this.changeUserPassword(userId, newPassword);
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

    // Courses & Notes
    getCourses: function () {
      return load(KEYS.COURSES, DEFAULT_COURSES);
    },

    getCourseById: function (id) {
      return this.getCourses().find(c => c.id === id || c.code === id);
    },

    addCourseNote: function (courseId, noteData) {
      const courses = this.getCourses();
      const course = courses.find(c => c.id === courseId || c.code === courseId);
      if (!course) return { success: false, message: 'Course not found' };

      if (!course.notes) course.notes = [];
      const session = this.getSession();
      const staffName = session ? session.name : (course.instructor || 'Faculty');

      const newNote = {
        id: `note-${Date.now().toString().slice(-4)}`,
        title: noteData.title,
        topic: noteData.topic || 'General Lecture Notes',
        description: noteData.description || '',
        fileName: noteData.fileName || `${course.code}_Lecture_Notes.pdf`,
        fileSize: noteData.fileSize || '2.5 MB',
        fileUrl: noteData.fileUrl || '#',
        uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        uploadedBy: staffName
      };

      course.notes.unshift(newNote);
      save(KEYS.COURSES, courses);
      this.logAudit('Note Added', `Notes "${newNote.title}" added to ${course.code}`);
      return { success: true, note: newNote, course: course };
    },

    deleteCourseNote: function (courseId, noteId) {
      const courses = this.getCourses();
      const course = courses.find(c => c.id === courseId || c.code === courseId);
      if (!course || !course.notes) return { success: false, message: 'Course not found' };

      course.notes = course.notes.filter(n => n.id !== noteId);
      save(KEYS.COURSES, courses);
      this.logAudit('Note Removed', `Removed note from ${course.code}`);
      return { success: true };
    },

    // Presentations
    getPresentations: function () {
      return load(KEYS.PRESENTATIONS, DEFAULT_PRESENTATIONS);
    },

    getPresentationById: function (id) {
      return this.getPresentations().find(p => p.id === id);
    },

    createPresentation: function (presData) {
      const presentations = this.getPresentations();
      const session = this.getSession();
      const staffName = session ? session.name : 'Faculty';

      const newPres = {
        id: `pres-${Date.now().toString().slice(-4)}`,
        title: presData.title,
        subject: presData.subject,
        courseCode: presData.courseCode || 'CS301',
        instructor: staffName,
        instructorId: session ? session.id : 'usr_staff_1',
        scheduledDate: presData.scheduledDate,
        timeSlot: presData.timeSlot || '10:00 AM - 01:00 PM',
        durationMinutes: Number(presData.durationMinutes) || 15,
        guidelines: presData.guidelines || 'Upload PowerPoint slide presentation (.pptx or .pdf) before the scheduled date.',
        submissions: []
      };

      presentations.unshift(newPres);
      save(KEYS.PRESENTATIONS, presentations);
      this.logAudit('Presentation Scheduled', `Scheduled presentation "${newPres.title}"`);
      return { success: true, presentation: newPres };
    },

    uploadPresentationPPT: function (presId, fileData) {
      const session = this.getSession();
      if (!session || session.role !== 'student') return { success: false, message: 'Student login required' };

      const presentations = this.getPresentations();
      const pres = presentations.find(p => p.id === presId);
      if (!pres) return { success: false, message: 'Presentation not found' };

      if (!pres.submissions) pres.submissions = [];
      const existingIdx = pres.submissions.findIndex(s => s.studentId === session.id);

      const submissionRecord = {
        id: existingIdx >= 0 ? pres.submissions[existingIdx].id : `psub-${Date.now().toString().slice(-4)}`,
        studentId: session.id,
        studentName: session.name,
        regNo: session.regNo || '2024CS101',
        pptFileName: fileData.fileName || `${session.name.replace(/\s+/g, '_')}_Presentation.pptx`,
        pptFileSize: fileData.fileSize || '3.5 MB',
        uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: 'Submitted',
        fileUrl: fileData.fileUrl || '#'
      };

      if (existingIdx >= 0) {
        pres.submissions[existingIdx] = submissionRecord;
      } else {
        pres.submissions.unshift(submissionRecord);
      }

      save(KEYS.PRESENTATIONS, presentations);
      this.logAudit('Presentation PPT Uploaded', `${session.name} uploaded slides for ${pres.title}`);
      return { success: true, submission: submissionRecord };
    },

    // Data Accessors - Tests
    getTests: function () {
      return load(KEYS.TESTS, DEFAULT_TESTS);
    },

    getTestById: function (id) {
      return this.getTests().find(t => t.id === id);
    },

    createTest: function (testData) {
      const tests = this.getTests();
      const isUpcoming = testData.isUpcoming !== undefined ? testData.isUpcoming : (testData.status === 'upcoming');
      const newTest = {
        id: `test-${Date.now().toString().slice(-4)}`,
        title: testData.title,
        code: testData.code || 'CS' + Math.floor(100 + Math.random() * 900),
        department: testData.department || 'Computer Science',
        totalMarks: Number(testData.totalMarks) || 100,
        durationMinutes: Number(testData.durationMinutes) || 60,
        dueDate: testData.dueDate || 'In 3 days',
        status: testData.status || (isUpcoming ? 'upcoming' : 'ongoing'),
        isUpcoming: isUpcoming,
        instructions: testData.instructions || 'Review the problem statements below. Draft your complete analytical solutions and upload your response as a single PDF document.',
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

    uploadTestPDF: function (testId, docData) {
      return this.submitStudentDocument(testId, docData);
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

    deleteUser: function (userId) {
      const users = this.getUsers();
      const user = users.find(u => u.id === userId);
      if (!user) return { success: false, message: 'User not found' };
      if (user.role === 'superadmin') return { success: false, message: 'Cannot delete master superadmin account' };

      const updated = users.filter(u => u.id !== userId);
      save(KEYS.USERS, updated);
      this.logAudit('User Removed', `Removed ${user.name} (${user.role})`);
      return { success: true };
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
