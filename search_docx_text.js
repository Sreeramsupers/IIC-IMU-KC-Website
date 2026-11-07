const fs = require('fs');

const xml = fs.readFileSync('temp_document.xml', 'utf8');

// Strip XML tags to see clean text
const text = xml.replace(/<[^>]+>/g, '');
fs.writeFileSync('temp_docx_text.txt', text);
console.log('Clean text length:', text.length);

const placeholders = text.match(/\{\{[^\}]+\}\}/g) || [];
console.log('Placeholders found:', [...new Set(placeholders)]);

// Search for problem sections
const lines = text.split('\n').filter(l => l.trim().length > 0);
lines.forEach((line, idx) => {
  if (/problem|campus|maritime|society|ecosystem/i.test(line)) {
    console.log(`Line ${idx}: ${line.trim()}`);
  }
});
