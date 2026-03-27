# openai-cli

**KI-gestuetzter Fachexperten-Assistent fuer Dokumentenanalyse und professionelle Beratung.**

65+ vordefinierte Expertenrollen — von Fachanwaelten ueber Aerzte bis zu Steuerberatern. Analysiert Dokumente jeder Art, aktiviert automatisch die passenden Fachexperten und erstellt professionelle Ausgaben wie Klageschriften, Steuererklaerungen oder Gutachten.

**Kostenlos und Open Source.** Verbinde dich einfach mit deinem OpenAI-Konto.

---

## Features

- **65+ Fachexperten-Rollen** — Recht, Steuern, Medizin, Immobilien, Versicherung, Unternehmen, Wissenschaft, Technik, Verbraucher
- **Automatisches Experten-Routing** — Erkennt anhand deiner Dokumente und Fragen, welcher Experte gebraucht wird
- **Alle Dokumentformate** — PDF, DOCX, XLSX, CSV, PowerPoint, Pages, Numbers, Keynote, HTML, E-Mails, Bilder (OCR), Archive
- **Professionelle Ausgaben** — Klageschriften, Widersprueche, Steuererklaerungen, Gutachten, Schreiben an Behoerden
- **Multi-Experten-Panel** — Mehrere Experten gleichzeitig fuer komplexe Faelle (z.B. Scheidung: Familienrecht + Steuer + Immobilien)
- **Konfigurierbar** — Globale und projektspezifische OPENAI.md Dateien
- **Pipe-faehig** — Nicht-interaktiver Modus fuer Scripting

## Installation

### Homebrew (empfohlen)

```bash
brew tap marcelrgberger/tap
brew install openai-cli
```

### npm

```bash
npm install -g openai-cli
```

### Von Source

```bash
git clone https://github.com/marcelrgberger/openai-cli.git
cd openai-cli
npm install
npm run build
npm link
```

## Einrichtung

Du brauchst einen OpenAI API-Key. Hol dir einen unter [platform.openai.com](https://platform.openai.com/api-keys).

```bash
# Option 1: Umgebungsvariable
export OPENAI_API_KEY="sk-..."

# Option 2: Beim Start angeben
openai-cli --api-key "sk-..."

# Option 3: In Settings speichern
# Wird automatisch gespeichert nach erstem --api-key Aufruf
```

## Verwendung

### Interaktiver Modus

```bash
openai-cli
```

```
  openai-cli — Fachexperten-Dokumenten-Agent
  65+ Experten-Rollen | Dokumentenanalyse | Professionelle Ausgaben

openai-cli > Pruefe meinen Arbeitsvertrag auf problematische Klauseln
[Fachanwalt Arbeitsrecht aktiviert]
...

openai-cli > Schreib mir eine Kuendigungsschutzklage
[Klageschrift wird erstellt]
...
```

### Nicht-interaktiver Modus

```bash
# Dokument analysieren
openai-cli --print "Fasse dieses Dokument zusammen" < vertrag.pdf

# Verzeichnis analysieren
openai-cli --dir ./steuerbelege/ --print "Erstelle eine Steuererklaerung aus diesen Belegen"

# Bestimmte Rolle verwenden
openai-cli --role steuerberater --print "Pruefe diesen Steuerbescheid"
```

### Befehle

| Befehl | Funktion |
|---|---|
| `/help` | Hilfe anzeigen |
| `/roles` | Alle 65+ Experten-Rollen auflisten |
| `/role <id>` | Bestimmte Rolle aktivieren (z.B. `/role steuerberater`) |
| `/role` | Automatisches Routing aktivieren |
| `/model <name>` | Modell wechseln (gpt-4o, o3, o4-mini) |
| `/clear` | Konversation loeschen |
| `/exit` | Beenden |

## Experten-Rollen

### Recht (15 Rollen)
Fachanwalt fuer: Arbeitsrecht, Familienrecht, Mietrecht, Verkehrsrecht, Erbrecht, Strafrecht, Medizinrecht, Sozialrecht, Verwaltungsrecht, IT-Recht, Handelsrecht, Insolvenzrecht, Baurecht, Versicherungsrecht, Steuerrecht

### Steuern & Finanzen (8 Rollen)
Steuerberater, Finanzberater, Wirtschaftspruefer, Buchhalter, Lohnabrechner, Controller, Foerdermittelberater, Zollberater

### Medizin & Gesundheit (10 Rollen)
Allgemeinmedizin, Kardiologie, Orthopaedie, Neurologie, Dermatologie, Zahnmedizin, Psychologie, Pharmazie, Ernaehrung, Medizincontrolling

### Immobilien & Bau (6 Rollen)
Architekt, Immobilienbewerter, Makler, Bauingenieur, Energieberater, Hausverwalter

### Versicherung & Vorsorge (4 Rollen)
Versicherungsberater, Rentenberater, BU-Berater, Krankenversicherungsberater

### Unternehmen & Gruendung (6 Rollen)
Unternehmensberater, Gruendungsberater, HR/Personalberater, Datenschutzbeauftragter, Compliance Officer, Patentberater

### Bildung & Wissenschaft (4 Rollen)
Wissenschaftlicher Lektor, Statistiker, Fachuebersetzer, Paedagoge

### Technik & Ingenieurwesen (4 Rollen)
KFZ-Sachverstaendiger, Elektroingenieur, Umweltgutachter, IT-Sachverstaendiger

### Alltag & Verbraucher (5 Rollen)
Verbraucherschutz, Schuldnerberater, Reiserecht, Behoerdenlotse, Mediator

## Unterstuetzte Dokumentformate

| Kategorie | Formate |
|---|---|
| Text | .txt, .md, .rst, .tex, .rtf |
| Office | .pdf, .docx, .doc, .xlsx, .xls, .csv, .tsv, .pptx, .ppt |
| Apple | .pages, .numbers, .key |
| Web | .html, .htm, .xml, .json, .yaml, .yml |
| E-Mail | .eml, .msg |
| Bilder (OCR) | .png, .jpg, .jpeg, .tiff, .bmp, .gif, .webp |
| E-Books | .epub |
| Archive | .zip, .tar.gz, .tar |

## Konfiguration

### Global: `~/.openai-cli/OPENAI.md`

```markdown
# OPENAI.md

## Modell
- Standard: gpt-4o

## Sprache
- Deutsch

## Praeferenzen
- Rechtsgrundlagen immer zitieren
- Fristen hervorheben
```

### Projekt: `./OPENAI.md`

```markdown
# OPENAI.md

## Kontext
Dokumente fuer meine Steuererklaerung 2025.

## Anweisungen
- Fokus: Einkommensteuer, Werbungskosten
- Arbeitnehmer, Steuerklasse 1
```

## Eigene Experten-Rollen

Lege eigene Rollen als `.md`-Dateien in `~/.openai-cli/roles/` ab:

```markdown
---
id: meine-rolle
name: Mein Fachexperte
category: custom
triggers:
  - keyword1
  - keyword2
outputs:
  - ausgabe1
---

# Mein Fachexperte

## Expertise
Beschreibung...
```

## Plattform

**openai-cli ist aktuell fuer macOS optimiert.** Insbesondere Apple-Dokumentformate (.pages, .numbers, .key) nutzen macOS-eigene Tools (`textutil`).

**Beitraege fuer Windows und Linux sind herzlich willkommen!** Falls du openai-cli auf andere Plattformen portieren moechtest, freuen wir uns ueber Pull Requests.

## Wichtiger Hinweis

> Diese Software liefert KI-gestuetzte Analysen und Entwuerfe. Sie ersetzt **keine** professionelle Beratung durch zugelassene Anwaelte, Aerzte, Steuerberater oder andere Fachleute. Alle Angaben ohne Gewaehr. Fuer rechtsverbindliche Schritte immer einen zugelassenen Berater konsultieren.

## Lizenz

MIT License — Marcel R. G. Berger

## Beitragen

Beitraege sind willkommen! Besonders gesucht:
- Neue Experten-Rollen
- Windows/Linux-Kompatibilitaet
- Zusaetzliche Dokumentformate
- Verbesserungen an bestehenden Rollen
- Tests
