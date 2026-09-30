'use client';

import React, { useState, useMemo } from 'react';
import {
	BarChart3,
	TrendingUp,
	Award,
	Lightbulb,
	GraduationCap,
	Layers,
	ChevronRight,
	Calendar,
	Sparkles,
	Building2,
	CheckCircle2,
	Folder,
} from 'lucide-react';
import { CadetSubmissionRecord } from '../../api/admin/submissions/route';

interface NativeGraphsProps {
	submissions: CadetSubmissionRecord[];
}

export function NativeGraphs({ submissions }: NativeGraphsProps) {
	const [activeChartTab, setActiveChartTab] = useState<'all' | 'interests' | 'credentials' | 'cohort'>('all');
	const [hoveredPoint, setHoveredPoint] = useState<{ index: number; date: string; count: number; cumulative: number } | null>(null);

	// 1. Process Timeline Data (cumulative and per-day)
	const timelineData = useMemo(() => {
		if (submissions.length === 0) return [];

		// Parse dates: format in sheet is "DD/MM/YYYY HH:mm:ss"
		const dayCounts: Record<string, { date: string; count: number; rawDate: Date }> = {};

		submissions.forEach((sub) => {
			if (!sub.timestamp) return;
			const parts = sub.timestamp.split(' ');
			const datePart = parts[0] || 'Unknown';
			if (!dayCounts[datePart]) {
				// Parse date for chronological sorting
				const [d, m, y] = datePart.split('/').map(Number);
				const parsedDate = !isNaN(d) && !isNaN(m) && !isNaN(y) ? new Date(y, m - 1, d) : new Date();
				dayCounts[datePart] = { date: datePart, count: 0, rawDate: parsedDate };
			}
			dayCounts[datePart].count += 1;
		});

		const sorted = Object.values(dayCounts).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

		let runningTotal = 0;
		return sorted.map((item) => {
			runningTotal += item.count;
			return {
				date: item.date,
				count: item.count,
				cumulative: runningTotal,
			};
		});
	}, [submissions]);

	// 2. Process Innovation & Tech Domains
	const innovationDomainStats = useMemo(() => {
		const counts: Record<string, number> = {};
		submissions.forEach((sub) => {
			sub.areasOfInterest.forEach((area) => {
				const trimmed = area.trim();
				if (trimmed && trimmed.length > 2) {
					counts[trimmed] = (counts[trimmed] || 0) + 1;
				}
			});
		});

		return Object.entries(counts)
			.map(([domain, count]) => ({
				domain,
				count,
				percentage: Math.round((count / (submissions.length || 1)) * 100),
			}))
			.sort((a, b) => b.count - a.count);
	}, [submissions]);

	// 3. Process Year of Study Distribution
	const yearDistribution = useMemo(() => {
		const counts: Record<string, number> = {
			'1st Year': 0,
			'2nd Year': 0,
			'3rd Year': 0,
			'4th Year': 0,
			Other: 0,
		};

		submissions.forEach((s) => {
			const y = s.yearOfStudy || '';
			if (y.includes('1st')) counts['1st Year']++;
			else if (y.includes('2nd')) counts['2nd Year']++;
			else if (y.includes('3rd')) counts['3rd Year']++;
			else if (y.includes('4th')) counts['4th Year']++;
			else counts['Other']++;
		});

		const total = submissions.length || 1;
		return [
			{ label: '1st Year Cadets', count: counts['1st Year'], percent: Math.round((counts['1st Year'] / total) * 100), color: '#1D4ED8' },
			{ label: '2nd Year Cadets', count: counts['2nd Year'], percent: Math.round((counts['2nd Year'] / total) * 100), color: '#0284C7' },
			{ label: '3rd Year Cadets', count: counts['3rd Year'], percent: Math.round((counts['3rd Year'] / total) * 100), color: '#0D9488' },
			{ label: '4th Year Cadets', count: counts['4th Year'], percent: Math.round((counts['4th Year'] / total) * 100), color: '#D97706' },
		].filter((item) => item.count > 0);
	}, [submissions]);

	// 4. Process Academic & Research Credentials
	const credentialsData = useMemo(() => {
		const total = submissions.length || 1;
		let patents = 0;
		let publications = 0;
		let books = 0;
		let competitions = 0;
		let activities = 0;
		let leadership = 0;

		submissions.forEach((s) => {
			if (s.patents && s.patents !== 'NIL' && s.patents.toLowerCase() !== 'no') patents++;
			if (s.journalPub && s.journalPub !== 'NIL' && s.journalPub.toLowerCase() !== 'no') publications++;
			if (s.bookPub && s.bookPub !== 'NIL' && s.bookPub.toLowerCase() !== 'no') books++;
			if (s.competitions && s.competitions !== 'NIL' && s.competitions.toLowerCase() !== 'no') competitions++;
			if (s.activities && s.activities !== 'NIL' && s.activities.toLowerCase() !== 'no') activities++;
			if (s.leadership && s.leadership !== 'NIL' && s.leadership.toLowerCase() !== 'no') leadership++;
		});

		return [
			{ name: 'Patents / IPR & Copyrights', count: patents, percent: Math.round((patents / total) * 100), color: '#D97706', desc: 'Protected inventions & utility models' },
			{ name: 'Journal Publications', count: publications, percent: Math.round((publications / total) * 100), color: '#1D4ED8', desc: 'Peer-reviewed maritime & engineering papers' },
			{ name: 'Book Chapters', count: books, percent: Math.round((books / total) * 100), color: '#7C3AED', desc: 'Academic and technical book publications' },
			{ name: 'Competitions & Hackathons', count: competitions, percent: Math.round((competitions / total) * 100), color: '#059669', desc: 'Technical & innovation contest entries' },
			{ name: 'Technical Activities', count: activities, percent: Math.round((activities / total) * 100), color: '#0284C7', desc: 'Workshops, design projects & co-curriculars' },
			{ name: 'Leadership Roles', count: leadership, percent: Math.round((leadership / total) * 100), color: '#475569', desc: 'Council, cadet appointment & team leads' },
		];
	}, [submissions]);

	// 5. Department & Program Stats
	const departmentStats = useMemo(() => {
		const map: Record<string, number> = {};
		submissions.forEach((s) => {
			const dept = s.department || 'General / Unspecified';
			map[dept] = (map[dept] || 0) + 1;
		});
		const total = submissions.length || 1;
		return Object.entries(map).map(([name, count]) => ({
			name,
			count,
			percent: Math.round((count / total) * 100),
		})).sort((a, b) => b.count - a.count);
	}, [submissions]);

	// SVG Dimensions for Timeline Area Chart
	const chartWidth = 720;
	const chartHeight = 220;
	const padding = { top: 25, right: 30, bottom: 35, left: 45 };
	const innerWidth = chartWidth - padding.left - padding.right;
	const innerHeight = chartHeight - padding.top - padding.bottom;

	const maxCumulative = useMemo(() => {
		if (timelineData.length === 0) return 10;
		return Math.max(...timelineData.map((d) => d.cumulative), 5);
	}, [timelineData]);

	// Points calculation
	const points = useMemo(() => {
		if (timelineData.length === 0) return [];
		if (timelineData.length === 1) {
			const x = padding.left + innerWidth / 2;
			const y = padding.top + innerHeight - (timelineData[0].cumulative / maxCumulative) * innerHeight;
			return [{ x, y, data: timelineData[0] }];
		}
		return timelineData.map((d, i) => {
			const x = padding.left + (i / (timelineData.length - 1)) * innerWidth;
			const y = padding.top + innerHeight - (d.cumulative / maxCumulative) * innerHeight;
			return { x, y, data: d };
		});
	}, [timelineData, innerWidth, innerHeight, padding, maxCumulative]);

	const pathString = useMemo(() => {
		if (points.length === 0) return '';
		if (points.length === 1) {
			return `M ${points[0].x} ${points[0].y}`;
		}
		return points.reduce((acc, p, i) => {
			return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
		}, '');
	}, [points]);

	const areaString = useMemo(() => {
		if (points.length < 2) return '';
		const first = points[0];
		const last = points[points.length - 1];
		const baseline = padding.top + innerHeight;
		return `${pathString} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
	}, [points, pathString, padding, innerHeight]);

	return (
		<div className='space-y-6 animate-fadeIn'>
			{/* Sub-Tabs for Charts */}
			<div className='flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-200'>
				<div className='flex items-center gap-1.5 overflow-x-auto'>
					<button
						onClick={() => setActiveChartTab('all')}
						className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
							activeChartTab === 'all'
								? 'bg-slate-900 text-white shadow-xs font-semibold'
								: 'bg-slate-100 text-slate-600 hover:bg-slate-200'
						}`}>
						Overview
					</button>
					<button
						onClick={() => setActiveChartTab('interests')}
						className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
							activeChartTab === 'interests'
								? 'bg-slate-900 text-white shadow-xs font-semibold'
								: 'bg-slate-100 text-slate-600 hover:bg-slate-200'
						}`}>
						Focus Areas ({innovationDomainStats.length})
					</button>
					<button
						onClick={() => setActiveChartTab('credentials')}
						className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
							activeChartTab === 'credentials'
								? 'bg-slate-900 text-white shadow-xs font-semibold'
								: 'bg-slate-100 text-slate-600 hover:bg-slate-200'
						}`}>
						Research & Activities
					</button>
					<button
						onClick={() => setActiveChartTab('cohort')}
						className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
							activeChartTab === 'cohort'
								? 'bg-slate-900 text-white shadow-xs font-semibold'
								: 'bg-slate-100 text-slate-600 hover:bg-slate-200'
						}`}>
						Year of Study
					</button>
				</div>

				<div className='text-xs text-slate-500'>
					Total: <strong className='text-slate-800 font-semibold'>{submissions.length} applications</strong>
				</div>
			</div>

			{/* ======================================================================= */}
			{/* CHART 1: SUBMISSIONS REGISTRATION TIMELINE & VELOCITY                   */}
			{/* ======================================================================= */}
			{(activeChartTab === 'all' || activeChartTab === 'cohort') && (
				<div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2.5'>
							<div className='w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold'>
								<TrendingUp className='w-4 h-4' />
							</div>
							<div>
								<h3 className='text-sm sm:text-base font-semibold text-slate-900'>
									Submissions Timeline
								</h3>
								<p className='text-xs text-slate-500'>
									Applications received over time
								</p>
							</div>
						</div>

						{hoveredPoint && (
							<div className='px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-mono animate-fadeIn'>
								Date: <strong>{hoveredPoint.date}</strong> | Total: <strong>{hoveredPoint.cumulative}</strong> (+{hoveredPoint.count})
							</div>
						)}
					</div>

					{/* SVG Area Chart */}
					<div className='w-full overflow-x-auto'>
						<div className='min-w-[640px]'>
							<svg
								viewBox={`0 0 ${chartWidth} ${chartHeight}`}
								className='w-full h-auto select-none overflow-visible'>
								<defs>
									<linearGradient id='submissionAreaGrad' x1='0' y1='0' x2='0' y2='1'>
										<stop offset='0%' stopColor='#1D4ED8' stopOpacity='0.25' />
										<stop offset='100%' stopColor='#1D4ED8' stopOpacity='0.01' />
									</linearGradient>
								</defs>

								{/* Horizontal Grid lines */}
								{[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
									const y = padding.top + innerHeight * (1 - pct);
									const val = Math.round(maxCumulative * pct);
									return (
										<g key={i}>
											<line
												x1={padding.left}
												y1={y}
												x2={padding.left + innerWidth}
												y2={y}
												stroke='#E2E8F0'
												strokeDasharray='4 4'
												strokeWidth='1'
											/>
											<text
												x={padding.left - 8}
												y={y + 3.5}
												fontSize='10'
												textAnchor='end'
												fill='#94A3B8'
												fontFamily='var(--font-mono, monospace)'>
												{val}
											</text>
										</g>
									);
								})}

								{/* Area fill */}
								{areaString && (
									<path d={areaString} fill='url(#submissionAreaGrad)' />
								)}

								{/* Main Line */}
								{pathString && (
									<path
										d={pathString}
										fill='none'
										stroke='#1D4ED8'
										strokeWidth='2.5'
										strokeLinecap='round'
										strokeLinejoin='round'
									/>
								)}

								{/* Interactive Data Points */}
								{points.map((p, i) => {
									const isHovered = hoveredPoint?.index === i;
									return (
										<g
											key={i}
											className='cursor-pointer'
											onMouseEnter={() =>
												setHoveredPoint({
													index: i,
													date: p.data.date,
													count: p.data.count,
													cumulative: p.data.cumulative,
												})
											}
											onMouseLeave={() => setHoveredPoint(null)}>
											{/* Expanded invisible hit area to prevent boundary flicker */}
											<circle
												cx={p.x}
												cy={p.y}
												r='14'
												fill='transparent'
											/>
											{/* Visible circle with state-driven radius and color */}
											<circle
												cx={p.x}
												cy={p.y}
												r={isHovered ? 7 : 5}
												fill={isHovered ? '#DBEAFE' : '#FFFFFF'}
												stroke='#1D4ED8'
												strokeWidth={isHovered ? 3 : 2.5}
												className='transition-colors duration-150'
											/>
											{/* X-axis date labels */}
											<text
												x={p.x}
												y={chartHeight - 10}
												fontSize='9.5'
												textAnchor='middle'
												fill={isHovered ? '#1D4ED8' : '#64748B'}
												fontWeight={isHovered ? '600' : 'normal'}
												fontFamily='var(--font-mono, monospace)'>
												{p.data.date.slice(0, 5)}
											</text>
										</g>
									);
								})}
							</svg>
						</div>
					</div>

					<div className='flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100'>
						<span>Hover over points to inspect date counts.</span>
						<span className='font-mono'>Total: {submissions.length}</span>
					</div>
				</div>
			)}

			{/* ======================================================================= */}
			{/* CHART 2: COHORT (YEAR OF STUDY) PROPORTIONAL PROGRESS BAR                */}
			{/* ======================================================================= */}
			{(activeChartTab === 'all' || activeChartTab === 'cohort') && (
				<div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4'>
					<div className='flex items-center gap-2.5'>
						<div className='w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold'>
							<GraduationCap className='w-4 h-4' />
						</div>
						<div>
							<h3 className='text-sm sm:text-base font-semibold text-slate-900'>
								Applicants by Year of Study
							</h3>
							<p className='text-xs text-slate-500'>
								Distribution across undergraduate batches
							</p>
						</div>
					</div>

					{/* Multi-segment distribution bar */}
					<div className='h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner'>
						{yearDistribution.map((item, idx) => (
							<div
								key={idx}
								style={{ width: `${item.percent}%`, backgroundColor: item.color }}
								title={`${item.label}: ${item.count} (${item.percent}%)`}
								className='h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full hover:opacity-90'
							/>
						))}
					</div>

					{/* Metrics Legend Grid */}
					<div className='grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1'>
						{yearDistribution.map((item, idx) => (
							<div key={idx} className='p-3 rounded-xl bg-slate-50 border border-slate-200'>
								<div className='flex items-center gap-1.5 text-xs text-slate-600 mb-1'>
									<span
										className='w-2.5 h-2.5 rounded-full flex-shrink-0'
										style={{ backgroundColor: item.color }}
									/>
									<span className='font-semibold truncate'>{item.label}</span>
								</div>
								<div className='flex items-baseline gap-2'>
									<span className='text-xl font-extrabold text-slate-900 font-heading'>
										{item.count}
									</span>
									<span className='text-xs font-mono font-bold' style={{ color: item.color }}>
										{item.percent}%
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* ======================================================================= */}
			{/* CHART 3: TOP INNOVATION & TECH DOMAINS (RANKED BAR CHART)                */}
			{/* ======================================================================= */}
			{(activeChartTab === 'all' || activeChartTab === 'interests') && (
				<div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2.5'>
							<div className='w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold'>
								<Lightbulb className='w-4 h-4' />
							</div>
							<div>
								<h3 className='text-sm sm:text-base font-semibold text-slate-900'>
									Innovation Focus Areas
								</h3>
								<p className='text-xs text-slate-500'>
									Domains selected by applicants
								</p>
							</div>
						</div>
						<span className='text-xs font-semibold text-slate-500 font-mono'>
							{innovationDomainStats.length} Unique Domains
						</span>
					</div>

					<div className='space-y-3 pt-2'>
						{innovationDomainStats.length === 0 ? (
							<p className='text-xs text-slate-400'>No innovation interest data recorded yet.</p>
						) : (
							innovationDomainStats.map((item, idx) => (
								<div key={idx} className='space-y-1.5 group'>
									<div className='flex items-center justify-between text-xs'>
										<div className='flex items-center gap-2 min-w-0 pr-2'>
											<span className='w-5 text-[11px] font-mono text-slate-400 font-bold flex-shrink-0'>
												#{idx + 1}
											</span>
											<span className='font-semibold text-slate-800 group-hover:text-blue-700 transition-colors truncate'>
												{item.domain}
											</span>
										</div>
										<div className='flex items-center gap-2 flex-shrink-0 font-mono text-xs'>
											<span className='text-slate-500'>{item.count} applicants</span>
											<span className='font-bold text-[#1D4ED8] bg-blue-50 px-1.5 py-0.2 rounded'>
												{item.percentage}%
											</span>
										</div>
									</div>
									<div className='h-2.5 w-full bg-slate-100 rounded-full overflow-hidden'>
										<div
											className='h-full bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#0284C7] rounded-full transition-all duration-500 group-hover:brightness-110'
											style={{ width: `${Math.max(item.percentage, 4)}%` }}
										/>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			)}

			{/* ======================================================================= */}
			{/* CHART 4: ACADEMIC & RESEARCH CREDENTIALS RADAR / BREAKDOWN               */}
			{/* ======================================================================= */}
			{(activeChartTab === 'all' || activeChartTab === 'credentials') && (
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					{/* Credentials Bar Matrix */}
					<div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4'>
						<div className='flex items-center gap-2.5'>
							<div className='w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold'>
								<Award className='w-4 h-4' />
							</div>
							<div>
								<h3 className='text-sm sm:text-base font-semibold text-slate-900'>
									Research & Extracurricular Credentials
								</h3>
								<p className='text-xs text-slate-500'>
									Applicant qualifications and reported activities
								</p>
							</div>
						</div>

						<div className='space-y-4 pt-2'>
							{credentialsData.map((cred, idx) => (
								<div key={idx} className='space-y-1.5'>
									<div className='flex items-center justify-between text-xs'>
										<div>
											<span className='font-bold text-slate-800 block'>{cred.name}</span>
											<span className='text-[10.5px] text-slate-400'>{cred.desc}</span>
										</div>
										<div className='text-right font-mono'>
											<span className='font-bold text-slate-900 text-sm'>{cred.count}</span>
											<span className='text-slate-400 text-xs ml-1'>({cred.percent}%)</span>
										</div>
									</div>
									<div className='h-2 w-full bg-slate-100 rounded-full overflow-hidden'>
										<div
											className='h-full rounded-full transition-all duration-500'
											style={{
												width: `${Math.max(cred.percent, 3)}%`,
												backgroundColor: cred.color,
											}}
										/>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Department / Program Representation */}
					<div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4'>
						<div className='flex items-center gap-2.5'>
							<div className='w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold'>
								<Building2 className='w-4 h-4' />
							</div>
							<div>
								<h3 className='text-sm sm:text-base font-semibold text-slate-900'>
									Applications by Department
								</h3>
								<p className='text-xs text-slate-500'>
									Distribution across academic branches
								</p>
							</div>
						</div>

						<div className='space-y-3 pt-2'>
							{departmentStats.map((dept, idx) => (
								<div key={idx} className='p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2'>
									<div className='flex items-center justify-between text-xs'>
										<span className='font-semibold text-slate-800'>{dept.name}</span>
										<span className='font-mono font-medium text-slate-600'>
											{dept.count} applicants ({dept.percent}%)
										</span>
									</div>
									<div className='h-2 w-full bg-slate-200 rounded-full overflow-hidden'>
										<div
											className='h-full bg-slate-800 rounded-full'
											style={{ width: `${dept.percent}%` }}
										/>
									</div>
								</div>
							))}
						</div>

						<div className='p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2'>
							<Folder className='w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5' />
							<div>
								<span className='font-semibold text-slate-800'>Document Verification:</span> Uploaded publications, certificates, and marksheet proofs are organized in each applicant&apos;s Google Drive folder, accessible via the Applications or Drive Folders tab.
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
