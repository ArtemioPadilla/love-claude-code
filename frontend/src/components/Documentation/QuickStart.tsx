import { motion } from 'framer-motion'
import { FiCode, FiMessageSquare, FiPlay, FiFolder } from 'react-icons/fi'

export function QuickStart() {
  const steps = [
    {
      icon: FiMessageSquare,
      title: 'Start a Conversation',
      description: 'Open the chat panel and describe what you want to build in natural language.'
    },
    {
      icon: FiCode,
      title: 'Review Generated Code',
      description: 'Claude will generate code based on your description. Review and edit as needed.'
    },
    {
      icon: FiPlay,
      title: 'Preview Your App',
      description: 'See your changes instantly in the live preview panel on the right.'
    },
    {
      icon: FiFolder,
      title: 'Organize Your Files',
      description: 'Use the file explorer to create, rename, and organize your project structure.'
    }
  ]
  
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold mb-4 gradient-text">
          Welcome to Love Claude Code
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          The AI-first development platform that transforms conversations into code. 
          Build amazing applications by simply describing what you want.
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card/50 border border-border rounded-lg p-6 hover:border-primary/50 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <step.icon className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-6 bg-primary/10 border border-primary/30 rounded-lg"
      >
        <h3 className="font-semibold mb-2">🚀 Quick Tip</h3>
        <p className="text-sm">
          Try starting with "Create a simple todo app with React" to see Love Claude Code in action!
        </p>
      </motion.div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Key Features</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <div>
              <strong>Natural Language Coding:</strong> Describe your ideas in plain English
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <div>
              <strong>Real-time Preview:</strong> See changes instantly as you code
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <div>
              <strong>Full IDE Features:</strong> Syntax highlighting, IntelliSense, and more
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <div>
              <strong>Project Management:</strong> Organize multiple projects with ease
            </div>
          </li>
        </ul>
      </div>
    </div>
  )
}