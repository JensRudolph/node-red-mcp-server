# AGENTS.md

## Geltungsbereich

Diese Regeln gelten nur für Aktionen an einer Home-Assistant- oder Node-RED-Instanz, insbesondere:

- Live-Flows lesen, suchen, analysieren oder verändern
- Node-RED-Backups erstellen oder wiederherstellen
- Home-Assistant-Entitäten, Automationen, Szenen oder Services prüfen oder ändern
- Änderungen vorbereiten, die später in eine Live-Node-RED-Instanz zurückgespielt werden sollen

Nicht darunter fallen:

- Fragen zu diesem Repository, Quellcode, Tests oder Dokumentation
- Lesen oder Bearbeiten lokaler Dateien wie `AGENTS.md`, `README.md` oder Quellcode
- Allgemeine Erklärungen zu Node-RED, Home Assistant oder MCP
- Meta-Fragen zu diesen Regeln

Für diese lokalen oder erklärenden Aufgaben keine Node-RED-/Home-Assistant-MCP-Tools laden und kein Flow-Backup erstellen.

## Tool-Nutzung

Wenn eine Aufgabe tatsächlich Home Assistant oder Node-RED über MCP betrifft, zuerst `tool_search` nutzen, um die relevanten HA-/Node-RED-MCP-Tools zu laden.

In diesem Bereich niemals direkte API-Aufrufe gegen Home Assistant oder Node-RED machen. Alle Home-Assistant- und Node-RED-Aktionen müssen über die jeweiligen MCP-Tools laufen.

## Node-RED Live-Flows

Vor jeder Suche, Analyse oder Bearbeitung von Live-Node-RED-Flows ist zwingend ein aktuelles Flow-Backup über die Node-RED-MCP-Tools zu erstellen.

Nach dem Backup müssen Suche, Analyse und Änderungsvorbereitung lokal im Backup bzw. in daraus abgeleiteten lokalen Daten erfolgen. Node-RED darf währenddessen nicht direkt live verändert werden.

Fertige Node-RED-Änderungen müssen über das vorbereitete Backup und den Node-RED-MCP-Backup-Restore zurückgeschrieben werden.

Vor dem finalen Live-Restore ist zwingend zuerst ein `restore-backup-flows`-Dry-run auszuführen und zu prüfen. Erst danach darf der Live-Restore erfolgen.

## Tests und Regressionen

Vor groesseren oder sicherheitsrelevanten Umbauten sind Regressionstests zu erstellen oder zu erweitern, damit der aktuelle Funktionsumfang als Referenz festgehalten ist.

Diese Tests sollen sowohl die Struktur der betroffenen Flows als auch das fachliche Verhalten pruefen, damit nach Aenderungen klar ist, ob bestehende Logik weiterhin korrekt funktioniert.

Tests werden im Projekt unter `test/` gespeichert und bei Bedarf gegen vorbereitete Backups, lokale Quellen oder eingebettete Function-Bodies ausgefuehrt.

Vor dem Live-Schalten sind zuerst die gezielten Regressionstests und anschliessend die gesamte relevante Testsuite auszufuehren.
