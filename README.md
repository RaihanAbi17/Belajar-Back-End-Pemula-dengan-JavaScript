# Bookshelf API — Submission

Project ini dibuat untuk memenuhi submission **Bookshelf API**.

## Kriteria yang dipenuhi

1. Aplikasi menggunakan port **9000**.
2. Aplikasi dapat dijalankan dengan **`npm run start`** dan tidak bergantung pada `nodemon`.
3. **POST `/books`** untuk menyimpan buku, lengkap dengan validasi nama dan `readPage <= pageCount`.
4. **GET `/books`** untuk menampilkan seluruh buku.
5. **GET `/books/{bookId}`** untuk menampilkan detail buku.
6. **PUT `/books/{bookId}`** untuk mengubah data buku.
7. **DELETE `/books/{bookId}`** untuk menghapus buku.

### Fitur tambahan

- Filter `reading=1` atau `reading=0`.
- Filter `finished=1` atau `finished=0`.
- Filter pencarian nama menggunakan `name=Dicoding`.

## Cara menjalankan

Pastikan Node.js sudah terpasang.

```bash
npm run start
```

Server akan berjalan di:

```text
http://localhost:9000
```

Tidak diperlukan database untuk submission ini karena data disimpan sementara di memory server.

## Pengujian dengan Postman

Folder `postman/` berisi collection dan environment yang diberikan pada instruksi submission.

Import kedua file tersebut ke Postman, pilih environment **Bookshelf API Test**, lalu jalankan collection sesuai urutan.

> Karena data disimpan di memory, setiap kali server dihentikan lalu dijalankan kembali, data buku akan kembali kosong.
