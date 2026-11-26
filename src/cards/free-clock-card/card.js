import { DEFAULTS } from "./defaults.js";

const JUSTIFY = { left: "flex-start", center: "center", right: "flex-end" };
const ROW = 56; // Höhe einer Rasterzeile, falls die Karte keine feste Höhe hat

export class FreeClockCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  set layout(value) {
    this._layout = value;
    this.toggleAttribute("grid", value === "grid");
    this._fit();
  }

  get layout() {
    return this._layout;
  }

  setConfig(config) {
    this._config = { ...DEFAULTS, ...config };
    this._build();
    this._tick();
  }

  // Die Uhr braucht keine Entitäten – hass wird nur angenommen.
  set hass(_hass) {}

  connectedCallback() {
    if (window.ResizeObserver && !this._ro) {
      this._ro = new ResizeObserver(() => this._fit());
      this._ro.observe(this);
    }
    this._tick();
  }

  disconnectedCallback() {
    this._ro?.disconnect();
    this._ro = null;
    clearTimeout(this._timer);
  }

  getCardSize() {
    return 1;
  }

  // Jede Größe von 1 × 1 bis 12 × 12 erlaubt
  getGridOptions() {
    return { columns: 6, rows: 1, min_columns: 1, max_columns: 12, min_rows: 1, max_rows: 12 };
  }

  _text(now) {
    const c = this._config;
    let h = now.getHours();
    let ampm = "";
    if (c.hour_format === "12") {
      ampm = h < 12 ? "AM" : "PM";
      h = h % 12 || 12;
    }
    const pad = (n) => String(n).padStart(2, "0");
    let t = `${c.leading_zero ? pad(h) : h}:${pad(now.getMinutes())}`;
    if (c.show_seconds) t += `:${pad(now.getSeconds())}`;
    return { time: t, ampm: c.hour_format === "12" && c.show_ampm ? ampm : "" };
  }

  /** Aktualisiert die Anzeige genau zum nächsten Sekunden- bzw. Minutenwechsel. */
  _tick() {
    clearTimeout(this._timer);
    if (!this.shadowRoot || !this.isConnected) return;
    const now = new Date();
    const { time, ampm } = this._text(now);
    const t = this.shadowRoot.querySelector(".time");
    const a = this.shadowRoot.querySelector(".ampm");
    const changed = t.textContent !== time || a.textContent !== ampm;
    if (changed) {
      t.textContent = time;
      a.textContent = ampm;
      a.hidden = !ampm;
      // Breite ändert sich (z. B. 9:59 -> 10:00) -> neu einpassen
      if (time.length !== this._len) {
        this._len = time.length;
        this._fit();
      }
    }
    const ms = this._config.show_seconds ? 1000 - now.getMilliseconds() : 60000 - now.getSeconds() * 1000 - now.getMilliseconds();
    this._timer = setTimeout(() => this._tick(), ms + 20);
  }

  _build() {
    const c = this._config;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const color = Array.isArray(c.color) ? `rgb(${c.color[0]},${c.color[1]},${c.color[2]})` : "var(--primary-text-color)";
    const align = JUSTIFY[c.align] || "center";
    const valign = JUSTIFY[{ top: "left", center: "center", bottom: "right" }[c.valign] || "center"];
    this._len = null;
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        :host([grid]) { height:100%; }
        :host(:not([grid])) ha-card { min-height:${ROW}px; }
        ha-card { height:100%; box-sizing:border-box; overflow:hidden; display:flex;
                  justify-content:${align}; align-items:${valign};
                  padding: 0 calc(var(--fs, 40px) * 0.25); }
        ha-card.transparent { background:none; box-shadow:none; border:none; }
        .clock { display:flex; align-items:baseline; white-space:nowrap; line-height:1;
                 font-size: var(--fs, 40px); color:${color}; font-weight:${Number(c.font_weight) || 400};
                 font-family:${c.font_family ? c.font_family.replace(/[;{}<>]/g, "") : "inherit"};
                 font-variant-numeric: tabular-nums; }
        .ampm { font-size:.38em; margin-left:.25em; font-weight:inherit; }
        .ampm[hidden] { display:none; }
      </style>
      <ha-card class="${c.transparent ? "transparent" : ""}">
        <div class="clock"><span class="time"></span><span class="ampm" hidden></span></div>
      </ha-card>`;
    this._fit();
  }

  /** Schriftgröße = Anteil der Kachelhöhe, bei Bedarf verkleinert, bis die Uhrzeit in die Breite passt. */
  _fit() {
    if (!this.shadowRoot || !this._config) return;
    cancelAnimationFrame(this._raf);
    this._raf = requestAnimationFrame(() => {
      const card = this.shadowRoot.querySelector("ha-card");
      const clock = this.shadowRoot.querySelector(".clock");
      if (!card || !clock) return;
      const h = this.hasAttribute("grid") && this.clientHeight ? this.clientHeight : ROW;
      const pct = Math.min(100, Math.max(10, Number(this._config.size) || DEFAULTS.size)) / 100;
      let fs = Math.max(8, h * pct);
      this.style.setProperty("--fs", `${fs}px`);
      const avail = this.clientWidth - fs * 0.5;
      const w = clock.scrollWidth;
      if (avail > 0 && w > avail) {
        fs = Math.max(8, (fs * avail) / w);
        this.style.setProperty("--fs", `${fs}px`);
      }
    });
  }
}
