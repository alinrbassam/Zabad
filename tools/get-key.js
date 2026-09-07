const crypto = require('crypto');

const SECRET = 'ZABAD-MASTER-LICENSE-SECRET-2026';

function deriveActivationKey(deviceId) {
  const clean = String(deviceId || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (!clean || clean.length < 4) {
    throw new Error('Device code must be at least 4 alphanumeric characters.');
  }
  const hash = crypto
    .createHmac('sha256', SECRET)
    .update(clean)
    .digest('hex')
    .toUpperCase()
    .substring(0, 16);
  return 'ZBD-' + (hash.match(/.{1,4}/g)?.join('-') || hash);
}

const input = process.argv[2];

if (!input) {
  console.log(`
=====================================================
  🔑 ZABAD POS — ACTIVATION KEY GENERATOR
=====================================================

Usage:
  node tools/get-key.js <DEVICE_CODE>

Example:
  node tools/get-key.js 0A8C-C757-AB58-DD12
=====================================================
`);
  process.exit(1);
}

try {
  const key = deriveActivationKey(input);
  console.log(`
=====================================================
  🔑 ZABAD POS — ACTIVATION KEY
=====================================================
  Device Code:     ${input.trim().toUpperCase()}
  Activation Key:  ${key}
=====================================================
  👉 Copy & paste this key to your customer on WhatsApp:
     ${key}
=====================================================
`);
} catch (e) {
  console.error('ERROR:', e.message);
  process.exit(1);
}
