const fs = require('fs');
const folderId = '1XZ5ucyZZpwZxHMg8ryD8fugGv8f3nwS7';
fetch(`https://drive.google.com/drive/folders/${folderId}`, {
  headers: { 'User-Agent': 'Mozilla/5.0' }
})
.then(r => r.text())
.then(html => {
  const idx = html.indexOf('Application_Form_SHASHWAT_PATEL');
  if (idx !== -1) {
    const chunk = html.slice(Math.max(0, idx - 500), idx + 500);
    console.log('Chunk around pdf:');
    console.log(chunk);
  }
});
