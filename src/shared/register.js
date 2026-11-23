// Gemeinsame Registrierung für alle Karten dieses Repositorys.
//
// registerCard() sorgt dafür, dass
//  1. das Karten-Element (custom:<type>) definiert wird,
//  2. das Editor-Element definiert wird,
//  3. die Karte im Dashboard-Kartenauswahl-Dialog ("Karte hinzufügen") erscheint.

/**
 * @param {object} opts
 * @param {string} opts.type         Element-Name, z. B. "ld2450-radar-card" (=> type: custom:ld2450-radar-card)
 * @param {string} opts.name         Anzeigename im Kartenauswahl-Dialog
 * @param {string} opts.description  Kurzbeschreibung im Kartenauswahl-Dialog
 * @param {CustomElementConstructor} opts.card    Klasse der Karte
 * @param {CustomElementConstructor} opts.editor  Klasse des visuellen Editors (PFLICHT)
 * @param {boolean} [opts.preview=true]
 * @param {string}  [opts.documentationURL]
 */
export function registerCard({ type, name, description, card, editor, preview = true, documentationURL }) {
  if (!editor) {
    throw new Error(`[ha-cards] ${type}: Jede Karte braucht einen visuellen Editor (siehe CLAUDE.md).`);
  }
  const editorType = `${type}-editor`;

  if (!customElements.get(editorType)) customElements.define(editorType, editor);
  if (!customElements.get(type)) customElements.define(type, card);

  // Verknüpfung Karte -> Editor, falls die Karte es nicht selbst tut.
  if (!card.getConfigElement) {
    card.getConfigElement = () => document.createElement(editorType);
  }

  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === type)) {
    window.customCards.push({
      type,
      name,
      description,
      preview,
      documentationURL:
        documentationURL ?? `https://github.com/Arthur2560/ha-cards/tree/main/src/cards/${type}`,
    });
  }
}

export function logBanner(version, cards) {
  console.info(
    `%c HA-CARDS %c v${version} – ${cards.length} Karte(n): ${cards.join(", ")} `,
    "color:#fff;background:#03a9f4;font-weight:700;border-radius:3px 0 0 3px;padding:2px 4px",
    "color:#03a9f4;background:#fff;border:1px solid #03a9f4;border-radius:0 3px 3px 0;padding:1px 4px"
  );
}
