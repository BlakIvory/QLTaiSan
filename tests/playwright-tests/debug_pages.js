const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/login');
  await page.locator('#login-email').fill('admin@hospital.local');
  await page.locator('#login-password').fill('Admin@12345');
  await page.locator('button[type="submit"]').click();
  await new Promise(r => setTimeout(r, 2000));
  
  await page.goto('http://localhost:5173/allocations');
  await new Promise(r => setTimeout(r, 3000));
  console.log('MAIN INNER HTML:\n', await page.locator('main').innerHTML());

  await browser.close();
})();
