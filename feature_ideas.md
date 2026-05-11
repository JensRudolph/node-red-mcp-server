# Feature-Ideen fuer den Node-RED-MCP-Server

## Anlass

Beim Kopieren des Node-RED-Flows `LI - Ankleidezimmer` nach `LI - Esszimmer`
wurde der bestehende Flow als Vorlage verwendet, aber mehrere Teile mussten
gezielt angepasst werden:

- der neue Flow-Tab sollte `LI - Esszimmer` heissen
- alle Node-IDs mussten eindeutig neu erzeugt werden
- interne Link-Verbindungen mussten auf die neuen Node-IDs umgeschrieben werden
- alle `z`-Referenzen mussten auf den neuen Flow-Tab zeigen
- Raum-Entitaeten mussten von Ankleidezimmer auf Esszimmer geaendert werden
- konkrete Licht-Entitaeten sollten bewusst frei bleiben
- der neue Flow musste anschliessend validiert werden

Die vorhandenen MCP-Tools waren fuer das Lesen, Sichern und Pruefen hilfreich.
Fuer die eigentliche Transformation war aber ein lokales Script robuster, weil
die Aenderung viele gekoppelte Node-RED-Details betraf.

## Verwendete MCP-Tools

Folgende MCP-Tools wurden erfolgreich genutzt:

- `node_red.get_flow`
  - hat den Live-Flow `LI - Ankleidezimmer` anhand der Flow-ID geladen
  - war die Grundlage fuer die Kopie

- `node_red.backup_flows`
  - hat vor der Mutation ein Sicherheitsbackup erstellt
  - Backup-Name: `before_li_esszimmer_from_ankleidezimmer_20260510`

- `node_red.list_tabs`
  - hat bestaetigt, dass der neue Tab angelegt wurde
  - der neue Flow wurde als `LI - Esszimmer` gefunden

- Home-Assistant-MCP-Tools
  - wurden genutzt, um passende Esszimmer-Entitaeten zu pruefen
  - relevante Treffer waren unter anderem:
    - `binary_sensor.prasenzmelder_kuche_belegung_esszimmer`
    - `sensor.prasenzmelder_kuche_beleuchtungsstarke`
    - `input_boolean.licht_automatisierung_esszimmer`
    - `input_select.licht_automatisierung_esszimmer_status`
    - `input_select.licht_automatisierung_esszimmer_lichtanforderung`

## Warum fuer die Erstellung ein lokales Script genutzt wurde

Der neue Flow bestand aus 113 Nodes. Beim Kopieren mussten nicht nur Texte und
Entitaeten ersetzt werden, sondern auch die komplette interne Node-RED-Struktur
konsistent bleiben.

Besonders kritisch waren:

- neue IDs fuer alle Nodes und Gruppen
- konsistente Umschreibung aller `links`-Arrays von Link-In/Link-Out-Nodes
- korrekte Umschreibung aller `wires`
- korrekte Umschreibung von Gruppenmitgliedschaften
- Entfernung konkreter Licht-Entitaeten ohne Entfernen der eigentlichen
  Automatisierungslogik
- Validierung, dass keine alten `Ankleidezimmer`-Referenzen uebrig bleiben
- Validierung, dass keine konkreten `light.*`-Entity-Zuweisungen gesetzt wurden

Ein einzelner grosser `create_flow`-Payload ueber MCP waere grundsaetzlich
moeglich gewesen. Praktisch waere er aber schwerer zu pruefen und fehleranfaellig
gewesen, weil die Transformation vorher sauber simuliert werden musste.

Das lokale Script konnte zuerst einen Dry-Run ausfuehren und pruefen:

- Anzahl der Nodes
- neue Flow-ID
- keine uebrigen `Ankleidezimmer`-Strings
- keine konkreten `light.*`-Entity-Zuweisungen
- erwartete Esszimmer-Helper
- neutrale Licht-Platzhalter

Danach wurde der Flow ueber die Node-RED Admin API angelegt.

## Auffaelligkeit beim Anlegen per Node-RED API

Beim POST auf `/flow` wurde eine vorab erzeugte Flow-ID im Payload nicht als
finale ID uebernommen. Node-RED hat selbst eine neue Flow-ID vergeben.

Dadurch musste der neue Flow nach dem Anlegen ueber seinen Tab-Namen
`LI - Esszimmer` gesucht werden. Die tatsaechlich erzeugte ID war:

`46b22075e4fd2912`

Das ist ein wichtiger Punkt fuer ein zukuenftiges MCP-Feature: Nach dem Erstellen
eines Flows sollte das Tool die tatsaechlich erzeugte Flow-ID verlaesslich
zurueckgeben und optional ein Mapping der alten zu den neuen IDs liefern.

## Gewuenschte MCP-Features

### Ergaenzung aus `GES - NINA neu`

Beim Analysieren und Kopieren des Flows `GES - NINA` nach `GES - NINA neu`
waren die vorhandenen MCP-Tools grundsaetzlich ausreichend, um den neuen Flow
anzulegen. Die Arbeit wurde aber unnoetig schwer, weil mehrere zielgerichtete
Lesewerkzeuge fehlen oder erst ueber Tool-Discovery sichtbar wurden.

Wichtig: Das Abschneiden der Ausgabe scheint nicht im MCP-Server selbst zu
passieren. `get_flows` serialisiert aktuell die komplette Flow-Liste als
formatiertes JSON. Bei grossen Node-RED-Installationen ist diese Antwort aber so
umfangreich, dass die Tool-Ausgabe im Client bzw. in der Weitergabe an den
Agenten gekuerzt werden kann. Dadurch kommen in der Analyse nur Ausschnitte der
Gesamtdefinition an, obwohl der Server grundsaetzlich die volle Antwort liefert.

Konkret hilfreich waeren:

- `get_subflow(id)`
  - liefert eine Subflow-Definition inklusive interner Nodes
  - vermeidet grosse `get_flows`-Ausgaben, wenn nur ein Subflow relevant ist
  - Beispiel: gezieltes Pruefen des Subflows `Benachrichtigung`

- `get_nodes` mit kombinierbaren Filtern
  - Filter nach `flowId`, `flowLabel`, `nodeType`, `name`, `entityId`,
    `subflowId` und beliebigen Properties
  - ersetzt sehr breite Tools wie `find_nodes_by_type`, die bei vielen Nodes
    schnell zu grosse Ausgaben erzeugen

- paginierte oder selektive `get_flows`-Ausgabe
  - z. B. `includeTabs`, `includeConfigNodes`, `flowId`, `types`, `limit`,
    `offset`
  - verhindert abgeschnittene Antworten bei grossen Node-RED-Installationen

- gezielte Suche innerhalb eines Flow-Tabs
  - Suche nur in einem konkreten Tab statt ueber alle Flows
  - Rueckgabe mit Node-ID, Node-Type, Feldpfad und Trefferwert

Nutzen:

- weniger Bedarf fuer direkte Node-RED-Admin-API-Aufrufe
- kleinere, belastbarere MCP-Antworten
- bessere Grundlage fuer Review, Refactoring und gezielte Flow-Kopien
- weniger Risiko, aus abgeschnittenen Gesamtausgaben falsche Schluesse zu
  ziehen

### 1. `clone_flow`

Ein dediziertes Tool zum Kopieren eines bestehenden Node-RED-Flows.

Moegliche Signatur:

```json
{
  "sourceId": "b84b2227e15f2ce5",
  "newLabel": "LI - Esszimmer",
  "replacements": {
    "Ankleidezimmer": "Esszimmer",
    "ankleidezimmer": "esszimmer",
    "binary_sensor.bewegungsmelder_ankleidezimmer_occupancy": "binary_sensor.prasenzmelder_kuche_belegung_esszimmer",
    "sensor.bewegungsmelder_ankleidezimmer_illuminance": "sensor.prasenzmelder_kuche_beleuchtungsstarke"
  },
  "clearEntityPatterns": [
    "^light\\.",
    "^sensor\\.lichtschalter_.*_action$"
  ]
}
```

Das Tool sollte:

- den Quell-Flow laden
- alle Node-IDs neu erzeugen
- alle `z`-Referenzen umschreiben
- alle `wires` umschreiben
- alle `links` umschreiben
- Gruppenmitgliedschaften korrigieren
- optional Text- und Entity-Ersetzungen anwenden
- optional bestimmte Entity-Zuweisungen neutralisieren
- den neuen Flow anlegen
- die neue Flow-ID zurueckgeben
- ein Mapping von alten zu neuen IDs ausgeben

Nutzen:

- weniger fehleranfaellige Flow-Kopien
- wiederholbarer Workflow fuer aehnliche Raum-Automatisierungen
- keine lokalen Hilfsscripts noetig

### 2. `validate_flow_payload`

Ein Tool, das einen Flow-Payload prueft, bevor er geschrieben wird.

Das Tool sollte pruefen:

- doppelte Node-IDs
- fehlende Ziele in `wires`
- fehlende Ziele in `links`
- Nodes mit falscher `z`-Referenz
- Gruppen, deren `nodes`-Liste nicht mehr stimmt
- Nodes, die auf nicht vorhandene Config-Nodes verweisen
- offensichtliche leere oder ungueltige Entity-Felder

Optional sollte es Warnungen statt Fehler liefern koennen, zum Beispiel fuer
bewusst freie Entity-Platzhalter.

Nutzen:

- sichere Dry-Runs vor Mutationen
- weniger Risiko bei grossen Flow-Aenderungen
- bessere Rueckmeldungen an den Agenten und den Benutzer

### 3. `dry_run_create_flow`

Ein Tool, das das Anlegen eines Flows simuliert, ohne Node-RED zu veraendern.

Das Tool sollte zurueckgeben:

- ob der Payload grundsaetzlich akzeptiert wuerde
- welche Flow-ID verwendet wuerde oder ob Node-RED eine eigene ID erzeugt
- welche Node-IDs neu oder konfliktbehaftet sind
- welche Entitaeten im Flow vorkommen
- welche internen Links erzeugt wuerden

Nutzen:

- klare Vorschau vor dem Schreiben
- weniger Bedarf fuer lokale Scripts
- bessere UX bei grossen Flow-Operationen

### 4. `replace_in_flow`

Ein Flow-spezifisches Such- und Ersetzungstool.

Moegliche Funktionen:

- String-Ersetzung in einem Flow
- Entity-Ersetzung in typischen Node-RED-Home-Assistant-Feldern
- Regex-Ersetzung mit Vorschau
- nur bestimmte Node-Typen bearbeiten
- nur bestimmte Felder bearbeiten
- Dry-Run mit Diff
- optionale direkte Anwendung nach Bestaetigung

Beispiel:

```json
{
  "flowId": "b84b2227e15f2ce5",
  "replacements": {
    "ankleidezimmer": "esszimmer",
    "Ankleidezimmer": "Esszimmer"
  },
  "dryRun": true
}
```

Nutzen:

- gezielte Massenbearbeitung ohne komplette lokale Transformation
- bessere Kontrolle als manuelles JSON-Editieren
- hilfreich fuer Raumduplikate und Namenskonventionen

### 5. `search_nodes` mit Flow-Filter und strukturierten Ergebnissen

Ein Suchtool fuer Nodes waere besonders nuetzlich, wenn es gezielt auf einen
Flow eingeschraenkt werden kann.

Gewuenschte Filter:

- `flowId`
- `flowLabel`
- `nodeType`
- `name`
- `entityId`
- `action`
- `service`
- Regex auf beliebige Felder

Die Rueckgabe sollte strukturiert sein:

```json
{
  "matches": [
    {
      "id": "034fb629d532ce9f",
      "type": "server-state-changed",
      "name": "Trigger1 - true",
      "field": "entities.entity[0]",
      "value": "binary_sensor.bewegungsmelder_ankleidezimmer_occupancy"
    }
  ]
}
```

Nutzen:

- schneller Ueberblick vor Aenderungen
- gezielteres Refactoring
- bessere Grundlage fuer automatisierte Ersetzungen

### 6. `diff_flow_against_source`

Ein Tool, das zwei Flows miteinander vergleicht.

Es sollte unterscheiden zwischen:

- strukturell gleichen Nodes mit unterschiedlichen IDs
- erwarteten Text-/Entity-Ersetzungen
- geloeschten oder hinzugefuegten Nodes
- geaenderten Wires
- geaenderten Link-Verbindungen
- geaenderten Service-Aufrufen
- geaenderten Flow-Variablen

Fuer geklonte Flows sollte das Tool ein ID-Mapping akzeptieren:

```json
{
  "sourceFlowId": "b84b2227e15f2ce5",
  "targetFlowId": "46b22075e4fd2912",
  "idMap": {
    "034fb629d532ce9f": "..."
  }
}
```

Nutzen:

- schnelle Qualitaetskontrolle nach Flow-Kopien
- bessere Nachvollziehbarkeit
- einfache Pruefung, ob nur erwartete Unterschiede vorhanden sind

### 7. Verbesserte Rueckgabe von `create_flow`

Das bestehende `create_flow`-Tool sollte nach dem Anlegen mehr Informationen
zurueckgeben.

Gewuenschte Rueckgabe:

- tatsaechliche neue Flow-ID
- Label
- Anzahl angelegter Nodes
- optional neues Revision-Token
- optional Mapping von Payload-ID zu tatsaechlicher Node-RED-ID
- Warnung, wenn Node-RED IDs aus dem Payload ignoriert oder ersetzt hat

Nutzen:

- Agenten muessen den neuen Flow nicht nachtraeglich ueber Label suchen
- weniger Mehrdeutigkeit bei identischen oder aehnlichen Labels
- bessere Automatisierbarkeit nach dem Erstellen

### 8. `clear_entities_in_flow`

Ein Tool zum gezielten Neutralisieren von Entity-Zuweisungen.

Beispiele:

- alle konkreten `light.*`-Zuweisungen entfernen
- alle Lichtschalter-Trigger auf einen neutralen Platzhalter setzen
- nur Home-Assistant-Service-Ziele neutralisieren, aber Service-Actions wie
  `light.turn_on` unveraendert lassen

Moegliche Signatur:

```json
{
  "flowId": "46b22075e4fd2912",
  "patterns": ["^light\\."],
  "replacement": "input_number.allgemein_immer_1",
  "dryRun": true
}
```

Nutzen:

- passend fuer Vorlagen, bei denen Geraete spaeter manuell zugewiesen werden
- verhindert versehentliches Schalten alter Raumlichter
- reduziert Risiko bei kopierten Automatisierungen

### 9. Entity-Audit fuer Home-Assistant-Nodes

Ein Tool, das alle Home-Assistant-Entitaeten eines Flows extrahiert und
kategorisiert.

Kategorien:

- Trigger-Entitaeten
- Current-State-Entitaeten
- Service-Zielentitaeten
- Flow-Variablen mit Entity-IDs
- Mustache-Templates mit Entity-Bezug
- neutrale Platzhalter
- konkrete Licht-Entitaeten
- potenziell nicht vorhandene Entitaeten

Optional koennte das Tool direkt gegen Home Assistant pruefen, ob die Entitaeten
existieren.

Nutzen:

- schnelle Sicherheitspruefung vor Deployment
- klare Liste, was nach einer Kopie noch manuell zugewiesen werden muss
- weniger versteckte Alt-Referenzen

### 10. Kombiniertes Backup- und Mutationsprotokoll

Mutierende Tools sollten ein konsistentes Protokoll liefern:

- Backup-Name
- Backup-Zeitpunkt
- Operation
- betroffener Flow
- Anzahl geaenderter Nodes
- neue Revision
- kurzer Diff
- Validierungsstatus

Nutzen:

- bessere Nachvollziehbarkeit
- einfache Rueckabwicklung
- gutes Audit-Log fuer Automatisierungsarbeiten

## Konkreter Ziel-Workflow fuer zukuenftige Flow-Kopien

Ideal waere ein Workflow wie dieser:

1. `clone_flow` mit `dryRun: true`
2. Ergebnis pruefen:
   - neue Node-Anzahl
   - geplante Ersetzungen
   - freie Licht-Zuweisungen
   - keine alten Raumreferenzen
3. `validate_flow_payload`
4. `backup_flows`
5. `clone_flow` mit `dryRun: false`
6. `diff_flow_against_source`
7. `entity_audit`

Damit waere der gesamte Prozess ueber MCP abbildbar. Lokale Scripts waeren nur
noch fuer Sonderfaelle notwendig.

## Wichtigste Prioritaet

Die wichtigste Verbesserung waere ein robustes `clone_flow`-Tool.

Dieses Tool wuerde den groessten Teil der Komplexitaet abdecken:

- ID-Remapping
- Link-Remapping
- Wire-Remapping
- Entity-Ersetzungen
- optionale Neutralisierung bestimmter Entitaeten
- Validierung
- Rueckgabe der finalen Flow-ID

Damit waere der konkrete Anwendungsfall `LI - Ankleidezimmer` nach
`LI - Esszimmer` vollstaendig ueber MCP loesbar.
