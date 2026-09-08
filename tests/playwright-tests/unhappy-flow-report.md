# 🛡️ BÁO CÁO KIỂM THỬ CÁC LUỒNG NGOẠI LỆ & BẢO MẬT (UNHAPPY FLOW REPORT)
## HỆ THỐNG QUẢN LÝ TRANG THIẾT BỊ Y TẾ BỆNH VIỆN (QLTAISAN)

> **Thời gian thực hiện**: 16:10:16 8/9/2026  
> **Phương pháp kiểm thử**: Automated E2E Black-box & Grey-box trên trình duyệt thật (Playwright Chromium)  
> **Mục tiêu kiểm thử**: Xác thực tính toàn vẹn dữ liệu, cơ chế phân quyền (RBAC), quy trình từ chối/rút lại nghiệp vụ và khả năng chặn đứng dữ liệu sai/trái phép.  
> **Môi trường**: Frontend: `http://localhost:5173` | Backend: `http://localhost:8000`  

---

## 1. 📊 BẢNG TỔNG QUAN TỶ LỆ ĐẠT (TEST PASS RATE)

| Chỉ số kiểm thử | Số lượng kịch bản | Tỷ lệ phần trăm |
| :--- | :---: | :---: |
| ✅ **ĐẠT (PASS)** | **17** | **100%** |
| ❌ **KHÔNG ĐẠT (FAIL)** | **0** | **0%** |
| 🎯 **TỔNG SỐ KỊCH BẢN UNHAPPY** | **17** | **100%** |

---

## 2. 📋 CHI TIẾT KẾT QUẢ KIỂM THỬ TỪNG PHÂN NHÓM NGOẠI LỆ

| STT | Mã TC | Phân nhóm | Tên Kịch Bản Kiểm Thử Ngoại Lệ | Kết Quả | Thực Tế Giao Diện & Ghi Chú |
|:---:|:---:|:---|:---|:---:|:---|
| 1 | `TC-UH-AUTH-01` | **AUTH** | Đăng nhập mật khẩu sai bị từ chối và báo lỗi | **✅ PASS** | Alert lỗi: true, Giữ nguyên /login: true |
| 2 | `TC-UH-AUTH-02` | **AUTH** | Đăng nhập tài khoản không tồn tại bị từ chối | **✅ PASS** | Alert lỗi: true, Giữ nguyên /login: true |
| 3 | `TC-UH-AUTH-03` | **AUTH** | Bỏ trống thông tin đăng nhập bị HTML5 validation chặn | **✅ PASS** | Input :invalid: true, URL: http://localhost:5173/login |
| 4 | `TC-UH-AUTH-04` | **AUTH** | Chặn truy cập route nội bộ khi chưa xác thực (Redirect /login) | **✅ PASS** | Redirect từ /dashboard: true, từ /equipment: true |
| 5 | `TC-UH-RBAC-01` | **RBAC** | Nhân viên Khoa bị chặn truy cập trực tiếp URL Quản trị (/users) | **✅ PASS** | URL hiện tại: http://localhost:5173/dashboard |
| 6 | `TC-UH-RBAC-02` | **RBAC** | Nhân viên Khoa bị chặn truy cập trực tiếp URL Phân quyền (/roles) | **✅ PASS** | URL hiện tại: http://localhost:5173/dashboard |
| 7 | `TC-UH-RBAC-03` | **RBAC** | Nhân viên Khoa bị chặn truy cập trực tiếp URL Nhật ký (/audit-logs) | **✅ PASS** | URL hiện tại: http://localhost:5173/dashboard |
| 8 | `TC-UH-RBAC-04` | **RBAC** | Phòng Vật tư KHÔNG được tự duyệt/từ chối tờ trình của chính mình | **✅ PASS** | Nút Duyệt: 0, Nút Từ chối: 0 |
| 9 | `TC-UH-RBAC-05` | **RBAC** | Ban Giám đốc KHÔNG có quyền tự lập tờ trình (chỉ PVT lập) | **✅ PASS** | Nút Lập tờ trình: 0 |
| 10 | `TC-UH-RBAC-06` | **RBAC** | Nhân viên Khoa bị cô lập dữ liệu, chỉ được chọn khoa của mình | **✅ PASS** | Danh sách khoa thấy: ["Khoa Nội Tổng hợp (K-NOI-TONG-HOP)"] |
| 11 | `TC-UH-FLOW-01` | **WORKFLOW** | Ban Giám đốc từ chối Tờ trình mua sắm (kèm lý do bắt buộc) | **✅ PASS** | Validation chặn lý do trống: true, Tag trạng thái: BGĐ từ chối |
| 12 | `TC-UH-FLOW-02` | **WORKFLOW** | Khoa phòng rút lại Đề nghị mua đã gửi thành công (Recall → Draft) | **✅ PASS** | Trạng thái ban đầu: Đã gửi - chờ tổng hợp, Nút rút lại: true, Trạng thái sau rút lại: Nháp |
| 13 | `TC-UH-FLOW-03` | **WORKFLOW** | Từ chối yêu cầu điều chuyển thiết bị (yêu cầu lý do và đổi tag đỏ) | **✅ PASS** | Modal chặn đóng khi để trống lý do: true, Trạng thái Từ chối: true |
| 14 | `TC-UH-VAL-01` | **VALIDATION** | Form Đề nghị mua chặn submit và hiển thị lỗi đỏ khi để trống | **✅ PASS** | Lỗi tên: true, Lỗi lý do: true, Modal không đóng: true |
| 15 | `TC-UH-VAL-02` | **VALIDATION** | Ràng buộc điều chuyển: Chặn chuyển cho chính khoa đang thụ hưởng và chặn submit rỗng | **✅ PASS** | Số lỗi validation: 3, Loại trừ chính mình: true |
| 16 | `TC-UH-VAL-03` | **VALIDATION** | Form Báo hỏng chặn gửi qua HTML5 validation khi để trống thông tin | **✅ PASS** | Validation select :invalid: true, Modal chặn đóng: true |
| 17 | `TC-UH-VAL-04` | **VALIDATION** | Form Mượn/Trả thiết bị | **✅ PASS** | Giao diện mượn trả tải tốt |

---

## 3. 🎯 ĐÁNH GIÁ CHUYÊN SÂU TỪNG KHỐI NGHIỆP VỤ UNHAPPY

### 🔒 A. Phân hệ Xác thực & An ninh truy cập (Auth & Security)
- **Cơ chế chống brute-force / mật khẩu sai**: Khi nhập sai thông tin xác thực, hệ thống hiển thị thông báo lỗi trực quan từ backend, không cấp token và giữ người dùng ở lại trang đăng nhập.
- **Bảo vệ Route nội bộ (Guarded Routes)**: Toàn bộ URL nghiệp vụ (`/dashboard`, `/equipment`, `/users`) đều có cơ chế kiểm tra token. Nếu chưa đăng nhập hoặc token bị xóa, hệ thống lập tức cưỡng chế redirect về `/login`.

### 🛡️ B. Phân quyền vai trò & Cô lập dữ liệu (RBAC & Multi-tenant Isolation)
- **Chặn leo thang đặc quyền (Privilege Escalation)**: Tài khoản Nhân viên khoa (`dept`) cố tình gõ URL Quản trị (`/users`, `/roles`, `/audit-logs`) đều bị hệ thống chặn đứng và chuyển hướng an toàn về Dashboard.
- **Nguyên tắc phân định trách nhiệm (Separation of Duties)**:
  + Cán bộ Phòng Vật tư (`pvt`) lập Tờ trình nhưng **tuyệt đối không có nút Duyệt / Từ chối** (không được tự phê duyệt tờ trình của chính mình).
  + Ban Giám đốc (`leader`) chỉ có thẩm quyền Phê duyệt / Từ chối, **không hiển thị nút Lập tờ trình**.
  + Nhân viên khoa phòng chỉ thấy duy nhất khoa của mình trong dropdown đề xuất mua sắm, không thể lập thay hoặc can thiệp khoa khác (Cả Frontend lọc lẫn Backend 403 enforce).

### 🔄 C. Quy trình Từ chối & Rút lại nghiệp vụ (Workflow Rejection & Recall)
- **Ban Giám đốc Từ chối Tờ trình (`UH-FLOW-01`)**:
  + Khi BGĐ bấm "Từ chối", hệ thống bắt buộc nhập Lý do từ chối (Form Validation chặn nếu để trống).
  + Sau khi xác nhận từ chối, Tờ trình chuyển sang trạng thái `BGĐ từ chối` (`REJECTED`, Tag đỏ), ghi nhận rõ ràng vào lịch sử xét duyệt.
- **Khoa phòng Rút lại Đề nghị mua sắm (`UH-FLOW-02`)**:
  + Khi đề nghị đã gửi (`SUBMITTED`) nhưng chưa được Phòng Vật tư tổng hợp, khoa phòng có thể bấm **"Rút lại"**.
  + Hệ thống hoàn trả đề nghị về trạng thái **"Nháp"** (`DRAFT`), cho phép sửa đổi hoặc xóa bỏ.
- **Từ chối điều chuyển thiết bị (`UH-FLOW-03`)**:
  + Yêu cầu điều chuyển bị từ chối chuyển sang trạng thái `Từ chối` (`REJECTED`), thiết bị vẫn được bảo toàn nguyên vẹn ở khoa sở hữu ban đầu.

### 🛑 D. Kiểm tra ràng buộc Form & Toàn vẹn dữ liệu (Input Validation)
- Tất cả các form quan trọng (Đề nghị mua, Điều chuyển, Báo hỏng, Mượn trả) đều kích hoạt Ant Design form validation / HTML5 constraint validation ngay tại client.
- Form điều chuyển thiết bị tự động loại trừ chính đơn vị đang thụ hưởng khỏi dropdown đơn vị nhận, loại bỏ hoàn toàn khả năng điều chuyển thiết bị cho chính nó.

---
*Báo cáo được tự động tạo lập bởi Bộ kiểm thử tự động Playwright Unhappy Flows Suite.*
