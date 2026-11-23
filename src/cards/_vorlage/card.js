export class VorlageCard extends HTMLElement {
  // Standard-Konfiguration beim Hinzufügen über den Kartenauswahl-Dialog.
  static getStubConfig(hass) {
    const entity = Object.keys(hass?.states ?? {}).find((e) => e.startsWith("sensor.")) ?? "";
    return { title: "", entity };
  }

  setConfig(config) {
    // Kein Fehler werfen, wenn Entitäten noch fehlen – der Nutzer wählt sie im Editor aus.
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 2;
  }

  // Für Sections-Dashboards (Raster-Größe)
  getGridOptions() {
    return { columns: 6, rows: 2, min_columns: 3 };
  }

  _render() {
    if (!this._config || !this._hass) return;
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" }).innerHTML = `
        <style>
          .content { padding: 16px; }
          .state { font-size: 2em; }
          .hint { color: var(--secondary-text-color); }
        </style>
        <ha-card><div class="content"></div></ha-card>`;
    }
    const { title, entity } = this._config;
    const card = this.shadowRoot.querySelector("ha-card");
    card.header = title || "";
    const content = this.shadowRoot.querySelector(".content");
    const st = entity ? this._hass.states[entity] : undefined;
    content.innerHTML = st
      ? `<div class="state">${st.state} ${st.attributes.unit_of_measurement ?? ""}</div>`
      : `<div class="hint">Bitte im visuellen Editor einen Sensor auswählen.</div>`;
  }
}
