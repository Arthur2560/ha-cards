# Wetter Heute

![Wetter Heute](https://raw.githubusercontent.com/Arthur2560/ha-cards/main/docs/images/weather-today-card.png)

Kompakte Wetterkarte mit **großem, schnell lesbarem Text** – gedacht für Wand-Tablets (z. B. iPad).
Nicht höher als die Standard-Wetterkarte (2 Rasterzeilen in Sections-Dashboards).

**Tag (7–20 Uhr) und Nacht (20–7 Uhr)** – Uhrzeiten im Editor einstellbar:

- **Tagsüber** wird immer **von jetzt bis 22 Uhr** ausgewertet. Was schon vorbei ist, fällt weg – mittags
  steht also kein „Morgens Regen“ mehr. Die Karte rechnet jede Minute neu, neue Vorhersagen kommen
  automatisch.
- **Ab 20 Uhr** zeigt die Karte **„Heute Nacht:“** mit der **Tiefsttemperatur bis 7 Uhr morgens**
  (bei Frost blau) und einem Icon für das Nachtwetter (klar, Regen, Schnee, …). Rechts daneben klein
  **„Morgen:“** mit einem Icon für das Wetter des kommenden Tages (7–22 Uhr). Um 7 Uhr wechselt die
  Karte wieder in die Tagesansicht.

Tagesansicht:

- **Links:** Icon für das Wetter bis zum Abend (Regen, Schnee, Gewitter, Wind, Sonne, …)
- **Mitte:** „Heute:“ und darunter 1–2 Stichworte, z. B.
  - `Regen` – regnet den Großteil der Zeit
  - `Abends Regen` – nur in einem Tagesabschnitt
  - `Morgens Regen` / `Abends Regen` – zwei getrennte Abschnitte, zwei Zeilen
  - `Tagsüber Regen`, `Zeitweise Regen`, `Morgen früh Regen`
  - `Windig` / `Sehr windig`, `Sonnig`, `Teils bewölkt`, `Bewölkt`, `Nebel`, `Schnee`, `Gewitter`, …
- **Rechts:** vorhergesagte Höchsttemperatur des Tages (optional mit Tiefstwert)
- **Unten rechts:** aktuelle Temperatur
- Tippen öffnet die Detailansicht der Wetter-Entität

Tagesabschnitte: Morgens 5–10 Uhr · Mittags 10–14 · Nachmittags 14–18 · Abends 18–22 · Nachts 22–5 ·
„Morgen früh“ = Morgen des Folgetags.

Die Vorhersage wird wie bei der HA-eigenen Wetterkarte live abonniert (stündlich + täglich). Liefert
die Integration keine stündliche Vorhersage, zeigt die Karte den aktuellen Zustand.

## Visueller Editor

| Abschnitt | Feld | Schlüssel | Standard |
|-----------|------|-----------|----------|
| – | Wetter-Entität (Vorhersage) – Pflicht | `weather_entity` | – |
| – | Außentemperatur-Sensor (optional) | `temperature_entity` | Wert der Wetter-Entität |
| – | Überschrift tagsüber | `title` | Heute |
| – | Überschrift nachts | `night_title` | Heute Nacht |
| Tag & Nacht | Tag beginnt um (Uhr) | `day_start` | 7 |
| | Tag auswerten bis (Uhr) | `day_end` | 22 |
| | Nachtansicht ab (Uhr) | `night_start` | 20 |
| Vorhersage & Schwellwerte | Regen ab Wahrscheinlichkeit (%) | `precipitation_probability` | 60 |
| | „Windig“ ab (km/h) | `wind_threshold` | 30 |
| | „Sehr windig“ ab (km/h) | `strong_wind_threshold` | 50 |
| | Tiefsttemperatur anzeigen | `show_low` | aus |

## YAML (nur zur Info)

```yaml
type: custom:weather-today-card
weather_entity: weather.forecast_home
temperature_entity: sensor.aussentemperatur
```
