# Node-RED Smarthome Audit - Professionalisierung

Datum: 2026-05-11  
Instanz: Node-RED mit Home-Assistant-Anbindung  
Ziel: Bewertung der bestehenden Flows und Ableitung von Verbesserungen, um das DIY-Smarthome in Richtung einer professionellen, wartbaren und erweiterbaren Automatisierungsloesung zu entwickeln.

## 1. Umfang und Vorgehen

Dieses Dokument ist ein reines Audit. An der Node-RED-Instanz, an Home Assistant und an bestehenden Flows wurden keine Aenderungen vorgenommen.

Die Auswertung basiert auf einer statischen Sicht ueber die Node-RED-MCP-Schnittstelle. Geprueft wurden Struktur, Namensschema, Flow-Zuschnitt, Wiederverwendung, direkte Aktorzugriffe, Diagnosemuster, Fehlerbehandlung und Erweiterbarkeit. Es wurden keine Laufzeitdaten, historischen Events, Home-Assistant-Recorder-Daten oder physikalischen Funktionstests ausgewertet.

## 2. Kurzfazit

Die Installation ist bereits deutlich ueber einem typischen DIY-Niveau. Es gibt klare Domaenenpraefixe, viele Gruppen, Subflows, Error-Catch-Strukturen, ein Licht-Automatisierungs-Template und einzelne neuere Flows mit gutem Designansatz, zum Beispiel `AL - 33 Trigger`, `GES - NINA neu` und `LI - Abwesenheit`.

Der groesste Professionalisierungsschritt ist nicht eine einzelne neue Automation, sondern eine konsequente Architekturentscheidung:

> Jeder physische Aktor braucht genau einen fachlichen Owner. Andere Flows duerfen keine Aktoren direkt schalten, sondern nur strukturierte Anforderungen mit Quelle, Grund, Prioritaet und Gueltigkeit an den Owner senden.

Aus SPS-Sicht entspricht das der Trennung von Eingangsaufbereitung, Betriebsarten, Freigaben, Verriegelungen, Ablauf-/Regellogik, Aktorausgabe und Diagnose. Genau diese Trennung sollte in Node-RED staerker formalisiert werden.

## 3. Bestandsaufnahme

| Kennzahl | Wert | Bewertung |
| --- | ---: | --- |
| Node-RED-Objekte gesamt | 6174 | Sehr grosse Installation, Architekturdisziplin wird zwingend |
| Tabs | 192 | Gute Domaenenaufteilung, aber hohes Risiko fuer verteilte Logik |
| Gruppen | 510 | Visualisierung wird genutzt, Gruppennamen sind teils leer |
| Subflows | 11 | Gute Basis, aber fuer die Groesse noch zu wenig Standardisierung |
| `api-call-service` Nodes | 1060 | Sehr viele direkte Home-Assistant-Serviceaufrufe |
| `server-state-changed` Nodes | 936 | Sehr eventgetriebene Struktur |
| `api-current-state` Nodes | 903 | Viele lokale Abfragen und Freigabepruefungen |
| `switch` Nodes | 496 | Viele Verzweigungen, Risiko fuer Duplikation |
| `function` Nodes | 233 | Genug Logik fuer Coding-Standards und Bibliotheken |
| Link-Nodes | 618 | Intensive interne Verdrahtung, braucht klare Konventionen |
| Catch-Nodes | 62 | Fehlerbehandlung vorhanden, aber nicht zentralisiert |
| Debug-Nodes | 65 | Diagnose vorhanden, Produktionskonzept fehlt |
| Runtime-Status | `start` | Instanz lief zum Auditzeitpunkt |

### Domaenenstruktur

Die Flows sind grob nach Domaenen organisiert:

`Alarmanlage`, `Aquarium`, `Brandmeldeanlage`, `Datenbank`, `Endgeraet`, `Fortbewegung`, `Geofencing`, `Gesundheit`, `Heimgeraete`, `Kalender`, `Kamera`, `Klima`, `Licht`, `Medienkontrolle`, `Netzwerk`, `Relais`, `Routine`, `Sprachausgabe`, `Sprachsteuerung`, `Staubsauger`, `Steckdosen`, `Strom`, `System`, `ToDo`, `Wassermeldeanlage`, `Wetter`, `Zahnbuerste`.

Diese Domaenenstruktur ist eine gute Basis. Sie muss aber um technische Verantwortlichkeiten ergaenzt werden: Welche Domaene darf lesen, welche darf entscheiden, welche darf Aktoren schreiben, welche darf nur Anforderungen stellen?

## 4. Positive Befunde

### 4.1 Namensraeume und Domaenenpraefixe

Die Praefixe wie `AL`, `LI`, `RO`, `WA`, `SY` und weitere sind wertvoll. Sie schaffen Orientierung und eignen sich als Grundlage fuer eine Owner-Matrix.

Empfehlung: Die Praefixe verbindlich definieren und je Praefix Zweck, erlaubte Ein-/Ausgaenge und erlaubte Home-Assistant-Domaenen dokumentieren.

### 4.2 Licht-Automatisierungs-Template

Der Subflow `Licht - Automatisierung - Template` ist ein wichtiger Baustein. Er zeigt bereits professionelle Konzepte:

- zentrale Statusverfolgung
- Trennung von Automatik, Manuellbedienung und Wandschalter
- dynamische Zielgruppen ueber Flow-Kontext
- Lichtanforderungen mit mehreren Helligkeitsstufen
- Wiederverwendung ueber Subflow-Struktur

Das Template sollte nicht ersetzt, sondern formalisiert werden. Es braucht einen klaren Vertrag: Eingangsnachrichten, erlaubte Statuswerte, Prioritaeten, Timeout-Verhalten, Fehlerausgaenge und Diagnoseevents.

### 4.3 Gute neue Flow-Muster

`AL - 33 Trigger` wirkt wie ein gutes Referenzdesign: klare Gruppierung, Mapping-Funktion, Pruefkette, Status-/Fehlerpfad und Catch-Node.

`GES - NINA neu` zeigt ebenfalls ein professionelleres Muster: Zusammenfassung mehrerer Trigger, Deduplizierung, Attribut-Updates, Fehlerdrosselung und bewusste Beschreibung.

Diese neueren Muster sollten als Designreferenz fuer kuenftige Umbauten genutzt werden.

### 4.4 Systemweite Timer

`SY - Timer` stellt allgemeine Takte wie minuetlich, viertelstuendlich, halbstuendlich, stuendlich, taeglich und monatlich bereit. Das ist eine gute Idee, weil dadurch zyklische Logik zentralisiert werden kann.

Empfehlung: Aus den Takten ein formalisiertes internes Event-System machen, zum Beispiel `sys.tick.minute`, `sys.tick.hour`, `sys.tick.day`.

## 5. Zentrale Architekturprobleme

### 5.1 Unklare Aktor-Ownership

Die wichtigste Schwachstelle ist, dass verschiedene Domaenen dieselben Aktoren direkt schalten koennen. Das ist in einer grossen Node-RED-Installation der haeufigste Grund fuer schwer nachvollziehbare Effekte.

Beispiele:

| Flow | Direkter Zugriff | Risiko |
| --- | --- | --- |
| `RO - Ich gehe` | `light.licht_gruppe_innenbeleuchtung` aus | Ueberschneidung mit `LI - Abwesenheit` |
| `RO - Es werde Licht` | `light.licht_gruppe_innenbeleuchtung` ein | Routine greift direkt in Licht-Domaene ein |
| `RO - Bettzeit` | mehrere Lichtgruppen aus, danach Szene | Direkte Einzel-/Gruppenzugriffe plus Szenenwirkung |
| `RO - Arbeitszeit` | Aussenlichter direkt ein/aus | Teilweise alter Stil, obwohl auch Lichtanforderungen genutzt werden |
| `RO - Nachtlicht` | `light.led_baum` direkt | Sonderlogik ausserhalb der Licht-Domaene |
| `WA - Ausgeloest` | Innenbeleuchtung direkt ein | Fachlich plausibel, aber als Safety-Override zu formalisieren |
| `RO - Wohnlicht` / `RO - Stimmungslicht` | Szenenaufrufe | Szenen koennen Lichtzustand indirekt ausserhalb von `LI` veraendern |

Empfehlung: `LI` wird alleiniger Owner fuer `light.*` und lichtbezogene Szenen. Routines, Alarm, Wasser, Brand, Kalender oder Sprache senden nur Anforderungen an `LI`.

### 5.2 Direkte Serviceaufrufe als Kopplungspunkt

Mit 1060 `api-call-service` Nodes ist die Kopplung an Home Assistant sehr breit verteilt. Nicht jeder Serviceaufruf ist problematisch, aber die Menge zeigt, dass Aktorlogik, Szenenlogik, Helper-Logik und Systemlogik an vielen Stellen direkt verdrahtet sind.

Professionell waere eine Trennung:

- Sensorik darf lesen und normalisierte Events erzeugen.
- Domaenencontroller duerfen entscheiden.
- Aktorcontroller duerfen schreiben.
- Routinen duerfen nur Befehlswuensche formulieren.
- Safety-Flows duerfen priorisierte Safety-Anforderungen stellen.

### 5.3 Mischform aus Zustand, Wunsch und Ausgang

Im System existieren bereits `input_boolean`, `input_select`, Flow-Kontextvariablen und Status-Tracking. Das ist gut, aber noch nicht formal genug.

Es sollte eindeutig unterschieden werden:

- Ist-Zustand: Was meldet der Sensor oder Aktor wirklich?
- Wunsch-Zustand: Was moechte eine Routine oder Bedienung erreichen?
- Freigabe: Darf die Funktion aktuell wirken?
- Verriegelung: Was verhindert die Ausfuehrung?
- Betriebsart: Automatik, Manuell, Wartung, Aus, Test.
- Prioritaet: Wer darf wen uebersteuern?
- Zeitgueltigkeit: Wie lange gilt die Anforderung?

Ohne diese Trennung entstehen spaeter typische Fehler: Licht geht wieder an, obwohl eine Routine es ausgeschaltet hat; eine Szene ueberschreibt Automatik; manuelle Bedienung wird sofort von Automatik zurueckgesetzt.

### 5.4 Fehlerbehandlung ist vorhanden, aber nicht als Diagnosesystem

Catch-Nodes und Debug-Nodes sind vorhanden. Das ist besser als gar keine Fehlerbehandlung. Fuer eine professionelle Anlage reicht es aber nicht, wenn Fehler nur lokal im Debug landen.

Notwendig ist ein zentraler Diagnosepfad:

- einheitliche Fehlerstruktur
- Schweregrad
- Quelle
- betroffene Entitaet
- letzte Eingangswerte
- letzte Entscheidung
- Quittierbarkeit
- Benachrichtigung nur bei relevanten Fehlern
- Drosselung gegen Nachrichtenflut

### 5.5 Deaktivierte und alte Flows im Runtime-Modell

Es existieren deaktivierte oder alte Flows wie `AL - 33 Trigger Old` und `RO - 33a SOS`. Solche Flows sind als Referenz verstaendlich, sollten aber nicht dauerhaft im produktiven Runtime-Modell liegen.

Empfehlung: Alte Varianten exportieren und versioniert archivieren. In Node-RED selbst bleiben nur aktive, bewusst deaktivierte Testflows oder klar gekennzeichnete Wartungsflows.

### 5.6 Leere oder generische Gruppen

Viele Gruppen helfen visuell, aber leere Gruppennamen reduzieren die Lesbarkeit. Aus SPS-Sicht sollte jede Gruppe eine technische Funktion haben.

Empfohlenes Gruppenschema:

- `Trigger`
- `Eingangsaufbereitung`
- `Freigaben`
- `Verriegelungen`
- `Betriebsart`
- `Entscheidung`
- `Aktoranforderung`
- `Status`
- `Fehler`
- `Diagnose`

## 6. Zielarchitektur

### 6.1 Schichtenmodell

Eine professionelle Node-RED-/Home-Assistant-Architektur sollte in Schichten organisiert werden:

| Schicht | Aufgabe | Darf schreiben? |
| --- | --- | --- |
| L0 - Geraete/HA | Physische Entitaeten, Integrationen, Raw States | Home Assistant selbst |
| L1 - Eingangsaufbereitung | Normalisierung von Sensoren, Bewegung, Anwesenheit, Zeit, Wetter | Nur eigene Helper/Events |
| L2 - Domaenencontroller | Licht, Klima, Alarm, Steckdosen, Medien, Wasser, Brand | Nur eigene Domaenenaktoren |
| L3 - Routinen | Szenarien wie Gehen, Bettzeit, Arbeitszeit | Keine Aktoren direkt |
| L4 - Safety Supervisor | Brand, Wasser, Einbruch, technische Stoerung | Priorisierte Anforderungen, definierte Overrides |
| L5 - Diagnose/Telemetry | Logging, Fehler, Watchdog, Audit | Diagnose-Helper, Benachrichtigung |

Wichtig ist: Eine hoehere Schicht fordert an, aber der fachliche Owner entscheidet und schreibt.

### 6.2 Owner-Matrix

Jede Home-Assistant-Domaene sollte genau einen Node-RED-Owner bekommen.

| HA-Domaene | Vorgeschlagener Owner | Fremdzugriff erlaubt? |
| --- | --- | --- |
| `light.*` | `LI` | Nein, nur `LI`-Requests |
| lichtbezogene `scene.*` | `LI` | Nur ueber `LI` |
| `alarm_control_panel.*` | `AL` | Nur ueber `AL` |
| sicherheitsrelevante Sirenen/Benachrichtigungen | `AL`/Safety Supervisor | Nur priorisierte Safety-Requests |
| `switch.*` fuer Steckdosen | `STE` oder dedizierter Energie-Owner | Nur Requests |
| Klimaentitaeten | `KL` | Nur Requests |
| System-/Addon-/Restart-Services | `SY` | Nur mit Interlock und Diagnose |
| Notifications | zentraler `NOTIFY`-/Benachrichtigungs-Subflow | Keine lokalen Sonderwege |

Diese Matrix sollte als Markdown-Datei oder Home-Assistant-Dokumentation gepflegt werden.

## 7. Licht als erstes Migrationsfeld

Die Lichtautomatisierung ist der beste Kandidat fuer die erste Professionalisierungswelle, weil dort bereits ein Template existiert und gleichzeitig mehrere Routinen direkt eingreifen.

### 7.1 Zielprinzip

`LI` ist der einzige Owner fuer Lichtausgaenge. Alle anderen Flows senden eine strukturierte Lichtanforderung.

Beispiel:

```json
{
  "domain": "light",
  "target": "light.licht_gruppe_innenbeleuchtung",
  "command": "turn_off",
  "source": "RO - Ich gehe",
  "reason": "leave_home",
  "priority": 70,
  "ttl_s": 120,
  "mode": "request"
}
```

Der Licht-Owner entscheidet dann:

- Ist die Anforderung noch gueltig?
- Gibt es eine hoehere Prioritaet?
- Gibt es eine manuelle Sperre?
- Ist ein Safety-Fall aktiv?
- Ist der Zielaktor verfuegbar?
- Muss gedimmt, ausgeschaltet oder eine Szene angewendet werden?
- Was wird als letzter Befehl protokolliert?

### 7.2 Prioritaetsmodell

Vorschlag fuer Lichtprioritaeten:

| Prioritaet | Quelle | Beispiel |
| ---: | --- | --- |
| 100 | Manuell / Wartung | Nutzer schaltet bewusst lokal |
| 90 | Safety | Wasser, Brand, Alarm, Fluchtlicht |
| 80 | Security | Anwesenheitssimulation, Alarmvorstufe |
| 70 | Routine | Ich gehe, Bettzeit, Arbeitszeit |
| 50 | Automatik | Bewegung, Helligkeit, Anwesenheit |
| 30 | Komfort/Ambiente | Stimmungslicht, Dekoration |

Wichtig: Eine niedrige Prioritaet darf eine hoehere nicht ohne Ablaufzeit oder explizite Ruecknahme ueberschreiben.

### 7.3 Szenenstrategie

Szenen sind fachlich bequem, aber architektonisch gefaehrlich, wenn sie Aktoren ausserhalb ihres Owners veraendern.

Empfehlung:

- Lichtbezogene Szenen werden Teil von `LI`.
- Routinen rufen nicht `scene.turn_on` direkt auf, sondern fordern ein Szenenprofil bei `LI` an.
- Szenen bekommen dieselbe Diagnose wie Einzelbefehle: Quelle, Grund, Prioritaet, Zeitpunkt, Zielentitaeten.
- Safety-Szenen werden separat klassifiziert.

## 8. Konkrete Flow-Befunde und Empfehlungen

### 8.1 `LI - Abwesenheit`

Der Flow passt fachlich in die Licht-Domaene. Die Idee, Innenbeleuchtung bei Abwesenheit auszuschalten, ist richtig. Professionell sollte er aber nicht nur als einzelner Abschaltflow betrachtet werden, sondern als Teil des Licht-Owners.

Empfehlung:

- `LI - Abwesenheit` als Licht-Owner-Logik behalten.
- Anwesenheit, Bewegungsruhe und Besuch/Hund-Helper als Freigaben verwenden.
- Abschaltentscheidung als dokumentiertes Prioritaetsereignis ausgeben.
- Kollision mit `RO - Ich gehe` aufloesen, indem `RO - Ich gehe` nur noch eine Anforderung sendet.

### 8.2 `RO - Ich gehe`

Der direkte Zugriff auf `light.licht_gruppe_innenbeleuchtung` ist aus Architekturperspektive kritisch, weil dieselbe Aufgabe auch in `LI - Abwesenheit` liegen kann.

Empfehlung: Der Flow sendet nur noch `reason = leave_home` an `LI`. Ob, wann und welche Innenbeleuchtung ausgeschaltet wird, entscheidet `LI`.

### 8.3 `RO - Es werde Licht`

Direktes Einschalten der Innenbeleuchtung gehoert nicht in eine Routine, sondern in die Licht-Domaene.

Empfehlung: Umbau auf `LI`-Anforderung, zum Beispiel `preset = all_indoor_on`, `priority = 70`, `source = RO - Es werde Licht`.

### 8.4 `RO - Bettzeit`

Der Flow schaltet mehrere Lichtgruppen aus und aktiviert anschliessend eine Szene. Das ist funktional nachvollziehbar, aber aus Ownership-Sicht problematisch.

Empfehlung: `RO - Bettzeit` bleibt die Routine, aber alle Lichtwirkungen werden als ein strukturierter Bettzeit-Lichtwunsch an `LI` uebergeben.

### 8.5 `RO - Arbeitszeit`

Der Flow zeigt eine Mischform. Einerseits werden Aussenlichter direkt geschaltet, andererseits werden fuer Innenbereiche bereits `input_select.licht_automatisierung_*_lichtanforderung` verwendet. Das ist ein guter Hinweis auf den Zielzustand.

Empfehlung: Den vorhandenen Helper-basierten Ansatz konsequent auf alle Lichtziele ausweiten.

### 8.6 `RO - Nachtlicht`

`light.led_baum` wird direkt ueber Zeitlogik geschaltet.

Empfehlung: Als dekoratives oder Ambient-Licht in `LI` einordnen. Die Routine liefert nur Zeitfenster oder Wunschstatus.

### 8.7 `WA - Ausgeloest`

Dass die Wassermeldeanlage Innenbeleuchtung einschaltet, ist als Safety-Funktion plausibel. Trotzdem sollte selbst dieser Fall formalisiert werden.

Empfehlung: `WA` sendet einen Safety-Request an `LI` mit hoher Prioritaet. Nur wenn der zentrale Lichtpfad nicht verfuegbar ist, darf es einen dokumentierten Fallback-Direktzugriff geben.

## 9. Diagnose- und Betriebsfuehrungskonzept

### 9.1 Zentrales Ereignislog

Ein professionelles System braucht einen zentralen Diagnosefluss, zum Beispiel `SY - Ereignislog` oder `SYS - Diagnose`.

Jede wichtige Entscheidung sollte ein Event erzeugen:

```json
{
  "ts": "2026-05-11T12:00:00+02:00",
  "domain": "LI",
  "flow": "LI - Abwesenheit",
  "event": "command_accepted",
  "source": "presence_idle",
  "target": "light.licht_gruppe_innenbeleuchtung",
  "reason": "nobody_home_and_no_motion",
  "priority": 70,
  "result": "turn_off"
}
```

Damit lassen sich spaeter Rueckfragen beantworten wie: "Warum ging das Licht aus?", "Wer hat zuletzt geschaltet?", "Welche Freigabe fehlte?"

### 9.2 Debug-Level

Debug-Nodes sollten nicht die primaere Produktionsdiagnose sein.

Empfehlung:

- `debug` nur fuer Entwicklung oder gezielte Stoerungssuche aktivieren.
- Produktionsereignisse in strukturiertes Logging ueberfuehren.
- Level einfuehren: `trace`, `info`, `warning`, `error`, `critical`.
- Kritische Fehler an zentrale Benachrichtigung geben.
- Wiederholte Fehler drosseln und zusammenfassen.

### 9.3 Watchdog und Health

Empfohlene Health-Signale:

- Node-RED alive
- Home Assistant erreichbar
- wichtige MQTT-/API-Verbindungen erreichbar
- letzte erfolgreiche Serviceausfuehrung pro Domaene
- Anzahl Fehler pro Stunde
- Anzahl verworfener Anforderungen pro Domaene
- Anzahl direkter Aktorzugriffe ausserhalb Owner

## 10. Standardisierung fuer Erweiterbarkeit

### 10.1 Raum-Modul als Standard

Neue Raeume sollten nach einem einheitlichen Muster angelegt werden.

Mindestbestandteil pro Raum:

- Metadaten: Raumname, Etage, Bereich, Prioritaetsgruppe
- Sensoren: Bewegung, Praesenz, Helligkeit, Fenster/Tuer falls vorhanden
- Aktoren: Lichtgruppen, Steckdosen, Klima
- Betriebsarten: Automatik, Manuell, Sperre, Wartung
- Diagnose: letzter Trigger, letzte Entscheidung, letzter Ausgang
- Test: simulierbare Eingangsnachricht

### 10.2 Objekt- und Tagmodell

Die Entitaeten sollten nicht nur ueber Namen, sondern auch ueber Rollen gedacht werden.

Beispiele:

- `area = flur_eg`
- `domain_owner = LI`
- `device_role = main_light`
- `safety_role = escape_light`
- `automation_level = automatic`
- `manual_override = supported`

Home Assistant kann dafuer Bereiche, Labels, Gruppen und Helper nutzen. Node-RED sollte diese Struktur spiegeln.

### 10.3 Namenskonvention

Empfohlenes Muster:

```text
<DOMAIN> - <Bereich> - <Funktion>
```

Beispiele:

- `LI - Flur EG - Controller`
- `LI - Flur EG - Request Eingang`
- `AL - 33 - Trigger`
- `WA - Technikraum - Safety Request`
- `SY - Diagnose - Ereignislog`

Fuer Nodes:

```text
<Aktion> <Ziel> [<Bedingung>]
```

Beispiele:

- `Pruefe Anwesenheit`
- `Sperre bei Besuch/Hund`
- `Sende Lichtanforderung`
- `Verwerfe abgelaufene Anforderung`
- `Melde Fehler an Diagnose`

## 11. Tests und Simulation

Fuer SPS-nahe Qualitaet sollte jede kritische Logik testbar werden, ohne echte Aktoren zu schalten.

Empfehlungen:

- Simulationsmodus je Domaene
- Inject-Testnachrichten fuer Hauptszenarien
- erwartete Ausgaben als Debug-/Testpfad
- Testmatrix je Flow
- Regressionstest fuer Standardfunktionen
- Snapshot der Owner-Matrix

Beispiel-Testfaelle fuer `LI - Abwesenheit`:

| Fall | Niemand zuhause | Bewegung letzte 30 min | Besuch/Hund | Erwartung |
| --- | --- | --- | --- | --- |
| 1 | ja | nein | aus | Innenlicht aus |
| 2 | ja | ja | aus | kein Ausschalten |
| 3 | ja | nein | ein | kein Ausschalten |
| 4 | nein | nein | aus | kein Ausschalten |
| 5 | Sensor unbekannt | nein | aus | kein Ausschalten, Diagnosewarnung |

## 12. Safety und Verriegelungen

Safety-Funktionen duerfen hoeher priorisiert sein als Komfortautomationen. Sie sollten aber trotzdem nachvollziehbar und einheitlich wirken.

Empfehlungen:

- Brand, Wasser, Einbruch und technische Stoerung als Safety Supervisor zusammenfassen oder zumindest einheitlich priorisieren.
- Safety-Requests duerfen Komfortlogik uebersteuern.
- Safety-Requests muessen quittierbar oder zeitlich begrenzt sein.
- Rueckkehr aus Safety-Zustand muss definiert sein.
- Direkte Fallback-Schaltungen nur dokumentiert und diagnostiziert zulassen.

Besonders fuer Licht:

- Brand/Wasser darf Flucht- oder Arbeitslicht anfordern.
- Abwesenheitsabschaltung darf Safety-Licht nicht ausschalten.
- Manuelle Bedienung waehrend Safety sollte protokolliert werden.

## 13. Umgang mit Helpern

Helper sind sinnvoll, sollten aber nicht zu einer zweiten, unkontrollierten Steuerungsebene werden.

Empfehlungen:

- Helper nach Zweck klassifizieren:
  - Bedienhelper
  - Statushelper
  - Wunsch-/Request-Helper
  - Diagnosehelper
  - Konfigurationshelper
- Helper nicht als versteckte Aktorausgaenge verwenden.
- Fuer Gruppen von `input_boolean` besser Template-Sensoren oder Gruppen mit klarer Semantik nutzen.
- Helper-Zustandswechsel ebenfalls mit Quelle und Grund dokumentieren, sofern sie Automationen ausloesen.

## 14. Migrationsplan

### Phase 1 - Transparenz ohne Funktionsaenderung

- Owner-Matrix fuer alle Aktorgruppen erstellen.
- Alle direkten `light.*`-Zugriffe ausserhalb `LI` erfassen.
- Alle Szenen erfassen, die Licht beeinflussen.
- Alle Safety-Overrides dokumentieren.
- Debug-/Catch-Konzept inventarisieren.

Ergebnis: Klarheit, ohne bestehendes Verhalten zu veraendern.

### Phase 2 - Request-Schnittstelle einfuehren

- `LI - Request Eingang` oder `LI - Dispatcher` erstellen.
- Einheitliches Nachrichtenformat definieren.
- Diagnoseausgabe fuer akzeptierte, verworfene und uebersteuerte Anforderungen einbauen.
- Zunaechst parallel beobachten, ohne alte Direktzugriffe sofort zu entfernen.

Ergebnis: Neuer professioneller Pfad ist vorhanden und beobachtbar.

### Phase 3 - Routinen migrieren

Prioritaet:

1. `RO - Ich gehe`
2. `RO - Es werde Licht`
3. `RO - Bettzeit`
4. `RO - Arbeitszeit`
5. `RO - Nachtlicht`
6. Szenenbasierte Routinen

Ergebnis: Routinen schreiben keine Lichtaktoren mehr direkt.

### Phase 4 - Safety formalisieren

- `WA`, `BR` und `AL` senden priorisierte Safety-Requests.
- Direkte Fallback-Pfade dokumentieren.
- Quittierung und Rueckkehr definieren.
- Safety-Zustand in Diagnose sichtbar machen.

Ergebnis: Hohe Prioritaet bleibt erhalten, aber Verhalten ist nachvollziehbar.

### Phase 5 - Diagnose, Tests und Betriebsdokumentation

- Zentrales Ereignislog.
- Letzter Befehl pro Aktor.
- Health-Dashboard.
- Testmatrix fuer kritische Flows.
- Dokumentierte Betriebsarten und Wartungsmodus.

Ergebnis: Die Anlage wird nicht nur automatisiert, sondern betreibbar.

## 15. Akzeptanzkriterien fuer SPS-nahes Niveau

Ein professioneller Zielzustand waere erreicht, wenn folgende Kriterien gelten:

- Jeder physische Aktor hat genau einen fachlichen Owner.
- Jeder Fremdwunsch an einen Aktor laeuft ueber eine definierte Request-Schnittstelle.
- Jede Anforderung enthaelt Quelle, Grund, Prioritaet und Gueltigkeit.
- Jede kritische Entscheidung erzeugt ein Diagnoseevent.
- Jeder kritische Flow hat klar benannte Gruppen: Trigger, Freigaben, Verriegelungen, Entscheidung, Ausgang, Fehler.
- Direkte Safety-Fallbacks sind dokumentiert und protokolliert.
- Deaktivierte Altflows sind aus der produktiven Runtime entfernt oder eindeutig als Archiv/Test gekennzeichnet.
- Debug-Nodes sind nicht die einzige Produktionsdiagnose.
- Es gibt einen Simulations- oder Testpfad fuer kritische Szenarien.
- Start, Restart und Home-Assistant-Verbindungsverlust sind definiert.
- Neue Raeume und Geraete koennen nach einem Standardmodul angebunden werden.

## 16. Priorisierte Empfehlungsliste

| Prioritaet | Empfehlung | Wirkung |
| ---: | --- | --- |
| 1 | Aktor-Owner-Matrix erstellen | Beseitigt Grundursache fuer Kollisionen |
| 2 | `LI` als alleinigen Owner fuer Licht festlegen | Stabilisiert den groessten Automationsbereich |
| 3 | Licht-Request-Schema einfuehren | Macht Routinen, Safety und Automatik kompatibel |
| 4 | Direkte Lichtzugriffe aus `RO` migrieren | Loest konkrete Doppelzugriffe |
| 5 | Szenen in Owner-Konzept aufnehmen | Verhindert indirekte Aktorueberschreibung |
| 6 | Zentrales Diagnoseevent einfuehren | Macht Verhalten nachvollziehbar |
| 7 | Standardgruppen und Node-Namensschema festlegen | Verbessert Wartbarkeit |
| 8 | Debug-Konzept in Produktionsdiagnose ueberfuehren | Reduziert Blindflug im Fehlerfall |
| 9 | Safety-Prioritaeten formalisieren | Erhoeht Betriebssicherheit |
| 10 | Test- und Simulationsmodus aufbauen | Ermoeglicht sichere Erweiterung |

## 17. Schlussbewertung

Die bestehende Installation hat eine solide Grundlage und bereits mehrere Bausteine, die in Richtung professioneller Automatisierung gehen. Die naechste Qualitaetsstufe entsteht aber nicht durch noch mehr einzelne Flows, sondern durch verbindliche Schnittstellen und Verantwortlichkeiten.

Der wichtigste Leitsatz fuer den weiteren Ausbau lautet:

> Routinen beschreiben Absichten. Domaenencontroller entscheiden. Nur Aktor-Owner schalten.

Wenn dieses Prinzip konsequent umgesetzt wird, laesst sich die Anlage deutlich besser erweitern, testen, diagnostizieren und betreiben. Besonders die Licht-Domaene eignet sich als Pilot, weil dort der Nutzen sofort sichtbar ist und bereits ein brauchbares Template existiert.
