# Roadmap und Umsetzungshistorie

Diese Datei ersetzt die fruehere Root-Datei `feature_ideas.md`. Die meisten dort notierten Ideen sind inzwischen umgesetzt und in den MCP-Tools dokumentiert.

## Umgesetzt

| Bereich | Status |
| --- | --- |
| Selektives `get-flows` mit Filtern und Pagination | umgesetzt |
| `get-subflow`, `list-subflows`, `subflow-usage` | umgesetzt |
| `get-nodes` und `search-nodes` mit Flow-, Typ-, Entity- und Property-Filtern | umgesetzt |
| Response-Truncation, Feldprojektion, `get-node` und `get-function-context` | umgesetzt |
| `get-backup-node`, `derive-backup` und `simulate-function-node` | umgesetzt |
| `clone-flow` mit ID-, Wire-, Link-, Gruppen- und Entity-Remapping | umgesetzt |
| `clone-subflow`, `create-subflow`, `update-subflow` ueber scoped `PUT /flow/global` | umgesetzt |
| `validate-flow-payload` und `validate-subflow-payload` | umgesetzt |
| `dry-run-create-flow`, `dry-run-create-subflow`, `dry-run-update-subflow` | umgesetzt |
| `replace-in-flow` und `clear-entities-in-flow` mit Dry-run-Default | umgesetzt |
| `entity-audit` fuer Home-Assistant-Entity-Erkennung | umgesetzt |
| `diff-flow-against-source` und Backup-Diffs | umgesetzt |
| Verbesserte `create-flow`-Rueckgabe mit ID-Vergleich und Auditdaten | umgesetzt |
| Automatische Mutationsbackups, Restore-Dry-run, `undo-last-mutation` | umgesetzt |

## Offen

| Thema | Nutzen |
| --- | --- |
| Beispielkatalog fuer haeufige Flow-Kopien | Schnellere Bedienung der vorhandenen Clone-/Replace-Tools |
| CI-Workflow fuer `npm test` und `npm pack --dry-run` | Fruehere Regressionserkennung |
| Schema-naehere Dokumentation pro Toolargument | Bessere Nutzbarkeit in Clients, die Toolbeschreibungen knapp anzeigen |
| Konsolidierung alter flow-spezifischer Scripts | Weniger Sonderfalllogik unter `scripts/` |
| Optionaler Generator fuer Tool-Doku aus registrierten Zod-Schemas | Weniger manuelle Drift zwischen Code und Doku |

## Historie

Die urspruengliche Ideensammlung entstand aus mehreren grossen Node-RED-Flow-Kopien, insbesondere aus Licht-Template- und Owner-Matrix-Arbeiten. Die daraus abgeleiteten Sicherheitsprinzipien bleiben gueltig:

- Erst Backup, dann Analyse.
- Dry-run vor Live-Aenderungen.
- Kleine scoped Writes bevorzugen.
- Complete `/flows` Writes nur als expliziter letzter Ausweg.
