const fs = require('fs');
const zlib = require('zlib');
const buf = fs.readFileSync('shashwat_application.pdf');

let pos = 0;
let textParts = [];

while (true) {
  let streamIdx = buf.indexOf('stream', pos);
  if (streamIdx === -1) break;
  let dataStart = streamIdx + 6;
  if (buf[dataStart] === 0x0d) dataStart++;
  if (buf[dataStart] === 0x0a) dataStart++;
  
  let streamEnd = buf.indexOf('endstream', dataStart);
  if (streamEnd === -1) break;
  
  // Trim trailing \r\n before endstream
  let end = streamEnd;
  if (buf[end - 1] === 0x0a) end--;
  if (buf[end - 1] === 0x0d) end--;
  
  const chunk = buf.slice(dataStart, end);
  try {
    const uncompressed = zlib.inflateSync(chunk).toString('latin1');
    textParts.push(uncompressed);
  } catch (e) {
    try {
      const uncompressedRaw = zlib.inflateRawSync(chunk).toString('latin1');
      textParts.push(uncompressedRaw);
    } catch (_) {}
  }
  pos = streamEnd + 9;
}

const fullText = textParts.join('\n');
console.log('Extracted stream text length:', fullText.length);
fs.writeFileSync('pdf_extracted_streams.txt', fullText);

// Find TJ or Tj
const tjRegex = /\[(.*?)\]\s*TJ|\((.*?)\)\s*Tj/g;
let m;
let lines = [];
while ((m = tjRegex.exec(fullText)) !== null) {
  lines.push(m[1] || m[2]);
}
console.log('Lines found:', lines.length);
console.log(lines.slice(0, 30).join(' | '));
