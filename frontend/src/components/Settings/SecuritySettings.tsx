import { useState } from 'react'
import clsx from 'clsx'

export function SecuritySettings() {
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleChangePassword = async () => {
    // TODO: Implement password change
    console.log('Change password')
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-medium">Security Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account security and authentication
          </p>
        </div>

        {/* Password Section */}
        <div className="space-y-4 border-b border-border pb-6">
          <div>
            <h3 className="text-sm font-medium mb-4">Password</h3>
            {!showChangePassword ? (
              <button
                onClick={() => setShowChangePassword(true)}
                className="btn-secondary h-9 px-4 text-sm"
              >
                Change Password
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium mb-2">
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input max-w-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium mb-2">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input max-w-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium mb-2">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input max-w-md"
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                    className={clsx(
                      'btn-primary h-9 px-4 text-sm',
                      (!currentPassword || !newPassword || newPassword !== confirmPassword) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Update Password
                  </button>
                  <button
                    onClick={() => {
                      setShowChangePassword(false)
                      setCurrentPassword('')
                      setNewPassword('')
                      setConfirmPassword('')
                    }}
                    className="btn-ghost h-9 px-4 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="space-y-4 border-b border-border pb-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Two-Factor Authentication</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Add an extra layer of security to your account
            </p>
            <button className="btn-secondary h-9 px-4 text-sm opacity-50 cursor-not-allowed" disabled>
              Enable 2FA (Coming Soon)
            </button>
          </div>
        </div>

        {/* Sessions */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Active Sessions</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Manage your active sessions across devices
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium">Current Session</div>
                    <div className="text-xs text-muted-foreground">Active now</div>
                  </div>
                </div>
                <span className="text-xs text-success">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}