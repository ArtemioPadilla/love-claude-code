import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Code2, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  auth: boolean
  params?: Record<string, { type: string; required: boolean; description: string }>
  body?: Record<string, { type: string; required: boolean; description: string }>
  response: string
}

const APIReference: React.FC = () => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null)
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null)

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text)
    setCopiedEndpoint(endpoint)
    setTimeout(() => setCopiedEndpoint(null), 2000)
  }

  const endpoints: Record<string, APIEndpoint[]> = {
    Authentication: [
      {
        method: 'POST',
        path: '/api/v1/auth/signup',
        description: 'Create a new user account',
        auth: false,
        body: {
          email: { type: 'string', required: true, description: 'User email address' },
          password: { type: 'string', required: true, description: 'User password (min 8 chars)' },
          name: { type: 'string', required: false, description: 'User display name' }
        },
        response: `{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt_token_here"
}`
      },
      {
        method: 'POST',
        path: '/api/v1/auth/signin',
        description: 'Sign in with email and password',
        auth: false,
        body: {
          email: { type: 'string', required: true, description: 'User email address' },
          password: { type: 'string', required: true, description: 'User password' }
        },
        response: `{
  "user": {
    "id": "user_123",
    "email": "user@example.com"
  },
  "token": "jwt_token_here"
}`
      }
    ],
    Projects: [
      {
        method: 'GET',
        path: '/api/v1/projects',
        description: 'List all projects for the authenticated user',
        auth: true,
        response: `{
  "projects": [
    {
      "id": "proj_123",
      "name": "My App",
      "createdAt": "2024-01-01T00:00:00Z",
      "provider": "local"
    }
  ]
}`
      },
      {
        method: 'POST',
        path: '/api/v1/projects',
        description: 'Create a new project',
        auth: true,
        body: {
          name: { type: 'string', required: true, description: 'Project name' },
          description: { type: 'string', required: false, description: 'Project description' },
          provider: { type: 'string', required: false, description: 'Backend provider (local|firebase|aws)' }
        },
        response: `{
  "id": "proj_123",
  "name": "My New App",
  "provider": "local"
}`
      }
    ],
    Files: [
      {
        method: 'GET',
        path: '/api/v1/files/:projectId',
        description: 'Get project file structure',
        auth: true,
        params: {
          projectId: { type: 'string', required: true, description: 'Project ID' }
        },
        response: `{
  "files": [
    {
      "path": "/src/index.js",
      "type": "file",
      "content": "console.log('Hello');"
    }
  ]
}`
      },
      {
        method: 'PUT',
        path: '/api/v1/files/:projectId',
        description: 'Update file content',
        auth: true,
        params: {
          projectId: { type: 'string', required: true, description: 'Project ID' }
        },
        body: {
          path: { type: 'string', required: true, description: 'File path' },
          content: { type: 'string', required: true, description: 'File content' }
        },
        response: `{
  "success": true,
  "path": "/src/index.js"
}`
      }
    ],
    Claude: [
      {
        method: 'POST',
        path: '/api/v1/claude/chat',
        description: 'Send a message to Claude',
        auth: true,
        body: {
          message: { type: 'string', required: true, description: 'User message' },
          projectId: { type: 'string', required: true, description: 'Current project ID' },
          context: { type: 'object', required: false, description: 'Additional context' }
        },
        response: `{
  "response": "Here's the code you requested...",
  "usage": {
    "promptTokens": 150,
    "completionTokens": 200
  }
}`
      }
    ],
    MCP: [
      {
        method: 'POST',
        path: '/api/v1/mcp/analyze',
        description: 'Analyze project requirements',
        auth: true,
        body: {
          projectType: { type: 'string', required: true, description: 'Type of project' },
          expectedUsers: { type: 'number', required: false, description: 'Expected user count' },
          features: { type: 'string[]', required: false, description: 'Required features' }
        },
        response: `{
  "recommendations": {
    "provider": "firebase",
    "estimatedCost": 150,
    "reasons": ["Real-time sync", "Built-in auth"]
  }
}`
      }
    ]
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': {
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      }
      case 'POST': {
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      }
      case 'PUT': {
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      }
      case 'DELETE': {
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      }
      default: {
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
      }
    }
  }

  return (
    <div className="space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
          <Code2 className="w-10 h-10 text-blue-500" />
          API Reference
        </h1>
        <p className="text-xl text-gray-400">
          Complete reference for the Love Claude Code REST API. All endpoints require authentication unless specified.
        </p>
      </motion.div>

      {/* Base URL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-xl font-semibold mb-3">Base URL</h2>
        <div className="flex items-center gap-3">
          <code className="bg-gray-900 px-4 py-2 rounded-lg flex-1">
            http://localhost:3001/api/v1
          </code>
          <button
            onClick={() => copyToClipboard('http://localhost:3001/api/v1', 'base')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {copiedEndpoint === 'base' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </motion.div>

      {/* Authentication */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h2 className="text-xl font-semibold mb-3">Authentication</h2>
        <p className="text-gray-400 mb-4">
          Most endpoints require authentication. Include the JWT token in the Authorization header:
        </p>
        <div className="bg-gray-900 rounded-lg p-4">
          <code className="text-sm text-gray-300">
            Authorization: Bearer YOUR_JWT_TOKEN
          </code>
        </div>
      </motion.div>

      {/* Endpoints */}
      <div className="space-y-8">
        {Object.entries(endpoints).map(([category, categoryEndpoints]) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-2xl font-semibold mb-6">{category}</h2>
            <div className="space-y-4">
              {categoryEndpoints.map((endpoint) => {
                const endpointKey = `${endpoint.method}-${endpoint.path}`
                const isExpanded = expandedEndpoint === endpointKey

                return (
                  <div key={endpointKey} className="bg-gray-800 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedEndpoint(isExpanded ? null : endpointKey)}
                      className="w-full p-6 flex items-center gap-4 hover:bg-gray-750 transition-colors"
                    >
                      <span className={`px-3 py-1 rounded-lg border font-mono text-sm ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method}
                      </span>
                      <code className="flex-1 text-left font-mono text-gray-300">{endpoint.path}</code>
                      {endpoint.auth && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                          Auth Required
                        </span>
                      )}
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 space-y-4 border-t border-gray-700">
                        <p className="text-gray-400 mt-4">{endpoint.description}</p>

                        {endpoint.params && (
                          <div>
                            <h4 className="font-semibold mb-2">URL Parameters</h4>
                            <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                              {Object.entries(endpoint.params).map(([name, param]) => (
                                <div key={name}>
                                  <code className="text-blue-400">{name}</code>
                                  <span className="text-gray-500"> ({param.type})</span>
                                  {param.required && <span className="text-red-400 text-sm"> *required</span>}
                                  <p className="text-gray-400 text-sm mt-1">{param.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {endpoint.body && (
                          <div>
                            <h4 className="font-semibold mb-2">Request Body</h4>
                            <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                              {Object.entries(endpoint.body).map(([name, param]) => (
                                <div key={name}>
                                  <code className="text-blue-400">{name}</code>
                                  <span className="text-gray-500"> ({param.type})</span>
                                  {param.required && <span className="text-red-400 text-sm"> *required</span>}
                                  <p className="text-gray-400 text-sm mt-1">{param.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">Response</h4>
                            <button
                              onClick={() => copyToClipboard(endpoint.response, `${endpointKey}-response`)}
                              className="p-1 hover:bg-gray-700 rounded transition-colors"
                            >
                              {copiedEndpoint === `${endpointKey}-response` ? 
                                <Check className="w-4 h-4 text-green-500" /> : 
                                <Copy className="w-4 h-4" />
                              }
                            </button>
                          </div>
                          <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <code className="text-sm text-gray-300">{endpoint.response}</code>
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* WebSocket API */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-8 border border-blue-700"
      >
        <h2 className="text-2xl font-semibold mb-4">WebSocket API</h2>
        <p className="text-gray-300 mb-4">
          For real-time features, connect to the WebSocket server:
        </p>
        <div className="bg-gray-900 rounded-lg p-4 mb-4">
          <code className="text-sm text-gray-300">ws://localhost:3002</code>
        </div>
        <p className="text-gray-400">
          WebSocket connections are used for terminal sessions, real-time collaboration, and live updates.
        </p>
      </motion.div>
    </div>
  )
}

export default APIReference