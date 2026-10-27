/**
 * reminder.js —— 久坐提醒页原型逻辑
 * 对应小程序 pages/reminder/reminder：状态展示 / 活动建议 / 一键完成 / 一键取消 / 强提醒反馈
 * 演示入口：reminder.html（超温和阈值 78 分钟）| reminder.html?strong=1（超红线 128 分钟强提醒态）
 */

// 活动建议池：与小程序 pages/reminder/reminder.js SUGGESTIONS 一致
const SUGGESTIONS = [
  '起身走到茶水间，倒一杯温水，顺便活动肩颈。',
  '站立做 5 次深呼吸，双手上举伸展脊柱。',
  '到窗边远眺 1 分钟，让眼睛和大脑都休息一下。',
  '做 10 次缓慢深蹲或提踵，激活下肢循环。',
  '转动颈部：缓慢左右各 5 次，缓解颈椎压力。',
  '站立办公 5 分钟，顺便整理桌面。',
  '走廊快走 2 分钟，促进全身血液循环。',
  '做一组扩胸运动 + 肩部环绕各 10 次。'
];

const SIT_LIMIT_MIN = 60;   // 温和提醒阈值（WHO 2020 / EU-OSHA 2021）
const RED_LINE_MIN = 120;   // 连续坐姿红线（EU-OSHA 底线）

const state = {
  strong: new URLSearchParams(location.search).get('strong') === '1',
  sitMinutes: 0,
  tipIdx: Math.floor(Math.random() * SUGGESTIONS.length)
};

// 本日已有的「一键完成」增量（localStorage overlay，api.js 读同一 key）
function extras() {
  try { return JSON.parse(localStorage.getItem('oasis_breaks_extra') || '[]'); } catch (e) { return []; }
}

function nowHM() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function render() {
  const overLimit = state.sitMinutes >= SIT_LIMIT_MIN;
  const strong = state.strong || state.sitMinutes >= RED_LINE_MIN;
  const hero = document.getElementById('hero');
  hero.classList.toggle('st-strong', strong);
  hero.classList.toggle('st-warn', !strong && overLimit);

  document.getElementById('sitMinutes').textContent = state.sitMinutes;
  document.getElementById('heroFill').style.width = Math.min(100, state.sitMinutes / RED_LINE_MIN * 100) + '%';
  document.getElementById('strongBadge').hidden = !strong;
  document.getElementById('heroStatus').textContent = strong
    ? '已超过连续坐姿红线，请立即起身充分活动'
    : overLimit
      ? '已超过建议间隔，请起身活动 3~5 分钟'
      : '尚未到达提醒阈值，继续保持良好节奏';

  // 今日累计 = mock 基线 + 本会话已完成的增量
  const ex = extras();
  document.getElementById('todayBreaks').textContent = DB.today.sedentary.breaks + ex.length;
  document.getElementById('todayActivity').textContent = DB.today.sedentary.activityMinutes + 5 * ex.length;
}

function renderTip() {
  document.getElementById('tipText').textContent = SUGGESTIONS[state.tipIdx];
}

// 强提醒入场反馈：WebAudio 双音提示 + 移动端震动（对应小程序 vibrateLong + 提示音）
// 浏览器自动播放限制：若被挂起，则在首次点击页面时补播一次
let beepDone = false;
function strongBeep() {
  if (beepDone) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!window._beepCtx) window._beepCtx = new AC();
    const ctx = window._beepCtx;
    if (ctx.state === 'suspended') { ctx.resume().then(() => {}).catch(() => {}); return; }
    beepDone = true;
    [523.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + i * 0.18 + 0.02);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.18);
    });
    if (navigator.vibrate) navigator.vibrate(200);
  } catch (e) {}
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 1600);
}

function init() {
  state.sitMinutes = state.strong ? 128 : 78; // 演示基线：超温和阈值 / 超红线
  render();
  renderTip();

  // 每 60s 模拟 +1 分钟，跨阈值时状态自动升级（对应小程序 30s 时钟 tick）
  setInterval(() => { state.sitMinutes += 1; render(); }, 60000);

  if (state.strong) {
    strongBeep();
    document.addEventListener('pointerdown', strongBeep, { once: true });
  }

  document.getElementById('btnTip').addEventListener('click', () => {
    let next = Math.floor(Math.random() * SUGGESTIONS.length);
    if (next === state.tipIdx) next = (next + 1) % SUGGESTIONS.length;
    state.tipIdx = next;
    renderTip();
  });

  // 一键完成：写入 overlay（看板 api.js 读取并合并到日/周统计），toast 后返回看板日视图
  document.getElementById('btnComplete').addEventListener('click', function () {
    this.disabled = true;
    this.textContent = '记录中…';
    const ex = extras();
    ex.push({ ts: nowHM(), sitMinutes: state.sitMinutes });
    localStorage.setItem('oasis_breaks_extra', JSON.stringify(ex));
    localStorage.setItem('oasis-mode', 'day'); // 看板直接落到日视图
    toast('已记录，今日起身 +1');
    setTimeout(() => { location.href = 'index.html'; }, 900);
  });

  // 一键取消：不落库，直接返回看板
  document.getElementById('btnCancel').addEventListener('click', () => {
    location.href = 'index.html';
  });
}

document.addEventListener('DOMContentLoaded', init);
