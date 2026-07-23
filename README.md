<div align="center">

# ⚡ YouTube to R2 Cloud Studio

**Hệ thống chuyển đổi & lưu trữ Audio Serverless chuẩn Enterprise**

Tự động tải âm thanh từ YouTube, tối ưu hoá chất lượng, loại bỏ metadata và upload trực tiếp lên Cloudflare R2 Storage hoàn toàn **MIỄN PHÍ**.

[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/products/orca/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

</div>

## 🌟 Tính Năng Nổi Bật

- ⚡ **100% Serverless & Miễn phí:** Chạy hoàn toàn trên Cloudflare Pages, GitHub Actions và Cloudflare R2 (0đ chi phí duy trì VPS).
- 🔓 **Bẻ khóa bảo mật YouTube (N-Challenge Fix):** Tích hợp **Deno JS Runtime** & `yt-dlp[default]` vượt qua thuật toán chống bot mới nhất của YouTube.
- 🎵 **Đa dạng định dạng:** Hỗ trợ xuất file âm thanh `MP3` (Phổ biến), `M4A` (Chất lượng cao), `WAV` (Không nén).
- 🛡️ **Bảo mật chuẩn Enterprise:**
  - Chống lỗ hổng **Command Injection** phía Serverless Function.
  - Chống **XSS Attack** phía Frontend.
  - Tự động dọn dẹp file Cookies nhạy cảm bằng cơ chế `trap` của Shell ngay sau khi tiến trình hoàn tất.
- 🎨 **Giao diện hiện đại (Modern Dark UI):** Thiết kế tối giản, mượt mà với Tailwind CSS, hỗ trợ Responsive hoàn hảo trên mọi thiết bị.

---

## 🏗️ Kiến Trúc Hệ Thống (Architecture)

```text
┌───────────────┐     POST /api/download     ┌────────────────────────┐
│               │ ─────────────────────────> │                        │
│   Web Client  │                            │ Cloudflare Pages Function│
│ (index.html)  │ <───────────────────────── │     (download.js)      │
└───────────────┘       Success/Error        └───────────┬────────────┘
                                                         │
                                               Dispatch Event API
                                                         │
                                                         ▼
┌───────────────┐      Upload Audio File     ┌────────────────────────┐
│ Cloudflare R2 │ <───────────────────────── │     GitHub Actions     │
│    Storage    │                            │     (download.yml)     │
└───────────────┘                            └───────────┬────────────┘
                                                         │
                                               Clean Temporary Files 🧹
```

---

## 🛠️ Hướng Dẫn Deploy Chi Tiết (Step-by-Step)

<details>
<summary><b>📍 Bước 1: Fork Kho Lưu Trữ (Repository)</b></summary>

Bấm nút **Fork** ở góc trên bên phải của trang GitHub này để sao chép dự án về tài khoản của bạn.
</details>

<details>
<summary><b>📍 Bước 2: Cấu Hình Cloudflare R2 Bucket</b></summary>

1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Vào mục **R2 Object Storage** -> Chọn **Create bucket** -> Đặt tên bucket (VD: `my-media-bucket`).
3. Tại **Settings** của Bucket -> **Public Access**, bật **Custom Domain** hoặc **R2.dev Subdomain** để lấy Domain công khai (VD: `https://pub-xyz.r2.dev`).
4. Ra lại trang chủ R2 -> Nhấp **Manage R2 API Tokens** -> Tạo API Token mới với quyền **Object Read & Write**.
5. Lưu lại 3 thông tin: `Access Key ID`, `Secret Access Key`, và `Endpoint URL`.
</details>

<details>
<summary><b>📍 Bước 3: Tạo GitHub Personal Access Token (PAT)</b></summary>

1. Trên GitHub: **Settings** -> **Developer Settings** -> **Personal Access Tokens** -> **Tokens (classic)**.
2. Chọn **Generate new token (classic)**:
   - **Note:** `Cloudflare Pages Trigger`
   - **Scopes:** Tích chọn `workflow` và `repo`.
3. Bấm **Generate token** và sao chép lại mã Token này.
</details>

<details>
<summary><b>📍 Bước 4: Lấy YouTube Cookies (Base64)</b></summary>

1. Cài Extension **Get cookies.txt LOCALLY** trên trình duyệt.
2. Mở YouTube (đã đăng nhập tài khoản phụ) -> Bấm vào Extension để tải file `cookies.txt`.
3. Truy cập [Base64Encode.org](https://www.base64encode.org/), tải file `cookies.txt` lên để **mã hóa thành chuỗi Base64**.
</details>

<details>
<summary><b>📍 Bước 5: Cấu Hình GitHub Secrets</b></summary>

Vào Repo trên GitHub -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret** và thêm các biến:

| Tên Secret | Giá trị (Value) |
| :--- | :--- |
| `YOUTUBE_COOKIES` | Chuỗi Base64 của Cookie thu được ở Bước 4 |
| `R2_ACCESS_KEY_ID` | Access Key ID của R2 |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key của R2 |
| `R2_BUCKET_NAME` | Tên Bucket R2 của bạn |
| `R2_ENDPOINT_URL` | Endpoint URL của R2 |
| `R2_PUBLIC_DOMAIN` | Domain công khai để nghe/tải file (VD: `https://pub-xyz.r2.dev`) |
</details>

<details>
<summary><b>📍 Bước 6: Deploy Lên Cloudflare Pages</b></summary>

1. Vào Cloudflare Dashboard -> **Workers & Pages** -> **Create Application** -> **Pages** -> **Connect to Git**.
2. Chọn Repository của bạn -> **Begin setup**.
3. Build settings:
   - **Framework preset:** `None`
   - **Build output directory:** `.`
4. Tại **Environment variables**, thêm 3 biến:

| Variable Name | Value |
| :--- | :--- |
| `GITHUB_USERNAME` | Tên tài khoản GitHub của bạn |
| `GITHUB_REPO` | Tên Repo của bạn (VD: `youtube-to-r2`) |
| `GITHUB_PAT` | Mã GitHub Personal Access Token |

5. Nhấp **Save and Deploy**.
</details>

---

## 🔒 An Toàn & Bảo Mật

- **Hạn dùng Cookie:** Nếu thấy hệ thống báo lỗi *"Sign in to confirm you're not a bot"*, hãy cập nhật lại Secret `YOUTUBE_COOKIES` trên GitHub với Cookie mới.
- **Tự động dọn dẹp:** File tạm và Cookie trên GitHub Runner đều được xóa sạch bằng `trap` sau mỗi lần chạy, đảm bảo an toàn tuyệt đối.

---

## 📜 Giấy Phép (License)

Dự án được phân phối dưới giấy phép [MIT License](LICENSE).
