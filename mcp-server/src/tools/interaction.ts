import { Page } from 'puppeteer'

export async function clickElement(page: Page, selector: string) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 })
    await page.click(selector)
    
    // Wait a bit for any animations or state changes
    await page.waitForTimeout(500)
    
    return {
      content: [{
        type: 'text',
        text: `Successfully clicked element: ${selector}`
      }]
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error clicking element: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    }
  }
}

export async function typeInElement(page: Page, selector: string, text: string) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 })
    
    // Clear existing content
    await page.click(selector, { clickCount: 3 })
    await page.keyboard.press('Backspace')
    
    // Type new text
    await page.type(selector, text, { delay: 50 })
    
    return {
      content: [{
        type: 'text',
        text: `Successfully typed "${text}" into element: ${selector}`
      }]
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error typing in element: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    }
  }
}

export async function navigateTo(page: Page, url: string) {
  try {
    // Handle relative URLs
    if (!url.startsWith('http')) {
      const currentUrl = page.url()
      const baseUrl = new URL(currentUrl).origin
      url = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
    }
    
    await page.goto(url, { waitUntil: 'networkidle2' })
    
    return {
      content: [{
        type: 'text',
        text: `Successfully navigated to: ${url}`
      }]
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error navigating: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    }
  }
}