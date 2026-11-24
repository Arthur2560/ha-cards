import { registerCard } from "../../shared/register.js";
import { WeatherTodayCard } from "./card.js";
import { WeatherTodayCardEditor } from "./editor.js";

registerCard({
  type: "weather-today-card",
  name: "Wetter Heute",
  description: "Kompakte Wetterkarte mit großem Text: tagsüber Stichworte bis zum Abend und Tagestemperatur, nachts Tiefsttemperatur.",
  card: WeatherTodayCard,
  editor: WeatherTodayCardEditor,
});
