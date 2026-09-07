const { chromium } = require('./node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('=== KIỂM TRA 1: TÀI KHOẢN PHÒNG VẬT TƯ (pvt@hospital.local) ===');
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#login-email').fill('pvt@hospital.local');
  await page.locator('#login-password').fill('Pvt@12345');
  await page.locator('#login-submit').click();
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 8000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));

  await page.goto('http://localhost:5173/proposals', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  // Kiểm tra nút Duyệt và Từ chối
  const pvtApproveBtn = await page.locator('button:has-text("Duyệt")').count();
  const pvtRejectBtn = await page.locator('button:has-text("Từ chối")').count();
  console.log('pvt thấy nút Duyệt:', pvtApproveBtn);
  console.log('pvt thấy nút Từ chối:', pvtRejectBtn);
  if (pvtApproveBtn === 0 && pvtRejectBtn === 0) {
    console.log('✓ CHÍNH XÁC: Tài khoản Phòng Vật tư KHÔNG CÒN nút Duyệt / Từ chối!');
  } else {
    console.error('✗ LỖI: Phòng Vật tư vẫn thấy nút duyệt!');
  }

  console.log('=== KIỂM TRA 2: TÀI KHOẢN BAN GIÁM ĐỐC (leader@hospital.local) ===');
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#login-email').fill('leader@hospital.local');
  await page.locator('#login-password').fill('Leader@12345');
  await page.locator('#login-submit').click();
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 8000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));

  await page.goto('http://localhost:5173/proposals', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  // Tài khoản leader xem có tờ trình nào ở SUBMITTED không
  const hasSubmitted = await page.locator('table tr').filter({ hasText: 'Đã trình BGĐ' }).count();
  console.log('Số tờ trình đang chờ BGĐ duyệt:', hasSubmitted);

  const leaderApproveBtn = await page.locator('button:has-text("Duyệt")').count();
  const leaderRejectBtn = await page.locator('button:has-text("Từ chối")').count();
  console.log('leader thấy nút Duyệt:', leaderApproveBtn);
  console.log('leader thấy nút Từ chối:', leaderRejectBtn);

  if (hasSubmitted > 0 && leaderApproveBtn > 0) {
    console.log('✓ CHÍNH XÁC: Ban Giám đốc thấy nút Duyệt / Từ chối cho tờ trình đang chờ duyệt!');
  }

  // Leader không thấy nút Lập tờ trình
  const leaderCreateBtn = await page.locator('button:has-text("Lập tờ trình")').count();
  console.log('leader thấy nút Lập tờ trình:', leaderCreateBtn);
  if (leaderCreateBtn === 0) {
    console.log('✓ CHÍNH XÁC: Ban Giám đốc không lập tờ trình (Phòng Vật tư mới lập)!');
  }

  await browser.close();
  console.log('🎉 KIỂM TRA PHÂN QUYỀN TỜ TRÌNH HOÀN TẤT!');
})();
