'use client';

import React, { useState, useEffect, useRef, FormEvent, ChangeEvent, FocusEvent } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { PDFDocument } from 'pdf-lib';
import {
	User,
	GraduationCap,
	BookOpen,
	Award,
	Lightbulb,
	FileText,
	CheckCircle2,
	AlertCircle,
	Upload,
	FileCheck,
	Trash2,
	ChevronRight,
	ChevronLeft,
	Sparkles,
	ShieldCheck,
	Info,
	Plus,
	Check,
	RotateCcw,
	Printer,
	Lock,
	Layers,
	FileStack,
} from 'lucide-react';

export interface FormData {
	// Section 1: Basic Cadet Profile (Q1 - Q7 + Photo)
	cadetName: string;
	regNumber: string;
	yearOfStudy: string;
	department: string;
	semester: string;
	gender: string;
	email: string;
	phone: string;
	photoName: string;
	photoDataUrl?: string;

	// Section 2: Academic & Research Profile (Q8 - Q12)
	cgpa: string;
	marksheetStatus: 'combined_pdf' | 'separate_pdf' | 'na_first_year';
	marksheetName: string;
	marksheetDataUrl?: string;

	hasJournalPub: boolean;
	journalDetails: string;
	journalFileName: string;
	journalFileDataUrl?: string;

	hasBookChapter: boolean;
	bookChapterDetails: string;
	bookChapterFileName: string;
	bookChapterFileDataUrl?: string;

	hasPatents: boolean;
	patentDetails: string;
	patentFileName: string;
	patentFileDataUrl?: string;

	hasCompetitions: boolean;
	competitionDetails: string;
	competitionFileName: string;
	competitionFileDataUrl?: string;

	// Section 3: Co-Curricular & Leadership Profile (Q13 - Q15)
	hasActivities: boolean;
	activityDetails: string;
	activityFileName: string;
	activityFileDataUrl?: string;

	hasAchievements: boolean;
	achievementDetails: string;
	achievementFileName: string;
	achievementFileDataUrl?: string;

	hasLeadership: boolean;
	leadershipDetails: string;
	leadershipFileName: string;
	leadershipFileDataUrl?: string;

	// Section 4: Innovation & Problem-Solving (Q16 - Q18)
	problemMaritime: string;
	problemSociety: string;
	areasOfInterest: string[];
	customInterest: string;

	// Section 5: Supporting Information (Q19)
	resumeName: string;
	resumeDataUrl?: string;

	// Section 6: Declaration (Q20)
	declarationAccepted: boolean;
}

const INITIAL_STATE: FormData = {
	cadetName: '',
	regNumber: '',
	yearOfStudy: '1st Year',
	department: 'B.Tech Marine Engineering',
	semester: 'Semester 1',
	gender: 'Male',
	email: '',
	phone: '',
	photoName: '',
	photoDataUrl: '',

	cgpa: '',
	marksheetStatus: 'combined_pdf',
	marksheetName: '',
	marksheetDataUrl: '',

	hasJournalPub: false,
	journalDetails: '',
	journalFileName: '',
	journalFileDataUrl: '',

	hasBookChapter: false,
	bookChapterDetails: '',
	bookChapterFileName: '',
	bookChapterFileDataUrl: '',

	hasPatents: false,
	patentDetails: '',
	patentFileName: '',
	patentFileDataUrl: '',

	hasCompetitions: false,
	competitionDetails: '',
	competitionFileName: '',
	competitionFileDataUrl: '',

	hasActivities: false,
	activityDetails: '',
	activityFileName: '',
	activityFileDataUrl: '',

	hasAchievements: false,
	achievementDetails: '',
	achievementFileName: '',
	achievementFileDataUrl: '',

	hasLeadership: false,
	leadershipDetails: '',
	leadershipFileName: '',
	leadershipFileDataUrl: '',

	problemMaritime: '',
	problemSociety: '',
	areasOfInterest: [],
	customInterest: '',

	resumeName: '',
	resumeDataUrl: '',

	declarationAccepted: false,
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

const DEPARTMENTS = [
	'B.Tech Marine Engineering',
	'MBA (International Transportation & Logistics Management)',
	'Other Academic Program',
];

const SUGGESTED_INTERESTS = [
	'🚢 Maritime Robotics, USVs & Autonomous Vessels',
	'⚡ Green Shipping, Decarbonization & Alternative Fuels',
	'🤖 Artificial Intelligence, ML & Computer Vision',
	'📡 Marine IoT, Smart Sensors & Telemetry',
	'📦 Smart Port Logistics & Supply Chain Automation',
	'🛡️ Maritime Cybersecurity & Navigation Safety',
	'🥽 AR / VR, Digital Twins & Maritime Simulators',
	'🌊 Ocean Conservation, Blue Economy & Marine Ecology',
	'⚙️ Naval Architecture, Hydrodynamics & Propulsion',
	'🚀 Drone Tech & Aerial Maritime Surveillance',
	'💡 Startup Incubation & Tech Entrepreneurship',
	'🔋 Offshore Renewable Energy & Tidal Power',
];

const SECTIONS = [
	{ id: 1, title: 'Cadet Profile', icon: User, badge: 'Q1–Q7' },
	{ id: 2, title: 'Academic & Research', icon: GraduationCap, badge: 'Q8–Q12' },
	{ id: 3, title: 'Co-Curricular & Leadership', icon: Award, badge: 'Q13–Q15' },
	{ id: 4, title: 'Innovation & Problem Solving', icon: Lightbulb, badge: 'Q16–Q18' },
	{ id: 5, title: 'Supporting Docs', icon: FileText, badge: 'Q19' },
	{ id: 6, title: 'Declaration', icon: ShieldCheck, badge: 'Q20' },
];

// Helper to merge all uploaded PDFs into a single unified master PDF
async function mergeAllPdfs(
	pdfList: { name: string; dataUrl: string }[],
): Promise<{ mergedDataUrl: string; mergedCount: number }> {
	const validPdfs = pdfList.filter(
		(item) => item.dataUrl && item.dataUrl.startsWith('data:application/pdf'),
	);

	if (validPdfs.length === 0) {
		return { mergedDataUrl: '', mergedCount: 0 };
	}

	if (validPdfs.length === 1) {
		return { mergedDataUrl: validPdfs[0].dataUrl, mergedCount: 1 };
	}

	try {
		const mergedDoc = await PDFDocument.create();

		for (const item of validPdfs) {
			try {
				const base64Data = item.dataUrl.split(',')[1] || item.dataUrl;
				const binaryStr = atob(base64Data);
				const bytes = new Uint8Array(binaryStr.length);
				for (let i = 0; i < binaryStr.length; i++) {
					bytes[i] = binaryStr.charCodeAt(i);
				}
				const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
				const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
				copiedPages.forEach((page) => mergedDoc.addPage(page));
			} catch (itemErr) {
				console.warn(`Could not merge PDF from ${item.name}:`, itemErr);
			}
		}

		const mergedBytes = await mergedDoc.save();
		let binary = '';
		const len = mergedBytes.byteLength;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(mergedBytes[i]);
		}
		const mergedBase64 = btoa(binary);
		return {
			mergedDataUrl: `data:application/pdf;base64,${mergedBase64}`,
			mergedCount: validPdfs.length,
		};
	} catch (err) {
		console.error('Error combining PDFs:', err);
		// Fallback to the main resume PDF
		return {
			mergedDataUrl: validPdfs[0].dataUrl,
			mergedCount: validPdfs.length,
		};
	}
}

export default function Home() {
	const [formData, setFormData] = useState<FormData>(INITIAL_STATE);
	const [errors, setErrors] = useState<{ [key: string]: string }>({});
	const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
	const [currentStep, setCurrentStep] = useState<number>(1);
	const [submitted, setSubmitted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [submittedRefId, setSubmittedRefId] = useState('');
	const [draftSaved, setDraftSaved] = useState(false);
	const [mergedPdfCount, setMergedPdfCount] = useState<number>(0);

	const isFirstYear = formData.yearOfStudy === '1st Year';

	// Refs for non-blocking direct DOM parallax on Desktop
	const oceanContainerRef = useRef<HTMLDivElement>(null);
	const submarineRef = useRef<HTMLDivElement>(null);
	const boatRef = useRef<HTMLDivElement>(null);
	const bgMainRef = useRef<HTMLElement>(null);
	const seabedRef = useRef<HTMLDivElement>(null);

	// Load draft from localStorage on mount
	useEffect(() => {
		try {
			const savedDraft = localStorage.getItem('iic_form_draft_v2');
			if (savedDraft) {
				const parsed = JSON.parse(savedDraft);
				setFormData((prev) => ({
					...prev,
					...parsed,
					photoDataUrl: '',
					resumeDataUrl: '',
					marksheetDataUrl: '',
					journalFileDataUrl: '',
					bookChapterFileDataUrl: '',
					patentFileDataUrl: '',
					competitionFileDataUrl: '',
					activityFileDataUrl: '',
					achievementFileDataUrl: '',
					leadershipFileDataUrl: '',
				}));
			}
		} catch (e) {
			console.warn('Could not load draft from localStorage:', e);
		}
	}, []);

	// Auto-save text draft to localStorage (excluding binary dataUrls)
	useEffect(() => {
		if (submitted) return;
		try {
			const {
				photoDataUrl,
				resumeDataUrl,
				marksheetDataUrl,
				journalFileDataUrl,
				bookChapterFileDataUrl,
				patentFileDataUrl,
				competitionFileDataUrl,
				activityFileDataUrl,
				achievementFileDataUrl,
				leadershipFileDataUrl,
				...safeData
			} = formData;
			localStorage.setItem('iic_form_draft_v2', JSON.stringify(safeData));
			setDraftSaved(true);
			const timer = setTimeout(() => setDraftSaved(false), 2000);
			return () => clearTimeout(timer);
		} catch (e) {
			// localStorage full or disabled
		}
	}, [formData, submitted]);

	// Desktop Scroll Parallax Listener
	useEffect(() => {
		let ticking = false;

		const onScroll = () => {
			if (window.innerWidth < 768) return;

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
	const validateField = (name: string, value: any): string => {
		switch (name) {
			case 'cadetName': {
				const trimmed = typeof value === 'string' ? value.trim() : '';
				if (!trimmed) return 'Full name of the cadet is required.';
				if (trimmed.length < 2) return 'Please enter at least 2 characters.';
				if (!/^[a-zA-Z\s.'-]+$/.test(trimmed))
					return 'Name should only contain letters and spaces.';
				return '';
			}
			case 'regNumber': {
				const trimmed = typeof value === 'string' ? value.trim() : '';
				if (!trimmed) {
					return isFirstYear
						? 'Serial number / Roll number is required for 1st Year Cadets.'
						: 'Permanent University Registration Number is required.';
				}
				if (trimmed.length < 2) return 'Please enter a valid registration/serial number.';
				return '';
			}
			case 'email': {
				const trimmed = typeof value === 'string' ? value.trim() : '';
				if (!trimmed) return 'Email address is required.';
				const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
				if (!emailRegex.test(trimmed)) return 'Please enter a valid email address.';
				return '';
			}
			case 'phone': {
				const cleaned = typeof value === 'string' ? value.replace(/[\s\-()]/g, '') : '';
				if (!cleaned) return 'Mobile number is required.';
				const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
				if (!phoneRegex.test(cleaned)) {
					return 'Please enter a valid 10-digit mobile number.';
				}
				return '';
			}
			case 'cgpa': {
				if (!isFirstYear) {
					const trimmed = typeof value === 'string' ? value.trim() : '';
					if (!trimmed) return 'Current CGPA is required for 2nd–4th/PG students.';
				}
				return '';
			}
			case 'photo': {
				if (!formData.photoName)
					return 'Passport size photo is compulsory. Please select an image.';
				return '';
			}
			case 'resume': {
				if (!formData.resumeName)
					return 'Detailed Resume / CV (PDF) is compulsory. Please upload a PDF file.';
				return '';
			}
			case 'declarationAccepted': {
				if (!value) return 'You must accept the student declaration to complete registration.';
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

	// Passport photo change with automatic image resizing
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

			const reader = new FileReader();
			reader.onload = (event) => {
				const img = new window.Image();
				img.onload = () => {
					const canvas = document.createElement('canvas');
					const maxDim = 800;
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

	// Generic PDF upload handler
	const handlePdfChange = (
		e: ChangeEvent<HTMLInputElement>,
		fieldNameKey: keyof FormData,
		fieldDataKey: keyof FormData,
		errorKey?: string,
	) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
				if (errorKey) {
					setErrors((prev) => ({ ...prev, [errorKey]: 'Please upload only a PDF file (.pdf).' }));
				}
				return;
			}
			if (file.size > 25 * 1024 * 1024) {
				if (errorKey) {
					setErrors((prev) => ({ ...prev, [errorKey]: 'PDF file size must be under 25MB.' }));
				}
				return;
			}

			const reader = new FileReader();
			reader.onload = (event) => {
				setFormData((prev) => ({
					...prev,
					[fieldNameKey]: file.name,
					[fieldDataKey]: event.target?.result as string,
				}));
			};
			reader.readAsDataURL(file);
			if (errorKey) {
				setErrors((prev) => ({ ...prev, [errorKey]: '' }));
			}
		}
	};

	// Toggle area of interest
	const toggleInterest = (item: string) => {
		setFormData((prev) => {
			const exists = prev.areasOfInterest.includes(item);
			const updated = exists
				? prev.areasOfInterest.filter((i) => i !== item)
				: [...prev.areasOfInterest, item];
			return { ...prev, areasOfInterest: updated };
		});
	};

	// Add custom interest
	const handleAddCustomInterest = () => {
		if (formData.customInterest.trim()) {
			const trimmed = formData.customInterest.trim();
			if (!formData.areasOfInterest.includes(trimmed)) {
				setFormData((prev) => ({
					...prev,
					areasOfInterest: [...prev.areasOfInterest, trimmed],
					customInterest: '',
				}));
			}
		}
	};

	// Pure state-based validator for SSR and conditional rendering
	const isStepComplete = (stepNumber: number): boolean => {
		if (stepNumber === 1) {
			const nameErr = validateField('cadetName', formData.cadetName);
			const regErr = validateField('regNumber', formData.regNumber);
			const emailErr = validateField('email', formData.email);
			const phoneErr = validateField('phone', formData.phone);
			const photoErr = validateField('photo', formData.photoName);
			return !nameErr && !regErr && !emailErr && !phoneErr && !photoErr;
		}
		if (stepNumber === 2) {
			const cgpaErr = validateField('cgpa', formData.cgpa);
			if (cgpaErr) return false;
			if (formData.hasJournalPub && !formData.journalDetails.trim()) return false;
			if (formData.hasBookChapter && !formData.bookChapterDetails.trim()) return false;
			if (formData.hasPatents && !formData.patentDetails.trim()) return false;
			if (formData.hasCompetitions && !formData.competitionDetails.trim()) return false;
			return true;
		}
		if (stepNumber === 3) {
			if (formData.hasActivities && !formData.activityDetails.trim()) return false;
			if (formData.hasAchievements && !formData.achievementDetails.trim()) return false;
			if (formData.hasLeadership && !formData.leadershipDetails.trim()) return false;
			return true;
		}
		if (stepNumber === 4) {
			return true;
		}
		if (stepNumber === 5) {
			const resumeErr = validateField('resume', formData.resumeName);
			return !resumeErr;
		}
		if (stepNumber === 6) {
			return formData.declarationAccepted;
		}
		return true;
	};

	// Check if step is accessible (pure check for render)
	const canAccessStep = (targetStep: number): boolean => {
		if (targetStep <= currentStep) return true;
		for (let s = 1; s < targetStep; s++) {
			if (!isStepComplete(s)) {
				return false;
			}
		}
		return true;
	};

	// Step validator: sets errors and touched on action
	const validateStep = (stepNumber: number): boolean => {
		const newErrors: { [key: string]: string } = {};

		if (stepNumber === 1) {
			const nameErr = validateField('cadetName', formData.cadetName);
			if (nameErr) newErrors.cadetName = nameErr;

			const regErr = validateField('regNumber', formData.regNumber);
			if (regErr) newErrors.regNumber = regErr;

			const emailErr = validateField('email', formData.email);
			if (emailErr) newErrors.email = emailErr;

			const phoneErr = validateField('phone', formData.phone);
			if (phoneErr) newErrors.phone = phoneErr;

			const photoErr = validateField('photo', formData.photoName);
			if (photoErr) newErrors.photo = photoErr;
		}

		if (stepNumber === 2) {
			const cgpaErr = validateField('cgpa', formData.cgpa);
			if (cgpaErr) newErrors.cgpa = cgpaErr;

			if (formData.hasJournalPub && !formData.journalDetails.trim()) {
				newErrors.journalDetails = 'Please provide details of your journal publication.';
			}
			if (formData.hasBookChapter && !formData.bookChapterDetails.trim()) {
				newErrors.bookChapterDetails = 'Please provide details of your book chapter.';
			}
			if (formData.hasPatents && !formData.patentDetails.trim()) {
				newErrors.patentDetails = 'Please provide details of your patent / IPR.';
			}
			if (formData.hasCompetitions && !formData.competitionDetails.trim()) {
				newErrors.competitionDetails = 'Please provide details of your competition participation.';
			}
		}

		if (stepNumber === 3) {
			if (formData.hasActivities && !formData.activityDetails.trim()) {
				newErrors.activityDetails = 'Please provide details of your technical activity.';
			}
			if (formData.hasAchievements && !formData.achievementDetails.trim()) {
				newErrors.achievementDetails = 'Please provide details of your achievement / award.';
			}
			if (formData.hasLeadership && !formData.leadershipDetails.trim()) {
				newErrors.leadershipDetails = 'Please provide details of the leadership position held.';
			}
		}

		if (stepNumber === 5) {
			const resumeErr = validateField('resume', formData.resumeName);
			if (resumeErr) newErrors.resume = resumeErr;
		}

		if (stepNumber === 6) {
			const decErr = validateField('declarationAccepted', formData.declarationAccepted);
			if (decErr) newErrors.declarationAccepted = decErr;
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors((prev) => ({ ...prev, ...newErrors }));
			setTouched((prev) => {
				const nextTouched = { ...prev };
				Object.keys(newErrors).forEach((k) => {
					nextTouched[k] = true;
				});
				return nextTouched;
			});
			return false;
		}
		return true;
	};

	const handleStepClick = (targetStep: number) => {
		if (targetStep <= currentStep) {
			setCurrentStep(targetStep);
			if (typeof window !== 'undefined') {
				window.scrollTo({ top: 300, behavior: 'smooth' });
			}
			return;
		}

		// Check sequential steps
		for (let s = 1; s < targetStep; s++) {
			if (!validateStep(s)) {
				setCurrentStep(s);
				if (typeof window !== 'undefined') {
					const firstError = document.querySelector(
						'.input-error, [id^="cadetName"], [id^="regNumber"], [id^="photo"], [id^="resume"]',
					);
					if (firstError) {
						firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
					}
				}
				return;
			}
		}

		setCurrentStep(targetStep);
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 300, behavior: 'smooth' });
		}
	};

	const nextStep = () => {
		if (validateStep(currentStep)) {
			if (currentStep < 6) {
				setCurrentStep((prev) => prev + 1);
				if (typeof window !== 'undefined') {
					window.scrollTo({ top: 300, behavior: 'smooth' });
				}
			}
		} else {
			if (typeof window !== 'undefined') {
				const firstError = document.querySelector('.input-error');
				if (firstError) {
					firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			}
		}
	};

	const prevStep = () => {
		if (currentStep > 1) {
			setCurrentStep((prev) => prev - 1);
			if (typeof window !== 'undefined') {
				window.scrollTo({ top: 300, behavior: 'smooth' });
			}
		}
	};

	const validateAll = () => {
		let allValid = true;
		for (let s = 1; s <= 6; s++) {
			if (!validateStep(s)) {
				allValid = false;
			}
		}
		return allValid;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!validateAll()) {
			const firstErrorKey = Object.keys(errors)[0] || 'cadetName';
			const el = document.getElementById(firstErrorKey);
			if (el) {
				el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
			return;
		}

		setSubmitting(true);

		try {
			const generatedRefId = `IIC-2627-${Math.floor(1000 + Math.random() * 9000)}`;
			setSubmittedRefId(generatedRefId);

			// Collect all PDFs uploaded across all sections and combine into a single master PDF
			const pdfsToMerge = [
				{ name: 'Detailed Resume & Proofs (Q19)', dataUrl: formData.resumeDataUrl || '' },
				{ name: 'Marksheet Proof (Q8)', dataUrl: formData.marksheetDataUrl || '' },
				{ name: 'Journal Publication First Page (Q9)', dataUrl: formData.journalFileDataUrl || '' },
				{ name: 'Book Chapter First Page (Q10)', dataUrl: formData.bookChapterFileDataUrl || '' },
				{ name: 'Patent / IPR Certificate (Q11)', dataUrl: formData.patentFileDataUrl || '' },
				{ name: 'Competition Certificate (Q12)', dataUrl: formData.competitionFileDataUrl || '' },
				{ name: 'Activity Certificate (Q13)', dataUrl: formData.activityFileDataUrl || '' },
				{ name: 'Achievement Certificate (Q14)', dataUrl: formData.achievementFileDataUrl || '' },
			].filter((p) => p.dataUrl && p.dataUrl.length > 0);

			console.log(
				`[PDF Merge] Combining ${pdfsToMerge.length} uploaded PDF(s) into single master PDF...`,
			);
			const { mergedDataUrl, mergedCount } = await mergeAllPdfs(pdfsToMerge);
			setMergedPdfCount(mergedCount);

			const payload = {
				...formData,
				referenceId: generatedRefId,
				submittedAt: new Date().toISOString(),
				// Combined master single PDF containing all uploaded proofs & resume
				combinedPdfDataUrl: mergedDataUrl || formData.resumeDataUrl,
				mergedPdfCount: mergedCount,
				// Ensure main resumeDataUrl holds the merged master PDF for Drive & Email
				resumeDataUrl: mergedDataUrl || formData.resumeDataUrl,
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
				console.warn(
					'API route not reachable, submitting directly to Google Apps Script:',
					apiError,
				);
				await fetch(directGoogleUrl, {
					method: 'POST',
					mode: 'no-cors',
					headers: { 'Content-Type': 'text/plain' },
					body: JSON.stringify(payload),
				});
			}

			// Clear draft on successful submission
			try {
				localStorage.removeItem('iic_form_draft_v2');
			} catch (e) {}

			// Fire celebratory confetti!
			try {
				confetti({
					particleCount: 120,
					spread: 80,
					origin: { y: 0.6 },
					colors: ['#0e2544', '#0284c7', '#f59e0b', '#10b981', '#6366f1'],
				});
			} catch (e) {}
		} catch (err) {
			console.error('Submission request failed:', err);
		} finally {
			setSubmitting(false);
			setSubmitted(true);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	const handleReset = () => {
		setFormData(INITIAL_STATE);
		setErrors({});
		setTouched({});
		setCurrentStep(1);
		setSubmitted(false);
		try {
			localStorage.removeItem('iic_form_draft_v2');
		} catch (e) {}
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<main
			ref={bgMainRef}
			className='relative w-full min-h-screen py-4 sm:py-8 px-3 sm:px-6 lg:px-8 flex flex-col items-center justify-start overflow-hidden will-change-[background-color]'>
			{/* DESKTOP PARALLAX OCEAN ENVIRONMENT */}
			<div
				className='hidden md:block fixed inset-0 pointer-events-none z-0 overflow-hidden select-none'
				style={{ contain: 'strict' }}>
				{/* Mid-Depth Submarine */}
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

				{/* Parallax Ocean Waves */}
				<div
					ref={oceanContainerRef}
					className='absolute inset-x-0 bottom-0 gpu-accelerated'
					style={{ transform: 'translate3d(0, 220px, 0)' }}>
					{/* Bobbing Boat */}
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

					<div className='w-[200%] h-[280px] opacity-40 animate-wave-slow gpu-accelerated'>
						<svg
							viewBox='0 0 1200 120'
							preserveAspectRatio='none'
							className='w-full h-full fill-[#0a315c]'>
							<path d='M0,0 C150,90 350,-40 500,50 C650,140 900,10 1200,60 L1200,120 L0,120 Z'></path>
						</svg>
					</div>

					<div className='-mt-[230px] w-[200%] h-[250px] opacity-65 animate-wave-fast gpu-accelerated'>
						<svg
							viewBox='0 0 1200 120'
							preserveAspectRatio='none'
							className='w-full h-full fill-[#0f548a]'>
							<path d='M0,30 C200,100 450,0 700,70 C950,130 1100,20 1200,40 L1200,120 L0,120 Z'></path>
						</svg>
					</div>

					<div className='-mt-[190px] w-[200%] h-[210px] opacity-95 animate-wave-slow relative gpu-accelerated'>
						<svg
							viewBox='0 0 1200 120'
							preserveAspectRatio='none'
							className='w-full h-full fill-[#0284c7]'>
							<path d='M0,45 C180,10 380,80 600,30 C820,-10 1020,70 1200,45 L1200,120 L0,120 Z'></path>
						</svg>
						<div className='absolute top-0 inset-x-0 h-1.5 bg-sky-200/80 rounded-full' />
					</div>

					<div className='w-full h-[650px] bg-gradient-to-b from-[#0284c7] via-[#0b3c6d] to-[#04162a]' />
				</div>

				<div
					ref={seabedRef}
					className='absolute bottom-0 inset-x-0 h-36 pointer-events-none opacity-0 gpu-accelerated z-10'>
					<svg
						viewBox='0 0 1200 100'
						preserveAspectRatio='none'
						className='w-full h-full fill-[#030d1a]'>
						<path d='M0,100 L0,70 Q200,40 400,65 T800,50 T1200,60 L1200,100 Z'></path>
					</svg>
				</div>
			</div>

			{/* MOBILE SUBMARINE */}
			<div className='block md:hidden fixed inset-0 pointer-events-none z-0 overflow-hidden select-none'>
				<div className='absolute bottom-4 right-3 z-10 animate-sub-mobile opacity-80'>
					<svg
						width='76'
						height='40'
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
						<circle cx='46' cy='2' r='2' fill='#38bdf8' />
						<circle cx='28' cy='26' r='4' fill='#38bdf8' stroke='#0e2544' strokeWidth='1.5' />
						<circle cx='42' cy='26' r='4' fill='#38bdf8' stroke='#0e2544' strokeWidth='1.5' />
						<path d='M10 20L16 26L10 32Z' fill='#0e2544' />
					</svg>
				</div>
			</div>

			{/* Form Shell / Center Card */}
			<div className='relative z-10 w-full max-w-4xl mb-14 mt-1 sm:mt-2'>
				<div className='clean-card overflow-hidden'>
					{/* Official Banner Header */}
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

					{/* Title & Official Notice Strip */}
					<div className='px-5 sm:px-8 py-5 border-b border-slate-100 bg-white'>
						<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
							<div>
								<div className='flex items-center gap-2 mb-1'>
									<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300'>
										Session 2026–27
									</span>
									<span className='text-xs font-semibold text-slate-500'>IMU Kolkata Campus</span>
								</div>
								<h1 className='text-lg sm:text-2xl font-bold text-[#0e2544] uppercase tracking-wide leading-tight'>
									IIC Student Council – Student Enrollment Form
								</h1>
							</div>
							{draftSaved && (
								<div className='flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 font-semibold self-start sm:self-auto animate-pulse'>
									<Check className='w-3.5 h-3.5' /> Auto-saved
								</div>
							)}
						</div>

						{/* Instructions to Students Banner */}
						<div className='mt-4 p-3.5 sm:p-4 rounded-xl bg-sky-50/90 border border-sky-200/90 text-sky-950 flex items-start gap-3'>
							<Info className='w-5 h-5 text-sky-700 flex-shrink-0 mt-0.5' />
							<div className='text-xs sm:text-sm leading-relaxed'>
								<strong className='font-bold text-sky-900 block mb-0.5 uppercase tracking-wide text-xs'>
									Instructions to Students:
								</strong>
								Please provide accurate and concise information. Answer all applicable questions.
								For questions that are not applicable, select{' '}
								<span className='font-bold text-[#0e2544] bg-sky-100 px-1.5 py-0.2 rounded border border-sky-300'>
									“Not Applicable (N/A)”
								</span>
								. All uploaded PDF documents and proofs will be automatically merged into a single
								master PDF file for Google Drive storage and email record.
							</div>
						</div>
					</div>

					{/* SUCCESS CONFIRMATION VIEW */}
					{submitted ? (
						<div className='p-6 sm:p-12 text-center bg-white space-y-6'>
							<div className='w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-sm'>
								✓
							</div>
							<div>
								<span className='text-xs font-bold text-emerald-800 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300'>
									Official Record Created
								</span>
								<h2 className='text-xl sm:text-3xl font-bold text-[#0e2544] uppercase tracking-tight mt-3'>
									Enrollment Application Submitted
								</h2>
								<p className='text-sm sm:text-base text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed'>
									Thank you, <span className='font-bold text-[#0e2544]'>{formData.cadetName}</span>.
									Your enrollment application and credentials for the{' '}
									<strong>IIC Student Council 2026–27</strong> have been recorded successfully.
								</p>
							</div>

							{/* Summary Card */}
							<div className='text-left bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-7 text-sm space-y-4 max-w-xl mx-auto shadow-xs'>
								{submittedRefId && (
									<div className='flex justify-between items-center border-b border-sky-200 pb-3 bg-sky-50 -mx-5 -mt-5 sm:-mx-7 sm:-mt-7 p-4 sm:p-5 rounded-t-2xl'>
										<div>
											<span className='text-sky-900 font-bold text-xs uppercase tracking-wider block'>
												Application Reference ID:
											</span>
											<span className='font-mono font-extrabold text-sky-900 text-base sm:text-lg'>
												{submittedRefId}
											</span>
										</div>
										<span className='text-xs font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-md border border-emerald-300 shadow-xs'>
											● Submitted
										</span>
									</div>
								)}

								<div className='flex items-center gap-3.5 pb-3.5 border-b border-slate-200'>
									{formData.photoDataUrl && (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={formData.photoDataUrl}
											alt='Cadet'
											className='w-14 h-14 rounded-xl object-cover border border-slate-300 flex-shrink-0'
										/>
									)}
									<div>
										<span className='text-xs text-slate-500 font-semibold block uppercase tracking-wider'>
											Cadet Name
										</span>
										<span className='font-bold text-base sm:text-lg text-[#0e2544]'>
											{formData.cadetName}
										</span>
									</div>
								</div>

								<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm border-b border-slate-200 pb-3.5'>
									<div>
										<span className='text-slate-500 font-medium block'>Registration / Roll:</span>
										<span className='font-mono font-bold text-[#0e2544]'>{formData.regNumber}</span>
									</div>
									<div>
										<span className='text-slate-500 font-medium block'>Program & Year:</span>
										<span className='font-semibold text-slate-800'>
											{formData.department} ({formData.yearOfStudy} • {formData.semester})
										</span>
									</div>
									<div>
										<span className='text-slate-500 font-medium block'>Current CGPA:</span>
										<span className='font-bold text-[#0e2544]'>
											{formData.cgpa || 'First Year / N/A'}
										</span>
									</div>
									<div>
										<span className='text-slate-500 font-medium block'>Contact Info:</span>
										<span className='font-semibold text-slate-800'>
											{formData.phone} • {formData.email}
										</span>
									</div>
								</div>

								{/* Attached Files & Sections Summary */}
								<div className='space-y-2 text-xs'>
									<div className='flex items-center justify-between'>
										<span className='font-bold text-[#0e2544] uppercase tracking-wider block'>
											Uploaded Documents & Combined Master PDF:
										</span>
										<span className='bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1'>
											<FileStack className='w-3.5 h-3.5' /> {mergedPdfCount || 1} Document(s) Merged
										</span>
									</div>

									<div className='p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-900'>
										<span className='font-bold block'>
											✓ Unified Master PDF Sent to Google Drive & Email:
										</span>
										<span className='text-[11px] text-emerald-800'>
											All proofs and certificates have been automatically compiled into a single
											master document.
										</span>
									</div>

									<div className='space-y-1 pt-1'>
										<div className='flex items-center gap-1.5 text-slate-700'>
											<CheckCircle2 className='w-4 h-4 text-emerald-600' />
											<span>
												<strong>Detailed Resume / CV & Proofs:</strong> {formData.resumeName}
											</span>
										</div>
										{formData.hasJournalPub && formData.journalFileName && (
											<div className='flex items-center gap-1.5 text-slate-700'>
												<CheckCircle2 className='w-4 h-4 text-emerald-600' />
												<span>
													<strong>Journal Proof:</strong> {formData.journalFileName}
												</span>
											</div>
										)}
										{formData.hasBookChapter && formData.bookChapterFileName && (
											<div className='flex items-center gap-1.5 text-slate-700'>
												<CheckCircle2 className='w-4 h-4 text-emerald-600' />
												<span>
													<strong>Book Chapter Proof:</strong> {formData.bookChapterFileName}
												</span>
											</div>
										)}
										{formData.hasPatents && formData.patentFileName && (
											<div className='flex items-center gap-1.5 text-slate-700'>
												<CheckCircle2 className='w-4 h-4 text-emerald-600' />
												<span>
													<strong>Patent/IPR Proof:</strong> {formData.patentFileName}
												</span>
											</div>
										)}
										{formData.hasCompetitions && formData.competitionFileName && (
											<div className='flex items-center gap-1.5 text-slate-700'>
												<CheckCircle2 className='w-4 h-4 text-emerald-600' />
												<span>
													<strong>Competition Certificate:</strong> {formData.competitionFileName}
												</span>
											</div>
										)}
										{formData.hasActivities && formData.activityFileName && (
											<div className='flex items-center gap-1.5 text-slate-700'>
												<CheckCircle2 className='w-4 h-4 text-emerald-600' />
												<span>
													<strong>Activity Certificate:</strong> {formData.activityFileName}
												</span>
											</div>
										)}
										{formData.hasAchievements && formData.achievementFileName && (
											<div className='flex items-center gap-1.5 text-slate-700'>
												<CheckCircle2 className='w-4 h-4 text-emerald-600' />
												<span>
													<strong>Award/Achievement Proof:</strong> {formData.achievementFileName}
												</span>
											</div>
										)}
									</div>
								</div>

								{/* Areas of Interest Summary */}
								{formData.areasOfInterest.length > 0 && (
									<div className='pt-2 border-t border-slate-200'>
										<span className='font-bold text-[#0e2544] uppercase tracking-wider block text-xs mb-1.5'>
											Innovation Focus Areas:
										</span>
										<div className='flex flex-wrap gap-1.5'>
											{formData.areasOfInterest.map((tag) => (
												<span
													key={tag}
													className='text-[11px] font-semibold bg-slate-200/80 text-[#0e2544] px-2 py-0.5 rounded-md'>
													{tag}
												</span>
											))}
										</div>
									</div>
								)}
							</div>

							<div className='flex flex-col sm:flex-row items-center justify-center gap-3 pt-2'>
								<button
									type='button'
									onClick={() => window.print()}
									className='btn-secondary w-full sm:w-auto flex items-center gap-2'>
									<Printer className='w-4 h-4' /> Print / Save PDF Receipt
								</button>
								<button
									type='button'
									onClick={handleReset}
									className='btn-primary w-full sm:w-auto'>
									Register Another Cadet
								</button>
							</div>
						</div>
					) : (
						/* MAIN ENROLLMENT FORM */
						<form onSubmit={handleSubmit} noValidate className='bg-white'>
							{/* DESKTOP-ONLY CAPSULE STEPPER (>= 768px) */}
							<div className='hidden md:block border-b border-slate-200 bg-slate-50/80 px-6 py-4'>
								<div className='flex items-center justify-between gap-2 max-w-3xl mx-auto'>
									{SECTIONS.map((sec, idx) => {
										const Icon = sec.icon;
										const isCurrent = currentStep === sec.id;
										const isCompleted = currentStep > sec.id;
										const isLocked = !canAccessStep(sec.id) && currentStep < sec.id;

										return (
											<React.Fragment key={sec.id}>
												{/* Capsule Pill Button */}
												<button
													type='button'
													onClick={() => handleStepClick(sec.id)}
													title={
														isLocked ? 'Fill previous section to unlock' : `Go to ${sec.title}`
													}
													className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
														isCurrent
															? 'bg-[#0e2544] text-white shadow-md ring-2 ring-sky-500/30 scale-105'
															: isCompleted
																? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 cursor-pointer'
																: isLocked
																	? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-75'
																	: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 cursor-pointer'
													}`}>
													<div
														className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
															isCurrent
																? 'bg-sky-500 text-white'
																: isCompleted
																	? 'bg-emerald-600 text-white'
																	: 'bg-slate-200 text-slate-600'
														}`}>
														{isCompleted ? <Check className='w-3 h-3' /> : sec.id}
													</div>

													<span className='whitespace-nowrap'>{sec.title}</span>

													{isLocked && <Lock className='w-3 h-3 text-slate-400' />}
												</button>

												{/* Connecting Line between capsules */}
												{idx < SECTIONS.length - 1 && (
													<div
														className={`flex-1 h-0.5 rounded transition-all ${
															currentStep > sec.id ? 'bg-emerald-400' : 'bg-slate-200'
														}`}
													/>
												)}
											</React.Fragment>
										);
									})}
								</div>
							</div>

							{/* MOBILE-ONLY STEP PROGRESS BAR (< 768px) */}
							<div className='block md:hidden border-b border-slate-200 bg-slate-50 p-3.5'>
								<div className='flex items-center justify-between text-xs font-bold text-[#0e2544] mb-1.5'>
									<span className='flex items-center gap-2'>
										<span className='w-5 h-5 rounded-full bg-[#0e2544] text-white flex items-center justify-center text-[10px] font-bold'>
											{currentStep}
										</span>
										<span>{SECTIONS[currentStep - 1]?.title}</span>
									</span>
									<span className='text-slate-500 text-[11px] font-semibold'>
										Step {currentStep} of 6
									</span>
								</div>
								<div className='w-full bg-slate-200 h-2 rounded-full overflow-hidden'>
									<div
										className='bg-sky-600 h-full transition-all duration-300'
										style={{ width: `${(currentStep / 6) * 100}%` }}
									/>
								</div>
							</div>

							{/* FORM BODY CONTAINER */}
							<div className='p-4 sm:p-8 space-y-8'>
								{/* ======================================================== */}
								{/* SECTION 1: CADET PROFILE & DEMOGRAPHICS (Q1 - Q7 + PHOTO) */}
								{/* ======================================================== */}
								<section
									id='section-1'
									className={`space-y-6 ${currentStep === 1 ? 'block' : 'hidden'}`}>
									<div className='flex items-center justify-between border-b border-slate-200 pb-3'>
										<div className='flex items-center gap-2.5'>
											<div className='w-8 h-8 rounded-lg bg-[#0e2544] text-white flex items-center justify-center font-bold text-sm'>
												1
											</div>
											<div>
												<h2 className='text-base sm:text-lg font-bold text-[#0e2544] uppercase tracking-wide'>
													Cadet Profile & Academic Identity
												</h2>
												<p className='text-xs text-slate-500 font-medium'>
													Questions 1 to 7 • Personal, enrollment, and official contact details
												</p>
											</div>
										</div>
										<span className='section-badge'>Section 1 of 6</span>
									</div>

									{/* Row 1: Cadet Name & Registration Number */}
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6'>
										<div id='cadetName'>
											<label
												htmlFor='cadetNameInput'
												className='block text-xs font-bold uppercase tracking-wider text-[#0e2544] mb-2'>
												1. Name of the Cadet <span className='text-red-600'>*</span>
											</label>
											<input
												type='text'
												id='cadetNameInput'
												name='cadetName'
												value={formData.cadetName}
												onChange={handleChange}
												onBlur={handleBlur}
												placeholder='Enter full name in capital letters'
												className={`form-input uppercase ${errors.cadetName && touched.cadetName ? 'input-error' : ''}`}
												autoComplete='name'
											/>
											{errors.cadetName && touched.cadetName ? (
												<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1'>
													<AlertCircle className='w-3.5 h-3.5' /> {errors.cadetName}
												</p>
											) : (
												<p className='text-xs text-slate-500 mt-1.5 font-medium'>
													Enter full name as per official IMU records.
												</p>
											)}
										</div>

										<div id='regNumber'>
											<div className='flex items-baseline justify-between gap-1 mb-2 flex-wrap'>
												<label
													htmlFor='regNumberInput'
													className='text-xs font-bold uppercase tracking-wider text-[#0e2544]'>
													2.{' '}
													{isFirstYear ? 'Serial / Roll Number' : 'University Registration Number'}{' '}
													<span className='text-red-600'>*</span>
												</label>
												<span className='text-[11px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-200'>
													{isFirstYear ? '1st Year Serial' : 'Permanent Reg No.'}
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
													isFirstYear
														? 'Enter allotted serial / roll number'
														: 'Enter permanent university reg number'
												}
												className={`form-input font-mono ${errors.regNumber && touched.regNumber ? 'input-error' : ''}`}
											/>
											{errors.regNumber && touched.regNumber ? (
												<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1'>
													<AlertCircle className='w-3.5 h-3.5' /> {errors.regNumber}
												</p>
											) : (
												<p className='text-xs text-slate-500 mt-1.5 font-medium'>
													{isFirstYear
														? 'First-year cadets enter your serial/roll number.'
														: 'Enter your permanent university registration number.'}
												</p>
											)}
										</div>
									</div>

									{/* Row 2: Year of Study & Semester */}
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6'>
										<div>
											<label
												htmlFor='yearOfStudy'
												className='block text-xs font-bold uppercase tracking-wider text-[#0e2544] mb-2'>
												3. Year of Study <span className='text-red-600'>*</span>
											</label>
											<select
												id='yearOfStudy'
												name='yearOfStudy'
												value={formData.yearOfStudy}
												onChange={handleChange}
												className='form-input cursor-pointer font-medium'>
												<option value='1st Year'>1st Year</option>
												<option value='2nd Year'>2nd Year</option>
												<option value='3rd Year'>3rd Year</option>
												<option value='4th Year'>4th Year</option>
											</select>
										</div>

										<div>
											<label
												htmlFor='semester'
												className='block text-xs font-bold uppercase tracking-wider text-[#0e2544] mb-2'>
												4. Current Semester <span className='text-red-600'>*</span>
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

									{/* Row 3: Department & Gender */}
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6'>
										<div>
											<label
												htmlFor='department'
												className='block text-xs font-bold uppercase tracking-wider text-[#0e2544] mb-2'>
												5. Department / Academic Program <span className='text-red-600'>*</span>
											</label>
											<select
												id='department'
												name='department'
												value={formData.department}
												onChange={handleChange}
												className='form-input cursor-pointer font-medium'>
												{DEPARTMENTS.map((dept) => (
													<option key={dept} value={dept}>
														{dept}
													</option>
												))}
											</select>
										</div>

										<div>
											<label className='block text-xs font-bold uppercase tracking-wider text-[#0e2544] mb-2'>
												Gender <span className='text-red-600'>*</span>
											</label>
											<div className='flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200'>
												{['Male', 'Female', 'Other'].map((g) => (
													<label
														key={g}
														className={`flex-1 text-center py-2 px-1 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer touch-manipulation transition-all ${
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
									</div>

									{/* Row 4: Email Address & Mobile Number */}
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6'>
										<div id='email'>
											<label
												htmlFor='emailInput'
												className='block text-xs font-bold uppercase tracking-wider text-[#0e2544] mb-2'>
												6. Email Address <span className='text-red-600'>*</span>
											</label>
											<input
												type='email'
												id='emailInput'
												name='email'
												value={formData.email}
												onChange={handleChange}
												onBlur={handleBlur}
												placeholder='name@domain.com'
												className={`form-input ${errors.email && touched.email ? 'input-error' : ''}`}
												autoComplete='email'
											/>
											{errors.email && touched.email && (
												<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1'>
													<AlertCircle className='w-3.5 h-3.5' /> {errors.email}
												</p>
											)}
										</div>

										<div id='phone'>
											<label
												htmlFor='phoneInput'
												className='block text-xs font-bold uppercase tracking-wider text-[#0e2544] mb-2'>
												7. Mobile Number <span className='text-red-600'>*</span>
											</label>
											<input
												type='tel'
												id='phoneInput'
												name='phone'
												value={formData.phone}
												onChange={handleChange}
												onBlur={handleBlur}
												placeholder='10-digit mobile number'
												className={`form-input font-mono ${errors.phone && touched.phone ? 'input-error' : ''}`}
												autoComplete='tel'
											/>
											{errors.phone && touched.phone && (
												<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1'>
													<AlertCircle className='w-3.5 h-3.5' /> {errors.phone}
												</p>
											)}
										</div>
									</div>

									{/* Passport Size Photo Upload */}
									<div id='photo' className='p-4 rounded-xl border border-slate-200 bg-slate-50/50'>
										<label
											htmlFor='photoInput'
											className='block text-xs font-bold uppercase tracking-wider text-[#0e2544] mb-1'>
											Passport Size Photo <span className='text-red-600'>* (Compulsory)</span>
										</label>
										<p className='text-xs text-slate-500 mb-3'>
											Upload a clear passport size photograph (PNG or JPG).
										</p>

										<div className='flex items-center gap-4 flex-wrap sm:flex-nowrap'>
											{formData.photoDataUrl ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img
													src={formData.photoDataUrl}
													alt='Cadet Preview'
													className='w-16 h-16 rounded-xl object-cover border-2 border-slate-300 shadow-sm flex-shrink-0'
												/>
											) : (
												<div className='w-16 h-16 rounded-xl bg-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 text-[10px] font-bold flex-shrink-0'>
													<User className='w-6 h-6 mb-0.5 text-slate-400' />
													PHOTO
												</div>
											)}
											<div className='flex-1 min-w-[200px]'>
												<label className='inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider text-[#0e2544] bg-white hover:bg-slate-50 cursor-pointer shadow-xs transition-all'>
													<Upload className='w-3.5 h-3.5' />
													<span>{formData.photoName ? 'Change Photo' : 'Select Photo'}</span>
													<input
														type='file'
														id='photoInput'
														name='photo'
														accept='image/*'
														onChange={handlePhotoChange}
														className='sr-only'
													/>
												</label>
												<p className='text-xs text-slate-600 font-medium truncate mt-1.5'>
													{formData.photoName ? (
														<span className='font-bold text-emerald-700 flex items-center gap-1'>
															<Check className='w-3.5 h-3.5' /> {formData.photoName}
														</span>
													) : (
														'Accepts JPG, PNG, WEBP up to 15MB'
													)}
												</p>
											</div>
										</div>
										{errors.photo && touched.photo && (
											<p className='text-xs font-semibold text-red-600 mt-2 flex items-center gap-1'>
												<AlertCircle className='w-3.5 h-3.5' /> {errors.photo}
											</p>
										)}
									</div>
								</section>

								{/* ======================================================== */}
								{/* SECTION 2: ACADEMIC & RESEARCH PROFILE (Q8 - Q12) */}
								{/* ======================================================== */}
								<section
									id='section-2'
									className={`space-y-6 ${currentStep === 2 ? 'block' : 'hidden'}`}>
									<div className='flex items-center justify-between border-b border-slate-200 pb-3'>
										<div className='flex items-center gap-2.5'>
											<div className='w-8 h-8 rounded-lg bg-[#0e2544] text-white flex items-center justify-center font-bold text-sm'>
												2
											</div>
											<div>
												<h2 className='text-base sm:text-lg font-bold text-[#0e2544] uppercase tracking-wide'>
													Academic & Research Profile
												</h2>
												<p className='text-xs text-slate-500 font-medium'>
													Questions 8 to 12 • CGPA, Publications, IPR & Competitions
												</p>
											</div>
										</div>
										<span className='section-badge'>Section 2 of 6</span>
									</div>

									{/* Question 8: Current CGPA */}
									<div id='cgpa' className='section-container'>
										<div className='flex items-baseline justify-between mb-2 flex-wrap gap-2'>
											<label
												htmlFor='cgpaInput'
												className='text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0e2544]'>
												8. Current CGPA {!isFirstYear && <span className='text-red-600'>*</span>}
											</label>
											<span className='text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded'>
												{isFirstYear ? '1st Year Optional' : 'Required'}
											</span>
										</div>

										<div className='grid grid-cols-1 sm:grid-cols-2 gap-4 items-start'>
											<div>
												<input
													type='text'
													id='cgpaInput'
													name='cgpa'
													value={formData.cgpa}
													onChange={handleChange}
													onBlur={handleBlur}
													placeholder={
														isFirstYear
															? 'Not applicable for 1st Year (or leave N/A)'
															: 'Enter your Current CGPA (e.g. 8.75)'
													}
													className={`form-input ${errors.cgpa && touched.cgpa ? 'input-error' : ''}`}
												/>
												{errors.cgpa && touched.cgpa && (
													<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1'>
														<AlertCircle className='w-3.5 h-3.5' /> {errors.cgpa}
													</p>
												)}
											</div>
											<div className='text-xs text-slate-600 bg-sky-50/70 p-3 rounded-lg border border-sky-200'>
												<span className='font-bold text-sky-900 block mb-0.5'>
													Notice for First Year Cadets CGPA is optional. You may leave it blank or
													enter N/A.
												</span>
											</div>
										</div>
									</div>

									{/* Question 9: Journal Publications */}
									<div className='section-container space-y-3'>
										<div className='flex items-center justify-between flex-wrap gap-2'>
											<div>
												<label className='text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0e2544] block'>
													9. Journal Publications, if any
												</label>
												<span className='text-xs text-slate-500'>
													Mention publication details & upload first page showing authorship in PDF.
												</span>
											</div>
											{/* N/A Toggle */}
											<div className='flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200'>
												<button
													type='button'
													onClick={() =>
														setFormData((prev) => ({
															...prev,
															hasJournalPub: false,
															journalDetails: '',
															journalFileName: '',
															journalFileDataUrl: '',
														}))
													}
													className={`na-toggle-btn ${
														!formData.hasJournalPub
															? 'bg-[#0e2544] text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													Not Applicable (N/A)
												</button>
												<button
													type='button'
													onClick={() => setFormData((prev) => ({ ...prev, hasJournalPub: true }))}
													className={`na-toggle-btn ${
														formData.hasJournalPub
															? 'bg-emerald-700 text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													+ I Have Publications
												</button>
											</div>
										</div>

										{formData.hasJournalPub && (
											<div className='pt-3 space-y-3 border-t border-slate-200 animate-fadeIn'>
												<textarea
													name='journalDetails'
													rows={2}
													value={formData.journalDetails}
													onChange={handleChange}
													placeholder='Paper Title, Journal Name, ISSN / DOI, Volume/Issue, Year...'
													className='form-input resize-none'
												/>
												{errors.journalDetails && touched.journalDetails && (
													<p className='text-xs font-semibold text-red-600 flex items-center gap-1'>
														<AlertCircle className='w-3.5 h-3.5' /> {errors.journalDetails}
													</p>
												)}
												<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
													<label className='inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider text-[#0e2544] bg-white hover:bg-slate-50 cursor-pointer shadow-xs'>
														<Upload className='w-3.5 h-3.5' />
														<span>Upload First Page PDF</span>
														<input
															type='file'
															accept='.pdf,application/pdf'
															onChange={(e) =>
																handlePdfChange(
																	e,
																	'journalFileName',
																	'journalFileDataUrl',
																	'journalFile',
																)
															}
															className='sr-only'
														/>
													</label>
													<span className='text-xs text-slate-700 font-medium truncate flex-1'>
														{formData.journalFileName ? (
															<span className='text-emerald-700 font-bold flex items-center gap-1'>
																<FileCheck className='w-4 h-4' /> {formData.journalFileName}
															</span>
														) : (
															'No PDF chosen (Max 15MB)'
														)}
													</span>
													{formData.journalFileName && (
														<button
															type='button'
															onClick={() =>
																setFormData((prev) => ({
																	...prev,
																	journalFileName: '',
																	journalFileDataUrl: '',
																}))
															}
															className='text-xs font-bold text-red-600 hover:text-red-800 p-1'>
															<Trash2 className='w-4 h-4' />
														</button>
													)}
												</div>
											</div>
										)}
									</div>

									{/* Question 10: Book Chapter Publications */}
									<div className='section-container space-y-3'>
										<div className='flex items-center justify-between flex-wrap gap-2'>
											<div>
												<label className='text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0e2544] block'>
													10. Book Chapter Publications, if any
												</label>
												<span className='text-xs text-slate-500'>
													Mention publication details & upload first page showing authorship in PDF.
												</span>
											</div>
											{/* N/A Toggle */}
											<div className='flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200'>
												<button
													type='button'
													onClick={() =>
														setFormData((prev) => ({
															...prev,
															hasBookChapter: false,
															bookChapterDetails: '',
															bookChapterFileName: '',
															bookChapterFileDataUrl: '',
														}))
													}
													className={`na-toggle-btn ${
														!formData.hasBookChapter
															? 'bg-[#0e2544] text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													Not Applicable (N/A)
												</button>
												<button
													type='button'
													onClick={() => setFormData((prev) => ({ ...prev, hasBookChapter: true }))}
													className={`na-toggle-btn ${
														formData.hasBookChapter
															? 'bg-emerald-700 text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													+ I Have Chapters
												</button>
											</div>
										</div>

										{formData.hasBookChapter && (
											<div className='pt-3 space-y-3 border-t border-slate-200 animate-fadeIn'>
												<textarea
													name='bookChapterDetails'
													rows={2}
													value={formData.bookChapterDetails}
													onChange={handleChange}
													placeholder='Book Title, Chapter Title, ISBN, Publisher, Year...'
													className='form-input resize-none'
												/>
												{errors.bookChapterDetails && touched.bookChapterDetails && (
													<p className='text-xs font-semibold text-red-600 flex items-center gap-1'>
														<AlertCircle className='w-3.5 h-3.5' /> {errors.bookChapterDetails}
													</p>
												)}
												<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
													<label className='inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider text-[#0e2544] bg-white hover:bg-slate-50 cursor-pointer shadow-xs'>
														<Upload className='w-3.5 h-3.5' />
														<span>Upload First Page PDF</span>
														<input
															type='file'
															accept='.pdf,application/pdf'
															onChange={(e) =>
																handlePdfChange(e, 'bookChapterFileName', 'bookChapterFileDataUrl')
															}
															className='sr-only'
														/>
													</label>
													<span className='text-xs text-slate-700 font-medium truncate flex-1'>
														{formData.bookChapterFileName ? (
															<span className='text-emerald-700 font-bold flex items-center gap-1'>
																<FileCheck className='w-4 h-4' /> {formData.bookChapterFileName}
															</span>
														) : (
															'No PDF chosen (Max 15MB)'
														)}
													</span>
													{formData.bookChapterFileName && (
														<button
															type='button'
															onClick={() =>
																setFormData((prev) => ({
																	...prev,
																	bookChapterFileName: '',
																	bookChapterFileDataUrl: '',
																}))
															}
															className='text-xs font-bold text-red-600 hover:text-red-800 p-1'>
															<Trash2 className='w-4 h-4' />
														</button>
													)}
												</div>
											</div>
										)}
									</div>

									{/* Question 11: Patents / Design Registrations / Copyrights */}
									<div className='section-container space-y-3'>
										<div className='flex items-center justify-between flex-wrap gap-2'>
											<div>
												<label className='text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0e2544] block'>
													11. Patents / Design Registrations / Copyrights, if any
												</label>
												<span className='text-xs text-slate-500'>
													Mention IPR details and upload the certificate / filing document in PDF.
												</span>
											</div>
											{/* N/A Toggle */}
											<div className='flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200'>
												<button
													type='button'
													onClick={() =>
														setFormData((prev) => ({
															...prev,
															hasPatents: false,
															patentDetails: '',
															patentFileName: '',
															patentFileDataUrl: '',
														}))
													}
													className={`na-toggle-btn ${
														!formData.hasPatents
															? 'bg-[#0e2544] text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													Not Applicable (N/A)
												</button>
												<button
													type='button'
													onClick={() => setFormData((prev) => ({ ...prev, hasPatents: true }))}
													className={`na-toggle-btn ${
														formData.hasPatents
															? 'bg-emerald-700 text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													+ I Have Patents/IPR
												</button>
											</div>
										</div>

										{formData.hasPatents && (
											<div className='pt-3 space-y-3 border-t border-slate-200 animate-fadeIn'>
												<textarea
													name='patentDetails'
													rows={2}
													value={formData.patentDetails}
													onChange={handleChange}
													placeholder='Title of Invention, Application/Grant No, Filing Status, Authority...'
													className='form-input resize-none'
												/>
												{errors.patentDetails && touched.patentDetails && (
													<p className='text-xs font-semibold text-red-600 flex items-center gap-1'>
														<AlertCircle className='w-3.5 h-3.5' /> {errors.patentDetails}
													</p>
												)}
												<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
													<label className='inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider text-[#0e2544] bg-white hover:bg-slate-50 cursor-pointer shadow-xs'>
														<Upload className='w-3.5 h-3.5' />
														<span>Upload Certificate / Filing PDF</span>
														<input
															type='file'
															accept='.pdf,application/pdf'
															onChange={(e) =>
																handlePdfChange(e, 'patentFileName', 'patentFileDataUrl')
															}
															className='sr-only'
														/>
													</label>
													<span className='text-xs text-slate-700 font-medium truncate flex-1'>
														{formData.patentFileName ? (
															<span className='text-emerald-700 font-bold flex items-center gap-1'>
																<FileCheck className='w-4 h-4' /> {formData.patentFileName}
															</span>
														) : (
															'No PDF chosen (Max 15MB)'
														)}
													</span>
													{formData.patentFileName && (
														<button
															type='button'
															onClick={() =>
																setFormData((prev) => ({
																	...prev,
																	patentFileName: '',
																	patentFileDataUrl: '',
																	patentDetails: '',
																}))
															}
															className='text-xs font-bold text-red-600 hover:text-red-800 p-1'>
															<Trash2 className='w-4 h-4' />
														</button>
													)}
												</div>
											</div>
										)}
									</div>

									{/* Question 12: Participation in Competitions / Hackathons */}
									<div className='section-container space-y-3'>
										<div className='flex items-center justify-between flex-wrap gap-2'>
											<div>
												<label className='text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0e2544] block'>
													12. Competitions / Hackathons / Technothons, if any
												</label>
												<span className='text-xs text-slate-500'>
													Mention event, year and achievement, and upload certificate in PDF format.
												</span>
											</div>
											{/* N/A Toggle */}
											<div className='flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200'>
												<button
													type='button'
													onClick={() =>
														setFormData((prev) => ({
															...prev,
															hasCompetitions: false,
															competitionDetails: '',
															competitionFileName: '',
															competitionFileDataUrl: '',
														}))
													}
													className={`na-toggle-btn ${
														!formData.hasCompetitions
															? 'bg-[#0e2544] text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													Not Applicable (N/A)
												</button>
												<button
													type='button'
													onClick={() =>
														setFormData((prev) => ({ ...prev, hasCompetitions: true }))
													}
													className={`na-toggle-btn ${
														formData.hasCompetitions
															? 'bg-emerald-700 text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													+ I Have Participated
												</button>
											</div>
										</div>

										{formData.hasCompetitions && (
											<div className='pt-3 space-y-3 border-t border-slate-200 animate-fadeIn'>
												<textarea
													name='competitionDetails'
													rows={2}
													value={formData.competitionDetails}
													onChange={handleChange}
													placeholder='Event Name, Organising Body, Year, Project/Role, Achievement (Winner, Finalist, Participant)...'
													className='form-input resize-none'
												/>
												{errors.competitionDetails && touched.competitionDetails && (
													<p className='text-xs font-semibold text-red-600 flex items-center gap-1'>
														<AlertCircle className='w-3.5 h-3.5' /> {errors.competitionDetails}
													</p>
												)}
												<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
													<label className='inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider text-[#0e2544] bg-white hover:bg-slate-50 cursor-pointer shadow-xs'>
														<Upload className='w-3.5 h-3.5' />
														<span>Upload Certificate PDF</span>
														<input
															type='file'
															accept='.pdf,application/pdf'
															onChange={(e) =>
																handlePdfChange(e, 'competitionFileName', 'competitionFileDataUrl')
															}
															className='sr-only'
														/>
													</label>
													<span className='text-xs text-slate-700 font-medium truncate flex-1'>
														{formData.competitionFileName ? (
															<span className='text-emerald-700 font-bold flex items-center gap-1'>
																<FileCheck className='w-4 h-4' /> {formData.competitionFileName}
															</span>
														) : (
															'No PDF chosen (Max 15MB)'
														)}
													</span>
													{formData.competitionFileName && (
														<button
															type='button'
															onClick={() =>
																setFormData((prev) => ({
																	...prev,
																	competitionFileName: '',
																	competitionFileDataUrl: '',
																}))
															}
															className='text-xs font-bold text-red-600 hover:text-red-800 p-1'>
															<Trash2 className='w-4 h-4' />
														</button>
													)}
												</div>
											</div>
										)}
									</div>
								</section>

								{/* ======================================================== */}
								{/* SECTION 3: CO-CURRICULAR & LEADERSHIP PROFILE (Q13 - Q15) */}
								{/* ======================================================== */}
								<section
									id='section-3'
									className={`space-y-6 ${currentStep === 3 ? 'block' : 'hidden'}`}>
									<div className='flex items-center justify-between border-b border-slate-200 pb-3'>
										<div className='flex items-center gap-2.5'>
											<div className='w-8 h-8 rounded-lg bg-[#0e2544] text-white flex items-center justify-center font-bold text-sm'>
												3
											</div>
											<div>
												<h2 className='text-base sm:text-lg font-bold text-[#0e2544] uppercase tracking-wide'>
													Co-Curricular & Leadership Profile
												</h2>
												<p className='text-xs text-slate-500 font-medium'>
													Questions 13 to 15 • Activities, Awards & Leadership Positions
												</p>
											</div>
										</div>
										<span className='section-badge'>Section 3 of 6</span>
									</div>

									{/* Question 13: Technical / Co-Curricular Activities */}
									<div className='section-container space-y-3'>
										<div className='flex items-center justify-between flex-wrap gap-2'>
											<div>
												<label className='text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0e2544] block'>
													13. Technical / Co-Curricular Activities, if any
												</label>
												<span className='text-xs text-slate-500'>
													Mention the activity, event, and your role, and upload certificate in PDF.
												</span>
											</div>
											<div className='flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200'>
												<button
													type='button'
													onClick={() =>
														setFormData((prev) => ({
															...prev,
															hasActivities: false,
															activityDetails: '',
															activityFileName: '',
															activityFileDataUrl: '',
														}))
													}
													className={`na-toggle-btn ${
														!formData.hasActivities
															? 'bg-[#0e2544] text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													Not Applicable (N/A)
												</button>
												<button
													type='button'
													onClick={() => setFormData((prev) => ({ ...prev, hasActivities: true }))}
													className={`na-toggle-btn ${
														formData.hasActivities
															? 'bg-emerald-700 text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													+ I Have Activities
												</button>
											</div>
										</div>

										{formData.hasActivities && (
											<div className='pt-3 space-y-3 border-t border-slate-200 animate-fadeIn'>
												<textarea
													name='activityDetails'
													rows={2}
													value={formData.activityDetails}
													onChange={handleChange}
													placeholder='Activity / Workshop, Organizing Body, Role & Contributions...'
													className='form-input resize-none'
												/>
												{errors.activityDetails && touched.activityDetails && (
													<p className='text-xs font-semibold text-red-600 flex items-center gap-1'>
														<AlertCircle className='w-3.5 h-3.5' /> {errors.activityDetails}
													</p>
												)}
												<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
													<label className='inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider text-[#0e2544] bg-white hover:bg-slate-50 cursor-pointer shadow-xs'>
														<Upload className='w-3.5 h-3.5' />
														<span>Upload Certificate PDF</span>
														<input
															type='file'
															accept='.pdf,application/pdf'
															onChange={(e) =>
																handlePdfChange(e, 'activityFileName', 'activityFileDataUrl')
															}
															className='sr-only'
														/>
													</label>
													<span className='text-xs text-slate-700 font-medium truncate flex-1'>
														{formData.activityFileName ? (
															<span className='text-emerald-700 font-bold flex items-center gap-1'>
																<FileCheck className='w-4 h-4' /> {formData.activityFileName}
															</span>
														) : (
															'No PDF chosen (Max 15MB)'
														)}
													</span>
													{formData.activityFileName && (
														<button
															type='button'
															onClick={() =>
																setFormData((prev) => ({
																	...prev,
																	activityFileName: '',
																	activityFileDataUrl: '',
																}))
															}
															className='text-xs font-bold text-red-600 hover:text-red-800 p-1'>
															<Trash2 className='w-4 h-4' />
														</button>
													)}
												</div>
											</div>
										)}
									</div>

									{/* Question 14: Major Achievements / Awards */}
									<div className='section-container space-y-3'>
										<div className='flex items-center justify-between flex-wrap gap-2'>
											<div>
												<label className='text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0e2544] block'>
													14. Major Achievements / Awards, if any
												</label>
												<span className='text-xs text-slate-500'>
													Mention the achievement and upload the certificate / proof in PDF format.
												</span>
											</div>
											<div className='flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200'>
												<button
													type='button'
													onClick={() =>
														setFormData((prev) => ({
															...prev,
															hasAchievements: false,
															achievementDetails: '',
															achievementFileName: '',
															achievementFileDataUrl: '',
														}))
													}
													className={`na-toggle-btn ${
														!formData.hasAchievements
															? 'bg-[#0e2544] text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													Not Applicable (N/A)
												</button>
												<button
													type='button'
													onClick={() =>
														setFormData((prev) => ({ ...prev, hasAchievements: true }))
													}
													className={`na-toggle-btn ${
														formData.hasAchievements
															? 'bg-emerald-700 text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													+ I Have Achievements
												</button>
											</div>
										</div>

										{formData.hasAchievements && (
											<div className='pt-3 space-y-3 border-t border-slate-200 animate-fadeIn'>
												<textarea
													name='achievementDetails'
													rows={2}
													value={formData.achievementDetails}
													onChange={handleChange}
													placeholder='Award / Honor Title, Awarding Authority, Year, Category...'
													className='form-input resize-none'
												/>
												{errors.achievementDetails && touched.achievementDetails && (
													<p className='text-xs font-semibold text-red-600 flex items-center gap-1'>
														<AlertCircle className='w-3.5 h-3.5' /> {errors.achievementDetails}
													</p>
												)}
												<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
													<label className='inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider text-[#0e2544] bg-white hover:bg-slate-50 cursor-pointer shadow-xs'>
														<Upload className='w-3.5 h-3.5' />
														<span>Upload Award Proof PDF</span>
														<input
															type='file'
															accept='.pdf,application/pdf'
															onChange={(e) =>
																handlePdfChange(e, 'achievementFileName', 'achievementFileDataUrl')
															}
															className='sr-only'
														/>
													</label>
													<span className='text-xs text-slate-700 font-medium truncate flex-1'>
														{formData.achievementFileName ? (
															<span className='text-emerald-700 font-bold flex items-center gap-1'>
																<FileCheck className='w-4 h-4' /> {formData.achievementFileName}
															</span>
														) : (
															'No PDF chosen (Max 15MB)'
														)}
													</span>
													{formData.achievementFileName && (
														<button
															type='button'
															onClick={() =>
																setFormData((prev) => ({
																	...prev,
																	achievementFileName: '',
																	achievementFileDataUrl: '',
																}))
															}
															className='text-xs font-bold text-red-600 hover:text-red-800 p-1'>
															<Trash2 className='w-4 h-4' />
														</button>
													)}
												</div>
											</div>
										)}
									</div>

									{/* Question 15: Leadership / Coordinator Positions Held */}
									<div className='section-container space-y-3'>
										<div className='flex items-center justify-between flex-wrap gap-2'>
											<div>
												<label className='text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0e2544] block'>
													15. Leadership / Coordinator Positions Held, if any
												</label>
												<span className='text-xs text-slate-500'>
													Mention position, organisation/club/event, duration, and responsibilities
													held.
												</span>
											</div>
											<div className='flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200'>
												<button
													type='button'
													onClick={() =>
														setFormData((prev) => ({
															...prev,
															hasLeadership: false,
															leadershipDetails: '',
															leadershipFileName: '',
															leadershipFileDataUrl: '',
														}))
													}
													className={`na-toggle-btn ${
														!formData.hasLeadership
															? 'bg-[#0e2544] text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													Not Applicable (N/A)
												</button>
												<button
													type='button'
													onClick={() => setFormData((prev) => ({ ...prev, hasLeadership: true }))}
													className={`na-toggle-btn ${
														formData.hasLeadership
															? 'bg-emerald-700 text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													+ I Held Positions
												</button>
											</div>
										</div>

										{formData.hasLeadership && (
											<div className='pt-3 space-y-3 border-t border-slate-200 animate-fadeIn'>
												<textarea
													name='leadershipDetails'
													rows={3}
													value={formData.leadershipDetails}
													onChange={handleChange}
													placeholder='Position Held (e.g. Lead, Secretary, Student Rep, Club Coordinator), Organisation/Club, Duration/Tenure, Key Responsibilities...'
													className='form-input resize-none'
												/>
												{errors.leadershipDetails && touched.leadershipDetails && (
													<p className='text-xs font-semibold text-red-600 flex items-center gap-1'>
														<AlertCircle className='w-3.5 h-3.5' /> {errors.leadershipDetails}
													</p>
												)}
											</div>
										)}
									</div>
								</section>

								{/* ======================================================== */}
								{/* SECTION 4: INNOVATION & PROBLEM-SOLVING (Q16 - Q18) */}
								{/* ======================================================== */}
								<section
									id='section-4'
									className={`space-y-6 ${currentStep === 4 ? 'block' : 'hidden'}`}>
									<div className='flex items-center justify-between border-b border-slate-200 pb-3'>
										<div className='flex items-center gap-2.5'>
											<div className='w-8 h-8 rounded-lg bg-[#0e2544] text-white flex items-center justify-center font-bold text-sm'>
												4
											</div>
											<div>
												<h2 className='text-base sm:text-lg font-bold text-[#0e2544] uppercase tracking-wide'>
													Innovation & Problem-Solving
												</h2>
												<p className='text-xs text-slate-500 font-medium'>
													Questions 16 to 18 • Vision, Ecosystem Challenges & Technology Interests
												</p>
											</div>
										</div>
										<span className='section-badge'>Section 4 of 6</span>
									</div>

									{/* Question 16: Maritime / University Ecosystem Problem */}
									<div className='section-container space-y-2'>
										<label
											htmlFor='problemMaritime'
											className='text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0e2544] block'>
											16. Problem in the Maritime / University Ecosystem you would like to solve
										</label>
										<p className='text-xs text-slate-600 leading-relaxed'>
											Briefly describe the problem and why you think it needs to be addressed.
										</p>
										<textarea
											id='problemMaritime'
											name='problemMaritime'
											rows={4}
											value={formData.problemMaritime}
											onChange={handleChange}
											placeholder='Describe a specific operational, technological, ecological, or campus ecosystem challenge and your proposed angle of solution...'
											className='form-input resize-y'
										/>
										<div className='flex justify-end text-[11px] text-slate-400'>
											{formData.problemMaritime.length} characters
										</div>
									</div>

									{/* Question 17: Problem in Society */}
									<div className='section-container space-y-2'>
										<label
											htmlFor='problemSociety'
											className='text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0e2544] block'>
											17. Problem in Society you would like to solve
										</label>
										<p className='text-xs text-slate-600 leading-relaxed'>
											Briefly describe the problem and why you think it needs to be addressed.
										</p>
										<textarea
											id='problemSociety'
											name='problemSociety'
											rows={4}
											value={formData.problemSociety}
											onChange={handleChange}
											placeholder='Describe a broader social, environmental, energy, or civic problem that motivates your passion for innovation...'
											className='form-input resize-y'
										/>
										<div className='flex justify-end text-[11px] text-slate-400'>
											{formData.problemSociety.length} characters
										</div>
									</div>

									{/* Question 18: Area(s) of Innovation / Technology Interest */}
									<div className='section-container space-y-3'>
										<div>
											<label className='text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0e2544] block'>
												18. Which area(s) of innovation / technology interest you most?
											</label>
											<p className='text-xs text-slate-600 mt-0.5'>
												Select all domains that resonate with your interests or type custom areas.
											</p>
										</div>

										{/* Interactive Tag Chips */}
										<div className='flex flex-wrap gap-2 pt-1'>
											{SUGGESTED_INTERESTS.map((tag) => {
												const active = formData.areasOfInterest.includes(tag);
												return (
													<button
														key={tag}
														type='button'
														onClick={() => toggleInterest(tag)}
														className={`interest-tag-chip ${active ? 'active' : ''}`}>
														{active ? (
															<Check className='w-3.5 h-3.5' />
														) : (
															<Plus className='w-3.5 h-3.5' />
														)}
														<span>{tag}</span>
													</button>
												);
											})}
										</div>

										{/* Add Custom Tag */}
										<div className='flex gap-2 pt-2'>
											<input
												type='text'
												value={formData.customInterest}
												onChange={(e) =>
													setFormData((prev) => ({ ...prev, customInterest: e.target.value }))
												}
												onKeyDown={(e) => {
													if (e.key === 'Enter') {
														e.preventDefault();
														handleAddCustomInterest();
													}
												}}
												placeholder='Add other specific technology or innovation topic...'
												className='form-input flex-1 text-xs sm:text-sm'
											/>
											<button
												type='button'
												onClick={handleAddCustomInterest}
												className='btn-secondary whitespace-nowrap text-xs flex items-center gap-1'>
												<Plus className='w-3.5 h-3.5' /> Add Area
											</button>
										</div>

										{formData.areasOfInterest.length > 0 && (
											<p className='text-xs font-semibold text-emerald-800 mt-1 flex items-center gap-1'>
												<Sparkles className='w-3.5 h-3.5 text-amber-500' />
												Selected ({formData.areasOfInterest.length}) domains
											</p>
										)}
									</div>
								</section>

								{/* ======================================================== */}
								{/* SECTION 5: SUPPORTING INFORMATION (Q19) */}
								{/* ======================================================== */}
								<section
									id='section-5'
									className={`space-y-6 ${currentStep === 5 ? 'block' : 'hidden'}`}>
									<div className='flex items-center justify-between border-b border-slate-200 pb-3'>
										<div className='flex items-center gap-2.5'>
											<div className='w-8 h-8 rounded-lg bg-[#0e2544] text-white flex items-center justify-center font-bold text-sm'>
												5
											</div>
											<div>
												<h2 className='text-base sm:text-lg font-bold text-[#0e2544] uppercase tracking-wide'>
													Supporting Information
												</h2>
												<p className='text-xs text-slate-500 font-medium'>
													Question 19 • Detailed Resume / CV & Proof Documents
												</p>
											</div>
										</div>
										<span className='section-badge'>Section 5 of 6</span>
									</div>

									{/* Question 19: Upload Detailed Resume / CV */}
									<div id='resume' className='section-container space-y-4'>
										<div>
											<label
												htmlFor='resumeInput'
												className='text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0e2544] block'>
												19. Upload Detailed Resume / CV (PDF){' '}
												<span className='text-red-600'>* (Compulsory)</span>
											</label>
											<p className='text-xs text-slate-600 mt-1 leading-relaxed'>
												Upload your latest CV/resume in PDF format. All uploaded proofs and
												marksheet certificates across sections are automatically merged into a
												single combined master PDF document.
											</p>
										</div>

										<div className='p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 text-xs sm:text-xs leading-relaxed space-y-1'>
											<span className='font-bold text-sky-900 block'>
												📌 Automatic Single Master PDF Storage:
											</span>
											<p>
												• Includes: Latest Resume, Semester Marksheets, Certificate Proofs, Awards &
												Positions.
											</p>
											<p>
												• Accepted Format: <strong>.pdf</strong> (Maximum size: 25MB).
											</p>
										</div>

										<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4'>
											<label className='inline-flex items-center justify-center gap-2 px-5 py-3 border border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider text-[#0e2544] bg-white hover:bg-slate-50 cursor-pointer shadow-xs transition-all flex-shrink-0'>
												<Upload className='w-4 h-4 text-sky-700' />
												<span>
													{formData.resumeName ? 'Change Resume PDF' : 'Upload Resume PDF'}
												</span>
												<input
													type='file'
													id='resumeInput'
													name='resume'
													accept='.pdf,application/pdf'
													onChange={(e) =>
														handlePdfChange(e, 'resumeName', 'resumeDataUrl', 'resume')
													}
													className='sr-only'
												/>
											</label>

											<div className='flex-1 min-w-0'>
												{formData.resumeName ? (
													<div className='flex items-center justify-between gap-2 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200'>
														<span className='text-xs sm:text-sm font-bold text-emerald-800 truncate flex items-center gap-1.5'>
															<FileCheck className='w-4 h-4 text-emerald-600 flex-shrink-0' />
															{formData.resumeName}
														</span>
														<button
															type='button'
															onClick={() =>
																setFormData((prev) => ({
																	...prev,
																	resumeName: '',
																	resumeDataUrl: '',
																}))
															}
															className='text-xs font-bold text-red-600 hover:text-red-800 px-2 py-1 rounded bg-white border border-red-200 flex-shrink-0'>
															Remove
														</button>
													</div>
												) : (
													<span className='text-xs sm:text-sm text-slate-500 font-medium'>
														No file chosen yet (.pdf up to 25MB)
													</span>
												)}
											</div>
										</div>

										{errors.resume && (
											<p className='text-xs font-semibold text-red-600 mt-2 flex items-center gap-1'>
												<AlertCircle className='w-3.5 h-3.5' /> {errors.resume}
											</p>
										)}
									</div>
								</section>

								{/* ======================================================== */}
								{/* SECTION 6: DECLARATION & CONSENT (Q20) */}
								{/* ======================================================== */}
								<section
									id='section-6'
									className={`space-y-6 ${currentStep === 6 ? 'block' : 'hidden'}`}>
									<div className='flex items-center justify-between border-b border-slate-200 pb-3'>
										<div className='flex items-center gap-2.5'>
											<div className='w-8 h-8 rounded-lg bg-[#0e2544] text-white flex items-center justify-center font-bold text-sm'>
												6
											</div>
											<div>
												<h2 className='text-base sm:text-lg font-bold text-[#0e2544] uppercase tracking-wide'>
													Official Declaration
												</h2>
												<p className='text-xs text-slate-500 font-medium'>
													Question 20 • Student Declaration & Consent for Participation
												</p>
											</div>
										</div>
										<span className='section-badge'>Section 6 of 6</span>
									</div>

									{/* Question 20: Student Declaration */}
									<div id='declarationAccepted' className='section-container space-y-4'>
										<label className='text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0e2544] block'>
											20. Student Declaration / Consent for Participation in IIC Activities{' '}
											<span className='text-red-600'>*</span>
										</label>

										{/* Declaration Statement Box */}
										<div className='p-4 sm:p-5 rounded-xl bg-slate-50 border-l-4 border-[#0e2544] text-slate-800 text-xs sm:text-sm leading-relaxed shadow-xs'>
											<strong className='text-[#0e2544] font-bold block mb-2 uppercase tracking-wide text-xs'>
												Declaration Statement:
											</strong>
											<p className='italic text-slate-700 leading-relaxed'>
												“I hereby declare that the information provided by me is true and correct to
												the best of my knowledge. I understand that submission of this form does not
												guarantee selection to the IIC Student Council. If selected, I agree to
												actively participate in IIC activities and contribute responsibly towards
												the innovation, research, entrepreneurship and related activities of the
												Institution.”
											</p>
										</div>

										{/* Declaration Consent Checkbox */}
										<label className='flex items-start gap-3 p-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50/80 cursor-pointer transition-colors'>
											<input
												type='checkbox'
												name='declarationAccepted'
												checked={formData.declarationAccepted}
												onChange={(e) => {
													setFormData((prev) => ({
														...prev,
														declarationAccepted: e.target.checked,
													}));
													if (errors.declarationAccepted) {
														setErrors((prev) => ({ ...prev, declarationAccepted: '' }));
													}
												}}
												className='mt-1 w-4 h-4 text-[#0e2544] rounded border-slate-300 focus:ring-[#0e2544]'
											/>
											<div className='text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed select-none'>
												I have read, understood, and solemnly accept the Declaration above.
											</div>
										</label>

										{errors.declarationAccepted && touched.declarationAccepted && (
											<p className='text-xs font-semibold text-red-600 mt-2 flex items-center gap-1'>
												<AlertCircle className='w-3.5 h-3.5' /> {errors.declarationAccepted}
											</p>
										)}

										{/* Digital Signature Confirmation Preview */}
										{formData.cadetName && (
											<div className='pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 flex-wrap gap-2'>
												<span>
													<strong>Digital Signature:</strong>{' '}
													<span className='font-mono font-bold text-[#0e2544] uppercase'>
														{formData.cadetName}
													</span>
												</span>
												<span>
													<strong>Timestamp:</strong> {new Date().toLocaleDateString('en-GB')}
												</span>
											</div>
										)}
									</div>
								</section>

								{/* ======================================================== */}
								{/* STEP NAVIGATION & SUBMIT CONTROLS */}
								{/* ======================================================== */}
								<div className='pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3'>
									<div className='flex items-center gap-2 w-full sm:w-auto'>
										<button
											type='button'
											onClick={handleReset}
											className='btn-secondary w-full sm:w-auto flex items-center justify-center gap-1.5'>
											<RotateCcw className='w-3.5 h-3.5' /> Clear Form
										</button>
										{currentStep > 1 && (
											<button
												type='button'
												onClick={prevStep}
												className='btn-secondary w-full sm:w-auto flex items-center justify-center gap-1.5'>
												<ChevronLeft className='w-4 h-4' /> Previous
											</button>
										)}
									</div>

									<div className='flex items-center gap-3 w-full sm:w-auto'>
										{/* On Steps 1 to 5: Only show "Next" Button */}
										{currentStep < 6 ? (
											<button
												type='button'
												onClick={nextStep}
												className='btn-primary w-full sm:w-auto flex items-center justify-center gap-1.5'>
												<span>Next: {SECTIONS[currentStep]?.title}</span>
												<ChevronRight className='w-4 h-4' />
											</button>
										) : (
											/* On Step 6: Show "Submit Enrollment Form" Button */
											<button
												type='submit'
												disabled={submitting}
												className='btn-primary w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 border-emerald-900 shadow-md'>
												<ShieldCheck className='w-4 h-4' />
												<span>
													{submitting ? 'Submitting Application...' : 'Submit Enrollment Form'}
												</span>
											</button>
										)}
									</div>
								</div>
							</div>
						</form>
					)}
				</div>

				{/* Footer note */}
				<p className='text-center text-xs sm:text-sm text-slate-700 md:text-slate-500 font-bold uppercase tracking-wider mt-6 select-none'>
					Indian Maritime University • Kolkata Campus • IIC 2026–27
				</p>
			</div>
		</main>
	);
}
