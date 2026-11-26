import { SchemaEditor } from "../../shared/schema-editor.js";
import { DEFAULTS } from "./defaults.js";

const select = (options, extra = {}) => ({ select: { mode: "dropdown", options, ...extra } });

export class FreeClockCardEditor extends SchemaEditor {
  static schema = [
    {
      type: "grid",
      name: "",
      flatten: true,
      schema: [
        { name: "hour_format", selector: select([{ value: "24", label: "24 Stunden (14:05)" }, { value: "12", label: "12 Stunden (2:05 PM)" }]) },
        { name: "show_seconds", selector: { boolean: {} } },
        { name: "leading_zero", selector: { boolean: {} } },
        { name: "show_ampm", selector: { boolean: {} } },
      ],
    },
    {
      type: "grid",
      name: "",
      flatten: true,
      schema: [
        { name: "align", selector: select([{ value: "left", label: "Links" }, { value: "center", label: "Mitte" }, { value: "right", label: "Rechts" }]) },
        { name: "valign", selector: select([{ value: "top", label: "Oben" }, { value: "center", label: "Mitte" }, { value: "bottom", label: "Unten" }]) },
      ],
    },
    { name: "size", selector: { number: { min: 10, max: 100, step: 1, mode: "slider", unit_of_measurement: "%" } } },
    {
      type: "grid",
      name: "",
      flatten: true,
      schema: [
        {
          name: "font_family",
          selector: select(
            [
              { value: "", label: "Theme-Schrift" },
              { value: "Helvetica Neue, Helvetica, Arial, sans-serif", label: "Helvetica / Arial" },
              { value: "Avenir Next, Avenir, Montserrat, sans-serif", label: "Avenir" },
              { value: "Futura, Century Gothic, sans-serif", label: "Futura" },
              { value: "Georgia, Times New Roman, serif", label: "Georgia (Serifen)" },
              { value: "Menlo, Consolas, Courier New, monospace", label: "Menlo (Festbreite)" },
              { value: "Courier New, Courier, monospace", label: "Courier" },
            ],
            { custom_value: true }
          ),
        },
        {
          name: "font_weight",
          selector: select([
            { value: "200", label: "Dünn" },
            { value: "300", label: "Leicht" },
            { value: "400", label: "Normal" },
            { value: "500", label: "Mittel" },
            { value: "700", label: "Fett" },
            { value: "900", label: "Extrafett" },
          ]),
        },
      ],
    },
    {
      type: "grid",
      name: "",
      flatten: true,
      schema: [
        { name: "color", selector: { color_rgb: {} } },
        { name: "transparent", selector: { boolean: {} } },
      ],
    },
  ];

  static labels = {
    hour_format: "Format",
    show_seconds: "Sekunden anzeigen",
    leading_zero: "Führende Null (08:05)",
    show_ampm: "AM/PM anzeigen (12 h)",
    align: "Horizontal",
    valign: "Vertikal",
    size: "Textgröße (Anteil der Kachelhöhe)",
    font_family: "Schriftart",
    font_weight: "Schriftstärke",
    color: "Schriftfarbe (leer = Theme)",
    transparent: "Ohne Kartenhintergrund",
  };

  static helpers = {
    size: "Passt die Uhrzeit nicht in die Breite, wird sie automatisch kleiner",
    font_family: "Aus der Liste wählen oder eigenen Schriftnamen eintippen",
  };

  toFormData(config) {
    return { ...DEFAULTS, ...config };
  }

  fromFormData(data, oldConfig) {
    const config = { type: oldConfig.type, ...data };
    for (const [k, v] of Object.entries(DEFAULTS)) if (config[k] === v) delete config[k];
    for (const k of Object.keys(config)) if (config[k] == null || (config[k] === "" && k !== "font_family")) delete config[k];
    if (config.font_family === "") delete config.font_family;
    return config;
  }
}
