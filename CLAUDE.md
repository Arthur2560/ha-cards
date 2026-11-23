# CLAUDE.md – Regeln für dieses Repository

Dieses Repository ist eine **Sammlung eigener Home-Assistant-Dashboard-Karten (Lovelace)**.
Es wird **als EIN Custom Repository (Typ „Dashboard“) in HACS** eingebunden. Alle Karten werden
zu einer einzigen Datei `dist/ha-cards.js` gebündelt; nach der Installation über HACS erscheinen
**alle Karten** im Dashboard unter „Karte hinzufügen“.

---

## ⚠️ OBERSTE REGEL: Jede Entität wird über einen visuellen Editor ausgewählt

Das ist dem Nutzer **ganz wichtig** und gilt für **jede** Karte, ohne Ausnahme:

1. **Jede Karte hat einen visuellen Editor** (`getConfigElement`). `registerCard()` wirft einen
   Fehler, wenn kein Editor übergeben wird.
2. **Jede Entität, auf die die Karte zugreift, bekommt ein eigenes Auswahlfeld** im Editor –
   mit einer verständlichen deutschen Beschriftung. Keine Entität darf nur per YAML einstellbar
   sein, keine Entität darf im Code fest verdrahtet oder per Namensmuster „erraten“ werden.
   - Beispiel **LD2450-Radar**: eigene Auswahl für *Ziel 1 – Koordinate X*, *Ziel 1 – Koordinate Y*,
     *Ziel 1 – Geschwindigkeit*, *Ziel 2 – Koordinate X*, … usw.
   - Beispiel **Wetter**: eigene Auswahl für *Wetter-Entität (Forecast)*, ggf. *Außentemperatur-Sensor*,
     *Luftfeuchte-Sensor* usw.
3. Auswahlfelder werden mit **Home-Assistant-Selektoren** gebaut und so eng wie sinnvoll gefiltert
   (`domain`, `device_class`, `integration`), damit der Nutzer schnell die richtige Entität findet:
   ```js
   { name: "target1_x", required: true,
     selector: { entity: { domain: "sensor", device_class: "distance" } } }
   { name: "weather_entity", required: true, selector: { entity: { domain: "weather" } } }
   ```
4. Auch **alle anderen Optionen** (Titel, Farben, Größen, Bereiche, Schalter, Zahlen) sind im
   visuellen Editor einstellbar (Selektoren `text`, `number`, `boolean`, `select`, `color_rgb`,
   `icon`, `area`, `device`, …). Zusammengehörige Felder mit `type: "expandable"` oder
   `type: "grid"` gruppieren (z. B. ein ausklappbarer Abschnitt pro Radar-Ziel).
5. Die Karte darf bei fehlenden Entitäten **nicht abstürzen**, sondern zeigt einen freundlichen
   Hinweis („Bitte im visuellen Editor … auswählen“). `setConfig()` wirft deshalb keinen Fehler
   für fehlende Entitäten.
6. Jede Karte liefert `static getStubConfig(hass)` für sinnvolle Startwerte.

## Aufbau

```
hacs.json                 HACS-Konfiguration (filename: ha-cards.js) – nicht umbenennen
package.json              Version + Build-Skripte
scripts/build.mjs         bündelt alle src/cards/*/index.js -> dist/ha-cards.js
dist/ha-cards.js          GEBAUTE Datei – wird eingecheckt, HACS lädt genau diese
src/shared/register.js    registerCard(): definiert Karte + Editor, trägt sie in window.customCards ein
src/shared/schema-editor.js  SchemaEditor: Basis-Klasse für alle visuellen Editoren (nutzt <ha-form>)
src/cards/_vorlage/       Kopiervorlage (Ordner mit "_" werden nicht gebaut)
src/cards/<karten-typ>/   eine Karte pro Ordner:
    index.js              registerCard({...})
    card.js               die Karte (HTMLElement, Shadow DOM, <ha-card>)
    editor.js             visueller Editor (extends SchemaEditor)
    README.md             Beschreibung + Tabelle aller Editor-Felder + YAML-Beispiel
```

## Neue Karte anlegen – Checkliste

1. `src/cards/_vorlage` nach `src/cards/<karten-typ>` kopieren. Ordnername = Element-Name,
   klein mit Bindestrichen, endet auf `-card` (z. B. `ld2450-radar-card`, `weather-forecast-card`).
   In YAML heißt sie dann `type: custom:<karten-typ>`.
2. In `index.js` `type`, `name` (deutsch) und `description` (deutsch) setzen.
3. `editor.js`: **für jede benötigte Entität ein eigenes Feld** (siehe oberste Regel), mit `labels`
   und `helpers` auf Deutsch.
4. `card.js` implementieren: `setConfig`, `set hass`, `getCardSize`, `getGridOptions`,
   `static getStubConfig`. Nur neu rendern, was sich ändert (hass-Updates kommen sehr oft).
   Theme-Variablen von HA verwenden (`--primary-color`, `--primary-text-color`,
   `--secondary-text-color`, `--card-background-color`, …), damit Hell/Dunkel funktioniert.
5. `README.md` der Karte schreiben (Feld-Tabelle des Editors + YAML-Beispiel) und die Karte in der
   Kartenliste im Haupt-`README.md` ergänzen.
6. Version in `package.json` erhöhen (SemVer), dann `npm run build`.
7. **`dist/ha-cards.js` mit committen** – sonst sieht HACS die Änderung nicht.

## Technische Regeln

- Kein Framework nötig: Karten sind normale Web Components (`HTMLElement`). Externe
  npm-Abhängigkeiten nur, wenn wirklich sinnvoll – sie werden von esbuild mitgebündelt.
- Keine Dateien außer `dist/ha-cards.js` zur Laufzeit nachladen (HACS registriert nur diese eine
  Ressource). Bilder/Icons inline (SVG) oder als `mdi:`-Icons.
- Benutzertexte (UI, Editor-Beschriftungen, Fehlermeldungen, READMEs) auf **Deutsch**.
- Element-Namen immer mit `customElements.get()` prüfen (macht `registerCard` automatisch).
- Build: `npm install` (einmalig), danach `npm run build` bzw. `npm run watch`.

## Release / HACS

- HACS nutzt ohne Releases den neuesten Commit des Standard-Branches.
- Für saubere Update-Hinweise in HACS: Version in `package.json` erhöhen, bauen, committen und
  einen Tag `v<version>` pushen → der Workflow `release.yml` erstellt ein GitHub-Release mit
  `ha-cards.js` als Anhang.
- `validate.yml` prüft bei jedem Push, ob das Repository HACS-konform ist und `dist/` aktuell ist.
