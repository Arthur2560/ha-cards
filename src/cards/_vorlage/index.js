// VORLAGE für eine neue Karte.
// Kopieren nach src/cards/<karten-typ>/ (Ordnername == Element-Name, z. B. "ld2450-radar-card"),
// dann "vorlage-card" überall durch den neuen Namen ersetzen.
// Ordner mit "_" am Anfang werden NICHT gebaut – diese Vorlage landet also nicht in HACS.
import { registerCard } from "../../shared/register.js";
import { VorlageCard } from "./card.js";
import { VorlageCardEditor } from "./editor.js";

registerCard({
  type: "vorlage-card",
  name: "Vorlage-Karte",
  description: "Zeigt den Zustand einer ausgewählten Entität.",
  card: VorlageCard,
  editor: VorlageCardEditor,
});
