/* =========================================================
   俄语打字通 · 核心工具
   ========================================================= */
"use strict";

const DATA = window.RU_DATA;

/* ---------------- 小工具 ---------------- */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatClock(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  const m = Math.floor(s / 60);
  return `${pad2(m)}:${pad2(s % 60)}`;
}

function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  if (s < 60) return `${s} 秒`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m < 60) return rest ? `${m} 分 ${rest} 秒` : `${m} 分钟`;
  const h = Math.floor(m / 60);
  return `${h} 小时 ${m % 60} 分`;
}

function dayKey(date) {
  const d = date ? new Date(date) : new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatDateShort(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`;
}

function daysBetweenKeys(a, b) {
  if (!a || !b) return 999;
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  return Math.round((db - da) / 86400000);
}

function shuffled(list) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/* ---------------- SVG 图标 ---------------- */
const ICONS = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  gamepad: '<rect x="2" y="6" width="20" height="12" rx="4"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15" cy="13" r="1"/><circle cx="18" cy="11" r="1"/>',
  chart: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
  type: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
  speaker: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.9-1 1.4-2-.3-.8.3-1.6 1.2-1.6H17a4 4 0 0 0 4-4c0-5.5-4-10.4-9-10.4z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="10.5" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/><circle cx="17.5" cy="11" r="1"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  "volume-off": '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  "arrow-left": '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  pause: '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
  restart: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  "chevron-right": '<polyline points="9 18 15 12 9 6"/>',
  keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6.01" y2="10"/><line x1="10" y1="10" x2="10.01" y2="10"/><line x1="14" y1="10" x2="14.01" y2="10"/><line x1="18" y1="10" x2="18.01" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/>',
  award: '<circle cx="12" cy="8" r="6"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  sparkles: '<path d="M12 3l1.8 4.9L19 9.7l-4.2 3.2L16.2 18 12 14.8 7.8 18l1.4-5.1L5 9.7l5.2-1.8z"/><path d="M19 3v3M17.5 4.5h3M5 18v2M4 19h2"/>',
  mouse: '<rect x="5" y="2" width="14" height="20" rx="7"/><line x1="12" y1="6" x2="12" y2="10"/>'
};

function icon(name, cls, size) {
  const body = ICONS[name] || ICONS.info;
  const klass = cls ? ` ${cls}` : "";
  const dim = size || 20;
  return `<svg class="ico${klass}" width="${dim}" height="${dim}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

function starsHTML(count, cls) {
  let out = `<span class="stars${cls ? " " + cls : ""}" aria-label="${count} 星">`;
  for (let i = 1; i <= 3; i++) {
    out += icon("star", `star${i <= count ? " on" : ""}`, 16);
  }
  return out + "</span>";
}

/* ---------------- 本地存储 ---------------- */
const DB_KEY = "ru-typing-tutor-v1";
let storageAvailable = true;

function defaultDB() {
  return {
    version: 2,
    createdAt: new Date().toISOString(),
    settings: {
      sound: true,
      tts: true,
      keyboard: true,
      inputMode: "layout",
      fontScale: 1,
      theme: "modern"
    },
    lessons: {},
    articles: {},
    customArticles: [],
    results: [],
    keyErrors: {},
    game: { highScore: 0, plays: 0, bestCombo: 0, totalWords: 0 },
    alphabetViewed: [],
    streak: { lastDate: null, days: 0, bestDays: 0 }
  };
}

function loadDB() {
  const base = defaultDB();
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return base;
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings || {}) },
      game: { ...base.game, ...(parsed.game || {}) },
      streak: { ...base.streak, ...(parsed.streak || {}) },
      lessons: parsed.lessons && typeof parsed.lessons === "object" ? parsed.lessons : {},
      articles: parsed.articles && typeof parsed.articles === "object" ? parsed.articles : {},
      customArticles: Array.isArray(parsed.customArticles) ? parsed.customArticles : [],
      results: Array.isArray(parsed.results) ? parsed.results.slice(0, 100) : [],
      keyErrors: parsed.keyErrors && typeof parsed.keyErrors === "object" ? parsed.keyErrors : {},
      alphabetViewed: Array.isArray(parsed.alphabetViewed) ? parsed.alphabetViewed : []
    };
  } catch (err) {
    storageAvailable = false;
    return base;
  }
}

const DB = {
  data: loadDB(),
  save() {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(this.data));
      storageAvailable = true;
    } catch (err) {
      storageAvailable = false;
    }
  },
  reset() {
    this.data = defaultDB();
    this.save();
  },
  setSetting(key, value) {
    this.data.settings[key] = value;
    this.save();
  },
  saveCustomArticle(article) {
    if (!Array.isArray(this.data.customArticles)) this.data.customArticles = [];
    const index = this.data.customArticles.findIndex((item) => item.id === article.id);
    if (index >= 0) this.data.customArticles[index] = article;
    else this.data.customArticles.push(article);
    this.save();
  },
  deleteCustomArticle(id) {
    this.data.customArticles = (this.data.customArticles || []).filter((item) => item.id !== id);
    if (this.data.articles && this.data.articles[id]) delete this.data.articles[id];
    this.save();
  },
  touchStreak() {
    const today = dayKey();
    const streak = this.data.streak;
    if (streak.lastDate === today) return;
    if (streak.lastDate && daysBetweenKeys(streak.lastDate, today) === 1) {
      streak.days += 1;
    } else {
      streak.days = 1;
    }
    streak.lastDate = today;
    streak.bestDays = Math.max(streak.bestDays || 0, streak.days);
  },
  record(result) {
    const d = this.data;
    d.results.unshift(result);
    d.results = d.results.slice(0, 100);

    const errors = result.keyErrors || {};
    Object.keys(errors).forEach((key) => {
      d.keyErrors[key] = (d.keyErrors[key] || 0) + errors[key];
    });

    if (result.type === "lesson") {
      const prev = d.lessons[result.refId] || {};
      d.lessons[result.refId] = {
        stars: Math.max(prev.stars || 0, result.stars || 0),
        bestSpeed: Math.max(prev.bestSpeed || 0, result.speed || 0),
        bestAccuracy: Math.max(prev.bestAccuracy || 0, result.accuracy || 0),
        attempts: (prev.attempts || 0) + 1,
        completedAt: result.date
      };
    } else if (result.type === "article") {
      const prev = d.articles[result.refId] || {};
      d.articles[result.refId] = {
        stars: Math.max(prev.stars || 0, result.stars || 0),
        bestSpeed: Math.max(prev.bestSpeed || 0, result.speed || 0),
        bestAccuracy: Math.max(prev.bestAccuracy || 0, result.accuracy || 0),
        attempts: (prev.attempts || 0) + 1,
        completedAt: result.date
      };
    }

    this.touchStreak();
    this.save();
  }
};

/* ---------------- 数据查询 ---------------- */
function getLesson(id) {
  return DATA.LESSONS.find((l) => l.id === id) || null;
}
function getCustomArticles() {
  return Array.isArray(DB.data.customArticles) ? DB.data.customArticles : [];
}
function getAllArticles() {
  return getCustomArticles().concat(DATA.ARTICLES);
}
function getArticle(id) {
  return getAllArticles().find((a) => a.id === id) || null;
}
function getUnit(id) {
  return DATA.UNITS.find((u) => u.id === id) || null;
}
function getUnitLessons(unitId) {
  return DATA.LESSONS.filter((l) => l.unit === unitId);
}
function getLessonRecord(id) {
  return DB.data.lessons[id] || null;
}
function getArticleRecord(id) {
  return DB.data.articles[id] || null;
}
function getCompletedLessonCount() {
  return DATA.LESSONS.filter((l) => {
    const r = DB.data.lessons[l.id];
    return r && r.stars > 0;
  }).length;
}
function getRecommendedLesson() {
  const next = DATA.LESSONS.find((l) => {
    const r = DB.data.lessons[l.id];
    return !r || !r.stars;
  });
  return next || DATA.LESSONS[DATA.LESSONS.length - 1];
}
function getNextLesson(id) {
  const i = DATA.LESSONS.findIndex((l) => l.id === id);
  if (i < 0 || i >= DATA.LESSONS.length - 1) return null;
  return DATA.LESSONS[i + 1];
}
function getCurrentStreak() {
  const s = DB.data.streak;
  if (!s || !s.lastDate) return 0;
  const diff = daysBetweenKeys(s.lastDate, dayKey());
  return diff >= 0 && diff <= 1 ? s.days || 0 : 0;
}
function getBestStreak() {
  return Math.max(DB.data.streak.bestDays || 0, getCurrentStreak());
}
function getTodayStats() {
  const today = dayKey();
  let chars = 0;
  let seconds = 0;
  let sessions = 0;
  DB.data.results.forEach((r) => {
    if (dayKey(r.date) === today) {
      chars += r.chars || 0;
      seconds += r.duration || 0;
      sessions += 1;
    }
  });
  return { chars, seconds, sessions };
}
function getTotals() {
  const results = DB.data.results;
  let chars = 0;
  let seconds = 0;
  let accuracySum = 0;
  let bestSpeed = 0;
  results.forEach((r) => {
    chars += r.chars || 0;
    seconds += r.duration || 0;
    accuracySum += r.accuracy || 0;
    bestSpeed = Math.max(bestSpeed, r.speed || 0);
  });
  const avgSpeed = seconds > 0 ? Math.round(chars / (seconds / 60)) : 0;
  const avgAccuracy = results.length ? Math.round((accuracySum / results.length) * 10) / 10 : 0;
  return {
    sessions: results.length,
    chars,
    seconds,
    avgSpeed,
    avgAccuracy,
    bestSpeed
  };
}
function getStarsFor(speed, accuracy, target) {
  if (accuracy >= 96 && speed >= target) return 3;
  if (accuracy >= 90 && speed >= Math.round(target * 0.6)) return 2;
  return 1;
}
function getWotd() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Math.floor((new Date() - start) / 86400000);
  return DATA.WOTD[diff % DATA.WOTD.length];
}
function getAchievementValue(a) {
  switch (a.kind) {
    case "results":
      return DB.data.results.length;
    case "lessons":
      return getCompletedLessonCount();
    case "speed":
      return Math.max(0, ...DB.data.results.map((r) => r.speed || 0));
    case "accuracy":
      return Math.max(0, ...DB.data.results.filter((r) => (r.chars || 0) >= 80).map((r) => r.accuracy || 0));
    case "games":
      return DB.data.game.plays || 0;
    case "gameScore":
      return DB.data.game.highScore || 0;
    case "alphabet":
      return DB.data.alphabetViewed.length || 0;
    case "streak":
      return getBestStreak();
    default:
      return 0;
  }
}
function isAchievementUnlocked(a) {
  if (a.kind === "accuracy") return getAchievementValue(a) >= a.need;
  return getAchievementValue(a) >= a.need;
}

/* ---------------- ЙЦУКЕН 键位映射 ---------------- */
const FINGER_META = {
  lp: { name: "左手小指", short: "左小指", color: "#f59e0b" },
  lr: { name: "左手无名指", short: "左无名", color: "#f97316" },
  lm: { name: "左手中指", short: "左中指", color: "#eab308" },
  li: { name: "左手食指", short: "左食指", color: "#22c55e" },
  ri: { name: "右手食指", short: "右食指", color: "#3b82f6" },
  rm: { name: "右手中指", short: "右中指", color: "#8b5cf6" },
  rr: { name: "右手无名指", short: "右无名", color: "#ec4899" },
  rp: { name: "右手小指", short: "右小指", color: "#ef4444" },
  thumb: { name: "拇指", short: "拇指", color: "#64748b" }
};

const KEY_ROWS = [
  [
    { code: "Backquote", en: "`", ru: ["ё", "Ё"], finger: "rp" },
    { code: "Digit1", en: "1", ru: ["1", "!"], finger: "lp" },
    { code: "Digit2", en: "2", ru: ["2", '"'], finger: "lr" },
    { code: "Digit3", en: "3", ru: ["3", "№"], finger: "lm" },
    { code: "Digit4", en: "4", ru: ["4", ";"], finger: "li" },
    { code: "Digit5", en: "5", ru: ["5", "%"], finger: "li" },
    { code: "Digit6", en: "6", ru: ["6", ":"], finger: "ri" },
    { code: "Digit7", en: "7", ru: ["7", "?"], finger: "ri" },
    { code: "Digit8", en: "8", ru: ["8", "*"], finger: "rm" },
    { code: "Digit9", en: "9", ru: ["9", "("], finger: "rr" },
    { code: "Digit0", en: "0", ru: ["0", ")"], finger: "rp" },
    { code: "Minus", en: "-", ru: ["-", "_"], finger: "rp" },
    { code: "Equal", en: "=", ru: ["=", "+"], finger: "rp" }
  ],
  [
    { code: "KeyQ", en: "Q", ru: ["й", "Й"], finger: "lp" },
    { code: "KeyW", en: "W", ru: ["ц", "Ц"], finger: "lr" },
    { code: "KeyE", en: "E", ru: ["у", "У"], finger: "lm" },
    { code: "KeyR", en: "R", ru: ["к", "К"], finger: "li" },
    { code: "KeyT", en: "T", ru: ["е", "Е"], finger: "li" },
    { code: "KeyY", en: "Y", ru: ["н", "Н"], finger: "ri" },
    { code: "KeyU", en: "U", ru: ["г", "Г"], finger: "ri" },
    { code: "KeyI", en: "I", ru: ["ш", "Ш"], finger: "rm" },
    { code: "KeyO", en: "O", ru: ["щ", "Щ"], finger: "rr" },
    { code: "KeyP", en: "P", ru: ["з", "З"], finger: "rp" },
    { code: "BracketLeft", en: "[", ru: ["х", "Х"], finger: "rp" },
    { code: "BracketRight", en: "]", ru: ["ъ", "Ъ"], finger: "rp" }
  ],
  [
    { code: "KeyA", en: "A", ru: ["ф", "Ф"], finger: "lp" },
    { code: "KeyS", en: "S", ru: ["ы", "Ы"], finger: "lr" },
    { code: "KeyD", en: "D", ru: ["в", "В"], finger: "lm" },
    { code: "KeyF", en: "F", ru: ["а", "А"], finger: "li" },
    { code: "KeyG", en: "G", ru: ["п", "П"], finger: "li" },
    { code: "KeyH", en: "H", ru: ["р", "Р"], finger: "ri" },
    { code: "KeyJ", en: "J", ru: ["о", "О"], finger: "ri" },
    { code: "KeyK", en: "K", ru: ["л", "Л"], finger: "rm" },
    { code: "KeyL", en: "L", ru: ["д", "Д"], finger: "rr" },
    { code: "Semicolon", en: ";", ru: ["ж", "Ж"], finger: "rp" },
    { code: "Quote", en: "'", ru: ["э", "Э"], finger: "rp" }
  ],
  [
    { code: "KeyZ", en: "Z", ru: ["я", "Я"], finger: "lp" },
    { code: "KeyX", en: "X", ru: ["ч", "Ч"], finger: "lr" },
    { code: "KeyC", en: "C", ru: ["с", "С"], finger: "lm" },
    { code: "KeyV", en: "V", ru: ["м", "М"], finger: "li" },
    { code: "KeyB", en: "B", ru: ["и", "И"], finger: "li" },
    { code: "KeyN", en: "N", ru: ["т", "Т"], finger: "ri" },
    { code: "KeyM", en: "M", ru: ["ь", "Ь"], finger: "ri" },
    { code: "Comma", en: ",", ru: ["б", "Б"], finger: "rm" },
    { code: "Period", en: ".", ru: ["ю", "Ю"], finger: "rr" },
    { code: "Slash", en: "/", ru: [".", ","], finger: "rp" }
  ]
];

const SPACE_KEY = { code: "Space", en: "Space", ru: [" ", " "], finger: "thumb" };
const ALL_KEYS = KEY_ROWS.flat().concat([SPACE_KEY]);
const CODE_TO_KEY = {};
const CHAR_INFO = {};

ALL_KEYS.forEach((key) => {
  CODE_TO_KEY[key.code] = key;
  const lower = key.ru[0];
  const upper = key.ru[1];
  CHAR_INFO[lower] = { ...key, char: lower, shift: false };
  if (upper !== lower) {
    CHAR_INFO[upper] = { ...key, char: upper, shift: true };
  }
});

const TYPEABLE = new Set(Object.keys(CHAR_INFO).concat([" "]));
const LETTERS_SET = new Set("абвгдеёжзийклмнопрстуфхцчшщъыьэюя");

function isTypeableChar(ch) {
  return TYPEABLE.has(ch);
}

function resolveChar(event, mode) {
  if (!event) return null;
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (event.code === "Space" || event.key === " ") return " ";

  if (mode === "direct") {
    if (typeof event.key === "string" && event.key.length === 1) return event.key;
    const directKey = CODE_TO_KEY[event.code];
    return directKey ? directKey.ru[0] : null;
  }

  const key = CODE_TO_KEY[event.code];
  if (key) {
    const isLetter = LETTERS_SET.has(key.ru[0]);
    let upper = event.shiftKey;
    if (isLetter && typeof event.getModifierState === "function" && event.getModifierState("CapsLock")) {
      upper = !upper;
    }
    return upper ? key.ru[1] : key.ru[0];
  }

  if (typeof event.key === "string" && /^[а-яё]$/i.test(event.key)) {
    return event.key;
  }
  return null;
}

function describeChar(ch) {
  if (ch === " ") {
    return {
      char: " ",
      keyLabel: "Space",
      finger: "拇指",
      fingerShort: "拇指",
      fingerColor: FINGER_META.thumb.color,
      shift: false,
      isSpace: true
    };
  }
  const info = CHAR_INFO[ch];
  if (!info) return null;
  const finger = FINGER_META[info.finger] || FINGER_META.rp;
  return {
    char: ch,
    keyLabel: info.en,
    code: info.code,
    finger: finger.name,
    fingerShort: finger.short,
    fingerColor: finger.color,
    shift: Boolean(info.shift),
    isSpace: false
  };
}

function letterKeyLabel(letter) {
  const info = CHAR_INFO[letter] || CHAR_INFO[letter.toLowerCase()];
  return info ? info.en : "—";
}

/* ---------------- 音效 ---------------- */
const Sound = {
  ctx: null,
  ensure() {
    if (!DB.data.settings.sound) return null;
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      if (!this.ctx) this.ctx = new Ctor();
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    } catch (err) {
      return null;
    }
  },
  tone(freq, delay, duration, type, volume) {
    const ctx = this.ensure();
    if (!ctx) return;
    try {
      const now = ctx.currentTime + (delay || 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(Math.max(0.0001, volume || 0.03), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (err) {
      /* ignore audio errors */
    }
  },
  play(name) {
    if (!DB.data.settings.sound) return;
    switch (name) {
      case "key":
        this.tone(760, 0, 0.035, "triangle", 0.022);
        break;
      case "space":
        this.tone(520, 0, 0.04, "triangle", 0.018);
        break;
      case "error":
        this.tone(150, 0, 0.14, "sawtooth", 0.045);
        this.tone(110, 0.03, 0.12, "square", 0.025);
        break;
      case "correct":
        this.tone(700, 0, 0.06, "sine", 0.03);
        this.tone(950, 0.05, 0.08, "sine", 0.025);
        break;
      case "finish":
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, i * 0.11, 0.28, "triangle", 0.04));
        break;
      case "click":
        this.tone(440, 0, 0.045, "sine", 0.025);
        break;
      case "gameover":
        [392, 330, 262].forEach((f, i) => this.tone(f, i * 0.13, 0.3, "sawtooth", 0.035));
        break;
      case "hit":
        this.tone(880, 0, 0.05, "square", 0.02);
        this.tone(1320, 0.04, 0.06, "sine", 0.02);
        break;
      default:
        break;
    }
  }
};

/* ---------------- 俄语发音 ---------------- */
let cachedVoices = [];
function refreshVoices() {
  if (!window.speechSynthesis) return;
  cachedVoices = window.speechSynthesis.getVoices() || [];
}
if (window.speechSynthesis) {
  refreshVoices();
  window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
}

function speak(text, rate) {
  if (!DB.data.settings.tts || !window.speechSynthesis) return false;
  try {
    const utter = new SpeechSynthesisUtterance(String(text));
    utter.lang = "ru-RU";
    utter.rate = rate || 0.82;
    utter.pitch = 1;
    const voice = cachedVoices.find((v) => /^ru/i.test(v.lang));
    if (voice) utter.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    return true;
  } catch (err) {
    return false;
  }
}

/* ---------------- 弹窗与提示 ---------------- */
let activeModal = null;

function closeModal() {
  if (activeModal) activeModal.close();
}

function openModal(html, opts) {
  const options = opts || {};
  closeModal();
  const root = $("#modalRoot");
  if (!root) return null;

  const layer = document.createElement("div");
  layer.className = "modal-layer";
  layer.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal ${options.className || ""}" role="dialog" aria-modal="true">
      <button class="modal-x" type="button" aria-label="关闭">${icon("x", "", 20)}</button>
      ${html}
    </div>`;
  root.appendChild(layer);
  document.body.classList.add("modal-open");

  const modalEl = $(".modal", layer);
  const closeBtn = $(".modal-x", layer);
  const backdrop = $(".modal-backdrop", layer);
  let closed = false;

  function onEsc(e) {
    if (e.key === "Escape" && options.closable !== false) {
      e.preventDefault();
      hide(true);
    }
  }

  function hide(notify) {
    if (closed) return;
    closed = true;
    layer.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    document.removeEventListener("keydown", onEsc, true);
    setTimeout(() => layer.remove(), 220);
    if (activeModal && activeModal.layer === layer) activeModal = null;
    if (typeof options.onAfterClose === "function") options.onAfterClose();
    if (notify && typeof options.onClose === "function") options.onClose();
  }

  if (options.closable === false) {
    closeBtn.style.display = "none";
  } else {
    closeBtn.addEventListener("click", () => hide(true));
    backdrop.addEventListener("click", () => hide(true));
  }
  document.addEventListener("keydown", onEsc, true);

  activeModal = { layer, el: modalEl, close: () => hide(false) };
  requestAnimationFrame(() => layer.classList.add("is-open"));
  return { el: modalEl, close: () => hide(false) };
}

function confirmModal(opts) {
  const options = opts || {};
  return new Promise((resolve) => {
    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const ref = openModal(
      `<div class="confirm-box">
        <div class="confirm-icon">${icon(options.icon || "info", "", 26)}</div>
        <h3>${escapeHtml(options.title || "确认操作")}</h3>
        <p>${escapeHtml(options.message || "")}</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" type="button" data-confirm="no">${escapeHtml(options.cancelText || "取消")}</button>
          <button class="btn ${options.danger ? "btn-danger" : "btn-primary"}" type="button" data-confirm="yes">${escapeHtml(options.confirmText || "确定")}</button>
        </div>
      </div>`,
      {
        className: "modal-sm",
        closable: true,
        onClose: () => done(false)
      }
    );
    if (!ref) {
      done(false);
      return;
    }
    $$("[data-confirm]", ref.el).forEach((btn) => {
      btn.addEventListener("click", () => {
        done(btn.getAttribute("data-confirm") === "yes");
        closeModal();
      });
    });
  });
}

function toast(message, type) {
  const root = $("#toastRoot");
  if (!root) return;
  const el = document.createElement("div");
  el.className = `toast ${type ? "toast-" + type : ""}`;
  el.innerHTML = `${icon(type === "error" ? "x" : type === "success" ? "check" : "info", "", 16)}<span>${escapeHtml(message)}</span>`;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 260);
  }, 2400);
}

/* ---------------- 成就渲染辅助 ---------------- */
function achievementData() {
  return DATA.ACHIEVEMENTS.map((a) => {
    const value = getAchievementValue(a);
    return {
      ...a,
      value,
      unlocked: value >= a.need,
      percent: clamp(Math.round((value / a.need) * 100), 0, 100)
    };
  });
}

/* ---------------- 键盘渲染 ---------------- */
function renderKeyboardHTML(opts) {
  const options = opts || {};
  const showFinger = options.finger !== false;
  const rows = KEY_ROWS.map((row, rowIndex) => {
    const keys = row.map((key) => {
      const finger = FINGER_META[key.finger];
      const isLetter = LETTERS_SET.has(key.ru[0]);
      const sub = isLetter ? key.en : key.ru[1] !== key.ru[0] ? key.ru[1] : key.en;
      return `<div class="kb-key${isLetter ? "" : " kb-key-punct"}" data-code="${key.code}" style="${showFinger ? "--finger:" + finger.color : ""}">
        <span class="kb-main">${escapeHtml(key.ru[0])}</span>
        <span class="kb-sub">${escapeHtml(sub)}</span>
        ${showFinger ? '<i class="kb-finger"></i>' : ""}
      </div>`;
    }).join("");
    return `<div class="kb-row kb-row-${rowIndex}">${keys}</div>`;
  }).join("");

  const space = `<div class="kb-row"><div class="kb-key kb-space" data-code="Space" style="--finger:${FINGER_META.thumb.color}"><span class="kb-main">пробел</span><span class="kb-sub">Space</span><i class="kb-finger"></i></div></div>`;

  return `<div class="keyboard" id="keyboard" aria-label="俄语ЙЦУКЕН屏幕键盘">${rows}${space}</div>`;
}

function highlightKeyboard(expectedChar, keyCode) {
  const board = $("#keyboard");
  if (!board) return;
  $$(".kb-key", board).forEach((el) => {
    el.classList.remove("is-next", "needs-shift");
    if (keyCode && el.getAttribute("data-code") === keyCode) {
      el.classList.add("is-pressed");
      setTimeout(() => el.classList.remove("is-pressed"), 110);
    }
  });
  if (!expectedChar) return;
  const info = describeChar(expectedChar);
  if (!info || !info.code) {
    if (info && info.isSpace) {
      const space = $('.kb-key[data-code="Space"]', board);
      if (space) space.classList.add("is-next");
    }
    return;
  }
  const keyEl = $(`.kb-key[data-code="${info.code}"]`, board);
  if (keyEl) {
    keyEl.classList.add("is-next");
    if (info.shift) keyEl.classList.add("needs-shift");
    const boardRect = board.getBoundingClientRect();
    const keyRect = keyEl.getBoundingClientRect();
    if (keyRect.left < boardRect.left || keyRect.right > boardRect.right) {
      board.scrollLeft += keyRect.left - boardRect.left - (boardRect.width - keyRect.width) / 2;
    }
  }
}

function setKeyboardVisible(visible) {
  const panel = $("#keyboardPanel");
  if (panel) panel.style.display = visible ? "" : "none";
}

/* ---------------- 其他 ---------------- */
function getTodayGoalPercent() {
  const goal = 300;
  const today = getTodayStats();
  return {
    chars: today.chars,
    goal,
    percent: clamp(Math.round((today.chars / goal) * 100), 0, 100),
    done: today.chars >= goal
  };
}

function getAvgSpeed() {
  return getTotals().avgSpeed;
}

function formatSpeed(n) {
  return Math.round(n || 0).toLocaleString("zh-CN");
}
