import { Page } from 'puppeteer'

export async function getComputedStyles(page: Page, selector: string, properties?: string[]) {
  try {
    const styles = await page.evaluate((sel, props) => {
      const element = document.querySelector(sel)
      if (!element) {
        return { error: 'Element not found' }
      }
      
      const computedStyle = window.getComputedStyle(element)
      
      if (props && props.length > 0) {
        // Return only requested properties
        return props.reduce((acc, prop) => ({
          ...acc,
          [prop]: computedStyle.getPropertyValue(prop)
        }), {})
      }
      
      // Return all computed styles (warning: this is a lot!)
      const allStyles: Record<string, string> = {}
      for (let i = 0; i < computedStyle.length; i++) {
        const prop = computedStyle[i]
        allStyles[prop] = computedStyle.getPropertyValue(prop)
      }
      
      return allStyles
    }, selector, properties)
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(styles, null, 2)
      }]
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error getting computed styles: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    }
  }
}

export async function validateStyling(page: Page) {
  try {
    const issues = await page.evaluate(() => {
      const problems: any[] = []
      
      // Check for elements with zero dimensions
      const allElements = document.querySelectorAll('*')
      allElements.forEach((element) => {
        const rect = element.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        
        // Check for invisible elements that should be visible
        if (rect.width === 0 && rect.height === 0 && style.display !== 'none' && element.children.length > 0) {
          problems.push({
            type: 'zero-dimensions',
            selector: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : ''),
            issue: 'Element has zero dimensions but contains children'
          })
        }
        
        // Check for overflow issues
        if (style.overflow === 'visible' && (element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight)) {
          problems.push({
            type: 'overflow',
            selector: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : ''),
            issue: 'Element content overflows its container'
          })
        }
        
        // Check for text contrast issues (simplified)
        if (element.textContent && element.textContent.trim()) {
          const bgColor = style.backgroundColor
          const textColor = style.color
          if (bgColor === textColor && bgColor !== 'rgba(0, 0, 0, 0)') {
            problems.push({
              type: 'contrast',
              selector: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : ''),
              issue: 'Text and background have same color'
            })
          }
        }
      })
      
      return problems
    })
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ stylingIssues: issues }, null, 2)
      }]
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error validating styling: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    }
  }
}