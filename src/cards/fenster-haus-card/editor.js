import { SchemaEditor } from "../../shared/schema-editor.js";
import { ZONES, LABELS } from "./geometry.js";

// Fensterkontakte, Türsensoren, Rollläden/Fenster-Antriebe oder Schalter-Helfer.
const ENTITY_SELECTOR = { entity: { multiple: true, domain: ["binary_sensor", "cover", "input_boolean"] } };

const FLOORS = [
  { title: "Dachgeschoss", icon: "mdi:home-roof", zones: ["spitze", "dach_links", "dach_rechts"] },
  { title: "Obergeschoss", icon: "mdi:home-floor-2", zones: ["oben_links", "oben_bad", "oben_arthur"] },
  { title: "Mittleres Geschoss", icon: "mdi:home-floor-1", zones: ["mitte_flur", "mitte_arthur", "mitte_bett", "mitte_bad"] },
  { title: "Erdgeschoss", icon: "mdi:home-floor-0", zones: ["unten_flur", "unten_bad", "unten_links"] },
];

export class FensterHausCardEditor extends SchemaEditor {
  static schema = [
    { name: "title", selector: { text: {} } },
    ...FLOORS.map((f, i) => ({
      type: "expandable",
      name: `etage_${i}`,
      flatten: true,
      title: f.title,
      icon: f.icon,
      schema: f.zones.map((z) => ({ name: z, selector: ENTITY_SELECTOR })),
    })),
  ];

  static labels = { title: "Titel (optional)", ...LABELS };

  static helpers = Object.fromEntries(
    Object.keys(ZONES).map((z) => [z, "Raum wird rot, sobald eine dieser Entitäten offen ist (on/open)"])
  );

  // Konfiguration speichert die Räume verschachtelt unter "zones:".
  toFormData(config) {
    return { title: config.title, ...(config.zones || {}) };
  }

  fromFormData(data, oldConfig) {
    const { title, ...rest } = data;
    const zones = {};
    for (const k of Object.keys(ZONES)) if (rest[k]?.length) zones[k] = rest[k];
    const config = { ...oldConfig, zones };
    if (title) config.title = title;
    else delete config.title;
    return config;
  }
}
