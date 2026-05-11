# Node-RED Smarthome Vollaudit - Professionalisierung

Datum: 2026-05-11  
Instanz: Node-RED mit Home-Assistant-Anbindung  
Audit-Artefakte:

- Vollstaendiger aktueller Flow-Export: `.mcp-backups/audit_full_export_20260511.json`
- Maschinelles Inventar: `NODE_RED_AUDIT_INVENTORY_2026-05-11.md`
- Maschinelles Detailinventar: `NODE_RED_AUDIT_INVENTORY_2026-05-11.json`
- Laufende Auditnotizen: `GEDANKEN_NODE_RED_AUDIT_2026-05-11.md`

## 1. Umfang

Dieses Audit betrachtet den gesamten exportierten Node-RED-Stand, nicht nur das Licht-Handling. Ausgewertet wurden alle 192 Tabs, 5971 regulaeren Nodes, 11 Subflows, 1060 Home-Assistant-Service-Calls, Entity-Referenzen, Gruppen, Function-Nodes, Catch-/Debug-Strukturen, Subflow-Nutzung und konkrete Aktor-Targets.

Es wurden keine Node-RED-Flows und keine Home-Assistant-Konfigurationen veraendert. Der einzige Zugriff auf die Instanz war ein lokaler Backup-Export als Arbeitsgrundlage.

Nicht enthalten sind physikalische Funktionstests, Home-Assistant-Historie, Recorder-Daten, echte Laufzeit-Traces, Performance-Messungen und manuelle Pruefung jedes einzelnen Sensorwerts im Betrieb. Die Bewertung ist ein statisches Architektur- und Struktur-Audit auf Basis des aktuellen Flow-Exports.

## 2. Executive Summary

Die Installation ist funktional breit und bereits klar nach Domaenen organisiert. Sie ist aber noch nicht auf dem Niveau einer professionell betriebenen Anlage mit SPS-aehnlicher Nachvollziehbarkeit, weil Aktorzugriffe, Routinen, Safety-Funktionen und Diagnose nicht konsequent ueber definierte Schnittstellen entkoppelt sind.

Die wichtigsten Befunde:

1. Es gibt keine harte Aktor-Owner-Matrix. Mehrere Domaenen schalten dieselben physischen oder logischen Aktoren direkt.
2. Routinen sind zu stark mit Aktorausgaengen gekoppelt. `RO - Schlafenszeit`, `RO - Arbeitszeit`, `RO - 33a SOS` und weitere Routinen schreiben direkt auf Licht, Switches, Klima, Medien und Sirenen.
3. Safety-Domaenen wie Brand, Wasser und Alarm wirken fachlich sinnvoll, aber nicht ueber einen einheitlichen Safety-Supervisor mit Prioritaeten, Quittierung und Rueckkehrlogik.
4. Diagnose ist vorhanden, aber nicht als zentrales Ereignis- und Stoerungssystem ausgepraegt. 97 servicefuehrende Tabs haben keinen Catch-Node.
5. Die Flow-Struktur ist visuell gruppiert, aber 502 von 510 Gruppen haben keinen Namen. Aus SPS-Sicht fehlt damit die explizite Funktionsgliederung.
6. 162 von 165 fachlichen Tabs haben keine Beschreibung. Nur `AL - 33 Trigger`, `LI - Abwesenheit` und `GES - NINA neu` enthalten eine dokumentierende `info`.
7. Es gibt 60 konkrete Aktor-Targets, die mehrfach oder aus mehreren Tabs/Sektionen bedient werden. Das ist der Kern des Ueberschreibungsrisikos.
8. `LI - Schlafzimmer` enthaelt 114 deaktivierte Nodes in einem aktiven Tab. Das ist aus Wartungs- und Review-Sicht kritisch.
9. `GES - NINA neu` ist fachlich ein Gesundheitsflow, liegt tab-reihenfolgebedingt aber unter der Sektion `Zahnbuerste`.
10. Es gibt gute Vorbilder im Bestand: `AL - 33 Trigger`, `GES - NINA neu`, `LI - Abwesenheit`, das Benachrichtigungs-Subflow-Konzept und das `Licht - Automatisierung - Template`.

Der wichtigste Zielzustand lautet:

> Routinen beschreiben Absichten. Domaenencontroller entscheiden. Nur Aktor-Owner schalten.

## 3. Harte Kennzahlen

| Kennzahl | Wert | Bewertung |
| --- | ---: | --- |
| Objekte gesamt | 6174 | Grosse Anlage, Architekturdisziplin ist zwingend |
| Tabs gesamt | 192 | Davon 165 fachliche Tabs und 27 Sektions-/Header-Tabs |
| Deaktivierte Tabs | 2 | `AL - 33 Trigger Old`, `RO - 33a SOS` |
| Subflows | 11 | Gute Basis, aber fuer die Groesse noch zu wenig Standardisierung |
| Regulaere Nodes | 5971 | Hohe Komplexitaet |
| Home-Assistant-Service-Calls | 1060 | Sehr breite Kopplung an HA |
| Aktorartige Service-Calls | 635 | Wichtigster Audit-Fokus |
| Helper-Writes | 361 | Viele interne Zustands-/Request-Helper |
| Cross-Owner-Calls nach Heuristik | 172 | Muss durch echte Owner-Matrix ersetzt werden |
| Konkrete Aktor-Targets | 118 | Aus Service-Targets extrahierte Aktoren |
| Mehrfach genutzte Aktor-Targets | 60 | Risiko fuer konkurrierende Zugriffe |
| Eindeutige Entity-Referenzen | 605 | Breite Abhaengigkeitsflaeche |
| Fehlende Wire-Ziele | 0 | Positiv: strukturell keine kaputten Verdrahtungen gefunden |
| Groups | 510 | Visuelle Struktur ist vorhanden |
| Groups ohne Namen | 502 | Schlecht fuer Review, Wartung und Inbetriebnahme |
| Function-Nodes | 233 | Coding-Standards und Tests werden relevant |
| Lange Function-Nodes | 11 | Kandidaten fuer Bibliothek/Subflow/Test |
| Catch-Nodes | 62 | Vorhanden, aber nicht flaechendeckend |
| Debug-Nodes | 65 | Diagnose vorhanden, aber lokal und uneinheitlich |
| Console-Debug-Nodes | 62 | Produktionsdiagnose sollte nicht auf Debug-Konsole basieren |

Hinweis zur Cross-Owner-Zahl: Die Heuristik ordnet Service-Domaenen grob erwarteten Ownern zu, zum Beispiel `light -> LI`, `media_player -> M`, `switch -> STE`, `climate/fan -> KL`, `vacuum -> STA`. Fachliche Ausnahmen wie Aquarium-Prozessgeraete koennen legitim sein. Genau deshalb ist eine echte Owner-Matrix noetig.

## 4. Domaenenuebersicht

| Sektion | Tabs | Nodes | Service | Aktor | CrossOwner | Catch | Debug | Funktionen | Leere Gruppen |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Alarmanlage | 8 | 407 | 82 | 10 | 6 | 7 | 8 | 8 | 63 |
| Aquarium | 6 | 105 | 23 | 17 | 17 | 0 | 0 | 4 | 6 |
| Brandmeldeanlage | 12 | 198 | 28 | 20 | 20 | 0 | 0 | 8 | 21 |
| Datenbank | 2 | 36 | 3 | 0 | 0 | 2 | 2 | 3 | 0 |
| Endgeraet | 11 | 110 | 15 | 7 | 7 | 0 | 0 | 14 | 17 |
| Fortbewegung | 3 | 312 | 25 | 9 | 5 | 2 | 2 | 31 | 20 |
| Geofencing | 6 | 64 | 22 | 12 | 12 | 0 | 0 | 0 | 9 |
| Gesundheit | 3 | 58 | 7 | 0 | 0 | 2 | 2 | 3 | 7 |
| Heimgeraete | 4 | 69 | 11 | 6 | 3 | 1 | 1 | 1 | 5 |
| Kalender | 2 | 18 | 2 | 0 | 0 | 0 | 0 | 4 | 2 |
| Kamera | 8 | 53 | 12 | 12 | 10 | 0 | 0 | 0 | 7 |
| Klima | 8 | 192 | 36 | 20 | 4 | 0 | 0 | 16 | 19 |
| Licht | 21 | 2168 | 437 | 404 | 0 | 18 | 20 | 16 | 144 |
| Medienkontrolle | 4 | 82 | 35 | 17 | 0 | 0 | 0 | 2 | 11 |
| Netzwerk | 2 | 26 | 0 | 0 | 0 | 0 | 0 | 3 | 4 |
| Relais | 2 | 9 | 2 | 2 | 2 | 1 | 1 | 0 | 2 |
| Routine | 18 | 598 | 119 | 73 | 73 | 0 | 0 | 24 | 39 |
| Sprachausgabe | 32 | 325 | 39 | 0 | 0 | 0 | 0 | 39 | 33 |
| Sprachsteuerung | 3 | 44 | 4 | 2 | 2 | 2 | 2 | 4 | 4 |
| Staubsauger | 2 | 85 | 7 | 5 | 0 | 1 | 1 | 3 | 3 |
| Steckdosen | 7 | 91 | 8 | 8 | 0 | 6 | 6 | 1 | 12 |
| Strom | 4 | 178 | 29 | 0 | 0 | 3 | 3 | 17 | 19 |
| System | 7 | 156 | 38 | 0 | 0 | 6 | 6 | 2 | 26 |
| ToDo | 8 | 123 | 38 | 0 | 0 | 7 | 7 | 9 | 18 |
| Wassermeldeanlage | 3 | 32 | 6 | 4 | 4 | 0 | 0 | 1 | 4 |
| Wetter | 2 | 45 | 1 | 0 | 0 | 1 | 1 | 1 | 2 |
| Zahnbuerste | 4 | 44 | 4 | 0 | 0 | 3 | 3 | 5 | 4 |

## 5. Zentrale Kollisionen

Diese Tabelle zeigt konkrete Aktor-Targets mit mehrfachen Zugriffen. Das sind die wichtigsten Kandidaten fuer eine Owner-Matrix.

| Entity | Calls | Sektionen | Bewertung |
| --- | ---: | --- | --- |
| `light.licht_gruppe_innenbeleuchtung` | 17 | Brandmeldeanlage, Licht, Routine, Wassermeldeanlage | Kritisch: Komfort, Routine und Safety greifen direkt auf dieselbe Gruppe zu |
| Mehrere `media_player.*` Echo-Ziele | je 15 | Geofencing, Medienkontrolle, Routine | Medienausgabe und Lautstaerke konkurrieren mit Anwesenheits-/Routineereignissen |
| `light.licht_gruppe_33a_innenbeleuchtung` | 7 | Brandmeldeanlage, Routine, Wassermeldeanlage | Safety-/Routine-Kopplung ohne gemeinsamen Licht-Owner |
| `switch.steckdose_wireless_chargingstation` | 5 | Endgeraet, Routine, Steckdosen | Ladeautomatik und Steckdosen-Owner ueberlappen |
| `light.eingang_33a_scheinwerfer` | 12 | Licht, Routine | Aussenlicht wird aus LI und Routinen geschaltet |
| `light.strahler_stellplatz` | 11 | Licht, Routine | Aussenlicht-Kollision |
| `light.strahler_balkon_eg` | 11 | Licht, Routine | Aussenlicht-Kollision |
| `siren.eingang_33_sirene` | 6 | Alarmanlage, Routine | Safety-Aktor wird auch aus Routine-Kontext bedient |
| `siren.eingang_33a_sirene` | 6 | Alarmanlage, Routine | Safety-Aktor wird auch aus Routine-Kontext bedient |
| Rauchmelder-Alarm-Switches | je 6 | Alarmanlage, Wassermeldeanlage | Safety-Subsysteme greifen gemeinsam auf dieselben Alarmpfade zu |
| Aquarium-Steckdosen | 3-6 | Aquarium, Routine | Prozesssteuerung und Routine greifen auf dieselben Steckdosen zu |
| `fan.dyson_ph04` | 6 | Klima, Routine | Klima-Owner und Routine ueberlappen |
| `climate.midea_portasplit` | 4 | Klima, Routine | Klima-Owner und Routine ueberlappen |
| `climate.heizkorperthermostat_wohnzimmer_1` | 5 | Klima, Routine | Heizlogik und Routine ueberlappen |

## 6. Systemweite Befunde

### 6.1 Aktor-Ownership fehlt als harte Regel

Die groesste Schwachstelle ist nicht ein einzelner Flow, sondern die fehlende verbindliche Zuordnung: Wer darf welchen Aktor final schalten?

Ein professionelles System braucht eine Matrix:

| Aktorgruppe | Owner | Andere Domaenen duerfen |
| --- | --- | --- |
| Licht und lichtbezogene Szenen | `LI` | Licht-Requests senden |
| Sirenen, Alarmzustand, Alarm-Schalter | `AL` oder Safety Supervisor | Safety-Requests senden |
| Brand-/Wasser-Alarm-Ausgaben | Safety Supervisor | priorisierte Safety-Requests senden |
| Steckdosen und Relais | `STE`/`RE` oder definierter Prozess-Owner | Anforderungen senden |
| Klima, Fan, Thermostate | `KL` | Komfort-/Routine-Requests senden |
| Medienplayer, Lautstaerke, Durchsagen | `M`/`SPA` | Audio-Requests senden |
| Staubsauger | `STA` | Reinigungs-Requests senden |
| Systemdienste, Addons, Reboots | `SY` | keine direkten Fremdzugriffe |

Wichtig: Bei Prozessgeraeten wie Aquarium-Heizung oder Wasserkocher kann der fachliche Prozess-Owner auch der Aktor-Owner sein. Dann muss das explizit dokumentiert werden.

### 6.2 Routinen sind zu stark gekoppelt

`Routine` ist mit 119 Service-Calls und 73 aktorartigen Calls der groesste Cross-Domain-Treiber. Routinen sollten nicht selbst Aktoren schreiben, sondern Betriebswuensche an Domaenencontroller senden.

Beispiele:

- `RO - Schlafenszeit`: 352 Nodes, 45 Service-Calls, 25 aktorartige Calls, 22 Function-Nodes.
- `RO - Arbeitszeit`: 17 Service-Calls, 11 aktorartige Calls.
- `RO - 33a SOS`: deaktivierter Tab, aber 58 Nodes und 19 Service-Calls im Export.
- `RO - Bettzeit`, `RO - Es werde Licht`, `RO - Stimmungslicht`, `RO - Wohnlicht`: Szenen und Lichtwirkung ausserhalb eines klaren Licht-Dispatchers.

Ziel: Routinen orchestrieren nur noch Anforderungen:

```json
{
  "domain": "light",
  "request": "preset",
  "preset": "bedtime",
  "source": "RO - Schlafenszeit",
  "reason": "routine_started",
  "priority": 70,
  "ttl_s": 900
}
```

### 6.3 Safety ist verteilt

Brand, Wasser, Alarm und SOS duerfen bewusst hohe Prioritaet haben. Aktuell sind diese Prioritaeten aber nicht formalisiert.

Ein Safety-Supervisor sollte definieren:

- Safety-Zustaende: `normal`, `pre_alarm`, `alarm`, `acknowledged`, `resetting`, `fault`.
- Prioritaeten gegen Komfortautomatik.
- Welche Ausgaenge bei welchem Safety-Fall angefordert werden.
- Quittierung und Rueckkehr in Normalbetrieb.
- Fallback, falls ein Domaenencontroller nicht reagiert.
- Diagnose jedes Safety-Requests.

### 6.4 Diagnose ist nicht produktionsreif

Catch- und Debug-Nodes existieren, aber nicht durchgaengig. Besonders kritisch: 97 Tabs mit Service-Calls haben keinen Catch-Node.

Zielbild:

- Zentraler Diagnosefluss `SY - Diagnose`.
- Jeder Fehler bekommt `domain`, `flow`, `node`, `severity`, `entity`, `reason`, `last_input`, `action`.
- Debug-Nodes bleiben fuer Entwicklung, nicht fuer den Produktionsbetrieb.
- Wiederholte Fehler werden gedrosselt.
- Kritische Fehler werden quittierbar gemacht.

### 6.5 Beschreibungen und Gruppen sind fuer SPS-Niveau zu schwach

Nur 3 von 165 fachlichen Tabs haben eine Flow-Beschreibung. 502 von 510 Gruppen sind unbenannt.

Das ist fuer eine kleine DIY-Anlage akzeptabel, aber nicht fuer eine wachsende Anlage mit hoher Wartungsanforderung.

Empfohlene Gruppennamen:

- `Trigger`
- `Eingangsaufbereitung`
- `Freigaben`
- `Verriegelungen`
- `Betriebsart`
- `Entscheidung`
- `Aktoranforderung`
- `Ausgang`
- `Status`
- `Fehler`
- `Diagnose`

### 6.6 Service-Call-Konfiguration ist riskant offen

Alle 1060 Service-Calls verwenden `queue: none`. 865 Service-Calls haben `blockInputOverrides: false`.

Das ist nicht automatisch falsch, aber fuer professionelle Wartbarkeit riskant:

- Ein eingehendes `msg` kann Service-Call-Verhalten beeinflussen.
- Ziel, Daten und Payload muessen pro Pfad sicher beherrscht werden.
- Ohne Queue-/Retry-Konzept gehen Kommandos bei Last oder Verbindungsproblemen eher verloren.

Empfehlung: Fuer jeden Service-Call-Typ festlegen, ob `msg`-Overrides erlaubt sind. Kritische Aktoren sollten definierte, validierte Command-Objekte bekommen.

### 6.7 Verfuegbarkeit und `unknown`/`unavailable`

Die Heuristik findet viele State-Nodes, bei denen keine sichtbare robuste Behandlung von `unknown`/`unavailable` erkennbar ist. Das muss pro Node fachlich geprueft werden.

Professionelles Ziel:

- Sensor ungueltig -> keine unkontrollierte Aktoraktion.
- Sensor ungueltig -> Diagnoseevent.
- Kritische Funktionen haben Fallback-Zustand.
- Freigaben unterscheiden zwischen `false` und `unknown`.

## 7. Domaenenaudit

### 7.1 Alarmanlage

Positiv:

- Saubere Domaene mit 33/33a-Struktur.
- Subflows fuer Tuer- und Bewegungserfassung.
- `AL - 33 Trigger` ist ein gutes modernes Referenzmuster mit Beschreibung, Pruefkette, Mapping und Fehlerpfad.
- Catch-/Debug-Struktur ist in den meisten Alarm-Tabs vorhanden.

Befunde:

- `AL - 33 Trigger Old` ist deaktiviert, bleibt aber mit 147 Nodes im Runtime-Export.
- `AL - 33 Ausgeloest` und `AL - 33a Ausgeloest` schalten Sirenen, Rauchmelder-Switches und Szene `scene.alarm` direkt.
- Alarm- und Safety-Ausgaenge ueberlappen mit Wasser/SOS.

Empfehlung:

- `AL - 33 Trigger Old` aus Runtime entfernen und versioniert archivieren.
- Alarm-Ausgaenge als Safety-Owner oder Safety-Requests formalisieren.
- `AL - 33 Trigger` als Designstandard fuer `AL - 33a Trigger` und alte Trigger verwenden.

### 7.2 Aquarium

Positiv:

- Fachlich klare Prozessaufteilung: Heizung, Licht, Pumpe, Stroemung, Wartungsmodus.
- Wartungsmodus ist als eigener Flow vorhanden.

Befunde:

- 17 direkte Switch-Aktorzugriffe.
- Keine Catch-/Debug-Nodes.
- Aquarium-Steckdosen werden auch aus `RO - Schlafenszeit` beeinflusst.

Empfehlung:

- Entscheiden: Ist `AQ` der Owner der Aquarium-Steckdosen oder `STE`?
- Falls `AQ` Owner ist: in Owner-Matrix dokumentieren.
- Wartungsmodus als Betriebsart mit Verriegelungen ausbauen.
- Heizung/Pumpen mit Watchdog, Mindestlaufzeiten und Fehlerdiagnose absichern.

### 7.3 Brandmeldeanlage

Positiv:

- Klare Trennung von Trigger- und Ausgeloest-Flows.
- Temperaturcheck-Flows fuer Dimmer, Energiemessung, Relais und Steckdose.

Befunde:

- 20 direkte aktorartige Calls.
- Direkte Lichtschaltung der Innenbeleuchtung.
- Direkte Schaltung von Brand-/Einbruchalarm-Switches.
- Keine Catch-/Debug-Nodes in der Brandmeldeanlage.

Empfehlung:

- Brand als Safety-Prioritaet 90/100 behandeln.
- Licht nur ueber `LI`-Safety-Request anfordern.
- Alarm-Switches ueber Safety Supervisor oder klaren Brand-Owner schalten.
- Catch/Diagnose in alle Brand-Flows aufnehmen.

### 7.4 Datenbank

Positiv:

- Catch-/Debug vorhanden.
- Keine leeren Gruppen.
- MySQL-Konfiguration ist zentral sichtbar.

Befunde:

- Datenbankfunktion wirkt lokal, aber ohne sichtbare Schema-/Migrationsdokumentation.

Empfehlung:

- Datenbankschema dokumentieren.
- Schreibfehler, Reconnect und Queue-Verhalten definieren.
- Datenbankzugriffe nur ueber einen klaren Datenbank-Subflow fuehren.

### 7.5 Endgeraet

Positiv:

- Ladeautomatiken und Verwaltung sind sauber getrennt.

Befunde:

- Ladeautomatiken schalten Steckdosen und Tablet-Screen direkt.
- Keine Catch-/Debug-Struktur.

Empfehlung:

- Ladeautomatiken als Request an `STE` senden.
- Device-Profile einfuehren: Zielakku, Ladefenster, Maximaldauer, Sperre, Fehler.
- Bildschirm-/Device-spezifische Sonderaktionen dokumentieren.

### 7.6 Fortbewegung

Positiv:

- Volvo-Flows sind umfangreich und haben Catch-/Debug.
- Fahrzeuglogik ist als eigene Domaene erkennbar.

Befunde:

- 312 Nodes, 31 Function-Nodes, direkte Switch- und Button-Aktionen.
- Hohe Komplexitaet je Fahrzeug.

Empfehlung:

- Fahrzeugcontroller standardisieren: Status, Wunsch, Aktion, Fehler.
- API-Rate-Limits, Offline-Zustand und Timeout-Verhalten dokumentieren.
- Lade-/Steckdosenzugriffe ueber `STE` oder dokumentierten Fahrzeug-Owner fuehren.

### 7.7 Geofencing

Positiv:

- Personen sind getrennt modelliert.
- Allgemeiner Geofencing-Flow vorhanden.

Befunde:

- Mehrfach wiederholte Personenflows.
- Direkte Medienausgabe (`media_player.play_media`) aus Geofencing.
- Keine Catch-/Debug-Nodes.

Empfehlung:

- Zentrales Anwesenheitsmodell bilden: Person, Zone, Hausstatus, Unsicherheit, letzte Aenderung.
- Geofencing sendet Events; Medienausgabe erfolgt ueber Medien-/Sprachausgabe-Owner.
- Wiederholte Personenlogik parametrisieren.

### 7.8 Gesundheit

Positiv:

- `GES - NINA neu` ist fachlich deutlich besser als ein typischer Einzeltrigger: Deduplizierung, Attributbezug, Fehlerdrosselung.

Befunde:

- `GES - NINA neu` liegt im Tab-Export unter `Zahnbuerste`, nicht unter `Gesundheit`.
- Es gibt weiterhin `GES - NINA` und `GES - NINA neu`.

Empfehlung:

- `GES - NINA neu` unter Gesundheit einsortieren.
- Alte NINA-Version entweder abschalten und archivieren oder klar als Vergleich markieren.
- Gesundheit-Events an zentrale Benachrichtigung/Diagnose anbinden.

### 7.9 Heimgeraete

Positiv:

- Waschmaschine, Trockner und Wasserkocher sind fachlich getrennt.

Befunde:

- Wasserkocher schaltet Switch und Select direkt.
- Nur ein Catch-/Debug-Paar in der Sektion.

Empfehlung:

- Geraete als Zustandsautomaten modellieren: `idle`, `ready`, `running`, `done`, `fault`, `locked`.
- Wasserkocher mit Sicherheitsbedingungen versehen: Anwesenheit, Maximaldauer, Trockenlaufschutz soweit Sensorik vorhanden.
- Steckdosen/Relaiszugriffe owner-konform fuehren.

### 7.10 Kalender

Positiv:

- Kalender ist als eigene Domaene getrennt.

Befunde:

- Kein Catch-/Debug.
- Kalenderdaten wirken als Trigger fuer andere Domaenen, aber ohne sichtbaren Eventvertrag.

Empfehlung:

- Kalenderflow soll normalisierte Events erzeugen, keine direkte Fachlogik in andere Domaenen streuen.
- Kalenderfehler diagnostizieren.

### 7.11 Kamera

Positiv:

- Kameras sind nach Standorten getrennt.

Befunde:

- Kamera-Flows schalten Scheinwerfer/Licht direkt.
- Keine Catch-/Debug-Nodes.

Empfehlung:

- Kamera fordert Beleuchtung ueber `LI` an: `reason = camera_motion` oder `reason = surveillance`.
- Kamera-Domaene entscheidet nicht final ueber Lichtzustand.
- Datenschutz-/Privatmodus und Kamera-Verfuegbarkeit als Betriebsarten abbilden.

### 7.12 Klima

Positiv:

- Eigene Domaene fuer Dyson, Midea, Lueftungsempfehlung, Temperaturauswertung, Wohnzimmer und SmartFan.

Befunde:

- 20 direkte aktorartige Calls.
- Keine Catch-/Debug-Nodes.
- Klimaaktoren werden auch aus Routinen geschaltet.

Empfehlung:

- `KL` als Owner fuer Klima, Fan, Humidifier und Thermostate festlegen.
- Routinen senden Komfortprofile: `sleep`, `work`, `away`, `boost`, `off`.
- Mindestlaufzeiten, Anti-Taktung, Fenster-offen, Anwesenheit und manuelle Sperre einbauen.
- Lueftungsempfehlung und Temperaturauswertung als Eingangsaufbereitung klar trennen.

### 7.13 Licht

Positiv:

- Groesste und am weitesten standardisierte Domaene.
- `Licht - Automatisierung - Template` ist ein wertvoller Subflow.
- `LI - Abwesenheit` ist ein sinnvoller Owner-Flow.
- Catch-/Debug ist in vielen Licht-Tabs vorhanden.

Befunde:

- 2168 Nodes und 437 Service-Calls allein in Licht.
- 404 direkte Licht-Service-Calls innerhalb `LI`; als Owner okay, aber sehr viele konkrete Ausgaenge.
- `LI - Schlafzimmer` ist mit 230 Nodes, 47 Service-Calls und 114 deaktivierten Nodes auffaellig.
- 152 aktorartige Calls haben im Node selbst kein konkretes Target; sie haengen vermutlich von eingehenden `msg`-Daten ab.
- Viele Gruppen sind unbenannt.

Empfehlung:

- `LI - Dispatcher` als zentrale Request-Schnittstelle einfuehren.
- Template-Vertrag dokumentieren: Eingangsmsg, Statuswerte, Prioritaeten, Timeouts, Fehler.
- Zielgruppen/Presets aus Konfiguration statt aus kopierten Node-Strukturen ableiten.
- `LI - Schlafzimmer` bereinigen: deaktivierte Altlogik archivieren.
- Szenen nur noch ueber `LI` anwenden oder explizit als Nicht-Licht-Szenen klassifizieren.

### 7.14 Medienkontrolle

Positiv:

- Medienkontrolle existiert als eigene Domaene.
- Lautstaerke und letzter Aufruf werden separat betrachtet.

Befunde:

- 35 Service-Calls, 17 aktorartige Media-Calls.
- Keine Catch-/Debug-Nodes.
- Medienplayer werden auch aus Geofencing und Routinen direkt verwendet.

Empfehlung:

- Zentralen Audio-/Medien-Dispatcher einfuehren.
- Requests mit Prioritaet: Alarmdurchsage, Tuerklingel, Routine, Komfort.
- Lautstaerke-Snapshot und Restore definieren.
- Medienplayer-Verfuegbarkeit diagnostizieren.

### 7.15 Netzwerk

Positiv:

- NAS/Netzwerk ist getrennt.
- Keine direkten Aktorzugriffe.

Befunde:

- Keine Catch-/Debug-Nodes.
- Netzwerkstatus sollte als Health-Signal fuer andere Domaenen dienen.

Empfehlung:

- Netzwerkzustand in `SY - Diagnose` einspeisen.
- NAS-/Netzwerkfehler nicht nur anzeigen, sondern mit Severity klassifizieren.

### 7.16 Relais

Positiv:

- Kleine, ueberschaubare Domaene.
- Catch-/Debug vorhanden.

Befunde:

- Relais schaltet Switch direkt.
- Owner-Abgrenzung zu `STE` ist nicht dokumentiert.

Empfehlung:

- Entscheiden: `RE` ist Hardware-Owner fuer Relais oder `STE` ist generischer Switch-Owner.
- Prozesslogik darf Relais nur ueber Owner anfordern.

### 7.17 Routine

Positiv:

- Routinen sind fachlich benannt und als eigene Schicht vorhanden.
- Teilweise werden bereits Helper-/Request-Muster genutzt, z.B. Lichtanforderungen.

Befunde:

- 119 Service-Calls, 73 aktorartige Calls, 0 Catch, 0 Debug.
- `RO - Schlafenszeit` ist sehr gross und hat viele direkte Wirkungen.
- `RO - 33a SOS` ist deaktiviert, aber als grosser Flow im Export.
- Routinen bedienen Licht, Szenen, Switches, Klima, Fans, Medien und Sirenen direkt.

Empfehlung:

- Routine-Schicht auf reine Orchestrierung reduzieren.
- Alle Aktorwirkungen in Domaenen-Requests uebersetzen.
- Catch/Diagnose fuer Routinefehler einfuehren.
- `RO - Schlafenszeit` in Sequenz, Requests und Diagnose zerlegen.

### 7.18 Sprachausgabe

Positiv:

- Starke Wiederverwendung des Alexa-Benachrichtigungs-Subflows.
- Viele Ausgaben sind fachlich sauber benannt.

Befunde:

- 32 Tabs, viele nahezu gleiche Temperatur-/Muell-Ausgabe-Flows.
- 39 Function-Nodes.
- Keine Catch-/Debug-Nodes in der Sektion.

Empfehlung:

- Parametrisierte Subflows fuer Temperaturausgabe und Muellausgabe.
- Sprachausgabe als zentraler Output-Owner fuer Durchsagen.
- Prioritaeten und Ruhezeiten definieren.
- Fehler bei TTS/Media-Playern zentral diagnostizieren.

### 7.19 Sprachsteuerung

Positiv:

- Sprachbefehle sind als eigene Domaene vorhanden.
- Catch-/Debug existiert.

Befunde:

- Alexa heller/dunkler schaltet Licht direkt.

Empfehlung:

- Sprachsteuerung sendet Requests an `LI`.
- Manuelle Sprachbefehle bekommen hohe Komfortprioritaet und koennen Automatik temporär sperren.

### 7.20 Staubsauger

Positiv:

- Staubsauger ist eigener Owner-Flow.
- Catch-/Debug vorhanden.

Befunde:

- Direkte Vacuum-/Roborock-Kommandos.
- Lange Vergleichsfunktion.

Empfehlung:

- Segment- und Raum-Mapping als Konfiguration dokumentieren.
- Zustaende definieren: docked, cleaning, returning, error, paused, unavailable.
- Requests von Routinen nur als Reinigungsauftrag, nicht als direkte Roborock-Kommandos.

### 7.21 Steckdosen

Positiv:

- Steckdosen-Domaene existiert und hat Catch-/Debug in fast allen fachlichen Tabs.

Befunde:

- Viele Steckdosen werden auch aus Endgeraet, Aquarium, Fortbewegung, Heimgeraete und Routine bedient.

Empfehlung:

- `STE` entweder als finaler Owner aller Steckdosen definieren oder Prozess-Owner explizit ausnehmen.
- Pro Steckdose dokumentieren: Owner, Betriebsart, Safety-Sperre, manuelle Bedienung, letzte Anforderung.

### 7.22 Strom

Positiv:

- Energie-/Balkonkraftwerk-Logik ist getrennt.
- Catch-/Debug vorhanden.
- Keine direkten Aktorzugriffe, primaer Helper-Writes.

Befunde:

- 29 `input_number.set_value` Calls, 17 Function-Nodes.

Empfehlung:

- Einheitliche Einheiten, Plausibilitaetsgrenzen und Zeitfenster dokumentieren.
- Berechnungslogik in getestete Funktionen/Subflows ueberfuehren.
- Datenqualitaet und Sensor-Ausfaelle diagnostizieren.

### 7.23 System

Positiv:

- Systemlogik ist zentral in `SY` organisiert.
- Catch-/Debug vorhanden.
- Timer und Initialisierung sind als eigene Flows vorhanden.

Befunde:

- Systemdienste wie Addon-Restart, Host-Reboot und Config-Entry Enable/Disable existieren.
- 38 Service-Calls, darunter systemnahe Aktionen.

Empfehlung:

- Systemaktionen nur mit Wartungs-/Freigabemodus.
- Reboot/Restart mit Auditlog, Sperrzeit und Benachrichtigung.
- `SY - Timer` als formales internes Eventsystem ausbauen: `sys.tick.minute`, `sys.tick.hour`, `sys.tick.day`.

### 7.24 ToDo

Positiv:

- ToDo-Domaene ist klar getrennt.
- Catch-/Debug ist vorhanden.

Befunde:

- Mehrere lange, aehnliche `Sortierung`-Function-Nodes.

Empfehlung:

- Gemeinsame Sortier-/Listenlogik in Subflow oder Library ueberfuehren.
- Einheitliches Schema fuer Listenitems, Prioritaet und Herkunft.

### 7.25 Wassermeldeanlage

Positiv:

- Wasser-Safety ist als eigene Domaene vorhanden.

Befunde:

- Direkte Licht- und Switch-Schaltungen.
- Keine Catch-/Debug-Nodes.
- Rauchmelder-/Alarm-Switches werden gemeinsam mit Alarmanlage genutzt.

Empfehlung:

- `WA` sendet Safety-Requests an Safety Supervisor und `LI`.
- Direkte Fallback-Schaltung nur dokumentiert fuer Notbetrieb.
- Quittierung und Rueckkehr definieren.

### 7.26 Wetter

Positiv:

- Wetterbericht ist getrennt und hat Catch-/Debug.

Befunde:

- `Textgenerierung` hat 307 Zeilen und 13079 Zeichen.

Empfehlung:

- Textgenerierung modularisieren.
- Ausgabe begrenzen, Fallback bei fehlenden Wetterdaten.
- Template-/Testfaelle fuer typische Wetterlagen.

### 7.27 Zahnbuerste

Positiv:

- Zahnbuerstenflows sind klein und haben Catch-/Debug.

Befunde:

- `GES - NINA neu` liegt organisatorisch in dieser Sektion, obwohl fachlich Gesundheit.

Empfehlung:

- `GES - NINA neu` in Gesundheit einsortieren.
- Kleine Health-/Routine-Flows nach gleichem Standard mit Beschreibung versehen.

## 8. Zielarchitektur

### 8.1 Schichtenmodell

| Schicht | Aufgabe | Darf Aktoren schreiben? |
| --- | --- | --- |
| L0 - Home Assistant / Devices | Integrationen, Entitaeten, physische Geraete | Ja, technisch |
| L1 - Eingangsaufbereitung | Sensoren normalisieren, Entprellung, Plausibilitaet | Nein |
| L2 - Kontextmodell | Anwesenheit, Zeit, Wetter, Betriebsarten, Safety-State | Nur eigene Helper |
| L3 - Domaenencontroller | Licht, Klima, Steckdosen, Alarm, Medien, Staubsauger | Nur eigene Aktoren |
| L4 - Routinen | Bettzeit, Arbeitszeit, Ich gehe, SOS als Ablaufwuensche | Nein |
| L5 - Safety Supervisor | Brand, Wasser, Einbruch, technische Stoerung | Nur definierte Safety-Ausgaenge oder Requests |
| L6 - Diagnose/Betrieb | Logging, Watchdog, Health, Wartung | Diagnose-Helper, Benachrichtigung |

### 8.2 Einheitliches Request-Objekt

Jede Domaenenanforderung sollte mindestens enthalten:

```json
{
  "domain": "light",
  "target": "light.licht_gruppe_innenbeleuchtung",
  "command": "turn_off",
  "source": "RO - Ich gehe",
  "reason": "leave_home",
  "priority": 70,
  "ttl_s": 120,
  "correlation_id": "2026-05-11T13:00:00.000Z-RO-IchGehe",
  "mode": "request"
}
```

### 8.3 Prioritaetsmodell

| Prioritaet | Quelle | Beispiel |
| ---: | --- | --- |
| 100 | Wartung / lokaler manueller Override | Aktor gesperrt, Testbetrieb |
| 90 | Safety | Brand, Wasser, Einbruch, Notlicht |
| 80 | Security | Alarmvorstufe, Anwesenheitssimulation |
| 70 | Routine | Bettzeit, Arbeitszeit, Ich gehe |
| 50 | Automatik | Bewegung, Helligkeit, Anwesenheit |
| 30 | Komfort | Ambiente, Dekoration |

Regel: Eine niedrigere Prioritaet darf eine hoehere nicht ohne Ablaufzeit, Ruecknahme oder Quittierung ueberschreiben.

## 9. Professionalisierungsplan

### Phase 1 - Transparenz

- Owner-Matrix fuer alle 118 konkreten Aktor-Targets erstellen.
- Alle 60 mehrfach genutzten Aktor-Targets fachlich entscheiden.
- Deaktivierte Tabs und deaktivierte Nodes klassifizieren: Archiv, Test, Altlogik, bewusst deaktiviert.
- Gruppen und Flow-Beschreibungen nachziehen.

Keine Verhaltensaenderung.

### Phase 2 - Diagnosebasis

- `SY - Diagnose` einfuehren.
- Einheitliches Eventformat fuer Entscheidungen, Fehler und Aktorbefehle.
- Catch-Pflicht fuer alle servicefuehrenden Tabs.
- Debug-Konsole aus Produktionspfaden herausnehmen.

### Phase 3 - Request-Bus

- Pro Domaene einen Request-Eingang definieren: `LI`, `KL`, `STE`, `M`, `STA`, `AL`.
- Request-Schema validieren.
- Anfaenglich nur parallel beobachten, nicht sofort alte Pfade abschalten.

### Phase 4 - Routinen entkoppeln

Prioritaet:

1. `RO - Schlafenszeit`
2. `RO - Arbeitszeit`
3. `RO - 33a SOS`
4. `RO - Ich gehe`
5. `RO - Bettzeit`
6. `RO - Es werde Licht`
7. Szenenbasierte Routinen

### Phase 5 - Safety formalisieren

- Safety Supervisor fuer Brand/Wasser/Alarm/SOS.
- Safety-Request an Licht, Alarm, Medien, Steckdosen.
- Quittierung, Rueckkehr und Fallback definieren.

### Phase 6 - Standardmodule

- Raum-Modul fuer Licht/Klima/Bewegung.
- Geraetemodul fuer Steckdosen/Endgeraete.
- Prozessmodul fuer Aquarium/Heimgeraete.
- Medienausgabe-Modul.
- ToDo-/Listenmodul.

### Phase 7 - Tests und Simulation

- Test-Injection pro kritischem Flow.
- Simulationsmodus fuer Domaenencontroller.
- Erwartete Ausgangsanforderungen als Testdaten.
- Regressionstest fuer Function-Logik.

## 10. Abnahmekriterien fuer SPS-nahes Niveau

Ein professioneller Zielzustand ist erreicht, wenn:

- Jeder Aktor genau einen dokumentierten Owner hat.
- Jede Ausnahme vom Owner-Prinzip dokumentiert und diagnostiziert ist.
- Routinen keine Aktoren direkt schalten.
- Safety-Funktionen priorisiert, quittierbar und nachvollziehbar sind.
- Jede kritische Entscheidung ein Diagnoseevent erzeugt.
- Jeder servicefuehrende Tab einen Fehlerpfad hat.
- Jede Gruppe einen fachlichen Namen hat.
- Jeder fachliche Tab eine kurze Beschreibung hat.
- Deaktivierte Altlogik nicht in aktiven Produktionsflows liegt.
- Home-Assistant-Service-Calls nur definierte und validierte `msg`-Overrides erlauben.
- `unknown` und `unavailable` bewusst behandelt werden.
- Start, Restart und Verbindungsverlust definiert sind.
- Neue Raeume/Geraete nach Standardmodulen erweiterbar sind.

## 11. Priorisierte Top-10-Massnahmen

| Prioritaet | Massnahme | Wirkung |
| ---: | --- | --- |
| 1 | Aktor-Owner-Matrix erstellen | Grundursache fuer Doppelzugriffe sichtbar machen |
| 2 | 60 mehrfach genutzte Aktor-Targets entscheiden | Direkte Konflikte beseitigen |
| 3 | `SY - Diagnose` einfuehren | Verhalten nachvollziehbar machen |
| 4 | Catch-Pflicht fuer servicefuehrende Tabs | Fehler beherrschbar machen |
| 5 | `RO` auf Request-only umbauen | Kopplung massiv reduzieren |
| 6 | Safety Supervisor definieren | Brand/Wasser/Alarm/SOS sauber priorisieren |
| 7 | Licht-Dispatcher formalisieren | Groesste Domaene stabilisieren |
| 8 | Gruppen und Tab-Infos nachziehen | Wartbarkeit und Reviewfaehigkeit erhoehen |
| 9 | Deaktivierte Altlogik archivieren | Produktionsstand klaeren |
| 10 | Tests/Simulation fuer kritische Flows | Erweiterbarkeit absichern |

## 12. Schlussbewertung

Die Anlage ist nicht "nur DIY"; sie ist eine grosse, gewachsene Automatisierungsanlage mit vielen bereits guten Bausteinen. Der naechste Schritt ist eine Engineering-Schicht ueber der vorhandenen Funktion: Ownership, Schnittstellen, Diagnose, Betriebsarten, Safety-Prioritaeten und Tests.

Die wichtigste technische Entscheidung ist, direkte Aktorzugriffe aus Routinen und Fremddomaenen konsequent zu beenden. Danach wird das System nicht nur sauberer, sondern vor allem erklaerbar: Man kann dann fuer jeden Aktor beantworten, wer ihn zuletzt warum geschaltet hat, welche Freigaben galten und welche hoehere Prioritaet eventuell blockiert hat.
