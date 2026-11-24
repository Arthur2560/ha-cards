import { SchemaEditor } from "../../shared/schema-editor.js";
import { DEFAULTS } from "./defaults.js";

export class CoffeeTimerCardEditor extends SchemaEditor {
  static schema = [
    { name: "timer_entity", required: true, selector: { entity: { domain: "timer" } } },
    {
      type: "grid",
      name: "",
      flatten: true,
      schema: [
        { name: "title", selector: { text: {} } },
        { name: "done_text", selector: { text: {} } },
      ],
    },
    {
      type: "grid",
      name: "",
      flatten: true,
      schema: [
        { name: "color", selector: { color_rgb: {} } },
        { name: "show_end_time", selector: { boolean: {} } },
      ],
    },
  ];

  static labels = {
    timer_entity: "Kaffee-Timer (Timer-Helfer)",
    title: "Text",
    done_text: "Text bei 0:00",
    color: "Farbe (Fortschritt)",
    show_end_time: "„fertig ca. HH:MM“ anzeigen",
  };

  static helpers = {
    timer_entity: "Restzeit und Fortschritt werden aus Endzeit und Dauer des Timers berechnet",
  };

  toFormData(config) {
    return { ...DEFAULTS, ...config };
  }

  fromFormData(data, oldConfig) {
    const config = { type: oldConfig.type, ...data };
    for (const [k, v] of Object.entries(DEFAULTS)) if (JSON.stringify(config[k]) === JSON.stringify(v)) delete config[k];
    for (const k of Object.keys(config)) if (config[k] === "" || config[k] == null) delete config[k];
    return config;
  }
}
