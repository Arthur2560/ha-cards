import { SchemaEditor } from "../../shared/schema-editor.js";
import { DEFAULTS, ROUTES, STOPS } from "./data.js";

const SENSOR = { entity: { domain: "sensor" } };

export class TrafficCardEditor extends SchemaEditor {
  static schema = [
    {
      name: "design",
      selector: {
        select: {
          mode: "dropdown",
          options: [
            { value: "strip", label: "Streckenband – farbige Balken pro Strecke" },
            { value: "list", label: "Liste – kompakte Tabelle" },
            { value: "gauge", label: "Tacho – Anzeige pro Ziel" },
          ],
        },
      },
    },
    { name: "title", selector: { text: {} } },
    ...ROUTES.map((r) => ({
      type: "expandable",
      name: `strecke_${r}`,
      flatten: true,
      expanded: r === 1,
      title: `Strecke ${r}`,
      icon: "mdi:road-variant",
      schema: [
        {
          type: "grid",
          name: "",
          flatten: true,
          schema: [
            { name: `route${r}_title`, selector: { text: {} } },
            { name: `route${r}_start`, selector: { text: {} } },
          ],
        },
        ...STOPS.map((i) => ({
          type: "grid",
          name: "",
          flatten: true,
          schema: [
            { name: `route${r}_entity${i}`, selector: SENSOR },
            { name: `route${r}_name${i}`, selector: { text: {} } },
          ],
        })),
      ],
    })),
    {
      type: "expandable",
      name: "farben",
      flatten: true,
      title: "Farben & Aktualität",
      icon: "mdi:palette-outline",
      schema: [
        {
          name: "color_mode",
          selector: {
            select: {
              mode: "dropdown",
              options: [
                { value: "ratio", label: "Nach Geschwindigkeit im Vergleich zur freien Fahrt" },
                { value: "los", label: "Nach schlechtester Verkehrsstufe (worst_los)" },
              ],
            },
          },
        },
        {
          type: "grid",
          name: "",
          flatten: true,
          schema: ["ratio_red", "ratio_orange", "ratio_green"].map((name) => ({
            name,
            selector: { number: { min: 0.05, max: 1, step: 0.05, mode: "box" } },
          })),
        },
        {
          type: "grid",
          name: "",
          flatten: true,
          schema: [
            { name: "stale_minutes", selector: { number: { min: 1, max: 120, step: 1, mode: "box", unit_of_measurement: "min" } } },
            { name: "show_updated", selector: { boolean: {} } },
          ],
        },
      ],
    },
  ];

  static labels = {
    design: "Design",
    title: "Titel (optional)",
    ...Object.fromEntries(
      ROUTES.flatMap((r) => [
        [`route${r}_title`, "Bezeichnung der Strecke"],
        [`route${r}_start`, "Startpunkt"],
        ...STOPS.flatMap((i) => [
          [`route${r}_entity${i}`, `Ziel ${i} – Sensor`],
          [`route${r}_name${i}`, `Ziel ${i} – Name (optional)`],
        ]),
      ])
    ),
    color_mode: "Färbung",
    ratio_red: "Rot unter (Anteil)",
    ratio_orange: "Orange unter (Anteil)",
    ratio_green: "Grün unter (Anteil)",
    stale_minutes: "Veraltet nach",
    show_updated: "„Stand HH:MM“ anzeigen",
  };

  static helpers = {
    route1_entity1: "Ziele in Fahrtreihenfolge eintragen; leere Felder werden ignoriert",
    route1_name1: "Leer = Name aus dem Sensor",
    ratio_red: "Aktuelle ÷ freie Geschwindigkeit, z. B. 0,45 = unter 45 %",
    ratio_green: "Darüber: hellgrün (frei)",
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
