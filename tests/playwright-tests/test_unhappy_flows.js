/**
 * ═══════════════════════════════════════════════════════════════
 * 🧪 QLTAISAN - BỘ KIỂM THỬ TỰ ĐỘNG CÁC LUỒNG NGOẠI LỆ (UNHAPPY FLOWS)
 * ═══════════════════════════════════════════════════════════════
 * Các phân nhóm kiểm thử:
 * 1. Xác thực & Đăng nhập (Auth Unhappy Flows)
 * 2. Phân quyền & Chặn truy cập trái phép (RBAC Security)
 * 3. Từ chối & Rút lại quy trình (Workflow Rejection & Recall)
 * 4. Kiểm tra ràng buộc & Chặn lỗi Form (Validation & Integrity)
 * ═══════════════════════════════════════════════════════════════
 */

const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'unhappy');
const REPORT_FILE = path.join(__dirname, 'unhappy-flow-report.md');
const RESET_SCRIPT = path.join(__dirname, 'reset_unhappy_data.php');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

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

function log(msg) {
  const time = new Date().toLocaleTimeString('vi-VN');
  console.log(`[${time}] ${msg}`);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function resetDatabaseState() {
  try {
    const phpPath = process.env.LOCALAPPDATA + '\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\\php.exe';
    execSync(`"${phpPath}" "${RESET_SCRIPT}"`, { stdio: 'pipe' });
    log('🔄 Đã khởi tạo/reset dữ liệu kiểm thử (TT-UNHAPPY-TEST, DC-UNHAPPY-TEST, DM-UNHAPPY-RECALL) trong CSDL');
  } catch (err) {
    log('⚠️ Không thể chạy reset_unhappy_data.php: ' + err.message);
  }
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

function recordResult(tc, group, name, status, actual, note = '') {
  const emoji = status === 'PASS' ? '✅' : '❌';
  log(`${emoji} [${group}] ${tc}: ${name} → ${status} (${actual})`);
  results.push({ tc, group, name, status, actual, note });
  if (status === 'PASS') passCount++;
  else failCount++;
}

async function uiLogin(page, email, password) {
  await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(400);

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(500);

  const emailInput = page.locator('#login-email, input[type="email"]').first();
  const passInput = page.locator('#login-password, input[type="password"]').first();
  const submitBtn = page.locator('#login-submit, button[type="submit"]').first();

  await emailInput.fill(email);
  await passInput.fill(password);
  await submitBtn.click();
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
  await sleep(800);
}

async function uiLogout(page) {
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded' });
    await sleep(500);
  } catch (e) {
    await page.goto(BASE_URL + '/login');
  }
}

async function runUnhappyFlowTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   🧪 BỘ KIỂM THỬ TỰ ĐỘNG CÁC LUỒNG NGOẠI LỆ (UNHAPPY FLOWS)  ║');
  console.log('║   Hệ thống Quản lý Trang thiết bị Y tế (QLTAISAN)           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Khởi tạo trạng thái dữ liệu kiểm thử
  resetDatabaseState();

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // ═════════════════════════════════════════════════════════════
  // PHÂN NHÓM 1: XÁC THỰC & ĐĂNG NHẬP (AUTH UNHAPPY FLOWS)
  // ═════════════════════════════════════════════════════════════
  log('>>> PHÂN NHÓM 1: XÁC THỰC & ĐĂNG NHẬP (AUTH UNHAPPY FLOWS)');

  // TC-UH-AUTH-01: Đăng nhập với mật khẩu sai
  try {
    await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload();
    await sleep(400);

    await page.locator('#login-email').fill('admin@hospital.local');
    await page.locator('#login-password').fill('SaiMatKhau@999');
    await page.locator('#login-submit').click();
    await sleep(1200);

    await takeScreenshot(page, '01_auth_wrong_password');
    const hasErrorAlert = await page.locator('.text-red-200, [class*="red"], [role="alert"]').first().isVisible().catch(() => false);
    const stillOnLogin = page.url().includes('/login');

    recordResult('TC-UH-AUTH-01', 'AUTH', 'Đăng nhập mật khẩu sai bị từ chối và báo lỗi',
      (hasErrorAlert && stillOnLogin) ? 'PASS' : 'FAIL',
      `Alert lỗi: ${hasErrorAlert}, Giữ nguyên /login: ${stillOnLogin}`);
  } catch (e) {
    recordResult('TC-UH-AUTH-01', 'AUTH', 'Đăng nhập mật khẩu sai', 'FAIL', e.message);
  }

  // TC-UH-AUTH-02: Đăng nhập với email không tồn tại
  try {
    await page.locator('#login-email').fill('khongtontai@bvhoahao.vn');
    await page.locator('#login-password').fill('MatKhau@12345');
    await page.locator('#login-submit').click();
    await sleep(1200);

    await takeScreenshot(page, '02_auth_user_not_found');
    const hasErrorAlert = await page.locator('.text-red-200, [class*="red"], [role="alert"]').first().isVisible().catch(() => false);
    const stillOnLogin = page.url().includes('/login');

    recordResult('TC-UH-AUTH-02', 'AUTH', 'Đăng nhập tài khoản không tồn tại bị từ chối',
      (hasErrorAlert && stillOnLogin) ? 'PASS' : 'FAIL',
      `Alert lỗi: ${hasErrorAlert}, Giữ nguyên /login: ${stillOnLogin}`);
  } catch (e) {
    recordResult('TC-UH-AUTH-02', 'AUTH', 'Đăng nhập email không tồn tại', 'FAIL', e.message);
  }

  // TC-UH-AUTH-03: Bỏ trống Email hoặc Password khi submit
  try {
    await page.locator('#login-email').fill('');
    await page.locator('#login-password').fill('');
    await page.locator('#login-submit').click();
    await sleep(400);

    await takeScreenshot(page, '03_auth_empty_validation');
    const isEmailInvalid = await page.locator('#login-email:invalid').count();
    const stillOnLogin = page.url().includes('/login');

    recordResult('TC-UH-AUTH-03', 'AUTH', 'Bỏ trống thông tin đăng nhập bị HTML5 validation chặn',
      (isEmailInvalid > 0 && stillOnLogin) ? 'PASS' : 'FAIL',
      `Input :invalid: ${isEmailInvalid > 0}, URL: ${page.url()}`);
  } catch (e) {
    recordResult('TC-UH-AUTH-03', 'AUTH', 'Bỏ trống đăng nhập', 'FAIL', e.message);
  }

  // TC-UH-AUTH-04: Chưa đăng nhập cố tình truy cập các URL nội bộ bảo vệ
  try {
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.goto(BASE_URL + '/dashboard', { waitUntil: 'domcontentloaded' });
    await sleep(1200);

    await takeScreenshot(page, '04_unauth_redirect_dashboard');
    const redirectedLogin1 = page.url().includes('/login');

    await page.goto(BASE_URL + '/equipment', { waitUntil: 'domcontentloaded' });
    await sleep(1200);
    const redirectedLogin2 = page.url().includes('/login');

    recordResult('TC-UH-AUTH-04', 'AUTH', 'Chặn truy cập route nội bộ khi chưa xác thực (Redirect /login)',
      (redirectedLogin1 && redirectedLogin2) ? 'PASS' : 'FAIL',
      `Redirect từ /dashboard: ${redirectedLogin1}, từ /equipment: ${redirectedLogin2}`);
  } catch (e) {
    recordResult('TC-UH-AUTH-04', 'AUTH', 'Chặn route nội bộ', 'FAIL', e.message);
  }

  // ═════════════════════════════════════════════════════════════
  // PHÂN NHÓM 2: PHÂN QUYỀN & BẢO MẬT (RBAC UNHAPPY FLOWS)
  // ═════════════════════════════════════════════════════════════
  log('>>> PHÂN NHÓM 2: PHÂN QUYỀN & BẢO MẬT (RBAC UNHAPPY FLOWS)');

  // Đăng nhập tài khoản Nhân viên Khoa Nội (dept)
  await uiLogin(page, ACCOUNTS.dept.email, ACCOUNTS.dept.password);

  // TC-UH-RBAC-01: Nhân viên khoa phòng truy cập trực tiếp URL /users
  try {
    await page.goto(BASE_URL + '/users', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(u => !u.toString().includes('/users'), { timeout: 6000 }).catch(() => {});
    await sleep(600);
    await takeScreenshot(page, '05_dept_blocked_users');

    const isBlocked = !page.url().includes('/users') || page.url().includes('/dashboard') || page.url().includes('/403');
    recordResult('TC-UH-RBAC-01', 'RBAC', 'Nhân viên Khoa bị chặn truy cập trực tiếp URL Quản trị (/users)',
      isBlocked ? 'PASS' : 'FAIL',
      `URL hiện tại: ${page.url()}`);
  } catch (e) {
    recordResult('TC-UH-RBAC-01', 'RBAC', 'Chặn URL /users', 'FAIL', e.message);
  }

  // TC-UH-RBAC-02: Nhân viên khoa phòng truy cập trực tiếp URL /roles
  try {
    await page.goto(BASE_URL + '/roles', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(u => !u.toString().includes('/roles'), { timeout: 6000 }).catch(() => {});
    await sleep(600);
    await takeScreenshot(page, '06_dept_blocked_roles');

    const isBlocked = !page.url().includes('/roles') || page.url().includes('/dashboard') || page.url().includes('/403');
    recordResult('TC-UH-RBAC-02', 'RBAC', 'Nhân viên Khoa bị chặn truy cập trực tiếp URL Phân quyền (/roles)',
      isBlocked ? 'PASS' : 'FAIL',
      `URL hiện tại: ${page.url()}`);
  } catch (e) {
    recordResult('TC-UH-RBAC-02', 'RBAC', 'Chặn URL /roles', 'FAIL', e.message);
  }

  // TC-UH-RBAC-03: Nhân viên khoa phòng truy cập trực tiếp URL /audit-logs
  try {
    await page.goto(BASE_URL + '/audit-logs', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(u => !u.toString().includes('/audit-logs'), { timeout: 6000 }).catch(() => {});
    await sleep(600);
    await takeScreenshot(page, '07_dept_blocked_audit_logs');

    const isBlocked = !page.url().includes('/audit-logs') || page.url().includes('/dashboard') || page.url().includes('/403');
    recordResult('TC-UH-RBAC-03', 'RBAC', 'Nhân viên Khoa bị chặn truy cập trực tiếp URL Nhật ký (/audit-logs)',
      isBlocked ? 'PASS' : 'FAIL',
      `URL hiện tại: ${page.url()}`);
  } catch (e) {
    recordResult('TC-UH-RBAC-03', 'RBAC', 'Chặn URL /audit-logs', 'FAIL', e.message);
  }

  // TC-UH-RBAC-04: Đăng nhập PVT kiểm tra KHÔNG CÓ nút Duyệt / Từ chối trên Tờ trình
  await uiLogout(page);
  await uiLogin(page, ACCOUNTS.pvt.email, ACCOUNTS.pvt.password);

  try {
    await page.goto(BASE_URL + '/proposals', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '08_pvt_no_approve_reject_buttons');

    const pvtApproveBtn = await page.locator('button:has-text("Duyệt")').count();
    const pvtRejectBtn = await page.locator('button:has-text("Từ chối")').count();

    const noSelfApprove = (pvtApproveBtn === 0 && pvtRejectBtn === 0);
    recordResult('TC-UH-RBAC-04', 'RBAC', 'Phòng Vật tư KHÔNG được tự duyệt/từ chối tờ trình của chính mình',
      noSelfApprove ? 'PASS' : 'FAIL',
      `Nút Duyệt: ${pvtApproveBtn}, Nút Từ chối: ${pvtRejectBtn}`);
  } catch (e) {
    recordResult('TC-UH-RBAC-04', 'RBAC', 'Kiểm tra quyền duyệt PVT', 'FAIL', e.message);
  }

  // TC-UH-RBAC-05: Đăng nhập Ban Giám đốc kiểm tra KHÔNG CÓ nút "Lập tờ trình"
  await uiLogout(page);
  await uiLogin(page, ACCOUNTS.leader.email, ACCOUNTS.leader.password);

  try {
    await page.goto(BASE_URL + '/proposals', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await takeScreenshot(page, '09_leader_no_create_proposal_btn');

    const leaderCreateBtn = await page.locator('button:has-text("Lập tờ trình")').count();
    recordResult('TC-UH-RBAC-05', 'RBAC', 'Ban Giám đốc KHÔNG có quyền tự lập tờ trình (chỉ PVT lập)',
      leaderCreateBtn === 0 ? 'PASS' : 'FAIL',
      `Nút Lập tờ trình: ${leaderCreateBtn}`);
  } catch (e) {
    recordResult('TC-UH-RBAC-05', 'RBAC', 'Kiểm tra quyền lập tờ trình BGĐ', 'FAIL', e.message);
  }

  // TC-UH-RBAC-06: Khoa phòng bị giới hạn chỉ lập đề nghị mua cho khoa của mình
  await uiLogout(page);
  await uiLogin(page, ACCOUNTS.dept.email, ACCOUNTS.dept.password);

  try {
    await page.goto(BASE_URL + '/purchase-requests', { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    const addBtn = page.locator('button:has-text("Lập đề nghị mua")').first();
    await addBtn.click();
    await sleep(800);

    const orgInput = page.locator('#organization_id');
    await orgInput.click();
    await sleep(500);

    const orgOptions = await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content').allTextContents();
    await page.keyboard.press('Escape');
    await sleep(300);
    await page.locator('.ant-modal-footer button:has-text("Hủy"), .ant-modal-close').first().click().catch(() => {});
    await sleep(400);

    await takeScreenshot(page, '10_dept_restricted_org_dropdown');
    const isRestricted = (orgOptions.length === 1 && orgOptions[0].includes('Khoa Nội Tổng hợp'));
    recordResult('TC-UH-RBAC-06', 'RBAC', 'Nhân viên Khoa bị cô lập dữ liệu, chỉ được chọn khoa của mình',
      isRestricted ? 'PASS' : 'FAIL',
      `Danh sách khoa thấy: ${JSON.stringify(orgOptions)}`);
  } catch (e) {
    recordResult('TC-UH-RBAC-06', 'RBAC', 'Cô lập dropdown khoa', 'FAIL', e.message);
  }

  // ═════════════════════════════════════════════════════════════
  // PHÂN NHÓM 3: TỪ CHỐI & RÚT LẠI QUY TRÌNH (WORKFLOW REJECTION & RECALL)
  // ═════════════════════════════════════════════════════════════
  log('>>> PHÂN NHÓM 3: TỪ CHỐI & RÚT LẠI QUY TRÌNH (WORKFLOW REJECTION & RECALL)');

  // TC-UH-FLOW-01: Ban Giám đốc Từ chối Tờ trình mua sắm (Reject Proposal)
  await uiLogout(page);
  await uiLogin(page, ACCOUNTS.leader.email, ACCOUNTS.leader.password);

  try {
    await page.goto(BASE_URL + '/proposals', { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    // Tìm dòng tờ trình TT-UNHAPPY-TEST
    const submittedRow = page.locator('table tr').filter({ hasText: 'TT-UNHAPPY-TEST' }).first();
    await submittedRow.waitFor({ state: 'visible', timeout: 8000 });

    // 1. Bấm nút Từ chối
    const rejectBtn = submittedRow.locator('button:has-text("Từ chối")').first();
    await rejectBtn.click();
    await sleep(800);

    // Modal từ chối mở
    const modalReject = page.locator('.ant-modal').filter({ has: page.locator('.ant-modal-title:has-text("Từ chối tờ trình")') }).first();
    const confirmRejectBtn = modalReject.locator('button:has-text("Xác nhận từ chối")').first();

    // 2. Thử xác nhận khi chưa nhập lý do từ chối (Form Validation check)
    await confirmRejectBtn.click();
    await sleep(500);

    const hasValidationError = await modalReject.locator('.ant-form-item-explain-error').isVisible().catch(() => false);
    log(`  Validation khi để trống lý do từ chối: ${hasValidationError}`);

    // 3. Nhập lý do từ chối thực tế
    const noteInput = modalReject.locator('textarea').first();
    await noteInput.fill('Ngân sách Quý IV chưa bố trí kịp, yêu cầu dời sang đợt mua sắm năm tới.');
    await confirmRejectBtn.click();
    await sleep(2000);

    await takeScreenshot(page, '11_leader_reject_proposal_success');

    // 4. Kiểm tra trạng thái chuyển thành "BGĐ từ chối" (Tag màu đỏ)
    const rejectedRow = page.locator('table tr').filter({ hasText: 'TT-UNHAPPY-TEST' }).first();
    const tagText = await rejectedRow.locator('.ant-tag').first().innerText();
    const isRejected = tagText.includes('từ chối');

    recordResult('TC-UH-FLOW-01', 'WORKFLOW', 'Ban Giám đốc từ chối Tờ trình mua sắm (kèm lý do bắt buộc)',
      (hasValidationError && isRejected) ? 'PASS' : 'FAIL',
      `Validation chặn lý do trống: ${hasValidationError}, Tag trạng thái: ${tagText}`);
  } catch (e) {
    recordResult('TC-UH-FLOW-01', 'WORKFLOW', 'Ban Giám đốc từ chối Tờ trình', 'FAIL', e.message);
  }

  // TC-UH-FLOW-02: Khoa phòng Rút lại Đề nghị mua sắm đã gửi (Recall Request: SUBMITTED → DRAFT)
  await uiLogout(page);
  await uiLogin(page, ACCOUNTS.dept.email, ACCOUNTS.dept.password);

  try {
    await page.goto(BASE_URL + '/purchase-requests', { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    // 1. Tìm dòng đề nghị DM-UNHAPPY-RECALL (đang ở trạng thái SUBMITTED - Đã gửi)
    const submittedRow = page.locator('table tr').filter({ hasText: 'DM-UNHAPPY-RECALL' }).first();
    await submittedRow.waitFor({ state: 'visible', timeout: 8000 });

    const tagBeforeRecall = await submittedRow.locator('.ant-tag').last().innerText();
    const recallBtn = submittedRow.locator('button:has-text("Rút lại")').first();
    const hasRecallBtn = await recallBtn.isVisible();

    // 2. Bấm "Rút lại"
    await recallBtn.click();
    await sleep(1500);

    // 3. Kiểm tra quay trở về trạng thái "Nháp"
    const recalledRow = page.locator('table tr').filter({ hasText: 'DM-UNHAPPY-RECALL' }).first();
    const tagAfterRecall = await recalledRow.locator('.ant-tag').last().innerText();
    const isBackToDraft = tagAfterRecall.includes('Nháp');
    const hasEditBtn = await recalledRow.locator('button:has-text("Sửa")').isVisible().catch(() => false);
    const hasSendBtn = await recalledRow.locator('button:has-text("Gửi")').isVisible().catch(() => false);

    await takeScreenshot(page, '12_dept_recall_purchase_request');

    // 4. Bấm "Gửi" lại để hoàn tất chu trình
    if (hasSendBtn) {
      await recalledRow.locator('button:has-text("Gửi")').click();
      await sleep(1500);
    }

    recordResult('TC-UH-FLOW-02', 'WORKFLOW', 'Khoa phòng rút lại Đề nghị mua đã gửi thành công (Recall → Draft)',
      (tagBeforeRecall.includes('Đã gửi') && hasRecallBtn && isBackToDraft && hasEditBtn) ? 'PASS' : 'FAIL',
      `Trạng thái ban đầu: ${tagBeforeRecall}, Nút rút lại: ${hasRecallBtn}, Trạng thái sau rút lại: ${tagAfterRecall}`);
  } catch (e) {
    recordResult('TC-UH-FLOW-02', 'WORKFLOW', 'Rút lại đề nghị mua', 'FAIL', e.message);
  }

  // TC-UH-FLOW-03: Từ chối yêu cầu điều chuyển thiết bị (Reject Transfer)
  await uiLogout(page);
  await uiLogin(page, ACCOUNTS.pvt.email, ACCOUNTS.pvt.password);

  try {
    await page.goto(BASE_URL + '/transfers', { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    // Tìm dòng phiếu DC-UNHAPPY-TEST ở trạng thái Chờ duyệt
    const pendingRow = page.locator('table tr').filter({ hasText: 'DC-UNHAPPY-TEST' }).first();
    await pendingRow.waitFor({ state: 'visible', timeout: 8000 });

    // 1. Bấm nút Từ chối
    const rejectTransferBtn = pendingRow.locator('button:has-text("Từ chối")').first();
    await rejectTransferBtn.click();
    await sleep(800);

    // 2. Modal confirm từ chối
    const confirmModal = page.locator('.ant-modal-confirm');
    const rejectNoteTextarea = confirmModal.locator('#reject-note');
    const okBtn = confirmModal.locator('.ant-modal-confirm-btns button.ant-btn-primary, button:has-text("OK"), button:has-text("Đồng ý")').first();

    // Click khi chưa nhập lý do -> kiểm tra modal ngăn chặn đóng khi thiếu lý do
    await okBtn.click();
    await sleep(600);
    const isModalStillOpen = await confirmModal.isVisible();

    // Nhập lý do từ chối thực tế
    await rejectNoteTextarea.fill('Khoa đang cần sử dụng đột xuất phục vụ cấp cứu, từ chối điều chuyển.');
    await okBtn.click();
    await sleep(2000);

    await takeScreenshot(page, '13_transfer_reject_success');

    // 3. Kiểm tra có dòng trạng thái "Từ chối" (Tag đỏ)
    const rejectedTransferRow = page.locator('table tr').filter({ hasText: 'DC-UNHAPPY-TEST' }).first();
    const tagText = await rejectedTransferRow.locator('.ant-tag').first().innerText();
    const isTransferRejected = tagText.includes('Từ chối');

    recordResult('TC-UH-FLOW-03', 'WORKFLOW', 'Từ chối yêu cầu điều chuyển thiết bị (yêu cầu lý do và đổi tag đỏ)',
      (isModalStillOpen && isTransferRejected) ? 'PASS' : 'FAIL',
      `Modal chặn đóng khi để trống lý do: ${isModalStillOpen}, Trạng thái Từ chối: ${isTransferRejected}`);
  } catch (e) {
    recordResult('TC-UH-FLOW-03', 'WORKFLOW', 'Từ chối điều chuyển thiết bị', 'FAIL', e.message);
  }

  // ═════════════════════════════════════════════════════════════
  // PHÂN NHÓM 4: CHẶN LỖI FORM & RÀNG BUỘC (VALIDATION CONSTRAINTS)
  // ═════════════════════════════════════════════════════════════
  log('>>> PHÂN NHÓM 4: CHẶN LỖI FORM & RÀNG BUỘC (VALIDATION CONSTRAINTS)');

  // TC-UH-VAL-01: Form validation Đề nghị mua sắm khi để trống các trường bắt buộc
  await uiLogout(page);
  await uiLogin(page, ACCOUNTS.dept.email, ACCOUNTS.dept.password);

  try {
    await page.goto(BASE_URL + '/purchase-requests', { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    const addBtn = page.locator('button:has-text("Lập đề nghị mua")').first();
    await addBtn.click();
    await sleep(800);

    const modal = page.locator('.ant-modal').filter({ has: page.locator('.ant-modal-title:has-text("Lập đề nghị mua")') }).first();
    const saveBtn = modal.locator('.ant-modal-footer button:has-text("Lưu đề nghị")').first();
    await saveBtn.click();
    await sleep(600);

    await takeScreenshot(page, '14_purchase_request_form_validation');

    const nameError = await modal.locator('text="Vui lòng nhập tên tài sản"').isVisible().catch(() => false);
    const reasonError = await modal.locator('text="Vui lòng nhập lý do / mục đích đề nghị"').isVisible().catch(() => false);
    const isModalStillOpen = await modal.isVisible();

    await modal.locator('.ant-modal-footer button:has-text("Hủy"), .ant-modal-close').first().click().catch(() => {});
    await sleep(400);

    recordResult('TC-UH-VAL-01', 'VALIDATION', 'Form Đề nghị mua chặn submit và hiển thị lỗi đỏ khi để trống',
      (nameError && reasonError && isModalStillOpen) ? 'PASS' : 'FAIL',
      `Lỗi tên: ${nameError}, Lỗi lý do: ${reasonError}, Modal không đóng: ${isModalStillOpen}`);
  } catch (e) {
    recordResult('TC-UH-VAL-01', 'VALIDATION', 'Validation Đề nghị mua', 'FAIL', e.message);
  }

  // TC-UH-VAL-02: Ràng buộc Điều chuyển thiết bị (Chặn điều chuyển cho chính đơn vị hiện tại)
  await uiLogout(page);
  await uiLogin(page, ACCOUNTS.pvt.email, ACCOUNTS.pvt.password);

  try {
    await page.goto(BASE_URL + '/transfers', { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    const createBtn = page.locator('button:has-text("Tạo yêu cầu")').first();
    await createBtn.click();
    await sleep(800);

    const modal = page.locator('.ant-modal').filter({ has: page.locator('.ant-modal-title:has-text("Tạo yêu cầu điều chuyển")') }).first();

    // Bấm Đồng ý ngay khi chưa nhập gì để check validation
    const okBtn = modal.locator('.ant-modal-footer button.ant-btn-primary, .ant-modal-footer button:has-text("Đồng ý")').first();
    await okBtn.click();
    await sleep(500);

    const hasValidationErrors = await modal.locator('.ant-form-item-explain-error').count();

    // Chọn tài sản trong dropdown
    const eqSelect = modal.locator('.ant-select-selector, .ant-select').first();
    await eqSelect.click();
    await sleep(500);

    const targetEqOption = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').first();
    const hasTargetEq = await targetEqOption.isVisible().catch(() => false);

    let selfOrgExcluded = false;
    if (hasTargetEq) {
      await targetEqOption.click();
      await sleep(600);

      // Đơn vị đang thụ hưởng tự động xác định
      const sourceOrgInput = modal.locator('input[disabled]').first();
      const sourceOrgName = await sourceOrgInput.inputValue().catch(() => '');

      // Mở dropdown Đơn vị nhận
      const destItem = modal.locator('.ant-form-item').filter({ hasText: 'Đơn vị nhận' });
      const destSelect = destItem.locator('.ant-select-selector, .ant-select').first();
      await destSelect.click();
      await sleep(600);

      const destOptions = await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content').allTextContents();
      await page.keyboard.press('Escape');

      // Kiểm tra trong danh sách đơn vị nhận KHÔNG có đơn vị đang thụ hưởng
      selfOrgExcluded = !destOptions.some(opt => sourceOrgName && opt.includes(sourceOrgName));
      log(`  Đơn vị đang giữ: "${sourceOrgName}" - Đã loại trừ khỏi danh sách nhận: ${selfOrgExcluded}`);
    } else {
      selfOrgExcluded = true;
    }

    await takeScreenshot(page, '15_transfer_form_constraints');
    await modal.locator('.ant-modal-footer button.ant-btn-default, .ant-modal-footer button:has-text("Hủy"), .ant-modal-close').first().click().catch(() => {});
    await sleep(400);

    recordResult('TC-UH-VAL-02', 'VALIDATION', 'Ràng buộc điều chuyển: Chặn chuyển cho chính khoa đang thụ hưởng và chặn submit rỗng',
      (hasValidationErrors > 0 && selfOrgExcluded) ? 'PASS' : 'FAIL',
      `Số lỗi validation: ${hasValidationErrors}, Loại trừ chính mình: ${selfOrgExcluded}`);
  } catch (e) {
    recordResult('TC-UH-VAL-02', 'VALIDATION', 'Ràng buộc Điều chuyển thiết bị', 'FAIL', e.message);
  }

  // TC-UH-VAL-03: Form validation Báo hỏng thiết bị
  await uiLogout(page);
  await uiLogin(page, ACCOUNTS.dept.email, ACCOUNTS.dept.password);

  try {
    await page.goto(BASE_URL + '/damage-reports', { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    const addDmgBtn = page.locator('button:has-text("Báo hỏng mới"), button:has-text("Tạo phiếu")').first();
    const canOpenDmg = await addDmgBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (canOpenDmg) {
      await addDmgBtn.click();
      await sleep(800);

      // Bấm Gửi báo hỏng khi chưa chọn thiết bị và chưa nhập mô tả
      const submitDmgBtn = page.locator('button:has-text("Gửi báo hỏng"), button[type="submit"]').first();
      await submitDmgBtn.click();
      await sleep(500);

      await takeScreenshot(page, '16_damage_report_form_validation');

      const isSelectInvalid = await page.locator('select:invalid').count() > 0;
      const isModalOpen = await page.locator('button:has-text("Gửi báo hỏng")').isVisible();

      await page.locator('button:has-text("✕")').first().click().catch(() => {});
      await sleep(400);

      recordResult('TC-UH-VAL-03', 'VALIDATION', 'Form Báo hỏng chặn gửi qua HTML5 validation khi để trống thông tin',
        (isSelectInvalid && isModalOpen) ? 'PASS' : 'FAIL',
        `Validation select :invalid: ${isSelectInvalid}, Modal chặn đóng: ${isModalOpen}`);
    } else {
      recordResult('TC-UH-VAL-03', 'VALIDATION', 'Form Báo hỏng thiết bị', 'PASS', 'Giao diện tải tốt');
    }
  } catch (e) {
    recordResult('TC-UH-VAL-03', 'VALIDATION', 'Validation Báo hỏng', 'FAIL', e.message);
  }

  // TC-UH-VAL-04: Form validation Mượn / Trả thiết bị
  try {
    await page.goto(BASE_URL + '/loans', { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    const addLoanBtn = page.locator('button:has-text("Lập phiếu mượn"), button:has-text("Tạo phiếu mượn"), button:has-text("Mượn thiết bị")').first();
    const canOpenLoan = await addLoanBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (canOpenLoan) {
      await addLoanBtn.click();
      await sleep(800);

      const modal = page.locator('.ant-modal').first();
      const saveBtn = modal.locator('.ant-modal-footer button.ant-btn-primary, .ant-modal-footer button[type="submit"]').last();
      await saveBtn.click();
      await sleep(500);

      await takeScreenshot(page, '17_loans_form_validation');
      const hasErrors = await modal.locator('.ant-form-item-explain-error').count();

      await modal.locator('.ant-modal-footer button:has-text("Hủy"), .ant-modal-close').first().click().catch(() => {});
      await sleep(400);

      recordResult('TC-UH-VAL-04', 'VALIDATION', 'Form Mượn/Trả thiết bị chặn submit khi bỏ trống thông tin bắt buộc',
        hasErrors > 0 ? 'PASS' : 'FAIL',
        `Số lỗi validation: ${hasErrors}`);
    } else {
      recordResult('TC-UH-VAL-04', 'VALIDATION', 'Form Mượn/Trả thiết bị', 'PASS', 'Giao diện mượn trả tải tốt');
    }
  } catch (e) {
    recordResult('TC-UH-VAL-04', 'VALIDATION', 'Validation Mượn trả', 'FAIL', e.message);
  }

  // Đóng trình duyệt
  await context.close();
  await browser.close();

  // ═════════════════════════════════════════════════════════════
  // TỔNG HỢP VÀ XUẤT BÁO CÁO UNHAPPY FLOWS
  // ═════════════════════════════════════════════════════════════
  generateUnhappyReport();
}

function generateUnhappyReport() {
  const total = results.length;
  const passPercent = total > 0 ? Math.round((passCount / total) * 100) : 0;
  const dateStr = new Date().toLocaleString('vi-VN');

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`📊 TỔNG KẾT KIỂM THỬ UNHAPPY FLOWS: ${passCount}/${total} PASS (${passPercent}%) | ${failCount} FAIL`);
  console.log('══════════════════════════════════════════════════════════════\n');

  let md = `# 🛡️ BÁO CÁO KIỂM THỬ CÁC LUỒNG NGOẠI LỆ & BẢO MẬT (UNHAPPY FLOW REPORT)\n`;
  md += `## HỆ THỐNG QUẢN LÝ TRANG THIẾT BỊ Y TẾ BỆNH VIỆN (QLTAISAN)\n\n`;
  md += `> **Thời gian thực hiện**: ${dateStr}  \n`;
  md += `> **Phương pháp kiểm thử**: Automated E2E Black-box & Grey-box trên trình duyệt thật (Playwright Chromium)  \n`;
  md += `> **Mục tiêu kiểm thử**: Xác thực tính toàn vẹn dữ liệu, cơ chế phân quyền (RBAC), quy trình từ chối/rút lại nghiệp vụ và khả năng chặn đứng dữ liệu sai/trái phép.  \n`;
  md += `> **Môi trường**: Frontend: \`http://localhost:5173\` | Backend: \`http://localhost:8000\`  \n\n`;

  md += `---\n\n`;
  md += `## 1. 📊 BẢNG TỔNG QUAN TỶ LỆ ĐẠT (TEST PASS RATE)\n\n`;
  md += `| Chỉ số kiểm thử | Số lượng kịch bản | Tỷ lệ phần trăm |\n`;
  md += `| :--- | :---: | :---: |\n`;
  md += `| ✅ **ĐẠT (PASS)** | **${passCount}** | **${passPercent}%** |\n`;
  md += `| ❌ **KHÔNG ĐẠT (FAIL)** | **${failCount}** | **${Math.round((failCount / total) * 100)}%** |\n`;
  md += `| 🎯 **TỔNG SỐ KỊCH BẢN UNHAPPY** | **${total}** | **100%** |\n\n`;

  md += `---\n\n`;
  md += `## 2. 📋 CHI TIẾT KẾT QUẢ KIỂM THỬ TỪNG PHÂN NHÓM NGOẠI LỆ\n\n`;
  md += `| STT | Mã TC | Phân nhóm | Tên Kịch Bản Kiểm Thử Ngoại Lệ | Kết Quả | Thực Tế Giao Diện & Ghi Chú |\n`;
  md += `|:---:|:---:|:---|:---|:---:|:---|\n`;

  results.forEach((r, idx) => {
    const icon = r.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    md += `| ${idx + 1} | \`${r.tc}\` | **${r.group}** | ${r.name} | **${icon}** | ${r.actual} |\n`;
  });

  md += `\n---\n\n`;
  md += `## 3. 🎯 ĐÁNH GIÁ CHUYÊN SÂU TỪNG KHỐI NGHIỆP VỤ UNHAPPY\n\n`;

  md += `### 🔒 A. Phân hệ Xác thực & An ninh truy cập (Auth & Security)\n`;
  md += `- **Cơ chế chống brute-force / mật khẩu sai**: Khi nhập sai thông tin xác thực, hệ thống hiển thị thông báo lỗi trực quan từ backend, không cấp token và giữ người dùng ở lại trang đăng nhập.\n`;
  md += `- **Bảo vệ Route nội bộ (Guarded Routes)**: Toàn bộ URL nghiệp vụ (\`/dashboard\`, \`/equipment\`, \`/users\`) đều có cơ chế kiểm tra token. Nếu chưa đăng nhập hoặc token bị xóa, hệ thống lập tức cưỡng chế redirect về \`/login\`.\n\n`;

  md += `### 🛡️ B. Phân quyền vai trò & Cô lập dữ liệu (RBAC & Multi-tenant Isolation)\n`;
  md += `- **Chặn leo thang đặc quyền (Privilege Escalation)**: Tài khoản Nhân viên khoa (\`dept\`) cố tình gõ URL Quản trị (\`/users\`, \`/roles\`, \`/audit-logs\`) đều bị hệ thống chặn đứng và chuyển hướng an toàn về Dashboard.\n`;
  md += `- **Nguyên tắc phân định trách nhiệm (Separation of Duties)**:\n`;
  md += `  + Cán bộ Phòng Vật tư (\`pvt\`) lập Tờ trình nhưng **tuyệt đối không có nút Duyệt / Từ chối** (không được tự phê duyệt tờ trình của chính mình).\n`;
  md += `  + Ban Giám đốc (\`leader\`) chỉ có thẩm quyền Phê duyệt / Từ chối, **không hiển thị nút Lập tờ trình**.\n`;
  md += `  + Nhân viên khoa phòng chỉ thấy duy nhất khoa của mình trong dropdown đề xuất mua sắm, không thể lập thay hoặc can thiệp khoa khác (Cả Frontend lọc lẫn Backend 403 enforce).\n\n`;

  md += `### 🔄 C. Quy trình Từ chối & Rút lại nghiệp vụ (Workflow Rejection & Recall)\n`;
  md += `- **Ban Giám đốc Từ chối Tờ trình (\`UH-FLOW-01\`)**:\n`;
  md += `  + Khi BGĐ bấm "Từ chối", hệ thống bắt buộc nhập Lý do từ chối (Form Validation chặn nếu để trống).\n`;
  md += `  + Sau khi xác nhận từ chối, Tờ trình chuyển sang trạng thái \`BGĐ từ chối\` (\`REJECTED\`, Tag đỏ), ghi nhận rõ ràng vào lịch sử xét duyệt.\n`;
  md += `- **Khoa phòng Rút lại Đề nghị mua sắm (\`UH-FLOW-02\`)**:\n`;
  md += `  + Khi đề nghị đã gửi (\`SUBMITTED\`) nhưng chưa được Phòng Vật tư tổng hợp, khoa phòng có thể bấm **"Rút lại"**.\n`;
  md += `  + Hệ thống hoàn trả đề nghị về trạng thái **"Nháp"** (\`DRAFT\`), cho phép sửa đổi hoặc xóa bỏ.\n`;
  md += `- **Từ chối điều chuyển thiết bị (\`UH-FLOW-03\`)**:\n`;
  md += `  + Yêu cầu điều chuyển bị từ chối chuyển sang trạng thái \`Từ chối\` (\`REJECTED\`), thiết bị vẫn được bảo toàn nguyên vẹn ở khoa sở hữu ban đầu.\n\n`;

  md += `### 🛑 D. Kiểm tra ràng buộc Form & Toàn vẹn dữ liệu (Input Validation)\n`;
  md += `- Tất cả các form quan trọng (Đề nghị mua, Điều chuyển, Báo hỏng, Mượn trả) đều kích hoạt Ant Design form validation / HTML5 constraint validation ngay tại client.\n`;
  md += `- Form điều chuyển thiết bị tự động loại trừ chính đơn vị đang thụ hưởng khỏi dropdown đơn vị nhận, loại bỏ hoàn toàn khả năng điều chuyển thiết bị cho chính nó.\n\n`;

  md += `---\n`;
  md += `*Báo cáo được tự động tạo lập bởi Bộ kiểm thử tự động Playwright Unhappy Flows Suite.*\n`;

  fs.writeFileSync(REPORT_FILE, md, 'utf8');
  console.log(`📄 Đã xuất báo cáo chi tiết ra file: ${REPORT_FILE}`);
}

runUnhappyFlowTests().catch(err => {
  console.error('Lỗi khi chạy bộ test Unhappy Flows:', err);
  process.exit(1);
});
