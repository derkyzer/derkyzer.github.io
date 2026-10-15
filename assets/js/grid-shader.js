/**
 * KYZER WebGL Tactical Grid & Interactive Fragment Shader
 * - Dynamic 24px tactical grid with mouse distortion ripples
 * - Velocity-reactive ripple decay & localized cursor glow
 * - Dynamic CMYK perimeter traveling aura & glow for hovered cards
 * - Zero external dependencies, automatic dark/light mode adaptation
 */

(function () {
  'use strict';

  let canvas = null;
  let gl = null;
  let program = null;

  // Shader Uniform Locations
  let uResolutionLoc, uMouseLoc, uTimeLoc, uRippleIntensityLoc;
  let uGridColorLoc, uGlowColorLoc, uIsDarkLoc, uCellSizeLoc;
  let uBoxRectLoc, uBoxHoverLoc, uDprLoc;

  // State
  let startTime = performance.now();
  let mouse = { x: -2000, y: -2000 };
  let targetMouse = { x: -2000, y: -2000 };
  let mouseVelocity = 0;
  let lastMouseTime = performance.now();
  let rippleIntensity = 0;
  let targetRippleIntensity = 0;
  let currentDpr = 1;

  // Hovered Card State
  let targetBox = { x: 0, y: 0, width: 0, height: 0 };
  let currentBox = { x: 0, y: 0, width: 0, height: 0 };
  let isHovered = false;
  let hoverProgress = 0;
  let activeHoverElement = null;

  const VERTEX_SHADER_SRC = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const FRAGMENT_SHADER_SRC = `
    precision highp float;

    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_time;
    uniform float u_ripple_intensity;
    uniform vec3 u_grid_color;
    uniform vec3 u_glow_color;
    uniform float u_is_dark;
    uniform float u_cell_size;
    uniform vec4 u_box_rect;
    uniform float u_box_hover;
    uniform float u_dpr;

    float sdBox(vec2 p, vec2 b) {
      vec2 d = abs(p) - b;
      return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    }

    vec3 cmykPalette(float t) {
      t = fract(t);
      vec3 cyan = vec3(0.0, 1.0, 1.0);
      vec3 magenta = vec3(1.0, 0.0, 1.0);
      vec3 yellow = vec3(1.0, 1.0, 0.0);
      if (t < 0.333333) {
        return mix(cyan, magenta, t * 3.0);
      } else if (t < 0.666666) {
        return mix(magenta, yellow, (t - 0.333333) * 3.0);
      } else {
        return mix(yellow, cyan, (t - 0.666666) * 3.0);
      }
    }

    void main() {
      // Convert WebGL bottom-left physical coordinate origin to top-left CSS coordinates
      vec2 p = vec2(gl_FragCoord.x / u_dpr, u_resolution.y - gl_FragCoord.y / u_dpr);

      // 1. Mouse Ripple Wave Distortion (calibrated strength & warp-reactive glow)
      vec2 delta = p - u_mouse;
      float distToMouse = length(delta);
      float waveFreq = 0.038;
      float waveSpeed = 3.6;
      float waveDecay = exp(-distToMouse * 0.0090);
      float wave = sin(distToMouse * waveFreq - u_time * waveSpeed) * waveDecay * u_ripple_intensity;

      const float warpScale = 9.5;
      vec2 waveDir = (distToMouse > 0.001) ? (delta / distToMouse) : vec2(0.0);
      vec2 distortedP = p + waveDir * wave * warpScale;

      // 2. Tactical 24px Grid Lines
      vec2 gridCoord = mod(distortedP, u_cell_size);
      vec2 distToLine = min(gridCoord, u_cell_size - gridCoord);
      float minDist = min(distToLine.x, distToLine.y);
      float gridLine = smoothstep(1.2, 0.1, minDist);

      float baseAlpha = (u_is_dark > 0.5) ? 0.042 : 0.07;

      // 3. Ambient Cursor & Warp-Reactive Glow
      // Glow proportional to the physical warp displacement applied to the grid
      float warpAmount = abs(wave * warpScale);
      float warpGlow = smoothstep(0.4, 5.5, warpAmount) * 0.6;

      float mouseGlow = exp(-distToMouse * 0.012) * (0.08 + 0.25 * u_ripple_intensity);
      float rippleGlow = max(0.0, wave) * 0.45;
      float totalGlow = mouseGlow + rippleGlow + warpGlow;

      vec3 gridColor = mix(u_grid_color, u_glow_color, clamp(totalGlow * 0.85, 0.0, 1.0));
      float gridAlpha = gridLine * baseAlpha + gridLine * (totalGlow * 0.32 + warpGlow * 0.2) + (totalGlow * 0.03 + warpGlow * 0.035);

      // 4. Box Hover CMYK Border & Traveling Fragment Glow
      vec3 boxGlowCol = vec3(0.0);
      float boxGlowAlpha = 0.0;

      if (u_box_hover > 0.001 && u_box_rect.z > 0.0 && u_box_rect.w > 0.0) {
        vec2 boxCenter = u_box_rect.xy + u_box_rect.zw * 0.5;
        vec2 boxHalf = u_box_rect.zw * 0.5;
        float boxDist = sdBox(p - boxCenter, boxHalf);

        // Perimeter traversal angle (-pi to +pi) normalized to [0, 1]
        float angle = atan(p.y - boxCenter.y, p.x - boxCenter.x);
        float perimeterPhase = fract(angle / 6.283185307 - u_time * 0.35);
        vec3 cmykCol = cmykPalette(perimeterPhase);

        float cursorOnBoxDist = length(p - u_mouse);
        float cursorHotspot = exp(-cursorOnBoxDist * 0.018) * 0.5;

        float auraDist = max(0.0, boxDist);
        float outerAura = exp(-auraDist * 0.065) * 0.85 * u_box_hover;
        float borderStroke = smoothstep(2.2, 0.2, abs(boxDist)) * u_box_hover;

        boxGlowCol = mix(cmykCol, vec3(1.0), cursorHotspot);
        boxGlowAlpha = (outerAura * 0.4 + borderStroke * 0.95 + cursorHotspot * outerAura * 0.6) * u_box_hover;
      }

      // Composite grid and box glow
      vec3 finalCol = gridColor;
      float finalAlpha = gridAlpha;

      if (boxGlowAlpha > 0.001) {
        float combined = max(0.0001, finalAlpha + boxGlowAlpha);
        finalCol = mix(finalCol, boxGlowCol, boxGlowAlpha / combined);
        finalAlpha = min(1.0, finalAlpha + boxGlowAlpha);
      }

      gl_FragColor = vec4(finalCol, finalAlpha);
    }
  `;

  function createShader(glCtx, type, source) {
    const shader = glCtx.createShader(type);
    glCtx.shaderSource(shader, source);
    glCtx.compileShader(shader);
    if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
      console.warn('Grid shader compile failed:', glCtx.getShaderInfoLog(shader));
      glCtx.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function initWebGL() {
    canvas = document.getElementById('gridCanvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'gridCanvas';
      canvas.className = 'grid-canvas';
      document.body.insertBefore(canvas, document.body.firstChild);
    }

    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: true, depth: false }) ||
           canvas.getContext('experimental-webgl', { alpha: true, antialias: true, depth: false });
    } catch (e) {
      gl = null;
    }

    if (!gl) {
      console.warn('WebGL unsupported, retaining static CSS grid fallback.');
      return false;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vs || !fs) return false;

    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Grid shader link failed:', gl.getProgramInfoLog(program));
      return false;
    }

    gl.useProgram(program);

    // Quad geometry (full viewport)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const quadVertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    const aPosLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    uResolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    uMouseLoc = gl.getUniformLocation(program, 'u_mouse');
    uTimeLoc = gl.getUniformLocation(program, 'u_time');
    uRippleIntensityLoc = gl.getUniformLocation(program, 'u_ripple_intensity');
    uGridColorLoc = gl.getUniformLocation(program, 'u_grid_color');
    uGlowColorLoc = gl.getUniformLocation(program, 'u_glow_color');
    uIsDarkLoc = gl.getUniformLocation(program, 'u_is_dark');
    uCellSizeLoc = gl.getUniformLocation(program, 'u_cell_size');
    uBoxRectLoc = gl.getUniformLocation(program, 'u_box_rect');
    uBoxHoverLoc = gl.getUniformLocation(program, 'u_box_hover');
    uDprLoc = gl.getUniformLocation(program, 'u_dpr');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    document.body.classList.add('has-webgl-grid');
    resizeCanvas();
    return true;
  }

  function resizeCanvas() {
    if (!canvas || !gl) return;
    currentDpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;
    const pixelWidth = Math.floor(displayWidth * currentDpr);
    const pixelHeight = Math.floor(displayHeight * currentDpr);

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  // Unified Pointer & Touch Tracking
  function handlePointer(clientX, clientY) {
    const now = performance.now();
    const dt = Math.max(1, now - lastMouseTime);
    lastMouseTime = now;

    const dx = clientX - targetMouse.x;
    const dy = clientY - targetMouse.y;
    const speed = Math.sqrt(dx * dx + dy * dy) / dt;

    targetMouse.x = clientX;
    targetMouse.y = clientY;

    if (mouse.x < -1000) {
      mouse.x = targetMouse.x;
      mouse.y = targetMouse.y;
    }

    // Smoothly build up target intensity without abrupt jumps
    targetRippleIntensity = Math.min(0.85, targetRippleIntensity + speed * 0.08);
  }

  window.addEventListener('mousemove', (e) => {
    handlePointer(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    targetMouse.x = -2000;
    targetMouse.y = -2000;
    targetRippleIntensity = 0;
  });

  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length > 0) {
      handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length > 0) {
      handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    targetMouse.x = -2000;
    targetMouse.y = -2000;
    targetRippleIntensity = 0;
  }, { passive: true });

  window.addEventListener('touchcancel', () => {
    targetMouse.x = -2000;
    targetMouse.y = -2000;
    targetRippleIntensity = 0;
  }, { passive: true });

  // Track Hover on Cards/Panels across all pages
  const CARD_SELECTORS = [
    '.tech-panel',
    '.glow-container',
    '.column-panel',
    '.dispatch-card',
    '.repo-card',
    '.tool-node-card',
    '.contact-card',
    '.direct-subscribe-strip',
    '.subpage-hero'
  ].join(', ');

  let lastHoveredElement = null;
  let lastBoxRect = { x: 0, y: 0 };

  function updateHoveredBox() {
    if (activeHoverElement && activeHoverElement.isConnected) {
      const rect = activeHoverElement.getBoundingClientRect();
      if (activeHoverElement === lastHoveredElement) {
        // While scrolling on the same hovered element, instantly transfer the scroll delta to currentBox
        // so the shader border never lags behind during scrolling.
        const deltaX = rect.left - lastBoxRect.x;
        const deltaY = rect.top - lastBoxRect.y;
        currentBox.x += deltaX;
        currentBox.y += deltaY;
      }
      lastHoveredElement = activeHoverElement;
      lastBoxRect.x = rect.left;
      lastBoxRect.y = rect.top;

      targetBox.x = rect.left;
      targetBox.y = rect.top;
      targetBox.width = rect.width;
      targetBox.height = rect.height;
      isHovered = true;
    } else {
      isHovered = false;
      lastHoveredElement = null;
    }
  }

  document.addEventListener('mouseover', (e) => {
    const card = e.target.closest(CARD_SELECTORS);
    if (card) {
      activeHoverElement = card;
      updateHoveredBox();
    }
  }, { passive: true });

  document.addEventListener('mouseout', (e) => {
    const card = e.target.closest(CARD_SELECTORS);
    if (card && card === activeHoverElement) {
      const related = e.relatedTarget ? e.relatedTarget.closest(CARD_SELECTORS) : null;
      if (!related) {
        activeHoverElement = null;
        isHovered = false;
        lastHoveredElement = null;
      } else {
        activeHoverElement = related;
        updateHoveredBox();
      }
    }
  }, { passive: true });

  window.addEventListener('scroll', updateHoveredBox, { passive: true });
  window.addEventListener('resize', () => {
    resizeCanvas();
    updateHoveredBox();
  }, { passive: true });

  // Main Render Loop
  function render() {
    if (!gl || !program) return;

    // Refresh box position on every frame in case of active scrolling
    if (activeHoverElement) {
      updateHoveredBox();
    }

    const now = performance.now();
    const elapsedTime = (now - startTime) / 1000.0;

    // Smooth mouse interpolation
    mouse.x += (targetMouse.x - mouse.x) * 0.18;
    mouse.y += (targetMouse.y - mouse.y) * 0.18;

    // Gradual fade in when mouse begins moving, soft graceful decay
    rippleIntensity += (targetRippleIntensity - rippleIntensity) * 0.055;
    targetRippleIntensity *= 0.94;
    if (rippleIntensity < 0.001) rippleIntensity = 0;

    // Smooth hover progress lerp
    const targetProgress = isHovered ? 1.0 : 0.0;
    hoverProgress += (targetProgress - hoverProgress) * 0.14;
    if (hoverProgress < 0.001 && !isHovered) hoverProgress = 0;

    // Smooth box rect lerp
    currentBox.x += (targetBox.x - currentBox.x) * 0.25;
    currentBox.y += (targetBox.y - currentBox.y) * 0.25;
    currentBox.width += (targetBox.width - currentBox.width) * 0.25;
    currentBox.height += (targetBox.height - currentBox.height) * 0.25;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const isDark = document.body.classList.contains('dark-mode');

    // Uniform updates
    gl.uniform2f(uResolutionLoc, window.innerWidth, window.innerHeight);
    gl.uniform2f(uMouseLoc, mouse.x, mouse.y);
    gl.uniform1f(uTimeLoc, elapsedTime);
    gl.uniform1f(uRippleIntensityLoc, rippleIntensity);
    gl.uniform1f(uIsDarkLoc, isDark ? 1.0 : 0.0);
    gl.uniform1f(uCellSizeLoc, 24.0);

    if (isDark) {
      gl.uniform3f(uGridColorLoc, 1.0, 1.0, 1.0);
      gl.uniform3f(uGlowColorLoc, 0.0, 1.0, 1.0); // Cyan glow
    } else {
      gl.uniform3f(uGridColorLoc, 0.1, 0.1, 0.1);
      gl.uniform3f(uGlowColorLoc, 0.0, 0.55, 0.55); // Calibrated darker cyan
    }

    gl.uniform4f(uBoxRectLoc, currentBox.x, currentBox.y, currentBox.width, currentBox.height);
    gl.uniform1f(uBoxHoverLoc, hoverProgress);
    gl.uniform1f(uDprLoc, currentDpr);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
  }

  // Public API & Initialization
  window.GridShader = {
    init: function () {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          if (initWebGL()) requestAnimationFrame(render);
        });
      } else {
        if (initWebGL()) requestAnimationFrame(render);
      }
    },
    updateBox: updateHoveredBox
  };

  window.GridShader.init();
})();
