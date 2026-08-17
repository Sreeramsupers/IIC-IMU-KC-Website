'use client';

import React, { useState, useEffect, useRef, FormEvent, ChangeEvent, FocusEvent } from 'react';
import Image from 'next/image';

interface FormData {
	cadetName: string;
	regNumber: string;
	yearOfStudy: string;
	department: string;
	semester: string;
	cgpa: string;
	gender: string;
	email: string;
	phone: string;
	projectSummary: string;
	photoName: string;
	photoDataUrl?: string;
	resumeName: string;
	resumeDataUrl?: string;
}

const INITIAL_STATE: FormData = {
	cadetName: '',
	regNumber: '',
	yearOfStudy: '1st Year',
	department: 'B.Tech Marine Engineering',
	semester: 'Semester 1',
	cgpa: '',
	gender: 'Male',
	email: '',
	phone: '',
	projectSummary: '',
	photoName: '',
	photoDataUrl: '',
	resumeName: '',
	resumeDataUrl: '',
};

const SEMESTERS = [
	'Semester 1',
	'Semester 2',
	'Semester 3',
	'Semester 4',
	'Semester 5',
	'Semester 6',
	'Semester 7',
	'Semester 8',
];

export default function Home() {
	const [formData, setFormData] = useState<FormData>(INITIAL_STATE);
	const [errors, setErrors] = useState<{ [key: string]: string }>({});
	const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
	const [submitted, setSubmitted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [submittedRefId, setSubmittedRefId] = useState('');

	const isFirstYear = formData.yearOfStudy === '1st Year';

	// Refs for non-blocking direct DOM parallax on Desktop
	const oceanContainerRef = useRef<HTMLDivElement>(null);
	const submarineRef = useRef<HTMLDivElement>(null);
	const boatRef = useRef<HTMLDivElement>(null);
	const bgMainRef = useRef<HTMLElement>(null);
	const seabedRef = useRef<HTMLDivElement>(null);

	// Desktop-Only Scroll Parallax Listener
	useEffect(() => {
		let ticking = false;

		const onScroll = () => {
			if (window.innerWidth < 768) return; // Mobile uses clean gradient

			if (!ticking) {
				window.requestAnimationFrame(() => {
					const winScroll = window.scrollY || document.documentElement.scrollTop;
					const docHeight = document.documentElement.scrollHeight - window.innerHeight;
					const progress = docHeight > 0 ? Math.min(1, Math.max(0, winScroll / docHeight)) : 0;

					if (oceanContainerRef.current) {
						const translateY = Math.max(-280, 220 - progress * 480);
						oceanContainerRef.current.style.transform = `translate3d(0, ${translateY}px, 0)`;
					}

					if (boatRef.current) {
						boatRef.current.style.opacity = String(Math.max(0, 1 - progress * 1.8));
					}
					if (submarineRef.current) {
						const subOpacity =
							progress > 0.15 && progress < 0.85 ? Math.sin((progress - 0.15) * 4.8) : 0;
						const subTop = 480 - progress * 320;
						submarineRef.current.style.opacity = String(subOpacity);
						submarineRef.current.style.transform = `translate3d(0, ${subTop}px, 0)`;
					}

					if (seabedRef.current) {
						seabedRef.current.style.opacity = String(Math.max(0, (progress - 0.7) * 3.3));
					}

					if (bgMainRef.current && window.innerWidth >= 768) {
						const r = Math.round(240 - progress * 220);
						const g = Math.round(245 - progress * 215);
						const b = Math.round(250 - progress * 195);
						bgMainRef.current.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
					}

					ticking = false;
				});
				ticking = true;
			}
		};

		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();

		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	// Field-Level Validation Helper
	const validateField = (name: string, value: string): string => {
		switch (name) {
			case 'cadetName': {
				const trimmed = value.trim();
				if (!trimmed) return 'Full name of the cadet is required.';
				if (trimmed.length < 2) return 'Please enter at least 2 characters.';
				if (!/^[a-zA-Z\s.'-]+$/.test(trimmed))
					return 'Name should only contain letters and spaces.';
				return '';
			}
			case 'regNumber': {
				const trimmed = value.trim();
				if (!trimmed) {
					return isFirstYear
						? 'Serial number / Roll number is required for 1st Year Cadets.'
						: 'Permanent University Registration Number is required.';
				}
				if (trimmed.length < 2) return 'Please enter a valid registration/serial number.';
				return '';
			}
			case 'email': {
				const trimmed = value.trim();
				if (!trimmed) return 'Email address is required.';
				const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
				if (!emailRegex.test(trimmed)) return 'Please enter a valid email address.';
				return '';
			}
			case 'phone': {
				const cleaned = value.replace(/[\s\-()]/g, '');
				if (!cleaned) return 'Mobile number is required.';
				const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
				if (!phoneRegex.test(cleaned)) {
					return 'Please enter a valid 10-digit mobile number.';
				}
				return '';
			}
			case 'cgpa': {
				if (!isFirstYear && value.trim()) {
					const num = parseFloat(value.trim());
					if (isNaN(num) || num < 0 || num > 10) {
						return 'Please enter a valid CGPA between 0.00 and 10.00.';
					}
				}
				return '';
			}
			case 'photo': {
				if (!value.trim()) return 'Passport size photo is compulsory. Please choose an image.';
				return '';
			}
			case 'resume': {
				if (!value.trim())
					return 'Resume & credential proofs PDF is compulsory. Please upload a PDF file.';
				return '';
			}
			default:
				return '';
		}
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
	) => {
		const { name } = e.target;
		let { value } = e.target;

		// Automatically convert Name of Cadet to Capital Letters as typed
		if (name === 'cadetName') {
			value = value.toUpperCase();
		}

		setFormData((prev) => ({ ...prev, [name]: value }));

		if (touched[name]) {
			const error = validateField(name, value);
			setErrors((prev) => ({ ...prev, [name]: error }));
		}
	};

	const handleBlur = (
		e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setTouched((prev) => ({ ...prev, [name]: true }));
		const error = validateField(name, value);
		setErrors((prev) => ({ ...prev, [name]: error }));
	};

	const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (!file.type.startsWith('image/')) {
				setErrors((prev) => ({
					...prev,
					photo: 'Please select a valid image file (PNG, JPG, JPEG, WEBP).',
				}));
				return;
			}
			if (file.size > 15 * 1024 * 1024) {
				setErrors((prev) => ({ ...prev, photo: 'Image size must be under 15MB.' }));
				return;
			}

			// Fast Client-Side Image Compression for Instant Upload Speeds
			const reader = new FileReader();
			reader.onload = (event) => {
				const img = new window.Image();
				img.onload = () => {
					const canvas = document.createElement('canvas');
					const maxDim = 800; // Optimal passport size resolution
					let width = img.width;
					let height = img.height;

					if (width > height) {
						if (width > maxDim) {
							height = Math.round((height * maxDim) / width);
							width = maxDim;
						}
					} else {
						if (height > maxDim) {
							width = Math.round((width * maxDim) / height);
							height = maxDim;
						}
					}

					canvas.width = width;
					canvas.height = height;
					const ctx = canvas.getContext('2d');
					ctx?.drawImage(img, 0, 0, width, height);

					const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

					setFormData((prev) => ({
						...prev,
						photoName: file.name,
						photoDataUrl: compressedDataUrl,
					}));
				};
				img.src = event.target?.result as string;
			};
			reader.readAsDataURL(file);
			setErrors((prev) => ({ ...prev, photo: '' }));
		}
	};

	const handleResumeChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
				setErrors((prev) => ({ ...prev, resume: 'Please upload only a PDF file (.pdf).' }));
				return;
			}
			if (file.size > 20 * 1024 * 1024) {
				setErrors((prev) => ({ ...prev, resume: 'PDF file size must be under 20MB.' }));
				return;
			}

			const reader = new FileReader();
			reader.onload = (event) => {
				setFormData((prev) => ({
					...prev,
					resumeName: file.name,
					resumeDataUrl: event.target?.result as string,
				}));
			};
			reader.readAsDataURL(file);
			setErrors((prev) => ({ ...prev, resume: '' }));
		}
	};

	const validateAll = () => {
		const newErrors: { [key: string]: string } = {};

		const nameErr = validateField('cadetName', formData.cadetName);
		if (nameErr) newErrors.cadetName = nameErr;

		const regErr = validateField('regNumber', formData.regNumber);
		if (regErr) newErrors.regNumber = regErr;

		const emailErr = validateField('email', formData.email);
		if (emailErr) newErrors.email = emailErr;

		const phoneErr = validateField('phone', formData.phone);
		if (phoneErr) newErrors.phone = phoneErr;

		const cgpaErr = validateField('cgpa', formData.cgpa);
		if (cgpaErr) newErrors.cgpa = cgpaErr;

		const photoErr = validateField('photo', formData.photoName);
		if (photoErr) newErrors.photo = photoErr;

		const resumeErr = validateField('resume', formData.resumeName);
		if (resumeErr) newErrors.resume = resumeErr;

		setErrors(newErrors);
		setTouched({
			cadetName: true,
			regNumber: true,
			email: true,
			phone: true,
			cgpa: true,
			photo: true,
			resume: true,
		});

		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!validateAll()) {
			// Smooth scroll to the first error field
			const firstErrorKey = Object.keys(errors)[0] || 'cadetName';
			const el = document.getElementById(firstErrorKey);
			if (el) {
				el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
			return;
		}

		setSubmitting(true);

		try {
			// Generate a unique reference ID
			const generatedRefId = `IIC-2627-${Math.floor(1000 + Math.random() * 9000)}`;
			const payload = {
				...formData,
				referenceId: generatedRefId,
				submittedAt: new Date().toISOString(),
			};

			const directGoogleUrl =
				process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL ||
				'https://script.google.com/macros/s/AKfycbxv10O9EXLDYAb1Im8m8hG7g40jtOinRi_-dXTdHIU51ohFkqn-A2K7nQ9AmA2eEsSo/exec';

			try {
				const res = await fetch('/api/submit', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				});
				if (!res.ok) {
					throw new Error('Serverless route returned ' + res.status);
				}
			} catch (apiError) {
				console.warn('API route not reachable, submitting directly to Google Apps Script:', apiError);
				await fetch(directGoogleUrl, {
					method: 'POST',
					mode: 'no-cors',
					headers: { 'Content-Type': 'text/plain' },
					body: JSON.stringify(payload),
				});
			}
		} catch (err) {
			console.error('Submission request failed:', err);
		} finally {
			setSubmitting(false);
			setSubmitted(true);
			// Auto scroll to top of page so cadets see the submission confirmation
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	const handleReset = () => {
		setFormData(INITIAL_STATE);
		setErrors({});
		setTouched({});
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<main
			ref={bgMainRef}
			className='relative w-full min-h-screen py-3 sm:py-10 px-3 sm:px-6 lg:px-8 flex flex-col items-center justify-start overflow-hidden will-change-[background-color]'>
			{/* DESKTOP-ONLY PARALLAX OCEAN ENVIRONMENT (Hidden on Mobile) */}
			<div
				className='hidden md:block fixed inset-0 pointer-events-none z-0 overflow-hidden select-none'
				style={{ contain: 'strict' }}>
				{/* Mid-Depth Research Submarine on Desktop */}
				<div
					ref={submarineRef}
					className='absolute left-[4%] sm:left-[10%] top-0 z-10 gpu-accelerated opacity-0'>
					<div className='animate-sub'>
						<svg
							width='84'
							height='44'
							viewBox='0 0 90 48'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'>
							<rect
								x='16'
								y='14'
								width='54'
								height='24'
								rx='12'
								fill='#f59e0b'
								stroke='#0e2544'
								strokeWidth='2'
							/>
							<rect
								x='36'
								y='6'
								width='14'
								height='10'
								rx='3'
								fill='#f59e0b'
								stroke='#0e2544'
								strokeWidth='2'
							/>
							<line
								x1='43'
								y1='6'
								x2='43'
								y2='2'
								stroke='#0e2544'
								strokeWidth='2'
								strokeLinecap='round'
							/>
							<circle cx='46' cy='2' r='2' fill='#38bdf8' />
							<circle cx='28' cy='26' r='4' fill='#38bdf8' stroke='#0e2544' strokeWidth='1.5' />
							<circle cx='42' cy='26' r='4' fill='#38bdf8' stroke='#0e2544' strokeWidth='1.5' />
							<circle cx='56' cy='26' r='4' fill='#38bdf8' stroke='#0e2544' strokeWidth='1.5' />
							<path d='M10 20L16 26L10 32Z' fill='#0e2544' />
							<polygon points='70,22 88,16 88,36 70,30' fill='#fef08a' opacity='0.35' />
						</svg>
					</div>
				</div>

				{/* Parallax Ocean Water Column Container on Desktop */}
				<div
					ref={oceanContainerRef}
					className='absolute inset-x-0 bottom-0 gpu-accelerated'
					style={{ transform: 'translate3d(0, 220px, 0)' }}>
					{/* Surface Bobbing Boat */}
					<div
						ref={boatRef}
						className='absolute -top-14 right-[8%] sm:right-[15%] z-20 animate-boat gpu-accelerated'>
						<svg
							width='72'
							height='54'
							viewBox='0 0 74 56'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'>
							<path d='M37 6L54 28H37V6Z' fill='#0e2544' />
							<path d='M33 12L20 28H33V12Z' fill='#f59e0b' />
							<rect x='34' y='4' width='3' height='26' rx='1.5' fill='#ffffff' />
							<circle cx='35.5' cy='4.5' r='2.5' fill='#f59e0b' />
							<path
								d='M10 30L17 44C17.5 45 18.5 46 20 46H56C57.5 46 58.5 45 59 44L66 30H10Z'
								fill='#ffffff'
								stroke='#0e2544'
								strokeWidth='2.5'
							/>
							<path d='M13 35L17.5 44H57.5L62 35H13Z' fill='#0284c7' />
							<circle cx='37' cy='38' r='3.5' fill='#ffffff' stroke='#e11d48' strokeWidth='1.5' />
						</svg>
					</div>

					{/* Layer 1: Deep Wave */}
					<div className='w-[200%] h-[280px] opacity-40 animate-wave-slow gpu-accelerated'>
						<svg
							viewBox='0 0 1200 120'
							preserveAspectRatio='none'
							className='w-full h-full fill-[#0a315c]'>
							<path d='M0,0 C150,90 350,-40 500,50 C650,140 900,10 1200,60 L1200,120 L0,120 Z'></path>
						</svg>
					</div>

					{/* Layer 2: Mid Wave */}
					<div className='-mt-[230px] w-[200%] h-[250px] opacity-65 animate-wave-fast gpu-accelerated'>
						<svg
							viewBox='0 0 1200 120'
							preserveAspectRatio='none'
							className='w-full h-full fill-[#0f548a]'>
							<path d='M0,30 C200,100 450,0 700,70 C950,130 1100,20 1200,40 L1200,120 L0,120 Z'></path>
						</svg>
					</div>

					{/* Layer 3: Cyan Surface Wave */}
					<div className='-mt-[190px] w-[200%] h-[210px] opacity-95 animate-wave-slow relative gpu-accelerated'>
						<svg
							viewBox='0 0 1200 120'
							preserveAspectRatio='none'
							className='w-full h-full fill-[#0284c7]'>
							<path d='M0,45 C180,10 380,80 600,30 C820,-10 1020,70 1200,45 L1200,120 L0,120 Z'></path>
						</svg>
						<div className='absolute top-0 inset-x-0 h-1.5 bg-sky-200/80 rounded-full' />
					</div>

					{/* Deep Water Fill */}
					<div className='w-full h-[650px] bg-gradient-to-b from-[#0284c7] via-[#0b3c6d] to-[#04162a]' />
				</div>

				{/* Seabed Base on Desktop */}
				<div
					ref={seabedRef}
					className='absolute bottom-0 inset-x-0 h-36 pointer-events-none opacity-0 gpu-accelerated z-10'>
					<svg
						viewBox='0 0 1200 100'
						preserveAspectRatio='none'
						className='w-full h-full fill-[#030d1a]'>
						<path d='M0,100 L0,70 Q200,40 400,65 T800,50 T1200,60 L1200,100 Z'></path>
					</svg>
					<div className='absolute bottom-6 left-[20%] w-2 h-2 rounded-full bg-emerald-400 animate-ping' />
					<div className='absolute bottom-8 right-[25%] w-2 h-2 rounded-full bg-amber-400 animate-ping' />
				</div>
			</div>

			{/* MOBILE-ONLY VISIBLE ANIMATED SUBMARINE (In Gradient) */}
			<div className='block md:hidden fixed inset-0 pointer-events-none z-0 overflow-hidden select-none'>
				<div className='absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/25 blur-2xl' />

				<div className='absolute bottom-6 right-3 z-10 animate-sub-mobile opacity-90'>
					<svg
						width='90'
						height='48'
						viewBox='0 0 90 48'
						fill='none'
						xmlns='http://www.w3.org/2000/svg'>
						<rect
							x='16'
							y='14'
							width='54'
							height='24'
							rx='12'
							fill='#f59e0b'
							stroke='#0e2544'
							strokeWidth='2'
						/>
						<rect
							x='36'
							y='6'
							width='14'
							height='10'
							rx='3'
							fill='#f59e0b'
							stroke='#0e2544'
							strokeWidth='2'
						/>
						<line
							x1='43'
							y1='6'
							x2='43'
							y2='2'
							stroke='#0e2544'
							strokeWidth='2'
							strokeLinecap='round'
						/>
						<circle cx='46' cy='2' r='2' fill='#38bdf8' />
						<circle cx='28' cy='26' r='4' fill='#38bdf8' stroke='#0e2544' strokeWidth='1.5' />
						<circle cx='42' cy='26' r='4' fill='#38bdf8' stroke='#0e2544' strokeWidth='1.5' />
						<circle cx='56' cy='26' r='4' fill='#38bdf8' stroke='#0e2544' strokeWidth='1.5' />
						<path d='M10 20L16 26L10 32Z' fill='#0e2544' />
						<polygon points='70,22 90,14 90,38 70,30' fill='#fef08a' opacity='0.45' />
					</svg>
				</div>
			</div>

			{/* Form Shell / Center Card */}
			<div className='relative z-10 w-full max-w-3xl mb-12 mt-1 sm:mt-2'>
				<div className='clean-card overflow-hidden'>
					{/* Official Banner Header - Crisp High-Resolution Display */}
					<div className='w-full bg-[#f6f9fc] border-b border-slate-200 p-2 sm:p-3 flex justify-center'>
						<div className='w-full max-w-[1024px] relative'>
							<Image
								src='/iic-banner.png'
								alt='IMU Kolkata Campus - Institution Innovation Council (IIC) 2026-27'
								width={3031}
								height={562}
								unoptimized
								priority
								className='w-full h-auto object-contain mx-auto rounded-lg'
								style={{ imageRendering: '-webkit-optimize-contrast' }}
							/>
						</div>
					</div>

					{/* Form Heading Strip */}
					<div className='px-5 sm:px-8 pt-5 sm:pt-6 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white'>
						<div>
							<h1 className='text-base sm:text-xl font-bold text-[#0e2544] uppercase tracking-wide leading-snug'>
								Cadet & Student Registration Form
							</h1>
							<p className='text-xs sm:text-sm text-slate-600 font-medium mt-1 leading-relaxed'>
								Academic Session 2026–27 • Innovation, Entrepreneurship & Startups Framework
							</p>
						</div>
					</div>

					{/* Success State */}
					{submitted ? (
						<div className='p-6 sm:p-12 text-center bg-white'>
							<div className='w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4 font-bold text-2xl shadow-sm'>
								✓
							</div>
							<h2 className='text-lg sm:text-2xl font-bold text-[#0e2544] uppercase tracking-tight'>
								Registration Submitted Successfully
							</h2>
							<p className='text-sm sm:text-base text-slate-600 mt-2 max-w-md mx-auto leading-relaxed'>
								Thank you, <span className='font-bold text-[#0e2544]'>{formData.cadetName}</span>.
								Your details and credentials have been officially recorded with the Institution’s
								Innovation Council.
							</p>

							<div className='mt-6 text-left bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6 text-sm space-y-3 max-w-md mx-auto'>
								{submittedRefId && (
									<div className='flex justify-between border-b border-slate-200 pb-2.5 bg-sky-50 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 p-4 rounded-t-xl border-b-sky-200'>
										<span className='text-sky-900 font-bold text-xs uppercase tracking-wider'>
											Official Reference ID:
										</span>
										<span className='font-mono font-bold text-sky-800 text-sm'>
											{submittedRefId}
										</span>
									</div>
								)}
								<div className='flex items-center gap-3 pb-3 border-b border-slate-200'>
									{formData.photoDataUrl && (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={formData.photoDataUrl}
											alt='Cadet'
											className='w-12 h-12 rounded-lg object-cover border border-slate-300'
										/>
									)}
									<div>
										<span className='text-xs text-slate-500 font-medium block'>Name of Cadet:</span>
										<span className='font-bold text-base text-[#0e2544]'>{formData.cadetName}</span>
									</div>
								</div>
								<div className='flex justify-between border-b border-slate-200 pb-2.5'>
									<span className='text-slate-600 font-medium'>
										{isFirstYear ? 'Serial Number (1st Year):' : 'Registration Number:'}
									</span>
									<span className='font-mono font-bold text-[#0e2544]'>{formData.regNumber}</span>
								</div>
								<div className='flex justify-between border-b border-slate-200 pb-2.5'>
									<span className='text-slate-600 font-medium'>Department / Program:</span>
									<span className='font-semibold text-slate-800 text-right'>
										{formData.department}
									</span>
								</div>
								<div className='flex justify-between border-b border-slate-200 pb-2.5'>
									<span className='text-slate-600 font-medium'>Year & Semester:</span>
									<span className='font-semibold text-slate-800 text-right'>
										{formData.yearOfStudy} • {formData.semester}
									</span>
								</div>
								{!isFirstYear && formData.cgpa && (
									<div className='flex justify-between border-b border-slate-200 pb-2.5'>
										<span className='text-slate-600 font-medium'>Current CGPA:</span>
										<span className='font-bold text-[#0e2544]'>{formData.cgpa}</span>
									</div>
								)}
								<div className='flex justify-between border-b border-slate-200 pb-2.5'>
									<span className='text-slate-600 font-medium'>Gender:</span>
									<span className='text-slate-800'>{formData.gender}</span>
								</div>
								<div className='flex justify-between border-b border-slate-200 pb-2.5'>
									<span className='text-slate-600 font-medium'>Resume / Credentials:</span>
									<span className='text-slate-800 text-right font-medium truncate max-w-[180px]'>
										{formData.resumeName ? formData.resumeName : 'Not attached'}
									</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-slate-600 font-medium'>Contact:</span>
									<span className='text-slate-800 text-right'>
										{formData.phone} • {formData.email}
									</span>
								</div>
							</div>

							<div className='mt-6 flex justify-center gap-3'>
								<button type='button' onClick={handleReset} className='btn-primary'>
									Register Another Cadet
								</button>
							</div>
						</div>
					) : (
						/* Registration Form - SYMMETRICAL 2-COLUMN GRID */
						<form
							onSubmit={handleSubmit}
							noValidate
							className='p-5 sm:p-8 space-y-5 sm:space-y-6 bg-white'>
							{/* Row 1 (2 Columns): Cadet Name & Registration/Serial Number */}
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6'>
								{/* Field: Name of the Cadet */}
								<div id='cadetName' className='flex flex-col justify-between'>
									<div>
										<label
											htmlFor='cadetNameInput'
											className='block text-xs sm:text-xs font-bold uppercase tracking-wider text-[#0e2544] mb-2'>
											Name of the Cadet <span className='text-red-600'>*</span>
										</label>
										<input
											type='text'
											id='cadetNameInput'
											name='cadetName'
											value={formData.cadetName}
											onChange={handleChange}
											onBlur={handleBlur}
											placeholder='Enter your full name'
											className={`form-input uppercase ${errors.cadetName && touched.cadetName ? 'input-error' : ''}`}
											autoComplete='name'
										/>
									</div>
									{errors.cadetName && touched.cadetName ? (
										<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1'>
											⚠ {errors.cadetName}
										</p>
									) : (
										<p className='text-xs text-slate-500 mt-1.5 font-medium'>
											Enter full name as per official IMU records.
										</p>
									)}
								</div>

								{/* Field: Registration / Serial Number */}
								<div id='regNumber' className='flex flex-col justify-between'>
									<div>
										<div className='flex items-baseline justify-between gap-1 mb-2 flex-wrap'>
											<label
												htmlFor='regNumberInput'
												className='text-xs sm:text-xs font-bold uppercase tracking-wider text-[#0e2544]'>
												{isFirstYear ? 'Serial Number' : 'Registration Number'}{' '}
												<span className='text-red-600'>*</span>
											</label>
											<span className='text-[11px] sm:text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-200'>
												{isFirstYear ? 'Serial number for 1st year' : 'University Reg. No.'}
											</span>
										</div>
										<input
											type='text'
											id='regNumberInput'
											name='regNumber'
											value={formData.regNumber}
											onChange={handleChange}
											onBlur={handleBlur}
											placeholder={
												isFirstYear ? 'Enter your serial number' : 'Enter your registration number'
											}
											className={`form-input font-mono ${errors.regNumber && touched.regNumber ? 'input-error' : ''}`}
										/>
									</div>
									{errors.regNumber && touched.regNumber ? (
										<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1'>
											⚠ {errors.regNumber}
										</p>
									) : (
										<p className='text-xs text-slate-500 mt-1.5 font-medium leading-relaxed'>
											{isFirstYear
												? 'Note: First-year cadets please enter your allotted serial / roll number.'
												: 'Note: Enter your permanent university registration number.'}
										</p>
									)}
								</div>
							</div>

							{/* Row 2 (2 Columns): Year of Study & Semester */}
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6'>
								{/* Field: Year of Study */}
								<div>
									<label
										htmlFor='yearOfStudy'
										className='block text-xs sm:text-xs font-bold uppercase tracking-wider text-[#0e2544] mb-2'>
										Year of Study <span className='text-red-600'>*</span>
									</label>
									<select
										id='yearOfStudy'
										name='yearOfStudy'
										value={formData.yearOfStudy}
										onChange={handleChange}
										className='form-input cursor-pointer font-medium'>
										<option value='1st Year'>1st Year (Serial Number)</option>
										<option value='2nd Year'>2nd Year</option>
										<option value='3rd Year'>3rd Year</option>
										<option value='4th Year'>4th Year</option>
										<option value='Postgraduate'>Postgraduate</option>
									</select>
								</div>

								{/* Field: Semester */}
								<div>
									<label
										htmlFor='semester'
										className='block text-xs sm:text-xs font-bold uppercase tracking-wider text-[#0e2544] mb-2'>
										Semester <span className='text-red-600'>*</span>
									</label>
									<select
										id='semester'
										name='semester'
										value={formData.semester}
										onChange={handleChange}
										className='form-input cursor-pointer font-medium'>
										{SEMESTERS.map((sem) => (
											<option key={sem} value={sem}>
												{sem}
											</option>
										))}
									</select>
								</div>
							</div>

							{/* Row 3 (2 Columns): Department & Cumulative CGPA */}
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6'>
								{/* Field: Department / Program (2 Options) */}
								<div>
									<label
										htmlFor='department'
										className='block text-xs sm:text-xs font-bold uppercase tracking-wider text-[#0e2544] mb-2'>
										Department / Program <span className='text-red-600'>*</span>
									</label>
									<select
										id='department'
										name='department'
										value={formData.department}
										onChange={handleChange}
										className='form-input cursor-pointer font-medium'>
										<option value='B.Tech Marine Engineering'>B.Tech Marine Engineering</option>
										<option value='MBA'>MBA</option>
									</select>
								</div>

								{/* Field: Cumulative CGPA */}
								<div id='cgpa'>
									<div className='flex items-baseline justify-between gap-1 mb-2 flex-wrap'>
										<label
											htmlFor='cgpaInput'
											className='text-xs sm:text-xs font-bold uppercase tracking-wider text-[#0e2544]'>
											Current CGPA
										</label>
										{isFirstYear && (
											<span className='text-[11px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded'>
												2nd Year Onwards
											</span>
										)}
									</div>
									<input
										type='text'
										id='cgpaInput'
										name='cgpa'
										value={isFirstYear ? '' : formData.cgpa}
										onChange={handleChange}
										onBlur={handleBlur}
										disabled={isFirstYear}
										placeholder={
											isFirstYear ? 'Not applicable for 1st-year cadets' : 'Enter your CGPA'
										}
										className={`form-input ${errors.cgpa && touched.cgpa ? 'input-error' : ''}`}
										inputMode='decimal'
									/>
									{errors.cgpa && touched.cgpa && (
										<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1'>
											⚠ {errors.cgpa}
										</p>
									)}
								</div>
							</div>

							{/* Row 4 (2 Columns): Email Address & Mobile Number */}
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6'>
								{/* Field: Email Address */}
								<div id='email'>
									<label
										htmlFor='emailInput'
										className='block text-xs sm:text-xs font-bold uppercase tracking-wider text-[#0e2544] mb-2'>
										Email Address <span className='text-red-600'>*</span>
									</label>
									<input
										type='email'
										id='emailInput'
										name='email'
										value={formData.email}
										onChange={handleChange}
										onBlur={handleBlur}
										placeholder='Enter your email address'
										className={`form-input ${errors.email && touched.email ? 'input-error' : ''}`}
										autoComplete='email'
										inputMode='email'
									/>
									{errors.email && touched.email && (
										<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1'>
											⚠ {errors.email}
										</p>
									)}
								</div>

								{/* Field: Mobile Number */}
								<div id='phone'>
									<label
										htmlFor='phoneInput'
										className='block text-xs sm:text-xs font-bold uppercase tracking-wider text-[#0e2544] mb-2'>
										Mobile Number <span className='text-red-600'>*</span>
									</label>
									<input
										type='tel'
										id='phoneInput'
										name='phone'
										value={formData.phone}
										onChange={handleChange}
										onBlur={handleBlur}
										placeholder='Enter your phone number'
										className={`form-input font-mono ${errors.phone && touched.phone ? 'input-error' : ''}`}
										autoComplete='tel'
										inputMode='numeric'
									/>
									{errors.phone && touched.phone && (
										<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1'>
											⚠ {errors.phone}
										</p>
									)}
								</div>
							</div>

							{/* Row 5 (2 Symmetrical Columns): Gender & Passport Size Photo */}
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 items-start'>
								{/* Field: Gender (Left Column) */}
								<div>
									<label className='block text-xs sm:text-xs font-bold uppercase tracking-wider text-[#0e2544] mb-2'>
										Gender <span className='text-red-600'>*</span>
									</label>
									<div className='flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200'>
										{['Male', 'Female', 'Other'].map((g) => (
											<label
												key={g}
												className={`flex-1 text-center py-2.5 px-1 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer touch-manipulation transition-all ${
													formData.gender === g
														? 'bg-[#0e2544] text-white shadow-sm'
														: 'text-slate-700 hover:text-slate-950'
												}`}>
												<input
													type='radio'
													name='gender'
													value={g}
													checked={formData.gender === g}
													onChange={handleChange}
													className='sr-only'
												/>
												{g}
											</label>
										))}
									</div>
								</div>

								{/* Field: Passport Size Photo (Right Column - Compulsory) */}
								<div id='photo'>
									<label
										htmlFor='photoInput'
										className='block text-xs sm:text-xs font-bold uppercase tracking-wider text-[#0e2544] mb-2'>
										Passport Size Photo <span className='text-red-600'>* (Compulsory)</span>
									</label>
									<div
										className={`p-2.5 rounded-xl border-2 border-dashed bg-slate-50 transition-colors ${errors.photo && touched.photo ? 'border-red-400 bg-red-50/40' : 'border-slate-300 hover:border-slate-400'}`}>
										<div className='flex items-center gap-3'>
											{formData.photoDataUrl ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img
													src={formData.photoDataUrl}
													alt='Cadet Preview'
													className='w-11 h-11 rounded-lg object-cover border border-slate-300 flex-shrink-0'
												/>
											) : (
												<div className='w-11 h-11 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 text-[10px] font-bold flex-shrink-0'>
													PHOTO
												</div>
											)}
											<div className='flex-1 min-w-0'>
												<label className='inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider text-[#0e2544] bg-white hover:bg-slate-50 cursor-pointer touch-manipulation transition-all shadow-sm'>
													<span>Choose Photo</span>
													<input
														type='file'
														id='photoInput'
														name='photo'
														accept='image/*'
														onChange={handlePhotoChange}
														className='sr-only'
													/>
												</label>
												<p className='text-xs text-slate-600 font-medium truncate mt-1'>
													{formData.photoName ? (
														<span className='font-bold text-emerald-700'>
															✓ {formData.photoName}
														</span>
													) : (
														'PNG, JPG up to 5MB'
													)}
												</p>
											</div>
										</div>
									</div>
									{errors.photo && touched.photo && (
										<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1'>
											⚠ {errors.photo}
										</p>
									)}
								</div>
							</div>

							{/* Row 6 (Full Width): Resume & Credential Proofs PDF Upload */}
							<div id='resume'>
								<label
									htmlFor='resumeInput'
									className='block text-xs sm:text-xs font-bold uppercase tracking-wider text-[#0e2544] mb-2'>
									Resume & Credential Proofs (Single PDF){' '}
									<span className='text-red-600'>* (Compulsory)</span>
								</label>

								<div className='p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-800 mb-3'>
									<p className='text-xs sm:text-sm font-semibold text-[#0e2544] leading-relaxed'>
										Attach proofs for all credentials claimed along with achievements as a{' '}
										<strong>single PDF file</strong>.
									</p>
									<div className='mt-2 text-xs sm:text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed'>
										<span className='font-bold text-[#0e2544]'>Includes:</span> Marksheet
										certificates, awards won, internships, leadership roles, student
										representatives, etc.
									</div>
								</div>

								<div className='p-3.5 border border-slate-300 rounded-xl bg-white flex flex-col sm:flex-row sm:items-center gap-3'>
									<label className='inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider text-[#0e2544] bg-slate-50 hover:bg-slate-100 cursor-pointer touch-manipulation transition-all shadow-sm'>
										<span>Upload PDF Document</span>
										<input
											type='file'
											id='resumeInput'
											name='resume'
											accept='.pdf,application/pdf'
											onChange={handleResumeChange}
											className='sr-only'
										/>
									</label>
									<span className='text-xs sm:text-sm text-slate-700 font-medium truncate flex-1'>
										{formData.resumeName ? (
											<span className='font-bold text-emerald-700'>
												✓ Attached: {formData.resumeName}
											</span>
										) : (
											'No file chosen (.pdf up to 20MB)'
										)}
									</span>
									{formData.resumeName && (
										<button
											type='button'
											onClick={() => setFormData((prev) => ({ ...prev, resumeName: '' }))}
											className='text-xs font-bold text-red-600 hover:text-red-800 self-end sm:self-auto py-1 px-2 rounded bg-red-50 hover:bg-red-100 transition-colors'>
											Remove File
										</button>
									)}
								</div>
								{errors.resume && (
									<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1'>
										⚠ {errors.resume}
									</p>
								)}
							</div>

							{/* Row 7 (Full Width): Past Project Portfolio (Conditional Disabled for 1st Years) */}
							<div>
								<div className='flex items-baseline justify-between mb-2 flex-wrap gap-1'>
									<label
										htmlFor='projectSummary'
										className='text-xs sm:text-xs font-bold uppercase tracking-wider text-[#0e2544]'>
										Past Innovation / Project Portfolio (Optional)
									</label>
									{isFirstYear && (
										<span className='text-[11px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded'>
											Not Required for 1st Year Cadets
										</span>
									)}
								</div>
								<textarea
									id='projectSummary'
									name='projectSummary'
									rows={3}
									value={isFirstYear ? '' : formData.projectSummary}
									onChange={handleChange}
									disabled={isFirstYear}
									placeholder={
										isFirstYear
											? 'Past project portfolio is not required for 1st-year students.'
											: 'Enter details about your past projects or ideas (optional)...'
									}
									className='form-input resize-none'
								/>
							</div>

							{/* Form Actions */}
							<div className='pt-5 sm:pt-6 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-3'>
								<button
									type='button'
									onClick={handleReset}
									className='btn-secondary w-full sm:w-auto'>
									Clear Form
								</button>
								<button
									type='submit'
									disabled={submitting}
									className='btn-primary w-full sm:w-auto'>
									{submitting ? 'Submitting...' : 'Submit Registration'}
								</button>
							</div>
						</form>
					)}
				</div>

				{/* Footer note */}
				<p className='text-center text-xs sm:text-sm text-slate-700 md:text-slate-500 font-bold uppercase tracking-wider mt-5 select-none'>
					Indian Maritime University • Kolkata Campus • IIC 2026–27
				</p>
			</div>
		</main>
	);
}
