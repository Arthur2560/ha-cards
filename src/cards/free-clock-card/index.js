import { registerCard } from "../../shared/register.js";
import { FreeClockCard } from "./card.js";
import { FreeClockCardEditor } from "./editor.js";

registerCard({
  type: "free-clock-card",
  name: "Digitaluhr",
  description: "Frei konfigurierbare Digitaluhr: Position, Größe, Schrift, Farbe, 12/24 h – jede Kachelgröße ab 1 × 1.",
  card: FreeClockCard,
  editor: FreeClockCardEditor,
});
