export interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: 'frontend' | 'backend' | 'fullstack' | 'ai' | 'other'
  icon: string
  tags: string[]
  files: {
    path: string
    content: string
  }[]
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
}

export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'react-spa',
    name: 'React Single Page App',
    description: 'Modern React app with TypeScript, routing, and state management',
    category: 'frontend',
    icon: '⚛️',
    tags: ['react', 'typescript', 'spa', 'vite'],
    files: [
      {
        path: '/src/App.tsx',
        content: `import React from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Your React App</h1>
        <p>Built with Love Claude Code</p>
      </header>
    </div>
  )
}

export default App`
      },
      {
        path: '/src/main.tsx',
        content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
      },
      {
        path: '/src/App.css',
        content: `.App {
  text-align: center;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #282c34;
  color: white;
}

.App-header {
  font-size: calc(10px + 2vmin);
}`
      },
      {
        path: '/src/index.css',
        content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`
      },
      {
        path: '/index.html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
      },
      {
        path: '/package.json',
        content: JSON.stringify({
          name: 'react-app',
          version: '0.1.0',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'tsc && vite build',
            preview: 'vite preview'
          }
        }, null, 2)
      },
      {
        path: '/tsconfig.json',
        content: JSON.stringify({
          compilerOptions: {
            target: 'ES2020',
            useDefineForClassFields: true,
            lib: ['ES2020', 'DOM', 'DOM.Iterable'],
            module: 'ESNext',
            skipLibCheck: true,
            moduleResolution: 'bundler',
            allowImportingTsExtensions: true,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: 'react-jsx',
            strict: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noFallthroughCasesInSwitch: true
          },
          include: ['src'],
          references: [{ path: './tsconfig.node.json' }]
        }, null, 2)
      },
      {
        path: '/vite.config.ts',
        content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`
      }
    ],
    dependencies: {
      'react': '^18.2.0',
      'react-dom': '^18.2.0'
    },
    devDependencies: {
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      '@vitejs/plugin-react': '^4.0.0',
      'typescript': '^5.0.0',
      'vite': '^5.0.0'
    }
  },
  {
    id: 'node-api',
    name: 'Node.js REST API',
    description: 'Express.js API with TypeScript, authentication, and database',
    category: 'backend',
    icon: '🚀',
    tags: ['node', 'express', 'typescript', 'api', 'rest'],
    files: [
      {
        path: '/src/index.ts',
        content: `import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config'
import { apiRouter } from './routes'

const app = express()

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Routes
app.use('/api', apiRouter)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
const PORT = config.port || 3001
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`)
})`
      },
      {
        path: '/src/config.ts',
        content: `export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  databaseUrl: process.env.DATABASE_URL || 'sqlite::memory:'
}`
      },
      {
        path: '/src/routes/index.ts',
        content: `import { Router } from 'express'
import { userRouter } from './users'

export const apiRouter = Router()

apiRouter.use('/users', userRouter)

apiRouter.get('/', (req, res) => {
  res.json({
    message: 'API is running',
    version: '1.0.0'
  })
})`
      },
      {
        path: '/src/routes/users.ts',
        content: `import { Router } from 'express'

export const userRouter = Router()

// Get all users
userRouter.get('/', async (req, res) => {
  res.json({
    users: [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ]
  })
})

// Get user by ID
userRouter.get('/:id', async (req, res) => {
  const { id } = req.params
  res.json({
    id: Number(id),
    name: 'John Doe',
    email: 'john@example.com'
  })
})

// Create user
userRouter.post('/', async (req, res) => {
  const { name, email } = req.body
  res.status(201).json({
    id: Date.now(),
    name,
    email
  })
})`
      },
      {
        path: '/package.json',
        content: JSON.stringify({
          name: 'node-api',
          version: '1.0.0',
          type: 'module',
          scripts: {
            dev: 'tsx watch src/index.ts',
            build: 'tsc',
            start: 'node dist/index.js'
          }
        }, null, 2)
      },
      {
        path: '/tsconfig.json',
        content: JSON.stringify({
          compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            moduleResolution: 'node',
            lib: ['ES2022'],
            outDir: './dist',
            rootDir: './src',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            resolveJsonModule: true,
            noEmit: false,
            allowSyntheticDefaultImports: true
          },
          include: ['src/**/*'],
          exclude: ['node_modules', 'dist']
        }, null, 2)
      }
    ],
    dependencies: {
      'express': '^4.18.0',
      'cors': '^2.8.5',
      'helmet': '^7.0.0',
      'dotenv': '^16.0.0'
    },
    devDependencies: {
      '@types/express': '^4.17.0',
      '@types/cors': '^2.8.0',
      '@types/node': '^20.0.0',
      'typescript': '^5.0.0',
      'tsx': '^4.0.0'
    }
  },
  {
    id: 'fullstack-app',
    name: 'Full Stack Application',
    description: 'React frontend with Node.js backend, ready for production',
    category: 'fullstack',
    icon: '🎯',
    tags: ['react', 'node', 'fullstack', 'typescript', 'monorepo'],
    files: [
      {
        path: '/package.json',
        content: JSON.stringify({
          name: 'fullstack-app',
          version: '1.0.0',
          private: true,
          workspaces: ['frontend', 'backend'],
          scripts: {
            dev: 'concurrently "npm run dev:frontend" "npm run dev:backend"',
            'dev:frontend': 'cd frontend && npm run dev',
            'dev:backend': 'cd backend && npm run dev',
            build: 'npm run build:frontend && npm run build:backend',
            'build:frontend': 'cd frontend && npm run build',
            'build:backend': 'cd backend && npm run build'
          },
          devDependencies: {
            concurrently: '^8.0.0'
          }
        }, null, 2)
      },
      {
        path: '/frontend/package.json',
        content: JSON.stringify({
          name: '@fullstack/frontend',
          version: '0.1.0',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'tsc && vite build',
            preview: 'vite preview'
          }
        }, null, 2)
      },
      {
        path: '/frontend/src/App.tsx',
        content: `import React, { useState, useEffect } from 'react'
import './App.css'

interface User {
  id: number
  name: string
  email: string
}

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users')
      const data = await response.json()
      setUsers(data.users)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="App">
      <h1>Full Stack App</h1>
      <h2>Users</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {users.map(user => (
            <li key={user.id}>
              {user.name} - {user.email}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App`
      },
      {
        path: '/backend/package.json',
        content: JSON.stringify({
          name: '@fullstack/backend',
          version: '1.0.0',
          type: 'module',
          scripts: {
            dev: 'tsx watch src/index.ts',
            build: 'tsc',
            start: 'node dist/index.js'
          }
        }, null, 2)
      },
      {
        path: '/backend/src/index.ts',
        content: `import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/users', (req, res) => {
  res.json({
    users: [
      { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
      { id: 2, name: 'Bob Williams', email: 'bob@example.com' }
    ]
  })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(\`Backend server running on port \${PORT}\`)
})`
      },
      {
        path: '/README.md',
        content: `# Full Stack Application

A modern full-stack application with React frontend and Node.js backend.

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Start development servers:
\`\`\`bash
npm run dev
\`\`\`

3. Open http://localhost:5173 in your browser

## Structure

- \`/frontend\` - React application
- \`/backend\` - Node.js API server

Built with Love Claude Code 💜`
      }
    ]
  },
  {
    id: 'python-flask',
    name: 'Python Flask API',
    description: 'RESTful API with Flask, SQLAlchemy, and authentication',
    category: 'backend',
    icon: '🐍',
    tags: ['python', 'flask', 'api', 'rest'],
    files: [
      {
        path: '/app.py',
        content: `from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Sample data
users = [
    {'id': 1, 'name': 'Alice', 'email': 'alice@example.com'},
    {'id': 2, 'name': 'Bob', 'email': 'bob@example.com'}
]

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/users', methods=['GET'])
def get_users():
    return jsonify({'users': users})

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = next((u for u in users if u['id'] == user_id), None)
    if user:
        return jsonify(user)
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json()
    new_user = {
        'id': len(users) + 1,
        'name': data.get('name'),
        'email': data.get('email')
    }
    users.append(new_user)
    return jsonify(new_user), 201

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, port=port)`
      },
      {
        path: '/requirements.txt',
        content: `Flask==3.0.0
Flask-CORS==4.0.0
python-dotenv==1.0.0
gunicorn==21.2.0`
      },
      {
        path: '/.env.example',
        content: `FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///app.db`
      },
      {
        path: '/README.md',
        content: `# Python Flask API

A simple RESTful API built with Flask.

## Setup

1. Create virtual environment:
\`\`\`bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
\`\`\`

2. Install dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

3. Run the server:
\`\`\`bash
python app.py
\`\`\`

API will be available at http://localhost:5000

## Endpoints

- GET /health - Health check
- GET /api/users - List all users
- GET /api/users/:id - Get user by ID
- POST /api/users - Create new user`
      }
    ]
  },
  {
    id: 'ai-chatbot',
    name: 'AI Chatbot Interface',
    description: 'Chat interface with Claude integration and streaming responses',
    category: 'ai',
    icon: '🤖',
    tags: ['ai', 'claude', 'chat', 'streaming'],
    files: [
      {
        path: '/src/App.tsx',
        content: `import React, { useState } from 'react'
import ChatInterface from './components/ChatInterface'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Assistant</h1>
        <p>Powered by Claude</p>
      </header>
      <main>
        <ChatInterface />
      </main>
    </div>
  )
}

export default App`
      },
      {
        path: '/src/components/ChatInterface.tsx',
        content: `import React, { useState, useRef, useEffect } from 'react'
import './ChatInterface.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // TODO: Integrate with Claude API
      // For now, simulate a response
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: \`I received your message: "\${input}". This is a demo response. Integrate with Claude API for real responses.\`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error sending message:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-container">
      <div className="messages-list">
        {messages.map((message) => (
          <div
            key={message.id}
            className={\`message \${message.role}\`}
          >
            <div className="message-content">{message.content}</div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant loading">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button onClick={sendMessage} disabled={isLoading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  )
}

export default ChatInterface`
      },
      {
        path: '/src/components/ChatInterface.css',
        content: `.chat-container {
  display: flex;
  flex-direction: column;
  height: 600px;
  max-width: 800px;
  margin: 0 auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f5f5;
}

.message {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.message.user {
  align-items: flex-end;
}

.message.assistant {
  align-items: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message.user .message-content {
  background-color: #007bff;
  color: white;
}

.message-time {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.input-container {
  display: flex;
  padding: 16px;
  background-color: white;
  border-top: 1px solid #ddd;
}

.input-container input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.input-container button {
  margin-left: 8px;
  padding: 12px 24px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.input-container button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-indicator span {
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #666;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.3;
  }
  30% {
    opacity: 1;
  }
}`
      }
    ]
  },
  {
    id: 'static-website',
    name: 'Static Website',
    description: 'Modern static website with responsive design',
    category: 'frontend',
    icon: '🌐',
    tags: ['html', 'css', 'javascript', 'static'],
    files: [
      {
        path: '/index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <nav>
            <div class="logo">My Website</div>
            <ul class="nav-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section id="home" class="hero">
            <h1>Welcome to My Website</h1>
            <p>Built with Love Claude Code</p>
            <button class="cta-button">Get Started</button>
        </section>

        <section id="about" class="about">
            <h2>About Us</h2>
            <p>We create amazing digital experiences.</p>
        </section>

        <section id="services" class="services">
            <h2>Our Services</h2>
            <div class="service-grid">
                <div class="service-card">
                    <h3>Web Design</h3>
                    <p>Beautiful, responsive websites</p>
                </div>
                <div class="service-card">
                    <h3>Development</h3>
                    <p>Custom web applications</p>
                </div>
                <div class="service-card">
                    <h3>Consulting</h3>
                    <p>Expert technical guidance</p>
                </div>
            </div>
        </section>

        <section id="contact" class="contact">
            <h2>Contact Us</h2>
            <form>
                <input type="text" placeholder="Your Name" required>
                <input type="email" placeholder="Your Email" required>
                <textarea placeholder="Your Message" rows="5" required></textarea>
                <button type="submit">Send Message</button>
            </form>
        </section>
    </main>

    <footer>
        <p>&copy; 2024 My Website. All rights reserved.</p>
    </footer>

    <script src="script.js"></script>
</body>
</html>`
      },
      {
        path: '/styles.css',
        content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
}

header {
    background-color: #fff;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 1000;
}

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 5%;
    max-width: 1200px;
    margin: 0 auto;
}

.logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: #007bff;
}

.nav-links {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-links a {
    text-decoration: none;
    color: #333;
    transition: color 0.3s;
}

.nav-links a:hover {
    color: #007bff;
}

main {
    margin-top: 60px;
}

section {
    padding: 4rem 5%;
    max-width: 1200px;
    margin: 0 auto;
}

.hero {
    text-align: center;
    padding: 8rem 5%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.hero h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.cta-button {
    background-color: white;
    color: #667eea;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 2rem;
    transition: transform 0.3s;
}

.cta-button:hover {
    transform: translateY(-2px);
}

.service-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.service-card {
    background-color: #f8f9fa;
    padding: 2rem;
    border-radius: 8px;
    text-align: center;
    transition: transform 0.3s;
}

.service-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.contact form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 500px;
    margin: 2rem auto;
}

.contact input,
.contact textarea {
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

.contact button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s;
}

.contact button:hover {
    background-color: #0056b3;
}

footer {
    background-color: #333;
    color: white;
    text-align: center;
    padding: 2rem;
}

@media (max-width: 768px) {
    .nav-links {
        display: none;
    }
    
    .hero h1 {
        font-size: 2rem;
    }
    
    section {
        padding: 2rem 5%;
    }
}`
      },
      {
        path: '/script.js',
        content: `// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form submission handler
const form = document.querySelector('form');
if (form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Thank you for your message! We will get back to you soon.');
        form.reset();
    });
}

// Add active class to navigation links on scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});`
      }
    ]
  }
]

export function getTemplatesByCategory(category?: string): ProjectTemplate[] {
  if (!category) return projectTemplates
  return projectTemplates.filter(t => t.category === category)
}

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return projectTemplates.find(t => t.id === id)
}