# Node-RED Lichtlogik

Stand: 2026-05-13

## Zweck

Diese Dokumentation beschreibt die neue zentrale Lichtlogik fuer das Node-RED-Smarthome. Sie dient als Betriebs- und Migrationsdokumentation fuer die Lichtflows.

Der aktuelle produktive Pilot ist `LI - Flur OG`. Weitere Raeume sind noch nicht migriert.

## Architektur

Die neue Lichtlogik trennt die Lichtsteuerung in drei Ebenen:

1. Raumflow, z.B. `LI - Flur OG`
   - enthaelt Bewegungs-, Zeit-, Helligkeits- und Raumlogik
   - erzeugt strukturierte Lichtanforderungen
   - entscheidet weiterhin, wann und mit welchen Parametern ein Raum Licht anfordert

2. `LI - Koordination`
   - prueft strukturierte Lichtanforderungen
   - bewertet Prioritaeten
   - loest Konflikte pro Ziel
   - unterdrueckt identische Ausgaben
   - gibt nur final akzeptierte Aktionen weiter

3. `LI - Ausgabe`
   - sequenziert die final akzeptierten Aktionen
   - fuehrt Home-Assistant-Service-Calls aus
   - trifft keine fachlichen Entscheidungen

Diagnoseereignisse laufen zentral ueber `SY - Diagnose`.

## Zentrale Flows

### `LI - Request Builder`

Der Request Builder erzeugt `li.request.v1` Nachrichten. Er unterstuetzt direkte Parameter weiterhin, z.B.:

- `brightness_pct`
- `rgb_color`
- `kelvin`
- freie `data`-Objekte

Zusaetzlich werden strukturierende Metadaten gesetzt:

- `origin`
- `intent`
- `priorityClass`
- `priority`
- `scope`
- `room`
- `profile`

Profile sind vorbereitet, aber nicht verpflichtend. Die Raeume duerfen weiterhin direkt parametriert werden.

### `LI - Koordination`

Die Koordination ist die zentrale Entscheidungsstelle fuer Lichtanforderungen.

Aufgaben:

- Request validieren
- Prioritaetsklasse bestimmen
- Zielkonflikte bewerten
- `manual_off` immer fuer den aktuellen Ausschaltbefehl akzeptieren
- identische Sollzustaende deduplizieren
- Diagnose pro Entscheidung erzeugen

Wichtig: Prioritaeten gelten nur fuer einen aktiven `on`-Sollzustand. Sobald ein Ziel erfolgreich ausgeschaltet wird, wird die gespeicherte Prioritaet fuer dieses Ziel auf `0 / none` gesetzt. Ein ausgeschaltetes Licht darf durch alte Prioritaeten nicht am erneuten Einschalten gehindert werden.

### `LI - Ausgabe`

Die Ausgabe fuehrt nur final entschiedene Aktionen aus.

Aufgaben:

- Aktionen in Home-Assistant-Service-Calls umwandeln
- ungueltige Ausgaben verwerfen
- Ausgabeereignisse an `SY - Diagnose` melden
- Fehlerpfad zentral diagnostizieren

Die Ausgabe trifft keine fachliche Entscheidung ueber Prioritaet, Zustand, Raumlogik oder Gueltigkeit einer Anforderung jenseits technischer Ausfuehrbarkeit.

### `SY - Diagnose`

`SY - Diagnose` ist der zentrale Diagnose- und Log-Flow.

Diagnoseereignisse enthalten:

- `level`
- `domain`
- `flow`
- `event`
- `source`
- `target`
- `reason`
- `message`
- `summary`
- `details`
- `correlation_id`

Das Feld `summary` wird im Format erzeugt:

```text
Quelle -> Ziel -> Entscheidung -> Grund
```

Push-Benachrichtigungen entstehen nur fuer:

- `error`
- `critical`

Alle anderen Level werden nur zentral gespeichert und im Diagnose-Debug sichtbar.

## Prioritaetsmodell

| Klasse | Prioritaet | Zweck |
| --- | ---: | --- |
| `manual_off` | 120 | einmaliges manuelles Ausschalten |
| `safety` | 100 | Sicherheitsanforderungen |
| `camera` | 90 | Kamera-/Erkennungsanforderungen |
| `absence` | 80 | Abwesenheitslogik |
| `manual_on` | 70 | manuelles Einschalten oder manuelle Anpassung |
| `routine` | 60 | Routinen und Szenen |
| `presence_automation` | 50 | Bewegungs-/Praesenzautomatik |
| `comfort` | 40 | Komfortfunktionen |
| `technical` | 10 | technische Status- oder Hilfsaktionen |

Regeln:

- `manual_off` gewinnt immer fuer den aktuellen Ausschaltbefehl.
- `manual_off` ist kein Sperrzustand.
- Ein automatisches `turn_off` gewinnt nicht automatisch, sondern nur ueber seine normale Prioritaetsklasse.
- Eine niedrigere Prioritaet wird nur abgelehnt, wenn fuer das Ziel noch ein aktiver `on`-Sollzustand mit hoeherer Prioritaet gespeichert ist.
- Ist das Ziel `off`, ist die aktive Prioritaet neutral.

## Diagnoselevel

| Level | Bedeutung | Push |
| --- | --- | --- |
| `debug` | Dedupe, Detailinformationen | Nein |
| `info` | normale akzeptierte Entscheidung oder Ausgabe | Nein |
| `warning` | verworfene oder ungueltige Anforderung | Nein |
| `error` | Flowfehler oder technische Stoerung | Ja |
| `critical` | kritische Stoerung | Ja |

LI-Ereignisse:

- `accepted` / `emitted` -> `info`
- `deduplicated` -> `debug`
- `rejected_lower_priority` -> `info`
- `rejected_invalid` / `rejected` -> `warning`
- Catch-Fehler -> `error`

## Aktueller Pilot

Pilotflow:

```text
LI - Flur OG
```

Der Pilot ist auf die zentrale Struktur angebunden:

- Raumlogik bleibt im Flow.
- Zeit-, Bewegungs-, Helligkeits- und Ausschaltverzoegerungslogik bleiben lokal.
- Lichtanforderungen laufen ueber `LI - Request Builder`.
- Akzeptierte Requests laufen ueber `LI - Koordination`.
- Ausgaben laufen ueber `LI - Ausgabe`.
- Diagnose laeuft ueber `SY - Diagnose`.

Lokale Debug-Nodes in den Pilotflows bleiben als Reserve vorhanden, sind aber deaktiviert.

## Migrationsschema Fuer Weitere Raeume

Ein weiterer LI-Flow wird erst nach ausreichendem Pilotbetrieb migriert.

Pro Raum:

1. Vorher-Backup erstellen.
2. Bestehende direkten Licht-Service-Calls identifizieren.
3. Raumparameter erfassen:
   - `room`
   - Ziel-Entitaeten
   - Lichtgruppe
   - Dimmgruppe
   - Farbgruppe
   - vorhandene Helligkeitswerte
   - Tageszeit-/Nachtlicht-/Abendlichtlogik
4. Direkte Lichtaktionen durch `LI - Request Builder` ersetzen.
5. `origin`, `intent`, `priorityClass`, `priority`, `scope`, `room` setzen.
6. Bestehende Zeit- und Bewegungslogik im Raumflow belassen.
7. Diagnosepfad an `SY - Diagnose` anbinden.
8. Lokale Debug-Nodes deaktivieren, nicht loeschen.
9. Dry-Run und Diff pruefen.
10. Raum praktisch testen.

Nicht automatisch migrieren:

- RO-Flows
- BR-Flows
- WA-Flows
- KAM-Flows
- SPS-Flows
- GES-Flows

Diese Flows koennen spaeter bewusst angebunden oder als dokumentierte Ausnahme belassen werden.

## Bekannte Ausnahmen

Aktuell duerfen andere lichtschaltende Flows ausserhalb der neuen LI-Struktur weiter direkt schalten. Diese Zugriffe sind noch nicht final inventarisiert und gehoeren in einen spaeteren Schritt.

Ziel fuer die spaetere Professionalisierung:

- direkte Lichtzugriffe finden
- fachliche Besitzer festlegen
- entweder auf zentrale Lichtanforderungen migrieren
- oder als begruendete Ausnahme dokumentieren

## Testcheckliste Pilot

Fuer `LI - Flur OG`:

- Bewegung schaltet wie bisher ein.
- Ausschaltverzoegerungen bleiben wie bisher.
- Helligkeitsbedingungen bleiben wie bisher.
- Tageszeitbedingungen bleiben wie bisher.
- Lichtschalter kann immer ausschalten.
- Manuelles Ausschalten sperrt keine spaetere Automatik.
- Identischer Request wird dedupliziert.
- Unterschiedliche Helligkeit wird ausgegeben.
- Unterschiedliche Farbe wird ausgegeben, sofern im Raum vorhanden.
- Ungueltige Entity-Konfiguration wird als `warning` diagnostiziert.
- `LI - Ausgabe` erhaelt nur final akzeptierte Aktionen.
- `SY - Diagnose` zeigt Entscheidungen mit `summary`.
- Push kommt nur bei `error` oder `critical`.

## Wichtige Backups

Relevante Sicherungen aus der Einfuehrung:

- `before_li_pilot_logic_final_20260513`
- `after_li_manual_off_priority_clear_20260513`
- `before_li_pilot_diagnose_final_20260513`
- `after_li_pilot_diagnose_final_20260513`

Vor jeder weiteren Raummigration ist ein neues Backup zu erstellen.

## Betriebsregeln

- Keine weitere LI-Migration ohne vorherigen Pilot-Test.
- Keine zentrale Uebernahme von Zeitlogik, solange die Raumflows diese sauber abbilden.
- `LI - Ausgabe` darf keine fachliche Logik enthalten.
- `LI - Koordination` ist die einzige Stelle fuer Prioritaetsentscheidungen.
- `SY - Diagnose` ist die zentrale Stelle fuer Log und Fehlerpfad.
- Lokale Debug-Nodes duerfen fuer Fehlersuche temporaer aktiviert werden, sollen im Normalbetrieb aber deaktiviert bleiben.
