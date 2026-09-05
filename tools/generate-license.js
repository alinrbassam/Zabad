const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace(/^--/, '');
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      params[key] = val;
    }
  }
  return params;
}

const params = parseArgs();

if (!params.device) {
  console.log(`
=====================================================
  🐟 ZABAD POS — LICENSE GENERATOR TOOL
=====================================================

Usage:
  node tools/generate-license.js --device <DEVICE_ID> [options]

Required:
  --device <ID>        Device Activation Code (e.g. 0A8C-C757-AB58-DD12)

Options:
  --customer <name>    Customer name (e.g. "Ahmed Al-Sayed")
  --business <name>    Business name (e.g. "Poissonnerie Zabad")
  --type <type>        Lifetime (default) | Subscription
  --days <number>      Valid days (required if type is Subscription, e.g. 365)
  --out <filepath>     Output file path (default: license_<deviceId>.zabad)

Examples:
  node tools/generate-license.js --device 0A8C-C757-AB58-DD12 --customer "Ahmed" --business "Zabad Fish"
  node tools/generate-license.js --device 0A8C-C757-AB58-DD12 --type Subscription --days 365
=====================================================
`);
  process.exit(1);
}

const privateKeyPath = path.resolve(__dirname, '../crypto-keys/private.key');
if (!fs.existsSync(privateKeyPath)) {
  console.error('ERROR: private.key not found in crypto-keys/. Run "node tools/generate-keys.js" first.');
  process.exit(1);
}

const privateKeyPem = fs.readFileSync(privateKeyPath, 'utf8');

// Normalize device ID (remove hyphens, spaces, uppercase)
const rawDevice = String(params.device).trim().toUpperCase();
const cleanDeviceId = rawDevice.replace(/[^A-Z0-9]/g, '');

if (cleanDeviceId.length < 8) {
  console.error('ERROR: Invalid device ID. Must be at least 8 alphanumeric characters.');
  process.exit(1);
}

const customerName = params.customer || 'Client Zabad';
const businessName = params.business || 'Poissonnerie Zabad';
const licenseType = params.type && params.type.toLowerCase() === 'subscription' ? 'Subscription' : 'Lifetime';

let expirationDate = null;
if (licenseType === 'Subscription') {
  const days = parseInt(params.days, 10) || 365;
  const exp = new Date();
  exp.setDate(exp.getDate() + days);
  expirationDate = exp.toISOString();
}

const licenseKey = `ZBD-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
const issueDate = new Date().toISOString();

const licenseData = {
  licenseKey,
  customerName,
  businessName,
  deviceId: cleanDeviceId,
  licenseType,
  issueDate,
  expirationDate,
  enabledModules: ['pos', 'inventory', 'purchasing', 'expenses', 'reports', 'settings'],
  version: 2
};

// Canonical JSON for signing
const dataToSign = Buffer.from(JSON.stringify(licenseData));
const signature = crypto.sign(null, dataToSign, privateKeyPem).toString('base64');

const outputObject = {
  app: 'Zabad POS',
  format: 'zabad-license-v2',
  license: licenseData,
  signature
};

const outputContent = JSON.stringify(outputObject, null, 2);

const defaultFilename = `license_${cleanDeviceId.substring(0, 8)}.zabad`;
const outputPath = params.out ? path.resolve(params.out) : path.resolve(process.cwd(), defaultFilename);

fs.writeFileSync(outputPath, outputContent, 'utf8');

console.log(`
=====================================================
  ✅ LICENSE FILE GENERATED SUCCESSFULLY!
=====================================================
  Output File:   ${outputPath}
  Device ID:     ${cleanDeviceId}
  Customer:      ${customerName}
  Business:      ${businessName}
  License Type:  ${licenseType}
  Expiration:    ${expirationDate ? expirationDate : 'Never (Lifetime)'}
  License Key:   ${licenseKey}
=====================================================
  👉 Send this file (${path.basename(outputPath)}) to your customer.
  They can import it in Zabad POS to activate the software.
=====================================================
`);
