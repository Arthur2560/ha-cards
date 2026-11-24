# HA Cards

![HA Cards](https://raw.githubusercontent.com/Arthur2560/ha-cards/main/docs/images/banner.jpg)

Sammlung eigener Dashboard-Karten für Home Assistant – **ein HACS-Repository, alle Karten**.

Jede Karte hat einen **visuellen Editor**: Alle benötigten Entitäten und Optionen werden direkt im
Dashboard-Editor ausgewählt – kein YAML nötig.

## Installation über HACS

1. HACS öffnen → oben rechts **⋮** → **Benutzerdefinierte Repositories**.
2. Repository: `https://github.com/Arthur2560/ha-cards`, Typ: **Dashboard** → **Hinzufügen**.
3. In HACS nach **HA Cards** suchen → **Herunterladen**.
4. Browser neu laden (ggf. Cache leeren).
5. Dashboard bearbeiten → **Karte hinzufügen** → die Karten dieses Repositorys erscheinen in der
   Liste (unter „Benutzerdefiniert“).

HACS legt die Dashboard-Ressource `/hacsfiles/ha-cards/ha-cards.js` automatisch an.

## Karten

| Karte | Typ | Beschreibung |
|-------|-----|--------------|
| [Fenster-Haus](src/cards/fenster-haus-card) | `custom:fenster-haus-card` | Hausquerschnitt – Räume werden rot, wenn ein zugeordnetes Fenster offen ist. |
| [LD2450 Radar](src/cards/ld2450-radar-card) | `custom:ld2450-radar-card` | Radar-Fächer des LD2450 – erkannte Personen als Punkte mit Entfernung und Winkel. |
| [Wetter Heute](src/cards/weather-today-card) | `custom:weather-today-card` | Kompakte Wetterkarte mit großem Text – tagsüber Stichworte bis zum Abend + Tagestemperatur, nachts Tiefsttemperatur. |
| [Müllabholung](src/cards/waste-collection-card) | `custom:waste-collection-card` | Flacher Streifen pro Tonne mit dem nächsten Abholtag (Heute, Morgen, Mittwoch, Nächste Woche …). |
| [Fußbodenheizung](src/cards/floor-heating-card) | `custom:floor-heating-card` | Solltemperatur mit − / + in 0,5-°C-Schritten, aktuelle Raumtemperatur darunter. |

## Entwicklung

```bash
npm install
npm run build    # baut dist/ha-cards.js
npm run watch    # baut bei jeder Änderung neu
```

Aufbau, Konventionen und die Checkliste für neue Karten stehen in [CLAUDE.md](CLAUDE.md).
