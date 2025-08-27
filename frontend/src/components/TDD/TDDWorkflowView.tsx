/**
 * TDD Workflow View
 * Main page component for Test-Driven Development workflow
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TestTube, 
  Code, 
  FileText, 
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { TDDWorkflowPanel } from './TDDWorkflowPanel'
import { SpecificationEditor } from '../SpecificationEditor/SpecificationEditor'
import { useNavigationStore } from '../Navigation'
import { ParsedSpecification } from '../../services/tdd/SpecificationParser'
import { PlatformConstructDefinition } from '../../constructs/types'

export const TDDWorkflowView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'workflow' | 'specification'>('workflow')
  const [specification, setSpecification] = useState<ParsedSpecification | null>(null)
  const { navigate } = useNavigationStore()

  const handleSpecificationParsed = (spec: ParsedSpecification) => {
    setSpecification(spec)
    // Could automatically switch to workflow tab here
  }

  const handleConstructGenerated = (definition: Partial<PlatformConstructDefinition>) => {
    console.log('Construct generated:', definition)
    // Could offer to save to construct catalog
  }

  const handleTestGenerated = (testCode: string) => {
    console.log('Test code generated:', testCode)
    // Could open in editor
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TestTube className="w-6 h-6 text-green-500" />
              <h1 className="text-2xl font-bold">Test-Driven Development</h1>
            </div>
            <button
              onClick={() => navigate('projects')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl">
            <h2 className="text-4xl font-bold mb-4">
              Build with Confidence Using TDD
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Write specifications in natural language, generate comprehensive tests automatically,
              and follow the red-green-refactor cycle to build robust software.
            </p>
            
            {/* TDD Cycle Visualization */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-2">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <span className="text-sm font-medium">Write Test</span>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-600" />
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <span className="text-sm font-medium">Make Pass</span>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-600" />
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-2">
                  <RefreshCw className="w-8 h-8 text-blue-500" />
                </div>
                <span className="text-sm font-medium">Refactor</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('workflow')}
              className={`py-4 px-2 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'workflow'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <TestTube className="w-4 h-4" />
              TDD Workflow
            </button>
            <button
              onClick={() => setActiveTab('specification')}
              className={`py-4 px-2 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'specification'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Specification Editor
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'workflow' ? (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Interactive TDD Workflow</h3>
                <p className="text-gray-400">
                  Follow the red-green-refactor cycle with AI-generated tests and real-time feedback.
                </p>
              </div>
              <TDDWorkflowPanel className="shadow-xl" />
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Natural Language Specifications</h3>
                <p className="text-gray-400">
                  Write specifications in plain language and convert them to formal specs, tests, and constructs.
                </p>
              </div>
              <SpecificationEditor
                onSpecificationParsed={handleSpecificationParsed}
                onConstructGenerated={handleConstructGenerated}
                onTestGenerated={handleTestGenerated}
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-6 py-12">
        <h3 className="text-2xl font-bold mb-8">TDD Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Sparkles className="w-6 h-6" />}
            title="AI-Powered Test Generation"
            description="Generate comprehensive test suites from natural language specifications"
          />
          <FeatureCard
            icon={<Code className="w-6 h-6" />}
            title="Multiple Test Frameworks"
            description="Support for Vitest, Jest, and Playwright with automatic framework detection"
          />
          <FeatureCard
            icon={<TestTube className="w-6 h-6" />}
            title="Coverage Analysis"
            description="Real-time coverage feedback with suggestions for additional tests"
          />
        </div>
      </div>
    </div>
  )
}

const FeatureCard: React.FC<{
  icon: React.ReactNode
  title: string
  description: string
}> = ({ icon, title, description }) => {
  return (
    <div className="p-6 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="text-blue-500 mb-4">{icon}</div>
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  )
}