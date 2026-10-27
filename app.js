/**
 * app.js —— 视图渲染 + Canvas 2D 图表（与小程序 dashboard.js 同逻辑）
 * 状态：state.mode ∈ 'day' | 'week'，localStorage key = oasis-mode
 */
const state = { mode: localStorage.getItem('oasis-mode') || 'week' };

const FONT = '10px "PingFang SC","Noto Sans CJK SC",sans-serif';
const C_GRID = '#e4ece7', C_TEXT = '#8a9a90', C_MAIN = '#24352c';
const C_SIT = '#2e8b57', C_WATER = '#2f7fbf', C_EYE = '#c08a2d', C_DANGER = '#c0392b', C_PRIMARY = '#0f5132';

/* ---------------- Lucide 内联图标 ---------------- */
const ICONS = {
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
  'trending-up': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  droplets: '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  'calendar-days': '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>'
};
const icon = (name, size = 16) =>
  `<span class="icon"><svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg></span>`;

/* ---------------- 模板片段 ---------------- */
const cardHead = (iconName, title, unit) =>
  `<div class="card-head">${icon(iconName)}<h2>${title}</h2><span class="unit">${unit}</span></div>`;

const compareRow = (name, cls, color, actual, goal, unit) => {
  const pct = Math.min(100, Math.round(actual / goal * 100));
  return `
  <div class="compare-row">
    <div class="compare-top">
      <span class="name"><span class="dot" style="background:${color}"></span>${name}</span>
      <span class="val"><b>${actual}</b>/${goal} ${unit}</span>
    </div>
    <div class="compare-track"><div class="compare-fill ${cls}" data-w="${pct}"></div></div>
  </div>`;
};

const mdLabel = date => { const [, m, d] = date.split('-'); return `${+m}/${+d}`; };

/* ---------------- 周视图 ---------------- */
function weekView(summary, days) {
  const g = DB.goals, n = days.length;
  return `
  <section class="card" style="animation-delay:0ms">
    ${cardHead('award', '本周概览', '近 7 天')}
    <div class="stat-grid">
      <div class="stat-cell"><div class="num green">${summary.avgScore}</div><div class="lbl">周均评分</div></div>
      <div class="stat-cell"><div class="num sit">${summary.totalBreaks}</div><div class="lbl">总起身</div></div>
      <div class="stat-cell"><div class="num water">${summary.totalWaterMl}</div><div class="lbl">总补水 ml</div></div>
      <div class="stat-cell"><div class="num eye">${summary.totalRelaxes}</div><div class="lbl">总远眺</div></div>
    </div>
    <div class="best-day">${icon('award', 14)}状态最好的一天：<b>${summary.bestDay}</b></div>
  </section>

  <section class="card" style="animation-delay:60ms">
    ${cardHead('trending-up', '评分趋势', '分')}
    <canvas id="chartScore" class="chart chart-line"></canvas>
  </section>

  <section class="card" style="animation-delay:120ms">
    ${cardHead('activity', '久坐管理', '起身次数 / 坐姿时长 h')}
    <canvas id="chartSit" class="chart chart-bar"></canvas>
    <div class="legend">
      <span class="item"><span class="dot" style="background:${C_SIT}"></span>起身打断</span>
      <span class="item"><span class="dot" style="background:${C_DANGER}"></span>坐姿总时长 h</span>
      <span class="item"><span class="dash"></span>目标 ${g.breaksGoal} 次/天</span>
    </div>
  </section>

  <section class="card" style="animation-delay:180ms">
    ${cardHead('droplets', '每日补水', 'ml')}
    <canvas id="chartWater" class="chart chart-bar"></canvas>
    <div class="legend">
      <span class="item"><span class="dot" style="background:${C_WATER}"></span>补水量</span>
      <span class="item"><span class="dash"></span>目标 ${g.waterGoalMl} ml/天</span>
    </div>
  </section>

  <section class="card" style="animation-delay:240ms">
    ${cardHead('eye', '眼部放松', '次')}
    <canvas id="chartEye" class="chart chart-bar"></canvas>
    <div class="legend">
      <span class="item"><span class="dot" style="background:${C_EYE}"></span>远眺放松</span>
      <span class="item"><span class="dash"></span>目标 ${g.eyeGoal} 次/天</span>
    </div>
  </section>

  <section class="card" style="animation-delay:300ms">
    ${cardHead('target', '周目标完成度', '近 7 天合计')}
    ${compareRow('起身活动', 'sit', C_SIT, summary.totalBreaks, g.breaksGoal * n, '次')}
    ${compareRow('补水总量', 'water', C_WATER, summary.totalWaterMl, g.waterGoalMl * n, 'ml')}
    ${compareRow('远眺放松', 'eye', C_EYE, summary.totalRelaxes, g.eyeGoal * n, '次')}
    <div class="legend">
      <span class="item"><span class="dot" style="background:var(--goal)"></span>目标</span>
      <span class="item"><span class="dot" style="background:${C_PRIMARY}"></span>实际完成占比</span>
    </div>
  </section>`;
}

/* ---------------- 日视图 ---------------- */
function dayView(today) {
  const RING_C = 326.7;
  const d = new Date(today.date + 'T00:00:00');
  const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
  const dateLbl = `${d.getMonth() + 1}月${d.getDate()}日 · ${weekDay}`;
  return `
  <section class="card" style="animation-delay:0ms">
    ${cardHead('award', '今日评分', dateLbl)}
    <div class="score-wrap">
      <div class="ring-box">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#e4ece7" stroke-width="12"/>
          <circle class="ring-progress" cx="60" cy="60" r="52" fill="none" stroke="${C_PRIMARY}" stroke-width="12"
            stroke-linecap="round" stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C}"/>
        </svg>
        <div class="ring-center"><span class="score-num">${today.score}</span><span class="score-lbl">习惯评分</span></div>
      </div>
      <div class="score-rows">
        <div class="score-row"><span class="icon" style="color:${C_SIT}">${icon('activity', 15)}</span><span class="name">起身</span><span class="v"><b>${today.sedentary.breaks}</b>/${today.sedentary.breaksGoal} 次</span></div>
        <div class="score-row"><span class="icon" style="color:${C_WATER}">${icon('droplets', 15)}</span><span class="name">补水</span><span class="v"><b>${today.water.totalMl}</b>/${today.water.goalMl} ml</span></div>
        <div class="score-row"><span class="icon" style="color:${C_EYE}">${icon('eye', 15)}</span><span class="name">远眺</span><span class="v"><b>${today.eye.relaxes}</b>/${today.eye.goal} 次</span></div>
      </div>
    </div>
  </section>

  <section class="card" style="animation-delay:60ms">
    ${cardHead('target', '今日 vs 目标', '截至当前')}
    ${compareRow('起身活动', 'sit', C_SIT, today.sedentary.breaks, today.sedentary.breaksGoal, '次')}
    ${compareRow('补水', 'water', C_WATER, today.water.totalMl, today.water.goalMl, 'ml')}
    ${compareRow('远眺放松', 'eye', C_EYE, today.eye.relaxes, today.eye.goal, '次')}
  </section>

  <section class="card" style="animation-delay:120ms">
    ${cardHead('trending-up', '分时段分布', '09:00–18:00')}
    <canvas id="chartHourly" class="chart chart-bar"></canvas>
    <div class="legend">
      <span class="item"><span class="dot" style="background:${C_WATER}"></span>补水 ml÷100</span>
      <span class="item"><span class="dot" style="background:${C_SIT}"></span>起身次数</span>
    </div>
  </section>

  <section class="card" style="animation-delay:180ms">
    ${cardHead('calendar-days', '今日时间轴', today.logs.length + ' 条')}
    <div class="timeline">
      ${today.logs.map(l => `
      <div class="tl-item">
        <div class="tl-rail"><span class="tl-dot ${l.type}"></span><span class="tl-line"></span></div>
        <div class="tl-body"><span class="ts">${l.ts}</span>${l.label}</div>
      </div>`).join('')}
    </div>
  </section>`;
}

/* ---------------- Canvas 基础 ---------------- */
function withCanvas(id, fn) {
  const node = document.getElementById(id);
  if (!node) return;
  const dpr = window.devicePixelRatio || 1;
  const w = node.clientWidth, h = node.clientHeight;
  node.width = w * dpr;
  node.height = h * dpr;
  const ctx = node.getContext('2d');
  ctx.scale(dpr, dpr);
  fn(ctx, w, h);
}

function animate(draw) {
  const start = performance.now(), dur = 350;
  (function frame(now) {
    let t = Math.min(1, (now - start) / dur);
    t = 1 - Math.pow(1 - t, 3); // ease-out
    draw(t);
    if (t < 1) requestAnimationFrame(frame);
  })(start);
}

function drawGrid(ctx, W, padL, padR, padT, h, maxY, ticks) {
  ctx.strokeStyle = C_GRID;
  ctx.fillStyle = C_TEXT;
  ctx.font = FONT;
  ctx.lineWidth = 1;
  ctx.textAlign = 'left';
  for (let i = 0; i <= ticks; i++) {
    const y = padT + h - h / ticks * i;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
    ctx.fillText(String(Math.round(maxY / ticks * i)), 5, y + 3);
  }
}

function drawGoal(ctx, W, padL, padR, y, label) {
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = C_TEXT;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL, y);
  ctx.lineTo(W - padR, y);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = C_TEXT;
  ctx.font = FONT;
  ctx.textAlign = 'right';
  ctx.fillText(label, W - padR, y - 4);
}

function drawXLabels(ctx, labels, xs, H) {
  ctx.fillStyle = C_TEXT;
  ctx.font = FONT;
  ctx.textAlign = 'center';
  labels.forEach((t, i) => ctx.fillText(t, xs[i], H - 6));
}

/* ---------------- 图表：评分折线（周） ---------------- */
function drawScoreChart(days, t) {
  withCanvas('chartScore', (ctx, W, H) => {
    const padL = 30, padR = 12, padT = 16, padB = 22;
    const w = W - padL - padR, h = H - padT - padB, maxY = 100, n = days.length;
    drawGrid(ctx, W, padL, padR, padT, h, maxY, 4);
    const px = i => padL + w / (n - 1) * i;
    const py = v => padT + h - v / maxY * h;
    drawXLabels(ctx, days.map(d => mdLabel(d.date)), days.map((_, i) => px(i)), H);
    // 线下渐变填充
    const grad = ctx.createLinearGradient(0, padT, 0, padT + h);
    grad.addColorStop(0, 'rgba(15,81,50,.12)');
    grad.addColorStop(1, 'rgba(15,81,50,0)');
    ctx.beginPath();
    days.forEach((d, i) => { const x = px(i), y = py(d.score * t); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.lineTo(px(n - 1), padT + h);
    ctx.lineTo(px(0), padT + h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    // 折线 + 圆点 + 数值
    ctx.beginPath();
    days.forEach((d, i) => { const x = px(i), y = py(d.score * t); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.strokeStyle = C_PRIMARY;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = C_PRIMARY;
    days.forEach((d, i) => { ctx.beginPath(); ctx.arc(px(i), py(d.score * t), 3, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = C_MAIN;
    ctx.font = FONT;
    ctx.textAlign = 'center';
    days.forEach((d, i) => ctx.fillText(String(Math.round(d.score * t)), px(i), py(d.score * t) - 7));
  });
}

/* ---------------- 图表：久坐（柱=打断次数 + 线=坐姿时长h） ---------------- */
function drawSitChart(days, t) {
  withCanvas('chartSit', (ctx, W, H) => {
    const padL = 24, padR = 12, padT = 18, padB = 22;
    const w = W - padL - padR, h = H - padT - padB, maxY = 8, n = days.length;
    drawGrid(ctx, W, padL, padR, padT, h, maxY, 4);
    const slotW = w / n;
    const cx = i => padL + slotW * (i + .5);
    const py = v => padT + h - v / maxY * h;
    const barW = Math.min(20, slotW * .36);
    drawXLabels(ctx, days.map(d => mdLabel(d.date)), days.map((_, i) => cx(i)), H);
    // 目标虚线：breaksGoal 次
    drawGoal(ctx, W, padL, padR, py(DB.goals.breaksGoal), '目标 ' + DB.goals.breaksGoal);
    // 柱：起身打断
    days.forEach((d, i) => {
      const v = d.sedentary.breaks * t;
      ctx.fillStyle = C_SIT;
      ctx.fillRect(cx(i) - barW / 2, py(v), barW, padT + h - py(v));
    });
    // 线：坐姿总时长 ÷ 60（小时）
    ctx.beginPath();
    days.forEach((d, i) => { const x = cx(i), y = py(d.sedentary.sitMinutesTotal / 60 * t); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.strokeStyle = C_DANGER;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = C_DANGER;
    days.forEach((d, i) => { ctx.beginPath(); ctx.arc(cx(i), py(d.sedentary.sitMinutesTotal / 60 * t), 2.5, 0, Math.PI * 2); ctx.fill(); });
  });
}

/* ---------------- 图表：补水 / 护眼 柱状（周） ---------------- */
function drawBarChart(id, days, pick, color, maxY, ticks, goalVal, goalLbl, t) {
  withCanvas(id, (ctx, W, H) => {
    const padL = 32, padR = 12, padT = 18, padB = 22;
    const w = W - padL - padR, h = H - padT - padB, n = days.length;
    drawGrid(ctx, W, padL, padR, padT, h, maxY, ticks);
    const slotW = w / n;
    const cx = i => padL + slotW * (i + .5);
    const py = v => padT + h - v / maxY * h;
    const barW = Math.min(22, slotW * .42);
    drawXLabels(ctx, days.map(d => mdLabel(d.date)), days.map((_, i) => cx(i)), H);
    drawGoal(ctx, W, padL, padR, py(goalVal), goalLbl);
    ctx.fillStyle = color;
    days.forEach((d, i) => {
      const v = pick(d) * t;
      ctx.fillRect(cx(i) - barW / 2, py(v), barW, padT + h - py(v));
    });
    ctx.fillStyle = C_TEXT;
    ctx.font = FONT;
    ctx.textAlign = 'center';
    days.forEach((d, i) => ctx.fillText(String(Math.round(pick(d) * t)), cx(i), py(pick(d) * t) - 5));
  });
}

/* ---------------- 图表：分时段分布（日，双系列柱） ---------------- */
function drawHourlyChart(today, t) {
  withCanvas('chartHourly', (ctx, W, H) => {
    const { slots, waterMl, breaks } = today.hourly;
    const padL = 24, padR = 10, padT = 16, padB = 22;
    const w = W - padL - padR, h = H - padT - padB, maxY = 2, n = slots.length;
    drawGrid(ctx, W, padL, padR, padT, h, maxY, 2);
    const slotW = w / n;
    const cx = i => padL + slotW * (i + .5);
    const py = v => padT + h - v / maxY * h;
    const bw = 8, gap = 3;
    drawXLabels(ctx, slots, slots.map((_, i) => cx(i)), H);
    slots.forEach((_, i) => {
      const wv = waterMl[i] / 100 * t, bv = breaks[i] * t;
      ctx.fillStyle = C_WATER;
      ctx.fillRect(cx(i) - bw - gap / 2, py(wv), bw, padT + h - py(wv));
      ctx.fillStyle = C_SIT;
      ctx.fillRect(cx(i) + gap / 2, py(bv), bw, padT + h - py(bv));
    });
  });
}

/* ---------------- 渲染主流程 ---------------- */
const view = document.getElementById('view');
const SKELETON = '<div class="skel skel-card"></div><div class="skel skel-card"></div><div class="skel skel-card tall"></div>';

function animateFills() {
  requestAnimationFrame(() => {
    document.querySelectorAll('.compare-fill').forEach(el => { el.style.width = el.dataset.w + '%'; });
  });
}

function render() {
  document.querySelectorAll('.seg-btn').forEach(b => {
    const on = b.dataset.mode === state.mode;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on);
  });
  view.innerHTML = SKELETON;

  if (state.mode === 'week') {
    api.fetchWeekReport().then(({ days, summary }) => {
      view.innerHTML = weekView(summary, days);
      animate(t => {
        drawScoreChart(days, t);
        drawSitChart(days, t);
        drawBarChart('chartWater', days, d => d.water.totalMl, C_WATER, 2000, 4, DB.goals.waterGoalMl, '目标 ' + DB.goals.waterGoalMl, t);
        drawBarChart('chartEye', days, d => d.eye.relaxes, C_EYE, 24, 4, DB.goals.eyeGoal, '目标 ' + DB.goals.eyeGoal, t);
      });
      animateFills();
    });
  } else {
    api.fetchDayRecord().then(today => {
      view.innerHTML = dayView(today);
      animate(t => drawHourlyChart(today, t));
      animateFills();
      const ring = view.querySelector('.ring-progress');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        ring.style.strokeDashoffset = String(326.7 * (1 - today.score / 100));
      }));
    });
  }
}

document.querySelectorAll('.seg-btn').forEach(b => {
  b.addEventListener('click', () => {
    if (b.dataset.mode === state.mode) return;
    state.mode = b.dataset.mode;
    localStorage.setItem('oasis-mode', state.mode);
    render();
  });
});

render();
