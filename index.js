import { verifyBusiness } from './verifier.js';

const [,, name, city, ...knownDomains] = process.argv;

if (!name || !city) {
  console.error('Usage: npm run check -- "Business Name" "City" [known-domain ...]');
  process.exit(1);
}

const result = await verifyBusiness({ name, city, knownDomains });
console.log(JSON.stringify({ business: name, city, ...result }, null, 2));
