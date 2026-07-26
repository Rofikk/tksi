# Kawan Bus Pramusapa v0.3

**Status:** Prototipe uji coba lokal dengan pemisahan peran  
**Pengguna utama:** Pramusapa vendor di dalam bus  
**Tujuan:** Mendukung pelayanan tanpa mengalihkan perhatian dari pelanggan.

## Prinsip produk

1. Pelanggan dan kondisi di dalam bus selalu lebih penting daripada aplikasi.
2. Kawan Bus tidak menambah laporan rutin ketika kondisi normal.
3. Satu input menghasilkan konteks, riwayat, dan bahan analisis.
4. Identitas tugas, waktu, rute, arah, unit, dan vendor diisi sekali atau otomatis.
5. Keadaan darurat menggunakan prosedur dan kanal resmi; prototipe tidak boleh terlihat seolah sudah mengirim bantuan.
6. Informasi yang belum terverifikasi harus dinyatakan sebagai belum terverifikasi.
7. Data pribadi pelanggan tidak dicatat kecuali diwajibkan oleh prosedur resmi dan ditangani dalam sistem yang berwenang.

## Empat ruang kerja

### Tugas Hari Ini

Konfirmasi satu kali untuk nama Pramusapa, vendor, rute, unit, shift, dan arah. Data tersebut menjadi konteks otomatis laporan.

### Bantu Pelanggan

Panduan singkat untuk pertanyaan perjalanan, gangguan, keselamatan, keamanan, kenyamanan, pelanggan prioritas, dan barang pelanggan.

### Lapor Cepat

Mencatat pengecualian dalam kategori keselamatan dan keamanan, kenyamanan, informasi, atau pelayanan. Catatan tambahan bersifat opsional dan dibatasi.

### Riwayat dan Tindak Lanjut

Menampilkan catatan lokal dan membedakan kondisi yang dapat ditindaklanjuti dengan kondisi yang perlu segera diperiksa.

## Batas versi 0.2

- belum memiliki login dan manajemen pengguna;
- belum terhubung ke data penugasan;
- belum mengirim laporan kepada Korlap, vendor, atau pengendali;
- belum terhubung ke kanal bantuan resmi;
- belum mendukung foto, GPS, atau penggunaan offline yang tervalidasi;
- belum menggantikan formulir, IK, SOP, atau sistem resmi.

## Gerbang menuju pilot

Sebelum digunakan dalam tugas nyata, diperlukan validasi IK/SOP, persetujuan pemilik proses, pemetaan eskalasi, integrasi penugasan, keamanan data, pelatihan singkat, dan UAT bersama Pramusapa, Korlap, vendor, serta fungsi terkait.


## Pemisahan kewenangan penugasan

### Admin Vendor

- membuat penugasan Pramusapa;
- menetapkan vendor, tanggal, rute, unit, shift, dan arah;
- mengubah atau membatalkan penugasan;
- memantau status konfirmasi.

### Pramusapa

- melihat penugasan yang dibuat Admin Vendor;
- memeriksa kesesuaian tugas;
- mengonfirmasi penugasan;
- tidak dapat membuat atau mengubah penugasan.

Pada prototipe statis, Konsol Admin Vendor dan halaman Pramusapa berbagi penyimpanan lokal hanya bila digunakan pada browser/perangkat yang sama. Penggunaan lintas perangkat memerlukan backend, autentikasi, otorisasi berbasis peran, serta audit trail.
