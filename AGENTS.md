# AGENTS.md

- Bei Home-Assistant- oder Node-RED-Aufgaben zuerst `tool_search` nutzen, um relevante HA-/Node-RED-MCP-Tools zu laden.
- In diesem Bereich niemals direkte API-Aufrufe gegen Home Assistant oder Node-RED machen. Alle Home-Assistant- und Node-RED-Aktionen müssen über die jeweiligen MCP-Tools laufen.
- Bei jeder Node-RED-Suche, -Analyse oder -Bearbeitung ist zuerst zwingend ein aktuelles Flow-Backup über die Node-RED-MCP-Tools zu erstellen.
- Nach dem Backup müssen Suche, Analyse und Änderungsvorbereitung lokal im Backup bzw. in daraus abgeleiteten lokalen Daten erfolgen. Node-RED darf währenddessen nicht direkt live verändert werden.
- Fertige Node-RED-Änderungen müssen über das vorbereitete Backup und den Node-RED-MCP-Backup-Restore zurückgeschrieben werden. Vor dem finalen Live-Restore ist zwingend zuerst ein `restore-backup-flows`-Dry-run auszuführen und zu prüfen; erst danach darf der Live-Restore erfolgen.
