// Analytics service wrapper supporting multiple providers

interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
}

interface AnalyticsUser {
  id?: string
  email?: string
  name?: string
  properties?: Record<string, any>
}

class AnalyticsService {
  private initialized = false
  private provider: 'google' | 'plausible' | 'umami' | 'none' = 'none'
  
  // Initialize analytics based on environment and configuration
  init(config?: {
    provider?: 'google' | 'plausible' | 'umami' | 'none'
    googleAnalyticsId?: string
    plausibleDomain?: string
    umamiWebsiteId?: string
    umamiUrl?: string
  }) {
    // Don't track in development unless explicitly enabled
    if (import.meta.env.DEV && !import.meta.env.VITE_ENABLE_ANALYTICS) {
      console.log('Analytics disabled in development')
      return
    }
    
    const provider = config?.provider || import.meta.env.VITE_ANALYTICS_PROVIDER || 'none'
    this.provider = provider
    
    switch (provider) {
      case 'google':
        this.initGoogleAnalytics(config?.googleAnalyticsId || import.meta.env.VITE_GA_MEASUREMENT_ID)
        break
      case 'plausible':
        this.initPlausible(config?.plausibleDomain || import.meta.env.VITE_PLAUSIBLE_DOMAIN)
        break
      case 'umami':
        this.initUmami(
          config?.umamiWebsiteId || import.meta.env.VITE_UMAMI_WEBSITE_ID,
          config?.umamiUrl || import.meta.env.VITE_UMAMI_URL
        )
        break
      default:
        console.log('Analytics provider not configured')
    }
  }
  
  // Google Analytics 4
  private initGoogleAnalytics(measurementId?: string) {
    if (!measurementId) {
      console.warn('Google Analytics measurement ID not provided')
      return
    }
    
    // Add gtag script
    const script1 = document.createElement('script')
    script1.async = true
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    document.head.appendChild(script1)
    
    // Initialize gtag
    const script2 = document.createElement('script')
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', {
        page_path: window.location.pathname,
        anonymize_ip: true
      });
    `
    document.head.appendChild(script2)
    
    this.initialized = true
    console.log('Google Analytics initialized')
  }
  
  // Plausible Analytics (privacy-friendly)
  private initPlausible(domain?: string) {
    if (!domain) {
      console.warn('Plausible domain not provided')
      return
    }
    
    const script = document.createElement('script')
    script.defer = true
    script.dataset.domain = domain
    script.src = 'https://plausible.io/js/script.js'
    document.head.appendChild(script)
    
    this.initialized = true
    console.log('Plausible Analytics initialized')
  }
  
  // Umami Analytics (self-hosted, privacy-friendly)
  private initUmami(websiteId?: string, scriptUrl?: string) {
    if (!websiteId || !scriptUrl) {
      console.warn('Umami configuration incomplete')
      return
    }
    
    const script = document.createElement('script')
    script.async = true
    script.defer = true
    script.dataset.websiteId = websiteId
    script.src = scriptUrl
    document.head.appendChild(script)
    
    this.initialized = true
    console.log('Umami Analytics initialized')
  }
  
  // Track page views
  trackPageView(path?: string) {
    if (!this.initialized) return
    
    const url = path || window.location.pathname
    
    switch (this.provider) {
      case 'google':
        if ((window as any).gtag) {
          (window as any).gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
            page_path: url
          })
        }
        break
      case 'plausible':
        if ((window as any).plausible) {
          (window as any).plausible('pageview')
        }
        break
      case 'umami':
        if ((window as any).umami) {
          (window as any).umami.track('pageview')
        }
        break
    }
  }
  
  // Track custom events
  trackEvent(event: AnalyticsEvent) {
    if (!this.initialized) return
    
    switch (this.provider) {
      case 'google':
        if ((window as any).gtag) {
          (window as any).gtag('event', event.name, event.properties)
        }
        break
      case 'plausible':
        if ((window as any).plausible) {
          (window as any).plausible(event.name, { props: event.properties })
        }
        break
      case 'umami':
        if ((window as any).umami) {
          (window as any).umami.track(event.name, event.properties)
        }
        break
    }
  }
  
  // Identify user (for logged-in users)
  identify(user: AnalyticsUser) {
    if (!this.initialized) return
    
    switch (this.provider) {
      case 'google':
        if ((window as any).gtag && user.id) {
          (window as any).gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
            user_id: user.id,
            user_properties: user.properties
          })
        }
        break
      // Plausible and Umami don't track individual users for privacy
    }
  }
  
  // Track errors
  trackError(error: Error, properties?: Record<string, any>) {
    this.trackEvent({
      name: 'error',
      properties: {
        error_message: error.message,
        error_stack: error.stack,
        ...properties
      }
    })
  }
  
  // Track timing (performance)
  trackTiming(category: string, variable: string, value: number) {
    this.trackEvent({
      name: 'timing_complete',
      properties: {
        name: variable,
        value: Math.round(value),
        event_category: category
      }
    })
  }
}

// Export singleton instance
export const analytics = new AnalyticsService()

// Helper hooks for React components
export function useAnalytics() {
  return {
    trackEvent: (event: AnalyticsEvent) => analytics.trackEvent(event),
    trackPageView: (path?: string) => analytics.trackPageView(path),
    trackError: (error: Error, properties?: Record<string, any>) => analytics.trackError(error, properties),
    trackTiming: (category: string, variable: string, value: number) => analytics.trackTiming(category, variable, value)
  }
}