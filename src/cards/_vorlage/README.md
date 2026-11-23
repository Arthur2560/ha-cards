# Vorlage-Karte

Kopiervorlage für neue Karten (wird nicht gebaut, weil der Ordner mit `_` beginnt).

## Visueller Editor

| Feld   | Auswahl                   | Pflicht |
|--------|---------------------------|---------|
| Titel  | Text                      | nein    |
| Sensor | Entität (Domain `sensor`) | ja      |

## YAML (nur zur Info – alles ist im visuellen Editor einstellbar)

```yaml
type: custom:vorlage-card
title: Wohnzimmer
entity: sensor.wohnzimmer_temperatur
```
