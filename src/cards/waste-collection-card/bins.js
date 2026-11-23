// Tonnen in fester Reihenfolge (links -> rechts)
export const BINS = [
  { key: "restmuell", label: "Restmüll", color: [0, 0, 0] },
  { key: "wertstoffe", label: "Wertstoffe", color: [255, 214, 0] },
  { key: "bio", label: "Biomüll", color: [121, 85, 72] },
  { key: "papier", label: "Papier", color: [30, 100, 200] },
];

export const DEFAULTS = {
  stripe_width: 52,
  stripe_height: 14,
  sort_by_date: false,
  ...Object.fromEntries(BINS.map((b) => [`${b.key}_color`, b.color])),
};
