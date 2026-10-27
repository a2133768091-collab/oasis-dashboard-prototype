/**
 * mock.js —— 集中 mock 数据（挂 window.DB）
 * 与小程序云数据库 daily_records 集合同构，见 docs/03-后端交接契约.md
 * 数据区间：2026-10-21 ~ 2026-10-27（今日 10-27 为部分完成）
 */
const DB = {
  settings: {
    sitLimitMin: 60,      // 连续久坐提醒阈值（WHO 2020 / EU-OSHA 2021）
    waterGoalMl: 1700,    // 每日补水目标（中国居民膳食指南 2022）
    waterCupMl: 200,      // 每杯 200ml
    eyeEveryMin: 20,      // 护眼间隔（AAO 20-20-20）
    workStart: '09:00',
    workEnd: '19:00'
  },

  // 每日目标派生（与 utils/health-standards.js deriveGoals 对齐的原型口径）
  goals: { breaksGoal: 7, waterGoalMl: 1700, eyeGoal: 20 },

  // 近 7 天记录；score = 起身40% + 补水35% + 护眼25% 加权（各项完成度封顶 100%）
  week: [
    { date: '2026-10-21', sedentary: { sitMinutesTotal: 400, breaks: 5, activityMinutes: 24, breaksGoal: 7 }, water: { totalMl: 1200, cups: 6, goalMl: 1700 }, eye: { relaxes: 12, goal: 20 }, score: 68 },
    { date: '2026-10-22', sedentary: { sitMinutesTotal: 350, breaks: 7, activityMinutes: 33, breaksGoal: 7 }, water: { totalMl: 1700, cups: 9, goalMl: 1700 }, eye: { relaxes: 18, goal: 20 }, score: 98 },
    { date: '2026-10-23', sedentary: { sitMinutesTotal: 440, breaks: 4, activityMinutes: 18, breaksGoal: 7 }, water: { totalMl: 1400, cups: 7, goalMl: 1700 }, eye: { relaxes: 10, goal: 20 }, score: 64 },
    { date: '2026-10-24', sedentary: { sitMinutesTotal: 380, breaks: 6, activityMinutes: 28, breaksGoal: 7 }, water: { totalMl: 1600, cups: 8, goalMl: 1700 }, eye: { relaxes: 15, goal: 20 }, score: 86 },
    { date: '2026-10-25', sedentary: { sitMinutesTotal: 340, breaks: 7, activityMinutes: 33, breaksGoal: 7 }, water: { totalMl: 1800, cups: 9, goalMl: 1700 }, eye: { relaxes: 20, goal: 20 }, score: 100 },
    { date: '2026-10-26', sedentary: { sitMinutesTotal: 470, breaks: 3, activityMinutes: 14, breaksGoal: 7 }, water: { totalMl: 800, cups: 4, goalMl: 1700 }, eye: { relaxes: 7, goal: 20 }, score: 42 },
    { date: '2026-10-27', sedentary: { sitMinutesTotal: 300, breaks: 4, activityMinutes: 17, breaksGoal: 7 }, water: { totalMl: 800, cups: 4, goalMl: 1700 }, eye: { relaxes: 5, goal: 20 }, score: 46 }
  ],

  // 今日（2026-10-27，进行中）：与 week 末条同一份统计，另含事件流与分时段分布
  today: {
    date: '2026-10-27',
    sedentary: { sitMinutesTotal: 300, breaks: 4, activityMinutes: 17, breaksGoal: 7 },
    water: { totalMl: 800, cups: 4, goalMl: 1700 },
    eye: { relaxes: 5, goal: 20 },
    score: 46,
    logs: [
      { ts: '09:12', type: 'water', label: '喝水 200ml' },
      { ts: '09:58', type: 'sit',   label: '起身活动 5 分钟' },
      { ts: '10:20', type: 'eye',   label: '远眺放松 20 秒' },
      { ts: '10:32', type: 'water', label: '喝水 200ml' },
      { ts: '11:05', type: 'sit',   label: '起身活动 4 分钟' },
      { ts: '11:47', type: 'water', label: '喝水 200ml' },
      { ts: '13:30', type: 'eye',   label: '远眺放松 20 秒' },
      { ts: '14:02', type: 'water', label: '喝水 200ml' },
      { ts: '14:35', type: 'sit',   label: '起身活动 5 分钟' },
      { ts: '15:20', type: 'eye',   label: '远眺放松 20 秒' },
      { ts: '16:10', type: 'sit',   label: '起身活动 3 分钟' },
      { ts: '16:45', type: 'eye',   label: '远眺放松 20 秒' },
      { ts: '17:30', type: 'eye',   label: '远眺放松 20 秒' }
    ],
    hourly: {
      slots: ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18'],
      waterMl: [200, 200, 200, 0, 0, 200, 0, 0, 0, 0],
      breaks:  [1, 0, 1, 0, 0, 1, 0, 1, 0, 0]
    }
  }
};

window.DB = DB;
