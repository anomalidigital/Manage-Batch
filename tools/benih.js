/* Salin data/db.json ke dalam blok data awal di index.html supaya keduanya
   tidak pernah berbeda.  Pakai:  node tools/benih.js                        */
const fs = require('fs');
const path = require('path');
const akar = path.join(__dirname, '..');
const db = fs.readFileSync(path.join(akar, 'data', 'db.json'), 'utf8');
const f = path.join(akar, 'index.html');
let s = fs.readFileSync(f, 'utf8');
const a = s.indexOf('<script type="application/json" id="benih">');
const b = s.indexOf('</script>', a);
if (a < 0 || b < 0) { console.error('GAGAL: blok benih tidak ketemu'); process.exit(1); }
const isi = JSON.stringify(JSON.parse(db), null, 1);
s = s.slice(0, a) + '<script type="application/json" id="benih">\n' + isi + '\n' + s.slice(b);
fs.writeFileSync(f, s);
console.log('data awal di index.html disamakan dengan data/db.json (' + JSON.parse(db).projects.length + ' project)');
