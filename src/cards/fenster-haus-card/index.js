import { registerCard } from "../../shared/register.js";
import { FensterHausCard } from "./card.js";
import { FensterHausCardEditor } from "./editor.js";

registerCard({
  type: "fenster-haus-card",
  name: "Fenster-Haus",
  description: "Hausquerschnitt – Räume werden rot, wenn ein zugeordnetes Fenster offen ist.",
  card: FensterHausCard,
  editor: FensterHausCardEditor,
});
