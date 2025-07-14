import { Page } from 'puppeteer'

export async function checkElementVisible(page: Page, selector: string) {
  try {
    const isVisible = await page.evaluate((sel) => {
      const element = document.querySelector(sel)
      if (!element) {
        return { exists: false, visible: false }
      }
      
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      
      const isVisible = !!(
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      )
      
      const isInViewport = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
      )
      
      return {
        exists: true,
        visible: isVisible,
        inViewport: isInViewport,
        dimensions: {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left
        },
        styles: {
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity
        }
      }
    }, selector)
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(isVisible, null, 2)
      }]
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error checking element visibility: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    }
  }
}

export async function validateLayout(page: Page) {
  try {
    const layoutIssues = await page.evaluate(() => {
      const issues: any[] = []
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Check for horizontal overflow
      if (document.documentElement.scrollWidth > viewportWidth) {
        issues.push({
          type: 'horizontal-overflow',
          issue: 'Page has horizontal scroll',
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth
        })
      }
      
      // Check for overlapping elements
      const elements = document.querySelectorAll('div, button, a, input, textarea')
      const rects: { element: string, rect: DOMRect }[] = []
      
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          rects.push({
            element: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''),
            rect
          })
        }
      })
      
      // Simple overlap detection (check if elements at same level overlap)
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const r1 = rects[i].rect
          const r2 = rects[j].rect
          
          const overlap = !(
            r1.right < r2.left ||
            r2.right < r1.left ||
            r1.bottom < r2.top ||
            r2.bottom < r1.top
          )
          
          if (overlap) {
            issues.push({
              type: 'element-overlap',
              issue: 'Elements are overlapping',
              elements: [rects[i].element, rects[j].element]
            })
          }
        }
      }
      
      // Check for elements outside viewport
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect()
        if (rect.right > viewportWidth || rect.left < 0) {
          issues.push({
            type: 'element-outside-viewport',
            issue: 'Element extends outside viewport',
            element: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''),
            position: { left: rect.left, right: rect.right, viewportWidth }
          })
        }
      })
      
      return {
        viewportDimensions: { width: viewportWidth, height: viewportHeight },
        documentDimensions: {
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight
        },
        issues
      }
    })
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(layoutIssues, null, 2)
      }]
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error validating layout: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    }
  }
}