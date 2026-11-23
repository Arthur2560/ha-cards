import { registerCard } from "../../shared/register.js";
import { WeatherTodayCard } from "./card.js";
import { WeatherTodayCardEditor } from "./editor.js";

registerCard({
  type: "weather-today-card",
  name: "Wetter Heute",
  description: "Kompakte Wetterkarte mit großem Text: Icon, Stichworte für die nächsten 12 Stunden, Tagestemperatur.",
  card: WeatherTodayCard,
  editor: WeatherTodayCardEditor,
});
