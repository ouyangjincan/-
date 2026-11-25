/* =========================================================
   俄语打字通 · 打字练习引擎
   ========================================================= */
"use strict";

const Practice = {
  active: false,
  finished: false,
  dirty: false,
  paused: false,
  locked: false,
  cfg: null,
  items: [],
  idx: 0,
  charIdx: 0,
  correct: 0,
  errors: 0,
  errorMap: {},
  started: false,
  startedAt: 0,
  pausedTotal: 0,
  pauseStart: 0,
  finishedAt: 0,
  timer: null,
  advanceTimer: null,
  totalChars: 0,
  lastKeyLabel: "",

  /* ---------------- 生命周期 ---------------- */
  start(config) {
    this.destroy();
    this.cfg = config;
    this.items = (config.items || []).map((it) =>
      typeof it === "string" ? { t: it } : { t: it.t, zh: it.zh }
    );
    this.totalChars = this.items.reduce((sum, it) => sum + Array.from(it.t).length, 0);
    this.idx = 0;
    this.charIdx = 0;
    this.correct = 0;
    this.errors = 0;
    this.errorMap = {};
    this.started = false;
    this.startedAt = 0;
    this.pausedTotal = 0;
    this.pauseStart = 0;
    this.finishedAt = 0;
    this.finished = false;
    this.paused = false;
    this.locked = false;
    this.dirty = false;
    this.active = true;
    this.lastKeyLabel = "";

    this.renderShell();
    this.bind();
    this.renderAll();
    this.startTimer();

    if (!DB.data.settings.keyboard) setKeyboardVisible(false);
    const container = $("#screen-practice");
    if (container) {
      container.querySelectorAll("a[data-nav]").forEach((a) => a.setAttribute("data-nav", "1"));
    }
  },

  destroy() {
    this.active = false;
    this.dirty = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.advanceTimer) {
      clearTimeout(this.advanceTimer);
      this.advanceTimer = null;
    }
    if (this._keyHandler) {
      window.removeEventListener("keydown", this._keyHandler, true);
      this._keyHandler = null;
    }
    if (this._visHandler) {
      document.removeEventListener("visibilitychange", this._visHandler);
      this._visHandler = null;
    }
  },

  isDirty() {
    return this.active && this.dirty && !this.finished;
  },

  /* ---------------- 页面结构 ---------------- */
  renderShell() {
    const cfg = this.cfg;
    const container = $("#screen-practice");
    if (!container) return;

    const isLesson = cfg.type === "lesson";
    const focus = (cfg.focus || []).map((f) => `<span class="pill">${escapeHtml(f)}</span>`).join("");
    const legend = DATA.FINGER_LEGEND.map((f) => {
      const meta = FINGER_META[f.id];
      return `<span><i style="background:${meta.color}"></i>${f.label}</span>`;
    }).join("");

    container.innerHTML = `
      <div class="practice-wrap">
        <div class="practice-top">
          <a class="back-btn" href="${escapeHtml(cfg.backHash || (isLesson ? "#/courses" : "#/articles"))}" data-nav>
            ${icon("arrow-left", "", 16)}<span>返回</span>
          </a>
          <div class="practice-title">
            <span class="eyebrow">${escapeHtml(cfg.eyebrow || (isLesson ? "УРОК" : "ТЕКСТ"))}</span>
            <h1>${escapeHtml(cfg.title)}</h1>
          </div>
          <div class="practice-top-actions">
            <button class="btn btn-ghost btn-sm" type="button" id="ttsBtn" title="朗读当前内容">
              ${icon("speaker", "", 15)}<span>朗读</span>
            </button>
            <button class="btn btn-ghost btn-sm" type="button" id="pauseBtn" title="暂停练习">
              ${icon("pause", "", 15)}<span>暂停</span>
            </button>
          </div>
        </div>

        <div class="practice-grid">
          <div class="practice-main">
            <div class="typing-card" id="typingCard">
              <div class="type-head">
                <span class="type-counter" id="typeCounter">第 1 / ${this.items.length} 组</span>
                <div class="type-progress"><i id="typeProgress"></i></div>
                <span class="type-percent" id="typePercent">0%</span>
              </div>
              <div class="type-window">
                <div class="type-prev" id="typePrev"></div>
                <div class="type-line" id="typeLine" lang="ru"></div>
                <div class="type-next" id="typeNext"></div>
              </div>
              <div class="type-translation" id="typeTranslation"></div>
              <div class="type-feedback" id="typeFeedback"></div>
              <div class="type-foot">
                <span>首次击键开始计时 · 打错不前进，直接重打</span>
                <span>标点：<kbd>,</kbd> = Shift+/ · <kbd>.</kbd> = / · <kbd>?</kbd> = Shift+7</span>
              </div>
            </div>

            <div class="keyboard-panel" id="keyboardPanel">
              <div class="kb-head">
                <span class="kb-title">${icon("keyboard", "", 15)} ЙЦУКЕН 屏幕键盘 <span style="color:#aebcd0;font-weight:400">· 无需切换系统布局</span></span>
                <div class="finger-legend">${legend}</div>
              </div>
              ${renderKeyboardHTML()}
              <div class="kb-foot">
                <span>直接按 QWERTY 键即可输入俄语字母；大写和上档标点按住 <kbd>Shift</kbd>。</span>
                <span>${focus || "彩色短线表示手指分工"}</span>
              </div>
            </div>
          </div>

          <aside class="practice-side">
            <div class="speed-card">
              <div class="speed-label">
                <span>打字速度</span>
                <span class="accuracy-badge" id="statAcc">正确率 100%</span>
              </div>
              <div class="speed-value"><b id="statSpeed">0</b><span>字符 / 分</span></div>
            </div>

            <div class="side-stats">
              <div class="side-stat"><span>用时</span><b id="statTime">00:00</b></div>
              <div class="side-stat"><span>错误</span><b id="statErrors">0</b></div>
              <div class="side-stat"><span>已打字符</span><b id="statChars">0</b></div>
              <div class="side-stat"><span>目标速度</span><b id="statTarget">${cfg.target || 60}</b></div>
            </div>

            <div class="hint-card">
              <div class="hint-title"><span>下一个键</span><span>${escapeHtml(cfg.type === "article" ? "阅读输入" : "指法提示")}</span></div>
              <div class="hint-body">
                <div class="hint-char" id="hintChar">а</div>
                <div class="hint-info">
                  <div class="hint-key-row">按键 <kbd id="hintKey">F</kbd><span id="shiftHint" class="shift-hint"></span></div>
                  <div class="hint-finger" id="hintFinger"><i></i><span>左手食指</span></div>
                </div>
              </div>
              <div class="hint-note" id="hintNote">击键后手指回到基准键位，眼睛看屏幕。</div>
            </div>

            <div class="target-card">
              <div class="target-top"><span>三星目标</span><b>${cfg.target || 60} 字符/分</b></div>
              <div class="target-rows">
                <div class="target-row">${starsHTML(3)}<span>正确率 ≥ 96%</span></div>
                <div class="target-row">${starsHTML(2)}<span>正确率 ≥ 90%</span></div>
                <div class="target-row">${starsHTML(1)}<span>完成练习</span></div>
              </div>
            </div>

            <div class="side-actions">
              <button class="btn btn-ghost" type="button" id="restartBtn">${icon("restart", "", 14)} 重开</button>
              <button class="btn btn-ghost" type="button" id="exitBtn">${icon("x", "", 14)} 退出</button>
            </div>
          </aside>
        </div>
      </div>`;
  },

  bind() {
    this._keyHandler = (e) => this.handleKey(e);
    window.addEventListener("keydown", this._keyHandler, true);

    this._visHandler = () => {
      if (document.hidden && this.started && !this.finished && !this.paused) this.pause();
    };
    document.addEventListener("visibilitychange", this._visHandler);

    const container = $("#screen-practice");
    if (!container) return;

    const pauseBtn = $("#pauseBtn", container);
    if (pauseBtn) pauseBtn.addEventListener("click", () => this.pause());

    const ttsBtn = $("#ttsBtn", container);
    if (ttsBtn) {
      ttsBtn.addEventListener("click", () => {
        const item = this.items[this.idx];
        if (item && speak(item.t)) {
          ttsBtn.classList.add("is-speaking");
          setTimeout(() => ttsBtn.classList.remove("is-speaking"), 600);
        } else if (!window.speechSynthesis) {
          toast("当前浏览器不支持语音朗读", "error");
        }
      });
    }

    const restartBtn = $("#restartBtn", container);
    if (restartBtn) restartBtn.addEventListener("click", () => this.restart());

    const exitBtn = $("#exitBtn", container);
    if (exitBtn) {
      exitBtn.addEventListener("click", async () => {
        if (!this.dirty) {
          this.goBack();
          return;
        }
        const ok = await confirmModal({
          title: "退出本次练习？",
          message: "当前练习进度尚未保存，退出后将从头开始。",
          confirmText: "退出练习",
          cancelText: "继续练习",
          danger: true
        });
        if (ok) {
          this.dirty = false;
          this.goBack();
        }
      });
    }

    const card = $("#typingCard", container);
    if (card) card.addEventListener("click", () => card.classList.add("is-focused"));
  },

  restart() {
    closeModal();
    const cfg = this.cfg;
    this.start(cfg);
    toast("已重新开始", "info");
  },

  goBack() {
    closeModal();
    location.hash = (this.cfg && this.cfg.backHash) || "#/courses";
  },

  /* ---------------- 键盘输入 ---------------- */
  handleKey(e) {
    if (!this.active || this.paused || this.finished || this.locked) return;
    if (activeModal) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const tag = (document.activeElement && document.activeElement.tagName) || "";
    if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;

    if (e.key === "Escape") {
      e.preventDefault();
      this.pause();
      return;
    }
    if (e.repeat) {
      e.preventDefault();
      return;
    }
    if (e.code === "Backspace") {
      e.preventDefault();
      return;
    }
    if (e.code === "Tab") return;

    const mode = DB.data.settings.inputMode || "layout";
    const typed = resolveChar(e, mode);
    if (typed === null) return;

    e.preventDefault();

    const item = this.items[this.idx];
    if (!item) return;
    const chars = Array.from(item.t);
    const expected = chars[this.charIdx];
    if (expected === undefined) return;

    if (!this.started) this.beginClock();

    if (typed === expected) {
      this.correct += 1;
      this.charIdx += 1;
      Sound.play(expected === " " ? "space" : "key");
      this.clearFeedback();
      this.renderLine();
      this.updateStats();
      this.updateHint();
      highlightKeyboard(chars[this.charIdx] || null);

      if (this.charIdx >= chars.length) {
        this.completeItem();
      }
    } else {
      this.errors += 1;
      const errorKey = /^[А-ЯЁ]$/.test(expected) ? expected.toLowerCase() : expected;
      this.errorMap[errorKey] = (this.errorMap[errorKey] || 0) + 1;
      this.showError(expected, typed);
      Sound.play("error");
      this.updateStats();
      highlightKeyboard(expected, e.code);
      const card = $("#typingCard");
      if (card) {
        card.classList.remove("is-error");
        void card.offsetWidth;
        card.classList.add("is-error");
        setTimeout(() => card.classList.remove("is-error"), 420);
      }
    }
  },

  beginClock() {
    this.started = true;
    this.dirty = true;
    this.startedAt = performance.now();
    this.pausedTotal = 0;
    this.startTimer();
    const feedback = $("#typeFeedback");
    if (feedback) feedback.classList.add("neutral");
  },

  completeItem() {
    if (this.idx >= this.items.length - 1) {
      this.finish();
      return;
    }
    this.locked = true;
    Sound.play("correct");
    if (this.advanceTimer) clearTimeout(this.advanceTimer);
    this.advanceTimer = setTimeout(() => {
      this.idx += 1;
      this.charIdx = 0;
      this.locked = false;
      this.renderAll();
    }, 120);
  },

  /* ---------------- 渲染 ---------------- */
  renderAll() {
    this.renderLine();
    this.updateStats();
    this.updateHint();
    this.clearFeedback();
    const item = this.items[this.idx];
    highlightKeyboard(item ? Array.from(item.t)[0] : null);
  },

  renderLine() {
    const item = this.items[this.idx];
    if (!item) return;
    const chars = Array.from(item.t);
    const line = $("#typeLine");
    if (!line) return;

    line.innerHTML = chars
      .map((ch, i) => {
        let cls = "tc";
        if (i < this.charIdx) cls += " is-done";
        else if (i === this.charIdx) cls += " is-current" + (ch === " " ? " is-space" : "");
        const content = ch === " " ? " " : escapeHtml(ch);
        return `<span class="${cls}">${content}</span>`;
      })
      .join("");

    const prev = $("#typePrev");
    const next = $("#typeNext");
    if (prev) prev.textContent = this.idx > 0 ? this.items[this.idx - 1].t : "";
    if (next) next.textContent = this.idx < this.items.length - 1 ? this.items[this.idx + 1].t : "";

    const counter = $("#typeCounter");
    if (counter) counter.textContent = `第 ${this.idx + 1} / ${this.items.length} 组`;

    const translation = $("#typeTranslation");
    if (translation) {
      if (item.zh) translation.innerHTML = `<b>释义</b>${escapeHtml(item.zh)}`;
      else if (this.cfg.tip) translation.innerHTML = `<b>提示</b>${escapeHtml(this.cfg.tip)}`;
      else translation.innerHTML = "";
    }
  },

  updateStats() {
    const elapsed = this.getElapsed();
    const speed = elapsed >= 1 ? Math.round(this.correct / (elapsed / 60)) : 0;
    const totalInput = this.correct + this.errors;
    const accuracy = totalInput ? (this.correct / totalInput) * 100 : 100;
    const doneChars = this.completedChars() + this.charIdx;
    const percent = this.totalChars ? Math.round((doneChars / this.totalChars) * 100) : 0;

    const speedEl = $("#statSpeed");
    const accEl = $("#statAcc");
    const timeEl = $("#statTime");
    const errorsEl = $("#statErrors");
    const charsEl = $("#statChars");
    const progressEl = $("#typeProgress");
    const percentEl = $("#typePercent");

    if (speedEl) speedEl.textContent = speed;
    if (accEl) accEl.textContent = `正确率 ${accuracy.toFixed(1).replace(".0", "")}%`;
    if (timeEl) timeEl.textContent = formatClock(elapsed);
    if (errorsEl) errorsEl.textContent = this.errors;
    if (charsEl) charsEl.textContent = this.correct;
    if (progressEl) progressEl.style.width = `${percent}%`;
    if (percentEl) percentEl.textContent = `${percent}%`;
  },

  updateHint() {
    const item = this.items[this.idx];
    const hintChar = $("#hintChar");
    const hintKey = $("#hintKey");
    const hintFinger = $("#hintFinger");
    const shiftHint = $("#shiftHint");
    const hintNote = $("#hintNote");
    if (!item || !hintChar) return;
    const chars = Array.from(item.t);
    const expected = chars[this.charIdx];
    if (expected === undefined) return;
    if (expected === " ") {
      hintChar.textContent = "空格";
      hintChar.classList.add("is-space");
      if (hintKey) hintKey.textContent = "Space";
      if (shiftHint) shiftHint.textContent = "";
      if (hintFinger) {
        hintFinger.innerHTML = `<i style="background:${FINGER_META.thumb.color}"></i><span>拇指</span>`;
      }
      if (hintNote) hintNote.textContent = "用大拇指轻敲空格键，其他手指保持基准位置。";
      return;
    }

    hintChar.classList.remove("is-space");
    hintChar.textContent = expected;
    const info = describeChar(expected);
    if (!info) return;
    if (hintKey) hintKey.textContent = info.keyLabel;
    if (shiftHint) shiftHint.textContent = info.shift ? "需按住 Shift" : "";
    if (hintFinger) {
      hintFinger.innerHTML = `<i style="background:${info.fingerColor}"></i><span>${info.finger}</span>`;
    }
    if (hintNote) {
      hintNote.textContent = info.shift
        ? "这是大写字母或上档标点：先按住 Shift，再按对应键。"
        : "击键后手指回到基准键位，眼睛看屏幕，不要看键盘。";
    }
  },

  showError(expected, typed) {
    const feedback = $("#typeFeedback");
    if (!feedback) return;
    feedback.classList.remove("neutral");
    const expectedLabel = expected === " " ? "空格" : expected;
    const typedLabel = typed === " " ? "空格" : typed;
    feedback.textContent = `打错了：应输入 «${expectedLabel}»，你按了 «${typedLabel}»。`;
  },

  clearFeedback() {
    const feedback = $("#typeFeedback");
    if (!feedback) return;
    feedback.classList.add("neutral");
    feedback.textContent = "打错不会前进，直接按正确键继续；眼睛看屏幕。";
  },

  completedChars() {
    let sum = 0;
    for (let i = 0; i < this.idx; i++) sum += Array.from(this.items[i].t).length;
    return sum;
  },

  getElapsed() {
    if (!this.started) return 0;
    const end = this.finished ? this.finishedAt : performance.now();
    const currentPause = this.paused ? performance.now() - this.pauseStart : 0;
    return Math.max(0, (end - this.startedAt - this.pausedTotal - currentPause) / 1000);
  },

  startTimer() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (!this.active || this.paused || this.finished) return;
      if (this.started) this.updateStats();
    }, 240);
  },

  /* ---------------- 暂停 ---------------- */
  pauseSilently() {
    if (!this.active || this.paused || this.finished || !this.started) return false;
    this.paused = true;
    this.pauseStart = performance.now();
    return true;
  },

  resumeSilently() {
    if (!this.paused) return false;
    this.pausedTotal += performance.now() - this.pauseStart;
    this.pauseStart = 0;
    this.paused = false;
    this.updateStats();
    this.updateHint();
    const item = this.items[this.idx];
    if (item) highlightKeyboard(Array.from(item.t)[this.charIdx] || null);
    return true;
  },

  pause() {
    if (!this.active || this.paused || this.finished) return;
    if (!this.started) {
      toast("开始输入后即可暂停", "info");
      return;
    }
    this.paused = true;
    this.pauseStart = performance.now();
    const elapsed = this.getElapsed();
    const speed = elapsed >= 1 ? Math.round(this.correct / (elapsed / 60)) : 0;
    const totalInput = this.correct + this.errors;
    const accuracy = totalInput ? (this.correct / totalInput) * 100 : 100;

    const ref = openModal(
      `<div class="pause-box">
        <div class="pause-icon">${icon("pause", "", 25)}</div>
        <h3>练习已暂停</h3>
        <p>休息一下，回来继续。计时已经停止。</p>
        <div class="pause-stats">
          <div><b>${speed}</b><span>字符/分</span></div>
          <div><b>${accuracy.toFixed(1)}%</b><span>正确率</span></div>
          <div><b>${this.idx + 1}/${this.items.length}</b><span>当前组</span></div>
        </div>
        <div class="result-actions">
          <button class="btn btn-ghost" type="button" id="pauseRestart">重新开始</button>
          <button class="btn btn-primary" type="button" id="pauseResume">继续练习</button>
        </div>
        <div class="modal-actions" style="justify-content:center;margin-top:10px">
          <button class="btn btn-ghost btn-sm" type="button" id="pauseExit">退出练习</button>
        </div>
      </div>`,
      { className: "modal-sm", closable: false }
    );

    if (!ref) {
      this.resume();
      return;
    }
    const resumeBtn = $("#pauseResume", ref.el);
    if (resumeBtn) resumeBtn.addEventListener("click", () => this.resume());
    const restartBtn = $("#pauseRestart", ref.el);
    if (restartBtn) restartBtn.addEventListener("click", () => this.restart());
    const exitBtn = $("#pauseExit", ref.el);
    if (exitBtn) {
      exitBtn.addEventListener("click", () => {
        this.dirty = false;
        closeModal();
        this.goBack();
      });
    }
  },

  resume() {
    if (!this.paused) {
      closeModal();
      return;
    }
    this.pausedTotal += performance.now() - this.pauseStart;
    this.paused = false;
    this.pauseStart = 0;
    closeModal();
    this.updateStats();
    this.updateHint();
    const item = this.items[this.idx];
    if (item) highlightKeyboard(Array.from(item.t)[this.charIdx] || null);
  },

  /* ---------------- 完成结算 ---------------- */
  finish() {
    if (this.finished) return;
    this.finished = true;
    this.finishedAt = performance.now();
    this.dirty = false;
    if (this.advanceTimer) {
      clearTimeout(this.advanceTimer);
      this.advanceTimer = null;
    }
    const elapsed = Math.max(this.getElapsed(), 1);
    const speed = Math.round(this.correct / (elapsed / 60));
    const totalInput = this.correct + this.errors;
    const accuracy = totalInput ? Math.round((this.correct / totalInput) * 1000) / 10 : 100;
    const target = this.cfg.target || 60;
    const stars = getStarsFor(speed, accuracy, target);
    const prevRecord =
      this.cfg.type === "lesson" ? getLessonRecord(this.cfg.refId) : getArticleRecord(this.cfg.refId);
    const newRecord = !prevRecord || speed > (prevRecord.bestSpeed || 0);

    const result = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date: new Date().toISOString(),
      type: this.cfg.type,
      refId: this.cfg.refId,
      title: this.cfg.title,
      speed,
      accuracy,
      chars: this.correct,
      errors: this.errors,
      duration: Math.round(elapsed),
      stars,
      target,
      keyErrors: { ...this.errorMap }
    };
    DB.record(result);
    this.updateStats();
    Sound.play("finish");
    this.renderFinishModal(result, newRecord, prevRecord);
  },

  renderFinishModal(result, newRecord, prevRecord) {
    const cfg = this.cfg;
    const starsHtml = [1, 2, 3]
      .map((i) => icon("star", `result-star${i <= result.stars ? " on" : ""}`, 44))
      .join("");

    const errorEntries = Object.entries(result.keyErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    const errorText = errorEntries.length
      ? `<b>易错键</b> ${errorEntries.map(([k, v]) => `${escapeHtml(k)} × ${v}`).join(" · ")}`
      : "全对，一个错误也没有。";

    const confetti =
      result.stars >= 2
        ? Array.from({ length: 22 })
            .map(() => {
              const colors = ["#6cb6ff", "#ffd479", "#e5484d", "#6ee7a8", "#b79cff"];
              const color = colors[Math.floor(Math.random() * colors.length)];
              const left = 50 + (Math.random() * 60 - 30);
              const cx = Math.round(Math.random() * 180 - 90);
              const cr = Math.round(Math.random() * 720 - 360);
              const cd = (Math.random() * 0.4).toFixed(2);
              return `<i class="confetti" style="left:${left}%;background:${color};--cx:${cx}px;--cr:${cr}deg;--cd:${cd}s"></i>`;
            })
            .join("")
        : "";

    let primaryLabel = cfg.type === "lesson" ? "下一课" : "返回文章";
    let primaryHash = cfg.backHash || (cfg.type === "lesson" ? "#/courses" : "#/articles");
    if (cfg.next && cfg.next.hash) {
      primaryLabel = cfg.next.label || primaryLabel;
      primaryHash = cfg.next.hash;
    }

    const ref = openModal(
      `<div class="result-modal">
        ${confetti}
        <div class="result-stars">${starsHtml}</div>
        <span class="eyebrow">${result.stars === 3 ? "ОТЛИЧНО · 完美" : "ВЫПОЛНЕНО · 完成"}</span>
        <h2>${result.stars === 3 ? "太棒了，节奏很稳！" : result.stars === 2 ? "完成得不错！" : "练习完成，继续加油"}</h2>
        <p class="result-sub">${escapeHtml(cfg.title)} · 目标 ${result.target} 字符/分</p>
        <div class="result-speed"><b>${result.speed}</b><span>字符 / 分</span></div>
        ${newRecord ? `<span class="result-badge">${icon("zap", "", 12)} 新纪录${prevRecord ? ` · 提升 ${result.speed - (prevRecord.bestSpeed || 0)}` : ""}</span>` : ""}
        <div class="result-stats">
          <div class="result-stat"><b>${result.accuracy.toFixed(1)}%</b><span>正确率</span></div>
          <div class="result-stat"><b>${formatClock(result.duration)}</b><span>用时</span></div>
          <div class="result-stat"><b>${result.errors}</b><span>错误</span></div>
          <div class="result-stat"><b>${result.chars}</b><span>字符</span></div>
        </div>
        <div class="result-note">${errorText}</div>
        <div class="result-actions">
          <button class="btn btn-ghost" type="button" id="resultRetry">${icon("restart", "", 15)} 再练一次</button>
          <a class="btn btn-primary" href="${escapeHtml(primaryHash)}" data-nav>${escapeHtml(primaryLabel)} ${icon("chevron-right", "", 15)}</a>
        </div>
        <div class="modal-actions" style="justify-content:center;margin-top:8px">
          <a class="section-link" href="#/stats" data-nav>查看学习统计 ${icon("chevron-right", "", 12)}</a>
        </div>
      </div>`,
      {
        className: "modal-result",
        closable: true,
        onClose: () => this.goBack()
      }
    );

    if (!ref) return;
    const retry = $("#resultRetry", ref.el);
    if (retry) {
      retry.addEventListener("click", () => {
        closeModal();
        this.restart();
      });
    }
  }
};
