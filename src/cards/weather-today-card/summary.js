// Fasst die stündliche Vorhersage der nächsten Stunden zu ganz kurzen Stichworten zusammen,
// z. B. "Regen", "Abends Regen", "Morgens & abends Regen", "Zeitweise Schnee", "Sehr windig".

export const DEFAULTS = {
  title: "Heute",
  hours: 12,
  wind_threshold: 30, // km/h -> "Windig"
  strong_wind_threshold: 50, // km/h -> "Sehr windig"
  precipitation_probability: 60, // % -> zählt als Niederschlag, auch wenn die Bedingung es nicht sagt
  show_low: false,
};

// Niederschlags-/Wetter-Kategorien in absteigender Wichtigkeit
const CATEGORIES = [
  { key: "thunder", noun: "Gewitter", conditions: ["lightning", "lightning-rainy"] },
  { key: "hail", noun: "Hagel", conditions: ["hail"] },
  { key: "snow", noun: "Schnee", conditions: ["snowy"] },
  { key: "sleet", noun: "Schneeregen", conditions: ["snowy-rainy"] },
  { key: "rain", noun: "Regen", conditions: ["rainy", "pouring"] },
];
const FOG = { key: "fog", noun: "Nebel", conditions: ["fog"] };

const PERIODS = [
  // [von, bis) in Stunden
  { key: "morning", label: "Morgens", from: 5, to: 10 },
  { key: "noon", label: "Mittags", from: 10, to: 14 },
  { key: "afternoon", label: "Nachmittags", from: 14, to: 18 },
  { key: "evening", label: "Abends", from: 18, to: 22 },
  { key: "night", label: "Nachts", from: 22, to: 29 },
];

const DAYTIME = ["morning", "noon", "afternoon"];

function periodOf(date, now) {
  const h = date.getHours();
  const tomorrow = date.toDateString() !== now.toDateString();
  if (tomorrow && h >= 5 && h < 12) return { key: "tomorrow", label: "Morgen früh" };
  const hh = h < 5 ? h + 24 : h;
  return PERIODS.find((p) => hh >= p.from && hh < p.to);
}

const toKmh = (v, unit) => {
  if (v == null || Number.isNaN(+v)) return null;
  switch ((unit || "km/h").toLowerCase()) {
    case "m/s":
      return v * 3.6;
    case "mph":
      return v * 1.609;
    case "kn":
    case "kt":
      return v * 1.852;
    case "ft/s":
      return v * 1.097;
    default:
      return +v;
  }
};

/** Baut aus den passenden Stunden Zeilen wie ["Abends Regen"], ["Regen"], ["Morgens Regen", "Abends Regen"]. */
function phrase(noun, matched, all, now) {
  if (!matched.length) return [];
  if (matched.length / all.length >= 0.6) return [noun];
  const periods = [];
  for (const f of matched) {
    const p = periodOf(f._date, now);
    if (p && !periods.some((x) => x.key === p.key)) periods.push(p);
  }
  if (periods.length > 2) return [`Zeitweise ${noun}`];
  const keys = periods.map((p) => p.key);
  // Mehrere Tagesabschnitte zusammenfassen, damit der Text kurz bleibt
  if (keys.length === 2 && keys.every((k) => DAYTIME.includes(k))) return [`Tagsüber ${noun}`];
  if (keys.length === 2 && keys.every((k) => ["evening", "night"].includes(k))) return [`Abends & nachts ${noun}`];
  // Zwei getrennte Abschnitte (z. B. morgens und abends) -> zwei Zeilen untereinander
  return periods.map((p) => `${p.label} ${noun}`);
}

/**
 * @param {Array} hourly   Stündliche Vorhersage (HA-Format: datetime, condition, temperature, …)
 * @param {object} opts    { hours, wind_threshold, strong_wind_threshold, precipitation_probability, windUnit, now }
 * @returns {{ lines: string[], icon: string, kind: string, maxTemp: number|null }}
 */
export function summarize(hourly, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const now = o.now || new Date();
  const start = now.getTime() - 30 * 60 * 1000;
  const window = (hourly || [])
    .map((f) => ({ ...f, _date: new Date(f.datetime) }))
    .filter((f) => f._date.getTime() >= start)
    .slice(0, Math.max(1, o.hours));

  if (!window.length) return { lines: [], icon: null, kind: "none", maxTemp: null };

  const lines = [];
  let main = null;
  let partial = false;
  let pouring = false;

  for (const cat of CATEGORIES) {
    const matched = window.filter((f) => {
      if (cat.conditions.includes(f.condition)) return true;
      // Regen auch über Wahrscheinlichkeit erkennen, wenn die Bedingung trocken ist
      if (cat.key === "rain" && !CATEGORIES.some((c) => c.conditions.includes(f.condition))) {
        const p = f.precipitation_probability;
        return p != null && p >= o.precipitation_probability && (f.precipitation ?? 1) > 0;
      }
      return false;
    });
    if (!matched.length) continue;
    let noun = cat.noun;
    if (cat.key === "rain" && matched.some((f) => f.condition === "pouring")) {
      noun = "Starkregen";
      pouring = true;
    }
    lines.push(...phrase(noun, matched, window, now));
    if (!main) {
      main = cat.key;
      partial = matched.length / window.length < 0.6;
    }
    if (lines.length >= 2) break;
  }

  // Wind
  const windMax = Math.max(
    ...window.map((f) => toKmh(f.wind_speed, o.windUnit) ?? 0),
    0
  );
  const windyCond = window.some((f) => f.condition === "windy" || f.condition === "windy-variant");
  let windLine = null;
  if (windMax >= o.strong_wind_threshold) windLine = "Sehr windig";
  else if (windMax >= o.wind_threshold || windyCond) windLine = "Windig";

  // Himmel (wenn kein Niederschlag)
  let sky = null;
  if (!main) {
    const fog = window.filter((f) => FOG.conditions.includes(f.condition));
    if (fog.length) {
      sky = { key: "fog", text: phrase("Nebel", fog, window, now).join(" / ") };
    } else {
      const count = (conds) => window.filter((f) => conds.includes(f.condition)).length;
      const sunny = count(["sunny", "clear-night"]);
      const partly = count(["partlycloudy"]);
      const cloudy = count(["cloudy", "windy-variant"]);
      const nightShare = window.filter((f) => f.condition === "clear-night").length;
      if (cloudy >= sunny + partly) sky = { key: "cloudy", text: "Bewölkt" };
      else if (sunny >= partly) sky = { key: nightShare > sunny / 2 ? "clear-night" : "sunny", text: nightShare > sunny / 2 ? "Klar" : "Sonnig" };
      else sky = { key: "partlycloudy", text: "Teils bewölkt" };
    }
  }

  if (!main) lines.push(sky.text);
  if (windLine && lines.length < 2) lines.push(windLine);

  // Icon
  const night = (() => {
    const h = now.getHours();
    return h >= 21 || h < 6;
  })();
  let icon;
  let kind = main || (windLine && !sky ? "wind" : sky.key);
  switch (main) {
    case "thunder":
      icon = "mdi:weather-lightning-rainy";
      break;
    case "hail":
      icon = "mdi:weather-hail";
      break;
    case "snow":
      icon = partial ? "mdi:weather-partly-snowy" : "mdi:weather-snowy";
      break;
    case "sleet":
      icon = "mdi:weather-snowy-rainy";
      break;
    case "rain":
      icon = pouring ? "mdi:weather-pouring" : partial ? "mdi:weather-partly-rainy" : "mdi:weather-rainy";
      break;
    default:
      if (windLine && sky.key !== "fog") {
        icon = sky.key === "sunny" ? "mdi:weather-windy" : "mdi:weather-windy-variant";
        kind = "wind";
      } else
        icon = {
          fog: "mdi:weather-fog",
          cloudy: "mdi:weather-cloudy",
          partlycloudy: night ? "mdi:weather-night-partly-cloudy" : "mdi:weather-partly-cloudy",
          sunny: "mdi:weather-sunny",
          "clear-night": "mdi:weather-night",
        }[sky.key];
  }

  const temps = window.map((f) => f.temperature).filter((t) => t != null && !Number.isNaN(+t));
  return {
    lines: lines.filter(Boolean).slice(0, 2),
    icon,
    kind,
    maxTemp: temps.length ? Math.max(...temps) : null,
    minTemp: temps.length ? Math.min(...temps) : null,
  };
}
