import { registerCard } from "../../shared/register.js";
import { FensterHausTestCard } from "./card.js";
import { FensterHausTestCardEditor } from "./editor.js";

registerCard({
  type: "fenster-haus-test-card",
  name: "Fenster-Haus (Test)",
  description:
    "Test-Variante der Fenster-Haus-Karte: zusätzlich Präsenz, Personen, Temperatur und Schloss pro Raum (alles optional).",
  card: FensterHausTestCard,
  editor: FensterHausTestCardEditor,
});
