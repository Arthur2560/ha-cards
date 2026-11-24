import { SchemaEditor } from "../../shared/schema-editor.js";
import { DEFAULTS } from "./defaults.js";

export class CoffeeTimerCardEditor extends SchemaEditor {
  static schema = [
    { name: "timer_entity", required: true, selector: { entity: { domain: ["timer", "sensor"] } } },
    { name: "duration_entity", selector: { entity: { domain: ["input_number", "sensor", "number"] } } },
    {
      name: "design",
      selector: {
        select: {
          mode: "dropdown",
          options: [
            { value: "split", label: "Geteilt – Text links, Zeit rechts" },
            { value: "ring", label: "Ring – Fortschrittsring mit Zeit" },
            { value: "fill", label: "Füllstand – Hintergrund füllt sich" },
          ],
        },
      },
    },
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
    timer_entity: "Kaffee-Timer (Timer oder Zeitstempel-Sensor)",
    duration_entity: "Durchschnittliche Dauer (optional)",
    design: "Design",
    title: "Text",
    done_text: "Text bei 0:00",
    color: "Farbe (Fortschritt)",
    show_end_time: "„fertig ca. HH:MM“ anzeigen",
  };

  static helpers = {
    timer_entity: "Timer-Helfer (empfohlen) oder Sensor, dessen Zustand die Endzeit ist",
    duration_entity:
      "Nur für den Fortschritt nötig, wenn ein Sensor statt Timer genutzt wird (Minuten; Einheit s/min/h wird erkannt)",
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
