# TaskTrack Frontend (Next.js) — Giai đoạn D Bàn giao

Ứng dụng Frontend quản lý công việc và dự án theo nhóm (**TaskTrack**) được xây dựng bằng **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS** và **ESLint**. Hệ thống tích hợp toàn diện với Backend API ASP.NET Core (.NET 8) và cơ sở dữ liệu PostgreSQL.

---

## 1. Yêu cầu môi trường & Cấu hình

- **Node.js**: Phiên bản `>= 20.9.0`
- **Backend API**: ASP.NET Core chạy tại `http://localhost:5200`
- **Biến môi trường**: Tạo file `.env.local` từ `.env.example`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5200/api
```

> **Lưu ý quan trọng về API URL:**
> - Biến `NEXT_PUBLIC_API_URL` **đã bao gồm tiền tố `/api`** (`http://localhost:5200/api`). Các endpoint được nối trực tiếp `${API_BASE_URL}/tasks`, tuyệt đối không lặp lại `/api`.
> - Toàn bộ 24 endpoint của hệ thống là public, không gửi header `Authorization`.

---

## 2. Hướng dẫn chạy và kiểm tra

Trong môi trường Windows PowerShell, sử dụng lệnh `npm.cmd`:

```powershell
# Cài đặt thư viện dependencies
npm.cmd ci

# Chạy môi trường phát triển (Dev server: http://localhost:3000)
npm.cmd run dev

# Kiểm tra cú pháp và quy chuẩn code (ESLint - 0 errors, 0 warnings)
npm.cmd run lint

# Biên dịch tối ưu hóa cho Production (Build 10/10 routes thành công)
npm.cmd run build

# Khởi chạy bản build Production
npm.cmd start
```

---

## 3. Danh mục 10 Route & Chức năng bàn giao Giai đoạn D

Toàn bộ 10 trang theo yêu cầu Assignment 1 đã hoàn thiện và kết nối trực tiếp với Backend API thật (không dùng dữ liệu giả lập/mock):

| STT | Tuyến đường (Route) | Mục đích & Chức năng chính | API Endpoints sử dụng |
|:---:|:---|:---|:---|
| 1 | `/` | **Trang chủ Dashboard**: Thống kê động tổng số phòng ban, dự án, công việc; danh sách dự án tiêu biểu kèm tiến độ và phím tắt thao tác. | `GET /api/departments`<br>`GET /api/projects`<br>`GET /api/tasks` |
| 2 | `/departments` | **Danh sách Phòng ban**: Lưới thẻ phòng ban với tìm kiếm theo tên/mô tả, số lượng dự án trực thuộc. | `GET /api/departments` |
| 3 | `/departments/[id]` | **Chi tiết Phòng ban**: Thông tin phòng ban và danh sách dự án thuộc phòng ban kèm tiến độ. | `GET /api/departments/{id}`<br>`GET /api/projects/department/{id}` |
| 4 | `/departments/manage` | **Quản lý Phòng ban**: Bảng danh sách, modal Tạo mới/Chỉnh sửa, xác nhận xóa. Chặn xóa (HTTP 400 `errors.operation`) nếu còn dự án liên kết. | `GET/POST/PUT/DELETE /api/departments` |
| 5 | `/projects/[id]` | **Chi tiết Dự án**: Tiến độ hoàn thành (progress bar), bộ lọc công việc thuộc dự án theo trạng thái, thẻ thông tin phòng ban. | `GET /api/projects/{id}`<br>`GET /api/tasks/project/{id}` |
| 6 | `/projects/manage` | **Quản lý Dự án**: Bảng dự án, lọc theo tên, phòng ban, trạng thái. Modal tạo/sửa với date validation (`endDate >= startDate`). Chặn xóa nếu còn task liên kết. | `GET/POST/PUT/DELETE /api/projects`<br>`GET /api/departments` |
| 7 | `/tasks/[id]` | **Chi tiết Công việc**: Metadata đầy đủ (phòng ban, dự án, ngày tạo, ngày cập nhật, hạn chót), huy hiệu nhãn màu và liên kết điều hướng. | `GET /api/tasks/{id}`<br>`GET /api/projects/{id}` |
| 8 | `/tasks/manage` | **Quản lý Công việc**: Bảng danh sách lọc đa tiêu chí, modal tạo/sửa với nạp chi tiết và multi-select tags. Cơ chế xóa mềm (`204 No Content`). | `GET/POST/PUT/DELETE /api/tasks`<br>`GET /api/projects`<br>`GET /api/tags` |
| 9 | `/tags/manage` | **Quản lý Nhãn (Tags)**: Bảng nhãn kèm màu sắc, bộ chọn màu HEX và bảng màu mẫu trực quan, modal sửa từ dữ liệu danh sách (không có GET detail). Chặn xóa khi còn gắn vào task. | `GET/POST/PUT/DELETE /api/tags` |
| 10 | `/search` | **Tìm kiếm Công việc**: Tìm kiếm kết hợp AND đồng thời theo từ khóa tiêu đề, dự án, trạng thái, độ ưu tiên và nhãn phân loại. | `GET /api/tasks/search`<br>`GET /api/projects`<br>`GET /api/tags` |

---

## 4. Cấu trúc mã nguồn

```
Frontend/
├── app/
│   ├── layout.tsx                # Root layout chứa Navbar, Footer, ToastProvider
│   ├── page.tsx                  # /: Trang chủ Dashboard
│   ├── globals.css               # Định nghĩa màu sắc, utility classes
│   ├── departments/
│   │   ├── page.tsx              # /departments: Danh sách phòng ban
│   │   ├── [id]/page.tsx         # /departments/[id]: Chi tiết phòng ban
│   │   └── manage/page.tsx       # /departments/manage: Quản lý phòng ban (CRUD)
│   ├── projects/
│   │   ├── [id]/page.tsx         # /projects/[id]: Chi tiết dự án
│   │   └── manage/page.tsx       # /projects/manage: Quản lý dự án (CRUD)
│   ├── tasks/
│   │   ├── [id]/page.tsx         # /tasks/[id]: Chi tiết công việc
│   │   └── manage/page.tsx       # /tasks/manage: Quản lý công việc (CRUD)
│   ├── tags/
│   │   └── manage/page.tsx       # /tags/manage: Quản lý nhãn phân loại (CRUD)
│   └── search/
│       └── page.tsx              # /search: Tìm kiếm công việc đa tiêu chí
├── components/
│   ├── navbar.tsx                # Thanh điều hướng trên cùng (Desktop & Mobile drawer)
│   ├── footer.tsx                # Chân trang với liên kết điều hướng
│   ├── badges.tsx                # Badge trạng thái dự án, task, độ ưu tiên, nhãn tag màu
│   ├── toast-context.tsx         # Hệ thống thông báo Toast (Success, Error, Info, Warning)
│   └── ui/                       # Thư viện UI primitives
│       ├── confirm-dialog.tsx    # Hộp thoại xác nhận thao tác (hỗ trợ phím Escape)
│       ├── empty-state.tsx       # Màn hình hiển thị danh sách rỗng
│       ├── error-alert.tsx       # Báo lỗi mạng/API kèm nút thử lại
│       ├── form-controls.tsx     # FormField, Input, Textarea, Select, Checkbox
│       └── loading.tsx           # Skeleton loading và Spinner
└── lib/
    ├── api.ts                    # Re-export các module API
    ├── api-client.ts             # Typed HTTP client hỗ trợ ProblemDetails, RFC 7807
    ├── config.ts                 # Đọc cấu hình môi trường
    ├── constants.ts              # Nhãn enum, bảng màu, helper ngày tháng DD/MM/YYYY
    └── types.ts                  # TypeScript Interfaces/Enums chuẩn hóa theo DTO Backend
```

---

## 5. Quy tắc nghiệp vụ và Xử lý lỗi đã kiểm chứng

1. **Hiển thị Enum**: Toàn bộ trạng thái số (`0..3`) của Dự án, Công việc và Mức ưu tiên được chuyển đổi thành nhãn tiếng Việt rõ nghĩa và huy hiệu màu sắc tương ứng.
2. **Quy tắc Xóa an toàn & Chặn xóa:**
   - **Xóa Phòng ban / Dự án / Nhãn**: Backend chặn xóa và trả về HTTP `400 Bad Request` kèm thông báo trong `errors.operation` nếu còn bản ghi liên kết (kể cả bản ghi inactive). Frontend bắt đúng lỗi này, hiển thị Toast cảnh báo và **không xóa** dòng tương ứng khỏi giao diện.
   - **Xóa Công việc**: Áp dụng cơ chế **xóa mềm (soft delete)** trả về HTTP `204 No Content`. Công việc chuyển sang `isActive = false` và tự động biến mất khỏi danh sách active trên UI.
3. **Cập nhật Nhãn cho Công việc**: Thao tác `PUT /api/tasks/{id}` thay thế toàn bộ danh sách `tagIds`. Khi người dùng bỏ chọn tất cả nhãn, client gửi mảng rỗng `[]` để xóa toàn bộ nhãn khỏi công việc theo đúng API Contract.
4. **Trải nghiệm & Khả năng tiếp cận**:
   - Tất cả các modal Tạo mới / Chỉnh sửa và dialog Xác nhận xóa đều hỗ trợ phím **`Escape`** để đóng nhanh.
   - Form tự động autofocus vào ô nhập liệu đầu tiên khi mở modal.
   - Định dạng ngày tháng hiển thị theo chuẩn `DD/MM/YYYY` (ngày) và `DD/MM/YYYY, HH:mm` (ngày giờ).

---

## 6. Trạng thái bàn giao & Bước tiếp theo (Giai đoạn E)

- **Kết quả nghiệm thu Giai đoạn D**:
  - `npm.cmd run lint`: Đạt 0 lỗi, 0 cảnh báo.
  - `npm.cmd run build`: Biên dịch Turbopack thành công 10/10 route.
  - 10 route hoạt động ổn định với Backend API PostgreSQL local thật.
- **Kế hoạch Giai đoạn E**:
  - Kiểm thử tích hợp tự động End-to-End (E2E testing với Playwright / Script E2E).
  - Triển khai Backend API lên dịch vụ đám mây (Render) và Frontend lên Vercel.
  - Cấu hình CORS production và xác thực domain thực tế.
