import { registerCard } from "../../shared/register.js";
import { WasteCollectionCard } from "./card.js";
import { WasteCollectionCardEditor } from "./editor.js";

registerCard({
  type: "waste-collection-card",
  name: "Müllabholung",
  description: "Flacher Streifen pro Mülltonne mit dem nächsten Abholtag (Heute, Morgen, Mittwoch, Nächste Woche …).",
  card: WasteCollectionCard,
  editor: WasteCollectionCardEditor,
});
