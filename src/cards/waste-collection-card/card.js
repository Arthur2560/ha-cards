import { BINS, DEFAULTS } from "./bins.js";
import { nextDate, relativeText } from "./dates.js";

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

/** Schwarz oder Weiß – je nachdem, was auf der Balkenfarbe besser lesbar ist. */
function textColorFor(c) {
  const lin = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  return L > 0.22 ? "#000" : "#fff";
}

const ROW = 56; // Höhe einer Rasterzeile im Sections-Dashboard (px)

export class WasteCollectionCard extends HTMLElement {
  static getStubConfig() {
    // Sensoren werden bewusst nicht geraten – Auswahl im visuellen Editor.
    return {};
  }

  // Im Sections-Dashboard setzt HA layout = "grid": dann richtet sich die Größe nach der Kachelhöhe.
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
    if (window.ResizeObserver && !this._ro) {
      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(this);
    }
    this._resize();
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    this._ro?.disconnect();
    this._ro = null;
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
      text: c[`${b.key}_text`] ?? b.text,
    }));
  }

  /**
   * Größen aus der Kachelhöhe ableiten: 1 Zeile = flach, 2–4 Zeilen = dickere Balken
   * und größere Schrift. Außerhalb des Rasters (Masonry) gilt die Höhe einer Zeile.
   */
  _resize() {
    const h = this.hasAttribute("grid") && this.clientHeight ? this.clientHeight : ROW;
    const w = this.clientWidth;
    if (h === this._h && w === this._w) return;
    this._h = h;
    this._w = w;
    const gap = Math.max(5, Math.round(h * 0.06)); // ~1 mm Abstand zur Oberkante
    const avail = h - gap - Math.max(4, Math.round(h * 0.04));
    const bar = Math.round(avail * 0.47);
    const dateArea = avail - bar;
    this.style.setProperty("--gap", `${gap}px`);
    this.style.setProperty("--bar", `${bar}px`);
    this.style.setProperty("--label", `${Math.round(bar * 0.62)}px`);
    this.style.setProperty("--date", `${Math.round(dateArea * 0.6)}px`);
    this.style.setProperty("--date-hl", `${Math.round(dateArea * 0.78)}px`);
    this._fitText();
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

    const body = bins.length
      ? `<div class="row">${bins
          .map((b) => {
            const texts = b.rel?.texts || [b.missing ? "Nicht gefunden" : "–"];
            const hl = b.rel && b.rel.days >= 0 && b.rel.days <= 1;
            return `<div class="bin ${hl ? "hl" : ""}" data-entity="${esc(b.entity)}" title="${esc(b.label)}">
              <div class="bar" style="background:${rgb(b.color)};color:${textColorFor(b.color)}">
                <span class="label fit" data-texts="${esc(JSON.stringify([b.text]))}">${esc(b.text)}</span>
              </div>
              <div class="date fit" data-texts="${esc(JSON.stringify(texts))}">${esc(texts[0])}</div>
            </div>`;
          })
          .join("")}</div>`
      : `<div class="hint">Bitte im visuellen Editor die Müll-Sensoren auswählen.</div>`;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        :host([grid]) { height:100%; }
        ha-card { height:100%; box-sizing:border-box; overflow:hidden; }
        .row { display:flex; height:100%; min-height:${ROW}px; box-sizing:border-box;
               padding: var(--gap, 5px) 4px 0; }
        .bin { flex:1 1 0; min-width:0; display:flex; flex-direction:column; align-items:stretch;
               cursor:pointer; padding: 0 5px; box-sizing:border-box; }
        .bar { height: var(--bar, 22px); flex:none; border-radius: min(calc(var(--bar, 22px) * 0.3), 14px);
               display:flex; align-items:center; justify-content:center; overflow:hidden;
               padding: 0 6px; box-sizing:border-box;
               box-shadow: inset 0 0 0 1px var(--divider-color, rgba(127,127,127,.35)); }
        .label { display:block; max-width:100%; white-space:nowrap; overflow:hidden;
                 font-size: var(--label, 14px); font-weight:600; line-height:1; }
        .date { display:block; margin:auto 0; text-align:center; white-space:nowrap; overflow:hidden;
                line-height:1.15; font-size: var(--date, 15px);
                color: var(--secondary-text-color); }
        .bin.hl .date { font-size: var(--date-hl, 19px); font-weight:700; color: var(--primary-text-color); }
        .hint { padding: 0 16px; display:flex; align-items:center; min-height:${ROW}px; color: var(--secondary-text-color); }
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

  /**
   * Einheitliche Schriftgrößen: alle Balkentexte gleich groß, alle Datumsangaben gleich groß
   * (Heute/Morgen größer). Pro Spalte wird die längste Textvariante gewählt, die bei dieser Größe passt.
   */
  _fitText() {
    cancelAnimationFrame(this._raf);
    this._raf = requestAnimationFrame(() => {
      const root = this.shadowRoot;
      if (!root) return;
      const fits = (el) => el.scrollWidth <= el.clientWidth + 0.5;
      const base = (el) => {
        el.style.fontSize = "";
        return parseFloat(getComputedStyle(el).fontSize);
      };
      // Größte Schrift ≤ start, bei der eine der Varianten passt -> [Größe, Variante]
      const fitOne = (el, texts, start) => {
        for (let size = start; size >= 9; size--) {
          el.style.fontSize = `${size}px`;
          for (const t of texts) {
            el.textContent = t;
            if (fits(el)) return [size, t];
          }
        }
        return [9, texts[texts.length - 1]];
      };
      const fitGroup = (els, max = Infinity) => {
        if (!els.length) return null;
        const start = Math.floor(Math.min(max, ...els.map(base)));
        const common = Math.min(...els.map((el) => fitOne(el, JSON.parse(el.dataset.texts), start)[0]));
        els.forEach((el) => fitOne(el, JSON.parse(el.dataset.texts), common));
        return common;
      };
      fitGroup([...root.querySelectorAll(".label")]);
      const normal = fitGroup([...root.querySelectorAll(".bin:not(.hl) .date")]);
      // Heute/Morgen hervorgehoben, aber höchstens 1,3× so groß wie die übrigen Angaben
      fitGroup([...root.querySelectorAll(".bin.hl .date")], normal ? Math.round(normal * 1.3) : Infinity);
    });
  }
}
