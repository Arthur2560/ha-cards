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
    { name: "heating_background", selector: { boolean: {} } },
    {
      type: "expandable",
      name: "groessen",
      flatten: true,
      title: "Textgrößen",
      icon: "mdi:format-size",
      schema: ["size_title", "size_current", "size_target", "size_buttons"].map((name) => ({
        name,
        selector: { number: { min: 50, max: 250, step: 5, mode: "slider", unit_of_measurement: "%" } },
      })),
    },
  ];

  static labels = {
    climate_entity: "Thermostat (Klima-Entität)",
    temperature_entity: "Raumtemperatur-Sensor (optional)",
    title: "Überschrift",
    step: "Schrittweite",
    heating_background: "Beim Heizen Hintergrund orange einfärben",
    size_title: "Überschrift",
    size_current: "Aktuelle Temperatur",
    size_target: "Solltemperatur",
    size_buttons: "− / + Knöpfe",
  };

  static helpers = {
    climate_entity: "Wird über − / + eingestellt",
    temperature_entity: "Für „Aktuell“ – leer = aktuelle Temperatur des Thermostats",
    title: "Standard: Fußbodenheizung",
    step: "Standard: 0,5 °C",
    heating_background: "Aus = stattdessen die Solltemperatur orange färben",
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
