/* =========================================================
   俄语打字通 · 应用路由与页面渲染
   ========================================================= */
"use strict";

let alphabetFilter = "all";

const THEMES = {
  modern: {
    label: "现代蓝调",
    en: "MODERN ACADEMY",
    note: "深蓝渐变、柔和卡片与学院感排版"
  },
  constructivist: {
    label: "苏联构成主义",
    en: "CONSTRUCTIVISM · 1922",
    note: "纸张、红黑几何、粗体海报与硬边阴影"
  }
};

function updateThemeButton() {
  const btn = $("#themeBtn");
  const theme = DB.data.settings.theme === "constructivist" ? "constructivist" : "modern";
  if (btn) {
    btn.innerHTML = icon("palette", "", 18);
    btn.dataset.theme = theme;
    btn.setAttribute("aria-label", `当前风格：${THEMES[theme].label}，点击切换`);
    btn.setAttribute("title", `当前风格：${THEMES[theme].label} · 点击切换`);
  }
  $$(".theme-option").forEach((option) => {
    const active = option.getAttribute("data-theme-option") === theme;
    option.classList.toggle("is-active", active);
    option.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function applyTheme(theme) {
  const resolved = THEMES[theme] ? theme : "modern";
  document.documentElement.setAttribute("data-theme", resolved);
  updateThemeButton();
}

function setTheme(theme, options) {
  const resolved = THEMES[theme] ? theme : "modern";
  DB.setSetting("theme", resolved);
  applyTheme(resolved);
  if (!options || options.silent !== true) {
    toast(`已切换为「${THEMES[resolved].label}」`, "success");
  }
}

/* ---------------- 通用渲染辅助 ---------------- */
function setHTML(selector, html) {
  const el = $(selector);
  if (el) el.innerHTML = html;
  return el;
}

function showScreen(name) {
  $$(".screen").forEach((screen) => {
    screen.classList.toggle("is-active", screen.getAttribute("data-screen") === name);
  });
}

function setActiveNav(routeName) {
  $$("#mainNav a").forEach((a) => {
    const match = a.getAttribute("data-match");
    const active =
      match === routeName ||
      (routeName === "lesson" && match === "courses") ||
      (routeName === "article" && match === "articles");
    a.classList.toggle("is-active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

function updatePageTitle(name) {
  const titles = {
    home: "俄语打字通 1.1 · Русский Клавиатор",
    courses: "课程练习 · 俄语打字通 1.1",
    articles: "文章练习 · 俄语打字通 1.1",
    lesson: "课程练习 · 俄语打字通 1.1",
    article: "文章练习 · 俄语打字通 1.1",
    game: "单词雨 · 俄语打字通 1.1",
    stats: "学习统计 · 俄语打字通 1.1",
    alphabet: "字母表 · 俄语打字通 1.1"
  };
  document.title = titles[name] || titles.home;
}

function lessonStars(lessonId) {
  const record = getLessonRecord(lessonId);
  return record ? record.stars || 0 : 0;
}

function getUnitDone(unitId) {
  return getUnitLessons(unitId).filter((l) => {
    const r = DB.data.lessons[l.id];
    return r && r.stars > 0;
  }).length;
}

function getLessonCharCount(lesson) {
  return lesson.items.reduce((sum, item) => sum + Array.from(item.t).length, 0);
}

function getArticleCharCount(article) {
  return article.items.reduce((sum, item) => sum + Array.from(item.t).length, 0);
}

function focusPills(items) {
  return (items || []).map((f) => `<span class="pill">${escapeHtml(f)}</span>`).join("");
}

/* ---------------- 首页 ---------------- */
function renderHome() {
  const container = $("#screen-home");
  if (!container) return;

  const today = getTodayStats();
  const totals = getTotals();
  const goal = getTodayGoalPercent();
  const streak = getCurrentStreak();
  const completed = getCompletedLessonCount();
  const rec = getRecommendedLesson();
  const allDone = completed >= DATA.LESSONS.length;
  const wotd = getWotd();
  const recent = DB.data.results.slice(0, 4);
  const viewed = DB.data.alphabetViewed.length;
  const circumference = 2 * Math.PI * 66;
  const dashOffset = circumference * (1 - goal.percent / 100);

  const unitCards = DATA.UNITS.map((unit) => {
    const lessons = getUnitLessons(unit.id);
    const done = getUnitDone(unit.id);
    const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
    return `
      <a class="unit-card c-${unit.color}" href="#/courses">
        <div class="unit-top">
          <span class="unit-index">UNIT ${unit.index}</span>
          <span class="unit-count">${done}/${lessons.length} 课</span>
        </div>
        <h3>${escapeHtml(unit.title)}</h3>
        <div class="unit-ru">${escapeHtml(unit.ru)}</div>
        <div class="unit-desc">${escapeHtml(unit.desc)}</div>
        <div class="unit-progress">
          <div class="bar"><i style="width:${pct}%"></i></div>
          <span>${pct}%</span>
        </div>
      </a>`;
  }).join("");

  const recentHTML = recent.length
    ? `<div class="recent-list">${recent
        .map(
          (r) => `
        <div class="recent-item">
          <span class="recent-dot ${r.type === "article" ? "article" : ""}"></span>
          <div class="recent-copy">
            <b>${escapeHtml(r.title)}</b>
            <span>${r.type === "lesson" ? "课程练习" : "文章练习"} · ${formatDate(r.date)}</span>
          </div>
          <span class="recent-speed">${r.speed}<small> 字/分</small></span>
        </div>`
        )
        .join("")}</div>`
    : `<div class="empty-state">
        <span class="empty-icon">${icon("chart", "", 20)}</span>
        <b>还没有练习记录</b>
        <span>从第一节基准键开始，第一组数据就会出现在这里。</span>
      </div>`;

  container.innerHTML = `
    <section class="hero">
      <div class="hero-glow"></div>
      <div class="hero-copy">
        <span class="eyebrow">СЕГОДНЯ · 每日俄语</span>
        <h1>用指尖，敲开<br><em>俄语</em>的大门。<span class="ru">РУССКИЙ ЯЗЫК НА КОНЧИКАХ ПАЛЬЦЕВ</span></h1>
        <p>从 ЙЦУКЕН 基准键到普希金的诗句。二十节循序渐进的课程、真实文章与单词游戏，让双手先记住俄语，再让大脑爱上它。</p>
        <div class="hero-actions">
          <a class="btn btn-hero btn-lg" href="#/lesson/${rec.id}" data-nav>
            ${icon("play", "", 16)} ${allDone ? "复习" : "继续练习"} · ${escapeHtml(rec.title)}
          </a>
          <a class="btn btn-hero-ghost btn-lg" href="#/courses" data-nav>浏览全部课程</a>
        </div>
        <div class="hero-mini">
          <span>${icon("check", "", 13)} 无需切换系统键盘布局</span>
          <span>${icon("check", "", 13)} 支持俄语发音</span>
          <span>${icon("check", "", 13)} 进度自动保存</span>
        </div>
      </div>
      <div class="hero-panel">
        <span class="hero-float-key k1">Й</span>
        <span class="hero-float-key k2">Я</span>
        <span class="hero-float-key k3">Ё</span>
        <div class="goal-card">
          <div class="goal-top"><span>今日目标</span><b>${icon("target", "", 11)} 300 字符</b></div>
          <div class="goal-ring">
            <svg viewBox="0 0 160 160" aria-hidden="true">
              <circle class="ring-track" cx="80" cy="80" r="66"></circle>
              <circle class="ring-inner" cx="80" cy="80" r="55"></circle>
              <circle class="ring-value" cx="80" cy="80" r="66" stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"></circle>
            </svg>
            <div class="goal-center">
              <b>${today.chars}<small> 字符</small></b>
              <span>完成 ${goal.percent}%</span>
            </div>
          </div>
          <div class="goal-stats">
            <div><b>${today.sessions}</b><span>今日练习</span></div>
            <div><b>${streak}</b><span>连续天数</span></div>
            <div><b>${totals.avgSpeed}</b><span>平均速度</span></div>
          </div>
        </div>
      </div>
    </section>

    <section class="quick-grid">
      <a class="quick-card q-blue" href="#/courses" data-nav>
        <span class="quick-icon">${icon("book", "", 21)}</span>
        <span class="quick-copy"><b>课程练习</b><span>${completed} / ${DATA.LESSONS.length} 节已完成</span></span>
        <span class="quick-arrow">${icon("chevron-right", "", 17)}</span>
      </a>
      <a class="quick-card q-violet" href="#/articles" data-nav>
        <span class="quick-icon">${icon("file", "", 21)}</span>
        <span class="quick-copy"><b>文章练习</b><span>${getAllArticles().length} 篇俄语文章 · 支持自定义</span></span>
        <span class="quick-arrow">${icon("chevron-right", "", 17)}</span>
      </a>
      <a class="quick-card q-red" href="#/game" data-nav>
        <span class="quick-icon">${icon("gamepad", "", 21)}</span>
        <span class="quick-copy"><b>单词雨</b><span>最高分 ${DB.data.game.highScore || 0} · 边玩边记</span></span>
        <span class="quick-arrow">${icon("chevron-right", "", 17)}</span>
      </a>
      <a class="quick-card q-teal" href="#/alphabet" data-nav>
        <span class="quick-icon">${icon("type", "", 21)}</span>
        <span class="quick-copy"><b>字母表</b><span>${viewed} / 33 个字母已听</span></span>
        <span class="quick-arrow">${icon("chevron-right", "", 17)}</span>
      </a>
    </section>

    <div class="home-columns">
      <section class="panel home-main">
        <div class="section-head">
          <div>
            <span class="eyebrow">LEARNING PATH</span>
            <h2>学习路径 <span class="ru">ПУТЬ</span></h2>
          </div>
          <a class="section-link" href="#/courses" data-nav>全部课程 ${icon("chevron-right", "", 13)}</a>
        </div>
        <div class="unit-grid">${unitCards}</div>
      </section>

      <div class="home-side">
        <section class="wotd-card">
          <div class="wotd-head">
            <span class="eyebrow">СЛОВО ДНЯ · 每日一词</span>
            <button class="speak-btn" type="button" id="wotdSpeak" aria-label="朗读今日单词">${icon("speaker", "", 15)}</button>
          </div>
          <div class="wotd-word-row">
            <div>
              <div class="wotd-word" lang="ru">${escapeHtml(wotd.word)}</div>
              <div class="wotd-zh">${escapeHtml(wotd.zh)}</div>
            </div>
          </div>
          <div class="wotd-example" lang="ru">
            ${escapeHtml(wotd.example)}
            <small>${escapeHtml(wotd.exampleZh)}</small>
          </div>
        </section>

        <section class="panel recent-card">
          <div class="section-head" style="margin-bottom:7px">
            <div>
              <span class="eyebrow">RECENT</span>
              <h2 style="font-size:16px">最近练习</h2>
            </div>
            <a class="section-link" href="#/stats" data-nav>统计 ${icon("chevron-right", "", 12)}</a>
          </div>
          ${recentHTML}
        </section>
      </div>
    </div>`;

  const speakBtn = $("#wotdSpeak", container);
  if (speakBtn) {
    speakBtn.addEventListener("click", () => {
      if (!speak(`${wotd.word}. ${wotd.example}`)) toast("当前浏览器不支持语音朗读", "error");
    });
  }
}

/* ---------------- 课程 ---------------- */
function renderCourses() {
  const container = $("#screen-courses");
  if (!container) return;
  const completed = getCompletedLessonCount();
  const total = DATA.LESSONS.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const recommendedId = getRecommendedLesson().id;

  const sections = DATA.UNITS.map((unit) => {
    const lessons = getUnitLessons(unit.id);
    const done = getUnitDone(unit.id);
    const unitPct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
    const lessonCards = lessons
      .map((lesson) => {
        const record = getLessonRecord(lesson.id);
        const stars = record ? record.stars || 0 : 0;
        const complete = stars > 0;
        const recommended = lesson.id === recommendedId;
        return `
          <a class="lesson-card ${complete ? "is-complete" : ""} ${recommended ? "is-recommended" : ""}" href="#/lesson/${lesson.id}" data-nav>
            <div class="lesson-no">${complete ? icon("check", "", 14) : pad2(lesson.no)}</div>
            <div class="lesson-copy">
              <div class="lesson-title-row"><h4>${escapeHtml(lesson.title)}</h4></div>
              <div class="lesson-focus">${focusPills(lesson.focus)}</div>
              <div class="lesson-meta">${lesson.items.length} 组 · 目标 ${lesson.target} 字符/分</div>
            </div>
            <div class="lesson-side">
              ${starsHTML(stars)}
              <span class="lesson-best">${record ? `最佳 <b>${record.bestSpeed || 0}</b>` : "尚未练习"}</span>
            </div>
            <div class="lesson-go">${icon("chevron-right", "", 15)}</div>
          </a>`;
      })
      .join("");

    return `
      <section class="unit-section u-${unit.color}">
        <div class="unit-header">
          <div class="unit-badge">${unit.index}</div>
          <div class="unit-head-copy">
            <h2>${escapeHtml(unit.title)}<span>${escapeHtml(unit.ru)}</span></h2>
            <p>${escapeHtml(unit.desc)}</p>
          </div>
          <div class="unit-meta">
            <div class="unit-progress-mini"><div class="bar"><i style="width:${unitPct}%"></i></div></div>
            <span>${done}/${lessons.length} 课</span>
          </div>
        </div>
        <div class="lesson-list">${lessonCards}</div>
      </section>`;
  }).join("");

  container.innerHTML = `
    <div class="page-head">
      <div class="page-head-copy">
        <span class="eyebrow">КУРСЫ · 循序渐进</span>
        <h1>课程练习</h1>
        <p>先把八根手指安置在基准键，再逐排扩展，最后把键位变成单词、句子与诗句。每节都可以反复练习，刷新自己的速度纪录。</p>
      </div>
      <div class="page-head-side">
        <div class="progress-card">
          <div class="progress-top"><span>总进度</span><b>${completed} / ${total}</b></div>
          <div class="bar"><i style="width:${pct}%"></i></div>
          <div class="progress-top" style="margin:8px 0 0"><span>已完成 ${pct}%</span><span>推荐：${escapeHtml(getLesson(recommendedId).title)}</span></div>
        </div>
      </div>
    </div>
    ${sections}`;
}

/* ---------------- 文章 ---------------- */
function renderArticles() {
  const container = $("#screen-articles");
  if (!container) return;

  const articles = getAllArticles();
  const customIds = new Set(getCustomArticles().map((a) => a.id));
  const customCount = customIds.size;

  const cards = articles.map((article, index) => {
    const record = getArticleRecord(article.id);
    const chars = getArticleCharCount(article);
    const isCustom = article.custom === true || customIds.has(article.id);
    const featured = article.id === "a3";
    const builtinNo = DATA.ARTICLES.findIndex((a) => a.id === article.id) + 1;

    const top = isCustom
      ? `<div class="article-top">
           <span class="level-badge">${escapeHtml(article.level || "A2")}</span>
           <div class="custom-card-tools">
             <span class="article-custom-badge">我的文章</span>
             <button class="article-tool" type="button" data-edit-article="${escapeHtml(article.id)}" title="编辑这篇文章">${icon("edit", "", 13)}</button>
             <button class="article-tool is-danger" type="button" data-delete-article="${escapeHtml(article.id)}" title="删除这篇文章">${icon("trash", "", 13)}</button>
           </div>
         </div>`
      : `<div class="article-top">
           <span class="level-badge">${escapeHtml(article.level)}</span>
           <span class="article-index">${pad2(builtinNo)} / ${pad2(DATA.ARTICLES.length)}</span>
         </div>`;

    const start = isCustom
      ? `<a class="article-start" href="#/article/${article.id}" data-nav>开始阅读 ${icon("chevron-right", "", 13)}</a>`
      : `<span class="article-start">开始阅读 ${icon("chevron-right", "", 13)}</span>`;

    const inner = `
      ${top}
      <div class="article-title" lang="ru">${escapeHtml(article.title)}</div>
      <div class="article-title-zh">${escapeHtml(article.titleZh || "自定义文章")}</div>
      <p class="article-desc">${escapeHtml(article.desc || "我的俄语练习文章")}</p>
      <div class="article-meta">
        <span>${icon("file", "", 12)} ${article.items.length} 句</span>
        <span>${icon("type", "", 12)} ${chars} 字符</span>
        <span>${icon("target", "", 12)} 目标 ${article.target}</span>
      </div>
      <div class="article-foot">
        <span class="article-best">${record ? `最佳 <b>${record.bestSpeed || 0}</b> 字符/分` : "尚未练习"}</span>
        ${start}
      </div>`;

    if (isCustom) {
      return `<article class="article-card is-custom ${featured ? "is-featured" : ""}" data-custom-id="${escapeHtml(article.id)}">${inner}</article>`;
    }
    return `<a class="article-card ${featured ? "is-featured" : ""}" href="#/article/${article.id}" data-nav>${inner}</a>`;
  }).join("");

  const addCard = `
    <button class="add-article-card" type="button" data-add-article>
      <span class="add-article-plus">${icon("plus", "", 26)}</span>
      <b>添加自己的文章</b>
      <span>粘贴俄语文本，每行一句，生成可练习的文章</span>
    </button>`;

  container.innerHTML = `
    <div class="page-head">
      <div class="page-head-copy">
        <span class="eyebrow">ТЕКСТЫ · 在语境中练习</span>
        <h1>文章练习</h1>
        <p>从日常短文到普希金的诗句。现在也可以加入自己的俄语文章：每行一句，可选中文释义，保存后就能像内置文章一样练习和记录成绩。</p>
      </div>
      <div class="page-head-side article-page-side">
        <button class="btn btn-primary" type="button" data-add-article>${icon("plus", "", 15)} 添加文章</button>
        <div class="progress-card">
          <div class="progress-top"><span>文章库</span><b>${articles.length} 篇</b></div>
          <div class="progress-top" style="margin:4px 0 0"><span>内置 ${DATA.ARTICLES.length} 篇</span><span>我的 ${customCount} 篇</span></div>
          <div class="progress-top" style="margin:4px 0 0"><span>内置 A1–B1</span><span>自定义不限等级</span></div>
        </div>
      </div>
    </div>
    <div class="article-grid">${cards}${addCard}</div>`;

  container.querySelectorAll("[data-add-article]").forEach((btn) => {
    btn.addEventListener("click", () => openArticleEditor());
  });
  container.querySelectorAll(".article-card.is-custom").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button") || event.target.closest("a")) return;
      location.hash = `#/article/${card.getAttribute("data-custom-id")}`;
    });
  });
  container.querySelectorAll("[data-edit-article]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const article = getArticle(btn.getAttribute("data-edit-article"));
      if (article && article.custom) openArticleEditor(article);
    });
  });
  container.querySelectorAll("[data-delete-article]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-delete-article");
      const article = getArticle(id);
      if (!article) return;
      const ok = await confirmModal({
        title: "删除这篇文章？",
        message: `「${article.title}」将从文章库中删除，已有的历史成绩仍会保留在统计里。`,
        confirmText: "删除文章",
        cancelText: "保留",
        danger: true
      });
      if (!ok) return;
      DB.deleteCustomArticle(id);
      renderArticles();
      toast("文章已删除", "info");
    });
  });
}

function openArticleEditor(article) {
  const isEdit = Boolean(article && article.custom);
  const normalizeEditorLine = (line) =>
    line
      .replace(/\u00A0/g, " ")
      .replace(/[—–]/g, "-")
      .replace(/[«»“”„]/g, '"')
      .replace(/[’‘']/g, '"')
      .replace(/…/g, "...")
      .replace(/\t/g, " ")
      .trim();
  const source = article || {
    title: "",
    titleZh: "",
    level: "A2",
    target: 75,
    desc: "",
    items: []
  };
  const russianText = (source.items || []).map((item) => item.t).join("\n");
  const chineseText = (source.items || []).map((item) => item.zh || "").join("\n");
  const levels = ["A1", "A2", "B1", "B2", "C1"];
  const levelOptions = levels
    .map((level) => `<option value="${level}" ${source.level === level ? "selected" : ""}>${level}</option>`)
    .join("");

  const ref = openModal(
    `<div class="article-editor">
      <div class="editor-head">
        <span class="eyebrow">СВОЙ ТЕКСТ · 自定义文章</span>
        <h3>${isEdit ? "编辑文章" : "添加自己的文章"}</h3>
        <p class="modal-sub">俄语正文按行拆分，每一行是一组练习。中文释义可选，按相同行号对应。</p>
      </div>
      <div class="editor-grid">
        <label class="field">
          <span>俄语标题 <b>*</b></span>
          <input class="input" type="text" id="editorTitle" maxlength="80" value="${escapeHtml(source.title)}" placeholder="Мой русский текст">
        </label>
        <label class="field">
          <span>中文标题</span>
          <input class="input" type="text" id="editorTitleZh" maxlength="80" value="${escapeHtml(source.titleZh || "")}" placeholder="我的俄语文章">
        </label>
        <label class="field field-small">
          <span>等级</span>
          <select class="select" id="editorLevel">${levelOptions}</select>
        </label>
        <label class="field field-small">
          <span>目标速度</span>
          <input class="input" type="number" id="editorTarget" min="20" max="200" step="1" value="${source.target || 75}">
        </label>
      </div>
      <label class="field">
        <span>俄语正文 <b>*</b> <em>每行一句</em></span>
        <textarea class="input editor-textarea" id="editorText" rows="8" spellcheck="false" placeholder="Я читаю русскую книгу.&#10;Каждый день я учу новые слова.&#10;Вечером мы гуляем по городу.">${escapeHtml(russianText)}</textarea>
      </label>
      <div class="editor-meta">
        <span id="editorStats">0 行 · 0 字符</span>
        <button class="btn btn-ghost btn-sm" type="button" id="importTxt">${icon("upload", "", 13)} 导入 .txt</button>
        <input type="file" id="importFile" accept=".txt,text/plain" hidden>
      </div>
      <label class="field">
        <span>中文释义 <em>可选，每行对应一句</em></span>
        <textarea class="input editor-textarea editor-textarea-sm" id="editorZh" rows="4" placeholder="我在读一本俄语书。&#10;每天我都学新单词。&#10;晚上我们在城里散步。">${escapeHtml(chineseText)}</textarea>
      </label>
      <label class="field">
        <span>简介 <em>可选</em></span>
        <input class="input" type="text" id="editorDesc" maxlength="120" value="${escapeHtml(source.desc || "")}" placeholder="例如：我的第一篇俄语日记">
      </label>
      <div class="editor-error" id="editorError" hidden></div>
      <div class="modal-actions">
        <button class="btn btn-ghost" type="button" id="editorCancel">取消</button>
        <button class="btn btn-primary" type="button" id="editorSave">${isEdit ? "保存修改" : "保存文章"}</button>
      </div>
    </div>`,
    { className: "modal-article", closable: true }
  );
  if (!ref) return;

  const title = $("#editorTitle", ref.el);
  const titleZh = $("#editorTitleZh", ref.el);
  const level = $("#editorLevel", ref.el);
  const target = $("#editorTarget", ref.el);
  const text = $("#editorText", ref.el);
  const zh = $("#editorZh", ref.el);
  const desc = $("#editorDesc", ref.el);
  const error = $("#editorError", ref.el);
  const stats = $("#editorStats", ref.el);
  const importBtn = $("#importTxt", ref.el);
  const fileInput = $("#importFile", ref.el);

  const showError = (message) => {
    if (!error) return;
    error.hidden = false;
    error.textContent = message;
    error.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };
  const clearError = () => {
    if (error) error.hidden = true;
  };
  const readText = () => text.value.split(/\r?\n/).map(normalizeEditorLine).filter(Boolean);
  const refreshStats = () => {
    const lines = readText();
    const chars = lines.reduce((sum, line) => sum + Array.from(line).length, 0);
    if (stats) stats.textContent = `${lines.length} 行 · ${chars} 字符`;
  };

  text.addEventListener("input", () => {
    refreshStats();
    clearError();
  });
  if (importBtn && fileInput) {
    importBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      try {
        const buffer = await file.arrayBuffer();
        let content = new TextDecoder("utf-8").decode(buffer);
        content = content.replace(/^\uFEFF/, "").trim();
        text.value = content;
        refreshStats();
        clearError();
        toast("文本已导入，可继续编辑", "success");
      } catch (err) {
        showError("读取文件失败，请确认是 UTF-8 纯文本。");
      }
    });
  }

  refreshStats();

  const cancel = $("#editorCancel", ref.el);
  if (cancel) cancel.addEventListener("click", closeModal);

  const save = $("#editorSave", ref.el);
  if (save) {
    save.addEventListener("click", () => {
      const lines = readText();
      const titleValue = title.value.trim();
      if (!titleValue) {
        showError("请填写俄语标题。");
        title.focus();
        return;
      }
      if (!lines.length) {
        showError("请至少输入一行俄语正文。");
        text.focus();
        return;
      }
      for (let i = 0; i < lines.length; i++) {
        const bad = Array.from(lines[i]).find((ch) => !isTypeableChar(ch));
        if (bad) {
          showError(`第 ${i + 1} 行有无法输入的字符「${bad}」。请只使用俄语字母、空格和标点。`);
          return;
        }
      }

      const zhLines = zh.value.split(/\r?\n/).map((line) => line.trim());
      const items = lines.map((line, i) => {
        const translation = zhLines[i] || "";
        return translation ? { t: line, zh: translation } : { t: line };
      });
      const targetValue = clamp(parseInt(target.value, 10) || 75, 20, 200);
      const timestamp = new Date().toISOString();
      const saved = {
        id: isEdit ? source.id : `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        title: titleValue,
        titleZh: titleZh.value.trim() || "自定义文章",
        level: level.value || "A2",
        target: targetValue,
        desc: desc.value.trim() || `我的俄语练习文章 · ${lines.length} 句`,
        items,
        custom: true,
        createdAt: isEdit ? source.createdAt || timestamp : timestamp,
        updatedAt: timestamp
      };

      DB.saveCustomArticle(saved);
      closeModal();
      renderArticles();
      toast(isEdit ? "文章已更新" : "文章已加入文章库", "success");
    });
  }
}

/* ---------------- 练习入口 ---------------- */
function renderPractice(route) {
  const isLesson = route.name === "lesson";
  if (isLesson) {
    const lesson = getLesson(route.id);
    if (!lesson) {
      toast("没有找到这节课", "error");
      location.hash = "#/courses";
      return;
    }
    const unit = getUnit(lesson.unit);
    const next = getNextLesson(lesson.id);
    Practice.start({
      type: "lesson",
      refId: lesson.id,
      title: lesson.title,
      eyebrow: `课程 ${pad2(lesson.no)} · ${unit ? unit.title : ""}`,
      backHash: "#/courses",
      items: lesson.items,
      target: lesson.target,
      tip: lesson.tip,
      focus: lesson.focus,
      next: next ? { hash: `#/lesson/${next.id}`, label: "下一课" } : null
    });
  } else {
    const article = getArticle(route.id);
    if (!article) {
      toast("没有找到这篇文章", "error");
      location.hash = "#/articles";
      return;
    }
    const allArticles = getAllArticles();
    const idx = allArticles.findIndex((a) => a.id === article.id);
    const next = allArticles[idx + 1];
    Practice.start({
      type: "article",
      refId: article.id,
      title: article.title,
      eyebrow: `文章练习 · ${article.custom ? "自定义" : article.level} · ${article.titleZh || ""}`,
      backHash: "#/articles",
      items: article.items,
      target: article.target,
      tip: article.desc,
      focus: [article.level, `${article.items.length} 句`],
      next: next ? { hash: `#/article/${next.id}`, label: "下一篇" } : null
    });
  }
}

/* ---------------- 学习统计 ---------------- */
function chartSVG() {
  const results = DB.data.results.slice(0, 12).reverse();
  if (!results.length) {
    return `<div class="chart-empty">
      <span class="empty-icon">${icon("chart", "", 21)}</span>
      <b>完成一次练习后，这里会画出速度曲线</b>
      <span>建议先从前三节基准键课程开始。</span>
    </div>`;
  }

  const W = 640;
  const H = 232;
  const padL = 35;
  const padR = 14;
  const padT = 16;
  const padB = 28;
  const speeds = results.map((r) => r.speed || 0);
  const maxSpeed = Math.max(40, ...speeds);
  const yMax = Math.ceil(maxSpeed / 20) * 20;
  const xAt = (i) => (results.length === 1 ? W / 2 : padL + (i * (W - padL - padR)) / (results.length - 1));
  const yAt = (v) => padT + (1 - v / yMax) * (H - padT - padB);

  let grid = "";
  for (let i = 0; i <= 4; i++) {
    const value = (yMax / 4) * i;
    const y = yAt(value);
    grid += `<line class="chart-grid-line" x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"/>`;
    grid += `<text class="chart-axis-text" x="${padL - 8}" y="${y + 3}" text-anchor="end">${Math.round(value)}</text>`;
  }

  const points = results.map((r, i) => [xAt(i), yAt(r.speed || 0)]);
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${points[points.length - 1][0].toFixed(1)},${H - padB} L${points[0][0].toFixed(1)},${H - padB} Z`;

  const dots = results
    .map((r, i) => {
      const [x, y] = points[i];
      return `<g><title>${escapeHtml(r.title)} · ${r.speed} 字符/分 · ${r.accuracy}%</title>
        <circle class="chart-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.6"/></g>`;
    })
    .join("");

  const labelStep = Math.max(1, Math.ceil(results.length / 6));
  const xLabels = results
    .map((r, i) => {
      if (i % labelStep !== 0 && i !== results.length - 1) return "";
      return `<text class="chart-axis-text" x="${xAt(i).toFixed(1)}" y="${H - 8}" text-anchor="middle">${formatDateShort(r.date)}</text>`;
    })
    .join("");

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="最近练习速度趋势">
    <defs>
      <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${grid}
    <path class="chart-area" d="${area}"/>
    <path class="chart-line" d="${line}"/>
    ${dots}
    ${xLabels}
  </svg>`;
}

function heatmapHTML() {
  const rows = [
    ["й", "ц", "у", "к", "е", "н", "г", "ш", "щ", "з", "х", "ъ"],
    ["ф", "ы", "в", "а", "п", "р", "о", "л", "д", "ж", "э"],
    ["я", "ч", "с", "м", "и", "т", "ь", "б", "ю"]
  ];
  const counts = DB.data.keyErrors || {};
  const max = Math.max(1, ...rows.flat().map((ch) => counts[ch] || 0));
  const rowsHTML = rows
    .map((row, i) => {
      const keys = row
        .map((ch) => {
          const count = counts[ch] || 0;
          const ratio = count / max;
          const bg = count ? `background:rgba(229,72,77,${(0.08 + ratio * 0.62).toFixed(3)});` : "";
          return `<div class="heat-key ${count ? "has-errors" : ""}" style="${bg}" title="${ch}：${count} 次错误">
            ${ch}<small>${count || ""}</small>
          </div>`;
        })
        .join("");
      return `<div class="heat-row" style="padding-left:${i * 13}px">${keys}</div>`;
    })
    .join("");

  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const topHTML = top.length
    ? top.map(([ch, count]) => `<span class="error-chip">${escapeHtml(ch)} <b>${count}</b></span>`).join("")
    : `<span class="error-empty">还没有错误数据，保持下去。</span>`;

  return `<div class="heatmap">${rowsHTML}</div>
    <div class="heat-legend">
      <span>少</span>
      <span class="heat-scale">${[0.08, 0.22, 0.36, 0.5, 0.66]
        .map((a) => `<i style="background:rgba(229,72,77,${a})"></i>`)
        .join("")}</span>
      <span>多</span>
    </div>
    <div class="top-errors">${topHTML}</div>`;
}

function renderStats() {
  const container = $("#screen-stats");
  if (!container) return;
  const totals = getTotals();
  const today = getTodayStats();
  const streak = getCurrentStreak();
  const completed = getCompletedLessonCount();
  const achievements = achievementData();
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const records = DB.data.results.slice(0, 10);

  const statCards = [
    { label: "练习次数", value: totals.sessions, unit: "次", icon: "chart" },
    { label: "累计字符", value: totals.chars.toLocaleString("zh-CN"), unit: "字符", icon: "type" },
    { label: "平均速度", value: totals.avgSpeed, unit: "字符/分", icon: "zap" },
    { label: "平均正确率", value: totals.avgAccuracy, unit: "%", icon: "target" },
    { label: "最高速度", value: totals.bestSpeed, unit: "字符/分", icon: "trophy" },
    { label: "连续练习", value: streak, unit: "天", icon: "flame" }
  ]
    .map(
      (card) => `
      <div class="stat-card">
        <div class="stat-icon">${icon(card.icon, "", 15)}</div>
        <div class="stat-label">${card.label}</div>
        <div class="stat-value"><b>${card.value}</b><span>${card.unit}</span></div>
      </div>`
    )
    .join("");

  const recordRows = records.length
    ? records
        .map(
          (r) => `
        <tr>
          <td><span class="record-type ${r.type === "article" ? "article" : ""}">${r.type === "article" ? "文章" : "课程"}</span></td>
          <td class="record-name">${escapeHtml(r.title)}</td>
          <td class="record-speed">${r.speed}</td>
          <td>${r.accuracy.toFixed(1)}%</td>
          <td>${formatClock(r.duration)}</td>
          <td>${formatDate(r.date)}</td>
          <td>${starsHTML(r.stars || 0)}</td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="7"><div class="records-empty">还没有练习记录。完成第一节课程后，这里会记录你的速度、正确率与星级。</div></td></tr>`;

  const achHTML = achievements
    .map(
      (a) => `
      <div class="achievement ${a.unlocked ? "is-unlocked" : ""}" title="${escapeHtml(a.desc)}">
        <span class="ach-icon">${icon(a.icon, "", 17)}</span>
        <div class="ach-copy">
          <b>${escapeHtml(a.title)}</b>
          <span>${escapeHtml(a.desc)}</span>
        </div>
        <span class="ach-value">${a.unlocked ? "已解锁" : `${Math.min(a.value, a.need)}/${a.need}`}</span>
        <div class="ach-progress"><i style="width:${a.unlocked ? 100 : a.percent}%"></i></div>
      </div>`
    )
    .join("");

  container.innerHTML = `
    <div class="page-head">
      <div class="page-head-copy">
        <span class="eyebrow">ПРОГРЕСС · 数据会说话</span>
        <h1>学习统计</h1>
        <p>每一次练习都会被记录在本机。观察速度曲线、易错键与成就，找到最适合自己的节奏。</p>
      </div>
      <div class="page-head-side">
        <div class="progress-card">
          <div class="progress-top"><span>今日已打</span><b>${today.chars} 字符</b></div>
          <div class="bar"><i style="width:${Math.min(100, Math.round((today.chars / 300) * 100))}%"></i></div>
          <div class="progress-top" style="margin:8px 0 0"><span>课程完成</span><span>${completed}/${DATA.LESSONS.length} · 游戏最高 ${DB.data.game.highScore || 0}</span></div>
        </div>
      </div>
    </div>

    <div class="stat-cards">${statCards}</div>

    <div class="stats-grid">
      <section class="panel chart-panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">${icon("chart", "", 15)} 速度趋势</div>
            <div class="panel-sub">最近 ${Math.min(12, DB.data.results.length)} 次练习 · 字符/分</div>
          </div>
          <span class="chip">最高 ${totals.bestSpeed}</span>
        </div>
        <div class="chart-wrap">${chartSVG()}</div>
      </section>

      <section class="panel heat-panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">${icon("keyboard", "", 15)} 易错键热力图</div>
            <div class="panel-sub">字母被按错的累计次数 · 越红越需要复习</div>
          </div>
        </div>
        ${heatmapHTML()}
      </section>
    </div>

    <section class="panel records-panel">
      <div class="panel-head">
        <div>
          <div class="panel-title">${icon("clock", "", 15)} 最近练习</div>
          <div class="panel-sub">所有成绩保存在浏览器本地 · 共 ${DB.data.results.length} 条</div>
        </div>
        <span class="chip">正确率优先，再追速度</span>
      </div>
      <div class="table-wrap">
        <table class="records-table">
          <thead><tr><th>类型</th><th>内容</th><th>速度</th><th>正确率</th><th>用时</th><th>日期</th><th>星级</th></tr></thead>
          <tbody>${recordRows}</tbody>
        </table>
      </div>
    </section>

    <section class="panel achievement-panel">
      <div class="panel-head">
        <div>
          <div class="panel-title">${icon("award", "", 15)} 成就</div>
          <div class="panel-sub">已解锁 ${unlocked} / ${achievements.length} · 慢慢来，比较快</div>
        </div>
        <span class="chip">${Math.round((unlocked / achievements.length) * 100)}%</span>
      </div>
      <div class="achievement-grid">${achHTML}</div>
    </section>`;
}

/* ---------------- 字母表 ---------------- */
function renderAlphabet() {
  const container = $("#screen-alphabet");
  if (!container) return;
  const viewed = new Set(DB.data.alphabetViewed);
  const counts = {
    all: DATA.ALPHABET.length,
    vowel: DATA.ALPHABET.filter((a) => a.type === "vowel").length,
    consonant: DATA.ALPHABET.filter((a) => a.type === "consonant").length,
    sign: DATA.ALPHABET.filter((a) => a.type === "sign").length
  };
  const list = DATA.ALPHABET.filter((a) => alphabetFilter === "all" || a.type === alphabetFilter);
  const typeLabels = { vowel: "元音", consonant: "辅音", sign: "符号" };
  const viewedCount = DB.data.alphabetViewed.length;
  const pct = Math.round((viewedCount / 33) * 100);

  const cards = list
    .map((a) => {
      const seen = viewed.has(a.lower);
      return `
      <div class="letter-card ${seen ? "is-viewed" : ""}" data-letter="${a.lower}" tabindex="0" role="button" aria-label="字母 ${a.upper}，点击朗读">
        <div class="letter-head">
          <div class="letter-big">${a.upper}<small>${a.lower}</small></div>
          <span class="letter-type ${a.type}">${typeLabels[a.type]}</span>
          <button class="letter-speak" type="button" data-speak="${a.lower}" aria-label="朗读 ${a.example}" title="朗读例词 ${a.example}">${icon("speaker", "", 12)}</button>
        </div>
        <div class="letter-name">名称 <b>«${escapeHtml(a.name)}»</b> ${escapeHtml(a.ipa)}</div>
        <div class="letter-example">${escapeHtml(a.example)}<span>${escapeHtml(a.exampleZh)}</span></div>
        <div class="letter-key">按键 <kbd>${escapeHtml(letterKeyLabel(a.lower))}</kbd><span>· ${escapeHtml(describeChar(a.lower).fingerShort)}</span></div>
        ${seen ? `<span class="letter-viewed">${icon("check", "", 9)} 已听</span>` : ""}
      </div>`;
    })
    .join("");

  const filters = [
    { id: "all", label: "全部" },
    { id: "vowel", label: "元音" },
    { id: "consonant", label: "辅音" },
    { id: "sign", label: "符号" }
  ]
    .map(
      (f) => `<button class="chip ${alphabetFilter === f.id ? "is-active" : ""}" type="button" data-filter="${f.id}">
        ${f.label} <span style="opacity:.6;margin-left:3px">${counts[f.id]}</span>
      </button>`
    )
    .join("");

  container.innerHTML = `
    <div class="page-head">
      <div class="page-head-copy">
        <span class="eyebrow">АЛФАВИТ · 33 个字母</span>
        <h1>俄语字母表</h1>
        <p>俄语使用西里尔字母，共 33 个：10 个元音、21 个辅音和 2 个符号。点击卡片听名称，点击喇叭听例词。</p>
      </div>
      <div class="page-head-side">
        <div class="progress-card">
          <div class="progress-top"><span>已听发音</span><b id="alphaCount">${viewedCount} / 33</b></div>
          <div class="bar"><i id="alphaBar" style="width:${pct}%"></i></div>
          <div class="progress-top" style="margin:8px 0 0"><span>ЙЦУКЕН 布局</span><span>Q→Й · F→А · J→О</span></div>
        </div>
      </div>
    </div>

    <div class="alphabet-toolbar">
      <div class="filter-row" id="alphabetFilters">${filters}</div>
      <div class="alpha-progress">
        <span>学习进度</span>
        <div class="bar"><i id="alphaBarInline" style="width:${pct}%"></i></div>
        <b>${pct}%</b>
      </div>
    </div>

    <div class="alphabet-grid" id="alphabetGrid">${cards}</div>

    <div class="alphabet-note">
      ${icon("info", "", 18)}
      <div><b>不会俄语键盘？</b> 本软件会自动把你按下的 QWERTY 键映射为 ЙЦУКЕН 布局：<b>Q→Й、W→Ц、E→У、R→К、T→Е、Y→Н、F→А、J→О、Z→Я</b>。打开任意练习直接按英文键即可，无需切换系统输入法。大写和上档标点按住 Shift，例如 <b>Shift+7 = ?</b>、<b>/ = .</b>、<b>Shift+/ = ,</b>。</div>
    </div>`;

  const grid = $("#alphabetGrid", container);
  if (grid) {
    grid.addEventListener("click", (e) => {
      const speakBtn = e.target.closest("[data-speak]");
      if (speakBtn) {
        e.stopPropagation();
        const letter = DATA.ALPHABET.find((a) => a.lower === speakBtn.getAttribute("data-speak"));
        if (!letter) return;
        markLetterViewed(letter);
        if (!speak(`${letter.name}. ${letter.example}`)) toast("当前浏览器不支持语音朗读", "error");
        return;
      }
      const card = e.target.closest(".letter-card");
      if (!card) return;
      const letter = DATA.ALPHABET.find((a) => a.lower === card.getAttribute("data-letter"));
      if (!letter) return;
      markLetterViewed(letter);
      if (!speak(letter.name)) toast("当前浏览器不支持语音朗读", "error");
    });

    grid.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (e.target.closest(".letter-speak")) return;
      const card = e.target.closest(".letter-card");
      if (!card) return;
      e.preventDefault();
      card.click();
    });
  }

  $$("#alphabetFilters [data-filter]", container).forEach((btn) => {
    btn.addEventListener("click", () => {
      alphabetFilter = btn.getAttribute("data-filter");
      const scrollY = window.scrollY;
      renderAlphabet();
      window.scrollTo(0, scrollY);
    });
  });
}

function markLetterViewed(letter) {
  const list = DB.data.alphabetViewed;
  if (!list.includes(letter.lower)) {
    list.push(letter.lower);
    DB.save();
    const card = $(`.letter-card[data-letter="${letter.lower}"]`);
    if (card) {
      card.classList.add("is-viewed");
      if (!card.querySelector(".letter-viewed")) {
        card.insertAdjacentHTML("beforeend", `<span class="letter-viewed">${icon("check", "", 9)} 已听</span>`);
      }
    }
    const count = DB.data.alphabetViewed.length;
    const pct = Math.round((count / 33) * 100);
    const countEl = $("#alphaCount");
    if (countEl) countEl.textContent = `${count} / 33`;
    ["#alphaBar", "#alphaBarInline"].forEach((sel) => {
      const el = $(sel);
      if (el) el.style.width = `${pct}%`;
    });
    if (count === 33) toast("字母启蒙达成：33 个字母全部听过！", "success");
  }
}

/* ---------------- 设置 ---------------- */
function updateSoundButton() {
  const btn = $("#soundBtn");
  if (!btn) return;
  const on = DB.data.settings.sound;
  btn.innerHTML = icon(on ? "volume" : "volume-off", "", 18);
  btn.classList.toggle("is-off", !on);
  btn.setAttribute("aria-label", on ? "关闭音效" : "开启音效");
  btn.setAttribute("title", on ? "关闭音效" : "开启音效");
  btn.setAttribute("aria-pressed", on ? "true" : "false");
}

function applySettings() {
  document.documentElement.style.setProperty("--type-scale", DB.data.settings.fontScale || 1);
  applyTheme(DB.data.settings.theme);
  updateSoundButton();
}

function openSettings() {
  const s = DB.data.settings;
  let resetArmed = false;
  let resetTimer = null;

  const practiceRunning = Practice.active && Practice.started && !Practice.paused && !Practice.finished;
  if (practiceRunning) Practice.pauseSilently();
  const gameRunning = Game.isPlaying() && !Game.paused;
  if (gameRunning) {
    Game.paused = true;
    if (Game.raf) {
      cancelAnimationFrame(Game.raf);
      Game.raf = null;
    }
  }
  const resumeAfterSettings = () => {
    if (practiceRunning && Practice.active && !Practice.finished) Practice.resumeSilently();
    if (gameRunning && Game.active && Game.playing && !Game.over) {
      Game.paused = false;
      Game.lastTs = 0;
      Game.spawnAcc = 0;
      Game.raf = requestAnimationFrame((ts) => Game.loop(ts));
    }
  };

  const ref = openModal(
    `<h3>设置</h3>
     <p class="modal-sub">练习体验会保存在本机，下次打开仍然有效。</p>
     <div class="settings-section">
       <div class="settings-label">界面风格</div>
       <div class="theme-picker">
         <button class="theme-option ${s.theme !== "constructivist" ? "is-active" : ""}" type="button" data-theme-option="modern" aria-pressed="${s.theme !== "constructivist"}">
           <span class="theme-thumb theme-thumb-modern"><i></i><i></i><i></i></span>
           <span class="theme-option-copy"><b>现代蓝调</b><em>MODERN ACADEMY</em></span>
         </button>
         <button class="theme-option ${s.theme === "constructivist" ? "is-active" : ""}" type="button" data-theme-option="constructivist" aria-pressed="${s.theme === "constructivist"}">
           <span class="theme-thumb theme-thumb-constructivist"><i></i><i></i><i></i></span>
           <span class="theme-option-copy"><b>苏联构成主义</b><em>CONSTRUCTIVISM 1922</em></span>
         </button>
       </div>
       <div class="theme-note">${s.theme === "constructivist" ? THEMES.constructivist.note : THEMES.modern.note}</div>
     </div>
     <div class="settings-section">
       <div class="settings-label">练习体验</div>
       <div class="setting-row">
         <div class="setting-copy"><b>按键音效</b><span>击键与报错时的轻提示音</span></div>
         <label class="switch"><input type="checkbox" id="setSound" ${s.sound ? "checked" : ""}><i></i></label>
       </div>
       <div class="setting-row">
         <div class="setting-copy"><b>俄语发音</b><span>朗读字母、单词与句子（需要系统俄语语音包）</span></div>
         <label class="switch"><input type="checkbox" id="setTts" ${s.tts ? "checked" : ""}><i></i></label>
       </div>
       <div class="setting-row">
         <div class="setting-copy"><b>显示屏幕键盘</b><span>在打字卡下方显示 ЙЦУКЕН 键位与指法提示</span></div>
         <label class="switch"><input type="checkbox" id="setKeyboard" ${s.keyboard ? "checked" : ""}><i></i></label>
       </div>
     </div>
     <div class="settings-section">
       <div class="settings-label">输入方式</div>
       <div class="setting-row">
         <div class="setting-copy"><b>键位映射</b><span>推荐保持“自动映射”，无需安装俄语键盘</span></div>
         <select class="select" id="setInput">
           <option value="layout" ${s.inputMode === "layout" ? "selected" : ""}>自动映射 QWERTY → ЙЦУКЕН</option>
           <option value="direct" ${s.inputMode === "direct" ? "selected" : ""}>直接输入（系统已切俄语）</option>
         </select>
       </div>
       <div class="setting-row">
         <div class="setting-copy"><b>练习字号</b><span>只影响打字区域的俄语文本大小</span></div>
         <input class="range" type="range" id="setFont" min="0.85" max="1.3" step="0.05" value="${s.fontScale || 1}">
       </div>
     </div>
     <div class="settings-actions">
       <button class="btn btn-danger-ghost btn-sm" type="button" id="resetData">${icon("trash", "", 13)} 清空学习数据</button>
       <button class="btn btn-primary btn-sm" type="button" id="saveSettings">完成</button>
     </div>
     <div class="storage-note">${icon("info", "", 13)} 所有进度仅保存在当前浏览器的 localStorage 中，不会上传到任何服务器。清空浏览器数据会同时删除学习记录。</div>`,
    { className: "modal-sm", closable: true, onAfterClose: resumeAfterSettings }
  );
  if (!ref) {
    resumeAfterSettings();
    return;
  }

  const sound = $("#setSound", ref.el);
  if (sound) {
    sound.addEventListener("change", () => {
      DB.setSetting("sound", sound.checked);
      updateSoundButton();
      if (sound.checked) Sound.play("click");
    });
  }

  $$(".theme-option", ref.el).forEach((option) => {
    option.addEventListener("click", () => {
      const theme = option.getAttribute("data-theme-option");
      setTheme(theme, { silent: true });
      const note = $(".theme-note", ref.el);
      if (note) note.textContent = THEMES[theme] ? THEMES[theme].note : "";
    });
  });

  const tts = $("#setTts", ref.el);
  if (tts) {
    tts.addEventListener("change", () => {
      DB.setSetting("tts", tts.checked);
    });
  }

  const keyboard = $("#setKeyboard", ref.el);
  if (keyboard) {
    keyboard.addEventListener("change", () => {
      DB.setSetting("keyboard", keyboard.checked);
      if (Practice.active) setKeyboardVisible(keyboard.checked);
    });
  }

  const inputMode = $("#setInput", ref.el);
  if (inputMode) {
    inputMode.addEventListener("change", () => {
      DB.setSetting("inputMode", inputMode.value);
    });
  }

  const font = $("#setFont", ref.el);
  if (font) {
    font.addEventListener("input", () => {
      const scale = parseFloat(font.value) || 1;
      DB.setSetting("fontScale", scale);
      document.documentElement.style.setProperty("--type-scale", scale);
    });
  }

  const save = $("#saveSettings", ref.el);
  if (save) {
    save.addEventListener("click", () => {
      closeModal();
      toast("设置已保存", "success");
    });
  }

  const reset = $("#resetData", ref.el);
  if (reset) {
    reset.addEventListener("click", () => {
      if (!resetArmed) {
        resetArmed = true;
        reset.classList.remove("btn-danger-ghost");
        reset.classList.add("btn-danger");
        reset.innerHTML = `${icon("trash", "", 13)} 再点一次确认清空`;
        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          resetArmed = false;
          reset.classList.add("btn-danger-ghost");
          reset.classList.remove("btn-danger");
          reset.innerHTML = `${icon("trash", "", 13)} 清空学习数据`;
        }, 4000);
        return;
      }
      if (resetTimer) clearTimeout(resetTimer);
      DB.reset();
      DB.save();
      closeModal();
      applySettings();
      Router.handle();
      toast("学习数据已清空，重新开始吧", "success");
    });
  }
}

/* ---------------- 路由 ---------------- */
const Router = {
  routes: ["home", "courses", "articles", "lesson", "article", "game", "stats", "alphabet"],

  parse() {
    const raw = (location.hash || "").replace(/^#\/?/, "");
    const parts = raw.split("/").filter(Boolean);
    return { name: parts[0] || "home", id: parts[1] || null };
  },

  async canLeave() {
    const hasPractice = Practice.isDirty();
    const hasGame = Game.isPlaying();
    if (!hasPractice && !hasGame) return true;

    const practiceRunning =
      hasPractice && Practice.started && !Practice.paused && !Practice.finished;
    const gameRunning = hasGame && Game.playing && !Game.paused && !Game.over;

    if (practiceRunning) Practice.pauseSilently();
    if (gameRunning) {
      Game.paused = true;
      if (Game.raf) {
        cancelAnimationFrame(Game.raf);
        Game.raf = null;
      }
    }

    let ok = false;
    try {
      ok = await confirmModal({
        title: hasPractice ? "离开本次练习？" : "离开游戏？",
        message: hasPractice
          ? "当前练习还没有完成，离开后本次进度不会保存。"
          : "本局游戏尚未结束，离开后不会记录本局成绩。",
        confirmText: hasPractice ? "离开练习" : "结束并离开",
        cancelText: hasPractice ? "继续练习" : "继续游戏",
        danger: true
      });
    } finally {
      if (!ok) {
        if (practiceRunning) Practice.resumeSilently();
        if (gameRunning && Game.active && Game.playing) {
          Game.paused = false;
          Game.lastTs = 0;
          Game.spawnAcc = 0;
          Game.raf = requestAnimationFrame((ts) => Game.loop(ts));
        }
      }
    }
    return ok;
  },

  handle() {
    const route = this.parse();
    if (!this.routes.includes(route.name)) {
      location.hash = "#/home";
      return;
    }

    closeModal();
    Practice.destroy();
    Game.destroy();

    updatePageTitle(route.name);
    setActiveNav(route.name);

    if (route.name === "home") {
      showScreen("home");
      renderHome();
    } else if (route.name === "courses") {
      showScreen("courses");
      renderCourses();
    } else if (route.name === "articles") {
      showScreen("articles");
      renderArticles();
    } else if (route.name === "stats") {
      showScreen("stats");
      renderStats();
    } else if (route.name === "alphabet") {
      showScreen("alphabet");
      renderAlphabet();
    } else if (route.name === "game") {
      showScreen("game");
      Game.mount();
    } else {
      showScreen("practice");
      renderPractice(route);
    }

    window.scrollTo({ top: 0, behavior: "auto" });
  }
};

/* ---------------- 事件绑定与启动 ---------------- */
function bindGlobalEvents() {
  const soundBtn = $("#soundBtn");
  if (soundBtn) {
    soundBtn.addEventListener("click", () => {
      const next = !DB.data.settings.sound;
      DB.setSetting("sound", next);
      updateSoundButton();
      if (next) {
        Sound.play("click");
        toast("音效已开启", "success");
      } else {
        toast("音效已关闭", "info");
      }
    });
  }

  const settingsBtn = $("#settingsBtn");
  if (settingsBtn) {
    settingsBtn.innerHTML = icon("settings", "", 18);
    settingsBtn.addEventListener("click", () => openSettings());
  }

  const themeBtn = $("#themeBtn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = DB.data.settings.theme === "constructivist" ? "modern" : "constructivist";
      setTheme(next);
    });
  }

  let navLock = false;
  document.addEventListener("click", async (e) => {
    const anchor = e.target.closest("a[href]");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || !href.startsWith("#/")) return;
    if (anchor.hasAttribute("download")) return;

    e.preventDefault();
    if (href === location.hash) return;
    if (navLock) return;
    navLock = true;
    try {
      const ok = await Router.canLeave();
      if (ok) location.hash = href;
    } finally {
      navLock = false;
    }
  });

  window.addEventListener("hashchange", () => Router.handle());
}

function initApp() {
  applySettings();
  bindGlobalEvents();
  Router.handle();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
