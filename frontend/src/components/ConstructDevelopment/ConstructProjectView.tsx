import React from 'react'
import { motion } from 'framer-motion'
import { ConstructBadge } from '../ProjectManagement/ConstructBadge'
import { ArrowRight, CheckCircle, Circle } from 'lucide-react'
import type { Project } from '@stores/projectStore'

interface ConstructProjectViewProps {
  project: Project
}

const phases = [
  {
    id: 'specification',
    title: 'Specification',
    description: 'Define your construct\'s purpose, API, and behavior',
    icon: '📋',
    tasks: [
      'Define construct metadata',
      'Specify inputs and outputs',
      'Document dependencies',
      'Create usage examples'
    ]
  },
  {
    id: 'testing',
    title: 'Test Generation',
    description: 'Generate comprehensive tests from your specification',
    icon: '🧪',
    tasks: [
      'Generate unit tests',
      'Create integration tests',
      'Define test scenarios',
      'Validate test coverage'
    ]
  },
  {
    id: 'implementation',
    title: 'Implementation',
    description: 'Build your construct to pass all tests',
    icon: '⚡',
    tasks: [
      'Implement core functionality',
      'Ensure all tests pass',
      'Add error handling',
      'Optimize performance'
    ]
  },
  {
    id: 'certification',
    title: 'Certification',
    description: 'Validate and publish your construct',
    icon: '✅',
    tasks: [
      'Run final validation',
      'Check code quality',
      'Generate documentation',
      'Publish to catalog'
    ]
  }
]

export const ConstructProjectView: React.FC<ConstructProjectViewProps> = ({ project }) => {
  const currentPhaseIndex = phases.findIndex(p => p.id === project.constructMetadata?.phase) || 0
  
  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
              {project.description && (
                <p className="text-muted-foreground mb-4">{project.description}</p>
              )}
            </div>
            {project.constructLevel && (
              <ConstructBadge 
                level={project.constructLevel} 
                phase={project.constructMetadata?.phase}
                size="large"
              />
            )}
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mt-6">
            {phases.map((phase, index) => {
              const isCompleted = index < currentPhaseIndex
              const isCurrent = index === currentPhaseIndex
              const isUpcoming = index > currentPhaseIndex
              
              return (
                <React.Fragment key={phase.id}>
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-xl
                        ${isCompleted ? 'bg-green-500/20 text-green-500' : ''}
                        ${isCurrent ? 'bg-primary/20 text-primary ring-2 ring-primary' : ''}
                        ${isUpcoming ? 'bg-muted text-muted-foreground' : ''}
                      `}
                    >
                      {isCompleted ? <CheckCircle size={24} /> : phase.icon}
                    </motion.div>
                    <span className={`
                      text-sm mt-2 font-medium
                      ${isCurrent ? 'text-primary' : 'text-muted-foreground'}
                    `}>
                      {phase.title}
                    </span>
                  </div>
                  {index < phases.length - 1 && (
                    <div className={`
                      flex-1 h-0.5 mx-4
                      ${index < currentPhaseIndex ? 'bg-green-500' : 'bg-border'}
                    `} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Current Phase Details */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-lg p-6 border border-border"
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">{phases[currentPhaseIndex].icon}</span>
                {phases[currentPhaseIndex].title}
              </h2>
              <p className="text-muted-foreground mb-6">
                {phases[currentPhaseIndex].description}
              </p>
              
              <div className="space-y-3">
                {phases[currentPhaseIndex].tasks.map((task, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-accent/30"
                  >
                    <Circle size={20} className="text-muted-foreground mt-0.5" />
                    <span className="text-sm">{task}</span>
                  </motion.div>
                ))}
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-6 w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg flex items-center justify-center gap-2 font-medium"
              >
                Start {phases[currentPhaseIndex].title}
                <ArrowRight size={18} />
              </motion.button>
            </motion.div>
            
            {/* Guidelines */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-lg p-6 border border-border"
            >
              <h3 className="text-lg font-semibold mb-4">
                {project.constructLevel} Guidelines
              </h3>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  Follow these guidelines when developing your {project.constructLevel} construct:
                </p>
                <ul className="space-y-2 mt-4">
                  {project.constructLevel === 'L0' && (
                    <>
                      <li>Zero external dependencies - only use language primitives</li>
                      <li>Single responsibility - one clear purpose</li>
                      <li>Minimal API surface - keep it simple</li>
                      <li>Direct resource mapping for infrastructure</li>
                    </>
                  )}
                  {project.constructLevel === 'L1' && (
                    <>
                      <li>Must use L0 primitives as foundation</li>
                      <li>Add sensible defaults and configuration</li>
                      <li>Handle common use cases elegantly</li>
                      <li>Provide consistent styling and behavior</li>
                    </>
                  )}
                  {project.constructLevel === 'L2' && (
                    <>
                      <li>Combine multiple L1 constructs effectively</li>
                      <li>Implement common patterns and best practices</li>
                      <li>Include comprehensive error handling</li>
                      <li>Provide complete solutions to specific problems</li>
                    </>
                  )}
                  {project.constructLevel === 'L3' && (
                    <>
                      <li>Create complete, deployable applications</li>
                      <li>Include all necessary infrastructure</li>
                      <li>Ensure production-ready with monitoring</li>
                      <li>Make it fully configurable and self-contained</li>
                    </>
                  )}
                </ul>
              </div>
            </motion.div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card rounded-lg p-6 border border-border"
            >
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-3 py-2 text-sm bg-accent/50 rounded-lg hover:bg-accent transition-all text-left">
                  View Specification Editor
                </button>
                <button className="w-full px-3 py-2 text-sm bg-accent/50 rounded-lg hover:bg-accent transition-all text-left">
                  Run Tests
                </button>
                <button className="w-full px-3 py-2 text-sm bg-accent/50 rounded-lg hover:bg-accent transition-all text-left">
                  Preview Construct
                </button>
                <button className="w-full px-3 py-2 text-sm bg-accent/50 rounded-lg hover:bg-accent transition-all text-left">
                  View Documentation
                </button>
              </div>
            </motion.div>
            
            {/* Resources */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-lg p-6 border border-border"
            >
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <div className="space-y-3">
                <a href="#" className="block text-sm text-primary hover:underline">
                  Construct Development Guide →
                </a>
                <a href="#" className="block text-sm text-primary hover:underline">
                  {project.constructLevel} Examples →
                </a>
                <a href="#" className="block text-sm text-primary hover:underline">
                  Best Practices →
                </a>
                <a href="#" className="block text-sm text-primary hover:underline">
                  Testing Guidelines →
                </a>
              </div>
            </motion.div>
            
            {/* Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-lg p-6 border border-border"
            >
              <h3 className="text-lg font-semibold mb-4">Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Specification</span>
                  <span className={project.constructMetadata?.specificationComplete ? 'text-green-500' : 'text-yellow-500'}>
                    {project.constructMetadata?.specificationComplete ? 'Complete' : 'In Progress'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tests</span>
                  <span className={project.constructMetadata?.testsGenerated ? 'text-green-500' : 'text-muted-foreground'}>
                    {project.constructMetadata?.testsGenerated ? 'Generated' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Implementation</span>
                  <span className={project.constructMetadata?.implementationComplete ? 'text-green-500' : 'text-muted-foreground'}>
                    {project.constructMetadata?.implementationComplete ? 'Complete' : 'Pending'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}