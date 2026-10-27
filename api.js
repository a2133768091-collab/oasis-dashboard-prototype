/**
 * api.js —— 后端接口 stub（挂 window.api）
 * 原型阶段返回 mock；接入真实后端时替换为云函数/HTTP 调用，返回形状保持不变。
 */

// 提醒页「一键完成」增量（localStorage overlay，reminder.js 写同一 key）
// 原型用于演示数据同步效果；接后端后删除，由 daily_records 真实写入替代
function extras() {
  try { return JSON.parse(localStorage.getItem('oasis_breaks_extra') || '[]'); } catch (e) { return []; }
}

// 评分口径与小程序 utils/health-standards.js calcScore 一致：起身40% + 补水35% + 护眼25%
function scoreOf(rec) {
  const g = DB.goals;
  return Math.round((
    Math.min(1, rec.sedentary.breaks / g.breaksGoal) * 0.4 +
    Math.min(1, rec.water.totalMl / g.waterGoalMl) * 0.35 +
    Math.min(1, rec.eye.relaxes / g.eyeGoal) * 0.25
  ) * 100);
}

// 把增量合并进一条记录（起身次数/活动时长/坐姿总时长/评分/事件流/分时段分布）
function applyExtras(rec) {
  const ex = extras();
  if (!ex.length) return rec;
  rec.sedentary.breaks += ex.length;
  rec.sedentary.activityMinutes += 5 * ex.length;
  rec.sedentary.sitMinutesTotal += ex.reduce((s, e) => s + e.sitMinutes, 0);
  rec.score = scoreOf(rec);
  if (rec.logs) ex.forEach(e => rec.logs.push({ ts: e.ts, type: 'sit', label: '起身活动 5 分钟' }));
  if (rec.hourly) ex.forEach(e => {
    const i = rec.hourly.slots.indexOf(e.ts.slice(0, 2));
    if (i >= 0) rec.hourly.breaks[i] += 1;
  });
  return rec;
}

const api = {
  /**
   * 今日记录
   * TODO: GET /daily_records/:date  ←→ 小程序 utils/store.getTodayRecord()
   * @returns {Promise<Object>} daily_records 文档（含 logs / hourly）
   */
  fetchDayRecord() {
    return new Promise(resolve => {
      setTimeout(() => resolve(applyExtras(JSON.parse(JSON.stringify(DB.today)))), 300);
    });
  },

  /**
   * 周报数据
   * TODO: 对接云函数 weeklyReport，POST { endDate: 'YYYY-MM-DD' }
   * @returns {Promise<{days: Array, summary: Object}>}
   */
  fetchWeekReport() {
    return new Promise(resolve => {
      setTimeout(() => {
        const days = JSON.parse(JSON.stringify(DB.week));
        days[days.length - 1] = applyExtras(days[days.length - 1]); // 末条即今日
        const summary = {
          avgScore: Math.round(days.reduce((s, d) => s + d.score, 0) / days.length),
          totalBreaks: days.reduce((s, d) => s + d.sedentary.breaks, 0),
          totalWaterMl: days.reduce((s, d) => s + d.water.totalMl, 0),
          totalRelaxes: days.reduce((s, d) => s + d.eye.relaxes, 0),
          bestDay: days.reduce((a, b) => (b.score > a.score ? b : a)).date.slice(5)
        };
        resolve({ days, summary });
      }, 300);
    });
  }
};

window.api = api;
