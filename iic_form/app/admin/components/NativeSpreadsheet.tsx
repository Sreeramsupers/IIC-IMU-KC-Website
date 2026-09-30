'use client';

import React, { useState, useMemo } from 'react';
import {
	Table as TableIcon,
	Download,
	Copy,
	Check,
	Search,
	Folder,
	ExternalLink,
	Eye,
	SlidersHorizontal,
	FileSpreadsheet,
	Layers,
	Filter,
	Maximize2,
	Minimize2,
	RefreshCw,
} from 'lucide-react';
import { CadetSubmissionRecord } from '../../api/admin/submissions/route';

const GOOGLE_SHEET_URL =
	'https://docs.google.com/spreadsheets/d/1xq90Rse_QraqiaVUpW7ettaW9kdlIqTtZF-pnnBl4pI/edit?usp=sharing';
const GOOGLE_SHEET_EMBED_URL =
	'https://docs.google.com/spreadsheets/d/1xq90Rse_QraqiaVUpW7ettaW9kdlIqTtZF-pnnBl4pI/htmlembed?widget=true&headers=false';
const GOOGLE_SHEET_XLSX_URL =
	'https://docs.google.com/spreadsheets/d/1xq90Rse_QraqiaVUpW7ettaW9kdlIqTtZF-pnnBl4pI/export?format=xlsx';
const GOOGLE_SHEET_CSV_URL =
	'https://docs.google.com/spreadsheets/d/1xq90Rse_QraqiaVUpW7ettaW9kdlIqTtZF-pnnBl4pI/export?format=csv';

interface NativeSpreadsheetProps {
	rawHeaders: string[];
	rawRows: string[][];
	submissions: CadetSubmissionRecord[];
	onViewCadetForm: (cadet: CadetSubmissionRecord) => void;
}

// Convert 0-indexed column number to Excel column letters (A, B, ... Z, AA, AB...)
function getExcelColumnLetter(colIndex: number): string {
	let temp = colIndex;
	let letter = '';
	while (temp >= 0) {
		letter = String.fromCharCode((temp % 26) + 65) + letter;
		temp = Math.floor(temp / 26) - 1;
	}
	return letter;
}

export function NativeSpreadsheet({
	rawHeaders,
	rawRows,
	submissions,
	onViewCadetForm,
}: NativeSpreadsheetProps) {
	// Active cell selection
	const [activeCell, setActiveCell] = useState<{ row: number; col: number; val: string; letter: string } | null>(null);
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [viewMode, setViewMode] = useState<'native_full' | 'native_curated' | 'google_embed'>('native_full');
	const [copiedCell, setCopiedCell] = useState<boolean>(false);
	const [copiedTsv, setCopiedTsv] = useState<boolean>(false);
	const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

	// Standard fallback headers if rawHeaders is empty
	const effectiveHeaders = useMemo(() => {
		if (rawHeaders && rawHeaders.length > 0) return rawHeaders;
		return [
			'Timestamp', 'Reference ID', 'Cadet Name', 'Registration / Roll Number', 'Year of Study',
			'Semester', 'Department / Program', 'Gender', 'Email Address', 'Mobile Number',
			'Current CGPA', 'Journal Publications', 'Journal Publication Details', 'Book Chapter Publications',
			'Book Chapter Details', 'Patents / IPR / Copyrights', 'Patent / IPR Details', 'Competitions / Hackathons',
			'Competition Details', 'Technical / Co-Curricular Activities', 'Activity Details', 'Major Achievements / Awards',
			'Achievement Details', 'Leadership Positions Held', 'Leadership Details', 'Problem in Maritime/University Ecosystem',
			'Problem in Society', 'Areas of Innovation / Technology Interest', 'Student Drive Folder Link', 'Populated Google Doc Link',
			'Combined Master PDF Proofs Link', 'Passport Photo Link', 'Number of Merged Documents', 'Declaration Accepted'
		];
	}, [rawHeaders]);

	// Curated column indexes for the "Executive View"
	const curatedColIndexes = useMemo(() => {
		const searchList = [
			'reference id', 'cadet name', 'registration', 'year of study', 'department',
			'cgpa', 'email', 'mobile', 'drive folder', 'problem in maritime', 'areas of innovation'
		];
		const indexes: number[] = [];
		searchList.forEach((term) => {
			const idx = effectiveHeaders.findIndex((h) => h.toLowerCase().includes(term));
			if (idx !== -1 && !indexes.includes(idx)) {
				indexes.push(idx);
			}
		});
		return indexes.length > 0 ? indexes : [0, 1, 2, 3, 4, 6, 8, 9, 10, 27, 28];
	}, [effectiveHeaders]);

	// Active headers to render based on viewMode
	const displayColumns = useMemo(() => {
		if (viewMode === 'native_curated') {
			return curatedColIndexes.map((idx) => ({
				colIndex: idx,
				letter: getExcelColumnLetter(idx),
				header: effectiveHeaders[idx] || `Column ${idx + 1}`,
			}));
		}
		return effectiveHeaders.map((header, idx) => ({
			colIndex: idx,
			letter: getExcelColumnLetter(idx),
			header: header || `Column ${idx + 1}`,
		}));
	}, [effectiveHeaders, viewMode, curatedColIndexes]);

	// Filter rows based on search query
	const filteredRows = useMemo(() => {
		if (!rawRows || rawRows.length === 0) return [];
		if (!searchQuery.trim()) return rawRows;

		const q = searchQuery.toLowerCase().trim();
		return rawRows.filter((row) =>
			row.some((cell) => cell && cell.toLowerCase().includes(q))
		);
	}, [rawRows, searchQuery]);

	// Copy active cell value to clipboard
	const copyActiveCell = () => {
		if (!activeCell) return;
		navigator.clipboard.writeText(activeCell.val);
		setCopiedCell(true);
		setTimeout(() => setCopiedCell(false), 2000);
	};

	// Copy entire table as TSV (Tab Separated Values) for direct pasting into Microsoft Excel / Google Sheets
	const copyTableAsTSV = () => {
		const headerRow = effectiveHeaders.join('\t');
		const dataRows = (rawRows || []).map((row) => row.join('\t')).join('\n');
		const tsvContent = `${headerRow}\n${dataRows}`;
		navigator.clipboard.writeText(tsvContent);
		setCopiedTsv(true);
		setTimeout(() => setCopiedTsv(false), 2500);
	};

	// Handle Cell Click
	const handleCellClick = (rowIdx: number, colIdx: number, val: string) => {
		setActiveCell({
			row: rowIdx + 1, // 1-indexed for Excel
			col: colIdx,
			val: val || '',
			letter: getExcelColumnLetter(colIdx),
		});
	};

	return (
		<div
			className={`space-y-4 ${
				isFullscreen ? 'fixed inset-3 z-50 bg-[#F8FAFC] p-4 rounded-2xl shadow-2xl overflow-y-auto flex flex-col' : ''
			}`}>
			{/* Top Excel Ribbon Toolbar */}
			<div className='bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 flex-shrink-0'>
				<div className='flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3'>
					{/* Left: Title & Active Cell Box */}
					<div className='flex items-center gap-3 min-w-0'>
						<div className='w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0'>
							<FileSpreadsheet className='w-4 h-4' />
						</div>
						<div className='min-w-0'>
							<div className='flex items-center gap-2'>
								<h3 className='font-semibold text-slate-900 text-sm sm:text-base truncate'>
									Live Spreadsheet
								</h3>
								<span className='px-2 py-0.5 rounded text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200'>
									34 Columns
								</span>
							</div>
							<p className='text-xs text-slate-500 truncate'>
								Connected to master Google Sheet
							</p>
						</div>
					</div>

					{/* View Switchers & Controls */}
					<div className='flex items-center gap-2 flex-wrap'>
						{/* View Mode Segmented Control */}
						<div className='flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-100 text-xs'>
							<button
								onClick={() => setViewMode('native_full')}
								className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
									viewMode === 'native_full'
										? 'bg-white text-slate-900 shadow-xs font-semibold'
										: 'text-slate-600 hover:text-slate-900'
								}`}>
								All Columns
							</button>
							<button
								onClick={() => setViewMode('native_curated')}
								className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
									viewMode === 'native_curated'
										? 'bg-white text-slate-900 shadow-xs font-semibold'
										: 'text-slate-600 hover:text-slate-900'
								}`}>
								Summary (11 cols)
							</button>
							<button
								onClick={() => setViewMode('google_embed')}
								className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
									viewMode === 'google_embed'
										? 'bg-white text-slate-900 shadow-xs font-semibold'
										: 'text-slate-600 hover:text-slate-900'
								}`}>
								Embed
							</button>
						</div>

						{/* Copy as TSV (for pasting into Excel) */}
						<button
							onClick={copyTableAsTSV}
							title='Copy sheet data formatted for Excel or Sheets'
							className='px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer'>
							{copiedTsv ? <Check className='w-3.5 h-3.5 text-emerald-600' /> : <Copy className='w-3.5 h-3.5 text-slate-400' />}
							<span>{copiedTsv ? 'Copied' : 'Copy Table'}</span>
						</button>

						{/* Download XLSX */}
						<a
							href={GOOGLE_SHEET_XLSX_URL}
							className='px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors'>
							<Download className='w-3.5 h-3.5' />
							<span>Download .xlsx</span>
						</a>

						{/* Open in Google Sheets */}
						<a
							href={GOOGLE_SHEET_URL}
							target='_blank'
							rel='noopener noreferrer'
							className='p-1.5 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors'
							title='Open Sheet in Google Drive'>
							<ExternalLink className='w-4 h-4' />
						</a>

						{/* Fullscreen Toggle */}
						<button
							onClick={() => setIsFullscreen(!isFullscreen)}
							className='p-1.5 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer'
							title='Toggle Fullscreen Spreadsheet'>
							{isFullscreen ? <Minimize2 className='w-4 h-4' /> : <Maximize2 className='w-4 h-4' />}
						</button>
					</div>
				</div>

				{/* Formula Bar & Coordinate Inspector */}
				{viewMode !== 'google_embed' && (
					<div className='flex items-center gap-2 pt-2 border-t border-slate-100 text-xs font-mono'>
						{/* Coordinate Box e.g. [B2] */}
						<div className='w-16 px-2.5 py-1.5 rounded bg-slate-100 border border-slate-300 font-bold text-center text-slate-700 flex-shrink-0'>
							{activeCell ? `${activeCell.letter}${activeCell.row}` : 'A1'}
						</div>

						{/* Formula fx symbol */}
						<span className='font-serif italic font-bold text-slate-400 select-none px-1'>
							fx
						</span>

						{/* Formula input text box */}
						<div className='flex-1 relative'>
							<input
								type='text'
								readOnly
								value={activeCell ? activeCell.val : 'Select any cell below to inspect its raw value'}
								className='w-full px-3 py-1.5 rounded border border-slate-300 bg-slate-50 text-slate-800 text-xs font-mono outline-none'
							/>
							{activeCell && activeCell.val && (
								<button
									onClick={copyActiveCell}
									title='Copy Cell Value'
									className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer'>
									{copiedCell ? (
										<Check className='w-3.5 h-3.5 text-emerald-600' />
									) : (
										<Copy className='w-3.5 h-3.5' />
									)}
								</button>
							)}
						</div>

						{/* Search Box in Sheet */}
						<div className='relative w-48 sm:w-64 flex-shrink-0'>
							<Search className='w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2' />
							<input
								type='text'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder='Search in sheet cells...'
								className='w-full pl-8 pr-3 py-1.5 rounded border border-slate-300 text-xs outline-none focus:border-emerald-600 bg-white font-sans'
							/>
						</div>
					</div>
				)}
			</div>

			{/* ======================================================================= */}
			{/* SPREADSHEET CONTENT DISPLAY                                             */}
			{/* ======================================================================= */}
			{viewMode === 'google_embed' ? (
				/* Google Sheet iframe embed */
				<div className='bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden h-[640px] flex flex-col'>
					<div className='bg-slate-800 text-white px-4 py-2 flex items-center justify-between text-xs'>
						<span className='font-medium'>Google Sheets Web View</span>
						<a
							href={GOOGLE_SHEET_URL}
							target='_blank'
							rel='noopener noreferrer'
							className='text-blue-300 hover:underline flex items-center gap-1'>
							Open in Google Sheets ↗
						</a>
					</div>
					<iframe
						src={GOOGLE_SHEET_EMBED_URL}
						title='IIC Official Google Sheet'
						className='w-full h-full border-0 flex-1'
					/>
				</div>
			) : (
				/* Native High-Performance Excel Grid */
				<div className='bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden flex flex-col flex-1 max-h-[640px]'>
					<div className='overflow-auto flex-1 select-text scrollbar-thin'>
						<table className='w-full border-collapse text-xs font-mono text-left'>
							{/* Header Row: Coordinates & Column Titles */}
							<thead className='sticky top-0 z-20 bg-[#F1F5F9] shadow-xs'>
								{/* Row of Excel Letters: A, B, C... */}
								<tr className='border-b border-slate-300 bg-[#E2E8F0] text-slate-600 font-bold select-none text-[11px]'>
									{/* Top Left Corner: 0,0 */}
									<th className='w-12 min-w-12 px-2 py-1 text-center border-r border-slate-300 bg-[#CBD5E1] sticky left-0 z-30'>
										#
									</th>
									{displayColumns.map((col) => (
										<th
											key={col.colIndex}
											className='px-3 py-1 text-center border-r border-slate-300 font-bold min-w-[180px]'>
											{col.letter}
										</th>
									))}
								</tr>

								{/* Row of Actual Column Headers */}
								<tr className='border-b border-slate-300 bg-slate-100 text-slate-800 text-[11px] font-semibold'>
									<th className='w-12 min-w-12 px-2 py-2 text-center border-r border-slate-300 bg-slate-200/80 sticky left-0 z-30 font-bold text-slate-600'>
										1
									</th>
									{displayColumns.map((col) => (
										<th
											key={col.colIndex}
											className='px-3 py-2 font-semibold border-r border-slate-300 truncate min-w-[180px] text-slate-800'
											title={col.header}>
											{col.header}
										</th>
									))}
								</tr>
							</thead>

							{/* Data Rows */}
							<tbody className='divide-y divide-slate-200 bg-white'>
								{filteredRows.length === 0 ? (
									<tr>
										<td
											colSpan={displayColumns.length + 1}
											className='p-12 text-center text-slate-400 font-sans text-xs'>
											No records found in spreadsheet data matching your query.
										</td>
									</tr>
								) : (
									filteredRows.map((row, rowIdx) => {
										// Match with CadetSubmissionRecord if available for interactive actions
										const refId = row[1] || '';
										const matchedCadet = submissions.find((s) => s.referenceId === refId);

										return (
											<tr
												key={rowIdx}
												className='hover:bg-blue-50/40 transition-colors group'>
												{/* Row Number Column (Sticky Left) */}
												<td className='w-12 min-w-12 px-2 py-2 text-center border-r border-slate-300 bg-slate-100 font-bold text-slate-500 sticky left-0 z-10 select-none group-hover:bg-blue-100 group-hover:text-blue-900 transition-colors text-[11px]'>
													{rowIdx + 2}
												</td>

												{/* Row Cells */}
												{displayColumns.map((col) => {
													const cellVal = row[col.colIndex] || '';
													const isDriveLink =
														cellVal.startsWith('http') && cellVal.includes('drive.google.com');
													const isEmail = cellVal.includes('@') && !cellVal.includes(' ');
													const isMatched =
														searchQuery.trim() &&
														cellVal.toLowerCase().includes(searchQuery.toLowerCase().trim());
													const isSelected =
														activeCell?.row === rowIdx + 2 && activeCell?.col === col.colIndex;

													return (
														<td
															key={col.colIndex}
															onClick={() => handleCellClick(rowIdx + 1, col.colIndex, cellVal)}
															className={`px-3 py-2 border-r border-slate-200 truncate max-w-[280px] cursor-pointer transition-colors ${
																isSelected
																	? 'bg-blue-100/80 outline-2 outline-[#1D4ED8] outline-offset-[-2px] text-blue-900 font-semibold'
																	: isMatched
																	? 'bg-amber-100 text-amber-900 font-bold'
																	: ''
															}`}
															title={cellVal}>
															{isDriveLink ? (
																<a
																	href={cellVal}
																	target='_blank'
																	rel='noopener noreferrer'
																	onClick={(e) => e.stopPropagation()}
																	className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10.5px] font-bold'>
																	<Folder className='w-3 h-3 text-emerald-600 flex-shrink-0' />
																	<span className='truncate'>Open Drive</span>
																	<ExternalLink className='w-2.5 h-2.5 opacity-70' />
																</a>
															) : isEmail ? (
																<a
																	href={`mailto:${cellVal}`}
																	onClick={(e) => e.stopPropagation()}
																	className='text-blue-600 hover:underline'>
																	{cellVal}
																</a>
															) : col.header.toLowerCase().includes('cadet name') && matchedCadet ? (
																<div className='flex items-center justify-between gap-1'>
																	<span className='font-bold text-slate-900 truncate'>{cellVal}</span>
																	<button
																		onClick={(e) => {
																			e.stopPropagation();
																			onViewCadetForm(matchedCadet);
																		}}
																		title='Open Application Form'
																		className='text-blue-600 hover:text-blue-800 p-0.5 rounded hover:bg-blue-100 flex-shrink-0'>
																		<Eye className='w-3 h-3' />
																	</button>
																</div>
															) : (
																<span className='text-slate-700'>{cellVal || '—'}</span>
															)}
														</td>
													);
												})}
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>

					{/* Sheet Status Bar (Bottom) */}
					<div className='bg-[#F1F5F9] border-t border-slate-300 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-slate-600 select-none flex-shrink-0'>
						<div className='flex items-center gap-3'>
							<span className='font-bold text-emerald-800 flex items-center gap-1'>
								<span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse' />
								READY
							</span>
							<span>|</span>
							<span>
								Total Rows: <strong>{rawRows.length}</strong> (Filtered: {filteredRows.length})
							</span>
							<span>|</span>
							<span>
								Total Columns: <strong>{effectiveHeaders.length}</strong>
							</span>
						</div>

						<div className='flex items-center gap-3'>
							{activeCell && (
								<span>
									Active: <strong>{activeCell.letter}{activeCell.row}</strong> ({activeCell.val.length} chars)
								</span>
							)}
							<span>Auto-calc: COUNT = {filteredRows.length}</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
