import React from 'react'
import { motion } from 'framer-motion'
import { Rocket, Package, Layers, Grid3x3, ArrowRight, CheckCircle2 } from 'lucide-react'

/**
 * Demo component showing the construct development workflow
 * This demonstrates how developers will create constructs for the platform
 */
export const ConstructDevelopmentDemo: React.FC = () => {
  const steps = [
    {
      title: "1. Create Construct Project",
      description: "Choose 'Construct Development' template when creating a new project",
      icon: <Rocket className="w-8 h-8 text-primary" />,
      features: [
        "Select construct level (L0-L3)",
        "Automatic project structure",
        "Level-specific guidelines",
        "Dependency management"
      ]
    },
    {
      title: "2. Define Specification",
      description: "Use natural language to describe your construct's behavior",
      icon: <Package className="w-8 h-8 text-blue-500" />,
      features: [
        "Natural language specification",
        "API definition",
        "Input/output types",
        "Usage examples"
      ]
    },
    {
      title: "3. Generate Tests",
      description: "AI generates comprehensive tests from your specification",
      icon: <Layers className="w-8 h-8 text-purple-500" />,
      features: [
        "Unit test generation",
        "Integration tests",
        "Edge case coverage",
        "Test validation"
      ]
    },
    {
      title: "4. Implement & Deploy",
      description: "Build your construct to pass all tests and deploy to catalog",
      icon: <Grid3x3 className="w-8 h-8 text-green-500" />,
      features: [
        "TDD workflow",
        "Real-time validation",
        "Automatic documentation",
        "Publish to catalog"
      ]
    }
  ]

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Construct Development Workflow</h1>
        <p className="text-xl text-muted-foreground">
          Build reusable constructs for the Love Claude Code platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-lg p-6 border border-border hover:border-primary/50 transition-all"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-lg bg-accent">
                {step.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>

            <ul className="space-y-2">
              {step.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg border border-primary/20"
      >
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Self-Referential Platform</h2>
          <p className="text-muted-foreground mb-6 max-w-3xl mx-auto">
            Love Claude Code is built using its own constructs. Every feature you see, 
            including this construct development workflow, was created using the platform's 
            own tools and patterns.
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">75%</div>
              <div className="text-sm text-muted-foreground">Vibe-Coded</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500">100+</div>
              <div className="text-sm text-muted-foreground">Platform Constructs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">4</div>
              <div className="text-sm text-muted-foreground">Construct Levels</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-8 text-center">
        <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all">
          Start Building Constructs
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}