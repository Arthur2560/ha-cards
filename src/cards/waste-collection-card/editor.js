import { SchemaEditor } from "../../shared/schema-editor.js";
import { BINS, DEFAULTS } from "./bins.js";

export class WasteCollectionCardEditor extends SchemaEditor {
  static schema = [
    ...BINS.map((b, i) => ({
      type: "expandable",
      name: `tonne_${b.key}`,
      flatten: true,
      expanded: i < 3,
      title: `${b.label}${i === 3 ? " (optional)" : ""}`,
      icon: "mdi:delete-outline",
      schema: [
        {
          type: "grid",
          name: "",
          flatten: true,
          schema: [
            { name: `${b.key}_entity`, selector: { entity: { domain: "sensor", integration: "waste_collection_schedule" } } },
            { name: `${b.key}_color`, selector: { color_rgb: {} } },
          ],
        },
        { name: `${b.key}_text`, selector: { text: {} } },
      ],
    })),
    {
      type: "expandable",
      name: "darstellung",
      flatten: true,
      title: "Darstellung",
      icon: "mdi:palette-outline",
      schema: [
        { name: "day_start_hour", selector: { number: { min: 0, max: 6, step: 1, mode: "box", unit_of_measurement: "Uhr" } } },
        { name: "sort_by_date", selector: { boolean: {} } },
      ],
    },
  ];

  static labels = {
    ...Object.fromEntries(
      BINS.flatMap((b) => [
        [`${b.key}_entity`, `${b.label} – Sensor`],
        [`${b.key}_color`, `${b.label} – Farbe`],
        [`${b.key}_text`, `${b.label} – Text im Balken`],
      ])
    ),
    sort_by_date: "Nach Abholtag sortieren (sonst feste Reihenfolge)",
    day_start_hour: "Neuer Tag beginnt um",
  };

  static helpers = {
    day_start_hour: "Bis zu dieser Uhrzeit gilt nachts noch der Vortag (Standard 2 Uhr) – 0 = Mitternacht",
    ...Object.fromEntries(
    BINS.flatMap((b) => [
      [`${b.key}_entity`, "Sensor der Waste-Collection-Schedule-Integration – leer = Tonne ausblenden"],
      [`${b.key}_text`, `Standard: ${b.text}`],
    ])
    ),
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
