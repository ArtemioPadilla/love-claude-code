import { AuthProvider, User, ProviderConfig } from '../types.js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

interface UserRecord extends User {
  passwordHash: string
}

/**
 * Local authentication provider using JSON file storage
 */
export class LocalAuthProvider implements AuthProvider {
  private config: ProviderConfig
  private users: Map<string, UserRecord> = new Map()
  private usersByEmail: Map<string, string> = new Map() // email -> userId
  private dataPath: string
  private jwtSecret: string
  
  constructor(config: ProviderConfig) {
    this.config = config
    this.dataPath = path.join(
      config.options?.databasePath || './data/db',
      config.projectId,
      'auth.json'
    )
    this.jwtSecret = process.env.JWT_SECRET || 'local-dev-secret-change-in-production'
  }
  
  async initialize(): Promise<void> {
    // Ensure data directory exists
    await fs.mkdir(path.dirname(this.dataPath), { recursive: true })
    
    // Load existing users
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8')
      const users = JSON.parse(data) as UserRecord[]
      
      users.forEach(user => {
        this.users.set(user.id, user)
        this.usersByEmail.set(user.email, user.id)
      })
    } catch (error) {
      // File doesn't exist yet, that's OK
      if ((error as any).code !== 'ENOENT') {
        console.error('Error loading auth data:', error)
      }
    }
  }
  
  async shutdown(): Promise<void> {
    // Save any pending changes
    await this.saveUsers()
  }
  
  private async saveUsers(): Promise<void> {
    const users = Array.from(this.users.values())
    await fs.writeFile(this.dataPath, JSON.stringify(users, null, 2))
  }
  
  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex')
  }
  
  private generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id, email: user.email },
      this.jwtSecret,
      { expiresIn: '7d' }
    )
  }
  
  async signUp(email: string, password: string, name?: string): Promise<{ user: User; token: string }> {
    // Check if user already exists
    if (this.usersByEmail.has(email)) {
      throw new Error('User already exists')
    }
    
    const now = new Date()
    const userRecord: UserRecord = {
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash: this.hashPassword(password),
      createdAt: now,
      updatedAt: now,
    }
    
    // Store user
    this.users.set(userRecord.id, userRecord)
    this.usersByEmail.set(email, userRecord.id)
    await this.saveUsers()
    
    // Create user object without password
    const user: User = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt,
    }
    
    const token = this.generateToken(user)
    
    return { user, token }
  }
  
  async signIn(email: string, password: string): Promise<{ user: User; token: string }> {
    const userId = this.usersByEmail.get(email)
    if (!userId) {
      throw new Error('Invalid credentials')
    }
    
    const userRecord = this.users.get(userId)
    if (!userRecord || userRecord.passwordHash !== this.hashPassword(password)) {
      throw new Error('Invalid credentials')
    }
    
    const user: User = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt,
    }
    
    const token = this.generateToken(user)
    
    return { user, token }
  }
  
  async signOut(userId: string): Promise<void> {
    // In a real implementation, you might want to invalidate the token
    // For now, this is a no-op since JWTs are stateless
  }
  
  async verifyToken(token: string): Promise<User> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as any
      const userRecord = this.users.get(payload.userId)
      
      if (!userRecord) {
        throw new Error('User not found')
      }
      
      return {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        createdAt: userRecord.createdAt,
        updatedAt: userRecord.updatedAt,
      }
    } catch (error) {
      throw new Error('Invalid token')
    }
  }
  
  async getCurrentUser(token: string): Promise<User | null> {
    try {
      return await this.verifyToken(token)
    } catch {
      return null
    }
  }
  
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const userRecord = this.users.get(userId)
    if (!userRecord) {
      throw new Error('User not found')
    }
    
    // Update user record
    Object.assign(userRecord, updates, { updatedAt: new Date() })
    
    // If email changed, update index
    if (updates.email && updates.email !== userRecord.email) {
      this.usersByEmail.delete(userRecord.email)
      this.usersByEmail.set(updates.email, userId)
    }
    
    await this.saveUsers()
    
    return {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt,
    }
  }
  
  async deleteUser(userId: string): Promise<void> {
    const userRecord = this.users.get(userId)
    if (!userRecord) {
      throw new Error('User not found')
    }
    
    this.users.delete(userId)
    this.usersByEmail.delete(userRecord.email)
    await this.saveUsers()
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      // Check if we can access the data file
      await fs.access(path.dirname(this.dataPath))
      return { status: 'healthy', details: { userCount: this.users.size } }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: 'Cannot access auth data directory' }
      }
    }
  }
}