# Manage Batch CDK

Papan kerja untuk batch revisi slab CDK. **Satu halaman**, tanpa server, tanpa
Supabase: datanya satu berkas JSON di repo ini (`data/db.json`) yang dibaca dan
ditulis langsung lewat GitHub, jadi seluruh tim melihat angka yang sama.

Dibuat untuk dua masalah nyata:

1. **"Ini project siapa yang ngerjain?"** — tiap project punya PIC, ada bagian
   "Siapa mengerjakan apa" (pilih nama → keluar daftar pekerjaannya), dan
   penugasan bisa sekaligus satu batch.
2. **Alur sample ke klien** — sample dikirim, klien menjawab, revisi, sample
   lagi, sampai final, lalu warnanya diterapkan ke semua slab. Semua brief
   klien tersimpan: yang terbaru menonjol, yang lama tetap terbaca.

---

## Cara membuka

**Lewat GitHub Pages (dianjurkan, bisa dari HP):**
Settings → Pages → Source: `Deploy from a branch` → Branch `main`, folder `/ (root)`
→ Save. Beberapa menit kemudian alamatnya:
`https://anomalidigital.github.io/Manage-Batch/`

**Atau tanpa internet:** klik dua kali `index.html`. Halaman tetap berisi karena
daftar awal ditanam di dalam berkasnya sendiri.

---

## Supaya bisa MENGUBAH (sekali saja per orang)

**Tidak ada tombol Simpan.** Setiap perubahan langsung dikirim sendiri dan
muncul di layar tim paling lama 15 detik kemudian. Indikator di kanan atas
memberi tahu keadaannya: `menyimpan…`, `tersimpan & terkirim`, atau
`gagal kirim — dicoba lagi`.

Tanpa token: semua orang bisa **melihat** data terbaru, tapi perubahannya hanya
tersimpan di browser sendiri (ada peringatannya).
Untuk ikut **mengubah**, tiap orang perlu token GitHub sendiri:

1. GitHub → Settings → Developer settings → Personal access tokens →
   **Fine-grained tokens** → Generate new token
2. Repository access: **Only select repositories** → `anomalidigital/Manage-Batch`
3. Permissions → Repository permissions → **Contents: Read and write**
4. Salin tokennya, buka aplikasi → tombol **⚙** → tempel di kolom Token → Simpan pengaturan

Token hanya disimpan di browser orang itu (localStorage). **Jangan pernah menaruh
token di dalam berkas repo ini** — repo ini publik.

Setelah token terpasang, pilih namamu di kotak **"Saya: —"** di kanan atas supaya
setiap perubahan tercatat atas namamu.

---

## Isi halaman (satu layar, tinggal digulir)

| Bagian | Isinya |
|---|---|
| **Ringkasan** | jumlah per status, yang urgent, yang telat tenggat, yang menunggu klien, yang belum ada PIC, beban tiap orang |
| **Siapa mengerjakan apa** | dropdown nama → daftar pekerjaan orang itu, dikelompokkan (urgent, perlu diperbaiki, revisi klien, menunggu klien, dikerjakan, belum mulai, pending review, selesai) |
| **List pending slab** | tabel seperti catatan aslinya, **dikelompokkan per hari diterima** (10 Sep, 9 Sep, 7 Sep); klik judul harinya untuk menutup/membuka kelompok itu |
| **Papan alur kerja** | kolom per tahap: Belum mulai → Dikerjakan → Menunggu klien → Revisi → Final/apply → Pending review → Selesai |

Tombol di bar atas hanya melompat ke bagiannya, halamannya tetap satu.

---

## Menugaskan orang

Tiga cara, tergantung banyaknya:

- **Satu project** — di kolom PIC klik kotak biru **"+ Tugaskan…"** lalu pilih nama.
- **Beberapa project** — centang barisnya (atau centang judul harinya untuk sehari
  penuh), lalu di bar bawah pilih orangnya. Bar yang sama juga bisa mengubah
  prioritas dan menandai urgent sekaligus.
- **Satu batch penuh** — di atas tabel: "Siapa yang mengerjakan batch ini?" → pilih
  nama → "Tugaskan N project yang tampil". Yang ditugaskan adalah yang sedang
  tampil, jadi saring dulu (misal batch tertentu) kalau tidak mau semuanya.

**Menambah orang baru:** tombol **+ Orang** di bagian "Siapa mengerjakan apa",
atau lewat ⚙. Centang *reviewer* kalau orang itu boleh menyetujui hasil.

---

## Alur kerja yang dipakai

**Tanpa sample**
`Belum mulai → Dikerjakan → (taruh di Edited) Pending review → Baldy/Indra setuju → SELESAI`

**Pakai sample klien**
`Buat sample → Kirim ke klien → jawaban klien`
→ **revisi**: brief klien tercatat, buat sample ronde berikutnya
→ **final**: apply warna ke semua slab → Pending review → setuju → SELESAI

Reviewer (Baldy & Indra) yang melihat tombol **"Review OK → SELESAI"** dan
**"Minta perbaikan"**. Kalau minta perbaikan, catatannya jadi brief baru dan
project balik ke pengerjaan. Orang lain hanya melihat tulisan "Menunggu review".

**Tenggat otomatis:** tiap tugas yang masuk langsung diberi target selesai
**7 hari sejak diterima**. Bisa diubah sendiri di detail project. Lewat tenggat
= tanda merah. Penanda **🔥 urgent** selalu naik ke paling atas.

**Sudah selesai lalu klien minta revisi lagi?** Buka project yang statusnya
Selesai → **"Klien minta revisi lagi"** → tulis brief barunya. Project kembali ke
antrean (yang pakai sample kembali ke jalur sample), diberi tanda
`REVISI KE-2`, dan brief lamanya tetap tersimpan.

**Tanda menyala di daftar:** `BARU` untuk yang baru masuk, `REVISI KE-N` untuk
yang dibuka lagi, `BARU SELESAI` untuk yang baru kelar, `URGENT` untuk yang
mendesak — masing-masing dengan garis warna di tepi kiri barisnya.

---

## Brief lama vs brief baru

Brief tidak pernah ditimpa. Di detail project (klik kodenya):

- brief **terbaru** tampil di kotak biru bertanda `BRIEF TERBARU DARI KLIEN` /
  `CATATAN REVIEW`;
- brief **lama** tetap di bawahnya, dicoret dan diredupkan, lengkap dengan
  tanggal, ronde, dan siapa yang menulis.

Di tabel dan kartu papan, brief terbaru dari klien ikut terlihat sekilas.

**Brief berbahasa Inggris otomatis di-Indonesia-kan.** Aplikasi membawa kamus
istilah CDK sendiri (tanpa internet, tanpa kunci API): "tone down the white"
→ "turunkan kadar putihnya", "add the missing area back" → "kembalikan area yang
hilang", "color match" → "samakan warna". Teks aslinya tetap ditampilkan di atas
terjemahan. Hasil otomatis memang kaku — siapa pun boleh menekan **Perbaiki**
dan menulis versi yang benar; perbaikan itu tersimpan untuk seluruh tim dan
selalu menang atas terjemahan otomatis. Saklar `🌐 Bahasa Indonesia` di bar atas
mematikan/menyalakan tampilan terjemahan.

---

## Beberapa orang mengedit bersamaan

- Halaman menyegarkan diri **tiap 15 detik** (dengan token) atau 60 detik (tanpa
  token), dan langsung menyusul begitu tab dibuka lagi. Perubahanmu muncul di
  layar tim tanpa mereka menekan apa pun.
- Kalau dua orang mengubah project yang **sama**, yang tersimpan paling akhir
  menang, tapi riwayat kerja kedua sisi digabung — tidak ada yang hilang.
- Project **baru** dari dua orang sama-sama masuk; yang **dihapus** tetap hilang.
- Kalau kamu sedang mengetik, penggambaran ulang ditunda sampai selesai supaya
  ketikanmu tidak lompat.

Perubahan dikirim 1,2 detik setelah ketikan terakhir. Kalau pengiriman gagal
(internet putus), aplikasi mencoba lagi sendiri tiap 20 detik dan datanya aman
di browser sampai berhasil.

---

## Berkas

| Berkas | Isi |
|---|---|
| `index.html` | seluruh aplikasi: tampilan, logika, dan salinan data awal |
| `data/db.json` | data hidup yang dipakai bersama (project, tim, batch) |
| `tools/uji.js` | 117 uji tanpa browser: `node tools/uji.js` |
| `tools/benih.js` | menyamakan data awal di `index.html` dengan `data/db.json` |

`data/db.json` dan data awal di dalam `index.html` wajib sama — ada ujinya.

## Cadangan & pemulihan

⚙ → **Unduh JSON** (cadangan), **Salin JSON**, atau **Pulihkan data awal** kalau
data di browser kacau dan mau kembali ke daftar bawaan.
