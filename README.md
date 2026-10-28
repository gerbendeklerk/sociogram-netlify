# Sociogram Toolkit – Netlify proof of concept (formuliermodule)

Dit is een proof of concept voor de formuliermodule van de Sociogram Toolkit, gebouwd op Netlify.

## Voordelen ten opzichte van Google Apps Script

- **Geen Google-account nodig** voor leerlingen – werkt ook voor kinderen jonger dan 13
- **Geen Google Sheets nodig** – data wordt opgeslagen in Netlify Blobs
- **Eenvoudig te deployen** – één klik naar Netlify
- **Sneller** – statische pagina's + serverless functions

## Projectstructuur

```
sociogram-netlify/
├── public/
│   ├── formulier.html       # Leerlingenformulier (student-facing)
│   └── beheer.html          # Lerarenpagina (dashboard + sessies aanmaken)
├── netlify/
│   └── functions/
│       ├── get-config.js        # Haalt sessie-configuratie op
│       ├── check-ingevuld.js    # Controleert of leerling al ingevuld heeft
│       ├── submit.js            # Slaat antwoord op
│       ├── get-responses.js     # Geeft alle antwoorden terug (voor leraar)
│       └── create-session.js   # Maakt nieuwe sessie aan
├── netlify.toml             # Netlify configuratie
├── package.json
└── README.md
```

## Installatie en lokaal testen

### Vereisten
- Node.js 18 of hoger
- Netlify CLI

### Stappen

```bash
# 1. Installeer afhankelijkheden
npm install

# 2. Log in op Netlify (eenmalig)
npx netlify login

# 3. Koppel aan een Netlify-project (eenmalig)
npx netlify init
# of voor een bestaand project:
npx netlify link

# 4. Start lokale ontwikkelserver
npx netlify dev
# → Opent op http://localhost:8888
```

### Testen

1. Open `http://localhost:8888/beheer.html`
2. Maak een nieuwe sessie aan met een paar namen
3. Kopieer de leerlingenlink
4. Open de leerlingenlink in een apart tabblad
5. Vul het formulier in
6. Ga terug naar de beheerpagina via de beheerpaginalink
7. Zie de ingevulde reactie verschijnen

## Deployen naar Netlify

```bash
# Eenmalige setup
npx netlify init

# Deployen (preview)
npx netlify deploy

# Deployen naar productie
npx netlify deploy --prod
```

## Datamodel in Netlify Blobs

Alle data wordt opgeslagen in de `sociogram` store:

| Sleutel | Inhoud |
|---|---|
| `sessies/{id}/config` | Sessie-configuratie: naam, vragen, extraVragen, beheerToken |
| `sessies/{id}/namen` | Namenlijst: `{ namen: [{naam, geslacht, fakeName}] }` |
| `sessies/{id}/antwoorden/{naam}` | Antwoord van één leerling |
| `sessies/{id}/ingevuld-index` | Snelle index: `{ namen: ["Emma", "Liam", …] }` |

## API-endpoints

| Endpoint | Methode | Beschrijving |
|---|---|---|
| `/api/get-config?sessie=ID` | GET | Sessie-config + namen ophalen |
| `/api/check-ingevuld?sessie=ID&naam=NAAM` | GET | Heeft leerling al ingevuld? |
| `/api/submit` | POST | Antwoord opslaan |
| `/api/get-responses?sessie=ID&token=TOKEN` | GET | Alle antwoorden (voor leraar) |
| `/api/create-session` | POST | Nieuwe sessie aanmaken |

## Beveiliging

- De beheerpagina is beveiligd met een **beheertoken** dat bij aanmaken wordt gegenereerd
- Leerlingen kunnen alleen antwoorden inzien via het token
- Netlify Blobs is niet publiek toegankelijk – alleen via serverless functions
- Elke naam kan slechts één keer invullen (server-side controle)

## Uitbreidingen voor productie

1. **Netlify Identity** – voor authenticatie van leraren
2. **Sessie verwijderen** – functie om data te wissen
3. **Meerdere vragen** – UI in beheer om vragen te configureren
4. **E-mailnotificatie** – Netlify Forms / SendGrid bij volledige deelname
5. **Export naar visualisatietool** – directe koppeling met sociogram.html

## Vergelijking met Google Apps Script

| | Google Apps Script | Netlify |
|---|---|---|
| Leerlingaccounts | Google-account vereist | Niet nodig |
| Leeftijdsgrens | Problematisch < 13 jaar | Geen grens |
| Opslag | Google Sheets | Netlify Blobs |
| Kosten | Gratis | Gratis (Blobs: 1 GB gratis) |
| Snelheid | Traag (Apps Script boot) | Snel (Edge functions) |
| Deployment | Via Google Scripts | Via Netlify CLI / GitHub |
