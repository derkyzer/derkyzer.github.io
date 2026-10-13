// Tactical CMYK Design System - Core Shared Interactivity
document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const themeToggle = document.getElementById('themeToggle');
  const trayToggle = document.getElementById('trayToggle');
  const tray = document.getElementById('contentTray');
  const pageWrapper = document.getElementById('pageWrapper');
  const backToTop = document.getElementById('backToTop');
  const iconTooltip = document.getElementById('iconTooltip');

  // 1. Theme Persistence (localStorage)
  const savedTheme = localStorage.getItem('kyzer_theme');
  if (savedTheme === 'light') {
    body.classList.remove('dark-mode');
  } else if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
  } else {
    // Default to dark mode
    body.classList.add('dark-mode');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', (e) => {
      e.preventDefault();
      body.classList.toggle('dark-mode');
      body.removeAttribute('style');
      const isDark = body.classList.contains('dark-mode');
      localStorage.setItem('kyzer_theme', isDark ? 'dark' : 'light');
    });
  }

  // 2. Drawer Tray Toggle with Smooth Animation & Auto-Close on Mouseleave
  if (trayToggle && tray) {
    function openTray() {
      tray.classList.add('open');
      if (pageWrapper) pageWrapper.classList.add('page-down');
    }

    function closeTray() {
      tray.classList.remove('open');
      if (pageWrapper) pageWrapper.classList.remove('page-down');
      if (iconTooltip) {
        iconTooltip.style.opacity = '0';
        iconTooltip.style.top = '-9999px';
      }
    }

    trayToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = tray.classList.contains('open');
      if (isOpen) {
        closeTray();
      } else {
        openTray();
      }
    });

    // Auto-close when the mouse stops hovering the drawer tray
    let closeTimeout = null;
    tray.addEventListener('mouseleave', () => {
      closeTimeout = setTimeout(() => {
        closeTray();
      }, 250);
    });

    tray.addEventListener('mouseenter', () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }
    });
  }

  // 3. Monospace Tooltips
  if (iconTooltip) {
    const iconLinks = document.querySelectorAll('.icon-links a[data-tooltip]');
    iconLinks.forEach(iconLink => {
      iconLink.addEventListener('mouseenter', () => {
        const tooltipText = iconLink.getAttribute('data-tooltip');
        iconTooltip.textContent = tooltipText;
        iconTooltip.style.opacity = '1';

        const rect = iconLink.getBoundingClientRect();
        const tooltipRect = iconTooltip.getBoundingClientRect();

        let top = rect.top - tooltipRect.height - 8;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

        if (top < 0) top = rect.bottom + 8;
        if (left < 0) left = 10;
        if (left + tooltipRect.width > window.innerWidth) left = window.innerWidth - tooltipRect.width - 10;

        iconTooltip.style.top = `${top}px`;
        iconTooltip.style.left = `${left}px`;
      });

      iconLink.addEventListener('mouseleave', () => {
        iconTooltip.style.opacity = '0';
        iconTooltip.style.top = '-9999px';
        iconTooltip.style.left = '-9999px';
      });
    });
  }

  // 4. Back to Top Smooth Scroll
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 5. Scrolled State for Header & Back to Top (Top bar scroll-fade toggleable, disabled by default)
  const ENABLE_HEADER_SCROLL_FADE = false;

  function updateScrolledState() {
    if (ENABLE_HEADER_SCROLL_FADE) {
      body.classList.add('enable-header-scroll-fade');
      if (window.scrollY > 40) {
        body.classList.add('scrolled');
      } else {
        body.classList.remove('scrolled');
      }
    } else {
      body.classList.remove('enable-header-scroll-fade');
      body.classList.add('scrolled');
    }

    if (backToTop) {
      if (window.scrollY > 280) {
        backToTop.classList.add('show');
      } else {
        backToTop.classList.remove('show');
      }
    }
  }

  window.addEventListener('scroll', updateScrolledState, { passive: true });
  updateScrolledState();
});
