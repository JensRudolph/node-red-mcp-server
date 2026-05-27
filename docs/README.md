# Dokumentation

Diese Dokumentation ist in Projekt-, Betriebs- und Archivbereiche getrennt.

## Projekt

- [Konfiguration](CONFIGURATION.md)
- [MCP-Tools](MCP_TOOLS.md)
- [Projektstruktur](PROJECT_STRUCTURE.md)
- [Entwicklung und Wartung](DEVELOPMENT.md)
- [Roadmap und Umsetzungshistorie](ROADMAP.md)
- [Node-RED-Lichtlogik](NODE_RED_LICHTLOGIK.md)

## Node-RED-Instanz

Die produktive Node-RED-Bestandsdokumentation liegt unter [node-red/README.md](node-red/README.md).

Wichtige Einstiege:

- [Architektur](node-red/ARCHITEKTUR.md)
- [Owner-Matrix V2](node-red/OWNER-MATRIX-V2.md)
- [Flow-Katalog](node-red/FLOW-KATALOG.md)
- [Flow-Details](node-red/FLOW-DETAILS.md)
- [Node-Inventar](node-red/NODE-INVENTORY.md)
- [Entity-Inventar](node-red/ENTITY-INVENTORY.md)
- [Service-Calls](node-red/SERVICE-CALLS.md)
- [Subflows](node-red/SUBFLOWS.md)
- [Betrieb und Tests](node-red/BETRIEB-UND-TESTS.md)

Die Node-RED-Doku wird aus einem aktuellen MCP-Flow-Backup erzeugt:

```powershell
npm run docs:node-red -- .mcp-backups\<backup-name>.json docs\node-red
```

## Archiv

Historische Audit- und Migrationsartefakte liegen unter [archive/README.md](archive/README.md). Sie sind bewusst aus dem Repo-Root herausgezogen, aber weiterhin auffindbar.
