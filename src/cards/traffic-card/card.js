import { DEFAULTS, COLORS, LEVEL_TEXT, buildRoutes, fmt, fmtMin, fmtDelay, rgb, textOn } from "./data.js";

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const BASE_W = 560;
const BASE_H = 184;
const GAUGE_LEN = Math.PI * 40; // Länge des Halbkreises (r = 40)

export class TrafficCard extends HTMLElement {
  static getStubConfig() {
    // Sensoren werden bewusst nicht geraten – Auswahl im visuellen Editor.
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
    this._sig = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const c = this._config || {};
    const sig = Object.keys(c)
      .filter((k) => /^route\d_entity\d$/.test(k))
      .map((k) => hass.states[c[k]])
      .map((s) => (s ? s.last_updated + s.state : "-"))
      .join("|");
    if (sig !== this._sig) {
      this._sig = sig;
      this._render();
    }
  }

  connectedCallback() {
    if (window.ResizeObserver && !this._ro) {
      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(this);
    }
    this._resize();
    // "veraltet" auch ohne neue Zustände erkennen
    this._timer = setInterval(() => this._render(), 60000);
  }

  disconnectedCallback() {
    this._ro?.disconnect();
    this._ro = null;
    clearInterval(this._timer);
  }

  getCardSize() {
    return 4;
  }

  getGridOptions() {
    return { columns: 12, rows: 4, min_columns: 6, min_rows: 2 };
  }

  _resize() {
    const w = this.clientWidth || BASE_W;
    const h = this.hasAttribute("grid") && this.clientHeight ? this.clientHeight : Infinity;
    // Benötigte Höhe bei Maßstab 1 – je nach Design und Anzahl Strecken/Ziele
    const need = this._need || BASE_H;
    const s = Math.max(0.5, Math.min(2.6, w / BASE_W, h / need));
    if (s === this._s) return;
    this._s = s;
    this.style.setProperty("--s", s.toFixed(3));
  }

  // ---------- Darstellung ----------
  _render() {
    if (!this._config || !this._hass) return;
    const c = this._config;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const { routes, newest } = buildRoutes(c, this._hass.states);

    let body;
    if (!routes.length) {
      body = `<div class="hint">Bitte im visuellen Editor die Verkehrs-Sensoren auswählen.</div>`;
    } else {
      const design = ["strip", "list", "gauge"].includes(c.design) ? c.design : "strip";
      const maxItems = Math.max(...routes.map((r) => r.items.length));
      const need =
        (c.title ? 30 : 0) +
        (c.show_updated ? 18 : 0) +
        (design === "strip" ? 24 + routes.length * 116 : design === "list" ? 54 + maxItems * 36 : 150);
      if (need !== this._need) {
        this._need = need;
        this._s = null;
        requestAnimationFrame(() => this._resize());
      }
      body = `<div class="d-${design}">${routes.map((r) => this[`_${design}`](r)).join("")}</div>`;
    }

    const anyStale = routes.some((r) => r.items.some((i) => i.stale));
    const stand =
      c.show_updated && newest
        ? `<span class="stand ${anyStale ? "stale" : ""}">${anyStale ? "veraltet · " : ""}Stand ${new Date(
            newest
          ).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</span>`
        : "";
    const head = c.title ? `<div class="head"><span class="title">${esc(c.title)}</span></div>` : "";
    const foot = stand ? `<div class="foot">${stand}</div>` : "";

    this.shadowRoot.innerHTML = `${this._style()}<ha-card>${head}${body}${foot}</ha-card>`;
    this.shadowRoot.querySelectorAll("[data-entity]").forEach((el) =>
      el.addEventListener("click", () =>
        this.dispatchEvent(
          new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.entity }, bubbles: true, composed: true })
        )
      )
    );
  }

  _speedText(i) {
    if (i.missing) return "fehlt";
    return i.speed == null ? "–" : `${fmt(i.speed)}<small>&#8239;km/h</small>`;
  }

  // Design 1: Streckenband – farbige Abschnitte, Haltepunkte darunter
  _strip(r) {
    // Alle Abschnitte gleich breit
    const widths = r.items.map(() => 1);
    const segs = r.items
      .map((i, k) => {
        const col = COLORS[i.level];
        return `<div class="seg ${i.stale ? "is-stale" : ""}" data-entity="${esc(i.entity)}"
          style="flex-grow:${widths[k]};background:${rgb(col)};color:${textOn(col)}">${this._speedText(i)}</div>`;
      })
      .join("");
    const labels = r.items
      .map(
        (i, k) => `<div class="lab ${i.stale ? "is-stale" : ""}" style="flex-grow:${widths[k]}">
          <div class="lname">${esc(i.name)}</div>
          <div class="ltime">${fmtMin(i.duration)}${i.delay != null ? ` <b>${fmtDelay(i.delay)}</b>` : ""}</div>
        </div>`
      )
      .join("");
    return `<div class="route">
      <div class="rtitle">${esc(r.title)}</div>
      <div class="bar">${segs}</div>
      <div class="labels">${labels}</div>
    </div>`;
  }

  // Design 2: Liste – kompakte Tabelle pro Strecke
  _list(r) {
    const rows = r.items
      .map((i) => {
        const col = COLORS[i.level];
        const details = [
          i.freeflow != null ? `frei ${fmt(i.freeflow)}` : null,
          i.duration != null ? `${fmtMin(i.duration)}${i.delay != null ? ` (${fmtDelay(i.delay)})` : ""}` : null,
          i.distance != null ? `${fmt(i.distance, 1)} km` : null,
        ]
          .filter(Boolean)
          .join(" · ");
        return `<div class="row ${i.stale ? "is-stale" : ""}" data-entity="${esc(i.entity)}">
          <span class="sw" style="background:${rgb(col)}"></span>
          <div class="info"><div class="name">${esc(i.name)}</div><div class="det">${details || LEVEL_TEXT[i.level]}</div></div>
          <div class="spd" style="color:${i.level === "none" ? "var(--secondary-text-color)" : rgb(col)}">${this._speedText(i)}</div>
        </div>`;
      })
      .join("");
    return `<div class="route"><div class="rtitle">${esc(r.title)} <span class="from">ab ${esc(r.start)}</span></div>${rows}</div>`;
  }

  // Design 3: Tacho – Halbkreis gefüllt im Verhältnis zur freien Geschwindigkeit
  _gauge(r) {
    const gauges = r.items
      .map((i) => {
        const col = COLORS[i.level];
        const p = i.ratio == null ? 0 : Math.max(0, Math.min(1, i.ratio));
        return `<div class="g ${i.stale ? "is-stale" : ""}" data-entity="${esc(i.entity)}">
          <svg viewBox="0 0 100 58">
            <path class="g-bg" d="M10,50 A40,40 0 0 1 90,50"/>
            <path class="g-fg" d="M10,50 A40,40 0 0 1 90,50" style="stroke:${rgb(col)};stroke-dasharray:${GAUGE_LEN};stroke-dashoffset:${(
              GAUGE_LEN *
              (1 - p)
            ).toFixed(2)}"/>
            <text class="g-v" x="50" y="44">${i.speed == null ? "–" : fmt(i.speed)}</text>
            <text class="g-u" x="50" y="55">${i.freeflow != null ? `von ${fmt(i.freeflow)} km/h` : "km/h"}</text>
          </svg>
          <div class="g-name">${esc(i.name)}</div>
          <div class="g-time">${fmtMin(i.duration)}${i.delay != null ? ` <b>${fmtDelay(i.delay)}</b>` : ""}</div>
        </div>`;
      })
      .join("");
    return `<div class="route" style="flex-grow:${r.items.length}"><div class="rtitle">${esc(r.title)} <span class="from">ab ${esc(
      r.start
    )}</span></div><div class="gs">${gauges}</div></div>`;
  }

  _style() {
    return `<style>
      :host { display:block; }
      :host([grid]) { height:100%; }
      ha-card { height:100%; box-sizing:border-box; overflow:hidden; padding: calc(var(--s,1)*12px) calc(var(--s,1)*16px);
                display:flex; flex-direction:column; gap: calc(var(--s,1)*8px); color: var(--primary-text-color); }
      .hint { color: var(--secondary-text-color); }
      .head { display:flex; justify-content:space-between; align-items:baseline; gap:8px; }
      .title { font-size: calc(var(--s,1)*18px); font-weight:500; }
      .foot { display:flex; justify-content:flex-end; margin-top:auto; line-height:1; }
      .stand { font-size: calc(var(--s,1)*12px); color: var(--secondary-text-color); white-space:nowrap; }
      .stand.stale { color: #e53935; font-weight:600; }
      .is-stale { opacity:.45; }
      .rtitle { font-size: calc(var(--s,1)*15px); font-weight:600; margin-bottom: calc(var(--s,1)*4px); white-space:nowrap; }
      .from { font-weight:400; color: var(--secondary-text-color); }
      [data-entity] { cursor:pointer; }
      small { font-size:.62em; font-weight:500; }

      /* --- Streckenband --- */
      .d-strip { flex:1; display:flex; flex-direction:column; justify-content:space-around; gap: calc(var(--s,1)*8px); }
      .bar { display:flex; height: calc(var(--s,1)*34px); border-radius: calc(var(--s,1)*8px); overflow:hidden; }
      .seg { flex-basis:0; min-width:0; display:flex; align-items:center; justify-content:center; white-space:nowrap;
             font-size: calc(var(--s,1)*17px); font-weight:700; border-right: calc(var(--s,1)*2px) solid var(--card-background-color, #fff); }
      .seg:last-child { border-right:none; }
      .labels { display:flex; margin-top: calc(var(--s,1)*3px); }
      .lab { flex-basis:0; min-width:0; text-align:right; padding-right: calc(var(--s,1)*3px); overflow:hidden; }
      .lname { font-size: calc(var(--s,1)*12.5px); font-weight:500; line-height:1.15; overflow-wrap:anywhere;
               display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .ltime { font-size: calc(var(--s,1)*11.5px); color: var(--secondary-text-color); white-space:nowrap; }
      .ltime b, .g-time b { color: var(--primary-text-color); }

      /* --- Liste --- */
      .d-list { flex:1; display:flex; gap: calc(var(--s,1)*20px); align-items:flex-start; }
      .d-list .route { flex:1 1 0; min-width:0; }
      .row { display:flex; align-items:center; gap: calc(var(--s,1)*8px); padding: calc(var(--s,1)*4px) 0;
             border-top: 1px solid var(--divider-color, rgba(127,127,127,.2)); }
      .sw { width: calc(var(--s,1)*6px); align-self:stretch; border-radius:3px; flex:none; }
      .info { flex:1; min-width:0; }
      .name { font-size: calc(var(--s,1)*14px); font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .det { font-size: calc(var(--s,1)*11.5px); color: var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .spd { font-size: calc(var(--s,1)*22px); font-weight:700; white-space:nowrap; }

      /* --- Tacho --- */
      .d-gauge { flex:1; display:flex; gap: calc(var(--s,1)*16px); align-items:flex-start; }
      .d-gauge .route { flex-basis:0; min-width:0; }
      .d-gauge .route + .route { border-left: 1px solid var(--divider-color, rgba(127,127,127,.25));
                                           padding-left: calc(var(--s,1)*14px); }
      .gs { display:flex; gap: calc(var(--s,1)*6px); }
      .g { flex:1 1 0; min-width:0; text-align:center; }
      .g svg { display:block; width:100%; height:auto; }
      .g-bg { fill:none; stroke: var(--divider-color, rgba(127,127,127,.25)); stroke-width:9; stroke-linecap:round; }
      .g-fg { fill:none; stroke-width:9; stroke-linecap:round; }
      .g-v { fill: var(--primary-text-color); font-size:20px; font-weight:700; text-anchor:middle; }
      .g-u { fill: var(--secondary-text-color); font-size:8px; text-anchor:middle; }
      .g-name { font-size: calc(var(--s,1)*12.5px); font-weight:500; line-height:1.15; overflow-wrap:anywhere;
                display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .g-time { font-size: calc(var(--s,1)*11.5px); color: var(--secondary-text-color); white-space:nowrap; }
    </style>`;
  }
}
