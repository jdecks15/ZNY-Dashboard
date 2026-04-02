# ZNY ARTCC Virtual Controller Dashboard

A radar-room aesthetic reference tool for VATSIM virtual ATC controllers at New York ARTCC (ZNY).

## Features

- **Dashboard** — Live METAR weather for ZNY airports, upcoming ZNY events, local weather
- **NY Center** — Crossing restrictions for Areas A–F (draggable, collapsible panels)
- **ZNY Majors** — IFR & VFR departure procedures for JFK, LGA, EWR, PHL
- **ZNY Minors** — Departure procedures for minor airports in the ZNY area
- **Routes** — Live FAA preferred routes + VATSIM filed routes by airport pair
- **Roster** — Full ZNY controller roster with certifications
- **PRD** — Preferred Route Database launch

## Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (for local dev)
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) (optional, for local testing)

### Deploy to Netlify

1. Fork or clone this repo
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from GitHub**
3. Select this repo
4. Build settings are auto-detected from `netlify.toml` — no changes needed
5. Click **Deploy**

Your site will be live at `https://your-site-name.netlify.app`

### Local Development

```bash
npm install -g netlify-cli
netlify dev
```

Then open `http://localhost:8888`

## Project Structure

```
zny-dashboard/
├── index.html                  # Single-file dashboard app
├── netlify.toml                # Netlify build + redirect config
└── netlify/
    └── functions/
        └── routes.js           # Serverless proxy for FAA + VATSIM APIs
```

## API Sources

| Source | Data |
|--------|------|
| [FAA Route Management Tool](https://www.fly.faa.gov/rmt/) | Official preferred IFR routes |
| [VATSIM Data Feed](https://data.vatsim.net/) | Live filed flight plans on VATSIM |
| [Open-Meteo](https://open-meteo.com/) | Local weather (Washingtonville, NY) |
| [VATSIM METAR API](https://metar.vatsim.net/) | Airport METARs |
| [VATSIM Events API](https://my.vatsim.net/) | Upcoming ZNY events |

## Notes

- For simulation/virtual ATC use only — not for real-world flight operations
- Route data reflects currently online VATSIM traffic — busier pairs yield more results
- FAA preferred routes data sourced from fly.faa.gov and updated each AIRAC cycle
- Roster data sourced from [nyartcc.org/roster](https://www.nyartcc.org/roster)
