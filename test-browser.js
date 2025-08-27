// Simple test to check if the page loads without errors
const puppeteer = require('puppeteer');

(async () => {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Collect console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // Collect page errors
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message || error.toString());
    });
    
    // Navigate to the page
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait a bit for any async errors
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for errors
    const criticalErrors = consoleMessages.filter(msg => 
      msg.type === 'error' && 
      !msg.text.includes('401') && // Ignore auth errors
      !msg.text.includes('Failed to load resource') && // Ignore resource errors
      !msg.text.includes('favicon.ico') // Ignore favicon errors
    );
    
    // Report results
    console.log('\n=== Page Load Test Results ===');
    console.log(`Page loaded successfully: ${pageErrors.length === 0 ? '✅ YES' : '❌ NO'}`);
    console.log(`JavaScript errors: ${criticalErrors.length === 0 ? '✅ None' : `❌ ${criticalErrors.length} found`}`);
    
    if (criticalErrors.length > 0) {
      console.log('\n❌ Errors found:');
      criticalErrors.forEach(err => console.log(`  - ${err.text}`));
    }
    
    if (pageErrors.length > 0) {
      console.log('\n❌ Page errors:');
      pageErrors.forEach(err => console.log(`  - ${err}`));
    }
    
    // Check if main content is visible
    const title = await page.title();
    console.log(`\nPage title: "${title}"`);
    
    // Check for specific elements
    const hasContent = await page.evaluate(() => {
      return document.body && document.body.textContent.includes('Love Claude Code');
    });
    console.log(`Main content visible: ${hasContent ? '✅ YES' : '❌ NO'}`);
    
    // Check if the app container exists
    const hasAppContainer = await page.evaluate(() => {
      return document.getElementById('root') !== null;
    });
    console.log(`React app mounted: ${hasAppContainer ? '✅ YES' : '❌ NO'}`);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'page-test-screenshot.png' });
    console.log('\n📸 Screenshot saved as page-test-screenshot.png');
    
    // Overall status
    const allGood = pageErrors.length === 0 && criticalErrors.length === 0 && hasContent;
    console.log(`\n=== Overall Status: ${allGood ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'} ===`);
    
    process.exit(allGood ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();