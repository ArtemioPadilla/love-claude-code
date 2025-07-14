import { Page } from 'puppeteer'

export async function inspectElement(page: Page, selector: string) {
  try {
    const elementInfo = await page.evaluate((sel) => {
      const element = document.querySelector(sel)
      if (!element) {
        return { error: 'Element not found' }
      }
      
      const rect = element.getBoundingClientRect()
      const computedStyle = window.getComputedStyle(element)
      
      return {
        tagName: element.tagName.toLowerCase(),
        id: element.id || null,
        className: element.className || null,
        textContent: element.textContent?.trim().substring(0, 100) || null,
        attributes: Array.from(element.attributes).reduce((acc, attr) => ({
          ...acc,
          [attr.name]: attr.value
        }), {}),
        position: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          bottom: rect.bottom,
          right: rect.right
        },
        styles: {
          display: computedStyle.display,
          position: computedStyle.position,
          color: computedStyle.color,
          backgroundColor: computedStyle.backgroundColor,
          fontSize: computedStyle.fontSize,
          fontWeight: computedStyle.fontWeight,
          margin: computedStyle.margin,
          padding: computedStyle.padding,
          border: computedStyle.border,
          zIndex: computedStyle.zIndex
        },
        isVisible: rect.width > 0 && rect.height > 0 && computedStyle.display !== 'none',
        children: element.children.length
      }
    }, selector)
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(elementInfo, null, 2)
      }]
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error inspecting element: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    }
  }
}

export async function getElementInfo(page: Page, selector: string) {
  return inspectElement(page, selector)
}