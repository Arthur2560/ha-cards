import { registerCard } from "../../shared/register.js";
import { Ld2450RadarCard } from "./card.js";
import { Ld2450RadarCardEditor } from "./editor.js";

registerCard({
  type: "ld2450-radar-card",
  name: "LD2450 Radar",
  description: "Radar-Ansicht des Messbereichs – zeigt erkannte Personen als Punkte (X/Y-Koordinaten des LD2450).",
  card: Ld2450RadarCard,
  editor: Ld2450RadarCardEditor,
});
