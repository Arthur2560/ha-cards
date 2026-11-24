import { summarize, DEFAULTS } from "./summary.js";

const COLORS = {
  sunny: "#f9b800",
  "clear-night": "#8fa6d6",
  partlycloudy: "#f9b800",
  cloudy: "var(--secondary-text-color)",
  fog: "var(--secondary-text-color)",
  rain: "#3d8bfd",
  snow: "#7fc4e8",
  sleet: "#5fa0d8",
  hail: "#7fb3d5",
  thunder: "#9b72cf",
  wind: "#26a69a",
  none: "var(--secondary-text-color)",
};

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const num = (v) => (v == null || v === "" || Number.isNaN(+v) ? null : +v);
const deg = (v) => (v == null ? "–" : `${Math.round(v)}°`.replace("-", "−"));

export class WeatherTodayCard extends HTMLElement {
  static getStubConfig() {
    // Wetter-Entität wird bewusst nicht geraten – Auswahl im visuellen Editor.
    return {};
  }

  constructor() {
    super();
    this._fc = { hourly: null, daily: null };
    this._unsubs = [];
  }

  setConfig(config) {
    const old = this._config?.weather_entity;
    this._config = { ...DEFAULTS, ...config };
    if (old !== this._config.weather_entity) this._resubscribe();
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    const c = this._config || {};
    const w = hass.states[c.weather_entity];
    const t = hass.states[c.temperature_entity];
    if (first || w !== this._lastW || t !== this._lastT) {
      this._lastW = w;
      this._lastT = t;
      this._render();
    }
    if (!this._subscribedTo) this._resubscribe();
  }

  connectedCallback() {
    if (!this._subscribedTo) this._resubscribe();
    // Kartenbreite als CSS-Variable (--w) – ersetzt Container-Queries, die ältere
    // Safari-Versionen (iPadOS ≤ 15, z. B. iPad Air 2) nicht kennen.
    if (window.ResizeObserver && !this._ro) {
      this._ro = new ResizeObserver(() => this._updateWidth());
      this._ro.observe(this);
    }
    this._updateWidth();
    // Zeitfenster wandert mit – jede Minute neu zusammenfassen
    this._timer = setInterval(() => this._render(), 60 * 1000);
  }

  disconnectedCallback() {
    this._ro?.disconnect();
    this._ro = null;
    this._unsubscribe();
    clearInterval(this._timer);
  }

  getCardSize() {
    return 2;
  }

  getGridOptions() {
    return { columns: 12, rows: 2, min_columns: 6, min_rows: 2 };
  }

  // ---------- Vorhersage abonnieren (wie die HA-eigene Wetterkarte) ----------
  _unsubscribe() {
    this._unsubs.forEach((p) => p.then((u) => u && u()).catch(() => {}));
    this._unsubs = [];
    this._subscribedTo = null;
  }

  _resubscribe() {
    this._unsubscribe();
    this._fc = { hourly: null, daily: null };
    const entity = this._config?.weather_entity;
    if (!this._hass?.connection || !entity || !this.isConnected) return;
    this._subscribedTo = entity;
    for (const type of ["hourly", "daily"]) {
      const p = this._hass.connection.subscribeMessage(
        (ev) => {
          this._fc[type] = ev.forecast || [];
          this._render();
        },
        { type: "weather/subscribe_forecast", forecast_type: type, entity_id: entity }
      );
      p.catch(() => {}); // Anbieter unterstützt diesen Typ nicht
      this._unsubs.push(p);
    }
  }

  // ---------- Darstellung ----------
  _render() {
    if (!this._config || !this._hass) return;
    const c = this._config;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });

    const w = this._hass.states[c.weather_entity];
    if (!c.weather_entity || !w) {
      this.shadowRoot.innerHTML = `${this._style()}<ha-card><div class="hint">${
        c.weather_entity
          ? `Wetter-Entität „${esc(c.weather_entity)}“ nicht gefunden.`
          : "Bitte im visuellen Editor eine Wetter-Entität auswählen."
      }</div></ha-card>`;
      return;
    }

    const now = new Date();
    const hourly = this._fc.hourly?.length
      ? this._fc.hourly
      : w.attributes.forecast?.length && w.attributes.forecast[1] &&
          new Date(w.attributes.forecast[1].datetime) - new Date(w.attributes.forecast[0].datetime) <= 3600e3
        ? w.attributes.forecast
        : [{ datetime: now.toISOString(), condition: w.state, temperature: w.attributes.temperature, wind_speed: w.attributes.wind_speed }];

    // Tag (day_start–night_start): von jetzt bis day_end auswerten.
    // Nacht (night_start–day_start): von jetzt bis zum nächsten Morgen (day_start) auswerten.
    const hourOf = (v, d) => Math.min(24, Math.max(0, num(v) ?? d));
    const dayStart = hourOf(c.day_start, DEFAULTS.day_start);
    const dayEnd = hourOf(c.day_end, DEFAULTS.day_end);
    const nightStart = hourOf(c.night_start, DEFAULTS.night_start);
    const hNow = now.getHours() + now.getMinutes() / 60;
    const night = hNow >= nightStart || hNow < dayStart;
    const at = (dayOffset, hour) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
      d.setMinutes(Math.round(hour * 60));
      return d;
    };
    const until = night ? at(hNow >= nightStart ? 1 : 0, dayStart) : at(0, Math.max(dayEnd, hNow + 1));

    const s = summarize(hourly, {
      until,
      wind_threshold: num(c.wind_threshold) ?? DEFAULTS.wind_threshold,
      strong_wind_threshold: num(c.strong_wind_threshold) ?? DEFAULTS.strong_wind_threshold,
      precipitation_probability: num(c.precipitation_probability) ?? DEFAULTS.precipitation_probability,
      windUnit: w.attributes.wind_speed_unit,
      now,
    });

    // Tagestemperatur: tägliche Vorhersage für heute, sonst Max. der Stunden
    const daily = this._fc.daily || [];
    const today = daily.find((f) => new Date(f.datetime).toDateString() === now.toDateString()) || daily[0];
    const high = num(today?.temperature) ?? s.maxTemp;
    const low = num(today?.templow) ?? s.minTemp;

    // Aktuelle Temperatur
    const tState = this._hass.states[c.temperature_entity];
    const current = num(tState?.state) ?? num(w.attributes.temperature);

    // Nachtansicht: Tiefsttemperatur bis zum Morgen, Icon in Nacht-Variante
    let icon = s.icon || "mdi:weather-cloudy";
    let lines = s.lines.length ? s.lines : ["–"];
    let title = c.title || DEFAULTS.title;
    let frost = false;
    let tomorrow = null;
    if (night) {
      title = c.night_title || DEFAULTS.night_title;
      const nightLow = s.minTemp ?? low;
      frost = nightLow != null && nightLow <= 0;
      lines = [`Tiefst ${deg(nightLow)}`];
      icon =
        {
          "mdi:weather-sunny": "mdi:weather-night",
          "mdi:weather-partly-cloudy": "mdi:weather-night-partly-cloudy",
          // "teilweise"-Icons enthalten eine Sonne -> nachts die Variante ohne Sonne
          "mdi:weather-partly-rainy": "mdi:weather-rainy",
          "mdi:weather-partly-snowy": "mdi:weather-snowy",
          "mdi:weather-partly-snowy-rainy": "mdi:weather-snowy-rainy",
          "mdi:weather-partly-lightning": "mdi:weather-lightning-rainy",
        }[icon] || icon;

      // Rechts klein: Wetter für morgen (day_start bis day_end) als Icon
      const opts = {
        wind_threshold: num(c.wind_threshold) ?? DEFAULTS.wind_threshold,
        strong_wind_threshold: num(c.strong_wind_threshold) ?? DEFAULTS.strong_wind_threshold,
        precipitation_probability: num(c.precipitation_probability) ?? DEFAULTS.precipitation_probability,
        windUnit: w.attributes.wind_speed_unit,
      };
      const tStart = until; // nächster Morgen, day_start
      const tEnd = new Date(tStart.getFullYear(), tStart.getMonth(), tStart.getDate());
      tEnd.setMinutes(Math.round(Math.max(dayEnd, dayStart + 1) * 60));
      let t = summarize(hourly, { ...opts, now: tStart, until: tEnd });
      if (!t.icon) {
        // Keine Stundenwerte für morgen -> Tagesvorhersage verwenden
        const d = daily.find((f) => new Date(f.datetime).toDateString() === tStart.toDateString());
        if (d) t = summarize([{ ...d, datetime: tStart.toISOString() }], { ...opts, now: tStart, until: tEnd });
      }
      tomorrow = t.icon ? t : null;
    }

    this.shadowRoot.innerHTML = `${this._style()}
      <ha-card>
        <div class="wrap">
          <ha-icon class="icon" icon="${icon}" style="color:${
            night && (s.kind === "sunny" || s.kind === "clear-night") ? COLORS["clear-night"] : COLORS[s.kind] || COLORS.none
          }"></ha-icon>
          <div class="mid">
            <div class="title">${esc(title)}:</div>
            <div class="lines ${lines.length > 1 ? "two" : ""} ${frost ? "frost" : ""}">
              ${lines.map((l) => `<div>${esc(l)}</div>`).join("")}
            </div>
          </div>
          ${
            night
              ? tomorrow
                ? `<div class="right tomorrow">
            <div class="t-title">Morgen:</div>
            <ha-icon class="t-icon" icon="${tomorrow.icon}" style="color:${COLORS[tomorrow.kind] || COLORS.none}"></ha-icon>
          </div>`
                : ""
              : `<div class="right">
            <div class="high">${deg(high)}${c.show_low && low != null ? `<span class="low"> / ${deg(low)}</span>` : ""}</div>
          </div>`
          }
          <div class="now">Jetzt ${deg(current)}</div>
        </div>
      </ha-card>`;

    this._updateWidth();
    this._fitText();
    this.shadowRoot.querySelector("ha-card").addEventListener("click", () =>
      this.dispatchEvent(
        new CustomEvent("hass-more-info", { detail: { entityId: c.weather_entity }, bubbles: true, composed: true })
      )
    );
  }

  _updateWidth() {
    const w = this.clientWidth;
    if (!w || w === this._w) return;
    this._w = w;
    this.style.setProperty("--w", `${w}px`);
    this._fitText();
  }

  /** Verkleinert den Stichwort-Text schrittweise, bis er ohne Umbruch in die Mitte passt. */
  _fitText() {
    if (this._fitRaf) cancelAnimationFrame(this._fitRaf);
    this._fitRaf = requestAnimationFrame(() => {
      const box = this.shadowRoot?.querySelector(".lines");
      if (!box || !box.clientWidth) return;
      box.style.fontSize = "";
      let size = parseFloat(getComputedStyle(box).fontSize);
      const min = 14;
      while (size > min && [...box.children].some((d) => d.scrollWidth > box.clientWidth + 0.5)) {
        size -= 1;
        box.style.fontSize = `${size}px`;
      }
    });
  }

  _style() {
    return `<style>
      :host { display:block; height:100%; }
      ha-card { height:100%; box-sizing:border-box; cursor:pointer; overflow:hidden; }
      .wrap { position:relative; display:flex; align-items:center; gap: clamp(10px, calc(var(--w, 420px) * 0.03), 20px);
              height:100%; min-height:120px; box-sizing:border-box; padding: 12px clamp(12px, calc(var(--w, 420px) * 0.035), 20px) 12px; }
      .icon { --mdc-icon-size: clamp(52px, calc(var(--w, 420px) * 0.17), 84px); flex:none;
              width: var(--mdc-icon-size, 64px); height: var(--mdc-icon-size, 64px); max-width:84px; max-height:84px; overflow:hidden; }
      .mid { flex:1; min-width:0; display:flex; flex-direction:column; justify-content:center; }
      .title { font-size: clamp(14px, calc(var(--w, 420px) * 0.042), 20px); color: var(--secondary-text-color); font-weight:500; line-height:1.2; }
      .lines { font-size: clamp(22px, calc(var(--w, 420px) * 0.075), 34px); font-weight:600; color: var(--primary-text-color); line-height:1.12; }
      .lines.two { font-size: clamp(19px, calc(var(--w, 420px) * 0.062), 29px); }
      .lines.frost { color: #1e9be0; }
      .lines div { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .right { flex:none; align-self:center; text-align:right; margin-bottom: 14px; }
      .tomorrow { display:flex; flex-direction:column; align-items:center; }
      .t-title { font-size: clamp(13px, calc(var(--w, 420px) * 0.036), 17px); color: var(--secondary-text-color);
                 font-weight:500; line-height:1.2; white-space:nowrap; }
      .t-icon { --mdc-icon-size: clamp(30px, calc(var(--w, 420px) * 0.09), 46px);
                width: var(--mdc-icon-size, 40px); height: var(--mdc-icon-size, 40px);
                max-width:46px; max-height:46px; overflow:hidden; margin-top:2px; }
      .high { font-size: clamp(34px, calc(var(--w, 420px) * 0.12), 56px); font-weight:500; line-height:1; color: var(--primary-text-color); white-space:nowrap; }
      .low { font-size: .5em; color: var(--secondary-text-color); font-weight:400; }
      .now { position:absolute; right: clamp(12px, calc(var(--w, 420px) * 0.035), 20px); bottom: 10px;
             font-size: clamp(13px, calc(var(--w, 420px) * 0.038), 18px); color: var(--secondary-text-color); white-space:nowrap; }
      .hint { padding:16px; color: var(--secondary-text-color); }
    </style>`;
  }
}
