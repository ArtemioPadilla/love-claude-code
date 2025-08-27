import { z } from 'zod';
import semver from 'semver';

export interface PlatformVersion {
  version: string;
  releaseDate: Date;
  changelog: ChangelogEntry[];
  migrations?: MigrationScript[];
  minimumCompatibleVersion?: string;
  features: string[];
  breakingChanges: string[];
}

export interface ChangelogEntry {
  type: 'feature' | 'fix' | 'breaking' | 'improvement' | 'security';
  description: string;
  issueNumber?: string;
  author?: string;
}

export interface MigrationScript {
  fromVersion: string;
  toVersion: string;
  description: string;
  script: () => Promise<void>;
  rollback?: () => Promise<void>;
}

export interface UpdateNotification {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  severity: 'major' | 'minor' | 'patch';
  changelog: ChangelogEntry[];
  releaseDate: Date;
}

class PlatformVersionService {
  private currentVersion = '1.0.0'; // Would be loaded from package.json
  private versions: Map<string, PlatformVersion> = new Map();
  private updateCheckInterval: number | null = null;
  private updateListeners: Set<(notification: UpdateNotification) => void> = new Set();

  constructor() {
    this.initializeVersions();
  }

  private initializeVersions(): void {
    // Initialize with some version history
    const versions: PlatformVersion[] = [
      {
        version: '1.0.0',
        releaseDate: new Date('2025-01-01'),
        changelog: [
          { type: 'feature', description: 'Initial release of Love Claude Code platform' },
          { type: 'feature', description: 'Multi-provider backend architecture' },
          { type: 'feature', description: 'Self-referential construct system' }
        ],
        features: ['Multi-provider', 'Construct System', 'MCP Integration'],
        breakingChanges: []
      },
      {
        version: '1.1.0',
        releaseDate: new Date('2025-01-15'),
        changelog: [
          { type: 'feature', description: 'Self-hosting capabilities', issueNumber: '#123' },
          { type: 'feature', description: 'Hot reload for constructs', issueNumber: '#124' },
          { type: 'improvement', description: 'Performance optimizations for large projects' },
          { type: 'fix', description: 'Fixed memory leak in editor component' }
        ],
        minimumCompatibleVersion: '1.0.0',
        features: ['Self-hosting', 'Hot Reload', 'Performance Mode'],
        breakingChanges: [],
        migrations: [
          {
            fromVersion: '1.0.0',
            toVersion: '1.1.0',
            description: 'Migrate construct registry to new format',
            script: async () => {
              console.log('Migrating construct registry...');
              // Migration logic here
            },
            rollback: async () => {
              console.log('Rolling back construct registry...');
              // Rollback logic here
            }
          }
        ]
      },
      {
        version: '1.2.0',
        releaseDate: new Date('2025-02-01'),
        changelog: [
          { type: 'feature', description: 'Enterprise authentication support' },
          { type: 'feature', description: 'Advanced monitoring and metrics' },
          { type: 'breaking', description: 'Changed API authentication format' },
          { type: 'security', description: 'Security updates for dependencies' }
        ],
        minimumCompatibleVersion: '1.1.0',
        features: ['Enterprise Auth', 'Advanced Monitoring', 'Security Hardening'],
        breakingChanges: ['API authentication format changed']
      }
    ];

    versions.forEach(v => this.versions.set(v.version, v));
  }

  getCurrentVersion(): string {
    return this.currentVersion;
  }

  setCurrentVersion(version: string): void {
    if (!semver.valid(version)) {
      throw new Error(`Invalid version: ${version}`);
    }
    this.currentVersion = version;
  }

  getAvailableVersions(): string[] {
    return Array.from(this.versions.keys()).sort(semver.rcompare);
  }

  getVersion(version: string): PlatformVersion | null {
    return this.versions.get(version) || null;
  }

  getLatestVersion(): string {
    const versions = this.getAvailableVersions();
    return versions[0] || this.currentVersion;
  }

  async checkForUpdates(): Promise<UpdateNotification | null> {
    const latest = this.getLatestVersion();
    const current = this.getCurrentVersion();
    
    if (semver.gt(latest, current)) {
      const latestVersion = this.getVersion(latest)!;
      const updateType = semver.diff(current, latest) as 'major' | 'minor' | 'patch';
      
      const notification: UpdateNotification = {
        currentVersion: current,
        latestVersion: latest,
        updateAvailable: true,
        severity: updateType || 'patch',
        changelog: latestVersion.changelog,
        releaseDate: latestVersion.releaseDate
      };
      
      // Notify listeners
      this.updateListeners.forEach(listener => listener(notification));
      
      return notification;
    }
    
    return null;
  }

  startUpdateCheck(intervalMs: number = 3600000): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }
    
    this.updateCheckInterval = window.setInterval(() => {
      this.checkForUpdates();
    }, intervalMs);
    
    // Check immediately
    this.checkForUpdates();
  }

  stopUpdateCheck(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }

  onUpdateAvailable(callback: (notification: UpdateNotification) => void): () => void {
    this.updateListeners.add(callback);
    return () => this.updateListeners.delete(callback);
  }

  compareVersions(v1: string, v2: string): -1 | 0 | 1 {
    if (semver.gt(v1, v2)) return 1;
    if (semver.lt(v1, v2)) return -1;
    return 0;
  }

  async checkCompatibility(targetVersion: string): Promise<boolean> {
    const target = this.getVersion(targetVersion);
    if (!target) return false;
    
    if (target.minimumCompatibleVersion) {
      return semver.gte(this.currentVersion, target.minimumCompatibleVersion);
    }
    
    return true;
  }

  getChangelog(fromVersion?: string, toVersion?: string): ChangelogEntry[] {
    const from = fromVersion || this.currentVersion;
    const to = toVersion || this.getLatestVersion();
    
    const changelog: ChangelogEntry[] = [];
    const versions = this.getAvailableVersions();
    
    for (const version of versions) {
      if (semver.lte(version, from)) break;
      if (semver.gt(version, to)) continue;
      
      const versionData = this.getVersion(version);
      if (versionData) {
        changelog.push(...versionData.changelog);
      }
    }
    
    return changelog;
  }

  async getMigrationPath(fromVersion: string, toVersion: string): Promise<MigrationScript[]> {
    const path: MigrationScript[] = [];
    const versions = this.getAvailableVersions().sort(semver.compare);
    
    let currentVersion = fromVersion;
    
    for (const version of versions) {
      if (semver.lte(version, fromVersion)) continue;
      if (semver.gt(version, toVersion)) break;
      
      const versionData = this.getVersion(version);
      if (versionData?.migrations) {
        const relevantMigrations = versionData.migrations.filter(
          m => semver.eq(m.fromVersion, currentVersion)
        );
        path.push(...relevantMigrations);
        currentVersion = version;
      }
    }
    
    return path;
  }

  async runMigrations(fromVersion: string, toVersion: string): Promise<void> {
    const migrations = await this.getMigrationPath(fromVersion, toVersion);
    
    for (const migration of migrations) {
      console.log(`Running migration: ${migration.description}`);
      await migration.script();
    }
  }

  getVersionMetadata(): {
    current: string;
    latest: string;
    updateAvailable: boolean;
    buildDate: Date;
    gitCommit?: string;
    environment: string;
  } {
    const latest = this.getLatestVersion();
    return {
      current: this.currentVersion,
      latest,
      updateAvailable: semver.gt(latest, this.currentVersion),
      buildDate: new Date(),
      gitCommit: process.env.REACT_APP_GIT_COMMIT,
      environment: process.env.NODE_ENV || 'development'
    };
  }

  exportVersionHistory(): string {
    const history = this.getAvailableVersions().map(version => {
      const v = this.getVersion(version)!;
      return {
        version,
        releaseDate: v.releaseDate.toISOString(),
        changelog: v.changelog,
        features: v.features,
        breakingChanges: v.breakingChanges
      };
    });
    
    return JSON.stringify(history, null, 2);
  }
}

export const platformVersion = new PlatformVersionService();