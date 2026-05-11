# Node-RED Audit Inventar 2026-05-11

Quelle: `.mcp-backups/audit_full_export_20260511.json`
Backup: `audit_full_export_20260511`, Zeitstempel: `2026-05-11T11:34:05.912Z`

## Gesamtzahlen

| Kennzahl | Wert |
| --- | --- |
| Objekte gesamt | 6174 |
| Tabs | 192 |
| Subflows | 11 |
| Config Nodes | 5 |
| Regulaere Nodes | 5971 |
| Service Calls | 1060 |
| Direkte aktorartige Calls | 635 |
| Helper Writes | 361 |
| Cross-Owner Calls | 172 |
| Entity-Vorkommen | 834 |
| Eindeutige Entities | 605 |
| Konkrete Aktor-Targets | 118 |
| Mehrfach genutzte Aktor-Targets | 60 |
| Groups | 510 |
| Leere Groups | 502 |
| Function Nodes | 233 |
| Lange Functions | 11 |
| Catch Nodes | 62 |
| Debug Nodes | 65 |
| Console Debug Nodes | 62 |
| Fehlende Wire-Ziele | 0 |
| Deaktivierte Nodes | 114 |

## Domaenen/Sektionen

| Sektion | Tabs | Nodes | Service | Aktor | CrossOwner | Groups | Leer | Catch | Debug | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Licht | 21 | 2168 | 437 | 404 | 0 | 145 | 144 | 18 | 20 | 2871 |
| Routine | 18 | 598 | 119 | 73 | 73 | 39 | 39 | 0 | 0 | 1167 |
| Brandmeldeanlage | 12 | 198 | 28 | 20 | 20 | 21 | 21 | 0 | 0 | 340 |
| Sprachausgabe | 32 | 325 | 39 | 0 | 0 | 33 | 33 | 0 | 0 | 305 |
| Aquarium | 6 | 105 | 23 | 17 | 17 | 6 | 6 | 0 | 0 | 266 |
| Alarmanlage | 8 | 407 | 82 | 10 | 6 | 64 | 63 | 7 | 8 | 253 |
| Klima | 8 | 192 | 36 | 20 | 4 | 19 | 19 | 0 | 0 | 245 |
| Geofencing | 6 | 64 | 22 | 12 | 12 | 9 | 9 | 0 | 0 | 200 |
| Endgerät | 11 | 110 | 15 | 7 | 7 | 17 | 17 | 0 | 0 | 194 |
| Fortbewegung | 3 | 312 | 25 | 9 | 5 | 20 | 20 | 2 | 2 | 187 |
| Kamera | 8 | 53 | 12 | 12 | 10 | 7 | 7 | 0 | 0 | 184 |
| Medienkontrolle | 4 | 82 | 35 | 17 | 0 | 11 | 11 | 0 | 0 | 150 |
| ToDo | 8 | 123 | 38 | 0 | 0 | 18 | 18 | 7 | 7 | 109 |
| Strom | 4 | 178 | 29 | 0 | 0 | 19 | 19 | 3 | 3 | 82 |
| Heimgeräte | 4 | 69 | 11 | 6 | 3 | 5 | 5 | 1 | 1 | 74 |
| Wassermeldeanlage | 3 | 32 | 6 | 4 | 4 | 4 | 4 | 0 | 0 | 70 |
| System | 7 | 156 | 38 | 0 | 0 | 26 | 26 | 6 | 6 | 68 |
| Steckdosen | 7 | 91 | 8 | 8 | 0 | 12 | 12 | 6 | 6 | 62 |
| Staubsauger | 2 | 85 | 7 | 5 | 0 | 3 | 3 | 1 | 1 | 46 |
| Sprachsteuerung | 3 | 44 | 4 | 2 | 2 | 4 | 4 | 2 | 2 | 40 |
| Relais | 2 | 9 | 2 | 2 | 2 | 2 | 2 | 1 | 1 | 28 |
| Zahnbürste | 4 | 44 | 4 | 0 | 0 | 6 | 4 | 3 | 3 | 23 |
| Gesundheit | 3 | 58 | 7 | 0 | 0 | 7 | 7 | 2 | 2 | 20 |
| Kalender | 2 | 18 | 2 | 0 | 0 | 2 | 2 | 0 | 0 | 17 |
| Netzwerk | 2 | 26 | 0 | 0 | 0 | 4 | 4 | 0 | 0 | 10 |
| Wetter | 2 | 45 | 1 | 0 | 0 | 2 | 2 | 1 | 1 | 10 |
| Datenbank | 2 | 36 | 3 | 0 | 0 | 4 | 0 | 2 | 2 | 9 |

## Alle Tabs

| # | Tab | Sektion | Nodes | Service | Aktor | CrossOwner | Funktionen | Catch | Debug | LeerGrp | Info | Risiko |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | ### Alarmanlage | Alarmanlage | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 2 | AL - 33 Ausgelöst | Alarmanlage | 38 | 9 | 5 | 3 | 0 | 1 | 1 | 4 | nein | mittel (59) |
| 3 | AL - 33 Anwesenheitserkennung | Alarmanlage | 99 | 37 | 0 | 0 | 0 | 1 | 1 | 21 | nein | mittel (58) |
| 4 | AL - 33 Trigger | Alarmanlage | 21 | 1 | 0 | 0 | 8 | 1 | 2 | 0 | ja | niedrig (17) |
| 5 | AL - 33 Trigger Old | Alarmanlage | 147 | 18 | 0 | 0 | 0 | 1 | 1 | 22 | nein | mittel (40) |
| 6 | AL - 33a Ausgelöst | Alarmanlage | 38 | 9 | 5 | 3 | 0 | 1 | 1 | 4 | nein | mittel (59) |
| 7 | AL - 33a Anwesenheitserkennung | Alarmanlage | 14 | 3 | 0 | 0 | 0 | 1 | 1 | 4 | nein | niedrig (7) |
| 8 | AL - 33a Trigger | Alarmanlage | 50 | 5 | 0 | 0 | 0 | 1 | 1 | 8 | nein | niedrig (13) |
| 9 | ### Aquarium | Aquarium | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 10 | AQ - Heizung | Aquarium | 33 | 5 | 5 | 5 | 2 | 0 | 0 | 1 | nein | mittel (75) |
| 11 | AQ - Licht | Aquarium | 19 | 2 | 2 | 2 | 1 | 0 | 0 | 1 | nein | niedrig (34) |
| 12 | AQ - Pumpe | Aquarium | 9 | 1 | 1 | 1 | 0 | 0 | 0 | 1 | nein | niedrig (19) |
| 13 | AQ - Strömung | Aquarium | 30 | 4 | 4 | 4 | 1 | 0 | 0 | 2 | nein | mittel (61) |
| 14 | AQ - Wartungsmodus | Aquarium | 14 | 11 | 5 | 5 | 0 | 0 | 0 | 1 | nein | mittel (77) |
| 15 | ### Brandmeldeanlage | Brandmeldeanlage | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 16 | BR - 10 Ausgelöst | Brandmeldeanlage | 47 | 8 | 8 | 8 | 1 | 0 | 0 | 3 | nein | hoch (114) |
| 17 | BR - 33 Ausgelöst | Brandmeldeanlage | 36 | 6 | 6 | 6 | 1 | 0 | 0 | 3 | nein | hoch (88) |
| 18 | BR - 33a Ausgelöst | Brandmeldeanlage | 30 | 6 | 6 | 6 | 1 | 0 | 0 | 3 | nein | hoch (88) |
| 19 | BR - 10 Trigger | Brandmeldeanlage | 6 | 2 | 0 | 0 | 0 | 0 | 0 | 1 | nein | niedrig (8) |
| 20 | BR - 33 Trigger | Brandmeldeanlage | 6 | 2 | 0 | 0 | 0 | 0 | 0 | 1 | nein | niedrig (8) |
| 21 | BR - 33a Trigger | Brandmeldeanlage | 6 | 2 | 0 | 0 | 0 | 0 | 0 | 1 | nein | niedrig (8) |
| 22 | BR - Dimmer Temperaturcheck | Brandmeldeanlage | 10 | 0 | 0 | 0 | 1 | 0 | 0 | 2 | nein | niedrig (4) |
| 23 | BR - Energiemessung Temperaturcheck | Brandmeldeanlage | 16 | 0 | 0 | 0 | 1 | 0 | 0 | 2 | nein | niedrig (4) |
| 24 | BR - Relais Temperaturcheck | Brandmeldeanlage | 16 | 0 | 0 | 0 | 1 | 0 | 0 | 2 | nein | niedrig (4) |
| 25 | BR - Steckdose Temperaturgrenze | Brandmeldeanlage | 14 | 0 | 0 | 0 | 1 | 0 | 0 | 2 | nein | niedrig (4) |
| 26 | BR - Test | Brandmeldeanlage | 11 | 2 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (10) |
| 27 | ### Datenbank | Datenbank | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 28 | DA - Server | Datenbank | 36 | 3 | 0 | 0 | 3 | 2 | 2 | 0 | nein | niedrig (9) |
| 29 | ### Endgerät | Endgerät | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 30 | E - Ladeautomatik Celine | Endgerät | 10 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | nein | niedrig (23) |
| 31 | E - Ladeautomatik Jens | Endgerät | 10 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | nein | niedrig (23) |
| 32 | E - Ladeautomatik Tablet | Endgerät | 14 | 1 | 1 | 1 | 2 | 0 | 0 | 2 | nein | niedrig (24) |
| 33 | E - Ladeautomatik Watch4 | Endgerät | 10 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | nein | niedrig (23) |
| 34 | E - Ladeautomatik Watch6 | Endgerät | 10 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | nein | niedrig (23) |
| 35 | E - Ladeautomatik S8 | Endgerät | 24 | 2 | 2 | 2 | 4 | 0 | 0 | 3 | nein | mittel (42) |
| 36 | E - Verwaltung Celine | Endgerät | 8 | 2 | 0 | 0 | 0 | 0 | 0 | 2 | nein | niedrig (9) |
| 37 | E - Verwaltung Jens | Endgerät | 8 | 2 | 0 | 0 | 0 | 0 | 0 | 2 | nein | niedrig (9) |
| 38 | E - 33a Verwaltung Andrea | Endgerät | 8 | 2 | 0 | 0 | 0 | 0 | 0 | 2 | nein | niedrig (9) |
| 39 | E - 33a Verwaltung Fred | Endgerät | 8 | 2 | 0 | 0 | 0 | 0 | 0 | 2 | nein | niedrig (9) |
| 40 | ### Fortbewegung | Fortbewegung | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 41 | F - Volvo S90 | Fortbewegung | 154 | 13 | 5 | 3 | 16 | 1 | 1 | 10 | nein | hoch (101) |
| 42 | F - Volvo XC90 | Fortbewegung | 158 | 12 | 4 | 2 | 15 | 1 | 1 | 10 | nein | hoch (86) |
| 43 | ### Geofencing | Geofencing | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 44 | GEO - Allgemein | Geofencing | 8 | 2 | 0 | 0 | 0 | 0 | 0 | 1 | nein | niedrig (8) |
| 45 | GEO - Andrea | Geofencing | 14 | 5 | 3 | 3 | 0 | 0 | 0 | 2 | nein | mittel (48) |
| 46 | GEO - Celine | Geofencing | 14 | 5 | 3 | 3 | 0 | 0 | 0 | 2 | nein | mittel (48) |
| 47 | GEO - Fred | Geofencing | 14 | 5 | 3 | 3 | 0 | 0 | 0 | 2 | nein | mittel (48) |
| 48 | GEO - Jens | Geofencing | 14 | 5 | 3 | 3 | 0 | 0 | 0 | 2 | nein | mittel (48) |
| 49 | ### Gesundheit | Gesundheit | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 50 | GES - Fitnessziel Jens | Gesundheit | 30 | 7 | 0 | 0 | 2 | 1 | 1 | 5 | nein | niedrig (16) |
| 51 | GES - NINA | Gesundheit | 28 | 0 | 0 | 0 | 1 | 1 | 1 | 2 | nein | niedrig (4) |
| 52 | ### Heimgeräte | Heimgeräte | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 53 | H - Trockner | Heimgeräte | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | nein | niedrig (1) |
| 54 | H - Waschmaschine | Heimgeräte | 15 | 3 | 0 | 0 | 0 | 0 | 0 | 2 | nein | niedrig (10) |
| 55 | H - Wasserkocher | Heimgeräte | 45 | 8 | 6 | 3 | 1 | 1 | 1 | 2 | nein | mittel (63) |
| 56 | ### Kalender | Kalender | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 57 | KAL - Müll | Kalender | 18 | 2 | 0 | 0 | 4 | 0 | 0 | 2 | nein | niedrig (17) |
| 58 | ### Kamera | Kamera | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 59 | KAM - Eingang 33 | Kamera | 7 | 1 | 1 | 0 | 0 | 0 | 0 | 1 | nein | niedrig (12) |
| 60 | KAM - Eingang 33a | Kamera | 7 | 1 | 1 | 0 | 0 | 0 | 0 | 1 | nein | niedrig (12) |
| 61 | KAM - 33a Allgemein | Kamera | 7 | 2 | 2 | 2 | 0 | 0 | 0 | 1 | nein | niedrig (32) |
| 62 | KAM - 33a Talblick N | Kamera | 8 | 2 | 2 | 2 | 0 | 0 | 0 | 1 | nein | niedrig (32) |
| 63 | KAM - 33a Talblick S | Kamera | 8 | 2 | 2 | 2 | 0 | 0 | 0 | 1 | nein | niedrig (32) |
| 64 | KAM - 33a Teich | Kamera | 8 | 2 | 2 | 2 | 0 | 0 | 0 | 1 | nein | niedrig (32) |
| 65 | KAM - 33a Wasserfall | Kamera | 8 | 2 | 2 | 2 | 0 | 0 | 0 | 1 | nein | niedrig (32) |
| 66 | ### Klima | Klima | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 67 | KL - Comfee 16DEN7-WF | Klima | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | nein | niedrig (1) |
| 68 | KL - Dyson PH04 | Klima | 100 | 9 | 7 | 1 | 10 | 0 | 0 | 7 | nein | hoch (83) |
| 69 | KL - Midea PortaSplit | Klima | 14 | 6 | 4 | 2 | 0 | 0 | 0 | 2 | nein | mittel (47) |
| 70 | KL - Lüftungsempfehlung | Klima | 21 | 2 | 0 | 0 | 1 | 0 | 0 | 2 | nein | niedrig (11) |
| 71 | KL - Temperaturauswertung | Klima | 25 | 8 | 0 | 0 | 4 | 0 | 0 | 3 | nein | niedrig (24) |
| 72 | KL - Wohnzimmer | Klima | 8 | 3 | 3 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (26) |
| 73 | KL - Xiaomi SmartFan ZA5 | Klima | 19 | 8 | 6 | 1 | 0 | 0 | 0 | 3 | nein | mittel (53) |
| 74 | ### Licht | Licht | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 75 | LI - Abwesenheit | Licht | 21 | 1 | 1 | 0 | 9 | 1 | 2 | 0 | ja | niedrig (24) |
| 76 | LI - Lichtanforderung | Licht | 42 | 19 | 0 | 0 | 0 | 0 | 0 | 2 | nein | niedrig (26) |
| 77 | LI - Ankleidezimmer | Licht | 113 | 22 | 22 | 0 | 0 | 1 | 1 | 8 | nein | hoch (140) |
| 78 | LI - Badezimmer OG | Licht | 113 | 22 | 22 | 0 | 0 | 1 | 1 | 8 | nein | hoch (140) |
| 79 | LI - Esszimmer | Licht | 113 | 22 | 22 | 0 | 0 | 1 | 1 | 8 | nein | hoch (140) |
| 80 | LI - Familienzimmer | Licht | 114 | 23 | 23 | 0 | 0 | 1 | 1 | 8 | nein | hoch (146) |
| 81 | LI - Flur OG | Licht | 113 | 22 | 22 | 0 | 0 | 1 | 1 | 8 | nein | hoch (140) |
| 82 | LI - Küche | Licht | 113 | 22 | 22 | 0 | 0 | 1 | 1 | 8 | nein | hoch (140) |
| 83 | LI - Schlafzimmer | Licht | 230 | 47 | 39 | 0 | 7 | 1 | 1 | 10 | nein | hoch (474) |
| 84 | LI - Wohnzimmer | Licht | 113 | 22 | 22 | 0 | 0 | 1 | 1 | 8 | nein | hoch (140) |
| 85 | LI - 33 Außenbeleuchtung | Licht | 41 | 7 | 7 | 0 | 0 | 0 | 1 | 2 | nein | mittel (49) |
| 86 | LI - 33 Badezimmer EG | Licht | 113 | 22 | 22 | 0 | 0 | 1 | 1 | 8 | nein | hoch (140) |
| 87 | LI - 33 Flur EG | Licht | 113 | 22 | 22 | 0 | 0 | 1 | 1 | 8 | nein | hoch (140) |
| 88 | LI - 33 Garage | Licht | 113 | 22 | 22 | 0 | 0 | 1 | 1 | 8 | nein | hoch (140) |
| 89 | LI - 33 Hausflur | Licht | 133 | 30 | 26 | 0 | 0 | 1 | 1 | 10 | nein | hoch (190) |
| 90 | LI - 33 Hausflur Keller | Licht | 113 | 22 | 22 | 0 | 0 | 1 | 1 | 8 | nein | hoch (140) |
| 91 | LI - 33 Heizraum | Licht | 113 | 22 | 22 | 0 | 0 | 1 | 1 | 8 | nein | hoch (140) |
| 92 | LI - 33 Keller | Licht | 113 | 22 | 22 | 0 | 0 | 1 | 1 | 8 | nein | hoch (140) |
| 93 | LI - 33 Speicher | Licht | 113 | 22 | 22 | 0 | 0 | 1 | 1 | 8 | nein | hoch (140) |
| 94 | LI - 33a Technikraum | Licht | 118 | 24 | 22 | 0 | 0 | 1 | 1 | 8 | nein | hoch (142) |
| 95 | ### Medienkontrolle | Medienkontrolle | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 96 | M - Letzter Aufruf & Lautstärke | Medienkontrolle | 42 | 21 | 7 | 0 | 0 | 0 | 0 | 7 | nein | mittel (68) |
| 97 | M - 33 Lautstärke | Medienkontrolle | 24 | 9 | 7 | 0 | 1 | 0 | 0 | 2 | nein | mittel (53) |
| 98 | M - 33a Lautstärke | Medienkontrolle | 16 | 5 | 3 | 0 | 1 | 0 | 0 | 2 | nein | niedrig (29) |
| 99 | ### Netzwerk | Netzwerk | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 100 | NE - NAS | Netzwerk | 26 | 0 | 0 | 0 | 3 | 0 | 0 | 4 | nein | niedrig (10) |
| 101 | ### Relais | Relais | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 102 | RE - 33a Dunstabzugshaube | Relais | 9 | 2 | 2 | 2 | 0 | 1 | 1 | 2 | nein | niedrig (28) |
| 103 | ### Routine | Routine | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 104 | RO - Anwesenheitssimulation | Routine | 7 | 2 | 1 | 1 | 1 | 0 | 0 | 1 | nein | niedrig (22) |
| 105 | RO - Arbeitszeit | Routine | 76 | 17 | 11 | 11 | 0 | 0 | 0 | 2 | nein | hoch (156) |
| 106 | RO - Bettzeit | Routine | 5 | 3 | 2 | 2 | 0 | 0 | 0 | 1 | nein | niedrig (33) |
| 107 | RO - Ella Bettzeit | Routine | 10 | 6 | 2 | 2 | 0 | 0 | 0 | 1 | nein | mittel (36) |
| 108 | RO - Essenszeit | Routine | 4 | 2 | 1 | 1 | 0 | 0 | 0 | 1 | nein | niedrig (20) |
| 109 | RO - Es werde Licht | Routine | 4 | 2 | 1 | 1 | 0 | 0 | 0 | 1 | nein | niedrig (20) |
| 110 | RO - Gleich zu Hause | Routine | 7 | 3 | 2 | 2 | 0 | 0 | 0 | 1 | nein | niedrig (33) |
| 111 | RO - Heizung brummt | Routine | 11 | 3 | 2 | 2 | 1 | 0 | 0 | 1 | nein | mittel (35) |
| 112 | RO - Ich gehe | Routine | 10 | 3 | 1 | 1 | 0 | 0 | 0 | 2 | nein | niedrig (22) |
| 113 | RO - Kochzeit | Routine | 4 | 2 | 1 | 1 | 0 | 0 | 0 | 1 | nein | niedrig (20) |
| 114 | RO - Nachtlicht | Routine | 18 | 2 | 2 | 2 | 0 | 0 | 0 | 1 | nein | niedrig (32) |
| 115 | RO - Pipizeit | Routine | 20 | 4 | 3 | 3 | 0 | 0 | 0 | 1 | nein | mittel (46) |
| 116 | RO - Schlafenszeit | Routine | 352 | 45 | 25 | 25 | 22 | 0 | 0 | 16 | nein | hoch (410) |
| 117 | RO - Sportzeit | Routine | 4 | 2 | 1 | 1 | 0 | 0 | 0 | 1 | nein | niedrig (20) |
| 118 | RO - Stimmungslicht | Routine | 4 | 2 | 1 | 1 | 0 | 0 | 0 | 1 | nein | niedrig (20) |
| 119 | RO - Wohnlicht | Routine | 4 | 2 | 1 | 1 | 0 | 0 | 0 | 1 | nein | niedrig (20) |
| 120 | RO - 33a SOS | Routine | 58 | 19 | 16 | 16 | 0 | 0 | 0 | 6 | nein | hoch (222) |
| 121 | ### Sprachausgabe | Sprachausgabe | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 122 | SPA - Kameraausgabe | Sprachausgabe | 58 | 3 | 0 | 0 | 3 | 0 | 0 | 3 | nein | niedrig (17) |
| 123 | SPA - Milch | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 124 | SPA - Müllausgabe Altpapiersammlung | Sprachausgabe | 11 | 2 | 0 | 0 | 2 | 0 | 0 | 1 | nein | niedrig (12) |
| 125 | SPA - Müllausgabe Biotonne | Sprachausgabe | 11 | 2 | 0 | 0 | 2 | 0 | 0 | 1 | nein | niedrig (12) |
| 126 | SPA - Müllausgabe Gartenabfälle | Sprachausgabe | 11 | 2 | 0 | 0 | 2 | 0 | 0 | 1 | nein | niedrig (12) |
| 127 | SPA - Müllausgabe Gelbe Tonne | Sprachausgabe | 11 | 2 | 0 | 0 | 2 | 0 | 0 | 1 | nein | niedrig (12) |
| 128 | SPA - Müllausgabe Restmüll | Sprachausgabe | 11 | 2 | 0 | 0 | 2 | 0 | 0 | 1 | nein | niedrig (12) |
| 129 | SPA - Müllausgabe Sondermüll | Sprachausgabe | 11 | 2 | 0 | 0 | 2 | 0 | 0 | 1 | nein | niedrig (12) |
| 130 | SPA - Solarstatus | Sprachausgabe | 9 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 131 | SPA - Temperatur - Außen | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 132 | SPA - Temperatur - Haus | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 133 | SPA - Temperatur - OG | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 134 | SPA - Temperatur - EG | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 135 | SPA - Temperatur - UG | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 136 | SPA - Temperatur - Raum | Sprachausgabe | 16 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 137 | SPA - Temperatur - Ankleidezimmer | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 138 | SPA - Temperatur - Badezimmer EG | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 139 | SPA - Temperatur - Badezimmer OG | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 140 | SPA - Temperatur - Familienzimmer | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 141 | SPA - Temperatur - Flur EG | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 142 | SPA - Temperatur - Flur OG | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 143 | SPA - Temperatur - Galerie | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 144 | SPA - Temperatur - Garage | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 145 | SPA - Temperatur - Hausflur | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 146 | SPA - Temperatur - Heizraum | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 147 | SPA - Temperatur - Keller | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 148 | SPA - Temperatur - Küche | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 149 | SPA - Temperatur - Schlafzimmer | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 150 | SPA - Temperatur - Speicher | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 151 | SPA - Temperatur - Technikraum | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 152 | SPA - Temperatur - Wohnzimmer | Sprachausgabe | 8 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | nein | niedrig (9) |
| 153 | ### Sprachsteuerung | Sprachsteuerung | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 154 | SPS - Alexa, dunkler | Sprachsteuerung | 22 | 2 | 1 | 1 | 2 | 1 | 1 | 2 | nein | niedrig (20) |
| 155 | SPS - Alexa, heller | Sprachsteuerung | 22 | 2 | 1 | 1 | 2 | 1 | 1 | 2 | nein | niedrig (20) |
| 156 | ### Staubsauger | Staubsauger | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 157 | STA - Gary | Staubsauger | 85 | 7 | 5 | 0 | 3 | 1 | 1 | 3 | nein | mittel (46) |
| 158 | ### Steckdosen | Steckdosen | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 159 | STE - Heizstrahler | Steckdosen | 16 | 2 | 2 | 0 | 0 | 1 | 1 | 2 | nein | niedrig (14) |
| 160 | STE - Ladegerät Couch | Steckdosen | 21 | 1 | 1 | 0 | 0 | 1 | 1 | 2 | nein | niedrig (8) |
| 161 | STE - Laptop | Steckdosen | 18 | 1 | 1 | 0 | 0 | 1 | 1 | 2 | nein | niedrig (8) |
| 162 | STE - Warmwasserzirkulationspumpe | Steckdosen | 17 | 2 | 2 | 0 | 1 | 1 | 1 | 2 | nein | niedrig (16) |
| 163 | STE - Waschmaschine | Steckdosen | 9 | 1 | 1 | 0 | 0 | 1 | 1 | 2 | nein | niedrig (8) |
| 164 | STE - Wireless Chargingstation | Steckdosen | 10 | 1 | 1 | 0 | 0 | 1 | 1 | 2 | nein | niedrig (8) |
| 165 | ### Strom | Strom | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 166 | STR - Balkonkraftwerk | Strom | 24 | 5 | 0 | 0 | 4 | 1 | 1 | 5 | nein | niedrig (18) |
| 167 | STR - Energieberechnung | Strom | 135 | 22 | 0 | 0 | 11 | 1 | 1 | 12 | nein | mittel (56) |
| 168 | STR - Energieberechnung Listener | Strom | 19 | 2 | 0 | 0 | 2 | 1 | 1 | 2 | nein | niedrig (8) |
| 169 | ### System | System | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 170 | SY - Addon | System | 11 | 2 | 0 | 0 | 0 | 1 | 1 | 3 | nein | niedrig (5) |
| 171 | SY - DynDNS | System | 7 | 0 | 0 | 0 | 0 | 1 | 1 | 2 | nein | niedrig (2) |
| 172 | SY - Initialisierung | System | 23 | 7 | 0 | 0 | 0 | 1 | 1 | 3 | nein | niedrig (10) |
| 173 | SY - Neustart | System | 21 | 4 | 0 | 0 | 0 | 1 | 1 | 3 | nein | niedrig (7) |
| 174 | SY - Timer | System | 32 | 7 | 0 | 0 | 0 | 1 | 1 | 6 | nein | niedrig (13) |
| 175 | SY - Variablen | System | 62 | 18 | 0 | 0 | 2 | 1 | 1 | 9 | nein | niedrig (31) |
| 176 | ### ToDo | ToDo | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 177 | TO - Arbeit ToDo-Liste | ToDo | 24 | 7 | 0 | 0 | 2 | 1 | 1 | 3 | nein | niedrig (19) |
| 178 | TO - Einkaufsliste | ToDo | 15 | 6 | 0 | 0 | 1 | 1 | 1 | 2 | nein | niedrig (15) |
| 179 | TO - HA ToDo-Liste | ToDo | 15 | 6 | 0 | 0 | 1 | 1 | 1 | 2 | nein | niedrig (15) |
| 180 | TO - Shoppingliste | ToDo | 15 | 6 | 0 | 0 | 1 | 1 | 1 | 2 | nein | niedrig (15) |
| 181 | TO - ToDo-Liste | ToDo | 42 | 11 | 0 | 0 | 4 | 1 | 1 | 5 | nein | mittel (39) |
| 182 | TO - 33a Einkaufsliste | ToDo | 6 | 1 | 0 | 0 | 0 | 1 | 1 | 2 | nein | niedrig (3) |
| 183 | TO - 33a ToDo-Liste | ToDo | 6 | 1 | 0 | 0 | 0 | 1 | 1 | 2 | nein | niedrig (3) |
| 184 | ### Wassermeldeanlage | Wassermeldeanlage | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 185 | WA - Ausgelöst | Wassermeldeanlage | 26 | 4 | 4 | 4 | 1 | 0 | 0 | 3 | nein | mittel (62) |
| 186 | WA - 33 Heizraum | Wassermeldeanlage | 6 | 2 | 0 | 0 | 0 | 0 | 0 | 1 | nein | niedrig (8) |
| 187 | ### Wetter | Wetter | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 188 | WE - Erweiterter Wetterbericht | Wetter | 45 | 1 | 0 | 0 | 1 | 1 | 1 | 2 | nein | niedrig (10) |
| 189 | ### Zahnbürste | Zahnbürste | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | nein | niedrig (0) |
| 190 | ZA - Celine | Zahnbürste | 17 | 2 | 0 | 0 | 1 | 1 | 1 | 2 | nein | niedrig (6) |
| 191 | ZA - Jens | Zahnbürste | 17 | 2 | 0 | 0 | 1 | 1 | 1 | 2 | nein | niedrig (6) |
| 192 | GES - NINA neu | Zahnbürste | 10 | 0 | 0 | 0 | 3 | 1 | 1 | 0 | ja | niedrig (11) |

## Hochkomplexe Tabs

| Tab | Sektion | Nodes | Service | Aktor | CrossOwner | Funktionen | Risiko |
| --- | --- | --- | --- | --- | --- | --- | --- |
| LI - Schlafzimmer | Licht | 230 | 47 | 39 | 0 | 7 | hoch (474) |
| RO - Schlafenszeit | Routine | 352 | 45 | 25 | 25 | 22 | hoch (410) |
| RO - 33a SOS | Routine | 58 | 19 | 16 | 16 | 0 | hoch (222) |
| LI - 33 Hausflur | Licht | 133 | 30 | 26 | 0 | 0 | hoch (190) |
| RO - Arbeitszeit | Routine | 76 | 17 | 11 | 11 | 0 | hoch (156) |
| LI - Familienzimmer | Licht | 114 | 23 | 23 | 0 | 0 | hoch (146) |
| LI - 33a Technikraum | Licht | 118 | 24 | 22 | 0 | 0 | hoch (142) |
| LI - Ankleidezimmer | Licht | 113 | 22 | 22 | 0 | 0 | hoch (140) |
| LI - Badezimmer OG | Licht | 113 | 22 | 22 | 0 | 0 | hoch (140) |
| LI - Esszimmer | Licht | 113 | 22 | 22 | 0 | 0 | hoch (140) |
| LI - Flur OG | Licht | 113 | 22 | 22 | 0 | 0 | hoch (140) |
| LI - Küche | Licht | 113 | 22 | 22 | 0 | 0 | hoch (140) |
| LI - Wohnzimmer | Licht | 113 | 22 | 22 | 0 | 0 | hoch (140) |
| LI - 33 Badezimmer EG | Licht | 113 | 22 | 22 | 0 | 0 | hoch (140) |
| LI - 33 Flur EG | Licht | 113 | 22 | 22 | 0 | 0 | hoch (140) |
| LI - 33 Garage | Licht | 113 | 22 | 22 | 0 | 0 | hoch (140) |
| LI - 33 Hausflur Keller | Licht | 113 | 22 | 22 | 0 | 0 | hoch (140) |
| LI - 33 Heizraum | Licht | 113 | 22 | 22 | 0 | 0 | hoch (140) |
| LI - 33 Keller | Licht | 113 | 22 | 22 | 0 | 0 | hoch (140) |
| LI - 33 Speicher | Licht | 113 | 22 | 22 | 0 | 0 | hoch (140) |
| BR - 10 Ausgelöst | Brandmeldeanlage | 47 | 8 | 8 | 8 | 1 | hoch (114) |
| F - Volvo S90 | Fortbewegung | 154 | 13 | 5 | 3 | 16 | hoch (101) |
| BR - 33 Ausgelöst | Brandmeldeanlage | 36 | 6 | 6 | 6 | 1 | hoch (88) |
| BR - 33a Ausgelöst | Brandmeldeanlage | 30 | 6 | 6 | 6 | 1 | hoch (88) |
| F - Volvo XC90 | Fortbewegung | 158 | 12 | 4 | 2 | 15 | hoch (86) |
| KL - Dyson PH04 | Klima | 100 | 9 | 7 | 1 | 10 | hoch (83) |
| M - Letzter Aufruf & Lautstärke | Medienkontrolle | 42 | 21 | 7 | 0 | 0 | mittel (68) |
| AL - 33 Anwesenheitserkennung | Alarmanlage | 99 | 37 | 0 | 0 | 0 | mittel (58) |
| STR - Energieberechnung | Strom | 135 | 22 | 0 | 0 | 11 | mittel (56) |
| STA - Gary | Staubsauger | 85 | 7 | 5 | 0 | 3 | mittel (46) |
| AL - 33 Trigger Old | Alarmanlage | 147 | 18 | 0 | 0 | 0 | mittel (40) |

## Top Service Actions

| Action | Anzahl |
| --- | --- |
| light.turn_on | 410 |
| input_boolean.turn_off | 127 |
| input_boolean.turn_on | 91 |
| input_select.select_option | 76 |
| input_number.set_value | 53 |
| light.turn_off | 45 |
| switch.turn_off | 42 |
| switch.turn_on | 39 |
| media_player.play_media | 22 |
| todo.add_item | 16 |
| media_player.volume_set | 14 |
| scene.turn_on | 13 |
| input_text.set_value | 12 |
| todo.get_items | 9 |
| calendar.get_events | 8 |
| todo.remove_completed_items | 7 |
| button.press | 6 |
| todo.remove_item | 5 |
| climate.set_temperature | 4 |
| fan.turn_off | 4 |
| fan.turn_on | 4 |
| light.toggle | 4 |
| select.select_option | 4 |
| siren.turn_off | 4 |
| siren.turn_on | 4 |

## Service-Domaenen

| Domaene | Anzahl |
| --- | --- |
| light | 459 |
| input_boolean | 218 |
| switch | 81 |
| input_select | 78 |
| input_number | 53 |
| todo | 37 |
| media_player | 36 |
| notify | 13 |
| scene | 13 |
| input_text | 12 |
| fan | 11 |
| climate | 9 |
| calendar | 8 |
| siren | 8 |
| button | 6 |
| select | 4 |
| vacuum | 4 |
| hassio | 3 |
| homeassistant | 2 |
| humidifier | 2 |
| (unknown) | 1 |
| number | 1 |
| roborock | 1 |

## Entity-Domaenen

| Entity-Domaene | Vorkommen |
| --- | --- |
| input_boolean | 347 |
| input_number | 188 |
| sensor | 98 |
| binary_sensor | 66 |
| input_select | 37 |
| light | 35 |
| switch | 27 |
| media_player | 10 |
| schedule | 10 |
| device_tracker | 4 |
| climate | 2 |
| input_datetime | 2 |
| input_text | 2 |
| select | 2 |
| weather | 2 |
| fan | 1 |
| lock | 1 |

## Top Entities

| Entity | Vorkommen |
| --- | --- |
| input_boolean.sprachausgabe_temperatur | 22 |
| input_boolean.strom_energieberechnung | 11 |
| input_number.strom_energieberechnung_wartezeit | 11 |
| input_boolean.allgemein_sonnenstrahlen | 10 |
| input_boolean.routine_schlafenszeit | 8 |
| input_boolean.benachrichtigung_luftqualitat_celine | 5 |
| input_boolean.benachrichtigung_luftqualitat_jens | 5 |
| input_boolean.kamera_33a_scheinwerferverknupfung | 5 |
| input_boolean.routine_arbeitszeit | 5 |
| input_boolean.sprachausgabe_luftqualitat | 5 |
| input_select.medienkontrolle_letzter_aufruf | 5 |
| switch.steckdose_aquarium_beleuchtung | 5 |
| input_boolean.alarmanlage_33a_silentmode | 4 |
| input_boolean.alarmanlage_silentmode | 4 |
| input_boolean.kamera_33a_personenerkennung | 4 |
| light.wandbeleuchtung_schlafzimmer | 4 |
| sensor.luftung_durchschnittstemperatur | 4 |
| sensor.volvo_s90_batterie | 4 |
| switch.steckdose_aquarium_heizstab | 4 |
| switch.steckdose_aquarium_stromungspumpe | 4 |
| switch.steckdose_wireless_chargingstation | 4 |
| binary_sensor.volvo_s90_motorstatus | 3 |
| input_boolean.benachrichtigung_netzwerkspeicher_warnschwelle | 3 |
| input_boolean.licht_automatisierung | 3 |
| input_boolean.licht_automatisierung_statusverfolgung | 3 |

## Subflows

| Subflow | Interne Nodes | Instanzen | Instanz-Tabs |
| --- | --- | --- | --- |
| Alarmanlage(1)/Türerfassung(1) | 2 | 6 | AL - 33 Trigger Old |
| Alarmanlage(1)/Bewegungserfassung(1) | 2 | 15 | AL - 33 Trigger Old |
| Zufallsverzögerung(min) | 3 | 4 | AQ - Strömung, KAM - Eingang 33, KAM - Eingang 33a |
| Verzögerung(min) | 2 | 22 | F - Volvo S90, KL - Dyson PH04, KL - Midea PortaSplit, KL - Xiaomi SmartFan ZA5, RO - Arbeitszeit, RO - Gleich zu Hause, RO - Ich gehe, RO - Pipizeit, RO - Schlafenszeit, STE - Ladegerät Couch, STE - Laptop |
| Anwesend(1)/Schlafenszeit(0) | 2 | 0 |  |
| Verzögerung(s) | 2 | 16 | LI - 33 Außenbeleuchtung, RO - Heizung brummt, STR - Energieberechnung, STR - Energieberechnung Listener, SY - Initialisierung |
| Benachrichtigung | 13 | 91 | AL - 33 Ausgelöst, AL - 33 Trigger, AL - 33 Trigger Old, AL - 33a Ausgelöst, AL - 33a Trigger, AQ - Pumpe, AQ - Strömung, BR - 10 Ausgelöst, BR - 33 Ausgelöst, BR - 33a Ausgelöst, BR - Dimmer Temperaturcheck, BR - Energiemessung Temperaturcheck, BR - Relais Temperaturcheck, BR - Steckdose Temperaturgrenze, BR - Test, DA - Server, E - Ladeautomatik S8, E - Ladeautomatik Tablet, F - Volvo S90, F - Volvo XC90, GES - Fitnessziel Jens, GES - NINA, GES - NINA neu, H - Trockner, H - Waschmaschine, H - Wasserkocher, KAL - Müll, KL - Comfee 16DEN7-WF, KL - Dyson PH04, KL - Lüftungsempfehlung, NE - NAS, RO - 33a SOS, STA - Gary, STE - Waschmaschine, SY - Initialisierung, SY - Timer, SY - Variablen, TO - Arbeit ToDo-Liste, TO - ToDo-Liste, WA - Ausgelöst, ZA - Celine, ZA - Jens |
| Alexa Benachrichtigung (message, type, method, target) | 17 | 63 | AL - 33 Ausgelöst, AL - 33a Ausgelöst, BR - 10 Ausgelöst, BR - 33 Ausgelöst, BR - 33a Ausgelöst, F - Volvo S90, F - Volvo XC90, H - Trockner, H - Wasserkocher, KL - Dyson PH04, M - 33 Lautstärke, M - 33a Lautstärke, RO - 33a SOS, RO - Schlafenszeit, SPA - Kameraausgabe, SPA - Milch, SPA - Müllausgabe Altpapiersammlung, SPA - Müllausgabe Biotonne, SPA - Müllausgabe Gartenabfälle, SPA - Müllausgabe Gelbe Tonne, SPA - Müllausgabe Restmüll, SPA - Müllausgabe Sondermüll, SPA - Solarstatus, SPA - Temperatur - Ankleidezimmer, SPA - Temperatur - Außen, SPA - Temperatur - Badezimmer EG, SPA - Temperatur - Badezimmer OG, SPA - Temperatur - EG, SPA - Temperatur - Familienzimmer, SPA - Temperatur - Flur EG, SPA - Temperatur - Flur OG, SPA - Temperatur - Galerie, SPA - Temperatur - Garage, SPA - Temperatur - Haus, SPA - Temperatur - Hausflur, SPA - Temperatur - Heizraum, SPA - Temperatur - Keller, SPA - Temperatur - Küche, SPA - Temperatur - OG, SPA - Temperatur - Raum, SPA - Temperatur - Schlafzimmer, SPA - Temperatur - Speicher, SPA - Temperatur - Technikraum, SPA - Temperatur - UG, SPA - Temperatur - Wohnzimmer, SPS - Alexa, dunkler, SPS - Alexa, heller, SY - Neustart, TO - ToDo-Liste, WA - Ausgelöst, WE - Erweiterter Wetterbericht |
| 33a_Alarmanlage(1)/Bewegungserfassung(1) | 2 | 3 | AL - 33a Trigger |
| 33a_Alarmanlage(1)/Türerfassung(1) | 2 | 4 | AL - 33a Trigger |
| Licht - Automatisierung - Template | 291 | 17 | LI - 33 Badezimmer EG, LI - 33 Flur EG, LI - 33 Garage, LI - 33 Hausflur, LI - 33 Hausflur Keller, LI - 33 Heizraum, LI - 33 Keller, LI - 33 Speicher, LI - 33a Technikraum, LI - Ankleidezimmer, LI - Badezimmer OG, LI - Esszimmer, LI - Familienzimmer, LI - Flur OG, LI - Küche, LI - Schlafzimmer, LI - Wohnzimmer |

## Mehrfach genutzte konkrete Aktor-Targets (erste 80)

| Entity | Calls | Sektionen | Tabs | Actions |
| --- | --- | --- | --- | --- |
| light.licht_gruppe_innenbeleuchtung | 17 | Brandmeldeanlage, Licht, Routine, Wassermeldeanlage | BR - 10 Ausgelöst, BR - 33 Ausgelöst, BR - 33a Ausgelöst, LI - 33 Hausflur, LI - Abwesenheit, RO - 33a SOS, RO - Anwesenheitssimulation, RO - Arbeitszeit, RO - Es werde Licht, RO - Ich gehe, RO - Schlafenszeit, WA - Ausgelöst | light.turn_off, light.turn_on |
| media_player.jens_echo_dot_gen5 | 15 | Geofencing, Medienkontrolle, Routine | GEO - Andrea, GEO - Celine, GEO - Fred, GEO - Jens, M - 33 Lautstärke, M - Letzter Aufruf & Lautstärke, RO - Schlafenszeit | media_player.play_media, media_player.volume_set |
| media_player.jens_3_echo | 15 | Geofencing, Medienkontrolle, Routine | GEO - Andrea, GEO - Celine, GEO - Fred, GEO - Jens, M - 33 Lautstärke, M - Letzter Aufruf & Lautstärke, RO - Schlafenszeit | media_player.play_media, media_player.volume_set |
| media_player.echo_esszimmer | 15 | Geofencing, Medienkontrolle, Routine | GEO - Andrea, GEO - Celine, GEO - Fred, GEO - Jens, M - 33 Lautstärke, M - Letzter Aufruf & Lautstärke, RO - Schlafenszeit | media_player.play_media, media_player.volume_set |
| media_player.jens_echo_dot_gen2 | 15 | Geofencing, Medienkontrolle, Routine | GEO - Andrea, GEO - Celine, GEO - Fred, GEO - Jens, M - 33 Lautstärke, M - Letzter Aufruf & Lautstärke, RO - Schlafenszeit | media_player.play_media, media_player.volume_set |
| media_player.jens_echo | 15 | Geofencing, Medienkontrolle, Routine | GEO - Andrea, GEO - Celine, GEO - Fred, GEO - Jens, M - 33 Lautstärke, M - Letzter Aufruf & Lautstärke, RO - Schlafenszeit | media_player.play_media, media_player.volume_set |
| light.licht_gruppe_33a_innenbeleuchtung | 7 | Brandmeldeanlage, Routine, Wassermeldeanlage | BR - 10 Ausgelöst, BR - 33 Ausgelöst, BR - 33a Ausgelöst, RO - 33a SOS, WA - Ausgelöst | light.turn_on |
| switch.steckdose_wireless_chargingstation | 5 | Endgerät, Routine, Steckdosen | E - Ladeautomatik S8, E - Ladeautomatik Watch4, RO - Schlafenszeit, STE - Wireless Chargingstation | switch.turn_off, switch.turn_on |
| light.eingang_33a_scheinwerfer | 12 | Licht, Routine | LI - 33 Außenbeleuchtung, RO - Arbeitszeit, RO - Pipizeit | light.turn_off, light.turn_on |
| light.strahler_stellplatz | 11 | Licht, Routine | LI - 33 Außenbeleuchtung, RO - Arbeitszeit, RO - Pipizeit | light.turn_off, light.turn_on |
| light.strahler_balkon_eg | 11 | Licht, Routine | LI - 33 Außenbeleuchtung, RO - Arbeitszeit, RO - Pipizeit | light.turn_off, light.turn_on |
| siren.eingang_33_sirene | 6 | Alarmanlage, Routine | AL - 33 Ausgelöst, AL - 33a Ausgelöst, RO - 33a SOS | siren.turn_off, siren.turn_on |
| siren.eingang_33a_sirene | 6 | Alarmanlage, Routine | AL - 33 Ausgelöst, AL - 33a Ausgelöst, RO - 33a SOS | siren.turn_off, siren.turn_on |
| switch.rauchmelder_33_esszimmer_manual_burglar_alarm | 6 | Alarmanlage, Wassermeldeanlage | AL - 33 Ausgelöst, AL - 33a Ausgelöst, WA - Ausgelöst | switch.turn_off, switch.turn_on |
| switch.rauchmelder_33_familienzimmer_manual_burglar_alarm | 6 | Alarmanlage, Wassermeldeanlage | AL - 33 Ausgelöst, AL - 33a Ausgelöst, WA - Ausgelöst | switch.turn_off, switch.turn_on |
| switch.rauchmelder_33_flur_eg_manual_burglar_alarm | 6 | Alarmanlage, Wassermeldeanlage | AL - 33 Ausgelöst, AL - 33a Ausgelöst, WA - Ausgelöst | switch.turn_off, switch.turn_on |
| switch.rauchmelder_33_flur_og_manual_burglar_alarm | 6 | Alarmanlage, Wassermeldeanlage | AL - 33 Ausgelöst, AL - 33a Ausgelöst, WA - Ausgelöst | switch.turn_off, switch.turn_on |
| switch.rauchmelder_33_hausflur_eg_manual_burglar_alarm | 6 | Alarmanlage, Wassermeldeanlage | AL - 33 Ausgelöst, AL - 33a Ausgelöst, WA - Ausgelöst | switch.turn_off, switch.turn_on |
| switch.rauchmelder_33_hausflur_og_manual_burglar_alarm | 6 | Alarmanlage, Wassermeldeanlage | AL - 33 Ausgelöst, AL - 33a Ausgelöst, WA - Ausgelöst | switch.turn_off, switch.turn_on |
| switch.rauchmelder_33_keller_manual_burglar_alarm | 6 | Alarmanlage, Wassermeldeanlage | AL - 33 Ausgelöst, AL - 33a Ausgelöst, WA - Ausgelöst | switch.turn_off, switch.turn_on |
| switch.rauchmelder_33_schlafzimmer_manual_burglar_alarm | 6 | Alarmanlage, Wassermeldeanlage | AL - 33 Ausgelöst, AL - 33a Ausgelöst, WA - Ausgelöst | switch.turn_off, switch.turn_on |
| switch.rauchmelder_33_technikraum_manual_burglar_alarm | 6 | Alarmanlage, Wassermeldeanlage | AL - 33 Ausgelöst, AL - 33a Ausgelöst, WA - Ausgelöst | switch.turn_off, switch.turn_on |
| switch.rauchmelder_33_wohnzimmer_manual_burglar_alarm | 6 | Alarmanlage, Wassermeldeanlage | AL - 33 Ausgelöst, AL - 33a Ausgelöst, WA - Ausgelöst | switch.turn_off, switch.turn_on |
| switch.rauchmelder_33a_atelier_manual_burglar_alarm | 6 | Alarmanlage, Wassermeldeanlage | AL - 33 Ausgelöst, AL - 33a Ausgelöst, WA - Ausgelöst | switch.turn_off, switch.turn_on |
| switch.rauchmelder_33a_kinderzimmer_manual_burglar_alarm | 6 | Alarmanlage, Wassermeldeanlage | AL - 33 Ausgelöst, AL - 33a Ausgelöst, WA - Ausgelöst | switch.turn_off, switch.turn_on |
| switch.rauchmelder_33a_schlafzimmer_manual_burglar_alarm | 6 | Alarmanlage, Wassermeldeanlage | AL - 33 Ausgelöst, AL - 33a Ausgelöst, WA - Ausgelöst | switch.turn_off, switch.turn_on |
| switch.rauchmelder_33a_wohnzimmer_manual_burglar_alarm | 6 | Alarmanlage, Wassermeldeanlage | AL - 33 Ausgelöst, AL - 33a Ausgelöst, WA - Ausgelöst | switch.turn_off, switch.turn_on |
| switch.steckdose_aquarium_stromungspumpe | 6 | Aquarium, Routine | AQ - Strömung, AQ - Wartungsmodus, RO - Schlafenszeit | switch.turn_off, switch.turn_on |
| switch.brandmeldeanlage_33a_einbruchalarm | 6 | Brandmeldeanlage, Routine | BR - 10 Ausgelöst, BR - 33 Ausgelöst, RO - 33a SOS | switch.turn_off, switch.turn_on |
| light.licht_gruppe_aussenbeleuchtung | 5 | Licht, Routine | LI - 33 Außenbeleuchtung, RO - 33a SOS, RO - Gleich zu Hause | light.turn_off, light.turn_on |
| switch.steckdose_aquarium_wasserpumpe | 4 | Aquarium, Routine | AQ - Pumpe, AQ - Wartungsmodus, RO - Schlafenszeit | switch.turn_off, switch.turn_on |
| media_player.echo_hausflur | 3 | Medienkontrolle, Routine | M - 33 Lautstärke, M - Letzter Aufruf & Lautstärke, RO - Schlafenszeit | media_player.play_media, media_player.volume_set |
| light.wandbeleuchtung_schlafzimmer | 12 | Licht, Routine | LI - Schlafzimmer, RO - Ella Bettzeit | light.turn_off, light.turn_on |
| light.rgb_led_lichterkette | 8 | Licht, Routine | LI - 33 Außenbeleuchtung, RO - Arbeitszeit | light.turn_off, light.turn_on |
| fan.dyson_ph04 | 6 | Klima, Routine | KL - Dyson PH04, RO - Schlafenszeit | fan.oscillate, fan.set_preset_mode, fan.turn_off, fan.turn_on |
| climate.heizkorperthermostat_wohnzimmer_1 | 5 | Klima, Routine | KL - Wohnzimmer, RO - Heizung brummt | climate.set_temperature, climate.turn_off, climate.turn_on |
| fan.xiaomi_smartfan_zh5 | 5 | Klima, Routine | KL - Xiaomi SmartFan ZA5, RO - Schlafenszeit | fan.oscillate, fan.turn_off, fan.turn_on |
| climate.midea_portasplit | 4 | Klima, Routine | KL - Midea PortaSplit, RO - Schlafenszeit | climate.set_temperature, climate.turn_off, climate.turn_on |
| switch.steckdose_celine | 2 | Endgerät, Routine | E - Ladeautomatik Celine, RO - Schlafenszeit | switch.turn_off, switch.turn_on |
| switch.steckdose_wireless_charger | 2 | Endgerät, Routine | E - Ladeautomatik Jens, RO - Schlafenszeit | switch.turn_off, switch.turn_on |
| switch.steckdose_watch_chargingpad | 2 | Endgerät, Routine | E - Ladeautomatik Watch6, RO - Schlafenszeit | switch.turn_off, switch.turn_on |
| switch.dyson_ph04_night_mode | 2 | Klima, Routine | KL - Dyson PH04, RO - Schlafenszeit | switch.turn_off, switch.turn_on |
| media_player.esszimmer | 2 | Medienkontrolle, Routine | M - Letzter Aufruf & Lautstärke, RO - Schlafenszeit | media_player.volume_set |
| switch.steckdose_aquarium_heizstab | 6 | Aquarium | AQ - Heizung, AQ - Wartungsmodus | switch.turn_off, switch.turn_on |
| light.eingang_33_scheinwerfer | 6 | Routine | RO - Arbeitszeit, RO - Pipizeit | light.turn_off, light.turn_on |
| siren.33a_teich_sirene | 4 | Alarmanlage | AL - 33 Ausgelöst, AL - 33a Ausgelöst | siren.turn_off, siren.turn_on |
| siren.33a_talblick_s_sirene | 4 | Alarmanlage | AL - 33 Ausgelöst, AL - 33a Ausgelöst | siren.turn_off, siren.turn_on |
| siren.33a_talblick_n_sirene | 4 | Alarmanlage | AL - 33 Ausgelöst, AL - 33a Ausgelöst | siren.turn_off, siren.turn_on |
| siren.33a_wasserfall_sirene | 4 | Alarmanlage | AL - 33 Ausgelöst, AL - 33a Ausgelöst | siren.turn_off, siren.turn_on |
| switch.brandmeldeanlage_33_einbruchalarm | 4 | Brandmeldeanlage | BR - 10 Ausgelöst, BR - 33a Ausgelöst | switch.turn_off, switch.turn_on |
| switch.steckdose_aquarium_beleuchtung | 3 | Aquarium | AQ - Licht, AQ - Wartungsmodus | switch.turn_off, switch.turn_on |
| scene.alarm | 2 | Alarmanlage | AL - 33 Ausgelöst, AL - 33a Ausgelöst | scene.turn_on |
| light.6c909710_a9130d27_screen | 2 | Endgerät | E - Ladeautomatik S8, E - Ladeautomatik Tablet | light.turn_off |
| switch.steckdose_babycam | 2 | Routine | RO - Ella Bettzeit, RO - Schlafenszeit | switch.turn_off, switch.turn_on |
| light.deckenleuchte_schlafzimmer | 5 | Licht | LI - Schlafzimmer | light.turn_off, light.turn_on |
| vacuum.gary | 5 | Staubsauger | STA - Gary | roborock.vacuum_clean_segment, vacuum.return_to_base, vacuum.send_command, vacuum.start |
| light.babybauchabdruck | 4 | Licht | LI - Schlafzimmer | light.turn_off, light.turn_on |
| switch.ausensteckdose_stellplatz_kellertor_switch_0 | 3 | Fortbewegung | F - Volvo S90 | switch.turn_off, switch.turn_on |
| switch.wasserkocher_start | 3 | Heimgeräte | H - Wasserkocher | switch.turn_off, switch.turn_on |
| select.wasserkocher_soll_temperatur_c | 3 | Heimgeräte | H - Wasserkocher | select.select_option |

## Prefix/Sektion-Abweichungen

| Tab | Prefix | Sektion | Erwartete Sektion |
| --- | --- | --- | --- |
| GES - NINA neu | GES | Zahnbürste | Gesundheit |

## Auffaellige Cross-Owner Calls (erste 120)

| Tab | Sektion | Action | Node | Targets | Erwarteter Owner |
| --- | --- | --- | --- | --- | --- |
| AL - 33 Ausgelöst | Alarmanlage | scene.turn_on | Szene Routine - Alarm aktivieren | scene.alarm | LI |
| AL - 33 Ausgelöst | Alarmanlage | switch.turn_off | Alle Rauchmelder - Alarm burglar ausschalten | switch.rauchmelder_33_esszimmer_manual_burglar_alarm, switch.rauchmelder_33_familienzimmer_manual_burglar_alarm, switch.rauchmelder_33_flur_eg_manual_burglar_alarm, switch.rauchmelder_33_flur_og_manual_burglar_alarm, switch.rauchmelder_33_hausflur_eg_manual_burglar_alarm, switch.rauchmelder_33_hausflur_og_manual_burglar_alarm, switch.rauchmelder_33_keller_manual_burglar_alarm, switch.rauchmelder_33_schlafzimmer_manual_burglar_alarm, switch.rauchmelder_33_technikraum_manual_burglar_alarm, switch.rauchmelder_33_wohnzimmer_manual_burglar_alarm, switch.rauchmelder_33a_atelier_manual_burglar_alarm, switch.rauchmelder_33a_kinderzimmer_manual_burglar_alarm, switch.rauchmelder_33a_schlafzimmer_manual_burglar_alarm, switch.rauchmelder_33a_wohnzimmer_manual_burglar_alarm | STE |
| AL - 33 Ausgelöst | Alarmanlage | switch.turn_on | Alle Rauchmelder - Alarm burglar einschalten | switch.rauchmelder_33_esszimmer_manual_burglar_alarm, switch.rauchmelder_33_familienzimmer_manual_burglar_alarm, switch.rauchmelder_33_flur_eg_manual_burglar_alarm, switch.rauchmelder_33_flur_og_manual_burglar_alarm, switch.rauchmelder_33_hausflur_eg_manual_burglar_alarm, switch.rauchmelder_33_hausflur_og_manual_burglar_alarm, switch.rauchmelder_33_keller_manual_burglar_alarm, switch.rauchmelder_33_schlafzimmer_manual_burglar_alarm, switch.rauchmelder_33_technikraum_manual_burglar_alarm, switch.rauchmelder_33_wohnzimmer_manual_burglar_alarm, switch.rauchmelder_33a_atelier_manual_burglar_alarm, switch.rauchmelder_33a_kinderzimmer_manual_burglar_alarm, switch.rauchmelder_33a_schlafzimmer_manual_burglar_alarm, switch.rauchmelder_33a_wohnzimmer_manual_burglar_alarm | STE |
| AL - 33a Ausgelöst | Alarmanlage | scene.turn_on | Szene Routine - Alarm aktivieren | scene.alarm | LI |
| AL - 33a Ausgelöst | Alarmanlage | switch.turn_off | Alle Rauchmelder - Alarm burglar ausschalten | switch.rauchmelder_33_esszimmer_manual_burglar_alarm, switch.rauchmelder_33_familienzimmer_manual_burglar_alarm, switch.rauchmelder_33_flur_eg_manual_burglar_alarm, switch.rauchmelder_33_flur_og_manual_burglar_alarm, switch.rauchmelder_33_hausflur_eg_manual_burglar_alarm, switch.rauchmelder_33_hausflur_og_manual_burglar_alarm, switch.rauchmelder_33_keller_manual_burglar_alarm, switch.rauchmelder_33_schlafzimmer_manual_burglar_alarm, switch.rauchmelder_33_technikraum_manual_burglar_alarm, switch.rauchmelder_33_wohnzimmer_manual_burglar_alarm, switch.rauchmelder_33a_atelier_manual_burglar_alarm, switch.rauchmelder_33a_kinderzimmer_manual_burglar_alarm, switch.rauchmelder_33a_schlafzimmer_manual_burglar_alarm, switch.rauchmelder_33a_wohnzimmer_manual_burglar_alarm | STE |
| AL - 33a Ausgelöst | Alarmanlage | switch.turn_on | Alle Rauchmelder - Alarm burglar einschalten | switch.rauchmelder_33_esszimmer_manual_burglar_alarm, switch.rauchmelder_33_familienzimmer_manual_burglar_alarm, switch.rauchmelder_33_flur_eg_manual_burglar_alarm, switch.rauchmelder_33_flur_og_manual_burglar_alarm, switch.rauchmelder_33_hausflur_eg_manual_burglar_alarm, switch.rauchmelder_33_hausflur_og_manual_burglar_alarm, switch.rauchmelder_33_keller_manual_burglar_alarm, switch.rauchmelder_33_schlafzimmer_manual_burglar_alarm, switch.rauchmelder_33_technikraum_manual_burglar_alarm, switch.rauchmelder_33_wohnzimmer_manual_burglar_alarm, switch.rauchmelder_33a_atelier_manual_burglar_alarm, switch.rauchmelder_33a_kinderzimmer_manual_burglar_alarm, switch.rauchmelder_33a_schlafzimmer_manual_burglar_alarm, switch.rauchmelder_33a_wohnzimmer_manual_burglar_alarm | STE |
| AQ - Heizung | Aquarium | switch.turn_off | Steckdose Aquarium Heizstab ausschalten | switch.steckdose_aquarium_heizstab | STE |
| AQ - Heizung | Aquarium | switch.turn_off | Steckdose Aquarium Heizstab ausschalten | switch.steckdose_aquarium_heizstab | STE |
| AQ - Heizung | Aquarium | switch.turn_off | Steckdose Aquarium Heizstab ausschalten | switch.steckdose_aquarium_heizstab | STE |
| AQ - Heizung | Aquarium | switch.turn_on | Steckdose Aquarium Heizstab einschalten | switch.steckdose_aquarium_heizstab | STE |
| AQ - Heizung | Aquarium | switch.turn_on | Steckdose Aquarium Heizstab einschalten | switch.steckdose_aquarium_heizstab | STE |
| AQ - Licht | Aquarium | switch.turn_off | Steckdose Aquarium Beleuchtung ausschalten | switch.steckdose_aquarium_beleuchtung | STE |
| AQ - Licht | Aquarium | switch.turn_on | Steckdose Aquarium Beleuchtung einschalten | switch.steckdose_aquarium_beleuchtung | STE |
| AQ - Pumpe | Aquarium | switch.turn_on | Steckdose Aquarium Wasserpumpe einschalten | switch.steckdose_aquarium_wasserpumpe | STE |
| AQ - Strömung | Aquarium | switch.turn_off | Steckdose Aquarium Strömungspumpe ausschalten | switch.steckdose_aquarium_stromungspumpe | STE |
| AQ - Strömung | Aquarium | switch.turn_off | Steckdose Aquarium Strömungspumpe ausschalten | switch.steckdose_aquarium_stromungspumpe | STE |
| AQ - Strömung | Aquarium | switch.turn_off | Steckdose Aquarium Strömungspumpe ausschalten | switch.steckdose_aquarium_stromungspumpe | STE |
| AQ - Strömung | Aquarium | switch.turn_on | Steckdose Aquarium Strömungspumpe einschalten | switch.steckdose_aquarium_stromungspumpe | STE |
| AQ - Wartungsmodus | Aquarium | switch.turn_off | Steckdose Aquarium Heizstab ausschalten | switch.steckdose_aquarium_heizstab | STE |
| AQ - Wartungsmodus | Aquarium | switch.turn_off | Steckdose Aquarium Strömungspumpe ausschalten | switch.steckdose_aquarium_stromungspumpe | STE |
| AQ - Wartungsmodus | Aquarium | switch.turn_off | Steckdose Aquarium Wasserpumpe ausschalten | switch.steckdose_aquarium_wasserpumpe | STE |
| AQ - Wartungsmodus | Aquarium | switch.turn_on | Steckdose Aquarium Beleuchtung einschalten | switch.steckdose_aquarium_beleuchtung | STE |
| AQ - Wartungsmodus | Aquarium | switch.turn_on | Steckdose Aquarium Wasserpumpe einschalten | switch.steckdose_aquarium_wasserpumpe | STE |
| BR - 10 Ausgelöst | Brandmeldeanlage | light.turn_on | Licht-Gruppe - Innenbeleuchtung einschalten | light.licht_gruppe_innenbeleuchtung | LI |
| BR - 10 Ausgelöst | Brandmeldeanlage | light.turn_on | Licht-Gruppe - 33a Innenbeleuchtung einschalten | light.licht_gruppe_33a_innenbeleuchtung | LI |
| BR - 10 Ausgelöst | Brandmeldeanlage | switch.turn_off | Brandmeldeanlage - 10 - Feueralarm ausschalten | switch.brandmeldeanlage_10_feueralarm | STE |
| BR - 10 Ausgelöst | Brandmeldeanlage | switch.turn_off | Brandmeldeanlage - 33 - Einbruchalarm ausschalten | switch.brandmeldeanlage_33_einbruchalarm | STE |
| BR - 10 Ausgelöst | Brandmeldeanlage | switch.turn_off | Brandmeldeanlage - 33a - Einbruchalarm ausschalten | switch.brandmeldeanlage_33a_einbruchalarm | STE |
| BR - 10 Ausgelöst | Brandmeldeanlage | switch.turn_on | Brandmeldeanlage - 10 - Feueralarm einschalten | switch.brandmeldeanlage_10_feueralarm | STE |
| BR - 10 Ausgelöst | Brandmeldeanlage | switch.turn_on | Brandmeldeanlage - 33 - Einbruchalarm einschalten | switch.brandmeldeanlage_33_einbruchalarm | STE |
| BR - 10 Ausgelöst | Brandmeldeanlage | switch.turn_on | Brandmeldeanlage - 33a - Einbruchalarm einschalten | switch.brandmeldeanlage_33a_einbruchalarm | STE |
| BR - 33 Ausgelöst | Brandmeldeanlage | light.turn_on | Licht-Gruppe - Innenbeleuchtung einschalten | light.licht_gruppe_innenbeleuchtung | LI |
| BR - 33 Ausgelöst | Brandmeldeanlage | light.turn_on | Licht-Gruppe - 33a Innenbeleuchtung einschalten | light.licht_gruppe_33a_innenbeleuchtung | LI |
| BR - 33 Ausgelöst | Brandmeldeanlage | switch.turn_off | Brandmeldeanlage - 33 - Feueralarm ausschalten | switch.brandmeldeanlage_33_feueralarm | STE |
| BR - 33 Ausgelöst | Brandmeldeanlage | switch.turn_off | Brandmeldeanlage - 33a - Einbruchalarm ausschalten | switch.brandmeldeanlage_33a_einbruchalarm | STE |
| BR - 33 Ausgelöst | Brandmeldeanlage | switch.turn_on | Brandmeldeanlage - 33 - Feueralarm einschalten | switch.brandmeldeanlage_33_feueralarm | STE |
| BR - 33 Ausgelöst | Brandmeldeanlage | switch.turn_on | Brandmeldeanlage - 33a - Einbruchalarm einschalten | switch.brandmeldeanlage_33a_einbruchalarm | STE |
| BR - 33a Ausgelöst | Brandmeldeanlage | light.turn_on | Licht-Gruppe - Innenbeleuchtung einschalten | light.licht_gruppe_innenbeleuchtung | LI |
| BR - 33a Ausgelöst | Brandmeldeanlage | light.turn_on | Licht-Gruppe - 33a Innenbeleuchtung einschalten | light.licht_gruppe_33a_innenbeleuchtung | LI |
| BR - 33a Ausgelöst | Brandmeldeanlage | switch.turn_off | Brandmeldeanlage - 33a - Feueralarm ausschalten | switch.brandmeldeanlage_33a_feueralarm | STE |
| BR - 33a Ausgelöst | Brandmeldeanlage | switch.turn_off | Brandmeldeanlage - 33 - Einbruchalarm ausschalten | switch.brandmeldeanlage_33_einbruchalarm | STE |
| BR - 33a Ausgelöst | Brandmeldeanlage | switch.turn_on | Brandmeldeanlage - 33a - Feueralarm einschalten | switch.brandmeldeanlage_33a_feueralarm | STE |
| BR - 33a Ausgelöst | Brandmeldeanlage | switch.turn_on | Brandmeldeanlage - 33 - Einbruchalarm einschalten | switch.brandmeldeanlage_33_einbruchalarm | STE |
| E - Ladeautomatik Celine | Endgerät | switch.turn_off | Steckdose Celine ausschalten | switch.steckdose_celine | STE |
| E - Ladeautomatik Jens | Endgerät | switch.turn_off | Steckdose Wireless Ladegerät ausschalten | switch.steckdose_wireless_charger | STE |
| E - Ladeautomatik S8 | Endgerät | light.turn_off | Tablet - Bildschirm ausschalten | light.6c909710_a9130d27_screen | LI |
| E - Ladeautomatik S8 | Endgerät | switch.turn_off | Steckdose Wireless Chargingstation ausschalten | switch.steckdose_wireless_chargingstation | STE |
| E - Ladeautomatik Tablet | Endgerät | light.turn_off | Tablet - Bildschirm ausschalten | light.6c909710_a9130d27_screen | LI |
| E - Ladeautomatik Watch4 | Endgerät | switch.turn_off | Steckdose Wireless Chargingstation ausschalten | switch.steckdose_wireless_chargingstation | STE |
| E - Ladeautomatik Watch6 | Endgerät | switch.turn_off | Steckdose Watch Chargingpad ausschalten | switch.steckdose_watch_chargingpad | STE |
| F - Volvo S90 | Fortbewegung | switch.turn_off | Außensteckdose Stellplatz Kellertor ausschalten | switch.ausensteckdose_stellplatz_kellertor_switch_0 | STE |
| F - Volvo S90 | Fortbewegung | switch.turn_on | Außensteckdose Stellplatz Kellertor einschalten | switch.ausensteckdose_stellplatz_kellertor_switch_0 | STE |
| F - Volvo S90 | Fortbewegung | switch.turn_on | Außensteckdose Stellplatz Kellertor einschalten | switch.ausensteckdose_stellplatz_kellertor_switch_0 | STE |
| F - Volvo XC90 | Fortbewegung | switch.turn_off | Relais Garage Schalter ausschalten | switch.relais_garage_schalter_switch_0 | STE |
| F - Volvo XC90 | Fortbewegung | switch.turn_on | Relais Garage Schalter einschalten | switch.relais_garage_schalter_switch_0 | STE |
| GEO - Andrea | Geofencing | media_player.play_media | Alexaklingel | media_player.jens_echo_dot_gen5, media_player.jens_3_echo, media_player.echo_esszimmer, media_player.jens_echo_dot_gen2, media_player.jens_echo | M |
| GEO - Andrea | Geofencing | media_player.play_media | Alexaklingel | media_player.jens_echo_dot_gen5, media_player.jens_3_echo, media_player.echo_esszimmer, media_player.jens_echo_dot_gen2, media_player.jens_echo | M |
| GEO - Andrea | Geofencing | media_player.play_media | Alexaklingel | media_player.jens_echo_dot_gen5, media_player.jens_3_echo, media_player.echo_esszimmer, media_player.jens_echo_dot_gen2, media_player.jens_echo | M |
| GEO - Celine | Geofencing | media_player.play_media | Alexaklingel | media_player.jens_echo_dot_gen5, media_player.jens_3_echo, media_player.echo_esszimmer, media_player.jens_echo_dot_gen2, media_player.jens_echo | M |
| GEO - Celine | Geofencing | media_player.play_media | Alexaklingel | media_player.jens_echo_dot_gen5, media_player.jens_3_echo, media_player.echo_esszimmer, media_player.jens_echo_dot_gen2, media_player.jens_echo | M |
| GEO - Celine | Geofencing | media_player.play_media | Alexaklingel | media_player.jens_echo_dot_gen5, media_player.jens_3_echo, media_player.echo_esszimmer, media_player.jens_echo_dot_gen2, media_player.jens_echo | M |
| GEO - Fred | Geofencing | media_player.play_media | Alexaklingel | media_player.jens_echo_dot_gen5, media_player.jens_3_echo, media_player.echo_esszimmer, media_player.jens_echo_dot_gen2, media_player.jens_echo | M |
| GEO - Fred | Geofencing | media_player.play_media | Alexaklingel | media_player.jens_echo_dot_gen5, media_player.jens_3_echo, media_player.echo_esszimmer, media_player.jens_echo_dot_gen2, media_player.jens_echo | M |
| GEO - Fred | Geofencing | media_player.play_media | Alexaklingel | media_player.jens_echo_dot_gen5, media_player.jens_3_echo, media_player.echo_esszimmer, media_player.jens_echo_dot_gen2, media_player.jens_echo | M |
| GEO - Jens | Geofencing | media_player.play_media | Alexaklingel | media_player.jens_echo_dot_gen5, media_player.jens_3_echo, media_player.echo_esszimmer, media_player.jens_echo_dot_gen2, media_player.jens_echo | M |
| GEO - Jens | Geofencing | media_player.play_media | Alexaklingel | media_player.jens_echo_dot_gen5, media_player.jens_3_echo, media_player.echo_esszimmer, media_player.jens_echo_dot_gen2, media_player.jens_echo | M |
| GEO - Jens | Geofencing | media_player.play_media | Alexaklingel | media_player.jens_echo_dot_gen5, media_player.jens_3_echo, media_player.echo_esszimmer, media_player.jens_echo_dot_gen2, media_player.jens_echo | M |
| H - Wasserkocher | Heimgeräte | switch.turn_off | Wasserkocher Start ausschalten | switch.wasserkocher_start | STE |
| H - Wasserkocher | Heimgeräte | switch.turn_on | Wasserkocher Start einschalten | switch.wasserkocher_start | STE |
| H - Wasserkocher | Heimgeräte | switch.turn_on | Wasserkocher Start einschalten | switch.wasserkocher_start | STE |
| KAM - 33a Allgemein | Kamera | light.turn_off | Licht-Gruppe - 33a Überwachungskamera ausschalten | light.licht_gruppe_33a_uberwachungskamera | LI |
| KAM - 33a Allgemein | Kamera | light.turn_on | Licht-Gruppe - 33a Überwachungskamera einschalten | light.licht_gruppe_33a_uberwachungskamera | LI |
| KAM - 33a Talblick N | Kamera | light.turn_off | 33a Talblick N Scheinwerfer ausschalten | light.33a_talblick_n_scheinwerfer | LI |
| KAM - 33a Talblick N | Kamera | light.turn_on | 33a Talblick N Scheinwerfer einschalten | light.33a_talblick_n_scheinwerfer | LI |
| KAM - 33a Talblick S | Kamera | light.turn_off | 33a Talblick S Scheinwerfer ausschalten | light.33a_talblick_s_scheinwerfer | LI |
| KAM - 33a Talblick S | Kamera | light.turn_on | 33a Talblick S Scheinwerfer einschalten | light.33a_talblick_s_scheinwerfer | LI |
| KAM - 33a Teich | Kamera | light.turn_off | 33a Teich Scheinwerfer ausschalten | light.33a_teich_scheinwerfer | LI |
| KAM - 33a Teich | Kamera | light.turn_on | 33a Teich Scheinwerfer einschalten | light.33a_teich_scheinwerfer | LI |
| KAM - 33a Wasserfall | Kamera | light.turn_off | 33a Wasserfall Scheinwerfer ausschalten | light.33a_wasserfall_scheinwerfer | LI |
| KAM - 33a Wasserfall | Kamera | light.turn_on | 33a Wasserfall Scheinwerfer einschalten | light.33a_wasserfall_scheinwerfer | LI |
| KL - Dyson PH04 | Klima | switch.turn_off | Lüftung - Dyson PH04 Nachtmodus ausschalten | switch.dyson_ph04_night_mode | STE |
| KL - Midea PortaSplit | Klima | switch.turn_off | Midea PortaSplit Lüfter Turbomodus ausschalten | switch.midea_portasplit_turbo_fan | STE |
| KL - Midea PortaSplit | Klima | switch.turn_on | Midea PortaSplit Lüfter Turbomodus einschalten | switch.midea_portasplit_turbo_fan | STE |
| KL - Xiaomi SmartFan ZA5 | Klima | switch.turn_on | Xiaomi SmartFan ZA5 Ionizer einschalten | switch.xiaomi_smartfan_zh5_ionizer | STE |
| RE - 33a Dunstabzugshaube | Relais | switch.turn_off | Relais 33a Dunstabzugshaube ausschalten | switch.relais_33a_dunstabzugshaube | STE |
| RE - 33a Dunstabzugshaube | Relais | switch.turn_on | Relais 33a Dunstabzugshaube einschalten | switch.relais_33a_dunstabzugshaube | STE |
| RO - 33a SOS | Routine | light.turn_on | Licht-Gruppe - 33a Innenbeleuchtung einschalten | light.licht_gruppe_33a_innenbeleuchtung | LI |
| RO - 33a SOS | Routine | light.turn_on | Licht-Gruppe - 33a Innenbeleuchtung einschalten | light.licht_gruppe_33a_innenbeleuchtung | LI |
| RO - 33a SOS | Routine | light.turn_on | Licht-Gruppe - Innenbeleuchtung einschalten | light.licht_gruppe_innenbeleuchtung | LI |
| RO - 33a SOS | Routine | light.turn_on | Licht-Gruppe - 33a Innenbeleuchtung einschalten | light.licht_gruppe_33a_innenbeleuchtung | LI |
| RO - 33a SOS | Routine | light.turn_on | Licht-Gruppe - Innenbeleuchtung einschalten | light.licht_gruppe_innenbeleuchtung | LI |
| RO - 33a SOS | Routine | light.turn_on | Licht-Gruppe - Außenbeleuchtung einschalten | light.licht_gruppe_aussenbeleuchtung | LI |
| RO - 33a SOS | Routine | siren.turn_off | Eingang 33 Sirene ausschalten | siren.eingang_33_sirene | AL |
| RO - 33a SOS | Routine | siren.turn_off | Eingang 33a Sirene ausschalten | siren.eingang_33a_sirene | AL |
| RO - 33a SOS | Routine | siren.turn_on | Eingang 33 Sirene einschalten | siren.eingang_33_sirene | AL |
| RO - 33a SOS | Routine | siren.turn_on | Eingang 33a Sirene einschalten | siren.eingang_33a_sirene | AL |
| RO - 33a SOS | Routine | switch.turn_off | Brandmeldeanlage - 33a - Einbruchalarm ausschalten | switch.brandmeldeanlage_33a_einbruchalarm | STE |
| RO - 33a SOS | Routine | switch.turn_off | Brandmeldeanlage - Einbruchalarm ausschalten | switch.brandmeldeanlage_einbruchalarm | STE |
| RO - 33a SOS | Routine | switch.turn_off | Brandmeldeanlage - Feueralarm ausschalten | switch.brandmeldeanlage_feueralarm | STE |
| RO - 33a SOS | Routine | switch.turn_on | Brandmeldeanlage - 33a - Einbruchalarm einschalten | switch.brandmeldeanlage_33a_einbruchalarm | STE |
| RO - 33a SOS | Routine | switch.turn_on | Brandmeldeanlage - Einbruchalarm einschalten | switch.brandmeldeanlage_einbruchalarm | STE |
| RO - 33a SOS | Routine | switch.turn_on | Brandmeldeanlage - Feueralarm einschalten | switch.brandmeldeanlage_feueralarm | STE |
| RO - Anwesenheitssimulation | Routine | light.turn_off | Licht-Gruppe - Innenbeleuchtung ausschalten | light.licht_gruppe_innenbeleuchtung | LI |
| RO - Arbeitszeit | Routine | light.turn_off | Lichter (5/5) ausschalten | light.eingang_33_scheinwerfer, light.eingang_33a_scheinwerfer, light.rgb_led_lichterkette, light.strahler_stellplatz, light.strahler_balkon_eg | LI |
| RO - Arbeitszeit | Routine | light.turn_off | Licht-Gruppe - Innenbeleuchtung ausschalten | light.licht_gruppe_innenbeleuchtung | LI |
| RO - Arbeitszeit | Routine | light.turn_on | Lichter (5/5) einschalten | light.eingang_33_scheinwerfer, light.eingang_33a_scheinwerfer, light.rgb_led_lichterkette, light.strahler_stellplatz, light.strahler_balkon_eg | LI |
| RO - Arbeitszeit | Routine | light.turn_on | Lichter (4/5) einschalten | light.eingang_33a_scheinwerfer, light.rgb_led_lichterkette, light.strahler_stellplatz, light.strahler_balkon_eg | LI |
| RO - Arbeitszeit | Routine | light.turn_on | Lichter (4/5) einschalten | light.eingang_33a_scheinwerfer, light.rgb_led_lichterkette, light.strahler_stellplatz, light.strahler_balkon_eg | LI |
| RO - Arbeitszeit | Routine | light.turn_on | Lichter (5/5) einschalten | light.eingang_33_scheinwerfer, light.eingang_33a_scheinwerfer, light.rgb_led_lichterkette, light.strahler_stellplatz, light.strahler_balkon_eg | LI |
| RO - Arbeitszeit | Routine | scene.turn_on | Szene Routine - Arbeitszeit #2 einschalten | scene.arbeitszeit_2 | LI |
| RO - Arbeitszeit | Routine | scene.turn_on | Szene Routine - Arbeitszeit - Anwesenheitslicht - Aus einschalten | scene.arbeitszeit_anwesenheitslicht_aus | LI |
| RO - Arbeitszeit | Routine | scene.turn_on | Szene Routine - Arbeitszeit #1 einschalten | scene.arbeitszeit_1 | LI |
| RO - Arbeitszeit | Routine | scene.turn_on | Szene Routine - Arbeitszeit #3 einschalten | scene.arbeitszeit_3 | LI |
| RO - Arbeitszeit | Routine | scene.turn_on | Szene Arbeitszeit Anwesenheitslicht einschalten | scene.arbeitszeit_anwesenheitslicht | LI |
| RO - Bettzeit | Routine | light.turn_off | Licht-Gruppen ausschalten | light.licht_gruppe_ankleidezimmer, light.licht_gruppe_badezimmer_eg, light.licht_gruppe_badezimmer_og, light.licht_gruppe_esszimmer, light.licht_gruppe_familienzimmer, light.licht_gruppe_flur_eg, light.licht_gruppe_flur_og, light.licht_gruppe_kuche, light.licht_gruppe_speicher, light.licht_gruppe_wohnzimmer | LI |
| RO - Bettzeit | Routine | scene.turn_on | Szene Routine - Bettzeit einschalten | scene.bettzeit | LI |
| RO - Ella Bettzeit | Routine | light.turn_on | Wandbeleuchtung Schlafzimmer einschalten | light.wandbeleuchtung_schlafzimmer | LI |
| RO - Ella Bettzeit | Routine | switch.turn_on | Steckdose Babycam einschalten | switch.steckdose_babycam | STE |
| RO - Es werde Licht | Routine | light.turn_on | Licht-Gruppe Innenbeleuchtung einschalten | light.licht_gruppe_innenbeleuchtung | LI |
| RO - Essenszeit | Routine | scene.turn_on | Szene Routine - Essenszeit einschalten | scene.routine_essenszeit | LI |

## Lange Function Nodes

| Tab | Sektion | Function | Zeilen | Chars | FlowCtx | GlobalCtx |
| --- | --- | --- | --- | --- | --- | --- |
| Licht - Automatisierung - Template | Subflows | Berechnung | 108 | 3928 | ja | nein |
| STA - Gary | Staubsauger | Vergleich | 72 | 4147 | ja | nein |
| TO - Arbeit ToDo-Liste | ToDo | Sortierung | 85 | 2739 | nein | nein |
| TO - Einkaufsliste | ToDo | Sortierung | 85 | 2734 | nein | nein |
| TO - HA ToDo-Liste | ToDo | Sortierung | 85 | 2735 | nein | nein |
| TO - Shoppingliste | ToDo | Sortierung | 85 | 2734 | nein | nein |
| TO - ToDo-Liste | ToDo | Sortierung | 85 | 2731 | nein | nein |
| TO - ToDo-Liste | ToDo | Sortierung | 91 | 3292 | nein | nein |
| TO - ToDo-Liste | ToDo | Sortierung | 93 | 3319 | nein | nein |
| WE - Erweiterter Wetterbericht | Wetter | Textgenerierung | 307 | 13079 | nein | nein |
| GES - NINA neu | Zahnbürste | Warnungen sammeln & deduplizieren | 120 | 4050 | nein | nein |

## Deaktivierte Tabs/Nodes

| Typ | Tab/Node | Sektion |
| --- | --- | --- |
| Tab | AL - 33 Trigger Old | Alarmanlage |
| Tab | RO - 33a SOS | Routine |
| server-state-changed | LI - Schlafzimmer / Bewegung Schlafzimmer | Licht |
| api-current-state | LI - Schlafzimmer / Licht Automatisierung angewählt? | Licht |
| api-current-state | LI - Schlafzimmer / Licht Automatisierung Schlafzimmer angewählt? | Licht |
| api-current-state | LI - Schlafzimmer / Bewegungsmelder Schlafzimmer Lux < Helligkeitswert | Licht |
| switch | LI - Schlafzimmer / true/false | Licht |
| api-current-state | LI - Schlafzimmer / Licht - Automatisierung Schlafzimmer Ausschaltverzögerung auslesen | Licht |
| server-state-changed | LI - Schlafzimmer / Bewegung Schlafzimmer | Licht |
| change | LI - Schlafzimmer /  | Licht |
| api-call-service | LI - Schlafzimmer / Licht - Automatisierung Schlafzimmer Lichtanforderung - Hell #1 | Licht |
| api-current-state | LI - Schlafzimmer / Licht - Automatisierung Schlafzimmer Helligkeitsabfrage abgewählt? | Licht |
| server-state-changed | LI - Schlafzimmer / Allgemein - Initialisierung Licht eingeschaltet | Licht |
| switch | LI - Schlafzimmer / true | Licht |
| change | LI - Schlafzimmer /  | Licht |
| change | LI - Schlafzimmer /  | Licht |
| api-current-state | LI - Schlafzimmer / Licht - Automatisierung Schlafzimmer Helligkeitswert auslesen | Licht |
| api-current-state | LI - Schlafzimmer / Licht - Automatisierung Schlafzimmer Lichtanforderung | Licht |
| switch | LI - Schlafzimmer / flow.active != true | Licht |
| api-call-service | LI - Schlafzimmer / Licht - Automatisierung Schlafzimmer Lichtanforderung - Dunkel | Licht |
| function | LI - Schlafzimmer / Umrechnung | Licht |
| change | LI - Schlafzimmer /  | Licht |
| switch | LI - Schlafzimmer / false/true | Licht |
| change | LI - Schlafzimmer /  | Licht |
| delay | LI - Schlafzimmer /  | Licht |
| change | LI - Schlafzimmer /  | Licht |
| api-call-service | LI - Schlafzimmer / Licht - Automatisierung Schlafzimmer Lichtanforderung - Aus | Licht |
| api-current-state | LI - Schlafzimmer / Licht - Automatisierung Schlafzimmer Tageszeitabfrage abgewählt? | Licht |
| api-current-state | LI - Schlafzimmer / Allgemein - Sonnenstrahlen eingeschaltet? | Licht |
| change | LI - Schlafzimmer /  | Licht |
| api-current-state | LI - Schlafzimmer / Licht - Automatisierung Statusverfolgung eingeschaltet? | Licht |
| ha-wait-until | LI - Schlafzimmer / Warte bis Deckenleuchte Schlafzimmer ausgeschaltet | Licht |
| switch | LI - Schlafzimmer / 1/2/3 | Licht |
| ha-wait-until | LI - Schlafzimmer / Warte bis Wandbeleuchtung Schlafzimmer ausgeschaltet | Licht |
| change | LI - Schlafzimmer /  | Licht |
| change | LI - Schlafzimmer /  | Licht |
| change | LI - Schlafzimmer /  | Licht |
| switch | LI - Schlafzimmer / false | Licht |
| api-call-service | LI - Schlafzimmer / Licht - Automatisierung Schlafzimmer Status setzten | Licht |
| api-call-service | LI - Schlafzimmer / Licht - Automatisierung Schlafzimmer Status setzten | Licht |
| api-call-service | LI - Schlafzimmer / Licht - Automatisierung Schlafzimmer Status setzten | Licht |
| api-call-service | LI - Schlafzimmer / Licht - Automatisierung Schlafzimmer Status setzten | Licht |
| api-current-state | LI - Schlafzimmer / Bewegungsmelder Schlafzimmer noch aktiv? | Licht |
| delay | LI - Schlafzimmer /  | Licht |
| server-state-changed | LI - Schlafzimmer / Funkknopf Celine | Licht |
| switch | LI - Schlafzimmer / single/double/hold | Licht |
| api-call-service | LI - Schlafzimmer / Wandbeleuchtung Schlafzimmer einschalten | Licht |
| api-current-state | LI - Schlafzimmer / Wandbeleuchtung Schlafzimmer eingeschaltet? | Licht |
| api-call-service | LI - Schlafzimmer / Wandbeleuchtung Schlafzimmer ausschalten | Licht |
| api-current-state | LI - Schlafzimmer / Wandbeleuchtung Schlafzimmer auslesen | Licht |
| function | LI - Schlafzimmer / Helligkeitsfunktion | Licht |
| api-call-service | LI - Schlafzimmer / Wandbeleuchtung Schlafzimmer anpassen | Licht |
| function | LI - Schlafzimmer / Helligkeitsfunktion | Licht |
| switch | LI - Schlafzimmer / ==/!= | Licht |
| api-call-service | LI - Schlafzimmer / Wandbeleuchtung Schlafzimmer anpassen | Licht |
| server-state-changed | LI - Schlafzimmer / Alarmanlage - Anwesenheitserkennung Schlafzimmer | Licht |
| switch | LI - Schlafzimmer / Sehr hell/Hell/Normal/Dunkel/Sehr dunkel | Licht |
| api-call-service | LI - Schlafzimmer / Licht - Automatisierung Schlafzimmer Lichtanforderung - Sehr hell #1 | Licht |
| api-call-service | LI - Schlafzimmer / Licht - Automatisierung Schlafzimmer Lichtanforderung - Sehr hell #2 | Licht |
| api-call-service | LI - Schlafzimmer / Licht - Automatisierung Schlafzimmer Lichtanforderung - Normal | Licht |
| api-call-service | LI - Schlafzimmer / Licht - Automatisierung Schlafzimmer Lichtanforderung - Sehr dunkel | Licht |
| server-state-changed | LI - Schlafzimmer / Lichtschalter Schlafzimmer | Licht |
| change | LI - Schlafzimmer /  | Licht |
| switch | LI - Schlafzimmer / flow.manual != true | Licht |
| api-call-service | LI - Schlafzimmer / Licht - Automatisierung Schlafzimmer Lichtanforderung - Hell #2 | Licht |
| ha-wait-until | LI - Schlafzimmer / Warte bis Babybauchabdruck ausgeschaltet | Licht |
| change | LI - Schlafzimmer /  | Licht |
| server-state-changed | LI - Schlafzimmer / Licht-Gruppe - Schlafzimmer | Licht |
| switch | LI - Schlafzimmer / on/off | Licht |
| switch | LI - Schlafzimmer / != true | Licht |
| switch | LI - Schlafzimmer / true | Licht |
| change | LI - Schlafzimmer /  | Licht |
| change | LI - Schlafzimmer /  | Licht |
| change | LI - Schlafzimmer /  | Licht |
| change | LI - Schlafzimmer /  | Licht |
| api-call-service | LI - Schlafzimmer / Licht - Automatisierung Schlafzimmer Status setzten | Licht |
| api-call-service | LI - Schlafzimmer / Licht - Automatisierung Schlafzimmer Status setzten | Licht |
| server-state-changed | LI - Schlafzimmer / Alarmanlage - Anwesenheitserkennung Schlafzimmer | Licht |
| switch | LI - Schlafzimmer / flow.manual != true | Licht |
| switch | LI - Schlafzimmer / flow.wallswitch != true | Licht |
| switch | LI - Schlafzimmer / flow.wallswitch != true | Licht |
| change | LI - Schlafzimmer /  | Licht |
| link in | LI - Schlafzimmer / setze flow.wallswitch | Licht |
| link out | LI - Schlafzimmer / setzen flow.statusverfolgung.state | Licht |
| change | LI - Schlafzimmer /  | Licht |
| api-call-service | LI - Schlafzimmer / Routine - Schlafenszeit einschalten | Licht |
| change | LI - Schlafzimmer /  | Licht |
| change | LI - Schlafzimmer /  | Licht |
| change | LI - Schlafzimmer /  | Licht |
| api-call-service | LI - Schlafzimmer / Licht-Gruppe - Schlafzimmer - Deckenleuchten einschalten | Licht |
| change | LI - Schlafzimmer /  | Licht |
| function | LI - Schlafzimmer / Berechnung | Licht |
| change | LI - Schlafzimmer /  | Licht |
| switch | LI - Schlafzimmer / false/null/true | Licht |
| change | LI - Schlafzimmer /  | Licht |
| api-current-state | LI - Schlafzimmer / Licht-Gruppe - Schlafzimmer - Deckenleuchten auslesen | Licht |
| change | LI - Schlafzimmer /  | Licht |
| delay | LI - Schlafzimmer /  | Licht |
| switch | LI - Schlafzimmer / left_press_release/left_hold_release/left_hold | Licht |
| change | LI - Schlafzimmer /  | Licht |
| switch | LI - Schlafzimmer / true/false/null | Licht |
| switch | LI - Schlafzimmer / true/false/null | Licht |
| change | LI - Schlafzimmer /  | Licht |
| change | LI - Schlafzimmer /  | Licht |
| delay | LI - Schlafzimmer /  | Licht |
| change | LI - Schlafzimmer /  | Licht |
| server-state-changed | LI - 33 Hausflur / Lichtschalter Hausflur EG | Licht |
| api-current-state | LI - 33 Hausflur / Licht - Schalter Hausflur EG angewählt? | Licht |
| switch | LI - 33 Hausflur / single_right/hold_left/hold_right/hold_both | Licht |
| api-call-service | LI - 33 Hausflur / Licht-Gruppe - Innenbeleuchtung ausschalten | Licht |
| api-call-service | LI - 33 Hausflur / Routine - Pipizeit einschalten | Licht |
| api-call-service | LI - 33 Hausflur / Routine - Pipizeit ausschalten | Licht |
| server-state-changed | LI - 33 Hausflur / Lichtschalter Hausflur OG | Licht |
| api-current-state | LI - 33 Hausflur / Licht - Schalter Hausflur OG angewählt? | Licht |
| switch | LI - 33 Hausflur / hold | Licht |
| api-call-service | LI - 33 Hausflur / Licht-Gruppe - Innenbeleuchtung ausschalten | Licht |

## Hinweis

Dieses Inventar ist maschinell aus dem Flow-Export erzeugt und dient als Grundlage fuer den menschenlesbaren Auditbericht.
