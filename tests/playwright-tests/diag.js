const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('http://localhost:5173/login');
  await p.locator('#login-email').fill('pvt@hospital.local');
  await p.locator('#login-password').fill('Pvt@12345');
  await p.locator('#login-submit').click();
  await p.waitForURL(u => !u.toString().includes('/login'));

  await p.goto('http://localhost:5173/transfers');
  await p.waitForTimeout(1000);

  const createBtn = p.locator('button:has-text("Tạo yêu cầu")');
  console.log('Tạo yêu cầu btn count:', await createBtn.count());
  await createBtn.click();
  await p.waitForTimeout(800);

  const modal = p.locator('.ant-modal');
  console.log('Modal visible:', await modal.isVisible());
  const footerBtns = await p.locator('.ant-modal-footer button').allTextContents();
  console.log('Footer buttons in transfer modal:', footerBtns);

  await b.close();
})();
