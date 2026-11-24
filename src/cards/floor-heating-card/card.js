import { DEFAULTS } from "./defaults.js";

const num = (v) => (v == null || v === "" || Number.isNaN(+v) ? null : +v);
const fmt = (v, d = 1) =>
  v == null ? "–" : v.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const SEND_DELAY = 1000; // ms nach dem letzten Tipp, bevor der Wert gesendet wird
const UNAVAILABLE = ["unavailable", "unknown"];

export class FloorHeatingCard extends HTMLElement {
  static getStubConfig() {
    // Thermostat wird bewusst nicht geraten – Auswahl im visuellen Editor.
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
    this._pending = null;
    this._build();
    this._update();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    const c = this._config || {};
    const cl = hass.states[c.climate_entity];
    const t = hass.states[c.temperature_entity];
    if (first || cl !== this._lastCl || t !== this._lastT) {
      this._lastCl = cl;
      this._lastT = t;
      // Gesendeter Wert ist angekommen -> lokale Vorschau beenden
      if (this._pending != null && !this._timer && num(cl?.attributes.temperature) === this._pending) {
        this._pending = null;
      }
      this._update();
    }
  }

  connectedCallback() {
    if (window.ResizeObserver && !this._ro) {
      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(this);
    }
    this._resize();
  }

  disconnectedCallback() {
    this._ro?.disconnect();
    this._ro = null;
  }

  getCardSize() {
    return 2;
  }

  getGridOptions() {
    return { columns: 12, rows: 2, min_columns: 6, min_rows: 1 };
  }

  // ---------- Größe: skaliert mit Breite und (im Raster) Höhe ----------
  _resize() {
    const w = this.clientWidth || 460;
    const h = this.hasAttribute("grid") && this.clientHeight ? this.clientHeight : 120;
    const s = Math.max(0.6, Math.min(2.2, w / 460, h / 120));
    if (s === this._s) return;
    this._s = s;
    this.style.setProperty("--s", String(s));
  }

  // ---------- statischer Aufbau ----------
  _build() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        :host([grid]) { height:100%; }
        [hidden] { display:none !important; }
        ha-card { height:100%; box-sizing:border-box; overflow:hidden; }
        .wrap { display:flex; align-items:center; justify-content:space-between; height:100%;
                min-height: calc(var(--s, 1) * 56px); box-sizing:border-box;
                padding: calc(var(--s, 1) * 10px) calc(var(--s, 1) * 16px); gap: calc(var(--s, 1) * 12px); }
        .info { min-width:0; cursor:pointer; }
        .title { font-size: calc(var(--s, 1) * 20px); font-weight:500; color: var(--primary-text-color);
                 white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.25; }
        .cur { font-size: calc(var(--s, 1) * 17px); color: var(--secondary-text-color); white-space:nowrap; line-height:1.3; }
        .ctrl { display:flex; align-items:center; gap: calc(var(--s, 1) * 10px); flex:none; }
        .btn { width: calc(var(--s, 1) * 48px); height: calc(var(--s, 1) * 48px); border-radius:50%;
               border:none; padding:0; display:flex; align-items:center; justify-content:center;
               font-size: calc(var(--s, 1) * 30px); line-height:1; font-family:inherit; cursor:pointer;
               background: var(--secondary-background-color, rgba(127,127,127,.15));
               color: var(--primary-text-color); touch-action: manipulation; -webkit-tap-highlight-color: transparent;
               user-select:none; -webkit-user-select:none; }
        .btn:active { background: var(--divider-color, rgba(127,127,127,.3)); transform: scale(.94); }
        .btn:disabled { opacity:.35; cursor:default; }
        .target { min-width: calc(var(--s, 1) * 96px); text-align:center; font-size: calc(var(--s, 1) * 40px);
                  font-weight:500; color: var(--primary-text-color); white-space:nowrap; line-height:1;
                  font-variant-numeric: tabular-nums; }
        .target.heating { color: var(--state-climate-heat-color, #ff8100); }
        .target.pending { opacity:.7; }
        .target.off { color: var(--secondary-text-color); }
        .hint { padding:16px; color: var(--secondary-text-color); }
      </style>
      <ha-card>
        <div class="wrap">
          <div class="info">
            <div class="title"></div>
            <div class="cur"></div>
          </div>
          <div class="ctrl">
            <button class="btn minus" aria-label="Temperatur verringern">−</button>
            <div class="target"></div>
            <button class="btn plus" aria-label="Temperatur erhöhen">+</button>
          </div>
        </div>
        <div class="hint" hidden></div>
      </ha-card>`;
    const root = this.shadowRoot;
    root.querySelector(".minus").addEventListener("click", () => this._change(-1));
    root.querySelector(".plus").addEventListener("click", () => this._change(+1));
    root.querySelector(".info").addEventListener("click", () => {
      if (this._config?.climate_entity)
        this.dispatchEvent(
          new CustomEvent("hass-more-info", {
            detail: { entityId: this._config.climate_entity },
            bubbles: true,
            composed: true,
          })
        );
    });
  }

  _climate() {
    return this._hass?.states[this._config?.climate_entity];
  }

  _step() {
    return num(this._config.step) || DEFAULTS.step;
  }

  // ---------- − / + ----------
  _change(dir) {
    const cl = this._climate();
    if (!cl || UNAVAILABLE.includes(cl.state)) return;
    const step = this._step();
    const current = this._pending ?? num(cl.attributes.temperature) ?? num(cl.attributes.current_temperature) ?? 20;
    const min = num(cl.attributes.min_temp) ?? 5;
    const max = num(cl.attributes.max_temp) ?? 35;
    // Auf das Schrittraster runden, dann einen Schritt weiter
    let next = Math.round((current + dir * step) / step) * step;
    next = Math.round(Math.min(max, Math.max(min, next)) * 100) / 100;
    this._pending = next;
    this._update();
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this._send(), SEND_DELAY);
  }

  _send() {
    this._timer = null;
    const value = this._pending;
    if (value == null || !this._hass) return;
    this._hass
      .callService("climate", "set_temperature", { entity_id: this._config.climate_entity, temperature: value })
      .catch((e) => {
        console.error("[ha-cards] Temperatur konnte nicht gesetzt werden", e);
        this._pending = null;
        this._update();
      });
    // Falls keine Bestätigung kommt, Vorschau nach 10 s verwerfen
    clearTimeout(this._fallback);
    this._fallback = setTimeout(() => {
      if (!this._timer && this._pending === value) {
        this._pending = null;
        this._update();
      }
    }, 10000);
  }

  // ---------- Anzeige aktualisieren ----------
  _update() {
    const root = this.shadowRoot;
    if (!root || !this._config || !this._hass) return;
    const c = this._config;
    const cl = this._climate();
    const hint = root.querySelector(".hint");
    const wrap = root.querySelector(".wrap");
    if (!c.climate_entity || !cl) {
      wrap.hidden = true;
      hint.hidden = false;
      hint.textContent = c.climate_entity
        ? `Thermostat „${c.climate_entity}“ nicht gefunden.`
        : "Bitte im visuellen Editor ein Thermostat (Klima-Entität) auswählen.";
      return;
    }
    wrap.hidden = false;
    hint.hidden = true;

    const unavailable = UNAVAILABLE.includes(cl.state);
    const off = cl.state === "off";
    const sensor = this._hass.states[c.temperature_entity];
    const current = num(sensor?.state) ?? num(cl.attributes.current_temperature);
    const target = this._pending ?? num(cl.attributes.temperature);

    root.querySelector(".title").textContent = c.title || DEFAULTS.title;
    root.querySelector(".cur").textContent = unavailable
      ? "Nicht verfügbar"
      : `Aktuell: ${fmt(current)} °C${off ? " · Aus" : ""}`;

    const t = root.querySelector(".target");
    t.textContent = target == null ? "–" : `${fmt(target, this._step() % 1 ? 1 : 0)}°`;
    t.classList.toggle("pending", this._pending != null);
    t.classList.toggle("heating", cl.attributes.hvac_action === "heating" && this._pending == null);
    t.classList.toggle("off", off);

    const min = num(cl.attributes.min_temp) ?? 5;
    const max = num(cl.attributes.max_temp) ?? 35;
    root.querySelector(".minus").disabled = unavailable || (target != null && target <= min);
    root.querySelector(".plus").disabled = unavailable || (target != null && target >= max);
  }
}
