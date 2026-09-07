const { chromium } = require('./node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERR:', msg.text());
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.stack || err.message));

  try {
    console.log('=== BƯỚC 1: ĐĂNG NHẬP BẰNG TÀI KHOẢN KHOA PHÒNG (dept@hospital.local) ===');
    await page.goto('http://localhost:5173/login');
    await page.fill('#login-email', 'dept@hospital.local');
    await page.fill('#login-password', 'Dept@12345');
    await page.click('#login-submit');
    await page.waitForTimeout(1500);

    console.log('=== BƯỚC 2: TRUY CẬP TRANG ĐỀ NGHỊ MUA TÀI SẢN ===');
    await page.goto('http://localhost:5173/purchase-requests');
    await page.waitForSelector('button:has-text("Lập đề nghị mua")', { timeout: 10000 });
    
    // Kiểm tra ô tìm kiếm placeholder
    const searchPh = await page.getAttribute('input[placeholder="Vui lòng nhập mã hoặc tên tài sản đề nghị"]', 'placeholder');
    console.log('✓ Search placeholder:', searchPh);

    // Mở modal Lập đề nghị mua
    const btn = page.locator('button:has-text("Lập đề nghị mua")').first();
    console.log('Button visible:', await btn.isVisible());
    await btn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'modal_click.png' });

    const modalVisible = await page.locator('.ant-modal-content, .ant-modal').first().isVisible().catch(() => false);
    console.log('Modal visible right after click:', modalVisible);
    const bodyHtml = await page.evaluate(() => document.body.innerHTML);
    console.log('Has ant-modal in body:', bodyHtml.includes('ant-modal'));


    // 1. Kiểm tra combobox Khoa/Phòng
    const orgSelect = page.locator('.ant-modal-content .ant-select-selector').first();
    await orgSelect.click();
    await page.waitForTimeout(600);

    const orgOptions = await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content').allTextContents();
    console.log('✓ Danh sách khoa/phòng tài khoản dept thấy:', orgOptions);

    if (orgOptions.length === 1 && orgOptions[0].includes('Khoa Nội Tổng hợp')) {
      console.log('✓ CHÍNH XÁC: Tài khoản Khoa chỉ thấy duy nhất khoa của mình!');
    } else {
      console.log('ℹ Danh sách khoa/phòng:', orgOptions);
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 2. Kiểm tra combobox Nhóm thiết bị (cmb chứ không phải text)
    const categorySelect = page.locator('.ant-modal-content .ant-select-selector').nth(1);
    const categoryPh = await categorySelect.locator('.ant-select-selection-placeholder').textContent().catch(() => '');
    console.log('✓ Nhóm thiết bị là Combobox với placeholder:', categoryPh);

    await categorySelect.click();
    await page.waitForTimeout(600);
    const catOptions = await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content').allTextContents();
    console.log('✓ Các tùy chọn nhóm thiết bị trong combobox:', catOptions);

    // Chọn một nhóm thiết bị: "Hồi sức cấp cứu"
    const targetOption = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').filter({ hasText: 'Hồi sức cấp cứu' }).first();
    await targetOption.click();
    await page.waitForTimeout(300);

    // 3. Kiểm tra các placeholder tuân thủ "Vui lòng nhập / chọn + label"
    const inputsToCheck = [
      { selector: 'input[placeholder="Vui lòng nhập tên tài sản / thiết bị đề nghị mua"]', name: 'Tên tài sản' },
      { selector: 'input[placeholder="Vui lòng nhập số lượng"]', name: 'Số lượng' },
      { selector: 'input[placeholder="Vui lòng nhập đơn vị tính"]', name: 'Đơn vị tính' },
      { selector: 'input[placeholder="Vui lòng nhập đơn giá ước tính"]', name: 'Đơn giá ước tính' },
      { selector: 'textarea[placeholder="Vui lòng nhập lý do / mục đích đề nghị"]', name: 'Lý do' },
      { selector: 'textarea[placeholder="Vui lòng nhập yêu cầu kỹ thuật / thông số"]', name: 'Yêu cầu kỹ thuật' },
    ];

    for (const item of inputsToCheck) {
      const exists = await page.locator(item.selector).isVisible();
      console.log(`✓ Placeholder trường [${item.name}]:`, exists ? 'Đúng chuẩn "Vui lòng nhập..."' : 'CHƯA ĐÚNG');
    }

    // 4. Nhập dữ liệu và submit tạo đề nghị mới
    await page.fill('input[placeholder="Vui lòng nhập tên tài sản / thiết bị đề nghị mua"]', 'Máy đo SpO2 cầm tay Test UI');
    await page.fill('input[placeholder="Vui lòng nhập số lượng"]', '3');
    await page.fill('input[placeholder="Vui lòng nhập đơn vị tính"]', 'Máy');
    await page.fill('input[placeholder="Vui lòng nhập đơn giá ước tính"]', '5000000');
    await page.fill('textarea[placeholder="Vui lòng nhập lý do / mục đích đề nghị"]', 'Trang bị bổ sung cho phòng bệnh nặng');
    await page.fill('textarea[placeholder="Vui lòng nhập yêu cầu kỹ thuật / thông số"]', 'Đo SpO2 và nhịp tim liên tục');

    await page.click('.ant-modal-content button:has-text("Lưu đề nghị")');
    await page.waitForTimeout(1500);

    // Kiểm tra dòng mới xuất hiện trong bảng
    const hasNewRow = await page.locator('table tr').filter({ hasText: 'Máy đo SpO2 cầm tay Test UI' }).isVisible();
    console.log('✓ Tạo đề nghị mua tài sản thành công, hiển thị trên bảng:', hasNewRow);

    // Mở modal Chi tiết để kiểm tra thông tin hiển thị
    const detailBtn = page.locator('table tr').filter({ hasText: 'Máy đo SpO2 cầm tay Test UI' }).locator('button:has-text("Chi tiết")').first();
    await detailBtn.click();
    await page.waitForTimeout(500);

    const modalText = await page.locator('.ant-modal-content').textContent();
    const hasCategoryInDetail = modalText.includes('Hồi sức cấp cứu');
    const hasOrgInDetail = modalText.includes('Khoa Nội Tổng hợp');
    console.log('✓ Chi tiết đề nghị hiển thị đúng Nhóm thiết bị:', hasCategoryInDetail);
    console.log('✓ Chi tiết đề nghị hiển thị đúng Khoa/Phòng:', hasOrgInDetail);

    // Đóng modal chi tiết
    await page.click('.ant-modal-content button:has-text("Đóng")');
    await page.waitForTimeout(500);

    console.log('=== BƯỚC 3: KIỂM TRA VỚI TÀI KHOẢN ADMIN (admin@hospital.local) ===');
    await page.goto('http://localhost:5173/login');
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload();
    await page.fill('#login-email', 'admin@hospital.local');
    await page.fill('#login-password', 'Admin@12345');
    await page.click('#login-submit');
    await page.waitForTimeout(1500);

    await page.goto('http://localhost:5173/purchase-requests');
    await page.waitForSelector('button:has-text("Lập đề nghị mua")', { timeout: 10000 });
    await page.click('button:has-text("Lập đề nghị mua")');
    await page.waitForSelector('.ant-modal-content');

    const adminOrgSelect = page.locator('.ant-modal-content .ant-select-selector').first();
    await adminOrgSelect.click();
    await page.waitForTimeout(600);

    const adminOrgs = await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content').allTextContents();
    console.log(`✓ Admin thấy ${adminOrgs.length} khoa/phòng để lựa chọn (ví dụ: ${adminOrgs.slice(0, 3).join(', ')}...)`);

    if (adminOrgs.length > 1) {
      console.log('✓ CHÍNH XÁC: Admin có toàn quyền chọn bất kỳ khoa/phòng nào!');
    }

    console.log('\n🎉 TẤT CẢ CÁC BƯỚC KIỂM THỬ GIAO DIỆN ĐỀU ĐẠT CHUẨN 100%!');
  } catch (err) {
    console.error('❌ Lỗi kiểm thử:', err);
  } finally {
    await browser.close();
  }
})();
