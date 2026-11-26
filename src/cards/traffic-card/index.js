import { registerCard } from "../../shared/register.js";
import { TrafficCard } from "./card.js";
import { TrafficCardEditor } from "./editor.js";

registerCard({
  type: "traffic-card",
  name: "Verkehrslage",
  description: "Verkehrslage ab Tempelhof (A100/B96): Geschwindigkeit, Vergleich zur freien Fahrt, Verzögerung – drei Designs.",
  card: TrafficCard,
  editor: TrafficCardEditor,
});
