# Kaffee-Timer

![Kaffee-Timer](https://raw.githubusercontent.com/Arthur2560/ha-cards/main/docs/images/coffee-timer-card.png)

Große Countdown-Anzeige für die Kaffeemaschine – gut lesbar auch auf einem Fernseher aus einiger
Entfernung. Zählt sekundengenau herunter (`m:ss`), zeigt den Fortschritt und optional die
voraussichtliche Uhrzeit („fertig ca. 14:32“). Bei 0:00 erscheint „Kaffee ist fertig!“.

Gedacht für 12 × 3 oder 12 × 4 Einheiten; alles skaliert mit der Kachelgröße. Die Sichtbarkeit steuerst
du in Home Assistant über die Sichtbarkeitsbedingung der Karte (z. B. Timer-Zustand = aktiv).

## Designs

| Design | Beschreibung |
|--------|--------------|
| **Geteilt** (`split`) | Text links, große Zeit rechts, Fortschrittsbalken am unteren Rand |
| **Ring** (`ring`) | Fortschrittsring mit Kaffeetasse links, Text + große Zeit rechts |
| **Füllstand** (`fill`) | alles zentriert, der Kartenhintergrund füllt sich mit Kaffeebraun |

## Datenquelle

- **Timer-Helfer** (`timer.*`, empfohlen): Endzeit (`finishes_at`) und Dauer (`duration`) werden direkt
  gelesen, der Countdown läuft in der Karte sekundengenau.
- **Sensor mit Zeitstempel**: Zustand = Endzeit. Für den Fortschritt optional eine Dauer-Entität
  (z. B. dein Durchschnitts-Helfer; Einheit s/min/h wird erkannt, ohne Einheit = Minuten).

## Visueller Editor

| Feld | Schlüssel | Standard |
|------|-----------|----------|
| Kaffee-Timer (Timer oder Zeitstempel-Sensor) – Pflicht | `timer_entity` | – |
| Durchschnittliche Dauer (optional) | `duration_entity` | Dauer des Timers |
| Design | `design` | Geteilt |
| Text | `title` | Neuer Kaffee braucht noch: |
| Text bei 0:00 | `done_text` | Kaffee ist fertig! |
| Farbe (Fortschritt) | `color` | Kaffeebraun |
| „fertig ca. HH:MM“ anzeigen | `show_end_time` | an |

## YAML (nur zur Info)

```yaml
type: custom:coffee-timer-card
timer_entity: timer.kaffee
design: split
grid_options:
  columns: 12
  rows: 3
visibility:
  - condition: state
    entity: timer.kaffee
    state: active
```
