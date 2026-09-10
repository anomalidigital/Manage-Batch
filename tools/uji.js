/* Uji logika Manage Batch tanpa browser: blok "LOGIKA MURNI" di index.html
   diambil apa adanya lalu dijalankan di Node.  Pakai:  node tools/uji.js      */
const fs = require('fs');
const path = require('path');

const akar = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(akar, 'index.html'), 'utf8');
const a = src.indexOf('var STATUS = {');
const b = src.indexOf('/* =================== LOGIKA MURNI: SELESAI');
if (a < 0 || b < 0) { console.error('GAGAL: blok logika murni tidak ketemu di index.html'); process.exit(1); }
const mod = { exports: {} };
new Function('module', 'exports', src.slice(a, b))(mod, mod.exports);
const L = mod.exports;

let gagal = 0, jumlah = 0;
function cek(nama, syarat, tambahan) {
  jumlah++;
  if (syarat) { console.log('  ok   ' + nama); }
  else { gagal++; console.log('  GAGAL ' + nama + (tambahan !== undefined ? '  -> ' + JSON.stringify(tambahan) : '')); }
}
function judul(t) { console.log('\n== ' + t + ' =='); }

const TIM = [{ id: 't1', nama: 'Baldy', reviewer: true }, { id: 't2', nama: 'Vincent', reviewer: false }];
const ctx = (oleh, data) => ({ oleh, tanggal: '2026-09-10', stempel: '2026-09-10T08:00:00.000Z', data: data || {} });
const baru = () => ({ id: 'p1', kode: 'TURARG20H2235', status: 'todo', jalur: 'belum', prioritas: 'P1',
  brief: [], sampel: [], riwayat: [], diperbarui: '2026-09-10T00:00:00.000Z' });

judul('Alur TANPA sample: kerjakan -> review -> selesai');
let p = baru();
cek('aksi awal menawarkan dua jalur', L.aksiBerikutnya(p).length === 2);
p = L.terapkanAksi(p, 'jalur_langsung', ctx('Vincent')).p;
cek('jadi dikerjakan', p.status === 'dikerjakan' && p.jalur === 'langsung', p.status);
cek('langkah berikutnya = minta review', L.aksiBerikutnya(p)[0].kode === 'ke_review');
p = L.terapkanAksi(p, 'ke_review', ctx('Vincent')).p;
cek('status jadi review (pending)', p.status === 'review', p.status);
cek('tercatat siapa yang mengajukan', p.diajukan_oleh === 'Vincent' && p.diajukan_pada === '2026-09-10');
cek('bukan reviewer: tidak ada tombol setuju', L.aksiBerikutnya(p, { reviewer: false })[0].mati === true);
cek('reviewer: ada setuju + tolak', L.aksiBerikutnya(p, { reviewer: true }).map(x => x.kode).join(',') === 'setuju,tolak');
const pTolak = L.terapkanAksi(p, 'tolak', ctx('Baldy', { catatan: 'tepi bawah slab 45 masih kemakan' })).p;
cek('tolak -> perbaikan internal', pTolak.status === 'revisi_internal', pTolak.status);
cek('catatan review jadi brief terbaru', L.briefTerbaru(pTolak).sumber === 'review'
  && L.briefTerbaru(pTolak).teks.indexOf('slab 45') >= 0);
cek('dari perbaikan bisa dikerjakan lagi', L.aksiBerikutnya(pTolak)[0].kode === 'perbaiki');
p = L.terapkanAksi(p, 'setuju', ctx('Baldy')).p;
cek('setuju -> SELESAI', p.status === 'done' && p.direview_oleh === 'Baldy', p.status);
cek('tanggal selesai dicatat', p.selesai_pada === '2026-09-10');

judul('Alur PAKAI sample: sample -> klien -> revisi -> final -> apply -> review');
let q = baru();
q = L.terapkanAksi(q, 'jalur_sample', ctx('Kallysta')).p;
cek('ronde 1 dibuat', q.status === 'sample_buat' && q.sampel.length === 1, q.status);
q = L.terapkanAksi(q, 'kirim_sample', ctx('Kallysta', { tautan: 'drive/sample1.jpg' })).p;
cek('terkirim, menunggu klien', q.status === 'sample_kirim' && q.sampel[0].dikirim === '2026-09-10');
cek('tautan sample tersimpan', q.sampel[0].tautan === 'drive/sample1.jpg');
q = L.terapkanAksi(q, 'jawaban', ctx('Kallysta', { hasil: 'revisi', brief: 'tone kurang biru', lampiran: 'sample klien.jpg' })).p;
cek('jawaban revisi', q.status === 'revisi' && q.sampel[0].jawaban === 'revisi', q.status);
cek('brief klien masuk timeline', L.briefTerbaru(q).teks === 'tone kurang biru' && L.briefTerbaru(q).sumber === 'klien');
cek('lampiran klien ikut', L.briefTerbaru(q).lampiran === 'sample klien.jpg');
cek('tawaran ronde 2', L.aksiBerikutnya(q)[0].label.indexOf('ronde 2') >= 0, L.aksiBerikutnya(q)[0].label);
q = L.terapkanAksi(q, 'sample_baru', ctx('Kallysta')).p;
q = L.terapkanAksi(q, 'kirim_sample', ctx('Kallysta')).p;
q = L.terapkanAksi(q, 'jawaban', ctx('Kallysta', { hasil: 'final', brief: 'sudah oke, lanjut semua' })).p;
cek('klien setuju -> disetujui', q.status === 'disetujui', q.status);
cek('dua ronde tersimpan', q.sampel.length === 2 && q.sampel[1].jawaban === 'final');
cek('brief lama TETAP ada', q.brief.length === 2 && q.brief[0].teks === 'tone kurang biru');
cek('brief terbaru yang final', L.briefTerbaru(q).teks === 'sudah oke, lanjut semua');
q = L.terapkanAksi(q, 'apply', ctx('Kallysta')).p;
cek('apply ke semua slab', q.status === 'apply');
q = L.terapkanAksi(q, 'ke_review', ctx('Kallysta')).p;
cek('setelah apply masuk review', q.status === 'review', q.status);

judul('Aturan lain');
const asli = baru(); const salinan = JSON.stringify(asli);
L.terapkanAksi(asli, 'mulai', ctx('Baldy'));
cek('terapkanAksi tidak mengubah objek asli', JSON.stringify(asli) === salinan);
cek('reviewer terbaca dari tim', L.apakahReviewer(TIM, 'Baldy') === true && L.apakahReviewer(TIM, 'Vincent') === false);
cek('daftar reviewer', L.daftarReviewer(TIM).join(',') === 'Baldy');
const pu = L.terapkanAksi(baru(), 'urgent', ctx('Baldy')).p;
cek('tandai urgent', pu.urgent === true);
cek('lepas urgent', L.terapkanAksi(pu, 'urgent', ctx('Baldy')).p.urgent === false);
cek('urgent diurutkan paling atas',
  [{ prioritas: 'P3', urgent: true, kode: 'B' }, { prioritas: 'P1', kode: 'A' }].sort(L.urutProject)[0].kode === 'B');
cek('tenggat lewat terdeteksi', L.telatHari({ tenggat: '2026-09-08', status: 'todo' }, '2026-09-10') === 2);
cek('tenggat belum lewat negatif', L.telatHari({ tenggat: '2026-09-12', status: 'todo' }, '2026-09-10') === -2);
cek('project selesai tidak dihitung telat', L.telatHari({ tenggat: '2026-09-01', status: 'done' }, '2026-09-10') === null);
cek('hari menunggu klien', L.hariAntara('2026-09-07', '2026-09-10') === 3);

judul('Tempel dari tabel Notion');
const tempel = L.parseTempel(
  'P1\tTURARG20H2235\t—\tRemove tag + color match\tTag + Color\t\t10 Sep\n' +
  'P2\tSOLBLA20H6004\t32\tAdd missing area back\tRetouch\t\t7 Sep');
cek('dua baris terbaca', tempel.length === 2, tempel);
cek('kode terbaca', tempel[0].kode === 'TURARG20H2235' && tempel[1].kode === 'SOLBLA20H6004');
cek('prioritas terbaca', tempel[0].prioritas === 'P1' && tempel[1].prioritas === 'P2');
cek('slab terbaca', tempel[1].slab === '32', tempel[1]);
cek('revisi terbaca', tempel[0].revisi === 'Remove tag + color match', tempel[0].revisi);

judul('Gabung dua orang mengedit bersamaan (tanpa server)');
const basis = { batches: [], tim: [], projects: [
  { id: 'a', kode: 'A', diperbarui: '2026-09-10T01:00:00Z', riwayat: [{ waktu: '1', oleh: 'x', teks: 'awal' }] },
  { id: 'b', kode: 'B', diperbarui: '2026-09-10T01:00:00Z' }] };
const lokal = { batches: [], tim: [], projects: [
  { id: 'a', kode: 'A-lokal', diperbarui: '2026-09-10T03:00:00Z', riwayat: [{ waktu: '1', oleh: 'x', teks: 'awal' }, { waktu: '3', oleh: 'baldy', teks: 'lokal' }] },
  { id: 'b', kode: 'B', diperbarui: '2026-09-10T01:00:00Z' },
  { id: 'c', kode: 'C-baru-lokal', diperbarui: '2026-09-10T03:00:00Z' }] };
const jauh = { batches: [], tim: [], projects: [
  { id: 'a', kode: 'A-jauh', diperbarui: '2026-09-10T02:00:00Z', riwayat: [{ waktu: '1', oleh: 'x', teks: 'awal' }, { waktu: '2', oleh: 'indra', teks: 'jauh' }] },
  { id: 'd', kode: 'D-baru-jauh', diperbarui: '2026-09-10T02:30:00Z' }] };
const g = L.gabungDB(basis, lokal, jauh);
const cari = id => g.projects.find(x => x.id === id);
cek('perubahan terbaru menang', cari('a').kode === 'A-lokal', cari('a'));
cek('riwayat kedua sisi disatukan', cari('a').riwayat.length === 3, cari('a').riwayat);
cek('project baru lokal tetap ada', !!cari('c'));
cek('project baru orang lain ikut masuk', !!cari('d'));
cek('project yang dihapus orang lain tidak balik lagi', !cari('b'));

judul('Data awal (data/db.json)');
const dbj = JSON.parse(fs.readFileSync(path.join(akar, 'data', 'db.json'), 'utf8'));
cek('15 project dari master list', dbj.projects.length === 15, dbj.projects.length);
cek('4 anggota tim', dbj.tim.length === 4);
cek('Baldy & Indra reviewer', L.daftarReviewer(dbj.tim).sort().join(',') === 'Baldy,Indra');
cek('semua project punya id unik', new Set(dbj.projects.map(x => x.id)).size === 15);
cek('semua status dikenal', dbj.projects.every(x => L.STATUS[x.status]));
cek('semua prioritas dikenal', dbj.projects.every(x => L.PRIORITAS[x.prioritas]));
cek('semua punya brief awal', dbj.projects.every(x => (x.brief || []).length >= 1));
cek('semua kolom papan terpakai valid', Object.keys(L.STATUS).every(s => L.KOLOM.some(k => k.id === L.STATUS[s].kolom)));

console.log('\n' + (gagal ? 'GAGAL: ' + gagal + ' dari ' + jumlah + ' uji' : 'LULUS semua ' + jumlah + ' uji'));
process.exit(gagal ? 1 : 0);
