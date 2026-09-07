const { chromium } = require('./node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Logging in...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'domcontentloaded' });

  await page.locator('#login-email').fill('dept@hospital.local');
  await page.locator('#login-password').fill('Dept@12345');
  await page.locator('#login-submit').click();
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 8000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));

  console.log('2. Navigating to purchase-requests...');
  await page.goto('http://localhost:5173/purchase-requests', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  console.log('3. Clicking Lap de nghi mua...');
  await page.click('button:has-text("Lập đề nghị mua")');
  await page.waitForSelector('.ant-modal-content', { timeout: 5000 });

  console.log('4. Clicking category dropdown...');
  const catSelect = page.locator('.ant-modal-content .ant-select-selector').nth(1);
  await catSelect.click();
  await new Promise(r => setTimeout(r, 600));

  const options = await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content').allTextContents();
  console.log('SUCCESS! Equipment groups from Admin:', options);

  await page.screenshot({ path: 'admin_groups_in_pr.png' });
  console.log('Screenshot saved to admin_groups_in_pr.png');

  await browser.close();
})();
