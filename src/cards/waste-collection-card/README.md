# Müllabholung

![Müllabholung](https://raw.githubusercontent.com/Arthur2560/ha-cards/main/docs/images/waste-collection-card.png)

Flache Karte (12 × 1 Einheiten im Sections-Dashboard) für die Integration
[Waste Collection Schedule](https://github.com/mampfes/hacs_waste_collection_schedule).
Pro Tonne ein farbiger, abgerundeter Balken mit Beschriftung (Rest / Wertstoff / Bio), darunter der
nächste Abholtag – ohne Icons, ohne Titel. Die Textfarbe im Balken wird automatisch kontrastreich zur
Balkenfarbe gewählt (weiß auf Schwarz/Braun, schwarz auf Gelb).

**Höhe frei wählbar (1–4 Zeilen und mehr):** Je höher die Kachel, desto dicker die Balken und desto
größer die Schrift – solange der Text in die Breite passt. Alle Balkentexte bzw. Datumsangaben sind
gleich groß; Heute/Morgen etwas größer und fett.

```yaml
grid_options:
  columns: 12
  rows: 2
```

| Abholung | Anzeige |
|----------|---------|
| heute | **Heute** (fett, größer) |
| morgen | **Morgen** (fett, größer) |
| später in dieser Woche | Mittwoch |
| in der nächsten Woche | Nächste Woche Mittwoch (bei wenig Platz: Nächste Woche Mi. / Nä. Woche Mi.) |
| später | In 12 Tagen |

Wochen beginnen am Montag. Tippen auf eine Tonne öffnet die Detailansicht des Sensors.

Das Datum wird aus den Sensor-Attributen gelesen (Standard-Format der Integration, z. B.
`2026-11-26: Restmüll`). Alternativ funktionieren das Attribut `daysTo` (Option `add_days_to`) oder
ein Zustand wie „Restmüll in 3 days“, „in 3 Tagen“, „Morgen“ oder ein Datum.

## Visueller Editor

| Abschnitt | Feld | Schlüssel | Standard |
|-----------|------|-----------|----------|
| Restmüll | Sensor / Farbe / Text im Balken | `restmuell_entity`, `restmuell_color`, `restmuell_text` | schwarz, „Rest“ |
| Wertstoffe | Sensor / Farbe / Text im Balken | `wertstoffe_entity`, `wertstoffe_color`, `wertstoffe_text` | gelb, „Wertstoff“ |
| Biomüll | Sensor / Farbe / Text im Balken | `bio_entity`, `bio_color`, `bio_text` | braun, „Bio“ |
| Papier (optional) | Sensor / Farbe / Text im Balken | `papier_entity`, `papier_color`, `papier_text` | blau, „Papier“ |
| Darstellung | Nach Abholtag sortieren | `sort_by_date` | aus |

Tonnen ohne Sensor werden ausgeblendet. Die Sensor-Auswahl zeigt nur Sensoren der
Waste-Collection-Schedule-Integration.

## YAML (nur zur Info)

```yaml
type: custom:waste-collection-card
restmuell_entity: sensor.restmuell
wertstoffe_entity: sensor.wertstoffe
bio_entity: sensor.biomuell
```
