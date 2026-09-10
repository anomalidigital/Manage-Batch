/* Uji lapisan Supabase TANPA Supabase sungguhan: sebuah server tiruan meniru
   PostgREST, lalu fungsi-fungsi dari index.html dijalankan melawannya.
   Yang dijaga: alamat, header kunci, bentuk badan upsert, pemetaan baris, dan
   penggabungan saat orang lain ikut mengubah.   Pakai: node tools/uji_supabase.js */
const fs = require('fs');
const path = require('path');
const http = require('http');

const akar = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(akar, 'index.html'), 'utf8');

let gagal = 0, jumlah = 0;
function cek(nama, syarat, tambahan) {
  jumlah++;
  if (syarat) console.log('  ok   ' + nama);
  else { gagal++; console.log('  GAGAL ' + nama + (tambahan !== undefined ? '  -> ' + JSON.stringify(tambahan) : '')); }
}
function judul(t) { console.log('\n== ' + t + ' =='); }

/* ---- ambil dua potong kode dari index.html apa adanya ---- */
function potong(dari, sampai) {
  const a = src.indexOf(dari), b = src.indexOf(sampai, a);
  if (a < 0 || b < 0) { console.error('GAGAL: potongan tidak ketemu: ' + dari); process.exit(1); }
  return src.slice(a, b);
}
const blokMurni = potong('function dariBarisSB(baris){', 'function briefTampil(');
const blokSB = potong('function pakaiSB(){', 'function urlMentah(){');
const blokGabung = potong('function gabungKoleksi(basis, lokal, remote){', 'function urutProject(');

/* ---- server tiruan PostgREST ---- */
const catatan = [];              // semua permintaan yang masuk
let tabel = {
  projects: [
    { id: 'p1', data: { id: 'p1', kode: 'AAA', status: 'todo', diperbarui: '2026-09-10T01:00:00Z' }, diperbarui: '2026-09-10T01:00:00Z' },
    { id: 'p2', data: { id: 'p2', kode: 'BBB', status: 'done', diperbarui: '2026-09-10T01:00:00Z' }, diperbarui: '2026-09-10T01:00:00Z' },
    { id: 'p3', data: { id: 'p3', kode: 'CCC', dihapus: true, diperbarui: '2026-09-10T01:00:00Z' }, diperbarui: '2026-09-10T01:00:00Z' }
  ],
  tim: [{ id: 't1', data: { id: 't1', nama: 'Baldy', reviewer: true, diperbarui: '2026-09-10T01:00:00Z' }, diperbarui: '2026-09-10T01:00:00Z' }],
  batches: [{ id: 'b1', data: { id: 'b1', nama: 'Batch uji', diperbarui: '2026-09-10T01:00:00Z' }, diperbarui: '2026-09-10T01:00:00Z' }]
};
let cap = '2026-09-10T01:00:00Z';
let paksaGalat = 0;

const server = http.createServer((req, res) => {
  let badan = '';
  req.on('data', c => badan += c);
  req.on('end', () => {
    catatan.push({ metode: req.method, url: req.url, kepala: req.headers, badan: badan });
    if (paksaGalat) { res.writeHead(paksaGalat); res.end('galat sengaja'); return; }
    const jalan = req.url.split('?')[0];
    if (jalan === '/rest/v1/rpc/cap_perubahan') {
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('"' + cap + '"'); return;
    }
    const nama = jalan.replace('/rest/v1/', '');
    if (!tabel[nama]) { res.writeHead(404); res.end('[]'); return; }
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(tabel[nama])); return;
    }
    if (req.method === 'POST') {                     // upsert
      const masuk = JSON.parse(badan || '[]');
      masuk.forEach(r => {
        const i = tabel[nama].findIndex(x => x.id === r.id);
        if (i >= 0) tabel[nama][i] = r; else tabel[nama].push(r);
      });
      cap = new Date().toISOString();
      res.writeHead(201); res.end(''); return;
    }
    res.writeHead(405); res.end('');
  });
});

/* ---- jalankan potongan kode dengan tiruan seperlunya ---- */
function bangun(alamat) {
  const kepala = `
    var cfg = {sb_url: ${JSON.stringify(alamat)}, sb_key: 'kunci-uji'};
    var basis = {projects:[], tim:[], batches:[]}, db = {projects:[], tim:[], batches:[]};
    var kotor = false, pertamaKali = true, capTerakhir = '';
    var pesanTerakhir = '', sinkTerakhir = '';
    function setSink(k, t){ sinkTerakhir = k + ': ' + t; }
    function pesan(t){ pesanTerakhir = t; }
    function renderAman(){}
    function lengkapiTenggat(){ return 0; }
    function simpanNanti(){}
    var LS = {ambil:function(k,b){ return b; }, taruh:function(){}};
    function gabungDB(basis, lokal, remote){
      return {versi:1, diperbarui:new Date().toISOString(),
        batches:gabungKoleksi(basis.batches, lokal.batches, remote.batches),
        tim:gabungKoleksi(basis.tim, lokal.tim, remote.tim),
        projects:gabungKoleksi(basis.projects, lokal.projects, remote.projects)};
    }
  `;
  const ekor = `
    return {
      pakaiSB:pakaiSB, sbURL:sbURL, sbKepala:sbKepala, sbAmbilTabel:sbAmbilTabel,
      sbCap:sbCap, sbSimpanTabel:sbSimpanTabel, muatDariSupabase:muatDariSupabase,
      simpanKeSupabase:simpanKeSupabase, isiAwalSupabase:isiAwalSupabase,
      lihat:function(){ return {db:db, basis:basis, kotor:kotor, sink:sinkTerakhir, pesan:pesanTerakhir}; },
      pasang:function(o){ if('db' in o) db = o.db; if('basis' in o) basis = o.basis; if('kotor' in o) kotor = o.kotor;
                          if('pertamaKali' in o) pertamaKali = o.pertamaKali; }
    };
  `;
  return new Function('fetch', kepala + blokGabung + blokMurni + blokSB + ekor)(fetch);
}

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const alamat = 'http://127.0.0.1:' + server.address().port;
  const A = bangun(alamat + '/');            // sengaja pakai garis miring di ujung

  judul('Alamat dan kunci');
  cek('Supabase dianggap aktif', A.pakaiSB() === true);
  cek('garis miring di ujung dibuang', A.sbURL('projects') === alamat + '/rest/v1/projects', A.sbURL('projects'));
  const h = A.sbKepala();
  cek('kunci dikirim dua kali (apikey + Bearer)', h.apikey === 'kunci-uji' && h.Authorization === 'Bearer kunci-uji', h);

  judul('Membaca tabel');
  const ps = await A.sbAmbilTabel('projects');
  cek('tiga baris terbaca', ps.length === 3, ps.length);
  cek('isi kolom JSON jadi objek project', ps[0].kode === 'AAA' && ps[0].id === 'p1', ps[0]);
  const q = catatan[catatan.length - 1];
  cek('minta kolom seperlunya + urut', /select=id,data,diperbarui/.test(q.url) && /order=id/.test(q.url), q.url);
  cek('header kunci ikut terkirim', q.kepala.apikey === 'kunci-uji' && q.kepala.authorization === 'Bearer kunci-uji');

  judul('Tanya ringan "ada perubahan?"');
  const c = await A.sbCap();
  cek('balasan tanpa tanda kutip', c === '2026-09-10T01:00:00Z', c);
  const qc = catatan[catatan.length - 1];
  cek('lewat POST ke rpc', qc.metode === 'POST' && qc.url.indexOf('/rest/v1/rpc/cap_perubahan') === 0, qc.url);

  judul('Memuat seluruh data');
  A.pasang({ db: { projects: [], tim: [], batches: [] }, basis: { projects: [], tim: [], batches: [] }, kotor: false, pertamaKali: true });
  await A.muatDariSupabase(true);
  let st = A.lihat();
  cek('baris bertanda dihapus TIDAK ikut', st.db.projects.length === 2, st.db.projects.map(x => x.id));
  cek('tim ikut termuat', st.db.tim.length === 1 && st.db.tim[0].nama === 'Baldy');
  cek('batch ikut termuat', st.db.batches.length === 1);
  cek('basis salinan tersendiri, bukan rujukan ke db', st.basis !== st.db);
  cek('basis = apa adanya di server (termasuk yang dihapus)',
    st.basis.projects.length === 3 && st.db.projects.length === 2,
    { basis: st.basis.projects.length, db: st.db.projects.length });

  judul('Menyimpan: hanya yang berubah yang dikirim');
  const sebelum = catatan.length;
  st.db.projects[0].kode = 'AAA-diubah';
  st.db.projects[0].diperbarui = '2026-09-10T05:00:00Z';
  A.pasang({ db: st.db, kotor: true });
  await A.simpanKeSupabase();
  const kirim = catatan.slice(sebelum).filter(x => x.metode === 'POST' && x.url.indexOf('/rest/v1/projects') === 0);
  cek('satu kiriman untuk tabel projects', kirim.length === 1, kirim.length);
  const isi = JSON.parse(kirim[0].badan);
  cek('hanya 1 baris yang dikirim (bukan semuanya)', isi.length === 1, isi.map(x => x.id));
  cek('baris yang dikirim yang benar', isi[0].id === 'p1' && isi[0].data.kode === 'AAA-diubah', isi[0]);
  cek('bentuk baris: id + data + diperbarui', Object.keys(isi[0]).sort().join(',') === 'data,diperbarui,id');
  cek('upsert, bukan tambah baru', /on_conflict=id/.test(kirim[0].url), kirim[0].url);
  cek('minta gabung kalau id sudah ada', /merge-duplicates/.test(kirim[0].kepala.prefer || ''), kirim[0].kepala.prefer);
  cek('tabel yang tidak berubah tidak dikirim',
    catatan.slice(sebelum).filter(x => x.metode === 'POST' && x.url.indexOf('/rest/v1/tim') === 0).length === 0);
  cek('sesudah terkirim tidak kotor lagi', A.lihat().kotor === false);
  cek('perubahan benar-benar masuk server tiruan',
    tabel.projects.find(x => x.id === 'p1').data.kode === 'AAA-diubah');

  judul('Dua orang mengubah bersamaan');
  tabel.projects.find(x => x.id === 'p2').data = { id: 'p2', kode: 'BBB', status: 'review', diperbarui: '2026-09-10T09:00:00Z' };
  const stx = A.lihat();
  stx.db.projects.find(x => x.id === 'p1').catatan = 'diketik lokal';
  stx.db.projects.find(x => x.id === 'p1').diperbarui = '2026-09-10T09:30:00Z';
  A.pasang({ db: stx.db, kotor: true });
  await A.muatDariSupabase(true);
  const st2 = A.lihat();
  cek('perubahan orang lain ikut masuk',
    st2.db.projects.find(x => x.id === 'p2').status === 'review', st2.db.projects.find(x => x.id === 'p2'));
  cek('ketikan sendiri tidak hilang',
    st2.db.projects.find(x => x.id === 'p1').catatan === 'diketik lokal');
  cek('sesudah digabung masih dianggap belum terkirim', A.lihat().kotor === true);
  const seb2 = catatan.length;
  await A.simpanKeSupabase();
  const kirim2 = catatan.slice(seb2).filter(x => x.metode === 'POST' && x.url.indexOf('/rest/v1/projects') === 0);
  cek('ketikan sendiri BENAR-BENAR terkirim sesudah digabung',
    kirim2.length === 1 && JSON.parse(kirim2[0].badan).some(r => r.data.catatan === 'diketik lokal'),
    kirim2.map(x => x.badan));
  cek('tersimpan di server tiruan',
    tabel.projects.find(x => x.id === 'p1').data.catatan === 'diketik lokal');
  const seb3 = catatan.length;
  await A.muatDariSupabase(true);
  A.pasang({ kotor: true });
  await A.simpanKeSupabase();
  cek('tidak ada kiriman ulang untuk baris yang sudah sama',
    catatan.slice(seb3).filter(x => x.metode === 'POST' && x.url.indexOf('/rest/v1/projects') === 0)
      .every(x => JSON.parse(x.badan).length === 0) ||
    catatan.slice(seb3).filter(x => x.metode === 'POST' && x.url.indexOf('/rest/v1/projects') === 0).length === 0);
  cek('baris bertanda dihapus tidak dikirim ulang terus-menerus',
    !catatan.slice(seb3).some(x => x.metode === 'POST' && (x.badan || '').indexOf('"dihapus"') >= 0));

  judul('Kalau Supabase bermasalah');
  paksaGalat = 401;
  let kena = '';
  try { await A.sbAmbilTabel('projects'); } catch (e) { kena = e.message; }
  cek('kunci salah memunculkan pesan jelas', /401/.test(kena) && /kunci/i.test(kena), kena);
  paksaGalat = 500;
  kena = '';
  try { await A.sbSimpanTabel('projects', [{ id: 'x', kode: 'X' }]); } catch (e) { kena = e.message; }
  cek('gagal simpan dilempar, bukan didiamkan', /500/.test(kena), kena);
  paksaGalat = 0;

  judul('Isi awal (sekali saat pindah ke Supabase)');
  A.pasang({ db: { projects: [{ id: 'z1', kode: 'ZZZ' }], tim: [{ id: 'z2', nama: 'X' }], batches: [] }, basis: { projects: [], tim: [], batches: [] } });
  const n = await A.isiAwalSupabase();
  cek('semua project dikirim', n === 1 && tabel.projects.some(x => x.id === 'z1'));
  cek('tim ikut dikirim', tabel.tim.some(x => x.id === 'z2'));

  server.close();
  console.log('\n' + (gagal ? 'GAGAL: ' + gagal + ' dari ' + jumlah + ' uji' : 'LULUS semua ' + jumlah + ' uji Supabase'));
  process.exit(gagal ? 1 : 0);
})();
