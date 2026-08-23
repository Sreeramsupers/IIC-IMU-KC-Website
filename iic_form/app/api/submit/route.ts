import { NextRequest, NextResponse, after } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

		const referenceId = data.referenceId || `IIC-2627-${Math.floor(1000 + Math.random() * 9000)}`;

		const rawUrl =
			process.env.GOOGLE_SHEET_WEBAPP_URL ||
			process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL ||
			'https://script.google.com/macros/s/AKfycbzVklG1gmnnhi1wq6HVMTNr_1XcMADOURNKSJOHFTSDmZzUCPkSQzFWIHslsOIRU3M6/exec';

		const googleScriptUrl = sanitizeUrl(rawUrl);

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
						templateDocId: data.templateDocId || '1x69S7y0X7UJYR7x2ZEKCoQzPFCb-2nHctp6XNQG3E7I',
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
