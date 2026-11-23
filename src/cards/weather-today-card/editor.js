import { SchemaEditor } from "../../shared/schema-editor.js";
import { DEFAULTS } from "./summary.js";

export class WeatherTodayCardEditor extends SchemaEditor {
  static schema = [
    { name: "weather_entity", required: true, selector: { entity: { domain: "weather" } } },
    { name: "temperature_entity", selector: { entity: { domain: "sensor", device_class: "temperature" } } },
    { name: "title", selector: { text: {} } },
    {
      type: "expandable",
      name: "erweitert",
      flatten: true,
      title: "Vorhersage & Schwellwerte",
      icon: "mdi:tune-variant",
      schema: [
        {
          type: "grid",
          name: "",
          flatten: true,
          schema: [
            { name: "hours", selector: { number: { min: 3, max: 24, step: 1, mode: "box", unit_of_measurement: "h" } } },
            { name: "precipitation_probability", selector: { number: { min: 10, max: 100, step: 5, mode: "box", unit_of_measurement: "%" } } },
            { name: "wind_threshold", selector: { number: { min: 5, max: 100, step: 5, mode: "box", unit_of_measurement: "km/h" } } },
            { name: "strong_wind_threshold", selector: { number: { min: 10, max: 150, step: 5, mode: "box", unit_of_measurement: "km/h" } } },
          ],
        },
        { name: "show_low", selector: { boolean: {} } },
      ],
    },
  ];

  static labels = {
    weather_entity: "Wetter-Entität (Vorhersage)",
    temperature_entity: "Außentemperatur-Sensor (optional)",
    title: "Überschrift",
    hours: "Zeitraum",
    precipitation_probability: "Regen ab Wahrscheinlichkeit",
    wind_threshold: "„Windig“ ab",
    strong_wind_threshold: "„Sehr windig“ ab",
    show_low: "Tiefsttemperatur neben der Tagestemperatur anzeigen",
  };

  static helpers = {
    weather_entity: "Liefert die stündliche und tägliche Vorhersage",
    temperature_entity: "Für die aktuelle Temperatur unten rechts – leer = Wert der Wetter-Entität",
    title: "Standard: Heute",
    hours: "Wie viele Stunden ab jetzt zusammengefasst werden",
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
