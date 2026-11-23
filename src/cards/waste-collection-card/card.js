import { BINS, DEFAULTS } from "./bins.js";
import { nextDate, relativeText } from "./dates.js";

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
const num = (v, d) => (v == null || v === "" || Number.isNaN(+v) ? d : +v);

export class WasteCollectionCard extends HTMLElement {
  static getStubConfig() {
    // Sensoren werden bewusst nicht geraten – Auswahl im visuellen Editor.
    return {};
  }

  setConfig(config) {
    this._config = { ...DEFAULTS, ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const sig = this._bins()
      .map((b) => hass.states[b.entity])
      .map((s) => (s ? s.last_updated + s.state : "-"))
      .join("|");
    if (sig !== this._sig) {
      this._sig = sig;
      this._render();
    }
  }

  connectedCallback() {
    // Datumstexte ändern sich um Mitternacht – regelmäßig neu berechnen
    this._timer = setInterval(() => this._render(), 5 * 60 * 1000);
    this._ro = new ResizeObserver(() => this._fitText());
    this._ro.observe(this);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    this._ro?.disconnect();
  }

  getCardSize() {
    return 1;
  }

  getGridOptions() {
    return { columns: 12, rows: 1, min_columns: 6, min_rows: 1 };
  }

  _bins() {
    const c = this._config || {};
    return BINS.filter((b) => c[`${b.key}_entity`]).map((b) => ({
      ...b,
      entity: c[`${b.key}_entity`],
      color: c[`${b.key}_color`] || b.color,
    }));
  }

  _render() {
    if (!this._config || !this._hass) return;
    const c = this._config;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const now = new Date();

    let bins = this._bins().map((b) => {
      const st = this._hass.states[b.entity];
      const rel = relativeText(nextDate(st, now), now);
      return { ...b, rel, missing: !st };
    });
    if (c.sort_by_date) {
      bins = [...bins].sort((a, b) => (a.rel?.days ?? 999) - (b.rel?.days ?? 999));
    }

    const w = num(c.stripe_width, DEFAULTS.stripe_width);
    const h = num(c.stripe_height, DEFAULTS.stripe_height);

    const body = bins.length
      ? `<div class="row">${bins
          .map((b) => {
            const texts = b.rel?.texts || [b.missing ? "Nicht gefunden" : "–"];
            const hl = b.rel && b.rel.days >= 0 && b.rel.days <= 1;
            return `<div class="bin ${hl ? "hl" : ""}" data-entity="${esc(b.entity)}" title="${esc(b.label)}">
              <div class="stripe" style="background:${rgb(b.color)}"></div>
              <div class="txt" data-texts="${esc(JSON.stringify(texts))}">${esc(texts[0])}</div>
            </div>`;
          })
          .join("")}</div>`
      : `<div class="hint">Bitte im visuellen Editor die Müll-Sensoren auswählen.</div>`;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; height:100%; }
        ha-card { height:100%; box-sizing:border-box; overflow:hidden; }
        .row { display:flex; height:100%; min-height:56px; box-sizing:border-box; }
        .bin { flex:1; min-width:0; display:flex; flex-direction:column; align-items:center;
               cursor:pointer; padding: 0 4px 6px; box-sizing:border-box; }
        .stripe { width:${w}px; max-width:90%; height:${h}px; flex:none; border-radius: 0 0 4px 4px;
                  box-shadow: inset 0 0 0 1px var(--divider-color, rgba(127,127,127,.35)); }
        .txt { display:block; margin:auto 0; width:100%; text-align:center; line-height:1.2;
               white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
               font-size:16px; color: var(--secondary-text-color); }
        .bin.hl .txt { font-size:20px; font-weight:700; color: var(--primary-text-color); }
        .hint { padding: 0 16px; display:flex; align-items:center; min-height:56px; color: var(--secondary-text-color); }
      </style>
      <ha-card>${body}</ha-card>`;

    this.shadowRoot.querySelectorAll(".bin").forEach((el) =>
      el.addEventListener("click", () =>
        this.dispatchEvent(
          new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.entity }, bubbles: true, composed: true })
        )
      )
    );
    this._fitText();
  }

  /** Nimmt die längste Textvariante, die passt; sonst Schrift leicht verkleinern. */
  _fitText() {
    cancelAnimationFrame(this._raf);
    this._raf = requestAnimationFrame(() => {
      this.shadowRoot?.querySelectorAll(".txt").forEach((el) => {
        const texts = JSON.parse(el.dataset.texts || "[]");
        el.style.fontSize = "";
        const fits = () => el.scrollWidth <= el.clientWidth + 0.5;
        for (const t of texts) {
          el.textContent = t;
          if (fits()) return;
        }
        let size = parseFloat(getComputedStyle(el).fontSize);
        while (size > 11 && !fits()) el.style.fontSize = `${--size}px`;
      });
    });
  }
}
