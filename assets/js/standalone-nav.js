/**
 * KYZER Portfolio - Standalone Experiment Navigation HUD
 * Automatically activates ONLY when an experiment file is accessed directly outside the container viewer.
 * Provides direct uplink back to derkyzer.com, the tools directory, and launches the containerized studio.
 */
(function () {
  // 1. Silent abort if embedded in iframe (e.g. tools/view.html)
  if (window.top !== window.self) {
    return;
  }

  // Prevent duplicate insertion
  if (document.getElementById('kyzer-standalone-hud')) {
    return;
  }

  function initHUD() {
    if (document.getElementById('kyzer-standalone-hud')) return;

    // 2. Resolve relative tool path and target links
    const origin = (window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file'))
      ? window.location.origin
      : 'https://derkyzer.com';

    let path = window.location.pathname || '';
    let toolParam = '';
    const toolsIdx = path.indexOf('/tools/');
    if (toolsIdx !== -1) {
      toolParam = path.substring(toolsIdx + 7);
    } else {
      // Fallback for file:/// local downloads
      const parts = path.split('/');
      toolParam = parts[parts.length - 1] || 'jellyfish.html';
    }

    const homeUrl = `${origin}/`;
    const catalogUrl = `${origin}/tools/index.html`;
    const containerUrl = `${origin}/tools/view.html?tool=${encodeURIComponent(toolParam)}`;

    // 3. Inject Styles
    const style = document.createElement('style');
    style.id = 'kyzer-standalone-hud-style';
    style.textContent = `
      #kyzer-standalone-hud {
        position: fixed;
        top: 14px;
        right: 14px;
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(10, 12, 16, 0.92);
        border: 1px solid rgba(0, 255, 255, 0.35);
        padding: 6px 10px;
        border-radius: 8px;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.7), 0 0 14px rgba(0, 255, 255, 0.15);
        font-family: 'JetBrains Mono', monospace, -apple-system, sans-serif;
        font-size: 11px;
        letter-spacing: 0.05em;
        line-height: 1;
        user-select: none;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      #kyzer-standalone-hud.minimized {
        transform: translateX(calc(100% - 38px));
        opacity: 0.65;
      }
      #kyzer-standalone-hud.minimized:hover {
        opacity: 1;
      }
      .ksh-brand {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        text-decoration: none;
        padding-right: 6px;
        border-right: 1px solid rgba(255, 255, 255, 0.12);
        font-weight: 700;
      }
      .ksh-char-k { color: #00ffff; }
      .ksh-char-y { color: #ff00ff; }
      .ksh-char-z { color: #ffff00; }
      .ksh-char-er { color: #ffffff; }
      .ksh-links {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .ksh-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 9px;
        border-radius: 4px;
        text-decoration: none;
        font-size: 10px;
        font-weight: 600;
        transition: all 0.15s ease;
        white-space: nowrap;
      }
      .ksh-btn-catalog {
        color: #a0a0a0;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.15);
      }
      .ksh-btn-catalog:hover {
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.12);
      }
      .ksh-btn-container {
        color: #00ffff;
        background: rgba(0, 255, 255, 0.1);
        border: 1px solid rgba(0, 255, 255, 0.4);
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.15);
      }
      .ksh-btn-container:hover {
        background: #00ffff;
        color: #050505;
        box-shadow: 0 0 14px rgba(0, 255, 255, 0.45);
      }
      .ksh-minimize-toggle {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.35);
        cursor: pointer;
        padding: 3px;
        font-size: 11px;
        line-height: 1;
        transition: color 0.15s ease;
      }
      .ksh-minimize-toggle:hover {
        color: #00ffff;
      }
      @media (max-width: 480px) {
        #kyzer-standalone-hud {
          top: 10px;
          right: 10px;
          padding: 5px 8px;
        }
        .ksh-btn span.btn-text {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);

    // 4. Create HUD Element
    const hud = document.createElement('div');
    hud.id = 'kyzer-standalone-hud';
    hud.innerHTML = `
      <a href="${homeUrl}" class="ksh-brand" title="KYZER Portfolio Root">
        <span class="ksh-char-k">K</span><span class="ksh-char-y">Y</span><span class="ksh-char-z">Z</span><span class="ksh-char-er">ER</span>
      </a>
      <div class="ksh-links">
        <a href="${catalogUrl}" class="ksh-btn ksh-btn-catalog" title="Return to Interactive Tools Catalog">
          <span>←</span>
          <span class="btn-text">CATALOG</span>
        </a>
        <a href="${containerUrl}" class="ksh-btn ksh-btn-container" title="Open inside KYZER Studio Container (Fullscreen, Mute, Zoom)">
          <span>⛶</span>
          <span class="btn-text">STUDIO CONTAINER</span>
        </a>
      </div>
      <button class="ksh-minimize-toggle" id="kshMinimizeBtn" title="Toggle HUD visibility">✕</button>
    `;

    document.body.appendChild(hud);

    // 5. Minimize toggle functionality
    const minBtn = document.getElementById('kshMinimizeBtn');
    if (minBtn) {
      let isMin = false;
      minBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isMin = !isMin;
        hud.classList.toggle('minimized', isMin);
        minBtn.textContent = isMin ? '◀' : '✕';
        minBtn.title = isMin ? 'Expand KYZER Navigation' : 'Collapse HUD';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHUD);
  } else {
    initHUD();
  }
})();
