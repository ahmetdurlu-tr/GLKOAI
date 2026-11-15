const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'sw.js');
const appPath = path.join(__dirname, '..', 'app.js');
if (!fs.existsSync(swPath)) {
  console.error('sw.js not found at', swPath);
  process.exit(1);
}

const now = new Date();
const pad = (n, len = 2) => String(n).padStart(len, '0');
const today = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;

let content = fs.readFileSync(swPath, 'utf8');
const re = /const CACHE_VERSION = '([^']*)';/;
const match = content.match(re);
if (!match) {
  console.error('CACHE_VERSION declaration not found in sw.js');
  process.exit(1);
}

const prev = match[1];
let major = 66;
let seq = 1;
let prevDate = '';

const prevParts = prev.split('-');
if (prevParts.length >= 3) {
  const maybeDate = prevParts[0];
  const maybeMajor = prevParts[1];
  const maybeSeq = prevParts[2];
  if (/^[0-9]{8}$/.test(maybeDate)) prevDate = maybeDate;
  if (/^[0-9]{2,3}$/.test(maybeMajor)) major = parseInt(maybeMajor, 10);
  if (/^[0-9]{1,3}$/.test(maybeSeq)) seq = parseInt(maybeSeq, 10);
}

if (prevDate === today) {
  seq += 1;
} else {
  seq = 1;
}

if (seq > 999) {
  major += 1;
  seq = 1;
}

const version = `${today}-${pad(major, 2)}-${pad(seq, 3)}`;
content = content.replace(re, `const CACHE_VERSION = '${version}';`);
fs.writeFileSync(swPath, content);

if (!fs.existsSync(appPath)) {
  console.error('app.js not found at', appPath);
  process.exit(1);
}

let appContent = fs.readFileSync(appPath, 'utf8');
const appRe = /const SW_VERSION = '([^']*)';/;
if (!appRe.test(appContent)) {
  console.error('SW_VERSION declaration not found in app.js');
  process.exit(1);
}
appContent = appContent.replace(appRe, `const SW_VERSION = '${version}';`);
fs.writeFileSync(appPath, appContent);

console.log('CACHE_VERSION updated to', version);
