/* Uji logika Manage Batch tanpa browser: blok "LOGIKA MURNI" di index.html
   diambil apa adanya lalu dijalankan di Node.  Pakai:  node tools/uji.js      */
const fs = require('fs');
const path = require('path');

const akar = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(akar, 'index.html'), 'utf8');
const a = src.indexOf('/* =================== LOGIKA MURNI: MULAI');
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

judul('Kelompok per hari (seperti "List pending slab")');
cek('tanggal ditulis Indonesia', L.tanggalIndo('2026-09-10') === '10 September 2026', L.tanggalIndo('2026-09-10'));
cek('tanggal kosong aman', L.tanggalIndo('') === 'Tanpa tanggal');
const kel = L.kelompokPerHari([
  { id: '1', diterima: '2026-09-07', prioritas: 'P3', kode: 'C' },
  { id: '2', diterima: '2026-09-10', prioritas: 'P1', kode: 'A' },
  { id: '3', diterima: '2026-09-07', prioritas: 'P1', kode: 'B' },
  { id: '4', diterima: '', prioritas: 'P2', kode: 'D' }]);
cek('tiga kelompok hari', kel.length === 3, kel.map(g => g.tanggal));
cek('hari terbaru di atas', kel[0].tanggal === '2026-09-10' && kel[1].tanggal === '2026-09-07');
cek('tanpa tanggal di paling bawah', kel[2].tanggal === '');
cek('di dalam hari tetap urut prioritas', kel[1].items.map(x => x.kode).join('') === 'BC');

judul('Data awal (data/db.json)');
const dbj = JSON.parse(fs.readFileSync(path.join(akar, 'data', 'db.json'), 'utf8'));
cek('16 baris dari list pending', dbj.projects.length === 16, dbj.projects.length);
cek('4 anggota tim', dbj.tim.length === 4);
cek('Baldy & Indra reviewer', L.daftarReviewer(dbj.tim).sort().join(',') === 'Baldy,Indra');
cek('semua project punya id unik', new Set(dbj.projects.map(x => x.id)).size === 16);
const hari = L.kelompokPerHari(dbj.projects);
cek('terbagi 3 hari: 10, 9, 7 Sep', hari.map(g => g.tanggal).join(',') === '2026-09-10,2026-09-09,2026-09-07',
  hari.map(g => g.tanggal + '=' + g.items.length));
cek('10 Sep berisi 3 project', hari[0].items.length === 3, hari[0].items.map(x => x.kode));
cek('9 Sep berisi CARPAT 37–48', hari[1].items.length === 1 && hari[1].items[0].slab === '37–48', hari[1].items[0]);
cek('7 Sep berisi 12 project', hari[2].items.length === 12, hari[2].items.length);
cek('CARPAT muncul dua kali dengan slab berbeda',
  dbj.projects.filter(p => p.kode === 'CARPAT20LF4769').map(p => p.slab).sort().join('|') === '25–36|37–48');
cek('brief klien BORCRY tersimpan utuh',
  dbj.projects.find(p => p.kode === 'BORCRY20H3083').brief[0].teks.includes('without bringing back the orange wash'));
cek('lokasi sample baru BORCRY tercatat',
  dbj.projects.find(p => p.kode === 'BORCRY20H3083').tautan.includes('newsample8sep'));
cek('detail batu AMEWAV tercatat',
  dbj.projects.find(p => p.kode === 'AMEWAV20LF3446').brief[0].teks.includes('Amethyst Wave Quartzite'));
cek('BEVROS dipegang Indra', dbj.projects.find(p => p.kode === 'BEVROS20H5802').pic === 'Indra');
cek('semua brief punya sumber dikenal', dbj.projects.every(x => (x.brief||[]).every(b => ['awal','klien','klien-final','review','internal'].includes(b.sumber))));
cek('semua status dikenal', dbj.projects.every(x => L.STATUS[x.status]));
cek('semua prioritas dikenal', dbj.projects.every(x => L.PRIORITAS[x.prioritas]));
cek('semua punya brief awal', dbj.projects.every(x => (x.brief || []).length >= 1));
cek('semua kolom papan terpakai valid', Object.keys(L.STATUS).every(s => L.KOLOM.some(k => k.id === L.STATUS[s].kolom)));


judul('Struktur halaman (satu landing page, tanpa browser)');
const seedRaw = src.match(/<script type="application\/json" id="benih">([\s\S]*?)<\/script>/);
cek('data awal tertanam di index.html', !!seedRaw);
const seed = JSON.parse(seedRaw[1]);
cek('data awal sama persis dengan data/db.json',
  JSON.stringify(seed) === JSON.stringify(dbj), 'benih ' + seed.projects.length + ' vs db ' + dbj.projects.length);
['s-ringkas', 's-orang', 's-daftar', 's-papan'].forEach(id =>
  cek('bagian ' + id + ' dibuat render()', src.indexOf('id="' + id + '"') >= 0));
['ringkas', 'orang', 'daftar', 'papan'].forEach(v =>
  cek('tombol lompat ' + v + ' punya tujuan', src.indexOf('data-v="' + v + '"') >= 0));
cek('tidak ada lagi pemanggil fungsi lama',
  !/\brender(Papan|Tabel|Orang|Ringkas)\s*\(/.test(src), (src.match(/\brender(Papan|Tabel|Orang|Ringkas)\s*\(/g) || []).slice(0, 3));

const idStatis = new Set([...src.matchAll(/\sid="([A-Za-z0-9_-]+)"/g)].map(m => m[1]));
const idDinamis = new Set(['pilihOrang', 'btnOrangBaru', 'tugasSemua', 'btnTugasSemua',
  'sToken', 'sOwner', 'sRepo', 'sBranch', 'sPath', 'sAuto', 'sTimBaru', 'sTambahTim',
  'sBatchBaru', 'sTambahBatch', 'sUnduh', 'sSalin', 'sBenih',
  'mBrief', 'mLamp', 'mTaut', 'mTempel', 'mCatatan',
  'nKode', 'nSlab', 'nRev', 'nPri', 'nPic', 'nTgl', 'nBatch', 'nJenis', 'nTenggat',
  'oNama', 'oRev', 'oTambah', 'bTeks', 'bSumber', 'bLampiran']);
const dipakai = [...new Set([...src.matchAll(/\$\('#([A-Za-z0-9_-]+)'\)/g)].map(m => m[1]))];
const hilang = dipakai.filter(id => !idStatis.has(id) && !idDinamis.has(id));
cek('semua $(\'#id\') menunjuk elemen yang ada', hilang.length === 0, hilang);
const wajib = ['isi', 'tabs', 'barAksi', 'barJml', 'barPic', 'barPri', 'barUrgent', 'barBatal',
  'pesan', 'laci', 'laciBadan', 'modal', 'modalBadan', 'cari', 'fPic', 'fPri', 'fStatus',
  'fSelesai', 'fUrgent', 'fSaya', 'fHari', 'pilihBatch', 'pilihSaya', 'sink', 'btnMuat'];
cek('elemen inti ada di HTML', wajib.every(id => idStatis.has(id)), wajib.filter(id => !idStatis.has(id)));
cek("kolom tabel konsisten (colspan 6)", (src.match(/colspan="6"/g) || []).length >= 2);
cek('sel PIC kosong berbunyi "Tetapkan PIC"', src.indexOf('Tetapkan PIC') >= 0);
cek('tugas massal per centang tersedia', src.indexOf('data-pilih=') >= 0 && src.indexOf('aksiMassal') >= 0);
cek('tugaskan seluruh batch tersedia', src.indexOf('btnTugasSemua') >= 0);


judul('Terjemahan brief klien (kamus istilah CDK)');
cek('kalimat Inggris dikenali', L.sepertiInggris('Could you please tone down the white?') === true);
cek('kalimat Indonesia TIDAK diterjemahkan',
  L.sepertiInggris('Kembalikan area yang hilang pada slab 32') === false);
const t1 = L.terjemahOtomatis('Could you please add the missing area back to slab 32?');
cek('minta tambah area', /tolong/i.test(t1) && /area yang hilang/.test(t1) && /slab 32/.test(t1), t1);
const t2 = L.terjemahOtomatis('Could you please tone down the white without bringing back the orange wash? The rest of the batch is similar to the attached image.');
cek('tone down white', /turunkan kadar putihnya/.test(t2) && /tanpa memunculkan lagi/.test(t2)
  && /semburat oranye/.test(t2) && /gambar terlampir/.test(t2), t2);
const t3 = L.terjemahOtomatis('Another version that is a bit bluer please?');
cek('versi lebih biru', /versi lain/i.test(t3) && /sedikit lebih biru/.test(t3), t3);
cek('kode batu tidak diubah', L.terjemahOtomatis('Please match AMEWAV20LF3446 to the attached image').includes('AMEWAV20LF3446'));
cek('perbaikan tangan menang atas otomatis',
  L.briefTampil({ teks: 'Please tone down the white', terjemahan: 'Putihnya diturunkan ya' }, true).teks === 'Putihnya diturunkan ya');
cek('jenis terjemahan ditandai',
  L.briefTampil({ teks: 'Could you please tone down the white' }, true).jenis === 'otomatis'
  && L.briefTampil({ teks: 'Kembalikan area yang hilang pada slab 32' }, true).jenis === 'asli');

judul('Tenggat otomatis seminggu');
cek('tenggat = diterima + 7 hari', L.tenggatOtomatis('2026-09-10') === '2026-09-17', L.tenggatOtomatis('2026-09-10'));
cek('lompat bulan benar', L.tenggatOtomatis('2026-09-28') === '2026-10-05', L.tenggatOtomatis('2026-09-28'));
cek('tanggal kosong aman', L.tenggatOtomatis('') === '');
cek('HARI_TENGGAT = 7', L.HARI_TENGGAT === 7);
cek('semua project awal sudah punya tenggat', dbj.projects.every(p => !!p.tenggat));
cek('tenggat data awal = diterima + 7',
  dbj.projects.every(p => p.tenggat === L.tenggatOtomatis(p.diterima)));

judul('Project selesai bisa dibuka lagi untuk revisi');
let r = baru();
r = L.terapkanAksi(r, 'jalur_langsung', ctx('Vincent')).p;
r = L.terapkanAksi(r, 'ke_review', ctx('Vincent')).p;
r = L.terapkanAksi(r, 'setuju', ctx('Baldy')).p;
cek('sudah selesai', r.status === 'done');
cek('ada tawaran revisi baru', L.aksiBerikutnya(r)[0].kode === 'revisi_baru');
r = L.terapkanAksi(r, 'revisi_baru', ctx('Baldy', { teks: 'slab 45 masih terlalu hangat' })).p;
cek('balik ke antrean', r.status === 'todo', r.status);
cek('hitungan revisi naik', r.dibuka_ulang === 1);
cek('tanggal selesai dihapus', !r.selesai_pada);
cek('brief baru dari klien masuk', L.briefTerbaru(r).teks === 'slab 45 masih terlalu hangat');
cek('bertanda REVISI KE-1', L.tandaBaris(r, '2026-09-10').some(x => x.teks === 'REVISI KE-1'));
let rs = baru(); rs.jalur = 'sample'; rs.status = 'done'; rs.selesai_pada = '2026-09-09';
rs = L.terapkanAksi(rs, 'revisi_baru', ctx('Baldy', { teks: 'kurang biru' })).p;
cek('yang pakai sample balik ke jalur sample', rs.status === 'revisi', rs.status);

judul('Tanda menyala di daftar');
cek('tugas baru bertanda BARU',
  L.tandaBaris({ status: 'todo', diterima: '2026-09-10' }, '2026-09-10').some(x => x.teks === 'BARU'));
cek('tugas lama tidak bertanda BARU',
  !L.tandaBaris({ status: 'todo', diterima: '2026-09-01' }, '2026-09-10').some(x => x.teks === 'BARU'));
cek('baru selesai bertanda',
  L.tandaBaris({ status: 'done', selesai_pada: '2026-09-09' }, '2026-09-10').some(x => x.teks === 'BARU SELESAI'));
cek('selesai lama tidak bertanda',
  L.tandaBaris({ status: 'done', selesai_pada: '2026-09-01' }, '2026-09-10').length === 0);
cek('urgent bertanda', L.tandaBaris({ status: 'todo', urgent: true }, '2026-09-10')[0].teks === 'URGENT');

judul('Simpan otomatis (tanpa tombol Simpan)');
cek('tombol Simpan sudah tidak ada', src.indexOf('id="btnSimpan"') < 0);
cek('perubahan dijadwalkan terkirim sendiri', /function simpanNanti\(\)/.test(src) && /1200/.test(src));
cek('gagal kirim dicoba ulang otomatis', /jamSimpan = setTimeout\(function\(\)\{ simpanKeGitHub\(true\); \}, 20000\)/.test(src));
cek('kelompok hari bisa ditutup', src.indexOf('data-tutup=') >= 0 && src.indexOf('mb_tutup') >= 0);


judul('Kata-kata: empat tahap, istilah profesional');
cek('tepat empat tahap', L.TAHAP.length === 4, L.TAHAP.map(t => t.label));
cek('urutan tahap masuk akal',
  L.TAHAP.map(t => t.id).join(',') === 'antrean,kerja,klien,tutup');
cek('semua status punya tahap yang dikenal',
  Object.keys(L.STATUS).every(k => L.TAHAP.some(t => t.id === L.STATUS[k].tahap)),
  Object.keys(L.STATUS).filter(k => !L.TAHAP.some(t => t.id === L.STATUS[k].tahap)));
cek('tiap tahap ada isinya',
  L.TAHAP.every(t => Object.keys(L.STATUS).some(k => L.STATUS[k].tahap === t.id)));
const opsi = L.opsiStatus('review');
cek('daftar pilihan dikelompokkan empat', (opsi.match(/<optgroup/g) || []).length === 4);
cek('status terpilih ikut ditandai', /value="review" selected/.test(opsi), opsi.slice(0, 80));
cek('semua status muncul di daftar',
  Object.keys(L.STATUS).every(k => opsi.indexOf('value="' + k + '"') >= 0));
cek('kepala tambahan ditaruh paling depan',
  L.opsiStatus('', '<option value="">Semua status</option>')
    .indexOf('<option value="">Semua status</option>') === 0);
const kasar = ['Belum mulai', 'Pending review', 'Apply ke semua', 'Ditahan', 'Perbaikan (review)'];
cek('istilah lama yang kaku sudah tidak dipakai',
  !Object.keys(L.STATUS).some(k => kasar.includes(L.STATUS[k].label)),
  Object.keys(L.STATUS).map(k => L.STATUS[k].label));
cek('antrean tidak lagi berbunyi "belum mulai"', L.STATUS.todo.label === 'Dalam antrean', L.STATUS.todo.label);
cek('review berbunyi menunggu persetujuan', L.STATUS.review.label === 'Menunggu persetujuan');
cek('kata "tugaskan" sudah tidak ada di tampilan',
  !/\+ tugaskan|Tugaskan '/.test(src), (src.match(/[Tt]ugaskan[^<']{0,20}/g) || []).slice(0, 4));
cek('tombol aksi memakai kata baku',
  /Ajukan untuk persetujuan/.test(src) && /Setujui & selesaikan/.test(src)
  && /Kembalikan untuk penyempurnaan/.test(src));

console.log('\n' + (gagal ? 'GAGAL: ' + gagal + ' dari ' + jumlah + ' uji' : 'LULUS semua ' + jumlah + ' uji'));
process.exit(gagal ? 1 : 0);
