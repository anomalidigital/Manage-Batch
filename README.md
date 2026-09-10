# Manage Batch — CDK

Aplikasi satu berkas untuk mengatur batch project CDK: **siapa mengerjakan apa**,
**sudah sampai mana**, dan **brief mana yang berlaku sekarang**.
Tanpa server, tanpa Supabase. Datanya satu berkas JSON di repo ini
(`data/db.json`) dan disimpan lewat GitHub API langsung dari browser.

## Buka aplikasinya

- **Lewat GitHub Pages** (paling gampang, bisa dari HP):
  `https://anomalidigital.github.io/Manage-Batch/`
  Aktifkan sekali di **Settings → Pages → Source: Deploy from a branch → main / (root)**.
- **Atau** unduh repo ini lalu klik dua kali `index.html`. Sama saja jalannya.

Tanpa apa pun kamu sudah bisa **melihat** semua data. Untuk **menyimpan**
perubahan, tempel token GitHub sekali (lihat di bawah).

## Token (sekali per orang)

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens**
   → **Fine-grained tokens** → *Generate new token*.
2. **Repository access**: Only select repositories → `anomalidigital/Manage-Batch`.
3. **Permissions** → Repository permissions → **Contents: Read and write**.
4. Salin tokennya, buka aplikasi → tombol **⚙** → tempel di kolom Token → Simpan.

Token hanya disimpan di browser masing-masing (localStorage). **Jangan pernah
menaruh token di dalam berkas repo** — repo ini publik.

## Cara pakai sehari-hari

1. Pilih namamu di pojok kanan atas (**Saya: …**). Ini dipakai untuk mencatat
   siapa melakukan apa.
2. Tab **Per Orang** → pilih nama di dropdown → keluar semua pekerjaan orang itu,
   dikelompokkan: urgent, perlu diperbaiki, revisi klien, menunggu klien,
   sedang dikerjakan, belum mulai, pending review, selesai.
   Pilih **⚠ Belum ada PIC** untuk melihat yang belum dipegang siapa pun.
3. Tiap kartu punya **satu tombol langkah berikutnya**. Ikuti saja tombolnya.

### Dua jalur kerja

**Tanpa sample** — langsung dikerjakan:

```
Belum mulai → Dikerjakan → (taruh di Edited) Pending review → Review OK → SELESAI
```

**Pakai sample ke klien** — ada bolak-balik:

```
Belum mulai → Buat sample → Kirim ke klien → Menunggu klien
                  ↑                                  │
                  └──── Revisi (brief baru) ←────────┤
                                                     ↓
                        Disetujui → Apply ke semua slab
                                        → Pending review → Review OK → SELESAI
```

Tiap kali klien menjawab, tekan **Catat jawaban klien**: pilih *revisi* atau
*setuju*, lalu tulis brief-nya. Ronde sample bertambah otomatis (Ronde 1, 2, 3…)
dan semuanya tersimpan.

### Review sebelum Done

Orang yang mengerjakan menekan **Sudah selesai → minta review**. Statusnya jadi
**Pending review**, bukan langsung selesai. Hanya anggota bertanda **reviewer**
(sekarang Baldy dan Indra, bisa diubah di ⚙) yang melihat tombol:

- **Review OK → SELESAI** — status jadi Done.
- **Minta perbaikan** — tulis apa yang kurang; catatan itu langsung jadi
  **brief terbaru** untuk yang mengerjakan, dan statusnya kembali ke perbaikan.

### Brief lama vs brief baru

Semua brief disimpan berurutan. Yang **paling baru tampil besar dan berwarna**
di atas (bertanda BRIEF TERBARU DARI KLIEN / CATATAN REVIEW); brief lama tetap
ada di bawahnya dalam keadaan **dicoret** supaya jelas sudah tidak berlaku tapi
masih bisa dibaca. Tombol **+ Tambah brief** untuk mencatat brief yang masuk
lewat jalur lain (WhatsApp, email, catatan internal).

### Urgent dan tenggat

- Tombol **🔥** menandai project urgent: kartunya bergaris merah dan selalu
  naik ke urutan paling atas. Ada filter **🔥 urgent saja**.
- Isi **Tenggat** di detail atau langsung di tabel. Yang lewat tenggat diberi
  label merah *telat N hari*; H-2 diberi label kuning.
- Project yang menunggu klien menampilkan **⏱ N hari** sejak sample dikirim,
  merah setelah 3 hari.

## Tampilan

| Tab | Untuk apa |
|---|---|
| **Per Orang** | "Ini project siapa?" — pilih orang, lihat semua kerjaannya |
| **Papan** | Papan kanban 7 kolom mengikuti alur di atas |
| **Tabel** | Master list seperti di Notion; PIC, prioritas, tenggat, status bisa diubah langsung |
| **Ringkasan** | Pending review, urgent & telat, belum ada PIC, menunggu klien, beban per orang |

Tombol **Tempel dari tabel** menerima salinan baris dari Notion atau Excel
(pisah TAB), jadi batch baru tidak perlu diketik ulang.

## Kerja bersamaan

Aplikasi mengambil versi terbaru dari GitHub tiap 45 detik dan otomatis
menyimpan 4 detik setelah kamu mengubah sesuatu. Kalau dua orang mengubah
project **berbeda** pada waktu bersamaan, keduanya aman digabung. Kalau dua
orang mengubah **project yang sama**, yang menyimpan paling akhir yang dipakai
(riwayat kerja kedua orang tetap disimpan). Project yang dihapus seseorang
tidak akan muncul lagi.

Kalau internet mati, aplikasi tetap jalan dari salinan di browser dan menyimpan
begitu tersambung lagi.

## Struktur data

`data/db.json`:

```
batches[]   { id, nama, tanggal }
tim[]       { id, nama, warna, reviewer, aktif }
projects[]  { id, kode, slab, revisi, jenis[], prioritas P1|P2|P3, pic,
              diterima, tenggat, batch, urgent, jalur, status, catatan, tautan,
              brief[]   { waktu, oleh, sumber: awal|klien|klien-final|review|internal, teks, lampiran, ronde },
              sampel[]  { ronde, dibuat, oleh, tautan, dikirim, jawaban, tanggal_jawaban, brief, lampiran },
              riwayat[] { waktu, oleh, teks },
              diperbarui }
```

Status yang dipakai: `todo`, `dikerjakan`, `sample_buat`, `sample_kirim`,
`revisi`, `revisi_internal`, `disetujui`, `apply`, `review`, `done`, `hold`.

## Untuk yang mengoprek

```bash
node tools/uji.js
```

Menjalankan 53 uji logika (alur kerja, brief, gabung data, impor tempel) tanpa
browser. Seluruh logika inti ada di blok `LOGIKA MURNI` di dalam `index.html`
supaya bisa diuji apa adanya.

## Catatan

- Repo ini **publik**: semua isi `data/db.json` (kode project, brief klien,
  nama tim) bisa dibaca siapa pun. Jangan menaruh harga, kontak klien, atau
  hal rahasia lain di sini.
- Cadangan cepat: ⚙ → **Unduh JSON**.
