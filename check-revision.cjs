const fs = require('fs');
const content = fs.readFileSync('dist/sw.js', 'utf8');
const match = content.match(/\{"revision":"([^"]+)","url":"index\.html"\}/);
if (match) {
  console.log('INDEX_HTML_REVISION:', match[1]);
} else {
  console.log('NOT FOUND');
}
