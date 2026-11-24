import { DEFAULTS } from "./defaults.js";

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/** "0:06:00", "6:00", "1 day, 0:06:00" -> Sekunden */
function parseDuration(str) {
  if (str == null) return null;
  if (typeof str === "number") return str;
  const m = String(str).match(/(?:(\d+)\s*days?,\s*)?(\d+):(\d{1,2})(?::(\d{1,2}))?/);
  if (!m) return null;
  const [, d, a, b, c] = m;
  return c != null ? +(d || 0) * 86400 + +a * 3600 + +b * 60 + +c : +(d || 0) * 86400 + +a * 60 + +b;
}

/** Sekunden -> "5:07" bzw. "1:05:07" */
function formatRemaining(sec) {
  const s = Math.max(0, Math.ceil(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

const BASE_H = 184; // 3 Rasterzeilen
const RING_C = 2 * Math.PI * 44; // Umfang des Fortschrittsrings
const BASE_W = 640;

export class CoffeeTimerCard extends HTMLElement {
  static getStubConfig() {
    // Timer wird bewusst nicht geraten – Auswahl im visuellen Editor.
    return {};
  }

  set layout(value) {
    this._layout = value;
    this.toggleAttribute("grid", value === "grid");
    this._resize();
  }

  get layout() {
    return this._layout;
  }

  setConfig(config) {
    this._config = { ...DEFAULTS, ...config };
    this._built = null;
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    const c = this._config || {};
    const a = hass.states[c.timer_entity];
    if (first || a !== this._lastA) {
      this._lastA = a;
      this._render();
    }
  }

  connectedCallback() {
    if (window.ResizeObserver && !this._ro) {
      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(this);
    }
    this._resize();
    clearInterval(this._tick);
    this._tick = setInterval(() => this._render(), 250);
  }

  disconnectedCallback() {
    this._ro?.disconnect();
    this._ro = null;
    clearInterval(this._tick);
  }

  getCardSize() {
    return 3;
  }

  getGridOptions() {
    return { columns: 12, rows: 3, min_columns: 6, min_rows: 2 };
  }

  _resize() {
    const w = this.clientWidth || BASE_W;
    const h = this.hasAttribute("grid") && this.clientHeight ? this.clientHeight : BASE_H;
    const s = Math.max(0.45, Math.min(3.5, h / BASE_H, w / BASE_W));
    const key = `${w}x${h}`;
    if (key === this._key) return;
    this._key = key;
    this._s = s;
    this.style.setProperty("--s", s.toFixed(3));
    this.style.setProperty("--h", `${h}px`);
    this.style.setProperty("--ring", `${Math.round(Math.min(h - 28 * s, w * 0.42))}px`);
  }

  // ---------- Zeitberechnung ----------
  _timing() {
    const c = this._config;
    const st = this._hass?.states[c.timer_entity];
    if (!st) return null;
    const now = Date.now();
    let end = null;
    let remaining = null;
    let total = null;
    let paused = false;

    // Timer-Helfer: Dauer + Endzeit (finishes_at) bzw. Restzeit (pausiert)
    total = parseDuration(st.attributes.duration);
    if (st.state === "active") {
      if (st.attributes.finishes_at) end = new Date(st.attributes.finishes_at).getTime();
      else {
        const rem = parseDuration(st.attributes.remaining);
        if (rem != null) end = new Date(st.last_changed).getTime() + rem * 1000;
      }
    } else if (st.state === "paused") {
      paused = true;
      remaining = parseDuration(st.attributes.remaining);
    } else {
      remaining = 0; // idle -> fertig
    }

    if (end != null) remaining = Math.max(0, (end - now) / 1000);
    if (remaining == null) return null;
    const progress = total > 0 ? Math.min(1, Math.max(0, 1 - remaining / total)) : null;
    return { remaining, total, progress, end: end ?? (paused ? null : now + remaining * 1000), paused };
  }

  // ---------- Darstellung ----------
  _render() {
    if (!this._config || !this._hass) return;
    const c = this._config;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });

    const t = this._timing();
    if (!c.timer_entity || !this._hass.states[c.timer_entity]) {
      this._built = null;
      this.shadowRoot.innerHTML = `${this._style()}<ha-card><div class="hint">${
        c.timer_entity
          ? `„${esc(c.timer_entity)}“ nicht gefunden.`
          : "Bitte im visuellen Editor den Kaffee-Timer auswählen."
      }</div></ha-card>`;
      return;
    }

    if (!this._built) this._build();

    const done = !t || t.remaining <= 0;
    const root = this.shadowRoot;
    const set = (sel, text) => {
      const el = root.querySelector(sel);
      if (el && el.textContent !== text) el.textContent = text;
    };

    root.querySelector("ha-card").classList.toggle("done", done);
    set(".title", done ? c.done_text || DEFAULTS.done_text : c.title || DEFAULTS.title);
    set(".time", done ? "0:00" : formatRemaining(t.remaining));
    const endTxt =
      !done && c.show_end_time && t.end
        ? `fertig ca. ${new Date(t.end).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`
        : t?.paused
          ? "pausiert"
          : "";
    set(".end", endTxt);

    const p = done ? 1 : (t.progress ?? 0);
    root.querySelector(".ring-fg").style.strokeDashoffset = String(RING_C * (1 - p));
  }

  _build() {
    this._built = true;
    this.shadowRoot.innerHTML = `${this._style()}<ha-card>
        <div class="ring-layout">
          <div class="ring">
            <svg viewBox="0 0 100 100">
              <circle class="ring-bg" cx="50" cy="50" r="44"/>
              <circle class="ring-fg" cx="50" cy="50" r="44"/>
            </svg>
            <ha-icon class="ring-cup" icon="mdi:coffee"></ha-icon>
          </div>
          <div class="text">
            <div class="title"></div>
            <div class="time"></div>
            <div class="end"></div>
          </div>
        </div>
      </ha-card>`;
  }

  _style() {
    const col = this._config?.color || DEFAULTS.color;
    return `<style>
      :host { display:block; }
      :host([grid]) { height:100%; }
      ha-card { position:relative; height:100%; min-height:${BASE_H}px; box-sizing:border-box; overflow:hidden;
                color: var(--primary-text-color); }
      :host([grid]) ha-card { min-height:0; }
      .hint { padding:16px; color: var(--secondary-text-color); }
      .title { font-weight:500; line-height:1.15; }
      .time { font-weight:700; line-height:1; white-space:nowrap; font-variant-numeric: tabular-nums;
              letter-spacing: -0.02em; }
      .end { color: var(--secondary-text-color); white-space:nowrap; }
      ha-card.done .time { color: ${rgba(col)}; }

      .ring-layout { display:flex; align-items:center; height:100%; box-sizing:border-box;
                     padding: calc(var(--s,1)*14px) calc(var(--s,1)*28px); gap: calc(var(--s,1)*28px); }
      .ring { position:relative; flex:none; width: var(--ring, 156px); height: var(--ring, 156px); }
      .ring > svg { position:absolute; inset:0; width:100%; height:100%; transform: rotate(-90deg); }
      .ring-bg { fill:none; stroke: ${rgba(col, 0.18)}; stroke-width:8; }
      .ring-fg { fill:none; stroke: ${rgba(col)}; stroke-width:8; stroke-linecap:round;
                 stroke-dasharray:${RING_C}; stroke-dashoffset:${RING_C}; transition: stroke-dashoffset .9s linear; }
      .ring-cup { display:block; position:absolute; left:50%; top:50%; transform: translate(-50%, -52%); color: ${rgba(col)};
                  --mdc-icon-size: calc(var(--ring, 156px) * 0.42);
                  width: var(--mdc-icon-size); height: var(--mdc-icon-size); }
      .text { flex:1; min-width:0; }
      .title { font-size: calc(var(--s,1)*30px); color: var(--secondary-text-color); }
      .time { font-size: calc(var(--s,1)*96px); margin: calc(var(--s,1)*2px) 0; }
      .end { font-size: calc(var(--s,1)*22px); }

    </style>`;
  }
}
