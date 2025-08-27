import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Book, Code2, Cloud, Shield, Terminal, 
  ChevronRight, Search, Menu, X, Layers,
  GitBranch, Database, Globe, Lock, BarChart, Rocket,
  ArrowLeft, ExternalLink, Package, TestTube, Users,
  Hammer, Workflow, Store, Building2, Server, Gauge, Plug
} from 'lucide-react'
import { useNavigationStore } from '../Navigation'
import ArchitectureDiagram from './ArchitectureDiagram'
import ProviderComparison from './ProviderComparison'
import GettingStarted from './sections/GettingStarted'
import APIReference from './sections/APIReference'
import MCPGuide from './sections/MCPGuide'
import ProviderGuides from './sections/ProviderGuides'
import DeploymentGuide from './sections/DeploymentGuide'
import Troubleshooting from './sections/Troubleshooting'
import MultiCloudArchitecture from './sections/MultiCloudArchitecture'
import SecurityBestPractices from './sections/SecurityBestPractices'
import { DesktopAppGuide } from './DesktopAppGuide'
import Footer from '../Layout/Footer'
import TDDGuide from '../Documentation/sections/TDDGuide'
import AgentParallelization from './sections/AgentParallelization'
import ConstructSystemGuide from './sections/ConstructSystemGuide'
import ConstructBuilderGuide from './sections/ConstructBuilderGuide'
import VisualComposerGuide from './sections/VisualComposerGuide'
import MarketplaceGuide from './sections/MarketplaceGuide'
import EnterpriseGuide from './sections/EnterpriseGuide'
import SelfHostingGuide from './sections/SelfHostingGuide'
import PerformanceGuide from './sections/PerformanceGuide'
import ConstructDevelopmentGuide from './sections/ConstructDevelopmentGuide'
import ExternalIntegrationGuide from './sections/ExternalIntegrationGuide'

interface DocSection {
  id: string
  title: string
  icon: React.ReactNode
  content?: React.ReactNode
  subsections?: DocSection[]
}

const DocumentationCenter: React.FC = () => {
  const { currentDocSection, navigate } = useNavigationStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState(currentDocSection || 'getting-started')

  const docSections: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Rocket className="w-5 h-5" />,
      content: <GettingStarted />
    },
    {
      id: 'desktop-app',
      title: 'Desktop App',
      icon: <Package className="w-5 h-5" />,
      content: <DesktopAppGuide />
    },
    {
      id: 'architecture',
      title: 'Architecture',
      icon: <Layers className="w-5 h-5" />,
      subsections: [
        {
          id: 'overview',
          title: 'System Overview',
          icon: <GitBranch className="w-4 h-4" />,
          content: <ArchitectureDiagram />
        },
        {
          id: 'multi-cloud',
          title: 'Multi-Cloud Design',
          icon: <Cloud className="w-4 h-4" />,
          content: <MultiCloudArchitecture />
        }
      ]
    },
    {
      id: 'providers',
      title: 'Backend Providers',
      icon: <Database className="w-5 h-5" />,
      subsections: [
        {
          id: 'comparison',
          title: 'Provider Comparison',
          icon: <BarChart className="w-4 h-4" />,
          content: <ProviderComparison />
        },
        {
          id: 'guides',
          title: 'Provider Guides',
          icon: <Book className="w-4 h-4" />,
          content: <ProviderGuides />
        }
      ]
    },
    {
      id: 'mcp',
      title: 'Model Context Protocol',
      icon: <Terminal className="w-5 h-5" />,
      content: <MCPGuide />
    },
    {
      id: 'api',
      title: 'API Reference',
      icon: <Code2 className="w-5 h-5" />,
      content: <APIReference />
    },
    {
      id: 'deployment',
      title: 'Deployment',
      icon: <Globe className="w-5 h-5" />,
      content: <DeploymentGuide />
    },
    {
      id: 'security',
      title: 'Security',
      icon: <Lock className="w-5 h-5" />,
      content: <SecurityBestPractices />
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <Shield className="w-5 h-5" />,
      content: <Troubleshooting />
    },
    {
      id: 'tdd',
      title: 'TDD/SDD Infrastructure',
      icon: <TestTube className="w-5 h-5" />,
      content: <TDDGuide />
    },
    {
      id: 'agent-parallelization',
      title: 'Agent Parallelization',
      icon: <Users className="w-5 h-5" />,
      content: <AgentParallelization />
    },
    {
      id: 'constructs',
      title: 'Construct System',
      icon: <Layers className="w-5 h-5" />,
      subsections: [
        {
          id: 'construct-system',
          title: 'Overview',
          icon: <Layers className="w-4 h-4" />,
          content: <ConstructSystemGuide />
        },
        {
          id: 'construct-development',
          title: 'Development Guide',
          icon: <Hammer className="w-4 h-4" />,
          content: <ConstructDevelopmentGuide />
        },
        {
          id: 'construct-builder',
          title: 'ConstructBuilder IDE',
          icon: <Code2 className="w-4 h-4" />,
          content: <ConstructBuilderGuide />
        },
        {
          id: 'visual-composer',
          title: 'Visual Composer',
          icon: <Workflow className="w-4 h-4" />,
          content: <VisualComposerGuide />
        },
        {
          id: 'marketplace',
          title: 'Marketplace',
          icon: <Store className="w-4 h-4" />,
          content: <MarketplaceGuide />
        }
      ]
    },
    {
      id: 'enterprise',
      title: 'Enterprise',
      icon: <Building2 className="w-5 h-5" />,
      subsections: [
        {
          id: 'enterprise-features',
          title: 'Enterprise Guide',
          icon: <Building2 className="w-4 h-4" />,
          content: <EnterpriseGuide />
        },
        {
          id: 'self-hosting',
          title: 'Self-Hosting',
          icon: <Server className="w-4 h-4" />,
          content: <SelfHostingGuide />
        },
        {
          id: 'performance',
          title: 'Performance Monitoring',
          icon: <Gauge className="w-4 h-4" />,
          content: <PerformanceGuide />
        }
      ]
    },
    {
      id: 'integrations',
      title: 'External Integrations',
      icon: <Plug className="w-5 h-5" />,
      content: <ExternalIntegrationGuide />
    }
  ]

  const findSection = (sections: DocSection[], id: string): DocSection | null => {
    for (const section of sections) {
      if (section.id === id) return section
      if (section.subsections) {
        const found = findSection(section.subsections, id)
        if (found) return found
      }
    }
    return null
  }

  const getCurrentContent = () => {
    const section = findSection(docSections, activeSection)
    return section?.content || <div>Section not found</div>
  }

  const renderSidebarItem = (section: DocSection, depth = 0) => {
    const isActive = activeSection === section.id
    const hasSubsections = section.subsections && section.subsections.length > 0

    return (
      <div key={section.id}>
        <button
          onClick={() => !hasSubsections && setActiveSection(section.id)}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
            isActive ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-gray-700 text-gray-300'
          } ${depth > 0 ? 'pl-8' : ''}`}
        >
          {section.icon}
          <span className="flex-1 text-left">{section.title}</span>
          {hasSubsections && <ChevronRight className="w-4 h-4" />}
        </button>
        {hasSubsections && (
          <div className="ml-2">
            {section.subsections!.map(sub => renderSidebarItem(sub, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className="fixed lg:relative w-72 h-screen bg-gray-800 border-r border-gray-700 overflow-y-auto z-50"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Book className="w-6 h-6 text-blue-500" />
              Documentation
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Back to Home Button */}
          <button
            onClick={() => navigate('landing')}
            className="w-full mb-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          
          {/* Navigation */}
          <nav className="space-y-1">
            {docSections.map(section => renderSidebarItem(section))}
          </nav>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 p-2 bg-gray-800 rounded-lg z-40"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-6 py-12">
          {/* Breadcrumbs and Navigation */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <button
                onClick={() => navigate('landing')}
                className="hover:text-white transition-colors"
              >
                Home
              </button>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">Documentation</span>
              {activeSection && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-white">
                    {findSection(docSections, activeSection)?.title}
                  </span>
                </>
              )}
            </div>
            <button
              onClick={() => navigate('landing')}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Exit Docs</span>
            </button>
          </div>
          
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {getCurrentContent()}
          </motion.div>
        </div>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}

export default DocumentationCenter