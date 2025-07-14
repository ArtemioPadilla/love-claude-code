import { Page } from 'puppeteer'
import sharp from 'sharp'

export async function captureScreenshot(page: Page, fullPage: boolean = false) {
  try {
    const screenshotBuffer = await page.screenshot({
      fullPage,
      type: 'png'
    })
    
    // Get screenshot metadata
    const metadata = await sharp(screenshotBuffer).metadata()
    
    // Convert to base64 for transport
    const base64 = screenshotBuffer.toString('base64')
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          type: 'screenshot',
          fullPage,
          dimensions: {
            width: metadata.width,
            height: metadata.height
          },
          size: screenshotBuffer.length,
          base64: `data:image/png;base64,${base64}`
        }, null, 2)
      }]
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error capturing screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    }
  }
}