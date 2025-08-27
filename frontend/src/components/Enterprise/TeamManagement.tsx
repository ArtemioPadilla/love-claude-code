import React, { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  UserPlus,
  UserMinus,
  Settings,
  Shield,
  Package,
  Database,
  Clock,
  ChevronRight,
  Check,
  X,
  AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { enterpriseConfig, Team, TeamSettings, TeamQuotas } from '../../services/enterprise/enterpriseConfig'
import { useEnterpriseStore } from '../../stores/enterpriseStore'

interface TeamFormData {
  name: string
  description: string
  settings: TeamSettings
  quotas: TeamQuotas
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  joinedAt: Date
}

export const TeamManagement: React.FC = () => {
  const { currentOrganization, teams, setTeams, currentUser } = useEnterpriseStore()
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({})
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    description: '',
    settings: {
      visibility: 'organization',
      allowMemberInvites: true,
      requireApproval: false,
      constructSharing: 'read',
      defaultConstructAccess: 'team'
    },
    quotas: {
      maxMembers: 10,
      maxConstructs: 50,
      maxStorageGB: 10,
      maxComputeHours: 100,
      maxApiCalls: 10000
    }
  })

  useEffect(() => {
    loadTeams()
  }, [currentOrganization])

  useEffect(() => {
    // Load members for each team (mock data)
    const mockMembers: Record<string, TeamMember[]> = {}
    teams.forEach(team => {
      mockMembers[team.id] = generateMockMembers(team)
    })
    setTeamMembers(mockMembers)
  }, [teams])

  const loadTeams = async () => {
    if (!currentOrganization) return
    
    const orgTeams = enterpriseConfig.getOrganizationTeams(currentOrganization.id)
    setTeams(orgTeams)
    
    // Create sample teams if none exist
    if (orgTeams.length === 0) {
      const sampleTeams = [
        {
          name: 'Frontend Team',
          description: 'React and UI development',
          leaderId: currentUser?.id || 'user-123'
        },
        {
          name: 'Backend Team',
          description: 'API and infrastructure development',
          leaderId: currentUser?.id || 'user-123'
        }
      ]

      for (const teamData of sampleTeams) {
        const team = await enterpriseConfig.createTeam({
          organizationId: currentOrganization.id,
          ...teamData,
          memberIds: [],
          settings: formData.settings,
          quotas: formData.quotas
        })
        orgTeams.push(team)
      }
      
      setTeams(orgTeams)
    }
  }

  const generateMockMembers = (team: Team): TeamMember[] => {
    const names = ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Emma Brown']
    const roles = ['Senior Developer', 'Developer', 'Junior Developer', 'Designer', 'DevOps Engineer']
    
    return names.slice(0, Math.min(5, team.memberIds.length + 1)).map((name, index) => ({
      id: index === 0 ? team.leaderId : team.memberIds[index - 1] || `member-${index}`,
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@company.com`,
      role: index === 0 ? 'Team Lead' : roles[index % roles.length],
      joinedAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000) // Random date within 6 months
    }))
  }

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateTeam = async () => {
    if (!currentOrganization || !formData.name) return

    try {
      const newTeam = await enterpriseConfig.createTeam({
        organizationId: currentOrganization.id,
        name: formData.name,
        description: formData.description,
        leaderId: currentUser?.id || 'user-123',
        memberIds: [],
        settings: formData.settings,
        quotas: formData.quotas
      })

      setTeams([...teams, newTeam])
      setShowCreateForm(false)
      resetForm()
    } catch (error) {
      console.error('Failed to create team:', error)
    }
  }

  const handleUpdateTeam = async () => {
    if (!editingTeam || !formData.name) return

    try {
      const updatedTeam = await enterpriseConfig.updateTeam(editingTeam.id, {
        name: formData.name,
        description: formData.description,
        settings: formData.settings,
        quotas: formData.quotas
      })

      setTeams(teams.map(t => t.id === updatedTeam.id ? updatedTeam : t))
      setEditingTeam(null)
      resetForm()
    } catch (error) {
      console.error('Failed to update team:', error)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? All team data will be lost.')) {
      return
    }

    try {
      // In real implementation, would call API to delete team
      setTeams(teams.filter(t => t.id !== teamId))
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null)
      }
    } catch (error) {
      console.error('Failed to delete team:', error)
    }
  }

  const handleAddMember = async (teamId: string, userId: string) => {
    const team = teams.find(t => t.id === teamId)
    if (!team) return

    try {
      const updatedTeam = await enterpriseConfig.updateTeam(teamId, {
        memberIds: [...team.memberIds, userId]
      })
      setTeams(teams.map(t => t.id === updatedTeam.id ? updatedTeam : t))
    } catch (error) {
      console.error('Failed to add member:', error)
    }
  }

  const handleRemoveMember = async (teamId: string, userId: string) => {
    const team = teams.find(t => t.id === teamId)
    if (!team) return

    try {
      const updatedTeam = await enterpriseConfig.updateTeam(teamId, {
        memberIds: team.memberIds.filter(id => id !== userId)
      })
      setTeams(teams.map(t => t.id === updatedTeam.id ? updatedTeam : t))
    } catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      settings: {
        visibility: 'organization',
        allowMemberInvites: true,
        requireApproval: false,
        constructSharing: 'read',
        defaultConstructAccess: 'team'
      },
      quotas: {
        maxMembers: 10,
        maxConstructs: 50,
        maxStorageGB: 10,
        maxComputeHours: 100,
        maxApiCalls: 10000
      }
    })
  }

  const startEditingTeam = (team: Team) => {
    setEditingTeam(team)
    setFormData({
      name: team.name,
      description: team.description || '',
      settings: team.settings,
      quotas: team.quotas
    })
  }

  const getQuotaUsagePercentage = (used: number, max: number): number => {
    if (max === -1) return 0 // Unlimited
    return Math.round((used / max) * 100)
  }

  if (!currentOrganization) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Organization Selected</h2>
          <p className="text-gray-600">Please select an organization to manage teams.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">
            Organize your {currentOrganization.name} workforce into collaborative teams
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Team
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search teams by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams List */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Teams ({filteredTeams.length})</h2>
          <div className="space-y-3">
            {filteredTeams.map((team) => {
              const members = teamMembers[team.id] || []
              const usage = {
                members: getQuotaUsagePercentage(members.length, team.quotas.maxMembers),
                constructs: getQuotaUsagePercentage(15, team.quotas.maxConstructs), // Mock data
                storage: getQuotaUsagePercentage(3.2, team.quotas.maxStorageGB) // Mock data
              }

              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 bg-white rounded-lg border cursor-pointer transition-all ${
                    selectedTeam?.id === team.id
                      ? 'border-blue-500 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTeam(team)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{team.name}</h3>
                      {team.description && (
                        <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditingTeam(team)
                        }}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTeam(team.id)
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Members</span>
                      <span className="font-medium">
                        {members.length} / {team.quotas.maxMembers}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          usage.members > 90 ? 'bg-red-500' : usage.members > 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${usage.members}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      <span>{usage.constructs}% constructs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      <span>{usage.storage}% storage</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {filteredTeams.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  {searchQuery ? 'No teams found matching your search' : 'No teams created yet'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Team Details */}
        <div className="lg:col-span-2">
          {selectedTeam ? (
            <TeamDetails
              team={selectedTeam}
              members={teamMembers[selectedTeam.id] || []}
              onAddMember={(userId) => handleAddMember(selectedTeam.id, userId)}
              onRemoveMember={(userId) => handleRemoveMember(selectedTeam.id, userId)}
              onEdit={() => startEditingTeam(selectedTeam)}
            />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12">
              <div className="text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a team to view details
                </h3>
                <p className="text-gray-600">
                  Choose a team from the list to manage members and settings
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Team Modal */}
      <AnimatePresence>
        {(showCreateForm || editingTeam) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowCreateForm(false)
              setEditingTeam(null)
              resetForm()
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">
                    {editingTeam ? 'Edit Team' : 'Create New Team'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingTeam(null)
                      resetForm()
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Team Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Frontend Team"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Brief description of the team's purpose and responsibilities"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Team Settings */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Team Settings</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Team Visibility
                          </label>
                          <select
                            value={formData.settings.visibility}
                            onChange={(e) => setFormData({
                              ...formData,
                              settings: { ...formData.settings, visibility: e.target.value as any }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="private">Private</option>
                            <option value="organization">Organization</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Construct Sharing
                          </label>
                          <select
                            value={formData.settings.constructSharing}
                            onChange={(e) => setFormData({
                              ...formData,
                              settings: { ...formData.settings, constructSharing: e.target.value as any }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="none">No Sharing</option>
                            <option value="read">Read Only</option>
                            <option value="write">Read & Write</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.settings.allowMemberInvites}
                            onChange={(e) => setFormData({
                              ...formData,
                              settings: { ...formData.settings, allowMemberInvites: e.target.checked }
                            })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium">Allow members to invite others</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.settings.requireApproval}
                            onChange={(e) => setFormData({
                              ...formData,
                              settings: { ...formData.settings, requireApproval: e.target.checked }
                            })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium">Require approval for new members</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Resource Quotas */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Resource Quotas</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Members
                        </label>
                        <input
                          type="number"
                          value={formData.quotas.maxMembers}
                          onChange={(e) => setFormData({
                            ...formData,
                            quotas: { ...formData.quotas, maxMembers: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Constructs
                        </label>
                        <input
                          type="number"
                          value={formData.quotas.maxConstructs}
                          onChange={(e) => setFormData({
                            ...formData,
                            quotas: { ...formData.quotas, maxConstructs: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Storage (GB)
                        </label>
                        <input
                          type="number"
                          value={formData.quotas.maxStorageGB}
                          onChange={(e) => setFormData({
                            ...formData,
                            quotas: { ...formData.quotas, maxStorageGB: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Compute Hours
                        </label>
                        <input
                          type="number"
                          value={formData.quotas.maxComputeHours}
                          onChange={(e) => setFormData({
                            ...formData,
                            quotas: { ...formData.quotas, maxComputeHours: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          API Calls/Month
                        </label>
                        <input
                          type="number"
                          value={formData.quotas.maxApiCalls}
                          onChange={(e) => setFormData({
                            ...formData,
                            quotas: { ...formData.quotas, maxApiCalls: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                  <button
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingTeam(null)
                      resetForm()
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingTeam ? handleUpdateTeam : handleCreateTeam}
                    disabled={!formData.name}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50"
                  >
                    {editingTeam ? 'Update Team' : 'Create Team'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Team Details Component
const TeamDetails: React.FC<{
  team: Team
  members: TeamMember[]
  onAddMember: (userId: string) => void
  onRemoveMember: (userId: string) => void
  onEdit: () => void
}> = ({ team, members, onAddMember, onRemoveMember, onEdit }) => {
  const [showAddMember, setShowAddMember] = useState(false)
  const [searchMember, setSearchMember] = useState('')

  // Mock available users to add
  const availableUsers = [
    { id: 'user-456', name: 'Frank Miller', email: 'frank.miller@company.com' },
    { id: 'user-789', name: 'Grace Lee', email: 'grace.lee@company.com' },
    { id: 'user-012', name: 'Henry Chen', email: 'henry.chen@company.com' }
  ].filter(user => !members.find(m => m.id === user.id))

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchMember.toLowerCase()) ||
    user.email.toLowerCase().includes(searchMember.toLowerCase())
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{team.name}</h2>
            {team.description && (
              <p className="text-gray-600 mt-1">{team.description}</p>
            )}
          </div>
          <button
            onClick={onEdit}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Members</span>
            </div>
            <p className="text-xl font-semibold">
              {members.length} / {team.quotas.maxMembers}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Package className="w-4 h-4" />
              <span className="text-sm">Constructs</span>
            </div>
            <p className="text-xl font-semibold">
              15 / {team.quotas.maxConstructs}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Database className="w-4 h-4" />
              <span className="text-sm">Storage</span>
            </div>
            <p className="text-xl font-semibold">
              3.2 / {team.quotas.maxStorageGB} GB
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Access</span>
            </div>
            <p className="text-xl font-semibold capitalize">
              {team.settings.constructSharing}
            </p>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Team Members</h3>
          <button
            onClick={() => setShowAddMember(true)}
            className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        </div>

        <div className="space-y-3">
          {members.map((member) => {
            const isLead = member.id === team.leaderId
            
            return (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{member.name}</h4>
                      {isLead && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Team Lead
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{member.role}</p>
                    <p className="text-xs text-gray-600">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!isLead && (
                    <button
                      onClick={() => onRemoveMember(member.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Add Team Member</h3>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-gray-600 py-4">
                  No available users found
                </p>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      onAddMember(user.id)
                      setShowAddMember(false)
                      setSearchMember('')
                    }}
                    className="w-full p-3 text-left hover:bg-gray-50 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddMember(false)
                  setSearchMember('')
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}