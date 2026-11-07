const fs = require('fs');

fetch('https://drive.google.com/uc?export=download&id=1n5eq6TTUgQdwhWy4GqF93hljsO1Mt0bT')
.then(r => r.arrayBuffer())
.then(ab => {
  const buf = Buffer.from(ab);
  fs.writeFileSync('shashwat_application.pdf', buf);
  console.log('Downloaded pdf, size:', buf.length);
  // find strings in pdf stream
  const str = buf.toString('binary');
  // Look for "15." or "Problem" or "maritime"
  const matches = str.match(/15\..{0,200}/g);
  console.log('Matches for 15.:', matches);
  // search for "Women Safety"
  console.log('Contains Women Safety?:', str.includes('Women Safety'));
  // search for "NIL"
  console.log('Occurrences of NIL:', (str.match(/NIL/g) || []).length);
})
.catch(console.error);
