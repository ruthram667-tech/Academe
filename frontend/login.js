/**
 * Academe — Modern Split-Screen Login & Authentication Controller
 * Powered by Bootstrap 5.3, AlertifyJS, and Particles.js
 */

(function () {
  'use strict';

  const state = window.PortalState;
  if (!state) {
    console.error('PortalState is required but not loaded.');
    return;
  }

  // ═════════════════════════════════════════════════════════════════
  // 1. Splash Screen & Active Session Routing
  // ═════════════════════════════════════════════════════════════════
  const urlParams = new URLSearchParams(window.location.search);
  const cameFromSplash = urlParams.get('splash') === '1' || 
                         sessionStorage.getItem('academe_splash_ready') === '1' || 
                         sessionStorage.getItem('unitest_splash_ready') === '1';

  // Check if session already exists
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

  // Always set splash ready flag so users and logouts land smoothly on login.html
  sessionStorage.setItem('academe_splash_ready', '1');

  // ═════════════════════════════════════════════════════════════════
  // 2. AlertifyJS Notification Helper
  // ═════════════════════════════════════════════════════════════════
  if (window.alertify) {
    window.alertify.set('notifier', 'position', 'top-right');
    window.alertify.set('notifier', 'delay', 4);
  }

  function notify(message, type = 'info') {
    if (window.alertify) {
      if (type === 'success') window.alertify.success(message);
      else if (type === 'error') window.alertify.error(message);
      else if (type === 'warning') window.alertify.warning(message);
      else window.alertify.message(message);
    } else if (state && state.showToast) {
      state.showToast(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // 3. Particles.js Interactive Canvas Initialization
  // ═════════════════════════════════════════════════════════════════
  // ═════════════════════════════════════════════════════════════════
  // 3. High-Performance Interactive Neural Constellation & 3D Stage
  // ═════════════════════════════════════════════════════════════════
  function initNeuralCanvas() {
    const canvas = document.getElementById('neuralCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    let width = canvas.width = parent.clientWidth || 600;
    let height = canvas.height = parent.clientHeight || 800;

    window.addEventListener('resize', () => {
      width = canvas.width = parent.clientWidth || 600;
      height = canvas.height = parent.clientHeight || 800;
    });

    const mouse = { x: -1000, y: -1000, radius: 150 };
    parent.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;

      // 3D Parallax Tilt Reaction on Hologram Stage
      const stage = document.getElementById('hologramStage');
      if (stage) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const tiltX = ((e.clientY - rect.top - centerY) / centerY) * -10;
        const tiltY = ((e.clientX - rect.left - centerX) / centerX) * 10;
        stage.style.transform = `perspective(1200px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;
      }
    });

    parent.addEventListener('mouseleave', () => {
      mouse.x = -1000;
      mouse.y = -1000;
      const stage = document.getElementById('hologramStage');
      if (stage) {
        stage.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
      }
    });

    const particleCount = 48;
    const particles = [];
    const colors = ['#38bdf8', '#818cf8', '#34d399', '#f472b6'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.1,
        vy: (Math.random() - 0.5) * 1.1,
        radius: Math.random() * 2.2 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        baseAlpha: Math.random() * 0.45 + 0.35
      });
    }

    function render() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        else if (p.y > height) p.y = 0;

        // Interaction with mouse
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius && dist > 0) {
          const force = (mouse.radius - dist) / mouse.radius;
          p.x -= (dx / dist) * force * 3;
          p.y -= (dy / dist) * force * 3;
        }

        // Draw glowing particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.baseAlpha;
        ctx.fill();

        // Connect nearby particles with dynamic light filaments
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const d = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (d < 125) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = '#38bdf8';
            ctx.globalAlpha = (1 - d / 125) * 0.28;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }

        // Connect particle to mouse with interactive luminous beam
        if (dist < 135) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = '#67e8f9';
          ctx.globalAlpha = (1 - dist / 135) * 0.55;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      requestAnimationFrame(render);
    }

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNeuralCanvas);
  } else {
    initNeuralCanvas();
  }

  // ═════════════════════════════════════════════════════════════════
  // 4. Tab Navigation ("User Portal" vs "Admin Portal")
  // ═════════════════════════════════════════════════════════════════
  const tabUserBtn = document.getElementById('tabUserBtn');
  const tabAdminBtn = document.getElementById('tabAdminBtn');
  const authTabsGroup = document.getElementById('authTabsGroup');
  const userFormPane = document.getElementById('userFormPane');
  const adminFormPane = document.getElementById('adminFormPane');
  const recoveryFormPane = document.getElementById('recoveryFormPane');

  let previousActiveTab = 'user'; // 'user' or 'admin'

  function switchTab(target) {
    if (target === 'user') {
      tabUserBtn.classList.add('active');
      tabAdminBtn.classList.remove('active');
      userFormPane.classList.add('active');
      adminFormPane.classList.remove('active');
      recoveryFormPane.classList.remove('active');
      authTabsGroup.style.display = 'flex';
      previousActiveTab = 'user';
    } else if (target === 'admin') {
      tabAdminBtn.classList.add('active');
      tabUserBtn.classList.remove('active');
      adminFormPane.classList.add('active');
      userFormPane.classList.remove('active');
      recoveryFormPane.classList.remove('active');
      authTabsGroup.style.display = 'flex';
      previousActiveTab = 'admin';
    }
  }

  if (tabUserBtn && tabAdminBtn) {
    tabUserBtn.addEventListener('click', () => switchTab('user'));
    tabAdminBtn.addEventListener('click', () => switchTab('admin'));
  }

  // ═════════════════════════════════════════════════════════════════
  // 5. Password Recovery Sub-Form Transitions
  // ═════════════════════════════════════════════════════════════════
  const userForgotPassBtn = document.getElementById('userForgotPassBtn');
  const adminLostPassBtn = document.getElementById('adminLostPassBtn');
  const recoveryBackBtn = document.getElementById('recoveryBackBtn');
  const recoveryForm = document.getElementById('recoveryForm');
  const recoveryIdInput = document.getElementById('recoveryIdInput');
  const recoveryEmailInput = document.getElementById('recoveryEmailInput');

  function showRecoveryPane(prefillId = '') {
    authTabsGroup.style.display = 'none';
    userFormPane.classList.remove('active');
    adminFormPane.classList.remove('active');
    recoveryFormPane.classList.add('active');
    if (prefillId && recoveryIdInput) {
      recoveryIdInput.value = prefillId;
    }
    if (recoveryIdInput) recoveryIdInput.focus();
  }

  function hideRecoveryPane() {
    recoveryFormPane.classList.remove('active');
    switchTab(previousActiveTab);
  }

  if (userForgotPassBtn) {
    userForgotPassBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const currentId = document.getElementById('userIdInput')?.value || '';
      showRecoveryPane(currentId);
    });
  }

  if (adminLostPassBtn) {
    adminLostPassBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const currentId = document.getElementById('adminIdInput')?.value || '';
      showRecoveryPane(currentId);
    });
  }

  if (recoveryBackBtn) {
    recoveryBackBtn.addEventListener('click', (e) => {
      e.preventDefault();
      hideRecoveryPane();
    });
  }

  if (recoveryForm) {
    recoveryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const recId = recoveryIdInput?.value.trim();
      const recEmail = recoveryEmailInput?.value.trim();

      if (!recId || !recEmail) {
        notify('Please enter both your User ID and Institutional Email.', 'warning');
        return;
      }

      const submitBtn = document.getElementById('recoverySubmitBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Transmitting Reset Dispatch...';
      }

      setTimeout(() => {
        notify(`Password reset instructions dispatched to ${recEmail}. Please check your inbox.`, 'success');
        if (recoveryForm) recoveryForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span class="btn-text">Send Password Reset Instructions</span><i class="fa-solid fa-paper-plane ms-2"></i>';
        }
        setTimeout(() => {
          hideRecoveryPane();
        }, 1200);
      }, 700);
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // 6. Dynamic AJAX Department Dropdown (for Admin ID)
  // ═════════════════════════════════════════════════════════════════
  const adminIdInput = document.getElementById('adminIdInput');
  const adminDeptGroup = document.getElementById('adminDeptGroup');
  const adminDeptSelect = document.getElementById('adminDeptSelect');
  const ajaxLoadingBadge = document.getElementById('ajaxLoadingBadge');
  let deptDebounceTimer = null;

  function handleAdminDeptLookup() {
    const val = (adminIdInput?.value || '').trim().toLowerCase();
    if (!adminDeptGroup) return;

    if (val.length >= 3) {
      adminDeptGroup.style.display = 'block';
      if (ajaxLoadingBadge) {
        ajaxLoadingBadge.style.display = 'inline-flex';
        ajaxLoadingBadge.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Checking...';
        ajaxLoadingBadge.className = 'badge bg-info-subtle text-info-emphasis ms-2';
      }

      clearTimeout(deptDebounceTimer);
      deptDebounceTimer = setTimeout(() => {
        if (ajaxLoadingBadge) {
          ajaxLoadingBadge.innerHTML = '<i class="fa-solid fa-circle-check me-1"></i> Verified Unit';
          ajaxLoadingBadge.className = 'badge bg-success-subtle text-success ms-2';
        }

        // Intelligently preselect based on ID
        if (adminDeptSelect) {
          if (val.includes('cs') || val.includes('turing') || val.includes('staff')) {
            adminDeptSelect.value = 'Computer Science & AI';
          } else if (val.includes('exam') || val.includes('eval')) {
            adminDeptSelect.value = 'Examination Cell';
          } else if (val.includes('affairs') || val.includes('reg')) {
            adminDeptSelect.value = 'Academic Affairs';
          } else {
            adminDeptSelect.value = 'Central Administration';
          }
        }
      }, 400);
    } else {
      adminDeptGroup.style.display = 'none';
    }
  }

  if (adminIdInput) {
    adminIdInput.addEventListener('input', handleAdminDeptLookup);
    adminIdInput.addEventListener('blur', handleAdminDeptLookup);
  }

  // ═════════════════════════════════════════════════════════════════
  // 7. Password Visibility Toggles
  // ═════════════════════════════════════════════════════════════════
  document.querySelectorAll('.toggle-password-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-input');
      const inputEl = document.getElementById(targetId);
      if (!inputEl) return;

      const isPassword = inputEl.type === 'password';
      inputEl.type = isPassword ? 'text' : 'password';

      const icon = btn.querySelector('i');
      if (icon) {
        if (isPassword) {
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        } else {
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      }
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 8. Superadmin Credentials Click-to-Fill Helper
  // ═════════════════════════════════════════════════════════════════
  const valSuperUser = document.getElementById('valSuperUser');
  const valSuperPass = document.getElementById('valSuperPass');

  if (valSuperUser && valSuperPass) {
    [valSuperUser, valSuperPass].forEach(el => {
      el.style.cursor = 'pointer';
      el.title = 'Click to fill superadmin credentials';
      el.addEventListener('click', () => {
        const adminIdInput = document.getElementById('adminIdInput');
        const adminPasswordInput = document.getElementById('adminPasswordInput');
        if (adminIdInput) adminIdInput.value = 'superadmin';
        if (adminPasswordInput) adminPasswordInput.value = 'admin123';
        notify('Superadmin credentials applied: superadmin / admin123', 'info');
      });
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // 9. Forced Password Change Modal & Live 5-Rule Checklist
  // ═════════════════════════════════════════════════════════════════
  const forcedModalEl = document.getElementById('forcedPasswordModal');
  let bsForcedModal = null;
  if (forcedModalEl && window.bootstrap) {
    bsForcedModal = window.bootstrap.Modal.getOrCreateInstance(forcedModalEl, {
      backdrop: 'static',
      keyboard: false
    });
  }

  const forcedModalUserId = document.getElementById('forcedModalUserId');
  const forcedPasswordForm = document.getElementById('forcedPasswordForm');
  const forcedNewPass = document.getElementById('forcedNewPass');
  const forcedConfirmPass = document.getElementById('forcedConfirmPass');
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('strengthText');
  const btnSaveForcedPassword = document.getElementById('btnSaveForcedPassword');

  const ruleLength = document.getElementById('ruleLength');
  const ruleNumber = document.getElementById('ruleNumber');
  const ruleSpecial = document.getElementById('ruleSpecial');
  const ruleNotId = document.getElementById('ruleNotId');
  const ruleMatch = document.getElementById('ruleMatch');

  let activePendingUser = null;

  function updateRuleItem(itemEl, isValid) {
    if (!itemEl) return;
    const icon = itemEl.querySelector('.rule-icon');
    if (isValid) {
      itemEl.classList.add('valid');
      if (icon) {
        icon.className = 'fa-solid fa-circle-check rule-icon text-success';
      }
    } else {
      itemEl.classList.remove('valid');
      if (icon) {
        icon.className = 'fa-solid fa-circle-xmark rule-icon';
      }
    }
  }

  function evaluatePasswordSecurity() {
    const newPass = forcedNewPass?.value || '';
    const confirmPass = forcedConfirmPass?.value || '';
    const currentId = activePendingUser?.regNo || activePendingUser?.email || activePendingUser?.id || '';

    // Rule 1: At least 8 characters
    const isLengthValid = newPass.length >= 8;
    updateRuleItem(ruleLength, isLengthValid);

    // Rule 2: At least one number
    const isNumberValid = /\d/.test(newPass);
    updateRuleItem(ruleNumber, isNumberValid);

    // Rule 3: At least one special character
    const isSpecialValid = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPass);
    updateRuleItem(ruleSpecial, isSpecialValid);

    // Rule 4: Must not equal User ID
    const isNotIdValid = newPass.length > 0 && 
                         newPass.toLowerCase() !== currentId.toLowerCase() &&
                         !newPass.toLowerCase().includes(currentId.toLowerCase());
    updateRuleItem(ruleNotId, isNotIdValid);

    // Rule 5: Passwords match
    const isMatchValid = newPass.length > 0 && confirmPass.length > 0 && (newPass === confirmPass);
    updateRuleItem(ruleMatch, isMatchValid);

    // Calculate Password Strength Score (0 to 100)
    let strengthScore = 0;
    if (newPass.length >= 8) strengthScore += 25;
    if (newPass.length >= 12) strengthScore += 15;
    if (/\d/.test(newPass)) strengthScore += 20;
    if (/[A-Z]/.test(newPass)) strengthScore += 20;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPass)) strengthScore += 20;
    if (strengthScore > 100) strengthScore = 100;

    if (strengthBar) {
      strengthBar.style.width = `${newPass.length === 0 ? 0 : Math.max(strengthScore, 10)}%`;
      if (strengthScore <= 35) {
        strengthBar.style.backgroundColor = '#ef4444'; // Red
        if (strengthText) {
          strengthText.textContent = 'Weak';
          strengthText.style.color = '#ef4444';
        }
      } else if (strengthScore <= 65) {
        strengthBar.style.backgroundColor = '#f59e0b'; // Amber
        if (strengthText) {
          strengthText.textContent = 'Medium';
          strengthText.style.color = '#f59e0b';
        }
      } else if (strengthScore <= 85) {
        strengthBar.style.backgroundColor = '#3b82f6'; // Blue
        if (strengthText) {
          strengthText.textContent = 'Strong';
          strengthText.style.color = '#3b82f6';
        }
      } else {
        strengthBar.style.backgroundColor = '#10b981'; // Emerald Green
        if (strengthText) {
          strengthText.textContent = 'Very Strong & Secure';
          strengthText.style.color = '#10b981';
        }
      }
    }

    // Enable Save button ONLY if all 5 rules pass
    const allPassed = isLengthValid && isNumberValid && isSpecialValid && isNotIdValid && isMatchValid;
    if (btnSaveForcedPassword) {
      btnSaveForcedPassword.disabled = !allPassed;
    }
  }

  if (forcedNewPass) forcedNewPass.addEventListener('input', evaluatePasswordSecurity);
  if (forcedConfirmPass) forcedConfirmPass.addEventListener('input', evaluatePasswordSecurity);

  function openForcedPasswordModal(userContext) {
    activePendingUser = userContext;
    if (forcedModalUserId) {
      forcedModalUserId.textContent = userContext.regNo || userContext.email || userContext.id;
    }
    if (forcedPasswordForm) forcedPasswordForm.reset();
    evaluatePasswordSecurity();

    if (bsForcedModal) {
      bsForcedModal.show();
    } else if (forcedModalEl) {
      forcedModalEl.classList.add('show');
      forcedModalEl.style.display = 'block';
    }
  }

  function closeForcedPasswordModal() {
    if (bsForcedModal) {
      bsForcedModal.hide();
    } else if (forcedModalEl) {
      forcedModalEl.classList.remove('show');
      forcedModalEl.style.display = 'none';
    }
  }

  if (forcedPasswordForm) {
    forcedPasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newPass = forcedNewPass?.value || '';

      if (!activePendingUser) {
        notify('User context missing for password update.', 'error');
        return;
      }

      if (btnSaveForcedPassword) {
        btnSaveForcedPassword.disabled = true;
        btnSaveForcedPassword.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Encrypting & Saving...';
      }

      setTimeout(() => {
        const userId = activePendingUser.id || activePendingUser.regNo || activePendingUser.email;
        const res = state.changeUserPassword ? 
                    state.changeUserPassword(userId, newPass) : 
                    state.updateStudentPassword(userId, newPass);

        if (res.success) {
          notify('Password updated successfully! Welcome to Academe.', 'success');
          closeForcedPasswordModal();
          setTimeout(() => {
            window.location.href = res.redirect || 'index.html';
          }, 600);
        } else {
          notify(res.message || 'Failed to update password.', 'error');
          if (btnSaveForcedPassword) {
            btnSaveForcedPassword.disabled = false;
            btnSaveForcedPassword.innerHTML = '<i class="fa-solid fa-check-double me-2"></i> Save Password & Continue';
          }
        }
      }, 500);
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // 10. Form Submission Handlers (User & Admin Portals)
  // ═════════════════════════════════════════════════════════════════
  const userLoginForm = document.getElementById('userLoginForm');
  const userSubmitBtn = document.getElementById('userSubmitBtn');

  if (userLoginForm) {
    userLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('userIdInput')?.value.trim();
      const pass = document.getElementById('userPasswordInput')?.value;

      if (!id || !pass) {
        notify('Please enter both your Student/Staff ID and Password.', 'warning');
        return;
      }

      if (userSubmitBtn) {
        userSubmitBtn.disabled = true;
        userSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Authenticating Session...';
      }

      setTimeout(() => {
        // Direct trigger if password matches User ID
        if (pass.toLowerCase() === id.toLowerCase()) {
          if (userSubmitBtn) {
            userSubmitBtn.disabled = false;
            userSubmitBtn.innerHTML = '<span class="btn-text">Sign In to Academe</span><i class="fa-solid fa-arrow-right-long ms-2"></i>';
          }
          notify('Security Alert: Password cannot match User ID. Please update now.', 'warning');
          openForcedPasswordModal({ id: id, regNo: id, email: id, name: id });
          return;
        }

        const result = state.login(id, pass);

        if (result.mustChangePassword) {
          if (userSubmitBtn) {
            userSubmitBtn.disabled = false;
            userSubmitBtn.innerHTML = '<span class="btn-text">Sign In to Academe</span><i class="fa-solid fa-arrow-right-long ms-2"></i>';
          }
          notify('First-time login detected. Password creation is mandatory.', 'warning');
          openForcedPasswordModal(result.user);
          return;
        }

        if (result.success) {
          notify(`Welcome back, ${result.user.name}! Redirecting...`, 'success');
          setTimeout(() => {
            window.location.href = result.redirect;
          }, 450);
        } else {
          if (userSubmitBtn) {
            userSubmitBtn.disabled = false;
            userSubmitBtn.innerHTML = '<span class="btn-text">Sign In to Academe</span><i class="fa-solid fa-arrow-right-long ms-2"></i>';
          }
          notify(result.message || 'Authentication failed. Please verify credentials.', 'error');
        }
      }, 450);
    });
  }

  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminSubmitBtn = document.getElementById('adminSubmitBtn');

  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('adminIdInput')?.value.trim();
      const pass = document.getElementById('adminPasswordInput')?.value;

      if (!id || !pass) {
        notify('Please enter your Master ID and Administrator Key.', 'warning');
        return;
      }

      if (adminSubmitBtn) {
        adminSubmitBtn.disabled = true;
        adminSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Verifying Root Authorization...';
      }

      setTimeout(() => {
        // Direct check if password matches User ID
        if (pass.toLowerCase() === id.toLowerCase()) {
          if (adminSubmitBtn) {
            adminSubmitBtn.disabled = false;
            adminSubmitBtn.innerHTML = '<span class="btn-text">Authenticate Master Session</span><i class="fa-solid fa-shield-check ms-2"></i>';
          }
          notify('Security Alert: Administrative password cannot match Master ID.', 'warning');
          openForcedPasswordModal({ id: id, email: id, name: id, role: 'superadmin' });
          return;
        }

        const result = state.login(id, pass);

        if (result.mustChangePassword) {
          if (adminSubmitBtn) {
            adminSubmitBtn.disabled = false;
            adminSubmitBtn.innerHTML = '<span class="btn-text">Authenticate Master Session</span><i class="fa-solid fa-shield-check ms-2"></i>';
          }
          notify('Security Policy: Initial credential update required.', 'warning');
          openForcedPasswordModal(result.user);
          return;
        }

        if (result.success) {
          notify(`Master credentials verified: ${result.user.name}. Opening console...`, 'success');
          setTimeout(() => {
            window.location.href = result.redirect;
          }, 450);
        } else {
          if (adminSubmitBtn) {
            adminSubmitBtn.disabled = false;
            adminSubmitBtn.innerHTML = '<span class="btn-text">Authenticate Master Session</span><i class="fa-solid fa-shield-check ms-2"></i>';
          }
          notify(result.message || 'Master session authentication failed.', 'error');
        }
      }, 500);
    });
  }

})();
