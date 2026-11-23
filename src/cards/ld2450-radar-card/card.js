import { TARGETS, DEFAULTS } from "./defaults.js";

const R = 100; // Radius des Radars in SVG-Einheiten
const NS = "http://www.w3.org/2000/svg";
const UNAVAILABLE = ["unavailable", "unknown", "", undefined, null];

const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const fmt = (n, d = 1) => n.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Wert eines Längen-Sensors in Metern (mm/cm/m werden erkannt, Standard mm). */
function toMeters(st) {
  if (!st || UNAVAILABLE.includes(st.state)) return null;
  const v = parseFloat(st.state);
  if (Number.isNaN(v)) return null;
  const u = (st.attributes?.unit_of_measurement || "mm").toLowerCase();
  if (u === "m") return v;
  if (u === "cm") return v / 100;
  return v / 1000;
}

/** Geschwindigkeit in m/s (mm/s, cm/s, m/s, km/h). */
function toMps(st) {
  if (!st || UNAVAILABLE.includes(st.state)) return null;
  const v = parseFloat(st.state);
  if (Number.isNaN(v)) return null;
  const u = (st.attributes?.unit_of_measurement || "mm/s").toLowerCase();
  if (u === "m/s") return v;
  if (u === "cm/s") return v / 100;
  if (u === "km/h") return v / 3.6;
  return v / 1000;
}

const polar = (deg, r) => {
  const a = (deg * Math.PI) / 180;
  return [r * Math.sin(a), -r * Math.cos(a)];
};

export class Ld2450RadarCard extends HTMLElement {
  static getStubConfig() {
    // Entitäten werden bewusst NICHT geraten – Auswahl im visuellen Editor.
    return { title: "Radar" };
  }

  setConfig(config) {
    this._config = { ...DEFAULTS, ...config };
    this._trails = { 1: [], 2: [], 3: [] };
    this._sig = null;
    this._build();
    this._update();
  }

  set hass(hass) {
    this._hass = hass;
    const sig = this._entities()
      .map((e) => hass.states[e]?.state)
      .join("|");
    if (sig !== this._sig) {
      this._sig = sig;
      this._update();
    }
  }

  getCardSize() {
    return 5;
  }

  getGridOptions() {
    return { columns: 12, rows: 5, min_columns: 6, min_rows: 3 };
  }

  _entities() {
    const c = this._config || {};
    return [
      ...TARGETS.flatMap((i) => [c[`target${i}_x`], c[`target${i}_y`], c[`target${i}_speed`]]),
      c.presence_entity,
      c.target_count_entity,
    ].filter(Boolean);
  }

  _configuredTargets() {
    return TARGETS.filter((i) => this._config[`target${i}_x`] && this._config[`target${i}_y`]);
  }

  // ---------- statischer Aufbau (nur bei setConfig) ----------
  _build() {
    const c = this._config;
    const fov = Math.min(180, Math.max(30, Number(c.fov) || 120));
    const half = fov / 2;
    const range = Math.max(0.5, Number(c.max_range) || 6);
    const pad = 12;
    const w = R * Math.sin((half * Math.PI) / 180);
    const yTop = -R - pad;
    const yBottom = fov > 180 ? R : Math.max(0, -R * Math.cos((half * Math.PI) / 180)) + 8;
    this._range = range;

    const [lx, ly] = polar(-half, R);
    const [rx, ry] = polar(half, R);
    const sector = `M0,0 L${lx},${ly} A${R},${R} 0 0 1 ${rx},${ry} Z`;

    // Entfernungsringe (jeder Meter, bei großer Reichweite jeder 2. Meter)
    const step = range > 6 ? 2 : 1;
    let rings = "";
    for (let d = step; d <= range + 1e-6; d += step) {
      const r = (d / range) * R;
      const [ax, ay] = polar(-half, r);
      const [bx, by] = polar(half, r);
      rings += `<path class="ring" d="M${ax},${ay} A${r},${r} 0 0 1 ${bx},${by}"/>`;
      if (Math.abs(d - range) < 1e-6) continue;
      const [tx, ty] = polar(half, r);
      rings += `<text class="lbl" x="${tx + 2}" y="${ty + 1}" text-anchor="start">${fmt(d, 0)} m</text>`;
    }

    // Winkellinien alle 30° (plus Rand)
    const angles = new Set([-half, half]);
    for (let a = -90; a <= 90; a += 30) if (Math.abs(a) < half) angles.add(a);
    let spokes = "";
    for (const a of [...angles].sort((x, y) => x - y)) {
      const [sx, sy] = polar(a, R);
      spokes += `<line class="spoke" x1="0" y1="0" x2="${sx}" y2="${sy}"/>`;
      const [tx, ty] = polar(a, R + 6);
      spokes += `<text class="lbl" x="${tx}" y="${ty + 1.5}" text-anchor="middle">${Math.round(a)}°</text>`;
    }

    const targets = TARGETS.map(
      (i) => `<g class="target" id="t${i}" style="--c:${rgb(c[`target${i}_color`])}">
        <g class="trail"></g>
        <g class="dot"><circle class="halo" r="6"/><circle class="core" r="2.6"/></g>
      </g>`
    ).join("");

    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card { overflow: hidden; }
        .head { display:flex; align-items:center; justify-content:space-between; padding:12px 16px 0; gap:8px; }
        .title { font-size: 1.2em; font-weight: 500; color: var(--primary-text-color); }
        .chips { display:flex; gap:6px; flex-wrap:wrap; }
        .chip { font-size: .8em; padding: 2px 8px; border-radius: 10px;
                background: var(--secondary-background-color, rgba(127,127,127,.15)); color: var(--secondary-text-color); }
        .chip.on { background: rgba(3,169,244,.2); background: color-mix(in srgb, var(--primary-color) 20%, transparent); color: var(--primary-text-color); }
        svg { display:block; width:100%; height:auto; padding: 4px 8px 0; box-sizing:border-box; }
        .bg { fill: var(--secondary-background-color, rgba(127,127,127,.08)); stroke: var(--divider-color, rgba(127,127,127,.4)); stroke-width: .6; }
        .ring { fill:none; stroke: var(--divider-color, rgba(127,127,127,.4)); stroke-width:.35; stroke-dasharray: 1.5 1.5; }
        .spoke { stroke: var(--divider-color, rgba(127,127,127,.4)); stroke-width:.3; }
        .lbl { fill: var(--secondary-text-color); font-size: 4.2px; font-family: var(--paper-font-body1_-_font-family, sans-serif); }
        .sensor { fill: var(--primary-color); }
        .target { display:none; }
        .target.on { display:inline; }
        .dot { transition: transform .45s ease-out; }
        .core { fill: var(--c); stroke: #fff; stroke-width: .6; }
        .halo { fill: var(--c); opacity:.25; }
        .trail circle { fill: var(--c); }
        .info { display:flex; flex-wrap:wrap; gap: 4px 16px; padding: 4px 16px 12px; font-size:.9em; color: var(--primary-text-color); }
        .info .i { display:flex; align-items:center; gap:6px; }
        .info .b { width:10px; height:10px; border-radius:50%; flex:none; }
        .hint { padding: 0 16px 12px; color: var(--secondary-text-color); }
        .empty { color: var(--secondary-text-color); }
      </style>
      <ha-card>
        <div class="head" ${c.title || c.presence_entity || c.target_count_entity ? "" : 'style="display:none"'}>
          <div class="title">${c.title ? esc(c.title) : ""}</div>
          <div class="chips"></div>
        </div>
        <svg viewBox="${-w - pad} ${yTop} ${2 * (w + pad)} ${yBottom - yTop}">
          <defs>
            <clipPath id="clip"><path d="${sector}"/></clipPath>
          </defs>
          <path class="bg" d="${sector}"/>
          ${rings}${spokes}
          <g class="targets" clip-path="url(#clip)">${targets}</g>
          <circle class="sensor" r="2.2"/>
        </svg>
        <div class="info"></div>
        <div class="hint"></div>
      </ha-card>`;
  }

  // ---------- dynamische Aktualisierung (bei Zustandsänderungen) ----------
  _update() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    const c = this._config;
    const st = this._hass.states;
    const root = this.shadowRoot;
    const configured = this._configuredTargets();
    const trailLen = Math.max(0, Math.round(Number(c.trail) || 0));
    const info = [];

    for (const i of TARGETS) {
      const g = root.getElementById(`t${i}`);
      const x = configured.includes(i) ? toMeters(st[c[`target${i}_x`]]) : null;
      const y = configured.includes(i) ? toMeters(st[c[`target${i}_y`]]) : null;
      // LD2450 meldet 0/0, wenn kein Ziel erkannt wird.
      const active = x !== null && y !== null && !(x === 0 && y === 0) && y > 0;
      g.classList.toggle("on", active);
      if (!active) {
        this._trails[i] = [];
        g.querySelector(".trail").replaceChildren();
        continue;
      }
      const sx = ((c.mirror ? -x : x) / this._range) * R;
      const sy = -(y / this._range) * R;
      const dot = g.querySelector(".dot");
      dot.style.transform = `translate(${sx}px, ${sy}px)`;

      // Spur
      const trail = this._trails[i];
      const last = trail[trail.length - 1];
      if (!last || last[0] !== sx || last[1] !== sy) trail.push([sx, sy]);
      while (trail.length > trailLen + 1) trail.shift();
      const tg = g.querySelector(".trail");
      tg.replaceChildren(
        ...trail.slice(0, -1).map(([px, py], k, arr) => {
          const el = document.createElementNS(NS, "circle");
          el.setAttribute("cx", px);
          el.setAttribute("cy", py);
          el.setAttribute("r", 0.8 + (1.2 * (k + 1)) / arr.length);
          el.setAttribute("opacity", ((0.5 * (k + 1)) / arr.length).toFixed(2));
          return el;
        })
      );

      const dist = Math.hypot(x, y);
      const angle = (Math.atan2(c.mirror ? -x : x, y) * 180) / Math.PI;
      const v = c[`target${i}_speed`] ? toMps(st[c[`target${i}_speed`]]) : null;
      info.push(
        `<div class="i"><span class="b" style="background:${rgb(c[`target${i}_color`])}"></span>
          Ziel ${i}: ${fmt(dist, 2)} m · ${fmt(angle, 0)}°${v !== null ? ` · ${fmt(Math.abs(v), 2)} m/s` : ""}</div>`
      );
    }

    // Info-Zeile
    const infoEl = root.querySelector(".info");
    infoEl.style.display = c.show_info && configured.length ? "" : "none";
    infoEl.innerHTML = info.length ? info.join("") : `<div class="empty">Keine Person erkannt</div>`;

    // Status-Chips
    const chips = [];
    if (c.presence_entity) {
      const on = st[c.presence_entity]?.state === "on";
      chips.push(`<span class="chip ${on ? "on" : ""}">${on ? "Anwesend" : "Frei"}</span>`);
    }
    if (c.target_count_entity) {
      const n = st[c.target_count_entity]?.state;
      if (!UNAVAILABLE.includes(n)) chips.push(`<span class="chip">${esc(n)} ${n === "1" ? "Person" : "Personen"}</span>`);
    }
    root.querySelector(".chips").innerHTML = chips.join("");

    // Hinweis bei fehlender Konfiguration
    root.querySelector(".hint").textContent = configured.length
      ? ""
      : "Bitte im visuellen Editor für mindestens ein Ziel die Koordinaten X und Y auswählen.";
    root.querySelector(".hint").style.display = configured.length ? "none" : "";
  }
}
