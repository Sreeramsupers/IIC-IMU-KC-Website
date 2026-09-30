'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
	Search,
	Filter,
	Download,
	RefreshCw,
	ExternalLink,
	Folder,
	FolderOpen,
	FileText,
	Table as TableIcon,
	Grid,
	User,
	Mail,
	Phone,
	Building2,
	GraduationCap,
	Award,
	Lightbulb,
	ShieldCheck,
	CheckCircle2,
	Clock,
	AlertCircle,
	X,
	Copy,
	Check,
	Printer,
	Sparkles,
	BarChart3,
	SlidersHorizontal,
	Lock,
	Unlock,
	Layers,
	Eye,
	Share2,
	Maximize2,
	Minimize2,
	ChevronRight,
} from 'lucide-react';
import { CadetSubmissionRecord } from '../api/admin/submissions/route';
import { NativeSpreadsheet } from './components/NativeSpreadsheet';
import { NativeGraphs } from './components/NativeGraphs';

const GOOGLE_SHEET_URL =
	'https://docs.google.com/spreadsheets/d/1xq90Rse_QraqiaVUpW7ettaW9kdlIqTtZF-pnnBl4pI/edit?usp=sharing';
const GOOGLE_SHEET_EMBED_URL =
	'https://docs.google.com/spreadsheets/d/1xq90Rse_QraqiaVUpW7ettaW9kdlIqTtZF-pnnBl4pI/htmlembed?widget=true&headers=false';
const GOOGLE_SHEET_XLSX_URL =
	'https://docs.google.com/spreadsheets/d/1xq90Rse_QraqiaVUpW7ettaW9kdlIqTtZF-pnnBl4pI/export?format=xlsx';
const GOOGLE_SHEET_CSV_URL =
	'https://docs.google.com/spreadsheets/d/1xq90Rse_QraqiaVUpW7ettaW9kdlIqTtZF-pnnBl4pI/export?format=csv';

export type ReviewStatus = 'All' | 'Submitted' | 'Under Review' | 'Shortlisted' | 'Selected' | 'On Hold';

export default function AdminDashboard() {
	// Authentication state
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
	const [pinInput, setPinInput] = useState<string>('');
	const [authError, setAuthError] = useState<string>('');

	// Data fetching states
	const [submissions, setSubmissions] = useState<CadetSubmissionRecord[]>([]);
	const [rawHeaders, setRawHeaders] = useState<string[]>([]);
	const [rawRows, setRawRows] = useState<string[][]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [lastSyncTime, setLastSyncTime] = useState<string>('');
	const [error, setError] = useState<string | null>(null);

	// Navigation & view states
	const [activeTab, setActiveTab] = useState<'submissions' | 'sheet' | 'drive' | 'analytics'>('submissions');
	const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
	const [sheetFullscreen, setSheetFullscreen] = useState<boolean>(false);

	// Filter & search states
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [selectedYear, setSelectedYear] = useState<string>('All');
	const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
	const [selectedProofFilter, setSelectedProofFilter] = useState<string>('All');
	const [selectedStatusFilter, setSelectedStatusFilter] = useState<ReviewStatus>('All');
	const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'ref'>('newest');

	// Candidate evaluation state (stored in localStorage)
	const [reviewStatuses, setReviewStatuses] = useState<Record<string, ReviewStatus>>({});
	const [candidateNotes, setCandidateNotes] = useState<Record<string, string>>({});

	// Selected submission for detailed Application Form modal
	const [selectedCadet, setSelectedCadet] = useState<CadetSubmissionRecord | null>(null);
	const [copiedRef, setCopiedRef] = useState<string | null>(null);
	const [copiedDrive, setCopiedDrive] = useState<string | null>(null);

	// Auto-refresh timer state
	const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(false);

	// Check local authentication on mount
	useEffect(() => {
		try {
			const savedAuth = localStorage.getItem('iic_admin_auth');
			if (savedAuth === 'true') {
				setIsAuthenticated(true);
			}
			const savedStatuses = localStorage.getItem('iic_admin_review_statuses');
			if (savedStatuses) {
				setReviewStatuses(JSON.parse(savedStatuses));
			}
			const savedNotes = localStorage.getItem('iic_admin_candidate_notes');
			if (savedNotes) {
				setCandidateNotes(JSON.parse(savedNotes));
			}
		} catch (e) {
			console.warn('Storage read warning:', e);
		}
	}, []);

	// Handle Passcode Unlock via /api/admin/auth
	const handleUnlock = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		const trimmed = pinInput.trim();
		if (!trimmed) {
			setAuthError('Please enter the admin password.');
			return;
		}

		setIsAuthenticating(true);
		setAuthError('');

		try {
			const res = await fetch('/api/admin/auth', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ password: trimmed }),
			});

			const data = await res.json();

			if (res.ok && data.success) {
				setIsAuthenticated(true);
				setAuthError('');
				try {
					localStorage.setItem('iic_admin_auth', 'true');
				} catch (_) {}
			} else {
				setAuthError(data.error || 'Incorrect admin password. Please try again.');
			}
		} catch (err) {
			console.error('Auth verification error:', err);
			// Fallback check against NEXT_PUBLIC_ADMIN_PASSWORD if offline/network issue
			const clientFallback = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'iic2026';
			if (trimmed === clientFallback) {
				setIsAuthenticated(true);
				setAuthError('');
				try {
					localStorage.setItem('iic_admin_auth', 'true');
				} catch (_) {}
			} else {
				setAuthError('Could not verify password. Please try again.');
			}
		} finally {
			setIsAuthenticating(false);
		}
	};

	const handleLock = () => {
		setIsAuthenticated(false);
		setPinInput('');
		setAuthError('');
		try {
			localStorage.removeItem('iic_admin_auth');
		} catch (_) {}
	};

	// Fetch submissions from API
	const fetchSubmissions = useCallback(async (isSilent = false) => {
		if (!isSilent) setRefreshing(true);
		setError(null);
		try {
			const res = await fetch(`/api/admin/submissions?t=${Date.now()}`, {
				cache: 'no-store',
			});
			const data = await res.json();
			if (data.success && Array.isArray(data.submissions)) {
				setSubmissions(data.submissions);
				setRawHeaders(data.rawHeaders || []);
				setRawRows(data.rawRows || []);
				setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
			} else {
				throw new Error(data.error || 'Failed to parse submissions data');
			}
		} catch (err) {
			console.error('Fetch submissions error:', err);
			setError(err instanceof Error ? err.message : 'Could not fetch submissions from Google Sheet');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	useEffect(() => {
		if (isAuthenticated) {
			fetchSubmissions();
		}
	}, [isAuthenticated, fetchSubmissions]);

	// Auto refresh interval (30s)
	useEffect(() => {
		if (!autoRefreshEnabled || !isAuthenticated) return;
		const interval = setInterval(() => {
			fetchSubmissions(true);
		}, 30000);
		return () => clearInterval(interval);
	}, [autoRefreshEnabled, isAuthenticated, fetchSubmissions]);

	// Copy to clipboard helper
	const copyToClipboard = (text: string, type: 'ref' | 'drive', id: string) => {
		navigator.clipboard.writeText(text);
		if (type === 'ref') {
			setCopiedRef(id);
			setTimeout(() => setCopiedRef(null), 2000);
		} else {
			setCopiedDrive(id);
			setTimeout(() => setCopiedDrive(null), 2000);
		}
	};

	// Status update handler
	const updateCadetStatus = (refId: string, status: ReviewStatus) => {
		const updated = { ...reviewStatuses, [refId]: status };
		setReviewStatuses(updated);
		try {
			localStorage.setItem('iic_admin_review_statuses', JSON.stringify(updated));
		} catch (_) {}
	};

	// Notes update handler
	const updateCadetNotes = (refId: string, notes: string) => {
		const updated = { ...candidateNotes, [refId]: notes };
		setCandidateNotes(updated);
		try {
			localStorage.setItem('iic_admin_candidate_notes', JSON.stringify(updated));
		} catch (_) {}
	};

	// Filter and sort submissions
	const filteredSubmissions = useMemo(() => {
		return submissions.filter((sub) => {
			// Search filter
			if (searchTerm.trim()) {
				const term = searchTerm.toLowerCase().trim();
				const matchName = sub.cadetName.toLowerCase().includes(term);
				const matchRef = sub.referenceId.toLowerCase().includes(term);
				const matchReg = sub.regNumber.toLowerCase().includes(term);
				const matchEmail = sub.email.toLowerCase().includes(term);
				const matchPhone = sub.phone.includes(term);
				const matchProblem =
					sub.problemMaritime.toLowerCase().includes(term) ||
					sub.problemSociety.toLowerCase().includes(term);
				const matchInterests = sub.rawInterests.toLowerCase().includes(term);

				if (
					!matchName &&
					!matchRef &&
					!matchReg &&
					!matchEmail &&
					!matchPhone &&
					!matchProblem &&
					!matchInterests
				) {
					return false;
				}
			}

			// Year filter
			if (selectedYear !== 'All' && sub.yearOfStudy !== selectedYear) {
				return false;
			}

			// Department filter
			if (selectedDepartment !== 'All' && sub.department !== selectedDepartment) {
				return false;
			}

			// Proofs filter
			if (selectedProofFilter === 'patents' && (!sub.patents || sub.patents === 'NIL')) {
				return false;
			}
			if (selectedProofFilter === 'publications' && (!sub.journalPub || sub.journalPub === 'NIL')) {
				return false;
			}
			if (selectedProofFilter === 'competitions' && (!sub.competitions || sub.competitions === 'NIL')) {
				return false;
			}
			if (selectedProofFilter === 'activities' && (!sub.activities || sub.activities === 'NIL')) {
				return false;
			}

			// Review status filter
			const currentStatus = reviewStatuses[sub.referenceId] || 'Submitted';
			if (selectedStatusFilter !== 'All' && currentStatus !== selectedStatusFilter) {
				return false;
			}

			return true;
		}).sort((a, b) => {
			if (sortBy === 'name') {
				return a.cadetName.localeCompare(b.cadetName);
			}
			if (sortBy === 'ref') {
				return a.referenceId.localeCompare(b.referenceId);
			}
			if (sortBy === 'oldest') {
				return a.id.localeCompare(b.id);
			}
			// default: newest first
			return b.id.localeCompare(a.id);
		});
	}, [
		submissions,
		searchTerm,
		selectedYear,
		selectedDepartment,
		selectedProofFilter,
		selectedStatusFilter,
		sortBy,
		reviewStatuses,
	]);

	// Extract unique departments for dropdown
	const departmentsList = useMemo(() => {
		const set = new Set<string>();
		submissions.forEach((s) => {
			if (s.department && s.department.trim()) set.add(s.department.trim());
		});
		return Array.from(set);
	}, [submissions]);

	// Innovation interest frequencies
	const interestStats = useMemo(() => {
		const map: Record<string, number> = {};
		submissions.forEach((s) => {
			s.areasOfInterest.forEach((item) => {
				const clean = item.trim();
				if (clean && clean.length > 2) {
					map[clean] = (map[clean] || 0) + 1;
				}
			});
		});
		return Object.entries(map).sort((a, b) => b[1] - a[1]);
	}, [submissions]);

	// Quick Stats counts
	const stats = useMemo(() => {
		const total = submissions.length;
		const firstYearCount = submissions.filter((s) => s.yearOfStudy.includes('1st')).length;
		const seniorCount = total - firstYearCount;
		const withPatents = submissions.filter((s) => s.patents && s.patents !== 'NIL').length;
		const withPubs = submissions.filter((s) => s.journalPub && s.journalPub !== 'NIL').length;
		const withCompetitions = submissions.filter((s) => s.competitions && s.competitions !== 'NIL').length;
		const withDrive = submissions.filter((s) => s.driveFolderUrl && s.driveFolderUrl.startsWith('http')).length;

		return {
			total,
			firstYearCount,
			seniorCount,
			withPatents,
			withPubs,
			withCompetitions,
			withDrive,
		};
	}, [submissions]);

	// Export submissions to CSV
	const exportToCSV = () => {
		if (filteredSubmissions.length === 0) return;
		const headers = [
			'Reference ID',
			'Cadet Name',
			'Registration Number',
			'Year of Study',
			'Department',
			'Semester',
			'Email',
			'Mobile Phone',
			'CGPA',
			'Drive Folder URL',
			'Review Status',
			'Submission Timestamp',
		];
		const rows = filteredSubmissions.map((s) => [
			`"${s.referenceId}"`,
			`"${s.cadetName.replace(/"/g, '""')}"`,
			`"${s.regNumber}"`,
			`"${s.yearOfStudy}"`,
			`"${s.department}"`,
			`"${s.semester}"`,
			`"${s.email}"`,
			`"${s.phone}"`,
			`"${s.cgpa}"`,
			`"${s.driveFolderUrl}"`,
			`"${reviewStatuses[s.referenceId] || 'Submitted'}"`,
			`"${s.timestamp}"`,
		]);
		const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
		const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.setAttribute('href', url);
		link.setAttribute('download', `IIC_Submissions_Export_${new Date().toISOString().slice(0, 10)}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	// Print Application Form handler
	const handlePrint = () => {
		window.print();
	};

	// --------------------------------------------------------------------------
	// PASSCODE GATE SCREEN (CLEAN INSTITUTIONAL STYLE)
	// --------------------------------------------------------------------------
	if (!isAuthenticated) {
		return (
			<div className='min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 selection:bg-[#1D4ED8] selection:text-white'>
				<div className='w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6 animate-fadeIn'>
					<div className='text-center space-y-2'>
						<div className='w-14 h-14 mx-auto mb-2 flex items-center justify-center bg-slate-50 rounded-2xl p-2 border border-slate-100'>
							<Image
								src='/imu-logo.png'
								alt='IMU Crest'
								width={48}
								height={48}
								className='object-contain'
							/>
						</div>
						<h1 className='text-xl font-bold text-slate-900 tracking-tight'>
							IIC Admin Portal
						</h1>
						<p className='text-xs text-slate-500'>
							Indian Maritime University • Kolkata Campus
						</p>
					</div>

					<form onSubmit={handleUnlock} className='space-y-4 pt-2'>
						<div>
							<label className='block text-xs font-semibold text-slate-700 mb-1.5'>
								Admin Password
							</label>
							<div className='relative'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400'>
									<Lock className='w-4 h-4' />
								</div>
								<input
									type='password'
									value={pinInput}
									onChange={(e) => {
										setPinInput(e.target.value);
										setAuthError('');
									}}
									placeholder='Enter password'
									disabled={isAuthenticating}
									className='w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/10 text-sm outline-none transition-colors disabled:opacity-60'
									autoFocus
								/>
							</div>
							{authError && (
								<p className='text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium'>
									<AlertCircle className='w-3.5 h-3.5 flex-shrink-0' /> {authError}
								</p>
							)}
						</div>

						<button
							type='submit'
							disabled={isAuthenticating}
							className='w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer'>
							{isAuthenticating ? (
								<>
									<RefreshCw className='w-4 h-4 animate-spin text-slate-300' />
									<span>Verifying...</span>
								</>
							) : (
								<span>Sign In</span>
							)}
						</button>
					</form>

					<div className='pt-4 border-t border-slate-100 text-center text-xs text-slate-400'>
						<Link
							href='/'
							className='hover:text-slate-700 transition-colors font-medium'>
							← Return to Student Application
						</Link>
					</div>
				</div>
			</div>
		);
	}

	// --------------------------------------------------------------------------
	// MAIN ADMIN DASHBOARD VIEW
	// --------------------------------------------------------------------------
	return (
		<div className='min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-[#1D4ED8] selection:text-white'>
			{/* Institutional Header */}
			<header className='bg-[#0A192F] text-white border-b border-slate-800 sticky top-0 z-30 shadow-xs'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex items-center justify-between h-16 sm:h-18 gap-3'>
						{/* Logo and Titles */}
						<div className='flex items-center gap-3 min-w-0'>
							<div className='w-9 h-9 sm:w-10 sm:h-10 relative flex-shrink-0 bg-white/10 rounded-lg p-1.5 border border-white/10'>
								<Image
									src='/imu-logo.png'
									alt='IMU Crest'
									width={40}
									height={40}
									className='object-contain w-full h-full'
								/>
							</div>
							<div className='min-w-0'>
								<h1 className='text-sm sm:text-base font-semibold text-white tracking-tight truncate'>
									Institution’s Innovation Council
								</h1>
								<p className='text-xs text-slate-400 truncate'>
									IMU Kolkata Campus • Admin Portal
								</p>
							</div>
						</div>

						{/* Actions */}
						<div className='flex items-center gap-2 sm:gap-2.5 flex-shrink-0'>
							{/* Refresh Button */}
							<button
								onClick={() => fetchSubmissions()}
								disabled={refreshing}
								title={lastSyncTime ? `Last synced at ${lastSyncTime}` : 'Sync with Google Sheet'}
								className='px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 border border-slate-700'>
								<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
								<span className='hidden sm:inline'>{refreshing ? 'Syncing...' : lastSyncTime ? `Sync (${lastSyncTime})` : 'Sync'}</span>
							</button>

							{/* Google Sheet Link */}
							<a
								href={GOOGLE_SHEET_URL}
								target='_blank'
								rel='noopener noreferrer'
								title='Open source Google Sheet'
								className='px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700'>
								<TableIcon className='w-3.5 h-3.5 text-emerald-400' />
								<span className='hidden sm:inline'>Sheet</span>
								<ExternalLink className='w-3 h-3 opacity-60' />
							</a>

							{/* Student Form Link */}
							<Link
								href='/'
								title='View student registration form'
								className='px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700'>
								<User className='w-3.5 h-3.5 text-blue-400' />
								<span className='hidden sm:inline'>Student Form</span>
							</Link>

							{/* Lock Button */}
							<button
								onClick={handleLock}
								title='Sign out of admin portal'
								className='p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-700'>
								<Lock className='w-4 h-4' />
							</button>
						</div>
					</div>

					{/* Navigation Tabs Bar */}
					<div className='flex items-center gap-1 overflow-x-auto border-t border-slate-800 pt-1 -mb-[1px] scrollbar-none'>
						<button
							onClick={() => setActiveTab('submissions')}
							className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
								activeTab === 'submissions'
									? 'bg-[#F8FAFC] text-slate-900 font-semibold border-t-2 border-blue-600'
									: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-t-2 border-transparent'
							}`}>
							<FileText className='w-4 h-4' />
							Applications ({submissions.length})
						</button>

						<button
							onClick={() => setActiveTab('sheet')}
							className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
								activeTab === 'sheet'
									? 'bg-[#F8FAFC] text-slate-900 font-semibold border-t-2 border-blue-600'
									: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-t-2 border-transparent'
							}`}>
							<TableIcon className='w-4 h-4' />
							Spreadsheet
						</button>

						<button
							onClick={() => setActiveTab('analytics')}
							className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
								activeTab === 'analytics'
									? 'bg-[#F8FAFC] text-slate-900 font-semibold border-t-2 border-blue-600'
									: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-t-2 border-transparent'
							}`}>
							<BarChart3 className='w-4 h-4' />
							Analytics
						</button>

						<button
							onClick={() => setActiveTab('drive')}
							className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
								activeTab === 'drive'
									? 'bg-[#F8FAFC] text-slate-900 font-semibold border-t-2 border-blue-600'
									: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-t-2 border-transparent'
							}`}>
							<FolderOpen className='w-4 h-4' />
							Drive Folders ({stats.withDrive})
						</button>
					</div>
				</div>
			</header>

			{/* Main Container */}
			<main className='flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6'>
				{/* Clean Unified Metrics Strip */}
				<div className='bg-white rounded-xl border border-slate-200/80 shadow-xs grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-slate-100 overflow-hidden'>
					{/* Stat 1: Total Applications */}
					<div className='p-4'>
						<span className='text-xs text-slate-500 font-medium block'>Applications</span>
						<div className='text-2xl font-bold text-slate-900 mt-1 font-heading'>
							{stats.total}
						</div>
						<span className='text-[11px] text-slate-400 block mt-0.5'>Total received</span>
					</div>

					{/* Stat 2: 1st Year */}
					<div className='p-4'>
						<span className='text-xs text-slate-500 font-medium block'>1st Year</span>
						<div className='text-2xl font-bold text-slate-900 mt-1 font-heading'>
							{stats.firstYearCount}
						</div>
						<span className='text-[11px] text-slate-400 block mt-0.5'>
							{stats.total > 0 ? `${Math.round((stats.firstYearCount / stats.total) * 100)}% of total` : '0%'}
						</span>
					</div>

					{/* Stat 3: Senior Cadets */}
					<div className='p-4'>
						<span className='text-xs text-slate-500 font-medium block'>2nd–4th Year</span>
						<div className='text-2xl font-bold text-slate-900 mt-1 font-heading'>
							{stats.seniorCount}
						</div>
						<span className='text-[11px] text-slate-400 block mt-0.5'>
							{stats.total > 0 ? `${Math.round((stats.seniorCount / stats.total) * 100)}% of total` : '0%'}
						</span>
					</div>

					{/* Stat 4: Research & Patents */}
					<div className='p-4'>
						<span className='text-xs text-slate-500 font-medium block'>Research & IPR</span>
						<div className='text-2xl font-bold text-slate-900 mt-1 font-heading'>
							{stats.withPubs + stats.withPatents}
						</div>
						<span className='text-[11px] text-slate-400 block mt-0.5 truncate' title={`${stats.withPatents} patents, ${stats.withPubs} publications`}>
							{stats.withPatents} patents, {stats.withPubs} pubs
						</span>
					</div>

					{/* Stat 5: Hackathons */}
					<div className='p-4'>
						<span className='text-xs text-slate-500 font-medium block'>Competitions</span>
						<div className='text-2xl font-bold text-slate-900 mt-1 font-heading'>
							{stats.withCompetitions}
						</div>
						<span className='text-[11px] text-slate-400 block mt-0.5'>Contests & events</span>
					</div>

					{/* Stat 6: Drive Folders */}
					<div className='p-4'>
						<span className='text-xs text-slate-500 font-medium block'>Drive Folders</span>
						<div className='text-2xl font-bold text-slate-900 mt-1 font-heading'>
							{stats.withDrive}
						</div>
						<span className='text-[11px] text-emerald-600 font-medium block mt-0.5'>
							Linked to Drive
						</span>
					</div>
				</div>

				{/* Error Notice if fetch failed */}
				{error && (
					<div className='p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-3 shadow-xs'>
						<AlertCircle className='w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5' />
						<div className='flex-1'>
							<p className='font-bold'>Notice regarding Google Sheet Synchronization</p>
							<p className='text-xs mt-0.5'>{error}</p>
							<div className='mt-2 flex items-center gap-3'>
								<button
									onClick={() => fetchSubmissions()}
									className='px-3 py-1 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700 transition-colors cursor-pointer'>
									Retry Sync Now
								</button>
								<a
									href={GOOGLE_SHEET_URL}
									target='_blank'
									rel='noopener noreferrer'
									className='text-xs text-amber-700 underline font-semibold flex items-center gap-1'>
									Open Google Sheet Directly ↗
								</a>
							</div>
						</div>
					</div>
				)}

				{/* ---------------------------------------------------------------------- */}
				{/* TAB 1: SUBMISSIONS LIST & TABLE                                        */}
				{/* ---------------------------------------------------------------------- */}
				{activeTab === 'submissions' && (
					<div className='space-y-4'>
						{/* Search & Filters Toolbar */}
						<div className='bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3'>
							<div className='flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between'>
								{/* Search Bar */}
								<div className='relative flex-1 min-w-[240px]'>
									<Search className='w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2' />
									<input
										type='text'
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										placeholder='Search by name, roll number, reference ID, or department...'
										className='w-full pl-10 pr-8 py-2 rounded-lg border border-slate-300 focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/10 text-xs sm:text-sm outline-none transition-colors'
									/>
									{searchTerm && (
										<button
											onClick={() => setSearchTerm('')}
											className='absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer'>
											<X className='w-4 h-4' />
										</button>
									)}
								</div>

								{/* Controls and Export */}
								<div className='flex items-center gap-2 flex-wrap'>
									{/* View Mode Toggle */}
									<div className='flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50'>
										<button
											onClick={() => setViewMode('table')}
											title='Table View'
											className={`p-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
												viewMode === 'table'
													? 'bg-white text-slate-900 shadow-xs font-semibold'
													: 'text-slate-500 hover:text-slate-800'
											}`}>
											<TableIcon className='w-4 h-4' />
										</button>
										<button
											onClick={() => setViewMode('cards')}
											title='Card Grid View'
											className={`p-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
												viewMode === 'cards'
													? 'bg-white text-slate-900 shadow-xs font-semibold'
													: 'text-slate-500 hover:text-slate-800'
											}`}>
											<Grid className='w-4 h-4' />
										</button>
									</div>

									{/* Export CSV Button */}
									<button
										onClick={exportToCSV}
										className='px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs'>
										<Download className='w-3.5 h-3.5 text-slate-500' />
										<span>Export CSV</span>
									</button>

									{/* Auto Refresh Toggle */}
									<button
										onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
										className={`px-3 py-1.5 border rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
											autoRefreshEnabled
												? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
												: 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
										}`}>
										<Clock className='w-3.5 h-3.5' />
										<span>Auto-Refresh {autoRefreshEnabled ? 'ON' : 'OFF'}</span>
									</button>
								</div>
							</div>

							{/* Filter Dropdowns */}
							<div className='flex items-center gap-2 sm:gap-2.5 flex-wrap pt-2 border-t border-slate-100 text-xs'>
								<span className='text-slate-500 font-medium'>Filter:</span>

								{/* Year Filter */}
								<select
									value={selectedYear}
									onChange={(e) => setSelectedYear(e.target.value)}
									className='px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium focus:border-blue-500 outline-none'>
									<option value='All'>All Years</option>
									<option value='1st Year'>1st Year</option>
									<option value='2nd Year'>2nd Year</option>
									<option value='3rd Year'>3rd Year</option>
									<option value='4th Year'>4th Year</option>
								</select>

								{/* Department Filter */}
								{departmentsList.length > 0 && (
									<select
										value={selectedDepartment}
										onChange={(e) => setSelectedDepartment(e.target.value)}
										className='px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium focus:border-blue-500 outline-none max-w-[200px] truncate'>
										<option value='All'>All Departments</option>
										{departmentsList.map((dept) => (
											<option key={dept} value={dept}>
												{dept}
											</option>
										))}
									</select>
								)}

								{/* Credentials / Proof Filter */}
								<select
									value={selectedProofFilter}
									onChange={(e) => setSelectedProofFilter(e.target.value)}
									className='px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium focus:border-blue-500 outline-none'>
									<option value='All'>All Qualifications</option>
									<option value='patents'>Patents / IPR</option>
									<option value='publications'>Publications</option>
									<option value='competitions'>Hackathons & Contests</option>
									<option value='activities'>Technical Activities</option>
								</select>

								{/* Status Filter */}
								<select
									value={selectedStatusFilter}
									onChange={(e) => setSelectedStatusFilter(e.target.value as ReviewStatus)}
									className='px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium focus:border-blue-500 outline-none'>
									<option value='All'>All Statuses</option>
									<option value='Submitted'>Submitted</option>
									<option value='Under Review'>Under Review</option>
									<option value='Shortlisted'>Shortlisted</option>
									<option value='Selected'>Selected</option>
									<option value='On Hold'>On Hold</option>
								</select>

								{/* Sort By */}
								<div className='ml-auto flex items-center gap-1.5'>
									<span className='text-slate-400 text-xs'>Sort:</span>
									<select
										value={sortBy}
										onChange={(e) => setSortBy(e.target.value as any)}
										className='px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium focus:border-blue-500 outline-none'>
										<option value='newest'>Newest First</option>
										<option value='oldest'>Oldest First</option>
										<option value='name'>Name (A–Z)</option>
										<option value='ref'>Reference ID</option>
									</select>
								</div>
							</div>
						</div>

						{/* Results Count Banner */}
						<div className='flex items-center justify-between text-xs text-slate-500 px-1'>
							<span>
								Showing <strong className='text-slate-800 font-semibold'>{filteredSubmissions.length}</strong> of{' '}
								<strong className='text-slate-800 font-semibold'>{submissions.length}</strong> applications
							</span>
							{(searchTerm || selectedYear !== 'All' || selectedProofFilter !== 'All' || selectedStatusFilter !== 'All') && (
								<button
									onClick={() => {
										setSearchTerm('');
										setSelectedYear('All');
										setSelectedDepartment('All');
										setSelectedProofFilter('All');
										setSelectedStatusFilter('All');
									}}
									className='text-blue-600 hover:underline font-medium cursor-pointer'>
									Reset filters
								</button>
							)}
						</div>

						{/* Loading State */}
						{loading ? (
							<div className='bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-xs space-y-3'>
								<RefreshCw className='w-6 h-6 text-slate-400 animate-spin mx-auto' />
								<p className='text-sm font-medium text-slate-700'>
									Loading applications...
								</p>
							</div>
						) : filteredSubmissions.length === 0 ? (
							<div className='bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-xs space-y-3'>
								<div className='w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400'>
									<Search className='w-5 h-5' />
								</div>
								<h3 className='text-sm font-semibold text-slate-800'>No Applications Found</h3>
								<p className='text-xs text-slate-500 max-w-md mx-auto'>
									{searchTerm || selectedYear !== 'All'
										? 'No applications match your current filters. Try changing or clearing your search keywords.'
										: 'No student applications have been received yet.'}
								</p>
							</div>
						) : viewMode === 'table' ? (
							/* -------------------------------------------------------- */
							/* DETAILED TABLE VIEW                                      */
							/* -------------------------------------------------------- */
							<div className='bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden'>
								<div className='overflow-x-auto'>
									<table className='w-full text-left text-xs text-slate-700 border-collapse'>
										<thead className='bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold tracking-wider'>
											<tr>
												<th className='py-3 px-4'>Applicant</th>
												<th className='py-3 px-4'>Year & Department</th>
												<th className='py-3 px-4'>CGPA</th>
												<th className='py-3 px-4'>Contact</th>
												<th className='py-3 px-4 text-center'>Documents</th>
												<th className='py-3 px-4'>Status</th>
												<th className='py-3 px-4 text-right'>Action</th>
											</tr>
										</thead>
										<tbody className='divide-y divide-slate-100'>
											{filteredSubmissions.map((sub, idx) => {
												const status = reviewStatuses[sub.referenceId] || 'Submitted';
												return (
													<tr
														key={sub.id || idx}
														className='hover:bg-slate-50/70 transition-colors group'>
														{/* Applicant Name & Ref */}
														<td className='py-3 px-4'>
															<div className='flex items-center gap-3'>
																<div className='w-8 h-8 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-semibold text-xs flex-shrink-0'>
																	{sub.cadetName.charAt(0).toUpperCase()}
																</div>
																<div>
																	<div className='font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-xs sm:text-sm'>
																		{sub.cadetName}
																	</div>
																	<div className='flex items-center gap-1.5 mt-0.5'>
																		<span className='font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded'>
																			{sub.referenceId}
																		</span>
																		<button
																			onClick={() => copyToClipboard(sub.referenceId, 'ref', sub.id)}
																			title='Copy Reference ID'
																			className='text-slate-400 hover:text-slate-600 cursor-pointer'>
																			{copiedRef === sub.id ? (
																				<Check className='w-3 h-3 text-emerald-600' />
																			) : (
																				<Copy className='w-3 h-3' />
																			)}
																		</button>
																	</div>
																	<div className='text-[11px] text-slate-400 mt-0.5'>
																		Roll: <span className='text-slate-600'>{sub.regNumber || 'N/A'}</span>
																	</div>
																</div>
															</div>
														</td>

														{/* Year & Department */}
														<td className='py-3 px-4'>
															<div className='font-medium text-slate-800 text-xs'>
																{sub.yearOfStudy}
															</div>
															<div className='text-[11px] text-slate-500 truncate max-w-[160px]' title={sub.department}>
																{sub.department || 'General'}
															</div>
															<div className='text-[10px] text-slate-400'>
																{sub.semester}
															</div>
														</td>

														{/* CGPA */}
														<td className='py-3 px-4'>
															{sub.yearOfStudy.includes('1st') ? (
																<span className='text-[11px] text-slate-400 italic'>
																	1st Year
																</span>
															) : (
																<div className='flex items-baseline gap-1 font-mono'>
																	<span className='font-semibold text-sm text-slate-800'>
																		{sub.cgpa || 'N/A'}
																	</span>
																	<span className='text-[10px] text-slate-400'>/ 10</span>
																</div>
															)}
														</td>

														{/* Contact */}
														<td className='py-3 px-4'>
															<div className='space-y-0.5'>
																<a
																	href={`mailto:${sub.email}`}
																	className='text-[11px] text-blue-600 hover:underline block truncate max-w-[170px]'
																	title={sub.email}>
																	{sub.email}
																</a>
																{sub.phone && (
																	<a
																		href={`tel:${sub.phone}`}
																		className='text-[11px] text-slate-500 hover:text-slate-800 block font-mono'>
																		{sub.phone}
																	</a>
																)}
															</div>
														</td>

														{/* Documents & Form */}
														<td className='py-3 px-4 text-center'>
															<div className='flex flex-col items-center gap-1.5'>
																{sub.driveFolderUrl && sub.driveFolderUrl.startsWith('http') ? (
																	<a
																		href={sub.driveFolderUrl}
																		target='_blank'
																		rel='noopener noreferrer'
																		title='Open applicant Google Drive folder'
																		className='w-full inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs border border-slate-200 shadow-xs transition-colors'>
																		<Folder className='w-3 h-3 text-emerald-600' />
																		<span>Drive Folder</span>
																		<ExternalLink className='w-2.5 h-2.5 opacity-50' />
																	</a>
																) : (
																	<span className='text-[11px] text-slate-400 italic'>
																		No Drive folder
																	</span>
																)}

																<button
																	onClick={() => setSelectedCadet(sub)}
																	className='w-full inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs border border-slate-200 transition-colors cursor-pointer'>
																	<FileText className='w-3 h-3 text-slate-500' />
																	<span>View Form</span>
																</button>
															</div>
														</td>

														{/* Status */}
														<td className='py-3 px-4'>
															<select
																value={status}
																onChange={(e) =>
																	updateCadetStatus(sub.referenceId, e.target.value as ReviewStatus)
																}
																className={`px-2 py-1 rounded text-xs font-medium border outline-none cursor-pointer ${
																	status === 'Selected'
																		? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
																		: status === 'Shortlisted'
																		? 'bg-blue-50 text-blue-800 border-blue-200 font-semibold'
																		: status === 'Under Review'
																		? 'bg-amber-50 text-amber-800 border-amber-200'
																		: status === 'On Hold'
																		? 'bg-slate-100 text-slate-600 border-slate-200'
																		: 'bg-white text-slate-700 border-slate-200'
																}`}>
																<option value='Submitted'>Submitted</option>
																<option value='Under Review'>Under Review</option>
																<option value='Shortlisted'>Shortlisted</option>
																<option value='Selected'>Selected</option>
																<option value='On Hold'>On Hold</option>
															</select>
															<div className='text-[10px] text-slate-400 mt-1 font-mono'>
																{sub.timestamp ? sub.timestamp.split(' ')[0] : 'Recent'}
															</div>
														</td>

														{/* Action Button */}
														<td className='py-3 px-4 text-right'>
															<button
																onClick={() => setSelectedCadet(sub)}
																className='p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer'
																title='View Application'>
																<ChevronRight className='w-4 h-4' />
															</button>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</div>
						) : (
							/* -------------------------------------------------------- */
							/* COMPACT / GRID CARDS VIEW                                */
							/* -------------------------------------------------------- */
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
								{filteredSubmissions.map((sub, idx) => {
									const status = reviewStatuses[sub.referenceId] || 'Submitted';
									return (
										<div
											key={sub.id || idx}
											className='bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between space-y-4 group'>
											<div>
												{/* Header: Name, Ref, Status */}
												<div className='flex items-start justify-between gap-3'>
													<div className='flex items-center gap-2.5'>
														<div className='w-9 h-9 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-semibold text-xs flex-shrink-0'>
															{sub.cadetName.charAt(0).toUpperCase()}
														</div>
														<div>
															<h4 className='font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-sm'>
																{sub.cadetName}
															</h4>
															<span className='font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded'>
																{sub.referenceId}
															</span>
														</div>
													</div>
													<span
														className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
															status === 'Selected'
																? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
																: status === 'Shortlisted'
																? 'bg-blue-50 text-blue-800 border-blue-200 font-semibold'
																: status === 'Under Review'
																? 'bg-amber-50 text-amber-800 border-amber-200'
																: 'bg-slate-100 text-slate-700 border-slate-200'
														}`}>
														{status}
													</span>
												</div>

												{/* Academic Details */}
												<div className='grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs'>
													<div>
														<span className='text-slate-400 block text-[10px] font-medium'>
															Year & Program
														</span>
														<span className='font-medium text-slate-800'>
															{sub.yearOfStudy} • {sub.semester}
														</span>
													</div>
													<div>
														<span className='text-slate-400 block text-[10px] font-medium'>
															Registration No
														</span>
														<span className='font-mono text-slate-800'>
															{sub.regNumber || 'N/A'}
														</span>
													</div>
													<div>
														<span className='text-slate-400 block text-[10px] font-medium'>
															CGPA
														</span>
														<span className='font-medium text-slate-800'>
															{sub.yearOfStudy.includes('1st') ? '1st Year' : sub.cgpa || 'N/A'}
														</span>
													</div>
													<div>
														<span className='text-slate-400 block text-[10px] font-medium'>
															Submitted
														</span>
														<span className='text-slate-600 text-[11px] font-mono'>
															{sub.timestamp ? sub.timestamp.split(' ')[0] : 'Today'}
														</span>
													</div>
												</div>

												{/* Credentials / Proof Chips */}
												<div className='flex items-center gap-1.5 flex-wrap mt-3'>
													{sub.patents && sub.patents !== 'NIL' && (
														<span className='px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200'>
															Patents
														</span>
													)}
													{sub.journalPub && sub.journalPub !== 'NIL' && (
														<span className='px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-800 border border-blue-200'>
															Publications
														</span>
													)}
													{sub.competitions && sub.competitions !== 'NIL' && (
														<span className='px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200'>
															Competitions
														</span>
													)}
													{sub.areasOfInterest.length > 0 && (
														<span className='px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200'>
															{sub.areasOfInterest.length} Focus Areas
														</span>
													)}
												</div>
											</div>

											{/* Action Buttons for Card */}
											<div className='space-y-2 pt-3 border-t border-slate-100'>
												{sub.driveFolderUrl && sub.driveFolderUrl.startsWith('http') && (
													<a
														href={sub.driveFolderUrl}
														target='_blank'
														rel='noopener noreferrer'
														className='w-full py-1.5 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs border border-slate-200 shadow-xs flex items-center justify-center gap-1.5 transition-colors'>
														<Folder className='w-3.5 h-3.5 text-emerald-600' />
														<span>Open Drive Folder ↗</span>
													</a>
												)}
												<button
													onClick={() => setSelectedCadet(sub)}
													className='w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer'>
													<FileText className='w-3.5 h-3.5' />
													<span>View Application Details</span>
												</button>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				)}

				{/* ---------------------------------------------------------------------- */}
				{/* TAB 2: NATIVE EXCEL SPREADSHEET (34 COLS) & EMBED VIEW                 */}
				{/* ---------------------------------------------------------------------- */}
				{activeTab === 'sheet' && (
					<NativeSpreadsheet
						rawHeaders={rawHeaders}
						rawRows={rawRows}
						submissions={submissions}
						onViewCadetForm={setSelectedCadet}
					/>
				)}

				{/* ---------------------------------------------------------------------- */}
				{/* TAB 3: STUDENT DRIVE FOLDERS                                           */}
				{/* ---------------------------------------------------------------------- */}
				{activeTab === 'drive' && (
					<div className='space-y-4'>
						{/* Drive Header */}
						<div className='bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
							<div className='flex items-center gap-3'>
								<div className='w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200'>
									<FolderOpen className='w-5 h-5 text-slate-600' />
								</div>
								<div>
									<h3 className='font-semibold text-slate-800 text-sm sm:text-base'>
										Applicant Drive Folders
									</h3>
									<p className='text-xs text-slate-500'>
										Folder structure: <span className='font-mono text-slate-600'>2026–27 / [Year] / [Student Name - RegNo]</span>
									</p>
								</div>
							</div>
							<div className='text-right'>
								<span className='text-xs font-medium text-slate-500 block'>
									Linked Folders
								</span>
								<span className='text-xl font-bold text-slate-900'>
									{stats.withDrive} / {submissions.length}
								</span>
							</div>
						</div>

						{/* Directory List of Student Drive Folders */}
						<div className='bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100'>
							{submissions.length === 0 ? (
								<div className='p-8 text-center text-slate-500 text-sm'>
									No submission drive folders available yet.
								</div>
							) : (
								submissions.map((sub, idx) => (
									<div
										key={sub.id || idx}
										className='p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
										<div className='flex items-center gap-3 min-w-0'>
											<div className='w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 border border-slate-200'>
												<Folder className='w-4 h-4' />
											</div>
											<div className='min-w-0'>
												<div className='flex items-center gap-2 flex-wrap'>
													<h4 className='font-semibold text-slate-900 text-sm truncate'>
														{sub.cadetName}
													</h4>
													<span className='font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded'>
														{sub.referenceId}
													</span>
													<span className='text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium'>
														{sub.yearOfStudy}
													</span>
												</div>
												<div className='text-xs text-slate-400 flex items-center gap-2 mt-1 truncate'>
													<span>Path: <code className='text-slate-600'>2026-27 / {sub.yearOfStudy} / {sub.cadetName}</code></span>
												</div>
											</div>
										</div>

										<div className='flex items-center gap-2 flex-shrink-0 self-end sm:self-auto'>
											{sub.driveFolderUrl && sub.driveFolderUrl.startsWith('http') ? (
												<>
													<button
														onClick={() => copyToClipboard(sub.driveFolderUrl, 'drive', sub.id)}
														title='Copy Drive Folder URL'
														className='p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition-colors cursor-pointer border border-slate-200'>
														{copiedDrive === sub.id ? (
															<Check className='w-4 h-4 text-emerald-600' />
														) : (
															<Copy className='w-4 h-4' />
														)}
													</button>
													<a
														href={sub.driveFolderUrl}
														target='_blank'
														rel='noopener noreferrer'
														className='px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors'>
														<FolderOpen className='w-3.5 h-3.5 text-emerald-600' />
														<span>Open in Drive</span>
														<ExternalLink className='w-3 h-3 opacity-60' />
													</a>
												</>
											) : (
												<span className='text-xs text-slate-400 italic'>
													No folder linked
												</span>
											)}

											<button
												onClick={() => setSelectedCadet(sub)}
												className='px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer'>
												View Form
											</button>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				)}

				{/* ---------------------------------------------------------------------- */}
				{/* TAB 4: NATIVE INTERACTIVE ANALYTICS & CHARTS                           */}
				{/* ---------------------------------------------------------------------- */}
				{activeTab === 'analytics' && (
					<NativeGraphs submissions={submissions} />
				)}
			</main>

			{/* ======================================================================== */}
			{/* APPLICATION FORM MODAL (INSTITUTIONAL LAYOUT)                             */}
			{/* ======================================================================== */}
			{selectedCadet && (
				<div className='fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn'>
					<div className='bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-slate-300 overflow-hidden my-auto max-h-[92vh] flex flex-col'>
						{/* Modal Header Bar */}
						<div className='bg-[#0A192F] text-white px-5 py-3.5 border-b border-slate-700 flex items-center justify-between flex-shrink-0'>
							<div className='flex items-center gap-3'>
								<div className='w-8 h-8 rounded-lg bg-white/10 p-1 flex items-center justify-center flex-shrink-0'>
									<Image
										src='/imu-logo.png'
										alt='IMU Emblem'
										width={32}
										height={32}
										className='object-contain'
									/>
								</div>
								<div>
									<h3 className='font-semibold text-sm sm:text-base text-white'>
										Student Application Form
									</h3>
									<p className='text-xs text-slate-400'>
										Institution’s Innovation Council • IMU Kolkata Campus
									</p>
								</div>
							</div>

							<div className='flex items-center gap-2'>
								<button
									onClick={handlePrint}
									className='px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700'
									title='Print Application Form'>
									<Printer className='w-3.5 h-3.5' />
									<span className='hidden sm:inline'>Print Form</span>
								</button>
								<button
									onClick={() => setSelectedCadet(null)}
									className='p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer'>
									<X className='w-5 h-5' />
								</button>
							</div>
						</div>

						{/* Modal Printable Body */}
						<div id='printable-application-form' className='p-6 overflow-y-auto space-y-6 flex-1 text-slate-800'>
							{/* Official Institutional Letterhead */}
							<div className='border-b border-slate-200 pb-4 text-center space-y-1'>
								<div className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
									Indian Maritime University — Kolkata Campus
								</div>
								<div className='text-xs text-slate-400'>
									(A Central University, Govt. of India • Ministry of Ports, Shipping and Waterways)
								</div>
								<h2 className='text-base sm:text-lg font-bold text-slate-900 tracking-tight pt-1'>
									Institution’s Innovation Council (IIC 2026–27)
								</h2>
								<div className='inline-block px-3 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200'>
									Membership Application Form
								</div>
							</div>

							{/* Clean Drive Folder Link Banner */}
							<div className='bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
								<div className='flex items-center gap-3'>
									<div className='w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 border border-emerald-200'>
										<FolderOpen className='w-5 h-5' />
									</div>
									<div>
										<span className='text-xs font-semibold text-slate-900 block'>
											Applicant Document Folder
										</span>
										<p className='text-xs text-slate-500 mt-0.5'>
											Contains application records, certificates, and uploaded files for {selectedCadet.cadetName}
										</p>
									</div>
								</div>
								{selectedCadet.driveFolderUrl && selectedCadet.driveFolderUrl.startsWith('http') ? (
									<a
										href={selectedCadet.driveFolderUrl}
										target='_blank'
										rel='noopener noreferrer'
										className='px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors flex-shrink-0'>
										<FolderOpen className='w-3.5 h-3.5' />
										<span>Open Google Drive Folder</span>
										<ExternalLink className='w-3 h-3 opacity-80' />
									</a>
								) : (
									<span className='text-xs text-slate-400 italic'>Drive folder link not available</span>
								)}
							</div>

							{/* Section 1: Applicant Information */}
							<div className='space-y-3'>
								<h4 className='text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-1.5'>
									<User className='w-4 h-4 text-blue-600' />
									1. Applicant Information
								</h4>
								<div className='grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50/60 p-4 rounded-xl border border-slate-200'>
									<div>
										<span className='text-slate-400 block font-medium'>Full Name</span>
										<span className='font-semibold text-slate-900 text-sm'>
											{selectedCadet.cadetName}
										</span>
									</div>
									<div>
										<span className='text-slate-400 block font-medium'>Reference ID</span>
										<span className='font-mono font-semibold text-blue-600 text-sm'>
											{selectedCadet.referenceId}
										</span>
									</div>
									<div>
										<span className='text-slate-400 block font-medium'>Registration / Roll Number</span>
										<span className='font-mono font-semibold text-slate-800 text-sm'>
											{selectedCadet.regNumber || 'N/A'}
										</span>
									</div>
									<div>
										<span className='text-slate-400 block font-medium'>Year & Semester</span>
										<span className='font-medium text-slate-800'>
											{selectedCadet.yearOfStudy} ({selectedCadet.semester})
										</span>
									</div>
									<div>
										<span className='text-slate-400 block font-medium'>Department / Program</span>
										<span className='font-medium text-slate-800'>
											{selectedCadet.department || 'Marine Engineering'}
										</span>
									</div>
									<div>
										<span className='text-slate-400 block font-medium'>Cumulative GPA (CGPA)</span>
										<span className='font-semibold text-slate-800'>
											{selectedCadet.yearOfStudy.includes('1st')
												? 'Exempted (1st Year)'
												: `${selectedCadet.cgpa || 'N/A'} / 10`}
										</span>
									</div>
									<div>
										<span className='text-slate-400 block font-medium'>Email Address</span>
										<a
											href={`mailto:${selectedCadet.email}`}
											className='text-blue-600 hover:underline font-medium'>
											{selectedCadet.email}
										</a>
									</div>
									<div>
										<span className='text-slate-400 block font-medium'>Contact Number</span>
										<span className='font-mono font-medium text-slate-800'>
											{selectedCadet.phone || 'N/A'}
										</span>
									</div>
									<div>
										<span className='text-slate-400 block font-medium'>Submitted On</span>
										<span className='font-mono text-slate-600'>
											{selectedCadet.timestamp || 'N/A'}
										</span>
									</div>
								</div>
							</div>

							{/* Section 2: Problem Statements & Focus Areas */}
							<div className='space-y-3'>
								<h4 className='text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-1.5'>
									<Lightbulb className='w-4 h-4 text-amber-500' />
									2. Problem Statements & Focus Areas
								</h4>
								<div className='space-y-3 text-xs'>
									<div className='p-3.5 bg-slate-50/60 border border-slate-200 rounded-lg'>
										<span className='font-semibold text-slate-800 block mb-1'>
											Maritime / Campus Problem Statement:
										</span>
										<p className='text-slate-700 whitespace-pre-wrap leading-relaxed'>
											{selectedCadet.problemMaritime || 'None specified'}
										</p>
									</div>

									<div className='p-3.5 bg-slate-50/60 border border-slate-200 rounded-lg'>
										<span className='font-semibold text-slate-800 block mb-1'>
											Societal / Industry Problem Statement:
										</span>
										<p className='text-slate-700 whitespace-pre-wrap leading-relaxed'>
											{selectedCadet.problemSociety || 'None specified'}
										</p>
									</div>

									{selectedCadet.areasOfInterest.length > 0 && (
										<div>
											<span className='font-semibold text-slate-700 block mb-2'>
												Selected Technology & Innovation Domains:
											</span>
											<div className='flex items-center gap-1.5 flex-wrap'>
												{selectedCadet.areasOfInterest.map((interest, i) => (
													<span
														key={i}
														className='px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200'>
														{interest}
													</span>
												))}
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Section 3: Qualifications & Document Proofs */}
							<div className='space-y-3'>
								<h4 className='text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-1.5'>
									<Award className='w-4 h-4 text-blue-600' />
									3. Qualifications & Uploaded Documents
								</h4>
								<div className='overflow-x-auto'>
									<table className='w-full text-left text-xs border border-slate-200 rounded-lg'>
										<thead className='bg-slate-50 text-slate-600 font-semibold'>
											<tr>
												<th className='py-2.5 px-3 border-b border-slate-200'>Category</th>
												<th className='py-2.5 px-3 border-b border-slate-200'>Details / Description</th>
												<th className='py-2.5 px-3 border-b border-slate-200 text-center'>Document Status</th>
											</tr>
										</thead>
										<tbody className='divide-y divide-slate-100'>
											<tr>
												<td className='py-2.5 px-3 font-medium text-slate-800'>Journal Publications</td>
												<td className='py-2.5 px-3 text-slate-600'>{selectedCadet.journalDetails || 'NIL'}</td>
												<td className='py-2.5 px-3 text-center'>
													<span
														className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
															selectedCadet.journalPub && selectedCadet.journalPub !== 'NIL'
																? 'bg-emerald-50 text-emerald-700 border-emerald-200'
																: 'bg-slate-50 text-slate-400 border-slate-200'
														}`}>
														{selectedCadet.journalPub && selectedCadet.journalPub !== 'NIL'
															? 'Uploaded'
															: 'None'}
													</span>
												</td>
											</tr>
											<tr>
												<td className='py-2.5 px-3 font-medium text-slate-800'>Book Chapter Publications</td>
												<td className='py-2.5 px-3 text-slate-600'>{selectedCadet.bookDetails || 'NIL'}</td>
												<td className='py-2.5 px-3 text-center'>
													<span
														className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
															selectedCadet.bookPub && selectedCadet.bookPub !== 'NIL'
																? 'bg-emerald-50 text-emerald-700 border-emerald-200'
																: 'bg-slate-50 text-slate-400 border-slate-200'
														}`}>
														{selectedCadet.bookPub && selectedCadet.bookPub !== 'NIL'
															? 'Uploaded'
															: 'None'}
													</span>
												</td>
											</tr>
											<tr>
												<td className='py-2.5 px-3 font-medium text-slate-800'>Patents / IPR / Copyrights</td>
												<td className='py-2.5 px-3 text-slate-600'>{selectedCadet.patentDetails || 'NIL'}</td>
												<td className='py-2.5 px-3 text-center'>
													<span
														className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
															selectedCadet.patents && selectedCadet.patents !== 'NIL'
																? 'bg-emerald-50 text-emerald-700 border-emerald-200'
																: 'bg-slate-50 text-slate-400 border-slate-200'
														}`}>
														{selectedCadet.patents && selectedCadet.patents !== 'NIL'
															? 'Uploaded'
															: 'None'}
													</span>
												</td>
											</tr>
											<tr>
												<td className='py-2.5 px-3 font-medium text-slate-800'>Competitions / Hackathons</td>
												<td className='py-2.5 px-3 text-slate-600'>{selectedCadet.competitionDetails || 'NIL'}</td>
												<td className='py-2.5 px-3 text-center'>
													<span
														className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
															selectedCadet.competitions && selectedCadet.competitions !== 'NIL'
																? 'bg-emerald-50 text-emerald-700 border-emerald-200'
																: 'bg-slate-50 text-slate-400 border-slate-200'
														}`}>
														{selectedCadet.competitions && selectedCadet.competitions !== 'NIL'
															? 'Uploaded'
															: 'None'}
													</span>
												</td>
											</tr>
											<tr>
												<td className='py-2.5 px-3 font-medium text-slate-800'>Technical Activities</td>
												<td className='py-2.5 px-3 text-slate-600'>{selectedCadet.activityDetails || 'NIL'}</td>
												<td className='py-2.5 px-3 text-center'>
													<span
														className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
															selectedCadet.activities && selectedCadet.activities !== 'NIL'
																? 'bg-emerald-50 text-emerald-700 border-emerald-200'
																: 'bg-slate-50 text-slate-400 border-slate-200'
														}`}>
														{selectedCadet.activities && selectedCadet.activities !== 'NIL'
															? 'Uploaded'
															: 'None'}
													</span>
												</td>
											</tr>
											<tr>
												<td className='py-2.5 px-3 font-medium text-slate-800'>Major Achievements</td>
												<td className='py-2.5 px-3 text-slate-600'>{selectedCadet.achievementDetails || 'NIL'}</td>
												<td className='py-2.5 px-3 text-center'>
													<span
														className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
															selectedCadet.achievements && selectedCadet.achievements !== 'NIL'
																? 'bg-emerald-50 text-emerald-700 border-emerald-200'
																: 'bg-slate-50 text-slate-400 border-slate-200'
														}`}>
														{selectedCadet.achievements && selectedCadet.achievements !== 'NIL'
															? 'Uploaded'
															: 'None'}
													</span>
												</td>
											</tr>
											<tr>
												<td className='py-2.5 px-3 font-medium text-slate-800'>Leadership Roles</td>
												<td className='py-2.5 px-3 text-slate-600'>{selectedCadet.leadershipDetails || 'NIL'}</td>
												<td className='py-2.5 px-3 text-center'>
													<span
														className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
															selectedCadet.leadership && selectedCadet.leadership !== 'NIL'
																? 'bg-emerald-50 text-emerald-700 border-emerald-200'
																: 'bg-slate-50 text-slate-400 border-slate-200'
														}`}>
														{selectedCadet.leadership && selectedCadet.leadership !== 'NIL'
															? 'Uploaded'
															: 'None'}
													</span>
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>

							{/* Evaluator Notes & Decision Tooling */}
							<div className='p-4 bg-slate-50/60 border border-slate-200 rounded-xl space-y-3'>
								<h4 className='text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between'>
									<span>Reviewer Notes & Decision</span>
									<span className='text-[11px] text-slate-400 font-normal'>Saved locally</span>
								</h4>

								<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs'>
									<div>
										<label className='block font-medium text-slate-700 mb-1'>
											Application Status:
										</label>
										<select
											value={reviewStatuses[selectedCadet.referenceId] || 'Submitted'}
											onChange={(e) =>
												updateCadetStatus(selectedCadet.referenceId, e.target.value as ReviewStatus)
											}
											className='w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 outline-none'>
											<option value='Submitted'>Submitted</option>
											<option value='Under Review'>Under Review</option>
											<option value='Shortlisted'>Shortlisted</option>
											<option value='Selected'>Selected</option>
											<option value='On Hold'>On Hold</option>
										</select>
									</div>

									<div>
										<label className='block font-medium text-slate-700 mb-1'>
											Internal Review Notes:
										</label>
										<input
											type='text'
											value={candidateNotes[selectedCadet.referenceId] || ''}
											onChange={(e) =>
												updateCadetNotes(selectedCadet.referenceId, e.target.value)
											}
											placeholder='e.g., strong robotics background, interview scheduled...'
											className='w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 outline-none'
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Modal Footer Controls */}
						<div className='bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0'>
							<div className='text-xs text-slate-500 font-mono'>
								Reference ID: {selectedCadet.referenceId}
							</div>
							<div className='flex items-center gap-2 w-full sm:w-auto'>
								{selectedCadet.driveFolderUrl && selectedCadet.driveFolderUrl.startsWith('http') && (
									<a
										href={selectedCadet.driveFolderUrl}
										target='_blank'
										rel='noopener noreferrer'
										className='flex-1 sm:flex-none px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs'>
										<FolderOpen className='w-3.5 h-3.5' />
										<span>Open Drive Folder ↗</span>
									</a>
								)}
								<button
									onClick={() => setSelectedCadet(null)}
									className='flex-1 sm:flex-none px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer'>
									Close
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
