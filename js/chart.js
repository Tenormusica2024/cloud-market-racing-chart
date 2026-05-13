(() => {
  'use strict';

  const providers = [
    { key: 'AWS', label: 'AWS', color: '#2f6df6', casual: '#18a8ff' },
    { key: 'Azure', label: 'Azure', color: '#ff6b12', casual: '#ff8a18' },
    { key: 'Google Cloud', label: 'Google\nCloud', color: '#0aa39e', casual: '#17d6ce' },
  ];

  const anchors = [
    { year: 2015, values: { AWS: 29.5, Azure: 9.8, 'Google Cloud': 4.1 } },
    { year: 2016, values: { AWS: 31.0, Azure: 11.6, 'Google Cloud': 5.0 } },
    { year: 2017, values: { AWS: 32.2, Azure: 13.8, 'Google Cloud': 6.0 } },
    { year: 2018, values: { AWS: 32.7, Azure: 15.8, 'Google Cloud': 7.0 } },
    { year: 2019, values: { AWS: 33.1, Azure: 17.5, 'Google Cloud': 7.8 } },
    { year: 2020, values: { AWS: 32.6, Azure: 19.4, 'Google Cloud': 8.6 } },
    { year: 2021, values: { AWS: 32.2, Azure: 21.0, 'Google Cloud': 9.2 } },
    { year: 2022, values: { AWS: 32.1, Azure: 22.0, 'Google Cloud': 9.8 } },
    { year: 2023, values: { AWS: 32.0, Azure: 21.5, 'Google Cloud': 9.8 } },
    { year: 2024, values: { AWS: 33.6, Azure: 22.7, 'Google Cloud': 10.4 } },
  ];

  const state = {
    theme: localStorage.getItem('cloud-racing-theme') || 'casual',
    virtualIndex: 39,
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

  const data = buildQuarterData();
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
        localStorage.setItem('cloud-racing-theme', state.theme);
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
    for (let yearIndex = 0; yearIndex < anchors.length; yearIndex++) {
      const current = anchors[yearIndex];
      const next = anchors[yearIndex + 1] || current;
      for (let quarter = 1; quarter <= 4; quarter++) {
        const localT = (quarter - 1) / 4;
        const values = {};
        providers.forEach((provider) => {
          const start = current.values[provider.key];
          const end = next.values[provider.key];
          values[provider.key] = round1(start + (end - start) * localT);
        });
        rows.push({
          label: `${current.year} Q${quarter}`,
          year: current.year,
          quarter,
          values,
        });
      }
    }
    return rows;
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
    const rowGap = Math.max(22, height * 0.075);
    const barHeight = Math.min(58, Math.max(36, height * 0.12));
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
      bg.addColorStop(0, '#071024');
      bg.addColorStop(0.5, '#070a16');
      bg.addColorStop(1, '#15071f');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = '#1dd7ff';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += 54) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - 80, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y + 20);
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      const track = ctx.createRadialGradient(width * 0.5, height * 0.62, 20, width * 0.5, height * 0.62, width * 0.62);
      track.addColorStop(0, 'rgba(24, 200, 255, 0.22)');
      track.addColorStop(0.48, 'rgba(24, 200, 255, 0.08)');
      track.addColorStop(1, 'rgba(24, 200, 255, 0)');
      ctx.fillStyle = track;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
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

  function drawAxis(layout, isCasual) {
    const { left, top, chartWidth, height } = layout;
    ctx.save();
    ctx.font = '600 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let value = 0; value <= maxShare; value += 10) {
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
    }
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
      ctx.shadowColor = color;
      ctx.shadowBlur = 24;
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = color;
      roundRect(ctx, x - 4, y + height * 0.2, width + 10, height * 0.6, radius);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 18;
    }

    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.62, colorMix(color, '#ffffff', isCasual ? 0.14 : 0.05));
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
      drawRacer(x + width - 16, y + height / 2, color);
    }

    ctx.restore();
  }

  function drawRacer(x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#050815';
    roundRect(ctx, -24, -12, 42, 24, 12);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, -16, -6, 22, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-12, 13, 4, 0, Math.PI * 2);
    ctx.arc(10, 13, 4, 0, Math.PI * 2);
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
    const aws = snapshot.values.AWS;
    const azure = snapshot.values.Azure;
    const google = snapshot.values['Google Cloud'];
    const trackedShare = getTrackedShare(snapshot.values);
    const spark = getSparkPoint(state.virtualIndex);
    const progressPoints = sparkModel.points.slice(0, spark.index + 1).concat(spark);
    const isCasual = state.theme === 'casual';
    const awsColor = isCasual ? providers[0].casual : providers[0].color;
    const azureColor = isCasual ? providers[1].casual : providers[1].color;
    const googleColor = isCasual ? providers[2].casual : providers[2].color;
    const otherColor = isCasual ? 'rgba(145, 166, 196, 0.26)' : 'rgba(100, 116, 139, 0.22)';
    const azureEnd = aws + azure;
    const googleEnd = trackedShare;

    leaderName.textContent = leader.key;
    leaderValue.textContent = `${leader.value.toFixed(1)}%`;
    sparkDate.textContent = snapshot.label;
    sparkValue.textContent = `Top 3 ${trackedShare.toFixed(1)}%`;
    sparkPath.setAttribute('d', sparkModel.path);
    sparkProgress.setAttribute('d', toPath(progressPoints));
    sparkMarker.setAttribute('cx', spark.x.toFixed(1));
    sparkMarker.setAttribute('cy', spark.y.toFixed(1));
    trackedShareValue.textContent = `${trackedShare.toFixed(1)}%`;
    donutCaption.textContent = `AWS ${aws.toFixed(1)} / Azure ${azure.toFixed(1)} / GCP ${google.toFixed(1)}`;
    shareDonut.style.background = `conic-gradient(${awsColor} 0 ${aws}%, ${azureColor} ${aws}% ${azureEnd}%, ${googleColor} ${azureEnd}% ${googleEnd}%, ${otherColor} ${googleEnd}% 100%)`;
  }

  function syncDom(force) {
    const index = clamp(Math.round(state.virtualIndex), 0, data.length - 1);
    if (!force && index === state.lastSyncedIndex) return;
    state.lastSyncedIndex = index;

    const snapshot = getInterpolatedSnapshot(index);
    const previous = data.find((row) => row.label === '2023 Q4') || data[data.length - 5];
    const leader = snapshot.rows[0];

    dateLabel.textContent = snapshot.label;
    timeline.value = String(state.virtualIndex);
    leaderName.textContent = leader.key;
    leaderValue.textContent = `${leader.value.toFixed(1)}%`;

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
