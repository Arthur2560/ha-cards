import { SchemaEditor } from "../../shared/schema-editor.js";
import { TARGETS, DEFAULTS } from "./defaults.js";

// Sensoren des LD2450 aus ESPHome
const ESPHOME_SENSOR = { entity: { domain: "sensor", integration: "esphome" } };

const targetSection = (i) => ({
  type: "expandable",
  name: `ziel_${i}`,
  flatten: true,
  expanded: i === 1,
  title: `Ziel ${i}`,
  icon: "mdi:account",
  schema: [
    { name: `target${i}_x`, required: i === 1, selector: ESPHOME_SENSOR },
    { name: `target${i}_y`, required: i === 1, selector: ESPHOME_SENSOR },
    { name: `target${i}_speed`, selector: ESPHOME_SENSOR },
    { name: `target${i}_color`, selector: { color_rgb: {} } },
  ],
});

export class Ld2450RadarCardEditor extends SchemaEditor {
  static schema = [
    { name: "title", selector: { text: {} } },
    ...TARGETS.map(targetSection),
    {
      type: "expandable",
      name: "status",
      flatten: true,
      title: "Status (optional)",
      icon: "mdi:information-outline",
      schema: [
        { name: "presence_entity", selector: { entity: { domain: "binary_sensor" } } },
        { name: "target_count_entity", selector: { entity: { domain: "sensor" } } },
      ],
    },
    {
      type: "expandable",
      name: "darstellung",
      flatten: true,
      title: "Darstellung",
      icon: "mdi:radar",
      schema: [
        {
          type: "grid",
          name: "",
          flatten: true,
          schema: [
            { name: "max_range", selector: { number: { min: 1, max: 8, step: 0.5, mode: "box", unit_of_measurement: "m" } } },
            { name: "fov", selector: { number: { min: 30, max: 180, step: 5, mode: "box", unit_of_measurement: "°" } } },
            { name: "trail", selector: { number: { min: 0, max: 30, step: 1, mode: "box" } } },
          ],
        },
        { name: "show_info", selector: { boolean: {} } },
        { name: "mirror", selector: { boolean: {} } },
      ],
    },
  ];

  static labels = {
    title: "Titel (optional)",
    ...Object.fromEntries(
      TARGETS.flatMap((i) => [
        [`target${i}_x`, `Ziel ${i} – Koordinate X`],
        [`target${i}_y`, `Ziel ${i} – Koordinate Y`],
        [`target${i}_speed`, `Ziel ${i} – Geschwindigkeit (optional)`],
        [`target${i}_color`, `Ziel ${i} – Farbe`],
      ])
    ),
    presence_entity: "Anwesenheit (Binärsensor)",
    target_count_entity: "Anzahl Ziele (Sensor)",
    max_range: "Reichweite",
    fov: "Messwinkel",
    trail: "Spurlänge (Punkte)",
    show_info: "Entfernung / Winkel unter dem Radar anzeigen",
    mirror: "Links/Rechts spiegeln",
  };

  static helpers = {
    target1_x: "Seitliche Position (links/rechts) – mm, cm oder m",
    target1_y: "Abstand nach vorne vom Sensor – mm, cm oder m",
    fov: "LD2450: ca. 120° (±60°)",
    max_range: "LD2450: bis ca. 6 m",
    trail: "0 = keine Spur",
    mirror: "Einschalten, falls links und rechts vertauscht angezeigt werden",
  };

  // Standardwerte im Formular anzeigen, aber nur Abweichungen speichern.
  toFormData(config) {
    return { ...DEFAULTS, ...config };
  }

  fromFormData(data, oldConfig) {
    const config = { type: oldConfig.type, ...data };
    for (const [k, v] of Object.entries(DEFAULTS)) {
      if (JSON.stringify(config[k]) === JSON.stringify(v)) delete config[k];
    }
    for (const k of Object.keys(config)) {
      if (config[k] === "" || config[k] === undefined || config[k] === null) delete config[k];
    }
    return config;
  }
}
