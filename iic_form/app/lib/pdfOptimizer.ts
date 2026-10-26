/**
 * Client-Side PDF Pre-Optimizer for IIC Form Submissions
 *
 * Automatically reduces the byte size of PDF attachments (Marksheet, Resume, Certificates)
 * by optimizing high-resolution embedded images (common in camera-scanned documents)
 * and compressing PDF object streams with pdf-lib.
 *
 * This ensures multi-file submissions fit comfortably within the 4.0MB serverless
 * request limit, unlocking the instant (<200ms) background-processing submission route.
 */

import { PDFDocument, PDFName, PDFNumber } from 'pdf-lib';

export interface OptimizePdfResult {
	dataUrl: string;
	originalSizeBytes: number;
	optimizedSizeBytes: number;
	compressionRatio: number; // e.g. 0.35 = 35% of original (65% reduction)
	isOptimized: boolean;
	errorMessage?: string;
}

/**
 * Format bytes into human-readable string (e.g. "450 KB", "1.2 MB")
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Fast, chunked conversion of Uint8Array to Base64 to prevent stack overflow on large files
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
	let binary = '';
	const len = bytes.byteLength;
	const chunkSize = 32768;
	for (let i = 0; i < len; i += chunkSize) {
		const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
		binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
	}
	return typeof window !== 'undefined' ? window.btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
}

/**
 * Converts a standard File or Blob to a Base64 Data URL
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
		reader.readAsDataURL(file);
	});
}

/**
 * Resizes and compresses a JPEG byte buffer using an offscreen canvas
 */
async function compressJpegBytes(
	jpegBytes: Uint8Array,
	maxDimension: number = 1400,
	quality: number = 0.76,
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		return null;
	}

	return new Promise((resolve) => {
		try {
			const blob = new Blob([jpegBytes as unknown as BlobPart], { type: 'image/jpeg' });
			const objectUrl = URL.createObjectURL(blob);
			const img = new Image();

			img.onload = async () => {
				try {
					URL.revokeObjectURL(objectUrl);
					let width = img.naturalWidth || img.width;
					let height = img.naturalHeight || img.height;

					if (!width || !height) {
						resolve(null);
						return;
					}

					// Calculate scaled dimensions while preserving aspect ratio
					if (width > maxDimension || height > maxDimension) {
						if (width > height) {
							height = Math.round((height * maxDimension) / width);
							width = maxDimension;
						} else {
							width = Math.round((width * maxDimension) / height);
							height = maxDimension;
						}
					} else if (jpegBytes.length < 200 * 1024) {
						// Already reasonably small and dimensions are under maxDimension
						resolve(null);
						return;
					}

					const canvas = document.createElement('canvas');
					canvas.width = width;
					canvas.height = height;
					const ctx = canvas.getContext('2d', { alpha: false });
					if (!ctx) {
						resolve(null);
						return;
					}

					// White background for documents
					ctx.fillStyle = '#FFFFFF';
					ctx.fillRect(0, 0, width, height);
					ctx.drawImage(img, 0, 0, width, height);

					canvas.toBlob(
						async (blobResult) => {
							if (!blobResult) {
								resolve(null);
								return;
							}
							const arrayBuffer = await blobResult.arrayBuffer();
							const newBytes = new Uint8Array(arrayBuffer);

							// Only return if it actually saved space
							if (newBytes.length < jpegBytes.length) {
								resolve({ bytes: newBytes, width, height });
							} else {
								resolve(null);
							}
						},
						'image/jpeg',
						quality,
					);
				} catch {
					resolve(null);
				}
			};

			img.onerror = () => {
				URL.revokeObjectURL(objectUrl);
				resolve(null);
			};

			img.src = objectUrl;
		} catch {
			resolve(null);
		}
	});
}

/**
 * Optimizes a PDF File by downsampling oversized scanned pages and recompressing object streams.
 * Returns the optimized data URL and size statistics.
 *
 * Guaranteed safe: if optimization produces no savings or fails, returns original file dataUrl.
 */
export async function optimizePdf(
	file: File,
	options: {
		maxDimension?: number;
		quality?: number;
		minSizeToOptimize?: number; // files smaller than this are kept as-is
	} = {},
): Promise<OptimizePdfResult> {
	const originalSizeBytes = file.size;
	const minSizeToOptimize = options.minSizeToOptimize ?? 180 * 1024; // 180 KB
	const maxDimension = options.maxDimension ?? 1400; // 1400px provides crisp 150-200 DPI on A4
	const quality = options.quality ?? 0.76;

	// Files under 180KB are already lightweight; direct read
	if (originalSizeBytes <= minSizeToOptimize) {
		const rawDataUrl = await fileToDataUrl(file);
		return {
			dataUrl: rawDataUrl,
			originalSizeBytes,
			optimizedSizeBytes: originalSizeBytes,
			compressionRatio: 1,
			isOptimized: false,
		};
	}

	try {
		const arrayBuffer = await file.arrayBuffer();
		const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

		let modifiedImages = 0;

		// Iterate through all indirect objects in the PDF to find oversized image streams
		for (const [, obj] of doc.context.enumerateIndirectObjects()) {
			if (obj && typeof obj === 'object' && 'dict' in obj && 'contents' in obj) {
				const streamObj = obj as unknown as { dict: any; contents: Uint8Array };
				const dict = streamObj.dict;

				if (dict && typeof dict.get === 'function') {
					const subtype = dict.get(PDFName.of('Subtype'));
					if (subtype && subtype.toString() === '/Image' && streamObj.contents instanceof Uint8Array) {
						const filter = dict.get(PDFName.of('Filter'));
						const filterStr = filter ? filter.toString() : '';

						// In scanned PDFs, pages are embedded as /DCTDecode (JPEG)
						if (filterStr === '/DCTDecode' || filterStr.includes('DCTDecode')) {
							const originalImageBytes = streamObj.contents;

							// Only attempt downsampling if the image stream is substantial (> 120 KB)
							if (originalImageBytes.length > 120 * 1024) {
								const compressed = await compressJpegBytes(originalImageBytes, maxDimension, quality);
								if (compressed && compressed.bytes.length < originalImageBytes.length) {
									streamObj.contents = compressed.bytes;
									dict.set(PDFName.of('Width'), PDFNumber.of(compressed.width));
									dict.set(PDFName.of('Height'), PDFNumber.of(compressed.height));
									dict.set(PDFName.of('Length'), PDFNumber.of(compressed.bytes.length));
									modifiedImages++;
								}
							}
						}
					}
				}
			}
		}

		// Re-save with object stream compression
		const optimizedBytes = await doc.save({ useObjectStreams: true });

		// Check if we actually achieved meaningful compression
		if (optimizedBytes.byteLength < originalSizeBytes * 0.96) {
			const base64Str = uint8ArrayToBase64(optimizedBytes);
			const optimizedDataUrl = `data:application/pdf;base64,${base64Str}`;
			return {
				dataUrl: optimizedDataUrl,
				originalSizeBytes,
				optimizedSizeBytes: optimizedBytes.byteLength,
				compressionRatio: optimizedBytes.byteLength / originalSizeBytes,
				isOptimized: true,
			};
		}

		// If no significant savings were made, fall back to original data URL
		const fallbackDataUrl = await fileToDataUrl(file);
		return {
			dataUrl: fallbackDataUrl,
			originalSizeBytes,
			optimizedSizeBytes: originalSizeBytes,
			compressionRatio: 1,
			isOptimized: false,
		};
	} catch (error) {
		console.warn('PDF optimization skipped, falling back to original:', error);
		const rawDataUrl = await fileToDataUrl(file);
		return {
			dataUrl: rawDataUrl,
			originalSizeBytes,
			optimizedSizeBytes: originalSizeBytes,
			compressionRatio: 1,
			isOptimized: false,
			errorMessage: error instanceof Error ? error.message : 'Unknown optimization error',
		};
	}
}
