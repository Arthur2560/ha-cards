// Gemeinsame Datenlogik für alle Designs: liest nur die Sensoren, rechnet nur Anzeige-Werte.

export const ROUTES = [1, 2];
export const STOPS = [1, 2, 3, 4, 5, 6];

export const DEFAULTS = {
  design: "strip", // strip | list | gauge
  route1_title: "A100 → West",
  route1_start: "Tempelhof",
  route2_title: "B96 → Nord",
  route2_start: "Tempelhof",
  color_mode: "ratio", // ratio | los
  ratio_red: 0.45, // unter 45 % der freien Geschwindigkeit -> Stau (rot)
  ratio_orange: 0.7, // unter 70 % -> zähfließend (orange)
  ratio_green: 0.9, // unter 90 % -> ok (grün), darüber frei (hellgrün)
  stale_minutes: 15,
  show_updated: true,
};

export const COLORS = {
  jam: [229, 57, 53], // rot
  slow: [251, 140, 0], // orange
  ok: [67, 160, 71], // grün
  free: [156, 204, 101], // hellgrün
  none: [158, 158, 158], // grau (keine Daten)
};
export const LEVEL_TEXT = { jam: "Stau", slow: "zähfließend", ok: "normal", free: "frei", none: "keine Daten" };

const num = (v) => (v == null || v === "" || Number.isNaN(+v) ? null : +v);

/** Standardname aus dem Sensor: "Verkehr A100 bis Bundesplatz" -> "Bundesplatz" */
function defaultName(st, entity) {
  const fn = st?.attributes?.friendly_name || entity;
  return String(fn)
    .replace(/^verkehr\s+/i, "")
    .replace(/^(a\s?100|b\s?96)\s+bis\s+/i, "");
}

function level(item, c) {
  if (item.speed == null) return "none";
  if (c.color_mode === "los") {
    const los = num(item.los);
    if (los == null) return "none";
    return ["jam", "slow", "ok", "free"][Math.max(0, Math.min(3, Math.round(los)))];
  }
  if (item.ratio == null) return "ok";
  if (item.ratio < (num(c.ratio_red) ?? DEFAULTS.ratio_red)) return "jam";
  if (item.ratio < (num(c.ratio_orange) ?? DEFAULTS.ratio_orange)) return "slow";
  if (item.ratio < (num(c.ratio_green) ?? DEFAULTS.ratio_green)) return "ok";
  return "free";
}

/** Strecken mit ihren Haltepunkten aus Konfiguration + Zuständen */
export function buildRoutes(c, states, now = Date.now()) {
  const staleMs = (num(c.stale_minutes) ?? DEFAULTS.stale_minutes) * 60000;
  let newest = null;
  const routes = ROUTES.map((r) => {
    const items = STOPS.map((i) => c[`route${r}_entity${i}`])
      .map((entity, idx) => ({ entity, name: c[`route${r}_name${idx + 1}`] }))
      .filter((x) => x.entity)
      .map(({ entity, name }) => {
        const st = states[entity];
        const a = st?.attributes || {};
        const speed = st && !["unavailable", "unknown"].includes(st.state) ? num(st.state) : null;
        const freeflow = num(a.freeflow_kmh);
        const updated = st ? Date.parse(st.last_updated) : NaN;
        if (!Number.isNaN(updated)) newest = Math.max(newest ?? 0, updated);
        const item = {
          entity,
          name: name || defaultName(st, entity),
          missing: !st,
          speed,
          freeflow,
          ratio: speed != null && freeflow ? speed / freeflow : null,
          distance: num(a.distance_km),
          duration: num(a.duration_min),
          freeflowMin: num(a.freeflow_min),
          delay: num(a.delay_min),
          los: a.worst_los,
          stale: !Number.isNaN(updated) && now - updated > staleMs,
        };
        item.level = level(item, c);
        return item;
      });
    return {
      title: c[`route${r}_title`] ?? DEFAULTS[`route${r}_title`],
      start: c[`route${r}_start`] ?? DEFAULTS[`route${r}_start`],
      items,
    };
  }).filter((r) => r.items.length);
  return { routes, newest };
}

// ---------- Formatierung ----------
export const fmt = (v, d = 0) =>
  v == null ? "–" : v.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtMin = (v) => (v == null ? "–" : `${fmt(v, v < 10 ? 1 : 0)} min`);
export const fmtDelay = (v) => (v == null ? "" : v < 0.05 ? "±0" : `+${fmt(v, v < 10 ? 1 : 0)}`);
export const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
/** Schwarz oder Weiß – lesbar auf der Farbe */
export function textOn(c) {
  const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]) > 0.25 ? "#000" : "#fff";
}
