import { SchemaEditor } from "../../shared/schema-editor.js";

// Visueller Editor: JEDE Entität, die die Karte nutzt, bekommt hier ein eigenes Auswahlfeld.
export class VorlageCardEditor extends SchemaEditor {
  static schema = [
    { name: "title", selector: { text: {} } },
    { name: "entity", required: true, selector: { entity: { domain: "sensor" } } },
  ];
  static labels = { title: "Titel", entity: "Sensor" };
  static helpers = { entity: "Entität, deren Zustand angezeigt wird" };
}
