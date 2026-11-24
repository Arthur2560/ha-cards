import { SchemaEditor } from "../../shared/schema-editor.js";
import { FLOORS, LABELS, ZONES, DEFAULT_TEXT, PERSONS, PERSON_COLORS } from "./rooms.js";

const roomSchema = (z) => ({
  type: "expandable",
  name: `raum_${z}`,
  flatten: true,
  title: LABELS[z],
  schema: [
    { name: `${z}_text`, selector: { text: {} } },
    { name: `${z}_windows`, selector: { entity: { multiple: true, domain: ["binary_sensor", "cover", "input_boolean"] } } },
    {
      type: "grid",
      name: "",
      flatten: true,
      schema: [
        { name: `${z}_presence`, selector: { entity: { domain: ["binary_sensor", "input_boolean"] } } },
        { name: `${z}_temperature`, selector: { entity: { domain: "sensor", device_class: "temperature" } } },
        { name: `${z}_lock`, selector: { entity: { domain: ["lock", "binary_sensor", "input_boolean"] } } },
        { name: `${z}_area`, selector: { text: {} } },
      ],
    },
  ],
});

export class FensterHausTestCardEditor extends SchemaEditor {
  static schema = [
    { name: "title", selector: { text: {} } },
    {
      type: "expandable",
      name: "personen",
      flatten: true,
      title: "Personen (optional)",
      icon: "mdi:account-group",
      schema: PERSONS.map((i) => ({
        type: "grid",
        name: "",
        flatten: true,
        schema: [
          { name: `person${i}_name`, selector: { text: {} } },
          { name: `person${i}_entity`, selector: { entity: { domain: ["sensor", "device_tracker", "person", "input_select", "input_text"] } } },
          { name: `person${i}_color`, selector: { color_rgb: {} } },
        ],
      })),
    },
    ...FLOORS.map((f, i) => ({
      type: "expandable",
      name: `etage_${i}`,
      flatten: true,
      title: f.title,
      icon: f.icon,
      schema: f.zones.map(roomSchema),
    })),
  ];

  static labels = {
    title: "Titel (optional)",
    ...Object.fromEntries(
      PERSONS.flatMap((i) => [
        [`person${i}_name`, `Person ${i} – Name`],
        [`person${i}_entity`, `Person ${i} – Raum-Entität`],
        [`person${i}_color`, `Person ${i} – Farbe`],
      ])
    ),
    ...Object.fromEntries(
      Object.keys(ZONES).flatMap((z) => [
        [`${z}_text`, "Beschriftung im Raum"],
        [`${z}_windows`, "Fenster / Türen (rot, wenn offen)"],
        [`${z}_presence`, "Präsenzsensor"],
        [`${z}_temperature`, "Temperatur"],
        [`${z}_lock`, "Schloss"],
        [`${z}_area`, "Raumname für Personen"],
      ])
    ),
  };

  static helpers = {
    ...Object.fromEntries(
      PERSONS.map((i) => [
        `person${i}_entity`,
        "Entität, deren Zustand der aktuelle Raum ist (z. B. Bermuda/ESPresense) – wird mit „Raumname für Personen“ verglichen",
      ])
    ),
    ...Object.fromEntries(
      Object.keys(ZONES).flatMap((z) => [
        [`${z}_text`, `Standard: ${DEFAULT_TEXT[z] || "(kein Text)"} – „-“ = kein Text`],
        [`${z}_presence`, "Punkt im Raum, wenn jemand da ist"],
        [`${z}_lock`, "Abgeschlossen: graues Schloss · offen: rotes, pulsierendes Schloss"],
        [`${z}_area`, "Mehrere Namen mit Komma trennen, z. B. „Bad oben, Badezimmer“"],
      ])
    ),
  };

  toFormData(config) {
    const data = { ...config };
    delete data.zones;
    for (const z of Object.keys(ZONES)) {
      if (config.zones?.[z]?.length) data[`${z}_windows`] = config.zones[z];
      if (data[`${z}_text`] == null) data[`${z}_text`] = DEFAULT_TEXT[z];
    }
    for (const i of PERSONS) if (!data[`person${i}_color`]) data[`person${i}_color`] = PERSON_COLORS[i];
    return data;
  }

  fromFormData(data, oldConfig) {
    const config = { type: oldConfig.type };
    const zones = {};
    for (const [k, v] of Object.entries(data)) {
      const m = k.match(/^(.+)_windows$/);
      if (m && ZONES[m[1]]) {
        if (v?.length) zones[m[1]] = v;
        continue;
      }
      if (v === "" || v == null) continue;
      config[k] = v;
    }
    config.zones = zones;
    for (const z of Object.keys(ZONES)) if (config[`${z}_text`] === DEFAULT_TEXT[z]) delete config[`${z}_text`];
    for (const i of PERSONS)
      if (JSON.stringify(config[`person${i}_color`]) === JSON.stringify(PERSON_COLORS[i])) delete config[`person${i}_color`];
    return config;
  }
}
