import { verifyBusiness } from './verificador.js';

const [,, city, category, maxArg] = process.argv;

const maxResults = Math.min(
  Math.max(Number(maxArg) || 30, 1),
  100
);

if (!city || !category) {
  console.error(
    'Usage: npm run discover -- "Saskatoon" "auto detailing" [30]'
  );
  process.exit(1);
}

const OVERPASS_URL =
  'https://overpass-api.de/api/interpreter';

const NOMINATIM_URL =
  'https://nominatim.openstreetmap.org/search';

const headers = {
  'user-agent': 'ProspectAI/0.2'
};

async function geocodeCity(name) {
  const url = new URL(NOMINATIM_URL);

  url.searchParams.set('q', name);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Nominatim ${response.status}`);
  }

  const data = await response.json();

  if (!data.length) {
    throw new Error(`City not found: ${name}`);
  }

  return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon),
    displayName: data[0].display_name
  };
}

function normalize(element) {
  const tags = element.tags || {};
  const center = element.center || element;

  return {
    osmId: `${element.type}/${element.id}`,

    name: tags.name || null,

    category:
      tags.shop ||
      tags.craft ||
      tags.amenity ||
      tags.office ||
      tags.service ||
      null,

    address: [
      tags['addr:housenumber'],
      tags['addr:street'],
      tags['addr:city'],
      tags['addr:postcode']
    ]
      .filter(Boolean)
      .join(', ') || null,

    phone:
      tags.phone ||
      tags['contact:phone'] ||
      null,

    website:
      tags.website ||
      tags['contact:website'] ||
      tags.url ||
      null,

    latitude: Number(center.lat),
    longitude: Number(center.lon),

    source: 'OpenStreetMap'
  };
}

function matches(place, query) {
  const text = [
    place.name,
    place.category,
    place.address
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9À-ÿ]+/gi, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3);

  return (
    words.length === 0 ||
    words.some(word => text.includes(word))
  );
}

async function discover(location) {
  const query = `
[out:json][timeout:60];
(
  nwr["name"](around:30000,${location.lat},${location.lon});
);
out center tags;
`;

  const response = await fetch(
    OVERPASS_URL,
    {
      method: 'POST',

      headers: {
        ...headers,
        'content-type': 'text/plain'
      },

      body: query
    }
  );

  if (!response.ok) {
    throw new Error(
      `Overpass ${response.status}: ${await response.text()}`
    );
  }

  const data = await response.json();

  return (data.elements || [])
    .map(normalize)
    .filter(place => place.name)
    .filter(place => matches(place, category));
}

const location = await geocodeCity(city);

const places = await discover(location);

const unique = [];

const seen = new Set();

for (const place of places) {
  const key =
    `${place.name.toLowerCase()}|${place.address || ''}`;

  if (seen.has(key)) {
    continue;
  }

  seen.add(key);

  unique.push(place);

  if (unique.length >= maxResults) {
    break;
  }
}

const results = [];

for (const place of unique) {
  let verification;

  if (place.website) {
    verification = {
      status: 'WEBSITE_LISTED',
      confidence: 1,
      domain: null,
      website: place.website,

      evidence: [
        {
          source: 'OpenStreetMap',
          website: place.website
        }
      ]
    };
  } else {
    verification = await verifyBusiness({
      name: place.name,
      city
    });
  }

  results.push({
    ...place,
    ...verification,

    prospect:
      verification.status === 'NO_DOMAIN_FOUND'
  });
}

console.log(
  JSON.stringify(
    {
      query: {
        city,
        category,
        maxResults
      },

      location,

      totals: {
        discovered: results.length,

        prospects:
          results.filter(
            x => x.prospect
          ).length,

        websitesFound:
          results.filter(
            x =>
              [
                'WEBSITE_LISTED',
                'WEBSITE_FOUND'
              ].includes(x.status)
          ).length,

        uncertain:
          results.filter(
            x => x.status === 'UNCERTAIN'
          ).length
      },

      prospects:
        results.filter(
          x => x.prospect
        ),

      allResults: results
    },
    null,
    2
  )
);
