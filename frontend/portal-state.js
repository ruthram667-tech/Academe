/**
 * Academe Portal - Unified Reactive State & Auth Engine
 * Synchronizes sessions, role-based access, and persistent mock/API data.
 */

(function () {
  const STORAGE_PREFIX = 'academe_v3_'; // Bumped to force a clean slate for the user
  const OLD_PREFIX = 'academe_';
  const KEYS = {
    SESSION: `${STORAGE_PREFIX}session`,
    USERS: `${STORAGE_PREFIX}users`,
    TESTS: `${STORAGE_PREFIX}tests`,
    SUBMISSIONS: `${STORAGE_PREFIX}submissions`,
    COURSES: `${STORAGE_PREFIX}courses`,
    PRESENTATIONS: `${STORAGE_PREFIX}presentations`,
    AUDIT: `${STORAGE_PREFIX}audit_logs`,
    SPLASH_DONE: `${STORAGE_PREFIX}splash_ready`,
    CLASSES: `${STORAGE_PREFIX}classes`,
    STAFF_ASSIGNMENTS: `${STORAGE_PREFIX}staff_assignments`
  };

  // Default Seed Data — Only Master Superadmin (All demo student/staff IDs removed)
  const DEFAULT_USERS = [
    {
      id: 'usr_superadmin',
      username: 'RM',
      email: 'rm@academe.edu',
      name: 'RM',
      role: 'superadmin',
      department: 'Central Administration',
      password: 'RK',
      mustChangePassword: false,
      avatar: 'RM'
    }
  ];

  const DEFAULT_CLASSES = [
    { id: 'cls_c_sec', name: 'Class C Section', department: 'Computer Science', section: 'C', academicYear: '2024-2025' },
    { id: 'cls_a_sec', name: 'Class A Sec', department: 'Computer Science', section: 'A', academicYear: '2024-2025' },
    { id: 'cls_d_sec', name: 'Class D Sec', department: 'Computer Science', section: 'D', academicYear: '2024-2025' }
  ];

  const DEFAULT_STAFF_ASSIGNMENTS = [];
  const DEFAULT_COURSES = [];
  const DEFAULT_TESTS = [];
  const DEFAULT_PRESENTATIONS = [];
  const DEFAULT_SUBMISSIONS = [];
  const DEFAULT_AUDIT_LOGS = [];

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
  if (!localStorage.getItem(KEYS.CLASSES)) save(KEYS.CLASSES, DEFAULT_CLASSES);
  if (!localStorage.getItem(KEYS.STAFF_ASSIGNMENTS)) save(KEYS.STAFF_ASSIGNMENTS, DEFAULT_STAFF_ASSIGNMENTS);
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

      // 0. Bulletproof Superadmin Auth (Always works regardless of localStorage corruption)
      if (cleanId === 'rm' || cleanId === 'superadmin' || cleanId === 'admin') {
        if (cleanPass === 'rk' || cleanPass === 'RK') {
          const adminUser = {
            id: 'usr_superadmin',
            username: 'RM',
            email: 'rm@academe.edu',
            name: 'RM',
            role: 'superadmin',
            department: 'Central Administration',
            password: 'RK',
            mustChangePassword: false,
            avatar: 'RM'
          };
          this.setSession(adminUser);
          if (this.logAudit) this.logAudit('Super Admin Login', 'Master Superadmin logged into Admin Console via fallback.');
          return { success: true, redirect: 'superadmin-dashboard.html', user: adminUser };
        } else {
          return { success: false, message: 'Incorrect credentials for Master Superadmin.' };
        }
      }

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

    // Unified Password Change: supports both direct forced reset (userId, newPass) and authenticated profile update (userId, oldPass, newPass)
    changeUserPassword: function (identifierOrId, oldPassOrNewPass, optionalNewPass) {
      const users = load(KEYS.USERS, DEFAULT_USERS);
      const clean = String(identifierOrId || '').trim().toLowerCase();
      const userIndex = users.findIndex(u => 
        u.id === identifierOrId || 
        (u.regNo && u.regNo.toLowerCase() === clean) || 
        (u.email && u.email.toLowerCase() === clean) ||
        (u.username && u.username.toLowerCase() === clean)
      );
      if (userIndex === -1) return { success: false, message: 'User account not found' };

      const user = users[userIndex];

      // If 3 arguments provided: (userId, oldPass, newPass)
      if (optionalNewPass !== undefined) {
        const oldPass = oldPassOrNewPass;
        const newPass = optionalNewPass;
        if (user.password !== oldPass) {
          return { success: false, message: 'Current password is incorrect.' };
        }
        user.password = newPass;
      } else {
        // Direct reset: (userId, newPass)
        user.password = oldPassOrNewPass;
      }

      user.mustChangePassword = false;
      save(KEYS.USERS, users);

      const session = this.getSession();
      if (session && (session.id === user.id || session.regNo === user.regNo || session.email === user.email)) {
        this.setSession({ ...session, password: user.password, mustChangePassword: false });
      } else {
        this.setSession(user);
      }
      this.logAudit('Password Updated', `${user.name} updated account password.`);

      let redirect = 'index.html';
      if (user.role === 'staff') redirect = 'staff-dashboard.html';
      else if (user.role === 'superadmin') redirect = 'superadmin-dashboard.html';

      return { success: true, redirect: redirect, user: user };
    },

    updateStudentPassword: function (userId, newPassword) {
      return this.changeUserPassword(userId, newPassword);
    },

    // Logout routing adhering to architecture
    logout: function () {
      this.clearSession();
      window.location.href = 'login.html';
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

    // Classes & Sections Management
    getClasses: function () {
      return load(KEYS.CLASSES, DEFAULT_CLASSES);
    },

    getClassById: function (id) {
      return this.getClasses().find(c => c.id === id);
    },

    addClass: function (classData) {
      const classes = this.getClasses();
      const newClass = {
        id: `cls_${Date.now()}`,
        name: classData.name,
        department: classData.department || 'Computer Science',
        section: classData.section || '',
        academicYear: classData.academicYear || '2024-2025',
        createdAt: new Date().toISOString()
      };
      classes.push(newClass);
      save(KEYS.CLASSES, classes);
      this.logAudit('Class Created', `Created class "${newClass.name}"`);
      return newClass;
    },

    deleteClass: function (classId) {
      const classes = this.getClasses();
      const cls = classes.find(c => c.id === classId);
      const filtered = classes.filter(c => c.id !== classId);
      save(KEYS.CLASSES, filtered);
      
      // Cleanup staff assignments for this class
      const asgns = this.getStaffAssignments();
      save(KEYS.STAFF_ASSIGNMENTS, asgns.filter(a => a.classId !== classId));
      this.logAudit('Class Removed', `Deleted class "${cls ? cls.name : classId}"`);
      return { success: true };
    },

    // Staff Class Assignments & Subject Course Linking
    getStaffAssignments: function (staffId) {
      const all = load(KEYS.STAFF_ASSIGNMENTS, DEFAULT_STAFF_ASSIGNMENTS);
      if (staffId) {
        return all.filter(a => a.staffId === staffId);
      }
      return all;
    },

    assignStaffClass: function (staffId, classId) {
      const assignments = load(KEYS.STAFF_ASSIGNMENTS, DEFAULT_STAFF_ASSIGNMENTS);
      const existing = assignments.find(a => a.staffId === staffId && a.classId === classId);
      if (existing) {
        return { success: false, message: 'This class is already in your dashboard.' };
      }

      const cls = this.getClassById(classId);
      if (!cls) return { success: false, message: 'Class not found.' };

      const newAssignment = {
        id: `asgn_${Date.now()}`,
        staffId: staffId,
        classId: classId,
        className: cls.name,
        section: cls.section || '',
        department: cls.department || '',
        courses: []
      };
      assignments.push(newAssignment);
      save(KEYS.STAFF_ASSIGNMENTS, assignments);
      this.logAudit('Class Assigned', `Staff joined ${cls.name}`);
      return { success: true, assignment: newAssignment };
    },

    removeStaffClass: function (staffId, classId) {
      const assignments = load(KEYS.STAFF_ASSIGNMENTS, DEFAULT_STAFF_ASSIGNMENTS);
      const filtered = assignments.filter(a => !(a.staffId === staffId && a.classId === classId));
      save(KEYS.STAFF_ASSIGNMENTS, filtered);
      this.logAudit('Class Unassigned', `Staff left class ${classId}`);
      return { success: true };
    },

    addCourseToClass: function (staffId, classId, courseData) {
      const assignments = load(KEYS.STAFF_ASSIGNMENTS, DEFAULT_STAFF_ASSIGNMENTS);
      let asgn = assignments.find(a => a.staffId === staffId && a.classId === classId);
      if (!asgn) {
        const cls = this.getClassById(classId);
        asgn = {
          id: `asgn_${Date.now()}`,
          staffId: staffId,
          classId: classId,
          className: cls ? cls.name : 'Class',
          section: cls ? cls.section : '',
          department: cls ? cls.department : '',
          courses: []
        };
        assignments.push(asgn);
      }

      if (!asgn.courses) asgn.courses = [];

      // Register or update global course list
      const courses = this.getCourses();
      const code = (courseData.code || `CS${Math.floor(100 + Math.random() * 800)}`).toUpperCase();
      let course = courses.find(c => c.code.toUpperCase() === code || c.title.toLowerCase() === (courseData.title || '').toLowerCase());
      if (!course) {
        course = {
          id: `course-${Date.now().toString().slice(-4)}`,
          code: code,
          name: courseData.title || courseData.name || 'Subject Course',
          title: courseData.title || courseData.name || 'Subject Course',
          department: asgn.department || 'Computer Science',
          credits: Number(courseData.credits) || 3,
          instructor: this.getSession() ? this.getSession().name : 'Faculty',
          instructorId: staffId,
          notes: []
        };
        courses.push(course);
        save(KEYS.COURSES, courses);
      }

      // Avoid duplicate courses within the same class card
      if (!asgn.courses.some(c => c.code.toUpperCase() === course.code.toUpperCase())) {
        asgn.courses.push({
          id: course.id,
          code: course.code,
          title: course.title || course.name
        });
      }

      save(KEYS.STAFF_ASSIGNMENTS, assignments);
      this.logAudit('Course Added to Class', `Assigned ${course.code} to ${asgn.className}`);
      return { success: true, course: course };
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
