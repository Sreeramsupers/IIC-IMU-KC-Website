const fs = require('fs');
const zlib = require('zlib');

const docx = fs.readdirSync('.').find(f => f.endsWith('.docx'));
const buf = fs.readFileSync(docx);

// In zip format, local file header starts with 0x04034b50
let offset = 0;
while (offset < buf.length - 30) {
  if (buf.readUInt32LE(offset) === 0x04034b50) {
    const compMethod = buf.readUInt16LE(offset + 8);
    const compSize = buf.readUInt32LE(offset + 18);
    const uncompSize = buf.readUInt32LE(offset + 22);
    const fnLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const fn = buf.toString('utf8', offset + 30, offset + 30 + fnLen);
    const dataStart = offset + 30 + fnLen + extraLen;
    if (fn === 'word/document.xml') {
      const compData = buf.slice(dataStart, dataStart + compSize);
      const xml = zlib.inflateRawSync(compData).toString('utf8');
      fs.writeFileSync('temp_document.xml', xml);
      console.log('Successfully wrote temp_document.xml, size:', xml.length);
      break;
    }
    offset = dataStart + compSize;
  } else {
    offset++;
  }
}
