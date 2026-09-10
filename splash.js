// UniTest Splash Controller
(function () {
  const fill = document.getElementById('loaderFill');
  const percentEl = document.getElementById('loaderPercent');
  const statusEl = document.getElementById('loaderStatus');
  
  const totalMs = 1200;
  const startTime = performance.now();

  const milestones = [
    { at: 0.15, text: 'Verifying environment...' },
    { at: 0.45, text: 'Loading assessment modules...' },
    { at: 0.75, text: 'Synchronizing authorization keys...' },
    { at: 0.95, text: 'Ready. Launching portal...' }
  ];

  function frame(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / totalMs);
    const pct = Math.round(progress * 100);

    if (fill) fill.style.width = `${pct}%`;
    if (percentEl) percentEl.textContent = `${pct}%`;

    // Update status text based on progress
    for (const m of milestones) {
      if (progress >= m.at && statusEl) {
        statusEl.textContent = m.text;
      }
    }

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      // Completed - Check if already has valid session
      setTimeout(() => {
        try {
          sessionStorage.setItem('unitest_splash_ready', '1');
          const session = window.PortalState ? window.PortalState.getSession() : null;
          if (session) {
            if (session.role === 'student') {
              window.location.replace('index.html');
              return;
            } else if (session.role === 'staff') {
              window.location.replace('staff-dashboard.html');
              return;
            } else if (session.role === 'superadmin') {
              window.location.replace('superadmin-dashboard.html');
              return;
            }
          }
        } catch (_err) {}

        window.location.replace('login.html?splash=1');
      }, 150);
    }
  }

  requestAnimationFrame(frame);
})();
