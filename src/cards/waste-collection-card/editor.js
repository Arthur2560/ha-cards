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
      ],
    })),
    {
      type: "expandable",
      name: "darstellung",
      flatten: true,
      title: "Darstellung",
      icon: "mdi:palette-outline",
      schema: [
        {
          type: "grid",
          name: "",
          flatten: true,
          schema: [
            { name: "stripe_width", selector: { number: { min: 16, max: 160, step: 2, mode: "box", unit_of_measurement: "px" } } },
            { name: "stripe_height", selector: { number: { min: 4, max: 30, step: 1, mode: "box", unit_of_measurement: "px" } } },
          ],
        },
        { name: "sort_by_date", selector: { boolean: {} } },
      ],
    },
  ];

  static labels = {
    ...Object.fromEntries(
      BINS.flatMap((b) => [
        [`${b.key}_entity`, `${b.label} – Sensor`],
        [`${b.key}_color`, `${b.label} – Farbe`],
      ])
    ),
    stripe_width: "Streifenbreite",
    stripe_height: "Streifendicke",
    sort_by_date: "Nach Abholtag sortieren (sonst feste Reihenfolge)",
  };

  static helpers = Object.fromEntries(
    BINS.map((b) => [`${b.key}_entity`, "Sensor der Waste-Collection-Schedule-Integration – leer = Tonne ausblenden"])
  );

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
