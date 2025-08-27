import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoveClaudeCodeBackend, createLoveClaudeCodeBackend } from '../LoveClaudeCodeBackend';
import { LoveClaudeCodeBackendDefinition } from '../LoveClaudeCodeBackend.definition';
import { ConstructLevel, ProviderType } from '../../../types';

describe('LoveClaudeCodeBackend L3 Construct', () => {
  let backend: LoveClaudeCodeBackend;

  beforeEach(() => {
    backend = createLoveClaudeCodeBackend();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should create a valid L3 backend construct', () => {
      expect(backend).toBeInstanceOf(LoveClaudeCodeBackend);
      expect(backend.level).toBe('L3');
      expect(backend.metadata.name).toBe('LoveClaudeCodeBackend');
    });

    it('should initialize with default configuration', () => {
      const config = backend.exportConfiguration();
      expect(config.provider).toBe('local');
      expect(config.version).toBe('1.0.0');
      expect(config.features.multiProvider).toBe(true);
      expect(config.features.claudeIntegration).toBe(true);
    });

    it('should accept custom metadata', () => {
      const customBackend = createLoveClaudeCodeBackend({
        name: 'CustomBackend',
        description: 'Custom backend instance'
      });
      expect(customBackend.metadata.name).toBe('CustomBackend');
      expect(customBackend.metadata.description).toBe('Custom backend instance');
    });
  });

  describe('Pattern Composition', () => {
    it('should compose multiple L2 patterns', () => {
      const patterns = backend.getPatterns();
      expect(patterns.length).toBeGreaterThan(0);
      
      const patternIds = patterns.map(p => p.id);
      expect(patternIds).toContain('multi-provider');
      expect(patternIds).toContain('microservice-backend');
      expect(patternIds).toContain('serverless-api');
      expect(patternIds).toContain('claude-integration');
    });

    it('should include optional patterns based on features', () => {
      const patterns = backend.getPatterns();
      const patternIds = patterns.map(p => p.id);
      
      // Check that optional patterns are included when features are enabled
      expect(patternIds).toContain('websocket-streaming');
      expect(patternIds).toContain('monitoring-observability');
    });
  });

  describe('Environment Configuration', () => {
    it('should update configuration for production environment', () => {
      backend.setEnvironment('production');
      const config = backend.exportConfiguration();
      
      expect(config.deployment.mode).toBe('production');
      expect(config.deployment.scaling.minInstances).toBe(2);
      expect(config.deployment.scaling.maxInstances).toBe(100);
    });

    it('should use Bedrock for Claude in production', () => {
      backend.setEnvironment('production');
      const config = backend.exportConfiguration();
      
      expect(config.claude.development.provider).toBe('bedrock');
    });
  });

  describe('Build and Deployment', () => {
    it('should build the backend successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      await backend.build();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Building Love Claude Code Backend'));
      expect(consoleSpy).toHaveBeenCalledWith('Backend build completed successfully!');
    });

    it('should deploy to different providers', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      // Deploy to local
      await backend.deploy('local');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Deploying backend to local'));
      
      // Deploy to Firebase
      await backend.deploy('firebase');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Deploying backend to firebase'));
      
      // Deploy to AWS
      await backend.deploy('aws');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Deploying backend to aws'));
    });

    it('should throw error for disabled provider', async () => {
      const config = backend.exportConfiguration();
      config.providers.firebase.enabled = false;
      backend.importConfiguration(config);
      
      await expect(backend.deploy('firebase')).rejects.toThrow('Provider firebase is not enabled');
    });
  });

  describe('Server Management', () => {
    it('should start development server', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      await backend.startDevelopment();
      
      expect(consoleSpy).toHaveBeenCalledWith('Starting backend development server...');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('API: http://localhost:8000/api/v1'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('WebSocket: ws://localhost:8001'));
    });

    it('should start production server', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      backend.setEnvironment('production');
      
      await backend.startProduction();
      
      expect(consoleSpy).toHaveBeenCalledWith('Starting backend production server...');
    });
  });

  describe('Health and Monitoring', () => {
    it('should return health status', async () => {
      const health = await backend.getHealthStatus();
      
      expect(health.status).toMatch(/healthy|degraded|unhealthy/);
      expect(health.components).toBeDefined();
      expect(health.components.api).toBeDefined();
      expect(health.components.database).toBeDefined();
      expect(health.components.claude).toBeDefined();
    });

    it('should return application metrics', async () => {
      const metrics = await backend.getMetrics();
      
      expect(metrics.version).toBe('1.0.0');
      expect(metrics.provider).toBe('local');
      expect(metrics.api).toBeDefined();
      expect(metrics.claude).toBeDefined();
      expect(metrics.resources).toBeDefined();
    });
  });

  describe('Provider Migration', () => {
    it('should migrate between providers', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      await backend.migrateProvider('local', 'firebase');
      
      expect(consoleSpy).toHaveBeenCalledWith('Migrating from local to firebase...');
      expect(consoleSpy).toHaveBeenCalledWith('Migration to firebase completed successfully!');
      
      const config = backend.exportConfiguration();
      expect(config.provider).toBe('firebase');
    });
  });

  describe('Configuration Management', () => {
    it('should export configuration', () => {
      const config = backend.exportConfiguration();
      
      expect(config.appName).toBe('Love Claude Code Backend');
      expect(config.version).toBe('1.0.0');
      expect(config.patterns).toBeDefined();
      expect(config.environment).toBe('development');
    });

    it('should import configuration', () => {
      const newConfig = {
        provider: 'aws' as ProviderType,
        features: {
          monitoring: false,
          analytics: false
        }
      };
      
      backend.importConfiguration(newConfig);
      const config = backend.exportConfiguration();
      
      expect(config.provider).toBe('aws');
      expect(config.features.monitoring).toBe(false);
      expect(config.features.analytics).toBe(false);
    });
  });

  describe('React Component', () => {
    it('should render loading state initially', () => {
      const Component = backend.Component;
      render(<Component />);
      
      expect(screen.getByText('Loading Backend Management...')).toBeInTheDocument();
    });

    it('should render backend management UI after loading', async () => {
      const Component = backend.Component;
      render(<Component />);
      
      await waitFor(() => {
        expect(screen.getByText('Love Claude Code Backend')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Provider Status')).toBeInTheDocument();
      expect(screen.getByText('Health Status')).toBeInTheDocument();
      expect(screen.getByText('Claude Integration')).toBeInTheDocument();
      expect(screen.getByText('API Metrics')).toBeInTheDocument();
    });

    it('should allow provider switching', async () => {
      const Component = backend.Component;
      const user = userEvent.setup();
      render(<Component />);
      
      await waitFor(() => {
        expect(screen.getByText('Provider Status')).toBeInTheDocument();
      });
      
      // Click on Firebase button
      const firebaseButton = screen.getByRole('button', { name: /firebase/i });
      await user.click(firebaseButton);
      
      // Should trigger migration
      await waitFor(() => {
        expect(screen.getByText('Current: firebase')).toBeInTheDocument();
      });
    });
  });

  describe('Self-Referential Capabilities', () => {
    it('should track self-referential metadata', () => {
      expect(backend.metadata.selfReferential).toBeDefined();
      expect(backend.metadata.selfReferential?.buildMethod).toBe('vibe-coding');
      expect(backend.metadata.selfReferential?.vibePercentage).toBe(95);
      expect(backend.metadata.selfReferential?.selfBuildingCapabilities).toContain('Deploys its own infrastructure');
    });
  });

  describe('Definition Validation', () => {
    it('should have a valid definition', () => {
      expect(LoveClaudeCodeBackendDefinition).toBeDefined();
      expect(LoveClaudeCodeBackendDefinition.id).toBe('love-claude-code-backend');
      expect(LoveClaudeCodeBackendDefinition.level).toBe(ConstructLevel.L3);
      expect(LoveClaudeCodeBackendDefinition.selfReferential.isPlatformConstruct).toBe(true);
    });

    it('should have comprehensive security considerations', () => {
      const security = LoveClaudeCodeBackendDefinition.security;
      expect(security.length).toBeGreaterThan(0);
      
      const criticalAspects = security.filter(s => s.severity === 'critical');
      expect(criticalAspects.length).toBeGreaterThan(0);
      
      const apiAuth = security.find(s => s.aspect === 'api-authentication');
      expect(apiAuth).toBeDefined();
      expect(apiAuth?.recommendations.length).toBeGreaterThan(0);
    });

    it('should have cost estimation', () => {
      const cost = LoveClaudeCodeBackendDefinition.cost;
      expect(cost.baseMonthly).toBe(50);
      expect(cost.usageFactors.length).toBeGreaterThan(0);
      
      const claudeCost = cost.usageFactors.find(f => f.name === 'claude-tokens');
      expect(claudeCost).toBeDefined();
      expect(claudeCost?.costPerUnit).toBe(3.00);
    });

    it('should have comprehensive examples', () => {
      const examples = LoveClaudeCodeBackendDefinition.examples;
      expect(examples.length).toBeGreaterThan(0);
      
      const localExample = examples.find(e => e.title.includes('Local Provider'));
      expect(localExample).toBeDefined();
      expect(localExample?.code).toContain('provider: \'local\'');
      
      const migrationExample = examples.find(e => e.title.includes('Migrate'));
      expect(migrationExample).toBeDefined();
      expect(migrationExample?.code).toContain('migrateProvider');
    });
  });
});