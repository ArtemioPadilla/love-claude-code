import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Organization,
  Team,
  License,
  UsageMetrics,
  EnterprisePlan,
  Role
} from '../services/enterprise/enterpriseConfig'
import { SSOConfiguration } from '../services/auth/ssoService'
import { AuditEntry } from '../services/audit/auditService'

interface User {
  id: string
  email: string
  name: string
  role: Role
  organizationId: string
  teamIds: string[]
  avatar?: string
  lastLogin?: Date
  createdAt: Date
}

interface EnterpriseState {
  // Current context
  currentOrganization: Organization | null
  currentUser: User | null
  currentTeam: Team | null
  
  // Organization data
  organizations: Organization[]
  teams: Team[]
  users: User[]
  licenses: License[]
  
  // SSO
  ssoConfigurations: SSOConfiguration[]
  ssoSession: any | null
  
  // Usage & Analytics
  usageMetrics: UsageMetrics | null
  auditEntries: AuditEntry[]
  
  // UI State
  isLoading: boolean
  error: string | null
  notifications: {
    id: string
    type: 'info' | 'warning' | 'error' | 'success'
    message: string
    timestamp: Date
  }[]
}

interface EnterpriseActions {
  // Organization actions
  setCurrentOrganization: (org: Organization | null) => void
  updateOrganization: (id: string, updates: Partial<Organization>) => void
  addOrganization: (org: Organization) => void
  
  // User actions
  setCurrentUser: (user: User | null) => void
  updateUser: (id: string, updates: Partial<User>) => void
  addUser: (user: User) => void
  removeUser: (id: string) => void
  
  // Team actions
  setCurrentTeam: (team: Team | null) => void
  setTeams: (teams: Team[]) => void
  addTeam: (team: Team) => void
  updateTeam: (id: string, updates: Partial<Team>) => void
  removeTeam: (id: string) => void
  
  // SSO actions
  setSSOConfigurations: (configs: SSOConfiguration[]) => void
  addSSOConfiguration: (config: SSOConfiguration) => void
  updateSSOConfiguration: (id: string, updates: Partial<SSOConfiguration>) => void
  removeSSOConfiguration: (id: string) => void
  setSSOSession: (session: any | null) => void
  
  // Usage & Analytics
  setUsageMetrics: (metrics: UsageMetrics | null) => void
  addAuditEntry: (entry: AuditEntry) => void
  setAuditEntries: (entries: AuditEntry[]) => void
  
  // License actions
  setLicenses: (licenses: License[]) => void
  updateLicense: (id: string, updates: Partial<License>) => void
  
  // Notifications
  addNotification: (notification: Omit<EnterpriseState['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // UI State
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Utils
  reset: () => void
  hasPermission: (resource: string, action: string) => boolean
  isTeamMember: (teamId: string) => boolean
  isOrganizationAdmin: () => boolean
}

type EnterpriseStore = EnterpriseState & EnterpriseActions

const initialState: EnterpriseState = {
  currentOrganization: null,
  currentUser: null,
  currentTeam: null,
  organizations: [],
  teams: [],
  users: [],
  licenses: [],
  ssoConfigurations: [],
  ssoSession: null,
  usageMetrics: null,
  auditEntries: [],
  isLoading: false,
  error: null,
  notifications: []
}

export const useEnterpriseStore = create<EnterpriseStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Organization actions
      setCurrentOrganization: (org) => set({ currentOrganization: org }),
      updateOrganization: (id, updates) => set((state) => ({
        organizations: state.organizations.map(o => 
          o.id === id ? { ...o, ...updates } : o
        ),
        currentOrganization: state.currentOrganization?.id === id
          ? { ...state.currentOrganization, ...updates }
          : state.currentOrganization
      })),
      addOrganization: (org) => set((state) => ({
        organizations: [...state.organizations, org]
      })),

      // User actions
      setCurrentUser: (user) => set({ currentUser: user }),
      updateUser: (id, updates) => set((state) => ({
        users: state.users.map(u => 
          u.id === id ? { ...u, ...updates } : u
        ),
        currentUser: state.currentUser?.id === id
          ? { ...state.currentUser, ...updates }
          : state.currentUser
      })),
      addUser: (user) => set((state) => ({
        users: [...state.users, user]
      })),
      removeUser: (id) => set((state) => ({
        users: state.users.filter(u => u.id !== id)
      })),

      // Team actions
      setCurrentTeam: (team) => set({ currentTeam: team }),
      setTeams: (teams) => set({ teams }),
      addTeam: (team) => set((state) => ({
        teams: [...state.teams, team]
      })),
      updateTeam: (id, updates) => set((state) => ({
        teams: state.teams.map(t => 
          t.id === id ? { ...t, ...updates } : t
        ),
        currentTeam: state.currentTeam?.id === id
          ? { ...state.currentTeam, ...updates }
          : state.currentTeam
      })),
      removeTeam: (id) => set((state) => ({
        teams: state.teams.filter(t => t.id !== id),
        currentTeam: state.currentTeam?.id === id ? null : state.currentTeam
      })),

      // SSO actions
      setSSOConfigurations: (configs) => set({ ssoConfigurations: configs }),
      addSSOConfiguration: (config) => set((state) => ({
        ssoConfigurations: [...state.ssoConfigurations, config]
      })),
      updateSSOConfiguration: (id, updates) => set((state) => ({
        ssoConfigurations: state.ssoConfigurations.map(c => 
          c.id === id ? { ...c, ...updates } : c
        )
      })),
      removeSSOConfiguration: (id) => set((state) => ({
        ssoConfigurations: state.ssoConfigurations.filter(c => c.id !== id)
      })),
      setSSOSession: (session) => set({ ssoSession: session }),

      // Usage & Analytics
      setUsageMetrics: (metrics) => set({ usageMetrics: metrics }),
      addAuditEntry: (entry) => set((state) => ({
        auditEntries: [entry, ...state.auditEntries].slice(0, 1000) // Keep last 1000
      })),
      setAuditEntries: (entries) => set({ auditEntries: entries }),

      // License actions
      setLicenses: (licenses) => set({ licenses }),
      updateLicense: (id, updates) => set((state) => ({
        licenses: state.licenses.map(l => 
          l.id === id ? { ...l, ...updates } : l
        )
      })),

      // Notifications
      addNotification: (notification) => set((state) => {
        const newNotification = {
          ...notification,
          id: `notif-${Date.now()}`,
          timestamp: new Date()
        }
        return {
          notifications: [newNotification, ...state.notifications].slice(0, 50) // Keep last 50
        }
      }),
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      clearNotifications: () => set({ notifications: [] }),

      // UI State
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Utils
      reset: () => set(initialState),
      
      hasPermission: (resource, action) => {
        const { currentUser, currentOrganization } = get()
        if (!currentUser || !currentOrganization) return false
        
        // Owner has all permissions
        if (currentUser.role === Role.OWNER) return true
        
        // Admin has most permissions
        if (currentUser.role === Role.ADMIN) {
          return resource !== 'billing' && resource !== 'organization.delete'
        }
        
        // Developer permissions
        if (currentUser.role === Role.DEVELOPER) {
          const allowedResources = ['constructs', 'projects', 'teams']
          const allowedActions = ['create', 'read', 'update']
          return allowedResources.includes(resource) && allowedActions.includes(action)
        }
        
        // Viewer permissions
        if (currentUser.role === Role.VIEWER) {
          return action === 'read'
        }
        
        // Guest permissions
        if (currentUser.role === Role.GUEST) {
          return resource === 'public_constructs' && action === 'read'
        }
        
        return false
      },
      
      isTeamMember: (teamId) => {
        const { currentUser, teams } = get()
        if (!currentUser) return false
        
        const team = teams.find(t => t.id === teamId)
        if (!team) return false
        
        return team.leaderId === currentUser.id || team.memberIds.includes(currentUser.id)
      },
      
      isOrganizationAdmin: () => {
        const { currentUser } = get()
        if (!currentUser) return false
        
        return currentUser.role === Role.OWNER || currentUser.role === Role.ADMIN
      }
    }),
    {
      name: 'enterprise-store',
      partialize: (state) => ({
        currentOrganization: state.currentOrganization,
        currentUser: state.currentUser,
        ssoSession: state.ssoSession
      })
    }
  )
)

// Selectors
export const selectCurrentOrganization = (state: EnterpriseStore) => state.currentOrganization
export const selectCurrentUser = (state: EnterpriseStore) => state.currentUser
export const selectCurrentTeam = (state: EnterpriseStore) => state.currentTeam
export const selectUserTeams = (state: EnterpriseStore) => {
  if (!state.currentUser) return []
  return state.teams.filter(team => 
    team.leaderId === state.currentUser!.id || 
    team.memberIds.includes(state.currentUser!.id)
  )
}
export const selectOrganizationUsers = (state: EnterpriseStore) => {
  if (!state.currentOrganization) return []
  return state.users.filter(user => user.organizationId === state.currentOrganization!.id)
}
export const selectActiveLicense = (state: EnterpriseStore) => {
  if (!state.currentOrganization) return null
  return state.licenses.find(license => 
    license.organizationId === state.currentOrganization!.id &&
    license.status === 'active'
  )
}