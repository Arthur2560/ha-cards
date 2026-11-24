import { SchemaEditor } from "../../shared/schema-editor.js";
import { DEFAULTS } from "./defaults.js";

export class FloorHeatingCardEditor extends SchemaEditor {
  static schema = [
    { name: "climate_entity", required: true, selector: { entity: { domain: "climate" } } },
    { name: "temperature_entity", selector: { entity: { domain: "sensor", device_class: "temperature" } } },
    {
      type: "grid",
      name: "",
      flatten: true,
      schema: [
        { name: "title", selector: { text: {} } },
        { name: "step", selector: { number: { min: 0.1, max: 2, step: 0.1, mode: "box", unit_of_measurement: "°C" } } },
      ],
    },
  ];

  static labels = {
    climate_entity: "Thermostat (Klima-Entität)",
    temperature_entity: "Raumtemperatur-Sensor (optional)",
    title: "Überschrift",
    step: "Schrittweite",
  };

  static helpers = {
    climate_entity: "Wird über − / + eingestellt",
    temperature_entity: "Für „Aktuell“ – leer = aktuelle Temperatur des Thermostats",
    title: "Standard: Fußbodenheizung",
    step: "Standard: 0,5 °C",
  };

  toFormData(config) {
    return { ...DEFAULTS, ...config };
  }

  fromFormData(data, oldConfig) {
    const config = { type: oldConfig.type, ...data };
    for (const [k, v] of Object.entries(DEFAULTS)) if (config[k] === v) delete config[k];
    for (const k of Object.keys(config)) if (config[k] === "" || config[k] == null) delete config[k];
    return config;
  }
}
