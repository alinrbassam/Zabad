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
  🚫 ZABAD POS — LICENSE REVOCATION INSTRUCTIONS
=====================================================

How to remotely revoke a customer's license:

Method 1: Via Vercel Environment Variable (Instant Remote Revocation)
  1. Open your Vercel Dashboard -> Project "Zabad"
  2. Go to Settings -> Environment Variables
  3. Add or update variable:
     Key:    REVOKED_DEVICES
     Value:  <DEVICE_CODE_1>,<DEVICE_CODE_2>
     Example: 0A8C-C757-AB58-DD12
  4. Save & Redeploy.
  👉 The very next time the customer's POS syncs with the cloud,
     it will automatically receive the revocation command and
     instantly lock down the application!

Method 2: Query / Show device normalization
  node tools/revoke-license.js --device <DEVICE_CODE>
=====================================================
`);
  process.exit(0);
}

const clean = String(params.device).replace(/[^A-Z0-9]/gi, '').toUpperCase();
console.log(`
=====================================================
  🚫 REVOCATION ENTRY FOR VERCEL
=====================================================
  Raw Input:       ${params.device}
  Normalized ID:   ${clean}
  
  To revoke, add to Vercel Environment Variables:
  REVOKED_DEVICES = ${clean}
=====================================================
`);
