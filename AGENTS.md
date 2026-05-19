# AGENTS.md

- Bei Home-Assistant- oder Node-RED-Aufgaben zuerst `tool_search` nutzen, um relevante HA-/Node-RED-MCP-Tools zu laden.
- In diesem Bereich niemals direkte API-Aufrufe gegen Home Assistant oder Node-RED machen. Alle Home-Assistant- und Node-RED-Aktionen muessen ueber die jeweiligen MCP-Tools laufen.
- Bei Node-RED-Suche, -Analyse oder -Bearbeitung zuerst ein aktuelles Flow-Backup ueber die Node-RED-MCP-Tools erstellen. Danach bevorzugt im Backup bzw. auf daraus abgeleiteten lokalen Daten suchen, analysieren und Aenderungen vorbereiten, damit lokale Befehle gezielt und reproduzierbar arbeiten koennen.
