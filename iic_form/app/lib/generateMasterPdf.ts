import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface CadetFormData {
	cadetName: string;
	regNumber: string;
	yearOfStudy: string;
	department: string;
	semester: string;
	gender: string;
	email: string;
	phone: string;
	photoName?: string;
	photoDataUrl?: string;

	cgpa?: string;
	marksheetStatus?: string;
	marksheetName?: string;
	marksheetDataUrl?: string;

	hasJournalPub?: boolean;
	journalDetails?: string;
	journalFileName?: string;
	journalFileDataUrl?: string;

	hasPatents?: boolean;
	patentDetails?: string;
	patentFileName?: string;
	patentFileDataUrl?: string;

	hasCompetitions?: boolean;
	competitionDetails?: string;
	competitionFileName?: string;
	competitionFileDataUrl?: string;

	hasActivities?: boolean;
	activityDetails?: string;
	activityFileName?: string;
	activityFileDataUrl?: string;

	hasAchievements?: boolean;
	achievementDetails?: string;
	achievementFileName?: string;
	achievementFileDataUrl?: string;

	hasLeadership?: boolean;
	leadershipDetails?: string;
	leadershipFileName?: string;
	leadershipFileDataUrl?: string;

	problemMaritime?: string;
	problemSociety?: string;
	areasOfInterest?: string[];
	customInterest?: string;

	hasResume?: boolean;
	resumeName?: string;
	resumeDataUrl?: string;

	declarationAccepted?: boolean;
}

export interface AttachmentItem {
	name: string;
	dataUrl: string;
}

function sanitizePdfText(str?: string): string {
	if (!str) return '';
	return str
		.replace(/[\u2018\u2019]/g, "'")
		.replace(/[\u201C\u201D]/g, '"')
		.replace(/[\u2013\u2014]/g, '-')
		.replace(/[\u2022]/g, '-')
		.replace(/[^\x00-\x7F]/g, '');
}

function wrapText(
	text: string,
	font: any,
	fontSize: number,
	maxWidth: number,
): string[] {
	if (!text) return [];
	const clean = sanitizePdfText(text);
	const words = clean.replace(/\r\n/g, '\n').split(/\s+/);
	const lines: string[] = [];
	let currentLine = '';

	for (const word of words) {
		const testLine = currentLine ? `${currentLine} ${word}` : word;
		const testWidth = font.widthOfTextAtSize(testLine, fontSize);
		if (testWidth <= maxWidth) {
			currentLine = testLine;
		} else {
			if (currentLine) lines.push(currentLine);
			currentLine = word;
		}
	}
	if (currentLine) lines.push(currentLine);
	return lines;
}

function base64ToUint8Array(base64: string): Uint8Array {
	const clean = base64.replace(/^data:[^;]+;base64,/, '').trim();
	if (typeof window !== 'undefined' && typeof window.atob === 'function') {
		const binaryString = window.atob(clean);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		return bytes;
	} else {
		return new Uint8Array(Buffer.from(clean, 'base64'));
	}
}

function uint8ArrayToDataUrl(
	bytes: Uint8Array,
	mimeType: string = 'application/pdf',
): string {
	if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
		let binary = '';
		const chunkSize = 8192;
		for (let i = 0; i < bytes.length; i += chunkSize) {
			const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
			binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
		}
		return `data:${mimeType};base64,${window.btoa(binary)}`;
	} else {
		return `data:${mimeType};base64,${Buffer.from(bytes).toString('base64')}`;
	}
}

/**
 * Builds the complete unified Master PDF combining:
 * 1. The Official Cadet Application Form (Pages 1 & 2) with identity, answers, photo, and declaration.
 * 2. Uploaded Resume / CV PDF (if present).
 * 3. All Uploaded Certificate & Marksheet Proofs (PDF or Images).
 */
export async function generateMasterCombinedPdf(
	formData: CadetFormData,
	referenceId: string,
	attachments: AttachmentItem[],
): Promise<{
	mergedDataUrl: string;
	totalPages: number;
	attachedCount: number;
}> {
	const masterDoc = await PDFDocument.create();
	const fontReg = await masterDoc.embedFont(StandardFonts.Helvetica);
	const fontBold = await masterDoc.embedFont(StandardFonts.HelveticaBold);
	const fontItalic = await masterDoc.embedFont(StandardFonts.HelveticaOblique);

	const navy = rgb(10 / 255, 30 / 255, 56 / 255);
	const sky = rgb(2 / 255, 132 / 255, 199 / 255);
	const gold = rgb(217 / 255, 119 / 255, 6 / 255);
	const textDark = rgb(15 / 255, 23 / 255, 42 / 255);
	const textMuted = rgb(71 / 255, 85 / 255, 105 / 255);
	const borderGray = rgb(226 / 255, 232 / 255, 240 / 255);
	const bgLight = rgb(248 / 255, 250 / 255, 252 / 255);
	const green = rgb(5 / 255, 150 / 255, 105 / 255);

	const pageWidth = 595.28;
	const pageHeight = 841.89;
	const margin = 36;
	const contentWidth = pageWidth - margin * 2;

	// ==============================================================
	// PAGE 1: CADET PROFILE & ACADEMIC/RESEARCH PROFILE (Q1 - Q11)
	// ==============================================================
	const page1 = masterDoc.addPage([pageWidth, pageHeight]);

	// Top Institutional Header
	page1.drawRectangle({
		x: 0,
		y: pageHeight - 52,
		width: pageWidth,
		height: 52,
		color: navy,
	});
	page1.drawRectangle({
		x: 0,
		y: pageHeight - 56,
		width: pageWidth,
		height: 4,
		color: gold,
	});

	page1.drawText('INDIAN MARITIME UNIVERSITY - KOLKATA CAMPUS', {
		x: margin,
		y: pageHeight - 24,
		size: 11,
		font: fontBold,
		color: rgb(1, 1, 1),
	});

	page1.drawText(
		"INSTITUTION'S INNOVATION COUNCIL (IIC) 2026-27 • CADET ENROLLMENT FORM",
		{
			x: margin,
			y: pageHeight - 42,
			size: 8.5,
			font: fontBold,
			color: rgb(186 / 255, 230 / 255, 253 / 255),
		},
	);

	// Ref ID & Date Banner
	let y = pageHeight - 78;
	page1.drawRectangle({
		x: margin,
		y: y - 8,
		width: contentWidth,
		height: 22,
		color: bgLight,
		borderColor: borderGray,
		borderWidth: 1,
	});
	page1.drawText('APPLICATION REF: ', {
		x: margin + 8,
		y: y,
		size: 8,
		font: fontBold,
		color: navy,
	});
	page1.drawText(sanitizePdfText(referenceId), {
		x: margin + 95,
		y: y,
		size: 8.5,
		font: fontBold,
		color: sky,
	});

	const subDate = new Date().toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	});
	page1.drawText(`DATE: ${subDate}`, {
		x: pageWidth - margin - 115,
		y: y,
		size: 8,
		font: fontBold,
		color: textDark,
	});

	// Section 1 Header
	y -= 26;
	page1.drawRectangle({
		x: margin,
		y: y - 4,
		width: contentWidth,
		height: 18,
		color: rgb(240 / 255, 249 / 255, 255 / 255),
		borderColor: rgb(186 / 255, 230 / 255, 253 / 255),
		borderWidth: 1,
	});
	page1.drawText('SECTION 1: CADET PROFILE & ACADEMIC IDENTITY (Q1 - Q7)', {
		x: margin + 8,
		y: y + 1,
		size: 8.5,
		font: fontBold,
		color: navy,
	});

	// Cadet Passport Photo (Top Right)
	const photoWidth = 72;
	const photoHeight = 88;
	const photoX = pageWidth - margin - photoWidth - 6;
	const photoY = y - 98;

	let photoEmbedded = false;
	if (formData.photoDataUrl) {
		try {
			const imgBytes = base64ToUint8Array(formData.photoDataUrl);
			let embeddedImg;
			if (formData.photoDataUrl.includes('image/png')) {
				embeddedImg = await masterDoc.embedPng(imgBytes);
			} else {
				embeddedImg = await masterDoc.embedJpg(imgBytes);
			}
			page1.drawImage(embeddedImg, {
				x: photoX,
				y: photoY,
				width: photoWidth,
				height: photoHeight,
			});
			photoEmbedded = true;
		} catch (e) {
			console.warn('Could not embed photo in master PDF:', e);
		}
	}

	if (!photoEmbedded) {
		page1.drawRectangle({
			x: photoX,
			y: photoY,
			width: photoWidth,
			height: photoHeight,
			color: bgLight,
			borderColor: borderGray,
			borderWidth: 1,
		});
		page1.drawText('[ PASSPORT', {
			x: photoX + 10,
			y: photoY + 48,
			size: 7.5,
			font: fontBold,
			color: textMuted,
		});
		page1.drawText('PHOTO ]', {
			x: photoX + 18,
			y: photoY + 36,
			size: 7.5,
			font: fontBold,
			color: textMuted,
		});
	}

	// Section 1 Field Rows
	const sec1Width = contentWidth - photoWidth - 16;
	const leftColX = margin + 8;
	const midColX = margin + sec1Width / 2 + 8;

	y -= 22;
	page1.drawText('1. Name of the Cadet:', {
		x: leftColX,
		y,
		size: 7.5,
		font: fontBold,
		color: textMuted,
	});
	page1.drawText(
		sanitizePdfText(formData.cadetName || 'N/A').toUpperCase(),
		{
			x: leftColX + 90,
			y,
			size: 8.5,
			font: fontBold,
			color: navy,
		},
	);

	y -= 16;
	page1.drawText('2. Year of Study:', {
		x: leftColX,
		y,
		size: 7.5,
		font: fontBold,
		color: textMuted,
	});
	page1.drawText(sanitizePdfText(formData.yearOfStudy || 'N/A'), {
		x: leftColX + 90,
		y,
		size: 8,
		font: fontReg,
		color: textDark,
	});

	page1.drawText('3. Reg / Serial No:', {
		x: midColX,
		y,
		size: 7.5,
		font: fontBold,
		color: textMuted,
	});
	page1.drawText(sanitizePdfText(formData.regNumber || 'N/A'), {
		x: midColX + 85,
		y,
		size: 8,
		font: fontBold,
		color: navy,
	});

	y -= 16;
	page1.drawText('4. Current Semester:', {
		x: leftColX,
		y,
		size: 7.5,
		font: fontBold,
		color: textMuted,
	});
	page1.drawText(sanitizePdfText(formData.semester || 'N/A'), {
		x: leftColX + 90,
		y,
		size: 8,
		font: fontReg,
		color: textDark,
	});

	page1.drawText('5. Department:', {
		x: midColX,
		y,
		size: 7.5,
		font: fontBold,
		color: textMuted,
	});
	page1.drawText(sanitizePdfText(formData.department || 'N/A'), {
		x: midColX + 85,
		y,
		size: 8,
		font: fontReg,
		color: textDark,
	});

	y -= 16;
	page1.drawText('6. Gender:', {
		x: leftColX,
		y,
		size: 7.5,
		font: fontBold,
		color: textMuted,
	});
	page1.drawText(sanitizePdfText(formData.gender || 'N/A'), {
		x: leftColX + 90,
		y,
		size: 8,
		font: fontReg,
		color: textDark,
	});

	page1.drawText('7. Mobile Number:', {
		x: midColX,
		y,
		size: 7.5,
		font: fontBold,
		color: textMuted,
	});
	page1.drawText(sanitizePdfText(formData.phone || 'N/A'), {
		x: midColX + 85,
		y,
		size: 8,
		font: fontReg,
		color: textDark,
	});

	y -= 16;
	page1.drawText('Official Email Address:', {
		x: leftColX,
		y,
		size: 7.5,
		font: fontBold,
		color: textMuted,
	});
	page1.drawText(sanitizePdfText(formData.email || 'N/A'), {
		x: leftColX + 90,
		y,
		size: 8,
		font: fontReg,
		color: textDark,
	});

	// Section 2 Header
	y -= 30;
	page1.drawRectangle({
		x: margin,
		y: y - 4,
		width: contentWidth,
		height: 18,
		color: rgb(240 / 255, 249 / 255, 255 / 255),
		borderColor: rgb(186 / 255, 230 / 255, 253 / 255),
		borderWidth: 1,
	});
	page1.drawText('SECTION 2: ACADEMIC & RESEARCH PROFILE (Q8 - Q11)', {
		x: margin + 8,
		y: y + 1,
		size: 8.5,
		font: fontBold,
		color: navy,
	});

	// Q8: CGPA
	y -= 22;
	page1.drawText('8. Current CGPA:', {
		x: leftColX,
		y,
		size: 7.5,
		font: fontBold,
		color: navy,
	});
	const cgpaDisplay =
		formData.yearOfStudy === '1st Year'
			? 'Exempted (1st Year Cadet)'
			: formData.cgpa || 'N/A';
	page1.drawText(sanitizePdfText(cgpaDisplay), {
		x: leftColX + 110,
		y,
		size: 8,
		font: fontBold,
		color: textDark,
	});
	if (formData.marksheetName) {
		page1.drawText(
			`[ Marksheet Proof: ${sanitizePdfText(formData.marksheetName)} ]`,
			{
				x: leftColX + 250,
				y,
				size: 7.5,
				font: fontItalic,
				color: green,
			},
		);
	}

	// Q9: Journal / Book Chapter
	y -= 18;
	page1.drawText('9. Journal / Book Chapter Publications:', {
		x: leftColX,
		y,
		size: 7.5,
		font: fontBold,
		color: navy,
	});
	page1.drawText(formData.hasJournalPub ? 'YES (Attached)' : 'NIL', {
		x: leftColX + 190,
		y,
		size: 7.5,
		font: fontBold,
		color: formData.hasJournalPub ? green : textMuted,
	});
	if (formData.hasJournalPub && formData.journalDetails) {
		const pubLines = wrapText(
			formData.journalDetails,
			fontReg,
			7.5,
			contentWidth - 24,
		);
		for (const line of pubLines.slice(0, 3)) {
			y -= 12;
			page1.drawText(`• ${line}`, {
				x: leftColX + 8,
				y,
				size: 7.5,
				font: fontReg,
				color: textDark,
			});
		}
	}

	// Q10: Patents / IPR
	y -= 18;
	page1.drawText('10. Patents / Design Registrations / IPR:', {
		x: leftColX,
		y,
		size: 7.5,
		font: fontBold,
		color: navy,
	});
	page1.drawText(formData.hasPatents ? 'YES (Attached)' : 'NIL', {
		x: leftColX + 190,
		y,
		size: 7.5,
		font: fontBold,
		color: formData.hasPatents ? green : textMuted,
	});
	if (formData.hasPatents && formData.patentDetails) {
		const patLines = wrapText(
			formData.patentDetails,
			fontReg,
			7.5,
			contentWidth - 24,
		);
		for (const line of patLines.slice(0, 3)) {
			y -= 12;
			page1.drawText(`• ${line}`, {
				x: leftColX + 8,
				y,
				size: 7.5,
				font: fontReg,
				color: textDark,
			});
		}
	}

	// Q11: Competitions / Hackathons
	y -= 18;
	page1.drawText('11. Competitions / Hackathons / Technothons:', {
		x: leftColX,
		y,
		size: 7.5,
		font: fontBold,
		color: navy,
	});
	page1.drawText(formData.hasCompetitions ? 'YES (Attached)' : 'NIL', {
		x: leftColX + 190,
		y,
		size: 7.5,
		font: fontBold,
		color: formData.hasCompetitions ? green : textMuted,
	});
	if (formData.hasCompetitions && formData.competitionDetails) {
		const compLines = wrapText(
			formData.competitionDetails,
			fontReg,
			7.5,
			contentWidth - 24,
		);
		for (const line of compLines.slice(0, 3)) {
			y -= 12;
			page1.drawText(`• ${line}`, {
				x: leftColX + 8,
				y,
				size: 7.5,
				font: fontReg,
				color: textDark,
			});
		}
	}

	// Footer Page 1
	page1.drawText('Page 1 of 2 • Official Cadet Application Summary', {
		x: margin,
		y: 20,
		size: 7.5,
		font: fontItalic,
		color: textMuted,
	});
	page1.drawText(`Application Ref: ${sanitizePdfText(referenceId)}`, {
		x: pageWidth - margin - 145,
		y: 20,
		size: 7.5,
		font: fontItalic,
		color: textMuted,
	});

	// ==============================================================
	// PAGE 2: CO-CURRICULAR, INNOVATION PROBLEMS & DECLARATION
	// ==============================================================
	const page2 = masterDoc.addPage([pageWidth, pageHeight]);

	// Top Strip Page 2
	page2.drawRectangle({
		x: 0,
		y: pageHeight - 36,
		width: pageWidth,
		height: 36,
		color: navy,
	});
	page2.drawText(
		'INSTITUTION’S INNOVATION COUNCIL (IIC) 2026-27 • CADET ENROLLMENT FORM',
		{
			x: margin,
			y: pageHeight - 22,
			size: 9,
			font: fontBold,
			color: rgb(1, 1, 1),
		},
	);
	page2.drawText(`REF: ${sanitizePdfText(referenceId)}`, {
		x: pageWidth - margin - 120,
		y: pageHeight - 22,
		size: 8.5,
		font: fontBold,
		color: gold,
	});

	let y2 = pageHeight - 60;

	// Section 3 Header
	page2.drawRectangle({
		x: margin,
		y: y2 - 4,
		width: contentWidth,
		height: 18,
		color: rgb(240 / 255, 249 / 255, 255 / 255),
		borderColor: rgb(186 / 255, 230 / 255, 253 / 255),
		borderWidth: 1,
	});
	page2.drawText('SECTION 3: CO-CURRICULAR & LEADERSHIP PROFILE (Q12 - Q14)', {
		x: margin + 8,
		y: y2 + 1,
		size: 8.5,
		font: fontBold,
		color: navy,
	});

	// Q12: Activities
	y2 -= 20;
	page2.drawText('12. Technical / Co-Curricular Activities:', {
		x: leftColX,
		y: y2,
		size: 7.5,
		font: fontBold,
		color: navy,
	});
	page2.drawText(formData.hasActivities ? 'YES (Attached)' : 'NIL', {
		x: leftColX + 190,
		y: y2,
		size: 7.5,
		font: fontBold,
		color: formData.hasActivities ? green : textMuted,
	});
	if (formData.hasActivities && formData.activityDetails) {
		const actLines = wrapText(
			formData.activityDetails,
			fontReg,
			7.5,
			contentWidth - 24,
		);
		for (const line of actLines.slice(0, 2)) {
			y2 -= 12;
			page2.drawText(`• ${line}`, {
				x: leftColX + 8,
				y: y2,
				size: 7.5,
				font: fontReg,
				color: textDark,
			});
		}
	}

	// Q13: Achievements
	y2 -= 18;
	page2.drawText('13. Major Achievements / Awards:', {
		x: leftColX,
		y: y2,
		size: 7.5,
		font: fontBold,
		color: navy,
	});
	page2.drawText(formData.hasAchievements ? 'YES (Attached)' : 'NIL', {
		x: leftColX + 190,
		y: y2,
		size: 7.5,
		font: fontBold,
		color: formData.hasAchievements ? green : textMuted,
	});
	if (formData.hasAchievements && formData.achievementDetails) {
		const achLines = wrapText(
			formData.achievementDetails,
			fontReg,
			7.5,
			contentWidth - 24,
		);
		for (const line of achLines.slice(0, 2)) {
			y2 -= 12;
			page2.drawText(`• ${line}`, {
				x: leftColX + 8,
				y: y2,
				size: 7.5,
				font: fontReg,
				color: textDark,
			});
		}
	}

	// Q14: Leadership
	y2 -= 18;
	page2.drawText('14. Leadership / Coordinator Positions Held:', {
		x: leftColX,
		y: y2,
		size: 7.5,
		font: fontBold,
		color: navy,
	});
	page2.drawText(formData.hasLeadership ? 'YES' : 'NIL', {
		x: leftColX + 190,
		y: y2,
		size: 7.5,
		font: fontBold,
		color: formData.hasLeadership ? green : textMuted,
	});
	if (formData.hasLeadership && formData.leadershipDetails) {
		const ldrLines = wrapText(
			formData.leadershipDetails,
			fontReg,
			7.5,
			contentWidth - 24,
		);
		for (const line of ldrLines.slice(0, 2)) {
			y2 -= 12;
			page2.drawText(`• ${line}`, {
				x: leftColX + 8,
				y: y2,
				size: 7.5,
				font: fontReg,
				color: textDark,
			});
		}
	}

	// Section 4 Header
	y2 -= 26;
	page2.drawRectangle({
		x: margin,
		y: y2 - 4,
		width: contentWidth,
		height: 18,
		color: rgb(240 / 255, 249 / 255, 255 / 255),
		borderColor: rgb(186 / 255, 230 / 255, 253 / 255),
		borderWidth: 1,
	});
	page2.drawText(
		'SECTION 4: INNOVATION & PROBLEM-SOLVING VISION (Q15 - Q17)',
		{
			x: margin + 8,
			y: y2 + 1,
			size: 8.5,
			font: fontBold,
			color: navy,
		},
	);

	// Q15: IMU Ecosystem Problem
	y2 -= 18;
	page2.drawText('15. Problem in IMU Ecosystem to Solve:', {
		x: leftColX,
		y: y2,
		size: 7.5,
		font: fontBold,
		color: navy,
	});
	const p1Lines = wrapText(
		formData.problemMaritime || 'None specified',
		fontReg,
		7.5,
		contentWidth - 24,
	);
	for (const line of p1Lines.slice(0, 4)) {
		y2 -= 11;
		page2.drawText(line, {
			x: leftColX + 8,
			y: y2,
			size: 7.5,
			font: fontReg,
			color: textDark,
		});
	}

	// Q16: Society Problem
	y2 -= 16;
	page2.drawText('16. Problem in Society to Solve:', {
		x: leftColX,
		y: y2,
		size: 7.5,
		font: fontBold,
		color: navy,
	});
	const p2Lines = wrapText(
		formData.problemSociety || 'None specified',
		fontReg,
		7.5,
		contentWidth - 24,
	);
	for (const line of p2Lines.slice(0, 4)) {
		y2 -= 11;
		page2.drawText(line, {
			x: leftColX + 8,
			y: y2,
			size: 7.5,
			font: fontReg,
			color: textDark,
		});
	}

	// Q17: Interest Areas
	y2 -= 16;
	page2.drawText('17. Technology & Innovation Domains of Interest:', {
		x: leftColX,
		y: y2,
		size: 7.5,
		font: fontBold,
		color: navy,
	});
	const interestStr =
		formData.areasOfInterest && formData.areasOfInterest.length > 0
			? formData.areasOfInterest.join(', ')
			: 'None selected';
	const intLines = wrapText(interestStr, fontBold, 7.5, contentWidth - 24);
	for (const line of intLines.slice(0, 2)) {
		y2 -= 11;
		page2.drawText(line, {
			x: leftColX + 8,
			y: y2,
			size: 7.5,
			font: fontBold,
			color: sky,
		});
	}

	// Section 5 Header
	y2 -= 24;
	page2.drawRectangle({
		x: margin,
		y: y2 - 4,
		width: contentWidth,
		height: 18,
		color: rgb(240 / 255, 249 / 255, 255 / 255),
		borderColor: rgb(186 / 255, 230 / 255, 253 / 255),
		borderWidth: 1,
	});
	page2.drawText(
		'SECTION 5: SUPPORTING DOCUMENTS & OFFICIAL DECLARATION (Q18 - Q19)',
		{
			x: margin + 8,
			y: y2 + 1,
			size: 8.5,
			font: fontBold,
			color: navy,
		},
	);

	// Q18: Resume Status
	y2 -= 18;
	page2.drawText('18. Detailed Resume / CV (PDF):', {
		x: leftColX,
		y: y2,
		size: 7.5,
		font: fontBold,
		color: navy,
	});
	page2.drawText(
		formData.hasResume && formData.resumeName
			? `Uploaded (${formData.resumeName})`
			: 'NIL',
		{
			x: leftColX + 150,
			y: y2,
			size: 7.5,
			font: fontBold,
			color: formData.hasResume ? green : textMuted,
		},
	);

	// Q19: Declaration Statement Box
	y2 -= 16;
	page2.drawText('19. Official Student Declaration:', {
		x: leftColX,
		y: y2,
		size: 7.5,
		font: fontBold,
		color: navy,
	});

	const decStatement =
		'"I hereby declare that the information provided by me is true and correct to the best of my knowledge. I understand that submission of this form does not guarantee selection to the IIC Student Council. If selected, I agree to actively participate in IIC activities and contribute responsibly towards the innovation, research, entrepreneurship and related activities of the Institution."';

	const decLines = wrapText(decStatement, fontItalic, 7, contentWidth - 24);
	const decBoxHeight = decLines.length * 10 + 10;

	page2.drawRectangle({
		x: margin,
		y: y2 - decBoxHeight - 4,
		width: contentWidth,
		height: decBoxHeight,
		color: bgLight,
		borderColor: borderGray,
		borderWidth: 1,
	});

	let dy = y2 - 12;
	for (const line of decLines) {
		page2.drawText(line, {
			x: leftColX + 4,
			y: dy,
			size: 7,
			font: fontItalic,
			color: textDark,
		});
		dy -= 10;
	}

	y2 = y2 - decBoxHeight - 16;

	// Signature & Verification Grid
	page2.drawRectangle({
		x: margin,
		y: y2 - 32,
		width: contentWidth,
		height: 42,
		color: rgb(1, 1, 1),
		borderColor: navy,
		borderWidth: 1.5,
	});

	// Left: Digital Signature
	page2.drawText('Cadet Digital Signature:', {
		x: margin + 8,
		y: y2 + 2,
		size: 7.5,
		font: fontBold,
		color: textMuted,
	});
	page2.drawText(
		sanitizePdfText(formData.cadetName || '').toUpperCase(),
		{
			x: margin + 8,
			y: y2 - 12,
			size: 9,
			font: fontBold,
			color: navy,
		},
	);
	page2.drawText(`Status: Declared & Accepted (${subDate})`, {
		x: margin + 8,
		y: y2 - 24,
		size: 7,
		font: fontReg,
		color: green,
	});

	// Right: Faculty In-Charge Verification Sign
	const rightSignX = margin + contentWidth / 2 + 30;
	page2.drawText('Faculty In-Charge Verification / Seal:', {
		x: rightSignX,
		y: y2 + 2,
		size: 7.5,
		font: fontBold,
		color: textMuted,
	});
	page2.drawText('Signature: ___________________________', {
		x: rightSignX,
		y: y2 - 12,
		size: 7.5,
		font: fontReg,
		color: textMuted,
	});
	page2.drawText('Date Verified: _______________________', {
		x: rightSignX,
		y: y2 - 24,
		size: 7.5,
		font: fontReg,
		color: textMuted,
	});

	// Footer Page 2
	page2.drawText(
		'Page 2 of 2 • End of Official Cadet Application Form (Followed by Attached Proofs & Resume)',
		{
			x: margin,
			y: 20,
			size: 7.5,
			font: fontItalic,
			color: textMuted,
		},
	);

	// ==============================================================
	// APPEND UPLOADED RESUME & CERTIFICATES (MERGED INTO MASTER PDF)
	// ==============================================================
	let appendedCount = 0;

	for (const item of attachments) {
		if (!item.dataUrl) continue;

		try {
			// Check if attachment is a PDF
			if (
				item.dataUrl.includes('application/pdf') ||
				item.dataUrl.startsWith('data:application/')
			) {
				const pdfBytes = base64ToUint8Array(item.dataUrl);
				const extDoc = await PDFDocument.load(pdfBytes, {
					ignoreEncryption: true,
				});
				const copiedPages = await masterDoc.copyPages(
					extDoc,
					extDoc.getPageIndices(),
				);
				copiedPages.forEach((page) => masterDoc.addPage(page));
				appendedCount++;
			} else if (
				item.dataUrl.includes('image/png') ||
				item.dataUrl.includes('image/jpeg') ||
				item.dataUrl.includes('image/jpg')
			) {
				// Embed Image as a full A4 attachment page
				const imgBytes = base64ToUint8Array(item.dataUrl);
				let embeddedImg;
				if (item.dataUrl.includes('image/png')) {
					embeddedImg = await masterDoc.embedPng(imgBytes);
				} else {
					embeddedImg = await masterDoc.embedJpg(imgBytes);
				}

				const imgPage = masterDoc.addPage([pageWidth, pageHeight]);

				// Header banner for attached certificate
				imgPage.drawRectangle({
					x: 0,
					y: pageHeight - 40,
					width: pageWidth,
					height: 40,
					color: navy,
				});
				imgPage.drawText(
					`ATTACHED CERTIFICATE / PROOF: ${sanitizePdfText(item.name).toUpperCase()}`,
					{
						x: margin,
						y: pageHeight - 25,
						size: 8.5,
						font: fontBold,
						color: rgb(1, 1, 1),
					},
				);

				const maxImgWidth = contentWidth;
				const maxImgHeight = pageHeight - 100;
				const imgDims = embeddedImg.scaleToFit(maxImgWidth, maxImgHeight);

				imgPage.drawImage(embeddedImg, {
					x: (pageWidth - imgDims.width) / 2,
					y: (pageHeight - 50 - imgDims.height) / 2,
					width: imgDims.width,
					height: imgDims.height,
				});

				appendedCount++;
			}
		} catch (itemErr) {
			console.warn(`Could not append attachment ${item.name}:`, itemErr);
		}
	}

	const masterBytes = await masterDoc.save();
	const masterDataUrl = uint8ArrayToDataUrl(masterBytes, 'application/pdf');

	return {
		mergedDataUrl: masterDataUrl,
		totalPages: masterDoc.getPageCount(),
		attachedCount: appendedCount,
	};
}
