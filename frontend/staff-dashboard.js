(function () {
  'use strict';

  // 1. Session & Auth Check
  const state = window.PortalState;
  if (!state) {
    console.error('PortalState not loaded. Ensure portal-state.js is included.');
    return;
  }

  // Require staff role (redirects to login.html if not authenticated)
  const staffSession = state.requireAuth(['staff']);
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
      // Clear session and redirect to login
      if (state.clearSession) {
        state.clearSession();
      }
      window.location.replace('login.html');
    });
  }

  // 4. Client-side Routing / Tab Switching
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

})();
