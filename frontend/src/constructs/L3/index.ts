/**
 * L3 - Application Constructs
 * 
 * L3 constructs are complete, production-ready applications that compose
 * multiple L2 patterns into working systems. These are the highest level
 * constructs in the hierarchy.
 * 
 * Characteristics:
 * - Compose multiple L2 patterns
 * - Production-ready with build and deployment
 * - Include all necessary configurations
 * - Support multiple environments
 * - Self-contained applications
 * 
 * Categories:
 * - applications: Complete applications (frontend, backend, mobile)
 * - platforms: Multi-application platforms
 * - ecosystems: Connected application systems
 */

// Export all L3 constructs
export * from './applications';

// Visualization Application
export { ConstructArchitectureVisualizer, createConstructArchitectureVisualizer, constructArchitectureVisualizerDefinition } from './ConstructArchitectureVisualizer';
export type { VisualizerConfig } from './ConstructArchitectureVisualizer';

// Future L3 categories:
// export * from './platforms';
// export * from './ecosystems';