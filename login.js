// UniTest Unified Login Controller
(function () {
  const state = window.PortalState;
  if (!state) return;

  // Splash Gate Protection
  const urlParams = new URLSearchParams(window.location.search);
  const cameFromSplash = urlParams.get('splash') === '1' || sessionStorage.getItem('unitest_splash_ready') === '1';

  // Check if session exists
  const activeSession = state.getSession();
  if (activeSession) {
    if (activeSession.role === 'student') {
      window.location.replace('index.html');
      return;
    } else if (activeSession.role === 'staff') {
      window.location.replace('staff-dashboard.html');
      return;
    } else if (activeSession.role === 'superadmin') {
      window.location.replace('superadmin-dashboard.html');
      return;
    }
  }

  // If directly opened without splash, route to splash screen first
  if (!cameFromSplash && !document.referrer.includes('splash.html')) {
    window.location.replace('splash.html');
    return;
  }

  // DOM Elements
  const form = document.getElementById('loginForm');
  const idInput = document.getElementById('loginId');
  const passInput = document.getElementById('loginPass');
  const togglePassBtn = document.getElementById('togglePassBtn');
  const submitBtn = document.getElementById('submitBtn');

  // Change Password Modal Elements
  const modal = document.getElementById('changePasswordModal');
  const changePwForm = document.getElementById('changePasswordForm');
  const newPassInput = document.getElementById('newPassword');
  const confirmPassInput = document.getElementById('confirmPassword');
  const pwBar = document.getElementById('pwStrengthBar');
  const pwText = document.getElementById('pwStrengthText');
  const cancelChangePwBtn = document.getElementById('cancelChangePwBtn');
  const toggleNewPassBtn = document.getElementById('toggleNewPassBtn');

  let pendingStudent = null;

  // Password Visibility Toggle
  togglePassBtn.addEventListener('click', () => {
    const isPass = passInput.type === 'password';
    passInput.type = isPass ? 'text' : 'password';
    togglePassBtn.textContent = isPass ? '🔒' : '👁️';
  });

  if (toggleNewPassBtn) {
    toggleNewPassBtn.addEventListener('click', () => {
      const isPass = newPassInput.type === 'password';
      newPassInput.type = isPass ? 'text' : 'password';
      toggleNewPassBtn.textContent = isPass ? '🔒' : '👁️';
    });
  }

  // Demo Credentials Auto-Fill
  document.getElementById('demoStudentBtn').addEventListener('click', () => {
    idInput.value = '2024CS101';
    passInput.value = 'student123';
    state.showToast('Filled active Student credentials (Sarah Jenkins)', 'info');
  });

  document.getElementById('demoNewStudentBtn').addEventListener('click', () => {
    idInput.value = '2024CS999';
    passInput.value = 'temp123';
    state.showToast('Filled first-time Student credentials (Triggers password change)', 'warning');
  });

  document.getElementById('demoStaffBtn').addEventListener('click', () => {
    idInput.value = 'staffa@unitest.edu';
    passInput.value = 'staff123';
    state.showToast('Filled Teacher / Staff credentials (Dr. Alan Turing)', 'info');
  });

  document.getElementById('demoAdminBtn').addEventListener('click', () => {
    idInput.value = 'admin@unitest.edu';
    passInput.value = 'admin123';
    state.showToast('Filled Super Admin credentials (Elena Vance)', 'info');
  });

  // Handle Login Submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = idInput.value.trim();
    const pass = passInput.value;

    if (!id || !pass) {
      state.showToast('Please fill in both fields', 'warning');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Verifying credentials...</span>';

    setTimeout(() => {
      const result = state.login(id, pass);

      if (result.mustChangePassword) {
        pendingStudent = result.user;
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Sign In to Portal</span><span>→</span>';
        modal.classList.add('active');
        state.showToast('First-time login detected. Please create your password.', 'warning');
        return;
      }

      if (result.success) {
        state.showToast(`Welcome back, ${result.user.name}! Redirecting...`, 'success');
        setTimeout(() => {
          window.location.href = result.redirect;
        }, 500);
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Sign In to Portal</span><span>→</span>';
        state.showToast(result.message || 'Authentication failed', 'error');
      }
    }, 450);
  });

  // Password Strength Analysis
  newPassInput.addEventListener('input', () => {
    const val = newPassInput.value;
    let score = 0;
    if (val.length >= 6) score += 25;
    if (val.length >= 10) score += 25;
    if (/[0-9]/.test(val)) score += 25;
    if (/[^A-Za-z0-9]/.test(val)) score += 25;

    pwBar.style.width = `${score}%`;
    if (score <= 25) {
      pwBar.style.backgroundColor = '#ef4444';
      pwText.textContent = 'Strength: Weak (min 6 characters)';
    } else if (score <= 50) {
      pwBar.style.backgroundColor = '#f59e0b';
      pwText.textContent = 'Strength: Fair (add numbers/symbols)';
    } else if (score <= 75) {
      pwBar.style.backgroundColor = '#3b82f6';
      pwText.textContent = 'Strength: Good';
    } else {
      pwBar.style.backgroundColor = '#10b981';
      pwText.textContent = 'Strength: Excellent & Secure';
    }
  });

  // Change Password Form Submission
  changePwForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newPass = newPassInput.value;
    const confirmPass = confirmPassInput.value;

    if (newPass.length < 6) {
      state.showToast('Password must be at least 6 characters', 'error');
      return;
    }

    if (newPass !== confirmPass) {
      state.showToast('Passwords do not match', 'error');
      return;
    }

    if (!pendingStudent) {
      state.showToast('No active student context for update', 'error');
      return;
    }

    const res = state.updateStudentPassword(pendingStudent.id, newPass);
    if (res.success) {
      modal.classList.remove('active');
      state.showToast('Password saved successfully! Launching Student Dashboard...', 'success');
      setTimeout(() => {
        window.location.href = res.redirect;
      }, 700);
    } else {
      state.showToast(res.message, 'error');
    }
  });

  cancelChangePwBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    pendingStudent = null;
    state.clearSession();
  });
})();
