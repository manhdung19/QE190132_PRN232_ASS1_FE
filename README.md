# QE190132_PRN232_Ass1_FE

Frontend giai đoạn A: Next.js App Router, TypeScript, Tailwind CSS, ESLint.
Tên thư mục là `Frontend` theo cấu trúc workspace; npm package dùng chữ thường `qe190132-prn232-ass1-fe`.

## Chạy local

Mở terminal trong `Frontend` (Node.js >= 20.9):

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
npm.cmd run dev
```

Mở http://localhost:3000. Trên máy này dùng `npm.cmd` để tránh PowerShell chặn `npm.ps1`.

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd start
```

- `app/`: layout, trang chủ, CSS.
- `components/`: component giao diện dùng chung.
- `lib/config.ts`: đọc `NEXT_PUBLIC_API_URL`, mặc định `http://localhost:5200/api`.
- `.env.example`: mẫu cấu hình, được phép commit; `.env.local` được bỏ qua.

Trang chủ hiện là giao diện khởi tạo, chưa có CRUD hay dữ liệu database. Tích hợp API thuộc giai đoạn sau. NEXT_PUBLIC_API_URL là địa chỉ công khai, không chứa secret; cần build lại khi đổi biến này trên Vercel.

Bạn tự tạo repo GitHub public cho nội dung thư mục Frontend. Commit cả package-lock.json để cài đặt nhất quán.
