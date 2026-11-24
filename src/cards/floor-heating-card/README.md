# Fußbodenheizung

![Fußbodenheizung](https://raw.githubusercontent.com/Arthur2560/ha-cards/main/docs/images/floor-heating-card.png)

Einfache Thermostat-Karte: links „Fußbodenheizung“ und darunter die aktuelle Raumtemperatur,
rechts die eingestellte Solltemperatur mit **−** und **+** (Standard: 0,5-°C-Schritte).

- Der neue Wert wird sofort angezeigt und **1 Sekunde nach dem letzten Tipp** an das Thermostat
  gesendet – mehrfaches Tippen erzeugt also nur einen Befehl.
- **Heizbetrieb** (`hvac_action: heating`): Kartenhintergrund leicht orange angehaucht (zur
  Temperatur hin etwas kräftiger). Per Schalter abschaltbar – dann wird stattdessen die
  Solltemperatur orange.
- **Textgrößen** für Überschrift, aktuelle Temperatur, Solltemperatur und Knöpfe einzeln im Editor
  einstellbar (50–250 %).
- Ist das Thermostat aus, steht „· Aus“ hinter der aktuellen Temperatur.
- Grenzen `min_temp` / `max_temp` des Thermostats werden eingehalten.
- Tippen auf den Text öffnet die Detailansicht des Thermostats.
- Größe skaliert mit der Kachel (Standard 12 × 2, ab 1 Zeile möglich).

## Visueller Editor

| Feld | Schlüssel | Standard |
|------|-----------|----------|
| Thermostat (Klima-Entität) – Pflicht | `climate_entity` | – |
| Raumtemperatur-Sensor (optional) | `temperature_entity` | aktuelle Temperatur des Thermostats |
| Überschrift | `title` | Fußbodenheizung |
| Schrittweite (°C) | `step` | 0,5 |
| Beim Heizen Hintergrund orange einfärben | `heating_background` | an |
| Textgrößen → Überschrift (%) | `size_title` | 100 |
| Textgrößen → Aktuelle Temperatur (%) | `size_current` | 100 |
| Textgrößen → Solltemperatur (%) | `size_target` | 100 |
| Textgrößen → − / + Knöpfe (%) | `size_buttons` | 100 |

## YAML (nur zur Info)

```yaml
type: custom:floor-heating-card
climate_entity: climate.fussbodenheizung_wohnzimmer
temperature_entity: sensor.wohnzimmer_temperatur
```
