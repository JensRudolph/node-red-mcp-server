# Gedanken - Node-RED Vollaudit 2026-05-11

## Arbeitsregeln

- Keine Aenderungen an Node-RED-Flows oder Home Assistant.
- Vollstaendiger aktueller Flow-Export als lokale Arbeitsgrundlage.
- Befunde nicht nur im Chat-Kontext halten, sondern fortlaufend hier dokumentieren.
- Bericht am Ende in `NODE_RED_SMARTHOME_AUDIT_2026-05-11.md` vervollstaendigen.

## Laufende Notizen

### 2026-05-11 13:34

- Node-RED-MCP-Tools geladen.
- Aktueller Flow-Export ueber `backup_flows` erzeugt.
- Export liegt lokal unter `.mcp-backups/audit_full_export_20260511.json`.
- Exportumfang laut MCP: 192 Tabs, 5971 Nodes, ca. 3191 KB Nutzdaten; Dateigroesse im Workspace ca. 4.95 MB.
- Bisheriger Bericht war kein Vollaudit, sondern stark auf Architektur, Licht und exemplarische Befunde fokussiert.
- Naechster Schritt: Export lokal maschinell inventarisieren, damit alle Tabs und Domaenen systematisch betrachtet werden.

### 2026-05-11 13:40

- Lokales Analysewerkzeug `audit_node_red_export_2026-05-11.mjs` erstellt.
- Artefakte erzeugt:
  - `NODE_RED_AUDIT_INVENTORY_2026-05-11.json`
  - `NODE_RED_AUDIT_INVENTORY_2026-05-11.md`
- Gesamtzahlen aus dem Export:
  - 6174 Objekte
  - 192 Tabs
  - 2 deaktivierte Tabs
  - 11 Subflows
  - 5971 regulaere Nodes
  - 1060 Home-Assistant-Service-Calls
  - 635 aktorartige Service-Calls
  - 361 Helper-Writes
  - 172 Cross-Owner-Calls nach vorlaeufiger Owner-Heuristik
  - 605 eindeutige Entity-Referenzen
  - 118 konkrete Aktor-Targets in Service-Calls
  - 60 mehrfach genutzte konkrete Aktor-Targets
  - 0 fehlende Wire-Ziele
  - 510 Gruppen, davon 502 ohne Namen
  - 233 Function-Nodes, davon 11 lange Funktionen
  - 62 Catch-Nodes, 65 Debug-Nodes, 62 davon mit Console-Ausgabe
- Erster starker Befund: Die technische Verdrahtung ist formal konsistent (keine fehlenden Wires), aber die fachliche Ownership ist breit verteilt.
- Hinweis zur Heuristik: Template-Pfade wie `msg.*` und `parent.*` wurden aus Entity-Zaehlern entfernt; Cross-Owner bleibt ein Indikator und muss fachlich gegen eine echte Owner-Matrix verifiziert werden.

### 2026-05-11 13:50

- Domaenenweise Betrachtung begonnen.
- Wichtige uebergreifende Befunde:
  - 97 Tabs mit Service-Calls haben keinen Catch-Node.
  - 502 von 510 Gruppen haben keinen Namen.
  - 162 von 165 fachlichen Tabs haben keine Beschreibung (`info`).
  - Alle 1060 Service-Calls haben `queue: none`.
  - 865 Service-Calls haben `blockInputOverrides: false`; viele Service-Calls koennen damit stark von eingehenden `msg`-Daten abhaengen.
  - 902 `api-current-state` und 923 `server-state-changed` Nodes sind nach Heuristik nicht sichtbar robust gegen `unknown`/`unavailable` abgesichert. Das ist eine Heuristik und muss pro Node bewertet werden.
  - `GES - NINA neu` liegt tab-reihenfolgebedingt unter der Sektion `Zahnbuerste`, obwohl der Prefix `GES` nach `Gesundheit` gehoert.
  - `LI - Schlafzimmer` enthaelt 114 deaktivierte Nodes innerhalb eines aktiven Tabs.
  - Deaktivierte Tabs: `AL - 33 Trigger Old`, `RO - 33a SOS`.
- Hauptkollisionen nach konkreten Ziel-Entities:
  - `light.licht_gruppe_innenbeleuchtung`: 17 Calls aus 12 Tabs und 4 Sektionen (`Brandmeldeanlage`, `Licht`, `Routine`, `Wassermeldeanlage`).
  - Mehrere `media_player.*` Echo-Ziele: Geofencing, Medienkontrolle und Routine greifen direkt zu.
  - `switch.steckdose_wireless_chargingstation`: Endgeraet, Routine und Steckdosen greifen zu.
  - Aquarium-Steckdosen werden aus `AQ` und teils `RO - Schlafenszeit` bedient.
  - Sirenen und Rauchmelder-Switches werden aus Alarm-, Wasser- und Routine-Kontexten bedient.
- Domaenenbefund: Das System ist technisch umfangreich und funktional gegliedert, aber noch nicht wie eine Anlage mit verbindlicher Aktor-/Prozess-Ownership, Diagnosebus und Betriebsartenmodell strukturiert.
