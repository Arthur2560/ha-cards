import { VIEWBOX, WALL, OUTLINES, OPEN } from "../fenster-haus-card/geometry.js";
import { ZONES, BOXES, DEFAULT_TEXT, PERSONS, PERSON_COLORS, ICON_LOCK, ICON_LOCK_OPEN } from "./rooms.js";

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
const UNAVAILABLE = ["unavailable", "unknown", undefined];

/** "locked" | "open" | "unknown" */
function lockState(st) {
  if (!st || UNAVAILABLE.includes(st.state)) return "unknown";
  const domain = st.entity_id.split(".")[0];
  if (domain === "lock") return st.state === "locked" ? "locked" : "open";
  if (domain === "input_boolean") return st.state === "on" ? "locked" : "open"; // an = abgeschlossen
  return st.state === "off" ? "locked" : "open"; // binary_sensor (Schloss/Tür): an = offen
}

export class FensterHausTestCard extends HTMLElement {
  static getStubConfig() {
    return { zones: {} };
  }

  set layout(value) {
    this._layout = value;
    this.toggleAttribute("grid", value === "grid");
  }

  get layout() {
    return this._layout;
  }

  setConfig(config) {
    this._config = { zones: {}, ...config };
    this._sig = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const sig = this._entities()
      .map((e) => hass.states[e]?.state)
      .join("|");
    if (sig !== this._sig) {
      this._sig = sig;
      this._render();
    }
  }

  getCardSize() {
    return 6;
  }

  getGridOptions() {
    return { columns: 12, rows: 6, min_columns: 3, min_rows: 2 };
  }

  _entities() {
    const c = this._config || {};
    const list = [];
    for (const z of Object.keys(ZONES)) {
      list.push(...(c.zones?.[z] || []), c[`${z}_presence`], c[`${z}_temperature`], c[`${z}_lock`]);
    }
    for (const i of PERSONS) list.push(c[`person${i}_entity`]);
    return list.filter(Boolean);
  }

  _state(id) {
    return id ? this._hass?.states[id] : undefined;
  }

  _openZones() {
    const z = this._config?.zones || {};
    return Object.keys(ZONES).filter((k) => (z[k] || []).some((e) => OPEN.includes(this._state(e)?.state)));
  }

  /** Personen, deren Raum-Entität auf diesen Raum zeigt */
  _personsIn(zone) {
    const c = this._config;
    const names = [zone, ...String(c[`${zone}_area`] || "").split(",")]
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    return PERSONS.filter((i) => {
      const st = this._state(c[`person${i}_entity`]);
      return st && names.includes(String(st.state).trim().toLowerCase());
    });
  }

  _room(z) {
    const c = this._config;
    const b = BOXES[z];
    const textRaw = c[`${z}_text`] ?? DEFAULT_TEXT[z];
    const label = textRaw === "-" ? "" : textRaw;
    const lockId = c[`${z}_lock`];
    const presenceId = c[`${z}_presence`];
    const tempId = c[`${z}_temperature`];
    const extrasConfigured = !!(presenceId || tempId || c[`${z}_area`]);
    let out = "";

    // Schloss in der linken Raumhälfte
    let cx = b.x + b.w / 2;
    if (lockId) {
      const ls = lockState(this._state(lockId));
      const size = Math.min(6.5, b.h * 0.5);
      const lx = b.x + b.w * 0.2 - size / 2;
      const ly = b.y + b.h / 2 - size / 2;
      out += `<g class="lock ${ls}" data-entity="${esc(lockId)}" transform="translate(${lx.toFixed(2)},${ly.toFixed(2)}) scale(${(size / 24).toFixed(4)})">
        <rect class="hit" x="0" y="0" width="24" height="24"/>
        <path d="${ls === "open" ? ICON_LOCK_OPEN : ICON_LOCK}"/>
      </g>`;
      cx = b.x + b.w * 0.6;
    }

    // Beschriftung: mittig – oder etwas höher, wenn darunter Präsenz/Temperatur Platz brauchen
    const rowY = extrasConfigured ? (label ? b.y + b.h * 0.72 : b.y + b.h / 2) : null;
    if (label) {
      const ly = extrasConfigured ? b.y + b.h * 0.36 : b.y + b.h / 2;
      const fs = extrasConfigured ? 4.0 : 4.6;
      out += `<text class="label" x="${cx.toFixed(2)}" y="${ly.toFixed(2)}" dy="0.35em" font-size="${fs}">${esc(label)}</text>`;
    }

    // Präsenz / Personen / Temperatur in einer Zeile darunter
    if (rowY != null) {
      const persons = this._personsIn(z);
      const presence = this._state(presenceId)?.state === "on";
      const dots = persons.map((i) => rgb(c[`person${i}_color`] || PERSON_COLORS[i]));
      if (!dots.length && presence) dots.push(null); // neutraler Punkt
      const t = this._state(tempId);
      const tv = t && !UNAVAILABLE.includes(t.state) && !Number.isNaN(+t.state) ? +t.state : null;
      const tempText =
        tv != null ? `${tv.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}°` : null;

      const r = 1.4;
      const gap = 0.8;
      const dotsW = dots.length ? dots.length * 2 * r + (dots.length - 1) * gap : 0;
      const tempFs = 3.4;
      const tempW = tempText ? tempText.length * tempFs * 0.55 : 0;
      const total = dotsW + (dots.length && tempText ? 1.6 : 0) + tempW;
      let x = cx - total / 2;
      dots.forEach((col) => {
        out += `<circle class="dot ${col ? "" : "neutral"}" cx="${(x + r).toFixed(2)}" cy="${rowY.toFixed(2)}" r="${r}"${
          col ? ` style="fill:${col}"` : ""
        }/>`;
        x += 2 * r + gap;
      });
      if (tempText) {
        if (dots.length) x += 1.6 - gap;
        out += `<text class="temp" data-entity="${esc(tempId)}" x="${(x + tempW / 2).toFixed(2)}" y="${rowY.toFixed(
          2
        )}" dy="0.35em" font-size="${tempFs}">${esc(tempText)}</text>`;
      }
    }
    return out;
  }

  _render() {
    if (!this._config) return;
    const c = this._config;
    const open = this._openZones();
    const configured = Object.values(c.zones || {}).some((l) => l?.length);
    const zones = Object.entries(ZONES)
      .map(([k, p]) => `<path class="z ${open.includes(k) ? "open" : ""}" data-z="${k}" d="${p}"/>`)
      .join("");
    const rooms = this._hass ? Object.keys(ZONES).map((z) => this._room(z)).join("") : "";

    this.innerHTML = `<ha-card${c.title ? ` header="${esc(c.title)}"` : ""}>
      <style>
        fenster-haus-test-card{display:block}
        fenster-haus-test-card svg{display:block;width:100%;height:auto;padding:8px;box-sizing:border-box}
        fenster-haus-test-card[grid]{height:100%}
        fenster-haus-test-card[grid] ha-card{height:100%;display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box}
        fenster-haus-test-card[grid] svg{flex:1 1 0;min-height:0;height:100%}
        fenster-haus-test-card .w{fill:var(--primary-text-color)}
        fenster-haus-test-card .o{fill:none;stroke:var(--primary-text-color);stroke-width:.2}
        fenster-haus-test-card .z{fill:transparent;stroke:none;cursor:pointer}
        fenster-haus-test-card .z.open{fill:#ff3b30;fill-opacity:.3;stroke:#ff3b30;stroke-width:.6;animation:fht-p 2.4s ease-in-out infinite}
        fenster-haus-test-card .label{fill:var(--primary-text-color);text-anchor:middle;pointer-events:none;
          font-family:var(--ha-font-family-body, Roboto, "Helvetica Neue", Arial, sans-serif)}
        fenster-haus-test-card .temp{fill:var(--primary-text-color);text-anchor:middle;cursor:pointer;font-weight:500;
          font-family:var(--ha-font-family-body, Roboto, "Helvetica Neue", Arial, sans-serif)}
        fenster-haus-test-card .dot{pointer-events:none;stroke:var(--card-background-color, #fff);stroke-width:.3}
        fenster-haus-test-card .dot.neutral{fill:var(--primary-text-color);opacity:.85}
        fenster-haus-test-card .lock{cursor:pointer}
        fenster-haus-test-card .lock .hit{fill:transparent}
        fenster-haus-test-card .lock.locked path{fill:var(--secondary-text-color)}
        fenster-haus-test-card .lock.unknown path{fill:var(--secondary-text-color);opacity:.35}
        fenster-haus-test-card .lock.open path{fill:#ff3b30;animation:fht-l 1.6s ease-in-out infinite}
        fenster-haus-test-card .hint{padding:0 16px 12px;color:var(--secondary-text-color)}
        @keyframes fht-p{50%{fill-opacity:.55}}
        @keyframes fht-l{50%{opacity:.35}}
      </style>
      <svg viewBox="${VIEWBOX}">
        <path class="o" d="${OUTLINES}"/>
        <path class="w" fill-rule="evenodd" d="${WALL}"/>
        ${zones}
        ${rooms}
      </svg>
      ${configured ? "" : `<div class="hint">Bitte im visuellen Editor den Räumen Fensterkontakte zuordnen.</div>`}
    </ha-card>`;

    const moreInfo = (id) =>
      id &&
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
    this.querySelectorAll(".z").forEach((el) =>
      el.addEventListener("click", () => {
        const ids = c.zones?.[el.dataset.z] || [];
        moreInfo(ids.find((e) => OPEN.includes(this._state(e)?.state)) || ids[0]);
      })
    );
    this.querySelectorAll("[data-entity]").forEach((el) => el.addEventListener("click", () => moreInfo(el.dataset.entity)));
  }
}
