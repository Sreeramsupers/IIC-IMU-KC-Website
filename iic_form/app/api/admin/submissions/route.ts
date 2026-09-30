import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const GOOGLE_SHEET_CSV_URL =
	'https://docs.google.com/spreadsheets/d/1xq90Rse_QraqiaVUpW7ettaW9kdlIqTtZF-pnnBl4pI/export?format=csv';

export interface CadetSubmissionRecord {
	id: string;
	timestamp: string;
	referenceId: string;
	cadetName: string;
	regNumber: string;
	yearOfStudy: string;
	semester: string;
	department: string;
	gender: string;
	email: string;
	phone: string;
	cgpa: string;
	journalPub: string;
	journalDetails: string;
	bookPub: string;
	bookDetails: string;
	patents: string;
	patentDetails: string;
	competitions: string;
	competitionDetails: string;
	activities: string;
	activityDetails: string;
	achievements: string;
	achievementDetails: string;
	leadership: string;
	leadershipDetails: string;
	problemMaritime: string;
	problemSociety: string;
	rawInterests: string;
	areasOfInterest: string[];
	driveFolderUrl: string;
	docLink: string;
	proofsLink: string;
	passportPhotoLink: string;
	mergedDocsCount: string;
	declarationAccepted: string;
}

/**
 * Robust RFC 4180 compliant CSV parser
 * Handles multiline cells, escaped quotes, and commas within quotes
 */
function parseCSV(text: string): string[][] {
	const rows: string[][] = [];
	let currentRow: string[] = [];
	let currentField = '';
	let inQuotes = false;

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		const nextChar = text[i + 1];

		if (inQuotes) {
			if (char === '"' && nextChar === '"') {
				currentField += '"';
				i++; // skip escaped quote
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

function cleanVal(val?: string): string {
	if (!val) return '';
	return val.trim();
}

function parseInterests(raw?: string): string[] {
	if (!raw || raw === 'NIL') return [];
	return raw
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
}

export async function GET(req: NextRequest) {
	try {
		// Cache-busting fetch to ensure live data from Google Sheet
		const fetchUrl = `${GOOGLE_SHEET_CSV_URL}&_nocache=${Date.now()}`;
		const response = await fetch(fetchUrl, {
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				Pragma: 'no-cache',
			},
			next: { revalidate: 0 },
		});

		if (!response.ok) {
			throw new Error(`Google Sheet returned HTTP ${response.status}: ${response.statusText}`);
		}

		const csvContent = await response.text();
		const rawRows = parseCSV(csvContent);

		if (rawRows.length === 0) {
			return NextResponse.json({
				success: true,
				total: 0,
				submissions: [],
				lastUpdated: new Date().toISOString(),
			});
		}

		// First row is headers
		const headers = rawRows[0].map((h) => cleanVal(h).toLowerCase());
		const findIndex = (searchTerms: string[]): number => {
			for (const term of searchTerms) {
				const idx = headers.findIndex((h) => h.includes(term.toLowerCase()));
				if (idx !== -1) return idx;
			}
			return -1;
		};

		// Map column indexes dynamically based on header text
		const colMap = {
			timestamp: findIndex(['timestamp']),
			referenceId: findIndex(['reference id', 'ref id']),
			cadetName: findIndex(['cadet name', 'name']),
			regNumber: findIndex(['registration', 'roll number', 'reg no']),
			yearOfStudy: findIndex(['year of study', 'year']),
			semester: findIndex(['semester', 'sem']),
			department: findIndex(['department', 'program', 'dept']),
			gender: findIndex(['gender']),
			email: findIndex(['email address', 'email']),
			phone: findIndex(['mobile number', 'phone']),
			cgpa: findIndex(['cgpa']),
			journalPub: findIndex(['journal publications']),
			journalDetails: findIndex(['journal publication details', 'journal details']),
			bookPub: findIndex(['book chapter publications']),
			bookDetails: findIndex(['book chapter details']),
			patents: findIndex(['patents / ipr', 'patent']),
			patentDetails: findIndex(['patent / ipr details', 'patent details']),
			competitions: findIndex(['competitions / hackathons', 'competition']),
			competitionDetails: findIndex(['competition details']),
			activities: findIndex(['technical / co-curricular', 'activity']),
			activityDetails: findIndex(['activity details']),
			achievements: findIndex(['major achievements', 'achievement']),
			achievementDetails: findIndex(['achievement details']),
			leadership: findIndex(['leadership positions', 'leadership']),
			leadershipDetails: findIndex(['leadership details']),
			problemMaritime: findIndex(['problem in maritime', 'maritime ecosystem']),
			problemSociety: findIndex(['problem in society', 'society']),
			interests: findIndex(['areas of innovation', 'interest']),
			driveFolder: findIndex(['student drive folder link', 'drive folder']),
			docLink: findIndex(['populated google doc link', 'google doc link', 'doc link']),
			proofsLink: findIndex(['combined master pdf', 'proofs link', 'master pdf']),
			passportPhoto: findIndex(['passport photo link', 'photo link']),
			mergedDocs: findIndex(['number of merged documents', 'merged documents']),
			declaration: findIndex(['declaration accepted', 'declaration']),
		};

		const getField = (row: string[], colIndex: number, fallback = ''): string => {
			if (colIndex >= 0 && colIndex < row.length) {
				const v = cleanVal(row[colIndex]);
				return v || fallback;
			}
			return fallback;
		};

		const submissions: CadetSubmissionRecord[] = [];

		for (let i = 1; i < rawRows.length; i++) {
			const row = rawRows[i];
			if (!row || row.length === 0 || !row.some((c) => c.trim().length > 0)) {
				continue;
			}

			const refId =
				getField(row, colMap.referenceId) ||
				getField(row, 1) ||
				`IIC-2627-${String(i).padStart(4, '0')}`;
			const cadetName =
				getField(row, colMap.cadetName) || getField(row, 2) || 'Cadet Applicant';

			// Ignore if row doesn't look like a real submission
			if (!cadetName || cadetName.toLowerCase() === 'cadet name') {
				continue;
			}

			const rawInterests = getField(row, colMap.interests, getField(row, 27));
			const driveFolderUrl = getField(row, colMap.driveFolder, getField(row, 28));

			const record: CadetSubmissionRecord = {
				id: `sub_${i}_${refId}`,
				timestamp: getField(row, colMap.timestamp, getField(row, 0)),
				referenceId: refId,
				cadetName: cadetName,
				regNumber: getField(row, colMap.regNumber, getField(row, 3)),
				yearOfStudy: getField(row, colMap.yearOfStudy, getField(row, 4, '1st Year')),
				semester: getField(row, colMap.semester, getField(row, 5, 'Semester 1')),
				department: getField(
					row,
					colMap.department,
					getField(row, 6, 'Marine Engineering'),
				),
				gender: getField(row, colMap.gender, getField(row, 7, 'Not Specified')),
				email: getField(row, colMap.email, getField(row, 8)),
				phone: getField(row, colMap.phone, getField(row, 9)),
				cgpa: getField(row, colMap.cgpa, getField(row, 10, 'N/A')),
				journalPub: getField(row, colMap.journalPub, getField(row, 11, 'NIL')),
				journalDetails: getField(row, colMap.journalDetails, getField(row, 12, 'NIL')),
				bookPub: getField(row, colMap.bookPub, getField(row, 13, 'NIL')),
				bookDetails: getField(row, colMap.bookDetails, getField(row, 14, 'NIL')),
				patents: getField(row, colMap.patents, getField(row, 15, 'NIL')),
				patentDetails: getField(row, colMap.patentDetails, getField(row, 16, 'NIL')),
				competitions: getField(row, colMap.competitions, getField(row, 17, 'NIL')),
				competitionDetails: getField(
					row,
					colMap.competitionDetails,
					getField(row, 18, 'NIL'),
				),
				activities: getField(row, colMap.activities, getField(row, 19, 'NIL')),
				activityDetails: getField(
					row,
					colMap.activityDetails,
					getField(row, 20, 'NIL'),
				),
				achievements: getField(row, colMap.achievements, getField(row, 21, 'NIL')),
				achievementDetails: getField(
					row,
					colMap.achievementDetails,
					getField(row, 22, 'NIL'),
				),
				leadership: getField(row, colMap.leadership, getField(row, 23, 'NIL')),
				leadershipDetails: getField(
					row,
					colMap.leadershipDetails,
					getField(row, 24, 'NIL'),
				),
				problemMaritime: getField(
					row,
					colMap.problemMaritime,
					getField(row, 25, 'NIL'),
				),
				problemSociety: getField(
					row,
					colMap.problemSociety,
					getField(row, 26, 'NIL'),
				),
				rawInterests: rawInterests,
				areasOfInterest: parseInterests(rawInterests),
				driveFolderUrl: driveFolderUrl,
				docLink: getField(row, colMap.docLink, getField(row, 29)),
				proofsLink: getField(row, colMap.proofsLink, getField(row, 30)),
				passportPhotoLink: getField(row, colMap.passportPhoto, getField(row, 31)),
				mergedDocsCount: getField(row, colMap.mergedDocs, getField(row, 32, '0')),
				declarationAccepted: getField(
					row,
					colMap.declaration,
					getField(row, 33, 'Accepted'),
				),
			};

			submissions.push(record);
		}

		// Calculate overview metrics
		const yearStats: Record<string, number> = {};
		const departmentStats: Record<string, number> = {};
		let totalWithPatents = 0;
		let totalWithPublications = 0;
		let totalWithCompetitions = 0;

		submissions.forEach((sub) => {
			const y = sub.yearOfStudy || 'Unspecified';
			yearStats[y] = (yearStats[y] || 0) + 1;

			const d = sub.department || 'General';
			departmentStats[d] = (departmentStats[d] || 0) + 1;

			if (sub.patents && sub.patents !== 'NIL' && sub.patents.toLowerCase() !== 'no') {
				totalWithPatents++;
			}
			if (
				sub.journalPub &&
				sub.journalPub !== 'NIL' &&
				sub.journalPub.toLowerCase() !== 'no'
			) {
				totalWithPublications++;
			}
			if (
				sub.competitions &&
				sub.competitions !== 'NIL' &&
				sub.competitions.toLowerCase() !== 'no'
			) {
				totalWithCompetitions++;
			}
		});

		return NextResponse.json(
			{
				success: true,
				total: submissions.length,
				submissions,
				rawHeaders: rawRows[0] || [],
				rawRows: rawRows.slice(1) || [],
				stats: {
					total: submissions.length,
					yearStats,
					departmentStats,
					totalWithPatents,
					totalWithPublications,
					totalWithCompetitions,
				},
				spreadsheetUrl:
					'https://docs.google.com/spreadsheets/d/1xq90Rse_QraqiaVUpW7ettaW9kdlIqTtZF-pnnBl4pI/edit?usp=sharing',
				lastUpdated: new Date().toISOString(),
			},
			{
				headers: {
					'Cache-Control': 'no-store, max-age=0, must-revalidate',
				},
			},
		);
	} catch (error) {
		console.error('[Admin Submissions API Error]:', error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown server error',
				submissions: [],
				total: 0,
			},
			{ status: 500 },
		);
	}
}
