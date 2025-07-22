import { isElectron, getElectronAPI } from './electronDetection'

/**
 * Show a success notification
 */
export async function showSuccessNotification(title: string, body: string, data?: any) {
  if (!isElectron()) {
    console.log(`Success: ${title} - ${body}`)
    return
  }
  
  try {
    const electronAPI = getElectronAPI()
    await electronAPI.notification.showSuccess(title, body, data)
  } catch (error) {
    console.error('Failed to show notification:', error)
  }
}

/**
 * Show an error notification
 */
export async function showErrorNotification(title: string, body: string, data?: any) {
  if (!isElectron()) {
    console.error(`Error: ${title} - ${body}`)
    return
  }
  
  try {
    const electronAPI = getElectronAPI()
    await electronAPI.notification.showError(title, body, data)
  } catch (error) {
    console.error('Failed to show notification:', error)
  }
}

/**
 * Show an info notification
 */
export async function showInfoNotification(title: string, body: string, data?: any) {
  if (!isElectron()) {
    console.info(`Info: ${title} - ${body}`)
    return
  }
  
  try {
    const electronAPI = getElectronAPI()
    await electronAPI.notification.showInfo(title, body, data)
  } catch (error) {
    console.error('Failed to show notification:', error)
  }
}

/**
 * Show a custom notification
 */
export async function showNotification(options: {
  title: string
  body: string
  type?: 'success' | 'error' | 'warning' | 'info' | 'git' | 'build' | 'update'
  sound?: boolean
  actions?: Array<{ text: string }>
  data?: any
}) {
  if (!isElectron()) {
    console.log(`Notification: ${options.title} - ${options.body}`)
    return
  }
  
  try {
    const electronAPI = getElectronAPI()
    await electronAPI.notification.show(options)
  } catch (error) {
    console.error('Failed to show notification:', error)
  }
}

/**
 * Update tray status indicator
 */
export async function updateTrayStatus(status: 'normal' | 'syncing' | 'error' | 'offline') {
  if (!isElectron()) return
  
  try {
    const electronAPI = getElectronAPI()
    await electronAPI.tray.updateStatus(status)
  } catch (error) {
    console.error('Failed to update tray status:', error)
  }
}

/**
 * Set tray badge count (macOS only)
 */
export async function setTrayBadge(count: number) {
  if (!isElectron()) return
  
  try {
    const electronAPI = getElectronAPI()
    await electronAPI.tray.setBadge(count)
  } catch (error) {
    console.error('Failed to set tray badge:', error)
  }
}