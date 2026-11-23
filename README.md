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

## Entwicklung

```bash
npm install
npm run build    # baut dist/ha-cards.js
npm run watch    # baut bei jeder Änderung neu
```

Aufbau, Konventionen und die Checkliste für neue Karten stehen in [CLAUDE.md](CLAUDE.md).
