import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory cache for folderId -> fileId
const folderToFileIdCache = new Map<string, string>();
// In-memory cache for fileId -> image buffer and content-type (max 200 items ~ 4MB)
const imageBufferCache = new Map<string, { buffer: Buffer; contentType: string; timestamp: number }>();
const MAX_BUFFER_CACHE_ITEMS = 200;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Default SVG avatar fallback
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150" width="120" height="150" fill="none">
  <rect width="120" height="150" fill="#F1F5F9"/>
  <circle cx="60" cy="55" r="28" fill="#CBD5E1"/>
  <path d="M20 135 C20 95, 100 95, 100 135 Z" fill="#CBD5E1"/>
  <text x="60" y="145" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#94A3B8" font-weight="600">CADET PHOTO</text>
</svg>`;

function extractDriveId(urlOrText: string): string | null {
	if (!urlOrText) return null;
	// Match /file/d/{id} or /folders/{id} or id={id} or /d/{id}
	const patterns = [
		/\/folders\/([a-zA-Z0-9_-]+)/,
		/\/file\/d\/([a-zA-Z0-9_-]+)/,
		/\/d\/([a-zA-Z0-9_-]+)/,
		/[?&]id=([a-zA-Z0-9_-]+)/,
	];
	for (const pattern of patterns) {
		const match = urlOrText.match(pattern);
		if (match && match[1]) {
			return match[1].replace(/-0-\d+.*$/, '');
		}
	}
	return null;
}

async function resolvePhotoFileIdFromFolder(folderId: string): Promise<string | null> {
	if (!folderId) return null;
	if (folderToFileIdCache.has(folderId)) {
		return folderToFileIdCache.get(folderId)!;
	}

	try {
		const res = await fetch(`https://drive.google.com/drive/folders/${folderId}`, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			},
			next: { revalidate: 3600 },
		});
		if (!res.ok) return null;

		const html = await res.text();
		let fileId: string | null = null;

		// Match Passport_Photo followed or preceded by file id
		const photoIdx = html.indexOf('Passport_Photo');
		if (photoIdx !== -1) {
			const chunk = html.slice(Math.max(0, photoIdx - 300), photoIdx + 300);
			const idMatch = chunk.match(/1[a-zA-Z0-9_-]{25,}/);
			if (idMatch) {
				fileId = idMatch[0].replace(/-0-\d+.*$/, '');
			}
		}

		// Secondary fallback: match any image file extension in the folder HTML
		if (!fileId) {
			const imgMatch = html.match(/"(1[a-zA-Z0-9_-]{25,})"[^"]*\.(jpg|jpeg|png)/i);
			if (imgMatch && imgMatch[1]) {
				fileId = imgMatch[1].replace(/-0-\d+.*$/, '');
			}
		}

		if (fileId) {
			folderToFileIdCache.set(folderId, fileId);
			return fileId;
		}
	} catch (err) {
		console.error('[API/admin/photo] Failed to resolve folder:', folderId, err);
	}

	return null;
}

export async function GET(req: NextRequest) {
	try {
		const searchParams = req.nextUrl.searchParams;
		const folderUrl = searchParams.get('folderUrl') || '';
		const folderIdParam = searchParams.get('folderId') || '';
		const photoUrl = searchParams.get('photoUrl') || '';
		const fileIdParam = searchParams.get('fileId') || '';

		let fileId: string | null = null;

		// 1. Direct fileId parameter
		if (fileIdParam) {
			fileId = fileIdParam.replace(/-0-\d+.*$/, '');
		}

		// 2. Extract from direct photo link if provided
		if (!fileId && photoUrl) {
			fileId = extractDriveId(photoUrl);
		}

		// 3. Resolve from folder
		if (!fileId) {
			const folderId = folderIdParam || (folderUrl ? extractDriveId(folderUrl) : null);
			if (folderId) {
				fileId = await resolvePhotoFileIdFromFolder(folderId);
			}
		}

		if (!fileId) {
			return new NextResponse(FALLBACK_SVG, {
				status: 200,
				headers: {
					'Content-Type': 'image/svg+xml',
					'Cache-Control': 'public, max-age=3600',
				},
			});
		}

		// Check buffer cache
		const now = Date.now();
		const cached = imageBufferCache.get(fileId);
		if (cached && now - cached.timestamp < CACHE_TTL_MS) {
			return new NextResponse(cached.buffer as unknown as BodyInit, {
				status: 200,
				headers: {
					'Content-Type': cached.contentType,
					'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
				},
			});
		}

		// Fetch image from Google UserContent
		const driveImgUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
		const imgRes = await fetch(driveImgUrl, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			},
		});

		if (!imgRes.ok) {
			// Return fallback avatar if Google fails to serve
			return new NextResponse(FALLBACK_SVG, {
				status: 200,
				headers: {
					'Content-Type': 'image/svg+xml',
					'Cache-Control': 'public, max-age=1800',
				},
			});
		}

		const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
		const arrayBuffer = await imgRes.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Store in cache with eviction if limit exceeded
		if (imageBufferCache.size >= MAX_BUFFER_CACHE_ITEMS) {
			const oldestKey = imageBufferCache.keys().next().value;
			if (oldestKey) imageBufferCache.delete(oldestKey);
		}
		imageBufferCache.set(fileId, { buffer, contentType, timestamp: now });

		return new NextResponse(buffer as unknown as BodyInit, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
			},
		});
	} catch (error) {
		console.error('[API/admin/photo] Unexpected error:', error);
		return new NextResponse(FALLBACK_SVG, {
			status: 200,
			headers: {
				'Content-Type': 'image/svg+xml',
				'Cache-Control': 'public, max-age=600',
			},
		});
	}
}
