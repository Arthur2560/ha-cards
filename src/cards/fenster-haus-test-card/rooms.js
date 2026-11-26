// Raum-Daten für die Test-Variante der Fenster-Haus-Karte.
// Wände, Rahmen und Raumflächen kommen aus der normalen Fenster-Haus-Karte;
// die Raumnamen sind hier echter SVG-Text (statt Buchstaben-Umrissen).
import { ZONES, LABELS } from "../fenster-haus-card/geometry.js";

// Standard-Beschriftung im Raum (leer = keine)
export const DEFAULT_TEXT = {
  spitze: "",
  dach_links: "",
  dach_rechts: "",
  oben_links: "",
  oben_bad: "Bad",
  oben_arthur: "Arthur",
  mitte_flur: "Flur",
  mitte_arthur: "Arthur",
  mitte_bett: "Bett",
  mitte_bad: "Bad",
  unten_flur: "Flur",
  unten_bad: "Bad",
  unten_links: "",
};

export const FLOORS = [
  { title: "Dachgeschoss", icon: "mdi:home-roof", zones: ["spitze", "dach_links", "dach_rechts"] },
  { title: "Obergeschoss", icon: "mdi:home-floor-2", zones: ["oben_links", "oben_bad", "oben_arthur"] },
  { title: "Mittleres Geschoss", icon: "mdi:home-floor-1", zones: ["mitte_flur", "mitte_arthur", "mitte_bett", "mitte_bad"] },
  { title: "Erdgeschoss", icon: "mdi:home-floor-0", zones: ["unten_flur", "unten_bad", "unten_links"] },
];

/** Umgebendes Rechteck jeder Raumfläche */
export const BOXES = Object.fromEntries(
  Object.entries(ZONES).map(([k, d]) => {
    const n = d.match(/-?\d+(\.\d+)?/g).map(Number);
    const xs = n.filter((_, i) => i % 2 === 0);
    const ys = n.filter((_, i) => i % 2 === 1);
    let box = { x: Math.min(...xs), y: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
    // Erdgeschoss links: oben links läuft das schräge Dach -> Inhalt etwas tiefer
    if (k === "unten_links") box = { ...box, y: 82.9 };
    // Spitze ist ein Dreieck -> Inhalt im unteren Teil
    if (k === "spitze") box = { ...box, x: 46, x2: 60.6, y: 10 };
    return [k, { ...box, w: box.x2 - box.x, h: box.y2 - box.y }];
  })
);

export const PERSONS = [1, 2, 3];
export const PERSON_COLORS = { 1: [66, 165, 245], 2: [102, 187, 106], 3: [171, 71, 188] };

// Material-Design-Icons (mdi:lock / mdi:lock-open-variant), 24×24
export const ICON_LOCK =
  "M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z";
export const ICON_LOCK_OPEN =
  "M18 1C15.24 1 13 3.24 13 6V8H4C2.9 8 2 8.89 2 10V20C2 21.11 2.9 22 4 22H16C17.11 22 18 21.11 18 20V10C18 8.9 17.11 8 16 8H15V6C15 4.34 16.34 3 18 3C19.66 3 21 4.34 21 6V8H23V6C23 3.24 20.76 1 18 1M10 13C11.1 13 12 13.89 12 15C12 16.11 11.11 17 10 17C8.9 17 8 16.11 8 15C8 13.9 8.9 13 10 13Z";

export { ZONES, LABELS };
