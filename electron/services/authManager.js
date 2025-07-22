const Store = require('electron-store');
const keytar = require('keytar');
const crypto = require('crypto');

class AuthManager {
  constructor() {
    // Service name for keychain
    this.serviceName = 'love-claude-code';
    this.accountName = 'claude-cli';
    this._store = null;
    this._encryptionKey = null;
  }

  /**
   * Get the store instance (lazy initialization)
   */
  get store() {
    if (!this._store) {
      this._store = new Store({
        name: 'auth-config',
        encryptionKey: this.getOrCreateEncryptionKey()
      });
    }
    return this._store;
  }

  /**
   * Get or create encryption key for the store
   */
  getOrCreateEncryptionKey() {
    if (this._encryptionKey) {
      return this._encryptionKey;
    }
    
    // Generate a random key if we don't have one yet
    this._encryptionKey = crypto.randomBytes(32).toString('hex');
    return this._encryptionKey;
  }

  /**
   * Get authentication status
   */
  async getAuthStatus() {
    try {
      const isAuthenticated = this.store.get('isAuthenticated', false);
      const lastChecked = this.store.get('lastAuthCheck');
      const authMethod = this.store.get('authMethod', 'claude-cli');
      const username = this.store.get('username');
      
      // Check if we need to re-verify (every 24 hours)
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      const needsRecheck = !lastChecked || (now - lastChecked) > dayInMs;

      return {
        isAuthenticated,
        needsRecheck,
        lastChecked,
        authMethod,
        username
      };
    } catch (error) {
      console.error('Error getting auth status:', error);
      return {
        isAuthenticated: false,
        needsRecheck: true,
        error: error.message
      };
    }
  }

  /**
   * Set authentication status
   */
  async setAuthStatus(authenticated, username = null) {
    try {
      this.store.set('isAuthenticated', authenticated);
      this.store.set('lastAuthCheck', Date.now());
      
      if (username) {
        this.store.set('username', username);
      }

      return { success: true };
    } catch (error) {
      console.error('Error setting auth status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Store API key securely in OS keychain
   */
  async storeApiKey(apiKey) {
    try {
      await keytar.setPassword(this.serviceName, this.accountName, apiKey);
      this.store.set('hasStoredApiKey', true);
      return { success: true };
    } catch (error) {
      console.error('Error storing API key:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieve API key from OS keychain
   */
  async getApiKey() {
    try {
      const apiKey = await keytar.getPassword(this.serviceName, this.accountName);
      return apiKey;
    } catch (error) {
      console.error('Error retrieving API key:', error);
      return null;
    }
  }

  /**
   * Delete stored API key
   */
  async deleteApiKey() {
    try {
      await keytar.deletePassword(this.serviceName, this.accountName);
      this.store.set('hasStoredApiKey', false);
      return { success: true };
    } catch (error) {
      console.error('Error deleting API key:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Store OAuth tokens securely
   */
  async storeOAuthTokens(tokens) {
    try {
      const { accessToken, refreshToken, expiresAt } = tokens;
      
      // Store tokens in keychain
      await keytar.setPassword(this.serviceName, 'oauth-access', accessToken);
      if (refreshToken) {
        await keytar.setPassword(this.serviceName, 'oauth-refresh', refreshToken);
      }
      
      // Store metadata in encrypted store
      this.store.set('oauth', {
        hasTokens: true,
        expiresAt,
        authMethod: 'oauth'
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error storing OAuth tokens:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get OAuth tokens
   */
  async getOAuthTokens() {
    try {
      const metadata = this.store.get('oauth');
      if (!metadata || !metadata.hasTokens) {
        return null;
      }

      const accessToken = await keytar.getPassword(this.serviceName, 'oauth-access');
      const refreshToken = await keytar.getPassword(this.serviceName, 'oauth-refresh');

      return {
        accessToken,
        refreshToken,
        expiresAt: metadata.expiresAt
      };
    } catch (error) {
      console.error('Error retrieving OAuth tokens:', error);
      return null;
    }
  }

  /**
   * Clear all authentication data
   */
  async clearAuth() {
    try {
      // Clear keychain
      await this.deleteApiKey();
      await keytar.deletePassword(this.serviceName, 'oauth-access');
      await keytar.deletePassword(this.serviceName, 'oauth-refresh');
      
      // Clear store
      this.store.delete('isAuthenticated');
      this.store.delete('lastAuthCheck');
      this.store.delete('username');
      this.store.delete('oauth');
      this.store.delete('hasStoredApiKey');
      
      return { success: true };
    } catch (error) {
      console.error('Error clearing auth:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all stored accounts
   */
  async getStoredAccounts() {
    try {
      const accounts = [];
      
      // Check for API key
      if (this.store.get('hasStoredApiKey')) {
        accounts.push({
          type: 'api-key',
          name: this.accountName,
          hasCredentials: true
        });
      }
      
      // Check for OAuth
      const oauthData = this.store.get('oauth');
      if (oauthData && oauthData.hasTokens) {
        accounts.push({
          type: 'oauth',
          name: 'Claude OAuth',
          hasCredentials: true,
          expiresAt: oauthData.expiresAt
        });
      }
      
      return accounts;
    } catch (error) {
      console.error('Error getting stored accounts:', error);
      return [];
    }
  }

  /**
   * Store user preferences
   */
  setPreferences(preferences) {
    try {
      this.store.set('preferences', preferences);
      return { success: true };
    } catch (error) {
      console.error('Error storing preferences:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user preferences
   */
  getPreferences() {
    return this.store.get('preferences', {
      autoCheckUpdates: true,
      theme: 'system',
      defaultModel: 'claude-3-5-sonnet',
      streamResponses: true
    });
  }
}

// Export singleton instance
module.exports = new AuthManager();