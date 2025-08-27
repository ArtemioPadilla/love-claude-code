import { BaseApi } from './api';

export interface GitStatus {
  currentBranch: string;
  isRepo: boolean;
  ahead: number;
  behind: number;
  staged: GitFileChange[];
  modified: GitFileChange[];
  untracked: string[];
  conflicted: string[];
}

export interface GitFileChange {
  file: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'unmerged';
  staged: boolean;
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
  ahead?: number;
  behind?: number;
}

export interface GitCommitOptions {
  message: string;
  files?: string[];
  allFiles?: boolean;
}

export interface GitDiffOptions {
  file?: string;
  staged?: boolean;
  cached?: boolean;
}

export interface GitDiff {
  file: string;
  diff: string;
  additions: number;
  deletions: number;
}

export interface GitPushPullOptions {
  remote?: string;
  branch?: string;
  force?: boolean;
}

export interface GitLog {
  hash: string;
  author: string;
  email: string;
  date: string;
  message: string;
  files?: string[];
}

class GitApi extends BaseApi {
  private baseUrl = '/api/v1/git';

  /**
   * Get current Git status
   */
  async getStatus(projectPath?: string): Promise<GitStatus> {
    const params = new URLSearchParams();
    if (projectPath) {
      params.set('path', projectPath);
    }
    
    return this.request<GitStatus>(`${this.baseUrl}/status?${params}`);
  }

  /**
   * Get Git branches
   */
  async getBranches(projectPath?: string): Promise<GitBranch[]> {
    const params = new URLSearchParams();
    if (projectPath) {
      params.set('path', projectPath);
    }
    
    return this.request<GitBranch[]>(`${this.baseUrl}/branches?${params}`);
  }

  /**
   * Create and switch to a new branch
   */
  async createBranch(branchName: string, projectPath?: string): Promise<void> {
    return this.request<void>(`${this.baseUrl}/branch`, {
      method: 'POST',
      body: JSON.stringify({
        name: branchName,
        path: projectPath
      })
    });
  }

  /**
   * Switch to an existing branch
   */
  async switchBranch(branchName: string, projectPath?: string): Promise<void> {
    return this.request<void>(`${this.baseUrl}/checkout`, {
      method: 'POST',
      body: JSON.stringify({
        branch: branchName,
        path: projectPath
      })
    });
  }

  /**
   * Stage files for commit
   */
  async stageFiles(files: string[], projectPath?: string): Promise<void> {
    return this.request<void>(`${this.baseUrl}/stage`, {
      method: 'POST',
      body: JSON.stringify({
        files,
        path: projectPath
      })
    });
  }

  /**
   * Unstage files
   */
  async unstageFiles(files: string[], projectPath?: string): Promise<void> {
    return this.request<void>(`${this.baseUrl}/unstage`, {
      method: 'POST',
      body: JSON.stringify({
        files,
        path: projectPath
      })
    });
  }

  /**
   * Commit staged changes
   */
  async commit(options: GitCommitOptions, projectPath?: string): Promise<{ hash: string }> {
    return this.request<{ hash: string }>(`${this.baseUrl}/commit`, {
      method: 'POST',
      body: JSON.stringify({
        ...options,
        path: projectPath
      })
    });
  }

  /**
   * Push changes to remote repository
   */
  async push(options: GitPushPullOptions = {}, projectPath?: string): Promise<void> {
    return this.request<void>(`${this.baseUrl}/push`, {
      method: 'POST',
      body: JSON.stringify({
        ...options,
        path: projectPath
      })
    });
  }

  /**
   * Pull changes from remote repository
   */
  async pull(options: GitPushPullOptions = {}, projectPath?: string): Promise<void> {
    return this.request<void>(`${this.baseUrl}/pull`, {
      method: 'POST',
      body: JSON.stringify({
        ...options,
        path: projectPath
      })
    });
  }

  /**
   * Fetch changes from remote repository
   */
  async fetch(remote?: string, projectPath?: string): Promise<void> {
    return this.request<void>(`${this.baseUrl}/fetch`, {
      method: 'POST',
      body: JSON.stringify({
        remote,
        path: projectPath
      })
    });
  }

  /**
   * Get Git diff
   */
  async getDiff(options: GitDiffOptions = {}, projectPath?: string): Promise<GitDiff[]> {
    const params = new URLSearchParams();
    if (projectPath) {
      params.set('path', projectPath);
    }
    if (options.file) {
      params.set('file', options.file);
    }
    if (options.staged) {
      params.set('staged', 'true');
    }
    if (options.cached) {
      params.set('cached', 'true');
    }
    
    return this.request<GitDiff[]>(`${this.baseUrl}/diff?${params}`);
  }

  /**
   * Get Git log
   */
  async getLog(limit = 20, projectPath?: string): Promise<GitLog[]> {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    if (projectPath) {
      params.set('path', projectPath);
    }
    
    return this.request<GitLog[]>(`${this.baseUrl}/log?${params}`);
  }

  /**
   * Initialize a new Git repository
   */
  async init(projectPath?: string): Promise<void> {
    return this.request<void>(`${this.baseUrl}/init`, {
      method: 'POST',
      body: JSON.stringify({
        path: projectPath
      })
    });
  }

  /**
   * Add a remote repository
   */
  async addRemote(name: string, url: string, projectPath?: string): Promise<void> {
    return this.request<void>(`${this.baseUrl}/remote`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        url,
        path: projectPath
      })
    });
  }

  /**
   * Get remote repositories
   */
  async getRemotes(projectPath?: string): Promise<{ name: string; url: string }[]> {
    const params = new URLSearchParams();
    if (projectPath) {
      params.set('path', projectPath);
    }
    
    return this.request<{ name: string; url: string }[]>(`${this.baseUrl}/remotes?${params}`);
  }

  /**
   * Clone a repository
   */
  async clone(url: string, path: string, branch?: string): Promise<void> {
    return this.request<void>(`${this.baseUrl}/clone`, {
      method: 'POST',
      body: JSON.stringify({
        url,
        path,
        branch
      })
    });
  }

  /**
   * Discard changes in files
   */
  async discardChanges(files: string[], projectPath?: string): Promise<void> {
    return this.request<void>(`${this.baseUrl}/discard`, {
      method: 'POST',
      body: JSON.stringify({
        files,
        path: projectPath
      })
    });
  }

  /**
   * Reset to a specific commit
   */
  async reset(commitHash: string, hard = false, projectPath?: string): Promise<void> {
    return this.request<void>(`${this.baseUrl}/reset`, {
      method: 'POST',
      body: JSON.stringify({
        hash: commitHash,
        hard,
        path: projectPath
      })
    });
  }
}

export const gitApi = new GitApi();