/**
 * =========================================================================================
 * INDIAN MARITIME UNIVERSITY - KOLKATA CAMPUS
 * INSTITUTION'S INNOVATION COUNCIL (IIC 2026–27)
 * AUTOMATED MEMBERSHIP APPLICATION & DRIVE ARCHIVAL BACKEND
 * =========================================================================================
 * 
 * Hierarchy in Google Drive:
 *   ROOT: "2026-27"
 *     └── [Year of Cadet] (e.g. "1st Year", "2nd Year", "3rd Year", "4th Year")
 *           └── [Cadet Name] (e.g. "JOHN DOE - REG12345")
 *                 ├── Application_Form_JOHN_DOE_IIC-2627-XXXX.pdf (Generated from Google Docs)
 *                 ├── Passport_Photo_JOHN_DOE.jpg
 *                 ├── Marksheet_JOHN_DOE.pdf
 *                 ├── Journal_Pub_JOHN_DOE.pdf
 *                 ├── Patent_Doc_JOHN_DOE.pdf
 *                 ├── Competition_Cert_JOHN_DOE.pdf
 *                 ├── Activity_Cert_JOHN_DOE.pdf
 *                 ├── Achievement_Cert_JOHN_DOE.pdf
 *                 ├── Leadership_Proof_JOHN_DOE.pdf
 *                 └── Resume_JOHN_DOE.pdf
 * 
 * Mailing & Attachment Policy:
 *   1. Cadets: No emails sent to cadets (Disabled as per policy).
 *   2. Faculty / Evaluation Panel: Submissions forwarded to configured faculty emails.
 *   3. Email Attachments:
 *        - Primary Attachment: Official Application Form PDF (Exported directly from Google Docs template).
 *        - Accompanying Attachments: All individual cadet uploaded PDFs (Marksheet, Certificates, Resume).
 *        - Notice: Consolidated PDF generation has been completely removed.
 */

// =========================================================================================
// CONFIGURATION
// =========================================================================================
const TEMPLATE_DOC_ID = '1hljBhK-tPtYN31i8P4n9QCuCHsdm_PaFrrBmEP9QCDw';
const ROOT_FOLDER_NAME = '2026-27';

/**
 * GOOGLE SPREADSHEET ID (Optional)
 * If this script was created inside the Google Sheet via "Extensions > Apps Script",
 * leave this empty (it automatically detects the active Sheet).
 * If running as a standalone script, paste your Google Sheet ID here:
 */
const SPREADSHEET_ID = '';

/**
 * REVIEWER / FACULTY / ADMIN FORWARDING EMAIL LIST
 * Add all email addresses that should receive the cadet submissions and attachments.
 * You can also pass emails from the Next.js backend via process.env.FORWARD_EMAILS.
 */
const FORWARD_EMAILS = [
  'sreerambhavanspkd@gmail.com'
  // Add additional faculty emails here (comma separated)
];

/**
 * Health check & verification GET handler
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    version: '2026-v3-GOOGLE-DOCS-DIRECT-ATTACHMENTS',
    message: 'IIC IMU Kolkata Enrollment Web Service is active. Google Docs PDF and direct document attachments enabled.',
    templateId: TEMPLATE_DOC_ID,
    facultyRecipients: FORWARD_EMAILS,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter || {};
    }

    const templateId = data.templateDocId || TEMPLATE_DOC_ID;
    const refId = data.referenceId || ('IIC-2627-' + Math.floor(1000 + Math.random() * 9000));
    const cadetName = (data.cadetName || 'CADET').toUpperCase().trim();
    const cleanCadetName = cadetName.replace(/[^a-zA-Z0-9]/g, '_');
    const formattedDate = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd/MM/yyyy HH:mm:ss');
    const displayDate = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd/MM/yyyy');

    console.log(`[Submission Received] Cadet: ${cadetName}, Ref: ${refId}, Email: ${data.email}`);

    // =====================================================================================
    // 1. GOOGLE DRIVE HIERARCHY: 2026-27 > Year of the cadet > Name > All their documents
    // =====================================================================================
    // Root Folder: "2026-27"
    const rootFolder = getOrCreateRootFolder(ROOT_FOLDER_NAME);

    // Year Subfolder: e.g. "1st Year", "2nd Year", "3rd Year", "4th Year"
    const yearFolderName = (data.yearOfStudy || 'Unspecified Year').trim();
    const yearFolder = getOrCreateSubFolder(rootFolder, yearFolderName);

    // Cadet Subfolder: e.g. "JOHN DOE - REG12345" or "JOHN DOE (IIC-2627-1234)"
    const cadetFolderName = cadetName + (data.regNumber ? (' - ' + data.regNumber.trim()) : (' (' + refId + ')'));
    const cadetFolder = getOrCreateSubFolder(yearFolder, cadetFolderName);

    console.log(`[Drive Hierarchy Created] Path: ${ROOT_FOLDER_NAME} > ${yearFolderName} > ${cadetFolderName}`);

    // =====================================================================================
    // 2. GENERATE OFFICIAL APPLICATION PDF FROM GOOGLE DOC TEMPLATE
    // =====================================================================================
    let savedAppPdf = null;
    let appPdfBlob = null;
    let copyFile = null;

    const isFirstYear = data.yearOfStudy === '1st Year' || data.semester === 'Semester 1';
    const marksheetStatus = data.marksheet_pdf || (isFirstYear ? 'NIL (Exempted for 1st Year)' : (data.marksheetDataUrl ? 'attached' : 'NIL'));
    const journalPdfStatus = data.journal_pdf || ((data.hasJournalPub && (data.journalFileDataUrl || data.journalFileName)) ? 'attached' : 'NIL');
    const patentPdfStatus = data.patent_pdf || ((data.hasPatents && (data.patentFileDataUrl || data.patentFileName)) ? 'attached' : 'NIL');
    const competitionPdfStatus = data.competition_pdf || ((data.hasCompetitions && (data.competitionFileDataUrl || data.competitionFileName)) ? 'attached' : 'NIL');
    const activityPdfStatus = data.activity_pdf || ((data.hasActivities && (data.activityFileDataUrl || data.activityFileName)) ? 'attached' : 'NIL');
    const achievementPdfStatus = data.achievement_pdf || ((data.hasAchievements && (data.achievementFileDataUrl || data.achievementFileName)) ? 'attached' : 'NIL');
    const leadershipPdfStatus = data.leadership_pdf || ((data.hasLeadership && (data.leadershipFileDataUrl || data.leadershipFileName)) ? 'attached' : 'NIL');
    const resumePdfStatus = data.resume_pdf || ((data.hasResume && (data.resumeDataUrl || data.resumeName)) ? 'attached' : 'NIL');

    const journalDetails = data.journalDetails || (data.hasJournalPub && data.journalDetails ? data.journalDetails : 'NIL');
    const bookDetails = data.bookChapterDetails || (data.hasBookChapter && data.bookChapterDetails ? data.bookChapterDetails : 'NIL');
    const patentDetails = data.patentDetails || (data.hasPatents && data.patentDetails ? data.patentDetails : 'NIL');
    const competitionDetails = data.competitionDetails || (data.hasCompetitions && data.competitionDetails ? data.competitionDetails : 'NIL');
    const activityDetails = data.activityDetails || (data.hasActivities && data.activityDetails ? data.activityDetails : 'NIL');
    const achievementDetails = data.achievementDetails || (data.hasAchievements && data.achievementDetails ? data.achievementDetails : 'NIL');
    const leadershipDetails = data.leadershipDetails || (data.hasLeadership && data.leadershipDetails ? data.leadershipDetails : 'NIL');
    const declarationText = data.declaration || (data.declarationAccepted ? 'Accepted and Signed Digitally' : 'Not Accepted');

    const interestsStr = data.interests || (Array.isArray(data.areasOfInterest) && data.areasOfInterest.length > 0
      ? data.areasOfInterest.join(', ')
      : 'NIL');

    // Find first valid accessible Google Doc template (new template first, fallback to configured/old)
    const candidateTemplateIds = [
      data.templateDocId,
      TEMPLATE_DOC_ID,
      '1hljBhK-tPtYN31i8P4n9QCuCHsdm_PaFrrBmEP9QCDw'
    ].filter(id => id && typeof id === 'string' && id.trim().length > 10);

    let templateFile = null;
    for (const testId of candidateTemplateIds) {
      try {
        templateFile = DriveApp.getFileById(testId.trim());
        if (templateFile) {
          console.log(`[Template Success] Found valid template doc ID: ${testId}`);
          break;
        }
      } catch (tErr) {
        console.warn(`[Template Warning] Template ID ${testId} not accessible:`, tErr.toString());
      }
    }

    if (templateFile) {
      try {
        copyFile = templateFile.makeCopy('TEMP_DOC_' + cleanCadetName + '_' + refId, cadetFolder);
        const copyDoc = DocumentApp.openById(copyFile.getId());
        const body = copyDoc.getBody();

        // Replace Placeholders in Google Doc with cadet form data
        body.replaceText('{{name}}', cadetName);
        body.replaceText('{{regd_no}}', data.regNumber || '');
        body.replaceText('{{email}}', data.email || '');
        body.replaceText('{{dept}}', data.department || '');
        body.replaceText('{{year}}', data.yearOfStudy || '');
        body.replaceText('{{sem}}', data.semester || '');
        body.replaceText('{{gender}}', data.gender || '');
        body.replaceText('{{phone}}', data.phone || '');
        body.replaceText('{{cgpa}}', data.cgpa ? String(data.cgpa) : (isFirstYear ? 'Exempted for 1st Year' : 'Not Applicable'));
        body.replaceText('{{ref_id}}', refId);
        body.replaceText('{{date}}', displayDate);
        body.replaceText('{{submitted_at}}', formattedDate);

        body.replaceText('{{marksheet_pdf}}', marksheetStatus);
        body.replaceText('{{journal_pdf}}', journalPdfStatus);
        body.replaceText('{{patent_pdf}}', patentPdfStatus);
        body.replaceText('{{competition_pdf}}', competitionPdfStatus);
        body.replaceText('{{activity_pdf}}', activityPdfStatus);
        body.replaceText('{{achievement_pdf}}', achievementPdfStatus);
        body.replaceText('{{leadership_pdf}}', leadershipPdfStatus);
        body.replaceText('{{resume_pdf}}', resumePdfStatus);
        body.replaceText('{{declaration}}', declarationText);

        body.replaceText('{{journal}}', journalDetails);
        body.replaceText('{{journal_details}}', journalDetails);
        body.replaceText('{{book}}', bookDetails);
        body.replaceText('{{book_details}}', bookDetails);
        body.replaceText('{{patent}}', patentDetails);
        body.replaceText('{{patent_details}}', patentDetails);
        body.replaceText('{{competition}}', competitionDetails);
        body.replaceText('{{competition_details}}', competitionDetails);
        body.replaceText('{{activity}}', activityDetails);
        body.replaceText('{{activity_details}}', activityDetails);
        body.replaceText('{{achievement}}', achievementDetails);
        body.replaceText('{{achievement_details}}', achievementDetails);
        body.replaceText('{{leadership}}', leadershipDetails);
        body.replaceText('{{leadership_details}}', leadershipDetails);

        body.replaceText('{{maritime_problem}}', data.problemMaritime ? data.problemMaritime : 'NIL');
        body.replaceText('{{society_problem}}', data.problemSociety ? data.problemSociety : 'NIL');
        body.replaceText('{{interests}}', interestsStr);

        // Fallbacks for literal template text if present
        body.replaceText('Journal / Book Chapter Publication PDF: attached / NIL', 'Journal / Book Chapter Publication PDF: ' + journalPdfStatus);
        body.replaceText('Marksheet PDF: attached / NIL', 'Marksheet PDF: ' + marksheetStatus);
        body.replaceText('Patent / IPR PDF: attached / NIL', 'Patent / IPR PDF: ' + patentPdfStatus);
        body.replaceText('Competition Certificate PDF: attached / NIL', 'Competition Certificate PDF: ' + competitionPdfStatus);
        body.replaceText('Activity Certificate PDF: attached / NIL', 'Activity Certificate PDF: ' + activityPdfStatus);
        body.replaceText('Achievement Proof PDF: attached / NIL', 'Achievement Proof PDF: ' + achievementPdfStatus);
        body.replaceText('Leadership Proof PDF: attached / NIL', 'Leadership Proof PDF: ' + leadershipPdfStatus);
        body.replaceText('Resume / CV PDF: attached / NIL', 'Resume / CV PDF: ' + resumePdfStatus);

        // Replace {{photo}} with Passport Photo
        if (data.photoDataUrl) {
          try {
            const photoBlob = dataUrlToBlob(data.photoDataUrl, 'passport_photo_' + refId + '.jpg');
            replacePlaceholderWithImage(body, '{{photo}}', photoBlob, 110, 130);
          } catch (photoErr) {
            console.warn('Error inserting photo into doc:', photoErr);
            body.replaceText('{{photo}}', '[Photo Uploaded Online]');
          }
        } else {
          body.replaceText('{{photo}}', '[Photo Not Provided]');
        }

        copyDoc.saveAndClose();

        // Export Official Application Form as PDF directly from Google Docs
        appPdfBlob = copyFile.getAs('application/pdf');
        const appPdfName = `Application_Form_${cleanCadetName}_${refId}.pdf`;
        appPdfBlob.setName(appPdfName);

        // Save official application form inside cadet's drive folder
        savedAppPdf = cadetFolder.createFile(appPdfBlob);
        savedAppPdf.setDescription(`Official IIC Application Form for ${cadetName} (${refId})`);
        try {
          savedAppPdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (_) {}

        // Clean up temporary Google Doc copy
        try {
          copyFile.setTrashed(true);
        } catch (trashErr) {
          console.warn('Could not trash temporary doc:', trashErr);
        }
      } catch (genErr) {
        console.warn('[Doc Gen Error] Could not generate PDF from template:', genErr);
      }
    }

    // Fallback if template PDF generation was not accessible
    if (!savedAppPdf) {
      console.warn('[Doc Warning] Google Doc template was not accessible. Generating text fallback.');
      appPdfBlob = Utilities.newBlob(
        `INDIAN MARITIME UNIVERSITY - KOLKATA CAMPUS\n` +
        `INSTITUTION'S INNOVATION COUNCIL (IIC 2026-27)\n` +
        `OFFICIAL ENROLLMENT APPLICATION\n\n` +
        `Cadet Name: ${cadetName}\n` +
        `Reference ID: ${refId}\n` +
        `Registration No: ${data.regNumber || 'N/A'}\n` +
        `Department: ${data.department || 'N/A'}\n` +
        `Year of Study: ${data.yearOfStudy || 'N/A'}\n` +
        `Semester: ${data.semester || 'N/A'}\n` +
        `CGPA: ${data.cgpa || 'N/A'}\n` +
        `Email: ${data.email || 'N/A'}\n` +
        `Phone: ${data.phone || 'N/A'}\n` +
        `Submitted At: ${formattedDate} (IST)\n\n` +
        `Maritime Problem: ${data.problemMaritime || 'N/A'}\n` +
        `Society Problem: ${data.problemSociety || 'N/A'}\n` +
        `Interests: ${interestsStr}\n\n` +
        `Declaration: ${declarationText}\n`,
        'text/plain',
        `Application_Form_${cleanCadetName}_${refId}.txt`
      );
      savedAppPdf = cadetFolder.createFile(appPdfBlob);
      try {
        savedAppPdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (_) {}
    }

    // =====================================================================================
    // 3. UPLOAD ALL CADET'S INDIVIDUAL DOCUMENTS TO THEIR DRIVE FOLDER & GATHER FOR EMAIL
    // =====================================================================================
    const savedCadetFiles = [];
    const uploadedDocumentBlobs = [];

    function saveAndCollectCadetFile(folder, dataUrl, filename, label, isDocumentProof) {
      if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.includes(',')) {
        return null;
      }
      try {
        const blob = dataUrlToBlob(dataUrl, filename);
        const file = folder.createFile(blob);
        try {
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (_) {}
        savedCadetFiles.push({ label: label, file: file, name: filename });
        if (isDocumentProof) {
          uploadedDocumentBlobs.push(blob);
        }
        return file;
      } catch (e) {
        console.warn(`[File Upload Error] Failed to save ${filename}:`, e);
        return null;
      }
    }

    // 1. Passport Photo (Saved to Drive, not attached to email as photo is in the doc)
    if (data.photoDataUrl) {
      saveAndCollectCadetFile(cadetFolder, data.photoDataUrl, `Passport_Photo_${cleanCadetName}.jpg`, 'Passport Photo', false);
    }

    // 2. Semester Marksheet (PDF)
    if (data.marksheetDataUrl) {
      const fileName = `Marksheet_${cleanCadetName}_${sanitizeFileName(data.marksheetName || 'Semester_Marksheet.pdf')}`;
      saveAndCollectCadetFile(cadetFolder, data.marksheetDataUrl, fileName, 'Semester Marksheet', true);
    }

    // 3. Journal Publication Proof (PDF)
    if (data.journalFileDataUrl) {
      const fileName = `Journal_Pub_${cleanCadetName}_${sanitizeFileName(data.journalFileName || 'Journal_Publication.pdf')}`;
      saveAndCollectCadetFile(cadetFolder, data.journalFileDataUrl, fileName, 'Journal Publication Proof', true);
    }

    // 4. Patent / IPR Proof (PDF)
    if (data.patentFileDataUrl) {
      const fileName = `Patent_Doc_${cleanCadetName}_${sanitizeFileName(data.patentFileName || 'Patent_IPR_Document.pdf')}`;
      saveAndCollectCadetFile(cadetFolder, data.patentFileDataUrl, fileName, 'Patent / IPR Document', true);
    }

    // 5. Competition / Hackathon Certificate (PDF)
    if (data.competitionFileDataUrl) {
      const fileName = `Competition_Cert_${cleanCadetName}_${sanitizeFileName(data.competitionFileName || 'Competition_Certificate.pdf')}`;
      saveAndCollectCadetFile(cadetFolder, data.competitionFileDataUrl, fileName, 'Competition Certificate', true);
    }

    // 6. Technical Activity Certificate (PDF)
    if (data.activityFileDataUrl) {
      const fileName = `Activity_Cert_${cleanCadetName}_${sanitizeFileName(data.activityFileName || 'Activity_Certificate.pdf')}`;
      saveAndCollectCadetFile(cadetFolder, data.activityFileDataUrl, fileName, 'Activity Certificate', true);
    }

    // 7. Achievement / Award Proof (PDF)
    if (data.achievementFileDataUrl) {
      const fileName = `Achievement_Cert_${cleanCadetName}_${sanitizeFileName(data.achievementFileName || 'Achievement_Certificate.pdf')}`;
      saveAndCollectCadetFile(cadetFolder, data.achievementFileDataUrl, fileName, 'Achievement Proof', true);
    }

    // 8. Leadership Proof (PDF)
    if (data.leadershipFileDataUrl) {
      const fileName = `Leadership_Proof_${cleanCadetName}_${sanitizeFileName(data.leadershipFileName || 'Leadership_Proof.pdf')}`;
      saveAndCollectCadetFile(cadetFolder, data.leadershipFileDataUrl, fileName, 'Leadership Proof', true);
    }

    // 9. Resume / CV (PDF)
    if (data.resumeDataUrl) {
      const fileName = `Resume_${cleanCadetName}_${sanitizeFileName(data.resumeName || 'Cadet_Resume.pdf')}`;
      saveAndCollectCadetFile(cadetFolder, data.resumeDataUrl, fileName, 'Resume / CV', true);
    }

    // 10. Additional attached proofs from attachedProofs array (if any)
    if (Array.isArray(data.attachedProofs)) {
      data.attachedProofs.forEach((item, idx) => {
        if (item && item.dataUrl) {
          const rawName = item.name || `Proof_${idx + 1}.pdf`;
          const sName = sanitizeFileName(rawName);
          // Avoid duplicate saving if already saved via individual fields above
          const alreadySaved = savedCadetFiles.some(f => f.name && f.name.includes(sName));
          if (!alreadySaved) {
            const fileName = `Attached_Proof_${idx + 1}_${cleanCadetName}_${sName}`;
            saveAndCollectCadetFile(cadetFolder, item.dataUrl, fileName, item.name || `Proof ${idx + 1}`, true);
          }
        }
      });
    }

    console.log(`[Drive Archival Complete] Saved ${savedCadetFiles.length} uploaded document(s) in: ${ROOT_FOLDER_NAME} > ${yearFolderName} > ${cadetFolderName}`);

    // =====================================================================================
    // 4. APPEND ROW TO GOOGLE SHEET
    // =====================================================================================
    try {
      const sheet = getTargetSheet();
      if (sheet) {
        appendCadetRowToSheet(sheet, {
          timestamp: formattedDate,
          refId: refId,
          cadetName: cadetName,
          regNumber: data.regNumber || '',
          department: data.department || '',
          yearOfStudy: data.yearOfStudy || '',
          semester: data.semester || '',
          gender: data.gender || '',
          email: data.email || '',
          phone: data.phone || '',
          cgpa: isFirstYear ? 'Exempted for 1st Year' : (data.cgpa ? String(data.cgpa) : 'Not Applicable'),
          appPdfUrl: savedAppPdf ? savedAppPdf.getUrl() : '',
          driveFolderUrl: cadetFolder ? cadetFolder.getUrl() : '',
          journal: data.hasJournalPub ? (data.journalDetails ? data.journalDetails : 'Yes (Attached)') : 'NIL',
          book: data.hasBookChapter ? (data.bookChapterDetails ? data.bookChapterDetails : 'Yes (Attached)') : 'NIL',
          patent: data.hasPatents ? (data.patentDetails ? data.patentDetails : 'Yes (Attached)') : 'NIL',
          competition: data.hasCompetitions ? (data.competitionDetails ? data.competitionDetails : 'Yes (Attached)') : 'NIL',
          activity: data.hasActivities ? (data.activityDetails ? data.activityDetails : 'Yes (Attached)') : 'NIL',
          achievement: data.hasAchievements ? (data.achievementDetails ? data.achievementDetails : 'Yes (Attached)') : 'NIL',
          leadership: data.hasLeadership ? (data.leadershipDetails ? data.leadershipDetails : 'Yes (Attached)') : 'NIL',
          interests: interestsStr,
          problemMaritime: data.problemMaritime || 'NIL',
          problemSociety: data.problemSociety || 'NIL'
        });
      } else {
        console.warn('[Google Sheet Warning] Google Sheet was not accessible. Check SPREADSHEET_ID or script container binding.');
      }
    } catch (sheetErr) {
      console.warn('Could not append row to Google Sheet:', sheetErr);
    }

    // =====================================================================================
    // 5. EMAIL TO CADET: DISABLED
    // =====================================================================================
    // As per policy, do NOT send confirmation email to cadets.
    const cadetEmailSent = false;
    const cadetEmailError = null;
    console.log(`[Cadet Email Policy] Email sending to cadet is disabled. No email dispatched to ${data.email || 'N/A'}.`);

    // =====================================================================================
    // 6. FORWARD ATTACHMENTS TO REVIEWER / FACULTY / ADMIN EMAIL LIST
    // =====================================================================================
    // Build combined forwarding recipient list (Script config + Backend payload)
    let recipientList = [...FORWARD_EMAILS];
    const incomingForward = data.forwardEmails || data.facultyEmails || data.facultyEmail;
    if (Array.isArray(incomingForward)) {
      incomingForward.forEach(em => {
        if (em && typeof em === 'string' && em.includes('@') && !recipientList.includes(em.trim())) {
          recipientList.push(em.trim());
        }
      });
    } else if (typeof incomingForward === 'string') {
      incomingForward.split(',').forEach(em => {
        const clean = em.trim();
        if (clean && clean.includes('@') && !recipientList.includes(clean)) {
          recipientList.push(clean);
        }
      });
    }

    // STRICT POLICY: Cadets must NEVER receive emails.
    // Strip cadet's email from recipientList if present
    const cadetEmailToExclude = (data.email || '').toLowerCase().trim();
    recipientList = recipientList.filter(em => {
      const clean = (em || '').toLowerCase().trim();
      return clean && clean !== cadetEmailToExclude;
    });

    // Automatically share Root Folder and Cadet Folder with all faculty recipients as Editors
    recipientList.forEach(facEmail => {
      try {
        if (facEmail && facEmail.includes('@')) {
          rootFolder.addEditor(facEmail);
          cadetFolder.addEditor(facEmail);
        }
      } catch (shareErr) {
        console.warn(`Could not add editor ${facEmail}:`, shareErr);
      }
    });

    let forwardEmailSent = false;
    let forwardEmailError = null;
    const forwardAttachments = [];

    // ===================================================================================
    // ATTACHMENTS FORWARDED TO FACULTY:
    // 1. Official Application Form PDF (Exported directly from Google Docs template)
    if (savedAppPdf) {
      try {
        const appBlob = savedAppPdf.getBlob().setName(`Application_Form_${cleanCadetName}_${refId}.pdf`);
        forwardAttachments.push(appBlob);
      } catch (blobErr) {
        if (appPdfBlob) forwardAttachments.push(appPdfBlob);
      }
    } else if (appPdfBlob) {
      forwardAttachments.push(appPdfBlob);
    }
    // 2. All individual cadet uploaded PDFs (Marksheet, Certificates, Resume)
    if (uploadedDocumentBlobs && uploadedDocumentBlobs.length > 0) {
      uploadedDocumentBlobs.forEach(blob => {
        forwardAttachments.push(blob);
      });
    }

    if (recipientList.length > 0) {
      try {
        console.log(`[Forwarding] Preparing email with attachments to ${recipientList.length} recipient(s): ${recipientList.join(', ')}`);

        const reviewerSubject = `[IIC 2026–27 Submission] ${cadetName} (${data.yearOfStudy || 'Year N/A'}) - Ref: ${refId}`;
        const driveFolderUrl = cadetFolder.getUrl();
        const appPdfUrl = savedAppPdf.getUrl();

        // Plaintext summary for reviewer email
        const attachmentsSummaryList = forwardAttachments.map(att => `  - ${att.getName()}`).join('\n');
        const reviewerPlainText = `IIC IMU Kolkata - New Cadet Application Received\n\n` +
          `Cadet Details:\n` +
          `- Name: ${cadetName}\n` +
          `- Reg No: ${data.regNumber || 'N/A'}\n` +
          `- Year of Study: ${data.yearOfStudy || 'N/A'}\n` +
          `- Department: ${data.department || 'N/A'}\n` +
          `- Semester: ${data.semester || 'N/A'}\n` +
          `- CGPA: ${data.cgpa || 'N/A'}\n` +
          `- Email: ${data.email || 'N/A'}\n` +
          `- Phone: ${data.phone || 'N/A'}\n` +
          `- Reference ID: ${refId}\n` +
          `- Submission Timestamp: ${formattedDate} (IST)\n\n` +
          `Google Drive Location:\n` +
          `${ROOT_FOLDER_NAME} > ${yearFolderName} > ${cadetFolderName}\n` +
          `Direct Folder Link: ${driveFolderUrl}\n\n` +
          `Attached to this email (${forwardAttachments.length} document(s)):\n` +
          `${attachmentsSummaryList}\n\n` +
          `Institution's Innovation Council (IIC) • IMU Kolkata Campus`;

        // HTML summary for reviewer email
        const attachmentHtmlItems = forwardAttachments.map((att, idx) => {
          const isMainForm = idx === 0;
          return `<li style="margin-bottom: 4px;"><strong>${att.getName()}</strong> ${isMainForm ? '<span style="color:#0284c7;font-size:12px;">(Official Application Form from Google Docs)</span>' : ''}</li>`;
        }).join('');

        const reviewerHtml = `
          <div style="font-family: Arial, Helvetica, sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b; line-height: 1.6; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; background: #ffffff;">
            <div style="background: #0e2544; color: #ffffff; padding: 20px 24px; border-bottom: 3px solid #d97706;">
              <h3 style="margin: 0; font-size: 18px; text-transform: uppercase;">New Cadet Application Submitted</h3>
              <p style="margin: 4px 0 0; font-size: 13px; color: #93c5fd;">IIC 2026–27 • Indian Maritime University, Kolkata Campus</p>
            </div>

            <div style="padding: 24px;">
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
                  <tr>
                    <td style="padding: 4px 0; color: #64748b; width: 38%;"><strong>Cadet Name:</strong></td>
                    <td style="padding: 4px 0; font-weight: bold; color: #0e2544;">${cadetName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;"><strong>Reference ID:</strong></td>
                    <td style="padding: 4px 0; font-family: monospace; font-weight: bold; color: #0284c7;">${refId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;"><strong>Registration No:</strong></td>
                    <td style="padding: 4px 0; font-weight: bold;">${data.regNumber || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;"><strong>Year & Dept:</strong></td>
                    <td style="padding: 4px 0;">${data.yearOfStudy || 'N/A'} • ${data.department || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;"><strong>Semester & CGPA:</strong></td>
                    <td style="padding: 4px 0;">${data.semester || 'N/A'} | CGPA: <strong>${data.cgpa || (isFirstYear ? 'Exempted' : 'N/A')}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;"><strong>Contact:</strong></td>
                    <td style="padding: 4px 0;">${data.email || 'N/A'} | ${data.phone || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;"><strong>Submitted At:</strong></td>
                    <td style="padding: 4px 0;">${formattedDate} (IST)</td>
                  </tr>
                </table>
              </div>

              <!-- GOOGLE DRIVE FOLDER BUTTON -->
              <div style="background: #eff6ff; border: 1.5px solid #3b82f6; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 22px;">
                <p style="margin: 0 0 10px; font-size: 13.5px; color: #1e3a8a; font-weight: bold;">
                  📁 Google Drive Repository Path:
                </p>
                <p style="margin: 0 0 14px; font-size: 13px; color: #1d4ed8; font-family: monospace;">
                  ${ROOT_FOLDER_NAME} &gt; ${yearFolderName} &gt; ${cadetFolderName}
                </p>
                <a href="${driveFolderUrl}" target="_blank" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 22px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
                  Open Cadet Drive Folder ↗
                </a>
              </div>

              <!-- ATTACHED DOCUMENTS LISTING -->
              <div style="background: #f0fdf4; border: 1.5px solid #22c55e; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <p style="margin: 0 0 8px; font-size: 13.5px; color: #15803d; font-weight: bold;">
                  📎 Documents Attached to this Email (${forwardAttachments.length} file${forwardAttachments.length === 1 ? '' : 's'}):
                </p>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #166534;">
                  ${attachmentHtmlItems}
                </ul>
              </div>

              <!-- QUALIFICATIONS & RESEARCH SUMMARY -->
              <h4 style="margin: 16px 0 8px; color: #0e2544; font-size: 14px; text-transform: uppercase;">Profile Highlights & Uploads</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; border: 1px solid #e2e8f0; margin-bottom: 18px;">
                <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
                  <th style="padding: 6px 10px; text-align: left;">Category</th>
                  <th style="padding: 6px 10px; text-align: left;">Details</th>
                  <th style="padding: 6px 10px; text-align: center;">Status</th>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 6px 10px; font-weight: bold;">Semester Marksheet</td>
                  <td style="padding: 6px 10px;">${data.cgpa || 'N/A'}</td>
                  <td style="padding: 6px 10px; text-align: center; color: ${marksheetStatus === 'attached' ? '#059669' : '#64748b'}; font-weight: bold;">${marksheetStatus}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 6px 10px; font-weight: bold;">Journal Publications</td>
                  <td style="padding: 6px 10px;">${journalDetails}</td>
                  <td style="padding: 6px 10px; text-align: center; color: ${journalPdfStatus === 'attached' ? '#059669' : '#64748b'}; font-weight: bold;">${journalPdfStatus}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 6px 10px; font-weight: bold;">Patents / IPR</td>
                  <td style="padding: 6px 10px;">${patentDetails}</td>
                  <td style="padding: 6px 10px; text-align: center; color: ${patentPdfStatus === 'attached' ? '#059669' : '#64748b'}; font-weight: bold;">${patentPdfStatus}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 6px 10px; font-weight: bold;">Hackathons / Competitions</td>
                  <td style="padding: 6px 10px;">${competitionDetails}</td>
                  <td style="padding: 6px 10px; text-align: center; color: ${competitionPdfStatus === 'attached' ? '#059669' : '#64748b'}; font-weight: bold;">${competitionPdfStatus}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 6px 10px; font-weight: bold;">Technical Activities</td>
                  <td style="padding: 6px 10px;">${activityDetails}</td>
                  <td style="padding: 6px 10px; text-align: center; color: ${activityPdfStatus === 'attached' ? '#059669' : '#64748b'}; font-weight: bold;">${activityPdfStatus}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 6px 10px; font-weight: bold;">Major Achievements</td>
                  <td style="padding: 6px 10px;">${achievementDetails}</td>
                  <td style="padding: 6px 10px; text-align: center; color: ${achievementPdfStatus === 'attached' ? '#059669' : '#64748b'}; font-weight: bold;">${achievementPdfStatus}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 6px 10px; font-weight: bold;">Leadership Roles</td>
                  <td style="padding: 6px 10px;">${leadershipDetails}</td>
                  <td style="padding: 6px 10px; text-align: center; color: ${leadershipPdfStatus === 'attached' ? '#059669' : '#64748b'}; font-weight: bold;">${leadershipPdfStatus}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; font-weight: bold;">Resume / CV</td>
                  <td style="padding: 6px 10px;">Detailed CV Document</td>
                  <td style="padding: 6px 10px; text-align: center; color: ${resumePdfStatus === 'attached' ? '#059669' : '#64748b'}; font-weight: bold;">${resumePdfStatus}</td>
                </tr>
              </table>

              <!-- INNOVATION RESPONSES -->
              <div style="background: #f8fafc; border-left: 4px solid #0e2544; padding: 12px; margin-bottom: 14px;">
                <p style="margin: 0 0 4px; font-size: 12.5px; font-weight: bold; color: #0e2544;">Problem in IMU Ecosystem Cadet Wants to Solve:</p>
                <p style="margin: 0; font-size: 13px; color: #334155;">${data.problemMaritime || 'None specified'}</p>
              </div>

              <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 12px; margin-bottom: 18px;">
                <p style="margin: 0 0 4px; font-size: 12.5px; font-weight: bold; color: #0284c7;">Problem in Society Cadet Wants to Solve:</p>
                <p style="margin: 0; font-size: 13px; color: #334155;">${data.problemSociety || 'None specified'}</p>
              </div>
            </div>
          </div>
        `;

        // Send email with attachments to all addresses in recipientList
        const recipientString = recipientList.join(',');
        try {
          MailApp.sendEmail({
            to: recipientString,
            subject: reviewerSubject,
            body: reviewerPlainText,
            htmlBody: reviewerHtml,
            name: 'IIC IMU Kolkata Portal',
            attachments: forwardAttachments
          });
          forwardEmailSent = true;
          console.log(`[Forwarding Success (MailApp)] Emailed ${forwardAttachments.length} attachment(s) to: ${recipientString}`);
        } catch (fMailErr) {
          console.warn(`[MailApp Warning] ${fMailErr.toString()}, falling back to GmailApp...`);
          try {
            GmailApp.sendEmail(recipientString, reviewerSubject, reviewerPlainText, {
              htmlBody: reviewerHtml,
              name: 'IIC IMU Kolkata Portal',
              attachments: forwardAttachments
            });
            forwardEmailSent = true;
            console.log(`[Forwarding Success (GmailApp)] Emailed ${forwardAttachments.length} attachment(s) to: ${recipientString}`);
          } catch (gmailErr) {
            console.warn(`[Attachment Warning] Email attachment size limit exceeded: ${gmailErr.toString()}. Retrying without attachment...`);
            try {
              MailApp.sendEmail({
                to: recipientString,
                subject: reviewerSubject + ' [Files in Drive]',
                body: reviewerPlainText + `\n\nNotice: Direct email attachment limit reached. Please view/download all files via Google Drive:\n${driveFolderUrl}`,
                htmlBody: reviewerHtml + `<div style="margin-top:16px;padding:12px;background:#fef3c7;border:1px solid #f59e0b;color:#92400e;border-radius:8px;font-size:13px;text-align:center;"><strong>Notice:</strong> Document attachment size exceeded email limits. All files (Google Docs Application Form, Marksheets, Certificates, Resume) are safely stored in Google Drive. Click the button above to view.</div>`,
                name: 'IIC IMU Kolkata Portal'
              });
              forwardEmailSent = true;
              console.log(`[Forwarding Success (Drive Link Fallback)] Emailed notice to: ${recipientString}`);
            } catch (noAttachErr) {
              forwardEmailError = noAttachErr.toString();
              console.error('[Forwarding Error] Failed to send email even without attachment:', noAttachErr);
            }
          }
        }
      } catch (fErr) {
        forwardEmailError = fErr.toString();
        console.error('[Forwarding Error] Could not forward email with attachments:', fErr);
      }
    } else {
      console.log('[Forwarding Notice] No forward emails configured in FORWARD_EMAILS list or request payload.');
    }

    // =====================================================================================
    // 7. RETURN JSON RESPONSE
    // =====================================================================================
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      version: '2026-v3-GOOGLE-DOCS-DIRECT-ATTACHMENTS',
      referenceId: refId,
      drivePath: `${ROOT_FOLDER_NAME} > ${yearFolderName} > ${cadetFolderName}`,
      driveFolderUrl: cadetFolder.getUrl(),
      applicationPdfUrl: savedAppPdf.getUrl(),
      cadetEmailSent: cadetEmailSent,
      cadetEmailError: cadetEmailError,
      forwardEmailSent: forwardEmailSent,
      forwardEmailError: forwardEmailError,
      forwardRecipientsCount: recipientList.length,
      filesUploadedCount: savedCadetFiles.length + 1,
      attachmentsSentCount: forwardAttachments ? forwardAttachments.length : 0
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (fatalErr) {
    console.error('Fatal execution error:', fatalErr);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: fatalErr.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================================
// HELPER FUNCTIONS
// =========================================================================================

/**
 * Gets or creates the Root folder in Google Drive (e.g. "2026-27")
 * and sets sharing permissions so faculties and link holders have instant access.
 */
function getOrCreateRootFolder(folderName) {
  const safeName = (folderName || '2026-27').trim();
  const folders = DriveApp.getFoldersByName(safeName);
  let folder;
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(safeName);
  }

  // Ensure Root Folder is viewable by anyone with the link
  try {
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    console.warn('Could not set link sharing on root folder:', e);
  }

  // Add default configured faculty emails as editors to the root folder
  if (Array.isArray(FORWARD_EMAILS)) {
    FORWARD_EMAILS.forEach(email => {
      try {
        if (email && email.includes('@')) {
          folder.addEditor(email);
        }
      } catch (_) {}
    });
  }

  return folder;
}

/**
 * Gets or creates a child folder inside a parent folder with shared permissions
 */
function getOrCreateSubFolder(parentFolder, childFolderName) {
  const safeName = (childFolderName || 'General').trim();
  const folders = parentFolder.getFoldersByName(safeName);
  let folder;
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = parentFolder.createFolder(safeName);
  }

  // Ensure subfolder is viewable by anyone with the link
  try {
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    console.warn('Could not set link sharing on subfolder:', e);
  }

  return folder;
}

/**
 * Sanitizes a filename for Google Drive storage and email attachments
 */
function sanitizeFileName(raw) {
  if (!raw) return 'document.pdf';
  return raw.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Converts a base64 Data URL to a Google Apps Script Blob
 */
function dataUrlToBlob(dataUrl, filename) {
  const parts = dataUrl.split(',');
  const meta = parts[0];
  const base64Data = parts[1] || parts[0];
  let mimeType = 'application/octet-stream';
  
  const mimeMatch = meta.match(/data:([^;]+);/);
  if (mimeMatch) {
    mimeType = mimeMatch[1];
  }
  
  const decodedBytes = Utilities.base64Decode(base64Data);
  return Utilities.newBlob(decodedBytes, mimeType, filename);
}

/**
 * Replaces a text placeholder with an inline image in Google Doc body or table cells
 */
function replacePlaceholderWithImage(body, placeholder, imageBlob, width, height) {
  let found = body.findText(placeholder);
  while (found) {
    const textElement = found.getElement();
    const parent = textElement.getParent();
    
    if (parent.getType() === DocumentApp.ElementType.PARAGRAPH) {
      const paragraph = parent.asParagraph();
      const image = paragraph.appendInlineImage(imageBlob);
      if (width && height) {
        image.setWidth(width);
        image.setHeight(height);
      }
      textElement.asText().replaceText(placeholder, '');
    } else if (parent.getType() === DocumentApp.ElementType.TABLE_CELL) {
      const cell = parent.asTableCell();
      const paragraph = cell.appendParagraph('');
      const image = paragraph.appendInlineImage(imageBlob);
      if (width && height) {
        image.setWidth(width);
        image.setHeight(height);
      }
      textElement.asText().replaceText(placeholder, '');
    } else {
      textElement.asText().replaceText(placeholder, '');
    }
    found = body.findText(placeholder, found);
  }
}

/**
 * Standard column headers for IIC Membership Application Sheet
 */
const STANDARD_HEADERS = [
  'Timestamp',
  'Reference ID',
  'Cadet Name',
  'Registration No',
  'Department',
  'Year of Study',
  'Semester',
  'Gender',
  'Cadet Email',
  'Phone Number',
  'CGPA',
  'Application Form PDF',
  'Google Drive Cadet Folder',
  'Journal Publications',
  'Book Chapters',
  'Patents / IPR',
  'Competitions / Hackathons',
  'Technical Activities',
  'Major Achievements',
  'Leadership Roles',
  'Areas of Interest',
  'Problem in IMU Ecosystem',
  'Problem in Society',
  'Status'
];

/**
 * Resolves the target Google Sheet from container binding or SPREADSHEET_ID
 */
function getTargetSheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      return ss.getActiveSheet();
    }
  } catch (e) {
    console.warn('getActiveSpreadsheet failed:', e);
  }

  if (typeof SPREADSHEET_ID !== 'undefined' && SPREADSHEET_ID && SPREADSHEET_ID.trim()) {
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
      if (ss) {
        return ss.getActiveSheet();
      }
    } catch (e) {
      console.warn('openById failed for SPREADSHEET_ID:', e);
    }
  }
  return null;
}

/**
 * Intelligent, Header-Aware Sheet Population
 * Maps each record field dynamically to the corresponding column header in Row 1.
 * Prevents misplaced columns, shifted data, or corrupted URLs.
 */
function appendCadetRowToSheet(sheet, record) {
  if (!sheet) {
    console.warn('[Sheet Error] No active Google Sheet available to append row.');
    return;
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  // If sheet is completely blank, initialize Row 1 with standard headers
  if (lastRow === 0 || lastCol === 0) {
    sheet.appendRow(STANDARD_HEADERS);
    const headerRange = sheet.getRange(1, 1, 1, STANDARD_HEADERS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#0E2544');
    headerRange.setFontColor('#FFFFFF');
    try {
      sheet.setFrozenRows(1);
    } catch (_) {}
  }

  // Read existing headers from Row 1
  const existingHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), STANDARD_HEADERS.length)).getValues()[0];

  // Structured map of values
  const map = {
    timestamp: record.timestamp || '',
    refId: record.refId || '',
    cadetName: record.cadetName || '',
    regNumber: record.regNumber ? "'" + record.regNumber.toString().trim() : '',
    department: record.department || '',
    yearOfStudy: record.yearOfStudy || '',
    semester: record.semester || '',
    gender: record.gender || '',
    email: record.email || '',
    phone: record.phone ? "'" + record.phone.toString().trim() : '',
    cgpa: record.cgpa || '',
    appPdf: record.appPdfUrl || '',
    driveFolder: record.driveFolderUrl || '',
    journal: record.journal || 'NIL',
    book: record.book || 'NIL',
    patent: record.patent || 'NIL',
    competition: record.competition || 'NIL',
    activity: record.activity || 'NIL',
    achievement: record.achievement || 'NIL',
    leadership: record.leadership || 'NIL',
    interests: record.interests || 'NIL',
    problemMaritime: record.problemMaritime || 'NIL',
    problemSociety: record.problemSociety || 'NIL',
    status: 'Submitted'
  };

  // Build row values matching each header column
  const rowValues = [];
  let matchedCount = 0;

  for (let i = 0; i < existingHeaders.length; i++) {
    const rawHeader = String(existingHeaders[i] || '').trim().toLowerCase();
    const h = rawHeader.replace(/[^a-z0-9]/g, '');

    if (!h) {
      rowValues.push('');
      continue;
    }

    if (h.includes('time') || h.includes('date')) {
      rowValues.push(map.timestamp);
      matchedCount++;
    } else if (h.includes('ref') || h.includes('applicationid')) {
      rowValues.push(map.refId);
      matchedCount++;
    } else if (h.includes('name') && !h.includes('book')) {
      rowValues.push(map.cadetName);
      matchedCount++;
    } else if (h.includes('reg') || h.includes('roll') || h.includes('cadetno')) {
      rowValues.push(map.regNumber);
      matchedCount++;
    } else if (h.includes('dept') || h.includes('course') || h.includes('branch')) {
      rowValues.push(map.department);
      matchedCount++;
    } else if (h.includes('year') && !h.includes('first')) {
      rowValues.push(map.yearOfStudy);
      matchedCount++;
    } else if (h.includes('sem')) {
      rowValues.push(map.semester);
      matchedCount++;
    } else if (h.includes('gender') || h.includes('sex')) {
      rowValues.push(map.gender);
      matchedCount++;
    } else if (h.includes('email') || h.includes('mail')) {
      rowValues.push(map.email);
      matchedCount++;
    } else if (h.includes('phone') || h.includes('mobile') || h.includes('contact')) {
      rowValues.push(map.phone);
      matchedCount++;
    } else if (h.includes('cgpa') || h.includes('gpa') || h.includes('marks')) {
      rowValues.push(map.cgpa);
      matchedCount++;
    } else if (h.includes('form') || (h.includes('app') && h.includes('pdf')) || h.includes('applicationform')) {
      rowValues.push(map.appPdf);
      matchedCount++;
    } else if (h.includes('master') || h.includes('consolidated') || h.includes('proof') || (h.includes('doc') && h.includes('pdf'))) {
      // Map any old consolidated proof column to drive folder URL
      rowValues.push(map.driveFolder || map.appPdf);
      matchedCount++;
    } else if (h.includes('drive') || h.includes('folder')) {
      rowValues.push(map.driveFolder);
      matchedCount++;
    } else if (h.includes('journal')) {
      rowValues.push(map.journal);
      matchedCount++;
    } else if (h.includes('book')) {
      rowValues.push(map.book);
      matchedCount++;
    } else if (h.includes('patent') || h.includes('ipr')) {
      rowValues.push(map.patent);
      matchedCount++;
    } else if (h.includes('comp') || h.includes('hackathon')) {
      rowValues.push(map.competition);
      matchedCount++;
    } else if (h.includes('act') || h.includes('technical')) {
      rowValues.push(map.activity);
      matchedCount++;
    } else if (h.includes('achieve') || h.includes('award')) {
      rowValues.push(map.achievement);
      matchedCount++;
    } else if (h.includes('leader')) {
      rowValues.push(map.leadership);
      matchedCount++;
    } else if (h.includes('interest')) {
      rowValues.push(map.interests);
      matchedCount++;
    } else if (h.includes('maritime') || h.includes('imu')) {
      rowValues.push(map.problemMaritime);
      matchedCount++;
    } else if (h.includes('society') || h.includes('social')) {
      rowValues.push(map.problemSociety);
      matchedCount++;
    } else if (h.includes('status')) {
      rowValues.push(map.status);
      matchedCount++;
    } else {
      rowValues.push('');
    }
  }

  // If fewer than 3 headers matched (e.g. unrecognized header layout), fallback to standard row sequence
  if (matchedCount < 3) {
    const defaultRow = [
      map.timestamp,
      map.refId,
      map.cadetName,
      map.regNumber,
      map.department,
      map.yearOfStudy,
      map.semester,
      map.gender,
      map.email,
      map.phone,
      map.cgpa,
      map.appPdf,
      map.driveFolder,
      map.journal,
      map.book,
      map.patent,
      map.competition,
      map.activity,
      map.achievement,
      map.leadership,
      map.interests,
      map.problemMaritime,
      map.problemSociety,
      map.status
    ];
    sheet.appendRow(defaultRow);
    console.log(`[Google Sheet] Appended standard positional row for ${record.cadetName} (${record.refId}).`);
  } else {
    sheet.appendRow(rowValues);
    console.log(`[Google Sheet] Appended header-matched row (${matchedCount} columns matched) for ${record.cadetName} (${record.refId}).`);
  }
}

/**
 * TEST FUNCTION: Run this in Google Apps Script editor to test permissions, folder creation, and sheet access
 */
function testDriveHierarchyAndMailing() {
  const root = getOrCreateRootFolder(ROOT_FOLDER_NAME);
  const testYear = getOrCreateSubFolder(root, 'Test Year');
  const testCadet = getOrCreateSubFolder(testYear, 'TEST CADET - 1234');
  
  console.log('Root Folder: ' + root.getName() + ' (' + root.getUrl() + ')');
  console.log('Year Folder: ' + testYear.getName());
  console.log('Cadet Folder: ' + testCadet.getName() + ' (' + testCadet.getUrl() + ')');
  console.log('Daily Mail Quota: ' + MailApp.getRemainingDailyQuota());

  // Test Sheet Connection
  const sheet = getTargetSheet();
  if (sheet) {
    console.log('Google Sheet Connected: ' + sheet.getParent().getName() + ' > Tab: ' + sheet.getName());
    console.log('Current Row Count: ' + sheet.getLastRow());
  } else {
    console.warn('WARNING: Google Sheet was NOT found. Ensure the script is bound to a Sheet or set SPREADSHEET_ID in Code.gs.');
  }

  // Test Template Doc Access
  try {
    const newDoc = DriveApp.getFileById('1hljBhK-tPtYN31i8P4n9QCuCHsdm_PaFrrBmEP9QCDw');
    console.log('Template Doc Connected: ' + newDoc.getName() + ' (' + newDoc.getId() + ')');
  } catch (err) {
    console.warn('NOTICE: Template Doc (1hljBhK-tPtYN31i8P4n9QCuCHsdm_PaFrrBmEP9QCDw) is not accessible to this Google account: ' + err.toString() + '. Please open that Google Doc and set Share > Anyone with link > Viewer/Editor.');
  }

  // Test email dispatch disabled to prevent unwanted test emails
  console.log('Drive hierarchy & sheet connection test completed successfully! (Email sending disabled in test function)');
}

/**
 * STANDALONE UTILITY: Run this once in Google Apps Script editor to share
 * the entire "2026-27" Root folder and its contents with all faculty members.
 */
function shareRootFolderWithFaculties() {
  const root = getOrCreateRootFolder(ROOT_FOLDER_NAME);
  try {
    root.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    console.warn('Could not set link sharing:', e);
  }

  FORWARD_EMAILS.forEach(em => {
    try {
      if (em && em.includes('@')) {
        root.addEditor(em);
        console.log(`[Shared with Faculty] Added editor: ${em}`);
      }
    } catch (e) {
      console.warn(`[Share Warning] Could not add ${em}:`, e);
    }
  });

  console.log('Root folder sharing completed!');
  console.log('Root Folder URL: ' + root.getUrl());
}
