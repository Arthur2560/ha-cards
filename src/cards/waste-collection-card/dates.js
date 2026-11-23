// Ermittelt aus einem Waste-Collection-Schedule-Sensor das nächste Abholdatum
// und formatiert es relativ ("Heute", "Morgen", "Mittwoch", "Nächste Woche Mittwoch", "In 12 Tagen").

const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const WEEKDAYS_SHORT = ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."];
const DAY = 24 * 3600 * 1000;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

function parseDate(str) {
  if (typeof str !== "string") return null;
  let m = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = str.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  return null;
}

/** Nächstes Abholdatum (00:00 Uhr) oder null. */
export function nextDate(stateObj, now = new Date()) {
  if (!stateObj) return null;
  const today = startOfDay(now);
  const attrs = stateObj.attributes || {};

  // 1. Datums-Schlüssel (details_format "upcoming") bzw. Datums-Werte ("appointment_types")
  const candidates = [];
  for (const [k, v] of Object.entries(attrs)) {
    const d = parseDate(k) || (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? parseDate(v) : null);
    if (d && d >= today) candidates.push(d);
  }
  if (candidates.length) return new Date(Math.min(...candidates));

  // 2. Datum im Zustand (eigene value_template)
  const s = String(stateObj.state ?? "");
  const ds = parseDate(s);
  if (ds) return ds;

  // 3. Attribut daysTo (Option add_days_to)
  if (Number.isFinite(+attrs.daysTo) && attrs.daysTo !== "") {
    const ref = stateObj.last_updated ? startOfDay(new Date(stateObj.last_updated)) : today;
    return addDays(ref, +attrs.daysTo);
  }

  // 4. Text im Zustand: "heute", "morgen", "übermorgen", "in 3 Tagen", "Restmüll in 3 days", "3"
  const t = s.toLowerCase();
  if (/übermorgen/.test(t)) return addDays(today, 2);
  if (/heute|today/.test(t)) return today;
  if (/morgen|tomorrow/.test(t)) return addDays(today, 1);
  const n = t.match(/(\d+)/);
  if (n) return addDays(today, +n[1]);
  return null;
}

/** Montag der Woche */
const weekStart = (d) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));

/**
 * @returns {{ texts: string[], days: number }|null}
 *   texts: Varianten von lang nach kurz (die Karte nimmt die längste, die passt)
 */
export function relativeText(date, now = new Date()) {
  if (!date) return null;
  const today = startOfDay(now);
  const days = Math.round((startOfDay(date) - today) / DAY);
  const wd = WEEKDAYS[date.getDay()];
  const wds = WEEKDAYS_SHORT[date.getDay()];
  if (days < 0) return { texts: ["–"], days };
  if (days === 0) return { texts: ["Heute"], days };
  if (days === 1) return { texts: ["Morgen"], days };
  const weeks = Math.round((weekStart(date) - weekStart(today)) / (7 * DAY));
  if (weeks === 0) return { texts: [wd, wds], days };
  if (weeks === 1) return { texts: [`Nächste Woche ${wd}`, `Nächste Woche ${wds}`, `Nä. Woche ${wds}`], days };
  return {
    texts: [`In ${days} Tagen`, `${wds} ${date.getDate()}.${date.getMonth() + 1}.`],
    days,
  };
}
