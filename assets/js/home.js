document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const tray = document.getElementById('contentTray');
  const trayToggle = document.getElementById('trayToggle');
  const themeToggle = document.getElementById('themeToggle');
  const backToTop = document.getElementById('backToTop');
  const iconTooltip = document.getElementById('iconTooltip');
  const heroLogo = document.getElementById('heroLogo');


  // Periodic Micro-Voltage Blink on K, Y, Z, E, R (every ~26s)
  const heroGlyphs = [
    document.getElementById('glyphK'),
    document.getElementById('glyphY'),
    document.getElementById('glyphZ'),
    document.getElementById('glyphSharedE'),
    document.getElementById('glyphSharedR')
  ].filter(Boolean);

  // Clean up initial startup animation class so hover colors trigger immediately
  heroGlyphs.forEach(el => {
    el.addEventListener('animationend', () => {
      el.classList.remove('voltage-startup');
      el.classList.remove('voltage-blink');
    });
  });
  setTimeout(() => {
    heroGlyphs.forEach(el => el.classList.remove('voltage-startup'));
  }, 500);

  setInterval(() => {
    heroGlyphs.forEach(el => {
      el.classList.remove('voltage-blink');
      void el.offsetWidth; // trigger reflow
      el.classList.add('voltage-blink');
    });
  }, 26000);


  // Hero Logo Scroll Morphing Animation ("KYZER" -> "KYZER WEBER" shared ER)
  const glyphW = document.getElementById('glyphW');
  const glyphE = document.getElementById('glyphE');
  const glyphB = document.getElementById('glyphB');

  // Top bar scroll fade-in functionality (preserved, disabled by default for instant accessibility)
  const ENABLE_HEADER_SCROLL_FADE = false;

  function getTargetSnapPoint() {
    const heroSection = document.querySelector('.hero-section');
    return heroSection ? Math.max(40, heroSection.offsetTop - 70) : Math.max(40, window.innerHeight - 140);
  }

  function updateHero() {
    const sy = window.scrollY;
    const snapPoint = getTargetSnapPoint();
    const maxScroll = Math.max(100, snapPoint);
    const t = Math.min(Math.max(sy / maxScroll, 0), 1);

    // Frame hero text centered above the peeking content fold (~140px peek)
    const peekOffset = 140;
    const availableHeroHeight = Math.max(200, window.innerHeight - peekOffset);
    const startY = availableHeroHeight / 2;
    const endY = 60 / 2;
    const currentY = startY + (endY - startY) * t;

    // Proportional hero text width scaling with viewport width (even larger, ultra prominent presence)
    const containerWidth = Math.min(340, window.innerWidth * 0.7);
    const startWidth = Math.min(1800, Math.max(380, window.innerWidth * 0.94));
    const width = startWidth * (1 - t) + containerWidth * t;

    const baseScale = Math.min(1.75, Math.max(1.2, (window.innerWidth * 0.94) / 480));
    const scale = baseScale * (1 - t) + 0.52 * t;

    heroLogo.style.position = 'fixed';
    heroLogo.style.left = '50%';
    heroLogo.style.top = currentY + 'px';
    heroLogo.style.transform = `translate(-50%, -50%) scale(${scale})`;
    heroLogo.style.width = `${width}px`;

    // Reversed W E B visibility: Visible only when hero is big (t=0) and fades out before entering top bar
    if (glyphW && glyphE && glyphB) {
      const weberFade = Math.max(0, Math.min(1, 1 - (t / 0.55)));
      glyphW.style.opacity = weberFade.toFixed(2);
      glyphE.style.opacity = weberFade.toFixed(2);
      glyphB.style.opacity = weberFade.toFixed(2);
    }

    if (ENABLE_HEADER_SCROLL_FADE) {
      body.classList.add('enable-header-scroll-fade');
      if (t > 0.08 || sy > 20) {
        body.classList.add('scrolled');
      } else {
        body.classList.remove('scrolled');
      }
    } else {
      body.classList.remove('enable-header-scroll-fade');
      body.classList.add('scrolled');
    }

    if (sy > 300) {
      backToTop.classList.add('show');
    } else {
      backToTop.classList.remove('show');
    }

    requestAnimationFrame(updateHero);
  }
  requestAnimationFrame(updateHero);


  // Auto-scroll snap: cleanly frames "Hi, Welcome, Hello" (MOD.00) without overshooting
  let scrollSnapTimer = null;
  let isAutoScrolling = false;
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    const scrollingDown = currentScroll > lastScrollY;
    lastScrollY = currentScroll;

    if (isAutoScrolling) return;
    clearTimeout(scrollSnapTimer);
    scrollSnapTimer = setTimeout(() => {
      const current = window.scrollY;
      const targetSnapPoint = getTargetSnapPoint();

      // If stranded between top (0) and "Hi, Welcome, Hello"
      if (current > 15 && current < targetSnapPoint) {
        isAutoScrolling = true;
        if (scrollingDown) {
          if (current >= 40) {
            window.scrollTo({ top: targetSnapPoint, behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else {
          if (current <= targetSnapPoint - 40) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            window.scrollTo({ top: targetSnapPoint, behavior: 'smooth' });
          }
        }
        setTimeout(() => { isAutoScrolling = false; }, 600);
      }
    }, 120);
  }, { passive: true });


  // SVG Data Generator for Crisp Technical Specimen Cards (Theme-reactive)
  function createSpecimenSVG(type, isDark) {
    const bg = isDark ? '#161616' : '#f0f0ea';
    const grid = isDark ? '#262626' : '#d8d8d0';
    const frame = isDark ? '#3a3a3a' : '#b8b8ae';
    const text = isDark ? '#888888' : '#333333';
    const cyan = isDark ? '#00FFFF' : '#0099cc';
    const magenta = isDark ? '#FF00FF' : '#d90479';
    const yellow = isDark ? '#FFFF00' : '#e59b00';

    let content = '';
    if (type === 'trace') {
      content = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="100%" height="100%" fill="${bg}"/><path d="M50 170 Q150 40 250 170 T450 170 T550 120" fill="none" stroke="${cyan}" stroke-width="2.5"/><path d="M50 190 Q180 290 300 170 T500 220" fill="none" stroke="${magenta}" stroke-width="2.5" stroke-dasharray="4 4"/><circle cx="250" cy="170" r="5" fill="${yellow}"/><circle cx="450" cy="170" r="5" fill="${cyan}"/><text x="40" y="40" fill="${text}" font-family="monospace" font-size="12">CONTOUR_SPLINE // POLYNOMIAL DECOMPOSITION</text></svg>`;
    } else if (type === 'dsp') {
      content = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="100%" height="100%" fill="${bg}"/><g stroke="${grid}" stroke-width="1"><line x1="50" y1="50" x2="550" y2="50"/><line x1="50" y1="120" x2="550" y2="120"/><line x1="50" y1="190" x2="550" y2="190"/><line x1="50" y1="260" x2="550" y2="260"/></g><path d="M50 190 L90 120 L130 220 L170 80 L210 240 L250 150 L290 190 L330 90 L370 230 L410 160 L450 190 L490 110 L530 190" fill="none" stroke="${magenta}" stroke-width="2.5"/><text x="40" y="40" fill="${text}" font-family="monospace" font-size="12">FFT_SPECTRUM // REALTIME AUDIO HARMONICS</text></svg>`;
    } else if (type === 'bench') {
      content = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="100%" height="100%" fill="${bg}"/><rect x="80" y="70" width="440" height="200" fill="none" stroke="${frame}" stroke-width="1.5"/><circle cx="140" cy="170" r="35" fill="none" stroke="${cyan}" stroke-width="3"/><circle cx="300" cy="170" r="45" fill="none" stroke="${yellow}" stroke-width="2"/><rect x="410" y="130" width="60" height="80" fill="none" stroke="${magenta}" stroke-width="2"/><text x="40" y="40" fill="${text}" font-family="monospace" font-size="12">EDA_SCHEMATIC // TEST BENCH TELEMETRY</text></svg>`;
    } else {
      content = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="100%" height="100%" fill="${bg}"/><line x1="50" y1="170" x2="550" y2="170" stroke="${frame}" stroke-width="1"/><line x1="300" y1="40" x2="300" y2="300" stroke="${frame}" stroke-width="1"/><circle cx="300" cy="170" r="80" fill="none" stroke="${cyan}" stroke-width="1.5" stroke-dasharray="6 6"/><circle cx="300" cy="170" r="120" fill="none" stroke="${yellow}" stroke-width="1"/><polygon points="300,160 308,175 292,175" fill="${magenta}"/><text x="40" y="40" fill="${text}" font-family="monospace" font-size="12">RECON_RADAR // TERRAIN OPTICAL TELEMETRY</text></svg>`;
    }

    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(content);
  }


  // Gallery Manifest Data
  const galleryData = [
    {
      type: 'trace',
      title: "FIG. 01 // VECTOR TRACING & CONTOUR SYNTHESIS",
      description: "Algorithmic edge detection, Bezier spline extraction, and mathematical contour reconstruction pipelines."
    },
    {
      type: 'dsp',
      title: "FIG. 02 // REAL-TIME DSP & SPECTRAL HARMONICS",
      description: "Custom audio synthesizer engine, Web Audio API frequency analysis, and numerical waveform modeling."
    },
    {
      type: 'bench',
      title: "FIG. 03 // TACTICAL UI & BENCH INSTRUMENTATION",
      description: "Interactive laboratory control consoles, hardware telemetry readouts, and calibrated tactile interfaces."
    },
    {
      type: 'recon',
      title: "FIG. 04 // FIELD APPARATUS & OPTICAL RECON",
      description: "High-contrast terrain telemetry, radar coordinate overlays, and environmental sensor logging."
    }
  ];


  const galleryTitle = document.getElementById('galleryTitle');
  const galleryDesc = document.getElementById('galleryDesc');
  const galleryImage = document.getElementById('galleryImage');
  const galleryCount = document.getElementById('galleryCount');
  const navStepBtns = document.querySelectorAll('.nav-step-btn');


  let currentGalleryIndex = 0;


  function updateGallery(idx) {
    currentGalleryIndex = idx;
    const item = galleryData[currentGalleryIndex];
    const isDark = body.classList.contains('dark-mode');
    galleryTitle.textContent = item.title;
    galleryDesc.textContent = item.description;
    galleryImage.src = createSpecimenSVG(item.type, isDark);
    galleryCount.textContent = `FIG. 0${currentGalleryIndex + 1} / 0${galleryData.length}`;


    navStepBtns.forEach((btn, bIdx) => {
      if (bIdx === currentGalleryIndex) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }


  navStepBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      updateGallery(idx);
    });
  });


  // Initialize Gallery
  updateGallery(0);

  // Re-render gallery specimens dynamically when theme changes
  const themeObserver = new MutationObserver(() => {
    updateGallery(currentGalleryIndex);
  });
  themeObserver.observe(body, { attributes: true, attributeFilter: ['class'] });

  window.addEventListener('themechange', () => {
    updateGallery(currentGalleryIndex);
  });


  // MOD.04 // TRANSMISSION - Web Audio Synthesizer & Waveform Oscilloscope
  const waveformCanvas = document.getElementById('waveformCanvas');
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const audioStatusText = document.getElementById('audioStatusText');
  const telemetryHz = document.getElementById('telemetryHz');


  let audioCtx = null;
  let oscillator = null;
  let gainNode = null;
  let isAudioPlaying = false;
  let wavePhase = 0;


  if (waveformCanvas) {
    const ctx = waveformCanvas.getContext('2d');


    function drawWaveform() {
      const width = waveformCanvas.width;
      const height = waveformCanvas.height;
      const midY = height / 2;
      const isDark = body.classList.contains('dark-mode');

      ctx.fillStyle = isDark ? '#161616' : '#f0f0ea';
      ctx.fillRect(0, 0, width, height);

      // Subtle horizontal grid line
      ctx.strokeStyle = isDark ? '#262626' : '#cfcfc5';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      // Primary Waveform Path
      ctx.beginPath();
      ctx.lineWidth = 2;
      const cyanStroke = isDark ? '#00FFFF' : '#0099cc';
      const cyanMuted = isDark ? 'rgba(0, 255, 255, 0.6)' : 'rgba(0, 153, 204, 0.6)';
      ctx.strokeStyle = isAudioPlaying ? cyanStroke : cyanMuted;

      const freqMultiplier = isAudioPlaying ? 0.045 : 0.025;
      const amplitude = isAudioPlaying ? 24 : 14;

      for (let x = 0; x < width; x++) {
        const y = midY + Math.sin(x * freqMultiplier + wavePhase) * amplitude +
                         Math.sin(x * (freqMultiplier * 2.1) + wavePhase * 1.5) * (amplitude * 0.35);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Secondary Chromatic Ghost Wave (Magenta)
      ctx.beginPath();
      ctx.lineWidth = 1.2;
      const magentaStroke = isDark ? 'rgba(255, 0, 255, 0.7)' : 'rgba(184, 0, 110, 0.7)';
      const magentaMuted = isDark ? 'rgba(255, 0, 255, 0.3)' : 'rgba(184, 0, 110, 0.3)';
      ctx.strokeStyle = isAudioPlaying ? magentaStroke : magentaMuted;
      for (let x = 0; x < width; x++) {
        const y = midY + Math.sin(x * freqMultiplier + wavePhase + 0.3) * (amplitude * 0.85);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();


      wavePhase += isAudioPlaying ? 0.08 : 0.035;
      requestAnimationFrame(drawWaveform);
    }
    requestAnimationFrame(drawWaveform);
  }


  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      if (!isAudioPlaying) {
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (!AudioContextClass) return;
         
          if (!audioCtx) {
            audioCtx = new AudioContextClass();
          }
          if (audioCtx.state === 'suspended') {
            audioCtx.resume();
          }


          oscillator = audioCtx.createOscillator();
          gainNode = audioCtx.createGain();


          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // 220Hz (A3)


          // Soft volume ramp to prevent clipping
          gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.1);


          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.start();


          isAudioPlaying = true;
          audioToggleBtn.classList.add('active');
          audioToggleBtn.innerHTML = '<span>■ STOP OSCILLATOR</span>';
          if (audioStatusText) audioStatusText.textContent = 'STATE: ACTIVE // 220 HZ';
          if (telemetryHz) telemetryHz.textContent = 'FREQ: 220.0 HZ (A3)';
        } catch (err) {
          console.warn('AudioContext initialization prevented:', err);
        }
      } else {
        if (gainNode && audioCtx) {
          gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
          setTimeout(() => {
            if (oscillator) {
              oscillator.stop();
              oscillator.disconnect();
              oscillator = null;
            }
          }, 120);
        }
        isAudioPlaying = false;
        audioToggleBtn.classList.remove('active');
        audioToggleBtn.innerHTML = '<span>▶ TEST OSCILLATOR TONE</span>';
        if (audioStatusText) audioStatusText.textContent = 'STATE: STANDBY';
        if (telemetryHz) telemetryHz.textContent = 'FREQ: 220.0 HZ';
      }
    });
  }


  // Ensure fresh launch starts cleanly at top
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
});
