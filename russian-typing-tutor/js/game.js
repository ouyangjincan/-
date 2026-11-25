/* =========================================================
   俄语打字通 · 单词雨小游戏
   ========================================================= */
"use strict";

const Game = {
  active: false,
  playing: false,
  paused: false,
  over: true,
  difficulty: "normal",
  score: 0,
  lives: 3,
  combo: 0,
  maxCombo: 0,
  level: 1,
  words: [],
  target: null,
  destroyed: 0,
  correctKeys: 0,
  errors: 0,
  spawnAcc: 0,
  lastTs: 0,
  raf: null,
  config: null,
  wordPool: [],

  DIFFS: {
    easy: { label: "轻松", fall: 14, spawn: 2.7, maxWords: 6 },
    normal: { label: "标准", fall: 11, spawn: 2.2, maxWords: 7 },
    hard: { label: "挑战", fall: 8.5, spawn: 1.75, maxWords: 8 }
  },

  /* ---------------- 挂载 ---------------- */
  mount() {
    this.destroy();
    this.active = true;
    this.playing = false;
    this.paused = false;
    this.over = true;
    this.words = [];
    this.target = null;
    this.score = 0;
    this.lives = 3;
    this.combo = 0;
    this.level = 1;
    this.destroyed = 0;
    this.correctKeys = 0;
    this.errors = 0;

    const container = $("#screen-game");
    if (!container) return;

    container.innerHTML = `
      <div class="game-wrap">
        <div class="game-top">
          <a class="back-btn" href="#/home" data-nav>${icon("arrow-left", "", 16)}<span>返回</span></a>
          <div class="game-title">
            <h1>单词雨 <span style="font-family:var(--font-serif);font-size:14px;color:#8fa5c1;font-weight:400;font-style:italic">Словопад</span></h1>
            <p>在俄语单词落地之前，把它完整打出来。</p>
          </div>
          <div class="game-high">最高分 <b id="gameHigh">${DB.data.game.highScore || 0}</b></div>
          <button class="btn btn-ghost btn-sm" type="button" id="gamePauseBtn" disabled>${icon("pause", "", 14)} 暂停</button>
        </div>

        <div class="game-shell">
          <div class="game-hud">
            <div class="hud-item">分数 <b id="hudScore">0</b></div>
            <div class="hud-item combo">连击 <b id="hudCombo">0</b></div>
            <div class="hud-item">生命 <span class="hud-lives" id="hudLives"></span></div>
            <div class="hud-item level">等级 <b id="hudLevel">1</b></div>
          </div>

          <div class="game-arena" id="gameArena">
            <div class="arena-glow"></div>

            <div class="game-start" id="gameStart">
              <div class="game-panel">
                <span class="eyebrow">МИНИ-ИГРА · 打字小游戏</span>
                <h2>单词雨 <span>Словопад</span></h2>
                <p>俄语单词会从夜空落下。打出完整单词即可击碎它；让单词落到底部，就会失去一颗生命。</p>
                <div class="game-how">
                  <div><b>01 · 锁定</b><span>输入单词的首字母，自动锁定最靠下的目标。</span></div>
                  <div><b>02 · 击碎</b><span>连续打对后续字母，拼完整个单词。</span></div>
                  <div><b>03 · 连击</b><span>连续击碎会累积连击，获得更高分数。</span></div>
                </div>
                <div class="seg" id="diffSeg">
                  <button type="button" data-diff="easy" class="${this.difficulty === "easy" ? "is-active" : ""}">轻松 · 14 秒</button>
                  <button type="button" data-diff="normal" class="${this.difficulty === "normal" ? "is-active" : ""}">标准 · 11 秒</button>
                  <button type="button" data-diff="hard" class="${this.difficulty === "hard" ? "is-active" : ""}">挑战 · 8.5 秒</button>
                </div>
                <button class="btn btn-primary btn-lg" type="button" id="gameStartBtn">${icon("play", "", 16)} 开始游戏</button>
                <div class="game-tip">无需切换系统布局 · 直接按 QWERTY 键即可输入俄语 · Esc 暂停</div>
              </div>
            </div>

            <div class="game-start hidden" id="gamePause">
              <div class="game-panel">
                <span class="eyebrow">ПАУЗА</span>
                <h2>游戏暂停</h2>
                <p>单词们也在等你。继续游戏，或者带着当前分数离开。</p>
                <div class="game-over-score" style="margin:12px 0 2px"><b id="pauseScore">0</b><span>当前得分</span></div>
                <div class="game-over-actions" style="margin-top:16px">
                  <button class="btn btn-ghost" type="button" id="pauseQuit">退出</button>
                  <button class="btn btn-primary" type="button" id="pauseResumeBtn">继续游戏</button>
                </div>
              </div>
            </div>

            <div class="game-over hidden" id="gameOver">
              <div class="game-panel">
                <span class="eyebrow">ИГРА ОКОНЧЕНА</span>
                <h2>夜雨停了</h2>
                <p>这一局结束了。记住刚才的节奏，再来一次。</p>
                <div class="game-over-score"><b id="overScore">0</b><span>本局得分</span></div>
                <div class="game-result-grid">
                  <div><b id="overWords">0</b><span>击碎单词</span></div>
                  <div><b id="overCombo">0</b><span>最高连击</span></div>
                  <div><b id="overAcc">0%</b><span>输入正确率</span></div>
                </div>
                <div class="game-over-actions">
                  <button class="btn btn-ghost" type="button" id="overHome">返回首页</button>
                  <button class="btn btn-primary" type="button" id="overAgain">${icon("restart", "", 15)} 再来一局</button>
                </div>
                <div class="game-tip" id="overRecord"></div>
              </div>
            </div>

            <div class="game-input" id="gameInput">
              <span class="placeholder">输入单词首字母，锁定目标</span>
            </div>
          </div>
        </div>

        <div class="game-foot">
          <span>${icon("keyboard", "", 13)} 直接敲 QWERTY 键输入俄语 · <kbd>Backspace</kbd> 取消锁定 · <kbd>Esc</kbd> 暂停</span>
          <span>词义显示在单词下方，边玩边记。</span>
        </div>
      </div>`;

    this._keyHandler = (e) => this.handleKey(e);
    window.addEventListener("keydown", this._keyHandler, true);

    const startBtn = $("#gameStartBtn");
    if (startBtn) startBtn.addEventListener("click", () => this.start());

    const pauseBtn = $("#gamePauseBtn");
    if (pauseBtn) pauseBtn.addEventListener("click", () => this.togglePause());

    $$("#diffSeg button").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.difficulty = btn.getAttribute("data-diff");
        $$("#diffSeg button").forEach((b) => b.classList.toggle("is-active", b === btn));
        Sound.play("click");
      });
    });

    const pauseResume = $("#pauseResumeBtn");
    if (pauseResume) pauseResume.addEventListener("click", () => this.togglePause());

    const pauseQuit = $("#pauseQuit");
    if (pauseQuit) pauseQuit.addEventListener("click", () => {
      this.stop();
      location.hash = "#/home";
    });

    const overHome = $("#overHome");
    if (overHome) overHome.addEventListener("click", () => {
      this.stop();
      location.hash = "#/home";
    });

    const overAgain = $("#overAgain");
    if (overAgain) overAgain.addEventListener("click", () => this.start());

    this.updateHud();
    this.updateInput();
  },

  destroy() {
    this.active = false;
    this.playing = false;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
    if (this._keyHandler) {
      window.removeEventListener("keydown", this._keyHandler, true);
      this._keyHandler = null;
    }
    this.words.forEach((w) => {
      if (w.el && w.el.parentNode) w.el.remove();
    });
    this.words = [];
    this.target = null;
  },

  stop() {
    this.playing = false;
    this.over = true;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
    this.setPauseButton(false);
  },

  isPlaying() {
    return this.active && this.playing && !this.over;
  },

  /* ---------------- 开始与结束 ---------------- */
  start() {
    this.config = this.DIFFS[this.difficulty] || this.DIFFS.normal;
    this.playing = true;
    this.paused = false;
    this.over = false;
    this.score = 0;
    this.lives = 3;
    this.combo = 0;
    this.maxCombo = 0;
    this.level = 1;
    this.destroyed = 0;
    this.correctKeys = 0;
    this.errors = 0;
    this.spawnAcc = 0;
    this.lastTs = 0;
    this.target = null;
    this.words.forEach((w) => w.el && w.el.remove());
    this.words = [];
    this.wordPool = shuffled(DATA.GAME_WORDS);

    const startEl = $("#gameStart");
    if (startEl) startEl.classList.add("hidden");
    const pauseEl = $("#gamePause");
    if (pauseEl) pauseEl.classList.add("hidden");
    const overEl = $("#gameOver");
    if (overEl) overEl.classList.add("hidden");
    this.setPauseButton(true);
    this.updateHud();
    this.updateInput();
    this.spawnAcc = this.config.spawn * 0.5;

    if (this.raf) cancelAnimationFrame(this.raf);
    this.spawn();
    this.raf = requestAnimationFrame((ts) => this.loop(ts));
  },

  end() {
    if (this.over) return;
    this.playing = false;
    this.over = true;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
    this.setPauseButton(false);
    Sound.play("gameover");

    const g = DB.data.game;
    const isRecord = this.score > (g.highScore || 0);
    g.highScore = Math.max(g.highScore || 0, this.score);
    g.plays = (g.plays || 0) + 1;
    g.bestCombo = Math.max(g.bestCombo || 0, this.maxCombo);
    g.totalWords = (g.totalWords || 0) + this.destroyed;
    DB.save();

    const total = this.correctKeys + this.errors;
    const accuracy = total ? Math.round((this.correctKeys / total) * 100) : 100;
    const scoreEl = $("#overScore");
    if (scoreEl) scoreEl.textContent = this.score;
    const wordsEl = $("#overWords");
    if (wordsEl) wordsEl.textContent = this.destroyed;
    const comboEl = $("#overCombo");
    if (comboEl) comboEl.textContent = this.maxCombo;
    const accEl = $("#overAcc");
    if (accEl) accEl.textContent = `${accuracy}%`;
    const recordEl = $("#overRecord");
    if (recordEl) {
      recordEl.textContent = isRecord
        ? "新纪录！你刷新了自己的最高分。"
        : `最高分 ${DB.data.game.highScore} · 再试一次，也许就破了。`;
    }
    const highEl = $("#gameHigh");
    if (highEl) highEl.textContent = DB.data.game.highScore;
    const overEl = $("#gameOver");
    if (overEl) overEl.classList.remove("hidden");
    this.target = null;
    this.updateInput();
  },

  setPauseButton(enabled) {
    const btn = $("#gamePauseBtn");
    if (!btn) return;
    btn.disabled = !enabled;
    btn.innerHTML = `${icon("pause", "", 14)} ${this.paused ? "继续" : "暂停"}`;
  },

  togglePause() {
    if (!this.playing || this.over) return;
    this.paused = !this.paused;
    const overlay = $("#gamePause");
    const pauseScore = $("#pauseScore");
    if (this.paused) {
      if (this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = null;
      }
      if (overlay) overlay.classList.remove("hidden");
      if (pauseScore) pauseScore.textContent = this.score;
      this.setPauseButton(true);
    } else {
      if (overlay) overlay.classList.add("hidden");
      this.lastTs = 0;
      this.spawnAcc = 0;
      this.raf = requestAnimationFrame((ts) => this.loop(ts));
      this.setPauseButton(true);
    }
  },

  /* ---------------- 主循环 ---------------- */
  loop(ts) {
    if (!this.playing || this.paused || this.over) return;
    if (!this.lastTs) this.lastTs = ts;
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
    this.lastTs = ts;

    const interval = Math.max(0.9, this.config.spawn * Math.pow(0.95, this.level - 1));
    const maxWords = Math.min(10, this.config.maxWords + Math.floor(this.level / 3));
    this.spawnAcc += dt;
    if (this.spawnAcc >= interval && this.words.length < maxWords) {
      this.spawn();
      this.spawnAcc = 0;
    }

    const arena = $("#gameArena");
    if (!arena) return;
    const height = arena.clientHeight;
    const threshold = height - 62;

    this.words.forEach((w) => {
      if (w.dead) return;
      w.y += w.speed * dt * (1 + (this.level - 1) * 0.05);
      w.el.style.transform = `translate(${w.x}px, ${w.y}px)`;
      if (!w.isDanger && w.y > height - 175) {
        w.isDanger = true;
        w.el.classList.add("is-danger");
      }
      if (w.y > threshold) {
        this.miss(w);
      }
    });

    this.words = this.words.filter((w) => !w.dead);
    this.raf = requestAnimationFrame((t) => this.loop(t));
  },

  spawn() {
    const arena = $("#gameArena");
    if (!arena) return;
    const pool = this.wordPool.length ? this.wordPool : DATA.GAME_WORDS;
    const activeWords = new Set(this.words.map((w) => w.word));
    let data = null;
    for (let i = 0; i < 18; i++) {
      const candidate = pool[Math.floor(Math.random() * pool.length)];
      if (!activeWords.has(candidate.w)) {
        data = candidate;
        break;
      }
    }
    if (!data) data = randomItem(DATA.GAME_WORDS);

    const el = document.createElement("div");
    el.className = "falling-word";
    el.innerHTML = `<div class="fw-ru" lang="ru">${escapeHtml(data.w)}</div><div class="fw-zh">${escapeHtml(data.zh)}</div>`;
    el.style.transform = "translate(-200px, -80px)";
    arena.appendChild(el);

    const arenaWidth = arena.clientWidth;
    const arenaHeight = arena.clientHeight;
    const wordWidth = el.offsetWidth || 100;
    let x = 10 + Math.random() * Math.max(10, arenaWidth - wordWidth - 20);
    for (let attempt = 0; attempt < 7; attempt++) {
      const conflict = this.words.some((w) => !w.dead && w.y < 70 && Math.abs(w.x - x) < 105);
      if (!conflict) break;
      x = 10 + Math.random() * Math.max(10, arenaWidth - wordWidth - 20);
    }

    const duration = this.config.fall * (1 + Math.max(0, data.w.length - 4) * 0.055) * (0.92 + Math.random() * 0.16);
    const speed = arenaHeight / duration;

    const word = {
      word: data.w,
      zh: data.zh,
      el,
      x,
      y: -60,
      speed,
      progress: 0,
      dead: false,
      isDanger: false
    };
    this.words.push(word);
    el.style.transform = `translate(${x}px, ${word.y}px)`;
    el.addEventListener("animationend", () => el.classList.remove("is-error"));
  },

  /* ---------------- 输入 ---------------- */
  handleKey(e) {
    if (!this.active) return;
    if (e.key === "Escape") {
      if (this.playing && !this.over) {
        e.preventDefault();
        this.togglePause();
      }
      return;
    }
    if (this.over) {
      if (e.key === "Enter") {
        e.preventDefault();
        this.start();
      }
      return;
    }
    if (!this.playing || this.paused) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.repeat) {
      e.preventDefault();
      return;
    }
    if (e.code === "Backspace") {
      e.preventDefault();
      this.clearTarget();
      return;
    }
    if (e.code === "Tab") return;

    const ch = resolveChar(e, DB.data.settings.inputMode || "layout");
    if (ch === null) return;
    e.preventDefault();
    if (!/^[а-яё]$/i.test(ch)) return;
    this.processLetter(ch.toLowerCase());
  },

  processLetter(ch) {
    if (this.target && !this.target.dead) {
      const w = this.target;
      const chars = Array.from(w.word);
      const expected = chars[w.progress];
      if (ch === expected) {
        w.progress += 1;
        this.correctKeys += 1;
        Sound.play("key");
        this.renderWord(w);
        this.updateInput();
        if (w.progress >= chars.length) this.destroyWord(w);
      } else {
        this.errors += 1;
        this.combo = 0;
        Sound.play("error");
        this.flashError(w.el);
        const input = $("#gameInput");
        if (input) {
          input.classList.add("is-error");
          setTimeout(() => input.classList.remove("is-error"), 260);
        }
        this.updateHud();
      }
      return;
    }

    const candidates = this.words.filter((w) => !w.dead && Array.from(w.word)[0] === ch);
    if (!candidates.length) {
      this.errors += 1;
      this.combo = 0;
      Sound.play("error");
      const arena = $("#gameArena");
      if (arena) {
        arena.classList.remove("arena-shake");
        void arena.offsetWidth;
        arena.classList.add("arena-shake");
        setTimeout(() => arena.classList.remove("arena-shake"), 320);
      }
      this.updateHud();
      return;
    }

    candidates.sort((a, b) => b.y - a.y);
    const target = candidates[0];
    target.progress = 1;
    this.target = target;
    this.correctKeys += 1;
    target.el.classList.add("is-target");
    Sound.play("key");
    this.renderWord(target);
    this.updateInput();
    if (target.progress >= Array.from(target.word).length) this.destroyWord(target);
  },

  clearTarget() {
    if (!this.target) return;
    this.target.progress = 0;
    this.target.el.classList.remove("is-target");
    this.renderWord(this.target);
    this.target = null;
    this.updateInput();
    Sound.play("click");
  },

  renderWord(w) {
    if (!w || !w.el) return;
    const ru = $(".fw-ru", w.el);
    if (!ru) return;
    const chars = Array.from(w.word);
    ru.innerHTML = chars
      .map((ch, i) => (i < w.progress ? `<span class="done">${escapeHtml(ch)}</span>` : escapeHtml(ch)))
      .join("");
  },

  updateInput() {
    const input = $("#gameInput");
    if (!input) return;
    if (!this.target) {
      input.innerHTML = `<span class="placeholder">${this.playing && !this.over ? "输入单词首字母，锁定目标" : "输入单词首字母，锁定目标"}</span>`;
      return;
    }
    const chars = Array.from(this.target.word);
    const done = chars.slice(0, this.target.progress).join("");
    const rest = chars.slice(this.target.progress).join("");
    input.innerHTML = `<span class="typed">${escapeHtml(done)}</span><span class="rest">${escapeHtml(rest)}</span>`;
  },

  /* ---------------- 命中与失误 ---------------- */
  destroyWord(w) {
    if (!w || w.dead) return;
    w.dead = true;
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const multiplier = 1 + Math.min(this.combo, 20) * 0.05;
    const gained = Math.round(Array.from(w.word).length * 10 * multiplier);
    this.score += gained;
    this.destroyed += 1;

    const rect = w.el.getBoundingClientRect();
    const arena = $("#gameArena");
    const arenaRect = arena ? arena.getBoundingClientRect() : { left: 0, top: 0 };
    const px = rect.left - arenaRect.left + rect.width / 2;
    const py = rect.top - arenaRect.top + rect.height / 2;

    this.showScorePop(`+${gained}`, px, py);
    this.burst(px, py);
    Sound.play("hit");
    if (this.target === w) this.target = null;
    if (w.el && w.el.parentNode) w.el.remove();
    this.updateInput();
    this.updateHud();

    if (this.destroyed % 6 === 0) {
      this.level += 1;
      this.showScorePop(`Уровень ${this.level}`, null, 90);
      Sound.play("correct");
      this.updateHud();
    }
  },

  miss(w) {
    if (!w || w.dead) return;
    w.dead = true;
    if (w.el && w.el.parentNode) w.el.remove();
    if (this.target === w) this.target = null;
    this.lives -= 1;
    this.combo = 0;
    Sound.play("error");
    const arena = $("#gameArena");
    if (arena) {
      arena.classList.remove("arena-shake");
      void arena.offsetWidth;
      arena.classList.add("arena-shake");
      setTimeout(() => arena.classList.remove("arena-shake"), 320);
    }
    this.updateHud();
    this.updateInput();
    if (this.lives <= 0) this.end();
  },

  showScorePop(text, px, py) {
    const arena = $("#gameArena");
    if (!arena) return;
    const el = document.createElement("span");
    el.className = "score-pop";
    el.textContent = text;
    const x = px == null ? arena.clientWidth / 2 : px;
    const y = py == null ? 100 : py;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = "translate(-50%, -50%)";
    arena.appendChild(el);
    setTimeout(() => el.remove(), 800);
  },

  burst(px, py) {
    const arena = $("#gameArena");
    if (!arena) return;
    const colors = ["#6cb6ff", "#ffd479", "#6ee7a8", "#ffffff", "#b79cff"];
    for (let i = 0; i < 7; i++) {
      const el = document.createElement("i");
      el.className = "burst";
      const angle = (Math.PI * 2 * i) / 7 + Math.random() * 0.4;
      const dist = 26 + Math.random() * 34;
      el.style.left = `${px}px`;
      el.style.top = `${py}px`;
      el.style.setProperty("--bx", `${Math.cos(angle) * dist}px`);
      el.style.setProperty("--by", `${Math.sin(angle) * dist}px`);
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      arena.appendChild(el);
      setTimeout(() => el.remove(), 600);
    }
  },

  flashError(el) {
    if (!el) return;
    el.classList.remove("is-error");
    void el.offsetWidth;
    el.classList.add("is-error");
    setTimeout(() => el.classList.remove("is-error"), 280);
  },

  updateHud() {
    const score = $("#hudScore");
    if (score) score.textContent = this.score;
    const combo = $("#hudCombo");
    if (combo) combo.textContent = this.combo;
    const level = $("#hudLevel");
    if (level) level.textContent = this.level;
    const lives = $("#hudLives");
    if (lives) {
      lives.innerHTML = [1, 2, 3]
        .map((i) => `<i class="${i <= this.lives ? "" : "is-lost"}"></i>`)
        .join("");
    }
    const pauseScore = $("#pauseScore");
    if (pauseScore) pauseScore.textContent = this.score;
  }
};
