'use client';

import React, { useState, useEffect, FormEvent, ChangeEvent, FocusEvent } from 'react';
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
import { generateMasterCombinedPdf } from './lib/generateMasterPdf';

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

	// Section 2: Academic & Research Profile (Q8 - Q11)
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

const ALL_SEMESTERS = [
	'Semester 1',
	'Semester 2',
	'Semester 3',
	'Semester 4',
	'Semester 5',
	'Semester 6',
	'Semester 7',
	'Semester 8',
];
const PG_SEMESTERS = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4'];

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
		title: 'Academic & Research',
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

	const isFirstYear = formData.yearOfStudy === '1st Year' || formData.semester === 'Semester 1';
	const isPostGraduate =
		formData.department.includes('MBA') || formData.department.includes('M.Tech');
	const availableYears = isPostGraduate ? PG_YEARS : ALL_YEARS;
	const availableSemesters = isPostGraduate ? PG_SEMESTERS : ALL_SEMESTERS;

	// Load draft from localStorage on mount
	useEffect(() => {
		try {
			const savedDraft = localStorage.getItem('iic_form_draft_v2');
			if (savedDraft) {
				const parsed = JSON.parse(savedDraft);
				const timer = setTimeout(() => {
					setFormData((prev) => ({
						...prev,
						...parsed,
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
				let updatedSem = prev.semester;

				if (isPG) {
					if (updatedYear === '3rd Year' || updatedYear === '4th Year') {
						updatedYear = '2nd Year';
					}
					const semNum = parseInt(updatedSem.replace(/\D/g, ''), 10) || 1;
					if (semNum > 4) {
						updatedSem = 'Semester 4';
					}
				}

				return {
					...prev,
					department: value,
					yearOfStudy: updatedYear,
					semester: updatedSem,
				};
			});
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
			window.scrollTo({ top: 320, behavior: 'smooth' });
		}
	};

	const nextStep = () => {
		if (isStepComplete(currentStep)) {
			setCompletedSteps((prev) => (prev.includes(currentStep) ? prev : [...prev, currentStep]));
		}
		if (currentStep < 5) {
			setCurrentStep((prev) => prev + 1);
			if (typeof window !== 'undefined') {
				window.scrollTo({ top: 320, behavior: 'smooth' });
			}
		}
	};

	const prevStep = () => {
		if (currentStep > 1) {
			setCurrentStep((prev) => prev - 1);
			if (typeof window !== 'undefined') {
				window.scrollTo({ top: 320, behavior: 'smooth' });
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

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
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
					'.input-error, [id^="cadetName"], [id^="regNumber"], [id^="photo"], [id^="resume"], [id^="declarationAccepted"]',
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
			if (formData.marksheetDataUrl) {
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

			// Generate the Complete Unified Master PDF (Form + Proofs) using pdf-lib
			let compiledMasterPdfDataUrl = '';
			try {
				const masterPdfResult = await generateMasterCombinedPdf(
					formData,
					generatedRefId,
					attachedProofs,
				);
				compiledMasterPdfDataUrl = masterPdfResult.mergedDataUrl;
			} catch (pdfErr) {
				console.warn('Could not compile local master PDF:', pdfErr);
			}

			// Streamlined payload: send masterPdfDataUrl without duplicating raw proof arrays
			const payload = {
				...formData,
				referenceId: generatedRefId,
				submittedAt: new Date().toISOString(),
				templateDocId: '1x69S7y0X7UJYR7x2ZEKCoQzPFCb-2nHctp6XNQG3E7I',

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

				// Unified pre-merged single Master PDF
				masterPdfDataUrl: compiledMasterPdfDataUrl,
				attachedProofsCount: attachedProofs.length,
			};

			const rawDirectUrl =
				process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL ||
				'https://script.google.com/macros/s/AKfycbzVklG1gmnnhi1wq6HVMTNr_1XcMADOURNKSJOHFTSDmZzUCPkSQzFWIHslsOIRU3M6/exec';
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
						colors: ['#0e2544', '#0284c7', '#f59e0b', '#10b981', '#6366f1'],
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
		<main className='relative w-full min-h-screen py-4 sm:py-9 px-2 sm:px-6 lg:px-8 flex flex-col items-center justify-start nautical-grid-pattern'>
			{/* Ambient Radial Lighting Overlay */}
			<div className='pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(2,132,199,0.12),rgba(255,255,255,0))]' />

			{/* Form Shell / Center Card */}
			<div className='relative z-10 w-full max-w-4xl mb-12 mt-1 sm:mt-2'>
				<div className='clean-card overflow-hidden'>
					{/* Top Institutional Accent Line */}
					<div className='h-1.5 w-full bg-gradient-to-r from-[#0a1e38] via-[#0284c7] to-[#f59e0b]' />

					{/* Official Banner Header with Frame */}
					<div className='w-full banner-frame-container p-2 sm:p-4 flex justify-center'>
						<div className='w-full max-w-[1024px] relative rounded-2xl overflow-hidden banner-frame-inner'>
							<Image
								src='/iic-banner-v5.png'
								alt='IMU Kolkata Campus - Institution Innovation Council (IIC) 2026-27'
								width={2800}
								height={600}
								priority
								fetchPriority='high'
								className='w-full h-auto object-contain mx-auto transition-all'
								sizes='(max-width: 1024px) 100vw, 1024px'
							/>
						</div>
					</div>

					{/* Title & Official Notice Strip */}
					<div className='px-5 sm:px-9 py-5 sm:py-7 header-strip'>
						<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3.5'>
							<div>
								<div className='flex items-center gap-2 mb-1.5 flex-wrap'>
									<span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold academic-badge shadow-2xs'>
										Academic Year 2026–27
									</span>
									<span className='inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold campus-badge uppercase tracking-wider'>
										<Building2 className='w-3.5 h-3.5 opacity-70' />
										IMU - Kolkata Campus
									</span>
								</div>
								<h1 className='text-lg sm:text-2xl lg:text-[26px] font-black uppercase tracking-tight leading-tight main-title font-heading'>
									Institution’s Innovation Council (IIC) – Cadet Enrollment Form
								</h1>
							</div>
							{draftSaved && (
								<div className='flex items-center gap-1.5 text-xs draft-badge px-3.5 py-1.5 rounded-full font-bold self-start sm:self-auto shadow-2xs animate-fadeIn'>
									<Check className='w-3.5 h-3.5 text-emerald-600' /> Auto-saved
								</div>
							)}
						</div>

						{/* Instructions to cadets Banner (Visible only before submission) */}
						{!submitted && (
							<div className='mt-5 p-4 sm:p-6 rounded-2xl notice-card'>
								<div className='flex items-center gap-2.5 pb-3.5 mb-3.5 border-b border-sky-200/50 dark:border-slate-700/60'>
									<div className='w-7 h-7 rounded-lg notice-header-badge flex items-center justify-center flex-shrink-0 shadow-xs'>
										<Info className='w-4 h-4' />
									</div>
									<h2 className='font-bold uppercase tracking-wider text-[11px] sm:text-sm notice-title'>
										Important Notice / Instructions:
									</h2>
								</div>
								<ol className='space-y-2.5 text-[12px] sm:text-[13px] leading-relaxed'>
									<li className='flex items-start gap-3'>
										<span className='flex-shrink-0 w-4 sm:w-5 h-4 sm:h-5 rounded-full notice-step-num text-[10px] sm:text-[12px] font-extrabold flex items-center justify-center mt-0.5'>
											1
										</span>
										<span className='flex-1 font-medium notice-step-text'>
											Fields marked with an asterisk (
											<span className='text-rose-500 font-extrabold'>*</span>) are mandatory and
											must be completed.
										</span>
									</li>
									<li className='flex items-start gap-3'>
										<span className='flex-shrink-0 w-4 sm:w-5 h-4 sm:h-5 rounded-full notice-step-num text-[10px] sm:text-[12px] font-extrabold flex items-center justify-center mt-0.5'>
											2
										</span>
										<span className='flex-1 font-medium notice-step-text'>
											Cadets are advised to ensure that all information provided is accurate,
											complete, and supported by valid documents before submission.
										</span>
									</li>
									<li className='flex items-start gap-3'>
										<span className='flex-shrink-0 w-4 sm:w-5 h-4 sm:h-5 rounded-full notice-step-num text-[10px] sm:text-[12px] font-extrabold flex items-center justify-center mt-0.5'>
											3
										</span>
										<span className='flex-1 font-medium notice-step-text'>
											The Enrollment Form and all supporting documents/proofs submitted will be
											compiled into a single PDF and sent to the registered email ID.
										</span>
									</li>
									<li className='flex items-start gap-3'>
										<span className='flex-shrink-0 w-4 sm:w-5 h-4 sm:h-5 rounded-full notice-step-num text-[10px] sm:text-[12px] font-extrabold flex items-center justify-center mt-0.5'>
											4
										</span>
										<span className='flex-1 font-medium notice-step-text'>
											Cadets are required to verify all their details and entries made in the PDF
											received through their registered email ID.
										</span>
									</li>
									<li className='flex items-start gap-3'>
										<span className='flex-shrink-0 w-4 sm:w-5 h-4 sm:h-5 rounded-full notice-step-num text-[10px] sm:text-[12px] font-extrabold flex items-center justify-center mt-0.5'>
											5
										</span>
										<span className='flex-1 font-medium notice-step-text'>
											After verification, sign in the space provided and self-attest the
											PDF/documents, and submit the duly verified documents in person to the
											concerned Faculty In-charge.
										</span>
									</li>
								</ol>
							</div>
						)}
					</div>

					{/* SUCCESS CONFIRMATION VIEW */}
					{submitted ? (
						<div className='p-8 sm:p-14 text-center bg-white space-y-6 animate-fadeIn max-w-2xl mx-auto'>
							<div className='w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto text-4xl shadow-lg shadow-emerald-500/20'>
								<Check className='w-10 h-10 stroke-[2.5]' />
							</div>
							<div className='space-y-3'>
								<span className='inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-widest bg-emerald-100/90 px-3.5 py-1.5 rounded-full border border-emerald-300 shadow-2xs'>
									<CheckCircle2 className='w-3.5 h-3.5 text-emerald-700' /> Application Submitted
								</span>
								<h2 className='text-2xl sm:text-3xl font-extrabold text-[#0e2544] uppercase tracking-tight leading-snug sm:leading-tight font-heading'>
									Enrollment Form Submitted Successfully!
								</h2>
								<p className='text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed'>
									Thank you, <span className='font-bold text-[#0e2544]'>{formData.cadetName}</span>.
									Your enrollment application for the{' '}
									<strong>Institution’s Innovation Council (IIC 2026–27)</strong> has been recorded.
								</p>

								{/* Reference ID Card */}
								<div className='p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-left space-y-1 text-xs sm:text-sm text-slate-700'>
									<p>
										<strong>Application Ref ID:</strong>{' '}
										<span className='font-mono font-bold text-[#0284c7]'>{submittedRefId}</span>
									</p>
									<p>
										<strong>Registered Email:</strong>{' '}
										<span className='font-semibold'>{formData.email}</span>
									</p>
									<p className='text-xs text-slate-500 pt-1'>
										A confirmation email with your compiled single-attachment PDF has been dispatched.
									</p>
								</div>

								{/* Action Buttons */}
								<div className='pt-2 flex items-center justify-center'>
									<button
										type='button'
										onClick={handleReset}
										className='btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm'>
										<RotateCcw className='w-4 h-4' /> Submit Another Form
									</button>
								</div>
							</div>
						</div>
					) : (
						/* MAIN ENROLLMENT FORM */
						<form onSubmit={handleSubmit} noValidate className='bg-white'>
							{/* 5-STEP RESPONSIVE ACCESSIBLE STEPPER (W3C & 21st.dev Standard) */}
							<nav
								aria-label='Cadet Enrollment Steps'
								className='border-b border-slate-200/90 bg-gradient-to-r from-slate-50 via-sky-50/20 to-slate-50 px-2 sm:px-6 pt-2.5 pb-2.5 sm:pt-3.5 sm:pb-2.5'>
								{/* Top Stepper Track Progress Bar */}
								<div className='w-full max-w-4xl mx-auto mb-3 px-0.5 sm:px-1'>
									<div className='h-1 w-full bg-slate-200/80 rounded-full overflow-hidden'>
										<div
											className='h-full bg-gradient-to-r from-[#0e2544] via-[#0284c7] to-emerald-500 transition-all duration-300 ease-out'
											style={{ width: `${Math.max(12, ((currentStep - 1) / 4) * 100)}%` }}
										/>
									</div>
								</div>

								<ol
									role='list'
									className='grid grid-cols-5 gap-1 sm:gap-2.5 max-w-4xl mx-auto w-full items-stretch'>
									{SECTIONS.map((sec) => {
										const isCurrent = currentStep === sec.id;
										const isCompleted = completedSteps.includes(sec.id) && !isCurrent;

										return (
											<li key={sec.id} className='list-none flex'>
												<button
													type='button'
													onClick={() => handleStepClick(sec.id)}
													aria-current={isCurrent ? 'step' : undefined}
													aria-label={`Step ${sec.id}: ${sec.title} (${isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Pending'})`}
													title={
														isCurrent
															? `Current Section: ${sec.title}`
															: isCompleted
																? `${sec.title} (Completed)`
																: `${sec.title}`
													}
													className={`group relative w-full h-11 sm:h-12 flex items-center justify-center gap-1.5 sm:gap-2 px-1 sm:px-3 rounded-full text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:outline-none ${
														isCurrent
															? 'bg-gradient-to-r from-[#0e2544] to-[#163866] text-white shadow-sm ring-2 ring-sky-400/50'
															: isCompleted
																? 'bg-emerald-50 text-emerald-950 border border-emerald-300 hover:bg-emerald-100 shadow-2xs'
																: 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
													}`}>
													<div
														className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-transform ${
															isCurrent
																? 'bg-sky-400 text-[#0e2544] shadow-xs'
																: isCompleted
																	? 'bg-emerald-600 text-white'
																	: 'bg-slate-200 text-slate-600'
														}`}>
														{isCompleted ? <Check className='w-3 h-3 stroke-[2.5]' /> : sec.id}
													</div>

													<span className='truncate text-[11px] sm:text-xs tracking-tight text-center font-semibold sm:font-bold'>
														<span className='sm:hidden'>{sec.shortTitle}</span>
														<span className='hidden sm:inline'>{sec.title}</span>
													</span>
												</button>
											</li>
										);
									})}
								</ol>

								{/* Progress Completion Indicator */}
								<div className='flex items-center justify-between text-xs text-slate-500 font-semibold mt-2.5 px-1 max-w-4xl mx-auto'>
									<span className='flex items-center gap-1.5'>
										<Compass className='w-3.5 h-3.5 text-sky-600' />
										Step {currentStep} of 5 • {SECTIONS[currentStep - 1]?.title}
									</span>
									<span className='font-bold text-[#0e2544]'>
										{progressPercent}% Complete ({completedCount}/5 Steps Completed)
									</span>
								</div>
							</nav>

							{/* FORM BODY CONTAINER */}
							<div className='p-6 sm:p-9 lg:p-10 space-y-8'>
								{/* ======================================================== */}
								{/* SECTION 1: CADET PROFILE & DEMOGRAPHICS (Q1 - Q7 + PHOTO) */}
								{/* ======================================================== */}
								<section
									id='section-1'
									className={`space-y-7 ${currentStep === 1 ? 'block animate-fadeIn' : 'hidden'}`}>
									<div className='flex items-center justify-between border-b border-slate-200 pb-4'>
										<div className='flex items-center gap-3'>
											<div className='w-10 h-10 rounded-xl bg-gradient-to-br from-[#0e2544] to-[#163866] text-white flex items-center justify-center font-bold text-sm shadow-xs'>
												<User className='w-5 h-5 text-sky-300' />
											</div>
											<div>
												<h2 className='text-lg sm:text-xl font-extrabold text-[#0e2544] uppercase tracking-wide leading-snug sm:leading-tight font-heading'>
													Cadet Profile & Academic Identity
												</h2>
												<p className='text-xs sm:text-[13px] text-slate-500 font-medium'>
													Questions 1 to 7 • Personal, enrollment, and official contact details
												</p>
											</div>
										</div>
										<span className='section-badge'>Section 1 of 5</span>
									</div>

									{/* Row 1: 1. Name of Cadet & 2. Department / Academic Program */}
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6'>
										<div id='cadetName' className='space-y-1.5'>
											<label
												htmlFor='cadetNameInput'
												className='flex items-center gap-1.5 text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544]'>
												<User className='w-3.5 h-3.5 text-sky-700' />
												<span>1. Name of the Cadet</span>
												<span className='text-red-600 font-bold'>*</span>
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
												<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
													<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.cadetName}
												</p>
											) : (
												<p className='text-xs text-slate-500 mt-1 font-medium'>
													Enter full name as per official IMU records.
												</p>
											)}
										</div>
										<div id='department' className='space-y-1.5'>
											<label
												htmlFor='department'
												className='flex items-center gap-1.5 text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544]'>
												<Building2 className='w-3.5 h-3.5 text-sky-700' />
												<span>2. Department / Academic Program</span>
												<span className='text-red-600 font-bold'>*</span>
											</label>
											<select
												id='department'
												name='department'
												value={formData.department}
												onChange={handleChange}
												className='form-input cursor-pointer font-medium h-[46px]'>
												{DEPARTMENTS.map((dept) => (
													<option key={dept} value={dept}>
														{dept}
													</option>
												))}
											</select>
											<p className='text-xs text-slate-500 mt-1 font-medium'>
												{isPostGraduate
													? '2-Year Postgraduate (PG) Program'
													: '4-Year Undergraduate (UG) Program'}
											</p>
										</div>
									</div>

									{/* Row 2: 3. Year of Study & 4. Current Semester */}
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6'>
										<div id='yearOfStudy' className='space-y-1.5'>
											<label
												htmlFor='yearOfStudySelect'
												className='flex items-center gap-1.5 text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544]'>
												<Calendar className='w-3.5 h-3.5 text-sky-700' />
												<span>3. Year of Study</span>
												<span className='text-red-600 font-bold'>*</span>
											</label>
											<select
												id='yearOfStudySelect'
												name='yearOfStudy'
												value={formData.yearOfStudy}
												onChange={handleChange}
												className='form-input cursor-pointer font-medium h-[46px]'>
												{availableYears.map((yr) => (
													<option key={yr} value={yr}>
														{yr}
													</option>
												))}
											</select>
											<p className='text-xs text-slate-500 mt-1 font-medium'>
												Select your current academic batch.
											</p>
										</div>
										<div id='semester' className='space-y-1.5'>
											<label
												htmlFor='semesterSelect'
												className='flex items-center gap-1.5 text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544]'>
												<GraduationCap className='w-3.5 h-3.5 text-sky-700' />
												<span>4. Current Semester</span>
												<span className='text-red-600 font-bold'>*</span>
											</label>
											<select
												id='semesterSelect'
												name='semester'
												value={formData.semester}
												onChange={handleChange}
												className='form-input cursor-pointer font-medium h-[46px]'>
												{availableSemesters.map((sem) => (
													<option key={sem} value={sem}>
														{sem}
													</option>
												))}
											</select>
											<p className='text-xs text-slate-500 mt-1 font-medium'>
												Select ongoing semester.
											</p>
										</div>
									</div>

									{/* Row 3: 5. Reg No / Roll No & Gender */}
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 items-start'>
										<div id='regNumber' className='space-y-1.5'>
											<label
												htmlFor='regNumberInput'
												className='flex items-center gap-1.5 text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544]'>
												<Hash className='w-3.5 h-3.5 text-sky-700' />
												<span>
													5. {isFirstYear ? 'Reg No. / Roll No.' : 'University Reg No. / Roll No.'}
												</span>
												<span className='text-red-600 font-bold'>*</span>
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
												<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
													<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.regNumber}
												</p>
											) : (
												<p className='text-xs text-slate-500 mt-1 font-medium'>
													{isFirstYear
														? 'First-year cadets enter your registration number / roll number.'
														: 'Enter your permanent university registration number / roll number.'}
												</p>
											)}
										</div>
										<div className='space-y-1.5'>
											<label className='block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544]'>
												Gender <span className='text-red-600 font-bold'>*</span>
											</label>
											<div className='flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200/90 h-[46px]'>
												{['Male', 'Female'].map((g) => (
													<label
														key={g}
														className={`flex-1 text-center h-full flex items-center justify-center rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer touch-manipulation transition-all ${
															formData.gender === g
																? 'bg-[#0e2544] text-white shadow-xs'
																: 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/70'
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
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6'>
										<div id='email' className='space-y-1.5'>
											<label
												htmlFor='emailInput'
												className='flex items-center gap-1.5 text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544]'>
												<Mail className='w-3.5 h-3.5 text-sky-700' />
												<span>6. Email Address</span>
												<span className='text-red-600 font-bold'>*</span>
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
												<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
													<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.email}
												</p>
											)}
										</div>

										<div id='phone' className='space-y-1.5'>
											<label
												htmlFor='phoneInput'
												className='flex items-center gap-1.5 text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544]'>
												<Phone className='w-3.5 h-3.5 text-sky-700' />
												<span>7. Mobile Number</span>
												<span className='text-red-600 font-bold'>*</span>
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
												<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
													<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.phone}
												</p>
											)}
										</div>
									</div>

									{/* Passport Size Photo Upload */}
									<div
										id='photo'
										className='p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-sky-50/20 to-slate-50 shadow-2xs'>
										<label
											htmlFor='photoInput'
											className='block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544] mb-1'>
											Passport Size Photo <span className='text-red-600 font-bold'>*</span>
										</label>
										<p className='text-xs text-slate-500 mb-4'>
											Upload a clear passport size photograph (PNG, JPEG or JPG).
										</p>

										<div className='flex items-center gap-4 flex-wrap sm:flex-nowrap'>
											{formData.photoDataUrl ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img
													src={formData.photoDataUrl}
													alt='Cadet Preview'
													className='w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover border-2 border-sky-600 shadow-sm flex-shrink-0'
												/>
											) : (
												<div className='w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 text-[10px] font-bold flex-shrink-0 shadow-2xs'>
													<User className='w-7 h-7 mb-0.5 text-slate-400' />
													PHOTO
												</div>
											)}
											<div className='flex-1 min-w-[200px]'>
												<label className='inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider text-[#0e2544] bg-white hover:bg-slate-50 cursor-pointer shadow-2xs transition-all hover:border-slate-400'>
													<Upload className='w-4 h-4 text-sky-700' />
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
												<p className='text-xs text-slate-600 font-medium truncate mt-2'>
													{formData.photoName ? (
														<span className='font-bold text-emerald-700 flex items-center gap-1.5'>
															<Check className='w-4 h-4 text-emerald-600' /> {formData.photoName}
														</span>
													) : (
														'Accepts JPG, JPEG, PNG, up to 5MB'
													)}
												</p>
											</div>
										</div>
										{errors.photo && touched.photo && (
											<p className='text-xs font-semibold text-red-600 mt-2.5 flex items-center gap-1.5 animate-fadeIn'>
												<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.photo}
											</p>
										)}
									</div>
								</section>

								{/* ======================================================== */}
								{/* SECTION 2: ACADEMIC & RESEARCH PROFILE (Q8 - Q12) */}
								{/* ======================================================== */}
								<section
									id='section-2'
									className={`space-y-7 ${currentStep === 2 ? 'block animate-fadeIn' : 'hidden'}`}>
									<div className='flex items-center justify-between border-b border-slate-200 pb-4'>
										<div className='flex items-center gap-3'>
											<div className='w-10 h-10 rounded-xl bg-gradient-to-br from-[#0e2544] to-[#163866] text-white flex items-center justify-center font-bold text-sm shadow-xs'>
												<GraduationCap className='w-5 h-5 text-sky-300' />
											</div>
											<div>
												<h2 className='text-lg sm:text-xl font-extrabold text-[#0e2544] uppercase tracking-wide leading-snug sm:leading-tight font-heading'>
													Academic & Research Profile
												</h2>
												<p className='text-xs sm:text-[13px] text-slate-500 font-medium'>
													Questions 8 to 11 • Cadets should only upload the first page of their work
													in PDF format
												</p>
											</div>
										</div>
										<span className='section-badge'>Section 2 of 5</span>
									</div>

									{/* Section 2 Guideline Notice */}

									{/* Question 8: Current CGPA */}
									<div id='cgpa' className='section-container space-y-3'>
										<div className='flex items-center justify-between mb-1 flex-wrap gap-2'>
											<div>
												<label
													htmlFor='cgpaInput'
													className='text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544] block'>
													8. Current CGPA{' '}
													{!isFirstYear && <span className='text-red-600 font-bold'>*</span>}
												</label>
											</div>
											<span className='text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200'>
												{isFirstYear ? 'Exempted for first semester cadets' : 'Mention your CGPA'}
											</span>
										</div>

										<div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 items-start'>
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
															? 'bg-slate-100 text-slate-500 cursor-not-allowed select-none border-slate-200 font-bold'
															: errors.cgpa && touched.cgpa
																? 'input-error'
																: ''
													}`}
												/>
												{errors.cgpa && touched.cgpa && !isFirstYear && (
													<p className='text-xs font-semibold text-red-600 mt-2 flex items-center gap-1.5 animate-fadeIn'>
														<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.cgpa}
													</p>
												)}
											</div>
										</div>
									</div>

									{/* Question 9: Journal / Book Chapter Publications */}
									<div className='section-container space-y-4'>
										<div className='flex items-center justify-between flex-wrap gap-3'>
											<div>
												<div className='flex items-center gap-2 flex-wrap'>
													<label className='text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544]'>
														9. Journal / Book Chapter Publications, if any
													</label>
												</div>
												<span className='text-xs text-slate-500 font-medium block mt-1'>
													Mention Journal / Book chapter details & upload publication proof PDF
												</span>
											</div>
											{/* N/A Toggle */}
											<div className='flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200'>
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
															? 'bg-[#0e2544] text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													NIL
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
											<div className='pt-3.5 space-y-3.5 border-t border-slate-200 animate-fadeIn'>
												<div>
													<label className='block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544] mb-1.5'>
														Journal / Book Chapter Publication Details{' '}
														<span className='text-red-600 font-bold'>*</span>
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
														<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
															<AlertCircle className='w-4 h-4 flex-shrink-0' />{' '}
															{errors.journalDetails}
														</p>
													)}
												</div>

												<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl'>
													<label className='inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider text-[#0e2544] bg-white hover:bg-slate-50 cursor-pointer shadow-2xs transition-all flex-shrink-0 hover:border-slate-400'>
														<Upload className='w-4 h-4 text-sky-700' />
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
													<span className='text-xs text-slate-700 font-medium truncate flex-1'>
														{formData.journalFileName ? (
															<span className='text-emerald-700 font-bold flex items-center gap-1.5'>
																<FileCheck className='w-4 h-4 text-emerald-600 flex-shrink-0' />{' '}
																{formData.journalFileName}
															</span>
														) : (
															<span className='text-slate-500 font-medium'>
																Upload publication / chapter proof PDF (First page only){' '}
																<span className='text-red-600 font-bold'>*</span>
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
															className='text-xs font-bold text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50 transition-colors'>
															<Trash2 className='w-4 h-4' />
														</button>
													)}
												</div>
												{errors.journalFile && touched.journalFile && (
													<p className='text-xs font-semibold text-red-600 flex items-center gap-1.5 animate-fadeIn'>
														<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.journalFile}
													</p>
												)}
											</div>
										)}
									</div>

									{/* Question 10: Patents / Design Registrations / Copyrights */}
									<div className='section-container space-y-4'>
										<div className='flex items-center justify-between flex-wrap gap-3'>
											<div>
												<div className='flex items-center gap-2 flex-wrap'>
													<label className='text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544]'>
														10. Patents / Design Registrations / Copyrights, if any
													</label>
												</div>
												<span className='text-xs text-slate-500 font-medium block mt-1'>
													Mention IPR details & upload certificate / filing document in PDF
												</span>
											</div>
											{/* N/A Toggle */}
											<div className='flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200'>
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
															? 'bg-[#0e2544] text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													NIL
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
											<div className='pt-3.5 space-y-3.5 border-t border-slate-200 animate-fadeIn'>
												<div>
													<label className='block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544] mb-1.5'>
														Patent / IPR Details <span className='text-red-600 font-bold'>*</span>
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
														<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
															<AlertCircle className='w-4 h-4 flex-shrink-0' />{' '}
															{errors.patentDetails}
														</p>
													)}
												</div>

												<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl'>
													<label className='inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider text-[#0e2544] bg-white hover:bg-slate-50 cursor-pointer shadow-2xs transition-all flex-shrink-0 hover:border-slate-400'>
														<Upload className='w-4 h-4 text-sky-700' />
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
													<span className='text-xs text-slate-700 font-medium truncate flex-1'>
														{formData.patentFileName ? (
															<span className='text-emerald-700 font-bold flex items-center gap-1.5'>
																<FileCheck className='w-4 h-4 text-emerald-600 flex-shrink-0' />{' '}
																{formData.patentFileName}
															</span>
														) : (
															<span className='text-slate-500 font-medium'>
																Upload patent / filing PDF (First page only){' '}
																<span className='text-red-600 font-bold'>*</span>
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
															className='text-xs font-bold text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50 transition-colors'>
															<Trash2 className='w-4 h-4' />
														</button>
													)}
												</div>
												{errors.patentFile && touched.patentFile && (
													<p className='text-xs font-semibold text-red-600 flex items-center gap-1.5 animate-fadeIn'>
														<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.patentFile}
													</p>
												)}
											</div>
										)}
									</div>

									{/* Question 11: Participation in Competitions / Hackathons */}
									<div className='section-container space-y-4'>
										<div className='flex items-center justify-between flex-wrap gap-3'>
											<div>
												<div className='flex items-center gap-2 flex-wrap'>
													<label className='text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544]'>
														11. Competitions / Hackathons / Technothons, if any
													</label>
												</div>
												<span className='text-xs text-slate-500 font-medium block mt-1'>
													Mention competitions and upload certificate in PDF.
												</span>
											</div>
											{/* N/A Toggle */}
											<div className='flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200'>
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
															? 'bg-[#0e2544] text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
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
															? 'bg-emerald-700 text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													+ I Have Participated
												</button>
											</div>
										</div>

										{formData.hasCompetitions && (
											<div className='pt-3.5 space-y-3.5 border-t border-slate-200 animate-fadeIn'>
												<div>
													<label className='block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544] mb-1.5'>
														Competition & Achievement Details{' '}
														<span className='text-red-600 font-bold'>*</span>
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
														<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
															<AlertCircle className='w-4 h-4 flex-shrink-0' />{' '}
															{errors.competitionDetails}
														</p>
													)}
												</div>

												<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl'>
													<label className='inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider text-[#0e2544] bg-white hover:bg-slate-50 cursor-pointer shadow-2xs transition-all flex-shrink-0 hover:border-slate-400'>
														<Upload className='w-4 h-4 text-sky-700' />
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
													<span className='text-xs text-slate-700 font-medium truncate flex-1'>
														{formData.competitionFileName ? (
															<span className='text-emerald-700 font-bold flex items-center gap-1.5'>
																<FileCheck className='w-4 h-4 text-emerald-600 flex-shrink-0' />{' '}
																{formData.competitionFileName}
															</span>
														) : (
															<span className='text-slate-500 font-medium'>
																Upload certificate PDF{' '}
																<span className='text-red-600 font-bold'>*</span>
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
															className='text-xs font-bold text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50 transition-colors'>
															<Trash2 className='w-4 h-4' />
														</button>
													)}
												</div>
												{errors.competitionFile && touched.competitionFile && (
													<p className='text-xs font-semibold text-red-600 flex items-center gap-1.5 animate-fadeIn'>
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
									className={`space-y-6 sm:space-y-7 ${currentStep === 3 ? 'block animate-fadeIn' : 'hidden'}`}>
									<div className='flex items-center justify-between border-b border-slate-200 pb-4'>
										<div className='flex items-center gap-3'>
											<div className='w-10 h-10 rounded-xl bg-gradient-to-br from-[#0e2544] to-[#163866] text-white flex items-center justify-center font-bold text-sm shadow-xs'>
												<Award className='w-5 h-5 text-sky-300' />
											</div>
											<div>
												<h2 className='text-lg sm:text-xl font-extrabold text-[#0e2544] uppercase tracking-wide leading-snug sm:leading-tight font-heading'>
													Co-Curricular & Leadership Profile
												</h2>
												<p className='text-xs sm:text-[13px] text-slate-500 font-medium'>
													Questions 12 to 14 • Activities, Awards & Leadership Positions
												</p>
											</div>
										</div>
										<span className='section-badge'>Section 3 of 5</span>
									</div>

									{/* Question 12: Technical / Co-Curricular Activities */}
									<div className='section-container space-y-4'>
										<div className='flex items-center justify-between flex-wrap gap-3'>
											<div>
												<div className='flex items-center gap-2 flex-wrap'>
													<label className='text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544]'>
														12. Activities / Events if any
													</label>
												</div>
												<span className='text-xs text-slate-500 font-medium block mt-1'>
													Mention the activity, event, and your role, and upload certificate in PDF
													.
												</span>
											</div>
											<div className='flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200'>
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
															? 'bg-[#0e2544] text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													NIL
												</button>
												<button
													type='button'
													onClick={() => setFormData((prev) => ({ ...prev, hasActivities: true }))}
													className={`na-toggle-btn ${
														formData.hasActivities
															? 'bg-emerald-700 text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													+ I Have Activities / Events
												</button>
											</div>
										</div>

										{formData.hasActivities && (
											<div className='pt-3.5 space-y-3.5 border-t border-slate-200 animate-fadeIn'>
												<div>
													<label className='block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544] mb-1.5'>
														Activity & Contribution Details{' '}
														<span className='text-red-600 font-bold'>*</span>
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
														<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
															<AlertCircle className='w-4 h-4 flex-shrink-0' />{' '}
															{errors.activityDetails}
														</p>
													)}
												</div>

												<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl'>
													<label className='inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider text-[#0e2544] bg-white hover:bg-slate-50 cursor-pointer shadow-2xs transition-all flex-shrink-0 hover:border-slate-400'>
														<Upload className='w-4 h-4 text-sky-700' />
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
													<span className='text-xs text-slate-700 font-medium truncate flex-1'>
														{formData.activityFileName ? (
															<span className='text-emerald-700 font-bold flex items-center gap-1.5'>
																<FileCheck className='w-4 h-4 text-emerald-600 flex-shrink-0' />{' '}
																{formData.activityFileName}
															</span>
														) : (
															<span className='text-slate-500 font-medium'>
																Upload certificate PDF{' '}
																<span className='text-red-600 font-bold'>*</span>
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
															className='text-xs font-bold text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50 transition-colors'>
															<Trash2 className='w-4 h-4' />
														</button>
													)}
												</div>
												{errors.activityFile && touched.activityFile && (
													<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
														<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.activityFile}
													</p>
												)}
											</div>
										)}
									</div>

									{/* Question 13: Major Achievements / Awards */}
									<div className='section-container space-y-4'>
										<div className='flex items-center justify-between flex-wrap gap-3'>
											<div>
												<div className='flex items-center gap-2 flex-wrap'>
													<label className='text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544]'>
														13. Participation in Conference / Awards, if any
													</label>
												</div>
												<span className='text-xs text-slate-500 font-medium block mt-1'>
													Mention the conference / award & upload certificate / proof in PDF.
												</span>
											</div>
											<div className='flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200'>
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
															? 'bg-[#0e2544] text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
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
															? 'bg-emerald-700 text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													+ I Have Participated / Won Awards
												</button>
											</div>
										</div>

										{formData.hasAchievements && (
											<div className='pt-3.5 space-y-3.5 border-t border-slate-200 animate-fadeIn'>
												<div>
													<label className='block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544] mb-1.5'>
														Participation & Award Details{' '}
														<span className='text-red-600 font-bold'>*</span>
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
														<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
															<AlertCircle className='w-4 h-4 flex-shrink-0' />{' '}
															{errors.achievementDetails}
														</p>
													)}
												</div>

												<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl'>
													<label className='inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider text-[#0e2544] bg-white hover:bg-slate-50 cursor-pointer shadow-2xs transition-all flex-shrink-0 hover:border-slate-400'>
														<Upload className='w-4 h-4 text-sky-700' />
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
													<span className='text-xs text-slate-700 font-medium truncate flex-1'>
														{formData.achievementFileName ? (
															<span className='text-emerald-700 font-bold flex items-center gap-1.5'>
																<FileCheck className='w-4 h-4 text-emerald-600 flex-shrink-0' />{' '}
																{formData.achievementFileName}
															</span>
														) : (
															<span className='text-slate-500 font-medium'>
																Upload award proof PDF{' '}
																<span className='text-red-600 font-bold'>*</span>
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
															className='text-xs font-bold text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50 transition-colors'>
															<Trash2 className='w-4 h-4' />
														</button>
													)}
												</div>
												{errors.achievementFile && touched.achievementFile && (
													<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
														<AlertCircle className='w-4 h-4 flex-shrink-0' />{' '}
														{errors.achievementFile}
													</p>
												)}
											</div>
										)}
									</div>

									{/* Question 14: Leadership / Coordinator Positions Held */}
									<div className='section-container space-y-4'>
										<div className='flex items-center justify-between flex-wrap gap-3'>
											<div>
												<div className='flex items-center gap-2 flex-wrap'>
													<label className='text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544]'>
														14. Leadership / Coordinator Positions Held, if any
													</label>
												</div>
												<span className='text-xs text-slate-500 font-medium block mt-1'>
													Mention position, organisation/club/event, duration, and responsibilities
													held.
												</span>
											</div>
											<div className='flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200'>
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
															? 'bg-[#0e2544] text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													NIL
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
											<div className='pt-3.5 space-y-3.5 border-t border-slate-200 animate-fadeIn'>
												<div>
													<label className='block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544] mb-1.5'>
														Leadership Role Details{' '}
														<span className='text-red-600 font-bold'>*</span>
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
														<p className='text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
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
									className={`space-y-6 sm:space-y-7 ${currentStep === 4 ? 'block animate-fadeIn' : 'hidden'}`}>
									<div className='flex items-center justify-between border-b border-slate-200 pb-4'>
										<div className='flex items-center gap-3'>
											<div className='w-10 h-10 rounded-xl bg-gradient-to-br from-[#0e2544] to-[#163866] text-white flex items-center justify-center font-bold text-sm shadow-xs'>
												<Lightbulb className='w-5 h-5 text-sky-300' />
											</div>
											<div>
												<h2 className='text-lg sm:text-xl font-extrabold text-[#0e2544] uppercase tracking-wide leading-snug sm:leading-tight font-heading'>
													Innovation & Problem-Solving
												</h2>
												<p className='text-xs sm:text-[13px] text-slate-500 font-medium'>
													Questions 15 to 17 • Vision, Ecosystem Challenges & Technology Interests
												</p>
											</div>
										</div>
										<span className='section-badge'>Section 4 of 5</span>
									</div>

									{/* Question 15: Maritime / University Ecosystem Problem */}
									<div id='problemMaritime' className='section-container space-y-3'>
										<div>
											<label
												htmlFor='problemMaritimeInput'
												className='text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544] block'>
												15. What is one Problem in the Indian Maritime University Ecosystem you
												would like to solve? <span className='text-red-600 font-bold'>*</span>
											</label>
											<p className='text-xs text-slate-500 font-medium leading-relaxed block mt-1'>
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
											<p className='text-xs font-semibold text-red-600 mt-1 flex items-center gap-1.5 animate-fadeIn'>
												<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.problemMaritime}
											</p>
										)}
										<div className='flex justify-end text-xs text-slate-400 font-mono font-semibold'>
											{formData.problemMaritime.length} characters
										</div>
									</div>

									{/* Question 16: Problem in Society */}
									<div id='problemSociety' className='section-container space-y-3'>
										<div>
											<label
												htmlFor='problemSocietyInput'
												className='text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544] block'>
												16. What is one Problem in Society you would like to solve?
												<span className='text-red-600 font-bold'>*</span>
											</label>
											<p className='text-xs text-slate-500 font-medium leading-relaxed block mt-1'>
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
											<p className='text-xs font-semibold text-red-600 mt-1 flex items-center gap-1.5 animate-fadeIn'>
												<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.problemSociety}
											</p>
										)}
										<div className='flex justify-end text-xs text-slate-400 font-mono font-semibold'>
											{formData.problemSociety.length} characters
										</div>
									</div>

									{/* Question 17: Area(s) of Innovation / Technology Interest */}
									<div id='areasOfInterest' className='section-container space-y-4'>
										<div>
											<label className='text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544] block'>
												17. Which area(s) of innovation / technology interest you most?{' '}
												<span className='text-red-600 font-bold'>*</span>
											</label>
											<p className='text-xs text-slate-500 font-medium mt-1 block'>
												Select at least 1 innovation domain from below or add custom areas.
											</p>
										</div>

										{/* Interactive Tag Chips */}
										<div className='flex flex-wrap gap-2.5 pt-1'>
											{SUGGESTED_INTERESTS.map((tag) => {
												const active = formData.areasOfInterest.includes(tag);
												return (
													<button
														key={tag}
														type='button'
														onClick={() => toggleInterest(tag)}
														className={`interest-tag-chip ${active ? 'active' : ''}`}>
														{active ? (
															<Check className='w-3.5 h-3.5 stroke-[2.5]' />
														) : (
															<Plus className='w-3.5 h-3.5' />
														)}
														<span>{tag}</span>
													</button>
												);
											})}
										</div>

										{/* Add Custom Tag */}
										<div className='flex gap-2.5 pt-2'>
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
												className='btn-secondary whitespace-nowrap text-xs flex items-center gap-1.5'>
												<Plus className='w-3.5 h-3.5 text-sky-700' /> Add Area
											</button>
										</div>

										{errors.areasOfInterest && (
											<p className='text-xs font-semibold text-red-600 mt-1 flex items-center gap-1.5 animate-fadeIn'>
												<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.areasOfInterest}
											</p>
										)}

										{formData.areasOfInterest.length > 0 && (
											<p className='text-xs font-bold text-emerald-800 mt-1.5 flex items-center gap-1.5 animate-fadeIn'>
												<Sparkles className='w-3.5 h-3.5 text-amber-500' />
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
									<div className='flex items-center justify-between border-b border-slate-200 pb-4'>
										<div className='flex items-center gap-3'>
											<div className='w-10 h-10 rounded-xl bg-gradient-to-br from-[#0e2544] to-[#163866] text-white flex items-center justify-center font-bold text-sm shadow-xs'>
												<ShieldCheck className='w-5 h-5 text-sky-300' />
											</div>
											<div>
												<h2 className='text-lg sm:text-xl font-extrabold text-[#0e2544] uppercase tracking-wide leading-snug sm:leading-tight font-heading'>
													Supporting Documents & Official Declaration
												</h2>
												<p className='text-xs sm:text-[13px] text-slate-500 font-medium'>
													Questions 18 & 19 • Resume / CV, Master PDF & Official Student Declaration
												</p>
											</div>
										</div>
										<span className='section-badge'>Section 5 of 5</span>
									</div>

									{/* Question 18: Upload Detailed Resume / CV (Optional / Recommended with 2 Tabs) */}
									<div id='resume' className='section-container space-y-4'>
										<div className='flex items-center justify-between flex-wrap gap-3'>
											<div>
												<div className='flex items-center gap-2 flex-wrap'>
													<label
														htmlFor='resumeInput'
														className='text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544]'>
														18. Upload Resume / CV (PDF)
													</label>
													<span className='text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full'>
														Recommended
													</span>
												</div>
												<span className='text-xs text-slate-500 font-medium block mt-1'>
													Upload your latest CV/resume in PDF format (strongly recommended for
													council evaluation, or select NIL if not available).
												</span>
											</div>

											{/* N/A / Upload Toggle Tabs */}
											<div className='flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200'>
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
															? 'bg-[#0e2544] text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													NIL
												</button>
												<button
													type='button'
													onClick={() => setFormData((prev) => ({ ...prev, hasResume: true }))}
													className={`na-toggle-btn ${
														formData.hasResume
															? 'bg-emerald-700 text-white shadow-xs'
															: 'text-slate-600 hover:text-slate-900'
													}`}>
													+ Upload Resume (Recommended)
												</button>
											</div>
										</div>

										{formData.hasResume && (
											<div className='pt-3.5 space-y-3.5 border-t border-slate-200 animate-fadeIn'>
												<div className='p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-50 to-slate-50 border border-sky-200 text-sky-950 text-xs sm:text-[13px] leading-relaxed space-y-1.5 shadow-2xs'>
													<span className='font-bold text-sky-950 block'>
														📌 Automatic Single Master PDF Storage:
													</span>
													<p className='text-sky-900 font-medium'>
														• Includes: Latest Resume, Semester Marksheets, Certificate Proofs,
														Awards & Positions.
													</p>
													<p className='text-sky-900 font-medium'>
														• Accepted Format: <strong>.pdf</strong> (Maximum size: 15MB).
													</p>
												</div>

												<div className='upload-dropzone flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl'>
													<label className='inline-flex items-center justify-center gap-2 px-5 py-3 border border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider text-[#0e2544] bg-white hover:bg-slate-50 cursor-pointer shadow-2xs transition-all flex-shrink-0 hover:border-slate-400'>
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
															<div className='flex items-center justify-between gap-2 bg-emerald-50 p-3 rounded-xl border border-emerald-200'>
																<span className='text-xs sm:text-sm font-bold text-emerald-900 truncate flex items-center gap-1.5'>
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
																	className='text-xs font-bold text-red-600 hover:text-red-800 px-2.5 py-1 rounded-lg bg-white border border-red-200 flex-shrink-0 hover:bg-red-50 transition-colors'>
																	Remove
																</button>
															</div>
														) : (
															<span className='text-xs sm:text-sm text-slate-500 font-medium'>
																No file chosen yet (.pdf up to 15MB)
															</span>
														)}
													</div>
												</div>

												{errors.resume && (
													<p className='text-xs font-semibold text-red-600 mt-2 flex items-center gap-1.5 animate-fadeIn'>
														<AlertCircle className='w-4 h-4 flex-shrink-0' /> {errors.resume}
													</p>
												)}
											</div>
										)}
									</div>

									{/* Question 19: Student Declaration */}
									<div id='declarationAccepted' className='section-container space-y-5'>
										<label className='text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#0e2544] block'>
											19. Student Declaration / Consent for Participation in IIC Activities{' '}
											<span className='text-red-600 font-bold'>*</span>
										</label>

										{/* Declaration Statement Box */}
										<div className='declaration-certificate-box p-5 sm:p-6 text-slate-800 text-xs sm:text-sm leading-relaxed'>
											<strong className='text-[#0e2544] font-bold block mb-2 uppercase tracking-wide text-xs sm:text-sm font-heading'>
												Declaration Statement:
											</strong>
											<p className='italic text-slate-700 leading-relaxed font-medium'>
												“I hereby declare that the information provided by me is true and correct to
												the best of my knowledge. I understand that submission of this form does not
												guarantee selection to the IIC Student Council. If selected, I agree to
												actively participate in IIC activities and contribute responsibly towards
												the innovation, research, entrepreneurship and related activities of the
												Institution.”
											</p>
										</div>

										{/* Declaration Consent Checkbox */}
										<label className='flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl border-2 border-slate-200 bg-white hover:border-[#0e2544]/60 cursor-pointer transition-all shadow-2xs'>
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
												className='mt-1 w-4 h-4 text-[#0e2544] rounded border-slate-300 focus:ring-[#0e2544] cursor-pointer'
											/>
											<div className='text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed select-none'>
												I have read, understood, and solemnly accept the Declaration above.
											</div>
										</label>

										{errors.declarationAccepted && touched.declarationAccepted && (
											<p className='text-xs font-semibold text-red-600 mt-2 flex items-center gap-1.5 animate-fadeIn'>
												<AlertCircle className='w-4 h-4 flex-shrink-0' />{' '}
												{errors.declarationAccepted}
											</p>
										)}

										{/* Digital Signature Confirmation Preview */}
										{formData.cadetName && (
											<div className='pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 flex-wrap gap-2'>
												<span>
													<strong className='text-slate-700'>Digital Signature:</strong>{' '}
													<span className='font-mono font-bold text-[#0e2544] uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200'>
														{formData.cadetName}
													</span>
												</span>
												<span>
													<strong className='text-slate-700'>Timestamp:</strong>{' '}
													{new Date().toLocaleDateString('en-GB')}
												</span>
											</div>
										)}
									</div>
								</section>

								{/* Submission Error Banner */}
								{submissionError && (
									<div className='p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs sm:text-sm space-y-1.5 animate-fadeIn'>
										<div className='flex items-center gap-2 font-bold text-rose-800'>
											<AlertCircle className='w-4 h-4 text-rose-600 flex-shrink-0' />
											<span>Submission Could Not Be Completed</span>
										</div>
										<p className='text-rose-900 leading-relaxed font-medium pl-6'>
											{submissionError}
										</p>
									</div>
								)}

								{/* ======================================================== */}
								{/* STEP NAVIGATION & SUBMIT CONTROLS */}
								{/* ======================================================== */}
								<div className='pt-7 border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3.5'>
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
										{/* On Steps 1 to 4: Only show "Next" Button */}
										{currentStep < 5 ? (
											<button
												type='button'
												onClick={nextStep}
												className='btn-primary w-full sm:w-auto flex items-center justify-center gap-2'>
												<span>Next: {SECTIONS[currentStep]?.title}</span>
												<ChevronRight className='w-4 h-4' />
											</button>
										) : (
											/* On Step 5: Show "Submit Enrollment Form" Button */
											<button
												type='submit'
												disabled={submitting}
												className='btn-primary w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 border-emerald-900 shadow-md'>
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
				<p className='text-center text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-wider mt-6 select-none'>
					Indian Maritime University • Kolkata Campus • IIC 2026–27
				</p>
				<p aria-hidden='true' className='text-center opacity-0'>
					Developed by Sreeram R
				</p>
			</div>
		</main>
	);
}
