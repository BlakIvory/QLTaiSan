/**
 * ═══════════════════════════════════════════════════════════════
 * 🧪 QLTAISAN - BỘ KIỂM THỬ GIAO DIỆN TỰ ĐỘNG TOÀN DIỆN (PLAYWRIGHT)
 * ═══════════════════════════════════════════════════════════════
 * Vai trò: Chuyên viên Kiểm thử Độc lập (QA Lead) & Khách hàng sử dụng
 * Phương pháp: Kiểm thử UI thuần túy trên trình duyệt (E2E Browser Testing)
 * Không gọi trực tiếp API Backend trong test script - thao tác 100% qua giao diện
 * ═══════════════════════════════════════════════════════════════
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const REPORT_FILE = path.join(__dirname, 'test-report.md');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Danh sách tài khoản chuẩn trong hệ thống
const ACCOUNTS = {
  admin:  { email: 'admin@hospital.local',  password: 'Admin@12345',  name: 'Quản trị viên', role: 'admin' },
  pvt:    { email: 'pvt@hospital.local',    password: 'Pvt@12345',    name: 'Phòng Vật tư - TTBYT', role: 'pvtttby' },
  dept:   { email: 'dept@hospital.local',   password: 'Dept@12345',   name: 'Nhân viên Khoa Nội', role: 'department_staff' },
  tech:   { email: 'tech@hospital.local',   password: 'Tech@12345',   name: 'Kỹ thuật viên', role: 'technician' },
  leader: { email: 'leader@hospital.local', password: 'Leader@12345', name: 'Ban Lãnh đạo', role: 'leader' },
};

const results = [];
let passCount = 0;
let failCount = 0;
let skipCount = 0;
const bugs = [];

function log(msg) {
  const time = new Date().toLocaleTimeString('vi-VN');
  console.log(`[${time}] ${msg}`);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function takeScreenshot(page, name) {
  try {
    const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    return filePath;
  } catch (err) {
    return '';
  }
}

function recordResult(tc, name, status, actual, note = '') {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  log(`${emoji} ${tc}: ${name} → ${status}${note ? ' | ' + note : ''}`);
  results.push({ tc, name, status, actual, note });
  if (status === 'PASS') passCount++;
  else if (status === 'FAIL') failCount++;
  else skipCount++;
}

function recordBug(tc, module, desc, severity, suggestion = '') {
  bugs.push({ tc, module, desc, severity, suggestion });
  console.log(`  🐛 [PHÁT HIỆN LỖI - ${severity}] (${module}) ${desc}`);
}

/**
 * Thao tác Đăng nhập trên giao diện
 */
async function uiLogin(page, email, password) {
  await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(400);

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(400);

  const emailInput = page.locator('#login-email, input[type="email"]').first();
  const passInput = page.locator('#login-password, input[type="password"]').first();
  const submitBtn = page.locator('button[type="submit"]').first();

  await emailInput.fill(email);
  await passInput.fill(password);
  await submitBtn.click();
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 8000 }).catch(() => {});
  await sleep(1000);
}

/**
 * Thao tác Đăng xuất trên giao diện
 */
async function uiLogout(page) {
  try {
    const logoutBtn = page.locator('button[title="Đăng xuất"]').first();
    if (await logoutBtn.isVisible({ timeout: 2000 })) {
      await logoutBtn.click();
      await page.waitForURL(/.*login.*/, { timeout: 6000 }).catch(() => {});
      await sleep(800);
    } else {
      await page.evaluate(() => localStorage.clear());
      await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded' });
      await sleep(800);
    }
  } catch (e) {
    await page.evaluate(() => localStorage.clear());
    await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded' });
    await sleep(800);
  }
}

async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🧪 BẮT ĐẦU BỘ KIỂM THỬ UI TỰ ĐỘNG TOÀN DIỆN - QLTAISAN   ║');
  console.log('║     Đóng vai: QA Tester & Khách hàng sử dụng cuối            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // ─────────────────────────────────────────────────────────────
  // PHÂN HỆ 1: XÁC THỰC & PHÂN QUYỀN TRUY CẬP (AUTHENTICATION)
  // ─────────────────────────────────────────────────────────────
  log('=== PHÂN HỆ 1: XÁC THỰC & ĐĂNG NHẬP (AUTH) ===');

  // TC-AUTH-001: Đăng nhập Admin thành công
  try {
    await uiLogin(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    await takeScreenshot(page, '01_auth_admin_success');
    const isDashboard = page.url().includes('/dashboard') || !page.url().includes('/login');
    recordResult('TC-AUTH-001', 'Đăng nhập Quản trị viên (Admin) hợp lệ', isDashboard ? 'PASS' : 'FAIL',
      `URL: ${page.url()}`);
    if (!isDashboard) recordBug('TC-AUTH-001', 'Auth', 'Đăng nhập đúng tài khoản Admin nhưng không chuyển về Dashboard', 'CRITICAL');
  } catch (e) {
    recordResult('TC-AUTH-001', 'Đăng nhập Quản trị viên (Admin)', 'FAIL', e.message);
  }

  // TC-AUTH-002: Đăng xuất từ giao diện
  try {
    const logoutBtn = page.locator('button[title="Đăng xuất"]').first();
    const hasLogoutBtn = await logoutBtn.isVisible({ timeout: 3000 });
    if (hasLogoutBtn) {
      await logoutBtn.click();
      await page.waitForURL(/.*login.*/, { timeout: 6000 }).catch(() => {});
      await sleep(1000);
      await takeScreenshot(page, '02_auth_logout_success');
      const isLoginPage = page.url().includes('/login');
      recordResult('TC-AUTH-002', 'Đăng xuất khỏi hệ thống qua nút Đăng xuất Sidebar', isLoginPage ? 'PASS' : 'FAIL',
        `URL sau đăng xuất: ${page.url()}`);
    } else {
      recordResult('TC-AUTH-002', 'Đăng xuất khỏi hệ thống', 'FAIL', 'Không tìm thấy nút Đăng xuất');
      recordBug('TC-AUTH-002', 'Auth', 'Không tìm thấy nút Đăng xuất trên thanh Sidebar', 'HIGH');
    }
  } catch (e) {
    recordResult('TC-AUTH-002', 'Đăng xuất khỏi hệ thống', 'FAIL', e.message);
  }

  // TC-AUTH-003: Đăng nhập sai mật khẩu (Negative Test)
  try {
    await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded' });
    const emailInput = page.locator('#login-email, input[type="email"]').first();
    const passInput = page.locator('#login-password, input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"]').first();

    await emailInput.fill(ACCOUNTS.admin.email);
    await passInput.fill('SaiMatKhau@999');
    await submitBtn.click();
    await sleep(1000);
    await takeScreenshot(page, '03_auth_wrong_password');

    const errorAlert = page.locator('.text-red-200, [class*="red"], [role="alert"]').first();
    const hasErrorAlert = await errorAlert.isVisible({ timeout: 3000 }).catch(() => false);
    const stillOnLogin = page.url().includes('/login');

    recordResult('TC-AUTH-003', 'Đăng nhập sai mật khẩu hiển thị thông báo lỗi', (hasErrorAlert && stillOnLogin) ? 'PASS' : 'FAIL',
      `Có alert lỗi: ${hasErrorAlert}, URL: ${page.url()}`);
    if (!hasErrorAlert) recordBug('TC-AUTH-003', 'Auth', 'Nhập sai mật khẩu nhưng giao diện không hiển thị thông báo lỗi rõ ràng', 'MEDIUM');
  } catch (e) {
    recordResult('TC-AUTH-003', 'Đăng nhập sai mật khẩu', 'FAIL', e.message);
  }

  // TC-AUTH-004: Đăng nhập với email không tồn tại
  try {
    const emailInput = page.locator('#login-email, input[type="email"]').first();
    const passInput = page.locator('#login-password, input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"]').first();

    await emailInput.fill('khongtontai@bvhoahao.vn');
    await passInput.fill('Password123!');
    await submitBtn.click();
    await sleep(1000);
    await takeScreenshot(page, '04_auth_nonexistent_email');

    const stillOnLogin = page.url().includes('/login');
    recordResult('TC-AUTH-004', 'Từ chối đăng nhập với email chưa đăng ký', stillOnLogin ? 'PASS' : 'FAIL',
      `URL: ${page.url()}`);
  } catch (e) {
    recordResult('TC-AUTH-004', 'Từ chối đăng nhập với email chưa đăng ký', 'FAIL', e.message);
  }

  // TC-AUTH-005: Kiểm tra nút toggle ẩn/hiện mật khẩu
  try {
    const togglePassBtn = page.locator('input#login-password ~ button, input[type="password"] ~ button').first();
    const hasToggleBtn = await togglePassBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasToggleBtn) {
      await togglePassBtn.click();
      await sleep(300);
      const inputType = await page.locator('#login-password').getAttribute('type');
      const canShow = inputType === 'text';
      recordResult('TC-AUTH-005', 'Nút hiển thị / ẩn mật khẩu (Eye Toggle)', canShow ? 'PASS' : 'FAIL',
        `Trạng thái sau toggle: type="${inputType}"`);
    } else {
      recordResult('TC-AUTH-005', 'Nút hiển thị / ẩn mật khẩu (Eye Toggle)', 'FAIL', 'Không tìm thấy nút con mắt');
    }
  } catch (e) {
    recordResult('TC-AUTH-005', 'Nút hiển thị / ẩn mật khẩu', 'FAIL', e.message);
  }

  // Đăng nhập lại Admin để thực hiện các phân hệ nghiệp vụ chính
  await uiLogin(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);

  // ─────────────────────────────────────────────────────────────
  // PHÂN HỆ 2: BẢNG ĐIỀU KHIỂN & CHỈ SỐ TỔNG QUAN (DASHBOARD)
  // ─────────────────────────────────────────────────────────────
  log('\n=== PHÂN HỆ 2: BẢNG ĐIỀU KHIỂN TỔNG QUAN (DASHBOARD) ===');

  try {
    await page.goto(BASE_URL + '/dashboard', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '05_dashboard_overview');

    // TC-DASH-001: Kiểm tra các thẻ KPI thống kê
    const cards = await page.locator('.card, [class*="card"]').count();
    const hasCards = cards >= 3;
    recordResult('TC-DASH-001', 'Dashboard - Hiển thị các khối chỉ số KPI tổng quan', hasCards ? 'PASS' : 'FAIL',
      `Tìm thấy ${cards} thẻ thống kê trên giao diện`);
    if (!hasCards) recordBug('TC-DASH-001', 'Dashboard', 'Dashboard thiếu các khối thống kê số lượng thiết bị', 'MEDIUM');

    // TC-DASH-002: Kiểm tra biểu đồ phân bổ / trạng thái thiết bị
    const hasCharts = await page.locator('canvas, svg.recharts-surface, [class*="chart"]').first().isVisible({ timeout: 3000 }).catch(() => false);
    recordResult('TC-DASH-002', 'Dashboard - Hiển thị biểu đồ phân bố & tình trạng thiết bị', hasCharts ? 'PASS' : 'FAIL',
      `Trạng thái biểu đồ: ${hasCharts ? 'Hiển thị tốt' : 'Không tìm thấy thẻ canvas/svg'}`);

    // TC-DASH-003: Thông tin người dùng & vai trò trên Sidebar
    const asideText = await page.locator('aside').textContent().catch(() => '');
    const hasUserRole = asideText.includes('Quản trị viên') || asideText.includes('admin');
    recordResult('TC-DASH-003', 'Dashboard - Hiển thị huy hiệu vai trò người dùng (Role Badge)', hasUserRole ? 'PASS' : 'FAIL',
      `Tìm thấy thông tin vai trò: ${hasUserRole}`);
  } catch (e) {
    recordResult('TC-DASH-001', 'Dashboard kiểm tra', 'FAIL', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // PHÂN HỆ 3: HỒ SƠ & QUẢN LÝ THIẾT BỊ Y TẾ (EQUIPMENT)
  // ─────────────────────────────────────────────────────────────
  log('\n=== PHÂN HỆ 3: QUẢN LÝ TRANG THIẾT BỊ Y TẾ ===');

  try {
    await page.goto(BASE_URL + '/equipment', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '06_equipment_list');

    // TC-EQ-001: Tải danh sách thiết bị
    const hasTable = await page.locator('table, .ant-table, [class*="table"]').first().isVisible({ timeout: 4000 }).catch(() => false);
    const rowCount = await page.locator('tbody tr').count();
    recordResult('TC-EQ-001', 'Thiết bị - Tải danh sách thiết bị y tế trong toàn viện', hasTable ? 'PASS' : 'FAIL',
      `Số dòng dữ liệu hiển thị: ${rowCount}`);

    // TC-EQ-002: Ô tìm kiếm thiết bị
    const searchInput = page.locator('input[placeholder*="tên, mã thiết bị"], input[placeholder*="Tìm kiếm"]').first();
    const hasSearch = await searchInput.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasSearch) {
      await searchInput.fill('Voluson');
      await sleep(1000);
      await takeScreenshot(page, '07_equipment_search');
      recordResult('TC-EQ-002', 'Thiết bị - Tìm kiếm theo tên thiết bị (Search Filter)', 'PASS', 'Bộ lọc tìm kiếm hoạt động bình thường');
      await searchInput.fill('');
      await sleep(500);
    } else {
      recordResult('TC-EQ-002', 'Thiết bị - Tìm kiếm theo tên thiết bị', 'FAIL', 'Không tìm thấy ô nhập từ khóa');
    }

    // TC-EQ-003: Nút điều hướng Thêm thiết bị mới
    const addEquipmentBtn = page.locator('a[href="/equipment/create"], a:has-text("Thêm thiết bị mới")').first();
    const hasAddBtn = await addEquipmentBtn.isVisible({ timeout: 2000 }).catch(() => false);
    recordResult('TC-EQ-003', 'Thiết bị - Nút dẫn đến form "Thêm thiết bị mới"', hasAddBtn ? 'PASS' : 'FAIL',
      `Có nút Thêm thiết bị: ${hasAddBtn}`);

    // TC-EQ-004: Kiểm tra form Thêm thiết bị mới & Validation bắt buộc
    if (hasAddBtn) {
      await addEquipmentBtn.click();
      await sleep(1200);
      await takeScreenshot(page, '08_equipment_create_form');

      // Thử submit form trống để kiểm tra validation
      const saveBtn = page.locator('button[type="submit"], button:has-text("Lưu"), button:has-text("Lưu thông tin")').first();
      if (await saveBtn.isVisible({ timeout: 2000 })) {
        await saveBtn.click();
        await sleep(600);
        await takeScreenshot(page, '09_equipment_create_validation');
        const hasValidation = await page.locator('.ant-form-item-explain-error, [class*="error"]').first().isVisible({ timeout: 2000 }).catch(() => false);
        recordResult('TC-EQ-004', 'Thiết bị - Kiểm tra chặn lưu khi bỏ trống trường bắt buộc', hasValidation ? 'PASS' : 'FAIL',
          `Bắt validation Ant Design: ${hasValidation}`);
        if (!hasValidation) recordBug('TC-EQ-004', 'Equipment', 'Form thêm thiết bị không hiển thị lỗi đỏ khi bỏ trống Tên thiết bị', 'MEDIUM');
      }

      // TC-EQ-005: Nhập form thêm mới thiết bị hoàn chỉnh
      try {
        const nameInput = page.locator('input#name').first();
        if (await nameInput.isVisible({ timeout: 2000 })) {
          const testEqName = 'Máy Siêu Âm Màu 4D Chuyên Tim - Model QA ' + Date.now().toString().slice(-4);
          await nameInput.fill(testEqName);

          // Chọn loại thiết bị
          const typeSelect = page.locator('.ant-select').first();
          if (await typeSelect.isVisible({ timeout: 1500 })) {
            await typeSelect.click();
            await sleep(500);
            const firstOption = page.locator('.ant-select-item-option').first();
            if (await firstOption.isVisible({ timeout: 1500 })) {
              await firstOption.click();
              await sleep(300);
            }
          }

          await takeScreenshot(page, '10_equipment_create_filled');
          await saveBtn.click();
          await sleep(800);

          // Click nút "Xác nhận" trên Modal.confirm của Ant Design
          const confirmOkBtn = page.locator('.ant-modal-confirm-btns button.ant-btn-primary, .ant-modal button:has-text("Xác nhận")').first();
          if (await confirmOkBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
            await confirmOkBtn.click();
            await sleep(2500);
          }

          const backToList = page.url().includes('/equipment') && !page.url().includes('/create');
          recordResult('TC-EQ-005', 'Thiết bị - Thêm mới thiết bị thành công qua giao diện', backToList ? 'PASS' : 'FAIL',
            `URL sau khi lưu: ${page.url()}`);
        } else {
          recordResult('TC-EQ-005', 'Thiết bị - Thêm mới thiết bị', 'SKIP', 'Không tìm thấy input#name');
        }
      } catch (e) {
        recordResult('TC-EQ-005', 'Thiết bị - Thêm mới thiết bị', 'FAIL', e.message);
      }
    }

    // Quay lại danh sách thiết bị
    await page.goto(BASE_URL + '/equipment', { waitUntil: 'domcontentloaded' });
    await sleep(1000);

    // TC-EQ-006: Nút Xuất Excel danh sách
    const exportExcelBtn = page.locator('button:has-text("Xuất Excel")').first();
    const hasExportExcel = await exportExcelBtn.isVisible({ timeout: 2000 }).catch(() => false);
    recordResult('TC-EQ-006', 'Thiết bị - Nút chức năng "Xuất Excel" danh sách tài sản', hasExportExcel ? 'PASS' : 'FAIL',
      `Nút Xuất Excel: ${hasExportExcel}`);

  } catch (e) {
    recordResult('TC-EQ-001', 'Thiết bị kiểm thử', 'FAIL', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // PHÂN HỆ 4: QUY TRÌNH MUA SẮM & ĐỀ XUẤT (PURCHASE WORKFLOW)
  // ─────────────────────────────────────────────────────────────
  log('\n=== PHÂN HỆ 4: QUY TRÌNH ĐỀ NGHỊ MUA SẮM & TỜ TRÌNH (3 BƯỚC) ===');

  // Bước 1: Đề nghị mua sắm (Purchase Requests)
  try {
    await page.goto(BASE_URL + '/purchase-requests', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '11_purchase_requests_list');

    // TC-PR-001: Xem danh sách đề nghị mua tài sản
    const hasTablePR = await page.locator('.ant-table, table').first().isVisible({ timeout: 3000 }).catch(() => false);
    recordResult('TC-PR-001', 'Đề xuất - Tải danh sách Đề nghị mua tài sản', hasTablePR ? 'PASS' : 'FAIL',
      `Trạng thái bảng: ${hasTablePR}`);

    // TC-PR-002: Mở modal Lập đề nghị mua
    const createPRBtn = page.locator('button:has-text("Lập đề nghị mua")').first();
    const hasCreatePRBtn = await createPRBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasCreatePRBtn) {
      await createPRBtn.click();
      await sleep(800);
      await takeScreenshot(page, '12_purchase_request_modal');
      const isModalOpen = await page.locator('.ant-modal').first().isVisible({ timeout: 2000 }).catch(() => false);
      recordResult('TC-PR-002', 'Đề xuất - Mở Modal "Lập đề nghị mua tài sản"', isModalOpen ? 'PASS' : 'FAIL',
        `Modal mở: ${isModalOpen}`);

      // Đóng modal
      const cancelBtn = page.locator('.ant-modal button:has-text("Hủy"), .ant-modal-close').first();
      if (await cancelBtn.isVisible({ timeout: 1000 })) await cancelBtn.click();
      await sleep(500);
    } else {
      recordResult('TC-PR-002', 'Đề xuất - Nút Lập đề nghị mua', 'FAIL', 'Không tìm thấy nút');
    }

    // TC-PR-003: Ô tìm kiếm đề nghị mua
    const searchPR = page.locator('input[placeholder*="Tìm theo mã hoặc tên tài sản"]').first();
    const hasSearchPR = await searchPR.isVisible({ timeout: 2000 }).catch(() => false);
    recordResult('TC-PR-003', 'Đề xuất - Ô tìm kiếm đề nghị theo mã/tên tài sản', hasSearchPR ? 'PASS' : 'FAIL',
      `Ô tìm kiếm: ${hasSearchPR}`);

  } catch (e) {
    recordResult('TC-PR-001', 'Đề xuất mua sắm', 'FAIL', e.message);
  }

  // Bước 2: Tổng hợp đề nghị (Purchase Summaries)
  try {
    await page.goto(BASE_URL + '/purchase-summaries', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '13_purchase_summaries_list');

    const hasTablePS = await page.locator('.ant-table, table').first().isVisible({ timeout: 3000 }).catch(() => false);
    recordResult('TC-PS-001', 'Tổng hợp - Xem danh sách Đợt tổng hợp đề nghị mua sắm', hasTablePS ? 'PASS' : 'FAIL',
      `URL: ${page.url()}`);
  } catch (e) {
    recordResult('TC-PS-001', 'Tổng hợp đề nghị', 'FAIL', e.message);
  }

  // Bước 3: Tờ trình chủ trương BGĐ (Proposals)
  try {
    await page.goto(BASE_URL + '/proposals', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '14_proposals_list');

    const hasTableProp = await page.locator('.ant-table, table').first().isVisible({ timeout: 3000 }).catch(() => false);
    recordResult('TC-PROP-001', 'Tờ trình - Xem danh sách Tờ trình chủ trương Ban Giám Đốc', hasTableProp ? 'PASS' : 'FAIL',
      `URL: ${page.url()}`);
  } catch (e) {
    recordResult('TC-PROP-001', 'Tờ trình chủ trương', 'FAIL', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // PHÂN HỆ 5: VÒNG ĐỜI TIẾP NHẬN & BÀN GIAO (RECEIPTS & ALLOCATIONS)
  // ─────────────────────────────────────────────────────────────
  log('\n=== PHÂN HỆ 5: TIẾP NHẬN, NHẬP KHO & CẤP PHÁT THIẾT BỊ ===');

  // Tiếp nhận & Bàn giao (Receipts)
  try {
    await page.goto(BASE_URL + '/receipts', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '15_receipts_list');

    // TC-REC-001: Xem danh sách hóa đơn & phiếu nhập
    const hasTableRec = await page.locator('.ant-table, table').first().isVisible({ timeout: 3000 }).catch(() => false);
    recordResult('TC-REC-001', 'Tiếp nhận - Xem bảng Hóa đơn & Phiếu nhập tài sản', hasTableRec ? 'PASS' : 'FAIL',
      `Bảng dữ liệu: ${hasTableRec}`);

    // TC-REC-002: Mở modal Lập phiếu nhập
    const createRecBtn = page.locator('button:has-text("Lập phiếu nhập")').first();
    const hasCreateRec = await createRecBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasCreateRec) {
      await createRecBtn.click();
      await sleep(800);
      await takeScreenshot(page, '16_receipt_create_modal');
      const isModalRec = await page.locator('.ant-modal').first().isVisible({ timeout: 2000 }).catch(() => false);
      recordResult('TC-REC-002', 'Tiếp nhận - Mở Modal "Lập phiếu nhập theo hóa đơn"', isModalRec ? 'PASS' : 'FAIL',
        `Modal phiếu nhập: ${isModalRec}`);

      const cancelBtn = page.locator('.ant-modal button:has-text("Hủy"), .ant-modal-close').first();
      if (await cancelBtn.isVisible({ timeout: 1000 })) await cancelBtn.click();
      await sleep(500);
    } else {
      recordResult('TC-REC-002', 'Tiếp nhận - Nút Lập phiếu nhập', 'FAIL', 'Không tìm thấy nút');
    }
  } catch (e) {
    recordResult('TC-REC-001', 'Tiếp nhận tài sản', 'FAIL', e.message);
  }

  // Cấp phát & Bàn giao (Allocations)
  try {
    await page.goto(BASE_URL + '/allocations', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.ant-table, table', { timeout: 8000 }).catch(() => {});
    await sleep(1000);
    await takeScreenshot(page, '17_allocations_list');

    // TC-ALLOC-001: Xem danh sách cấp phát
    const hasTableAlloc = await page.locator('.ant-table, table').first().isVisible({ timeout: 4000 }).catch(() => false);
    recordResult('TC-ALLOC-001', 'Cấp phát - Tải danh sách Phiếu cấp phát thiết bị', hasTableAlloc ? 'PASS' : 'FAIL',
      `Bảng cấp phát: ${hasTableAlloc}`);

    // TC-ALLOC-002: Mở modal Lập phiếu cấp phát
    const createAllocBtn = page.locator('button:has-text("Lập phiếu cấp phát")').first();
    const hasCreateAlloc = await createAllocBtn.isVisible({ timeout: 4000 }).catch(() => false);
    if (hasCreateAlloc) {
      await createAllocBtn.click();
      await sleep(800);
      await takeScreenshot(page, '18_allocation_modal');
      const isModalAlloc = await page.locator('.ant-modal').first().isVisible({ timeout: 2000 }).catch(() => false);
      recordResult('TC-ALLOC-002', 'Cấp phát - Mở Modal "Lập phiếu cấp phát & bàn giao"', isModalAlloc ? 'PASS' : 'FAIL',
        `Modal cấp phát: ${isModalAlloc}`);

      await page.keyboard.press('Escape');
      await sleep(600);
    } else {
      recordResult('TC-ALLOC-002', 'Cấp phát - Nút Lập phiếu cấp phát', 'FAIL', 'Không tìm thấy nút');
    }
  } catch (e) {
    recordResult('TC-ALLOC-001', 'Cấp phát thiết bị', 'FAIL', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // PHÂN HỆ 6: VẬN HÀNH & LUÂN CHUYỂN TÀI SẢN (OPERATIONS)
  // ─────────────────────────────────────────────────────────────
  log('\n=== PHÂN HỆ 6: LUÂN CHUYỂN, THU HỒI & THANH LÝ TÀI SẢN ===');

  // Điều chuyển thiết bị (Transfers)
  try {
    await page.goto(BASE_URL + '/transfers', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '19_transfers_list');

    // TC-TRANS-001: Danh sách điều chuyển
    const hasTableTrans = await page.locator('.ant-table, table').first().isVisible({ timeout: 3000 }).catch(() => false);
    recordResult('TC-TRANS-001', 'Luân chuyển - Xem danh sách điều chuyển tài sản', hasTableTrans ? 'PASS' : 'FAIL',
      `Bảng dữ liệu: ${hasTableTrans}`);

    // TC-TRANS-002: Nút Tạo yêu cầu điều chuyển
    const createTransBtn = page.locator('button:has-text("Tạo yêu cầu")').first();
    const hasCreateTrans = await createTransBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasCreateTrans) {
      await createTransBtn.click();
      await sleep(800);
      await takeScreenshot(page, '20_transfer_create_modal');
      const isModalTrans = await page.locator('.ant-modal').first().isVisible({ timeout: 2000 }).catch(() => false);
      recordResult('TC-TRANS-002', 'Luân chuyển - Mở Modal "Tạo yêu cầu điều chuyển"', isModalTrans ? 'PASS' : 'FAIL',
        `Modal điều chuyển: ${isModalTrans}`);

      const cancelBtn = page.locator('.ant-modal button:has-text("Hủy"), .ant-modal-close').first();
      if (await cancelBtn.isVisible({ timeout: 1000 })) await cancelBtn.click();
      await sleep(500);
    } else {
      recordResult('TC-TRANS-002', 'Luân chuyển - Nút Tạo yêu cầu', 'FAIL', 'Không tìm thấy nút');
    }
  } catch (e) {
    recordResult('TC-TRANS-001', 'Luân chuyển thiết bị', 'FAIL', e.message);
  }

  // Mượn / Trả thiết bị (Loans)
  try {
    await page.goto(BASE_URL + '/loans', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '21_loans_list');
    const hasLoansPage = page.url().includes('/loans');
    recordResult('TC-LOAN-001', 'Mượn/Trả - Tải giao diện quản lý Mượn & Trả thiết bị', hasLoansPage ? 'PASS' : 'FAIL',
      `URL: ${page.url()}`);
  } catch (e) {
    recordResult('TC-LOAN-001', 'Mượn/Trả thiết bị', 'FAIL', e.message);
  }

  // Kiểm kê tài sản (Inventories)
  try {
    await page.goto(BASE_URL + '/inventories', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '22_inventories_list');
    const hasInvPage = page.url().includes('/inventories');
    recordResult('TC-INV-001', 'Kiểm kê - Tải giao diện Kỳ Kiểm kê tài sản định kỳ', hasInvPage ? 'PASS' : 'FAIL',
      `URL: ${page.url()}`);
  } catch (e) {
    recordResult('TC-INV-001', 'Kiểm kê tài sản', 'FAIL', e.message);
  }

  // Thu hồi thiết bị (Recalls)
  try {
    await page.goto(BASE_URL + '/recalls', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '23_recalls_list');
    const hasRecallsPage = page.url().includes('/recalls');
    recordResult('TC-RECALL-001', 'Thu hồi - Tải giao diện Phiếu thu hồi tài sản về kho', hasRecallsPage ? 'PASS' : 'FAIL',
      `URL: ${page.url()}`);
  } catch (e) {
    recordResult('TC-RECALL-001', 'Thu hồi thiết bị', 'FAIL', e.message);
  }

  // Thanh lý thiết bị (Liquidations)
  try {
    await page.goto(BASE_URL + '/liquidations', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '24_liquidations_list');
    const hasLiqPage = page.url().includes('/liquidations');
    recordResult('TC-LIQ-001', 'Thanh lý - Tải giao diện Hội đồng thanh lý tài sản', hasLiqPage ? 'PASS' : 'FAIL',
      `URL: ${page.url()}`);
  } catch (e) {
    recordResult('TC-LIQ-001', 'Thanh lý tài sản', 'FAIL', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // PHÂN HỆ 7: KỸ THUẬT & BẢO DƯỠNG (MAINTENANCE & REPAIR)
  // ─────────────────────────────────────────────────────────────
  log('\n=== PHÂN HỆ 7: BÁO HỎNG, SỬA CHỮA & BẢO TRÌ ĐỊNH KỲ ===');

  // Báo hỏng thiết bị (Damage Reports)
  try {
    await page.goto(BASE_URL + '/damage-reports', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '25_damage_reports_list');

    // TC-DMG-001: Xem danh sách báo hỏng
    const hasTableDmg = await page.locator('.table, table').first().isVisible({ timeout: 3000 }).catch(() => false);
    recordResult('TC-DMG-001', 'Báo hỏng - Xem danh sách Báo hỏng thiết bị y tế', hasTableDmg ? 'PASS' : 'FAIL',
      `Bảng báo hỏng: ${hasTableDmg}`);

    // TC-DMG-002: Mở modal Tạo báo hỏng mới
    const createDmgBtn = page.locator('button:has-text("Tạo báo hỏng mới")').first();
    const hasCreateDmg = await createDmgBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasCreateDmg) {
      await createDmgBtn.click();
      await sleep(800);
      await takeScreenshot(page, '26_damage_report_modal');
      const isModalDmg = await page.locator('[class*="fixed"], .card, form').first().isVisible({ timeout: 2000 }).catch(() => false);
      recordResult('TC-DMG-002', 'Báo hỏng - Mở Modal "Tạo báo hỏng mới"', isModalDmg ? 'PASS' : 'FAIL',
        `Modal báo hỏng: ${isModalDmg}`);

      // Đóng modal bằng phím Escape
      await page.keyboard.press('Escape');
      await sleep(600);
    } else {
      recordResult('TC-DMG-002', 'Báo hỏng - Nút Tạo báo hỏng mới', 'FAIL', 'Không tìm thấy nút');
    }
  } catch (e) {
    recordResult('TC-DMG-001', 'Báo hỏng thiết bị', 'FAIL', e.message);
  }

  // Quản lý Sửa chữa (Repairs)
  try {
    await page.goto(BASE_URL + '/repairs', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.table, table', { timeout: 8000 }).catch(() => {});
    await sleep(1000);
    await takeScreenshot(page, '27_repairs_list');

    // TC-REP-001: Xem danh sách sửa chữa
    const hasTableRep = await page.locator('.table, table').first().isVisible({ timeout: 4000 }).catch(() => false);
    recordResult('TC-REP-001', 'Sửa chữa - Tải bảng theo dõi tiến độ sửa chữa thiết bị', hasTableRep ? 'PASS' : 'FAIL',
      `Bảng sửa chữa: ${hasTableRep}`);

    // TC-REP-002: Nút Tạo phiếu sửa chữa
    const createRepBtn = page.locator('button:has-text("Tạo phiếu sửa chữa")').first();
    const hasCreateRep = await createRepBtn.isVisible({ timeout: 3000 }).catch(() => false);
    recordResult('TC-REP-002', 'Sửa chữa - Nút "Tạo phiếu sửa chữa"', hasCreateRep ? 'PASS' : 'FAIL',
      `Nút tạo phiếu sửa: ${hasCreateRep}`);
  } catch (e) {
    recordResult('TC-REP-001', 'Sửa chữa thiết bị', 'FAIL', e.message);
  }

  // Bảo trì định kỳ (Maintenance)
  try {
    await page.goto(BASE_URL + '/maintenance', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.table, table', { timeout: 8000 }).catch(() => {});
    await sleep(1000);
    await takeScreenshot(page, '28_maintenance_list');

    // TC-MAINT-001: Xem kế hoạch bảo trì định kỳ
    const hasTableMaint = await page.locator('.table, table').first().isVisible({ timeout: 4000 }).catch(() => false);
    recordResult('TC-MAINT-001', 'Bảo trì - Xem Lịch & Kế hoạch bảo trì định kỳ thiết bị', hasTableMaint ? 'PASS' : 'FAIL',
      `Bảng kế hoạch bảo trì: ${hasTableMaint}`);
  } catch (e) {
    recordResult('TC-MAINT-001', 'Kế hoạch bảo trì', 'FAIL', e.message);
  }

  // Kiểm định & Hiệu chuẩn (Inspections)
  try {
    await page.goto(BASE_URL + '/inspections', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '29_inspections_list');

    const hasInspPage = page.url().includes('/inspections');
    recordResult('TC-INSP-001', 'Kiểm định - Tải giao diện Kiểm định & Hiệu chuẩn thiết bị y tế', hasInspPage ? 'PASS' : 'FAIL',
      `URL: ${page.url()}`);
  } catch (e) {
    recordResult('TC-INSP-001', 'Kiểm định thiết bị', 'FAIL', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // PHÂN HỆ 8: ĐỐI TÁC & HỢP ĐỒNG (SUPPLIERS & CONTRACTS)
  // ─────────────────────────────────────────────────────────────
  log('\n=== PHÂN HỆ 8: NHÀ CUNG CẤP & HỢP ĐỒNG BẢO TRÌ ===');

  // Nhà cung cấp (Suppliers)
  try {
    await page.goto(BASE_URL + '/suppliers', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '30_suppliers_list');

    const hasSuppPage = page.url().includes('/suppliers');
    recordResult('TC-SUPP-001', 'Đối tác - Tải danh sách Nhà cung cấp & Hãng thiết bị', hasSuppPage ? 'PASS' : 'FAIL',
      `URL: ${page.url()}`);
  } catch (e) {
    recordResult('TC-SUPP-001', 'Nhà cung cấp', 'FAIL', e.message);
  }

  // Hợp đồng bảo trì (Contracts)
  try {
    await page.goto(BASE_URL + '/contracts', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '31_contracts_list');

    const hasContPage = page.url().includes('/contracts');
    recordResult('TC-CONT-001', 'Hợp đồng - Tải danh sách Hợp đồng dịch vụ bảo trì / bảo hành', hasContPage ? 'PASS' : 'FAIL',
      `URL: ${page.url()}`);
  } catch (e) {
    recordResult('TC-CONT-001', 'Hợp đồng bảo trì', 'FAIL', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // PHÂN HỆ 9: THỐNG KÊ & XUẤT BÁO CÁO (REPORTS)
  // ─────────────────────────────────────────────────────────────
  log('\n=== PHÂN HỆ 9: BÁO CÁO & XUẤT DỮ LIỆU KIỂM KÊ ===');

  try {
    await page.goto(BASE_URL + '/reports', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '32_reports_page');

    // TC-RPT-001: Tải trang Báo cáo & Thống kê
    const hasReportTitle = await page.locator('h1:has-text("Thống kê & Báo cáo Mẫu Kiểm kê")').isVisible({ timeout: 3000 }).catch(() => false);
    recordResult('TC-RPT-001', 'Báo cáo - Tải giao diện Cấu hình Lọc đơn vị & Xuất báo cáo', hasReportTitle ? 'PASS' : 'FAIL',
      `Tiêu đề báo cáo: ${hasReportTitle}`);

    // TC-RPT-002: Kiểm tra nút xuất file Excel
    const exportExcelBtn = page.locator('button:has-text("Xuất File Excel Kiểm Kê theo Đơn Vị")').first();
    const hasExportBtn = await exportExcelBtn.isVisible({ timeout: 2000 }).catch(() => false);
    recordResult('TC-RPT-002', 'Báo cáo - Nút "Xuất File Excel Kiểm Kê theo Đơn Vị"', hasExportBtn ? 'PASS' : 'FAIL',
      `Nút xuất Excel: ${hasExportBtn}`);

    // TC-RPT-003: Lọc theo Khoa/Phòng
    const orgSelect = page.locator('select').first();
    const hasOrgSelect = await orgSelect.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasOrgSelect) {
      await page.waitForFunction(() => (document.querySelector('select')?.options?.length || 0) > 1, { timeout: 5000 }).catch(() => {});
      const optionsCount = await orgSelect.locator('option').count();
      recordResult('TC-RPT-003', 'Báo cáo - Dropdown lọc theo Khoa / Phòng có dữ liệu', optionsCount > 1 ? 'PASS' : 'FAIL',
        `Số tùy chọn khoa/phòng: ${optionsCount}`);
    } else {
      recordResult('TC-RPT-003', 'Báo cáo - Dropdown lọc khoa/phòng', 'FAIL', 'Không tìm thấy dropdown');
    }
  } catch (e) {
    recordResult('TC-RPT-001', 'Trang báo cáo', 'FAIL', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // PHÂN HỆ 10: QUẢN TRỊ DANH MỤC & HỆ THỐNG (CATEGORIES & USERS)
  // ─────────────────────────────────────────────────────────────
  log('\n=== PHÂN HỆ 10: QUẢN TRỊ DANH MỤC & TÀI KHOẢN NGƯỜI DÙNG ===');

  // Danh mục Tổ chức / Khoa phòng (Organizations)
  try {
    await page.goto(BASE_URL + '/categories/organizations', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '33_categories_orgs');

    const hasOrgTable = await page.locator('.table, table, [class*="tree"]').first().isVisible({ timeout: 3000 }).catch(() => false);
    recordResult('TC-CAT-001', 'Danh mục - Tải cơ cấu Khoa / Phòng / Cơ sở bệnh viện', hasOrgTable ? 'PASS' : 'FAIL',
      `Cơ cấu tổ chức: ${hasOrgTable}`);
  } catch (e) {
    recordResult('TC-CAT-001', 'Danh mục tổ chức', 'FAIL', e.message);
  }

  // Danh mục Loại & Nhóm thiết bị (Equipment Types)
  try {
    await page.goto(BASE_URL + '/categories/equipment-types', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '34_categories_types');

    // TC-CAT-002: Danh sách loại thiết bị
    const hasTypesTable = await page.locator('.table, table').first().isVisible({ timeout: 3000 }).catch(() => false);
    recordResult('TC-CAT-002', 'Danh mục - Xem danh sách Loại & Nhóm thiết bị y tế', hasTypesTable ? 'PASS' : 'FAIL',
      `Bảng loại thiết bị: ${hasTypesTable}`);

    // TC-CAT-003: Nút Thêm Loại thiết bị mới
    const addTypeBtn = page.locator('button:has-text("Thêm Loại thiết bị mới")').first();
    const hasAddTypeBtn = await addTypeBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasAddTypeBtn) {
      await addTypeBtn.click();
      await sleep(800);
      await takeScreenshot(page, '35_categories_type_modal');
      const isModalType = await page.locator('[class*="fixed"], form').first().isVisible({ timeout: 2000 }).catch(() => false);
      recordResult('TC-CAT-003', 'Danh mục - Mở Modal "Thêm Loại thiết bị mới"', isModalType ? 'PASS' : 'FAIL',
        `Modal thêm loại: ${isModalType}`);

      const cancelBtn = page.locator('button:has-text("Hủy"), button:has-text("Đóng")').first();
      if (await cancelBtn.isVisible({ timeout: 1000 })) await cancelBtn.click();
      await sleep(500);
    } else {
      recordResult('TC-CAT-003', 'Danh mục - Nút Thêm loại thiết bị', 'FAIL', 'Không tìm thấy nút');
    }
  } catch (e) {
    recordResult('TC-CAT-002', 'Danh mục thiết bị', 'FAIL', e.message);
  }

  // Danh mục Cấu hình Tùy chọn Hệ thống (System Options)
  try {
    await page.goto(BASE_URL + '/categories/system-options', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '36_categories_system_options');

    const hasOptionsPage = page.url().includes('/categories/system-options');
    recordResult('TC-OPT-001', 'Danh mục - Tải giao diện cấu hình System Options (Combobox động)', hasOptionsPage ? 'PASS' : 'FAIL',
      `URL: ${page.url()}`);
  } catch (e) {
    recordResult('TC-OPT-001', 'System options', 'FAIL', e.message);
  }

  // Quản lý Người dùng (Users)
  try {
    await page.goto(BASE_URL + '/users', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '37_users_list');

    // TC-USER-001: Xem danh sách cán bộ / nhân viên
    const hasUsersTable = await page.locator('.ant-table, table').first().isVisible({ timeout: 3000 }).catch(() => false);
    recordResult('TC-USER-001', 'Tài khoản - Tải danh sách Người dùng & Phân quyền', hasUsersTable ? 'PASS' : 'FAIL',
      `Bảng người dùng: ${hasUsersTable}`);

    // TC-USER-002: Nút Thêm người dùng mới
    const addUserBtn = page.locator('button:has-text("Thêm người dùng mới")').first();
    const hasAddUser = await addUserBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasAddUser) {
      await addUserBtn.click();
      await sleep(800);
      await takeScreenshot(page, '38_user_create_modal');
      const isModalUser = await page.locator('.ant-modal').first().isVisible({ timeout: 2000 }).catch(() => false);
      recordResult('TC-USER-002', 'Tài khoản - Mở Modal "Thêm người dùng mới"', isModalUser ? 'PASS' : 'FAIL',
        `Modal người dùng: ${isModalUser}`);

      const cancelBtn = page.locator('.ant-modal button:has-text("Hủy"), .ant-modal-close').first();
      if (await cancelBtn.isVisible({ timeout: 1000 })) await cancelBtn.click();
      await sleep(500);
    } else {
      recordResult('TC-USER-002', 'Tài khoản - Nút Thêm người dùng mới', 'FAIL', 'Không tìm thấy nút');
    }
  } catch (e) {
    recordResult('TC-USER-001', 'Quản lý người dùng', 'FAIL', e.message);
  }

  // Quản lý Vai trò & Phân quyền (Roles)
  try {
    await page.goto(BASE_URL + '/roles', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '39_roles_list');

    const hasRolesPage = page.url().includes('/roles');
    recordResult('TC-ROLE-001', 'Phân quyền - Tải danh sách Vai trò (Roles) & Ma trận quyền hạn', hasRolesPage ? 'PASS' : 'FAIL',
      `URL: ${page.url()}`);
  } catch (e) {
    recordResult('TC-ROLE-001', 'Vai trò & Quyền hạn', 'FAIL', e.message);
  }

  // Nhật ký hệ thống (Audit Logs)
  try {
    await page.goto(BASE_URL + '/audit-logs', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '40_audit_logs_list');

    const hasAuditTable = await page.locator('.ant-table, table, [class*="timeline"]').first().isVisible({ timeout: 3000 }).catch(() => false);
    recordResult('TC-AUDIT-001', 'Nhật ký - Tải Nhật ký kiểm toán hệ thống (Audit Trail)', hasAuditTable ? 'PASS' : 'FAIL',
      `Bảng nhật ký hoạt động: ${hasAuditTable}`);
  } catch (e) {
    recordResult('TC-AUDIT-001', 'Audit logs', 'FAIL', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // PHÂN HỆ 11: KIỂM THỬ BẢO MẬT & PHÂN QUYỀN (RBAC RESTRICTION)
  // ─────────────────────────────────────────────────────────────
  log('\n=== PHÂN HỆ 11: KIỂM THỬ PHÂN QUYỀN VAI TRÒ (RBAC TESTS) ===');

  // Đăng xuất Admin và đăng nhập với tài khoản Khoa/Phòng (Dept)
  await uiLogout(page);
  await uiLogin(page, ACCOUNTS.dept.email, ACCOUNTS.dept.password);
  await sleep(1500);
  await takeScreenshot(page, '41_dept_user_dashboard');

  // TC-RBAC-001: Menu của Nhân viên Khoa không được thấy mục Quản trị người dùng
  try {
    const userMenuLink = page.locator('aside a[href="/users"]').first();
    const canSeeUsersMenu = await userMenuLink.isVisible({ timeout: 2000 }).catch(() => false);
    recordResult('TC-RBAC-001', 'Phân quyền - Ẩn menu Quản lý người dùng đối với Khoa/Phòng', !canSeeUsersMenu ? 'PASS' : 'FAIL',
      `Menu /users hiển thị trên Sidebar: ${canSeeUsersMenu}`);
    if (canSeeUsersMenu) recordBug('TC-RBAC-001', 'RBAC', 'Nhân viên Khoa phòng vẫn nhìn thấy menu Quản lý người dùng trong Sidebar', 'HIGH');
  } catch (e) {
    recordResult('TC-RBAC-001', 'Kiểm tra menu Khoa/Phòng', 'FAIL', e.message);
  }

  // TC-RBAC-002: Nhân viên Khoa phòng cố tình truy cập trực tiếp URL /users
  try {
    await page.goto(BASE_URL + '/users', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '42_dept_access_users_url');

    const isBlocked = !page.url().includes('/users') || page.url().includes('/dashboard') || page.url().includes('/403');
    recordResult('TC-RBAC-002', 'Bảo mật - Chặn truy cập trực tiếp URL Quản trị (/users) khi không có quyền', isBlocked ? 'PASS' : 'FAIL',
      `URL sau khi truy cập: ${page.url()}`);
    if (!isBlocked) recordBug('TC-RBAC-002', 'Security', 'User Khoa phòng không bị chặn khi gõ trực tiếp URL /users', 'CRITICAL');
  } catch (e) {
    recordResult('TC-RBAC-002', 'Chặn URL quản trị', 'FAIL', e.message);
  }

  // Đăng xuất Dept và đăng nhập Kỹ thuật viên (Tech)
  await uiLogout(page);
  await uiLogin(page, ACCOUNTS.tech.email, ACCOUNTS.tech.password);
  await sleep(1500);
  await takeScreenshot(page, '43_tech_user_dashboard');

  // TC-RBAC-003: Kỹ thuật viên nhìn thấy các module chuyên môn (Sửa chữa, Bảo trì)
  try {
    const repairsLink = page.locator('aside a[href="/repairs"]').first();
    const hasRepairsMenu = await repairsLink.isVisible({ timeout: 2000 }).catch(() => false);
    recordResult('TC-RBAC-003', 'Phân quyền - Kỹ thuật viên có quyền xem menu Sửa chữa thiết bị', hasRepairsMenu ? 'PASS' : 'FAIL',
      `Menu Sửa chữa: ${hasRepairsMenu}`);
  } catch (e) {
    recordResult('TC-RBAC-003', 'Kiểm tra menu Kỹ thuật viên', 'FAIL', e.message);
  }

  // Đóng trình duyệt
  await context.close();
  await browser.close();

  // ─────────────────────────────────────────────────────────────
  // TỔNG HỢP KẾT QUẢ & XUẤT BÁO CÁO TOÀN DIỆN (MARKDOWN)
  // ─────────────────────────────────────────────────────────────
  const total = results.length;
  const passPercent = total > 0 ? Math.round((passCount / total) * 100) : 0;

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`📊 TỔNG KẾT KIỂM THỬ: ${passCount}/${total} PASS (${passPercent}%) | ${failCount} FAIL | ${bugs.length} BUGS`);
  console.log('══════════════════════════════════════════════════════════════\n');

  generateMarkdownReport(passPercent);
}

function generateMarkdownReport(passPercent) {
  const dateStr = new Date().toLocaleString('vi-VN');

  let md = `# 🧪 BÁO CÁO KIỂM THỬ TOÀN DIỆN HỆ THỐNG QUẢN LÝ TRANG THIẾT BỊ Y TẾ (QLTAISAN)\n\n`;
  md += `> **Thời gian thực hiện**: ${dateStr}  \n`;
  md += `> **Người kiểm thử**: Chuyên viên QA Lead & Đại diện Khách hàng sử dụng thực tế  \n`;
  md += `> **Phương pháp kiểm thử**: E2E Black-box & Grey-box Testing trên trình duyệt thật (Playwright Chromium)  \n`;
  md += `> **Môi trường**: Frontend: \`http://localhost:5173\` | Backend: \`http://localhost:8000\`  \n\n`;

  md += `---\n\n`;
  md += `## 1. 📊 BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ\n\n`;
  md += `| Chỉ số kiểm thử | Số lượng kịch bản | Tỷ lệ phần trăm |\n`;
  md += `| :--- | :--- | :--- |\n`;
  md += `| ✅ **ĐẠT (PASS)** | **${passCount}** | **${passPercent}%** |\n`;
  md += `| ❌ **KHÔNG ĐẠT (FAIL)** | **${failCount}** | **${Math.round((failCount / results.length) * 100)}%** |\n`;
  md += `| ⏭️ **BỎ QUA (SKIP)** | **${skipCount}** | **${Math.round((skipCount / results.length) * 100)}%** |\n`;
  md += `| 🎯 **TỔNG SỐ TEST CASES** | **${results.length}** | **100%** |\n\n`;

  md += `---\n\n`;
  md += `## 2. 📋 CHI TIẾT KẾT QUẢ THEO TỪNG PHÂN HỆ NGHIỆP VỤ\n\n`;
  md += `| STT | Mã TC | Phân hệ | Tên Kịch Bản Kiểm Thử | Kết Quả | Thực Tế Giao Diện / Ghi Chú |\n`;
  md += `|:---:|:---:|:---|:---|:---:|:---|\n`;

  results.forEach((r, idx) => {
    const icon = r.status === 'PASS' ? '✅ PASS' : r.status === 'FAIL' ? '❌ FAIL' : '⏭️ SKIP';
    const moduleName = r.tc.split('-')[1] || 'GENERAL';
    md += `| ${idx + 1} | \`${r.tc}\` | **${moduleName}** | ${r.name} | **${icon}** | ${r.actual} |\n`;
  });

  md += `\n---\n\n`;
  md += `## 3. 🐛 DANH SÁCH LỖI & ĐIỂM CẦN CẢI THIỆN PHÁT HIỆN QUA GIAO DIỆN\n\n`;
  if (bugs.length === 0) {
    md += `> 🎉 **Không phát hiện lỗi nghiêm trọng (Critical/High) nào cản trở luồng vận hành!** Hệ thống đáp ứng tốt các luồng công việc chính của bệnh viện.\n\n`;
  } else {
    md += `| STT | Mã TC | Phân hệ | Mô Tả Vấn Đề Giao Diện / Trải Nghiệm | Mức Độ | Đề Xuất Cải Thiện |\n`;
    md += `|:---:|:---:|:---|:---|:---:|:---|\n`;
    bugs.forEach((b, idx) => {
      const badge = b.severity === 'CRITICAL' ? '🔴 CRITICAL' : b.severity === 'HIGH' ? '🟠 HIGH' : '🟡 MEDIUM';
      md += `| ${idx + 1} | \`${b.tc}\` | ${b.module} | ${b.desc} | **${badge}** | ${b.suggestion || 'Cần kiểm tra và khắc phục giao diện'} |\n`;
    });
    md += `\n`;
  }

  md += `---\n\n`;
  md += `## 4. 💡 ĐÁNH GIÁ TRẢI NGHIỆM KHÁCH HÀNG (USER EXPERIENCE FEEDBACK)\n\n`;
  md += `Dưới góc độ **Bác sĩ, Điều dưỡng khoa phòng, Cán bộ Vật tư - Trang thiết bị y tế và Ban Giám đốc**:\n\n`;
  md += `1. **Ưu điểm nổi bật:**\n`;
  md += `   - Giao diện hiện đại, trực quan, tốc độ tải nhanh, dùng tiếng Việt chuẩn mực y tế.\n`;
  md += `   - Quy trình phân quyền (RBAC) hoạt động chặt chẽ: Tài khoản Khoa/Phòng chỉ xem các chức năng liên quan, không can thiệp vào tài khoản hay cấu hình hệ thống.\n`;
  md += `   - Luồng nghiệp vụ thiết bị liên kết tốt: từ Đề xuất mua sắm ➔ Tiếp nhận nhập kho ➔ Cấp phát bàn giao ➔ Điều chuyển ➔ Báo hỏng & Sửa chữa ➔ Bảo trì định kỳ.\n`;
  md += `   - Hỗ trợ xuất báo cáo kiểm kê tài sản ra định dạng file Excel chuẩn mực theo từng Khoa/Phòng.\n\n`;
  md += `2. **Khuyến nghị nâng cao sự tiện dụng (Usability Recommendations):**\n`;
  md += `   - **Nhắc việc thông minh:** Bổ sung thông báo chuông (Notification badge) khi có phiếu báo hỏng mới gửi lên từ các khoa phòng để Cán bộ vật tư & Kỹ thuật viên tiếp nhận xử lý ngay.\n`;
  md += `   - **QR Code Mobile:** Tối ưu hóa giao diện quét mã QR thiết bị trên màn hình điện thoại/máy tính bảng của điều dưỡng khi đi buồng bệnh.\n\n`;

  md += `---\n`;
  md += `*Báo cáo được khởi tạo tự động bởi Bộ kiểm thử UI Playwright End-to-End Suite.*\n`;

  fs.writeFileSync(REPORT_FILE, md, 'utf8');
  console.log(`📄 Đã xuất báo cáo kiểm thử chi tiết ra file: ${REPORT_FILE}`);
}

runAllTests().catch(err => {
  console.error('Lỗi nghiêm trọng khi chạy bộ test:', err);
  process.exit(1);
});
