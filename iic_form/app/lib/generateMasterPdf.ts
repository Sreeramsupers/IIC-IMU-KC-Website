/**
 * [DEPRECATED / REMOVED]
 * Consolidated Master PDF generation has been removed as requested.
 * All application form generation is handled directly through the Google Docs template,
 * and individual cadet PDFs (marksheet, resume, certificates) are attached directly.
 */

export interface CadetFormData {
	cadetName: string;
	regNumber: string;
	yearOfStudy: string;
	department: string;
	semester: string;
	gender: string;
	email: string;
	phone: string;
	photoName?: string;
	photoDataUrl?: string;
	cgpa?: string;
	marksheetStatus?: string;
	marksheetName?: string;
	marksheetDataUrl?: string;
	hasJournalPub?: boolean;
	journalDetails?: string;
	journalFileName?: string;
	journalFileDataUrl?: string;
	hasPatents?: boolean;
	patentDetails?: string;
	patentFileName?: string;
	patentFileDataUrl?: string;
	hasCompetitions?: boolean;
	competitionDetails?: string;
	competitionFileName?: string;
	competitionFileDataUrl?: string;
	hasActivities?: boolean;
	activityDetails?: string;
	activityFileName?: string;
	activityFileDataUrl?: string;
	hasAchievements?: boolean;
	achievementDetails?: string;
	achievementFileName?: string;
	achievementFileDataUrl?: string;
	hasLeadership?: boolean;
	leadershipDetails?: string;
	leadershipFileName?: string;
	leadershipFileDataUrl?: string;
	problemMaritime?: string;
	problemSociety?: string;
	areasOfInterest?: string[];
	customInterest?: string;
	hasResume?: boolean;
	resumeName?: string;
	resumeDataUrl?: string;
	declarationAccepted?: boolean;
}

export interface AttachmentItem {
	name: string;
	dataUrl: string;
	type?: string;
}
