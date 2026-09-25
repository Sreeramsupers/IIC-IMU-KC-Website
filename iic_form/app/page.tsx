'use client';

import React, { useState, useEffect, useRef, FormEvent, ChangeEvent, FocusEvent } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import {
	User,
	GraduationCap,
	Award,
	Lightbulb,
	CheckCircle2,
	AlertCircle,
	Upload,
	FileCheck,
	Trash2,
	ChevronRight,
	ChevronLeft,
	ChevronDown,
	ChevronUp,
	Sparkles,
	ShieldCheck,
	Info,
	Plus,
	Check,
	RotateCcw,
	Mail,
	Phone,
	Hash,
	Building2,
	Compass,
	Calendar,
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

	// Section 2: Academics Profile (Q8 - Q11)
	cgpa: string;
	marksheetStatus: 'combined_pdf' | 'separate_pdf' | 'na_first_year';
	marksheetName: string;
	marksheetDataUrl?: string;

	hasJournalPub: boolean;
	journalDetails: string;
	journalFileName: string;
	journalFileDataUrl?: string;

	hasPatents: boolean;
	patentDetails: string;
	patentFileName: string;
	patentFileDataUrl?: string;

	hasCompetitions: boolean;
	competitionDetails: string;
	competitionFileName: string;
	competitionFileDataUrl?: string;

	// Section 3: Co-Curricular & Leadership Profile (Q12 - Q14)
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

	// Section 4: Innovation & Problem-Solving (Q15 - Q17)
	problemMaritime: string;
	problemSociety: string;
	areasOfInterest: string[];
	customInterest: string;

	// Section 5: Supporting Documents & Declaration (Q18 - Q19)
	hasResume: boolean;
	resumeName: string;
	resumeDataUrl?: string;

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

	hasResume: false,
	resumeName: '',
	resumeDataUrl: '',

	declarationAccepted: false,
};

const DEPARTMENTS = [
	'B.Tech Marine Engineering (BME)',
	'MBA (International Transportation & Logistics Management)',
	'M.Tech Marine Technology (MMT)',
];

const ALL_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const PG_YEARS = ['1st Year', '2nd Year'];

export const YEAR_SEMESTER_MAP: Record<string, string[]> = {
	'1st Year': ['Semester 1', 'Semester 2'],
	'2nd Year': ['Semester 3', 'Semester 4'],
	'3rd Year': ['Semester 5', 'Semester 6'],
	'4th Year': ['Semester 7', 'Semester 8'],
};

export function getYearFromSemester(semester: string): string {
	for (const [year, semesters] of Object.entries(YEAR_SEMESTER_MAP)) {
		if (semesters.includes(semester)) {
			return year;
		}
	}
	return '1st Year';
}

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
	{ id: 1, title: 'Cadet Profile', shortTitle: 'Profile', icon: User, badge: 'Q1–Q7' },
	{
		id: 2,
		title: 'Academics',
		shortTitle: 'Academic',
		icon: GraduationCap,
		badge: 'Q8–Q11',
	},
	{ id: 3, title: 'Co-Curricular', shortTitle: 'Activities', icon: Award, badge: 'Q12–Q14' },
	{ id: 4, title: 'Innovation', shortTitle: 'Innovation', icon: Lightbulb, badge: 'Q15–Q17' },
	{ id: 5, title: 'Declaration', shortTitle: 'Declaration', icon: ShieldCheck, badge: 'Q18–Q19' },
];

export default function Home() {
	const [formData, setFormData] = useState<FormData>(INITIAL_STATE);
	const [errors, setErrors] = useState<{ [key: string]: string }>({});
	const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
	const [currentStep, setCurrentStep] = useState<number>(1);
	const [completedSteps, setCompletedSteps] = useState<number[]>([]);
	const [submitted, setSubmitted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [submittedRefId, setSubmittedRefId] = useState('');
	const [draftSaved, setDraftSaved] = useState(false);
	const [submissionError, setSubmissionError] = useState<string | null>(null);
	const [noticeExpanded, setNoticeExpanded] = useState(false);
	const stepButtonsRef = useRef<{ [key: number]: HTMLButtonElement | null }>({});
	const stepperContainerRef = useRef<HTMLDivElement | null>(null);
	const stepEnteredAtRef = useRef<number>(Date.now());

	useEffect(() => {
		stepEnteredAtRef.current = Date.now();
	}, [currentStep]);

	useEffect(() => {
		const container = stepperContainerRef.current;
		const btn = stepButtonsRef.current[currentStep];
		if (container && btn) {
			const containerWidth = container.offsetWidth;
			const btnLeft = btn.offsetLeft;
			const btnWidth = btn.offsetWidth;
			const targetLeft = btnLeft - containerWidth / 2 + btnWidth / 2;
			container.scrollTo({ left: targetLeft, behavior: 'smooth' });
		}
	}, [currentStep]);

	const isFirstYear = formData.yearOfStudy === '1st Year' || formData.semester === 'Semester 1';
	const isPostGraduate =
		formData.department.includes('MBA') || formData.department.includes('M.Tech');
	const availableYears = isPostGraduate ? PG_YEARS : ALL_YEARS;
	const availableSemesters = YEAR_SEMESTER_MAP[formData.yearOfStudy] || [
		'Semester 1',
		'Semester 2',
	];

	// Load draft from localStorage on mount
	useEffect(() => {
		try {
			const savedDraft = localStorage.getItem('iic_form_draft_v2');
			if (savedDraft) {
				const parsed = JSON.parse(savedDraft);
				const validSemesters = YEAR_SEMESTER_MAP[parsed.yearOfStudy] || [
					'Semester 1',
					'Semester 2',
				];
				const syncedSemester = validSemesters.includes(parsed.semester)
					? parsed.semester
					: validSemesters[0];

				const timer = setTimeout(() => {
					setFormData((prev) => ({
						...prev,
						...parsed,
						semester: syncedSemester,
						photoDataUrl: '',
						resumeDataUrl: '',
						marksheetDataUrl: '',
						journalFileDataUrl: '',
						patentFileDataUrl: '',
						competitionFileDataUrl: '',
						activityFileDataUrl: '',
						achievementFileDataUrl: '',
						leadershipFileDataUrl: '',
					}));
				}, 0);
				return () => clearTimeout(timer);
			}
		} catch (err) {
			console.warn('Could not load draft from localStorage:', err);
		}
	}, []);

	// Auto-save text draft to localStorage (excluding binary dataUrls)
	useEffect(() => {
		if (submitted) return;
		try {
			const safeData: Partial<FormData> = { ...formData };
			delete safeData.photoDataUrl;
			delete safeData.resumeDataUrl;
			delete safeData.marksheetDataUrl;
			delete safeData.journalFileDataUrl;
			delete safeData.patentFileDataUrl;
			delete safeData.competitionFileDataUrl;
			delete safeData.activityFileDataUrl;
			delete safeData.achievementFileDataUrl;
			delete safeData.leadershipFileDataUrl;
			localStorage.setItem('iic_form_draft_v2', JSON.stringify(safeData));
			const timer = setTimeout(() => {
				setDraftSaved(true);
				const hideTimer = setTimeout(() => setDraftSaved(false), 2000);
				return () => clearTimeout(hideTimer);
			}, 0);
			return () => clearTimeout(timer);
		} catch {
			// localStorage full or disabled
		}
	}, [formData, submitted]);

	// Field-Level Validation Helper
	const validateField = (name: string, value: unknown): string => {
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
						? 'Reg No / Serial number is required for 1st Year Cadets.'
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
					if (!trimmed) return 'Current CGPA is required for 2nd–4th/PG cadets.';
				}
				return '';
			}
			case 'photo': {
				if (!formData.photoName) return 'Passport size photo is required. Please select an image.';
				return '';
			}
			case 'resume': {
				if (formData.hasResume && !formData.resumeName)
					return 'Please upload your Resume / CV (PDF), or select NIL.';
				return '';
			}
			case 'problemMaritime': {
				const trimmed = typeof value === 'string' ? value.trim() : '';
				if (!trimmed)
					return 'Please describe a problem in the IMU ecosystem you would like to solve.';
				return '';
			}
			case 'problemSociety': {
				const trimmed = typeof value === 'string' ? value.trim() : '';
				if (!trimmed) return 'Please describe a problem in society you would like to solve.';
				return '';
			}
			case 'areasOfInterest': {
				const count = Array.isArray(value) ? value.length : formData.areasOfInterest.length;
				if (count === 0)
					return 'Please select or add at least 1 area of innovation/technology interest.';
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

		if (name === 'department') {
			const isPG = value.includes('MBA') || value.includes('M.Tech');
			setFormData((prev) => {
				let updatedYear = prev.yearOfStudy;
				if (isPG && (updatedYear === '3rd Year' || updatedYear === '4th Year')) {
					updatedYear = '2nd Year';
				}
				const validSemesters = YEAR_SEMESTER_MAP[updatedYear] || ['Semester 1', 'Semester 2'];
				const updatedSem = validSemesters.includes(prev.semester)
					? prev.semester
					: validSemesters[0];
				const willBeFirstYear = updatedYear === '1st Year' || updatedSem === 'Semester 1';

				return {
					...prev,
					department: value,
					yearOfStudy: updatedYear,
					semester: updatedSem,
					...(willBeFirstYear ? { marksheetName: '', marksheetDataUrl: '', cgpa: '' } : {}),
				};
			});
			return;
		}

		if (name === 'yearOfStudy') {
			setFormData((prev) => {
				const validSemesters = YEAR_SEMESTER_MAP[value] || ['Semester 1', 'Semester 2'];
				const updatedSem = validSemesters.includes(prev.semester)
					? prev.semester
					: validSemesters[0];
				const willBeFirstYear = value === '1st Year' || updatedSem === 'Semester 1';

				return {
					...prev,
					yearOfStudy: value,
					semester: updatedSem,
					...(willBeFirstYear ? { marksheetName: '', marksheetDataUrl: '', cgpa: '' } : {}),
				};
			});
			if (value === '1st Year') {
				setErrors((prev) => ({ ...prev, marksheetFile: '', cgpa: '' }));
			}
			return;
		}

		if (name === 'semester') {
			setFormData((prev) => {
				const mappedYear = getYearFromSemester(value);
				const willBeFirstYear = mappedYear === '1st Year' || value === 'Semester 1';

				return {
					...prev,
					yearOfStudy: mappedYear,
					semester: value,
					...(willBeFirstYear ? { marksheetName: '', marksheetDataUrl: '', cgpa: '' } : {}),
				};
			});
			if (value === 'Semester 1' || getYearFromSemester(value) === '1st Year') {
				setErrors((prev) => ({ ...prev, marksheetFile: '', cgpa: '' }));
			}
			return;
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
		if (touched[name] || (value && value.trim().length > 0)) {
			setTouched((prev) => ({ ...prev, [name]: true }));
			const error = validateField(name, value);
			setErrors((prev) => ({ ...prev, [name]: error }));
		}
	};

	// Passport photo change with automatic image resizing (max 5MB)
	const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (!file.type.startsWith('image/')) {
				setErrors((prev) => ({
					...prev,
					photo: 'Please select a valid image file (PNG, JPG, JPEG).',
				}));
				return;
			}
			if (file.size > 5 * 1024 * 1024) {
				setErrors((prev) => ({ ...prev, photo: 'Image size must be under 5MB.' }));
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

	// Generic PDF upload handler (max 15MB)
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
			if (file.size > 15 * 1024 * 1024) {
				if (errorKey) {
					setErrors((prev) => ({ ...prev, [errorKey]: 'PDF file size must be under 15MB.' }));
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
			if (updated.length > 0) {
				setErrors((e) => ({ ...e, areasOfInterest: '' }));
			}
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
				setErrors((e) => ({ ...e, areasOfInterest: '' }));
			}
		}
	};

	// Pure state-based validator for SSR, Stepper status and conditional rendering
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
			if (!isFirstYear) {
				const cgpaErr = validateField('cgpa', formData.cgpa);
				if (cgpaErr) return false;
			}
			if (
				formData.hasJournalPub &&
				(!formData.journalDetails.trim() || !formData.journalFileDataUrl)
			)
				return false;
			if (formData.hasPatents && (!formData.patentDetails.trim() || !formData.patentFileDataUrl))
				return false;
			if (
				formData.hasCompetitions &&
				(!formData.competitionDetails.trim() || !formData.competitionFileDataUrl)
			)
				return false;
			return true;
		}
		if (stepNumber === 3) {
			if (
				formData.hasActivities &&
				(!formData.activityDetails.trim() || !formData.activityFileDataUrl)
			)
				return false;
			if (
				formData.hasAchievements &&
				(!formData.achievementDetails.trim() || !formData.achievementFileDataUrl)
			)
				return false;
			if (formData.hasLeadership && !formData.leadershipDetails.trim()) return false;
			return true;
		}
		if (stepNumber === 4) {
			const maritimeErr = validateField('problemMaritime', formData.problemMaritime);
			const societyErr = validateField('problemSociety', formData.problemSociety);
			const areasErr = formData.areasOfInterest.length === 0;
			return !maritimeErr && !societyErr && !areasErr;
		}
		if (stepNumber === 5) {
			if (formData.hasResume && !formData.resumeName) return false;
			const decErr = validateField('declarationAccepted', formData.declarationAccepted);
			return !decErr;
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
			if (!isFirstYear) {
				const cgpaErr = validateField('cgpa', formData.cgpa);
				if (cgpaErr) newErrors.cgpa = cgpaErr;
			}

			if (formData.hasJournalPub) {
				if (!formData.journalDetails.trim()) {
					newErrors.journalDetails = 'Please enter publication title and details.';
				}
				if (!formData.journalFileDataUrl) {
					newErrors.journalFile = 'Please upload the publication PDF.';
				}
			}
			if (formData.hasPatents) {
				if (!formData.patentDetails.trim()) {
					newErrors.patentDetails = 'Please enter patent / IPR title and details.';
				}
				if (!formData.patentFileDataUrl) {
					newErrors.patentFile = 'Please upload the certificate / filing PDF.';
				}
			}
			if (formData.hasCompetitions) {
				if (!formData.competitionDetails.trim()) {
					newErrors.competitionDetails = 'Please enter event, year and achievement details.';
				}
				if (!formData.competitionFileDataUrl) {
					newErrors.competitionFile = 'Please upload the competition certificate PDF.';
				}
			}
		}

		if (stepNumber === 3) {
			if (formData.hasActivities) {
				if (!formData.activityDetails.trim()) {
					newErrors.activityDetails = 'Please enter technical activity details.';
				}
				if (!formData.activityFileDataUrl) {
					newErrors.activityFile = 'Please upload the activity certificate PDF.';
				}
			}
			if (formData.hasAchievements) {
				if (!formData.achievementDetails.trim()) {
					newErrors.achievementDetails = 'Please enter achievement / award details.';
				}
				if (!formData.achievementFileDataUrl) {
					newErrors.achievementFile = 'Please upload the award proof PDF.';
				}
			}
			if (formData.hasLeadership && !formData.leadershipDetails.trim()) {
				newErrors.leadershipDetails = 'Please provide details of the leadership position held.';
			}
		}

		if (stepNumber === 4) {
			const maritimeErr = validateField('problemMaritime', formData.problemMaritime);
			if (maritimeErr) newErrors.problemMaritime = maritimeErr;

			const societyErr = validateField('problemSociety', formData.problemSociety);
			if (societyErr) newErrors.problemSociety = societyErr;

			if (formData.areasOfInterest.length === 0) {
				newErrors.areasOfInterest =
					'Please select or add at least 1 area of innovation / technology interest.';
			}
		}

		if (stepNumber === 5) {
			if (formData.hasResume && !formData.resumeName) {
				newErrors.resume = 'Please upload your Resume / CV (PDF), or select NIL.';
			}

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
		if (isStepComplete(currentStep)) {
			setCompletedSteps((prev) => (prev.includes(currentStep) ? prev : [...prev, currentStep]));
		}
		setCurrentStep(targetStep);
		if (typeof window !== 'undefined') {
			const formContainer = document.getElementById('enrollment-form-container');
			if (formContainer) {
				const rect = formContainer.getBoundingClientRect();
				if (rect.top < 0) {
					formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			}
		}
	};

	const nextStep = (e?: React.MouseEvent) => {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		if (isStepComplete(currentStep)) {
			setCompletedSteps((prev) => (prev.includes(currentStep) ? prev : [...prev, currentStep]));
		}
		if (currentStep < 5) {
			setCurrentStep((prev) => prev + 1);
			if (typeof window !== 'undefined') {
				const formContainer = document.getElementById('enrollment-form-container');
				if (formContainer) {
					formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			}
		}
	};

	const prevStep = (e?: React.MouseEvent) => {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		if (currentStep > 1) {
			setCurrentStep((prev) => prev - 1);
			if (typeof window !== 'undefined') {
				const formContainer = document.getElementById('enrollment-form-container');
				if (formContainer) {
					formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			}
		}
	};

	const validateAll = () => {
		let allValid = true;
		for (let s = 1; s <= 5; s++) {
			if (!validateStep(s)) {
				allValid = false;
			}
		}
		return allValid;
	};

	const handleSubmit = async (e?: FormEvent | React.MouseEvent) => {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		// Strict guard: Submission and validation ONLY exist on Step 5
		if (currentStep < 5) {
			return;
		}

		// Prevent mobile touch ghost clicks / rapid double taps when transitioning from step 4
		if (Date.now() - stepEnteredAtRef.current < 450) {
			return;
		}

		if (!validateAll()) {
			// Automatically navigate to the first incomplete/invalid step
			for (let s = 1; s <= 5; s++) {
				if (!isStepComplete(s)) {
					setCurrentStep(s);
					break;
				}
			}
			setTimeout(() => {
				const firstError = document.querySelector(
					'.input-error, [id^="cadetName"], [id^="regNumber"], [id^="email"], [id^="phone"], [id^="photo"], [id^="cgpa"], [id^="problemMaritime"], [id^="problemSociety"], [id^="areasOfInterest"], [id^="resume"], [id^="declarationAccepted"]',
				);
				if (firstError) {
					firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			}, 80);
			return;
		}

		setSubmitting(true);
		setSubmissionError(null);

		try {
			const generatedRefId = `IIC-2627-${Math.floor(1000 + Math.random() * 9000)}`;
			setSubmittedRefId(generatedRefId);

			// Compute dynamic PDF status indicators ("attached" or "NIL")
			const marksheet_pdf = isFirstYear
				? 'NIL (Exempted for 1st Year)'
				: formData.marksheetDataUrl
					? 'attached'
					: 'NIL';
			const journal_pdf =
				formData.hasJournalPub && (formData.journalFileDataUrl || formData.journalFileName)
					? 'attached'
					: 'NIL';
			const patent_pdf =
				formData.hasPatents && (formData.patentFileDataUrl || formData.patentFileName)
					? 'attached'
					: 'NIL';
			const competition_pdf =
				formData.hasCompetitions &&
				(formData.competitionFileDataUrl || formData.competitionFileName)
					? 'attached'
					: 'NIL';
			const activity_pdf =
				formData.hasActivities && (formData.activityFileDataUrl || formData.activityFileName)
					? 'attached'
					: 'NIL';
			const achievement_pdf =
				formData.hasAchievements &&
				(formData.achievementFileDataUrl || formData.achievementFileName)
					? 'attached'
					: 'NIL';
			const leadership_pdf =
				formData.hasLeadership && (formData.leadershipFileDataUrl || formData.leadershipFileName)
					? 'attached'
					: 'NIL';
			const resume_pdf =
				formData.hasResume && (formData.resumeDataUrl || formData.resumeName) ? 'attached' : 'NIL';

			// Format detail fields (or "NIL")
			const journalDetailsFormatted =
				formData.hasJournalPub && formData.journalDetails.trim()
					? formData.journalDetails.trim()
					: 'NIL';
			const patentDetailsFormatted =
				formData.hasPatents && formData.patentDetails.trim()
					? formData.patentDetails.trim()
					: 'NIL';
			const competitionDetailsFormatted =
				formData.hasCompetitions && formData.competitionDetails.trim()
					? formData.competitionDetails.trim()
					: 'NIL';
			const activityDetailsFormatted =
				formData.hasActivities && formData.activityDetails.trim()
					? formData.activityDetails.trim()
					: 'NIL';
			const achievementDetailsFormatted =
				formData.hasAchievements && formData.achievementDetails.trim()
					? formData.achievementDetails.trim()
					: 'NIL';
			const leadershipDetailsFormatted =
				formData.hasLeadership && formData.leadershipDetails.trim()
					? formData.leadershipDetails.trim()
					: 'NIL';
			const interestsFormatted =
				formData.areasOfInterest.length > 0 ? formData.areasOfInterest.join(', ') : 'NIL';
			const declarationFormatted = formData.declarationAccepted
				? 'Accepted and Signed Digitally'
				: 'Not Accepted';
			const displayDate = new Date().toLocaleDateString('en-GB');

			// Collect all uploaded proof files for single attachment PDF compilation
			const attachedProofs: { name: string; type: string; dataUrl: string }[] = [];
			if (!isFirstYear && formData.marksheetDataUrl) {
				attachedProofs.push({
					name: formData.marksheetName || 'Semester_Marksheet.pdf',
					type: 'marksheet',
					dataUrl: formData.marksheetDataUrl,
				});
			}
			if (formData.hasJournalPub && formData.journalFileDataUrl) {
				attachedProofs.push({
					name: formData.journalFileName || 'Journal_Publication.pdf',
					type: 'journal',
					dataUrl: formData.journalFileDataUrl,
				});
			}
			if (formData.hasPatents && formData.patentFileDataUrl) {
				attachedProofs.push({
					name: formData.patentFileName || 'Patent_IPR_Document.pdf',
					type: 'patent',
					dataUrl: formData.patentFileDataUrl,
				});
			}
			if (formData.hasCompetitions && formData.competitionFileDataUrl) {
				attachedProofs.push({
					name: formData.competitionFileName || 'Competition_Certificate.pdf',
					type: 'competition',
					dataUrl: formData.competitionFileDataUrl,
				});
			}
			if (formData.hasActivities && formData.activityFileDataUrl) {
				attachedProofs.push({
					name: formData.activityFileName || 'Activity_Certificate.pdf',
					type: 'activity',
					dataUrl: formData.activityFileDataUrl,
				});
			}
			if (formData.hasAchievements && formData.achievementFileDataUrl) {
				attachedProofs.push({
					name: formData.achievementFileName || 'Achievement_Certificate.pdf',
					type: 'achievement',
					dataUrl: formData.achievementFileDataUrl,
				});
			}
			if (formData.hasLeadership && formData.leadershipFileDataUrl) {
				attachedProofs.push({
					name: formData.leadershipFileName || 'Leadership_Proof.pdf',
					type: 'leadership',
					dataUrl: formData.leadershipFileDataUrl,
				});
			}
			if (formData.hasResume && formData.resumeDataUrl) {
				attachedProofs.push({
					name: formData.resumeName || 'Cadet_Resume.pdf',
					type: 'resume',
					dataUrl: formData.resumeDataUrl,
				});
			}

			// Faculty forwarding email list
			const rawFacultyEmails =
				process.env.NEXT_PUBLIC_FACULTY_EMAILS ||
				process.env.NEXT_PUBLIC_FORWARD_EMAILS ||
				'sreerambhavanspkd@gmail.com';
			const forwardEmails = rawFacultyEmails
				.split(',')
				.map((e) => e.trim())
				.filter((e) => e.includes('@'));

			const payload = {
				...formData,
				referenceId: generatedRefId,
				submittedAt: new Date().toISOString(),
				templateDocId: '1hljBhK-tPtYN31i8P4n9QCuCHsdm_PaFrrBmEP9QCDw',
				forwardEmails,

				// Computed PDF status variables for template
				marksheet_pdf,
				journal_pdf,
				patent_pdf,
				competition_pdf,
				activity_pdf,
				achievement_pdf,
				leadership_pdf,
				resume_pdf,

				// Standardized details & replacements
				journalDetails: journalDetailsFormatted,
				patentDetails: patentDetailsFormatted,
				competitionDetails: competitionDetailsFormatted,
				activityDetails: activityDetailsFormatted,
				achievementDetails: achievementDetailsFormatted,
				leadershipDetails: leadershipDetailsFormatted,
				interests: interestsFormatted,
				declaration: declarationFormatted,
				date: displayDate,

				// Attached individual document proofs
				attachedProofs,
				attachedProofsCount: attachedProofs.length,
			};

			const rawDirectUrl =
				process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL ||
				'https://script.google.com/macros/s/AKfycbz7fhNq7uINoqJUu9VCia_D29DHLR7c1JTAHHNHW6LpTows7CQv5E2vlhazsnI37fdX/exec';
			const directGoogleUrl = rawDirectUrl
				.trim()
				.replace(/^['"]|['"]$/g, '')
				.replace(/^h+ttps:\/\//i, 'https://');

			let submissionSuccessful = false;

			try {
				const res = await fetch('/api/submit', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				});
				if (res.ok) {
					submissionSuccessful = true;
				} else {
					throw new Error('Serverless route returned status ' + res.status);
				}
			} catch (apiError) {
				console.warn(
					'API route not reachable, submitting directly to Google Apps Script:',
					apiError,
				);
				try {
					await fetch(directGoogleUrl, {
						method: 'POST',
						mode: 'no-cors',
						headers: { 'Content-Type': 'text/plain' },
						body: JSON.stringify(payload),
					});
					submissionSuccessful = true;
				} catch (directErr) {
					console.error('Direct submission to Google Apps Script failed:', directErr);
				}
			}

			if (submissionSuccessful) {
				// Clear draft on confirmed successful submission
				try {
					localStorage.removeItem('iic_form_draft_v2');
				} catch {
					// Ignore storage error
				}

				// Fire celebratory confetti!
				try {
					confetti({
						particleCount: 130,
						spread: 85,
						origin: { y: 0.6 },
						colors: ['#3B82F6', '#FBBF24', '#22C55E', '#A855F7', '#60A5FA'],
					});
				} catch {
					// Ignore confetti error
				}

				setSubmitted(true);
				window.scrollTo({ top: 0, behavior: 'smooth' });
			} else {
				setSubmissionError(
					'We could not submit your application due to a network connection issue. Please verify your internet and click Submit again.',
				);
			}
		} catch (err) {
			console.error('Submission request failed:', err);
			setSubmissionError(
				'An unexpected error occurred while processing your application. Please try submitting again.',
			);
		} finally {
			setSubmitting(false);
		}
	};

	const handleReset = () => {
		setFormData(INITIAL_STATE);
		setErrors({});
		setTouched({});
		setCompletedSteps([]);
		setCurrentStep(1);
		setSubmitted(false);
		setSubmissionError(null);
		try {
			localStorage.removeItem('iic_form_draft_v2');
		} catch {
			// Ignore storage error
		}
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	// Calculate overall completion progress based on validated steps via Next button
	const completedCount = completedSteps.length;
	const progressPercent = Math.round((completedCount / 5) * 100);

	return (
		<main className='relative w-full min-h-screen py-6 sm:py-12 px-3 sm:px-6 lg:px-8 flex flex-col items-center justify-start skylearn-pattern bg-white'>
			{/* Ambient Radial Lighting Overlay */}
			<div className='pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(59,130,246,0.1),rgba(255,255,255,0))]' />

			{/* Form Shell / Center Card (Max-w-5xl, 28px Radius) */}
			<div className='relative z-10 w-full max-w-5xl mb-12 mt-1 sm:mt-2'>
				<div className='clean-card overflow-hidden'>
					{/* Skylearn Brand Accent Bar: Sky, Sun & Leaf */}
					<div className='h-2 w-full bg-gradient-to-r from-[#3B82F6] via-[#FBBF24] to-[#22C55E]' />

					{/* Official Banner Header with Frame */}
					<div className='w-full banner-frame-container p-2 sm:p-5 flex justify-center'>
						<div className='w-full max-w-[1024px] relative rounded-2xl overflow-hidden banner-frame-inner bg-white'>
							<Image
								src='/iic-banner-v5.png'
								alt='IMU Kolkata Campus - Institution Innovation Council (IIC) 2026-27'
								width={2800}
								height={600}
								priority
								fetchPriority='high'
								className='w-full h-auto object-contain mx-auto transition-all scale-[1.03] sm:scale-100 py-1 sm:py-0'
								sizes='(max-width: 1024px) 100vw, 1024px'
							/>
						</div>
					</div>

					{/* Title & Official Notice Strip */}
					<div className='px-4 sm:px-10 py-5 sm:py-8 header-strip'>
						<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
							<div>
								<div className='flex items-center gap-2 mb-2 flex-wrap'>
									<span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold academic-badge shadow-xs'>
										Academic Year 2026–27
									</span>
									<span className='inline-flex items-center gap-1 text-xs sm:text-sm font-bold campus-badge uppercase tracking-wider'>
										<Building2 className='w-4 h-4 opacity-75 text-[#3B82F6]' />
										IMU - Kolkata Campus
									</span>
								</div>
								<h1 className='text-base sm:text-2xl lg:text-[28px] font-extrabold uppercase tracking-tight leading-tight main-title font-heading'>
									Institution’s Innovation Council (IIC) – Cadet Enrollment Form
								</h1>
							</div>
							{draftSaved && (
								<div className='inline-flex items-center gap-2 text-xs sm:text-sm draft-badge px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap flex-shrink-0 self-start sm:self-auto shadow-xs animate-fadeIn'>
									<Check className='w-4 h-4 text-[#16A34A] flex-shrink-0' />
									<span className='whitespace-nowrap'>Auto-Saved</span>
								</div>
							)}
						</div>

						{/* Instructions to Cadets Banner (Visible only before submission) */}
						{!submitted && (
							<div className='mt-5 p-4 sm:p-6 rounded-2xl notice-card'>
								<div className='flex items-center justify-between gap-3 pb-3 sm:pb-3.5 sm:mb-3 sm:border-b sm:border-[#DBEAFE]'>
									<div className='flex items-center gap-2.5 min-w-0'>
										<div className='w-7 h-7 sm:w-8 sm:h-8 rounded-xl notice-header-badge flex items-center justify-center flex-shrink-0 shadow-xs'>
											<Info className='w-4 h-4' />
										</div>
										<h2 className='font-bold uppercase tracking-wider text-sm sm:text-base notice-title truncate'>
											Instructions
										</h2>
									</div>
									<button
										type='button'
										onClick={() => setNoticeExpanded(!noticeExpanded)}
										className='sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DBEAFE] text-[#1D4ED8] text-xs font-bold hover:bg-[#BFDBFE] transition-all cursor-pointer'>
										{noticeExpanded ? (
											<>
												<span>Hide</span>
												<ChevronUp className='w-3.5 h-3.5' />
											</>
										) : (
											<>
												<span>View</span>
												<ChevronDown className='w-3.5 h-3.5' />
											</>
										)}
									</button>
								</div>
								<ol
									className={`space-y-3 text-sm sm:text-base leading-relaxed pt-2 sm:pt-0 border-t border-[#DBEAFE] sm:border-t-0 ${noticeExpanded ? 'block' : 'hidden sm:block'}`}>
									<li className='flex items-start gap-3'>
										<span className='flex-shrink-0 w-6 h-6 rounded-full notice-step-num text-xs font-extrabold flex items-center justify-center mt-0.5'>
											1
										</span>
										<span className='flex-1 font-medium notice-step-text'>
											Fields marked with an asterisk (
											<span className='text-[#F87171] font-bold'>*</span>) are mandatory and must be
											completed.
										</span>
									</li>
									<li className='flex items-start gap-3'>
										<span className='flex-shrink-0 w-6 h-6 rounded-full notice-step-num text-xs font-extrabold flex items-center justify-center mt-0.5'>
											2
										</span>
										<span className='flex-1 font-medium notice-step-text'>
											Cadets are advised to ensure that all information provided is accurate,
											complete, and supported by valid documents before submission.
										</span>
									</li>
								</ol>
							</div>
						)}
					</div>

					{/* SUCCESS CONFIRMATION VIEW */}
					{submitted ? (
						<div className='p-8 sm:p-14 text-center bg-white space-y-6 animate-fadeIn max-w-2xl mx-auto'>
							<div className='w-20 h-20 rounded-full bg-[#22C55E] text-white flex items-center justify-center mx-auto text-4xl shadow-lg shadow-[#22C55E]/30'>
								<Check className='w-10 h-10 stroke-[2.5]' />
							</div>
							<div className='space-y-3'>
								<span className='inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#166534] uppercase tracking-widest bg-[#DCFCE7] px-4 py-1.5 rounded-full border border-[#86EFAC] shadow-xs'>
									<CheckCircle2 className='w-4 h-4 text-[#16A34A]' /> Application Submitted
								</span>
								<h2 className='text-2xl sm:text-3xl font-extrabold text-[#0F172A] uppercase tracking-tight leading-snug sm:leading-tight font-heading'>
									Enrollment Form Submitted Successfully!
								</h2>
								<p className='text-base text-[#475569] max-w-lg mx-auto leading-relaxed'>
									Thank you, <span className='font-bold text-[#0F172A]'>{formData.cadetName}</span>.
									Your enrollment application for the{' '}
									<strong>Institution’s Innovation Council (IIC 2026–27)</strong> has been recorded.
								</p>

								{/* Official WhatsApp Group Join Card */}
								<div className='p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#F0FDF4] to-[#DCFCE7]/40 border-2 border-[#86EFAC] max-w-md mx-auto text-center space-y-3.5 shadow-sm animate-fadeIn'>
									<div className='w-12 h-12 mx-auto rounded-2xl bg-[#25D366] flex items-center justify-center text-white shadow-md shadow-[#25D366]/20'>
										<svg
											className='w-7 h-7 fill-current'
											viewBox='0 0 24 24'
											xmlns='http://www.w3.org/2000/svg'>
											<path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' />
										</svg>
									</div>
									<div className='space-y-1'>
										<h3 className='font-extrabold text-[#0F172A] text-base sm:text-lg uppercase tracking-tight'>
											Join Official Cadet WhatsApp Group
										</h3>
										<p className='text-xs sm:text-sm text-[#475569] leading-relaxed'>
											Connect directly with the council team and stay updated on interview
											schedules, orientation sessions, and announcements.
										</p>
									</div>
									<a
										href={
											process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL ||
											'https://chat.whatsapp.com/YOUR_GROUP_INVITE_LINK_HERE'
										}
										target='_blank'
										rel='noopener noreferrer'
										className='inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base text-white bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] transition-all shadow-md shadow-[#25D366]/25 border-b-4 border-[#16A34A] active:border-b-0'>
										<span>Join IIC WhatsApp Group</span>
										<ChevronRight className='w-4 h-4' />
									</a>
								</div>

								{/* Action Buttons */}
								<div className='pt-2 flex items-center justify-center'>
									<button
										type='button'
										onClick={handleReset}
										className='btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm'>
										<RotateCcw className='w-4 h-4' /> Submit Another Form
									</button>
								</div>
							</div>
						</div>
					) : (
						/* MAIN ENROLLMENT FORM */
						<form
							id='enrollment-form-container'
							onSubmit={(e) => {
								e.preventDefault();
								if (currentStep === 5) {
									handleSubmit(e);
								}
							}}
							noValidate
							className='bg-white'>
							{/* 5-STEP RESPONSIVE ACCESSIBLE STEPPER (56px Minimum Tap Target Friendly) */}
							<nav
								aria-label='Cadet Enrollment Steps'
								className='border-b border-[#E2E8F0] bg-[#F8FAFC] px-3 sm:px-8 py-3 sm:py-4'>
								<div className='w-full max-w-5xl mx-auto'>
									{/* Horizontal Touch-Scrollable Chips on Mobile, 5-Col Grid on Desktop */}
									<div
										ref={stepperContainerRef}
										role='tablist'
										aria-label='Enrollment Form Sections'
										className='flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 px-0.5 sm:grid sm:grid-cols-5 sm:gap-3 w-full'>
										{SECTIONS.map((sec) => {
											const isCurrent = currentStep === sec.id;
											const isCompleted = completedSteps.includes(sec.id) && !isCurrent;
											const StepIcon = sec.icon;

											return (
												<button
													key={sec.id}
													type='button'
													role='tab'
													ref={(el) => {
														stepButtonsRef.current[sec.id] = el;
													}}
													onClick={() => handleStepClick(sec.id)}
													aria-selected={isCurrent}
													aria-label={`Step ${sec.id}: ${sec.title} (${isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Pending'})`}
													title={`Go to Step ${sec.id}: ${sec.title}`}
													className={`group relative flex-shrink-0 sm:flex-shrink min-h-[56px] h-14 px-3 sm:px-2 rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer touch-manipulation select-none active:scale-95 focus-visible:ring-3 focus-visible:ring-[#3B82F6] focus-visible:outline-none ${
														isCurrent
															? 'bg-[#3B82F6] text-white shadow-md ring-2 ring-[#60A5FA] font-black'
															: isCompleted
																? 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] hover:bg-[#BBF7D0] shadow-xs'
																: 'bg-white text-[#475569] border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#94A3B8] shadow-xs'
													}`}>
													{/* Step Number or Check Badge */}
													<div
														className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 pointer-events-none transition-transform ${
															isCurrent
																? 'bg-[#FBBF24] text-[#0F172A] shadow-xs'
																: isCompleted
																	? 'bg-[#22C55E] text-white'
																	: 'bg-[#E2E8F0] text-[#475569] group-hover:bg-[#CBD5E1]'
														}`}>
														{isCompleted ? <Check className='w-3.5 h-3.5 stroke-[2.5]' /> : sec.id}
													</div>

													{/* Section Icon (Tablet & Desktop) */}
													<StepIcon
														className={`w-4 h-4 hidden md:block flex-shrink-0 pointer-events-none ${
															isCurrent
																? 'text-[#DBEAFE]'
																: isCompleted
																	? 'text-[#16A34A]'
																	: 'text-[#94A3B8]'
														}`}
													/>

													{/* Section Title */}
													<span className='whitespace-nowrap tracking-tight font-bold pointer-events-none'>
														<span className='sm:hidden'>{sec.shortTitle}</span>
														<span className='hidden sm:inline lg:hidden'>{sec.shortTitle}</span>
														<span className='hidden lg:inline'>{sec.title}</span>
													</span>
												</button>
											);
										})}
									</div>

									{/* Skylearn 8px Animated Progress Bar */}
									<div
										className='w-full skylearn-progress-track mt-3 overflow-hidden'
										role='progressbar'
										aria-valuenow={progressPercent}
										aria-valuemin={0}
										aria-valuemax={100}
										aria-label='Application progress'>
										<div
											className='skylearn-progress-fill'
											style={{ width: `${progressPercent}%` }}
										/>
									</div>

									{/* Status Info Strip */}
									<div className='flex items-center justify-between text-xs sm:text-sm text-[#475569] font-semibold mt-2 px-1 pt-1.5 border-t border-[#E2E8F0]'>
										<span className='flex items-center gap-2 min-w-0'>
											<Compass className='w-4 h-4 text-[#3B82F6] flex-shrink-0' />
											<span className='truncate'>
												Step {currentStep} of 5:{' '}
												<strong className='text-[#0F172A]'>
													{SECTIONS[currentStep - 1]?.title}
												</strong>
											</span>
										</span>
										<div className='flex items-center gap-2 flex-shrink-0'>
											{currentStep > 1 && (
												<button
													type='button'
													onClick={() => handleStepClick(currentStep - 1)}
													className='sm:hidden px-2.5 py-1 rounded-lg bg-white text-[#0F172A] text-xs font-bold border border-[#CBD5E1] hover:bg-slate-50'>
													‹ Prev
												</button>
											)}
											{currentStep < 5 && (
												<button
													type='button'
													onClick={() => handleStepClick(currentStep + 1)}
													className='sm:hidden px-2.5 py-1 rounded-lg bg-[#DBEAFE] text-[#1D4ED8] text-xs font-bold border border-[#BFDBFE] hover:bg-[#BFDBFE]'>
													Next ›
												</button>
											)}
											<span className='font-bold text-[#3B82F6] ml-1'>{completedCount}/5 Done</span>
										</div>
									</div>
								</div>
							</nav>

							{/* FORM BODY CONTAINER */}
							<div className='p-5 sm:p-10 lg:p-12 space-y-8 sm:space-y-12'>
								{/* ======================================================== */}
								{/* SECTION 1: CADET PROFILE & DEMOGRAPHICS (Q1 - Q7 + PHOTO) */}
								{/* ======================================================== */}
								<section
									id='section-1'
									className={`space-y-8 sm:space-y-10 ${currentStep === 1 ? 'block animate-fadeIn' : 'hidden'}`}>
									<div className='border-b border-[#E2E8F0] pb-4 sm:pb-5'>
										<div className='flex items-start sm:items-center justify-between gap-4'>
											<div className='flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1'>
												<div className='w-12 h-12 rounded-2xl bg-[#3B82F6] text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0 mt-0.5 sm:mt-0'>
													<User className='w-6 h-6 text-white flex-shrink-0' />
												</div>
												<div className='min-w-0 flex-1'>
													<div className='sm:hidden mb-1.5'>
														<span className='section-badge text-xs py-1 px-3'>Section 1 of 5</span>
													</div>
													<h2 className='text-base sm:text-xl lg:text-2xl font-extrabold text-[#0F172A] uppercase tracking-wide leading-tight sm:leading-snug font-heading'>
														Cadet Profile & Academic Identity
													</h2>
													<p className='text-xs sm:text-sm text-[#475569] font-medium mt-0.5 sm:mt-1 leading-relaxed'>
														Questions 1 to 7 • Personal, enrollment, and official contact details
													</p>
												</div>
											</div>
											<span className='section-badge hidden sm:inline-flex flex-shrink-0'>
												Section 1 of 5
											</span>
										</div>
									</div>

									{/* Row 1: 1. Name of Cadet & 2. Department / Academic Program */}
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8'>
										<div id='cadetName' className='space-y-1.5 sm:space-y-2'>
											<label
												htmlFor='cadetNameInput'
												className='flex items-center gap-2 text-sm sm:text-base font-bold tracking-tight text-[#0F172A]'>
												<User className='w-4 h-4 text-[#3B82F6] flex-shrink-0' />
												<span>1. Name of the Cadet</span>
												<span className='text-[#F87171] font-bold'>*</span>
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
												<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-1 sm:mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
													<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.cadetName}
												</p>
											) : (
												<p className='text-xs sm:text-sm text-[#475569] mt-1 sm:mt-1.5 font-medium'>
													Enter full name as per official IMU records.
												</p>
											)}
										</div>
										<div id='department' className='space-y-1.5 sm:space-y-2'>
											<label
												htmlFor='department'
												className='flex items-center gap-2 text-sm sm:text-base font-bold tracking-tight text-[#0F172A]'>
												<Building2 className='w-4 h-4 text-[#3B82F6] flex-shrink-0' />
												<span>2. Department / Academic Program</span>
												<span className='text-[#F87171] font-bold'>*</span>
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
											<p className='text-xs sm:text-sm text-[#475569] mt-1 sm:mt-1.5 font-medium'>
												{isPostGraduate
													? '2-Year Postgraduate (PG) Program'
													: '4-Year Undergraduate (UG) Program'}
											</p>
										</div>
									</div>

									{/* Row 2: 3. Year of Study & 4. Current Semester */}
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8'>
										<div id='yearOfStudy' className='space-y-1.5 sm:space-y-2'>
											<label
												htmlFor='yearOfStudySelect'
												className='flex items-center gap-2 text-sm sm:text-base font-bold tracking-tight text-[#0F172A]'>
												<Calendar className='w-4 h-4 text-[#3B82F6] flex-shrink-0' />
												<span>3. Year of Study</span>
												<span className='text-[#F87171] font-bold'>*</span>
											</label>
											<select
												id='yearOfStudySelect'
												name='yearOfStudy'
												value={formData.yearOfStudy}
												onChange={handleChange}
												className='form-input cursor-pointer font-medium'>
												{availableYears.map((yr) => (
													<option key={yr} value={yr}>
														{yr}
													</option>
												))}
											</select>
											<p className='text-xs sm:text-sm text-[#475569] mt-1 sm:mt-1.5 font-medium'>
												Select your current academic batch.
											</p>
										</div>
										<div id='semester' className='space-y-1.5 sm:space-y-2'>
											<label
												htmlFor='semesterSelect'
												className='flex items-center gap-2 text-sm sm:text-base font-bold tracking-tight text-[#0F172A]'>
												<GraduationCap className='w-4 h-4 text-[#3B82F6] flex-shrink-0' />
												<span>4. Current Semester</span>
												<span className='text-[#F87171] font-bold'>*</span>
											</label>
											<select
												id='semesterSelect'
												name='semester'
												value={formData.semester}
												onChange={handleChange}
												className='form-input cursor-pointer font-medium'>
												{availableSemesters.map((sem) => (
													<option key={sem} value={sem}>
														{sem}
													</option>
												))}
											</select>
											<p className='text-xs sm:text-sm text-[#475569] mt-1 sm:mt-1.5 font-medium'>
												Select your current semester of study.
											</p>
										</div>
									</div>

									{/* Row 3: 5. Reg No / Roll No & Gender */}
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8 items-start'>
										<div id='regNumber' className='space-y-1.5 sm:space-y-2'>
											<label
												htmlFor='regNumberInput'
												className='flex items-center gap-2 text-sm sm:text-base font-bold tracking-tight text-[#0F172A]'>
												<Hash className='w-4 h-4 text-[#3B82F6] flex-shrink-0' />
												<span>
													5. {isFirstYear ? 'Reg No. / Roll No.' : 'University Reg No. / Roll No.'}
												</span>
												<span className='text-[#F87171] font-bold'>*</span>
											</label>
											<input
												type='text'
												id='regNumberInput'
												name='regNumber'
												value={formData.regNumber}
												onChange={handleChange}
												onBlur={handleBlur}
												placeholder={
													isFirstYear
														? 'Enter allotted Reg No. / Roll No.'
														: 'Enter permanent University Reg No. / Roll No.'
												}
												className={`form-input font-mono ${errors.regNumber && touched.regNumber ? 'input-error' : ''}`}
											/>
											{errors.regNumber && touched.regNumber ? (
												<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-1 sm:mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
													<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.regNumber}
												</p>
											) : (
												<p className='text-xs sm:text-sm text-[#475569] mt-1 sm:mt-1.5 font-medium'>
													{isFirstYear
														? 'First-year cadets enter your registration number / roll number.'
														: 'Enter your permanent university registration number / roll number.'}
												</p>
											)}
										</div>
										<div className='space-y-1.5 sm:space-y-2'>
											<label className='block text-sm sm:text-base font-bold tracking-tight text-[#0F172A]'>
												Gender <span className='text-[#F87171] font-bold'>*</span>
											</label>
											<div className='flex items-center gap-2 bg-[#F8FAFC] p-1.5 rounded-2xl border border-[#E2E8F0] min-h-[48px] sm:min-h-[56px]'>
												{['Male', 'Female'].map((g) => (
													<label
														key={g}
														className={`flex-1 text-center h-full min-h-[38px] sm:min-h-[44px] flex items-center justify-center rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer touch-manipulation transition-all ${
															formData.gender === g
																? 'bg-[#3B82F6] text-white shadow-xs'
																: 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
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

									{/* Row 4: 6. Email Address & 7. Mobile Number */}
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8'>
										<div id='email' className='space-y-1.5 sm:space-y-2'>
											<label
												htmlFor='emailInput'
												className='flex items-center gap-2 text-sm sm:text-base font-bold tracking-tight text-[#0F172A]'>
												<Mail className='w-4 h-4 text-[#3B82F6] flex-shrink-0' />
												<span>6. Email Address</span>
												<span className='text-[#F87171] font-bold'>*</span>
											</label>
											<input
												type='email'
												id='emailInput'
												name='email'
												value={formData.email}
												onChange={handleChange}
												onBlur={handleBlur}
												placeholder='Enter your email'
												className={`form-input ${errors.email && touched.email ? 'input-error' : ''}`}
												autoComplete='email'
											/>
											{errors.email && touched.email && (
												<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-1 sm:mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
													<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.email}
												</p>
											)}
										</div>

										<div id='phone' className='space-y-1.5 sm:space-y-2'>
											<label
												htmlFor='phoneInput'
												className='flex items-center gap-2 text-sm sm:text-base font-bold tracking-tight text-[#0F172A]'>
												<Phone className='w-4 h-4 text-[#3B82F6] flex-shrink-0' />
												<span>7. Mobile Number</span>
												<span className='text-[#F87171] font-bold'>*</span>
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
												<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-1 sm:mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
													<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.phone}
												</p>
											)}
										</div>
									</div>

									{/* Passport Size Photo Upload */}
									<div
										id='photo'
										className='p-4 sm:p-8 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] shadow-xs'>
										<label
											htmlFor='photoInput'
											className='block text-sm sm:text-base font-bold tracking-tight text-[#0F172A] mb-1'>
											Passport Size Photo <span className='text-[#F87171] font-bold'>*</span>
										</label>
										<p className='text-xs sm:text-sm text-[#475569] mb-4 font-medium'>
											Upload a clear passport size photograph.
										</p>

										<div className='flex items-center gap-4 sm:gap-5 flex-wrap sm:flex-nowrap'>
											{formData.photoDataUrl ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img
													src={formData.photoDataUrl}
													alt='Cadet Preview'
													className='w-20 h-20 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-[#3B82F6] ring-4 ring-white shadow-md flex-shrink-0'
												/>
											) : (
												<div className='w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-white border-2 border-dashed border-[#94A3B8] flex flex-col items-center justify-center text-[#94A3B8] text-xs font-bold flex-shrink-0 shadow-xs'>
													<User className='w-6 h-6 sm:w-8 sm:h-8 mb-1 text-[#94A3B8]' />
													PHOTO
												</div>
											)}
											<div className='flex-1 min-w-[180px]'>
												<label className='btn-secondary inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-[#0F172A] bg-white hover:bg-[#F8FAFC] cursor-pointer shadow-xs transition-all'>
													<Upload className='w-4 h-4 text-[#3B82F6]' />
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
												<p className='text-xs sm:text-sm text-[#475569] font-medium truncate mt-2'>
													{formData.photoName ? (
														<span className='font-bold text-[#166534] flex items-center gap-1.5'>
															<Check className='w-4 h-4 text-[#16A34A]' /> {formData.photoName}
														</span>
													) : (
														'Accepts JPG, JPEG, PNG. (Max 5MB)'
													)}
												</p>
											</div>
										</div>
										{errors.photo && touched.photo && (
											<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-2.5 flex items-center gap-1.5 animate-fadeIn'>
												<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.photo}
											</p>
										)}
									</div>
								</section>

								{/* ======================================================== */}
								{/* SECTION 2: ACADEMICS PROFILE (Q8 - Q12) */}
								{/* ======================================================== */}
								<section
									id='section-2'
									className={`space-y-8 sm:space-y-10 ${currentStep === 2 ? 'block animate-fadeIn' : 'hidden'}`}>
									<div className='border-b border-[#E2E8F0] pb-4 sm:pb-5'>
										<div className='flex items-start sm:items-center justify-between gap-4'>
											<div className='flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1'>
												<div className='w-12 h-12 rounded-2xl bg-[#3B82F6] text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0 mt-0.5 sm:mt-0'>
													<GraduationCap className='w-6 h-6 text-white flex-shrink-0' />
												</div>
												<div className='min-w-0 flex-1'>
													<div className='sm:hidden mb-1.5'>
														<span className='section-badge text-xs py-1 px-3'>Section 2 of 5</span>
													</div>
													<h2 className='text-base sm:text-xl lg:text-2xl font-extrabold text-[#0F172A] uppercase tracking-wide leading-tight sm:leading-snug font-heading'>
														Academics Profile
													</h2>
													<p className='text-xs sm:text-sm text-[#475569] font-medium mt-0.5 sm:mt-1 leading-relaxed'>
														Questions 8 to 11 • Cadets should only upload the first page of their
														work in PDF format
													</p>
												</div>
											</div>
											<span className='section-badge hidden sm:inline-flex flex-shrink-0'>
												Section 2 of 5
											</span>
										</div>
									</div>

									{/* Question 8: Current CGPA */}
									<div id='cgpa' className='section-container space-y-5'>
										<div className='flex items-center justify-between mb-1 flex-wrap gap-3'>
											<div>
												<label
													htmlFor='cgpaInput'
													className='text-sm sm:text-base font-bold tracking-tight text-[#0F172A] block'>
													8. Current CGPA{' '}
													{!isFirstYear && <span className='text-[#F87171] font-bold'>*</span>}
												</label>
											</div>
											<span
												className={`text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-full border ${isFirstYear ? ' bg-[#F1F5F9] text-[#94A3B8] border-[#E2E8F0]' : 'text-[#166534] bg-[#DCFCE7] border border-[#BBF7D0]'}`}>
												{isFirstYear ? 'Exempted for first semester cadets' : 'Mention your CGPA'}
											</span>
										</div>

										<div className='grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 items-start'>
											<div>
												<input
													type='text'
													id='cgpaInput'
													name='cgpa'
													disabled={isFirstYear}
													value={isFirstYear ? 'N/A' : formData.cgpa}
													onChange={handleChange}
													onBlur={handleBlur}
													placeholder={
														isFirstYear
															? 'Exempted for first semester cadets'
															: 'Enter your Current CGPA (e.g. 8.75)'
													}
													className={`form-input ${
														isFirstYear
															? 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed select-none border-[#E2E8F0] font-bold'
															: errors.cgpa && touched.cgpa
																? 'input-error'
																: ''
													}`}
												/>
												{errors.cgpa && touched.cgpa && !isFirstYear && (
													<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-2 flex items-center gap-1.5 animate-fadeIn'>
														<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.cgpa}
													</p>
												)}
											</div>
										</div>

										{/* Marksheet Proof Document (PDF) Upload */}
										<div className='pt-4 space-y-3 border-t border-[#E2E8F0]'>
											<div className='flex items-center justify-between flex-wrap gap-2'>
												<div>
													<label
														htmlFor={isFirstYear ? undefined : 'marksheetInput'}
														className='text-sm sm:text-base font-bold tracking-tight text-[#0F172A] block'>
														Semester Marksheet Proof
													</label>
													<span className='text-xs sm:text-sm text-[#475569] font-medium block mt-1'>
														Upload your latest semester marksheet or consolidated grade card in PDF
														format
													</span>
												</div>
											</div>

											{isFirstYear ? (
												<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#F8FAFC] border-dashed border-[#E2E8F0] opacity-80 cursor-not-allowed select-none'>
													<button
														type='button'
														disabled
														className='inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold text-[#94A3B8] bg-[#F1F5F9] border border-[#E2E8F0] cursor-not-allowed select-none shadow-none flex-shrink-0'>
														<Upload className='w-4 h-4 text-[#94A3B8]' />
														<span>Upload Marksheet PDF</span>
													</button>
													<div className='flex-1 min-w-0'>
														<span className='text-xs sm:text-sm text-[#64748B] font-medium flex items-center gap-2'>
															<Info className='w-4 h-4 text-[#0284c7] flex-shrink-0' />
															Upload your Semester Marksheet after the first semester exams are
															completed. (Max. 15MB)
														</span>
													</div>
												</div>
											) : (
												<div>
													<div
														className={`upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl ${
															formData.marksheetName ? 'has-file' : ''
														}`}>
														<label className='btn-secondary inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold text-[#0F172A] bg-white hover:bg-[#F8FAFC] cursor-pointer shadow-xs transition-all flex-shrink-0'>
															<Upload className='w-4 h-4 text-[#3B82F6]' />
															<span>
																{formData.marksheetName
																	? 'Change Marksheet PDF'
																	: 'Upload Marksheet PDF'}
															</span>
															<input
																type='file'
																id='marksheetInput'
																name='marksheet'
																accept='.pdf,application/pdf'
																onChange={(e) =>
																	handlePdfChange(
																		e,
																		'marksheetName',
																		'marksheetDataUrl',
																		'marksheetFile',
																	)
																}
																className='sr-only'
															/>
														</label>

														<div className='flex-1 min-w-0'>
															{formData.marksheetName ? (
																<div className='flex items-center justify-between gap-3 bg-[#DCFCE7] px-4 py-3 rounded-2xl border border-[#86EFAC]'>
																	<span className='text-sm font-bold text-[#166534] truncate flex items-center gap-2'>
																		<FileCheck className='w-4 h-4 text-[#16A34A] flex-shrink-0' />
																		{formData.marksheetName}
																	</span>
																	<button
																		type='button'
																		onClick={() =>
																			setFormData((prev) => ({
																				...prev,
																				marksheetName: '',
																				marksheetDataUrl: '',
																			}))
																		}
																		className='text-xs sm:text-sm font-bold text-[#F87171] hover:text-red-700 px-3 py-1.5 rounded-xl bg-white border border-[#FCA5A5] flex-shrink-0 hover:bg-[#FEE2E2] transition-colors'
																		title='Remove Marksheet PDF'>
																		Remove
																	</button>
																</div>
															) : (
																<span className='text-sm text-[#475569] font-medium'>
																	Upload latest semester grade card / marksheet (.pdf up to 15MB)
																</span>
															)}
														</div>
													</div>

													{errors.marksheetFile && (
														<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
															<AlertCircle className='w-4 h-4 flex-shrink-0' />{' '}
															{errors.marksheetFile}
														</p>
													)}
												</div>
											)}
										</div>
									</div>

									{/* Question 9: Journal / Book Chapter Publications */}
									<div className='section-container space-y-5'>
										<div className='flex items-center justify-between flex-wrap gap-3'>
											<div>
												<div className='flex items-center gap-2 flex-wrap'>
													<label className='text-sm sm:text-base font-bold tracking-tight text-[#0F172A]'>
														9. Journal / Book Chapter Publications, if any
													</label>
												</div>
												<span className='text-xs sm:text-sm text-[#475569] font-medium block mt-1'>
													Mention Journal / Book chapter details & upload publication proof PDF
												</span>
											</div>
											{/* N/A Toggle */}
											<div className='flex items-center gap-2 bg-[#F8FAFC] p-1.5 rounded-2xl border border-[#E2E8F0] min-h-[48px]'>
												<button
													type='button'
													onClick={() => {
														setFormData((prev) => ({
															...prev,
															hasJournalPub: false,
															journalDetails: '',
															journalFileName: '',
															journalFileDataUrl: '',
														}));
														setErrors((prev) => ({ ...prev, journalDetails: '', journalFile: '' }));
													}}
													className={`na-toggle-btn ${
														!formData.hasJournalPub
															? 'bg-[#0F172A] text-white shadow-xs font-bold'
															: 'text-[#475569] hover:text-[#0F172A]'
													}`}>
													NIL
												</button>
												<button
													type='button'
													onClick={() => setFormData((prev) => ({ ...prev, hasJournalPub: true }))}
													className={`na-toggle-btn ${
														formData.hasJournalPub
															? 'bg-[#22C55E] text-white shadow-xs font-bold'
															: 'text-[#475569] hover:text-[#0F172A]'
													}`}>
													+ I Have Publications
												</button>
											</div>
										</div>

										{formData.hasJournalPub && (
											<div className='pt-4 space-y-4 border-t border-[#E2E8F0] animate-fadeIn'>
												<div>
													<label className='block text-sm sm:text-base font-bold tracking-tight text-[#0F172A] mb-2'>
														Journal / Book Chapter Publication Details{' '}
														<span className='text-[#F87171] font-bold'>*</span>
													</label>
													<textarea
														name='journalDetails'
														rows={2}
														value={formData.journalDetails}
														onChange={handleChange}
														placeholder='Journal / Book Chapter Title, Journal / Book Name, Publisher, ISSN / ISBN, Volume, Year, DOI.'
														className={`form-input resize-none ${errors.journalDetails && touched.journalDetails ? 'input-error' : ''}`}
													/>
													{errors.journalDetails && touched.journalDetails && (
														<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
															<AlertCircle className='w-4 h-4 flex-shrink-0' />{' '}
															{errors.journalDetails}
														</p>
													)}
												</div>

												<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl'>
													<label className='btn-secondary inline-flex items-center gap-2.5 px-6 py-3.5 border border-[#CBD5E1] rounded-2xl text-sm font-bold text-[#0F172A] bg-white hover:bg-[#F8FAFC] cursor-pointer shadow-xs transition-all flex-shrink-0'>
														<Upload className='w-4 h-4 text-[#3B82F6]' />
														<span>{formData.journalFileName ? 'Change PDF' : 'Upload PDF'}</span>
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
													<span className='text-sm text-[#0F172A] font-medium truncate flex-1'>
														{formData.journalFileName ? (
															<span className='text-[#166534] font-bold flex items-center gap-2'>
																<FileCheck className='w-4 h-4 text-[#16A34A] flex-shrink-0' />{' '}
																{formData.journalFileName}
															</span>
														) : (
															<span className='text-[#475569] font-medium'>
																Upload publication / chapter proof PDF (First page only){' '}
																<span className='text-[#F87171] font-bold'>*</span>
															</span>
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
															className='text-sm font-bold text-[#F87171] hover:text-red-700 p-2 rounded-xl hover:bg-[#FEE2E2] transition-colors'>
															<Trash2 className='w-4 h-4' />
														</button>
													)}
												</div>
												{errors.journalFile && touched.journalFile && (
													<p className='text-xs sm:text-sm font-semibold text-[#F87171] flex items-center gap-1.5 animate-fadeIn'>
														<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.journalFile}
													</p>
												)}
											</div>
										)}
									</div>

									{/* Question 10: Patents / Design Registrations / Copyrights */}
									<div className='section-container space-y-5'>
										<div className='flex items-center justify-between flex-wrap gap-3'>
											<div>
												<div className='flex items-center gap-2 flex-wrap'>
													<label className='text-sm sm:text-base font-bold tracking-tight text-[#0F172A]'>
														10. Patents / Design Registrations / Copyrights, if any
													</label>
												</div>
												<span className='text-xs sm:text-sm text-[#475569] font-medium block mt-1'>
													Mention IPR details & upload certificate / filing document in PDF
												</span>
											</div>
											{/* N/A Toggle */}
											<div className='flex items-center gap-2 bg-[#F8FAFC] p-1.5 rounded-2xl border border-[#E2E8F0] min-h-[48px]'>
												<button
													type='button'
													onClick={() => {
														setFormData((prev) => ({
															...prev,
															hasPatents: false,
															patentDetails: '',
															patentFileName: '',
															patentFileDataUrl: '',
														}));
														setErrors((prev) => ({ ...prev, patentDetails: '', patentFile: '' }));
													}}
													className={`na-toggle-btn ${
														!formData.hasPatents
															? 'bg-[#0F172A] text-white shadow-xs font-bold'
															: 'text-[#475569] hover:text-[#0F172A]'
													}`}>
													NIL
												</button>
												<button
													type='button'
													onClick={() => setFormData((prev) => ({ ...prev, hasPatents: true }))}
													className={`na-toggle-btn ${
														formData.hasPatents
															? 'bg-[#22C55E] text-white shadow-xs font-bold'
															: 'text-[#475569] hover:text-[#0F172A]'
													}`}>
													+ I Have Patents/IPR
												</button>
											</div>
										</div>

										{formData.hasPatents && (
											<div className='pt-4 space-y-4 border-t border-[#E2E8F0] animate-fadeIn'>
												<div>
													<label className='block text-sm sm:text-base font-bold tracking-tight text-[#0F172A] mb-2'>
														Patent / IPR Details <span className='text-[#F87171] font-bold'>*</span>
													</label>
													<textarea
														name='patentDetails'
														rows={2}
														value={formData.patentDetails}
														onChange={handleChange}
														placeholder='Title of Invention, Application/Grant No, Filing Status, Authority...'
														className={`form-input resize-none ${errors.patentDetails && touched.patentDetails ? 'input-error' : ''}`}
													/>
													{errors.patentDetails && touched.patentDetails && (
														<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
															<AlertCircle className='w-4 h-4 flex-shrink-0' />{' '}
															{errors.patentDetails}
														</p>
													)}
												</div>

												<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl'>
													<label className='btn-secondary inline-flex items-center gap-2.5 px-6 py-3.5 border border-[#CBD5E1] rounded-2xl text-sm font-bold text-[#0F172A] bg-white hover:bg-[#F8FAFC] cursor-pointer shadow-xs transition-all flex-shrink-0'>
														<Upload className='w-4 h-4 text-[#3B82F6]' />
														<span>{formData.patentFileName ? 'Change PDF' : 'Upload PDF'}</span>
														<input
															type='file'
															accept='.pdf,application/pdf'
															onChange={(e) =>
																handlePdfChange(
																	e,
																	'patentFileName',
																	'patentFileDataUrl',
																	'patentFile',
																)
															}
															className='sr-only'
														/>
													</label>
													<span className='text-sm text-[#0F172A] font-medium truncate flex-1'>
														{formData.patentFileName ? (
															<span className='text-[#166534] font-bold flex items-center gap-2'>
																<FileCheck className='w-4 h-4 text-[#16A34A] flex-shrink-0' />{' '}
																{formData.patentFileName}
															</span>
														) : (
															<span className='text-[#475569] font-medium'>
																Upload patent / filing PDF (First page only){' '}
																<span className='text-[#F87171] font-bold'>*</span>
															</span>
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
																}))
															}
															className='text-sm font-bold text-[#F87171] hover:text-red-700 p-2 rounded-xl hover:bg-[#FEE2E2] transition-colors'>
															<Trash2 className='w-4 h-4' />
														</button>
													)}
												</div>
												{errors.patentFile && touched.patentFile && (
													<p className='text-xs sm:text-sm font-semibold text-[#F87171] flex items-center gap-1.5 animate-fadeIn'>
														<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.patentFile}
													</p>
												)}
											</div>
										)}
									</div>

									{/* Question 11: Participation in Competitions / Hackathons */}
									<div className='section-container space-y-5'>
										<div className='flex items-center justify-between flex-wrap gap-3'>
											<div>
												<div className='flex items-center gap-2 flex-wrap'>
													<label className='text-sm sm:text-base font-bold tracking-tight text-[#0F172A]'>
														11. Competitions / Hackathons / Technothons, if any
													</label>
												</div>
												<span className='text-xs sm:text-sm text-[#475569] font-medium block mt-1'>
													Mention competitions and upload certificate in PDF.
												</span>
											</div>
											{/* N/A Toggle */}
											<div className='flex items-center gap-2 bg-[#F8FAFC] p-1.5 rounded-2xl border border-[#E2E8F0] min-h-[48px]'>
												<button
													type='button'
													onClick={() => {
														setFormData((prev) => ({
															...prev,
															hasCompetitions: false,
															competitionDetails: '',
															competitionFileName: '',
															competitionFileDataUrl: '',
														}));
														setErrors((prev) => ({
															...prev,
															competitionDetails: '',
															competitionFile: '',
														}));
													}}
													className={`na-toggle-btn ${
														!formData.hasCompetitions
															? 'bg-[#0F172A] text-white shadow-xs font-bold'
															: 'text-[#475569] hover:text-[#0F172A]'
													}`}>
													NIL
												</button>
												<button
													type='button'
													onClick={() =>
														setFormData((prev) => ({ ...prev, hasCompetitions: true }))
													}
													className={`na-toggle-btn ${
														formData.hasCompetitions
															? 'bg-[#22C55E] text-white shadow-xs font-bold'
															: 'text-[#475569] hover:text-[#0F172A]'
													}`}>
													+ I Have Participated
												</button>
											</div>
										</div>

										{formData.hasCompetitions && (
											<div className='pt-4 space-y-4 border-t border-[#E2E8F0] animate-fadeIn'>
												<div>
													<label className='block text-sm sm:text-base font-bold tracking-tight text-[#0F172A] mb-2'>
														Competition & Achievement Details{' '}
														<span className='text-[#F87171] font-bold'>*</span>
													</label>
													<textarea
														name='competitionDetails'
														rows={2}
														value={formData.competitionDetails}
														onChange={handleChange}
														placeholder='Competition Name, Organising Body, Year, Project/Role, Achievement (Winner, Finalist, Participant)...'
														className={`form-input resize-none ${errors.competitionDetails && touched.competitionDetails ? 'input-error' : ''}`}
													/>
													{errors.competitionDetails && touched.competitionDetails && (
														<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
															<AlertCircle className='w-4 h-4 flex-shrink-0' />{' '}
															{errors.competitionDetails}
														</p>
													)}
												</div>

												<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl'>
													<label className='btn-secondary inline-flex items-center gap-2.5 px-6 py-3.5 border border-[#CBD5E1] rounded-2xl text-sm font-bold text-[#0F172A] bg-white hover:bg-[#F8FAFC] cursor-pointer shadow-xs transition-all flex-shrink-0'>
														<Upload className='w-4 h-4 text-[#3B82F6]' />
														<span>
															{formData.competitionFileName ? 'Change PDF' : 'Upload PDF'}
														</span>
														<input
															type='file'
															accept='.pdf,application/pdf'
															onChange={(e) =>
																handlePdfChange(
																	e,
																	'competitionFileName',
																	'competitionFileDataUrl',
																	'competitionFile',
																)
															}
															className='sr-only'
														/>
													</label>
													<span className='text-sm text-[#0F172A] font-medium truncate flex-1'>
														{formData.competitionFileName ? (
															<span className='text-[#166534] font-bold flex items-center gap-2'>
																<FileCheck className='w-4 h-4 text-[#16A34A] flex-shrink-0' />{' '}
																{formData.competitionFileName}
															</span>
														) : (
															<span className='text-[#475569] font-medium'>
																Upload certificate PDF{' '}
																<span className='text-[#F87171] font-bold'>*</span>
															</span>
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
															className='text-sm font-bold text-[#F87171] hover:text-red-700 p-2 rounded-xl hover:bg-[#FEE2E2] transition-colors'>
															<Trash2 className='w-4 h-4' />
														</button>
													)}
												</div>
												{errors.competitionFile && touched.competitionFile && (
													<p className='text-xs sm:text-sm font-semibold text-[#F87171] flex items-center gap-1.5 animate-fadeIn'>
														<AlertCircle className='w-4 h-4 flex-shrink-0' />{' '}
														{errors.competitionFile}
													</p>
												)}
											</div>
										)}
									</div>
								</section>

								{/* ======================================================== */}
								{/* SECTION 3: CO-CURRICULAR & LEADERSHIP PROFILE (Q12 - Q14) */}
								{/* ======================================================== */}
								<section
									id='section-3'
									className={`space-y-8 sm:space-y-10 ${currentStep === 3 ? 'block animate-fadeIn' : 'hidden'}`}>
									<div className='border-b border-[#E2E8F0] pb-4 sm:pb-5'>
										<div className='flex items-start sm:items-center justify-between gap-4'>
											<div className='flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1'>
												<div className='w-12 h-12 rounded-2xl bg-[#3B82F6] text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0 mt-0.5 sm:mt-0'>
													<Award className='w-6 h-6 text-white flex-shrink-0' />
												</div>
												<div className='min-w-0 flex-1'>
													<div className='sm:hidden mb-1.5'>
														<span className='section-badge text-xs py-1 px-3'>Section 3 of 5</span>
													</div>
													<h2 className='text-base sm:text-xl lg:text-2xl font-extrabold text-[#0F172A] uppercase tracking-wide leading-tight sm:leading-snug font-heading'>
														Co-Curricular & Leadership Profile
													</h2>
													<p className='text-xs sm:text-sm text-[#475569] font-medium mt-0.5 sm:mt-1 leading-relaxed'>
														Questions 12 to 14 • Activities, Awards & Leadership Positions
													</p>
												</div>
											</div>
											<span className='section-badge hidden sm:inline-flex flex-shrink-0'>
												Section 3 of 5
											</span>
										</div>
									</div>

									{/* Question 12: Technical / Co-Curricular Activities */}
									<div className='section-container space-y-5'>
										<div className='flex items-center justify-between flex-wrap gap-3'>
											<div>
												<div className='flex items-center gap-2 flex-wrap'>
													<label className='text-sm sm:text-base font-bold tracking-tight text-[#0F172A]'>
														12. Activities / Events if any
													</label>
												</div>
												<span className='text-xs sm:text-sm text-[#475569] font-medium block mt-1'>
													Mention the activity, event, and your role, and upload certificate in PDF.
												</span>
											</div>
											<div className='flex items-center gap-2 bg-[#F8FAFC] p-1.5 rounded-2xl border border-[#E2E8F0] min-h-[48px]'>
												<button
													type='button'
													onClick={() => {
														setFormData((prev) => ({
															...prev,
															hasActivities: false,
															activityDetails: '',
															activityFileName: '',
															activityFileDataUrl: '',
														}));
														setErrors((prev) => ({
															...prev,
															activityDetails: '',
															activityFile: '',
														}));
													}}
													className={`na-toggle-btn ${
														!formData.hasActivities
															? 'bg-[#0F172A] text-white shadow-xs font-bold'
															: 'text-[#475569] hover:text-[#0F172A]'
													}`}>
													NIL
												</button>
												<button
													type='button'
													onClick={() => setFormData((prev) => ({ ...prev, hasActivities: true }))}
													className={`na-toggle-btn ${
														formData.hasActivities
															? 'bg-[#22C55E] text-white shadow-xs font-bold'
															: 'text-[#475569] hover:text-[#0F172A]'
													}`}>
													+ I Have Activities / Events
												</button>
											</div>
										</div>

										{formData.hasActivities && (
											<div className='pt-4 space-y-4 border-t border-[#E2E8F0] animate-fadeIn'>
												<div>
													<label className='block text-sm sm:text-base font-bold tracking-tight text-[#0F172A] mb-2'>
														Activity & Contribution Details{' '}
														<span className='text-[#F87171] font-bold'>*</span>
													</label>
													<textarea
														name='activityDetails'
														rows={2}
														value={formData.activityDetails}
														onChange={handleChange}
														placeholder='Activity / Events, Organizing Body, Role & Contributions...'
														className={`form-input resize-none ${errors.activityDetails && touched.activityDetails ? 'input-error' : ''}`}
													/>
													{errors.activityDetails && touched.activityDetails && (
														<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
															<AlertCircle className='w-4 h-4 flex-shrink-0' />{' '}
															{errors.activityDetails}
														</p>
													)}
												</div>

												<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl'>
													<label className='btn-secondary inline-flex items-center gap-2.5 px-6 py-3.5 border border-[#CBD5E1] rounded-2xl text-sm font-bold text-[#0F172A] bg-white hover:bg-[#F8FAFC] cursor-pointer shadow-xs transition-all flex-shrink-0'>
														<Upload className='w-4 h-4 text-[#3B82F6]' />
														<span>{formData.activityFileName ? 'Change PDF' : 'Upload PDF'}</span>
														<input
															type='file'
															accept='.pdf,application/pdf'
															onChange={(e) =>
																handlePdfChange(
																	e,
																	'activityFileName',
																	'activityFileDataUrl',
																	'activityFile',
																)
															}
															className='sr-only'
														/>
													</label>
													<span className='text-sm text-[#0F172A] font-medium truncate flex-1'>
														{formData.activityFileName ? (
															<span className='text-[#166534] font-bold flex items-center gap-2'>
																<FileCheck className='w-4 h-4 text-[#16A34A] flex-shrink-0' />{' '}
																{formData.activityFileName}
															</span>
														) : (
															<span className='text-[#475569] font-medium'>
																Upload certificate PDF{' '}
																<span className='text-[#F87171] font-bold'>*</span>
															</span>
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
															className='text-sm font-bold text-[#F87171] hover:text-red-700 p-2 rounded-xl hover:bg-[#FEE2E2] transition-colors'>
															<Trash2 className='w-4 h-4' />
														</button>
													)}
												</div>
												{errors.activityFile && touched.activityFile && (
													<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
														<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.activityFile}
													</p>
												)}
											</div>
										)}
									</div>

									{/* Question 13: Major Achievements / Awards */}
									<div className='section-container space-y-5'>
										<div className='flex items-center justify-between flex-wrap gap-3'>
											<div>
												<div className='flex items-center gap-2 flex-wrap'>
													<label className='text-sm sm:text-base font-bold tracking-tight text-[#0F172A]'>
														13. Participation in Conference / Awards, if any
													</label>
												</div>
												<span className='text-xs sm:text-sm text-[#475569] font-medium block mt-1'>
													Mention the conference / award & upload certificate / proof in PDF.
												</span>
											</div>
											<div className='flex items-center gap-2 bg-[#F8FAFC] p-1.5 rounded-2xl border border-[#E2E8F0] min-h-[48px]'>
												<button
													type='button'
													onClick={() => {
														setFormData((prev) => ({
															...prev,
															hasAchievements: false,
															achievementDetails: '',
															achievementFileName: '',
															achievementFileDataUrl: '',
														}));
														setErrors((prev) => ({
															...prev,
															achievementDetails: '',
															achievementFile: '',
														}));
													}}
													className={`na-toggle-btn ${
														!formData.hasAchievements
															? 'bg-[#0F172A] text-white shadow-xs font-bold'
															: 'text-[#475569] hover:text-[#0F172A]'
													}`}>
													NIL
												</button>
												<button
													type='button'
													onClick={() =>
														setFormData((prev) => ({ ...prev, hasAchievements: true }))
													}
													className={`na-toggle-btn ${
														formData.hasAchievements
															? 'bg-[#22C55E] text-white shadow-xs font-bold'
															: 'text-[#475569] hover:text-[#0F172A]'
													}`}>
													+ I Have Participated / Won Awards
												</button>
											</div>
										</div>

										{formData.hasAchievements && (
											<div className='pt-4 space-y-4 border-t border-[#E2E8F0] animate-fadeIn'>
												<div>
													<label className='block text-sm sm:text-base font-bold tracking-tight text-[#0F172A] mb-2'>
														Participation & Award Details{' '}
														<span className='text-[#F87171] font-bold'>*</span>
													</label>
													<textarea
														name='achievementDetails'
														rows={2}
														value={formData.achievementDetails}
														onChange={handleChange}
														placeholder='Award / Honor Title, Awarding Authority, Year, Category...'
														className={`form-input resize-none ${errors.achievementDetails && touched.achievementDetails ? 'input-error' : ''}`}
													/>
													{errors.achievementDetails && touched.achievementDetails && (
														<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
															<AlertCircle className='w-4 h-4 flex-shrink-0' />{' '}
															{errors.achievementDetails}
														</p>
													)}
												</div>

												<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl'>
													<label className='btn-secondary inline-flex items-center gap-2.5 px-6 py-3.5 border border-[#CBD5E1] rounded-2xl text-sm font-bold text-[#0F172A] bg-white hover:bg-[#F8FAFC] cursor-pointer shadow-xs transition-all flex-shrink-0'>
														<Upload className='w-4 h-4 text-[#3B82F6]' />
														<span>
															{formData.achievementFileName ? 'Change PDF' : 'Upload PDF'}
														</span>
														<input
															type='file'
															accept='.pdf,application/pdf'
															onChange={(e) =>
																handlePdfChange(
																	e,
																	'achievementFileName',
																	'achievementFileDataUrl',
																	'achievementFile',
																)
															}
															className='sr-only'
														/>
													</label>
													<span className='text-sm text-[#0F172A] font-medium truncate flex-1'>
														{formData.achievementFileName ? (
															<span className='text-[#166534] font-bold flex items-center gap-2'>
																<FileCheck className='w-4 h-4 text-[#16A34A] flex-shrink-0' />{' '}
																{formData.achievementFileName}
															</span>
														) : (
															<span className='text-[#475569] font-medium'>
																Upload award proof PDF{' '}
																<span className='text-[#F87171] font-bold'>*</span>
															</span>
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
															className='text-sm font-bold text-[#F87171] hover:text-red-700 p-2 rounded-xl hover:bg-[#FEE2E2] transition-colors'>
															<Trash2 className='w-4 h-4' />
														</button>
													)}
												</div>
												{errors.achievementFile && touched.achievementFile && (
													<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
														<AlertCircle className='w-4 h-4 flex-shrink-0' />{' '}
														{errors.achievementFile}
													</p>
												)}
											</div>
										)}
									</div>

									{/* Question 14: Leadership / Coordinator Positions Held */}
									<div className='section-container space-y-5'>
										<div className='flex items-center justify-between flex-wrap gap-3'>
											<div>
												<div className='flex items-center gap-2 flex-wrap'>
													<label className='text-sm sm:text-base font-bold tracking-tight text-[#0F172A]'>
														14. Leadership / Coordinator Positions Held, if any
													</label>
												</div>
												<span className='text-xs sm:text-sm text-[#475569] font-medium block mt-1'>
													Mention position, organisation/club/event, duration, and responsibilities
													held.
												</span>
											</div>
											<div className='flex items-center gap-2 bg-[#F8FAFC] p-1.5 rounded-2xl border border-[#E2E8F0] min-h-[48px]'>
												<button
													type='button'
													onClick={() => {
														setFormData((prev) => ({
															...prev,
															hasLeadership: false,
															leadershipDetails: '',
															leadershipFileName: '',
															leadershipFileDataUrl: '',
														}));
														setErrors((prev) => ({ ...prev, leadershipDetails: '' }));
													}}
													className={`na-toggle-btn ${
														!formData.hasLeadership
															? 'bg-[#0F172A] text-white shadow-xs font-bold'
															: 'text-[#475569] hover:text-[#0F172A]'
													}`}>
													NIL
												</button>
												<button
													type='button'
													onClick={() => setFormData((prev) => ({ ...prev, hasLeadership: true }))}
													className={`na-toggle-btn ${
														formData.hasLeadership
															? 'bg-[#22C55E] text-white shadow-xs font-bold'
															: 'text-[#475569] hover:text-[#0F172A]'
													}`}>
													+ I Held Positions
												</button>
											</div>
										</div>

										{formData.hasLeadership && (
											<div className='pt-4 space-y-4 border-t border-[#E2E8F0] animate-fadeIn'>
												<div>
													<label className='block text-sm sm:text-base font-bold tracking-tight text-[#0F172A] mb-2'>
														Leadership Role Details{' '}
														<span className='text-[#F87171] font-bold'>*</span>
													</label>
													<textarea
														name='leadershipDetails'
														rows={3}
														value={formData.leadershipDetails}
														onChange={handleChange}
														placeholder='Position Held (e.g. Lead, Secretary, Student Rep, Club Coordinator), Organisation/Club, Duration/Tenure, Key Responsibilities...'
														className={`form-input resize-none ${errors.leadershipDetails && touched.leadershipDetails ? 'input-error' : ''}`}
													/>
													{errors.leadershipDetails && touched.leadershipDetails && (
														<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
															<AlertCircle className='w-4 h-4 flex-shrink-0' />{' '}
															{errors.leadershipDetails}
														</p>
													)}
												</div>
											</div>
										)}
									</div>
								</section>

								{/* ======================================================== */}
								{/* SECTION 4: INNOVATION & PROBLEM-SOLVING (Q15 - Q17) */}
								{/* ======================================================== */}
								<section
									id='section-4'
									className={`space-y-8 sm:space-y-10 ${currentStep === 4 ? 'block animate-fadeIn' : 'hidden'}`}>
									<div className='border-b border-[#E2E8F0] pb-4 sm:pb-5'>
										<div className='flex items-start sm:items-center justify-between gap-4'>
											<div className='flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1'>
												<div className='w-12 h-12 rounded-2xl bg-[#3B82F6] text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0 mt-0.5 sm:mt-0'>
													<Lightbulb className='w-6 h-6 text-white flex-shrink-0' />
												</div>
												<div className='min-w-0 flex-1'>
													<div className='sm:hidden mb-1.5'>
														<span className='section-badge text-xs py-1 px-3'>Section 4 of 5</span>
													</div>
													<h2 className='text-base sm:text-xl lg:text-2xl font-extrabold text-[#0F172A] uppercase tracking-wide leading-tight sm:leading-snug font-heading'>
														Innovation & Problem-Solving
													</h2>
													<p className='text-xs sm:text-sm text-[#475569] font-medium mt-0.5 sm:mt-1 leading-relaxed'>
														Questions 15 to 17 • Vision, Ecosystem Challenges & Technology Interests
													</p>
												</div>
											</div>
											<span className='section-badge hidden sm:inline-flex flex-shrink-0'>
												Section 4 of 5
											</span>
										</div>
									</div>

									{/* Question 15: Maritime / University Ecosystem Problem */}
									<div id='problemMaritime' className='section-container space-y-4'>
										<div>
											<label
												htmlFor='problemMaritimeInput'
												className='text-sm sm:text-base font-bold tracking-tight text-[#0F172A] block'>
												15. What is one Problem in the Indian Maritime University Ecosystem you
												would like to solve? <span className='text-[#F87171] font-bold'>*</span>
											</label>
											<p className='text-sm text-[#475569] font-medium leading-relaxed block mt-1'>
												Briefly describe the problem and why you think it needs to be addressed.
											</p>
										</div>
										<textarea
											id='problemMaritimeInput'
											name='problemMaritime'
											rows={4}
											value={formData.problemMaritime}
											onChange={handleChange}
											onBlur={handleBlur}
											placeholder='Describe a specific operational, technological, ecological, or campus ecosystem challenge and your proposed angle of solution...'
											className={`form-input resize-y ${errors.problemMaritime && touched.problemMaritime ? 'input-error' : ''}`}
										/>
										{errors.problemMaritime && touched.problemMaritime && (
											<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
												<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.problemMaritime}
											</p>
										)}
										<div className='flex justify-end text-xs text-[#94A3B8] font-mono font-semibold'>
											{formData.problemMaritime.length} characters
										</div>
									</div>

									{/* Question 16: Problem in Society */}
									<div id='problemSociety' className='section-container space-y-4'>
										<div>
											<label
												htmlFor='problemSocietyInput'
												className='text-sm sm:text-base font-bold tracking-tight text-[#0F172A] block'>
												16. What is one Problem in Society you would like to solve?{' '}
												<span className='text-[#F87171] font-bold'>*</span>
											</label>
											<p className='text-sm text-[#475569] font-medium leading-relaxed block mt-1'>
												Briefly describe the problem and why you think it needs to be addressed.
											</p>
										</div>
										<textarea
											id='problemSocietyInput'
											name='problemSociety'
											rows={4}
											value={formData.problemSociety}
											onChange={handleChange}
											onBlur={handleBlur}
											placeholder='Describe a broader social, environmental, energy, or civic problem that motivates your passion for innovation...'
											className={`form-input resize-y ${errors.problemSociety && touched.problemSociety ? 'input-error' : ''}`}
										/>
										{errors.problemSociety && touched.problemSociety && (
											<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
												<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.problemSociety}
											</p>
										)}
										<div className='flex justify-end text-xs text-[#94A3B8] font-mono font-semibold'>
											{formData.problemSociety.length} characters
										</div>
									</div>

									{/* Question 17: Area(s) of Innovation / Technology Interest */}
									<div id='areasOfInterest' className='section-container space-y-5'>
										<div>
											<label className='text-sm sm:text-base font-bold tracking-tight text-[#0F172A] block'>
												17. Which area(s) of innovation / technology interest you most?{' '}
												<span className='text-[#F87171] font-bold'>*</span>
											</label>
											<p className='text-sm text-[#475569] font-medium mt-1 block'>
												Select at least 1 innovation domain from below or add custom areas.
											</p>
										</div>

										{/* Interactive Tag Chips */}
										<div className='flex flex-wrap gap-3 pt-1'>
											{SUGGESTED_INTERESTS.map((tag) => {
												const active = formData.areasOfInterest.includes(tag);
												return (
													<button
														key={tag}
														type='button'
														onClick={() => toggleInterest(tag)}
														className={`interest-tag-chip ${active ? 'active' : ''}`}>
														{active ? (
															<Check className='w-4 h-4 stroke-[2.5]' />
														) : (
															<Plus className='w-4 h-4' />
														)}
														<span>{tag}</span>
													</button>
												);
											})}
										</div>

										{/* Add Custom Tag */}
										<div className='flex flex-col sm:flex-row gap-3 pt-2'>
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
												className='form-input flex-1'
											/>
											<button
												type='button'
												onClick={handleAddCustomInterest}
												className='btn-secondary whitespace-nowrap text-sm font-bold flex items-center justify-center gap-2'>
												<Plus className='w-4 h-4 text-[#3B82F6]' /> Add Area
											</button>
										</div>

										{errors.areasOfInterest && (
											<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
												<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.areasOfInterest}
											</p>
										)}

										{formData.areasOfInterest.length > 0 && (
											<p className='text-sm font-bold text-[#166534] mt-2 flex items-center gap-2 animate-fadeIn'>
												<Sparkles className='w-4 h-4 text-[#FBBF24]' />
												Selected ({formData.areasOfInterest.length}) domains
											</p>
										)}
									</div>
								</section>

								{/* ======================================================== */}
								{/* SECTION 5: SUPPORTING DOCUMENTS & DECLARATION (Q18 - Q19) */}
								{/* ======================================================== */}
								<section
									id='section-5'
									className={`space-y-7 ${currentStep === 5 ? 'block animate-fadeIn' : 'hidden'}`}>
									<div className='border-b border-[#E2E8F0] pb-3.5 sm:pb-4'>
										<div className='flex items-start sm:items-center justify-between gap-3'>
											<div className='flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1'>
												<div className='w-11 sm:w-12 h-11 sm:h-12 rounded-2xl bg-[#3B82F6] text-white flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0 mt-0.5 sm:mt-0'>
													<ShieldCheck className='w-6 h-6 text-white flex-shrink-0' />
												</div>
												<div className='min-w-0 flex-1'>
													<div className='sm:hidden mb-1'>
														<span className='section-badge text-[10px] py-0.5 px-2'>
															Section 5 of 5
														</span>
													</div>
													<h2 className='text-base sm:text-xl lg:text-2xl font-extrabold text-[#0F172A] tracking-tight leading-snug font-heading'>
														Supporting Documents & Official Declaration
													</h2>
													<p className='text-xs sm:text-sm text-[#475569] font-medium mt-0.5 sm:mt-1 leading-relaxed'>
														Questions 18 & 19 • Resume / CV, Master PDF & Official Student
														Declaration
													</p>
												</div>
											</div>
											<span className='section-badge hidden sm:inline-flex flex-shrink-0'>
												Section 5 of 5
											</span>
										</div>
									</div>

									{/* Question 18: Upload Detailed Resume / CV (Optional / Recommended with 2 Tabs) */}
									<div id='resume' className='section-container space-y-4'>
										<div className='flex items-center justify-between flex-wrap gap-3'>
											<div>
												<div className='flex items-center gap-2 flex-wrap'>
													<label
														htmlFor='resumeInput'
														className='text-xs sm:text-sm font-extrabold text-[#0F172A] uppercase tracking-wider block font-heading'>
														18. Upload Resume / CV (PDF)
													</label>
													<span className='text-[10px] sm:text-xs font-bold text-[#166534] bg-[#DCFCE7] border border-[#BBF7D0] px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full'>
														Recommended
													</span>
												</div>
												<span className='text-xs sm:text-sm text-[#475569] font-medium block mt-1'>
													Upload your latest CV/resume in PDF format (strongly recommended for
													council evaluation, or select NIL if not available).
												</span>
											</div>

											{/* N/A / Upload Toggle Tabs */}
											<div className='flex items-center gap-1.5 bg-[#F1F5F9] p-1.5 rounded-2xl border border-[#CBD5E1]'>
												<button
													type='button'
													onClick={() => {
														setFormData((prev) => ({
															...prev,
															hasResume: false,
															resumeName: '',
															resumeDataUrl: '',
														}));
														setErrors((prev) => ({ ...prev, resume: '' }));
													}}
													className={`na-toggle-btn ${
														!formData.hasResume
															? 'bg-[#0F172A] text-white shadow-xs'
															: 'text-[#475569] hover:text-[#0F172A]'
													}`}>
													NIL
												</button>
												<button
													type='button'
													onClick={() => setFormData((prev) => ({ ...prev, hasResume: true }))}
													className={`na-toggle-btn ${
														formData.hasResume
															? 'bg-[#22C55E] text-white shadow-xs'
															: 'text-[#475569] hover:text-[#0F172A]'
													}`}>
													+ Upload Resume (Recommended)
												</button>
											</div>
										</div>

										{formData.hasResume && (
											<div className='pt-3.5 space-y-3.5 border-t border-[#E2E8F0] animate-fadeIn'>
												<div className='p-3.5 sm:p-5 rounded-2xl bg-[#EFF6FF] border-2 border-[#BFDBFE] text-[#1E3A8A] text-xs sm:text-sm leading-relaxed space-y-1.5 shadow-xs'>
													<span className='font-extrabold text-[#1E3A8A] block text-xs sm:text-base'>
														📌 Upload a detailed Resume / CV:
													</span>
													<p className='text-[#1E40AF] font-medium'>
														• Includes: Latest Resume, Certificate Proofs, Awards & Positions.
													</p>
													<p className='text-[#1E40AF] font-medium'>
														• Accepted Format: <strong>.pdf</strong> (Max. 15MB).
													</p>
												</div>

												<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl'>
													<label className='inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3.5 border-2 border-[#CBD5E1] rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0F172A] bg-white hover:bg-[#F8FAFC] cursor-pointer shadow-xs transition-all flex-shrink-0 hover:border-[#3B82F6] min-h-[44px] sm:min-h-[50px]'>
														<Upload className='w-4 h-4 text-[#3B82F6]' />
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
															<div className='flex items-center justify-between gap-2 bg-[#DCFCE7] p-2.5 sm:p-3 rounded-2xl border border-[#BBF7D0]'>
																<span className='text-xs sm:text-sm font-bold text-[#166534] truncate flex items-center gap-1.5'>
																	<FileCheck className='w-4 h-4 text-[#16A34A] flex-shrink-0' />
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
																	className='text-xs font-bold text-[#DC2626] hover:text-[#991B1B] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white border border-[#FECACA] flex-shrink-0 hover:bg-[#FEE2E2] transition-colors min-h-[32px] sm:min-h-[36px]'>
																	Remove
																</button>
															</div>
														) : (
															<span className='text-xs sm:text-sm text-[#475569] font-medium'>
																No file chosen yet (.pdf up to 15MB)
															</span>
														)}
													</div>
												</div>

												{errors.resume && (
													<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-2 flex items-center gap-1.5 animate-fadeIn'>
														<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.resume}
													</p>
												)}
											</div>
										)}
									</div>

									{/* Question 19: Student Declaration */}
									<div
										id='declarationAccepted'
										className='section-container space-y-4 sm:space-y-5'>
										<label className='text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#0F172A] block font-heading'>
											19. Student Declaration / Consent for Participation in IIC Activities{' '}
											<span className='text-[#F87171] font-bold'>*</span>
										</label>

										{/* Declaration Statement Box */}
										<div className='declaration-certificate-box p-4 sm:p-6 text-[#1E293B] text-xs sm:text-sm leading-relaxed rounded-2xl'>
											<strong className='text-[#0F172A] font-extrabold block mb-1.5 sm:mb-2 uppercase tracking-wide text-xs sm:text-sm font-heading'>
												Declaration Statement:
											</strong>
											<p className='italic text-[#334155] leading-relaxed font-medium text-xs sm:text-sm'>
												“I hereby declare that the information provided by me is true and correct to
												the best of my knowledge. I understand that submission of this form does not
												guarantee selection to the IIC Student Council. If selected, I agree to
												actively participate in IIC activities and contribute responsibly towards
												the innovation, research, entrepreneurship and related activities of the
												Institution.”
											</p>
										</div>

										{/* Declaration Consent Checkbox */}
										<label className='flex items-start gap-3 p-3.5 sm:p-5 rounded-2xl border-2 border-[#CBD5E1] bg-white hover:border-[#3B82F6] cursor-pointer transition-all shadow-xs min-h-[48px] sm:min-h-[56px]'>
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
												className='mt-1 w-4 h-4 sm:w-5 sm:h-5 text-[#3B82F6] rounded-lg border-[#CBD5E1] focus:ring-[#3B82F6] cursor-pointer accent-[#3B82F6]'
											/>
											<div className='text-xs sm:text-sm text-[#0F172A] font-bold leading-relaxed select-none'>
												I have read, understood, and solemnly accept the Declaration above.
											</div>
										</label>

										{errors.declarationAccepted && touched.declarationAccepted && (
											<p className='text-xs sm:text-sm font-semibold text-[#F87171] mt-2 flex items-center gap-1.5 animate-fadeIn'>
												<AlertCircle className='w-4 h-4 flex-shrink-0' />{' '}
												{errors.declarationAccepted}
											</p>
										)}

										{/* Digital Signature Confirmation Preview */}
										{formData.cadetName && (
											<div className='pt-3 flex items-center justify-between text-xs sm:text-sm text-[#475569] border-t border-[#CBD5E1] flex-wrap gap-2'>
												<span>
													<strong className='text-[#0F172A]'>Digital Signature:</strong>{' '}
													<span className='font-mono font-bold text-[#1D4ED8] uppercase bg-[#DBEAFE] px-2.5 py-1 rounded-xl border border-[#BFDBFE]'>
														{formData.cadetName}
													</span>
												</span>
												<span>
													<strong className='text-[#0F172A]'>Timestamp:</strong>{' '}
													{new Date().toLocaleDateString('en-GB')}
												</span>
											</div>
										)}
									</div>
								</section>

								{/* Submission Error Banner */}
								{submissionError && (
									<div className='p-4 sm:p-5 rounded-2xl bg-[#FEE2E2] border-2 border-[#FCA5A5] text-[#7F1D1D] text-xs sm:text-sm space-y-1.5 animate-fadeIn'>
										<div className='flex items-center gap-2 font-bold text-[#991B1B] text-sm sm:text-base'>
											<AlertCircle className='w-5 h-5 text-[#DC2626] flex-shrink-0' />
											<span>Submission Could Not Be Completed</span>
										</div>
										<p className='text-[#991B1B] leading-relaxed font-medium pl-7'>
											{submissionError}
										</p>
									</div>
								)}

								{/* ======================================================== */}
								{/* STEP NAVIGATION & SUBMIT CONTROLS */}
								{/* ======================================================== */}
								<div className='pt-7 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3.5'>
									<div className='flex items-center gap-2.5 w-full sm:w-auto'>
										<button
											type='button'
											onClick={handleReset}
											className='btn-secondary w-full sm:w-auto flex items-center justify-center gap-2'>
											<RotateCcw className='w-4 h-4' /> Clear Form
										</button>
										{currentStep > 1 && (
											<button
												type='button'
												onClick={prevStep}
												className='btn-secondary w-full sm:w-auto flex items-center justify-center gap-2'>
												<ChevronLeft className='w-4 h-4' /> Previous
											</button>
										)}
									</div>

									<div className='flex items-center gap-3 w-full sm:w-auto'>
										{/* On Steps 1 to 4: Only show "Next" Button with dedicated key */}
										{currentStep < 5 ? (
											<button
												key={`next-btn-step-${currentStep}`}
												type='button'
												onClick={(e) => nextStep(e)}
												className='btn-primary w-full sm:w-auto flex items-center justify-center gap-2'>
												<span>Next: {SECTIONS[currentStep]?.title}</span>
												<ChevronRight className='w-4 h-4' />
											</button>
										) : (
											/* On Step 5: Show "Submit Enrollment Form" Button with dedicated key and type='button' */
											<button
												key='submit-final-enrollment-btn'
												type='button'
												onClick={(e) => handleSubmit(e)}
												disabled={submitting}
												className='btn-primary w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#22C55E] hover:bg-[#16A34A] border-b-4 border-[#15803D] active:border-b-0 shadow-md'>
												<ShieldCheck className='w-5 h-5' />
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
				<p className='text-center text-xs sm:text-sm text-[#475569] font-bold uppercase tracking-wider mt-6 select-none'>
					Indian Maritime University • Kolkata Campus • IIC 2026–27
				</p>
				<p aria-hidden='true' className='text-center opacity-0'>
					Developed by Sreeram R
				</p>
			</div>
		</main>
	);
}
