const testPayload = {
  cadetName: 'PRAYAG K SANTHOSH',
  regNumber: '2023KC2325',
  email: 'test@example.com',
  phone: '9876543210',
  department: 'B.Tech Marine Engineering',
  yearOfStudy: '2nd Year',
  semester: '3rd Semester',
  gender: 'Male',
  cgpa: '8.50',
  referenceId: 'IIC-2627-2325',
  templateDocId: '1x69S7y0X7UJYR7x2ZEKCoQzPFCb-2nHctp6XNQG3E7I',
  hasResume: false,
  hasJournalPub: false,
  hasBookChapter: false,
  hasPatents: false,
  hasCompetitions: false,
  hasActivities: false,
  hasAchievements: false,
  hasLeadership: false,
  problemMaritime: 'Test maritime ecosystem challenge description.',
  problemSociety: 'Test society challenge description.',
  areasOfInterest: ['Artificial Intelligence / Machine Learning in Maritime'],
  declarationAccepted: true
};

async function testSubmit() {
  const url = 'https://script.google.com/macros/s/AKfycbzVklG1gmnnhi1wq6HVMTNr_1XcMADOURNKSJOHFTSDmZzUCPkSQzFWIHslsOIRU3M6/exec';
  console.log('Sending test request to new Google Apps Script URL...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(testPayload),
      redirect: 'follow'
    });
    console.log('HTTP Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testSubmit();
