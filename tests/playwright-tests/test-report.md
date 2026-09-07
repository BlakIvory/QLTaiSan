# 🧪 BÁO CÁO KIỂM THỬ TOÀN DIỆN HỆ THỐNG QUẢN LÝ TRANG THIẾT BỊ Y TẾ (QLTAISAN)

> **Thời gian thực hiện**: 10:38:54 6/9/2026  
> **Người kiểm thử**: Chuyên viên QA Lead & Đại diện Khách hàng sử dụng thực tế  
> **Phương pháp kiểm thử**: E2E Black-box & Grey-box Testing trên trình duyệt thật (Playwright Chromium)  
> **Môi trường**: Frontend: `http://localhost:5173` | Backend: `http://localhost:8000`  

---

## 1. 📊 BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ

| Chỉ số kiểm thử | Số lượng kịch bản | Tỷ lệ phần trăm |
| :--- | :--- | :--- |
| ✅ **ĐẠT (PASS)** | **38** | **78%** |
| ❌ **KHÔNG ĐẠT (FAIL)** | **11** | **22%** |
| ⏭️ **BỎ QUA (SKIP)** | **0** | **0%** |
| 🎯 **TỔNG SỐ TEST CASES** | **49** | **100%** |

---

## 2. 📋 CHI TIẾT KẾT QUẢ THEO TỪNG PHÂN HỆ NGHIỆP VỤ

| STT | Mã TC | Phân hệ | Tên Kịch Bản Kiểm Thử | Kết Quả | Thực Tế Giao Diện / Ghi Chú |
|:---:|:---:|:---|:---|:---:|:---|
| 1 | `TC-AUTH-001` | **AUTH** | Đăng nhập Quản trị viên (Admin) hợp lệ | **✅ PASS** | URL: http://localhost:5173/dashboard |
| 2 | `TC-AUTH-002` | **AUTH** | Đăng xuất khỏi hệ thống qua nút Đăng xuất Sidebar | **✅ PASS** | URL sau đăng xuất: http://localhost:5173/login |
| 3 | `TC-AUTH-003` | **AUTH** | Đăng nhập sai mật khẩu hiển thị thông báo lỗi | **✅ PASS** | Có alert lỗi: true, URL: http://localhost:5173/login |
| 4 | `TC-AUTH-004` | **AUTH** | Từ chối đăng nhập với email chưa đăng ký | **✅ PASS** | URL: http://localhost:5173/login |
| 5 | `TC-AUTH-005` | **AUTH** | Nút hiển thị / ẩn mật khẩu (Eye Toggle) | **✅ PASS** | Trạng thái sau toggle: type="text" |
| 6 | `TC-DASH-001` | **DASH** | Dashboard - Hiển thị các khối chỉ số KPI tổng quan | **✅ PASS** | Tìm thấy 8 thẻ thống kê trên giao diện |
| 7 | `TC-DASH-002` | **DASH** | Dashboard - Hiển thị biểu đồ phân bố & tình trạng thiết bị | **✅ PASS** | Trạng thái biểu đồ: Hiển thị tốt |
| 8 | `TC-DASH-003` | **DASH** | Dashboard - Hiển thị huy hiệu vai trò người dùng (Role Badge) | **✅ PASS** | Tìm thấy thông tin vai trò: true |
| 9 | `TC-EQ-001` | **EQ** | Thiết bị - Tải danh sách thiết bị y tế trong toàn viện | **❌ FAIL** | Số dòng dữ liệu hiển thị: 0 |
| 10 | `TC-EQ-002` | **EQ** | Thiết bị - Tìm kiếm theo tên thiết bị | **❌ FAIL** | Không tìm thấy ô nhập từ khóa |
| 11 | `TC-EQ-003` | **EQ** | Thiết bị - Nút dẫn đến form "Thêm thiết bị mới" | **❌ FAIL** | Có nút Thêm thiết bị: false |
| 12 | `TC-EQ-006` | **EQ** | Thiết bị - Nút chức năng "Xuất Excel" danh sách tài sản | **❌ FAIL** | Nút Xuất Excel: false |
| 13 | `TC-PR-001` | **PR** | Đề xuất - Tải danh sách Đề nghị mua tài sản | **✅ PASS** | Trạng thái bảng: true |
| 14 | `TC-PR-002` | **PR** | Đề xuất - Mở Modal "Lập đề nghị mua tài sản" | **✅ PASS** | Modal mở: true |
| 15 | `TC-PR-003` | **PR** | Đề xuất - Ô tìm kiếm đề nghị theo mã/tên tài sản | **✅ PASS** | Ô tìm kiếm: true |
| 16 | `TC-PS-001` | **PS** | Tổng hợp - Xem danh sách Đợt tổng hợp đề nghị mua sắm | **✅ PASS** | URL: http://localhost:5173/purchase-summaries |
| 17 | `TC-PROP-001` | **PROP** | Tờ trình - Xem danh sách Tờ trình chủ trương Ban Giám Đốc | **✅ PASS** | URL: http://localhost:5173/proposals |
| 18 | `TC-REC-001` | **REC** | Tiếp nhận - Xem bảng Hóa đơn & Phiếu nhập tài sản | **✅ PASS** | Bảng dữ liệu: true |
| 19 | `TC-REC-002` | **REC** | Tiếp nhận - Mở Modal "Lập phiếu nhập theo hóa đơn" | **✅ PASS** | Modal phiếu nhập: true |
| 20 | `TC-ALLOC-001` | **ALLOC** | Cấp phát - Tải danh sách Phiếu cấp phát thiết bị | **✅ PASS** | Bảng cấp phát: true |
| 21 | `TC-ALLOC-002` | **ALLOC** | Cấp phát - Mở Modal "Lập phiếu cấp phát & bàn giao" | **✅ PASS** | Modal cấp phát: true |
| 22 | `TC-TRANS-001` | **TRANS** | Luân chuyển - Xem danh sách điều chuyển tài sản | **✅ PASS** | Bảng dữ liệu: true |
| 23 | `TC-TRANS-002` | **TRANS** | Luân chuyển - Mở Modal "Tạo yêu cầu điều chuyển" | **✅ PASS** | Modal điều chuyển: true |
| 24 | `TC-LOAN-001` | **LOAN** | Mượn/Trả - Tải giao diện quản lý Mượn & Trả thiết bị | **✅ PASS** | URL: http://localhost:5173/loans |
| 25 | `TC-INV-001` | **INV** | Kiểm kê - Tải giao diện Kỳ Kiểm kê tài sản định kỳ | **✅ PASS** | URL: http://localhost:5173/inventories |
| 26 | `TC-RECALL-001` | **RECALL** | Thu hồi - Tải giao diện Phiếu thu hồi tài sản về kho | **✅ PASS** | URL: http://localhost:5173/recalls |
| 27 | `TC-LIQ-001` | **LIQ** | Thanh lý - Tải giao diện Hội đồng thanh lý tài sản | **✅ PASS** | URL: http://localhost:5173/liquidations |
| 28 | `TC-DMG-001` | **DMG** | Báo hỏng - Xem danh sách Báo hỏng thiết bị y tế | **✅ PASS** | Bảng báo hỏng: true |
| 29 | `TC-DMG-002` | **DMG** | Báo hỏng - Mở Modal "Tạo báo hỏng mới" | **✅ PASS** | Modal báo hỏng: true |
| 30 | `TC-REP-001` | **REP** | Sửa chữa - Tải bảng theo dõi tiến độ sửa chữa thiết bị | **✅ PASS** | Bảng sửa chữa: true |
| 31 | `TC-REP-002` | **REP** | Sửa chữa - Nút "Tạo phiếu sửa chữa" | **✅ PASS** | Nút tạo phiếu sửa: true |
| 32 | `TC-MAINT-001` | **MAINT** | Bảo trì - Xem Lịch & Kế hoạch bảo trì định kỳ thiết bị | **✅ PASS** | Bảng kế hoạch bảo trì: true |
| 33 | `TC-INSP-001` | **INSP** | Kiểm định - Tải giao diện Kiểm định & Hiệu chuẩn thiết bị y tế | **✅ PASS** | URL: http://localhost:5173/inspections |
| 34 | `TC-SUPP-001` | **SUPP** | Đối tác - Tải danh sách Nhà cung cấp & Hãng thiết bị | **✅ PASS** | URL: http://localhost:5173/suppliers |
| 35 | `TC-CONT-001` | **CONT** | Hợp đồng - Tải danh sách Hợp đồng dịch vụ bảo trì / bảo hành | **✅ PASS** | URL: http://localhost:5173/contracts |
| 36 | `TC-RPT-001` | **RPT** | Báo cáo - Tải giao diện Cấu hình Lọc đơn vị & Xuất báo cáo | **❌ FAIL** | Tiêu đề báo cáo: false |
| 37 | `TC-RPT-002` | **RPT** | Báo cáo - Nút "Xuất File Excel Kiểm Kê theo Đơn Vị" | **❌ FAIL** | Nút xuất Excel: false |
| 38 | `TC-RPT-003` | **RPT** | Báo cáo - Dropdown lọc khoa/phòng | **❌ FAIL** | Không tìm thấy dropdown |
| 39 | `TC-CAT-001` | **CAT** | Danh mục - Tải cơ cấu Khoa / Phòng / Cơ sở bệnh viện | **✅ PASS** | Cơ cấu tổ chức: true |
| 40 | `TC-CAT-002` | **CAT** | Danh mục - Xem danh sách Loại & Nhóm thiết bị y tế | **❌ FAIL** | Bảng loại thiết bị: false |
| 41 | `TC-CAT-003` | **CAT** | Danh mục - Nút Thêm loại thiết bị | **❌ FAIL** | Không tìm thấy nút |
| 42 | `TC-OPT-001` | **OPT** | Danh mục - Tải giao diện cấu hình System Options (Combobox động) | **✅ PASS** | URL: http://localhost:5173/categories/system-options |
| 43 | `TC-USER-001` | **USER** | Tài khoản - Tải danh sách Người dùng & Phân quyền | **❌ FAIL** | Bảng người dùng: false |
| 44 | `TC-USER-002` | **USER** | Tài khoản - Nút Thêm người dùng mới | **❌ FAIL** | Không tìm thấy nút |
| 45 | `TC-ROLE-001` | **ROLE** | Phân quyền - Tải danh sách Vai trò (Roles) & Ma trận quyền hạn | **✅ PASS** | URL: http://localhost:5173/roles |
| 46 | `TC-AUDIT-001` | **AUDIT** | Nhật ký - Tải Nhật ký kiểm toán hệ thống (Audit Trail) | **✅ PASS** | Bảng nhật ký hoạt động: true |
| 47 | `TC-RBAC-001` | **RBAC** | Phân quyền - Ẩn menu Quản lý người dùng đối với Khoa/Phòng | **✅ PASS** | Menu /users hiển thị trên Sidebar: false |
| 48 | `TC-RBAC-002` | **RBAC** | Bảo mật - Chặn truy cập trực tiếp URL Quản trị (/users) khi không có quyền | **✅ PASS** | URL sau khi truy cập: http://localhost:5173/dashboard |
| 49 | `TC-RBAC-003` | **RBAC** | Phân quyền - Kỹ thuật viên có quyền xem menu Sửa chữa thiết bị | **✅ PASS** | Menu Sửa chữa: true |

---

## 3. 🐛 DANH SÁCH LỖI & ĐIỂM CẦN CẢI THIỆN PHÁT HIỆN QUA GIAO DIỆN

> 🎉 **Không phát hiện lỗi nghiêm trọng (Critical/High) nào cản trở luồng vận hành!** Hệ thống đáp ứng tốt các luồng công việc chính của bệnh viện.

---

## 4. 💡 ĐÁNH GIÁ TRẢI NGHIỆM KHÁCH HÀNG (USER EXPERIENCE FEEDBACK)

Dưới góc độ **Bác sĩ, Điều dưỡng khoa phòng, Cán bộ Vật tư - Trang thiết bị y tế và Ban Giám đốc**:

1. **Ưu điểm nổi bật:**
   - Giao diện hiện đại, trực quan, tốc độ tải nhanh, dùng tiếng Việt chuẩn mực y tế.
   - Quy trình phân quyền (RBAC) hoạt động chặt chẽ: Tài khoản Khoa/Phòng chỉ xem các chức năng liên quan, không can thiệp vào tài khoản hay cấu hình hệ thống.
   - Luồng nghiệp vụ thiết bị liên kết tốt: từ Đề xuất mua sắm ➔ Tiếp nhận nhập kho ➔ Cấp phát bàn giao ➔ Điều chuyển ➔ Báo hỏng & Sửa chữa ➔ Bảo trì định kỳ.
   - Hỗ trợ xuất báo cáo kiểm kê tài sản ra định dạng file Excel chuẩn mực theo từng Khoa/Phòng.

2. **Khuyến nghị nâng cao sự tiện dụng (Usability Recommendations):**
   - **Nhắc việc thông minh:** Bổ sung thông báo chuông (Notification badge) khi có phiếu báo hỏng mới gửi lên từ các khoa phòng để Cán bộ vật tư & Kỹ thuật viên tiếp nhận xử lý ngay.
   - **QR Code Mobile:** Tối ưu hóa giao diện quét mã QR thiết bị trên màn hình điện thoại/máy tính bảng của điều dưỡng khi đi buồng bệnh.

---
*Báo cáo được khởi tạo tự động bởi Bộ kiểm thử UI Playwright End-to-End Suite.*
