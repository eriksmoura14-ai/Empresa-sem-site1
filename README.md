# Prospect AI — V2

Automated discovery + website/domain verification.

## V2

The program can search Google Places for a city + niche, collect public business information, discard businesses where Google already exposes a website, and then verify likely domains for the remaining candidates.

Absence of a website in Google Places is **not** treated as proof. Uncertain cases stay uncertain.

## Requirements

- Node.js 20+
- Google Places API (New) enabled
- `GOOGLE_MAPS_API_KEY`

Install:

```bash
npm install
```

Set your API key.

Linux/macOS:

```bash
export GOOGLE_MAPS_API_KEY="YOUR_KEY"
```

PowerShell:

```powershell
$env:GOOGLE_MAPS_API_KEY="YOUR_KEY"
```

Run discovery:

```bash
npm run discover -- "Saskatoon" "auto detailing" 20
```

Run the original verifier:

```bash
npm run check -- "Details Auto Services" "Saskatoon"
```

## Statuses

- `DISCARD_WEBSITE_FOUND`: Google already returned a website.
- `CANDIDATE_NO_WEBSITE_FOUND`: no website returned and no likely domain responded.
- `UNCERTAIN`: a domain/DNS signal exists but a current site could not be confirmed.
- `WEBSITE_FOUND`: a likely domain returned an accessible website.

A candidate is still a candidate, not proof of non-existence. Human review remains the final gate before outreach.
