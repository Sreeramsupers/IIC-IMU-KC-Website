import { NextRequest, NextResponse, after } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function sanitizeUrl(rawUrl?: string): string {
	if (!rawUrl) return '';
	let url = rawUrl.trim().replace(/^['"]|['"]$/g, '');
	if (/^h+ttps:\/\//i.test(url)) {
		url = url.replace(/^h+ttps:\/\//i, 'https://');
	} else if (/^h+ttp:\/\//i.test(url)) {
		url = url.replace(/^h+ttp:\/\//i, 'http://');
	}
	return url;
}

export async function POST(req: NextRequest) {
	try {
		const data = await req.json();

		// Basic Validation: Ensure required cadet profile fields are present
		if (!data.cadetName || typeof data.cadetName !== 'string' || !data.cadetName.trim()) {
			return NextResponse.json(
				{ success: false, error: 'Cadet Name is required.' },
				{ status: 400 },
			);
		}
		if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
			return NextResponse.json(
				{ success: false, error: 'A valid Cadet Email address is required.' },
				{ status: 400 },
			);
		}
		if (!data.regNumber || typeof data.regNumber !== 'string' || !data.regNumber.trim()) {
			return NextResponse.json(
				{ success: false, error: 'Registration Number is required.' },
				{ status: 400 },
			);
		}

		const referenceId = data.referenceId || `IIC-2627-${Math.floor(1000 + Math.random() * 9000)}`;

		const rawUrl =
			process.env.GOOGLE_SHEET_WEBAPP_URL ||
			'https://script.google.com/macros/s/AKfycbz7fhNq7uINoqJUu9VCia_D29DHLR7c1JTAHHNHW6LpTows7CQv5E2vlhazsnI37fdX/exec';

		const googleScriptUrl = sanitizeUrl(rawUrl);

		// Read faculty/forward email addresses from backend environment & payload
		const rawForwardEmails =
			process.env.FORWARD_EMAILS ||
			process.env.ADMIN_FORWARD_EMAILS ||
			process.env.FACULTY_EMAILS ||
			process.env.FACULTY_EMAIL ||
			'';
		const envEmails = rawForwardEmails
			? rawForwardEmails
					.split(',')
					.map((e) => e.trim())
					.filter((e) => e.includes('@'))
			: [];

		const payloadRaw = data.forwardEmails || data.facultyEmails || data.facultyEmail;
		const payloadEmails = Array.isArray(payloadRaw)
			? payloadRaw
			: typeof payloadRaw === 'string'
			? payloadRaw.split(',')
			: [];

		const combinedEmails = Array.from(
			new Set(
				[...envEmails, ...payloadEmails]
					.map((e: string) => (typeof e === 'string' ? e.trim() : ''))
					.filter((e: string) => e.includes('@')),
			),
		);

		// STRICT: Cadets must never receive emails. Filter out cadet email from forward list.
		const cadetEmailLower = (data.email || '').toLowerCase().trim();
		const forwardEmails = combinedEmails.filter(
			(e) => e.toLowerCase().trim() !== cadetEmailLower,
		);

		// Fallback to default faculty address if list is empty
		if (forwardEmails.length === 0) {
			forwardEmails.push('sreerambhavanspkd@gmail.com');
		}

		// Next.js Serverless Background Task (Non-Blocking):
		// Executes Google Drive upload, Doc population, Sheet append, and Email dispatch in background
		after(async () => {
			try {
				if (!googleScriptUrl) {
					console.warn('Google Script URL is not configured.');
					return;
				}

				console.log(
					`[Background Task] Forwarding submission for ${data.cadetName} (${referenceId})...`,
				);

				const response = await fetch(googleScriptUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'text/plain',
					},
					body: JSON.stringify({
						...data,
						referenceId,
						forwardEmails,
						templateDocId:
							process.env.GOOGLE_DOC_TEMPLATE_ID ||
							data.templateDocId ||
							'1hljBhK-tPtYN31i8P4n9QCuCHsdm_PaFrrBmEP9QCDw',
					}),
					redirect: 'follow',
				});

				const resultText = await response.text();
				console.log(`[Background Task Completed] Result:`, resultText.slice(0, 200));
			} catch (backgroundError) {
				console.error(
					'[Background Task Error] Failed to forward to Google Apps Script:',
					backgroundError,
				);
			}
		});

		// Return instant response (< 100ms) to frontend so cadets see immediate confirmation
		return NextResponse.json({
			success: true,
			referenceId,
			message: 'Registration received successfully. Processing in background.',
		});
	} catch (error) {
		console.error('Serverless submission error:', error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown server error',
			},
			{ status: 500 },
		);
	}
}
