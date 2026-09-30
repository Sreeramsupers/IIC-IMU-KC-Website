import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const providedPassword = (body.password || '').trim();

		// Read admin password from environment variables
		// Fallbacks support ADMIN_PASSWORD, NEXT_PUBLIC_ADMIN_PASSWORD, or default 'iic2026'
		const configuredPassword = (
			process.env.ADMIN_PASSWORD ||
			process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
			'iic2026'
		).trim();

		if (!providedPassword) {
			return NextResponse.json(
				{ success: false, error: 'Password is required' },
				{ status: 400 },
			);
		}

		if (providedPassword === configuredPassword) {
			return NextResponse.json(
				{
					success: true,
					message: 'Authenticated successfully',
				},
				{
					headers: {
						'Cache-Control': 'no-store, max-age=0',
					},
				},
			);
		}

		return NextResponse.json(
			{ success: false, error: 'Incorrect admin password. Please try again.' },
			{ status: 401 },
		);
	} catch (error) {
		console.error('[Admin Auth API Error]:', error);
		return NextResponse.json(
			{ success: false, error: 'Authentication request failed' },
			{ status: 500 },
		);
	}
}

export async function GET() {
	// Simple health/readiness probe for admin auth status
	const isConfigured = Boolean(
		process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD,
	);
	return NextResponse.json({
		success: true,
		configured: isConfigured,
	});
}
