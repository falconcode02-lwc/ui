const fs = require('fs');
const pkg = require('./package.json');

fs.writeFileSync(
  'src/version.json',
  JSON.stringify({ version: pkg.version, date: new Date().toISOString() }, null, 2)
);

console.log(`📝 Wrote version ${pkg.version} to src/version.json`);
