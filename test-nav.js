import puppeteer from 'puppeteer';

(async () => {
  console.log('Starting puppeteer...');
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Log all console messages from the page
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('PAGE RESPONSE ERROR:', response.status(), response.url());
    }
  });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  console.log('Initial URL:', page.url());
  
  // Wait for the login button to appear
  console.log('Looking for login button...');
  const button = await page.$('button::-p-text(Se connecter)');
  
  if (button) {
    console.log('Button found. Clicking...');
    await button.click();
    
    // Wait a bit for navigation
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('New URL:', page.url());
    
    // Check if the page content changed to login form
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('SUCCESS: Login form found on the new page.');
    } else {
      console.log('FAILED: Login form NOT found after clicking! The page did not update.');
      // print the current HTML body
      const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 500) + '...');
      console.log('Current body HTML:', bodyHTML);
    }
  } else {
    console.log('Could not find the "Se connecter" button');
  }

  await browser.close();
})();
