const fs = require('fs');

function parseCSV(text) {
	const rows = [];
	let currentRow = [];
	let currentField = '';
	let inQuotes = false;

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		const nextChar = text[i + 1];

		if (inQuotes) {
			if (char === '"' && nextChar === '"') {
				currentField += '"';
				i++;
			} else if (char === '"') {
				inQuotes = false;
			} else {
				currentField += char;
			}
		} else {
			if (char === '"') {
				inQuotes = true;
			} else if (char === ',') {
				currentRow.push(currentField);
				currentField = '';
			} else if (char === '\r') {
				if (nextChar === '\n') i++;
				currentRow.push(currentField);
				currentField = '';
				rows.push(currentRow);
				currentRow = [];
			} else if (char === '\n') {
				currentRow.push(currentField);
				currentField = '';
				rows.push(currentRow);
				currentRow = [];
			} else {
				currentField += char;
			}
		}
	}

	if (currentField || currentRow.length > 0) {
		currentRow.push(currentField);
		rows.push(currentRow);
	}

	return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

const csv = fs.readFileSync('temp_sheet.csv', 'utf8');
const rows = parseCSV(csv);
console.log('Total rows:', rows.length);
console.log('Headers (count=' + rows[0].length + '):');
rows[0].forEach((h, i) => console.log(i, ':', h));

for (let i = 1; i <= Math.min(8, rows.length - 1); i++) {
	const r = rows[i];
	console.log('\n--- Row ' + i + ': ' + r[2] + ' (' + r[1] + ') ---');
	console.log('Col 23 (Leadership):', r[23]);
	console.log('Col 24 (Leadership Details):', r[24]);
	console.log('Col 25 (Problem Maritime/Univ):', r[25]);
	console.log('Col 26 (Problem Society):', r[26]);
	console.log('Col 27 (Interests):', r[27]);
}
