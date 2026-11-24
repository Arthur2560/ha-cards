import { registerCard } from "../../shared/register.js";
import { CoffeeTimerCard } from "./card.js";
import { CoffeeTimerCardEditor } from "./editor.js";

registerCard({
  type: "coffee-timer-card",
  name: "Kaffee-Timer",
  description: "Große Countdown-Anzeige, wann der nächste Kaffee fertig ist (Minuten und Sekunden, mit Fortschritt).",
  card: CoffeeTimerCard,
  editor: CoffeeTimerCardEditor,
});
