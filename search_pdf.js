const fs = require('fs');
const text = fs.readFileSync('pdf_extracted_streams.txt', 'latin1');

const idx = text.indexOf('15.');
console.log('Index of "15.":', idx);
if (idx !== -1) {
  console.log(text.slice(idx, idx + 400));
} else {
  // search for "Ecosystem"
  const ecoIdx = text.indexOf('Ecosystem');
  console.log('Index of "Ecosystem":', ecoIdx);
  if (ecoIdx !== -1) {
    console.log(text.slice(ecoIdx - 100, ecoIdx + 300));
  }
}
