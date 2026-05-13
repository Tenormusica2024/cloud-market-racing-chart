(() => {
  'use strict';

  const providers = [
    { key: 'AWS', label: 'AWS', short: 'AWS', color: '#2f6df6', casual: '#18a8ff' },
    { key: 'Azure', label: 'Azure', short: 'Azure', color: '#ff6b12', casual: '#ff8a18' },
    { key: 'Google Cloud', label: 'Google\nCloud', short: 'GCP', color: '#0aa39e', casual: '#17d6ce' },
    { key: 'Oracle Cloud', label: 'Oracle\nCloud', short: 'Oracle', color: '#d8325b', casual: '#ff3c6f' },
    { key: 'Alibaba Cloud', label: 'Alibaba\nCloud', short: 'Alibaba', color: '#f59e0b', casual: '#ffd166' },
  ];

  // Public market share reference points. Intermediate quarters are interpolated
  // for demo playback instead of being presented as independently sourced data.
  const anchors = [
    { year: 2018, quarter: 4, neocloud: 0.0, values: { AWS: 33.4, Azure: 14.5, 'Google Cloud': 4.9, 'Oracle Cloud': 1.5, 'Alibaba Cloud': 4.0 } },
    { year: 2019, quarter: 4, neocloud: 0.0, values: { AWS: 32.4, Azure: 17.6, 'Google Cloud': 6.0, 'Oracle Cloud': 1.7, 'Alibaba Cloud': 4.0 } },
    { year: 2020, quarter: 4, neocloud: 0.2, values: { AWS: 31.0, Azure: 20.0, 'Google Cloud': 7.0, 'Oracle Cloud': 2.0, 'Alibaba Cloud': 4.0 } },
    { year: 2021, quarter: 4, neocloud: 0.5, values: { AWS: 33.0, Azure: 22.0, 'Google Cloud': 9.0, 'Oracle Cloud': 2.0, 'Alibaba Cloud': 4.0 } },
    { year: 2022, quarter: 4, neocloud: 1.0, values: { AWS: 32.0, Azure: 23.0, 'Google Cloud': 10.0, 'Oracle Cloud': 2.5, 'Alibaba Cloud': 4.0 } },
    { year: 2023, quarter: 4, neocloud: 2.0, values: { AWS: 31.0, Azure: 26.0, 'Google Cloud': 10.0, 'Oracle Cloud': 2.5, 'Alibaba Cloud': 4.0 } },
    { year: 2024, quarter: 4, neocloud: 3.0, values: { AWS: 33.0, Azure: 20.0, 'Google Cloud': 11.0, 'Oracle Cloud': 3.0, 'Alibaba Cloud': 4.0 } },
    { year: 2025, quarter: 1, neocloud: 3.5, values: { AWS: 32.0, Azure: 23.0, 'Google Cloud': 10.0, 'Oracle Cloud': 3.0, 'Alibaba Cloud': 4.0 } },
    { year: 2025, quarter: 4, neocloud: 4.5, values: { AWS: 32.0, Azure: 22.0, 'Google Cloud': 12.0, 'Oracle Cloud': 3.0, 'Alibaba Cloud': 4.0 } },
    { year: 2026, quarter: 1, neocloud: 5.0, values: { AWS: 28.0, Azure: 21.0, 'Google Cloud': 14.0, 'Oracle Cloud': 4.0, 'Alibaba Cloud': 4.0 } },
  ];

  const data = buildQuarterData();

  const state = {
    theme: 'casual',
    virtualIndex: data.length - 1,
    playing: false,
    speed: 5,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    lastStepTime: 0,
    lastFrameTime: 0,
    frameCost: 0,
    frameCostLastSynced: 0,
    renderQueued: false,
    lastSyncedIndex: -1,
    dpr: 1,
  };

  const sparkModel = buildSparkModel(data);
  const maxShare = 50;
  const stepMs = () => Math.max(45, 900 / state.speed);

  const canvas = document.getElementById('chartCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const dateLabel = document.getElementById('dateLabel');
  const timeline = document.getElementById('timeline');
  const playButton = document.getElementById('playButton');
  const pauseButton = document.getElementById('pauseButton');
  const resetButton = document.getElementById('resetButton');
  const leaderName = document.getElementById('leaderName');
  const leaderValue = document.getElementById('leaderValue');
  const sparkDate = document.getElementById('sparkDate');
  const sparkValue = document.getElementById('sparkValue');
  const sparkPath = document.getElementById('sparkPath');
  const sparkProgress = document.getElementById('sparkProgress');
  const sparkMarker = document.getElementById('sparkMarker');
  const trackedShareValue = document.getElementById('trackedShareValue');
  const shareDonut = document.getElementById('shareDonut');
  const donutCaption = document.getElementById('donutCaption');
  const neocloudValue = document.getElementById('neocloudValue');
  const neocloudCaption = document.getElementById('neocloudCaption');
  const changeTitle = document.getElementById('changeTitle');
  const changeList = document.getElementById('changeList');
  const dataTable = document.getElementById('dataTable');
  const frameBudget = document.getElementById('frameBudget');
  const reducedMotionToggle = document.getElementById('reducedMotion');
  const modeButtons = [...document.querySelectorAll('[data-theme-target]')];
  const speedButtons = [...document.querySelectorAll('[data-speed]')];

  initialize();

  function initialize() {
    document.body.dataset.theme = state.theme;
    reducedMotionToggle.checked = state.reducedMotion;
    timeline.max = String(data.length - 1);
    timeline.value = String(state.virtualIndex);
    syncModeButtons();
    syncDom(true);
    bindEvents();
    resizeCanvas();
    requestRender();
  }

  function bindEvents() {
    playButton.addEventListener('click', () => setPlaying(true));
    pauseButton.addEventListener('click', () => setPlaying(false));
    resetButton.addEventListener('click', () => {
      setPlaying(false);
      state.virtualIndex = 0;
      syncDom(true);
      requestRender();
    });

    timeline.addEventListener('input', (event) => {
      setPlaying(false);
      state.virtualIndex = Number(event.target.value);
      syncDom(true);
      requestRender();
    });

    modeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        state.theme = button.dataset.themeTarget;
        document.body.dataset.theme = state.theme;
        syncModeButtons();
        requestRender();
      });
    });

    speedButtons.forEach((button) => {
      button.addEventListener('click', () => {
        state.speed = Number(button.dataset.speed);
        speedButtons.forEach((item) => item.classList.toggle('is-active', item === button));
      });
    });

    reducedMotionToggle.addEventListener('change', () => {
      state.reducedMotion = reducedMotionToggle.checked;
      if (state.reducedMotion) setPlaying(false);
      requestRender();
    });

    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space' && !isEditingRange(event.target)) {
        event.preventDefault();
        setPlaying(!state.playing);
      }
      if (event.code === 'ArrowLeft' && !isEditingRange(event.target)) {
        state.virtualIndex = Math.max(0, Math.floor(state.virtualIndex) - 1);
        setPlaying(false);
        syncDom(true);
        requestRender();
      }
      if (event.code === 'ArrowRight' && !isEditingRange(event.target)) {
        state.virtualIndex = Math.min(data.length - 1, Math.floor(state.virtualIndex) + 1);
        setPlaying(false);
        syncDom(true);
        requestRender();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) setPlaying(false);
    });

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(resizeCanvas);
    });
    resizeObserver.observe(canvas.parentElement);
  }

  function isEditingRange(target) {
    return target instanceof HTMLInputElement;
  }

  function setPlaying(next) {
    if (state.reducedMotion && next) return;
    state.playing = next;
    state.lastFrameTime = performance.now();
    document.body.classList.toggle('is-playing', next);
    playButton.setAttribute('aria-pressed', String(next));
    if (next) requestAnimationFrame(animationLoop);
  }

  function animationLoop(now) {
    if (!state.playing) return;

    const delta = Math.min(80, now - (state.lastFrameTime || now));
    state.lastFrameTime = now;
    state.virtualIndex += delta / stepMs();
    if (state.virtualIndex > data.length - 1) state.virtualIndex = 0;

    requestRender();
    syncDom(false);
    requestAnimationFrame(animationLoop);
  }

  function buildQuarterData() {
    const rows = [];
    for (let yearIndex = 0; yearIndex < anchors.length - 1; yearIndex++) {
      const current = anchors[yearIndex];
      const next = anchors[yearIndex + 1];
      const currentQuarterIndex = toQuarterIndex(current);
      const nextQuarterIndex = toQuarterIndex(next);
      const span = Math.max(1, nextQuarterIndex - currentQuarterIndex);
      for (let quarterIndex = currentQuarterIndex; quarterIndex < nextQuarterIndex; quarterIndex++) {
        const localT = (quarterIndex - currentQuarterIndex) / span;
        const { year, quarter } = fromQuarterIndex(quarterIndex);
        const values = {};
        providers.forEach((provider) => {
          const start = current.values[provider.key];
          const end = next.values[provider.key];
          values[provider.key] = round1(start + (end - start) * localT);
        });
        rows.push({
          label: `${year} Q${quarter}`,
          year,
          quarter,
          neocloud: round1(lerp(current.neocloud ?? 0, next.neocloud ?? 0, localT)),
          values,
        });
      }
    }
    const last = anchors[anchors.length - 1];
    rows.push({
      label: `${last.year} Q${last.quarter}`,
      year: last.year,
      quarter: last.quarter,
      neocloud: last.neocloud ?? 0,
      values: { ...last.values },
    });
    return rows;
  }

  function toQuarterIndex(point) {
    return point.year * 4 + point.quarter - 1;
  }

  function fromQuarterIndex(index) {
    return {
      year: Math.floor(index / 4),
      quarter: index % 4 + 1,
    };
  }

  function buildSparkModel(rows) {
    const totals = rows.map((row) => getTrackedShare(row.values));
    const min = Math.min(...totals);
    const max = Math.max(...totals);
    const range = Math.max(1, max - min);
    const points = totals.map((total, index) => ({
      x: 6 + (index / Math.max(1, totals.length - 1)) * 148,
      y: 48 - ((total - min) / range) * 38,
      total,
    }));

    return {
      points,
      path: toPath(points),
    };
  }

  function getInterpolatedSnapshot(position) {
    const lowIndex = Math.floor(position);
    const highIndex = Math.min(data.length - 1, lowIndex + 1);
    const t = clamp(position - lowIndex, 0, 1);
    const low = data[lowIndex];
    const high = data[highIndex];
    const values = {};

    providers.forEach((provider) => {
      values[provider.key] = round1(lerp(low.values[provider.key], high.values[provider.key], t));
    });

    return {
      label: t < 0.5 ? low.label : high.label,
      neocloud: round1(lerp(low.neocloud ?? 0, high.neocloud ?? 0, t)),
      values,
      rows: providers
        .map((provider) => ({ ...provider, value: values[provider.key] }))
        .sort((a, b) => b.value - a.value),
    };
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(320, Math.floor(rect.height));

    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr) || state.dpr !== dpr) {
      state.dpr = dpr;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    requestRender();
  }

  function requestRender() {
    if (state.renderQueued) return;
    state.renderQueued = true;
    requestAnimationFrame(() => {
      state.renderQueued = false;
      const start = performance.now();
      renderCanvas();
      state.frameCost = state.frameCost * 0.82 + (performance.now() - start) * 0.18;
      const now = performance.now();
      if (now - state.frameCostLastSynced > 500) {
        frameBudget.textContent = `${state.frameCost.toFixed(1)} ms`;
        state.frameCostLastSynced = now;
      }
    });
  }

  function renderCanvas() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const snapshot = getInterpolatedSnapshot(state.virtualIndex);
    const isCasual = state.theme === 'casual';

    ctx.clearRect(0, 0, width, height);
    drawCanvasBackground(width, height, isCasual);

    const layout = getChartLayout(width, height);
    drawAxis(layout, isCasual);
    drawBars(snapshot, layout, isCasual);
    syncLiveInsights(snapshot);
  }

  function getSparkPoint(position) {
    const lowIndex = clamp(Math.floor(position), 0, sparkModel.points.length - 1);
    const highIndex = Math.min(sparkModel.points.length - 1, lowIndex + 1);
    const t = clamp(position - lowIndex, 0, 1);
    const low = sparkModel.points[lowIndex];
    const high = sparkModel.points[highIndex];

    return {
      index: lowIndex,
      x: lerp(low.x, high.x, t),
      y: lerp(low.y, high.y, t),
      total: lerp(low.total, high.total, t),
    };
  }

  function getChartLayout(width, height) {
    const left = Math.min(230, Math.max(174, width * 0.22));
    const right = Math.min(96, Math.max(58, width * 0.09));
    const top = Math.min(92, Math.max(58, height * 0.16));
    const availableHeight = Math.max(240, height - top - 52);
    const rowGap = Math.min(24, Math.max(12, height * 0.044));
    const barHeight = Math.min(52, Math.max(29, (availableHeight - rowGap * (providers.length - 1)) / providers.length));
    return {
      width,
      height,
      left,
      right,
      top,
      chartWidth: width - left - right,
      rowGap,
      barHeight,
    };
  }

  function drawCanvasBackground(width, height, isCasual) {
    if (isCasual) {
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, '#020714');
      bg.addColorStop(0.42, '#031126');
      bg.addColorStop(0.72, '#070918');
      bg.addColorStop(1, '#16071b');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = '#1dd7ff';
      ctx.lineWidth = 1;
      for (let x = -90; x <= width + 120; x += 56) {
        ctx.beginPath();
        ctx.moveTo(x + width * 0.11, 0);
        ctx.lineTo(x - width * 0.18, height);
        ctx.stroke();
      }
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const y = 54 + Math.pow(t, 1.55) * (height - 74);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y + 24 + t * 18);
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      const track = ctx.createRadialGradient(width * 0.58, height * 0.62, 20, width * 0.58, height * 0.62, width * 0.72);
      track.addColorStop(0, 'rgba(24, 200, 255, 0.24)');
      track.addColorStop(0.38, 'rgba(255, 138, 24, 0.10)');
      track.addColorStop(0.56, 'rgba(24, 200, 255, 0.08)');
      track.addColorStop(1, 'rgba(24, 200, 255, 0)');
      ctx.fillStyle = track;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      drawCinematicTrack(width, height);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      const glow = ctx.createRadialGradient(width * 0.2, 0, 0, width * 0.2, 0, width * 0.8);
      glow.addColorStop(0, 'rgba(29, 78, 216, 0.08)');
      glow.addColorStop(1, 'rgba(29, 78, 216, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }
  }

  function drawCinematicTrack(width, height) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(width * 0.53, height * 0.55);
    ctx.rotate(-0.08);
    ctx.scale(1, 0.36);

    const rings = [
      { radius: width * 0.58, color: 'rgba(29, 204, 255, 0.24)', blur: 20, width: 5 },
      { radius: width * 0.46, color: 'rgba(255, 138, 24, 0.24)', blur: 22, width: 5 },
      { radius: width * 0.35, color: 'rgba(29, 204, 255, 0.16)', blur: 14, width: 2 },
    ];

    rings.forEach((ring, index) => {
      ctx.shadowColor = ring.color;
      ctx.shadowBlur = ring.blur;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = ring.width;
      ctx.beginPath();
      ctx.ellipse(0, 0, ring.radius, ring.radius * (0.54 + index * 0.02), 0, Math.PI * 0.08, Math.PI * 1.18);
      ctx.stroke();
    });
    ctx.restore();

    ctx.save();
    if (width < 620) {
      ctx.restore();
      return;
    }

    ctx.fillStyle = 'rgba(211, 228, 255, 0.58)';
    ctx.shadowColor = 'rgba(29, 204, 255, 0.56)';
    ctx.shadowBlur = 10;
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    const labels = ['2018', '2020', '2022', '2024', '2026'];
    labels.forEach((label, index) => {
      const x = width * (0.28 + index * 0.135);
      const y = 34 + index * 6;
      ctx.fillText(label, x, y);
      ctx.beginPath();
      ctx.moveTo(x, y + 8);
      ctx.lineTo(x, y + 42);
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.22)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawAxis(layout, isCasual) {
    const { left, top, chartWidth, height } = layout;
    ctx.save();
    ctx.font = '600 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const ticks = chartWidth < 170 ? [0, 50] : chartWidth < 360 ? [0, 25, 50] : [0, 10, 20, 30, 40, 50];
    ticks.forEach((value) => {
      const x = left + (value / maxShare) * chartWidth;
      ctx.strokeStyle = isCasual ? 'rgba(103, 232, 249, 0.18)' : 'rgba(15, 23, 42, 0.11)';
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(x, top - 22);
      ctx.lineTo(x, height - 42);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = isCasual ? '#8af6ff' : '#334155';
      ctx.fillText(`${value}%`, x, top - 38);
    });
    ctx.restore();
  }

  function drawBars(snapshot, layout, isCasual) {
    const { left, top, chartWidth, rowGap, barHeight } = layout;
    snapshot.rows.forEach((row, index) => {
      const y = top + index * (barHeight + rowGap);
      const targetWidth = Math.max(10, (row.value / maxShare) * chartWidth);
      const color = isCasual ? row.casual : row.color;

      drawRankBadge(index + 1, left - 126, y + barHeight / 2, color, isCasual);
      drawProviderLabel(row, left - 88, y + barHeight / 2, isCasual);
      drawBar(left, y, targetWidth, barHeight, color, isCasual);
      drawValue(row.value, left + targetWidth + 20, y + barHeight / 2, color, isCasual);
    });
  }

  function drawRankBadge(rank, x, y, color, isCasual) {
    ctx.save();
    ctx.shadowColor = isCasual ? color : 'rgba(15, 23, 42, 0.14)';
    ctx.shadowBlur = isCasual ? 18 : 0;
    ctx.fillStyle = isCasual ? 'rgba(5, 10, 25, 0.86)' : color;
    ctx.strokeStyle = color;
    ctx.lineWidth = isCasual ? 3 : 0;
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();
    if (isCasual) ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(rank), x, y + 1);
    ctx.restore();
  }

  function drawProviderLabel(row, x, y, isCasual) {
    ctx.save();
    ctx.fillStyle = isCasual ? '#f8fbff' : '#111827';
    ctx.font = '800 22px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const lines = row.label.split('\n');
    if (lines.length === 1) {
      ctx.fillText(lines[0], x, y);
    } else {
      ctx.fillText(lines[0], x, y - 12);
      ctx.fillText(lines[1], x, y + 14);
    }
    ctx.restore();
  }

  function drawBar(x, y, width, height, color, isCasual) {
    const radius = height / 2;
    ctx.save();

    if (isCasual) {
      drawEnergyColumns(x, y, width, height, color);
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowColor = color;
      ctx.shadowBlur = 30;
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = color;
      roundRect(ctx, x - 16, y + height * 0.22, width + 54, height * 0.56, radius);
      ctx.fill();
      ctx.globalAlpha = 0.16;
      roundRect(ctx, x - 34, y + height * 0.36, width + 90, height * 0.28, radius);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowBlur = 22;
    }

    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, isCasual ? colorMix(color, '#04101f', 0.18) : color);
    gradient.addColorStop(0.34, color);
    gradient.addColorStop(0.72, colorMix(color, '#ffffff', isCasual ? 0.24 : 0.05));
    gradient.addColorStop(1, isCasual ? '#ffffff' : colorMix(color, '#111827', 0.05));
    ctx.fillStyle = gradient;
    roundRect(ctx, x, y, width, height, radius);
    ctx.fill();

    if (isCasual) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.42)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, x + 2, y + 2, Math.max(4, width - 4), height - 4, radius);
      ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255,255,255,0.72)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 24, y + height * 0.22);
      ctx.lineTo(x + width - 18, y + height * 0.22);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      drawRacer(x + width - 8, y + height / 2, color);
    }

    ctx.restore();
  }

  function drawEnergyColumns(x, y, width, height, color) {
    const count = Math.max(3, Math.min(18, Math.floor(width / 30)));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 1 : i / (count - 1);
      const columnHeight = height * (0.55 + t * 1.08);
      const columnWidth = Math.max(4, Math.min(12, width / 36));
      const cx = x + width * (0.18 + t * 0.80);
      const cy = y + height * 0.50 - columnHeight * 0.18;
      const gradient = ctx.createLinearGradient(cx, cy - columnHeight, cx, cy + columnHeight);
      gradient.addColorStop(0, 'rgba(255,255,255,0)');
      gradient.addColorStop(0.48, colorMix(color, '#ffffff', 0.2));
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 0.10 + t * 0.12;
      ctx.fillStyle = gradient;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      roundRect(ctx, cx, cy - columnHeight * 0.42, columnWidth, columnHeight, columnWidth / 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRacer(x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = color;
    ctx.shadowBlur = 22;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = colorMix(color, '#ffffff', 0.24);
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(-16, -17);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-16, 17);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#04101f';
    roundRect(ctx, -28, -11, 32, 22, 11);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, -20, -5, 18, 10, 5);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-21, 12, 3.5, 0, Math.PI * 2);
    ctx.arc(-2, 12, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawValue(value, x, y, color, isCasual) {
    ctx.save();
    ctx.fillStyle = isCasual ? color : '#111827';
    ctx.shadowColor = isCasual ? color : 'transparent';
    ctx.shadowBlur = isCasual ? 12 : 0;
    ctx.font = '800 25px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${value.toFixed(1)}%`, x, y);
    ctx.restore();
  }

  function syncLiveInsights(snapshot) {
    const leader = snapshot.rows[0];
    const trackedShare = getTrackedShare(snapshot.values);
    const spark = getSparkPoint(state.virtualIndex);
    const progressPoints = sparkModel.points.slice(0, spark.index + 1).concat(spark);
    const isCasual = state.theme === 'casual';
    const safeTrackedShare = Math.max(0.1, trackedShare);
    let cursor = 0;
    const segments = providers.map((provider, index) => {
      const share = snapshot.values[provider.key];
      const mix = index === providers.length - 1
        ? Math.max(0, 100 - cursor)
        : (share / safeTrackedShare) * 100;
      const start = cursor;
      const end = cursor + mix;
      cursor = end;
      return `${isCasual ? provider.casual : provider.color} ${start}% ${end}%`;
    });

    leaderName.textContent = leader.key;
    leaderValue.textContent = `${leader.value.toFixed(1)}%`;
    sparkDate.textContent = snapshot.label;
    sparkValue.textContent = `Top 5 ${trackedShare.toFixed(1)}%`;
    sparkPath.setAttribute('d', sparkModel.path);
    sparkProgress.setAttribute('d', toPath(progressPoints));
    sparkMarker.setAttribute('cx', spark.x.toFixed(1));
    sparkMarker.setAttribute('cy', spark.y.toFixed(1));
    trackedShareValue.textContent = `Top 5 ${trackedShare.toFixed(1)}%`;
    donutCaption.textContent = snapshot.rows
      .map((provider) => `${provider.short} ${provider.value.toFixed(1)}`)
      .join(' / ');
    neocloudValue.textContent = `${snapshot.neocloud.toFixed(1)}%`;
    neocloudCaption.textContent = snapshot.neocloud >= 4.9
      ? 'AI-focused challengers are about 5% of the total cloud market.'
      : 'AI-focused challengers are tracked as a contextual growth signal.';
    shareDonut.style.background = `conic-gradient(${segments.join(', ')})`;
  }

  function syncDom(force) {
    const index = clamp(Math.round(state.virtualIndex), 0, data.length - 1);
    if (!force && index === state.lastSyncedIndex) return;
    state.lastSyncedIndex = index;

    const snapshot = getInterpolatedSnapshot(index);
    const previous = data[Math.max(0, index - 1)];
    const leader = snapshot.rows[0];

    dateLabel.textContent = snapshot.label;
    timeline.value = String(state.virtualIndex);
    leaderName.textContent = leader.key;
    leaderValue.textContent = `${leader.value.toFixed(1)}%`;
    changeTitle.textContent = index === 0 ? 'Change vs start' : `Change vs ${previous.label}`;

    changeList.innerHTML = snapshot.rows.map((row) => {
      const change = row.value - previous.values[row.key];
      const sign = change >= 0 ? '+' : '';
      return `<div><dt>${row.key}</dt><dd>${sign}${change.toFixed(1)}%</dd></div>`;
    }).join('');

    dataTable.innerHTML = snapshot.rows.map((row) => {
      const change = row.value - previous.values[row.key];
      const sign = change >= 0 ? '+' : '';
      return `<tr><td>${row.key}</td><td>${row.value.toFixed(1)}%</td><td>${sign}${change.toFixed(1)}%</td></tr>`;
    }).join('');
  }

  function syncModeButtons() {
    modeButtons.forEach((button) => {
      const active = button.dataset.themeTarget === state.theme;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
  }

  function roundRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function round1(value) {
    return Math.round(value * 10) / 10;
  }

  function getTrackedShare(values) {
    return round1(providers.reduce((sum, provider) => sum + values[provider.key], 0));
  }

  function toPath(points) {
    if (!points.length) return '';
    return points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
      .join(' ');
  }

  function colorMix(hex, mixHex, amount) {
    const a = parseHex(hex);
    const b = parseHex(mixHex);
    const mixed = a.map((channel, index) => Math.round(channel + (b[index] - channel) * amount));
    return `rgb(${mixed.join(',')})`;
  }

  function parseHex(hex) {
    const normalized = hex.replace('#', '');
    return [0, 2, 4].map((index) => parseInt(normalized.slice(index, index + 2), 16));
  }
})();
