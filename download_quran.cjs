
const https = require('https');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'src', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const downloadFile = (url, filename) => {
  console.log(`Downloading ${filename}...`);
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(json, null, 2));
        console.log(`Saved ${filename}`);
      } catch (e) {
        console.error(`Error parsing ${filename}:`, e.message);
      }
    });
  }).on('error', (e) => {
    console.error(`Error downloading ${filename}:`, e.message);
  });
};

downloadFile('https://api.alquran.cloud/v1/quran/quran-uthmani', 'quran-uthmani.json');
downloadFile('https://api.alquran.cloud/v1/quran/en.sahih', 'quran-en.json');
