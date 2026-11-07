const fs = require('fs');
const path = require('path');
const docxFile = fs.readdirSync('.').find(f => f.endsWith('.docx'));
console.log('Found docx:', docxFile);
const buf = fs.readFileSync(docxFile);
const str = buf.toString('binary');
const matches = str.match(/\{\{[a-zA-Z0-9_-]+\}\}/g);
console.log('Placeholders found in binary:', [...new Set(matches)]);
