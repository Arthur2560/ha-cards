import { registerCard } from "../../shared/register.js";
import { FloorHeatingCard } from "./card.js";
import { FloorHeatingCardEditor } from "./editor.js";

registerCard({
  type: "floor-heating-card",
  name: "Fußbodenheizung",
  description: "Solltemperatur mit − / + in 0,5-°C-Schritten einstellen, aktuelle Raumtemperatur darunter.",
  card: FloorHeatingCard,
  editor: FloorHeatingCardEditor,
});
