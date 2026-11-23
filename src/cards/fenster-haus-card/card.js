import { VIEWBOX, WALL, TEXT, OUTLINES, ZONES, OPEN } from "./geometry.js";

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export class FensterHausCard extends HTMLElement {
  static getStubConfig() {
    return { zones: {} };
  }

  setConfig(config) {
    this._config = { zones: {}, ...config };
    this._sig = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    // Nur neu zeichnen, wenn sich der Offen-Zustand eines Raums ändert.
    const sig = this._open().join();
    if (sig !== this._sig) {
      this._sig = sig;
      this._render();
    }
  }

  getCardSize() {
    return 6;
  }

  getGridOptions() {
    return { columns: 12, rows: 6, min_columns: 6 };
  }

  _open() {
    const z = this._config?.zones || {};
    return Object.keys(ZONES).filter((k) =>
      (z[k] || []).some((e) => OPEN.includes(this._hass?.states[e]?.state))
    );
  }

  _render() {
    if (!this._config) return;
    const open = this._open();
    const z = this._config.zones || {};
    const configured = Object.values(z).some((l) => l?.length);
    const zones = Object.entries(ZONES)
      .map(([k, p]) => `<path class="z ${open.includes(k) ? "open" : ""}" data-z="${k}" d="${p}"/>`)
      .join("");
    this.innerHTML = `<ha-card${this._config.title ? ` header="${esc(this._config.title)}"` : ""}>
      <style>
        fenster-haus-card svg{display:block;width:100%;height:auto;padding:8px;box-sizing:border-box}
        fenster-haus-card .w{fill:var(--primary-text-color)}
        fenster-haus-card .o{fill:none;stroke:var(--primary-text-color);stroke-width:.2}
        fenster-haus-card .z{fill:transparent;stroke:none;cursor:pointer}
        fenster-haus-card .z.open{fill:#ff3b30;fill-opacity:.3;stroke:#ff3b30;stroke-width:.6;animation:fh-p 2.4s ease-in-out infinite}
        fenster-haus-card .hint{padding:0 16px 12px;color:var(--secondary-text-color)}
        @keyframes fh-p{50%{fill-opacity:.55}}
      </style>
      <svg viewBox="${VIEWBOX}">
        <path class="o" d="${OUTLINES}"/>
        <path class="w" fill-rule="evenodd" d="${WALL}"/>
        <path class="w" fill-rule="evenodd" d="${TEXT}"/>
        ${zones}
      </svg>
      ${configured ? "" : `<div class="hint">Bitte im visuellen Editor den Räumen Fensterkontakte zuordnen.</div>`}
    </ha-card>`;
    this.querySelectorAll(".z").forEach((el) =>
      el.addEventListener("click", () => {
        const ids = z[el.dataset.z] || [];
        const id = ids.find((e) => OPEN.includes(this._hass?.states[e]?.state)) || ids[0];
        if (id)
          this.dispatchEvent(
            new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true })
          );
      })
    );
  }
}
