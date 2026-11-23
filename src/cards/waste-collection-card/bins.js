// Tonnen in fester Reihenfolge (links -> rechts)
// label: Name im Editor, text: Standard-Beschriftung im Balken
export const BINS = [
  { key: "restmuell", label: "Restmüll", text: "Rest", color: [0, 0, 0] },
  { key: "wertstoffe", label: "Wertstoffe", text: "Wertstoff", color: [255, 214, 0] },
  { key: "bio", label: "Biomüll", text: "Bio", color: [121, 85, 72] },
  { key: "papier", label: "Papier", text: "Papier", color: [30, 100, 200] },
];

export const DEFAULTS = {
  sort_by_date: false,
  ...Object.fromEntries(BINS.map((b) => [`${b.key}_color`, b.color])),
  ...Object.fromEntries(BINS.map((b) => [`${b.key}_text`, b.text])),
};
