import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Code2, Zap, Cloud, Shield, Sparkles, ChevronRight, Check, Terminal, Globe, Layers, Users, Package } from 'lucide-react'
import { useNavigate } from '../Navigation'
import Footer from '../Layout/Footer'
import { useUserPreferencesStore } from '@stores/userPreferencesStore'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const { preferences } = useUserPreferencesStore()
  
  useEffect(() => {
    // If user hasn't completed onboarding, redirect to onboarding
    if (!preferences.hasCompletedOnboarding) {
      navigate('onboarding')
    }
  }, [preferences.hasCompletedOnboarding, navigate])

  const features = [
    {
      icon: <Code2 className="w-6 h-6" />,
      title: 'AI-Powered Development',
      description: 'Build applications through natural conversation with Claude, your AI coding assistant.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Real-Time Preview',
      description: 'See your changes instantly with hot-reload preview and live code execution.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Cloud className="w-6 h-6" />,
      title: 'Multi-Cloud Support',
      description: 'Deploy to Local, Firebase, or AWS with a single click. No vendor lock-in.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Enterprise Ready',
      description: 'Built-in security, monitoring, and scalability for production workloads.',
      color: 'from-orange-500 to-red-500'
    }
  ]

  const providers = [
    {
      name: 'Local',
      description: 'Zero-config development',
      features: ['No setup required', 'File-based storage', 'Perfect for prototyping'],
      icon: '💻'
    },
    {
      name: 'Firebase',
      description: 'Rapid deployment',
      features: ['Real-time sync', 'Built-in auth', 'Serverless scaling'],
      icon: '🔥'
    },
    {
      name: 'AWS',
      description: 'Enterprise scale',
      features: ['Maximum control', 'Global infrastructure', 'Cost optimization'],
      icon: '☁️'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-pulse" />
        </div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">Powered by Claude AI</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Love Claude Code
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
              Build full-stack applications through conversation. 
              Let Claude be your AI pair programmer.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('projects')}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold text-lg flex items-center gap-2 justify-center hover:shadow-lg hover:shadow-purple-500/25 transition-shadow"
              >
                Start Building
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('constructs')}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg font-semibold text-lg flex items-center gap-2 justify-center hover:shadow-lg hover:shadow-pink-500/25 transition-shadow"
              >
                Browse Constructs
                <Package className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('docs')}
                className="px-8 py-4 bg-gray-800 border border-gray-700 rounded-lg font-semibold text-lg flex items-center gap-2 justify-center hover:bg-gray-700 transition-colors"
              >
                View Documentation
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Build Faster, Ship Smarter</h2>
            <p className="text-xl text-gray-400">Everything you need to go from idea to production</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Provider Comparison */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Choose Your Backend</h2>
            <p className="text-xl text-gray-400">Start local, scale globally. Switch providers anytime.</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {providers.map((provider, index) => (
              <motion.div
                key={provider.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-800 rounded-xl p-8 hover:bg-gray-750 transition-colors border border-gray-700"
              >
                <div className="text-4xl mb-4">{provider.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{provider.name}</h3>
                <p className="text-gray-400 mb-6">{provider.description}</p>
                <ul className="space-y-3">
                  {provider.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Construct Catalog Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-purple-900/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Infrastructure as Constructs
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Browse our comprehensive catalog of reusable infrastructure constructs. 
              From L0 primitives to L3 complete applications, deploy with confidence.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20"
            >
              <div className="text-3xl font-bold text-purple-400 mb-2">L0</div>
              <h3 className="text-lg font-semibold mb-2">Primitives</h3>
              <p className="text-gray-400 text-sm">Direct cloud resource mappings with minimal abstraction</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20"
            >
              <div className="text-3xl font-bold text-purple-400 mb-2">L1</div>
              <h3 className="text-lg font-semibold mb-2">Foundation</h3>
              <p className="text-gray-400 text-sm">Secure defaults and best practices baked in</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20"
            >
              <div className="text-3xl font-bold text-purple-400 mb-2">L2</div>
              <h3 className="text-lg font-semibold mb-2">Patterns</h3>
              <p className="text-gray-400 text-sm">Common architectural patterns ready to deploy</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20"
            >
              <div className="text-3xl font-bold text-purple-400 mb-2">L3</div>
              <h3 className="text-lg font-semibold mb-2">Applications</h3>
              <p className="text-gray-400 text-sm">Complete solutions for SaaS, E-commerce, and more</p>
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('constructs')}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg font-semibold text-lg flex items-center gap-2 mx-auto hover:shadow-lg hover:shadow-purple-500/25 transition-shadow"
            >
              Explore Construct Catalog
              <Package className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Code Demo Section */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h2 className="text-4xl font-bold mb-6">Code with Natural Language</h2>
              <p className="text-xl text-gray-400 mb-8">
                Simply describe what you want to build, and Claude will generate the code for you. 
                Review, edit, and deploy - all in one integrated environment.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Terminal className="w-6 h-6 text-blue-500" />
                  <span className="text-lg">Integrated terminal for command execution</span>
                </div>
                <div className="flex items-center gap-4">
                  <Globe className="w-6 h-6 text-green-500" />
                  <span className="text-lg">Live preview with hot reload</span>
                </div>
                <div className="flex items-center gap-4">
                  <Layers className="w-6 h-6 text-purple-500" />
                  <span className="text-lg">Multi-file project support</span>
                </div>
                <div className="flex items-center gap-4">
                  <Users className="w-6 h-6 text-orange-500" />
                  <span className="text-lg">Collaborative AI assistance</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-xl opacity-20" />
              <div className="relative bg-gray-900 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
                <pre className="text-sm overflow-x-auto">
                  <code className="text-gray-300">{`// Chat with Claude
You: "Create a React component for a todo list"

// Claude generates:
import React, { useState } from 'react'

function TodoList() {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { 
        id: Date.now(), 
        text: input, 
        done: false 
      }])
      setInput('')
    }
  }

  return (
    <div className="todo-list">
      {/* Component implementation */}
    </div>
  )
}`}</code>
                </pre>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl font-bold mb-6">Ready to Start Building?</h2>
          <p className="text-xl text-gray-400 mb-12">
            Join thousands of developers who are building faster with AI assistance.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('projects')}
            className="px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold text-xl flex items-center gap-3 mx-auto hover:shadow-lg hover:shadow-purple-500/25 transition-shadow"
          >
            Get Started Free
            <ArrowRight className="w-6 h-6" />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default LandingPage