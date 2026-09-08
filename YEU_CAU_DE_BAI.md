Bạn là một Senior Full-stack Developer và Software Architect. Hãy xây dựng một hệ thống website quản lý trang thiết bị cho bệnh viện theo hướng production-ready.
1. Mục tiêu dự án
Xây dựng hệ thống quản lý toàn bộ vòng đời trang thiết bị bệnh viện, bao gồm:
Tiếp nhận thiết bị.
Quản lý hồ sơ thiết bị.
Cấp phát thiết bị cho khoa/phòng.
Điều chuyển thiết bị.
Mượn và trả thiết bị.
Báo hỏng.
Sửa chữa.
Bảo trì định kỳ.
Kiểm định và hiệu chuẩn.
Kiểm kê.
Thu hồi.
Thanh lý.
Quản lý nhà cung cấp.
Quản lý hợp đồng.
Quản lý tài liệu đính kèm.
Thông báo và cảnh báo.
Báo cáo thống kê.
Quản lý người dùng, vai trò và phân quyền.
Lưu lịch sử thay đổi và nhật ký hệ thống.
2. Công nghệ bắt buộc
Frontend
Sử dụng:
React.
TypeScript.
Vite.
React Router.
Axios.
TanStack Query để quản lý server state.
React Hook Form.
Zod để kiểm tra dữ liệu biểu mẫu.
Tailwind CSS.
Một thư viện UI phù hợp như shadcn/ui.
Recharts cho biểu đồ.
ESLint và Prettier.
Không sử dụng Next.js.
Backend
Sử dụng:
Laravel PHP.
RESTful API.
Laravel Sanctum để xác thực.
Spatie Laravel Permission để quản lý vai trò và quyền.
Laravel Form Request để validate dữ liệu.
Laravel API Resource để chuẩn hóa JSON response.
Laravel Policy và Middleware để kiểm tra quyền.
Laravel Scheduler cho cảnh báo định kỳ.
Laravel Queue cho email, thông báo và tác vụ nặng.
PHPUnit hoặc Pest để kiểm thử.
Database
Ưu tiên sử dụng:
PostgreSQL.
Có thể sử dụng MySQL nếu môi trường hiện tại không hỗ trợ PostgreSQL.
Môi trường triển khai
Docker Compose.
Nginx.
PHP-FPM.
Node.js.
PostgreSQL hoặc MySQL.
Redis cho queue và cache.
File .env.example.
Hướng dẫn cài đặt trong README.md.
Hãy kiểm tra và sử dụng các phiên bản ổn định, tương thích với nhau tại thời điểm triển khai. Không tự ý sử dụng package đã lỗi thời hoặc không còn được duy trì.
3. Kiến trúc dự án
Tạo cấu trúc thư mục:
hospital-equipment-management/├── frontend/├── backend/├── docker/├── docker-compose.yml├── README.md└── docs/
Frontend và backend phải tách biệt hoàn toàn.
Frontend chỉ giao tiếp với backend thông qua REST API.
Không để frontend truy cập trực tiếp database.
Backend phải được tổ chức rõ ràng theo các thành phần:
Controllers.
Services.
Repositories chỉ sử dụng khi thực sự cần thiết.
Models.
Form Requests.
API Resources.
Policies.
Events.
Listeners.
Jobs.
Notifications.
Enums.
Exceptions.
Không đặt toàn bộ nghiệp vụ vào Controller.
Controller chỉ nên:
Nhận request.
Gọi service xử lý nghiệp vụ.
Trả response.
4. Quy tắc làm việc
Trước khi viết code, hãy thực hiện theo thứ tự:
Phân tích yêu cầu.
Xác định actor.
Liệt kê use case.
Xây dựng quy trình nghiệp vụ.
Xác định các trạng thái của thiết bị.
Thiết kế database.
Thiết kế API.
Thiết kế phân quyền.
Viết kế hoạch triển khai theo từng giai đoạn.
Chỉ bắt đầu code sau khi kế hoạch đã rõ ràng.
Không tạo toàn bộ hệ thống trong một bước.
Hãy chia quá trình thực hiện thành các phase nhỏ. Sau mỗi phase phải:
Chạy ứng dụng.
Chạy migration.
Chạy test.
Kiểm tra lỗi.
Sửa lỗi trước khi chuyển sang phase tiếp theo.
Ghi rõ file đã tạo hoặc chỉnh sửa.
Tóm tắt kết quả đã hoàn thành.
Không được:
Bỏ qua lỗi TypeScript.
Bỏ qua lỗi PHP.
Tắt kiểm tra ESLint để che lỗi.
Dùng any tràn lan.
Hard-code vai trò hoặc quyền trong giao diện.
Hard-code URL API.
Lưu access token không an toàn.
Xóa dữ liệu nghiệp vụ đã phát sinh.
Tạo dữ liệu giả trong môi trường production.
Viết logic nghiệp vụ phức tạp trực tiếp trong React component.
Viết câu SQL trực tiếp trong Controller.
5. Người dùng hệ thống
Hệ thống có các nhóm người dùng:
5.1. Quản trị viên
Quản lý tài khoản.
Quản lý vai trò.
Quản lý quyền.
Quản lý danh mục.
Xem nhật ký hệ thống.
Cấu hình hệ thống.
5.2. Phòng Vật tư – Trang thiết bị y tế
Quản lý toàn bộ thiết bị.
Tiếp nhận thiết bị.
Cấp phát.
Điều chuyển.
Thu hồi.
Quản lý bảo trì.
Quản lý sửa chữa.
Quản lý kiểm định.
Quản lý kiểm kê.
Quản lý nhà cung cấp.
Quản lý hợp đồng.
Xem báo cáo toàn bệnh viện.
5.3. Nhân viên khoa/phòng
Xem thiết bị thuộc khoa/phòng của mình.
Báo hỏng thiết bị.
Gửi yêu cầu điều chuyển.
Gửi yêu cầu mượn thiết bị.
Xác nhận nhận và trả thiết bị.
Tham gia kiểm kê.
Không được xem dữ liệu ngoài đơn vị nếu không có quyền.
5.4. Nhân viên kỹ thuật
Tiếp nhận phiếu báo hỏng.
Kiểm tra thiết bị.
Cập nhật nguyên nhân hư hỏng.
Cập nhật phương án xử lý.
Ghi nhận linh kiện thay thế.
Ghi nhận chi phí.
Cập nhật kết quả sửa chữa.
Bàn giao thiết bị sau sửa chữa.
5.5. Ban lãnh đạo
Xem dashboard.
Xem báo cáo.
Phê duyệt điều chuyển.
Phê duyệt sửa chữa.
Phê duyệt thanh lý.
Theo dõi hiệu quả sử dụng thiết bị.
6. Các module bắt buộc
6.1. Xác thực và tài khoản
Bao gồm:
Đăng nhập.
Đăng xuất.
Lấy thông tin người dùng hiện tại.
Đổi mật khẩu.
Quên mật khẩu.
Khóa và mở khóa tài khoản.
Ghi nhận lần đăng nhập gần nhất.
Kiểm soát tài khoản đang hoạt động.
API dự kiến:
POST   /api/auth/loginPOST   /api/auth/logoutGET    /api/auth/mePOST   /api/auth/change-passwordPOST   /api/auth/forgot-passwordPOST   /api/auth/reset-password
6.2. Quản lý tổ chức
Quản lý:
Bệnh viện.
Cơ sở.
Khối.
Khoa.
Phòng.
Kho.
Vị trí đặt thiết bị.
Mỗi khoa/phòng có thể có cấu trúc cha-con.
Không xóa đơn vị đã có dữ liệu phát sinh. Chỉ cho phép chuyển sang trạng thái ngừng hoạt động.
6.3. Quản lý danh mục
Bao gồm:
Nhóm thiết bị.
Loại thiết bị.
Hãng sản xuất.
Quốc gia sản xuất.
Đơn vị tính.
Nguồn vốn.
Tình trạng thiết bị.
Mức độ quan trọng.
Loại bảo trì.
Loại kiểm định.
Nguyên nhân hư hỏng.
Phương thức sửa chữa.
Loại hợp đồng.
Loại tài liệu.
Danh mục đã được sử dụng không được xóa vật lý.
6.4. Quản lý thiết bị
Thông tin thiết bị gồm:
ID.
Mã thiết bị.
Mã tài sản.
Tên thiết bị.
Nhóm thiết bị.
Loại thiết bị.
Model.
Serial.
Hãng sản xuất.
Nước sản xuất.
Năm sản xuất.
Ngày mua.
Ngày đưa vào sử dụng.
Nguyên giá.
Giá trị còn lại.
Nguồn vốn.
Nhà cung cấp.
Số hợp đồng.
Ngày bắt đầu bảo hành.
Ngày hết hạn bảo hành.
Khoa/phòng quản lý.
Vị trí hiện tại.
Người phụ trách.
Trạng thái hiện tại.
Mức độ quan trọng.
Có yêu cầu bảo trì hay không.
Có yêu cầu kiểm định hay không.
Chu kỳ bảo trì.
Chu kỳ kiểm định.
Ghi chú.
Hình ảnh.
Mã QR.
Mã thiết bị phải duy nhất.
Serial phải được kiểm tra trùng lặp.
Mỗi thiết bị phải có lịch sử trạng thái và lịch sử vị trí.
Không xóa vật lý thiết bị đã phát sinh nghiệp vụ.
6.5. Cấp phát và bàn giao
Quản lý:
Phiếu cấp phát.
Đơn vị giao.
Đơn vị nhận.
Người giao.
Người nhận.
Ngày giao.
Danh sách thiết bị.
Tình trạng khi giao.
Ghi chú.
Tài liệu bàn giao.
Trạng thái phiếu.
Luồng xử lý:
Nháp→ Chờ xác nhận→ Đã xác nhận→ Đã bàn giao→ Hoàn thành
6.6. Điều chuyển thiết bị
Quản lý:
Đơn vị hiện tại.
Đơn vị nhận.
Vị trí hiện tại.
Vị trí mới.
Lý do điều chuyển.
Người đề nghị.
Người phê duyệt.
Người giao.
Người nhận.
Ngày đề nghị.
Ngày thực hiện.
Trạng thái.
Luồng xử lý:
Nháp→ Chờ phê duyệt→ Đã phê duyệt→ Chờ bàn giao→ Đã bàn giao→ Hoàn thành
Khi hoàn thành, hệ thống phải cập nhật vị trí hiện tại của thiết bị và lưu lịch sử điều chuyển.
6.7. Báo hỏng và sửa chữa
Phiếu báo hỏng gồm:
Thiết bị.
Người báo.
Khoa/phòng báo.
Thời gian phát hiện.
Mô tả sự cố.
Mức độ ưu tiên.
Hình ảnh đính kèm.
Trạng thái.
Phiếu sửa chữa gồm:
Phiếu báo hỏng liên quan.
Người phụ trách kỹ thuật.
Kết quả kiểm tra.
Nguyên nhân hư hỏng.
Phương án xử lý.
Đơn vị sửa chữa.
Ngày bắt đầu.
Ngày hoàn thành.
Linh kiện thay thế.
Chi phí linh kiện.
Chi phí nhân công.
Tổng chi phí.
Kết quả sửa chữa.
Thời hạn bảo hành sửa chữa.
Biên bản nghiệm thu.
Trạng thái:
Mới tạo→ Đã tiếp nhận→ Đang kiểm tra→ Chờ báo giá→ Chờ phê duyệt→ Đang sửa chữa→ Chờ linh kiện→ Đã hoàn thành→ Đã bàn giao
Có thêm trạng thái:
Không thể sửa chữa.
Đã hủy.
Không cho phép chuyển trạng thái tùy ý. Hãy xây dựng state transition hợp lệ.
6.8. Bảo trì
Quản lý:
Kế hoạch bảo trì.
Thiết bị.
Chu kỳ bảo trì.
Ngày bảo trì gần nhất.
Ngày bảo trì dự kiến.
Ngày bảo trì thực tế.
Đơn vị thực hiện.
Nhân viên thực hiện.
Nội dung bảo trì.
Kết quả.
Chi phí.
Biên bản.
Trạng thái.
Hệ thống tự động xác định:
Sắp đến hạn.
Đến hạn.
Quá hạn.
Đã hoàn thành.
6.9. Kiểm định và hiệu chuẩn
Quản lý:
Thiết bị.
Loại kiểm định.
Đơn vị kiểm định.
Số chứng nhận.
Ngày kiểm định.
Ngày hết hạn.
Kết quả.
Ngày kiểm định tiếp theo.
Tệp chứng nhận.
Trạng thái hiệu lực.
Thiết bị hết hạn kiểm định phải hiển thị cảnh báo nổi bật.
6.10. Mượn và trả
Quản lý:
Thiết bị.
Đơn vị cho mượn.
Đơn vị mượn.
Người mượn.
Mục đích.
Ngày mượn.
Ngày dự kiến trả.
Ngày trả thực tế.
Tình trạng khi giao.
Tình trạng khi trả.
Trạng thái.
Không cho mượn thiết bị đang:
Sửa chữa.
Bảo trì.
Đã thanh lý.
Đang được mượn.
Hết hạn kiểm định trong trường hợp bị khóa sử dụng.
6.11. Kiểm kê
Quản lý:
Đợt kiểm kê.
Phạm vi kiểm kê.
Khoa/phòng.
Người thực hiện.
Ngày bắt đầu.
Ngày kết thúc.
Danh sách thiết bị dự kiến.
Kết quả thực tế.
Tình trạng thực tế.
Vị trí thực tế.
Ghi chú chênh lệch.
Kết quả kiểm kê:
Đúng thông tin.
Sai vị trí.
Sai đơn vị.
Hư hỏng.
Không tìm thấy.
Thiết bị chưa có trong hệ thống.
Đề nghị sửa chữa.
Đề nghị thanh lý.
Hỗ trợ kiểm kê bằng QR code.
6.12. Thu hồi và thanh lý
Quản lý:
Thiết bị.
Lý do.
Ngày đề nghị.
Người đề nghị.
Người phê duyệt.
Giá trị còn lại.
Phương thức xử lý.
Quyết định thanh lý.
Biên bản.
Trạng thái.
Thiết bị đã thanh lý không được xuất hiện trong danh sách thiết bị đang hoạt động nhưng vẫn phải giữ toàn bộ lịch sử.
6.13. Nhà cung cấp
Thông tin gồm:
Mã nhà cung cấp.
Tên.
Mã số thuế.
Địa chỉ.
Người liên hệ.
Điện thoại.
Email.
Trạng thái.
Danh sách hợp đồng.
Danh sách thiết bị đã cung cấp.
Lịch sử bảo hành và sửa chữa.
6.14. Hợp đồng
Quản lý:
Số hợp đồng.
Tên hợp đồng.
Loại hợp đồng.
Nhà cung cấp.
Ngày ký.
Ngày hiệu lực.
Ngày hết hạn.
Giá trị.
Người phụ trách.
Trạng thái.
Tệp đính kèm.
6.15. Thông báo và cảnh báo
Cảnh báo khi:
Thiết bị sắp hết bảo hành.
Thiết bị sắp đến hạn bảo trì.
Thiết bị quá hạn bảo trì.
Thiết bị sắp hết hạn kiểm định.
Thiết bị đã hết hạn kiểm định.
Thiết bị mượn quá hạn trả.
Hợp đồng sắp hết hạn.
Yêu cầu sửa chữa xử lý quá hạn.
Có phiếu đang chờ người dùng phê duyệt.
Thông báo phải hỗ trợ:
Đã đọc.
Chưa đọc.
Đánh dấu tất cả đã đọc.
Liên kết đến nghiệp vụ liên quan.
7. Trạng thái thiết bị
Sử dụng Enum cho trạng thái thiết bị:
PENDING_RECEIPTIN_STOCKAVAILABLEIN_USETEMPORARILY_SUSPENDEDUNDER_MAINTENANCEUNDER_REPAIRWAITING_FOR_PARTSUNDER_INSPECTIONON_LOANRECALLEDBROKEN_BEYOND_REPAIRLOSTPENDING_LIQUIDATIONLIQUIDATEDDESTROYED
Tên hiển thị trên giao diện phải bằng tiếng Việt.
Không lưu tên trạng thái tiếng Việt trực tiếp vào code ở nhiều nơi. Tạo cơ chế mapping tập trung.
8. Quy tắc nghiệp vụ quan trọng
Mã thiết bị phải duy nhất.
Một thiết bị chỉ có một trạng thái chính tại một thời điểm.
Một thiết bị chỉ có một đơn vị quản lý chính tại một thời điểm.
Mọi lần đổi đơn vị hoặc vị trí phải lưu lịch sử.
Không xóa thiết bị đã phát sinh giao dịch.
Thiết bị đã thanh lý không được cấp phát, điều chuyển hoặc sửa chữa.
Thiết bị đang sửa chữa không được cấp phát hoặc cho mượn.
Thiết bị đang được mượn không được tiếp tục cho người khác mượn.
Phiếu đã phê duyệt không được chỉnh sửa tùy ý.
Khi cần sửa phiếu đã phê duyệt, phải hủy hoặc tạo phiên bản điều chỉnh theo quyền.
Mọi thao tác phê duyệt phải lưu người phê duyệt và thời gian.
Mọi thay đổi quan trọng phải được ghi audit log.
Các thao tác cập nhật nhiều bảng phải sử dụng database transaction.
Khi một nghiệp vụ thất bại, phải rollback toàn bộ transaction.
Các bản ghi danh mục đã được sử dụng chỉ được vô hiệu hóa, không được xóa.
Backend phải kiểm tra quyền; không chỉ ẩn nút ở frontend.
Người dùng khoa/phòng chỉ xem dữ liệu trong phạm vi đơn vị được cấp quyền.
Giá trị tiền tệ phải dùng kiểu decimal, không sử dụng float.
Ngày giờ phải được lưu thống nhất và hiển thị theo múi giờ Asia/Ho_Chi_Minh.
File đính kèm phải kiểm tra loại file, kích thước và quyền truy cập.
9. Thiết kế database
Hãy tạo ERD và migration cho các bảng chính:
usersrolespermissionsorganizationslocationsequipment_groupsequipment_typesmanufacturerscountriesfunding_sourcessupplierscontractsequipmentequipment_imagesequipment_documentsequipment_status_historiesequipment_location_historiesreceiptsreceipt_itemsallocationsallocation_itemstransferstransfer_itemsdamage_reportsrepairsrepair_partsmaintenance_plansmaintenance_recordsinspectionsequipment_loansequipment_loan_itemsinventoriesinventory_itemsrecallsliquidationsnotificationsapproval_historiesattachmentsaudit_logs
Mỗi bảng nghiệp vụ phải cân nhắc các trường:
idcodestatuscreated_byupdated_bycreated_atupdated_atdeleted_at
Sử dụng foreign key đầy đủ.
Tạo index cho:
Code.
Serial.
Status.
Organization ID.
Equipment type ID.
Supplier ID.
Warranty end date.
Maintenance due date.
Inspection expiry date.
Created at.
Không tạo index dư thừa.
Sử dụng soft delete cho các bảng phù hợp.
Không sử dụng soft delete thay thế cho lịch sử nghiệp vụ.
10. Chuẩn API
API có prefix:
/api/v1
Ví dụ:
GET    /api/v1/equipmentPOST   /api/v1/equipmentGET    /api/v1/equipment/{id}PUT    /api/v1/equipment/{id}DELETE /api/v1/equipment/{id}GET    /api/v1/equipment/{id}/historyGET    /api/v1/equipment/{id}/maintenanceGET    /api/v1/equipment/{id}/repairsGET    /api/v1/equipment/{id}/documents
Danh sách phải hỗ trợ:
Phân trang.
Tìm kiếm.
Lọc.
Sắp xếp.
Lọc theo đơn vị.
Lọc theo trạng thái.
Lọc theo khoảng ngày.
Ví dụ:
GET /api/v1/equipment?page=1&per_page=20&search=may-tho&status=IN_USE&organization_id=5&sort=-created_at
Chuẩn response thành công:
{  "success": true,  "message": "Lấy dữ liệu thành công",  "data": {},  "meta": {}}
Chuẩn response lỗi:
{  "success": false,  "message": "Dữ liệu không hợp lệ",  "errors": {    "equipment_code": [      "Mã thiết bị đã tồn tại."    ]  }}
Sử dụng HTTP status code đúng:
200: thành công.
201: tạo mới.
204: không có nội dung.
400: request không hợp lệ.
401: chưa đăng nhập.
403: không có quyền.
404: không tìm thấy.
409: xung đột nghiệp vụ.
422: lỗi validation.
500: lỗi hệ thống.
11. Phân quyền
Sử dụng RBAC kết hợp data scope.
Ví dụ permission:
equipment.viewequipment.createequipment.updateequipment.deleteequipment.exportequipment.receiveequipment.allocateequipment.transferequipment.recallequipment.liquidatedamage_report.viewdamage_report.createdamage_report.assignrepair.viewrepair.updaterepair.approverepair.completemaintenance.viewmaintenance.createmaintenance.updatemaintenance.completeinspection.viewinspection.createinspection.updateinventory.viewinventory.createinventory.executeinventory.completesupplier.viewsupplier.createsupplier.updatecontract.viewcontract.createcontract.updatereport.viewreport.exportuser.viewuser.createuser.updateuser.lockrole.managesystem.audit.view
Data scope gồm:
Toàn hệ thống.
Theo cơ sở.
Theo khoa/phòng.
Chỉ dữ liệu của bản thân.
Backend phải áp dụng data scope vào query.
12. Frontend
Xây dựng layout quản trị gồm:
Sidebar.
Header.
Breadcrumb.
Thông báo.
Avatar và menu người dùng.
Responsive trên desktop, tablet và điện thoại.
Các trang chính:
/login/dashboard/equipment/equipment/create/equipment/:id/equipment/:id/edit/receipts/allocations/transfers/damage-reports/repairs/maintenance/inspections/loans/inventories/recalls/liquidations/suppliers/contracts/reports/users/roles/settings/audit-logs
Tổ chức frontend theo feature:
src/├── api/├── app/├── assets/├── components/├── features/│   ├── auth/│   ├── dashboard/│   ├── equipment/│   ├── maintenance/│   ├── repairs/│   ├── inspections/│   └── inventory/├── hooks/├── layouts/├── lib/├── routes/├── schemas/├── types/└── utils/
Yêu cầu giao diện:
Toàn bộ nhãn hiển thị bằng tiếng Việt.
Thiết kế chuyên nghiệp, phù hợp môi trường bệnh viện.
Không sử dụng quá nhiều màu sắc.
Có loading state.
Có empty state.
Có error state.
Có skeleton khi tải dữ liệu.
Có xác nhận trước thao tác nguy hiểm.
Có toast thông báo kết quả.
Form phải hiển thị lỗi tại đúng trường.
Danh sách phải có phân trang và bộ lọc.
Giữ trạng thái bộ lọc trên URL.
Nút thao tác phải hiển thị theo quyền người dùng.
Tuy nhiên backend vẫn phải kiểm tra quyền độc lập.
13. Dashboard
Dashboard hiển thị:
Tổng số thiết bị.
Thiết bị đang sử dụng.
Thiết bị đang sửa chữa.
Thiết bị đang bảo trì.
Thiết bị chờ thanh lý.
Thiết bị sắp hết bảo hành.
Thiết bị quá hạn bảo trì.
Thiết bị hết hạn kiểm định.
Phiếu sửa chữa đang chờ xử lý.
Chi phí sửa chữa theo tháng.
Số thiết bị theo khoa/phòng.
Số thiết bị theo trạng thái.
Danh sách cảnh báo gần nhất.
Dữ liệu dashboard phải được lấy từ API tổng hợp, không tải toàn bộ danh sách về frontend rồi tự tính.
14. QR code
Mỗi thiết bị có QR code riêng.
QR chỉ chứa:
UUID hoặc mã định danh an toàn.
URL dẫn đến trang tra cứu thiết bị.
Không đưa thông tin tài chính hoặc dữ liệu nhạy cảm trực tiếp vào QR.
Cho phép:
In tem QR.
Quét QR bằng camera điện thoại.
Xem nhanh thông tin thiết bị.
Báo hỏng từ trang quét QR nếu người dùng có quyền.
Kiểm kê bằng QR.
15. File đính kèm
Hỗ trợ:
PDF.
JPG.
JPEG.
PNG.
DOCX.
XLSX.
Hãy cấu hình danh sách loại file và dung lượng tối đa.
Tên file lưu trên server phải được tạo an toàn.
Không sử dụng trực tiếp tên file do người dùng gửi lên.
Kiểm tra quyền trước khi cho tải file.
Tách thông tin file thành bảng attachments có quan hệ polymorphic nếu phù hợp.
16. Audit log
Ghi nhận:
Người thực hiện.
Hành động.
Module.
ID bản ghi.
Dữ liệu trước khi thay đổi.
Dữ liệu sau khi thay đổi.
IP.
User agent.
Thời gian.
Các hành động cần audit:
Đăng nhập.
Đăng xuất.
Thêm.
Sửa.
Xóa.
Phê duyệt.
Từ chối.
Điều chuyển.
Cấp phát.
Bàn giao.
Hoàn thành sửa chữa.
Thanh lý.
Thay đổi quyền.
Không lưu mật khẩu, token hoặc dữ liệu bí mật vào audit log.
17. Bảo mật
Áp dụng:
CSRF protection phù hợp với Sanctum.
CORS chỉ cho phép domain cấu hình.
Rate limiting cho đăng nhập và API nhạy cảm.
Validation toàn bộ input.
Authorization tại backend.
Chống mass assignment.
Chống SQL injection bằng Eloquent hoặc Query Builder.
Escape dữ liệu khi hiển thị.
Kiểm tra file upload.
Không trả stack trace ở production.
Không commit .env.
Không commit khóa bí mật.
Không log password hoặc token.
Mật khẩu phải được hash.
Session timeout.
Khóa tài khoản sau nhiều lần đăng nhập sai.
Sử dụng transaction cho nghiệp vụ quan trọng.
18. Kiểm thử
Backend cần có:
Unit test.
Feature test.
Authentication test.
Authorization test.
Validation test.
CRUD test.
State transition test.
Data scope test.
Transaction rollback test.
Frontend cần có:
Component test.
Form validation test.
Permission rendering test.
API error handling test.
Một số E2E test cho quy trình quan trọng.
Các quy trình E2E ưu tiên:
Đăng nhập.
Tạo thiết bị.
Cấp phát thiết bị.
Báo hỏng.
Tiếp nhận sửa chữa.
Hoàn thành sửa chữa.
Điều chuyển thiết bị.
Kiểm kê bằng QR.
Thanh lý thiết bị.
19. Seed dữ liệu
Tạo seed cho môi trường development:
Một tài khoản quản trị.
Các vai trò mặc định.
Các quyền mặc định.
Một số khoa/phòng.
Một số nhóm thiết bị.
Một số loại thiết bị.
Một số trạng thái.
Một số thiết bị mẫu.
Thông tin đăng nhập development phải ghi trong README và không được sử dụng trong production.
20. README
README phải có:
Giới thiệu dự án.
Kiến trúc.
Yêu cầu môi trường.
Cách cài đặt backend.
Cách cài đặt frontend.
Cách chạy Docker.
Cách cấu hình .env.
Cách chạy migration.
Cách chạy seed.
Cách chạy queue.
Cách chạy scheduler.
Cách chạy test.
Cách build production.
Tài khoản development.
Danh sách API hoặc đường dẫn Swagger.
Các lỗi thường gặp và cách xử lý.
21. Tài liệu API
Tạo tài liệu OpenAPI/Swagger.
Mỗi API phải có:
Mô tả.
Permission cần thiết.
Request parameters.
Request body.
Response thành công.
Response lỗi.
Mã trạng thái HTTP.
Ví dụ dữ liệu.
22. Các phase triển khai
Hãy thực hiện theo các phase sau:
Phase 1: Phân tích và thiết kế
Viết tài liệu yêu cầu.
Liệt kê actor.
Liệt kê use case.
Xây dựng business rules.
Vẽ ERD bằng Mermaid.
Thiết kế API.
Thiết kế permission matrix.
Tạo kế hoạch triển khai.
Chưa viết code nghiệp vụ ở phase này.
Phase 2: Khởi tạo dự án
Khởi tạo React TypeScript.
Khởi tạo Laravel.
Cấu hình Docker.
Cấu hình database.
Cấu hình Redis.
Cấu hình CORS.
Cấu hình Sanctum.
Cấu hình code formatting.
Tạo README ban đầu.
Phase 3: Authentication và phân quyền
Login.
Logout.
Current user.
Quản lý user.
Vai trò.
Quyền.
Data scope.
Route guard frontend.
Policy backend.
Test authentication và authorization.
Phase 4: Danh mục và tổ chức
Khoa/phòng.
Vị trí.
Nhóm thiết bị.
Loại thiết bị.
Hãng sản xuất.
Nhà cung cấp.
Các danh mục dùng chung.
Phase 5: Quản lý thiết bị
CRUD thiết bị.
Upload hình ảnh.
Tài liệu.
QR code.
Lịch sử trạng thái.
Lịch sử vị trí.
Tìm kiếm và bộ lọc.
Phase 6: Cấp phát và điều chuyển
Phiếu cấp phát.
Phiếu điều chuyển.
Xác nhận bàn giao.
Approval workflow.
Transaction.
Audit log.
Phase 7: Báo hỏng và sửa chữa
Báo hỏng.
Giao việc kỹ thuật.
Kiểm tra.
Báo giá.
Phê duyệt.
Sửa chữa.
Linh kiện.
Nghiệm thu.
Bàn giao.
Phase 8: Bảo trì và kiểm định
Kế hoạch bảo trì.
Lịch bảo trì.
Kiểm định.
Cảnh báo.
Scheduler.
Notifications.
Phase 9: Mượn trả, kiểm kê và thanh lý
Mượn trả.
Kiểm kê QR.
Thu hồi.
Thanh lý.
Xử lý chênh lệch.
Phase 10: Dashboard và báo cáo
API thống kê.
Dashboard.
Biểu đồ.
Xuất Excel.
Xuất PDF.
Phân quyền báo cáo.
Phase 11: Kiểm thử và hoàn thiện
Chạy toàn bộ test.
Kiểm tra lint.
Kiểm tra TypeScript.
Kiểm tra bảo mật.
Kiểm tra responsive.
Kiểm tra phân quyền.
Kiểm tra transaction.
Kiểm tra hiệu năng.
Hoàn thiện Swagger.
Hoàn thiện README.
23. Yêu cầu phản hồi của bạn
Trước tiên, chưa viết toàn bộ code.
Hãy trả về:
Phân tích yêu cầu.
Danh sách actor.
Danh sách module.
Danh sách use case.
Business rules.
ERD dạng Mermaid.
Danh sách bảng và quan hệ.
Kiến trúc backend.
Kiến trúc frontend.
Danh sách API dự kiến.
Ma trận vai trò và quyền.
Kế hoạch triển khai theo phase.
Các rủi ro kỹ thuật.
Những điểm cần kiểm tra trước khi bắt đầu code.
Sau khi hoàn thành phần thiết kế, bắt đầu Phase 2.
Trong quá trình code:
Chủ động tạo và chỉnh sửa file.
Chủ động chạy command cần thiết.
Không xóa file hoặc dữ liệu quan trọng nếu chưa phân tích ảnh hưởng.
Sau mỗi module phải chạy test.
Khi gặp lỗi, đọc lỗi, xác định nguyên nhân và sửa triệt để.
Không chỉ mô tả code; phải tạo code thực tế trong workspace.
Không để lại TODO cho chức năng cốt lõi.
Không tạo dữ liệu hoặc API giả để che phần backend chưa hoàn thành.
Giữ ứng dụng luôn có thể chạy sau mỗi phase.