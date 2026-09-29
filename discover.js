import { verifyBusiness } from './verificador.js';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error(
    'Missing GOOGLE_MAPS_API_KEY. Set it before running discover.'
  );
  process.exit(1);
}

const [,, city, category, maxArg] = process.argv;

const maxResults = Math.min(
  Math.max(Number(maxArg) || 20, 1),
  20
);

if (!city || !category) {
  console.error(
    'Usage: npm run discover -- "Saskatoon" "auto detailing" [20]'
  );
  process.exit(1);
}

async function searchPlaces() {
  const response = await fetch(
    'https://places.googleapis.com/v1/places:searchText',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.businessStatus'
      },
      body: JSON.stringify({
        textQuery: `${category} in ${city}`,
        languageCode: 'en',
        maxResultCount: maxResults
      })
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Places API ${response.status}: ${body}`
    );
  }

  return (await response.json()).places ?? [];
}

const places = await searchPlaces();
const results = [];

for (const place of places) {
  const name = place.displayName?.text;

  if (!name) continue;

  if (place.websiteUri) {
    results.push({
      name,
      city,
      category,
      address: place.formattedAddress ?? null,
      rating: place.rating ?? null,
      reviewCount: place.userRatingCount ?? 0,
      phone: place.nationalPhoneNumber ?? null,
      website: place.websiteUri,
      status: 'DISCARD_WEBSITE_FOUND',
      confidence: 0.99,
      mapsUrl: place.googleMapsUri ?? null
    });

    continue;
  }

  const verification = await verifyBusiness({
    name,
    city
  });

  results.push({
    name,
    city,
    category,
    address: place.formattedAddress ?? null,
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? 0,
    phone: place.nationalPhoneNumber ?? null,
    mapsUrl: place.googleMapsUri ?? null,
    ...verification,

    status:
      verification.status === 'NO_DOMAIN_FOUND'
        ? 'CANDIDATE_NO_WEBSITE_FOUND'
        : verification.status
  });
}

const prospects = results.filter(
  x => x.status === 'CANDIDATE_NO_WEBSITE_FOUND'
);

console.log(
  JSON.stringify(
    {
      query: {
        city,
        category,
        maxResults
      },

      totals: {
        found: results.length,
        candidates: prospects.length
      },

      results
    },
    null,
    2
  )
);
