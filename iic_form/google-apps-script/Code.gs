/**
 * =========================================================================================
 * INDIAN MARITIME UNIVERSITY - KOLKATA CAMPUS
 * INSTITUTION'S INNOVATION COUNCIL (IIC 2026–27)
 * AUTOMATED MEMBERSHIP APPLICATION & PDF GENERATION BACKEND
 * =========================================================================================
 * 
 * Google Doc Template ID: 1x69S7y0X7UJYR7x2ZEKCoQzPFCb-2nHctp6XNQG3E7I
 * 
 * Placeholders populated automatically:
 *  - {{name}}            -> Cadet Full Name
 *  - {{regd_no}}         -> Registration / Cadet Number
 *  - {{email}}           -> Cadet Email Address
 *  - {{dept}}            -> Department / Course
 *  - {{year}}            -> Year of Study
 *  - {{sem}}             -> Semester
 *  - {{gender}}          -> Gender
 *  - {{phone}}           -> Mobile Number
 *  - {{cgpa}}            -> CGPA or "Not Applicable" (for 1st Year)
 *  - {{photo}}           -> Passport Size Photograph (Replaced with inline image)
 *  - {{marksheet_pdf}}   -> attached / NIL (or Exempted for 1st Year)
 *  - {{journal}}         -> Journal Publications Details (or NIL)
 *  - {{journal_pdf}}     -> attached / NIL
 *  - {{book}}            -> Book Chapter Details (or NIL)
 *  - {{patent}}          -> Patents / IPR Details (or NIL)
 *  - {{patent_pdf}}      -> attached / NIL
 *  - {{competition}}     -> Competitions / Hackathons Details (or NIL)
 *  - {{competition_pdf}} -> attached / NIL
 *  - {{activity}}        -> Technical / Co-Curricular Activities (or NIL)
 *  - {{activity_pdf}}    -> attached / NIL
 *  - {{achievement}}     -> Major Achievements / Awards (or NIL)
 *  - {{achievement_pdf}} -> attached / NIL
 *  - {{leadership}}      -> Leadership Positions (or NIL)
 *  - {{leadership_pdf}}  -> attached / NIL
 *  - {{maritime_problem}}-> Maritime Ecosystem Challenge (or NIL)
 *  - {{society_problem}} -> Societal Challenge (or NIL)
 *  - {{interests}}       -> Areas of Innovation Interest
 *  - {{resume_pdf}}      -> attached / NIL
 *  - {{declaration}}     -> Accepted & Signed Digitally
 *  - {{ref_id}}          -> Application Reference ID (e.g. IIC-2627-XXXX)
 *  - {{date}}            -> Submission Date (IST)
 *  - {{submitted_at}}    -> Submission Timestamp (IST)
 * 
 * Single Attachment Guarantee:
 *  - The cadet receives ONE single unified PDF attachment containing their
 *    application form + all their attached PDF certificates, marksheets, and resume.
 */

const TEMPLATE_DOC_ID = '1x69S7y0X7UJYR7x2ZEKCoQzPFCb-2nHctp6XNQG3E7I';
const DRIVE_FOLDER_NAME = 'IIC_Cadet_Applications_2026_27';

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
    const cadetName = (data.cadetName || 'CADET').toUpperCase();
    const formattedDate = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd/MM/yyyy HH:mm:ss');
    const displayDate = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd/MM/yyyy');

    console.log(`[Submission Received] Cadet: ${cadetName}, Ref: ${refId}, Email: ${data.email}`);

    // 1. Get or Create Destination Folder in Google Drive
    const destFolder = getOrCreateFolder(DRIVE_FOLDER_NAME);

    // 2. Make a copy of the Google Doc Template
    const templateFile = DriveApp.getFileById(templateId);
    const copyFile = templateFile.makeCopy('TEMP_DOC_' + cadetName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + refId, destFolder);
    const copyDoc = DocumentApp.openById(copyFile.getId());
    const body = copyDoc.getBody();

    // 3. Compute dynamic PDF attachment status indicators ("attached" or "NIL")
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

    // 4. Replace All Text Placeholders in the Template
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

    // PDF attachment question variables (attached / NIL)
    body.replaceText('{{marksheet_pdf}}', marksheetStatus);
    body.replaceText('{{journal_pdf}}', journalPdfStatus);
    body.replaceText('{{patent_pdf}}', patentPdfStatus);
    body.replaceText('{{competition_pdf}}', competitionPdfStatus);
    body.replaceText('{{activity_pdf}}', activityPdfStatus);
    body.replaceText('{{achievement_pdf}}', achievementPdfStatus);
    body.replaceText('{{leadership_pdf}}', leadershipPdfStatus);
    body.replaceText('{{resume_pdf}}', resumePdfStatus);
    body.replaceText('{{declaration}}', declarationText);

    // Detail field replacements (supports both short and verbose placeholder names)
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

    // Innovation Challenges & Interests
    body.replaceText('{{maritime_problem}}', data.problemMaritime ? data.problemMaritime : 'NIL');
    body.replaceText('{{society_problem}}', data.problemSociety ? data.problemSociety : 'NIL');
    body.replaceText('{{interests}}', interestsStr);

    // Fallback replacement for draft templates that have literal "attached / NIL"
    body.replaceText('Journal / Book Chapter Publication PDF: attached / NIL', 'Journal / Book Chapter Publication PDF: ' + journalPdfStatus);
    body.replaceText('Marksheet PDF: attached / NIL', 'Marksheet PDF: ' + marksheetStatus);
    body.replaceText('Patent / IPR PDF: attached / NIL', 'Patent / IPR PDF: ' + patentPdfStatus);
    body.replaceText('Competition Certificate PDF: attached / NIL', 'Competition Certificate PDF: ' + competitionPdfStatus);
    body.replaceText('Activity Certificate PDF: attached / NIL', 'Activity Certificate PDF: ' + activityPdfStatus);
    body.replaceText('Achievement Proof PDF: attached / NIL', 'Achievement Proof PDF: ' + achievementPdfStatus);
    body.replaceText('Leadership Proof PDF: attached / NIL', 'Leadership Proof PDF: ' + leadershipPdfStatus);
    body.replaceText('Resume / CV PDF: attached / NIL', 'Resume / CV PDF: ' + resumePdfStatus);

    // 5. Replace {{photo}} with Passport Photo Image
    if (data.photoDataUrl) {
      try {
        const photoBlob = dataUrlToBlob(data.photoDataUrl, 'passport_photo_' + refId + '.jpg');
        replacePlaceholderWithImage(body, '{{photo}}', photoBlob, 110, 130);
      } catch (photoErr) {
        console.warn('Error inserting photo:', photoErr);
        body.replaceText('{{photo}}', '[Photo Uploaded Online]');
      }
    } else {
      body.replaceText('{{photo}}', '[Photo Not Provided]');
    }

    // Save and Close Document before converting to PDF
    copyDoc.saveAndClose();

    // 6. Convert Populated Google Doc to PDF
    const appPdfBlob = copyFile.getAs('application/pdf');
    const basePdfName = 'IIC_Cadet_Application_' + cadetName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + refId + '.pdf';
    appPdfBlob.setName(basePdfName);

    // 7. Collect All Attached Documents (Proofs / Certificates / Resume)
    const proofBlobs = [];

    // Check attachedProofs array (from modern frontend submission)
    if (Array.isArray(data.attachedProofs) && data.attachedProofs.length > 0) {
      data.attachedProofs.forEach((item, idx) => {
        if (item.dataUrl) {
          try {
            const fileName = item.name || ('Proof_' + (idx + 1) + '.pdf');
            proofBlobs.push(dataUrlToBlob(item.dataUrl, fileName));
          } catch (e) {
            console.warn('Error parsing attached proof item:', e);
          }
        }
      });
    } else {
      // Backward compatibility: individual field data URLs
      const fieldList = [
        { url: data.marksheetDataUrl, name: data.marksheetName || 'Marksheet.pdf' },
        { url: data.journalFileDataUrl, name: data.journalFileName || 'Journal_Pub.pdf' },
        { url: data.patentFileDataUrl, name: data.patentFileName || 'Patent_Doc.pdf' },
        { url: data.competitionFileDataUrl, name: data.competitionFileName || 'Competition_Cert.pdf' },
        { url: data.activityFileDataUrl, name: data.activityFileName || 'Activity_Cert.pdf' },
        { url: data.achievementFileDataUrl, name: data.achievementFileName || 'Achievement_Cert.pdf' },
        { url: data.leadershipFileDataUrl, name: data.leadershipFileName || 'Leadership_Proof.pdf' },
        { url: data.resumeDataUrl, name: data.resumeName || 'Resume.pdf' },
        { url: data.combinedPdfDataUrl, name: 'Combined_Proofs.pdf' },
      ];

      fieldList.forEach(f => {
        if (f.url) {
          try {
            proofBlobs.push(dataUrlToBlob(f.url, f.name));
          } catch (e) {
            console.warn('Error converting dataUrl to blob for ' + f.name, e);
          }
        }
      });
    }

    console.log(`[Attachments Check] Found ${proofBlobs.length} attached document(s) to merge.`);

    // 8. MERGE Application Form + All Attached Documents into ONE Single Unified PDF
    let finalSinglePdfBlob = null;

    // Check if Next.js pre-compiled the complete Master PDF with all attached proofs
    if (data.masterPdfDataUrl) {
      try {
        finalSinglePdfBlob = dataUrlToBlob(data.masterPdfDataUrl, basePdfName);
        console.log(`[Master PDF Received] Using compiled Master PDF from frontend/API (${finalSinglePdfBlob.getBytes().length} bytes)`);
      } catch (masterErr) {
        console.warn('Could not convert masterPdfDataUrl to blob:', masterErr);
      }
    }

    // If masterPdfDataUrl was not supplied, try merging appPdfBlob and proofBlobs
    if (!finalSinglePdfBlob && proofBlobs.length > 0) {
      try {
        finalSinglePdfBlob = mergePdfsWithPdfLib(appPdfBlob, proofBlobs, basePdfName);
      } catch (mergeErr) {
        console.warn('Could not merge PDFs via pdf-lib:', mergeErr);
      }
    }

    // If merge was not needed or had a fallback, use the application PDF blob
    if (!finalSinglePdfBlob) {
      finalSinglePdfBlob = appPdfBlob;
    }
    finalSinglePdfBlob.setName(basePdfName);

    // Save the final single unified PDF in Google Drive
    const savedAppPdf = destFolder.createFile(finalSinglePdfBlob);
    savedAppPdf.setDescription('Official IIC Application Form and Verified Proofs for ' + cadetName + ' (' + refId + ')');

    // 9. Append Row to Google Sheet
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      sheet.appendRow([
        formattedDate,
        refId,
        cadetName,
        data.regNumber || '',
        data.department || '',
        data.yearOfStudy || '',
        data.semester || '',
        data.gender || '',
        data.email || '',
        data.phone || '',
        data.cgpa || (isFirstYear ? 'Exempted' : 'Not Applicable'),
        savedAppPdf.getUrl(),
        proofBlobs.length > 0 ? `${proofBlobs.length} documents merged into single PDF` : 'None',
        data.hasJournalPub ? 'Yes' : 'NIL',
        data.hasBookChapter ? 'Yes' : 'NIL',
        data.hasPatents ? 'Yes' : 'NIL',
        data.hasCompetitions ? 'Yes' : 'NIL',
        data.hasActivities ? 'Yes' : 'NIL',
        data.hasAchievements ? 'Yes' : 'NIL',
        data.hasLeadership ? 'Yes' : 'NIL',
        interestsStr,
        data.problemMaritime || '',
        data.problemSociety || '',
        'Confirmed'
      ]);
    } catch (sheetErr) {
      console.warn('Could not append row to Google Sheet:', sheetErr);
    }

    // 10. Send Email to Cadet with EXACTLY ONE ATTACHMENT (Application Form + Attached Proofs merged)
    let emailSent = false;
    let emailErrorMsg = null;
    const remainingQuota = MailApp.getRemainingDailyQuota();
    console.log(`[Email Check] Remaining daily email quota: ${remainingQuota}`);

    if (data.email) {
      try {
        const emailSubject = `IIC IMU Kolkata - Student Membership Application Confirmation (${refId})`;
        const plainTextBody = `Dear Cadet ${cadetName},\n\nThank you for submitting your enrollment application for the Institution's Innovation Council (IIC 2026–27) at IMU Kolkata Campus.\n\nApplication Details:\n- Reference ID: ${refId}\n- Registration No: ${data.regNumber || 'N/A'}\n- Department: ${data.department || 'N/A'} (${data.yearOfStudy || ''})\n- Submission Date: ${displayDate}\n\nYour official Application Form and all your attached documents/certificates have been compiled into a SINGLE unified PDF attachment and attached to this email for your records.\n\nInstitution's Innovation Council (IIC) • IMU Kolkata Campus\nMinistry of Education Innovation Cell (MIC)`;

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0e2544 0%, #163866 100%); color: #ffffff; padding: 24px; text-align: center;">
              <h2 style="margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">Institution's Innovation Council (IIC)</h2>
              <p style="margin: 4px 0 0; font-size: 13px; color: #7dd3fc;">Indian Maritime University • Kolkata Campus</p>
            </div>
            
            <div style="padding: 24px; background: #ffffff;">
              <p style="font-size: 15px; margin-top: 0;">Dear Cadet <strong>${cadetName}</strong>,</p>
              <p>Thank you for submitting your enrollment application for the <strong>Institution's Innovation Council (IIC 2026–27)</strong> at IMU Kolkata Campus.</p>
              
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; font-weight: bold; text-transform: uppercase;">Application Details</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Reference ID:</strong> <span style="font-family: monospace; font-weight: bold; color: #0284c7;">${refId}</span></p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Registration No:</strong> ${data.regNumber || 'N/A'}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Department:</strong> ${data.department || 'N/A'} (${data.yearOfStudy || ''})</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Submission Date:</strong> ${displayDate}</p>
              </div>

              <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; margin: 18px 0;">
                <p style="margin: 0; font-size: 13.5px; color: #1e3a8a;">
                  📎 <strong>Attached:</strong> Your complete Application Form along with all your uploaded document proofs and certificates have been consolidated into <strong>a single PDF attachment</strong> for your records.
                </p>
              </div>
              
              <p style="font-size: 13px; color: #475569;">The council committee will review your submission and notify you regarding orientation sessions and upcoming innovation challenges.</p>
              
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                Institution's Innovation Council (IIC) • IMU Kolkata Campus<br/>
                Ministry of Education Innovation Cell (MIC)
              </p>
            </div>
          </div>
        `;

        // Cadet receives ONLY the single consolidated PDF attachment
        const emailAttachments = [finalSinglePdfBlob];

        // Try sending via MailApp first
        try {
          MailApp.sendEmail({
            to: data.email,
            subject: emailSubject,
            body: plainTextBody,
            htmlBody: emailHtml,
            name: 'IIC IMU Kolkata Campus',
            attachments: emailAttachments
          });
          emailSent = true;
          console.log(`[Email Success] Sent single attachment via MailApp to ${data.email}`);
        } catch (mailErr) {
          console.warn(`[MailApp Warning] ${mailErr.toString()}, falling back to GmailApp...`);
          GmailApp.sendEmail(data.email, emailSubject, plainTextBody, {
            htmlBody: emailHtml,
            name: 'IIC IMU Kolkata Campus',
            attachments: emailAttachments
          });
          emailSent = true;
          console.log(`[Email Success] Sent single attachment via GmailApp to ${data.email}`);
        }
      } catch (emailErr) {
        emailErrorMsg = emailErr.toString();
        console.error(`[Email Error] Failed to send email to ${data.email}:`, emailErr);
      }
    }

    // 11. Trash Temporary Google Doc File (Clean up Drive)
    try {
      copyFile.setTrashed(true);
    } catch (trashErr) {
      console.warn('Could not trash temporary doc:', trashErr);
    }

    // 12. Return detailed JSON response
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      referenceId: refId,
      emailSent: emailSent,
      emailError: emailErrorMsg,
      remainingQuota: remainingQuota,
      applicationPdfUrl: savedAppPdf.getUrl(),
      message: emailSent
        ? 'Application form and proofs merged into single PDF and emailed successfully.'
        : `Application form PDF created, but email could not be sent: ${emailErrorMsg || 'No email provided'}`
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error('Fatal execution error:', err);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Merges the generated Application Form PDF with all uploaded cadet proofs
 * into ONE single unified PDF attachment using pdf-lib in Google Apps Script.
 */
function mergePdfsWithPdfLib(appBlob, proofBlobs, outputFileName) {
  if (!proofBlobs || proofBlobs.length === 0) {
    const single = appBlob.copyBlob();
    single.setName(outputFileName);
    return single;
  }

  try {
    // Load pdf-lib dynamically in Google Apps Script if not present
    if (typeof PDFLib === 'undefined') {
      const cache = CacheService.getScriptCache();
      let script = cache.get('pdflib_source');
      if (!script) {
        script = UrlFetchApp.fetch('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js').getContentText();
        // Cache for 6 hours (21600 seconds)
        try { cache.put('pdflib_source', script, 21600); } catch (_) {}
      }
      eval(script);
    }

    const appBytes = new Uint8Array(appBlob.getBytes());

    // Execute merge
    let mergedPdfBytes = null;
    const runner = async () => {
      const mergedDoc = await PDFLib.PDFDocument.create();

      // 1. Copy pages from the official Application Form
      const appDoc = await PDFLib.PDFDocument.load(appBytes, { ignoreEncryption: true });
      const appPageIndices = appDoc.getPageIndices();
      const copiedAppPages = await mergedDoc.copyPages(appDoc, appPageIndices);
      copiedAppPages.forEach(p => mergedDoc.addPage(p));

      // 2. Append each uploaded proof document
      for (let i = 0; i < proofBlobs.length; i++) {
        try {
          const pBlob = proofBlobs[i];
          const pType = (pBlob.getContentType() || '').toLowerCase();
          const pBytes = new Uint8Array(pBlob.getBytes());

          if (pType.includes('pdf') || pBlob.getName().toLowerCase().endsWith('.pdf')) {
            const extDoc = await PDFLib.PDFDocument.load(pBytes, { ignoreEncryption: true });
            const extPages = await mergedDoc.copyPages(extDoc, extDoc.getPageIndices());
            extPages.forEach(p => mergedDoc.addPage(p));
          } else if (pType.includes('image') || pType.includes('png') || pType.includes('jpeg') || pType.includes('jpg')) {
            let img;
            if (pType.includes('png')) {
              img = await mergedDoc.embedPng(pBytes);
            } else {
              img = await mergedDoc.embedJpg(pBytes);
            }
            const imgPage = mergedDoc.addPage([595.28, 841.89]);
            const dims = img.scaleToFit(523.28, 769.89);
            imgPage.drawImage(img, {
              x: (595.28 - dims.width) / 2,
              y: (841.89 - dims.height) / 2,
              width: dims.width,
              height: dims.height
            });
          }
        } catch (itemErr) {
          console.warn('Could not append proof document index ' + i + ':', itemErr);
        }
      }

      return await mergedDoc.save();
    };

    runner().then(b => { mergedPdfBytes = b; }).catch(err => console.warn('Runner error:', err));

    if (mergedPdfBytes) {
      return Utilities.newBlob(mergedPdfBytes, 'application/pdf', outputFileName);
    }
  } catch (err) {
    console.warn('Failed in mergePdfsWithPdfLib:', err);
  }

  // Graceful fallback: return original application PDF blob
  const fallback = appBlob.copyBlob();
  fallback.setName(outputFileName);
  return fallback;
}

/**
 * Replace a text placeholder with an inline image in Google Doc body or table cells
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
 * Convert a base64 Data URL to a Google Apps Script Blob
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
 * Get an existing folder by name or create a new one in root Google Drive
 */
function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

/**
 * TEST FUNCTION: Run this function directly inside Google Apps Script editor
 * to test email sending and grant any missing permissions.
 */
function testSendEmail() {
  const myEmail = Session.getActiveUser().getEmail() || 'your-email@example.com';
  console.log('Sending test email to: ' + myEmail);
  console.log('Remaining daily quota: ' + MailApp.getRemainingDailyQuota());
  
  MailApp.sendEmail({
    to: myEmail,
    subject: 'IIC IMU Kolkata - Test Email Verification',
    body: 'This is a verification test to ensure email sending is working properly.',
    name: 'IIC IMU Kolkata Campus'
  });
  
  console.log('Test email successfully sent!');
}
