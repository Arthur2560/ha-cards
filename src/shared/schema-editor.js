// Basis-Klasse für ALLE visuellen Editoren in diesem Repository.
//
// Ein Editor beschreibt nur noch sein Schema (Home-Assistant-Selektoren) –
// das Rendering übernimmt das HA-eigene <ha-form>. Dadurch bekommt man
// automatisch die echten HA-Auswahlfelder (Entitäten-Suche, Bereiche, Farben, …).
//
// Beispiel:
//   class MyEditor extends SchemaEditor {
//     static schema = [
//       { name: "x_entity", required: true, selector: { entity: { domain: "sensor" } } },
//       { name: "y_entity", required: true, selector: { entity: { domain: "sensor" } } },
//     ];
//     static labels = { x_entity: "Koordinate X", y_entity: "Koordinate Y" };
//     static helpers = { x_entity: "Sensor mit der X-Position in mm" };
//   }

let haFormReady;

/** Stellt sicher, dass <ha-form> geladen ist (HA lädt es sonst evtl. erst bei Bedarf). */
export function ensureHaForm() {
  if (customElements.get("ha-form")) return Promise.resolve();
  if (!haFormReady) {
    haFormReady = (async () => {
      try {
        const helpers = await window.loadCardHelpers?.();
        const card = await helpers?.createCardElement({ type: "entities", entities: [] });
        await card?.constructor?.getConfigElement?.();
      } catch (e) {
        console.warn("[ha-cards] ha-form konnte nicht vorgeladen werden", e);
      }
      await customElements.whenDefined("ha-form");
    })();
  }
  return haFormReady;
}

export class SchemaEditor extends HTMLElement {
  /** @type {Array<object>} ha-form-Schema – in der Unterklasse überschreiben. */
  static schema = [];
  /** @type {Record<string,string>} Beschriftungen je Feldname. */
  static labels = {};
  /** @type {Record<string,string>} Hilfetexte je Feldname. */
  static helpers = {};

  constructor() {
    super();
    this._config = {};
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  /** Kann überschrieben werden, wenn das Schema von der Konfiguration abhängt. */
  getSchema(_config) {
    return this.constructor.schema;
  }

  async _render() {
    if (!this._hass) return;
    if (!this._form) {
      await ensureHaForm();
      if (this._form) return this._render();
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => this.constructor.labels[s.name] ?? s.label ?? s.name;
      this._form.computeHelper = (s) => this.constructor.helpers[s.name] ?? s.helper ?? "";
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this._config = { ...ev.detail.value };
        this.dispatchEvent(
          new CustomEvent("config-changed", {
            detail: { config: this._config },
            bubbles: true,
            composed: true,
          })
        );
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.data = this._config;
    this._form.schema = this.getSchema(this._config);
  }
}
