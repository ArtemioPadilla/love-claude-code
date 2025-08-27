import React from 'react'
import { motion } from 'framer-motion'
import { 
  Github, Twitter, Linkedin, Mail, Heart, 
  ExternalLink, Book, Code2, Shield, Cloud,
  FileText, Zap, GitBranch
} from 'lucide-react'
import { useNavigationStore } from '../Navigation'

interface FooterLink {
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  href?: string
  external?: boolean
}

const Footer: React.FC = () => {
  const { navigate } = useNavigationStore()
  
  const currentYear = new Date().getFullYear()
  
  const footerSections: { title: string; links: FooterLink[] }[] = [
    {
      title: 'Product',
      links: [
        { label: 'Features', icon: <Zap className="w-3 h-3" />, onClick: () => navigate('landing') },
        { label: 'Providers', icon: <Cloud className="w-3 h-3" />, onClick: () => navigate('docs', { docSection: 'providers' }) },
        { label: 'Pricing', icon: <FileText className="w-3 h-3" />, onClick: () => navigate('landing') },
        { label: 'Roadmap', icon: <GitBranch className="w-3 h-3" />, onClick: () => navigate('roadmap') }
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', icon: <Book className="w-3 h-3" />, onClick: () => navigate('docs') },
        { label: 'API Reference', icon: <Code2 className="w-3 h-3" />, onClick: () => navigate('docs', { docSection: 'api' }) },
        { label: 'Getting Started', icon: <FileText className="w-3 h-3" />, onClick: () => navigate('docs', { docSection: 'getting-started' }) },
        { label: 'Security', icon: <Shield className="w-3 h-3" />, onClick: () => navigate('docs', { docSection: 'security' }) }
      ]
    },
    {
      title: 'Community',
      links: [
        { label: 'GitHub', icon: <Github className="w-3 h-3" />, href: 'https://github.com/love-claude-code/love-claude-code', external: true },
        { label: 'Discord', icon: <ExternalLink className="w-3 h-3" />, href: '#', external: true },
        { label: 'Twitter', icon: <Twitter className="w-3 h-3" />, href: '#', external: true },
        { label: 'Blog', icon: <FileText className="w-3 h-3" />, href: '#', external: true }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', onClick: () => navigate('privacy') },
        { label: 'Terms of Service', onClick: () => navigate('terms') },
        { label: 'License', href: 'https://github.com/love-claude-code/love-claude-code/blob/main/LICENSE', external: true },
        { label: 'Contact', icon: <Mail className="w-3 h-3" />, href: 'mailto:support@love-claude-code.dev' }
      ]
    }
  ]
  
  const socialLinks = [
    { icon: <Github className="w-5 h-5" />, href: 'https://github.com/love-claude-code', label: 'GitHub' },
    { icon: <Twitter className="w-5 h-5" />, href: '#', label: 'Twitter' },
    { icon: <Linkedin className="w-5 h-5" />, href: '#', label: 'LinkedIn' }
  ]
  
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Code2 className="w-8 h-8 text-blue-500" />
              <h3 className="text-xl font-bold">Love Claude Code</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Build full-stack applications through conversation with Claude AI.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
                  aria-label={link.label}
                >
                  {link.icon}
                </motion.a>
              ))}
            </div>
          </div>
          
          {/* Links Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold mb-4 text-gray-200">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-colors"
                      >
                        {link.icon}
                        <span>{link.label}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : link.href ? (
                      <a
                        href={link.href}
                        className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-colors"
                      >
                        {link.icon}
                        <span>{link.label}</span>
                      </a>
                    ) : (
                      <button
                        onClick={link.onClick}
                        className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-colors"
                      >
                        {link.icon}
                        <span>{link.label}</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Newsletter Section */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="max-w-md mx-auto text-center">
            <h4 className="text-lg font-semibold mb-2">Stay Updated</h4>
            <p className="text-gray-400 text-sm mb-4">
              Get the latest updates on new features and improvements
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Subscribe
              </motion.button>
            </form>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-400 text-sm flex items-center gap-1">
            <span>© {currentYear} Love Claude Code. Built with</span>
            <Heart className="w-4 h-4 text-red-500 animate-pulse" />
            <span>and AI</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a
              href="https://anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              Powered by Claude
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-gray-600">|</span>
            <a
              href="https://github.com/love-claude-code/love-claude-code/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              MIT License
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer