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
 *  - {{journal}}         -> Journal Publications Details (or NIL)
 *  - {{book}}            -> Book Chapter Details (or NIL)
 *  - {{patent}}          -> Patents / IPR Details (or NIL)
 *  - {{competition}}     -> Competitions / Hackathons Details (or NIL)
 *  - {{activity}}        -> Technical / Co-Curricular Activities (or NIL)
 *  - {{achievement}}     -> Major Achievements / Awards (or NIL)
 *  - {{leadership}}      -> Leadership Positions (or NIL)
 *  - {{maritime_problem}}-> Maritime Ecosystem Challenge (or NIL)
 *  - {{society_problem}} -> Societal Challenge (or NIL)
 *  - {{interests}}       -> Areas of Innovation Interest
 *  - {{ref_id}}          -> Application Reference ID (e.g. IIC-2627-XXXX)
 *  - {{date}}            -> Submission Date (IST)
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

    // 3. Replace Text Placeholders
    body.replaceText('{{name}}', cadetName);
    body.replaceText('{{regd_no}}', data.regNumber || '');
    body.replaceText('{{email}}', data.email || '');
    body.replaceText('{{dept}}', data.department || '');
    body.replaceText('{{year}}', data.yearOfStudy || '');
    body.replaceText('{{sem}}', data.semester || '');
    body.replaceText('{{gender}}', data.gender || '');
    body.replaceText('{{phone}}', data.phone || '');
    body.replaceText('{{cgpa}}', data.cgpa ? String(data.cgpa) : 'Not Applicable');
    body.replaceText('{{ref_id}}', refId);
    body.replaceText('{{date}}', displayDate);
    body.replaceText('{{submitted_at}}', formattedDate);

    // Activities & Achievements Placeholders (replace with details or NIL)
    body.replaceText('{{journal}}', data.hasJournalPub && data.journalDetails ? data.journalDetails : 'NIL');
    body.replaceText('{{book}}', data.hasBookChapter && data.bookChapterDetails ? data.bookChapterDetails : 'NIL');
    body.replaceText('{{patent}}', data.hasPatents && data.patentDetails ? data.patentDetails : 'NIL');
    body.replaceText('{{competition}}', data.hasCompetitions && data.competitionDetails ? data.competitionDetails : 'NIL');
    body.replaceText('{{activity}}', data.hasActivities && data.activityDetails ? data.activityDetails : 'NIL');
    body.replaceText('{{achievement}}', data.hasAchievements && data.achievementDetails ? data.achievementDetails : 'NIL');
    body.replaceText('{{leadership}}', data.hasLeadership && data.leadershipDetails ? data.leadershipDetails : 'NIL');
    
    // Innovation Challenges & Interests
    body.replaceText('{{maritime_problem}}', data.problemMaritime ? data.problemMaritime : 'NIL');
    body.replaceText('{{society_problem}}', data.problemSociety ? data.problemSociety : 'NIL');
    const interestsStr = Array.isArray(data.areasOfInterest) && data.areasOfInterest.length > 0
      ? data.areasOfInterest.join(', ')
      : 'NIL';
    body.replaceText('{{interests}}', interestsStr);

    // 4. Replace {{photo}} with Passport Photo Image
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

    // 5. Convert Populated Google Doc to PDF
    const appPdfBlob = copyFile.getAs('application/pdf');
    appPdfBlob.setName('Application_Form_' + cadetName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + refId + '.pdf');
    const savedAppPdf = destFolder.createFile(appPdfBlob);
    savedAppPdf.setDescription('Generated IIC Application Form for ' + cadetName + ' (' + refId + ')');

    // 6. Save Uploaded Proofs / Master PDF if provided
    let savedProofPdf = null;
    let proofPdfBlob = null;
    if (data.resumeDataUrl || data.combinedPdfDataUrl) {
      try {
        const masterDataUrl = data.combinedPdfDataUrl || data.resumeDataUrl;
        proofPdfBlob = dataUrlToBlob(masterDataUrl, 'Certificates_Proofs_' + cadetName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + refId + '.pdf');
        savedProofPdf = destFolder.createFile(proofPdfBlob);
        savedProofPdf.setDescription('Attached Certificates and Proofs for ' + cadetName + ' (' + refId + ')');
      } catch (proofErr) {
        console.warn('Error saving master proofs PDF:', proofErr);
      }
    }

    // 7. Append Row to Google Sheet
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
        data.cgpa || 'Not Applicable',
        savedAppPdf.getUrl(),
        savedProofPdf ? savedProofPdf.getUrl() : 'None',
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

    // 8. Send Email to Cadet with Application PDF & Proofs Attached
    let emailSent = false;
    let emailErrorMsg = null;
    const remainingQuota = MailApp.getRemainingDailyQuota();
    console.log(`[Email Check] Remaining daily email quota: ${remainingQuota}`);

    if (data.email) {
      try {
        const emailSubject = `IIC IMU Kolkata - Student Membership Application Confirmation (${refId})`;
        const plainTextBody = `Dear Cadet ${cadetName},\n\nThank you for submitting your enrollment application for the Institution's Innovation Council (IIC 2026–27) at IMU Kolkata Campus.\n\nApplication Details:\n- Reference ID: ${refId}\n- Registration No: ${data.regNumber || 'N/A'}\n- Department: ${data.department || 'N/A'} (${data.yearOfStudy || ''})\n- Submission Date: ${displayDate}\n\nYour official Application Form PDF has been generated and is attached to this email for your records.\n\nInstitution's Innovation Council (IIC) • IMU Kolkata Campus\nMinistry of Education Innovation Cell (MIC)`;

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

              <p style="font-size: 14px;">📎 <strong>Your official Application Form PDF has been generated and attached to this email for your records.</strong></p>
              
              <p style="font-size: 13px; color: #475569;">The council committee will review your submission and notify you regarding orientation sessions and upcoming innovation challenges.</p>
              
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                Institution's Innovation Council (IIC) • IMU Kolkata Campus<br/>
                Ministry of Education Innovation Cell (MIC)
              </p>
            </div>
          </div>
        `;

        const attachments = [appPdfBlob];
        if (proofPdfBlob) {
          attachments.push(proofPdfBlob);
        }

        // Try sending via MailApp first (Standard Google Apps Script Mail service)
        try {
          MailApp.sendEmail({
            to: data.email,
            subject: emailSubject,
            body: plainTextBody,
            htmlBody: emailHtml,
            name: 'IIC IMU Kolkata Campus',
            attachments: attachments
          });
          emailSent = true;
          console.log(`[Email Success] Sent via MailApp to ${data.email}`);
        } catch (mailErr) {
          console.warn(`[MailApp Warning] ${mailErr.toString()}, falling back to GmailApp...`);
          GmailApp.sendEmail(data.email, emailSubject, plainTextBody, {
            htmlBody: emailHtml,
            name: 'IIC IMU Kolkata Campus',
            attachments: attachments
          });
          emailSent = true;
          console.log(`[Email Success] Sent via GmailApp to ${data.email}`);
        }
      } catch (emailErr) {
        emailErrorMsg = emailErr.toString();
        console.error(`[Email Error] Failed to send email to ${data.email}:`, emailErr);
      }
    }

    // 9. Trash Temporary Google Doc File (Clean up Drive)
    try {
      copyFile.setTrashed(true);
    } catch (trashErr) {
      console.warn('Could not trash temporary doc:', trashErr);
    }

    // 10. Return detailed JSON response
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      referenceId: refId,
      emailSent: emailSent,
      emailError: emailErrorMsg,
      remainingQuota: remainingQuota,
      applicationPdfUrl: savedAppPdf.getUrl(),
      message: emailSent
        ? 'Application form PDF created and emailed successfully.'
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
